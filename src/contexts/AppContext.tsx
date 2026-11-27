"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Command, Database, User } from "../types/domain";
import type { Role } from "../lib/types";
import { SupabaseRepository } from "../repositories/supabase-repository";
import { authRequest, consumeAuthRedirect, currentSession, requestPasswordReset, setSession, signIn, signOut, signUp, updatePassword } from "../lib/supabase";
import { loginSchema, signupSchema } from "../validations/forms";

interface State {
  db: Database | null;
  user: User | null;
  error: string;
  authFlow: "recovery" | "signup" | "other" | null;
  run: (command: Command, success?: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: "asistente" | "organizador") => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  clearAuthFlow: () => void;
  logout: () => void;
  notify: (message: string) => void;
}
const Context = createContext<State | null>(null);
const repository = new SupabaseRepository();
export function AppProvider({ children }: { children: ReactNode }) {
  const [db,setDb]=useState<Database|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [toast,setToast]=useState("");
  const [authFlow,setAuthFlow]=useState<State["authFlow"]>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const notify=(message:string)=>{setToast(message);clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(""),5500);};
  const reload=async (id:string|null)=>{const data=await repository.load(id);setDb(data);setUserId(id);};
  useEffect(()=>{
    let mounted=true;
    const init=async()=>{
      try{
        const flow=await consumeAuthRedirect();
        const session=await currentSession();
        const id=session?.user?.id??null;
        const data=await repository.load(id);
        if(mounted){setDb(data);setUserId(id);if(flow)setAuthFlow(flow);}
      }catch(e){if(mounted)setError((e as Error).message);}
    };
    void init();
    return ()=>{mounted=false;clearTimeout(timer.current);};
  },[]);
  const user=db?.users.find(u=>u.id===userId&&u.active)??null;
  const run=(command:Command,success="Cambios guardados correctamente.")=>{
    if(!user){notify("Inicia sesión para continuar.");return false;}
    void (async()=>{
      try{
        await repository.run(command,user);
        await reload(user.id);
        notify(success);
      }catch(e){notify((e as Error).message);}
    })();
    return true;
  };
  const login=async(email:string,password:string)=>{
    const input=loginSchema.parse({email:email.trim(),password});
    const session=await signIn(input.email,input.password);
    await reload(session.user.id);
    const profile=(await authRequest(`/rest/v1/profiles?select=id,is_active&id=eq.${session.user.id}`))?.[0];
    if(!profile?.is_active){setSession(null);setUserId(null);throw new Error("Tu cuenta está inactiva o no tiene un perfil habilitado.");}
  };
  const signup=async(name:string,email:string,password:string,role:"asistente"|"organizador")=>{
    const input=signupSchema.parse({name,email:email.trim(),password});
    const session=await signUp(input.name,input.email,input.password,role);
    if(!session){notify("Te enviamos un correo para confirmar tu cuenta. Abre el enlace desde este mismo sitio y luego inicia sesión.");return;}
    await reload(session.user.id);
  };
  const sendPasswordReset=async(email:string)=>{
    const clean=email.trim().toLowerCase();
    if(!clean)throw new Error("Escribe tu correo electrónico para enviarte el enlace.");
    await requestPasswordReset(clean);
  };
  const changePassword=async(password:string)=>{
    if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
    await updatePassword(password);
    setAuthFlow(null);
    await signOut();
    setUserId(null);
    await reload(null);
  };
  const clearAuthFlow=()=>setAuthFlow(null);
  const logout=()=>{void signOut().finally(()=>{setUserId(null);void repository.load(null).then(setDb).catch(e=>setError((e as Error).message));});};
  return <Context.Provider value={{db,user,error,authFlow,run,login,signup,sendPasswordReset,changePassword,clearAuthFlow,logout,notify}}>{children}{toast&&<div className="toast max-w-[calc(100vw-2rem)]" role="status"><span>{toast}</span><button className="min-h-11 min-w-11" aria-label="Cerrar notificación" onClick={()=>setToast("")}>×</button></div>}</Context.Provider>;
}
export const useApp=()=>{const ctx=useContext(Context);if(!ctx)throw new Error("AppProvider requerido.");return ctx;};
