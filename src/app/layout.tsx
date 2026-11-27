import type { ReactNode } from "react";
import "../index.css";
export const metadata = { title: "EventUdeA · Universidad de Antioquia", description: "Plataforma de gestión de eventos de la Universidad de Antioquia." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
