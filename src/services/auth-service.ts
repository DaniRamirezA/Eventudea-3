import type { EventRepository } from "../repositories/local-repository";
import { hashPassword } from "../repositories/seed";
import type { User } from "../types/domain";
import { loginSchema, signupSchema } from "../validations/forms";

export async function authenticate(repository: EventRepository, email: string, password: string) {
  const input = loginSchema.parse({ email: email.trim(), password });
  const db = await repository.load();
  const hash = await hashPassword(input.password);
  const user = db.users.find(u => u.email === input.email && u.passwordHash === hash);
  if (!user?.active) throw new Error("Credenciales incorrectas o cuenta inactiva.");
  return { db, user };
}
export async function registerUser(repository: EventRepository, name: string, email: string, password: string) {
  const input = signupSchema.parse({ name, email: email.trim(), password });
  const db = await repository.load();
  if (db.users.some(u => u.email === input.email)) throw new Error("Este correo ya tiene una cuenta.");
  const user: User = { id: crypto.randomUUID(), name: input.name, email: input.email, passwordHash: await hashPassword(password), role: "asistente", active: true };
  db.users.push(user); repository.save(db);
  return { db, user };
}
