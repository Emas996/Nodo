// Content is visible without JavaScript. Motion is a progressive enhancement.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let observer;
function revealContent() {
  observer?.disconnect();
  document.querySelectorAll('.reveal').forEach((element) => element.classList.remove('reveal-pending'));
}
function setupReveals() {
  revealContent();
  if (preference.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    }
  });
}
setupReveals();
preference.addEventListener('change', setupReveals);
window.addEventListener('pageshow', (event) => { if (event.persisted) revealContent(); });
document.addEventListener('focusin', (event) => event.target.closest('.reveal')?.classList.remove('reveal-pending'));
