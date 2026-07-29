document.addEventListener("DOMContentLoaded", function () {
  const $book = $("#dflip-brochure").flipBook({
    webgl: true,
    autoEnableOutline: false,
    autoEnableThumbnail: false,
    height: "500",
    duration: 800,
    soundEnable: false,
    showDownloadControl: false,
    showSearchControl: false,
    showPrintControl: false,
    showShareControl: false,
    enableAnnotation: false,
    singlePageMode: {},
  });

  if (typeof DFLIP !== "undefined") {
    DFLIP.defaults.soundEnable = false;
  }

  let flipbookInstance = null;

  DFLIP.defaults.onReady = function (flipbook) {
    flipbookInstance = flipbook;
  };

  // ===== Wheel để lật trang =====
  let wheelTimeout = null;
  const WHEEL_COOLDOWN = 800;

  document.getElementById("dflip-brochure")?.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      if (wheelTimeout) return;
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
    { passive: false },
  );

  // ===== Nút mũi tên để lật trang =====
  document.getElementById("brochure-prev")?.addEventListener("click", () => {
    if (!flipbookInstance) return;
    flipbookInstance.prev();
  });

  document.getElementById("brochure-next")?.addEventListener("click", () => {
    if (!flipbookInstance) return;
    flipbookInstance.next();
  });
});
