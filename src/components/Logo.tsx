import { CalendarDays } from "lucide-react";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo"><div className="logo-mark"><CalendarDays size={21} /></div>{!compact && <div><strong>EventUdeA</strong><span>Universidad de Antioquia</span></div>}</div>;
}
