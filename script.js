const formatter = new Intl.NumberFormat("pt-BR");
const pageRoot = document.querySelector("#top");
const player = document.querySelector("vturb-smartplayer");
const counters = document.querySelectorAll("[data-count-to]");
const checkoutButtons = document.querySelectorAll("[data-track-checkout]");
const delayedBlocks = document.querySelectorAll(".esconder");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const vslDelaySeconds = Number(pageRoot?.dataset.vslDelaySeconds || 600);
const delayStorageKey = `novoNivelVslUnlocked-${vslDelaySeconds}`;

function setCounterValue(element, value) {
  element.textContent = formatter.format(Math.round(value));
}

function revealDelayedBlocks() {
  delayedBlocks.forEach((block) => {
    block.classList.remove("esconder");
  });
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

if (reduceMotion) {
  counters.forEach((counter) => setCounterValue(counter, Number(counter.dataset.countTo || 0)));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.animated === "true") return;

        entry.target.dataset.animated = "true";
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 },
  );

  counters.forEach((counter) => observer.observe(counter));
} else {
  counters.forEach(animateCounter);
}

if (localStorage.getItem(delayStorageKey) === "true") {
  revealDelayedBlocks();
} else if (player) {
  player.addEventListener("player:ready", () => {
    if (typeof player.displayHiddenElements === "function") {
      player.displayHiddenElements(vslDelaySeconds, [".esconder"], { persist: true });
      return;
    }

    window.setTimeout(() => {
      revealDelayedBlocks();
      localStorage.setItem(delayStorageKey, "true");
    }, vslDelaySeconds * 1000);
  });
}

checkoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "InitiateCheckout");
  });
});
