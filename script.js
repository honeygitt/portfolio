const slideTrack = document.querySelector(".slide-track");
const slideOrder = ["page-00", "page-44", "page-55", "page-11", "page-22", "page-33"];
const slideElements = new Map([...document.querySelectorAll(".slide")].map((slide) => [slide.id, slide]));
slideOrder.forEach((slideId) => {
  const slide = slideElements.get(slideId);
  if (slide) slideTrack.appendChild(slide);
});
const slides = [...slideTrack.querySelectorAll(".slide")];
const currentPageLabel = document.querySelector(".page-status__current");
const inventoryTableSource = document.querySelector("#page-55 .compare-panel--after .table-shell--inventory-app");
const inventoryFilterButtons = [...document.querySelectorAll("#page-55 .filter-chip[data-product-filter]")];
const inventoryProductRows = [...document.querySelectorAll("#page-55 .inventory-product-row")];
const inventoryExpiryDetailRow = document.querySelector("#page-55 .expiry-detail-row");
const inventoryEmptyRow = document.querySelector("#page-55 .inventory-empty-row");

const TRANSITION_MS = 760;
const WHEEL_THRESHOLD = 36;

let currentIndex = 0;
let isMoving = false;
let wheelAmount = 0;
let wheelResetTimer;
let moveUnlockTimer;
let touchStartY = 0;
let isInventoryExpiryExpanded = false;

function updateInventoryExpiryToggle(button, detailRow, isExpanded, canShow = true) {
  if (!button || !detailRow) return;

  button.setAttribute("aria-expanded", String(isExpanded));
  button.setAttribute(
    "aria-label",
    isExpanded ? "썬크림 유통기한별 재고 숨기기" : "썬크림 유통기한별 재고 펼치기"
  );
  detailRow.hidden = !isExpanded || !canShow;
}

function applyInventoryFilter(filterType) {
  let visibleProductCount = 0;

  inventoryProductRows.forEach((row) => {
    const isVisible = filterType === "전체" || row.dataset.productType === filterType;
    row.hidden = !isVisible;
    if (isVisible) visibleProductCount += 1;
  });

  const sunscreenRow = inventoryProductRows.find((row) => row.classList.contains("sunscreen-row"));
  const expiryToggle = inventoryTableSource?.querySelector(".inventory-expiry-toggle");
  updateInventoryExpiryToggle(
    expiryToggle,
    inventoryExpiryDetailRow,
    isInventoryExpiryExpanded,
    Boolean(sunscreenRow && !sunscreenRow.hidden)
  );

  if (inventoryEmptyRow) {
    inventoryEmptyRow.hidden = visibleProductCount > 0;
  }

  inventoryFilterButtons.forEach((button) => {
    const isSelected = button.dataset.productFilter === filterType;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function clampIndex(index) {
  return Math.max(0, Math.min(index, slides.length - 1));
}

function updateTrackPosition() {
  slideTrack.style.transform = `translate3d(0, ${currentIndex * -window.innerHeight}px, 0)`;
}

function updatePage(index, { animate = true } = {}) {
  const nextIndex = clampIndex(index);

  if (nextIndex === currentIndex && animate) {
    return false;
  }

  if (animate) {
    document.body.classList.add("is-moving");
    slideTrack.getBoundingClientRect();
  }

  currentIndex = nextIndex;
  updateTrackPosition();

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === currentIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  const pageName = slides[currentIndex].dataset.page;
  const pageNumber = currentIndex + 1;
  currentPageLabel.textContent = String(pageNumber);
  document.title = `${pageName} · 자동화 프로젝트 포트폴리오`;
  history.replaceState(null, "", `#page-${pageNumber}`);

  if (animate) {
    isMoving = true;
    clearTimeout(moveUnlockTimer);
    moveUnlockTimer = window.setTimeout(() => {
      isMoving = false;
      document.body.classList.remove("is-moving");
    }, TRANSITION_MS + 100);
  }

  if (animate) {
    document.body.classList.add("has-interacted");
  }
  return true;
}

function moveBy(direction) {
  if (isMoving) return;
  updatePage(currentIndex + direction);
}

function handleWheel(event) {
  event.preventDefault();

  if (isMoving) {
    wheelAmount = 0;
    return;
  }

  wheelAmount += event.deltaY;
  clearTimeout(wheelResetTimer);
  wheelResetTimer = window.setTimeout(() => {
    wheelAmount = 0;
  }, 140);

  if (Math.abs(wheelAmount) < WHEEL_THRESHOLD) return;

  const direction = wheelAmount > 0 ? 1 : -1;
  wheelAmount = 0;
  moveBy(direction);
}

function handleKeydown(event) {
  const isInteractiveElement = event.target.closest("button, a, input, select, textarea");

  if (isInteractiveElement) return;

  const nextKeys = ["ArrowDown", "PageDown"];
  const previousKeys = ["ArrowUp", "PageUp"];

  if (nextKeys.includes(event.key) || (event.key === " " && !event.shiftKey)) {
    event.preventDefault();
    moveBy(1);
    return;
  }

  if (previousKeys.includes(event.key) || (event.key === " " && event.shiftKey)) {
    event.preventDefault();
    moveBy(-1);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    updatePage(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    updatePage(slides.length - 1);
  }
}

function handleTouchStart(event) {
  touchStartY = event.changedTouches[0].clientY;
}

function handleTouchEnd(event) {
  const distance = touchStartY - event.changedTouches[0].clientY;

  if (Math.abs(distance) < 45) return;
  moveBy(distance > 0 ? 1 : -1);
}

function getInitialIndex() {
  const hashPage = window.location.hash.replace("#page-", "");
  const pageNumber = Number(hashPage);

  if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= slides.length) {
    return pageNumber - 1;
  }

  const legacyHashIndex = slides.findIndex((slide) => slide.dataset.page === hashPage);
  return legacyHashIndex >= 0 ? legacyHashIndex : 0;
}

inventoryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => applyInventoryFilter(button.dataset.productFilter));
});
document.addEventListener("click", (event) => {
  const toggleButton = event.target.closest(".inventory-expiry-toggle");
  if (!toggleButton) return;

  const tableShell = toggleButton.closest(".table-shell--inventory-app");
  const detailRow = tableShell?.querySelector(".expiry-detail-row");
  const nextExpandedState = toggleButton.getAttribute("aria-expanded") !== "true";

  if (tableShell === inventoryTableSource) {
    isInventoryExpiryExpanded = nextExpandedState;
  }

  updateInventoryExpiryToggle(toggleButton, detailRow, nextExpandedState);
});

window.addEventListener("wheel", handleWheel, { passive: false });
window.addEventListener("keydown", handleKeydown);
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchend", handleTouchEnd, { passive: true });
window.addEventListener("resize", updateTrackPosition);

applyInventoryFilter("전체");

updatePage(getInitialIndex(), { animate: false });
slideTrack.getBoundingClientRect();
window.setTimeout(() => document.body.classList.add("is-ready"), 100);
