import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import Logo from "../components/Logo";
import { Badge, Button, Input, Title } from "../components/ui";
import { Button as ShadcnButton } from "../components/ui/button";
import { useApp } from "../contexts/AppContext";
import { loginSchema } from "../validations/forms";

const schema = loginSchema.extend({ name: z.string() });
type Fields = z.input<typeof schema>;
export default function AuthPage() {
  const { login, signup } = useApp();
  const [registering, setRegistering] = useState(false);
    const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Fields>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });
  const submit = handleSubmit(async data => {
    setError("");
    try {
      if (registering) await signup(data.name, data.email, data.password);
      else await login(data.email, data.password);
    } catch (e) { setError(e instanceof z.ZodError ? e.issues[0].message : (e as Error).message); }
  });
  return <div className="login-page">
    <section className="login-visual"><div className="visual-overlay" /><div className="login-brand"><Logo /><div><Badge tone="green">Plataforma universitaria</Badge><Title>Los encuentros que mueven nuestra universidad.</Title><p>Descubre, organiza y gestiona experiencias académicas en un solo lugar.</p></div><span>Universidad de Antioquia · Medellín</span></div></section>
    <section className="login-form"><div className="mobile-logo"><Logo /></div><div className="login-box"><span className="eyebrow">Bienvenido a EventUdeA</span><Title>{registering ? "Crea tu cuenta" : "Inicia sesión"}</Title><p>{registering ? "Regístrate como asistente de la comunidad universitaria." : "Accede a tus eventos y experiencias universitarias."}</p>
            <form onSubmit={submit} className="grid gap-3">
        {registering && <Input label="Nombre completo" autoComplete="name" {...register("name")} />}
        <Input label="Correo electrónico" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label="Contraseña" type="password" autoComplete={registering ? "new-password" : "current-password"} error={errors.password?.message} {...register("password")} />
        {error && <p role="alert" className="text-red-800!">{error}</p>}
        <Button type="submit" className="login-submit" loading={isSubmitting}>{registering ? "Crear cuenta de asistente" : "Iniciar sesión"}<ArrowRight size={18} /></Button>
      </form>
      <ShadcnButton variant="ghost" className="mt-3 w-full" onClick={() => { setRegistering(!registering); setError(""); setValue("email", ""); setValue("password", ""); }}>{registering ? "Ya tengo una cuenta" : "¿No tienes cuenta? Regístrate"}</ShadcnButton>
      <p className="login-note">Acceso seguro mediante la cuenta institucional registrada en EventUdeA.</p>
    </div></section>
  </div>;
}
