import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un correo válido.").transform(value => value.toLowerCase().trim()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});
export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(3, "Escribe tu nombre completo."),
});
export const eventSchema = z.object({
  name: z.string().trim().min(5, "Usa al menos 5 caracteres."),
  description: z.string().trim().min(20, "Describe el evento en al menos 20 caracteres."),
  category: z.string().min(1, "Selecciona una categoría."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una hora."),
  venue: z.string().min(1, "Selecciona un espacio."),
  capacity: z.number().int().min(1, "El aforo debe ser positivo."),
  requirements: z.string().trim().min(5, "Indica los requisitos de participación."),
  minimumAttendance: z.number().min(1).max(100),
});
