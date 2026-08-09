const projectIndex = document.querySelector(".project-index");
const projectItems = [...document.querySelectorAll(".project-index__item")];
const projectDetailButtons = [...document.querySelectorAll(".project-index__detail-toggle")];
const projectDetails = [...document.querySelectorAll(".project-index__detail")];
const projectDetailCloseButtons = [...document.querySelectorAll(".project-detail-close")];
const inventoryUi = document.querySelector(".inventory-ui--after");
const inventoryFilterButtons = [...document.querySelectorAll(".filter-chip[data-product-filter]")];
const inventoryProductRows = [...document.querySelectorAll(".inventory-product-row")];
const inventoryExpiryRow = document.querySelector(".expiry-detail-row");
const inventoryEmptyRow = document.querySelector(".inventory-empty-row");

let activeProjectButton = null;
let activeProjectCloseButton = null;
let closeButtonFocusTimer;
let isInventoryExpiryExpanded = true;

function updateInventoryExpiryState() {
  const sunscreenRow = inventoryProductRows.find((row) => row.classList.contains("sunscreen-row"));
  const toggle = inventoryUi?.querySelector(".inventory-expiry-toggle");
  const canShow = Boolean(sunscreenRow && !sunscreenRow.hidden);

  if (!toggle || !inventoryExpiryRow) return;
  toggle.setAttribute("aria-expanded", String(isInventoryExpiryExpanded));
  toggle.setAttribute(
    "aria-label",
    isInventoryExpiryExpanded ? "썬크림 유통기한별 재고 숨기기" : "썬크림 유통기한별 재고 펼치기"
  );
  inventoryExpiryRow.hidden = !isInventoryExpiryExpanded || !canShow;
}

function applyInventoryFilter(filterType) {
  let visibleCount = 0;

  inventoryProductRows.forEach((row) => {
    const isVisible = filterType === "전체" || row.dataset.productType === filterType;
    row.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  inventoryFilterButtons.forEach((button) => {
    const isSelected = button.dataset.productFilter === filterType;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  if (inventoryEmptyRow) inventoryEmptyRow.hidden = visibleCount > 0;
  updateInventoryExpiryState();
}

function setProjectDetailState(button, isExpanded) {
  const item = button.closest(".project-index__item");
  const detail = document.getElementById(button.getAttribute("aria-controls"));

  button.setAttribute("aria-expanded", String(isExpanded));
  item?.classList.toggle("is-expanded", isExpanded);
  detail?.classList.toggle("is-expanded", isExpanded);
  detail?.setAttribute("aria-hidden", String(!isExpanded));
}

function closeProjectDetails({ restoreFocus = true } = {}) {
  if (!activeProjectButton) return false;

  const buttonToFocus = activeProjectButton;
  clearTimeout(closeButtonFocusTimer);
  setProjectDetailState(activeProjectButton, false);

  projectItems.forEach((item) => {
    item.classList.remove("is-moving-up", "is-moving-down");
  });
  projectDetails.forEach((detail) => detail.classList.remove("is-expanded"));
  projectIndex?.classList.remove("has-expanded");
  document.body.classList.remove("has-project-expanded");

  activeProjectButton = null;
  activeProjectCloseButton = null;

  if (restoreFocus) buttonToFocus.focus({ preventScroll: true });
  return true;
}

function openProjectDetails(button) {
  const activeIndex = projectDetailButtons.indexOf(button);
  if (activeIndex < 0) return;

  if (activeProjectButton) closeProjectDetails({ restoreFocus: false });
  activeProjectButton = button;
  activeProjectCloseButton = document
    .getElementById(button.getAttribute("aria-controls"))
    ?.querySelector(".project-detail-close");

  projectItems.forEach((item, index) => {
    item.classList.toggle("is-moving-up", index <= activeIndex);
    item.classList.toggle("is-moving-down", index > activeIndex);
  });

  setProjectDetailState(button, true);
  projectIndex?.classList.add("has-expanded");
  document.body.classList.add("has-project-expanded");

  if (activeProjectCloseButton) {
    const focusDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520;
    closeButtonFocusTimer = window.setTimeout(() => {
      activeProjectCloseButton?.focus({ preventScroll: true });
    }, focusDelay);
  }
}

projectDetailButtons.forEach((button) => {
  button.addEventListener("click", () => openProjectDetails(button));
});

projectDetailCloseButtons.forEach((button) => {
  button.addEventListener("click", () => closeProjectDetails());
});

inventoryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => applyInventoryFilter(button.dataset.productFilter));
});

inventoryUi?.querySelector(".inventory-expiry-toggle")?.addEventListener("click", () => {
  isInventoryExpiryExpanded = !isInventoryExpiryExpanded;
  updateInventoryExpiryState();
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (closeProjectDetails()) event.preventDefault();
});

if (window.location.hash) {
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

applyInventoryFilter("전체");
window.setTimeout(() => document.body.classList.add("is-ready"), 100);
