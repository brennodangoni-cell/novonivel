const formatter = new Intl.NumberFormat("pt-BR");
const player = document.querySelector("vturb-smartplayer");
const counters = document.querySelectorAll("[data-count-to]");
const checkoutButtons = document.querySelectorAll("[data-track-checkout]");
const delayedBlocks = document.querySelectorAll(".esconder");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const offerStorageKey = `novoNivelOfferUnlocked-${player?.id || "vsl"}`;

function setCounterValue(element, value) {
  element.textContent = formatter.format(Math.round(value));
}

function runCounter(counter) {
  if (counter.dataset.animated === "true") return;

  counter.dataset.animated = "true";
  if (reduceMotion) {
    setCounterValue(counter, Number(counter.dataset.countTo || 0));
    return;
  }

  animateCounter(counter);
}

function revealDelayedBlocks({ persist = true } = {}) {
  delayedBlocks.forEach((block) => {
    block.classList.remove("esconder");
  });

  counters.forEach(runCounter);
  if (persist) localStorage.setItem(offerStorageKey, "true");
}

function animateCounter(element) {
  const target = Number(element.dataset.countTo || 0);
  const duration = Number(element.dataset.countDuration || 1400);
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setCounterValue(element, target * eased);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        runCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 },
  );

  counters.forEach((counter) => observer.observe(counter));
}

function findVideoElement(root) {
  if (!root) return null;
  if (root.matches?.("video")) return root;

  const directVideo = root.querySelector?.("video");
  if (directVideo) return directVideo;

  const children = root.querySelectorAll?.("*") || [];
  for (const child of children) {
    const shadowVideo = findVideoElement(child.shadowRoot);
    if (shadowVideo) return shadowVideo;
  }

  return null;
}

function bindNativeVideoEnd() {
  const video = findVideoElement(player) || findVideoElement(document);
  if (!video) return false;

  video.addEventListener("ended", () => revealDelayedBlocks(), { once: true });
  if (video.ended) revealDelayedBlocks();
  return true;
}

if (localStorage.getItem(offerStorageKey) === "true") {
  revealDelayedBlocks();
} else if (player) {
  player.addEventListener("video:ended", () => revealDelayedBlocks(), { once: true });
  player.addEventListener("ended", () => revealDelayedBlocks(), { once: true });
  document.addEventListener("video:ended", (event) => {
    const path = event.composedPath?.() || [];
    if (event.target === player || path.includes(player)) revealDelayedBlocks();
  });
  player.addEventListener("player:ready", bindNativeVideoEnd, { once: true });

  const nativeVideoPoll = window.setInterval(() => {
    if (bindNativeVideoEnd()) window.clearInterval(nativeVideoPoll);
  }, 700);

  window.setTimeout(() => window.clearInterval(nativeVideoPoll), 30000);
}

window.novoNivelLiberarOferta = revealDelayedBlocks;

checkoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "InitiateCheckout");
  });
});
