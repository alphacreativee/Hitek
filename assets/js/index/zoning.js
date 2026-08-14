"use strict";

function initZoningCardSlider() {
  window.initVillaCardSwipers?.(document);
}

function zoningMapCanvas(zoningEl) {
  const canvasLayer = zoningEl.querySelector("[data-zoning-map-canvas]");
  const birdsLayer = zoningEl.querySelector("[data-zoning-map-birds]");
  if (!canvasLayer) return;
  const mapImage =
    canvasLayer.dataset.image || "./assets/images/zoning-map.webp";

  const loadThree = () => {
    if (window.THREE) return Promise.resolve(window.THREE);

    return import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  };

  const CLOUD_NOISE_GLSL = `
    float hash21p(vec2 p, float period) {
      p = mod(p, period);
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float vnoisep(vec2 p, float period) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21p(i, period);
      float b = hash21p(i + vec2(1.0, 0.0), period);
      float c = hash21p(i + vec2(0.0, 1.0), period);
      float d = hash21p(i + vec2(1.0, 1.0), period);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbmp(vec2 p, float period) {
      float sum = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 7; i++) {
        sum += amp * vnoisep(p, period);
        p *= 2.0;
        period *= 2.0;
        amp *= 0.5;
      }
      return sum;
    }

    float cloudDensityP(vec2 p, float period) {
      vec2 warp = vec2(
        fbmp(p * 0.5, period * 0.5),
        fbmp(p * 0.5 + 4.7, period * 0.5)
      );
      return fbmp(p + warp * 1.7, period);
    }
  `;

  const bakeCloudField = (THREE, renderer) => {
    const size = 1024;
    const period = 16;
    const target = new THREE.WebGLRenderTarget(size, size, {
      type: renderer.capabilities.isWebGL2
        ? THREE.HalfFloatType
        : THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      depthBuffer: false,
      stencilBuffer: false
    });

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uPeriod;
        ${CLOUD_NOISE_GLSL}
        void main() {
          float d = cloudDensityP(vUv * uPeriod, uPeriod);
          gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
        }
      `,
      uniforms: {
        uPeriod: { value: period }
      },
      depthTest: false,
      depthWrite: false
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2)
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;

    const bakeScene = new THREE.Scene();
    bakeScene.add(mesh);
    const bakeCamera = new THREE.Camera();
    const previousTarget = renderer.getRenderTarget();

    renderer.setRenderTarget(target);
    renderer.render(bakeScene, bakeCamera);
    renderer.setRenderTarget(previousTarget);

    geometry.dispose();
    material.dispose();

    target.texture.userData.period = period;
    target.texture.userData.target = target;
    return target.texture;
  };

  const createBirdLayer = (THREE, scene, width, height) => {
    const config = {
      maxBirds: 28,
      maxFlocks: 2,
      flockSize: [4, 7],
      gap: [8, 18],
      firstGap: 0,
      speed: [220, 320],
      spread: 0.16,
      rank: 22,
      jitter: 5,
      scale: [16.5, 25.5],
      flap: [7.5, 11.5],
      bob: 10,
      color: new THREE.Color("#ffffff"),
      opacity: 1,
      shadowColor: new THREE.Color("#173936"),
      shadowOpacity: 0.16
    };
    const birdParts = [
      [
        138.8, 122.1, 121.87, 126.64, 79.55, 114.85, 17.28, 158.38, 45.69,
        158.38, 78.04, 144.47, 138.8, 158.38
      ],
      [
        160.34, 122.1, 177.27, 126.64, 219.59, 114.85, 281.86, 158.38, 253.45,
        158.38, 221.1, 144.47, 160.34, 158.38
      ],
      [
        160.34, 122.1, 149.57, 117.05, 138.8, 122.1, 138.8, 158.38, 144.19,
        171.58, 141.5, 199.85, 149.57, 199.85, 157.64, 199.85, 154.96, 171.58,
        160.34, 158.38
      ],
      [
        155.93, 110.52, 149.57, 99.84, 143.22, 110.52, 138.8, 122.1, 149.57,
        119.79, 160.34, 122.1, 155.93, 110.52
      ]
    ];
    const rand = (min, max) => min + Math.random() * (max - min);
    const randInt = (min, max) => Math.floor(rand(min, max + 1));

    const buildBirdGeometry = () => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      birdParts.forEach((points) => {
        for (let index = 0; index < points.length; index += 2) {
          minX = Math.min(minX, points[index]);
          maxX = Math.max(maxX, points[index]);
          minY = Math.min(minY, points[index + 1]);
          maxY = Math.max(maxY, points[index + 1]);
        }
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const shapeScale = 3 / (maxX - minX);
      const positions = [];

      birdParts.forEach((points) => {
        const contour = [];
        for (let index = 0; index < points.length; index += 2) {
          contour.push(new THREE.Vector2(points[index], points[index + 1]));
        }
        if (contour[0].distanceTo(contour[contour.length - 1]) < 1e-6) {
          contour.pop();
        }

        THREE.ShapeUtils.triangulateShape(contour, []).forEach((face) => {
          face.forEach((pointIndex) => {
            const point = contour[pointIndex];
            positions.push(
              (point.x - centerX) * shapeScale,
              0,
              (centerY - point.y) * shapeScale
            );
          });
        });
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      return geometry;
    };

    const geometry = buildBirdGeometry();

    const phases = new Float32Array(config.maxBirds);
    const flapSpeeds = new Float32Array(config.maxBirds);
    for (let index = 0; index < config.maxBirds; index += 1) {
      phases[index] = Math.random() * Math.PI * 2;
      flapSpeeds[index] = rand(config.flap[0], config.flap[1]);
    }
    geometry.setAttribute(
      "aPhase",
      new THREE.InstancedBufferAttribute(phases, 1)
    );
    geometry.setAttribute(
      "aFlapSpeed",
      new THREE.InstancedBufferAttribute(flapSpeeds, 1)
    );

    const timeUniform = { value: 0 };
    const birdVertexShader = `
        attribute float aPhase;
        attribute float aFlapSpeed;
        uniform float uTime;

        void main() {
          vec3 p = position;
          float flap = sin(uTime * aFlapSpeed + aPhase);
          float span = abs(p.x);
          p.y += flap * pow(span, 1.3) * 0.5;
          p.x *= 1.0 - abs(flap) * 0.12;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        }
      `;
    const birdFragmentShader = `
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          gl_FragColor = vec4(uColor, uOpacity);
        }
      `;
    const createBirdMaterial = (color, opacity) =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: timeUniform,
          uColor: { value: color },
          uOpacity: { value: opacity }
        },
        vertexShader: birdVertexShader,
        fragmentShader: birdFragmentShader
      });

    const shadowMaterial = createBirdMaterial(
      config.shadowColor,
      config.shadowOpacity
    );
    const material = createBirdMaterial(config.color, config.opacity);

    const shadowMesh = new THREE.InstancedMesh(
      geometry,
      shadowMaterial,
      config.maxBirds
    );
    shadowMesh.frustumCulled = false;
    shadowMesh.renderOrder = 29;
    shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(shadowMesh);

    const mesh = new THREE.InstancedMesh(geometry, material, config.maxBirds);
    mesh.frustumCulled = false;
    mesh.renderOrder = 30;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    const makeFlock = () => {
      const side = Math.floor(Math.random() * 4);
      const margin = 220;
      const startPoints = [
        new THREE.Vector3(
          -width / 2 - margin,
          rand(-height * 0.28, height * 0.24),
          0.45
        ),
        new THREE.Vector3(
          width / 2 + margin,
          rand(-height * 0.28, height * 0.24),
          0.45
        ),
        new THREE.Vector3(
          rand(-width * 0.38, width * 0.38),
          height / 2 + margin,
          0.45
        ),
        new THREE.Vector3(
          rand(-width * 0.38, width * 0.38),
          -height / 2 - margin,
          0.45
        )
      ];
      const endPoints = [
        new THREE.Vector3(
          width / 2 + margin,
          rand(-height * 0.28, height * 0.24),
          0.45
        ),
        new THREE.Vector3(
          -width / 2 - margin,
          rand(-height * 0.28, height * 0.24),
          0.45
        ),
        new THREE.Vector3(
          rand(-width * 0.38, width * 0.38),
          -height / 2 - margin,
          0.45
        ),
        new THREE.Vector3(
          rand(-width * 0.38, width * 0.38),
          height / 2 + margin,
          0.45
        )
      ];
      const start = startPoints[side];
      const end = endPoints[side];
      const tangent = new THREE.Vector3().subVectors(end, start).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
      const points = [];
      const steps = 5;

      for (let index = 0; index <= steps; index += 1) {
        const k = index / steps;
        const point = new THREE.Vector3().lerpVectors(start, end, k);
        point.addScaledVector(normal, Math.sin(k * Math.PI) * rand(-420, 420));
        point.x += rand(-70, 70);
        point.y += rand(-70, 70);
        points.push(point);
      }

      const curve = new THREE.CatmullRomCurve3(
        points,
        false,
        "catmullrom",
        0.5
      );
      const length = curve.getLength();
      const count = randInt(config.flockSize[0], config.flockSize[1]);
      const birds = [];

      for (let index = 0; index < count; index += 1) {
        const rank = Math.ceil(index / 2);
        const wing = index === 0 ? 0 : index % 2 === 0 ? 1 : -1;
        birds.push({
          offset:
            (rank / Math.max(count / 2, 1)) * config.spread +
            rand(-0.004, 0.004),
          lateral:
            wing * rank * config.rank + rand(-config.jitter, config.jitter),
          vertical: rand(-config.jitter, config.jitter) * 0.45,
          bobPhase: Math.random() * Math.PI * 2,
          scale: rand(config.scale[0], config.scale[1])
        });
      }

      return {
        birds,
        curve,
        maxOffset: birds.reduce((max, bird) => Math.max(max, bird.offset), 0),
        t: 0,
        tSpeed: rand(config.speed[0], config.speed[1]) / length
      };
    };

    const flocks = [];
    let spawnTimer = config.firstGap;
    let time = 0;
    const position = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    const bankedUp = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
    const shadowMatrix = new THREE.Matrix4();
    const shadowPosition = new THREE.Vector3();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);

    const update = (delta) => {
      time += delta;
      timeUniform.value = time;
      spawnTimer -= delta;

      if (spawnTimer <= 0) {
        if (flocks.length < config.maxFlocks) {
          flocks.push(makeFlock());
        }
        spawnTimer = rand(config.gap[0], config.gap[1]);
      }

      let slot = 0;
      for (
        let flockIndex = flocks.length - 1;
        flockIndex >= 0;
        flockIndex -= 1
      ) {
        const flock = flocks[flockIndex];
        flock.t += flock.tSpeed * delta;

        if (flock.t - flock.maxOffset > 1) {
          flocks.splice(flockIndex, 1);
          continue;
        }

        flock.birds.forEach((bird) => {
          const t = flock.t - bird.offset;
          if (t < 0 || t > 1 || slot >= config.maxBirds) return;

          flock.curve.getPointAt(t, position);
          flock.curve.getTangentAt(t, tangent);
          right.set(-tangent.y, tangent.x, 0).normalize();
          flock.curve.getTangentAt(Math.min(t + 0.012, 1), ahead);

          const turn = right.dot(ahead);
          const roll = THREE.MathUtils.clamp(-turn * 7, -0.58, 0.58);
          quaternion.setFromAxisAngle(tangent, roll);
          right.applyQuaternion(quaternion);
          bankedUp.copy(up).applyQuaternion(quaternion);

          position.addScaledVector(right, bird.lateral);
          position.addScaledVector(
            bankedUp,
            bird.vertical * 0.01 +
              Math.sin(time * 1.15 + bird.bobPhase) * config.bob * 0.01
          );

          matrix.makeBasis(right, bankedUp, tangent);
          scale.setScalar(bird.scale);
          matrix.scale(scale);
          matrix.setPosition(position);

          shadowPosition
            .copy(position)
            .addScaledVector(right, bird.scale * 0.08)
            .addScaledVector(tangent, -bird.scale * 0.05);
          shadowMatrix.copy(matrix);
          shadowMatrix.setPosition(shadowPosition);
          shadowMesh.setMatrixAt(slot, shadowMatrix);
          mesh.setMatrixAt(slot, matrix);
          slot += 1;
        });
      }
      for (let index = slot; index < config.maxBirds; index += 1) {
        mesh.setMatrixAt(index, hidden);
        shadowMesh.setMatrixAt(index, hidden);
      }
      mesh.instanceMatrix.needsUpdate = true;
      shadowMesh.instanceMatrix.needsUpdate = true;
    };

    const dispose = () => {
      scene.remove(shadowMesh);
      scene.remove(mesh);
      geometry.dispose();
      shadowMaterial.dispose();
      material.dispose();
    };

    return { dispose, update };
  };

  const initScene = (THREE) => {
    if (!THREE) return;

    canvasLayer.innerHTML = "";
    if (birdsLayer) {
      birdsLayer.innerHTML = "";
    }
    const width = 5276;
    const height = 2944;
    const scene = new THREE.Scene();
    const birdScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      -1000,
      1000
    );
    camera.position.z = 5;
    const birdCamera = camera.clone();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasLayer.appendChild(renderer.domElement);
    const birdRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    birdRenderer.setClearColor(0x000000, 0);
    birdRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    (birdsLayer || canvasLayer).appendChild(birdRenderer.domElement);

    const addTexturedPlane = (
      texture,
      x,
      y,
      planeWidth,
      planeHeight,
      opacity = 1
    ) => {
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: opacity < 1,
        opacity,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      scene.add(mesh);
      return mesh;
    };

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(mapImage, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const mapMesh = addTexturedPlane(texture, 0, 0, width, height);
      mapMesh.renderOrder = 0;
      renderer.render(scene, camera);
    });

    const cloudField = bakeCloudField(THREE, renderer);
    const cloudGeometry = new THREE.PlaneGeometry(width, height);
    const cloudLayers = [
      {
        scale: 1 / 520,
        cover: 0.54,
        sharp: 0.15,
        opacity: 0.46,
        speed: 16,
        dir: [1, 0.22],
        offset: [1.2, 3.6]
      },
      {
        scale: 1 / 820,
        cover: 0.58,
        sharp: 0.13,
        opacity: 0.34,
        speed: 11,
        dir: [0.94, -0.34],
        offset: [9.4, -4.2]
      },
      {
        scale: 1 / 1180,
        cover: 0.62,
        sharp: 0.11,
        opacity: 0.24,
        speed: 7,
        dir: [0.88, 0.48],
        offset: [-6.8, 6.1]
      }
    ];
    const clouds = cloudLayers.map((cloud, index) => {
      const direction = new THREE.Vector2(
        cloud.dir[0],
        cloud.dir[1]
      ).normalize();
      const uniforms = {
        uField: { value: cloudField },
        uPeriod: { value: cloudField.userData.period },
        uMapSize: { value: new THREE.Vector2(width, height) },
        uOffset: { value: new THREE.Vector2(cloud.offset[0], cloud.offset[1]) },
        uScale: { value: cloud.scale },
        uCover: { value: cloud.cover },
        uSharp: { value: cloud.sharp },
        uOpacity: { value: cloud.opacity },
        uBody: { value: new THREE.Color("#ffffff") },
        uUnderside: { value: new THREE.Color("#b8c7c0") }
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D uField;
          uniform float uPeriod;
          uniform vec2 uMapSize;
          uniform vec2 uOffset;
          uniform float uScale;
          uniform float uCover;
          uniform float uSharp;
          uniform float uOpacity;
          uniform vec3 uBody;
          uniform vec3 uUnderside;

          void main() {
            vec2 centeredUv = vUv - 0.5;
            vec2 p = centeredUv * uMapSize * uScale + uOffset;
            float d = texture2D(uField, p / uPeriod).r;
            float alpha = smoothstep(uCover, uCover + uSharp, d);
            if (alpha < 0.004) discard;

            float lit = smoothstep(uCover, uCover + uSharp * 2.4, d);
            vec3 color = mix(uUnderside, uBody, lit);
            float edgeFade = smoothstep(0.0, 0.12, vUv.y) *
              (1.0 - smoothstep(0.9, 1.0, vUv.y));
            vec2 villaClearUv = vec2(centeredUv.x * 1.25, centeredUv.y * 1.85);
            float villaClear = smoothstep(0.19, 0.34, length(villaClearUv));
            gl_FragColor = vec4(color, alpha * uOpacity * edgeFade * villaClear);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(cloudGeometry, material);
      mesh.position.z = 0.14 + index * 0.02;
      mesh.renderOrder = 10 + index;
      scene.add(mesh);

      return {
        direction,
        material,
        mesh,
        speed: cloud.speed,
        scale: cloud.scale,
        uniforms
      };
    });
    const birdLayer = createBirdLayer(THREE, birdScene, width, height);
    birdLayer.update(0);

    const resize = () => {
      const rect = canvasLayer.getBoundingClientRect();
      const birdRect = (birdsLayer || canvasLayer).getBoundingClientRect();
      renderer.setSize(
        Math.max(1, rect.width),
        Math.max(1, rect.height),
        false
      );
      birdRenderer.setSize(
        Math.max(1, birdRect.width),
        Math.max(1, birdRect.height),
        false
      );
      camera.updateProjectionMatrix();
      birdCamera.updateProjectionMatrix();
      renderer.render(scene, camera);
      birdRenderer.render(birdScene, birdCamera);
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let previousTime = performance.now();
    let frameId = 0;
    const animate = (time) => {
      const delta = Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;

      if (!reducedMotion) {
        clouds.forEach((cloud) => {
          const step = cloud.speed * cloud.scale * delta;
          cloud.uniforms.uOffset.value.x -= cloud.direction.x * step;
          cloud.uniforms.uOffset.value.y -= cloud.direction.y * step;
          cloud.uniforms.uOffset.value.x %= cloudField.userData.period;
          cloud.uniforms.uOffset.value.y %= cloudField.userData.period;
        });
        birdLayer.update(delta);
      }

      renderer.render(scene, camera);
      birdRenderer.render(birdScene, birdCamera);
      frameId = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasLayer);
    resize();
    frameId = window.requestAnimationFrame(animate);

    window.addEventListener("pagehide", () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      clouds.forEach((cloud) => {
        scene.remove(cloud.mesh);
        cloud.material.dispose();
      });
      birdLayer.dispose();
      cloudGeometry.dispose();
      cloudField.userData.target?.dispose();
      cloudField.dispose();
      renderer.dispose();
      birdRenderer.dispose();
    });
  };

  loadThree()
    .then(initScene)
    .catch((error) => {
      console.warn("Could not initialize zoning map canvas", error);
    });
}

function zoningFilter(zoningEl) {
  const filter = zoningEl.querySelector("[data-zoning-filter]");
  const overlay = zoningEl.querySelector("[data-zoning-map-overlay]");
  const labels = zoningEl.querySelector("[data-zoning-map-labels]");
  const filterScroll = zoningEl.querySelector(".zoning-filter-scroll");
  const filterScrollbar = zoningEl.querySelector(".zoning-filter-scrollbar");
  const filterToggles = zoningEl.querySelectorAll(
    "[data-zoning-filter-toggle]"
  );

  let filterTimer = null;
  let villaDataById = new Map();

  const filterFields = ["villa", "bedroom", "floor_area", "view", "direction"];

  const activeFilters = filterFields.reduce((filters, field) => {
    filters[field] = field === "direction" ? "" : "all";
    return filters;
  }, {});

  const isAllFilterValue = (value) => value === "all" || value === "";

  /**
   * Chuẩn hóa giá trị để so sánh giữa:
   * - data-filter-value trong HTML
   * - dữ liệu villa từ JSON
   *
   * Ví dụ:
   * "Golf Course" => "golf_course"
   * "Beach & Lagoon" => "beach_and_lagoon"
   */
  const normalizeFilterValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const getComparableValue = (value) => normalizeFilterValue(value);

  const getActiveButtonValue = (button) =>
    getComparableValue(button.dataset.filterValue || button.value || "all") ||
    "all";

  /**
   * Đồng bộ class active của các button HTML
   * với trạng thái trong activeFilters.
   */
  const updateFilterButtons = () => {
    if (!filter) return;

    filter.querySelectorAll("[data-filter-group]").forEach((group) => {
      const field = group.dataset.filterGroup;

      if (!filterFields.includes(field)) return;

      group
        .querySelectorAll(".zoning-filter-options button")
        .forEach((button) => {
          const buttonValue = getActiveButtonValue(button);
          const isDirectionReset =
            field === "direction" && buttonValue === "all";

          button.classList.toggle(
            "active",
            !isDirectionReset && buttonValue === activeFilters[field]
          );
        });
    });
  };

  /**
   * Gán giá trị filter.
   */
  const setFilterValue = (field, value, options = {}) => {
    if (!filterFields.includes(field)) return;

    const nextValue = getComparableValue(value || "all") || "all";

    if (options.resetOthers) {
      filterFields.forEach((filterField) => {
        activeFilters[filterField] = filterField === "direction" ? "" : "all";
      });
    }

    activeFilters[field] =
      field === "direction" && nextValue === "all" ? "" : nextValue;

    const shouldReturnToSector = Object.values(activeFilters).every(
      (filterValue) => isAllFilterValue(filterValue)
    );

    if (shouldReturnToSector) {
      zoningEl.classList.add("is-sector-mode");
      zoningEl.classList.remove("is-detail-mode", "is-card-open");
      overlay?.querySelectorAll("path.is-selected").forEach((path) => {
        path.classList.remove("is-selected");
        labels
          ?.querySelectorAll(`span[data-id="${path.dataset.id}"]`)
          .forEach((label) => label.classList.remove("is-selected"));
      });
    } else if (zoningEl.classList.contains("is-sector-mode")) {
      zoningEl.classList.remove("is-sector-mode");
      zoningEl.classList.add("is-detail-mode");
      zoningEl.classList.remove("is-card-open");
    }

    updateFilterButtons();

    if (options.apply !== false) {
      applyZoningFilters();
    }
  };

  /**
   * Kiểm tra một villa có khớp các filter hiện tại không.
   */
  const villaMatchesFilters = (villaId) => {
    const villa = villaDataById.get(String(villaId || ""));

    if (!villa) {
      return Object.values(activeFilters).every(isAllFilterValue);
    }

    return filterFields.every((field) => {
      const activeValue = activeFilters[field];

      if (isAllFilterValue(activeValue)) return true;

      return getComparableValue(villa[field]) === activeValue;
    });
  };

  /**
   * Ẩn/hiện path và label theo filter.
   */
  const applyZoningFilters = () => {
    if (!overlay) return;

    overlay.querySelectorAll("path[data-id]").forEach((path) => {
      const isVisible = villaMatchesFilters(path.dataset.id);

      const pathLabels = labels
        ? [...labels.querySelectorAll("span[data-id]")].filter(
            (label) => label.dataset.id === path.dataset.id
          )
        : [];

      path.classList.toggle("is-filter-hidden", !isVisible);
      path.setAttribute("aria-hidden", String(!isVisible));
      path.setAttribute("tabindex", isVisible ? "0" : "-1");

      pathLabels.forEach((label) => {
        label.classList.toggle("is-filter-hidden", !isVisible);
        label.setAttribute("aria-hidden", String(!isVisible));
      });

      if (!isVisible && path.classList.contains("is-selected")) {
        path.classList.remove("is-selected");
        pathLabels.forEach((label) => label.classList.remove("is-selected"));
        zoningEl.classList.remove("is-card-open");
      }
    });
  };

  /**
   * Bind sự kiện cho các button đã viết sẵn trong HTML.
   */
  const bindFilterButtons = () => {
    if (!filter) return;

    filter.querySelectorAll("[data-filter-group]").forEach((group) => {
      const field = group.dataset.filterGroup;

      if (!filterFields.includes(field)) return;

      group
        .querySelectorAll(".zoning-filter-options button")
        .forEach((button) => {
          button.addEventListener("click", () => {
            setFilterValue(field, getActiveButtonValue(button));
          });
        });
    });
  };

  const updateFilterScrollbar = () => {
    if (!filterScroll || !filterScrollbar) return;

    const maxScroll = filterScroll.scrollHeight - filterScroll.clientHeight;
    const hasScroll = maxScroll > 1;

    filterScrollbar.classList.toggle("is-hidden", !hasScroll);

    if (!hasScroll) {
      filterScrollbar.style.setProperty("--zoning-filter-scrollbar-height", "0px");
      filterScrollbar.style.setProperty("--zoning-filter-scrollbar-y", "0px");
      return;
    }

    const trackHeight = filterScroll.clientHeight;
    const thumbHeight = Math.max(
      24,
      Math.round((filterScroll.clientHeight / filterScroll.scrollHeight) * trackHeight)
    );
    const thumbY = Math.round(
      (filterScroll.scrollTop / maxScroll) * (trackHeight - thumbHeight)
    );

    filterScrollbar.style.setProperty(
      "--zoning-filter-scrollbar-height",
      `${thumbHeight}px`
    );
    filterScrollbar.style.setProperty(
      "--zoning-filter-scrollbar-y",
      `${thumbY}px`
    );
  };

  filterScroll?.addEventListener("scroll", updateFilterScrollbar, {
    passive: true,
  });
  window.addEventListener("resize", updateFilterScrollbar);

  const setFilterExpanded = (isExpanded) => {
    filterToggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(isExpanded));
    });
  };

  const clearFilterTimer = () => {
    if (!filterTimer) return;

    window.clearTimeout(filterTimer);
    filterTimer = null;
  };

  const collapseFilter = () => {
    clearFilterTimer();

    zoningEl.classList.remove("is-filter-expanding");
    zoningEl.classList.add("is-filter-collapsing");

    setFilterExpanded(false);

    filterTimer = window.setTimeout(() => {
      zoningEl.classList.add("is-filter-collapsed");
      zoningEl.classList.remove("is-filter-collapsing");

      filterTimer = null;
    }, 220);
  };

  const expandFilter = () => {
    clearFilterTimer();

    zoningEl.classList.remove("is-filter-collapsed", "is-filter-collapsing");

    zoningEl.classList.add("is-filter-expanding");

    setFilterExpanded(true);

    filterTimer = window.setTimeout(() => {
      zoningEl.classList.remove("is-filter-expanding");
      filterTimer = null;
    }, 380);
  };

  /**
   * Bind đóng/mở filter.
   */
  if (filterToggles.length) {
    setFilterExpanded(!zoningEl.classList.contains("is-filter-collapsed"));

    filterToggles.forEach((button) => {
      button.addEventListener("click", () => {
        if (zoningEl.classList.contains("is-filter-collapsed")) {
          expandFilter();
          return;
        }

        if (zoningEl.classList.contains("is-filter-expanding")) {
          return;
        }

        collapseFilter();
      });
    });
  }

  return {
    collapse: collapseFilter,

    expand: expandFilter,

    init(villas = []) {
      villaDataById = new Map(villas.map((villa) => [String(villa.id), villa]));

      bindFilterButtons();
      updateFilterButtons();
      applyZoningFilters();
      updateFilterScrollbar();
    },

    selectSector(sector) {
      setFilterValue("villa", sector, {
        resetOthers: true
      });

      expandFilter();
    }
  };
}

function zoningSectors(zoningEl, filterApi) {
  const sectorLayer = zoningEl.querySelector("[data-zoning-map-sector]");
  if (!sectorLayer) return;
  const sectorImage = sectorLayer.dataset.image;
  if (!sectorImage) {
    console.warn("Missing data-image for zoning sector SVG");
    return;
  }

  const normalizeSector = (value) =>
    String(value || "")
      .trim()
      .toUpperCase();

  const showSector = (sector, isHovered) => {
    sectorLayer
      .querySelectorAll(`path[data-villa="${sector}"]`)
      .forEach((path) => path.classList.toggle("is-hovered", isHovered));

    sectorLayer
      .querySelectorAll(".zoning-map-sector-labels span[data-villa]")
      .forEach((label) => {
        label.classList.toggle(
          "is-hovered",
          isHovered && label.dataset.villa === sector
        );
        label.classList.toggle(
          "is-hidden",
          isHovered && label.dataset.villa !== sector
        );
      });
  };

  const openSector = (sector) => {
    zoningEl.classList.remove("is-sector-mode");
    zoningEl.classList.add("is-detail-mode");
    zoningEl.classList.remove("is-card-open");
    filterApi?.selectSector(sector);
  };

  const createSectorLabels = (svg) => {
    const labels = document.createElement("div");
    labels.className = "zoning-map-sector-labels";
    const viewBox = svg.viewBox.baseVal;
    if (!viewBox.width || !viewBox.height) return labels;

    const createLabel = (sector, left, top, offsetX = 0, offsetY = 0) => {
      const label = document.createElement("span");
      label.dataset.villa = sector;
      label.textContent = `Villa ${sector}`;
      label.style.left = `${left}%`;
      label.style.top = `${top}%`;
      label.style.setProperty("--sector-label-offset-x", `${offsetX}px`);
      label.style.setProperty("--sector-label-offset-y", `${offsetY}px`);
      labels.appendChild(label);
    };

    const sectors = new Map();
    svg.querySelectorAll("path[data-villa]").forEach((path) => {
      const sector = normalizeSector(path.dataset.villa);
      if (!sector) return;

      const box = path.getBBox();
      if (sector === "D") {
        if (box.y < 650) {
          createLabel(sector, 37.5, 34.7);
        } else {
          createLabel(sector, 60.5, 53.2, 0, 20);
        }
        return;
      }

      if (sector === "F") {
        createLabel(
          sector,
          ((box.x + box.width / 2 - viewBox.x) / viewBox.width) * 100,
          ((box.y + box.height / 2 - viewBox.y) / viewBox.height) * 100
        );
        return;
      }

      const current = sectors.get(sector);
      if (!current) {
        sectors.set(sector, {
          x1: box.x,
          y1: box.y,
          x2: box.x + box.width,
          y2: box.y + box.height
        });
        return;
      }

      current.x1 = Math.min(current.x1, box.x);
      current.y1 = Math.min(current.y1, box.y);
      current.x2 = Math.max(current.x2, box.x + box.width);
      current.y2 = Math.max(current.y2, box.y + box.height);
    });

    sectors.forEach((box, sector) => {
      if (sector === "E") {
        createLabel(sector, 68.2, 31.8, -30, -5);
        return;
      }

      createLabel(
        sector,
        (((box.x1 + box.x2) / 2 - viewBox.x) / viewBox.width) * 100,
        (((box.y1 + box.y2) / 2 - viewBox.y) / viewBox.height) * 100
      );
    });

    return labels;
  };

  fetch(sectorImage)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load zoning sector SVG");
      return response.text();
    })
    .then((svgText) => {
      sectorLayer.innerHTML = svgText;
      const svg = sectorLayer.querySelector("svg");
      if (!svg) return;

      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      const defs =
        svg.querySelector("defs") ||
        svg.insertBefore(
          document.createElementNS("http://www.w3.org/2000/svg", "defs"),
          svg.firstChild
        );
      const strokeGradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      strokeGradient.setAttribute("id", "zoning-sector-stroke-gradient");
      strokeGradient.setAttribute("x1", "0%");
      strokeGradient.setAttribute("y1", "0%");
      strokeGradient.setAttribute("x2", "100%");
      strokeGradient.setAttribute("y2", "0%");
      strokeGradient.innerHTML = `
        <stop offset="0%" stop-color="#69BCB1" />
        <stop offset="51%" stop-color="#7AEAE5" />
        <stop offset="100%" stop-color="#69BCB1" stop-opacity="0.88" />
      `;
      defs.appendChild(strokeGradient);
      const outerGlow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
      );
      outerGlow.setAttribute("id", "zoning-sector-outer-glow");
      outerGlow.setAttribute("x", "-20%");
      outerGlow.setAttribute("y", "-20%");
      outerGlow.setAttribute("width", "140%");
      outerGlow.setAttribute("height", "140%");
      outerGlow.innerHTML = `
        <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="expanded" />
        <feComposite in="expanded" in2="SourceAlpha" operator="out" result="outer" />
        <feGaussianBlur in="outer" stdDeviation="4" result="blur" />
        <feFlood flood-color="#6d9695" flood-opacity="0.8" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      `;
      defs.appendChild(outerGlow);
      svg.querySelectorAll("path[data-villa]").forEach((path) => {
        const sector = normalizeSector(path.dataset.villa);
        if (!sector) return;

        if (path.dataset.color) {
          path.style.setProperty("--sector-color", path.dataset.color);
        }
        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-label", `Villa ${sector}`);

        path.addEventListener("mouseenter", () => showSector(sector, true));
        path.addEventListener("mouseleave", () => showSector(sector, false));
        path.addEventListener("click", (event) => {
          event.stopPropagation();
          openSector(sector);
        });
        path.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;

          event.preventDefault();
          openSector(sector);
        });
      });

      sectorLayer.appendChild(createSectorLabels(svg));
    })
    .catch((error) => {
      console.warn(error);
    });
}

function normalizeZoningVillaData(payload) {
  if (payload?.success === false) {
    throw new Error(payload?.data?.message || "Could not load zoning data");
  }

  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.villas)) return data.villas;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function fetchZoningVillaData(sourceEl) {
  const jsonUrl = sourceEl?.dataset.zoningJson || "";

  if (!jsonUrl) {
    return Promise.reject(new Error("Missing JSON URL for zoning villa data"));
  }

  return fetch(jsonUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load zoning data");
      return response.json();
    })
    .then(normalizeZoningVillaData);
}

function zoningLots(zoningEl, filterApi) {
  const overlay = zoningEl.querySelector("[data-zoning-map-overlay]");
  const labels = zoningEl.querySelector("[data-zoning-map-labels]");
  const card = zoningEl.querySelector("[data-zoning-card]");
  if (!overlay || !card) return;
  zoningEl.classList.remove("is-zoning-overlay-ready");
  const overlayImage = overlay.dataset.image;
  if (!overlayImage) {
    console.warn("Missing data-image for zoning map SVG");
    return;
  }

  const cardArea = card.querySelector("[data-zoning-card-area]");
  const cardTitle = card.querySelector("[data-zoning-card-title]");
  const cardTitleLink = card.querySelector("[data-zoning-card-title-link]");
  const cardMeta = card.querySelector(".zoning-card-meta");
  const cardDetail = card.querySelector("[data-zoning-card-detail]");
  const cardCompare = card.querySelector("[data-zoning-card-compare]");
  const cardSlider = card.querySelector("[slider-parallax]");
  const cardMetaTemplates = [...(cardMeta?.querySelectorAll("li") || [])].map(
    (item) => ({
      icon: item.querySelector("img")?.getAttribute("src") || "",
      label:
        [...(item.querySelector(".content")?.childNodes || [])]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent.trim())
          .find(Boolean) || "",
      className: item.className || ""
    })
  );
  const defaultGallery = [
    ...(cardSlider?.querySelectorAll(".swiper-slide img") || [])
  ]
    .map((image) => image.getAttribute("src"))
    .filter(Boolean);
  let selectedPath = null;
  let villaDataByName = new Map();
  let villaDataById = new Map();
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const getLotAreaKey = (title) =>
    String(title || "").match(/^[A-Z]/)?.[0] || "";
  const getLotUrl = (title) =>
    `./floor-plan.html?villa=${encodeURIComponent(title)}`;
  const getLotGallery = (data) => data.gallery || data.images || defaultGallery;
  const formatDirectionLabel = (value) =>
    String(value || "")
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const getCardMetaValues = (data) => [
    data.floor_area ? `${data.floor_area} sqm` : "",
    data.bedroom || "",
    data.view || "",
    data.floors || data.floor || 2,
    formatDirectionLabel(data.direction)
  ];
  const getPathLabels = (path) =>
    labels && path.dataset.id
      ? labels.querySelectorAll(`span[data-id="${path.dataset.id}"]`)
      : [];
  const getVillaByPath = (path) =>
    villaDataById.get(String(path?.dataset.id || ""));

  const selectLot = (path) => {
    const id = path.dataset.id;
    if (!id) return;
    const data = getVillaByPath(path) || {
      id: "",
      name: "",
      villa: "",
      bedroom: "",
      floor_area: "",
      view: "",
      detail_url: getLotUrl(id)
    };
    const lotTitle = data.name || id;

    if (selectedPath) {
      selectedPath.classList.remove("is-selected");
      getPathLabels(selectedPath).forEach((label) => {
        label.classList.remove("is-selected");
      });
    }
    selectedPath = path;
    selectedPath.classList.add("is-selected");
    getPathLabels(selectedPath).forEach((label) => {
      label.classList.add("is-selected");
    });

    if (cardArea)
      cardArea.textContent = data.villa ? `Area ${data.villa}` : "Area";
    if (cardTitle) cardTitle.textContent = lotTitle;
    if (cardMeta) {
      const cardMetaValues = getCardMetaValues(data);
      cardMeta.innerHTML = `
        ${cardMetaTemplates
          .map((item, index) => {
            const icon = item.icon
              ? `<img src="${escapeHtml(item.icon)}" alt="" />`
              : "";
            return `
              <li class="${escapeHtml(item.className)}">
                ${icon}
                <div class="content">
                  <span>${escapeHtml(cardMetaValues[index] || "")}</span>
                  ${escapeHtml(item.label)}
                </div>
              </li>
            `;
          })
          .join("")}
      `;
    }
    const detailUrl = data.detail_url || getLotUrl(lotTitle || id);
    if (cardTitleLink) cardTitleLink.href = detailUrl;
    if (cardDetail) cardDetail.href = detailUrl;
    if (cardCompare) cardCompare.dataset.id = data.id || "";
    updateCardGallery(getLotGallery(data));
    zoningEl.classList.add("is-card-open");
  };

  const updateCardGallery = (images) => {
    const wrapper = cardSlider?.querySelector(".swiper-wrapper");
    if (!cardSlider || !wrapper || !images?.length) return;

    if (cardSlider.swiper) {
      cardSlider.swiper.destroy(true, true);
    }

    wrapper.innerHTML = images
      .map(
        (src) => `
          <div class="swiper-slide">
            <div class="image">
              <img src="${src}" alt="" />
            </div>
          </div>
        `
      )
      .join("");

    window.initVillaCardSwiper?.(cardSlider);
  };

  const getPathPoints = (path) => {
    const pathData = path.dataset.originalD || path.getAttribute("d");
    const tokens = [...pathData.matchAll(/([MLHVQZ])|(-?\d+(?:\.\d+)?)/g)].map(
      (match) => match[0]
    );
    const points = [];
    let command = "";
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let index = 0;

    while (index < tokens.length) {
      if (/^[A-Z]$/.test(tokens[index])) {
        command = tokens[index];
        index += 1;
      }

      if (command === "M" || command === "L") {
        x = Number(tokens[index]);
        y = Number(tokens[index + 1]);
        index += 2;
        if (command === "M") {
          startX = x;
          startY = y;
          command = "L";
        }
        points.push({ x, y });
      } else if (command === "H") {
        x = Number(tokens[index]);
        index += 1;
        points.push({ x, y });
      } else if (command === "V") {
        y = Number(tokens[index]);
        index += 1;
        points.push({ x, y });
      } else if (command === "Q") {
        index += 2;
        x = Number(tokens[index]);
        y = Number(tokens[index + 1]);
        index += 2;
        points.push({ x, y });
      } else if (command === "Z") {
        points.push({ x: startX, y: startY });
        command = "";
      } else {
        break;
      }
    }

    return points;
  };

  const getPathLabelAngle = (path) => {
    if (!path) return 0;

    const points = getPathPoints(path);
    let longestEdge = { angle: 0, length: 0 };

    points.forEach((point, index) => {
      const nextPoint = points[index + 1];
      if (!nextPoint) return;

      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const length = Math.hypot(dx, dy);
      if (length <= longestEdge.length) return;

      longestEdge = {
        angle: Math.atan2(dy, dx) * (180 / Math.PI),
        length
      };
    });

    let angle = longestEdge.angle;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    return angle;
  };

  const isFHorizontalLabel = (title) => {
    const match = String(title || "").match(/^F[12]\.(\d+)$/);
    if (!match) return false;

    const index = Number(match[1]);
    return index >= 1 && index <= 26;
  };

  const createLotLabels = (svg) => {
    if (!labels) return;

    labels.innerHTML = "";
    const viewBox = svg.viewBox.baseVal;
    if (!viewBox.width || !viewBox.height) return;
    const getPathByVillaName = (name) => {
      const villa = villaDataByName.get(name);
      return villa ? svg.querySelector(`path[data-id="${villa.id}"]`) : null;
    };
    const referenceAngles = {
      "D2.15": getPathLabelAngle(getPathByVillaName("D2.15")),
      "E2.1": getPathLabelAngle(getPathByVillaName("E2.1"))
    };

    svg.querySelectorAll("path[data-id]").forEach((path) => {
      const villaData = getVillaByPath(path);
      const title = villaData?.name || "";
      if (!title || !villaData?.id) return;

      const box = path.getBBox();
      const label = document.createElement("span");
      label.textContent = title;
      label.dataset.id = villaData.id;
      label.style.left = `${((box.x + box.width / 2 - viewBox.x) / viewBox.width) * 100}%`;
      label.style.top = `${((box.y + box.height / 2 - viewBox.y) / viewBox.height) * 100}%`;
      const labelAngle =
        title === "E2.16"
          ? referenceAngles["E2.1"]
          : isFHorizontalLabel(title)
            ? referenceAngles["E2.1"]
            : getPathLabelAngle(path);
      label.style.setProperty("--label-rotate", `${labelAngle}deg`);
      labels.appendChild(label);
    });
  };

  Promise.all([
    fetch(overlayImage).then((response) => {
      if (!response.ok) throw new Error("Could not load zoning SVG");
      return response.text();
    }),
    fetchZoningVillaData(labels)
  ])
    .then(([svgText, villas]) => {
      villaDataByName = new Map(villas.map((villa) => [villa.name, villa]));
      villaDataById = new Map(villas.map((villa) => [String(villa.id), villa]));
      overlay.innerHTML = svgText;
      const svg = overlay.querySelector("svg");
      if (!svg) return;

      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      svg.setAttribute("aria-hidden", "true");
      createLotLabels(svg);
      svg.querySelectorAll("path[data-id]").forEach((path) => {
        const villaData = getVillaByPath(path);
        const title = villaData?.name || path.dataset.id || "";
        path.setAttribute("fill-opacity", "1");

        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-label", villaData?.name || title);

        path.addEventListener("mouseenter", () => {
          path.classList.add("is-hovered");
          getPathLabels(path).forEach((label) => {
            label.classList.add("is-hovered");
          });
        });

        path.addEventListener("mouseleave", () => {
          path.classList.remove("is-hovered");
          getPathLabels(path).forEach((label) => {
            label.classList.remove("is-hovered");
          });
        });

        path.addEventListener("click", (event) => {
          event.stopPropagation();
          selectLot(path);
        });

        path.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;

          event.preventDefault();
          selectLot(path);
        });
      });

      filterApi?.init(villas);
      zoningEl.classList.add("is-zoning-overlay-ready");
    })
    .catch((error) => {
      zoningEl.classList.remove("is-zoning-overlay-ready");
      console.warn(error);
    });
}

function zoningScale(zoningEl) {
  const map = zoningEl.querySelector("[data-zoning-map]");
  const mapInner = zoningEl.querySelector("[data-zoning-map-inner]");
  const zoomInBtn = zoningEl.querySelector("[data-zoning-zoom-in]");
  const zoomOutBtn = zoningEl.querySelector("[data-zoning-zoom-out]");
  const returnBtn = zoningEl.querySelector("[data-zoning-return]");
  if (!map || !mapInner) return;

  const minZoom = 1;
  const maxZoom = 2.5;
  const zoomStep = 0.25;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartPanX = 0;
  let dragStartPanY = 0;
  let isDragging = false;

  const clampPan = () => {
    const maxPanX = ((zoom - 1) * map.clientWidth) / 2;
    const maxPanY = ((zoom - 1) * map.clientHeight) / 2;
    panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
    panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
  };

  const updateZoom = () => {
    clampPan();
    mapInner.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
    zoningEl.classList.toggle("is-map-zoomed", zoom > minZoom);
  };

  const setZoom = (value) => {
    zoom = Math.min(maxZoom, Math.max(minZoom, value));
    if (zoom === minZoom) {
      panX = 0;
      panY = 0;
    }
    updateZoom();
  };

  zoomInBtn?.addEventListener("click", () => {
    setZoom(zoom + zoomStep);
  });

  zoomOutBtn?.addEventListener("click", () => {
    setZoom(zoom - zoomStep);
  });

  returnBtn?.addEventListener("click", () => {
    setZoom(minZoom);
  });

  map?.addEventListener("pointerdown", (event) => {
    if (zoom <= minZoom) return;
    if (event.target.closest?.("path[data-id]")) return;

    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartPanX = panX;
    dragStartPanY = panY;
    zoningEl.classList.add("is-map-dragging");
    map.setPointerCapture(event.pointerId);
  });

  map?.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    panX = dragStartPanX + event.clientX - dragStartX;
    panY = dragStartPanY + event.clientY - dragStartY;
    updateZoom();
  });

  const endDrag = (event) => {
    if (!isDragging) return;

    isDragging = false;
    zoningEl.classList.remove("is-map-dragging");
    if (map.hasPointerCapture(event.pointerId)) {
      map.releasePointerCapture(event.pointerId);
    }
  };

  map?.addEventListener("pointerup", endDrag);
  map?.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", updateZoom);

  updateZoom();
}

function zoningAudio(zoningEl) {
  const audioBtn = zoningEl.querySelector("[data-zoning-audio-toggle]");
  if (!audioBtn) return;

  let audio = null;
  let isPlaying = false;

  const setPlaying = (value) => {
    isPlaying = value;
    audioBtn.classList.toggle("is-audio-playing", isPlaying);
    audioBtn.setAttribute("aria-pressed", String(isPlaying));
    audioBtn.setAttribute(
      "aria-label",
      isPlaying ? "Turn sound off" : "Turn sound on"
    );
  };

  const getAudio = () => {
    if (audio) return audio;
    audio = new Audio(
      audioBtn.dataset.zoningAudio || "./assets/videos/ambient.mp3"
    );
    audio.loop = true;
    audio.volume = 1;
    audio.preload = "none";
    return audio;
  };

  audioBtn.addEventListener("click", () => {
    const ambient = getAudio();

    if (isPlaying) {
      ambient.pause();
      setPlaying(false);
      return;
    }

    ambient
      .play()
      .then(() => {
        setPlaying(true);
      })
      .catch(() => {
        setPlaying(false);
      });
  });

  window.addEventListener("pagehide", () => {
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  });
}

function zoningCompareModal(zoningEl) {
  const compareSubmit = zoningEl.querySelector(".zoning-compare-submit");
  const compareModal = zoningEl.querySelector(".zoning-compare__modal");
  const compareModalClose = compareModal?.querySelector(".btn-close");
  const compareModalShare = compareModal?.querySelector(".btn-share");
  if (!compareSubmit || !compareModal) return;

  compareSubmit.addEventListener("click", () => {
    compareModal.classList.toggle("show");
  });

  compareModalClose?.addEventListener("click", () => {
    compareModal.classList.remove("show");
  });

  compareModalShare?.addEventListener("click", () => {
    document.querySelector(".modal-share").classList.add("show");
  });
}

function zoningGuide(zoningEl) {
  const guide = zoningEl.querySelector("[data-zoning-guide]");
  const closeBtn = zoningEl.querySelector("[data-zoning-guide-close]");
  if (!guide) return;

  let isClosed = false;
  const showTimer = window.setTimeout(() => {
    if (!isClosed) {
      guide.classList.add("is-visible");
    }
  }, 2000);

  closeBtn?.addEventListener("click", () => {
    isClosed = true;
    window.clearTimeout(showTimer);
    guide.classList.remove("is-visible");
  });
}

function zoning() {
  const zoningEl = document.querySelector(".zoning");
  if (!zoningEl) return;

  zoningMapCanvas(zoningEl);
  const filterApi = zoningFilter(zoningEl);
  zoningSectors(zoningEl, filterApi);
  zoningLots(zoningEl, filterApi);
  zoningScale(zoningEl);
  zoningAudio(zoningEl);
  zoningCompareModal(zoningEl);
  zoningGuide(zoningEl);
}

document.addEventListener("DOMContentLoaded", () => {
  zoning();
  initZoningCardSlider();
});
