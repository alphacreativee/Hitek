"use strict";

const $ = jQuery;

// Lấy tọa độ vị trí x, y của floorplan

// document.addEventListener("click", (e) => {
//   const img = document.querySelector("[data-floorplan-image]");
//   if (!img) return;

//   const rect = img.getBoundingClientRect();

//   if (
//     e.clientX < rect.left ||
//     e.clientX > rect.right ||
//     e.clientY < rect.top ||
//     e.clientY > rect.bottom
//   ) {
//     return;
//   }

//   const x = ((e.clientX - rect.left) / rect.width) * 100;
//   const y = ((e.clientY - rect.top) / rect.height) * 100;

//   console.log(`x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`);
// });

function floorPlan() {
  const $page = $(".floor-plan-page");
  if (!$page.length) return;

  const defaultState = {
    villa: "C",
    floor: "1"
  };
  const floorplanData = {
    C: {
      1: {
        scene: "scene_floorplan_villa_c_floor_1",
        image: "./assets/images/floorplan/C/Villa_C_F1.png",
        markers: [
          {
            id: "c-1-entrance",
            x: 50,
            y: 90,
            radar: 0,
            scene: "scene_floorplan_villa_c_floor_1" // 360_View01_Mat Tien
          },
          {
            id: "c-1-front",
            x: 50.33,
            y: 66.54,
            radar: 0,
            scene: "scene_floorplan_villa_c_floor_1_front" // 360_View09_Tien sanh
          },
          {
            id: "c-1-living",
            x: 42,
            y: 37.78,
            radar: -180,
            scene: "scene_floorplan_villa_c_floor_1_living" // 360_View02_Phong khach
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_c_floor_2",
        image: "./assets/images/floorplan/C/Villa_C_F2.png",
        markers: [
          {
            id: "c-2-master",
            x: 38,
            y: 49.57,
            radar: 0,
            scene: "scene_floorplan_villa_c_floor_2" // 360_View04_Phong master
          },
          {
            id: "c-2-bed",
            x: 62.33,
            y: 54.28,
            radar: 0,
            scene: "scene_floorplan_villa_c_floor_2_bed" // 360_View06_Phong ngu tang 2
          },
          {
            id: "c-2-bancol",
            x: 38.33,
            y: 39.67,
            radar: 0,
            scene: "scene_floorplan_villa_c_floor_2_balcony" // 360_View10_Ban cong tang 2
          }
        ]
      }
    },
    D: {
      1: {
        scene: "scene_floorplan_villa_d_floor_1",
        image: "./assets/images/floorplan/D/Villa_D_F1.png",
        markers: [
          {
            id: "d-1-front",
            x: 50,
            y: 90,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_1"
          },
          {
            id: "d-1-lounge",
            x: 78,
            y: 42,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-1-garden",
            x: 22,
            y: 55,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_1"
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_d_floor_2",
        image: "./assets/images/floorplan/D/Villa_D_F2.png",
        markers: [
          {
            id: "d-2-master",
            x: 26,
            y: 22,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-2-bath",
            x: 74,
            y: 50,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-2-balcony",
            x: 26,
            y: 76,
            radar: 0,
            scene: "scene_floorplan_villa_d_floor_1"
          }
        ]
      }
    },
    F: {
      1: {
        scene: "scene_floorplan_villa_f_floor_1",
        image: "./assets/images/floorplan/F/Villa_F_F1.png",
        markers: [
          {
            id: "f-1-entry",
            x: 50,
            y: 90,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_1"
          },
          {
            id: "f-1-pool",
            x: 78,
            y: 42,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_2"
          },
          {
            id: "f-1-dining",
            x: 22,
            y: 55,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_1"
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_f_floor_2",
        image: "./assets/images/floorplan/F/Villa_F_F2.png",
        markers: [
          {
            id: "f-2-master",
            x: 74,
            y: 22,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_2"
          },
          {
            id: "f-2-family",
            x: 26,
            y: 50,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_1"
          },
          {
            id: "f-2-view",
            x: 74,
            y: 76,
            radar: 0,
            scene: "scene_floorplan_villa_f_floor_2"
          }
        ]
      }
    }
  };

  const state = { ...defaultState };
  let krpano = null;
  let activeMarkerId = null;
  let filterTimer = null;
  let sceneActivationTimer = null;
  let radarFrame = null;

  const getVillaData = (villa) =>
    floorplanData[villa] || floorplanData[defaultState.villa];
  const getFloorData = (villa, floor) => {
    const villaData = getVillaData(villa);
    return villaData[floor] || villaData[defaultState.floor];
  };

  const normalizeVilla = (villa) => {
    const value = String(villa || defaultState.villa).toUpperCase();
    return floorplanData[value] ? value : defaultState.villa;
  };

  const normalizeFloor = (villa, floor) => {
    const value = String(floor || defaultState.floor);
    return getVillaData(villa)[value] ? value : defaultState.floor;
  };

  function findMarkerByScene(sceneName) {
    if (!sceneName) return null;

    const villaOrder = [
      state.villa,
      ...Object.keys(floorplanData).filter((villa) => villa !== state.villa)
    ];

    for (const villa of villaOrder) {
      const villaData = getVillaData(villa);
      for (const [floor, floorData] of Object.entries(villaData)) {
        const marker = (floorData.markers || []).find(
          (item) => item.scene === sceneName
        );

        if (marker) return { villa, floor, marker };
      }
    }

    return null;
  }

  function syncStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.villa = normalizeVilla(params.get("villa"));
    state.floor = normalizeFloor(state.villa, params.get("floor"));
    activeMarkerId = null;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    params.set("villa", state.villa);
    if (state.floor !== defaultState.floor) {
      params.set("floor", state.floor);
    }

    window.history.pushState(
      { ...state },
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }

  function updateButtons() {
    $page.find("[data-floorplan-villa]").removeClass("active");
    $page.find(`[data-floorplan-villa="${state.villa}"]`).addClass("active");

    $page.find("[data-floorplan-floor]").removeClass("active");
    $page.find(`[data-floorplan-floor="${state.floor}"]`).addClass("active");
  }

  function renderPlan(floorData) {
    const markers = floorData.markers || [];
    const $markerList = $page.find("[data-floorplan-markers]");

    $page.find("[data-floorplan-image]").attr("src", floorData.image);
    $markerList.empty();

    markers.forEach((marker, index) => {
      const isActive =
        activeMarkerId === marker.id || (!activeMarkerId && index === 0);
      $("<button>", {
        class: `floor-plan-page__marker${isActive ? " active" : ""}`,
        type: "button",
        "aria-label": marker.id.replace(/-/g, " "),
        "data-floorplan-marker": marker.id,
        "data-scene": marker.scene,
        "data-radar": marker.radar || 0
      })
        .css({
          left: `${marker.x}%`,
          top: `${marker.y}%`
        })
        .appendTo($markerList);

      if (isActive) activeMarkerId = marker.id;
    });
  }

  function loadScene(sceneName) {
    if (!krpano || !sceneName) return;

    krpano.call(
      `skin_loadscene(${sceneName}, get(skin_settings.loadscene_blend))`
    );
    krpano.set("autorotate.enabled", false);
    krpano.call("autorotate.stop();");
    activateControlThumb(sceneName);
    keepControlBarVisible();
    setTimeout(() => activateControlThumb(sceneName), 250);
    setTimeout(keepControlBarVisible, 250);
    setTimeout(() => activateControlThumb(sceneName), 800);
    setTimeout(keepControlBarVisible, 800);
  }

  function activateControlThumb(sceneName) {
    if (!krpano || !sceneName) return;

    const thumbIndex = krpano.get(`scene[${sceneName}].thumbindex`);
    const thumbUrl = krpano.get(`scene[${sceneName}].thumburl`);
    const skipThumb = krpano.get(`scene[${sceneName}].skipthumb`);

    if (
      thumbIndex === null ||
      thumbIndex === undefined ||
      !thumbUrl ||
      skipThumb === true ||
      skipThumb === "true"
    ) {
      krpano.set("layer[skin_thumbborder].visible", false);
      return;
    }

    krpano.set("layer[skin_thumbborder].parent", `skin_thumb_${thumbIndex}`);
    krpano.set("layer[skin_thumbborder].x", 2);
    krpano.set("layer[skin_thumbborder].y", 2);
    krpano.set("layer[skin_thumbborder].width", 116);
    krpano.set("layer[skin_thumbborder].height", 76);
    krpano.set("layer[skin_thumbborder].bgborder", "3 0xFFFFFF 1.0");
    krpano.set("layer[skin_thumbborder].bgroundedge", 4);
    krpano.set("layer[skin_thumbborder].visible", true);
    krpano.call(
      `layer[skin_thumbs].scrolltocenter(get(scene[${sceneName}].thumbx), get(scene[${sceneName}].thumby));`
    );
  }

  function updateRadarAngle() {
    if (krpano) {
      const hlookat = parseFloat(krpano.get("view.hlookat")) || 0;
      const $activeMarker = $page.find("[data-floorplan-marker].active");
      const radarOffset = parseFloat($activeMarker.data("radar")) || 0;

      $activeMarker.css(
        "--floorplan-radar-angle",
        `${hlookat + radarOffset}deg`
      );
    }

    radarFrame = window.requestAnimationFrame(updateRadarAngle);
  }

  function startRadar() {
    if (radarFrame) return;
    radarFrame = window.requestAnimationFrame(updateRadarAngle);
  }

  function keepControlBarVisible() {
    if (!krpano) return;

    const controlIcons = {
      skin_btn_prev: "./vtour/skin/icon/arrow-left.svg",
      skin_btn_thumbs: "./vtour/skin/icon/filter.svg",
      skin_btn_left: "./vtour/skin/icon/arrow-left.svg",
      skin_btn_right: "./vtour/skin/icon/arrow-right.svg",
      skin_btn_up: "./vtour/skin/icon/arrow-up.svg",
      skin_btn_down: "./vtour/skin/icon/arrow-down.svg",
      skin_btn_in: "./vtour/skin/icon/plus.svg",
      skin_btn_out: "./vtour/skin/icon/minus.svg",
      skin_btn_gyro: "./vtour/skin/icon/hotpot.svg",
      skin_btn_vr: "./vtour/skin/icon/vr.svg",
      skin_btn_fs: "./vtour/skin/icon/zoom.svg",
      skin_btn_hide: "./vtour/skin/icon/arrow-down.svg",
      skin_btn_show_icon: "./vtour/skin/icon/arrow-up.svg",
      skin_btn_next: "./vtour/skin/icon/arrow-right.svg"
    };

    Object.entries(controlIcons).forEach(([layerName, iconUrl]) => {
      krpano.set(`layer[${layerName}].url`, iconUrl);
      krpano.set(`layer[${layerName}].crop`, "");
      krpano.set(`layer[${layerName}].width`, 23);
      krpano.set(`layer[${layerName}].height`, 23);
      krpano.set(`layer[${layerName}].scale`, 1);
    });

    krpano.set("layer[skin_layer].visible", true);
    krpano.set("layer[skin_splitter_bottom].visible", true);
    krpano.set("layer[skin_control_bar_bg].visible", true);
    krpano.set("layer[skin_control_bar].visible", true);
    krpano.set("layer[skin_control_bar].alpha", 1);
    krpano.set("layer[skin_control_bar_buttons].visible", true);
    krpano.set("layer[skin_btn_navi].visible", true);
  }

  function queueSceneActivation(sceneName) {
    clearTimeout(sceneActivationTimer);
    loadScene(sceneName);

    sceneActivationTimer = setTimeout(() => {
      const currentScene = getFloorData(state.villa, state.floor).scene;
      if (currentScene === sceneName) loadScene(sceneName);
    }, 300);
  }

  function syncGalleryThumbs() {
    if (!krpano) return;

    const activeScenes = new Set();
    Object.values(getVillaData(state.villa)).forEach((floorData) => {
      activeScenes.add(floorData.scene);
      (floorData.markers || []).forEach((marker) => {
        activeScenes.add(marker.scene);
      });
    });

    Object.values(floorplanData).forEach((villaData) => {
      Object.values(villaData).forEach((floorData) => {
        const scenes = [floorData.scene].concat(
          (floorData.markers || []).map((marker) => marker.scene)
        );

        scenes.forEach((sceneName) => {
          krpano.set(
            `scene[${sceneName}].skipthumb`,
            !activeScenes.has(sceneName)
          );
        });
      });
    });

    krpano.call("skin_rebuildthumbs();");
  }

  function syncFloorplanFromScene(sceneName) {
    const sceneMatch = findMarkerByScene(sceneName);
    if (!sceneMatch) return;

    const hasChangedFloor =
      state.villa !== sceneMatch.villa || state.floor !== sceneMatch.floor;

    state.villa = sceneMatch.villa;
    state.floor = sceneMatch.floor;
    activeMarkerId = sceneMatch.marker.id;

    updateButtons();
    renderPlan(getFloorData(state.villa, state.floor));
    syncGalleryThumbs();
    activateControlThumb(sceneName);
    keepControlBarVisible();

    if (hasChangedFloor) updateUrl();
  }

  function bindKrpanoSceneSync() {
    if (!krpano) return;

    window.floorplanHandleSceneChange = function () {
      syncFloorplanFromScene(krpano.get("xml.scene"));
    };

    krpano.set("events[floorplan_events].keep", true);
    krpano.set(
      "events[floorplan_events].onnewscene",
      "js(window.floorplanHandleSceneChange());"
    );
  }

  function applyState({ shouldUpdateUrl = true } = {}) {
    const floorData = getFloorData(state.villa, state.floor);

    updateButtons();
    renderPlan(floorData);
    syncGalleryThumbs();
    queueSceneActivation(floorData.scene);

    if (shouldUpdateUrl) updateUrl();
  }

  function embedFloorplan() {
    if (typeof embedpano !== "function") return;

    embedpano({
      target: "floorplan-vtour",
      xml: "./vtour/floorplan.xml?v=floorplan-scenes-6",
      html5: "only",
      mobilescale: 1,
      vars: {
        startscene: getFloorData(state.villa, state.floor).scene
      },
      passQueryParameters: false,
      onready(pano) {
        krpano = pano;
        bindKrpanoSceneSync();
        startRadar();
        applyState({ shouldUpdateUrl: false });
      }
    });
  }

  function toggleFilter() {
    const isCollapsed = $page.hasClass("is-filter-collapsed");
    const fromClass = isCollapsed
      ? "is-filter-expanding"
      : "is-filter-collapsing";

    clearTimeout(filterTimer);
    $page.addClass(fromClass);
    $page.toggleClass("is-filter-collapsed", !isCollapsed);

    filterTimer = setTimeout(() => {
      $page.removeClass(fromClass);
    }, 360);
  }

  $page.on("click", "[data-floorplan-filter-toggle]", toggleFilter);

  $page.on("click", "[data-floorplan-villa]", function () {
    state.villa = normalizeVilla($(this).data("floorplanVilla"));
    state.floor = normalizeFloor(state.villa, state.floor);
    activeMarkerId = null;
    applyState();
  });

  $page.on("click", "[data-floorplan-floor]", function () {
    state.floor = normalizeFloor(state.villa, $(this).data("floorplanFloor"));
    activeMarkerId = null;
    applyState();
  });

  $page.on("click", "[data-floorplan-marker]", function () {
    const sceneName = $(this).data("scene");

    activeMarkerId = $(this).data("floorplanMarker");
    $page.find("[data-floorplan-marker]").removeClass("active");
    $(this).addClass("active");
    loadScene(sceneName);
    syncFloorplanFromScene(sceneName);
  });

  $page.on("click", "[data-floorplan-plan-toggle]", function () {
    $page.toggleClass("is-plan-collapsed");
  });

  $(window).on("popstate", function () {
    syncStateFromUrl();
    applyState({ shouldUpdateUrl: false });
  });

  syncStateFromUrl();
  embedFloorplan();
  applyState({ shouldUpdateUrl: false });
}

$(function () {
  floorPlan();
});
