import { useState } from "react";
import { CalendarDays } from "lucide-react";
export function EventImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div role="img" aria-label={alt} className="flex h-full w-full items-center justify-center gap-3 bg-[#165238] text-white"><CalendarDays size={46} /><span>Encuentros EventUdeA</span></div> : <img src={src} alt={alt} onError={() => setFailed(true)} />;
}
