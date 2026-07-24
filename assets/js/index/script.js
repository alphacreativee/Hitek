"use strict";
import {
  customDropdown,
  createFilterTab,
  getDateLightPick,
  sliderParallax
} from "../../main/js/global.min.js";

const $ = jQuery;

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

function initParallaxSwiper(swiperEl, options = {}) {
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

function initSwiper() {
  const containerSwiperEl = document.querySelector(".container-swiper");

  if (containerSwiperEl) {
    const swiperEl = containerSwiperEl.querySelector(".swiper-el-parallax");

    if (swiperEl) {
      initParallaxSwiper(swiperEl, {
        navigation: {
          nextEl: containerSwiperEl.querySelector(".swiper-button-next"),
          prevEl: containerSwiperEl.querySelector(".swiper-button-prev")
        }
      });
    }
  }
}

function initZoningCardSlider() {
  document.querySelectorAll(".zoning-card [slider-parallax]").forEach((swiperEl) => {
    if (swiperEl.swiper) return;

    initParallaxSwiper(swiperEl, {
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

function sectionOverview() {
  if ($("section.overview").length < 1) return;

  const toggleInput = $(".overview-switcher .toggle-checkbox");

  toggleInput.on("change", function () {
    const isDark = $(this).is(":checked");
    const theme = isDark ? "dark" : "light";

    $(".overview-main__item").removeClass("active");
    $(`.overview-main__${theme}`).addClass("active");
  });
}

function zoningFilter(zoningEl) {
  const filterToggles = zoningEl.querySelectorAll(
    "[data-zoning-filter-toggle]"
  );
  if (!filterToggles.length) return;

  let filterTimer = null;

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

function zoningLots(zoningEl) {
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

  const getLotAreaKey = (title) => title.match(/^[A-Z]/)?.[0] || "";
  const getLotUrl = (title) => `./floor-plan.html?villa=${encodeURIComponent(title)}`;
  const getLotGallery = (title) => villaGalleries[title] || villaGalleries.default;

  const selectLot = (path) => {
    const title = path.dataset.title;
    if (!title) return;
    const data = villaDataByName.get(title) || {
      id: "",
      name: title,
      villa: getLotAreaKey(title),
      bedroom: "",
      floor_area: "",
      view: "",
      detail_url: getLotUrl(title)
    };

    selectedPath?.classList.remove("is-selected");
    selectedPath = path;
    selectedPath.classList.add("is-selected");

    if (cardArea) cardArea.textContent = data.villa ? `Area ${data.villa}` : "Area";
    if (cardTitle) cardTitle.textContent = data.name || title;
    if (cardMeta) {
      const floorPlan = data.floor_area ? `${data.floor_area} sqm` : "";
      cardMeta.innerHTML = `
        <li>Floor plan: ${floorPlan}</li>
        <li>View: ${data.view || ""}</li>
        <li>Bedroom: ${data.bedroom || ""}</li>
      `;
    }
    if (cardDetail) cardDetail.href = data.detail_url || getLotUrl(title);
    if (cardCompare) cardCompare.dataset.id = data.id || "";
    updateCardGallery(getLotGallery(title));
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

    initParallaxSwiper(cardSlider, {
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

  const createLotLabels = (svg) => {
    if (!labels) return;

    labels.innerHTML = "";
    const viewBox = svg.viewBox.baseVal;
    if (!viewBox.width || !viewBox.height) return;

    svg.querySelectorAll("path[data-title]").forEach((path) => {
      const title = path.dataset.title;
      if (!title) return;

      const box = path.getBBox();
      const area = getLotAreaKey(title);
      const label = document.createElement("span");
      label.textContent = title;
      label.dataset.title = title;
      label.dataset.villa = area;
      label.style.left = `${((box.x + box.width / 2 - viewBox.x) / viewBox.width) * 100}%`;
      label.style.top = `${((box.y + box.height / 2 - viewBox.y) / viewBox.height) * 100}%`;
      label.style.setProperty("--label-rotate", `${getPathLabelAngle(path)}deg`);
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
      overlay.innerHTML = svgText;
      const svg = overlay.querySelector("svg");
      if (!svg) return;

      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      svg.setAttribute("aria-hidden", "true");
      createLotLabels(svg);
      svg.querySelectorAll("path[data-title]").forEach((path, index) => {
        const area = getLotAreaKey(path.dataset.title || "");
        const color = lotColors[area];
        if (color) {
          path.setAttribute("fill", color);
        }
        path.setAttribute("fill-opacity", "1");

        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-label", path.dataset.title);

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
    if (zoomOutBtn) zoomOutBtn.disabled = zoom <= minZoom;
    if (zoomInBtn) zoomInBtn.disabled = zoom >= maxZoom;
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
    if (event.target.closest?.("path[data-title]")) return;

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

function zoning() {
  const zoningEl = document.querySelector(".zoning");
  if (!zoningEl) return;

  zoningFilter(zoningEl);
  zoningLots(zoningEl);
  zoningScale(zoningEl);
}

function init() {
  gsap.registerPlugin(ScrollTrigger);
  customDropdown();
  createFilterTab();
  sectionOverview();
  zoning();
  sliderParallax();
  // getDateLightPick();
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  initSwiper();
  initZoningCardSlider();
});

let isLinkClicked = false;

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (
    link?.href &&
    !link.href.startsWith("#") &&
    !link.href.startsWith("javascript:")
  ) {
    isLinkClicked = true;
  }
});

// window.addEventListener("beforeunload", () => {
//   if (!isLinkClicked) window.scrollTo(0, 0);
//   isLinkClicked = false;
// });
// // ==== ĐỔI MẬT KHẨU Ở ĐÂY ====
// const CORRECT_PASSWORD = "hitek2026";
// const SESSION_KEY = "site_unlocked";

// const loginScreen = document.getElementById("login-screen");
// const passwordInput = document.getElementById("password-input");
// const loginBtn = document.getElementById("login-btn");
// const errorMsg = document.getElementById("error-msg");

// function unlockSite() {
//   loginScreen.style.display = "none";
//   sessionStorage.setItem(SESSION_KEY, "true");
//   removeInspectBlock(); // tắt chặn inspect sau khi login thành công
// }

// function checkPassword() {
//   if (passwordInput.value === CORRECT_PASSWORD) {
//     unlockSite();
//   } else {
//     errorMsg.style.display = "block";
//     passwordInput.value = "";
//     passwordInput.focus();
//   }
// }

// loginBtn.addEventListener("click", checkPassword);
// passwordInput.addEventListener("keydown", (e) => {
//   if (e.key === "Enter") checkPassword();
// });

// // Nếu đã từng nhập đúng trong phiên này (session) thì khỏi hỏi lại
// if (sessionStorage.getItem(SESSION_KEY) === "true") {
//   unlockSite();
// }

// // ============================================
// // CHẶN INSPECT NHẸ — CHỈ áp dụng khi CHƯA đăng
// // nhập. Sau khi login thành công sẽ tự động tắt
// // chặn, cho phép inspect bình thường trở lại.
// // (Chỉ cản người không rành kỹ thuật, KHÔNG phải
// // bảo mật thật sự — vẫn bypass được qua menu
// // trình duyệt hoặc view-source:)
// // ============================================

// function blockContextMenu(e) {
//   e.preventDefault();
// }

// function blockDevtoolsKeys(e) {
//   if (
//     e.key === "F12" ||
//     (e.ctrlKey &&
//       e.shiftKey &&
//       (e.key === "I" || e.key === "J" || e.key === "C")) ||
//     (e.ctrlKey && e.key === "u")
//   ) {
//     e.preventDefault();
//   }
// }

// function addInspectBlock() {
//   document.addEventListener("contextmenu", blockContextMenu);
//   document.addEventListener("keydown", blockDevtoolsKeys);
// }

// function removeInspectBlock() {
//   document.removeEventListener("contextmenu", blockContextMenu);
//   document.removeEventListener("keydown", blockDevtoolsKeys);
// }

// // Chỉ bật chặn ngay từ đầu nếu CHƯA từng đăng nhập trong phiên này
// if (sessionStorage.getItem(SESSION_KEY) !== "true") {
//   addInspectBlock();
// }
