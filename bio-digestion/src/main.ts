import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sections.css';

import { initChrome, FALLBACK_SVG } from './sections/chrome';
import { initResults } from './sections/results';
import { initGame } from './sections/game';
import { initReviews } from './sections/reviews';
import { initStory } from './sections/story';
import type { SceneController } from './scene/scene';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

// Cada sección se inicializa por separado: un fallo en una no bloquea el resto.
const safe = (name: string, fn: () => void) => {
  try { fn(); } catch (err) { console.error(`[${name}]`, err); }
};

safe('chrome', initChrome);
safe('results', () => initResults(reducedMotion));
safe('game', () => initGame(reducedMotion));
safe('reviews', initReviews);

async function boot3D(): Promise<SceneController | null> {
  const stage = document.getElementById('stage')!;
  const showFallback = () => {
    stage.classList.add('no-webgl');
    stage.querySelector('[data-fallback]')!.innerHTML = FALLBACK_SVG;
  };
  const forceFallback = new URLSearchParams(location.search).has('no3d');
  try {
    const mod = await import('./scene/scene');
    if (forceFallback || !mod.hasWebGL()) { showFallback(); return null; }
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); showFallback(); });
    return mod.createScene(canvas, { reducedMotion, onReady: () => stage.classList.add('is-ready') });
  } catch (err) {
    console.error('[3d]', err);
    showFallback();
    return null;
  }
}

boot3D().then((scene) => safe('story', () => initStory(scene, reducedMotion)));
