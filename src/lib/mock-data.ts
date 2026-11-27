import type { CertificateTemplate, EventItem, Registration } from "./types";

export const categories = ["Tecnología", "Investigación", "Cultura", "Bienestar", "Académico"];
export const venues = ["Teatro Universitario", "Bloque 19 · Auditorio", "Ciudadela Robledo", "Biblioteca Central"];

export const certificateTemplates: CertificateTemplate[] = [
  {
    id: 1,
    name: "Certificado de participación",
    description: "Reconoce la participación general en eventos universitarios.",
    active: true,
  },
  {
    id: 2,
    name: "Certificado de asistencia",
    description: "Acredita el cumplimiento de los requisitos mínimos de asistencia.",
    active: true,
  },
  {
    id: 3,
    name: "Certificado de participación académica",
    description: "Reconoce la participación en seminarios, congresos y actividades académicas.",
    active: true,
  },
  {
    id: 4,
    name: "Certificado de ponente",
    description: "Acredita la presentación de una ponencia o conferencia en un evento.",
    active: false,
  },
];

export const initialEvents: EventItem[] = [
  {
    id: 1,
    name: "Encuentro de innovación abierta",
    description: "Una jornada para conectar ideas, investigación y soluciones creadas por la comunidad universitaria. Incluye panel de expertos, demostraciones y espacios de colaboración.",
    category: "Tecnología",
    date: "2026-03-18",
    time: "09:00",
    venue: "Teatro Universitario",
    capacity: 240,
    registered: 184,
    requirements: "Asistir al menos al 80% de la jornada para obtener certificado.",
    status: "Publicado",
    image: "https://images.unsplash.com/photo-1622604647545-0cada2f34470?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1400",
    organizer: "Facultad de Ingeniería",
  },
  {
    id: 2,
    name: "Seminario de inteligencia artificial ética",
    description: "Conversaciones interdisciplinarias sobre el desarrollo responsable de sistemas de inteligencia artificial.",
    category: "Investigación",
    date: "2026-03-24",
    time: "14:00",
    venue: "Bloque 19 · Auditorio",
    capacity: 120,
    registered: 116,
    requirements: "Registro previo y asistencia completa.",
    status: "Publicado",
    image: "https://images.unsplash.com/photo-1613687969216-40c7b718c025?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
    organizer: "Departamento de Sistemas",
  },
  {
    id: 3,
    name: "Festival universitario de las artes",
    description: "Música, conversación, creación y encuentros para toda la comunidad.",
    category: "Cultura",
    date: "2026-04-05",
    time: "16:30",
    venue: "Ciudadela Robledo",
    capacity: 400,
    registered: 207,
    requirements: "Entrada libre con inscripción.",
    status: "Publicado",
    image: "https://images.unsplash.com/photo-1728206313441-281ef4ea5d62?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
    organizer: "Bienestar Universitario",
  },
  {
    id: 4,
    name: "Cátedra abierta: territorio y paz",
    description: "Diálogo académico sobre universidad, memoria y construcción de paz.",
    category: "Académico",
    date: "2026-04-12",
    time: "10:00",
    venue: "Biblioteca Central",
    capacity: 90,
    registered: 0,
    requirements: "Asistencia mínima del 80%.",
    status: "Pendiente de aprobación",
    image: "https://images.unsplash.com/photo-1622604647545-0cada2f34470?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
    organizer: "Instituto de Estudios Políticos",
  },
];

export const initialRegistrations: Registration[] = [
  { eventId: 2, attendance: "Pendiente", certificate: false, registeredAt: "10 mar 2026" },
  { eventId: 3, attendance: "Asistió", certificate: true, registeredAt: "02 mar 2026" },
];
