import './styles/tokens.css';
import './styles/main.css';
import { loadData } from './lib/data.js';
import * as opener from './sections/00-opener.js';
import * as boom from './sections/01-boom.js';
import * as timeline from './sections/02-timeline.js';
import * as money from './sections/03-money.js';
import * as routes from './sections/04-routes.js';
import * as explorer from './sections/05-explorer.js';

// Progress bar as a 42.195 km course.
function course() {
  const fill = document.querySelector('.course-fill');
  const km = document.querySelector('.course-km');
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    fill.style.transform = `scaleX(${p})`;
    km.textContent = `${(p * 42.195).toFixed(1).replace('.', ',')} km`;
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

async function start() {
  course();
  const data = await loadData();
  const sections = [
    ['#s0', opener], ['#s1', boom], ['#s2', timeline], ['#s3', money], ['#s4', routes], ['#s6', explorer],
  ];
  for (const [sel, mod] of sections) {
    try {
      mod.init(document.querySelector(sel), data);
    } catch (err) {
      console.error(`section ${sel} failed`, err);
    }
  }
}
start();
