export function customDropdown() {
  const dropdowns = document.querySelectorAll(
    ".dropdown-custom, .dropdown-custom-select"
  );
  if (!dropdowns.length) return;
  dropdowns.forEach((dropdown) => {
    const btnDropdown = dropdown.querySelector(".dropdown-custom-btn");
    const dropdownMenu = dropdown.querySelector(".dropdown-custom-menu");
    const dropdownItems = dropdown.querySelectorAll(".dropdown-custom-item");
    const valueSelect = dropdown.querySelector(".value-select");
    const displayText = dropdown.querySelector(".dropdown-custom-text");

    const isSelectType = dropdown.classList.contains("dropdown-custom-select");

    btnDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
      closeAllDropdowns(dropdown);
      dropdownMenu.classList.toggle("dropdown--active");
      btnDropdown.classList.toggle("--active");
    });

    document.addEventListener("click", function () {
      closeAllDropdowns();
    });

    dropdownItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.stopPropagation();

        if (isSelectType) {
          const optionText = item.textContent;
          displayText.textContent = optionText;
          dropdown.classList.add("selected");
        } else {
          const currentImgEl = valueSelect.querySelector("img");
          const currentImg = currentImgEl ? currentImgEl.src : "";
          const currentText = valueSelect.querySelector("span").textContent;
          const clickedHtml = item.innerHTML;

          valueSelect.innerHTML = clickedHtml;

          const isSelectTime = currentText.trim() === "Time";

          if (!isSelectTime) {
            if (currentImg) {
              item.innerHTML = `<span>${currentText}</span><img src="${currentImg}" alt="" />`;
            } else {
              item.innerHTML = `<span>${currentText}</span>`;
            }
          }
        }

        closeAllDropdowns();
      });
    });

    window.addEventListener("scroll", function () {
      if (dropdownMenu.closest(".header-lang")) {
        dropdownMenu.classList.remove("dropdown--active");
        btnDropdown.classList.remove("--active");
      }
    });
  });

  function closeAllDropdowns(exception) {
    dropdowns.forEach((dropdown) => {
      const menu = dropdown.querySelector(".dropdown-custom-menu");
      const btn = dropdown.querySelector(".dropdown-custom-btn");

      if (!exception || dropdown !== exception) {
        menu.classList.remove("dropdown--active");
        btn.classList.remove("--active");
      }
    });
  }
}
export function headerScroll() {
  const header = document.getElementById("header");
  if (!header) return null;

  let lastScroll = 0;

  const trigger = ScrollTrigger.create({
    start: "top top",
    end: 9999,
    onUpdate: (self) => {
      const currentScroll = self.scroll();

      if (currentScroll <= 0) {
        header.classList.remove("scrolled");
      } else if (currentScroll > lastScroll) {
        // Scroll down
        header.classList.add("scrolled");
      } else {
        // Scroll up
        header.classList.remove("scrolled");
      }

      lastScroll = currentScroll;
    }
  });

  return trigger;
}

/////// thêm class select-tab vào thì vẫn filter theo đúng type đó, không show hết item.
export function createFilterTab() {
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

export function getDateLightPick() {
  var picker = new Lightpick({
    field: document.getElementById("datepicker"),
    minDate: new Date(),
    singleDate: false,
    numberOfMonths: 2
    // lang: "en-US",
  });
}

export function sliderParallax() {
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
