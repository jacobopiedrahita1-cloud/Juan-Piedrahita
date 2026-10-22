import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SceneController } from '../scene/scene';

gsap.registerPlugin(ScrollTrigger);

/** Conecta el scroll con la escena 3D, las revelaciones y la cabecera. */
export function initStory(scene: SceneController | null, reducedMotion: boolean): void {
  const stage = document.getElementById('stage')!;
  const header = document.querySelector<HTMLElement>('[data-header]')!;

  // Cabecera con fondo al desplazarse
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
  });

  // Entrada del hero
  if (!reducedMotion) {
    gsap.from('[data-reveal]', { opacity: 0, y: 22, duration: 1, ease: 'power3.out', stagger: 0.09, delay: 0.15 });
    gsap.to('.hero-inner', {
      opacity: 0, y: -60, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true },
    });
    gsap.utils.toArray<HTMLElement>('.chapter-card').forEach((card) => {
      gsap.from(card, {
        opacity: 0, y: 50, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    });
  }

  // Paso actual de la escena según el capítulo visible
  const chapters = gsap.utils.toArray<HTMLElement>('[data-step]');
  chapters.forEach((ch) => {
    const n = Number(ch.dataset.step);
    ScrollTrigger.create({
      trigger: ch,
      start: 'top 62%',
      end: 'bottom 38%',
      onToggle: (self) => { if (self.isActive) scene?.setStep(n); },
    });
  });
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom 62%',
    onToggle: (self) => { if (self.isActive) scene?.setStep(0); },
  });

  // Etapas de la digestión que se iluminan según el avance del capítulo 3
  const stages = gsap.utils.toArray<HTMLElement>('[data-stages] .stage-item');
  const ch3 = document.querySelector('[data-step="3"]');
  if (ch3 && stages.length) {
    const paint = (idx: number) => stages.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.classList.toggle('is-done', i < idx);
    });
    paint(reducedMotion ? 3 : -1);
    if (!reducedMotion) {
      ScrollTrigger.create({
        trigger: ch3,
        start: 'top 70%',
        end: 'bottom 45%',
        onUpdate: (self) => paint(Math.min(3, Math.floor(self.progress * 4.4))),
        onLeave: () => paint(3),
      });
    }
  }

  // Pausar el 3D cuando la narrativa ya no está en pantalla
  ScrollTrigger.create({
    trigger: '#experimento',
    start: 'top top',
    end: 'max',
    onToggle: (self) => {
      scene?.setActive(!self.isActive);
      stage.classList.toggle('is-hidden', self.isActive);
    },
  });

  // Navegación: enlace activo
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-list a'));
  links.forEach((a) => {
    const target = document.querySelector(a.getAttribute('href')!);
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => { if (self.isActive) links.forEach((l) => l.toggleAttribute('aria-current', l === a)); if (self.isActive) a.setAttribute('aria-current', 'true'); },
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
}
