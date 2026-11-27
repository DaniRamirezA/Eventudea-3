import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, TicketCheck } from "lucide-react";
import { Badge, Button, Card, EmptyState, Modal, Title } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { useApp } from "../contexts/AppContext";
import { certificateEligible, eventEnded } from "../services/event-service";
import { downloadCertificate } from "../services/download-service";
import type { Enrollment } from "../types/domain";

export default function ActivityPage() {
  const { db, user, run, notify } = useApp();
  const [tab, setTab] = useState("active");
  const [qr, setQr] = useState<Enrollment | null>(null);
  const [cancel, setCancel] = useState<Enrollment | null>(null);
  const [downloading, setDownloading] = useState("");
  const mine = db!.registrations.filter(r => r.userId === user!.id);
  const rows = mine.filter(r => {
    const event = db!.events.find(e => e.id === r.eventId)!;
    return tab === "certs" ? certificateEligible(db!, r) : tab === "history" ? r.cancelled || eventEnded(event) : !r.cancelled && !eventEnded(event);
  });
  const download = async (r: Enrollment) => {
    setDownloading(r.id);
    try { await downloadCertificate(db!, r); notify("Certificado PDF generado."); }
    catch (e) { notify((e as Error).message); }
    finally { setDownloading(""); }
  };
  return <><PageHeader eyebrow="Mi actividad" title="Mis inscripciones" description="Tu acceso a los encuentros universitarios, historial y certificados." />
    <div className="tabs" role="tablist" aria-label="Actividad">{[["active", "Próximos eventos"], ["history", "Historial"], ["certs", "Certificados"]].map(([id, label]) => <Button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} variant="ghost" onClick={() => setTab(id)}>{label}</Button>)}</div>
    {rows.length ? <div className="registration-list">{rows.map(r => {
      const event = db!.events.find(e => e.id === r.eventId)!;
      const eligible = certificateEligible(db!, r);
      return <Card className="registration-row" key={r.id}><div className="date-tile"><strong>{Number(event.date.slice(-2))}</strong><span>{new Date(`${event.date}T12:00`).toLocaleDateString("es", { month: "short" })}</span></div><div className="row-main"><Badge tone={r.cancelled ? "red" : r.attendance === "Asistió" ? "green" : "amber"}>{r.cancelled ? "Cancelada" : r.attendance}</Badge><Title as="h3">{event.name}</Title><p>{event.date} · {event.time} · {event.venue}</p><p>Asistencia: {r.attendancePercent}% · Requisito: {event.minimumAttendance}%</p>{!eligible && !r.cancelled && <p>Certificado disponible al terminar el evento y cumplir la asistencia.</p>}</div><div className="row-action flex flex-wrap gap-2">
        {!r.cancelled && <Button variant="secondary" onClick={() => setQr(r)}><QrCode size={17} />Ver QR</Button>}
        {eligible && <Button variant="secondary" loading={downloading === r.id} onClick={() => void download(r)}><Download size={17} />Certificado PDF</Button>}
        {!r.cancelled && !eventEnded(event) && r.attendance !== "Asistió" && <Button variant="ghost" onClick={() => setCancel(r)}>Cancelar inscripción</Button>}
      </div></Card>;
    })}</div> : <EmptyState icon={<TicketCheck />} title="No hay registros en esta sección" text="Tus inscripciones y certificados aparecerán aquí cuando estén disponibles." />}
    {qr && <Modal title="Tu código de ingreso" onClose={() => setQr(null)}><div className="review-content items-center text-center"><p>{db!.events.find(e => e.id === qr.eventId)?.name}</p><QRCodeSVG className="mx-auto" value={qr.code} size={230} marginSize={4} /><p className="break-all font-mono text-sm">{qr.code}</p><p>Presenta este QR al organizador. Es individual y solo se puede validar una vez.</p><Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(qr.code); notify("Código copiado."); } catch { notify("No se pudo copiar. Selecciona el código manualmente."); } }}>Copiar código</Button></div></Modal>}
    {cancel && <Modal title="Cancelar inscripción" onClose={() => setCancel(null)}><div className="review-content"><p>Se liberará tu cupo. El registro quedará en tu historial y el QR dejará de ser válido.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setCancel(null)}>Volver</Button><Button variant="danger" onClick={() => { if (run({ type: "cancel", id: cancel.id }, "Inscripción cancelada. Cupo liberado.")) setCancel(null); }}>Confirmar cancelación</Button></div></div></Modal>}
  </>;
}
