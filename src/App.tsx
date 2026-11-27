"use client";
import { useEffect, useState } from "react";
import { BarChart3, Calendar, CalendarCheck, FileBadge, LayoutDashboard, ListChecks, LogOut, MapPin, Menu, Plus, QrCode, ShieldCheck, Tag, TicketCheck, Users, X } from "lucide-react";
import Logo from "./components/Logo";
import { Button, EmptyState, Modal } from "./components/ui";
import { AppProvider, useApp } from "./contexts/AppContext";
import { useNavigation } from "./hooks/useNavigation";
import AuthPage from "./views/AuthPage";
import ActivityPage from "./views/ActivityPage";
import EventEditor from "./views/EventEditor";
import { EventBrowser, EventDetailPage } from "./views/EventBrowser";
import { DashboardPage, ManagedEventsPage, ApprovalsPage, AttendancePage, EnrollmentsPage, ReportsPage } from "./views/ManagementPages";
import { CatalogPage, UsersPage } from "./views/AdminPages";
import { visibleEvents } from "./services/event-service";
import type { Role } from "./lib/types";

const labels: Record<Role, string> = { asistente: "Asistente", organizador: "Organizador", administrador: "Administrador" };
const navigation = {
  asistente: [
    { screen: "events", label: "Explorar eventos", icon: Calendar },
    { screen: "registrations", label: "Mis inscripciones", icon: TicketCheck },
  ],
  organizador: [
    { screen: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { screen: "create-event", label: "Crear evento", icon: Plus },
    { screen: "my-events", label: "Mis eventos", icon: CalendarCheck },
    { screen: "enrollments", label: "Inscritos", icon: Users },
    { screen: "qr", label: "Validar QR", icon: QrCode },
    { screen: "reports", label: "Reportes", icon: BarChart3 },
  ],
  administrador: [
    { screen: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { screen: "approvals", label: "Aprobaciones", icon: ListChecks },
    { screen: "all-events", label: "Eventos", icon: Calendar },
    { screen: "users", label: "Usuarios", icon: Users },
    { screen: "categories", label: "Categorías", icon: Tag },
    { screen: "venues", label: "Sedes y espacios", icon: MapPin },
    { screen: "enrollments", label: "Inscripciones", icon: TicketCheck },
    { screen: "certificates", label: "Certificados", icon: FileBadge },
    { screen: "templates", label: "Plantillas", icon: FileBadge },
    { screen: "reports", label: "Reportes", icon: BarChart3 },
  ],
};
export default function App() { return <AppProvider><Workspace /></AppProvider>; }
function Workspace() {
  const { db, user, error, logout } = useApp();
  const { screen, selectedId, navigate: route } = useNavigation();
  const [mobile, setMobile] = useState(false);
  const navigate = (next: string, id?: number) => { route(next, id); setMobile(false); };
  useEffect(() => {
    if (user) {
      const current = location.pathname.split("/").filter(Boolean)[0];
      const valid = navigation[user.role].some(n => n.screen === current) || (user.role === "asistente" && current === "event-detail");
      if (!valid) route(user.role === "asistente" ? "events" : "dashboard");
    }
  }, [user?.id]);
  if (error) return <div className="p-8"><EmptyState title="No se pudo conectar con EventUdeA" text={error} action={<Button onClick={() => location.reload()}>Reintentar</Button>} /></div>;
  if (!db) return <div className="min-h-screen grid place-content-center gap-5 text-center" role="status"><Logo /><p>Conectando con EventUdeA…</p></div>;
  if (!user) return <AuthPage />;
  const nav = navigation[user.role];
  const allowed = nav.some(n => n.screen === screen) || (user.role === "asistente" && screen === "event-detail");
  const selected = visibleEvents(db, user).find(e => e.id === selectedId);
  const initials = user.name.split(" ").slice(0, 2).map(n => n[0]).join("");
  const content = !allowed ? <EmptyState icon={<ShieldCheck />} title="Ruta no disponible para tu perfil" text="Usa el menú para acceder a las funciones autorizadas." action={<Button onClick={() => navigate(nav[0].screen)}>Ir a mi inicio</Button>} /> : <>
    {screen === "events" && <EventBrowser onOpen={id => navigate("event-detail", id)} />}
    {screen === "event-detail" && (selected ? <EventDetailPage event={selected} onBack={() => navigate("events")} /> : <EmptyState title="Evento no disponible" text="El evento no existe o todavía no se ha publicado." action={<Button onClick={() => navigate("events")}>Volver a la agenda</Button>} />)}
    {screen === "registrations" && <ActivityPage />}
    {screen === "dashboard" && <DashboardPage navigate={navigate} />}
    {screen === "create-event" && (!selectedId || selected ? <EventEditor key={selectedId ?? "new"} event={selected} done={() => navigate("my-events")} /> : <EmptyState title="Sin acceso al evento" text="Solo puedes editar eventos de tu propiedad." />)}
    {(screen === "my-events" || screen === "all-events") && <ManagedEventsPage navigate={navigate} />}
    {screen === "approvals" && <ApprovalsPage />}
    {screen === "qr" && <AttendancePage />}
    {screen === "reports" && <ReportsPage />}
    {screen === "users" && <UsersPage />}
    {screen === "enrollments" && <EnrollmentsPage key={selectedId ?? "all"} eventId={selectedId} />}
    {screen === "certificates" && <EnrollmentsPage certificatesOnly />}
    {(screen === "categories" || screen === "venues" || screen === "templates") && <CatalogPage key={screen} type={screen} />}
  </>;
  const navContent = <><Logo /><div className="role-chip"><ShieldCheck size={15} />{labels[user.role]}</div><nav aria-label="Navegación principal" className="min-h-0 overflow-y-auto">{nav.map(n => <Button key={n.screen} variant="ghost" aria-current={screen === n.screen ? "page" : undefined} className={screen === n.screen || (screen === "event-detail" && n.screen === "events") ? "active" : ""} onClick={() => navigate(n.screen)}><n.icon size={19} />{n.label}</Button>)}</nav><div className="sidebar-foot"><div className="avatar">{initials}</div><div className="min-w-0"><strong className="truncate">{user.name}</strong><span className="truncate">{user.email}</span></div><Button variant="ghost" aria-label="Cerrar sesión" onClick={() => { logout(); navigate("events"); }}><LogOut size={19} /></Button></div></>;
  return <div className="app-shell"><aside className="sidebar hidden! min-[761px]:flex!">{navContent}</aside>
    <main><header className="topbar"><Button variant="ghost" className="menu-btn" aria-label="Abrir menú" aria-expanded={mobile} onClick={() => setMobile(true)}><Menu size={22} /></Button><div className="topbar-copy"><span>Universidad de Antioquia</span><strong>Gestión centralizada de eventos</strong></div><span className="text-sm text-[#526258]">Plataforma universitaria</span><div className="top-avatar">{initials}</div></header><div className="page">{content}</div></main>
    {mobile && <Modal title="Menú de EventUdeA" onClose={() => setMobile(false)}><div className="grid gap-2 p-5"><div className="role-chip">{labels[user.role]}</div>{nav.map(n => <Button key={n.screen} variant={n.screen === screen ? "secondary" : "ghost"} onClick={() => navigate(n.screen)}><n.icon size={19} />{n.label}</Button>)}<Button variant="danger" onClick={() => { logout(); setMobile(false); route("events"); }}><LogOut size={18} />Cerrar sesión</Button><Button variant="ghost" onClick={() => setMobile(false)}><X size={18} />Cerrar menú</Button></div></Modal>}
  </div>;
}
