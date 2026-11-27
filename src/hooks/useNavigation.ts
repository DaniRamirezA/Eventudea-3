import { useEffect, useState } from "react";
export const routes = ["events", "event-detail", "registrations", "dashboard", "create-event", "my-events", "qr", "reports", "approvals", "categories", "venues", "templates", "users", "all-events", "enrollments"];
export function useNavigation() {
  const [screen, setScreen] = useState("events");
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  useEffect(() => {
    const read = () => {
      const route = location.pathname.split("/").filter(Boolean)[0];
      setScreen(route || "events");
      setSelectedId(Number(new URLSearchParams(location.search).get("id")) || undefined);
    };
    read(); window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const navigate = (next: string, id?: number) => {
    history.pushState(null, "", `/${next}${id ? `?id=${id}` : ""}`);
    setScreen(next); setSelectedId(id); window.scrollTo({ top: 0 });
  };
  return { screen, selectedId, navigate };
}
