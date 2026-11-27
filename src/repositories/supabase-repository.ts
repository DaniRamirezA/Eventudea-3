import { authRequest, publicRequest } from "../lib/supabase";
import type { Database, User, ManagedEvent, Enrollment, Command } from "../types/domain";

type Row = Record<string, any>;
const q = (value: string) => encodeURIComponent(value);
const eventFrom = (r: Row): ManagedEvent => ({
  id: Number(r.id), name: r.name, description: r.description, category: r.categories?.name ?? "",
  date: r.event_date, time: String(r.event_time).slice(0,5), venue: r.venues?.name ?? "",
  capacity: Number(r.capacity), registered: 0, requirements: r.requirements, status: r.status,
  image: r.image_url ?? "", organizer: r.profiles?.full_name ?? "", ownerId: r.organizer_id,
  observations: r.observations ?? "", minimumAttendance: Number(r.minimum_attendance ?? 80),
});
const profileFrom = (r: Row): User => ({
  id:r.id, name:r.full_name ?? "", email:r.email ?? "", passwordHash:"",
  role:r.role, active:r.is_active,
});
export class SupabaseRepository {
  async load(userId?: string | null): Promise<Database> {
    const get = async (path: string, auth = false) => auth ? authRequest(path) : publicRequest(path);
    const [categories, venues, events, templates] = await Promise.all([
      get("/rest/v1/categories?select=id,name,description,is_active&order=name", !!userId),
      get("/rest/v1/venues?select=id,name,campus,capacity,is_active&order=name", !!userId),
      get("/rest/v1/events?select=*,categories(name),venues(name),profiles(full_name)&order=event_date.asc", !!userId),
      userId ? get("/rest/v1/certificate_templates?select=*&order=id", true) : Promise.resolve([]),
    ]);
    let users: User[] = [];
    let registrations: Enrollment[] = [];
    if (userId) {
      const [profileRows, registrationRows] = await Promise.all([
        authRequest(`/rest/v1/profiles?select=*&id=eq.${q(userId)}`),
        authRequest("/rest/v1/registrations?select=*&order=registered_at.desc"),
      ]);
      users = (profileRows ?? []).map(profileFrom);
      registrations = (registrationRows ?? []).map((r:Row) => ({
        id:r.id,userId:r.user_id,eventId:Number(r.event_id),code:r.code,cancelled:r.cancelled,
        attendance:r.attendance_status,attendancePercent:Number(r.attendance_percent),
        certificate:false,registeredAt:r.registered_at,attendedAt:r.attended_at ?? undefined,
      }));
      if (users[0]?.role === "administrador") {
        const allProfiles = await authRequest("/rest/v1/profiles?select=*&order=full_name");
        users = (allProfiles ?? []).map(profileFrom);
      } else if (users[0]?.role === "organizador") {
        const participantIds = [...new Set(registrations.map(r => r.userId))].filter(id => id !== userId);
        if (participantIds.length) {
          const ids = participantIds.map(id => `"${id}"`).join(",");
          const participants = await authRequest(`/rest/v1/profiles?select=*&id=in.(${ids})`);
          users = [...users, ...(participants ?? []).map(profileFrom)];
        }
      }
    }
    const mappedEvents = (events ?? []).map(eventFrom);
    mappedEvents.forEach(e => e.registered = registrations.filter(r=>r.eventId===e.id&&!r.cancelled).length);
    const mappedTemplates = (templates ?? []).map((t:Row)=>({id:Number(t.id),name:t.name,description:t.description,active:t.is_active}));
    return {
      version:1, users, events:mappedEvents, registrations,
      categories:(categories ?? []).map((c:Row)=>c.name),
      venues:(venues ?? []).map((v:Row)=>({id:v.id,name:v.name,campus:v.campus,capacity:Number(v.capacity)})),
      templates:mappedTemplates,
    };
  }
  async run(command: Command, actor: User): Promise<void> {
    const rpc = async (name:string, body:Row) => { await authRequest(`/rest/v1/rpc/${name}`,{method:"POST",body:JSON.stringify(body)}); };
    const patch = async (table:string, filter:string, body:Row) => { await authRequest(`/rest/v1/${table}?${filter}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(body)}); };
    const post = async (table:string, body:Row) => { await authRequest(`/rest/v1/${table}`,{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(body)}); };
    switch(command.type) {
      case "enroll": await rpc("register_for_event",{p_event_id:command.eventId}); break;
      case "cancel": await rpc("cancel_registration",{p_registration_id:command.id}); break;
      case "attendance": await rpc("record_event_attendance",{p_code:command.code,p_percent:command.percent}); break;
      case "review": await rpc("review_event",{p_event_id:command.id,p_approve:command.approve,p_observations:command.observations}); break;
      case "user": await rpc("admin_update_profile",{p_user_id:command.id,p_role:command.role,p_is_active:command.active}); break;
      case "finish": await rpc("finish_event",{p_event_id:command.id}); break;
      case "saveEvent": {
        const input=command.input;
        const [cats,places]=await Promise.all([
          authRequest(`/rest/v1/categories?select=id&name=eq.${q(input.category)}`),
          authRequest(`/rest/v1/venues?select=id&name=eq.${q(input.venue)}`),
        ]);
        if(!cats?.[0]||!places?.[0]) throw new Error("La categoría o el espacio ya no están disponibles.");
        const body={name:input.name,description:input.description,category_id:cats[0].id,event_date:input.date,event_time:input.time,venue_id:places[0].id,capacity:input.capacity,requirements:input.requirements,minimum_attendance:input.minimumAttendance,status:command.submit?"Pendiente de aprobación":"Borrador",organizer_id:actor.id};
        if(command.id!==undefined) await patch("events",`id=eq.${command.id}`,body); else await post("events",body);
        break;
      }
      case "deleteEvent": await authRequest(`/rest/v1/events?id=eq.${command.id}`,{method:"DELETE"}); break;
      case "category": {
        if(command.remove) await authRequest(`/rest/v1/categories?name=eq.${q(command.original ?? command.name)}`,{method:"DELETE"});
        else if(command.original) await authRequest(`/rest/v1/categories?name=eq.${q(command.original)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({name:command.name})});
        else await post("categories",{name:command.name,description:""});
        break;
      }
      case "venue": {
        if(command.remove) await authRequest(`/rest/v1/venues?id=eq.${q(command.original ?? "")}`,{method:"DELETE"});
        else if(command.original) await patch("venues",`id=eq.${q(command.original)}`,{name:command.input.name,campus:command.input.campus,capacity:command.input.capacity});
        else await post("venues",{name:command.input.name,campus:command.input.campus,capacity:command.input.capacity});
        break;
      }
      case "template": {
        if(command.remove) await authRequest(`/rest/v1/certificate_templates?id=eq.${command.id}`,{method:"DELETE"});
        else if(command.id) await patch("certificate_templates",`id=eq.${command.id}`,{name:command.name,description:command.description,is_active:command.active});
        else await post("certificate_templates",{name:command.name,description:command.description,is_active:command.active});
        break;
      }
    }
  }
}
