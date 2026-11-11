import scrollama from 'scrollama';

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const dur = (ms) => (reduceMotion() ? 0 : ms);

// Wire one sticky section: calls onStep(stepName, index, direction) and optional onProgress.
export function scrolly(sectionEl, { onStep, onProgress, offset = 0.55 }) {
  const steps = [...sectionEl.querySelectorAll('.step')];
  const s = scrollama();
  s.setup({ step: steps, offset, progress: !!onProgress })
    .onStepEnter(({ element, index, direction }) => {
      steps.forEach((el) => el.classList.toggle('is-active', el === element));
      onStep(element.dataset.step, index, direction);
    });
  if (onProgress) s.onStepProgress(({ element, progress }) => onProgress(element.dataset.step, progress));
  window.addEventListener('resize', () => s.resize());
  return s;
}

// SVG that fills its sticky box; returns size and re-measures on resize.
export function sizeOf(el) {
  const r = el.getBoundingClientRect();
  return { w: Math.max(300, r.width), h: Math.max(300, r.height) };
}
