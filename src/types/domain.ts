import type { EventItem, Registration, Role } from "../lib/types";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
}
export interface ManagedEvent extends Omit<EventItem, "status"> {
  status: EventItem["status"] | "Borrador";
  ownerId: string;
  observations: string;
  minimumAttendance: number;
}
export interface Enrollment extends Registration {
  id: string;
  userId: string;
  code: string;
  cancelled: boolean;
  attendancePercent: number;
  attendedAt?: string;
}
export interface Place { id: string; name: string; campus: string; capacity: number }
export interface Database {
  version: 1;
  users: User[];
  events: ManagedEvent[];
  registrations: Enrollment[];
  categories: string[];
  venues: Place[];
  templates: { id: number; name: string; description: string; active: boolean }[];
}
export type EventInput = Pick<ManagedEvent, "name" | "description" | "category" | "date" | "time" | "venue" | "capacity" | "requirements" | "minimumAttendance">;
export type Command =
  | { type: "enroll"; eventId: number }
  | { type: "cancel"; id: string }
  | { type: "saveEvent"; id?: number; input: EventInput; submit: boolean }
  | { type: "deleteEvent"; id: number }
  | { type: "finish"; id: number }
  | { type: "review"; id: number; approve: boolean; observations: string }
  | { type: "attendance"; code: string; percent: number }
  | { type: "user"; id: string; role: Role; active: boolean }
  | { type: "category"; original?: string; name: string; remove?: boolean }
  | { type: "venue"; original?: string; input: Place; remove?: boolean }
  | { type: "template"; id?: number; name: string; description: string; active: boolean; remove?: boolean };
