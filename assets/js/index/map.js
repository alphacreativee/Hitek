"use strict";

function initMapPage() {
  const page = document.querySelector("[data-map-page]");
  if (!page) return;

  const stage = page.querySelector(".map-page__stage");
  const items = page.querySelectorAll(".map-page__filter-item[data-map-src]");
  const toggles = page.querySelectorAll("[data-map-filter-toggle]");
  let filterTimer = null;
  let activeSrc = stage?.querySelector("[data-map-media]")?.getAttribute("src") || "";

  const getMapType = (item) => {
    const explicitType = String(item.dataset.mapType || "").toLowerCase();
    if (explicitType === "video" || explicitType === "image") return explicitType;

    return /\.(mp4|webm|mov)(\?.*)?$/i.test(item.dataset.mapSrc || "")
      ? "video"
      : "image";
  };

  const setMediaReady = (media) => {
    window.requestAnimationFrame(() => {
      media.classList.add("active");
    });
  };

  const createMapMedia = (item) => {
    const src = item.dataset.mapSrc;
    const label = item.dataset.mapLabel || "Map";
    const type = getMapType(item);

    if (type === "video") {
      const video = document.createElement("video");
      video.className = "map-page__video map-page__media";
      video.dataset.mapMedia = "";
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("aria-label", label);
      video.addEventListener("loadeddata", () => setMediaReady(video), { once: true });
      video.addEventListener("canplay", () => {
        video.play().catch(() => {});
      }, { once: true });
      return video;
    }

    const image = document.createElement("img");
    image.className = "map-page__image map-page__media";
    image.dataset.mapMedia = "";
    image.src = src;
    image.alt = label;
    image.draggable = false;
    image.addEventListener("load", () => setMediaReady(image), { once: true });
    return image;
  };

  const setExpanded = (isExpanded) => {
    toggles.forEach((toggle) => {
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
    page.classList.remove("is-filter-expanded", "is-filter-expanding");
    page.classList.add("is-filter-collapsing");
    setExpanded(false);

    filterTimer = window.setTimeout(() => {
      page.classList.add("is-filter-collapsed");
      page.classList.remove("is-filter-collapsing");
      filterTimer = null;
    }, 220);
  };

  const expandFilter = () => {
    clearFilterTimer();
    page.classList.remove("is-filter-collapsed", "is-filter-collapsing");
    page.classList.add("is-filter-expanded", "is-filter-expanding");
    setExpanded(true);

    filterTimer = window.setTimeout(() => {
      page.classList.remove("is-filter-expanding");
      filterTimer = null;
    }, 360);
  };

  const activateMap = (item) => {
    const src = item.dataset.mapSrc;
    if (!src || !stage || activeSrc === src) return;

    items.forEach((button) => button.classList.remove("active"));
    item.classList.add("active");

    const currentMedia = stage.querySelector("[data-map-media]");
    const nextMedia = createMapMedia(item);
    currentMedia?.classList.remove("active");

    window.setTimeout(() => {
      currentMedia?.remove();
      stage.appendChild(nextMedia);
      activeSrc = src;
    }, 120);
  };

  stage?.querySelector("[data-map-media]")?.classList.add("active");

  items.forEach((item) => {
    if (item.dataset.mapSrc && getMapType(item) === "image") {
      const preloadImage = new Image();
      preloadImage.src = item.dataset.mapSrc;
    } else if (item.dataset.mapSrc) {
      const preloadVideo = document.createElement("video");
      preloadVideo.preload = "metadata";
      preloadVideo.src = item.dataset.mapSrc;
    }

    item.addEventListener("click", () => {
      activateMap(item);
    });
  });

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (page.classList.contains("is-filter-collapsed")) {
        expandFilter();
        return;
      }

      if (page.classList.contains("is-filter-expanding")) return;

      collapseFilter();
    });
  });

  setExpanded(!page.classList.contains("is-filter-collapsed"));
}

document.addEventListener("DOMContentLoaded", initMapPage);
