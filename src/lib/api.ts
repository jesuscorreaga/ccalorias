import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "token";

export async function guardarToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function obtenerToken() {
  if (Platform.OS === "web") return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function borrarToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function mensajeDeError(detail: unknown, porDefecto: string) {
  return typeof detail === "string" ? detail : porDefecto;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(mensajeDeError(data?.detail, "No se pudo iniciar sesión"));
  }
  await guardarToken(data.access_token);
}

export async function registrar(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      mensajeDeError(data?.detail, "Datos inválidos, revisa el email"),
    );
  }
  await login(email, password);
}

export type AlimentoDetectado = {
  nombre: string;
  cantidad_estimada: string;
  calorias: number;
};

export type AnalisisFoto = {
  alimentos: AlimentoDetectado[];
  calorias_totales: number;
};

export async function analizarFoto(uri: string): Promise<AnalisisFoto> {
  const token = await obtenerToken();

  const formData = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    formData.append("foto", blob, "foto.jpg");
  } else {
    formData.append("foto", {
      uri,
      name: "foto.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
  }

  const res = await fetch(`${API_URL}/analisis/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    await borrarToken();
    throw new Error("SESION_EXPIRADA");
  }
  if (!res.ok) {
    throw new Error(
      mensajeDeError(data?.detail, "No se pudo analizar la foto"),
    );
  }
  return data;
}
export type ResumenDiario = {
  fecha: string;
  calorias_consumidas: number;
  meta_calorias_diaria: number;
  calorias_restantes: number;
  cantidad_comidas: number;
};

export async function obtenerResumenHoy(): Promise<ResumenDiario> {
  const token = await obtenerToken();
  const res = await fetch(`${API_URL}/resumen/hoy`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    await borrarToken();
    throw new Error("SESION_EXPIRADA");
  }
  if (!res.ok) {
    throw new Error(
      mensajeDeError(data?.detail, "No se pudo cargar el resumen"),
    );
  }
  return data;
}
