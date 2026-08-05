document.addEventListener("DOMContentLoaded", function () {
  const brochureEl = document.getElementById("dflip_brochure");
  const brochureSection = brochureEl?.closest(".brochure-section");

  if (typeof DFLIP !== "undefined") {
    DFLIP.defaults.soundEnable = false;
  }

  function getFlipbookInstance() {
    return window.brochureFlipbookInstance || null;
  }

  function setBrochureSize() {
    if (!brochureEl) return;

    const sectionHeight =
      brochureSection?.getBoundingClientRect().height || window.innerHeight;

    brochureEl.style.width = "100%";
    brochureEl.style.height = `${Math.round(sectionHeight)}px`;

    const container = brochureSection?.querySelector(".df-container");
    if (container) {
      container.style.width = "100%";
      container.style.height = `${Math.round(sectionHeight)}px`;
    }
  }

  let resizeTimer = null;

  window.addEventListener("resize", function () {
    setBrochureSize();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      const flipbookInstance = getFlipbookInstance();
      flipbookInstance?.resize?.();
      flipbookInstance?.update?.();
    }, 120);
  });

  setBrochureSize();

  let wheelTimeout = null;
  const WHEEL_COOLDOWN = 800;

  brochureEl?.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      if (wheelTimeout) return;

      const flipbookInstance = getFlipbookInstance();
      if (!flipbookInstance) return;

      if (e.deltaY > 0) {
        flipbookInstance.next();
      } else if (e.deltaY < 0) {
        flipbookInstance.prev();
      }

      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, WHEEL_COOLDOWN);
    },
    { passive: false }
  );

  document.getElementById("brochure-prev")?.addEventListener("click", () => {
    const flipbookInstance = getFlipbookInstance();
    if (!flipbookInstance) return;
    flipbookInstance.prev();
  });

  document.getElementById("brochure-next")?.addEventListener("click", () => {
    const flipbookInstance = getFlipbookInstance();
    if (!flipbookInstance) return;
    flipbookInstance.next();
  });
});
