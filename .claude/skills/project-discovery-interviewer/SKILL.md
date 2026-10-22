---
name: project-discovery-interviewer
description: Entrevista adaptativa para descubrir requisitos, restricciones y prioridades antes de construir un proyecto complejo (webs, apps, experiencias 3D, juegos, sistemas). Úsala cuando el usuario pida construir algo grande y todavía falten decisiones que cambian el resultado: plataforma, hosting, datos, rendimiento, dispositivos, estética, persistencia, alcance. También cuando un prompt maestro ordene "entrevístame antes de programar".
---

# Project Discovery Interviewer

Convierte una idea general en una especificación aprobada, sin interrogatorios inútiles.

## Principios

1. **Lee antes de preguntar.** Extrae todo lo que ya está en el prompt, archivos adjuntos, imágenes y el repositorio. Nunca preguntes lo que ya se sabe.
2. **Solo preguntas que cambian el resultado.** Si una respuesta no altera arquitectura, diseño, alcance o riesgos, decide tú con criterio profesional y dilo en una línea ("Propongo X porque Y; dime si no").
3. **Grupos pequeños y temáticos.** 3–5 preguntas por turno, agrupadas por tema. Cada pregunta con opciones concretas y una recomendada cuando haya un default razonable.
4. **Adapta.** Cada ronda se construye sobre la anterior. Si una respuesta abre un riesgo (p. ej. "sin internet en la feria"), profundiza ahí antes de seguir.
5. **Aclara lo ambiguo** antes de cerrar. "Algo moderno" o "lo que tú veas" sobre una decisión crítica → ofrece 2–3 opciones concretas.
6. **Descubre restricciones ocultas**: dónde vive el código (¿hay ya otro sitio en el repo?), cómo se publica, quién lo presenta, en qué dispositivo, con qué conectividad, fecha límite, qué cuentas existen, qué no puede fallar.
7. **Honestidad técnica.** No prometas capacidades, librerías, servicios o activos que no existen en el entorno. Si algo es inviable, dilo y ofrece alternativa.

## Flujo

1. **Inventario silencioso**: lista para ti lo conocido, lo desconocido y lo decidible por criterio.
2. **Presentación breve** (2–3 líneas) + lo que ya sabes resumido + hallazgos relevantes del entorno.
3. **Rondas de preguntas** (normalmente 2–4 rondas). Orden típico:
   - Infraestructura y entrega (plataforma, hosting, conectividad, dispositivos, plazo).
   - Datos y persistencia (backend, moderación, privacidad).
   - Dirección visual y referencias.
   - Funcionalidades específicas (juego, interacciones, contenido).
4. Tras cada respuesta: una línea "Entendido: …" y la siguiente ronda.
5. **Pregunta de cierre**: "¿Algo importante que no haya preguntado?"
6. **Síntesis** (ver formato) y **espera aprobación explícita**. No construyas antes.

## Formato de síntesis

- Objetivo y público
- Decisiones tomadas (tabla: tema → decisión → motivo)
- Alcance incluido / fuera de alcance
- Arquitectura y stack
- Restricciones y riesgos
- Criterios de aceptación verificables
- Pendientes (si quedan)
- "¿Apruebas esta especificación para empezar?"

## Errores a evitar

- Repetir datos conocidos o hacer cuestionarios de 20 preguntas.
- Preguntas genéricas aplicables a cualquier proyecto.
- Empezar a programar antes de la aprobación.
- Aceptar "sí, todo" en decisiones con coste (3D pesado + móvil viejo + sin internet).
