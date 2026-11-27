import App from "../../App";
export function generateStaticParams() {
  return ["events", "event-detail", "registrations", "dashboard", "create-event", "my-events", "qr", "reports", "approvals", "categories", "venues", "templates", "users", "all-events", "enrollments", "certificates"].map(screen => ({ screen }));
}
export const dynamicParams = false;
export default function Page() { return <App />; }
