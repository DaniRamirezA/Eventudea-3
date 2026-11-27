"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DATA_KEY, SESSION_KEY, LocalRepository } from "../repositories/local-repository";
import { execute } from "../services/event-service";
import { authenticate, registerUser } from "../services/auth-service";
import type { Command, Database, User } from "../types/domain";

interface State {
  db: Database | null;
  user: User | null;
  error: string;
  run: (command: Command, success?: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  notify: (message: string) => void;
}
const Context = createContext<State | null>(null);
const repository = new LocalRepository();
export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = (message: string) => { setToast(message); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 5500); };
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await repository.load();
        if (mounted) { setDb(data); setUserId(localStorage.getItem(SESSION_KEY)); }
      } catch (e) { if (mounted) setError((e as Error).message); }
    };
    void load();
    const sync = (event: StorageEvent) => { if (event.key === DATA_KEY || event.key === SESSION_KEY) void load(); };
    window.addEventListener("storage", sync);
    return () => { mounted = false; clearTimeout(timer.current); window.removeEventListener("storage", sync); };
  }, []);
  const user = db?.users.find(u => u.id === userId && u.active) ?? null;
  const run = (command: Command, success = "Cambios guardados correctamente.") => {
    try {
      // Read the latest persisted snapshot, including updates from other tabs.
      const saved = localStorage.getItem(DATA_KEY);
      if (!saved || !user) throw new Error("Inicia sesión para continuar.");
      const next = execute(JSON.parse(saved), user.id, command);
      repository.save(next); setDb(next); notify(success); return true;
    } catch (e) { notify((e as Error).message); return false; }
  };
  const login = async (email: string, password: string) => {
    const result = await authenticate(repository, email, password);
    localStorage.setItem(SESSION_KEY, result.user.id); setDb(result.db); setUserId(result.user.id);
  };
  const signup = async (name: string, email: string, password: string) => {
    const result = await registerUser(repository, name, email, password);
    localStorage.setItem(SESSION_KEY, result.user.id); setDb(result.db); setUserId(result.user.id);
  };
  const logout = () => { localStorage.removeItem(SESSION_KEY); setUserId(null); };
  return <Context.Provider value={{ db, user, error, run, login, signup, logout, notify }}>{children}{toast && <div className="toast max-w-[calc(100vw-2rem)]" role="status"><span>{toast}</span><button className="min-h-11 min-w-11" aria-label="Cerrar notificación" onClick={() => setToast("")}>×</button></div>}</Context.Provider>;
}
export const useApp = () => { const ctx = useContext(Context); if (!ctx) throw new Error("AppProvider requerido."); return ctx; };
