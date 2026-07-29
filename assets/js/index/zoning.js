"use strict";

function initZoningParallaxSwiper(swiperEl, options = {}) {
  const interleaveOffset = 0.85;

  return new Swiper(swiperEl, {
    slidesPerView: 1,
    loop: true,
    speed: 1500,
    watchSlidesProgress: true,
    grabCursor: true,
    ...options,
    on: {
      progress(swiper) {
        swiper.slides.forEach((slide) => {
          const slideProgress = slide.progress || 0;
          const innerOffset = swiper.width * interleaveOffset;
          const innerTranslate = slideProgress * innerOffset;

          if (!isNaN(innerTranslate)) {
            const image = slide.querySelector(".image");
            if (image) {
              image.style.transform = `translate3d(${innerTranslate}px, 0, 0)`;
            }
          }
        });
      },
      touchStart(swiper) {
        swiper.slides.forEach((slide) => {
          slide.style.transition = "";
        });
      },
      setTransition(swiper, speed) {
        const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)";
        swiper.slides.forEach((slide) => {
          slide.style.transition = `${speed}ms ${easing}`;
          const image = slide.querySelector(".image");
          if (image) image.style.transition = `${speed}ms ${easing}`;
        });
      },
      ...(options.on || {})
    }
  });
}

function initZoningCardSlider() {
  document.querySelectorAll(
    ".zoning-card [slider-parallax], .zoning-compare__modal [slider-parallax]"
  ).forEach((swiperEl) => {
    if (swiperEl.swiper) return;

    initZoningParallaxSwiper(swiperEl, {
      autoplay: swiperEl.hasAttribute("slider-autoplay")
        ? {
            delay: 3500,
            disableOnInteraction: false
          }
        : false,
      pagination: swiperEl.hasAttribute("slider-pagination")
        ? {
            el: swiperEl.querySelector(".slider-pagination"),
            clickable: true
          }
        : false
    });
  });
}

function zoningFilter(zoningEl) {
  const filter = zoningEl.querySelector("[data-zoning-filter]");
  const overlay = zoningEl.querySelector("[data-zoning-map-overlay]");
  const labels = zoningEl.querySelector("[data-zoning-map-labels]");
  const filterToggles = zoningEl.querySelectorAll(
    "[data-zoning-filter-toggle]"
  );

  let filterTimer = null;
  let villaDataById = new Map();
  const filterFields = ["villa", "bedroom", "floor_area", "view"];
  const activeFilters = filterFields.reduce((filters, field) => {
    filters[field] = "all";
    return filters;
  }, {});

  const normalizeFilterValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const getComparableValue = (value) => normalizeFilterValue(value);

  const formatFilterLabel = (field, value) => {
    return String(value);
  };

  const sortFilterValues = (field, values) => {
    const sortedValues = [...values];

    if (field === "bedroom" || field === "floor_area") {
      return sortedValues.sort((a, b) => Number(a) - Number(b));
    }

    return sortedValues.sort((a, b) => String(a).localeCompare(String(b)));
  };

  const renderFilterButtons = (villas) => {
    if (!filter) return;

    filterFields.forEach((field) => {
      const group = filter.querySelector(`[data-filter-group="${field}"]`);
      const options = group?.querySelector(".zoning-filter-options");
      if (!options) return;

      const values = new Map();
      villas.forEach((villa) => {
        const rawValue = villa[field];
        if (rawValue === undefined || rawValue === null || rawValue === "") return;
        values.set(getComparableValue(rawValue), rawValue);
      });

      const buttons = [
        `<button type="button" class="${activeFilters[field] === "all" ? "active" : ""}" value="all" data-filter-value="all">All</button>`,
        ...sortFilterValues(field, values.values()).map((value) => {
          const normalizedValue = getComparableValue(value);
          const activeClass = activeFilters[field] === normalizedValue ? "active" : "";
          return `<button type="button" class="${activeClass}" value="${normalizedValue}" data-filter-value="${normalizedValue}">${formatFilterLabel(field, value)}</button>`;
        })
      ];

      options.innerHTML = buttons.join("");
    });
  };

  const getActiveButtonValue = (button) =>
    button.dataset.filterValue || button.value || "all";

  const updateFilterButtons = () => {
    if (!filter) return;

    filter.querySelectorAll("[data-filter-group]").forEach((group) => {
      const field = group.dataset.filterGroup;
      if (!filterFields.includes(field)) return;

      group.querySelectorAll(".zoning-filter-options button").forEach((button) => {
        button.classList.toggle(
          "active",
          getActiveButtonValue(button) === activeFilters[field]
        );
      });
    });
  };

  const setFilterValue = (field, value, options = {}) => {
    if (!filterFields.includes(field)) return;

    if (zoningEl.classList.contains("is-sector-mode")) {
      zoningEl.classList.remove("is-sector-mode");
      zoningEl.classList.add("is-detail-mode");
      zoningEl.classList.remove("is-card-open");
    }

    if (options.resetOthers) {
      filterFields.forEach((filterField) => {
        activeFilters[filterField] = "all";
      });
    }

    activeFilters[field] = getComparableValue(value || "all") || "all";
    updateFilterButtons();
    if (options.apply !== false) {
      applyZoningFilters();
    }
  };

  const villaMatchesFilters = (villaId) => {
    const villa = villaDataById.get(String(villaId || ""));

    if (!villa) {
      return Object.values(activeFilters).every((value) => value === "all");
    }

    return filterFields.every((field) => {
      const activeValue = activeFilters[field];
      if (activeValue === "all") return true;
      return getComparableValue(villa[field]) === activeValue;
    });
  };

  const applyZoningFilters = () => {
    if (!overlay) return;

    overlay.querySelectorAll("path[data-id]").forEach((path) => {
      const isVisible = villaMatchesFilters(path.dataset.id);
      const pathLabels = labels
        ? [...labels.querySelectorAll("span[data-title]")].filter(
            (label) => label.dataset.id === path.dataset.id
          )
        : [];

      path.classList.toggle("is-filter-hidden", !isVisible);
      path.setAttribute("aria-hidden", String(!isVisible));
      path.setAttribute("tabindex", isVisible ? "0" : "-1");
      pathLabels.forEach((label) => {
        label.classList.toggle("is-filter-hidden", !isVisible);
      });

      if (!isVisible && path.classList.contains("is-selected")) {
        path.classList.remove("is-selected");
        zoningEl.classList.remove("is-card-open");
      }
    });
  };

  const bindFilterButtons = () => {
    if (!filter) return;

    filter.querySelectorAll("[data-filter-group]").forEach((group) => {
      const field = group.dataset.filterGroup;
      if (!filterFields.includes(field)) return;

      group.querySelectorAll(".zoning-filter-options button").forEach((button) => {
        button.addEventListener("click", () => {
          group
            .querySelectorAll(".zoning-filter-options button")
            .forEach((item) => item.classList.remove("active"));

          button.classList.add("active");
          setFilterValue(field, getActiveButtonValue(button));
        });
      });
    });
  };

  const setFilterExpanded = (isExpanded) => {
    filterToggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(isExpanded));
    });
  };

  const clearFilterTimer = () => {
    if (filterTimer) {
      window.clearTimeout(filterTimer);
      filterTimer = null;
    }
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

  if (filterToggles.length) {
    setFilterExpanded(!zoningEl.classList.contains("is-filter-collapsed"));

    filterToggles.forEach((button) => {
      button.addEventListener("click", () => {
        if (zoningEl.classList.contains("is-filter-collapsed")) {
          expandFilter();
          return;
        }

        if (zoningEl.classList.contains("is-filter-expanding")) return;

        collapseFilter();
      });
    });
  }

  return {
    collapse: collapseFilter,
    expand: expandFilter,
    init(villas) {
      villaDataById = new Map(villas.map((villa) => [String(villa.id), villa]));
      renderFilterButtons(villas);
      bindFilterButtons();
      applyZoningFilters();
    },
    selectSector(sector) {
      setFilterValue("villa", sector, { resetOthers: true });
      expandFilter();
    }
  };
}

function zoningSectors(zoningEl, filterApi) {
  const sectorLayer = zoningEl.querySelector("[data-zoning-map-sector]");
  if (!sectorLayer) return;

  const normalizeSector = (value) => String(value || "").trim().toUpperCase();

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

  fetch("./assets/images/zoning-map-sector.svg")
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

function zoningLots(zoningEl, filterApi) {
  const overlay = zoningEl.querySelector("[data-zoning-map-overlay]");
  const labels = zoningEl.querySelector("[data-zoning-map-labels]");
  const card = zoningEl.querySelector("[data-zoning-card]");
  if (!overlay || !card) return;

  const cardArea = card.querySelector("[data-zoning-card-area]");
  const cardTitle = card.querySelector("[data-zoning-card-title]");
  const cardMeta = card.querySelector(".zoning-card-meta");
  const cardDetail = card.querySelector("[data-zoning-card-detail]");
  const cardCompare = card.querySelector("[data-zoning-card-compare]");
  const cardSlider = card.querySelector("[slider-parallax]");
  let selectedPath = null;
  let villaDataByName = new Map();
  let villaDataById = new Map();
  const lotColors = {
    A: "rgb(116, 140, 176)",
    B: "rgb(89, 89, 153)",
    C: "rgb(164, 104, 176)",
    D: "rgb(51, 166, 149)",
    E: "rgb(161, 109, 87)",
    F: "rgb(99, 171, 97)",
    G: "rgb(135, 72, 72)"
  };
  const defaultGallery = [
    "./assets/images/draf/thumb-villa.jpg",
    "./assets/images/bg-contact.avif",
    "./assets/images/draf/thumb-villa.jpg",
    "./assets/images/bg-contact.avif"
  ];
  const villaGalleries = {
    default: defaultGallery
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const getLotAreaKey = (title) => String(title || "").match(/^[A-Z]/)?.[0] || "";
  const getLotUrl = (title) => `./floor-plan.html?villa=${encodeURIComponent(title)}`;
  const getLotGallery = (title) => villaGalleries[title] || villaGalleries.default;

  const selectLot = (path) => {
    const title = path.dataset.title;
    const id = path.dataset.id;
    if (!id && !title) return;
    const data = villaDataById.get(String(id || "")) || {
      id: "",
      name: title,
      villa: getLotAreaKey(title),
      bedroom: "",
      floor_area: "",
      view: "",
      detail_url: getLotUrl(title)
    };
    const lotTitle = data.name || title;

    selectedPath?.classList.remove("is-selected");
    selectedPath = path;
    selectedPath.classList.add("is-selected");

    if (cardArea) cardArea.textContent = data.villa ? `Area ${data.villa}` : "Area";
    if (cardTitle) cardTitle.textContent = lotTitle;
    if (cardMeta) {
      const floorPlan = data.floor_area ? `${data.floor_area} sqm` : "";
      const floors = data.floors || data.floor || 2;
      const cardMetaItems = [
        {
          icon: "./assets/images/zoning/floorplan.svg",
          value: floorPlan,
          label: "Floor Plan"
        },
        {
          icon: "./assets/images/zoning/bed.svg",
          value: data.bedroom || "",
          label: "Bedrooms"
        },
        {
          icon: "./assets/images/zoning/view.svg",
          value: data.view || "",
          label: "View"
        },
        {
          icon: "./assets/images/zoning/floor.svg",
          value: floors,
          label: "Floors"
        }
      ];
      cardMeta.innerHTML = `
        ${cardMetaItems
          .map(
            (item) => `
              <li>
                <img src="${item.icon}" alt="" />
                <div class="content">
                  <span>${escapeHtml(item.value)}</span>
                  ${escapeHtml(item.label)}
                </div>
              </li>
            `
          )
          .join("")}
      `;
    }
    if (cardDetail) cardDetail.href = data.detail_url || getLotUrl(lotTitle || id);
    if (cardCompare) cardCompare.dataset.id = data.id || "";
    updateCardGallery(getLotGallery(lotTitle));
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

    initZoningParallaxSwiper(cardSlider, {
      autoplay: cardSlider.hasAttribute("slider-autoplay")
        ? {
            delay: 3500,
            disableOnInteraction: false
          }
        : false,
      pagination: cardSlider.hasAttribute("slider-pagination")
        ? {
            el: cardSlider.querySelector(".slider-pagination"),
            clickable: true
          }
        : false
    });
  };

  const getPathPoints = (path) => {
    const pathData = path.dataset.originalD || path.getAttribute("d");
    const tokens = [...pathData.matchAll(/([MLHVQZ])|(-?\d+(?:\.\d+)?)/g)]
      .map((match) => match[0]);
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
    const referenceAngles = {
      "D2.15": getPathLabelAngle(svg.querySelector('path[data-title="D2.15"]')),
      "E2.1": getPathLabelAngle(svg.querySelector('path[data-title="E2.1"]'))
    };

    svg.querySelectorAll("path[data-title]").forEach((path) => {
      const title = path.dataset.title;
      if (!title) return;

      const box = path.getBBox();
      const label = document.createElement("span");
      label.textContent = title;
      label.dataset.title = title;
      const villaData = villaDataByName.get(title);
      if (villaData) {
        label.dataset.id = villaData.id;
      }
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
    fetch("./assets/images/zoning-map-titled.svg").then((response) => {
      if (!response.ok) throw new Error("Could not load zoning SVG");
      return response.text();
    }),
    fetch("./assets/data/zoning-villas.json").then((response) => {
      if (!response.ok) throw new Error("Could not load zoning data");
      return response.json();
    })
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
      svg.querySelectorAll("path[data-title]").forEach((path) => {
        const title = path.dataset.title || "";
        const villaData = villaDataByName.get(title);
        const area = villaData?.villa || getLotAreaKey(title);
        const color = lotColors[area];
        if (color) {
          path.setAttribute("fill", color);
        }
        path.setAttribute("fill-opacity", "1");
        if (villaData) {
          path.dataset.id = villaData.id;
        }
        path.removeAttribute("data-title");

        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-label", villaData?.name || title);

        path.addEventListener("mouseenter", () => {
          path.classList.add("is-hovered");
        });

        path.addEventListener("mouseleave", () => {
          path.classList.remove("is-hovered");
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
    })
    .catch((error) => {
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

function zoningCompareModal(zoningEl) {
  const compareSubmit = zoningEl.querySelector(".zoning-compare-submit");
  const compareModal = zoningEl.querySelector(".zoning-compare__modal");
  const compareModalClose = compareModal?.querySelector(".btn-close");
  if (!compareSubmit || !compareModal) return;

  compareSubmit.addEventListener("click", () => {
    compareModal.classList.toggle("show");
  });

  compareModalClose?.addEventListener("click", () => {
    compareModal.classList.remove("show");
  });
}

function zoning() {
  const zoningEl = document.querySelector(".zoning");
  if (!zoningEl) return;

  const filterApi = zoningFilter(zoningEl);
  zoningSectors(zoningEl, filterApi);
  zoningLots(zoningEl, filterApi);
  zoningScale(zoningEl);
  zoningCompareModal(zoningEl);
}

document.addEventListener("DOMContentLoaded", () => {
  zoning();
  initZoningCardSlider();
});
