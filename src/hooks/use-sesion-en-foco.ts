import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { obtenerToken } from "@/lib/api";

/**
 * Revisa la sesión cada vez que se abre una pestaña.
 *
 * - `listo`: false mientras se comprueba la sesión (y mientras la pestaña está
 *   oculta). Sirve para no mostrar ni un instante datos del usuario anterior.
 * - `clave`: sube cada vez que la sesión cambió desde la última vez que se
 *   abrió la pestaña (se cerró sesión, venció, o entró otro usuario). Usarla
 *   como `key` reinicia por completo la pantalla.
 * - `alVerificar`: se ejecuta con el token actual (o null si no hay sesión).
 */
export function useSesionEnFoco(alVerificar?: (token: string | null) => void) {
  const [estado, setEstado] = useState({ clave: 0, listo: false });
  const ultimoToken = useRef<string | null | undefined>(undefined);
  const callback = useRef(alVerificar);

  useEffect(() => {
    callback.current = alVerificar;
  });

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      obtenerToken().then((token) => {
        if (!activo) return;
        const cambio =
          ultimoToken.current !== undefined && ultimoToken.current !== token;
        ultimoToken.current = token;
        callback.current?.(token);
        setEstado((e) => ({ clave: cambio ? e.clave + 1 : e.clave, listo: true }));
      });
      return () => {
        activo = false;
        setEstado((e) => ({ ...e, listo: false }));
      };
    }, []),
  );

  return estado;
}
