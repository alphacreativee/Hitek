function shareBrochure(platform) {
  const brochureShare = document.querySelector(".brochure-share");

  if (!platform) {
    if (!brochureShare) return Promise.resolve(false);

    const brochureShareToggle = brochureShare.querySelector(
      ".brochure-share__toggle"
    );

    brochureShareToggle?.addEventListener("click", function () {
      const isOpen = brochureShare.classList.toggle("is-open");
      brochureShareToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    brochureShare.querySelectorAll("[data-share-platform]").forEach((button) => {
      button.addEventListener("click", function () {
        const sharePlatform = this.getAttribute("data-share-platform");

        shareBrochure(sharePlatform).finally(() => {
          brochureShare.classList.remove("is-open");
          brochureShareToggle?.setAttribute("aria-expanded", "false");
        });
      });
    });

    document.addEventListener("click", function (e) {
      if (brochureShare.contains(e.target)) return;

      brochureShare.classList.remove("is-open");
      brochureShareToggle?.setAttribute("aria-expanded", "false");
    });

    return Promise.resolve(true);
  }

  if (!brochureShare) return Promise.resolve(false);

  const shareData = getBrochureShareData();
  const encodedUrl = encodeURIComponent(shareData.url);
  const encodedText = encodeURIComponent(`${shareData.text} ${shareData.url}`);

  function getBrochureShareData() {
    return {
      url: window.location.href,
      title: document.title || "Hoiana Brochure",
      text: "Hoiana Brochure",
    };
  }

  function copyBrochureLink(url) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(url);
    }

    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();

    return Promise.resolve();
  }

  function openBrochureShareWindow(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=620");
  }

  if (platform === "copy") {
    return copyBrochureLink(shareData.url);
  }

  if (platform === "facebook") {
    openBrochureShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    );
    return Promise.resolve();
  }

  if (platform === "x") {
    openBrochureShareWindow(`https://twitter.com/intent/tweet?text=${encodedText}`);
    return Promise.resolve();
  }

  if (platform === "instagram") {
    return copyBrochureLink(shareData.url).finally(() => {
      openBrochureShareWindow("https://www.instagram.com/");
    });
  }

  if (navigator.share) {
    return navigator.share(shareData);
  }

  return copyBrochureLink(shareData.url);
}

window.shareBrochure = shareBrochure;

document.addEventListener("DOMContentLoaded", function () {
  const brochureEl = document.getElementById("dflip_brochure");
  const brochureWrapper = brochureEl?.parentElement;

  if (typeof DFLIP !== "undefined") {
    DFLIP.defaults.soundEnable = false;
  }

  function getFlipbookInstance() {
    return window.brochureFlipbookInstance || null;
  }

  function setBrochureSize() {
    if (!brochureEl) return;

    const wrapperHeight = brochureWrapper?.getBoundingClientRect().height || 0;
    const sectionHeight = wrapperHeight || window.innerHeight;

    brochureEl.style.width = "100%";
    brochureEl.style.height = `${Math.round(sectionHeight)}px`;

    const container =
      brochureWrapper?.querySelector(".df-container") ||
      brochureEl.querySelector(".df-container");
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

  shareBrochure();
});
