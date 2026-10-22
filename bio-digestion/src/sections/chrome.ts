import { REFERENCES, TEAM } from '../data/experiment';
import { el } from '../lib/dom';
import { logoLockup, logoMark } from '../lib/logo';

/** Logo, menú móvil, créditos, referencias. */
export function initChrome(): void {
  document.querySelectorAll<HTMLElement>('[data-logo]').forEach((n) => {
    n.innerHTML = n.dataset.logo === 'lockup' ? logoLockup(34) : logoMark(150);
  });

  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const list = document.querySelector<HTMLElement>('[data-nav-list]')!;
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only')!.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    list.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && list.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });

  const names = document.querySelector('[data-team]')!;
  TEAM.members.forEach((m) => names.append(el('li', {}, m)));
  const meta = document.querySelector('[data-team-meta]')!;
  ([['Grado', TEAM.grade], ['Institución', TEAM.school], ['Lugar', TEAM.place], ['Año', String(TEAM.year)]] as const)
    .forEach(([k, v]) => meta.append(el('div', {}, el('dt', {}, k), el('dd', {}, v))));

  const refs = document.querySelector('[data-refs]')!;
  REFERENCES.forEach((r) => refs.append(el('li', {}, r.text + ' ', el('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.url))));
}

/** Ilustración 2D del sistema cuando WebGL no está disponible. */
export const FALLBACK_SVG = `
<svg viewBox="0 0 640 420" role="img" aria-label="Ilustración del biodigestor: frasco con residuos, manguera hacia un globo de gas y una turbina conceptual">
  <defs>
    <linearGradient id="fb-liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9873B" stop-opacity=".75"/><stop offset="1" stop-color="#5A3818"/></linearGradient>
    <radialGradient id="fb-bal" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7BE3A6"/><stop offset="1" stop-color="#1E8A52"/></radialGradient>
  </defs>
  <ellipse cx="300" cy="392" rx="260" ry="16" fill="#000" opacity=".35"/>
  <rect x="90" y="120" width="170" height="262" rx="26" fill="rgba(232,255,244,.08)" stroke="rgba(232,255,244,.5)" stroke-width="3"/>
  <rect x="96" y="200" width="158" height="176" rx="20" fill="url(#fb-liq)"/>
  <g fill="#F08A1C"><circle cx="140" cy="260" r="16"/><circle cx="205" cy="300" r="13"/><circle cx="170" cy="340" r="11"/></g>
  <g fill="#2E9E4F"><ellipse cx="200" cy="245" rx="20" ry="8" transform="rotate(-25 200 245)"/><ellipse cx="130" cy="320" rx="18" ry="7" transform="rotate(30 130 320)"/></g>
  <rect x="98" y="96" width="154" height="30" rx="8" fill="#C8282E"/>
  <path d="M200 96 C205 50 280 40 330 70 S410 140 440 150" fill="none" stroke="rgba(230,255,242,.6)" stroke-width="10" stroke-linecap="round"/>
  <path d="M200 96 C205 50 280 40 330 70 S410 140 440 150" fill="none" stroke="#B6F24A" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
  <ellipse cx="470" cy="100" rx="68" ry="78" fill="url(#fb-bal)"/>
  <path d="M440 150 L455 250 L470 300" fill="none" stroke="rgba(230,255,242,.6)" stroke-width="10" stroke-linecap="round"/>
  <g transform="translate(500 320)" fill="none" stroke="#B6F24A" stroke-width="3" stroke-dasharray="6 5" opacity=".9">
    <circle r="44"/><path d="M0 -40 L0 40 M-40 0 L40 0 M-28 -28 L28 28 M-28 28 L28 -28"/>
  </g>
  <text x="500" y="392" text-anchor="middle" fill="#FF9C7A" font-family="monospace" font-size="13">TURBINA · PROPUESTA</text>
</svg>`;
