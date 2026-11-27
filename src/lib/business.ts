import type { EventItem, Registration } from "./types";

export const hasCapacity = (event: EventItem) => event.registered < event.capacity;
export const availableSpots = (event: EventItem) => Math.max(event.capacity - event.registered, 0);
export const isRegistered = (registrations: Registration[], eventId: number) =>
  registrations.some((registration) => registration.eventId === eventId);
export const canGenerateCertificate = (registration: Registration) =>
  registration.attendance === "Asistió";
