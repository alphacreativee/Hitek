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

function sectionOverview() {
  if ($("section.overview").length < 1) return;

  const toggleInput = $(".overview-switcher .toggle-checkbox");
  const embeddedVtours = new Set();

  function setupOverviewVtour(krpano, sceneName) {
    krpano.call(`loadscene(${sceneName}, null, MERGE, BLEND(0))`);
    krpano.set("autorotate.enabled", true);
    krpano.set("autorotate.waittime", 5);
    krpano.set("autorotate.accel", 0.25);
    krpano.set("autorotate.speed", 1);
    krpano.set("autorotate.horizon", 0);
    krpano.set("autorotate.tofov", "off");
    krpano.call(
      "delayedcall(overview_hide_skin, 0.2, " +
        "set(layer[skin_layer].visible,false);" +
        "set(layer[skin_control_bar].visible,false);" +
        "set(layer[skin_control_bar_bg].visible,false);" +
        "set(layer[skin_btn_show].visible,false);" +
        "set(layer[skin_btn_prev_fs].visible,false);" +
        "set(layer[skin_btn_next_fs].visible,false);" +
      ");"
    );
  }

  function embedOverviewVtour($item) {
    const vtourEl = $item.find("[data-vtour-scene]")[0];
    if (!vtourEl || embeddedVtours.has(vtourEl.id)) return;
    if (typeof embedpano !== "function") return;

    embeddedVtours.add(vtourEl.id);

    embedpano({
      target: vtourEl.id,
      xml: "./vtour/overview.xml?v=overview-2",
      html5: "only",
      mobilescale: 1,
      passQueryParameters: false,
      onready(krpano) {
        setupOverviewVtour(krpano, vtourEl.dataset.vtourScene);
      }
    });
  }

  embedOverviewVtour($(".overview-main__light"));

  toggleInput.on("change", function () {
    const isDark = $(this).is(":checked");
    const theme = isDark ? "dark" : "light";

    $(".overview-main__item").removeClass("active");
    const $activeItem = $(`.overview-main__${theme}`);

    $activeItem.addClass("active");
    embedOverviewVtour($activeItem);
  });
}

function gallery() {
  const $gallery = $(".galleryTab");
  if ($gallery.length < 1) return;

  const $grid = $gallery.find("[data-gallery-list]");
  const $filters = $gallery.find(".filter-button[data-type]");
  let lightbox = null;

  function getVisibleItems() {
    return $grid.find(".gallery-item").filter(function () {
      return $(this).css("display") !== "none";
    });
  }

  function rebuildLightbox() {
    const elements = getVisibleItems()
      .map(function () {
        const $item = $(this);
        const $image = $item.find("img").first();
        const itemType = $item.data("type");
        const sourceType = $item.data("source");
        const isVideo = itemType === "video" || sourceType === "mp4" || sourceType === "youtube";
        const title =
          $item.data("gallery-title") ||
          $item.find(".gallery-caption").text().trim() ||
          $image.attr("alt") ||
          "";
        const lightboxItem = {
          href: $item.attr("href") || $image.attr("src"),
          type: isVideo ? "video" : "image",
          title
        };

        if (sourceType === "mp4") {
          lightboxItem.source = "local";
        } else if (sourceType === "youtube") {
          lightboxItem.source = "youtube";
        }

        return lightboxItem;
      })
      .get();

    if (lightbox) {
      lightbox.destroy();
    }

    lightbox = GLightbox({
      elements,
      touchNavigation: true,
      loop: true
    });
  }

  function filterGallery(type) {
    $grid.find(".gallery-item").each(function () {
      const $item = $(this);
      const isVisible = type === "type-all" || $item.hasClass(type);
      $item.toggle(isVisible);
    });

    rebuildLightbox();
  }

  filterGallery($filters.filter(".active").data("type") || "type-all");

  $filters.on("click.gallery", function () {
    const type = $(this).data("type");

    $filters.removeClass("active");
    $(this).addClass("active");

    gsap
      .timeline()
      .to($grid, { autoAlpha: 0, duration: 0.25 })
      .call(() => filterGallery(type))
      .to($grid, { autoAlpha: 1, duration: 0.25 });
  });

  $grid.on("click.gallery", ".gallery-item", function (event) {
    event.preventDefault();

    const visibleItems = getVisibleItems().toArray();
    const index = visibleItems.indexOf(this);
    if (index < 0) return;

    rebuildLightbox();
    lightbox.openAt(index);
  });
}

function initVillaCardSwiper(swiperEl, options = {}) {
  if (!swiperEl || swiperEl.swiper || typeof Swiper !== "function") return null;

  const media = swiperEl.closest(".villa-card__media");
  const paginationEl = media?.querySelector(
    ".villa-card__pagination, .slider-pagination, .dashboard-villa-pagination"
  );
  const hasPagination =
    swiperEl.hasAttribute("slider-pagination") || Boolean(paginationEl);
  const hasAutoplay =
    !swiperEl.hasAttribute("slider-no-autoplay") &&
    Boolean(swiperEl.closest(".villa-card"));

  return initParallaxSwiper(swiperEl, {
    autoplay: hasAutoplay
      ? {
          delay: 3500,
          disableOnInteraction: false
        }
      : false,
    pagination:
      hasPagination && paginationEl
        ? {
            el: paginationEl,
            clickable: true
          }
        : false,
    ...options
  });
}

function initVillaCardSwipers(root = document) {
  root.querySelectorAll(".villa-card [slider-parallax]").forEach((swiperEl) => {
    initVillaCardSwiper(swiperEl);
  });
}

window.initVillaCardSwiper = initVillaCardSwiper;
window.initVillaCardSwipers = initVillaCardSwipers;

function init() {
  gsap.registerPlugin(ScrollTrigger);
  customDropdown();
  createFilterTab();
  gallery();
  sectionOverview();
  initVillaCardSwipers();
  sliderParallax();
  // getDateLightPick();
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  initSwiper();
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
