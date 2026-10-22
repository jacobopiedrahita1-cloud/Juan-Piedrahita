// Isotipo BIO DIGESTIÓN: una hoja dentro de un ciclo abierto que termina en un
// nodo de energía. La nervadura central dibuja una "B" de dos lóbulos.
// Usa currentColor para el ciclo y variables CSS para la hoja y el nodo, de modo
// que funcione sobre fondo claro u oscuro.

export function logoMark(size = 40, title = 'BIO DIGESTIÓN'): string {
  return `<svg class="logo-mark" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${title}">
  <path class="lm-cycle" d="M50.6 17.4A24 24 0 1 0 55.4 36" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/>
  <path class="lm-arrow" d="M44.6 12.2 52.4 15.2 51.1 23.3" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path class="lm-leaf" d="M19 45C18 31 27 20.5 44.5 19.5 45.5 37 35 46 21 46.2Z" fill="var(--lm-leaf, #12A36B)"/>
  <path class="lm-vein" d="M21.5 43.5 36.5 28.5M29 36l5.2.4M29 36l-.4-5.2" fill="none" stroke="var(--lm-vein, #F6F3EA)" stroke-width="2.4" stroke-linecap="round"/>
  <circle class="lm-node" cx="55.6" cy="36" r="4.6" fill="var(--lm-node, #B6F24A)"/>
</svg>`;
}

export function logoLockup(size = 36): string {
  return `<span class="logo">${logoMark(size)}<span class="logo-word"><b>BIO</b> DIGESTIÓN</span></span>`;
}

/** Favicon como data-URI (sin archivos externos: funciona offline). */
export function faviconHref(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#06140F"/><path d="M50.6 17.4A24 24 0 1 0 55.4 36" fill="none" stroke="#F6F3EA" stroke-width="4.6" stroke-linecap="round"/><path d="M44.6 12.2 52.4 15.2 51.1 23.3" fill="none" stroke="#F6F3EA" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 45C18 31 27 20.5 44.5 19.5 45.5 37 35 46 21 46.2Z" fill="#12A36B"/><path d="M21.5 43.5 32.2 32.8" stroke="#06140F" stroke-width="2.6" stroke-linecap="round"/><circle cx="55.6" cy="36" r="5" fill="#B6F24A"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
