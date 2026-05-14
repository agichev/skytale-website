const dialog = document.getElementById("legal-dialog");
const titleNode = document.getElementById("legal-title");
const bodyNode = document.getElementById("legal-body");
const closeNode = document.getElementById("legal-close");
const soundButtons = document.querySelectorAll("[data-play-sound]");

function getTemplateContent(id) {
  const template = document.getElementById(id);
  return template ? template.innerHTML.trim() : "";
}

function openLegal(type) {
  titleNode.textContent = getTemplateContent(`legal-${type}-title`);
  bodyNode.textContent = getTemplateContent(`legal-${type}-text`);
  dialog.showModal();
}

document.querySelectorAll("[data-legal-open]").forEach((button) => {
  button.addEventListener("click", () => {
    openLegal(button.dataset.legalOpen);
  });
});

if (closeNode) {
  closeNode.addEventListener("click", () => {
    dialog.close();
  });
}

if (dialog) {
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!inside) {
      dialog.close();
    }
  });
}

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

  button.addEventListener("mouseenter", playSound);
  button.addEventListener("click", playSound);

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
  }, { passive: true });

  button.addEventListener("touchcancel", () => {
    clearLongPress();
  }, { passive: true });

  button.addEventListener("contextmenu", (event) => {
    if (longPressTriggered) {
      event.preventDefault();
    }
  });
});
