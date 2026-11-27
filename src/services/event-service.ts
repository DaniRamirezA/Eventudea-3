import type { Command, Database, Enrollment, ManagedEvent, User } from "../types/domain";
import { eventSchema } from "../validations/forms";

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export const activeEnrollments = (db: Database, eventId?: number) =>
  db.registrations.filter(r => !r.cancelled && (eventId === undefined || r.eventId === eventId));
export const eventEnded = (e: ManagedEvent) => e.status === "Finalizado" || new Date(`${e.date}T${e.time}`).getTime() < Date.now();
export const certificateEligible = (db: Database, r: Enrollment) => {
  const event = db.events.find(e => e.id === r.eventId);
  return !!event && !r.cancelled && r.attendance === "Asistió" && r.attendancePercent >= event.minimumAttendance && eventEnded(event);
};
export const visibleEvents = (db: Database, user: User) =>
  db.events.filter(e => user.role === "administrador" || (user.role === "organizador" ? e.ownerId === user.id : e.status === "Publicado"))
    .map(e => ({ ...e, registered: activeEnrollments(db, e.id).length }));

// Pure business layer: the future REST adapter can reuse these contracts.
export function execute(db: Database, actorId: string, command: Command): Database {
  const next = structuredClone(db);
  const actor = next.users.find(u => u.id === actorId && u.active);
  ensure(actor, "Tu sesión no está activa. Inicia sesión nuevamente.");
  const admin = () => ensure(actor.role === "administrador", "Solo el administrador puede realizar esta acción.");
  const ownEvent = (id: number) => {
    const event = next.events.find(e => e.id === id);
    ensure(event && actor.role === "organizador" && event.ownerId === actor.id, "No tienes permisos sobre este evento.");
    return event;
  };
  switch (command.type) {
    case "enroll": {
      ensure(actor.role === "asistente", "Solo los asistentes pueden inscribirse.");
      const event = next.events.find(e => e.id === command.eventId);
      ensure(event?.status === "Publicado" && !eventEnded(event), "El evento no está abierto a inscripciones.");
      ensure(!activeEnrollments(next, event.id).some(r => r.userId === actor.id), "Ya tienes una inscripción activa.");
      ensure(activeEnrollments(next, event.id).length < event.capacity, "No hay cupos disponibles.");
      const id = crypto.randomUUID();
      next.registrations.push({ id, userId: actor.id, eventId: event.id, code: `EVT-${event.id}-${id}`, cancelled: false, attendance: "Pendiente", attendancePercent: 0, certificate: false, registeredAt: new Date().toISOString() });
      break;
    }
    case "cancel": {
      const reg = next.registrations.find(r => r.id === command.id);
      ensure(reg && reg.userId === actor.id && actor.role === "asistente", "No puedes cancelar esta inscripción.");
      const event = next.events.find(e => e.id === reg.eventId);
      ensure(event && !eventEnded(event) && reg.attendance !== "Asistió" && !reg.cancelled, "La inscripción ya no se puede cancelar.");
      reg.cancelled = true; break;
    }
    case "saveEvent": {
      ensure(actor.role === "organizador", "Solo los organizadores pueden crear eventos.");
      const parsed = eventSchema.safeParse(command.input);
      ensure(parsed.success, parsed.error?.issues[0]?.message ?? "Datos del evento inválidos.");
      const input = parsed.data;
      ensure(new Date(`${input.date}T${input.time}`).getTime() > Date.now(), "Selecciona una fecha y hora futuras.");
      ensure(next.categories.includes(input.category), "La categoría no está disponible.");
      const place = next.venues.find(v => v.name === input.venue);
      ensure(place && input.capacity <= place.capacity, "La capacidad supera el aforo del espacio.");
      if (command.id !== undefined) {
        const event = ownEvent(command.id);
        ensure(!eventEnded(event), "No puedes modificar un evento finalizado.");
        ensure(input.capacity >= activeEnrollments(next, event.id).length, "La capacidad no puede ser inferior a los inscritos.");
        Object.assign(event, input, { status: command.submit ? "Pendiente de aprobación" : "Borrador", observations: "" });
      } else {
        next.events.push({ ...input, id: Math.max(0, ...next.events.map(e => e.id)) + 1, ownerId: actor.id, organizer: actor.name, image: next.events[0]?.image ?? "", registered: 0, status: command.submit ? "Pendiente de aprobación" : "Borrador", observations: "" });
      }
      break;
    }
    case "deleteEvent": {
      const event = ownEvent(command.id);
      ensure(!next.registrations.some(r => r.eventId === event.id), "Este evento tiene historial de inscripciones y no puede eliminarse.");
      next.events = next.events.filter(e => e.id !== event.id); break;
    }
    case "finish": {
      const event = ownEvent(command.id);
      ensure(event.status === "Publicado" && eventEnded(event), "Solo puedes finalizar eventos publicados cuya fecha ya pasó.");
      event.status = "Finalizado"; break;
    }
    case "review": {
      admin();
      const event = next.events.find(e => e.id === command.id);
      ensure(event?.status === "Pendiente de aprobación", "La solicitud ya no está pendiente.");
      ensure(command.approve || command.observations.trim().length >= 5, "Explica el motivo del rechazo (mínimo 5 caracteres).");
      ensure(!command.approve || !eventEnded(event), "No se puede publicar un evento cuya fecha ya pasó.");
      event.status = command.approve ? "Publicado" : "Rechazado";
      event.observations = command.observations.trim(); break;
    }
    case "attendance": {
      const reg = next.registrations.find(r => r.code === command.code.trim() && !r.cancelled);
      ensure(reg, "Código no válido o inscripción cancelada.");
      const event = ownEvent(reg.eventId);
      ensure(event.status === "Publicado" || event.status === "Finalizado", "El evento no está publicado.");
      ensure(reg.attendance !== "Asistió", "Esta asistencia ya fue registrada; no se creó un duplicado.");
      ensure(Number.isFinite(command.percent) && command.percent >= 0 && command.percent <= 100, "El porcentaje debe estar entre 0 y 100.");
      reg.attendance = "Asistió"; reg.attendancePercent = command.percent; reg.attendedAt = new Date().toISOString(); break;
    }
    case "user": {
      admin();
      const user = next.users.find(u => u.id === command.id);
      ensure(user, "Usuario no encontrado.");
      ensure(["asistente", "organizador", "administrador"].includes(command.role), "Rol inválido.");
      ensure(user.id !== actor.id || (command.role === "administrador" && command.active), "No puedes retirar tu propio acceso administrativo.");
      Object.assign(user, { role: command.role, active: command.active }); break;
    }
    case "category": {
      admin();
      const name = command.name.trim();
      ensure(name.length >= 3, "El nombre debe tener al menos 3 caracteres.");
      ensure(!next.categories.some(c => c.toLowerCase() === name.toLowerCase() && c !== command.original), "Esta categoría ya existe.");
      if (command.remove) {
        ensure(!next.events.some(e => e.category === command.original), "La categoría está asociada a eventos.");
        next.categories = next.categories.filter(c => c !== command.original);
      } else if (command.original) {
        next.categories = next.categories.map(c => c === command.original ? name : c);
        next.events.forEach(e => { if (e.category === command.original) e.category = name; });
      } else next.categories.push(name);
      break;
    }
    case "venue": {
      admin();
      const input = { ...command.input, name: command.input.name.trim(), campus: command.input.campus.trim() };
      ensure(input.name.length >= 3 && input.campus.length >= 3 && Number.isInteger(input.capacity) && input.capacity > 0, "Completa el nombre, la sede y un aforo entero positivo.");
      ensure(!next.venues.some(v => v.name.toLowerCase() === input.name.toLowerCase() && v.id !== command.original), "Ya existe un espacio con este nombre.");
      const previous = next.venues.find(v => v.id === command.original);
      if (command.remove) {
        ensure(previous && !next.events.some(e => e.venue === previous.name), "El espacio está asociado a eventos.");
        next.venues = next.venues.filter(v => v.id !== command.original);
      } else if (previous) {
        ensure(!next.events.some(e => e.venue === previous.name && e.capacity > input.capacity), "Existen eventos cuyo aforo supera esta capacidad.");
        next.events.forEach(e => { if (e.venue === previous.name) e.venue = input.name; });
        Object.assign(previous, input, { id: previous.id });
      } else next.venues.push({ ...input, id: crypto.randomUUID() });
      break;
    }
    case "template": {
      admin();
      ensure(command.name.trim().length >= 3, "Escribe el nombre de la plantilla.");
      if (command.remove) next.templates = next.templates.filter(t => t.id !== command.id);
      else if (command.id) {
        const template = next.templates.find(t => t.id === command.id);
        ensure(template, "Plantilla no encontrada.");
        Object.assign(template, { name: command.name.trim(), description: command.description, active: command.active });
      } else next.templates.push({ id: Date.now(), name: command.name.trim(), description: command.description, active: command.active });
      break;
    }
  }
  next.events.forEach(e => { e.registered = activeEnrollments(next, e.id).length; });
  next.registrations.forEach(r => { r.certificate = certificateEligible(next, r); });
  return next;
}
