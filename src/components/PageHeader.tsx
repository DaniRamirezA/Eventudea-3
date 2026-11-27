import type { ReactNode } from "react";
import { Title } from "./ui";
export function PageHeader({ eyebrow = "EventUdeA", title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><Title>{title}</Title><p>{description}</p></div>{action}</div>;
}
