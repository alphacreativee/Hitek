"use strict";

const $ = jQuery;

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

function createFilterTab() {
  document.querySelectorAll(".filter-section").forEach((section) => {
    let result;

    const targetSelector = section.dataset.target;
    if (targetSelector) {
      result = document.querySelector(targetSelector);
    } else {
      result = section.querySelector(".filter-section-result");
      if (!result) {
        result = section.nextElementSibling;
        if (!result?.classList.contains("filter-section-result")) return;
      }
    }

    if (!result) return;
    //check select tab
    const isSelectTab = section.classList.contains("select-tab");
    const buttons = section.querySelectorAll(".filter-button[data-type]");

    const activeBtn = section.querySelector(".filter-button.active");
    if (activeBtn) {
      const activeType = activeBtn.dataset.type;
      if (activeType !== "all") {
        result.querySelectorAll(".filter-item").forEach((item) => {
          item.style.display = item.classList.contains(activeType)
            ? ""
            : "none";
        });
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        section
          .querySelectorAll(".filter-button")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        const type = this.dataset.type;
        const items = result.querySelectorAll(".filter-item");

        gsap
          .timeline()
          .to(result, { autoAlpha: 0, duration: 0.3 })
          .call(() => {
            items.forEach((item) => {
              // Nếu là select-tab thì không có trường hợp "all" → luôn filter theo type
              if (!isSelectTab && type === "all") {
                item.style.display = "";
              } else {
                item.style.display = item.classList.contains(type)
                  ? ""
                  : "none";
              }
            });
          })
          .to(result, { autoAlpha: 1, duration: 0.3 });
      });
    });
  });
}

function sliderParallax() {
  if ($("[slider-parallax]").length < 1) return;

  console.log("hello");

  var interleaveOffset = 0.8;

  $("[slider-parallax]").each(function () {
    const swiperEl = this;
    if (swiperEl.getAttribute("slider-pagination") === "bullets") return;

    const $swiper = $(this);

    const hasAutoplay =
      window.innerWidth < 992
        ? false
        : swiperEl.hasAttribute("slider-autoplay");

    const hasNoDrag = swiperEl.hasAttribute("slider-no-drag");
    const hasChangeLabel = swiperEl.hasAttribute("slider-change-label");

    const $sliderTitle = $swiper.find(".slider-title");
    const $pagination = $swiper.find(".slider-pagination");

    const $wrapper = $swiper.closest(".wrapper-slider-parallax");
    const nextBtn = $wrapper.find(".arrow-next")[0];
    const prevBtn = $wrapper.find(".arrow-prev")[0];

    const hasArrow =
      swiperEl.hasAttribute("slider-arrow") && nextBtn && prevBtn;

    const swiper = new Swiper(swiperEl, {
      slidesPerView: 1,
      init: true,
      loop: true,
      speed: 1500,
      watchSlidesProgress: true,

      keyboard: !hasNoDrag,
      // mousewheel: !hasNoDrag,
      grabCursor: !hasNoDrag,
      allowTouchMove: hasNoDrag ? false : true,

      autoplay: hasAutoplay
        ? {
            delay: 4000,
            disableOnInteraction: true
          }
        : false,

      navigation: hasArrow
        ? {
            nextEl: nextBtn,
            prevEl: prevBtn
          }
        : false,
      on: {
        init(swiper) {
          if (hasChangeLabel) updateLabel(swiper);
        },

        slideChange(swiper) {
          if (hasChangeLabel) updateLabel(swiper);
        },

        progress: function (swiper) {
          swiper.slides.forEach(function (slide) {
            const slideProgress = slide.progress || 0;
            const innerOffset = swiper.width * interleaveOffset;
            const innerTranslate = slideProgress * innerOffset;

            if (!isNaN(innerTranslate)) {
              const slideInner = slide.querySelector(".image");
              if (slideInner) {
                slideInner.style.transform = `translate3d(${innerTranslate}px, 0, 0)`;
              }
            }
          });
        },

        touchStart: function (swiper) {
          swiper.slides.forEach(function (slide) {
            slide.style.transition = "";
          });
        },

        setTransition: function (swiper, speed) {
          const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)";

          swiper.slides.forEach(function (slide) {
            slide.style.transition = `${speed}ms ${easing}`;

            const slideInner = slide.querySelector(".image");
            if (slideInner) {
              slideInner.style.transition = `${speed}ms ${easing}`;
            }
          });
        }
      }
    });

    function updateLabel(swiper) {
      const realIndex = swiper.realIndex;

      const realSlides = swiper.el.querySelectorAll(
        ".swiper-slide:not(.swiper-slide-duplicate)"
      );

      const total = realSlides.length;
      const currentSlide = realSlides[realIndex];
      const title = currentSlide?.dataset?.title || "";

      if ($sliderTitle.length) {
        $sliderTitle.text(title);
      }

      if ($pagination.length) {
        $pagination.text(`${realIndex + 1}/${total}`);
      }
    }
  });

  // init on open modal
  document
    .querySelectorAll(".modal-accommodation-detail")
    .forEach((modalEl) => {
      modalEl.addEventListener("shown.bs.modal", () => {
        const swiperEl = modalEl.querySelector("[slider-parallax]");

        if (!swiperEl || !swiperEl.swiper) return;

        const swiper = swiperEl.swiper;

        swiper.update();
        swiper.updateSlides();
        swiper.updateProgress();
        swiper.slideToLoop(0, 0, false);
      });
    });
}

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
  const vtourInstances = new Map();
  const vtourDefaultFovs = new Map();
  const compassNeedle = document.querySelector(
    "[data-overview-compass-needle]"
  );
  const compassHeadingOffset = 90;
  let activeVtourId = "overview-vtour";
  let compassFrame = null;
  let overviewInfoSwiper = null;
  let overviewInfoSwiperTimer = null;

  const overviewInfo = document.querySelector("[data-overview-info]");
  const overviewInfoTitle = overviewInfo?.querySelector(
    "[data-overview-info-title]"
  );
  const overviewInfoDescription = overviewInfo?.querySelector(
    "[data-overview-info-description]"
  );
  const overviewInfoMedia = overviewInfo?.querySelector(
    "[data-overview-info-media]"
  );
  const overviewInfoClose = overviewInfo?.querySelector(
    "[data-overview-info-close]"
  );
  const overviewGuide = document.querySelector("[data-overview-guide]");
  const overviewGuideClose = overviewGuide?.querySelector(
    "[data-overview-guide-close]"
  );
  let overviewGuideTimer = null;
  const overviewInfoItems = new Map(
    Array.from(
      overviewInfo?.querySelectorAll(
        ".overview-info__item[data-hotspot-name]"
      ) || []
    ).map((item) => [item.dataset.hotspotName, item])
  );

  function destroyOverviewInfoSwiper() {
    if (overviewInfoSwiperTimer) {
      window.clearInterval(overviewInfoSwiperTimer);
      overviewInfoSwiperTimer = null;
    }

    if (!overviewInfoSwiper) return;

    overviewInfoSwiper.destroy(true, true);
    overviewInfoSwiper = null;
  }

  function renderOverviewInfoSlider(item) {
    const images = Array.from(item.querySelectorAll("img[src]"));
    if (!images.length || !overviewInfoMedia) return;

    const slider = document.createElement("div");
    slider.className = "overview-info__slider wrapper-slider-parallax";

    const swiperEl = document.createElement("div");
    swiperEl.className = "swiper";
    swiperEl.setAttribute("slider-parallax", "");

    const wrapper = document.createElement("div");
    wrapper.className = "swiper-wrapper";

    images.forEach((image) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      const imageWrap = document.createElement("div");
      imageWrap.className = "image";

      const mediaImage = document.createElement("img");
      mediaImage.src = image.getAttribute("src");
      mediaImage.alt = image.getAttribute("alt") || "";

      imageWrap.append(mediaImage);
      slide.append(imageWrap);
      wrapper.append(slide);
    });

    const pagination = document.createElement("div");
    pagination.className = "slider-pagination";

    swiperEl.append(wrapper);
    slider.append(swiperEl, pagination);
    overviewInfoMedia.append(slider);

    overviewInfoSwiper = initParallaxSwiper(swiperEl, {
      autoplay: {
        delay: 3200,
        disableOnInteraction: false
      },
      pagination: {
        el: pagination,
        clickable: true
      }
    });

    if (overviewInfoSwiper.autoplay?.start) {
      overviewInfoSwiper.autoplay.start();
    } else {
      overviewInfoSwiperTimer = window.setInterval(() => {
        overviewInfoSwiper?.slideNext?.();
      }, 3200);
    }
  }

  function renderOverviewInfoVideo(item) {
    const videoSrc = item.dataset.videoSrc;
    if (!videoSrc || !overviewInfoMedia) {
      renderOverviewInfoSlider(item);
      return;
    }

    const videoWrap = document.createElement("div");
    videoWrap.className = "overview-info__video";

    const video = document.createElement("video");
    video.autoplay = true;
    video.controls = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    if (item.dataset.videoPoster) {
      video.poster = item.dataset.videoPoster;
    }

    const source = document.createElement("source");
    source.src = videoSrc;
    source.type = "video/mp4";

    video.append(source);
    videoWrap.append(video);
    overviewInfoMedia.append(videoWrap);

    video.play().catch(() => {});
  }

  function getOverviewDefaultFov(krpano) {
    return (
      vtourDefaultFovs.get(activeVtourId) ||
      parseFloat(krpano.get("view.fov")) ||
      110
    );
  }

  function getOverviewVisibleCenterAth(ath, fov) {
    if (!overviewInfo) return ath;

    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const panelWidth = overviewInfo.getBoundingClientRect().width;
    if (!viewportWidth || !panelWidth || panelWidth >= viewportWidth)
      return ath;

    const coveredRatio = panelWidth / viewportWidth;
    return ath + (fov * coveredRatio) / 2;
  }

  function focusOverviewHotspot(detail = {}) {
    const krpano = vtourInstances.get(activeVtourId);
    if (!krpano) return;

    const ath = parseFloat(detail.ath);
    const atv = parseFloat(detail.atv);
    if (Number.isNaN(ath) || Number.isNaN(atv)) return;

    const defaultFov = getOverviewDefaultFov(krpano);
    const minFov = parseFloat(krpano.get("view.fovmin")) || 70;
    const targetFov = Math.max(minFov, defaultFov * 0.8);
    const targetAth = getOverviewVisibleCenterAth(ath, targetFov);

    krpano.call(
      `lookto(${targetAth}, ${atv}, ${targetFov}, smooth(260,-180,260), true, true);`
    );
  }

  function resetOverviewZoom() {
    const krpano = vtourInstances.get(activeVtourId);
    if (!krpano) return;

    const defaultFov = getOverviewDefaultFov(krpano);
    krpano.call(`tween(view.fov, ${defaultFov}, 0.55, easeOutQuad);`);
  }

  function openOverviewInfo(hotspotName) {
    if (!overviewInfo || !overviewInfoMedia) return;

    const normalizedHotspotName = String(hotspotName || "").replace(
      /_(dot|line)$/,
      ""
    );
    const item = overviewInfoItems.get(normalizedHotspotName);
    if (!item) return;

    destroyOverviewInfoSwiper();
    overviewInfoMedia.replaceChildren();

    if (overviewInfoTitle) {
      overviewInfoTitle.textContent = item.dataset.title || "";
    }

    if (overviewInfoDescription) {
      const description = item.querySelector(
        ".overview-info__item-description"
      );

      if (description) {
        overviewInfoDescription.innerHTML = description.innerHTML;
      } else {
        overviewInfoDescription.textContent = item.dataset.description || "";
      }
    }

    if (item.dataset.mediaType === "video") {
      renderOverviewInfoVideo(item);
    } else {
      renderOverviewInfoSlider(item);
    }

    overviewInfo.classList.add("is-open");
    overviewInfo.setAttribute("aria-hidden", "false");
  }

  function closeOverviewInfo() {
    if (!overviewInfo) return;

    overviewInfo.classList.remove("is-open");
    overviewInfo.setAttribute("aria-hidden", "true");
    destroyOverviewInfoSwiper();
    overviewInfoMedia?.replaceChildren();
    resetOverviewZoom();
  }

  window.addEventListener("overview:hotspot-click", (event) => {
    focusOverviewHotspot(event.detail);
    openOverviewInfo(event.detail?.name);
  });

  overviewInfoClose?.addEventListener("click", closeOverviewInfo);

  if (overviewGuide) {
    overviewGuideTimer = window.setTimeout(() => {
      overviewGuide.classList.add("is-visible");
    }, 2000);
  }

  overviewGuideClose?.addEventListener("click", () => {
    if (overviewGuideTimer) {
      window.clearTimeout(overviewGuideTimer);
      overviewGuideTimer = null;
    }

    overviewGuide?.classList.remove("is-visible");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overviewInfo?.classList.contains("is-open")) {
      closeOverviewInfo();
    }
  });

  function syncCompass() {
    const krpano = vtourInstances.get(activeVtourId);

    if (krpano && compassNeedle) {
      const hlookat = parseFloat(krpano.get("view.hlookat")) || 0;
      compassNeedle.style.transform = `rotate(${hlookat + compassHeadingOffset}deg)`;
    }

    compassFrame = window.requestAnimationFrame(syncCompass);
  }

  if (compassNeedle) {
    compassFrame = window.requestAnimationFrame(syncCompass);
  }

  function setupOverviewVtour(krpano, sceneName, vtourId) {
    krpano.call(`loadscene(${sceneName}, null, MERGE, BLEND(0))`);
    vtourDefaultFovs.set(vtourId, parseFloat(krpano.get("view.fov")) || 110);
    krpano.set("autorotate.enabled", false);
    krpano.call("autorotate.stop();");
    krpano.call(
      "set(layer[skin_layer].visible,false);" +
        "set(layer[skin_control_bar].visible,false);" +
        "set(layer[skin_control_bar_bg].visible,false);" +
        "set(layer[skin_btn_show].visible,false);" +
        "set(layer[skin_btn_prev_fs].visible,false);" +
        "set(layer[skin_btn_next_fs].visible,false);"
    );
  }

  const vtourEl = document.getElementById("overview-vtour");

  if (vtourEl && typeof embedpano === "function") {
    embedpano({
      target: vtourEl.id,
      xml: vtourEl.dataset.xml,
      html5: "only",
      mobilescale: 1,
      passQueryParameters: false,

      onready(krpano) {
        // lưu duy nhất 1 instance
        vtourInstances.set(vtourEl.id, krpano);
        activeVtourId = vtourEl.id;

        // scene mặc định = sáng
        setupOverviewVtour(krpano, "scene_overview_vr360", vtourEl.id);
      }
    });
  }

  toggleInput.on("change", function () {
    const krpano = vtourInstances.get(activeVtourId);

    if (!krpano) return;

    const isAfternoon = $(this).is(":checked");

    const sceneName = isAfternoon
      ? "scene_overview_vr360_afternoon"
      : "scene_overview_vr360";

    // lưu camera hiện tại
    const hlookat = parseFloat(krpano.get("view.hlookat"));

    const vlookat = parseFloat(krpano.get("view.vlookat"));

    const fov = parseFloat(krpano.get("view.fov"));

    closeOverviewInfo();

    // chỉ panorama bị blend
    krpano.call(`loadscene(${sceneName}, null, MERGE, BLEND(0.6));`);

    // restore đúng camera
    krpano.set("view.hlookat", hlookat);
    krpano.set("view.vlookat", vlookat);
    krpano.set("view.fov", fov);

    krpano.set("autorotate.enabled", false);
    krpano.call("autorotate.stop();");
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
        const isVideo =
          itemType === "video" ||
          sourceType === "mp4" ||
          sourceType === "youtube";
        const title =
          $item.data("gallery-title") ||
          $item.find(".gallery-caption").text().trim() ||
          $image.attr("alt") ||
          "";
        const href = $item.attr("href") || $image.attr("src");
        const lightboxItem = {
          href,
          type: isVideo ? "video" : "image",
          title
        };

        if (sourceType === "mp4") {
          lightboxItem.source = "local";
          lightboxItem.videoProvider = "local";
        } else if (sourceType === "youtube") {
          lightboxItem.source = "youtube";
          lightboxItem.videoProvider = "youtube";
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
      loop: true,
      autoplayVideos: true,
      plyr: {
        config: {
          autoplay: true
        }
      }
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

function villaShareModal() {
  const modalShare = $(".modal-share");
  const modalShareClose = $(".modal-share-close");

  if (modalShare.length < 1) return;

  modalShareClose.on("click", function () {
    modalShare.removeClass("show");
  });

  $(document).on(
    "click",
    ".villa-card__actions button[aria-label='Share']",
    function () {
      modalShare.addClass("show");
    }
  );
}

function bannerIntroTextAnimation() {
  const title = document.querySelector("[data-banner-intro-title]");
  if (!title || typeof gsap !== "object" || typeof SplitText !== "function") {
    return;
  }

  gsap.registerPlugin(SplitText);

  (document.fonts?.ready || Promise.resolve())
    .catch(() => {})
    .finally(() => {
      const split = new SplitText(title, {
        type: "chars",
        charsClass: "char"
      });

      gsap.set(title, { autoAlpha: 1 });
      gsap.set(split.chars, {
        autoAlpha: 0,
        yPercent: 70,
        rotateX: -45,
        transformOrigin: "50% 100%"
      });

      gsap.to(split.chars, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.025,
        delay: 3
      });
    });
}

function indexLoginModal() {
  const modal = document.querySelector("[data-index-login-modal]");
  if (!modal) return;

  const showTimer = window.setTimeout(() => {
    modal.classList.add("show");
  }, 1000);

  const closeModal = () => {
    window.clearTimeout(showTimer);
    modal.classList.remove("show");
  };

  modal.querySelectorAll("[data-index-login-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  // modal.querySelector("form")?.addEventListener("submit", (event) => {
  //   event.preventDefault();
  //   closeModal();
  // });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });
}

function init() {
  gsap.registerPlugin(ScrollTrigger);
  createFilterTab();
  gallery();
  sectionOverview();
  initVillaCardSwipers();
  sliderParallax();
  villaShareModal();
  bannerIntroTextAnimation();
  indexLoginModal();
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
