// Contenido del ECO RETO. Las explicaciones son deliberadamente prudentes:
// se trata de un biodigestor escolar pequeño, no de una planta industrial.

export type Bin = 'si' | 'moderacion' | 'no';

export interface WasteItem {
  id: string;
  icon: string;
  name: string;
  bin: Bin;
  why: string;
}

export const BINS: { id: Bin; label: string; hint: string; key: string }[] = [
  { id: 'si', label: 'Al biodigestor', hint: 'Buen sustrato', key: '1' },
  { id: 'moderacion', label: 'Con moderación', hint: 'Sirve, pero en poca cantidad', key: '2' },
  { id: 'no', label: 'No va', hint: 'No es sustrato adecuado', key: '3' },
];

export const WASTE: WasteItem[] = [
  { id: 'platano', icon: '🍌', name: 'Cáscara de plátano', bin: 'si', why: 'Materia orgánica blanda que los microorganismos degradan con facilidad.' },
  { id: 'lechuga', icon: '🥬', name: 'Hojas de lechuga', bin: 'si', why: 'Se descomponen rápido y aportan humedad a la mezcla.' },
  { id: 'zanahoria', icon: '🥕', name: 'Restos de zanahoria', bin: 'si', why: 'Restos de verdura: justo el tipo de residuo usado en nuestro experimento.' },
  { id: 'sandia', icon: '🍉', name: 'Cáscara de sandía', bin: 'si', why: 'Tiene mucha agua y azúcares fáciles de degradar.' },
  { id: 'tomate', icon: '🍅', name: 'Tomate en mal estado', bin: 'si', why: 'Fruta blanda: se hidroliza rápido en la primera etapa del proceso.' },
  { id: 'papa', icon: '🥔', name: 'Cáscaras de papa', bin: 'si', why: 'Contienen almidón que los microorganismos pueden aprovechar.' },
  { id: 'mango', icon: '🥭', name: 'Cáscara de mango', bin: 'si', why: 'Residuo de fruta biodegradable, apto como sustrato.' },
  { id: 'naranja', icon: '🍊', name: 'Cáscaras de naranja', bin: 'moderacion', why: 'Sirven (¡las usamos!), pero en exceso aportan acidez y aceites que pueden frenar a los microorganismos.' },
  { id: 'limon', icon: '🍋', name: 'Limones', bin: 'moderacion', why: 'Son muy ácidos: mucha cantidad puede bajar el pH por debajo de lo que toleran las metanogénicas.' },
  { id: 'arroz', icon: '🍚', name: 'Arroz cocido sobrante', bin: 'moderacion', why: 'Fermenta muy rápido; si se agrega mucho de golpe puede acidificar la mezcla.' },
  { id: 'cebolla', icon: '🧅', name: 'Cebolla y ajo', bin: 'moderacion', why: 'Tienen compuestos antimicrobianos; en poca cantidad no hay problema.' },
  { id: 'botella', icon: '🧴', name: 'Botella de plástico', bin: 'no', why: 'El plástico no se biodegrada en el biodigestor. Va al reciclaje.' },
  { id: 'vidrio', icon: '🫙', name: 'Frasco de vidrio', bin: 'no', why: 'Es inorgánico: no produce gas. Se recicla aparte.' },
  { id: 'lata', icon: '🥫', name: 'Lata de aluminio', bin: 'no', why: 'Metal: no es materia orgánica. Va al reciclaje.' },
  { id: 'pila', icon: '🔋', name: 'Pila usada', bin: 'no', why: 'Residuo peligroso: contaminaría la mezcla. Va a un punto de recolección.' },
  { id: 'huesos', icon: '🦴', name: 'Huesos', bin: 'no', why: 'Son orgánicos, pero se degradan muy lentamente: no aportan en un biodigestor pequeño.' },
  { id: 'aceite', icon: '🛢️', name: 'Aceite de cocina usado', bin: 'no', why: 'En un biodigestor escolar forma capas y puede inhibir el proceso. Se lleva a puntos de acopio.' },
];

export interface QuizQuestion {
  q: string;
  options: string[];
  /** índice de la respuesta correcta dentro de `options` */
  answer: number;
  why: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    q: '¿Qué condición es indispensable para la digestión anaerobia?',
    options: ['Ausencia de oxígeno', 'Luz solar directa', 'Mucho oxígeno', 'Temperatura bajo cero'],
    answer: 0,
    why: '“Anaerobia” significa sin oxígeno: los microorganismos que producen metano trabajan en un recipiente sellado.',
  },
  {
    q: '¿En cuál de las cuatro etapas se produce el metano?',
    options: ['Hidrólisis', 'Acidogénesis', 'Acetogénesis', 'Metanogénesis'],
    answer: 3,
    why: 'La metanogénesis es la última etapa: las arqueas metanogénicas transforman acetato, H₂ y CO₂ en metano.',
  },
  {
    q: '¿Qué es el biogás?',
    options: ['Metano puro', 'Una mezcla de gases, principalmente metano y CO₂', 'Oxígeno liberado por las plantas', 'Vapor de agua caliente'],
    answer: 1,
    why: 'El biogás es una mezcla: según la literatura, el metano suele ser del 55 % al 70 % y el CO₂ del 30 % al 45 %.',
  },
  {
    q: 'En nuestro experimento, ¿qué día se empezó a detectar metano?',
    options: ['Día 1', 'Día 9', 'Día 14', 'Día 30'],
    answer: 1,
    why: 'Primero hubo un período de adaptación con poca producción de gas; el metano apareció el día 9.',
  },
  {
    q: '¿Cuánto metano se acumuló en los 40 días?',
    options: ['200 mL', '802 mL', '8,02 L', '25,1 mL'],
    answer: 1,
    why: 'El total fue 0,802 L = 802 mL. Los 200 mL corresponden al día de mayor producción (día 14).',
  },
  {
    q: '¿La turbina del proyecto generó electricidad?',
    options: ['Sí, con los 802 mL', 'No: es una propuesta conceptual que no se midió', 'Sí, pero solo el día 14', 'Sí, encendió un bombillo'],
    answer: 1,
    why: 'La etapa de turbina y generador se planteó como propuesta. Con 0,802 L no alcanza para accionar una turbina.',
  },
];
