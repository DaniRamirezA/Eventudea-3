import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";
import { Button, Card, Input, Select, Textarea, Title } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { useApp } from "../contexts/AppContext";
import { eventSchema } from "../validations/forms";
import type { EventInput, ManagedEvent } from "../types/domain";
import { dayFromNow } from "../repositories/seed";

export default function EventEditor({ event, done }: { event?: ManagedEvent; done: () => void }) {
  const { db, run } = useApp();
  const { register, handleSubmit, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ?? { name: "", description: "", category: db!.categories[0] ?? "", venue: db!.venues[0]?.name ?? "", date: dayFromNow(1), time: "09:00", capacity: 50, requirements: "Cumplir el porcentaje mínimo de asistencia.", minimumAttendance: 80 },
  });
  const save = (submit: boolean) => handleSubmit(input => { if (run({ type: "saveEvent", id: event?.id, input, submit }, submit ? "Evento enviado a aprobación." : "Borrador guardado.")) done(); });
  return <><PageHeader eyebrow="Gestión de eventos" title={event ? "Edita tu evento" : "Crea una experiencia universitaria"} description="Los cambios requieren aprobación antes de publicarse. La certificación exige el porcentaje indicado y que el evento haya terminado." />
    <Card className="form-card"><form onSubmit={save(true)}>
      <div className="form-section"><div className="form-section-title"><span>01</span><div><Title as="h2">Información general</Title><p>Describe la experiencia para la comunidad.</p></div></div><div className="form-grid">
        <Input className="full" label="Nombre del evento *" error={errors.name?.message} {...register("name")} />
        <div className="full"><Textarea label="Descripción *" rows={4} {...register("description")} />{errors.description && <p role="alert" className="text-red-800! text-sm">{errors.description.message}</p>}</div>
        <Select label="Categoría *" {...register("category")}>{db!.categories.map(c => <option key={c}>{c}</option>)}</Select>
        <Input label="Capacidad *" type="number" error={errors.capacity?.message} {...register("capacity", { valueAsNumber: true })} />
      </div></div>
      <div className="form-section"><div className="form-section-title"><span>02</span><div><Title as="h2">Fecha y ubicación</Title><p>El aforo no puede superar la capacidad del espacio.</p></div></div><div className="form-grid">
        <Input label="Fecha *" type="date" min={dayFromNow(0)} error={errors.date?.message} {...register("date")} />
        <Input label="Hora *" type="time" error={errors.time?.message} {...register("time")} />
        <Select className="full" label="Sede y espacio *" {...register("venue")}>{db!.venues.map(v => <option key={v.id} value={v.name}>{v.campus} · {v.name} · {v.capacity} personas</option>)}</Select>
      </div></div>
      <div className="form-section"><div className="form-section-title"><span>03</span><div><Title as="h2">Certificación</Title><p>La asistencia se verifica por el organizador.</p></div></div><div className="form-grid">
        <Input label="Asistencia mínima (%) *" type="number" min={1} max={100} error={errors.minimumAttendance?.message} {...register("minimumAttendance", { valueAsNumber: true })} />
        <div className="full"><Textarea label="Requisitos de participación *" rows={3} {...register("requirements")} />{errors.requirements && <p role="alert" className="text-red-800! text-sm">{errors.requirements.message}</p>}</div>
      </div></div>
      {errors.category && <p role="alert">{errors.category.message}</p>}{errors.venue && <p role="alert">{errors.venue.message}</p>}
      <div className="form-actions"><Button variant="ghost" onClick={done}>Cancelar</Button><Button variant="secondary" onClick={save(false)}><Save size={17} />Guardar borrador</Button><Button type="submit"><Send size={17} />Enviar a aprobación</Button></div>
    </form></Card></>;
}
