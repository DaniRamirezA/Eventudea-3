import type { ReactNode } from "react";
import "../index.css";
export const metadata = { title: "EventUdeA · Universidad de Antioquia", description: "Gestión universitaria de eventos. Entorno local de pruebas." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
