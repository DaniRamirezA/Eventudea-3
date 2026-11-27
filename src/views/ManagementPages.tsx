import { useState } from "react";
import { BarChart3, CalendarCheck, Check, Download, FileBadge, Plus, QrCode, Users } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Textarea, Title } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { useApp } from "../contexts/AppContext";
import { activeEnrollments, certificateEligible, eventEnded, visibleEvents } from "../services/event-service";
import { downloadCertificate, downloadCsv } from "../services/download-service";
import type { ManagedEvent } from "../types/domain";

const tone = (status: string) => status === "Publicado" ? "green" : status === "Rechazado" ? "red" : status === "Pendiente de aprobación" ? "amber" : "neutral";
type Navigate = (screen: string, id?: number) => void;
export function DashboardPage({ navigate }: { navigate: Navigate }) {
  const { db, user } = useApp();
  const events = visibleEvents(db!, user!);
  const regs = activeEnrollments(db!).filter(r => events.some(e => e.id === r.eventId));
  const metrics = [
    { label: "Eventos", value: events.length, icon: CalendarCheck, note: user!.role === "organizador" ? "Creados por ti" : "En la plataforma" },
    { label: "Inscripciones", value: regs.length, icon: Users, note: "Registros activos" },
    { label: "Asistencias", value: regs.filter(r => r.attendance === "Asistió").length, icon: Check, note: "Validadas sin duplicados" },
    { label: "Certificados", value: regs.filter(r => certificateEligible(db!, r)).length, icon: FileBadge, note: "Requisitos cumplidos" },
  ];
  return <><PageHeader eyebrow={user!.role === "organizador" ? "Panel del organizador" : "Panel administrativo"} title={`Hola, ${user!.name.split(" ")[0]}`} description="La actividad de tus encuentros universitarios, en un solo lugar." action={user!.role === "organizador" ? <Button onClick={() => navigate("create-event")}><Plus size={18} />Crear evento</Button> : undefined} />
    <div className="stats">{metrics.map(m => <Card className="stat-card" key={m.label}><div className="stat-icon"><m.icon size={23} /></div><div><strong>{m.value}</strong><span>{m.label}</span><small>{m.note}</small></div></Card>)}</div>
    <div className="dashboard-grid"><Card className="p-5"><div className="section-head"><div><Title as="h2">Eventos recientes</Title><p>{events.filter(e => e.status === "Pendiente de aprobación").length} solicitudes pendientes de revisión</p></div><Button variant="ghost" onClick={() => navigate(user!.role === "organizador" ? "my-events" : "all-events")}>Ver todos</Button></div><ManagedTable events={events.slice().reverse().slice(0, 5)} /></Card>
      <Card className="next-action p-6"><div className="accent-icon">{user!.role === "organizador" ? <QrCode /> : <CalendarCheck />}</div><span className="eyebrow">Tu siguiente paso</span><Title as="h2">{user!.role === "organizador" ? "Validación de ingreso" : "Solicitudes por revisar"}</Title><p>{user!.role === "organizador" ? "Valida códigos individuales y registra la asistencia de tus eventos." : "Revisa las propuestas de los organizadores antes de publicarlas."}</p><Button onClick={() => navigate(user!.role === "organizador" ? "qr" : "approvals")}>{user!.role === "organizador" ? "Abrir validador" : "Revisar solicitudes"}</Button></Card></div>
  </>;
}
export function ManagedTable({ events, actions }: { events: ManagedEvent[]; actions?: (event: ManagedEvent) => React.ReactNode }) {
  return <div className="table-wrap"><table><thead><tr><th>Evento</th><th>Fecha</th><th>Inscritos</th><th>Estado</th>{actions && <th>Acciones</th>}</tr></thead><tbody>{events.map(e => <tr key={e.id}><td><strong>{e.name}</strong><span>{e.category} · {e.organizer}</span>{e.observations && <p className="text-sm">Observaciones: {e.observations}</p>}</td><td>{e.date}<span>{e.time}</span></td><td>{e.registered} / {e.capacity}</td><td><Badge tone={tone(e.status)}>{e.status}</Badge></td>{actions && <td><div className="flex flex-wrap gap-2">{actions(e)}</div></td>}</tr>)}</tbody></table>{events.length === 0 && <EmptyState title="No hay eventos" text="Los eventos aparecerán aquí cuando se creen." />}</div>;
}
export function ManagedEventsPage({ navigate }: { navigate: Navigate }) {
  const { db, user, run } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [remove, setRemove] = useState<ManagedEvent | null>(null);
  const events = visibleEvents(db!, user!).filter(e => e.name.toLowerCase().includes(query.toLowerCase()) && (status === "Todos" || status === e.status));
  return <><PageHeader eyebrow="Gestión" title={user!.role === "organizador" ? "Mis eventos" : "Todos los eventos"} description="Consulta publicaciones, solicitudes e historial. Las ediciones deben aprobarse de nuevo." action={user!.role === "organizador" && <Button onClick={() => navigate("create-event")}><Plus size={18} />Nuevo evento</Button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2"><Input label="Buscar evento" placeholder="Nombre del evento" value={query} onChange={e => setQuery(e.target.value)} /><Select label="Estado" value={status} onChange={e => setStatus(e.target.value)}>{["Todos", "Borrador", "Pendiente de aprobación", "Publicado", "Rechazado", "Finalizado"].map(s => <option key={s}>{s}</option>)}</Select></div>
    <Card><ManagedTable events={events} actions={e => <>{user!.role === "organizador" && !eventEnded(e) && <><Button variant="ghost" onClick={() => navigate("create-event", e.id)}>Editar</Button><Button variant="danger" onClick={() => setRemove(e)}>Eliminar</Button></>}<Button variant="secondary" onClick={() => navigate("enrollments", e.id)}>Inscritos</Button>{user!.role === "organizador" && e.status === "Publicado" && eventEnded(e) && <Button variant="ghost" onClick={() => run({ type: "finish", id: e.id }, "Evento finalizado.")}>Finalizar</Button>}</>} /></Card>
    {remove && <Modal title="Eliminar evento" onClose={() => setRemove(null)}><div className="review-content"><p>¿Eliminar “{remove.name}”? No se puede deshacer. Los eventos con historial de inscripciones se conservan.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setRemove(null)}>Cancelar</Button><Button variant="danger" onClick={() => { if (run({ type: "deleteEvent", id: remove.id }, "Evento eliminado.")) setRemove(null); }}>Eliminar evento</Button></div></div></Modal>}
  </>;
}
export function ApprovalsPage() {
  const { db, run } = useApp();
  const [review, setReview] = useState<ManagedEvent | null>(null);
  const [notes, setNotes] = useState("");
  const events = db!.events.filter(e => e.status === "Pendiente de aprobación");
  return <><PageHeader eyebrow="Moderación" title="Aprobación de eventos" description="Revisa los detalles. Solo un administrador puede aprobar o rechazar una publicación." /><Card><ManagedTable events={events} actions={e => <Button variant="secondary" onClick={() => { setReview(e); setNotes(""); }}>Revisar solicitud</Button>} /></Card>
    {review && <Modal title="Revisar solicitud" onClose={() => setReview(null)}><div className="review-content"><Badge tone="amber">{review.status}</Badge><Title as="h2">{review.name}</Title><p>{review.description}</p><div className="review-grid"><strong>{review.date} · {review.time}</strong><strong>{review.venue}</strong><strong>{review.capacity} cupos</strong><strong>{review.category}</strong></div><p>{review.requirements} · Asistencia mínima: {review.minimumAttendance}%</p><Textarea label="Observaciones (obligatorias al rechazar)" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /><div className="modal-actions"><Button variant="danger" onClick={() => { if (run({ type: "review", id: review.id, approve: false, observations: notes }, "Evento rechazado con observaciones.")) setReview(null); }}>Rechazar</Button><Button onClick={() => { if (run({ type: "review", id: review.id, approve: true, observations: notes }, "Evento aprobado y publicado.")) setReview(null); }}>Aprobar y publicar</Button></div></div></Modal>}
  </>;
}
export function AttendancePage() {
  const { db, user, run } = useApp();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(100);
  const [result, setResult] = useState("");
  return <><PageHeader eyebrow="Control de acceso" title="Validar código QR" description="Lee el QR con un lector y pega su contenido. La validación comprueba la inscripción y la propiedad del evento." />
    <div className="qr-layout"><Card className="scanner"><div className="scanner-frame"><QrCode size={120} /><span /><span /><span /><span /></div><Title as="h2">Registra la asistencia</Title><p>Introduce el código individual del asistente. No se requiere acceso a cámara.</p><form className="grid gap-4 text-left" onSubmit={e => { e.preventDefault(); const reg = db!.registrations.find(r => r.code === code.trim()); if (run({ type: "attendance", code, percent }, "Asistencia registrada correctamente.")) { setResult(`${db!.users.find(u => u.id === reg?.userId)?.name} · Asistencia: ${percent}%`); setCode(""); } else setResult("No se registró la asistencia. Consulta el mensaje de validación."); }}><Input label="Contenido del QR" placeholder="EVT-…" value={code} onChange={e => setCode(e.target.value)} required /><Input label="Porcentaje de asistencia verificado" type="number" min={0} max={100} value={percent} onChange={e => setPercent(Number(e.target.value))} required /><Button type="submit">Validar y registrar asistencia</Button></form></Card>
      <Card className="validation-result"><span className="eyebrow">Resultado de validación</span><div className="result-empty"><QrCode size={38} /><Title as="h2">{result ? "Resultado" : "Esperando un código"}</Title><p role="status">{result || "El resultado aparecerá aquí. Cada inscripción admite una única asistencia."}</p><p>Gestionas {db!.events.filter(e => e.ownerId === user!.id).length} eventos.</p></div></Card></div>
  </>;
}
export function EnrollmentsPage({ eventId, certificatesOnly = false }: { eventId?: number; certificatesOnly?: boolean }) {
  const { db, user, notify } = useApp();
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState(eventId ? String(eventId) : "");
  const [busy, setBusy] = useState("");
  const events = visibleEvents(db!, user!);
  const rows = db!.registrations.filter(r => events.some(e => e.id === r.eventId) && (!eventFilter || r.eventId === Number(eventFilter)) && (!certificatesOnly || certificateEligible(db!, r)) && (db!.users.find(u => u.id === r.userId)?.name.toLowerCase().includes(query.toLowerCase()) || r.code.toLowerCase().includes(query.toLowerCase())));
  const csv = () => downloadCsv("EventUdeA-inscripciones.csv", [["Evento", "Asistente", "Correo", "Código", "Inscripción", "Asistencia", "Porcentaje", "Certificado"], ...rows.map(r => { const u = db!.users.find(u => u.id === r.userId)!; return [db!.events.find(e => e.id === r.eventId)!.name, u.name, u.email, r.code, r.cancelled ? "Cancelada" : "Activa", r.attendance, r.attendancePercent, certificateEligible(db!, r) ? "Sí" : "No"]; })]);
  return <><PageHeader eyebrow="Participación" title={certificatesOnly ? "Certificados emitibles" : "Gestión de inscritos"} description="Consulta participantes, códigos individuales y asistencia. Los registros cancelados se conservan para trazabilidad." action={<Button variant="secondary" onClick={csv}><Download size={17} />Exportar CSV</Button>} />
    <div className="grid gap-3 sm:grid-cols-2 mb-5"><Input label="Buscar asistente o código" value={query} onChange={e => setQuery(e.target.value)} /><Select label="Evento" value={eventFilter} onChange={e => setEventFilter(e.target.value)}><option value="">Todos mis eventos</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</Select></div>
    <Card><div className="table-wrap"><table><thead><tr><th>Asistente</th><th>Evento y código QR</th><th>Estado</th><th>Asistencia</th><th>Certificado</th></tr></thead><tbody>{rows.map(r => { const u = db!.users.find(u => u.id === r.userId)!; return <tr key={r.id}><td><strong>{u.name}</strong><span>{u.email}</span></td><td><strong>{db!.events.find(e => e.id === r.eventId)?.name}</strong><span className="break-all">{r.code}</span><Button variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(r.code); notify("Código copiado."); } catch { notify("Selecciona el código para copiarlo manualmente."); } }}>Copiar código</Button></td><td><Badge tone={r.cancelled ? "red" : "green"}>{r.cancelled ? "Cancelada" : "Activa"}</Badge></td><td>{r.attendance} · {r.attendancePercent}%{r.attendedAt && <span>{new Date(r.attendedAt).toLocaleString("es-CO")}</span>}</td><td>{certificateEligible(db!, r) ? <Button variant="secondary" loading={busy === r.id} onClick={async () => { setBusy(r.id); try { await downloadCertificate(db!, r); } catch (e) { notify((e as Error).message); } finally { setBusy(""); } }}>Descargar PDF</Button> : "No disponible"}</td></tr>; })}</tbody></table>{!rows.length && <EmptyState icon={<Users />} title="Sin registros" text="No hay inscripciones que coincidan con estos filtros." />}</div></Card>
  </>;
}
export function ReportsPage() {
  const { db, user } = useApp();
  const [period, setPeriod] = useState("all");
  const events = visibleEvents(db!, user!).filter(e => period === "all" || (period === "past" ? eventEnded(e) : !eventEnded(e)));
  const stats = events.map(e => {
    const regs = activeEnrollments(db!, e.id);
    return { event: e, registered: regs.length, attended: regs.filter(r => r.attendance === "Asistió").length, certificates: regs.filter(r => certificateEligible(db!, r)).length };
  });
  return <><PageHeader eyebrow="Analítica" title="Reportes de participación" description="Inscripciones, asistencias y certificados calculados a partir de los registros reales." action={<Button variant="secondary" onClick={() => downloadCsv("EventUdeA-reporte.csv", [["Evento", "Estado", "Inscritos", "Asistencias", "Certificados"], ...stats.map(s => [s.event.name, s.event.status, s.registered, s.attended, s.certificates])])}><Download size={17} />Exportar CSV</Button>} />
    <Card className="chart-card"><div className="section-head"><div><Title as="h2">Participación por evento</Title><p>{stats.reduce((sum, s) => sum + s.registered, 0)} inscripciones · {stats.reduce((sum, s) => sum + s.attended, 0)} asistencias · {stats.reduce((sum, s) => sum + s.certificates, 0)} certificados</p></div><Select label="Periodo" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">Todos los eventos</option><option value="upcoming">Próximos</option><option value="past">Finalizados</option></Select></div>
      <div className="bar-chart">{stats.map(s => <div className="bar-row" key={s.event.id}><span>{s.event.name}</span><div><i style={{ width: `${s.registered / Math.max(1, ...stats.map(s => s.registered)) * 100}%` }} /><b style={{ width: `${s.attended / Math.max(1, ...stats.map(s => s.registered)) * 100}%` }} /></div><strong aria-label={`${s.registered} inscritos, ${s.attended} asistentes`}>{s.registered} / {s.attended}</strong></div>)}</div><div className="chart-legend"><span><i />Inscritos</span><span><b />Asistentes</span></div>{!stats.length && <EmptyState icon={<BarChart3 />} title="Sin eventos en este periodo" text="Prueba otro filtro." />}</Card>
  </>;
}
