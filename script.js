const dialog = document.getElementById("legal-dialog");
const titleNode = document.getElementById("legal-title");
const bodyNode = document.getElementById("legal-body");
const closeNode = document.getElementById("legal-close");
const galleryDialog = document.getElementById("gallery-dialog");
const galleryImage = document.getElementById("gallery-image");
const galleryCaption = document.getElementById("gallery-caption");
const galleryClose = document.getElementById("gallery-close");
const soundButtons = document.querySelectorAll("[data-play-sound]");
const siteConfig = window.SKYTALE_SITE_CONFIG || {};
const pageLanguage = document.documentElement.lang === "ru" ? "ru" : "en";

function getTemplateContent(id) {
  const template = document.getElementById(id);
  return template ? template.innerHTML.trim() : "";
}

function openLegal(type) {
  if (!dialog || !titleNode || !bodyNode) return;

  titleNode.textContent = getTemplateContent(`legal-${type}-title`);
  bodyNode.textContent = getTemplateContent(`legal-${type}-text`);
  dialog.showModal();
}

function bindDialogDismiss(dialogNode, closeButton) {
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      dialogNode.close();
    });
  }

  dialogNode.addEventListener("click", (event) => {
    const bounds = dialogNode.getBoundingClientRect();
    const inside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!inside) {
      dialogNode.close();
    }
  });
}

function initDownloadTargets() {
  if (!siteConfig.androidDownloadUrl) return;

  document.querySelectorAll("[data-android-download]").forEach((link) => {
    link.setAttribute("href", siteConfig.androidDownloadUrl);
  });

  document.querySelectorAll("[data-software-schema]").forEach((node) => {
    try {
      const payload = JSON.parse(node.textContent);
      payload.downloadUrl = siteConfig.androidDownloadUrl;
      node.textContent = JSON.stringify(payload, null, 2);
    } catch (error) {
      console.warn("Failed to update software schema download URL", error);
    }
  });
}

function openGallerySlide(slide) {
  if (!galleryDialog || !galleryImage || !galleryCaption || !slide) return;

  galleryImage.src = slide.src;
  galleryImage.alt = slide.alt;
  galleryCaption.textContent = slide.caption;
  galleryDialog.showModal();
}

function initScreenshotCarousel() {
  const root = document.querySelector("[data-screenshot-carousel]");
  const slides = Array.isArray(siteConfig.screenshots) ? siteConfig.screenshots : [];

  if (!root || slides.length === 0) return;

  const track = root.querySelector("[data-screenshot-track]");
  const dots = root.querySelector("[data-screenshot-dots]");
  const caption = root.querySelector("[data-screenshot-caption]");
  const counter = root.querySelector("[data-screenshot-counter]");
  const openButton = root.querySelector("[data-screenshot-open]");
  const previousButton = root.querySelector("[data-screenshot-prev]");
  const nextButton = root.querySelector("[data-screenshot-next]");
  const autoplayMs = Number(root.dataset.autoplayMs) || 4800;
  let currentIndex = 0;
  let autoplayTimer = null;
  let touchStartX = 0;

  const localizedSlides = slides.map((slide) => ({
    src: slide.src,
    alt: slide.alt?.[pageLanguage] || slide.alt?.en || "",
    caption: slide.caption?.[pageLanguage] || slide.caption?.en || ""
  }));

  if (!track || !dots || !previousButton || !nextButton) {
    return;
  }

  track.innerHTML = localizedSlides
    .map(
      (slide, index) => `
        <button class="screenshot-slide" type="button" data-slide-index="${index}" aria-label="${slide.alt}">
          <img src="${slide.src}" alt="${slide.alt}" loading="${index === 0 ? "eager" : "lazy"}">
        </button>
      `
    )
    .join("");

  dots.innerHTML = localizedSlides
    .map(
      (_, index) => `
        <button
          class="screenshot-dot"
          type="button"
          data-dot-index="${index}"
          aria-label="${root.dataset.dotLabel} ${index + 1}"
        ></button>
      `
    )
    .join("");

  const slideButtons = [...track.querySelectorAll("[data-slide-index]")];
  const dotButtons = [...dots.querySelectorAll("[data-dot-index]")];

  function render() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    if (caption) {
      caption.textContent = localizedSlides[currentIndex].caption;
    }

    if (counter) {
      counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(localizedSlides.length).padStart(2, "0")}`;
    }

    slideButtons.forEach((button, index) => {
      const isActive = index === currentIndex;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    dotButtons.forEach((button, index) => {
      const isActive = index === currentIndex;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function goTo(index) {
    currentIndex = (index + localizedSlides.length) % localizedSlides.length;
    render();
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      goTo(currentIndex + 1);
    }, autoplayMs);
  }

  slideButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      currentIndex = index;
      render();
      openGallerySlide(localizedSlides[currentIndex]);
    });
  });

  dotButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      goTo(index);
      startAutoplay();
    });
  });

  previousButton.addEventListener("click", () => {
    goTo(currentIndex - 1);
    startAutoplay();
  });

  nextButton.addEventListener("click", () => {
    goTo(currentIndex + 1);
    startAutoplay();
  });

  if (openButton) {
    openButton.addEventListener("click", () => {
      openGallerySlide(localizedSlides[currentIndex]);
    });
  }

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", startAutoplay);

  root.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
  }, { passive: true });

  root.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0]?.clientX || 0;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) < 36) return;

    if (deltaX > 0) {
      goTo(currentIndex - 1);
    } else {
      goTo(currentIndex + 1);
    }

    startAutoplay();
  }, { passive: true });

  render();
  startAutoplay();
}

document.querySelectorAll("[data-legal-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openLegal(button.dataset.legalOpen);
  });
});

if (dialog) {
  bindDialogDismiss(dialog, closeNode);
}

if (galleryDialog) {
  bindDialogDismiss(galleryDialog, galleryClose);
}

initDownloadTargets();
initScreenshotCarousel();

soundButtons.forEach((button) => {
  const source = button.dataset.playSound;
  if (!source) return;

  const audio = new Audio(source);
  audio.preload = "auto";
  let longPressTimer = null;
  let longPressTriggered = false;

  function playSound() {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopSound() {
    audio.pause();
    audio.currentTime = 0;
  }

  button.addEventListener("mouseenter", playSound);
  button.addEventListener("mouseleave", stopSound);

  button.addEventListener("touchstart", () => {
    longPressTriggered = false;
    longPressTimer = window.setTimeout(() => {
      longPressTriggered = true;
      playSound();
    }, 450);
  }, { passive: true });

  function clearLongPress() {
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  button.addEventListener("touchend", () => {
    clearLongPress();
    stopSound();
  }, { passive: true });

  button.addEventListener("touchcancel", () => {
    clearLongPress();
    stopSound();
  }, { passive: true });

  button.addEventListener("contextmenu", (event) => {
    if (longPressTriggered) {
      event.preventDefault();
    }
  });
});
