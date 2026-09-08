"use strict";

const $ = jQuery;

// const themeURL = sk_object.vars.theme_url;

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
  const villaSceneOrder = {
    C: [1, 8, 9, 2, 5, 7],
    D: [1, 2, 13, 12, 3, 4, 6, 7, 8, 9, 5, 10, 11, 14, 15, 16, 17, 18, 19, 20],
    F: [13, 11, 12, 10, 7, 6, 9, 8, 5, 4, 2, 3, 19, 18, 20, 16, 17, 15, 14]
  };

  const getMarkerViewNumber = (marker) =>
    Number.isFinite(marker.sortOrder) ? marker.sortOrder : 999;

  function getVillaSceneOrderIndex(villa, marker) {
    const order = villaSceneOrder[villa] || [];
    const viewNumber = getMarkerViewNumber(marker);
    const orderIndex = order.indexOf(viewNumber);

    return orderIndex >= 0 ? orderIndex : order.length + viewNumber;
  }

  function sortMarkersForVilla(villa, markers = []) {
    return markers.slice().sort((a, b) => {
      const aOrder = getVillaSceneOrderIndex(villa, a);
      const bOrder = getVillaSceneOrderIndex(villa, b);

      if (aOrder !== bOrder) return aOrder - bOrder;
      return getMarkerViewNumber(a) - getMarkerViewNumber(b);
    });
  }

  function getSortedSceneNamesForVilla(villa) {
    const seenScenes = new Set();
    const entries = [];

    Object.values(getVillaData(villa)).forEach((floorData) => {
      sortMarkersForVilla(villa, floorData.markers).forEach((marker) => {
        if (seenScenes.has(marker.scene)) return;
        seenScenes.add(marker.scene);
        entries.push(marker);
      });
    });

    return entries
      .sort((a, b) => {
        const aOrder = getVillaSceneOrderIndex(villa, a);
        const bOrder = getVillaSceneOrderIndex(villa, b);

        if (aOrder !== bOrder) return aOrder - bOrder;
        return getMarkerViewNumber(a) - getMarkerViewNumber(b);
      })
      .map((marker) => marker.scene);
  }

  function getInitialSceneForFloor(villa, floorData) {
    return (
      sortMarkersForVilla(villa, floorData.markers)[0]?.scene || floorData.scene
    );
  }

  const floorplanData = {
    C: {
      1: {
        scene: "scene_floorplan_villa_c_floor_1",
        image: `${themeURL}/assets/images/floorplan/C/Villa_C_F1.png`,
        markers: [
          {
            id: "c-1-entrance",
            x: 50,
            y: 90,
            radar: 0,
            sortOrder: 1,
            scene: "scene_floorplan_villa_c_floor_1" // 360_View01_Mat Tien
          },
          {
            id: "c-1-front",
            x: 50.33,
            y: 66.54,
            radar: 0,
            sortOrder: 9,
            scene: "scene_floorplan_villa_c_floor_1_front" // 360_View09_Tien sanh
          },
          {
            id: "c-1-living",
            x: 37.2,
            y: 51.07,
            radar: -180,
            sortOrder: 2,
            scene: "scene_floorplan_villa_c_floor_1_living" // 360_View02_Phong khach
          },
          {
            id: "c-1-05",
            x: 62.33,
            y: 55.54,
            radar: 0,
            sortOrder: 5,
            scene: "scene_floorplan_villa_c_floor_1_05" // 360_View09_Tien sanh
          },
          {
            id: "c-1-07",
            x: 55,
            y: 15.78,
            radar: -160,
            sortOrder: 7,
            scene: "scene_floorplan_villa_c_floor_1_07" // 360_View02_Phong khach
          },
          {
            id: "c-1-08",
            x: 49.6,
            y: 75.68,
            radar: 0,
            sortOrder: 8,
            scene: "scene_360_view08_c_san_truoc" // Villa C Floor 1 View 08
          }
        ]
      },
      2: {
        scene: "scene_floorplan_villa_c_floor_2",
        image: `${themeURL}/assets/images/floorplan/C/Villa_C_F2.png`,
        markers: [
          {
            id: "c-2-master",
            x: 38,
            y: 49.57,
            radar: 0,
            sortOrder: 4,
            scene: "scene_floorplan_villa_c_floor_2" // 360_View04_Phong master
          },
          {
            id: "c-2-bed",
            x: 62.33,
            y: 54.28,
            radar: 0,
            sortOrder: 6,
            scene: "scene_floorplan_villa_c_floor_2_bed" // 360_View06_Phong ngu tang 2
          },
          {
            id: "c-2-bancol",
            x: 38.33,
            y: 39.67,
            radar: 0,
            sortOrder: 10,
            scene: "scene_floorplan_villa_c_floor_2_balcony" // 360_View10_Ban cong tang 2
          },
          {
            id: "c-2-03",
            x: 35.6,
            y: 64.37,
            radar: 0,
            sortOrder: 3,
            scene: "scene_360_view03_c_phong_master_wc" // Villa C Floor 2 View 03
          }
        ]
      }
    },
    D: {
      1: {
        scene: "scene_260619_vr360_villad1_11_v01",
        image: `${themeURL}/assets/images/floorplan/D/Villa_D_F1.png`,
        markers: [
          {
            id: "d-1-front",
            x: 50,
            y: 90,
            radar: 0,
            sortOrder: 1,
            scene: "scene_260619_vr360_villad1_11_v01" // 260619_VR360_VillaD1.11_V01
          },
          {
            id: "d-1-lounge",
            x: 50.67,
            y: 68.42,
            radar: 0,
            sortOrder: 3,
            scene: "scene_260619_vr360_villad1_11_v03" // 260619_VR360_VillaD1.11_V03
          },
          {
            id: "d-1-garden",
            x: 41.67,
            y: 58.05,
            radar: 180,
            sortOrder: 7,
            scene: "scene_260619_vr360_villad1_11_v07" // 260619_VR360_VillaD1.11_V07
          },
          {
            id: "d-1-8",
            x: 37.67,
            y: 49.57,
            radar: 180,
            sortOrder: 8,
            scene: "scene_260619_vr360_villad1_11_v08" // 260619_VR360_VillaD1.11_V08
          },
          {
            id: "d-1-10",
            x: 60.67,
            y: 35.32,
            radar: 210,
            sortOrder: 10,
            scene: "scene_260617_vr360_villad1_11_v10" // 260619_VR360_VillaD1.11_V10
          },
          {
            id: "d-1-11",
            x: 62,
            y: 54.18,
            radar: 0,
            sortOrder: 11,
            scene: "scene_260619_vr360_villad1_11_v11" // 260619_VR360_VillaD1.11_V11
          },
          {
            id: "d-1-02",
            x: 49.2,
            y: 76.24,
            radar: 180,
            sortOrder: 2,
            scene: "scene_vr360_villad1_11_v02" // Villa D Floor 1 View 02
          },
          {
            id: "d-1-04",
            x: 51.2,
            y: 58.71,
            radar: 0,
            sortOrder: 4,
            scene: "scene_vr360_villad1_11_v04" // Villa D Floor 1 View 04
          },
          {
            id: "d-1-05",
            x: 50.8,
            y: 11.76,
            radar: 180,
            sortOrder: 5,
            scene: "scene_vr360_villad1_11_v05" // Villa D Floor 1 View 05
          },
          {
            id: "d-1-06",
            x: 37.6,
            y: 64.37,
            radar: 180,
            sortOrder: 6,
            scene: "scene_vr360_villad1_11_v06" // Villa D Floor 1 View 06
          },
          {
            id: "d-1-09",
            x: 39.6,
            y: 24.77,
            radar: -180,
            sortOrder: 9,
            scene: "scene_vr360_villad1_11_v09" // Villa D Floor 1 View 09
          },
          {
            id: "d-1-12",
            x: 59.2,
            y: 73.42,
            radar: 180,
            sortOrder: 12,
            scene: "scene_vr360_villad1_11_v12" // Villa D Floor 1 View 12
          },
          {
            id: "d-1-13",
            x: 62,
            y: 81.22,
            radar: 180,
            sortOrder: 13,
            scene: "scene_vr360_villad1_11_v13" // Villa D Floor 1 View 13
          }
        ]
      },
      2: {
        scene: "scene_260619_vr360_villad1_11_v14",
        image: `${themeURL}/assets/images/floorplan/D/Villa_D_F2.png`,
        markers: [
          {
            id: "d-2-master",
            x: 51.33,
            y: 68.66,
            radar: 250,
            sortOrder: 14,
            scene: "scene_260619_vr360_villad1_11_v14" // 260619_VR360_VillaD1.11_V14
          },
          {
            id: "d-2-bath",
            x: 41.33,
            y: 78.32,
            radar: 180,
            sortOrder: 15,
            scene: "scene_260619_vr360_villad1_11_v15" // 260619_VR360_VillaD1.11_V15
          },
          {
            id: "d-2-balcony",
            x: 37.33,
            y: 61.59,
            radar: 0,
            sortOrder: 16,
            scene: "scene_260619_vr360_villad1_11_v16" // 260619_VR360_VillaD1.11_V16
          },
          {
            id: "d-2-18",
            x: 42,
            y: 46.55,
            radar: 0,
            sortOrder: 18,
            scene: "scene_260617_vr360_villad1_11_v18" // 260619_VR360_VillaD1.11_V18
          },
          {
            id: "d-2-19",
            x: 62.4,
            y: 56.16,
            radar: 0,
            sortOrder: 19,
            scene: "scene_260619_vr360_villad1_11_v19" // 260619_VR360_VillaD1.11_V19
          },
          {
            id: "d-2-17",
            x: 40,
            y: 52.49,
            radar: 90,
            sortOrder: 17,
            scene: "scene_vr360_villad1_11_v17" // Villa D Floor 2 View 17
          },
          {
            id: "d-2-20",
            x: 64,
            y: 64.93,
            radar: 0,
            sortOrder: 20,
            scene: "scene_vr360_villad1_11_v20" // Villa D Floor 2 View 20
          }
        ]
      }
    },
    F: {
      1: {
        scene: "scene_360_villaf_view11_lanscape_truoc_nha_copy",
        image: `${themeURL}/assets/images/floorplan/F/Villa_F_F1.png`,
        markers: [
          {
            id: "f-1-entry",
            x: 55,
            y: 85,
            radar: 90,
            sortOrder: 11,
            scene: "scene_360_villaf_view11_lanscape_truoc_nha_copy" // 360_VillaF_View11_Lanscape truoc nha copy
          },
          {
            id: "f-1-pool",
            x: 42,
            y: 61.25,
            radar: 40,
            sortOrder: 5,
            scene: "scene_360_villaf_view05_phong_bep_copy" // 360_VillaF_View05_Phong Bep copy
          },
          {
            id: "f-1-dining",
            x: 42.8,
            y: 49.94,
            radar: -90,
            sortOrder: 4,
            scene: "scene_360_villaf_view04_phong_khach_copy" // 360_VillaF_View04_Phong Khach copy
          },
          {
            id: "f-1-gym",
            x: 66.4,
            y: 83.03,
            radar: 180,
            sortOrder: 12,
            scene: "scene_360_villaf_view12_p_gym_copy" // 360_VillaF_View12_P gym copy
          },
          {
            id: "f-1-3",
            x: 63.6,
            y: 37.78,
            radar: 235,
            sortOrder: 3,
            scene: "scene_360_villaf_view3_vuon_canh_be_boi_copy" // 360_VillaF_View12_P gym copy
          },
          {
            id: "f-1-7",
            x: 54,
            y: 70.02,
            radar: 255,
            sortOrder: 7,
            scene: "scene_360_villaf_view07_sanh_truoc_copy" // 360_VillaF_View12_P gym copy
          },
          {
            id: "f-1-01",
            x: 55.2,
            y: 13.74,
            radar: 0,
            sortOrder: 1,
            scene: "scene_360_villaf_view01_khu_camping_copy" // Villa F Floor 1 View 01
          },
          {
            id: "f-1-02",
            x: 47.2,
            y: 24.21,
            radar: 90,
            sortOrder: 2,
            scene: "scene_360_villaf_view02_khu_bbq_copy" // Villa F Floor 1 View 02
          },
          {
            id: "f-1-06",
            x: 54.8,
            y: 63.8,
            radar: 0,
            sortOrder: 6,
            scene: "scene_360_villaf_view06_canh_ho_boi_copy" // Villa F Floor 1 View 06
          },
          {
            id: "f-1-08",
            x: 64,
            y: 65.5,
            radar: 90,
            sortOrder: 8,
            scene: "scene_360_villaf_view08_p_ngu_tang_1_copy" // Villa F Floor 1 View 08
          },
          {
            id: "f-1-09",
            x: 64,
            y: 72,
            radar: 90,
            sortOrder: 9,
            scene: "scene_360_villaf_view09_wc_p_ngu_tang_1_copy" // Villa F Floor 1 View 09
          },
          {
            id: "f-1-10",
            x: 53.6,
            y: 75.98,
            radar: 90,
            sortOrder: 10,
            scene: "scene_360_villaf_view10_sanh_sau_copy" // Villa F Floor 1 View 10
          },
          {
            id: "f-1-13",
            x: 52,
            y: 94.06,
            radar: 0,
            sortOrder: 13,
            scene: "scene_360_villaf_view13_ngoai_duong_copy" // Villa F Floor 1 View 13
          }
        ]
      },
      2: {
        scene: "scene_360_villaf_view18_pngu_tang2_2",
        image: `${themeURL}/assets/images/floorplan/F/Villa_F_F2.png`,
        markers: [
          {
            id: "f-2-master",
            x: 66,
            y: 60,
            radar: 180,
            sortOrder: 18,
            scene: "scene_360_villaf_view18_pngu_tang2_2" // 360_VillaF_View18_Pngu_Tang2_2
          },
          {
            id: "f-2-family",
            x: 53,
            y: 64,
            radar: 180,
            sortOrder: 19,
            scene: "scene_360_villaf_view19_p_family_room_tang2" // 360_VillaF_View19_P Family room_Tang2
          },
          {
            id: "f-2-16",
            x: 38.4,
            y: 67.48,
            radar: 0,
            sortOrder: 16,
            scene: "scene_360_villaf_view16_p_thay_do" // 360_VillaF_View19_P Family room_Tang2
          },
          {
            id: "f-2-17",
            x: 46,
            y: 57.88,
            radar: 0,
            sortOrder: 17,
            scene: "scene_360_villaf_view17_p_ngu_master" // 360_VillaF_View19_P Family room_Tang2
          },
          {
            id: "f-2-20",
            x: 43.6,
            y: 76.24,
            radar: 180,
            sortOrder: 20,
            scene: "scene_360_villaf_view20_p_ngu_2_tang2" // 360_VillaF_View19_P Family room_Tang2
          },
          {
            id: "f-2-14",
            x: 44.04,
            y: 46.55,
            radar: 90,
            sortOrder: 14,
            scene: "scene_360_villaf_view14_ban_cong_tang2_copy" // Villa F Floor 2 View 14
          },
          {
            id: "f-2-15",
            x: 40,
            y: 53.62,
            radar: 0,
            sortOrder: 15,
            scene: "scene_360_villaf_view15_wc_p_ngu_master" // Villa F Floor 2 View 15
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
  let galleryVilla = null;

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
    $page.find("[data-floorplan-floor-label]").text(`Floor ${state.floor}`);
  }

  function renderPlan(floorData) {
    const markers = sortMarkersForVilla(state.villa, floorData.markers);
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
      skin_btn_prev: `${themeURL}/vtour/skin/icon/arrow-left.svg`,
      skin_btn_thumbs: `${themeURL}/vtour/skin/icon/filter.svg`,
      skin_btn_left: `${themeURL}/vtour/skin/icon/arrow-left.svg`,
      skin_btn_right: `${themeURL}/vtour/skin/icon/arrow-right.svg`,
      skin_btn_up: `${themeURL}/vtour/skin/icon/arrow-up.svg`,
      skin_btn_down: `${themeURL}/vtour/skin/icon/arrow-down.svg`,
      skin_btn_in: `${themeURL}/vtour/skin/icon/plus.svg`,
      skin_btn_out: `${themeURL}/vtour/skin/icon/minus.svg`,
      skin_btn_gyro: `${themeURL}/vtour/skin/icon/hotpot.svg`,
      skin_btn_vr: `${themeURL}/vtour/skin/icon/vr.svg`,
      skin_btn_fs: `${themeURL}/vtour/skin/icon/zoom.svg`,
      skin_btn_hide: `${themeURL}/vtour/skin/icon/arrow-down.svg`,
      skin_btn_show_icon: `${themeURL}/vtour/skin/icon/arrow-up.svg`,
      skin_btn_next: `${themeURL}/vtour/skin/icon/arrow-right.svg`
    };

    Object.entries(controlIcons).forEach(([layerName, iconUrl]) => {
      setControlIcon(layerName, iconUrl);
    });

    krpano.set("layer[skin_layer].visible", true);
    krpano.set("layer[skin_splitter_bottom].visible", true);
    krpano.set("layer[skin_control_bar_bg].visible", true);
    krpano.set("layer[skin_control_bar].visible", true);
    krpano.set("layer[skin_control_bar].alpha", 1);
    krpano.set("layer[skin_control_bar_buttons].visible", true);
    krpano.set("layer[skin_btn_navi].visible", true);
    krpano.set(
      "layer[skin_btn_prev].onclick",
      "js(window.floorplanGoSibling(-1));"
    );
    krpano.set(
      "layer[skin_btn_next].onclick",
      "js(window.floorplanGoSibling(1));"
    );
    applyFloorplanControlLayout();
  }

  function setControlIcon(layerName, iconUrl) {
    if (!krpano) return;

    krpano.set(`layer[${layerName}].url`, iconUrl);
    krpano.set(`layer[${layerName}].crop`, "");
    krpano.set(`layer[${layerName}].width`, 23);
    krpano.set(`layer[${layerName}].height`, 23);
    krpano.set(`layer[${layerName}].scale`, 1);
  }

  function applyFloorplanControlLayout() {
    if (!krpano) return;

    const isMobile = window.matchMedia("(max-width: 575px)").matches;

    if (!isMobile) {
      setControlLayerWidth(-24);
      setControlButtonVisibility(
        [
          "skin_btn_navi",
          "skin_btn_left",
          "skin_btn_right",
          "skin_btn_up",
          "skin_btn_down",
          "skin_btn_in",
          "skin_btn_out",
          "skin_btn_fs",
          "skin_btn_hide"
        ],
        true
      );
      setControlButtonPosition("skin_btn_prev", "left", 5);
      setControlButtonPosition("skin_btn_thumbs", "left", 50);
      setControlButtonPosition("skin_btn_navi", "center", 0);
      krpano.set("layer[skin_btn_navi].width", 240);
      setControlButtonPosition("skin_btn_left", "center", -100);
      setControlButtonPosition("skin_btn_right", "center", -60);
      setControlButtonPosition("skin_btn_up", "center", -20);
      setControlButtonPosition("skin_btn_down", "center", 20);
      setControlButtonPosition("skin_btn_in", "center", 60);
      setControlButtonPosition("skin_btn_out", "center", 100);
      setControlButtonPosition("skin_btn_fs", "right", 90);
      setControlButtonPosition("skin_btn_hide", "right", 50);
      setControlButtonPosition("skin_btn_next", "right", 5);
      return;
    }

    const controlWidth = Math.min(270, Math.max(232, window.innerWidth - 16));
    const iconSize = 23;
    const outerPadding = 8;
    const gap = 9;
    const step = iconSize + gap;
    const buttonCount = 7;
    const buttonGroupWidth = iconSize * buttonCount + gap * (buttonCount - 1);
    const firstButtonX = Math.max(
      outerPadding,
      (controlWidth - buttonGroupWidth) / 2
    );
    const navStart = firstButtonX + step * 2;
    const rightStart = firstButtonX + step * 4;
    const navWidth = iconSize * 2 + gap;
    const panButtonNames = [
      "skin_btn_left",
      "skin_btn_right",
      "skin_btn_up",
      "skin_btn_down",
      "skin_btn_map",
      "skin_btn_gyro",
      "skin_btn_vr"
    ];

    setControlLayerWidth(controlWidth);
    setControlButtonVisibility(panButtonNames, false);
    setControlButtonPosition("skin_btn_prev", "left", firstButtonX);
    setControlButtonPosition("skin_btn_thumbs", "left", firstButtonX + step);
    setControlButtonPosition("skin_btn_navi", "left", navStart);
    krpano.set("layer[skin_btn_navi].width", navWidth);

    setControlButtonPosition("skin_btn_in", "center", -step / 2);
    setControlButtonPosition("skin_btn_out", "center", step / 2);

    setControlButtonPosition("skin_btn_fs", "left", rightStart);
    setControlButtonPosition("skin_btn_hide", "left", rightStart + step);
    setControlButtonPosition("skin_btn_next", "left", rightStart + step * 2);
  }

  function setControlLayerWidth(width) {
    krpano.set("skin_settings.controlbar_width", width);
    krpano.set("layer[skin_scroll_layer].width", width);
    krpano.set("layer[skin_control_bar_bg].width", width);
    krpano.set("layer[skin_control_bar].width", width);
    krpano.set("layer[skin_control_bar_buttons].width", "100%");
    krpano.set("layer[skin_btn_show].width", "100%");
  }

  function setControlButtonPosition(layerName, align, x) {
    krpano.set(`layer[${layerName}].align`, align);
    krpano.set(`layer[${layerName}].x`, Math.round(x));
  }

  function setControlButtonVisibility(layerNames, isVisible) {
    layerNames.forEach((layerName) => {
      krpano.set(`layer[${layerName}].visible`, isVisible);
    });
  }

  function syncFullscreenIcon() {
    setControlIcon("skin_btn_fs", `${themeURL}/vtour/skin/icon/zoom.svg`);
    applyFloorplanControlLayout();
  }

  function queueFullscreenIconSync() {
    [0, 80, 240].forEach((delay) => {
      setTimeout(syncFullscreenIcon, delay);
    });
  }

  function queueSceneActivation(sceneName) {
    clearTimeout(sceneActivationTimer);
    loadScene(sceneName);

    sceneActivationTimer = setTimeout(() => {
      const currentScene = getInitialSceneForFloor(
        state.villa,
        getFloorData(state.villa, state.floor)
      );
      if (currentScene === sceneName) loadScene(sceneName);
    }, 300);
  }

  function rebuildControlThumbs() {
    if (!krpano) return;

    krpano.set("layer[skin_thumbborder].parent", null);
    krpano.set("layer[skin_thumbborder].visible", false);

    const layerCount = parseInt(krpano.get("layer.count"), 10) || 0;
    for (let index = layerCount - 1; index >= 0; index -= 1) {
      const layerName = krpano.get(`layer[${index}].name`);
      if (layerName && layerName.indexOf("skin_thumb_") === 0) {
        krpano.call(`removelayer(${layerName}, true);`);
      }
    }

    krpano.call(
      "skin_addthumbs(); skin_onresize(); skin_updatethumbsview(false);"
    );
    sortControlThumbs();
    setTimeout(sortControlThumbs, 80);
    setTimeout(sortControlThumbs, 240);
  }

  function sortControlThumbs() {
    if (!krpano) return;

    const orderedScenes = getSortedSceneNamesForVilla(state.villa);
    const thumbWidth =
      parseFloat(krpano.get("skin_settings.thumbs_width")) || 120;
    const thumbPadding =
      parseFloat(krpano.get("skin_settings.thumbs_padding")) || 10;
    const thumbXOffset = thumbWidth + thumbPadding;
    const thumbXCenter = thumbXOffset * 0.5;

    orderedScenes.forEach((sceneName, index) => {
      const scene = krpano.get(`scene[${sceneName}]`);
      const thumbUrl = krpano.get(`scene[${sceneName}].thumburl`);
      if (!scene || !thumbUrl) return;

      const thumbLayer = `skin_thumb_${index}`;
      const x = thumbPadding + index * thumbXOffset;
      krpano.set(`thumbarray[${index}]`, scene);
      krpano.set(`thumbarray[${index}].name`, sceneName);
      krpano.set(`scene[${sceneName}].thumbindex`, index);
      krpano.set(`layer[${thumbLayer}].x`, x);
      krpano.set(`layer[${thumbLayer}].url`, thumbUrl);
      krpano.set(`layer[${thumbLayer}].linkedscene`, sceneName);
      krpano.set(`layer[${thumbLayer}].visible`, true);
      krpano.set(`scene[${sceneName}].thumbx`, x + thumbXCenter);
      krpano.set(`scene[${sceneName}].thumby`, thumbPadding);

      const thumbTextLayer = `skin_thumbtext_${index}`;
      if (krpano.get(`layer[${thumbTextLayer}]`)) {
        krpano.set(
          `layer[${thumbTextLayer}].html`,
          krpano.get(`scene[${sceneName}].title`)
        );
      }
    });
  }

  function syncGalleryThumbs({ force = false } = {}) {
    if (!krpano) return;
    if (!force && galleryVilla === state.villa) return;

    const activeScenes = new Set();
    Object.values(getVillaData(state.villa)).forEach((floorData) => {
      activeScenes.add(floorData.scene);
      sortMarkersForVilla(state.villa, floorData.markers).forEach((marker) => {
        activeScenes.add(marker.scene);
      });
    });

    Object.entries(floorplanData).forEach(([villa, villaData]) => {
      Object.values(villaData).forEach((floorData) => {
        const scenes = [floorData.scene].concat(
          sortMarkersForVilla(villa, floorData.markers).map(
            (marker) => marker.scene
          )
        );

        scenes.forEach((sceneName) => {
          krpano.set(
            `scene[${sceneName}].skipthumb`,
            !activeScenes.has(sceneName)
          );
        });
      });
    });

    rebuildControlThumbs();
    galleryVilla = state.villa;
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

    window.floorplanHandleFullscreenChange = function () {
      queueFullscreenIconSync();
    };

    window.floorplanGoSibling = function (indexAdd) {
      const orderedScenes = getSortedSceneNamesForVilla(state.villa);
      const currentScene = krpano.get("xml.scene");
      const currentIndex = orderedScenes.indexOf(currentScene);
      const fallbackIndex = indexAdd > 0 ? -1 : 0;
      const sceneIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
      const nextIndex =
        (sceneIndex + indexAdd + orderedScenes.length) % orderedScenes.length;
      const nextScene = orderedScenes[nextIndex];

      if (nextScene) {
        loadScene(nextScene);
        syncFloorplanFromScene(nextScene);
      }
    };

    krpano.set("events[floorplan_events].keep", true);
    krpano.set(
      "events[floorplan_events].onnewscene",
      "js(window.floorplanHandleSceneChange());"
    );
    krpano.set(
      "events[floorplan_events].onenterfullscreen",
      "js(window.floorplanHandleFullscreenChange());"
    );
    krpano.set(
      "events[floorplan_events].onexitfullscreen",
      "js(window.floorplanHandleFullscreenChange());"
    );
  }

  function applyState({ shouldUpdateUrl = true } = {}) {
    const floorData = getFloorData(state.villa, state.floor);
    const sceneName = getInitialSceneForFloor(state.villa, floorData);

    updateButtons();
    renderPlan(floorData);
    syncGalleryThumbs();
    queueSceneActivation(sceneName);

    if (shouldUpdateUrl) updateUrl();
  }

  function embedFloorplan() {
    if (typeof embedpano !== "function") return;

    embedpano({
      target: "floorplan-vtour",
      xml: `${themeURL}/vtour/floorplan.xml?v=floorplan-scenes-21`,
      html5: "only",
      mobilescale: 1,
      vars: {
        startscene: getInitialSceneForFloor(
          state.villa,
          getFloorData(state.villa, state.floor)
        )
      },
      passQueryParameters: false,
      onready(pano) {
        krpano = pano;
        window.floorplanKrpano = krpano;
        bindKrpanoSceneSync();
        startRadar();
        applyState({ shouldUpdateUrl: false });
      }
    });
  }

  $(window).on("resize.floorplanControl", function () {
    applyFloorplanControlLayout();
  });

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

  $page.on("click", "[data-floorplan-dropdown-toggle]", function (event) {
    event.stopPropagation();
    const $dropdown = $(this).closest("[data-floorplan-dropdown]");
    const isOpen = !$dropdown.hasClass("is-open");

    $dropdown.toggleClass("is-open", isOpen);
    $(this).attr("aria-expanded", String(isOpen));
  });

  $page.on("click", "[data-floorplan-villa]", function () {
    state.villa = normalizeVilla($(this).data("floorplanVilla"));
    state.floor = normalizeFloor(state.villa, defaultState.floor);
    activeMarkerId = null;
    applyState();
  });

  $page.on("click", "[data-floorplan-floor]", function () {
    state.floor = normalizeFloor(state.villa, $(this).data("floorplanFloor"));
    activeMarkerId = null;
    applyState();
    $page.find("[data-floorplan-dropdown]").removeClass("is-open");
    $page
      .find("[data-floorplan-dropdown-toggle]")
      .attr("aria-expanded", "false");
  });

  $(document).on("click.floorplanDropdown", function (event) {
    if ($(event.target).closest("[data-floorplan-dropdown]").length) return;

    $page.find("[data-floorplan-dropdown]").removeClass("is-open");
    $page
      .find("[data-floorplan-dropdown-toggle]")
      .attr("aria-expanded", "false");
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

function desktopExperienceModal() {
  const modal = document.querySelector("[data-desktop-experience-modal]");
  if (!modal) return;

  const desktopQuery = window.matchMedia("(min-width: 1024px)");
  if (desktopQuery.matches) return;

  const showTimer = window.setTimeout(() => {
    modal.classList.add("show");
  }, 1000);

  const closeModal = () => {
    window.clearTimeout(showTimer);
    modal.classList.remove("show");
  };

  modal
    .querySelectorAll("[data-desktop-experience-close]")
    .forEach((button) => {
      button.addEventListener("click", closeModal);
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });
}

function headerMenuToggle() {
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-header-menu-toggle]");
    const headerMenu = event.target.closest(".header-menu");

    if (toggle) {
      const menu = toggle.closest(".header-menu");
      const isOpen = toggle.getAttribute("aria-expanded") !== "true";
      menu.classList.toggle("is-menu-open", isOpen);
      menu.closest(".header")?.classList.toggle("is-menu-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      return;
    }

    if (!headerMenu) {
      document.querySelectorAll(".header-menu.is-menu-open").forEach((menu) => {
        menu.classList.remove("is-menu-open");
        menu.closest(".header")?.classList.remove("is-menu-open");
        const menuToggle = menu.querySelector("[data-header-menu-toggle]");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open menu");
      });
      return;
    }

    if (event.target.closest(".header-menu ul a")) {
      headerMenu.classList.remove("is-menu-open");
      headerMenu.closest(".header")?.classList.remove("is-menu-open");
      const menuToggle = headerMenu.querySelector("[data-header-menu-toggle]");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Open menu");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".header-menu.is-menu-open").forEach((menu) => {
      menu.classList.remove("is-menu-open");
      menu.closest(".header")?.classList.remove("is-menu-open");
      const menuToggle = menu.querySelector("[data-header-menu-toggle]");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Open menu");
    });
  });
}

$(function () {
  floorPlan();
  desktopExperienceModal();
  headerMenuToggle();
});
