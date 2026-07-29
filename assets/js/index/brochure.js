document.addEventListener("DOMContentLoaded", function () {
  const $book = $("#dflip-brochure").flipBook({
    webgl: true,
    autoEnableOutline: false,
    autoEnableThumbnail: false,
    height: "500",
    duration: 800,
    soundEnable: false,
    // Tắt các control không cần
    showDownloadControl: false,
    showSearchControl: false,
    showPrintControl: false,
    showShareControl: false,
    enableAnnotation: false,
    singlePageMode: {
      // nếu cần disable thêm option con nào đó
    },
  });
  if (typeof DFLIP !== "undefined") {
    DFLIP.defaults.soundEnable = false;
  }
  // Lấy flipbook instance thật sau khi khởi tạo xong
  let flipbookInstance = null;

  DFLIP.defaults.onReady = function (flipbook) {
    flipbookInstance = flipbook;
  };

  // Debounce để tránh cuộn 1 lần mà lật nhiều trang liên tiếp
  let wheelTimeout = null;
  const WHEEL_COOLDOWN = 800; // ms, nên khớp gần với duration lật trang

  document.getElementById("dflip-brochure")?.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault(); // chặn scroll trang web khi đang hover trên flipbook

      if (wheelTimeout) return; // đang trong thời gian chờ, bỏ qua sự kiện wheel dồn dập

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
    { passive: false }, // bắt buộc để preventDefault hoạt động
  );
});
