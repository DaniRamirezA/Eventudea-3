import type { Database } from "../types/domain";
import { createSeed } from "./seed";

export interface EventRepository {
  load(): Promise<Database>;
  save(data: Database): void;
}
export const DATA_KEY = "eventudea.database.v1";
export const SESSION_KEY = "eventudea.session.v1";
export class LocalRepository implements EventRepository {
  async load() {
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Database;
      if (parsed.version !== 1 || !Array.isArray(parsed.events) || !Array.isArray(parsed.users) || !Array.isArray(parsed.registrations) || !Array.isArray(parsed.venues) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.templates)) throw new Error("Los datos locales no son compatibles. No se han sobrescrito.");
      return parsed;
    }
    const seed = await createSeed();
    this.save(seed);
    return seed;
  }
  save(data: Database) {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
    catch { throw new Error("No se pudo guardar. Revisa el espacio y los permisos de almacenamiento del navegador."); }
  }
}
