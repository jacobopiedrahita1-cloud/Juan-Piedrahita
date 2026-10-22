// Única fuente de verdad de los datos del experimento.
// Todo valor proviene del informe "Producción de metano a partir de residuos de
// frutas y verduras en un biodigestor escolar durante 40 días de operación" (2026).
// No agregar valores que no estén en el informe.

export const EXPERIMENT = {
  durationDays: 40,
  firstMethaneDay: 9,
  peakDay: 14,
  peakMl: 200,
  totalMl: 802,
  totalL: 0.802,
  /** 200 ÷ 802 × 100 */
  peakSharePct: 24.9,
  /** 802 ÷ 32 días (9 a 40, ambos incluidos) */
  avgProductiveMlDay: 25.1,
  productiveDays: 32,
  /** 802 ÷ 40 ≈ 20,05 */
  avgFullMlDay: 20.1,
  /** 802 − 200, aportados por los 31 días restantes de la fase productiva */
  restMl: 602,
} as const;

export interface TimelineEntry {
  day: number;
  title: string;
  observation: string;
  production: string;
  phase: 'adaptacion' | 'metano';
}

/** Tabla 1 del informe: los seis momentos registrados. */
export const TIMELINE: TimelineEntry[] = [
  {
    day: 1,
    title: 'Carga',
    observation: 'Se colocaron residuos de frutas y verduras en el biodigestor.',
    production: 'No se produjo metano.',
    phase: 'adaptacion',
  },
  {
    day: 7,
    title: 'Fin de la adaptación',
    observation: 'Terminó el período inicial de adaptación del biodigestor.',
    production: 'Producción de gas todavía baja.',
    phase: 'adaptacion',
  },
  {
    day: 9,
    title: 'Primer metano',
    observation: 'Comenzó a producirse metano.',
    production: 'Se empezó a detectar metano.',
    phase: 'metano',
  },
  {
    day: 14,
    title: 'Máximo diario',
    observation: 'Se presentó la mayor producción diaria registrada.',
    production: '200 mL de metano en el día.',
    phase: 'metano',
  },
  {
    day: 30,
    title: 'Controles',
    observation: 'El proceso continuó y se realizaron controles de pH y temperatura.',
    production: 'Continuó la producción de gas.',
    phase: 'metano',
  },
  {
    day: 40,
    title: 'Cierre',
    observation: 'Terminó el tiempo de funcionamiento del biodigestor.',
    production: 'Producción total: 0,802 L (802 mL) de metano.',
    phase: 'metano',
  },
];

export const LIMITATIONS = [
  { title: 'Un único ensayo', text: 'Sin repeticiones, no es posible estimar la variabilidad de los resultados.' },
  { title: 'Seis registros', text: 'Se conservó el registro de seis días (1, 7, 9, 14, 30 y 40), no una serie diaria.' },
  { title: 'pH y temperatura sin valores', text: 'Se hicieron controles, pero sus valores numéricos no están en los registros analizados.' },
  { title: 'Composición del gas no medida', text: 'No se midió qué proporción del gas era metano y cuál dióxido de carbono.' },
  { title: 'Sin control ni comparación', text: 'No se comparó con un biodigestor de control ni con otro tipo de residuo.' },
  { title: 'Turbina no comprobada', text: 'La generación con turbina y generador es una propuesta conceptual: no se midió ni se demostró.' },
];

export const IMPROVEMENTS = [
  'Registrar el volumen de gas todos los días.',
  'Anotar los valores de pH y temperatura en una tabla.',
  'Repetir el experimento al menos dos o tres veces.',
  'Medir la composición del gas (metano y CO₂).',
  'Comparar distintos tipos o cantidades de residuos.',
  'Evaluar a mayor escala si el gas puede almacenarse y usarse como combustible.',
];

/** Valores de referencia bibliográfica (no medidos en el experimento). */
export const BIOGAS_REFERENCE = {
  ch4: [55, 70],
  co2: [30, 45],
  source: 'Varnero Moreno, 2011',
  phRange: [6.0, 8.0],
  mesophilicC: [25, 35],
  mesophilicDays: [30, 60],
} as const;

export const REFERENCES = [
  {
    text: 'Hassanein, A., Lansing, S., y Delp, D. (2024). Digestión anaeróbica (EBR-2023-0686). University of Maryland Extension.',
    url: 'https://extension.umd.edu/sites/extension.umd.edu/files/2024-10/Digesti%C3%B3n_Anaer%C3%B3bica_EBR-2023-0686_Spanish_ada.pdf',
  },
  {
    text: 'Varnero Moreno, M. T. (2011). Manual de biogás. Organización de las Naciones Unidas para la Alimentación y la Agricultura.',
    url: 'https://www.fao.org/4/as400s/as400s.pdf',
  },
];

export const TEAM = {
  members: ['Juan Pablo Piedrahita Hurtado', 'Juan Miguel Piedrahita Hurtado', 'Jerónimo Muñoz Moreno'],
  grade: '11-A',
  school: 'Institución Educativa Aureliano Flórez Cardona',
  place: 'Anserma, Caldas, Colombia',
  year: 2026,
};

const nf = (d: number) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmt = (n: number, decimals = 0) => nf(decimals).format(n);
