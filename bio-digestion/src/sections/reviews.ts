import { el } from '../lib/dom';

// Opiniones guardadas SOLO en el navegador de este dispositivo (localStorage).
// No hay servidor: la interfaz lo dice explícitamente y no simula opiniones compartidas.

interface Review { id: string; name: string; rating: number; text: string; ts: number }

const KEY = 'biodigestion.reviews.v1';
const MIN_TEXT = 8, MAX_TEXT = 500, MAX_NAME = 40, COOLDOWN_MS = 20_000;
const STAR_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

function load(): Review[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Validar cada registro: no confiar en lo almacenado
    return data.filter((r): r is Review =>
      r && typeof r.id === 'string' && typeof r.text === 'string' && typeof r.name === 'string' &&
      Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 && typeof r.ts === 'number')
      .map((r) => ({ ...r, text: r.text.slice(0, MAX_TEXT), name: r.name.slice(0, MAX_NAME) }));
  } catch {
    return null;
  }
}

function save(list: Review[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
}

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim();

export function initReviews(): void {
  const root = document.querySelector<HTMLElement>('[data-reviews]')!;
  let reviews = load();
  const storageOk = reviews !== null;
  reviews ??= [];
  let lastSubmit = 0;
  let moderating = false;

  // ---------- Formulario ----------
  const stars = el('div', { class: 'stars' });
  for (let i = 5; i >= 1; i--) {
    const id = `star-${i}`;
    stars.append(
      el('input', { type: 'radio', name: 'rating', id, value: i, 'aria-label': `${i} de 5 estrellas: ${STAR_LABELS[i]}` }),
      el('label', { for: id, title: `${i} — ${STAR_LABELS[i]}`, 'aria-hidden': 'true' }, '★'),
    );
  }
  const ratingErr = el('p', { class: 'field-error', id: 'rating-err', 'aria-live': 'polite' });
  const nameInput = el('input', { type: 'text', id: 'rev-name', name: 'name', maxlength: MAX_NAME, autocomplete: 'off', placeholder: 'Ej.: Profe Marta' }) as HTMLInputElement;
  const textInput = el('textarea', { id: 'rev-text', name: 'text', maxlength: MAX_TEXT, required: true, 'aria-describedby': 'text-count text-err', placeholder: '¿Qué te pareció el proyecto? ¿Qué aprendiste?' }) as HTMLTextAreaElement;
  const count = el('span', { id: 'text-count' }, `0 / ${MAX_TEXT}`);
  const textErr = el('p', { class: 'field-error', id: 'text-err', 'aria-live': 'polite' });
  const honeypot = el('input', { type: 'text', name: 'website', tabindex: -1, autocomplete: 'off' }) as HTMLInputElement;
  const status = el('p', { class: 'form-status', role: 'status' });
  const submit = el('button', { class: 'btn btn-dark', type: 'submit' }, 'Publicar opinión') as HTMLButtonElement;

  const form = el('form', { class: 'review-form', novalidate: true, 'aria-labelledby': 'rev-title' },
    el('fieldset', { class: 'field', 'aria-describedby': 'rating-err' }, el('legend', {}, 'Tu valoración'), stars, ratingErr),
    el('div', { class: 'field' }, el('label', { for: 'rev-name' }, 'Nombre ', el('span', { class: 'opt' }, '(opcional)')), nameInput),
    el('div', { class: 'field' },
      el('label', { for: 'rev-text' }, 'Tu opinión'), textInput,
      el('div', { class: 'field-meta' }, el('span', {}, `Mínimo ${MIN_TEXT} caracteres`), count),
      textErr,
    ),
    el('div', { class: 'hp', 'aria-hidden': 'true' }, el('label', {}, 'No llenar', honeypot)),
    submit,
    status,
    el('p', { class: 'storage-note' }, el('span', { 'aria-hidden': 'true' }, 'ℹ️'),
      el('span', {}, 'Las opiniones se guardan solo en este navegador y dispositivo. No se envían a ningún servidor ni las ven otras personas en sus equipos. No escribas datos personales.')),
  ) as HTMLFormElement;

  if (!storageOk) {
    submit.disabled = true;
    status.className = 'form-status is-err';
    status.textContent = 'Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Las opiniones no se pueden guardar aquí.';
  }

  textInput.addEventListener('input', () => {
    count.textContent = `${textInput.value.length} / ${MAX_TEXT}`;
    if (textInput.getAttribute('aria-invalid') === 'true' && clean(textInput.value).length >= MIN_TEXT) {
      textInput.removeAttribute('aria-invalid'); textErr.textContent = '';
    }
  });
  stars.addEventListener('change', () => { ratingErr.textContent = ''; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = ''; status.className = 'form-status';
    if (honeypot.value) return; // bot
    const rating = Number((form.querySelector('input[name="rating"]:checked') as HTMLInputElement | null)?.value ?? 0);
    const text = clean(textInput.value);
    const name = clean(nameInput.value).slice(0, MAX_NAME);
    let bad = false;
    if (!rating) { ratingErr.textContent = 'Elige de 1 a 5 estrellas.'; bad = true; }
    if (text.length < MIN_TEXT) {
      textErr.textContent = `Escribe al menos ${MIN_TEXT} caracteres.`;
      textInput.setAttribute('aria-invalid', 'true');
      bad = true;
    }
    if (bad) {
      (rating ? textInput : form.querySelector<HTMLInputElement>('input[name="rating"]'))?.focus();
      return;
    }
    const now = Date.now();
    if (now - lastSubmit < COOLDOWN_MS) {
      status.className = 'form-status is-err';
      status.textContent = `Espera ${Math.ceil((COOLDOWN_MS - (now - lastSubmit)) / 1000)} s antes de publicar otra opinión.`;
      return;
    }
    const review: Review = { id: now.toString(36) + Math.random().toString(36).slice(2, 7), name, rating, text: text.slice(0, MAX_TEXT), ts: now };
    const next = [review, ...reviews!];
    if (!save(next)) {
      status.className = 'form-status is-err';
      status.textContent = 'No se pudo guardar la opinión en este navegador.';
      return;
    }
    reviews = next;
    lastSubmit = now;
    form.reset();
    count.textContent = `0 / ${MAX_TEXT}`;
    status.className = 'form-status is-ok';
    status.textContent = '¡Gracias! Tu opinión quedó guardada en este dispositivo.';
    renderList();
  });

  // ---------- Listado ----------
  const avgNode = el('span', { class: 'review-avg' });
  const countNode = el('span', { class: 'review-count' });
  const list = el('ul', { class: 'review-list', 'aria-live': 'polite' });
  const exportBtn = el('button', { class: 'btn btn-outline btn-sm', type: 'button' }, 'Exportar (.csv)') as HTMLButtonElement;
  const modBtn = el('button', { class: 'btn btn-outline btn-sm', type: 'button', 'aria-pressed': 'false' }, 'Moderar') as HTMLButtonElement;

  exportBtn.addEventListener('click', () => {
    const rows = [['fecha', 'nombre', 'estrellas', 'opinion'], ...reviews!.map((r) => [new Date(r.ts).toISOString(), r.name, String(r.rating), r.text])];
    // Escapar comillas y neutralizar fórmulas al abrir en hojas de cálculo
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `opiniones-bio-digestion-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  modBtn.addEventListener('click', () => {
    moderating = !moderating;
    modBtn.setAttribute('aria-pressed', String(moderating));
    modBtn.textContent = moderating ? 'Terminar moderación' : 'Moderar';
    renderList();
  });

  function renderList() {
    const n = reviews!.length;
    const avg = n ? reviews!.reduce((s, r) => s + r.rating, 0) / n : 0;
    avgNode.textContent = n ? avg.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' ★' : '—';
    countNode.textContent = n === 1 ? '1 opinión en este dispositivo' : `${n} opiniones en este dispositivo`;
    exportBtn.disabled = n === 0;
    modBtn.disabled = n === 0 && !moderating;
    if (!n) {
      list.replaceChildren(el('li', { class: 'review-empty' }, 'Todavía no hay opiniones en este dispositivo. ¡Sé el primero en opinar!'));
      return;
    }
    list.replaceChildren(...reviews!.map((r) => {
      const del = moderating ? el('button', { class: 'review-del', type: 'button', 'aria-label': `Eliminar opinión de ${r.name || 'visitante anónimo'}` }, 'Eliminar') : null;
      del?.addEventListener('click', () => {
        if (!confirm('¿Eliminar esta opinión de este dispositivo?')) return;
        const next = reviews!.filter((x) => x.id !== r.id);
        if (save(next)) { reviews = next; renderList(); }
      });
      return el('li', { class: 'review-item' },
        el('header', {},
          el('span', { class: 'review-name' }, r.name || 'Visitante anónimo'),
          el('span', { class: 'review-stars', 'aria-label': `${r.rating} de 5 estrellas` }, '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)),
        ),
        el('p', { class: 'review-text' }, r.text),
        el('div', { class: 'review-date' },
          el('time', { datetime: new Date(r.ts).toISOString() }, new Date(r.ts).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })),
          del,
        ),
      );
    }));
  }

  const listWrap = el('div', {},
    el('div', { class: 'review-list-head' },
      el('div', { class: 'review-summary' }, avgNode, countNode),
      el('div', { class: 'review-tools' }, exportBtn, modBtn),
    ),
    list,
  );
  root.append(form, listWrap);
  renderList();
}
