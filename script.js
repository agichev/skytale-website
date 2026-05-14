const dialog = document.getElementById("legal-dialog");
const titleNode = document.getElementById("legal-title");
const bodyNode = document.getElementById("legal-body");
const closeNode = document.getElementById("legal-close");

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
