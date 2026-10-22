# BIO DIGESTIÓN · Energía a partir de residuos orgánicos

Experiencia web 3D e interactiva del proyecto de feria de ciencias
**“Producción de metano a partir de residuos de frutas y verduras en un biodigestor escolar durante 40 días”**.

Juan Pablo Piedrahita Hurtado · Juan Miguel Piedrahita Hurtado · Jerónimo Muñoz Moreno
Grado 11-A · Institución Educativa Aureliano Flórez Cardona · Anserma, Caldas, Colombia · 2026

---

## Abrir la versión SIN internet (para la feria)

El archivo `entrega/BIO-DIGESTION-offline.html` trae todo dentro: código, 3D, tipografías y la foto.

1. Copia el archivo al portátil del stand (USB, Drive, correo…).
2. Ábrelo con doble clic en **Chrome** o **Edge**.
3. Funciona sin conexión. Las opiniones se guardan en ese navegador.

> Usa siempre el mismo navegador y el mismo archivo durante la feria, para que las opiniones se acumulen en un solo lugar.
> Al final del día, en la sección **Opiniones**, pulsa **Exportar (.csv)** para guardarlas.

## Ejecutar en modo desarrollo

Requisitos: Node.js 20.19 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
```

## Compilar

```bash
npm run build          # dist/          → versión web (GitHub Pages)
npm run build:offline  # dist-offline/  → un único index.html que abre sin internet
npm run preview        # sirve dist/ en http://localhost:4173
```

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio `bio-digestion`, en la rama `main`.
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El flujo `.github/workflows/deploy.yml` compila y publica en cada `push` a `main`.
4. La dirección será `https://<tu-usuario>.github.io/bio-digestion/`. Con ella puedes generar el código QR para el stand.

## Estructura

```
index.html               Contenido semántico de todas las secciones
src/
  main.ts                Arranque: cada sección se inicia por separado
  data/experiment.ts     ÚNICA fuente de datos del experimento (del informe)
  data/game.ts           Residuos y preguntas del ECO RETO
  scene/objects.ts       Geometrías 3D procedurales (frasco, residuos, globo, turbina…)
  scene/scene.ts         Escena Three.js, estados por capítulo, calidad adaptable
  sections/story.ts      Scroll narrativo (GSAP ScrollTrigger) ↔ escena 3D
  sections/results.ts    Contadores, cronología, día de máximo, limitaciones
  sections/game.ts       Minijuego (arrastrar, tocar o teclado; preguntas)
  sections/reviews.ts    Opiniones en localStorage, validación, exportar, moderar
  sections/chrome.ts     Logo, menú, créditos, referencias, ilustración sin WebGL
  lib/                   Logo SVG, utilidades DOM, sonido sintetizado
  styles/                Tokens del sistema de diseño y estilos por sección
```

## Decisiones importantes

- **Datos**: solo los del informe (40 días, día 9, 200 mL el día 14, 802 mL, 24,9 %, 25,1 y ≈20,1 mL/día). No hay curva diaria, porque no existe un registro diario y una curva obligaría a inventar valores.
- **Turbina y generador**: se muestran como *propuesta conceptual*, con estética de holograma y la advertencia correspondiente.
- **Opiniones**: se guardan únicamente en el navegador (localStorage), y la página lo dice. El texto se muestra siempre como texto plano, nunca como HTML. Incluye un campo trampa para bots, una espera de 20 s entre envíos, un modo de moderación local y exportación a CSV.
- **3D**: todo es procedural, sin modelos descargados. En celulares y equipos modestos se reduce la calidad automáticamente. Sin WebGL se muestra una ilustración SVG. Con `prefers-reduced-motion` la escena queda estática.
- Para probar la ilustración sin 3D, agrega `?no3d` a la URL.

## Dependencias

- `three`: 3D
- `gsap`: animaciones ligadas al scroll
- `vite`, `typescript`, `vite-plugin-singlefile`: compilación (desarrollo)
- Tipografías Bricolage Grotesque, Inter y JetBrains Mono (Fontsource), incluidas localmente
