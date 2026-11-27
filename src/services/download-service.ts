import type { Database, Enrollment } from "../types/domain";
import { certificateEligible } from "./event-service";

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const content = "\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadCertificate(db: Database, registration: Enrollment) {
  if (!certificateEligible(db, registration)) throw new Error("No cumples los requisitos de certificación.");
  const { jsPDF } = await import("jspdf");
  const event = db.events.find(e => e.id === registration.eventId)!;
  const user = db.users.find(u => u.id === registration.userId)!;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setDrawColor(22, 82, 56); doc.setLineWidth(1); doc.rect(10, 10, 277, 190);
  doc.setTextColor(22, 82, 56); doc.setFontSize(18); doc.text("UNIVERSIDAD DE ANTIOQUIA", 148.5, 35, { align: "center" });
  doc.setFontSize(13); doc.text("EventUdeA · Certificado local de prueba", 148.5, 47, { align: "center" });
  doc.setFontSize(28); doc.text("Certificado de participación", 148.5, 73, { align: "center" });
  doc.setTextColor(23, 33, 28); doc.setFontSize(16); doc.text("Se certifica que", 148.5, 94, { align: "center" });
  doc.setFontSize(23); doc.text(doc.splitTextToSize(user.name, 240), 148.5, 110, { align: "center" });
  doc.setFontSize(15); doc.text(doc.splitTextToSize(`participó en ${event.name}`, 245), 148.5, 130, { align: "center" });
  doc.setFontSize(12); doc.text(`${event.date} · ${event.venue} · Asistencia: ${registration.attendancePercent}%`, 148.5, 154, { align: "center" });
  doc.setFontSize(10); doc.text(`Identificador: ${registration.id}`, 148.5, 177, { align: "center" });
  doc.text("Documento de demostración. Sin firma ni validez institucional.", 148.5, 189, { align: "center" });
  doc.save(`EventUdeA-certificado-${event.id}.pdf`);
}
