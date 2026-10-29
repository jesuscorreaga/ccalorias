import {
  API_URL,
  borrarToken,
  obtenerToken,
  type AlimentoDetectado,
  type RegistroComida,
} from "@/lib/api";

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------

/**
 * El backend todavía NO devuelve macros. Cuando lo haga, debe incluir estos
 * campos (en gramos) dentro de cada alimento detectado:
 *   proteina_g, carbohidratos_g, grasas_g
 */
export type AlimentoConMacros = AlimentoDetectado & {
  proteina_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
};

export type Comida = "desayuno" | "almuerzo" | "cena" | "snacks";

export const COMIDAS: { id: Comida; nombre: string; emoji: string }[] = [
  { id: "desayuno", nombre: "Desayuno", emoji: "☕" },
  { id: "almuerzo", nombre: "Almuerzo", emoji: "🥗" },
  { id: "cena", nombre: "Cena", emoji: "🌙" },
  { id: "snacks", nombre: "Snacks", emoji: "🍏" },
];

/** Una foto registrada: su hora, sus alimentos y el total de calorías. */
export type GrupoRegistro = {
  id: string;
  hora: string;
  comida: Comida;
  alimentos: AlimentoConMacros[];
  kcal: number;
};

/**
 * El backend no guarda a qué comida pertenece cada registro, así que se
 * deduce por la hora en que se tomó la foto.
 */
export function comidaDeHora(iso: string): Comida {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 11) return "desayuno";
  if (h >= 11 && h < 16) return "almuerzo";
  if (h >= 18 && h < 22) return "cena";
  return "snacks";
}

// ---------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "01:30 p. m." según la configuración regional del celular. */
export function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function inicioDelDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sumarDias(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return inicioDelDia(r);
}

export function mismoDia(a: Date, b: Date) {
  return claveFecha(a) === claveFecha(b);
}

/** "2026-10-27": formato que espera el backend en /registros?fecha= */
export function claveFecha(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function etiquetaDia(d: Date, hoy: Date = new Date()) {
  const diff = Math.round(
    (inicioDelDia(hoy).getTime() - inicioDelDia(d).getTime()) / 86400000,
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return DIAS[d.getDay()];
}

export function fechaCorta(d: Date) {
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

// ---------------------------------------------------------------
// Datos
// ---------------------------------------------------------------

export async function obtenerRegistrosDia(dia: Date): Promise<RegistroComida[]> {
  const token = await obtenerToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/registros?fecha=${claveFecha(dia)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Revisa tu conexión o que el backend esté encendido.",
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    await borrarToken();
    throw new Error("SESION_EXPIRADA");
  }
  if (!res.ok) {
    throw new Error(
      typeof data?.detail === "string" ? data.detail : "No se pudo cargar el diario",
    );
  }
  return data;
}

/** Convierte los registros del backend en grupos, el más reciente primero. */
export function gruposDeRegistros(registros: RegistroComida[]): GrupoRegistro[] {
  return [...registros]
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
    .map((r) => {
      const alimentos = r.alimentos_detectados as AlimentoConMacros[];
      return {
        id: r.id,
        hora: horaCorta(r.fecha_hora),
        comida: comidaDeHora(r.fecha_hora),
        alimentos,
        kcal: alimentos.reduce((suma, a) => suma + (a.calorias ?? 0), 0),
      };
    });
}

/** Reparte los grupos en Desayuno / Almuerzo / Cena / Snacks (conserva el orden). */
export function agruparPorComida(grupos: GrupoRegistro[]) {
  const porComida: Record<Comida, GrupoRegistro[]> = {
    desayuno: [],
    almuerzo: [],
    cena: [],
    snacks: [],
  };
  for (const g of grupos) porComida[g.comida].push(g);
  return porComida;
}

export function kcalDe(grupos: GrupoRegistro[]) {
  return grupos.reduce((suma, g) => suma + g.kcal, 0);
}

export type Totales = {
  kcal: number;
  proteina: number;
  carbos: number;
  grasas: number;
  hayMacros: boolean;
};

export function totales(grupos: GrupoRegistro[]): Totales {
  let kcal = 0;
  let proteina = 0;
  let carbos = 0;
  let grasas = 0;
  for (const g of grupos) {
    kcal += g.kcal;
    for (const a of g.alimentos) {
      proteina += a.proteina_g ?? 0;
      carbos += a.carbohidratos_g ?? 0;
      grasas += a.grasas_g ?? 0;
    }
  }
  return { kcal, proteina, carbos, grasas, hayMacros: proteina + carbos + grasas > 0 };
}

/** Metas de macros en gramos: reparto 30% proteína, 40% carbohidratos, 30% grasas. */
export function metasMacros(metaKcal: number) {
  return {
    proteina: Math.round((metaKcal * 0.3) / 4),
    carbos: Math.round((metaKcal * 0.4) / 4),
    grasas: Math.round((metaKcal * 0.3) / 9),
  };
}
