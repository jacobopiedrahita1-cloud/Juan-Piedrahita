import { BINS, QUIZ, WASTE, type Bin, type WasteItem } from '../data/game';
import { el, shuffle } from '../lib/dom';
import { sound } from '../lib/sound';

const SORT_POINTS = 10;
const QUIZ_POINTS = 15;

/** ECO RETO: fase 1 clasificar residuos, fase 2 preguntas. */
export function initGame(reducedMotion: boolean): void {
  const root = document.querySelector<HTMLElement>('[data-game]')!;

  let items: WasteItem[] = [];
  let quiz = QUIZ;
  let index = 0;
  let score = 0;
  let sortOk = 0;
  let quizOk = 0;
  let phase: 'intro' | 'sort' | 'quiz' | 'end' = 'intro';
  let awaitingNext = false;

  const scoreNode = el('b', {}, '0');
  const phaseNode = el('span', { class: 'game-phase' });
  const soundBtn = el('button', { class: 'sound-btn', type: 'button', 'aria-pressed': String(sound.enabled) }) as HTMLButtonElement;
  const paintSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.enabled));
    soundBtn.textContent = sound.enabled ? '🔊 Sonido activado' : '🔈 Activar sonido';
  };
  paintSound();
  soundBtn.addEventListener('click', () => { sound.set(!sound.enabled); paintSound(); });

  const progressFill = el('div', { class: 'progress-fill' });
  const progress = el('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progreso del juego', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, progressFill);
  const body = el('div', { class: 'game-body' });
  const live = el('p', { class: 'sr-only', 'aria-live': 'polite' });

  root.append(
    el('div', { class: 'game-top' }, el('span', { class: 'game-score' }, 'Puntos: ', scoreNode), phaseNode, soundBtn),
    progress, body, live,
  );

  const totalSteps = () => items.length + quiz.length;
  const setProgress = (done: number) => {
    const p = totalSteps() ? Math.round((done / totalSteps()) * 100) : 0;
    progressFill.style.setProperty('--p', p + '%');
    progress.setAttribute('aria-valuenow', String(p));
  };
  const setScore = (s: number) => { score = s; scoreNode.textContent = String(s); };

  // ---------- Intro ----------
  function renderIntro() {
    phase = 'intro';
    phaseNode.textContent = '';
    setProgress(0);
    const start = el('button', { class: 'btn btn-primary', type: 'button' }, 'Comenzar el reto →');
    start.addEventListener('click', startGame);
    body.replaceChildren(el('div', { class: 'game-intro' },
      el('h3', {}, '¿Listo para alimentar el biodigestor?'),
      el('p', {}, 'Aparecerán 10 residuos. Decide si van al biodigestor, si solo sirven con moderación o si no van. Después responde 6 preguntas.'),
      el('ul', { class: 'game-rules' },
        el('li', {}, el('b', {}, 'Arrastra'), 'la tarjeta hasta una caneca.'),
        el('li', {}, el('b', {}, 'O toca'), 'una caneca para enviar el residuo.'),
        el('li', {}, el('b', {}, 'Teclado:'), 'teclas 1, 2 y 3; Enter para continuar.'),
      ),
      start,
    ));
  }

  function startGame() {
    sound.play('tap');
    const by = (b: Bin) => shuffle(WASTE.filter((w) => w.bin === b));
    items = shuffle([...by('si').slice(0, 4), ...by('moderacion').slice(0, 2), ...by('no').slice(0, 4)]);
    quiz = shuffle(QUIZ).map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
    });
    index = 0; sortOk = 0; quizOk = 0;
    setScore(0);
    phase = 'sort';
    renderSort();
  }

  // ---------- Clasificación ----------
  let binButtons: HTMLButtonElement[] = [];
  let card: HTMLElement | null = null;

  function renderSort() {
    awaitingNext = false;
    const item = items[index];
    phaseNode.textContent = `Residuo ${index + 1} de ${items.length}`;
    setProgress(index);
    card = el('div', { class: 'waste-card', role: 'group', tabindex: -1, 'aria-label': `Residuo: ${item.name}. Usa las teclas 1, 2 o 3.` },
      el('span', { class: 'waste-icon', 'aria-hidden': 'true' }, item.icon),
      el('span', { class: 'waste-name' }, item.name),
      el('span', { class: 'waste-hint', 'aria-hidden': 'true' }, 'Arrástrame o elige una caneca'),
    );
    binButtons = BINS.map((b) => {
      const btn = el('button', { class: 'bin', type: 'button', 'data-bin': b.id, 'aria-keyshortcuts': b.key },
        el('span', { class: 'bin-key', 'aria-hidden': 'true' }, b.key),
        el('span', { class: 'bin-label' }, b.label),
        el('span', { class: 'bin-hint' }, b.hint),
      ) as HTMLButtonElement;
      btn.addEventListener('click', () => answerSort(b.id));
      return btn;
    });
    body.replaceChildren(el('div', { class: 'sort-area' },
      el('div', { class: 'card-slot' }, card),
      el('div', { class: 'bins', role: 'group', 'aria-label': '¿Dónde va este residuo?' }, ...binButtons),
      el('div', { class: 'feedback-slot' }),
    ));
    enableDrag(card);
    live.textContent = `Residuo ${index + 1}: ${item.name}. ¿Dónde va?`;
    if (index > 0) card.focus({ preventScroll: true });
  }

  function enableDrag(node: HTMLElement) {
    let sx = 0, sy = 0, dragging = false, pid = -1;
    const over = (x: number, y: number) => binButtons.find((b) => {
      const r = b.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    node.addEventListener('pointerdown', (e) => {
      if (awaitingNext) return;
      dragging = true; pid = e.pointerId; sx = e.clientX; sy = e.clientY;
      node.setPointerCapture(pid);
      node.classList.add('is-dragging');
      node.classList.remove('is-returning');
    });
    node.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      node.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.04}deg)`;
      const hit = over(e.clientX, e.clientY);
      binButtons.forEach((b) => b.classList.toggle('is-over', b === hit));
    });
    const end = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      node.classList.remove('is-dragging');
      const hit = over(e.clientX, e.clientY);
      binButtons.forEach((b) => b.classList.remove('is-over'));
      if (hit) {
        answerSort(hit.dataset.bin as Bin);
      } else {
        node.classList.add('is-returning');
        node.style.transform = '';
      }
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }

  function answerSort(bin: Bin) {
    if (phase !== 'sort' || awaitingNext) return;
    awaitingNext = true;
    const item = items[index];
    const ok = bin === item.bin;
    if (ok) { sortOk++; setScore(score + SORT_POINTS); }
    sound.play(ok ? 'ok' : 'bad');
    binButtons.forEach((b) => { b.disabled = true; });
    const right = BINS.find((b) => b.id === item.bin)!;
    if (card) {
      const target = binButtons.find((b) => b.dataset.bin === bin)!;
      if (!reducedMotion) {
        const cr = card.getBoundingClientRect(), tr = target.getBoundingClientRect();
        card.classList.add('is-returning');
        card.style.transform = `translate(${tr.left + tr.width / 2 - (cr.left + cr.width / 2) + parseTranslate(card.style.transform).x}px, ${tr.top + tr.height / 2 - (cr.top + cr.height / 2) + parseTranslate(card.style.transform).y}px) scale(.35)`;
        card.style.opacity = '0';
        card.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1), opacity .45s';
      } else {
        card.style.opacity = '0.3';
      }
    }
    const next = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, index + 1 < items.length ? 'Siguiente residuo →' : 'Ir a las preguntas →');
    next.addEventListener('click', advanceSort);
    const fb = el('div', { class: 'feedback ' + (ok ? 'is-ok' : 'is-bad') },
      el('p', { class: 'feedback-title' }, ok ? '✓ ¡Correcto!' : `✗ Va en “${right.label}”`),
      el('p', {}, `${item.name}: ${item.why}`),
      next,
    );
    body.querySelector('.feedback-slot')!.replaceChildren(fb);
    live.textContent = (ok ? 'Correcto. ' : `Incorrecto, va en ${right.label}. `) + item.why;
    next.focus({ preventScroll: true });
  }

  function advanceSort() {
    index++;
    if (index < items.length) renderSort();
    else { index = 0; phase = 'quiz'; renderQuiz(); }
  }

  // ---------- Preguntas ----------
  function renderQuiz() {
    awaitingNext = false;
    const q = quiz[index];
    phaseNode.textContent = `Pregunta ${index + 1} de ${quiz.length}`;
    setProgress(items.length + index);
    const opts = q.options.map((o, i) => {
      const b = el('button', { class: 'quiz-opt', type: 'button', 'aria-keyshortcuts': String(i + 1) },
        el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)) as HTMLButtonElement;
      b.addEventListener('click', () => answerQuiz(i, opts));
      return b;
    });
    const h = el('h3', { class: 'quiz-q', tabindex: -1 }, q.q);
    body.replaceChildren(el('div', {}, h, el('div', { class: 'quiz-options' }, ...opts), el('div', { class: 'feedback-slot' })));
    live.textContent = `Pregunta ${index + 1}: ${q.q}`;
    h.focus({ preventScroll: true });
  }

  function answerQuiz(choice: number, opts: HTMLButtonElement[]) {
    if (awaitingNext) return;
    awaitingNext = true;
    const q = quiz[index];
    const ok = choice === q.answer;
    if (ok) { quizOk++; setScore(score + QUIZ_POINTS); }
    sound.play(ok ? 'ok' : 'bad');
    opts.forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) { b.classList.add('is-correct'); b.append(el('span', { class: 'opt-mark' }, '✓')); }
      else if (i === choice) { b.classList.add('is-wrong'); b.append(el('span', { class: 'opt-mark' }, '✗')); }
    });
    const next = el('button', { class: 'btn btn-primary btn-sm', type: 'button' }, index + 1 < quiz.length ? 'Siguiente pregunta →' : 'Ver resultado →');
    next.addEventListener('click', () => { index++; if (index < quiz.length) renderQuiz(); else renderEnd(); });
    body.querySelector('.feedback-slot')!.replaceChildren(el('div', { class: 'feedback ' + (ok ? 'is-ok' : 'is-bad') },
      el('p', { class: 'feedback-title' }, ok ? '✓ ¡Correcto!' : `✗ La respuesta es: ${q.options[q.answer]}`),
      el('p', {}, q.why),
      next,
    ));
    live.textContent = (ok ? 'Correcto. ' : 'Incorrecto. ') + q.why;
    next.focus({ preventScroll: true });
  }

  // ---------- Final ----------
  function renderEnd() {
    phase = 'end';
    phaseNode.textContent = 'Resultado';
    setProgress(totalSteps());
    const max = items.length * SORT_POINTS + quiz.length * QUIZ_POINTS;
    const pct = score / max;
    const title = pct >= 0.9 ? '¡Experto en biodigestión!' : pct >= 0.65 ? '¡Muy bien! Vas por buen camino.' : '¡Buen intento! Vuelve a jugar y mejora.';
    sound.play(pct >= 0.65 ? 'win' : 'tap');
    const again = el('button', { class: 'btn btn-primary', type: 'button' }, 'Jugar otra vez ↻');
    again.addEventListener('click', startGame);
    const h = el('h3', { tabindex: -1 }, title);
    body.replaceChildren(el('div', { class: 'game-end' },
      h,
      el('p', { class: 'end-score', 'aria-label': `${score} de ${max} puntos` }, String(score)),
      el('p', {}, `de ${max} puntos posibles`),
      el('ul', { class: 'end-stats' },
        el('li', {}, `Residuos bien clasificados: ${sortOk}/${items.length}`),
        el('li', {}, `Preguntas correctas: ${quizOk}/${quiz.length}`),
      ),
      again,
    ));
    live.textContent = `${title} ${score} de ${max} puntos.`;
    h.focus({ preventScroll: true });
  }

  // Atajos de teclado cuando el juego está a la vista y el foco no está en un campo de texto
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!root.contains(t) && !isInView(root)) return;
    if (phase === 'sort' && !awaitingNext) {
      const b = BINS.find((x) => x.key === e.key);
      if (b) { e.preventDefault(); answerSort(b.id); }
    } else if (phase === 'quiz' && !awaitingNext) {
      const n = Number(e.key);
      const opts = Array.from(body.querySelectorAll<HTMLButtonElement>('.quiz-opt'));
      if (n >= 1 && n <= opts.length) { e.preventDefault(); opts[n - 1].click(); }
    }
  });

  renderIntro();
}

function isInView(node: HTMLElement): boolean {
  const r = node.getBoundingClientRect();
  return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4;
}

function parseTranslate(t: string): { x: number; y: number } {
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(t);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
}
