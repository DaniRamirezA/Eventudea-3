import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { z } from "zod";
import Logo from "../components/Logo";
import { Badge, Button, Input, Select, Title } from "../components/ui";
import { Button as ShadcnButton } from "../components/ui/button";
import { useApp } from "../contexts/AppContext";
import { loginSchema } from "../validations/forms";

const schema = loginSchema.extend({ name: z.string(), role: z.enum(["asistente", "organizador"]) });
type Fields = z.input<typeof schema>;
export default function AuthPage() {
  const { login, signup, sendPasswordReset, changePassword, authFlow, clearAuthFlow } = useApp();
  const [registering, setRegistering] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "asistente" }
  });
  useEffect(() => {
    if (authFlow === "recovery") { setResetting(true); setRecovering(false); setRegistering(false); setMessage("Verificamos el enlace. Ahora puedes establecer una contraseña nueva."); }
    if (authFlow === "signup") { setMessage("Correo confirmado. Ya puedes iniciar sesión con tu cuenta."); setRegistering(false); }
    if (authFlow === "other") setError("El enlace no es válido o ha expirado. Solicita uno nuevo.");
  }, [authFlow]);
  const submit = handleSubmit(async data => {
    setError(""); setMessage("");
    try {
      if (registering) await signup(data.name, data.email, data.password, data.role);
      else await login(data.email, data.password);
    } catch (e) { setError(e instanceof z.ZodError ? e.issues[0].message : (e as Error).message); }
  });
  const sendRecovery = async () => {
    setError(""); setMessage("");
    try { await sendPasswordReset(recoveryEmail); setMessage("Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña."); }
    catch (e) { setError((e as Error).message); }
  };
  const saveNewPassword = async () => {
    setError(""); setMessage("");
    try { await changePassword(newPassword); setNewPassword(""); setResetting(false); setMessage("Contraseña actualizada. Ya puedes iniciar sesión."); clearAuthFlow(); }
    catch (e) { setError((e as Error).message); }
  };
  const switchMode = () => { setRegistering(!registering); setRecovering(false); setResetting(false); setError(""); setMessage(""); setValue("email", ""); setValue("password", ""); clearAuthFlow(); };
  return <div className="login-page">
    <section className="login-visual"><div className="visual-overlay" /><div className="login-brand"><Logo /><div><Badge tone="green">Plataforma universitaria</Badge><Title>Los encuentros que mueven nuestra universidad.</Title><p>Descubre, organiza y gestiona experiencias académicas en un solo lugar.</p></div><span>Universidad de Antioquia · Medellín</span></div></section>
    <section className="login-form"><div className="mobile-logo"><Logo /></div><div className="login-box">
      <span className="eyebrow">Bienvenido a EventUdeA</span>
      <Title>{resetting ? "Crea una contraseña nueva" : recovering ? "Recupera tu cuenta" : registering ? "Crea tu cuenta" : "Inicia sesión"}</Title>
      <p>{resetting ? "Elige una contraseña segura para volver a ingresar." : recovering ? "Te enviaremos un enlace a tu correo electrónico." : registering ? "Únete a la comunidad universitaria." : "Accede a tus eventos y experiencias universitarias."}</p>
      {resetting ? <div className="grid gap-3">
        <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        {error && <p role="alert" className="text-red-800!">{error}</p>}{message && <p role="status" className="text-green-800!">{message}</p>}
        <Button className="login-submit" onClick={saveNewPassword}>Guardar nueva contraseña <ArrowRight size={18}/></Button>
      </div> : recovering ? <div className="grid gap-3">
        <Input label="Correo electrónico" type="email" autoComplete="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
        {error && <p role="alert" className="text-red-800!">{error}</p>}{message && <p role="status" className="text-green-800!">{message}</p>}
        <Button className="login-submit" onClick={sendRecovery}>Enviar enlace <ArrowRight size={18}/></Button>
        <ShadcnButton variant="ghost" onClick={() => {setRecovering(false);setError("");setMessage("");}}>Volver a iniciar sesión</ShadcnButton>
      </div> : <>
        <form onSubmit={submit} className="grid gap-3">
          {registering && <>
            <Input label="Nombre completo" autoComplete="name" {...register("name")} />
            <Select label="Tipo de cuenta" {...register("role")}><option value="asistente">Asistente</option><option value="organizador">Organizador</option></Select>
          </>}
          <Input label="Correo electrónico" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Contraseña" type="password" autoComplete={registering ? "new-password" : "current-password"} error={errors.password?.message} {...register("password")} />
          {error && <p role="alert" className="text-red-800!">{error}</p>}
          {message && <p role="status" className="text-green-800!">{message}</p>}
          <Button type="submit" className="login-submit" loading={isSubmitting}>{registering ? "Crear cuenta" : "Iniciar sesión"}<ArrowRight size={18} /></Button>
        </form>
        {!registering && <ShadcnButton variant="ghost" className="mt-2 w-full" onClick={() => {setRecovering(true);setRecoveryEmail("");setError("");setMessage("");}}>¿Olvidaste tu contraseña?</ShadcnButton>}
        <ShadcnButton variant="ghost" className="mt-2 w-full" onClick={switchMode}>{registering ? "Ya tengo una cuenta" : "¿No tienes cuenta? Regístrate"}</ShadcnButton>
        <p className="login-note">Acceso seguro mediante la cuenta institucional registrada en EventUdeA.</p>
      </>}
    </div></section>
  </div>;
}
