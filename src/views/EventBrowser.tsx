import { useMemo, useState } from "react";
import { ArrowLeft, Calendar, Check, ChevronRight, FileCheck2, Filter, MapPin, Search, Users } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Select, Title } from "../components/ui";
import { EventImage } from "../components/EventImage";
import { PageHeader } from "../components/PageHeader";
import { useApp } from "../contexts/AppContext";
import { activeEnrollments, eventEnded, visibleEvents } from "../services/event-service";
import type { ManagedEvent } from "../types/domain";

const dateLabel = (date: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
export function EventBrowser({ onOpen }: { onOpen: (id: number) => void }) {
  const { db, user } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const filtered = useMemo(() => visibleEvents(db!, user!).filter(e => e.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")) && (!category || e.category === category) && (!venue || e.venue === venue) && (!date || e.date === date)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [db, user, query, category, venue, date]);
  return <><PageHeader eyebrow="Agenda universitaria" title="Encuentra tu próximo evento" description="Explora experiencias académicas, culturales y de bienestar creadas para nuestra comunidad." />
    <Card className="filters"><div className="search-wrap"><Search size={19} /><Input aria-label="Buscar eventos" placeholder="Buscar por nombre..." value={query} onChange={e => setQuery(e.target.value)} /></div><Select aria-label="Categoría" value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas las categorías</option>{db!.categories.map(c => <option key={c}>{c}</option>)}</Select><Select aria-label="Espacio" value={venue} onChange={e => setVenue(e.target.value)}><option value="">Todos los espacios</option>{db!.venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</Select><Input aria-label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} /><Button variant="ghost" aria-label="Limpiar filtros" onClick={() => { setQuery(""); setCategory(""); setVenue(""); setDate(""); }}><Filter size={18} /></Button></Card>
    <div className="results-row"><strong>{filtered.length} eventos publicados</strong><span>Ordenados por fecha</span></div>
    {filtered.length ? <div className="event-grid">{filtered.map(event => {
      const registered = activeEnrollments(db!, event.id).some(r => r.userId === user!.id);
      return <Card className="event-card" key={event.id}><div className="event-image"><EventImage src={event.image} alt={event.name} /><Badge tone="green">{event.category}</Badge>{registered && <div className="registered-chip"><Check size={14} />Inscrito</div>}</div><div className="event-body"><span className="event-date"><Calendar size={16} />{dateLabel(event.date)} · {event.time}</span><Title as="h2">{event.name}</Title><p>{event.description}</p><div className="event-meta"><span><MapPin size={16} />{event.venue}</span><span><Users size={16} />{eventEnded(event) ? "Inscripciones cerradas" : `${Math.max(0, event.capacity - event.registered)} cupos disponibles`}</span></div><Button variant="secondary" onClick={() => onOpen(event.id)}>Ver detalles<ChevronRight size={17} /></Button></div></Card>;
    })}</div> : <EmptyState icon={<Search size={25} />} title="No encontramos eventos" text="Prueba cambiando los filtros o la búsqueda." />}
  </>;
}
export function EventDetailPage({ event, onBack }: { event: ManagedEvent; onBack: () => void }) {
  const { db, user, run } = useApp();
  const registered = activeEnrollments(db!, event.id).some(r => r.userId === user!.id);
  const full = event.registered >= event.capacity;
  const ended = eventEnded(event);
  return <><Button variant="ghost" className="back" onClick={onBack}><ArrowLeft size={18} />Volver a eventos</Button><div className="detail-hero"><EventImage src={event.image} alt={event.name} /><div className="detail-shade" /><div className="detail-title"><Badge tone="green">{event.category}</Badge><Title>{event.name}</Title><p>Organiza {event.organizer}</p></div></div>
    <div className="detail-layout"><div className="detail-copy"><Title as="h2">Sobre el evento</Title><p>{event.description}</p><Title as="h3">Requisitos de participación</Title><div className="requirement"><FileCheck2 size={21} /><div><p>{event.requirements}</p><p>Certificación: mínimo {event.minimumAttendance}% de asistencia verificada y evento finalizado.</p></div></div></div><Card className="registration-card"><span className="eyebrow">Información del evento</span><div className="info-line"><Calendar size={19} /><div><strong>{dateLabel(event.date)}</strong><span>{event.time} h</span></div></div><div className="info-line"><MapPin size={19} /><div><strong>{event.venue}</strong><span>{db!.venues.find(v => v.name === event.venue)?.campus} · Universidad de Antioquia</span></div></div><div className="info-line"><Users size={19} /><div><strong>{Math.max(0, event.capacity - event.registered)} cupos disponibles</strong><span>{event.registered} de {event.capacity} registrados</span></div></div><div className="capacity"><span style={{ width: `${Math.min(event.registered / event.capacity * 100, 100)}%` }} /></div><Button disabled={registered || full || ended} onClick={() => run({ type: "enroll", eventId: event.id }, "Inscripción confirmada. Tu QR está en Mis inscripciones.")}>{registered ? <><Check size={18} />Ya estás inscrito</> : ended ? "Inscripciones cerradas" : full ? "Sin cupos disponibles" : "Inscribirme al evento"}</Button><small>Consulta tu confirmación y QR en Mis inscripciones. No se envían correos en el entorno local.</small></Card></div>
  </>;
}
