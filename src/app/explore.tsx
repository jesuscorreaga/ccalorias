import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { PantallaDiario } from "@/components/diario/pantalla-diario";
import { borrarToken, obtenerResumenHoy } from "@/lib/api";

/**
 * Pestaña Explore = diario de comidas (antes era el Historial de "Comidas de hoy").
 * La cámara vive en la pestaña Home ("/").
 */
export default function DiarioScreen() {
  const router = useRouter();
  const [metaKcal, setMetaKcal] = useState(2000);

  // Trae la meta de calorías del usuario cada vez que se abre la pestaña
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      obtenerResumenHoy()
        .then((r) => {
          if (activo) setMetaKcal(r.meta_calorias_diaria);
        })
        .catch(() => {});
      return () => {
        activo = false;
      };
    }, []),
  );

  async function cerrarSesion() {
    await borrarToken();
    router.navigate("/"); // Home detecta que no hay sesión y muestra el login
  }

  return (
    <PantallaDiario
      metaKcal={metaKcal}
      onAgregar={() => router.navigate("/")}
      onCerrarSesion={cerrarSesion}
      onSesionExpirada={() => router.navigate("/")}
    />
  );
}
