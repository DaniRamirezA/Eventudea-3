import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { LoaderCircle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export function Button({ className, variant = "primary", loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean }) {
  return <button type="button" className={cx("btn", `btn-${variant}`, className)} aria-busy={loading || undefined} {...props} disabled={props.disabled || loading}>{loading && <LoaderCircle size={16} className="animate-spin" aria-label="Cargando" />}{children}</button>;
}

export function Input({ label, error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return <label className={cx("field", className)}>{label && <span>{label}</span>}<input aria-invalid={!!error} {...props} />{error && <small role="alert">{error}</small>}</label>;
}

export function Select({ label, children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return <label className={cx("field", className)}>{label && <span>{label}</span>}<select {...props}>{children}</select></label>;
}

export function Textarea({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return <label className={cx("field", className)}>{label && <span>{label}</span>}<textarea {...props} /></label>;
}

export function Title({ as = "h1", children, className }: { as?: "h1" | "h2" | "h3"; children: ReactNode; className?: string }) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "blue" | "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#091d148c]" /><Dialog.Content aria-describedby={undefined} className="modal card fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"><div className="modal-head"><Dialog.Title className="font-bold text-xl">{title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" aria-label="Cerrar"><X size={20} /></Button></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <Card className="empty"><div className="empty-icon">{icon}</div><Title as="h3">{title}</Title><p>{text}</p>{action}</Card>;
}
