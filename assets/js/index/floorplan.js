"use strict";

const $ = jQuery;

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
            scene: "scene_floorplan_villa_c_floor_1"
          },
          {
            id: "c-1-living",
            x: 22,
            y: 55,
            scene: "scene_floorplan_villa_c_floor_2"
          },
          {
            id: "c-1-pool",
            x: 78,
            y: 42,
            scene: "scene_floorplan_villa_c_floor_1"
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_c_floor_2",
        image: "./assets/images/floorplan/C/Villa_C_F2.png",
        markers: [
          {
            id: "c-2-master",
            x: 26,
            y: 22,
            scene: "scene_floorplan_villa_c_floor_2"
          },
          {
            id: "c-2-suite",
            x: 74,
            y: 22,
            scene: "scene_floorplan_villa_c_floor_2"
          },
          {
            id: "c-2-corridor",
            x: 50,
            y: 50,
            scene: "scene_floorplan_villa_c_floor_1"
          }
        ]
      }
    },
    D: {
      1: {
        scene: "scene_floorplan_villa_d_floor_1",
        image: "./assets/images/floorplan/floorplan-floor-1.svg",
        markers: [
          {
            id: "d-1-front",
            x: 50,
            y: 90,
            scene: "scene_floorplan_villa_d_floor_1"
          },
          {
            id: "d-1-lounge",
            x: 78,
            y: 42,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-1-garden",
            x: 22,
            y: 55,
            scene: "scene_floorplan_villa_d_floor_1"
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_d_floor_2",
        image: "./assets/images/floorplan/floorplan-floor-2.svg",
        markers: [
          {
            id: "d-2-master",
            x: 26,
            y: 22,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-2-bath",
            x: 74,
            y: 50,
            scene: "scene_floorplan_villa_d_floor_2"
          },
          {
            id: "d-2-balcony",
            x: 26,
            y: 76,
            scene: "scene_floorplan_villa_d_floor_1"
          }
        ]
      }
    },
    F: {
      1: {
        scene: "scene_floorplan_villa_f_floor_1",
        image: "./assets/images/floorplan/floorplan-floor-1.svg",
        markers: [
          {
            id: "f-1-entry",
            x: 50,
            y: 90,
            scene: "scene_floorplan_villa_f_floor_1"
          },
          {
            id: "f-1-pool",
            x: 78,
            y: 42,
            scene: "scene_floorplan_villa_f_floor_2"
          },
          {
            id: "f-1-dining",
            x: 22,
            y: 55,
            scene: "scene_floorplan_villa_f_floor_1"
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_f_floor_2",
        image: "./assets/images/floorplan/floorplan-floor-2.svg",
        markers: [
          {
            id: "f-2-master",
            x: 74,
            y: 22,
            scene: "scene_floorplan_villa_f_floor_2"
          },
          {
            id: "f-2-family",
            x: 26,
            y: 50,
            scene: "scene_floorplan_villa_f_floor_1"
          },
          {
            id: "f-2-view",
            x: 74,
            y: 76,
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
        "data-scene": marker.scene
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

    krpano.call(`loadscene(${sceneName}, null, MERGE, BLEND(0))`);
    krpano.set("autorotate.enabled", false);
    krpano.call("autorotate.stop();");
  }

  function applyState({ shouldUpdateUrl = true } = {}) {
    const floorData = getFloorData(state.villa, state.floor);

    updateButtons();
    renderPlan(floorData);
    loadScene(floorData.scene);

    if (shouldUpdateUrl) updateUrl();
  }

  function embedFloorplan() {
    if (typeof embedpano !== "function") return;

    embedpano({
      target: "floorplan-vtour",
      xml: "./vtour/floorplan.xml",
      html5: "only",
      mobilescale: 1,
      passQueryParameters: false,
      onready(pano) {
        krpano = pano;
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
    activeMarkerId = $(this).data("floorplanMarker");
    $page.find("[data-floorplan-marker]").removeClass("active");
    $(this).addClass("active");
    loadScene($(this).data("scene"));
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
