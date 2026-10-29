import scrollama from 'scrollama';
import './styles/tokens.css';
import './styles/main.css';

// Smoke test that the scroll plumbing works. Real sections live in src/sections/.
const readout = document.querySelector('#demo-readout');

scrollama()
  .setup({ step: '#demo .step', offset: 0.6 })
  .onStepEnter(({ element }) => {
    document.querySelectorAll('#demo .step').forEach((el) => el.classList.toggle('is-active', el === element));
    readout.textContent = `Step ${element.dataset.step}`;
  });
