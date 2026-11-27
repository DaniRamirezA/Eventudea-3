const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = "eventudea.supabase.session.v1";

export interface AuthUser { id: string; email: string; user_metadata?: { full_name?: string; name?: string; role?: string } }
export interface AuthSession { access_token: string; refresh_token: string; expires_at?: number; user: AuthUser }
export class SupabaseError extends Error {
  constructor(message: string, public status?: number) { super(message); this.name = "SupabaseError"; }
}
function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new SupabaseError("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.");
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_KEY };
}
export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as AuthSession : null; } catch { return null; }
}
export function setSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY);
}
async function request(path: string, init: RequestInit = {}, token?: string) {
  const { url, key } = config();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${token || key}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.text();
  let data: any = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) throw new SupabaseError(data?.msg || data?.message || data?.error_description || data?.hint || "Error al comunicarse con Supabase.", response.status);
  return data;
}
export async function consumeAuthRedirect(): Promise<"recovery" | "signup" | "other" | null> {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  const errorDescription = params.get("error_description");
  let flow: "recovery" | "signup" | "other" | null = null;
  try {
    if (errorDescription) {
      flow = "other";
    } else if (accessToken && refreshToken) {
      const expiresIn = Number(params.get("expires_in") || 3600);
      const user = await request("/auth/v1/user", {}, accessToken) as AuthUser;
      setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now()/1000) + expiresIn,
        user
      });
      flow = type === "recovery" ? "recovery" : type === "signup" ? "signup" : null;
    }
  } finally {
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
  return flow;
}
export async function signIn(email: string, password: string): Promise<AuthSession> {
  const data = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  const session = { ...data, expires_at: Math.floor(Date.now()/1000) + data.expires_in } as AuthSession;
  setSession(session); return session;
}
export async function signUp(name: string, email: string, password: string, role: "asistente" | "organizador"): Promise<AuthSession | null> {
  const redirect = typeof window !== "undefined" ? window.location.origin : "";
  const data = await request(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirect)}`, {
    method: "POST",
    body: JSON.stringify({ email, password, data: { full_name: name, role } })
  });
  if (!data.access_token) return null;
  const session = { ...data, expires_at: Math.floor(Date.now()/1000) + data.expires_in } as AuthSession;
  setSession(session); return session;
}
export async function requestPasswordReset(email: string) {
  const redirect = typeof window !== "undefined" ? window.location.origin : "";
  await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, {
    method: "POST", body: JSON.stringify({ email })
  });
}
export async function updatePassword(password: string) {
  const session = await currentSession();
  if (!session) throw new SupabaseError("El enlace de recuperación expiró. Solicita uno nuevo.", 401);
  await request("/auth/v1/user", { method: "PUT", body: JSON.stringify({ password }) }, session.access_token);
}
export async function signOut() {
  const session = getSession();
  if (session) { try { await request("/auth/v1/logout", { method: "POST" }, session.access_token); } finally { setSession(null); } }
}
export async function currentSession(): Promise<AuthSession | null> {
  const session = getSession(); if (!session) return null;
  if (session.expires_at && session.expires_at > Math.floor(Date.now()/1000) + 60) return session;
  try {
    const data = await request("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) });
    const next = { ...data, expires_at: Math.floor(Date.now()/1000) + data.expires_in } as AuthSession;
    setSession(next); return next;
  } catch { setSession(null); return null; }
}
export async function authRequest(path: string, init: RequestInit = {}) {
  const session = await currentSession();
  if (!session) throw new SupabaseError("Tu sesión expiró. Inicia sesión nuevamente.", 401);
  return request(path, init, session.access_token);
}
export async function publicRequest(path: string, init: RequestInit = {}) { return request(path, init); }
