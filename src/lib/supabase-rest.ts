const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = "eventudea.supabase.session.v1";

type Session = { access_token: string; refresh_token: string; expires_at?: number; user: { id: string; email?: string; user_metadata?: Record<string, unknown> } };

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno.");
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_KEY };
}
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { const value = localStorage.getItem(SESSION_KEY); return value ? JSON.parse(value) as Session : null; } catch { return null; }
}
function saveSession(value: Session | null) {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value)); else localStorage.removeItem(SESSION_KEY);
}
async function request(path: string, init: RequestInit = {}, authenticated = true) {
  const { url, key } = config();
  const session = authenticated ? getSession() : null;
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  else headers.set("Authorization", `Bearer ${key}`);
  const response = await fetch(`${url}${path}`, { ...init, headers });
  const body = await response.text();
  const data = body ? (() => { try { return JSON.parse(body); } catch { return body; } })() : null;
  if (!response.ok) {
    const message = typeof data === "object" && data ? (data.message || data.msg || data.error_description || data.error) : data;
    throw new Error(typeof message === "string" ? message : `Error de Supabase (${response.status}).`);
  }
  return data;
}
export async function signIn(email: string, password: string) {
  const result = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  saveSession({ ...result, expires_at: Math.floor(Date.now()/1000) + (result.expires_in || 3600) });
  return result.user;
}
export async function signUp(name: string, email: string, password: string) {
  const result = await request("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password, data: { full_name: name } }) }, false);
  if (result.access_token) saveSession({ ...result, expires_at: Math.floor(Date.now()/1000) + (result.expires_in || 3600) });
  return result;
}
export async function signOut() {
  try { await request("/auth/v1/logout", { method: "POST" }); } finally { saveSession(null); }
}
export async function currentAuthUser() {
  const session = getSession();
  if (!session?.access_token) return null;
  try { return await request("/auth/v1/user", {}, true); } catch { saveSession(null); return null; }
}
export async function selectRows<T>(table: string, query = "select=*"): Promise<T[]> {
  return (await request(`/rest/v1/${table}?${query}`)) ?? [];
}
export async function insertRow(table: string, values: unknown, prefer = "return=representation") {
  return request(`/rest/v1/${table}`, { method: "POST", headers: { Prefer: prefer }, body: JSON.stringify(values) });
}
export async function updateRows(table: string, query: string, values: unknown) {
  return request(`/rest/v1/${table}?${query}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) });
}
export async function deleteRows(table: string, query: string) {
  return request(`/rest/v1/${table}?${query}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}
export async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  return request(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
}
