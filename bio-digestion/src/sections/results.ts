import { EXPERIMENT as E, IMPROVEMENTS, LIMITATIONS, TIMELINE, fmt } from '../data/experiment';
import { el } from '../lib/dom';
import montaje from '../assets/montaje.jpg';

interface Kpi { label: string; value: number; decimals: number; unit: string; sub: string; hero?: boolean; approx?: boolean; prefix?: string }

const KPIS: Kpi[] = [
  { label: 'Metano acumulado', value: E.totalMl, decimals: 0, unit: 'mL', sub: `${fmt(E.totalL, 3)} L al finalizar el día ${E.durationDays}`, hero: true },
  { label: 'Duración', value: E.durationDays, decimals: 0, unit: 'días', sub: 'Un único ensayo' },
  { label: 'Primer metano', value: E.firstMethaneDay, decimals: 0, unit: '', prefix: 'Día ', sub: 'Tras la adaptación inicial' },
  { label: 'Promedio fase productiva', value: E.avgProductiveMlDay, decimals: 1, unit: 'mL/día', sub: `${fmt(E.totalMl)} mL ÷ ${E.productiveDays} días (9 a 40)`, approx: true },
  { label: 'Promedio 40 días', value: E.avgFullMlDay, decimals: 1, unit: 'mL/día', sub: `${fmt(E.totalMl)} mL ÷ ${E.durationDays} días`, approx: true },
];

export function initResults(reducedMotion: boolean): void {
  const img = document.querySelector<HTMLImageElement>('[data-photo]');
  if (img) img.src = montaje;

  // KPIs con contador animado
  const kpiWrap = document.querySelector('[data-kpis]')!;
  const counters: { node: HTMLElement; k: Kpi }[] = [];
  for (const k of KPIS) {
    const valueNode = el('span', { class: 'kpi-num' }, (k.prefix ?? '') + fmt(reducedMotion ? k.value : 0, k.decimals));
    const card = el('div', { class: 'kpi' + (k.hero ? ' kpi-hero' : '') },
      el('p', { class: 'kpi-label' }, k.label),
      el('div', {},
        el('p', { class: 'kpi-value', 'aria-label': `${k.prefix ?? ''}${fmt(k.value, k.decimals)} ${k.unit}`.trim() }, valueNode, k.unit ? el('small', { 'aria-hidden': 'true' }, k.unit) : ''),
        el('p', { class: 'kpi-sub' }, k.sub),
      ),
      k.approx ? el('span', { class: 'kpi-approx', title: 'Cálculo aproximado' }, '≈ cálculo') : '',
    );
    valueNode.setAttribute('aria-hidden', 'true');
    kpiWrap.append(card);
    counters.push({ node: valueNode, k });
  }
  if (!reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        for (const { node, k } of counters) node.textContent = (k.prefix ?? '') + fmt(k.value * e, k.decimals);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    io.observe(kpiWrap);
  }

  buildTimeline();
  buildPeak(reducedMotion);

  const limits = document.querySelector('[data-limits]')!;
  for (const l of LIMITATIONS) limits.append(el('li', {}, el('b', {}, l.title), el('span', {}, l.text)));
  const imp = document.querySelector('[data-improvements]')!;
  for (const i of IMPROVEMENTS) imp.append(el('li', {}, i));
}

function buildTimeline(): void {
  const wrap = document.querySelector('[data-timeline]')!;
  const pos = (d: number) => `${((d - 1) / (E.durationDays - 1)) * 100}%`;
  const track = el('div', { class: 'tl-track' },
    el('div', { class: 'tl-axis' }),
    el('div', { class: 'tl-band tl-band-adapt', style: `left:${pos(1)};width:calc(${pos(7)} - ${pos(1)})` }),
    el('div', { class: 'tl-band tl-band-methane', style: `left:${pos(9)};width:calc(100% - ${pos(9)})` }),
    el('span', { class: 'tl-band-label', style: `left:0` }, 'Adaptación · gas bajo'),
    el('span', { class: 'tl-band-label', style: `left:${pos(9)}` }, 'Metano detectado (día 9 →)'),
  );
  const list = el('ul', { class: 'tl-markers', role: 'tablist', 'aria-label': 'Días registrados' });
  const panel = el('div', { class: 'tl-panel', role: 'tabpanel', id: 'tl-panel', 'aria-live': 'polite' });
  const buttons: HTMLButtonElement[] = [];

  const select = (i: number, focus = false) => {
    const t = TIMELINE[i];
    buttons.forEach((b, j) => {
      b.setAttribute('aria-selected', String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    if (focus) buttons[i].focus();
    panel.setAttribute('aria-labelledby', buttons[i].id);
    panel.replaceChildren(
      el('div', { class: 'tl-panel-day' }, el('span', {}, t.title), `Día ${t.day}`),
      el('div', {}, el('h4', {}, 'Observación del proceso'), el('p', {}, t.observation)),
      el('div', {}, el('h4', {}, 'Producción registrada'), el('p', {}, t.production)),
    );
  };

  TIMELINE.forEach((t, i) => {
    const btn = el('button', { class: 'tl-btn', type: 'button', role: 'tab', id: `tl-tab-${t.day}`, 'aria-controls': 'tl-panel' },
      el('span', { class: 'tl-day' }, `Día ${t.day}`), el('span', { class: 'tl-dot', 'aria-hidden': 'true' })) as HTMLButtonElement;
    btn.addEventListener('click', () => select(i));
    btn.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      let n = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % TIMELINE.length;
      if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + TIMELINE.length) % TIMELINE.length;
      if (k === 'Home') n = 0;
      if (k === 'End') n = TIMELINE.length - 1;
      if (n >= 0) { e.preventDefault(); select(n, true); }
    });
    buttons.push(btn);
    list.append(el('li', { class: 'tl-marker', style: `--pos:${pos(t.day)}`, role: 'presentation' }, btn));
  });
  track.append(list);
  wrap.append(track, panel);
  select(3);
}

function buildPeak(reducedMotion: boolean): void {
  const wrap = document.querySelector<HTMLElement>('[data-peak]')!;
  const fill = el('div', { class: 'peak-fill', style: `--w:${E.peakSharePct}%` }, `${E.peakMl} mL`);
  wrap.append(el('div', { class: 'peak' },
    el('h3', { class: 'block-title' }, `Día ${E.peakDay}: el día de mayor producción`),
    el('p', {}, `Ese único día se registraron ${E.peakMl} mL: el ${fmt(E.peakSharePct, 1)} % de todo el metano acumulado en 40 días.`),
    el('div', { class: 'peak-bar', role: 'img', 'aria-label': `Del total de ${E.totalMl} mL, ${E.peakMl} mL (${fmt(E.peakSharePct, 1)} %) se produjeron el día ${E.peakDay}; los otros ${E.restMl} mL corresponden al resto de la fase productiva.` },
      fill, el('span', { class: 'peak-rest' }, `${E.restMl} mL resto`)),
    el('p', { class: 'peak-legend' },
      el('span', {}, el('b', {}, `${E.peakMl} mL`), ` día ${E.peakDay}`),
      el('span', {}, el('b', {}, `${E.restMl} mL`), ' resto de la fase productiva (sin registro diario)'),
      el('span', {}, el('b', {}, `${E.totalMl} mL`), ' total'),
    ),
  ));
  if (!reducedMotion) {
    fill.style.transform = 'scaleX(0)';
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    }, { threshold: 0.5 });
    io.observe(wrap);
  }
}
