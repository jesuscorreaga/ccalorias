import { obtenerToken } from "@/lib/api";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodificarBase64Url(texto: string): string {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  let acumulado = 0;
  let bits = 0;
  let salida = "";
  for (const c of base64) {
    if (c === "=") break;
    const valor = LETRAS.indexOf(c);
    if (valor < 0) continue;
    acumulado = (acumulado << 6) | valor;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      salida += String.fromCharCode((acumulado >> bits) & 0xff);
      acumulado &= (1 << bits) - 1;
    }
  }
  return salida;
}

/**
 * Id del usuario con la sesión iniciada. Viene dentro del token (campo "sub").
 * Sirve para guardar datos locales (como el agua) separados por usuario.
 */
export async function obtenerUsuarioId(): Promise<string | null> {
  try {
    const token = await obtenerToken();
    const partes = token?.split(".");
    if (!partes || partes.length < 2) return null;
    const payload = JSON.parse(decodificarBase64Url(partes[1]));
    if (typeof payload.sub !== "string") return null;
    return payload.sub.replace(/[^A-Za-z0-9._-]/g, "") || null;
  } catch {
    return null;
  }
}
