const formatter = new Intl.NumberFormat("pt-BR");
const counters = document.querySelectorAll("[data-count-to]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setCounterValue(element, value) {
  element.textContent = formatter.format(Math.round(value));
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
