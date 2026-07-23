"use strict";
import {
  customDropdown,
  createFilterTab,
  getDateLightPick
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
  if (!containerSwiperEl) return;

  const swiperEl = containerSwiperEl.querySelector(".swiper-el-parallax");
  if (!swiperEl) return;

  const swiperParallax = initParallaxSwiper(swiperEl, {
    navigation: {
      nextEl: containerSwiperEl.querySelector(".swiper-button-next"),
      prevEl: containerSwiperEl.querySelector(".swiper-button-prev")
    }
  });
}

function init() {
  gsap.registerPlugin(ScrollTrigger);
  customDropdown();
  createFilterTab();
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
