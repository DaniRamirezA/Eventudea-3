import { categories, venues, initialEvents, certificateTemplates } from "../lib/mock-data";
import type { Database } from "../types/domain";

export const DEMO_PASSWORD = "EventUdeA2026!";
export const dayFromNow = (days: number) => {
  const date = new Date(); date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
// SHA-256 of the public demo password, not a production credential.
export const hashPassword = async (password: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};
export async function createSeed(): Promise<Database> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const events = initialEvents.map((event, i) => ({
    ...event, date: dayFromNow(5 + i * 5), registered: i === 1 ? 1 : 0,
    ownerId: "o1", observations: "", minimumAttendance: 80,
  }));
  return {
    version: 1,
    users: [
      { id: "a1", name: "Ana María Gómez", email: "asistente@udea.edu.co", role: "asistente", active: true, passwordHash },
      { id: "o1", name: "Camilo Restrepo", email: "organizador@udea.edu.co", role: "organizador", active: true, passwordHash },
      { id: "d1", name: "Laura Vélez", email: "admin@udea.edu.co", role: "administrador", active: true, passwordHash },
      { id: "o2", name: "Sofía Arango", email: "sofia@udea.edu.co", role: "organizador", active: true, passwordHash },
    ],
    events: [
      ...events,
      { ...events[2], id: 5, name: "Memorias del encuentro cultural", date: dayFromNow(-8), status: "Finalizado", registered: 1 },
      { ...events[0], id: 6, name: "Laboratorio de ideas sostenibles", status: "Borrador", registered: 0 },
      { ...events[1], id: 7, name: "Foro de educación inclusiva", status: "Rechazado", observations: "Completar la agenda y los requisitos antes de reenviar.", registered: 0 },
      { ...events[0], id: 8, name: "Conversaciones sobre patrimonio", ownerId: "o2", organizer: "Extensión Cultural", registered: 0 },
    ],
    registrations: [
      { id: "r1", userId: "a1", eventId: 2, code: "EVT-2-ANA-001", cancelled: false, attendance: "Pendiente", attendancePercent: 0, certificate: false, registeredAt: new Date().toISOString() },
      { id: "r2", userId: "a1", eventId: 5, code: "EVT-5-ANA-002", cancelled: false, attendance: "Asistió", attendancePercent: 100, certificate: true, registeredAt: new Date().toISOString(), attendedAt: new Date().toISOString() },
    ],
    categories: [...categories],
    venues: venues.map((name, i) => ({ id: `v${i}`, name, campus: i === 2 ? "Robledo" : "Ciudad Universitaria", capacity: [500, 150, 450, 100][i] })),
    templates: [...certificateTemplates],
  };
}
