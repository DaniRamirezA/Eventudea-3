import { useState } from "react";
import { Plus, Settings2, Tag } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Textarea } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { useApp } from "../contexts/AppContext";
import type { Place, User } from "../types/domain";
import type { Role } from "../lib/types";

export function UsersPage() {
  const { db, run } = useApp();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const rows = db!.users.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="Administración" title="Usuarios y permisos" description="Gestiona los perfiles y el acceso. Las cuentas nuevas se registran como asistentes." /><Input className="mb-5" label="Buscar usuario" placeholder="Nombre o correo" value={query} onChange={e => setQuery(e.target.value)} /><Card><div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Perfil</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{rows.map(u => <tr key={u.id}><td><strong>{u.name}</strong><span>{u.email}</span></td><td className="capitalize">{u.role}</td><td><Badge tone={u.active ? "green" : "red"}>{u.active ? "Activo" : "Inactivo"}</Badge></td><td><Button variant="secondary" onClick={() => setEditing({ ...u })}>Gestionar permisos</Button></td></tr>)}</tbody></table>{!rows.length && <EmptyState title="Sin coincidencias" text="Busca otro nombre o correo." />}</div></Card>
    {editing && <Modal title="Gestionar usuario" onClose={() => setEditing(null)}><form className="review-content" onSubmit={e => { e.preventDefault(); if (run({ type: "user", id: editing.id, role: editing.role, active: editing.active }, "Permisos del usuario actualizados.")) setEditing(null); }}><p>{editing.name} · {editing.email}</p><Select label="Perfil" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value as Role })}><option value="asistente">Asistente</option><option value="organizador">Organizador</option><option value="administrador">Administrador</option></Select><Select label="Estado de la cuenta" value={String(editing.active)} onChange={e => setEditing({ ...editing, active: e.target.value === "true" })}><option value="true">Activo</option><option value="false">Inactivo</option></Select><p>Al desactivar una cuenta se bloquea su acceso. No se eliminan sus registros.</p><div className="modal-actions"><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit">Guardar permisos</Button></div></form></Modal>}
  </>;
}
type CatalogType = "categories" | "venues" | "templates";
interface Edit { original?: string; id?: number; name: string; campus: string; capacity: number; description: string; active: boolean }
export function CatalogPage({ type }: { type: CatalogType }) {
  const { db, run } = useApp();
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<Edit | null>(null);
  const [removing, setRemoving] = useState(false);
  const singular = type === "categories" ? "categoría" : type === "venues" ? "espacio" : "plantilla";
  const rows: Edit[] = type === "categories" ? db!.categories.map(name => ({ original: name, name, campus: "", capacity: 1, description: `${db!.events.filter(e => e.category === name).length} eventos asociados`, active: true }))
    : type === "venues" ? db!.venues.map(v => ({ original: v.id, ...v, description: `${v.campus} · Capacidad: ${v.capacity} personas`, active: true }))
    : db!.templates.map(t => ({ ...t, original: String(t.id), campus: "", capacity: 1 }));
  const submit = (remove = false) => {
    if (!edit) return;
    let ok = false;
    if (type === "categories") ok = run({ type: "category", original: edit.original, name: edit.name, remove });
    if (type === "venues") ok = run({ type: "venue", original: edit.original, input: { id: edit.original ?? "", name: edit.name, campus: edit.campus, capacity: edit.capacity } satisfies Place, remove });
    if (type === "templates") ok = run({ type: "template", id: edit.id, name: edit.name, description: edit.description, active: edit.active, remove });
    if (ok) { setEdit(null); setRemoving(false); }
  };
  const filtered = rows.filter(r => `${r.name} ${r.description}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="Configuración institucional" title={type === "categories" ? "Categorías" : type === "venues" ? "Sedes y espacios" : "Plantillas de certificado"} description={type === "templates" ? "Catálogo de referencias de certificación. Los PDF locales utilizan el formato institucional de prueba." : "Mantén actualizado el catálogo compartido. Los cambios se reflejan en filtros y formularios."} action={<Button onClick={() => { setRemoving(false); setEdit({ name: "", campus: "", capacity: 100, description: "", active: true }); }}><Plus size={18} />{type === "venues" ? "Nuevo espacio" : `Nueva ${singular}`}</Button>} />
    <Card className="catalog"><div className="catalog-head flex-wrap gap-3"><span>{filtered.length} registros</span><Input aria-label="Buscar en el catálogo" placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} /></div>{filtered.map(item => <div className="catalog-row" key={item.original}><div className="catalog-icon"><Tag /></div><div><strong>{item.name}</strong><span>{item.description}</span></div><Badge tone={item.active ? "green" : "neutral"}>{item.active ? "Activo" : "Inactivo"}</Badge><Button variant="ghost" aria-label={`Configurar ${item.name}`} onClick={() => { setEdit({ ...item }); setRemoving(false); }}><Settings2 size={18} /></Button></div>)}{!filtered.length && <EmptyState title="Sin registros" text="Crea un registro o cambia la búsqueda." />}</Card>
    {edit && <Modal title={removing ? `Eliminar ${singular}` : `${edit.original ? "Editar" : "Crear"} ${singular}`} onClose={() => { setEdit(null); setRemoving(false); }}><form className="review-content" onSubmit={e => { e.preventDefault(); submit(removing); }}>
      {removing ? <p>¿Eliminar “{edit.name}”? Esta acción no se puede deshacer. No se eliminarán categorías ni espacios asociados a eventos.</p> : <><Input autoFocus required minLength={3} label="Nombre *" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
        {type === "venues" && <><Input label="Sede *" required minLength={3} value={edit.campus} onChange={e => setEdit({ ...edit, campus: e.target.value })} /><Input label="Capacidad del espacio *" required type="number" min={1} step={1} value={edit.capacity} onChange={e => setEdit({ ...edit, capacity: Number(e.target.value) })} /></>}
        {type === "templates" && <><Textarea label="Descripción" rows={3} value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} /><Select label="Estado" value={String(edit.active)} onChange={e => setEdit({ ...edit, active: e.target.value === "true" })}><option value="true">Activo</option><option value="false">Inactivo</option></Select></>}
      </>}
      <div className="modal-actions flex-wrap">{edit.original && !removing && <Button variant="danger" onClick={() => setRemoving(true)}>Eliminar</Button>}<Button variant="ghost" onClick={() => { if (removing) setRemoving(false); else setEdit(null); }}>Cancelar</Button><Button type="submit" variant={removing ? "danger" : "primary"}>{removing ? "Confirmar eliminación" : "Guardar"}</Button></div>
    </form></Modal>}
  </>;
}
