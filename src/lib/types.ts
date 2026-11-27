export type Role = "asistente" | "organizador" | "administrador";
export type EventStatus = "Borrador" | "Pendiente de aprobación" | "Publicado" | "Rechazado" | "Finalizado";

export interface EventItem {
  id: number;
  name: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  registered: number;
  requirements: string;
  status: EventStatus;
  image: string;
  organizer: string;
}

export interface Registration {
  eventId: number;
  attendance: "Pendiente" | "Asistió";
  certificate: boolean;
  registeredAt: string;
}

export interface CertificateTemplate {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export type Screen =
  | "dashboard"
  | "events"
  | "event-detail"
  | "registrations"
  | "create-event"
  | "my-events"
  | "qr"
  | "reports"
  | "approvals"
  | "categories"
  | "venues"
  | "templates";
