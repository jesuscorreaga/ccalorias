import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BotonGrande } from "@/components/ui/boton-grande";
import { useTheme } from "@/hooks/use-theme";
import { inicioDelDia, mismoDia } from "@/lib/diario";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const ANIO_MIN = 2020;
const ANIO_MAX = 2100;

type Props = {
  visible: boolean;
  /** Día que está seleccionado ahora. */
  fecha: Date;
  onElegir: (fecha: Date) => void;
  onCerrar: () => void;
};

/**
 * Calendario para elegir cualquier día. Funciona igual en el celular y en el
 * navegador (no usa librerías externas). Las fechas futuras se pueden elegir:
 * simplemente no tendrán comidas.
 */
export function SelectorFecha({ visible, fecha, onElegir, onCerrar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Calendario fecha={fecha} onElegir={onElegir} onCerrar={onCerrar} />
    </Modal>
  );
}

function Calendario({ fecha, onElegir, onCerrar }: Omit<Props, "visible">) {
  const theme = useTheme();
  const hoy = inicioDelDia(new Date());
  const [mes, setMes] = useState(() => new Date(fecha.getFullYear(), fecha.getMonth(), 1));

  const anio = mes.getFullYear();
  const m = mes.getMonth();
  const diasEnMes = new Date(anio, m + 1, 0).getDate();
  const desfase = (new Date(anio, m, 1).getDay() + 6) % 7; // la semana empieza en lunes

  const celdas: (number | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const filas = Array.from({ length: celdas.length / 7 }, (_, r) => celdas.slice(r * 7, r * 7 + 7));

  const puedeAtras = anio > ANIO_MIN || m > 0;
  const puedeAdelante = anio < ANIO_MAX || m < 11;
  const cambiarMes = (n: number) => setMes(new Date(anio, m + n, 1));

  return (
    <Pressable
      accessibilityLabel="Cerrar selector de fecha"
      onPress={onCerrar}
      style={styles.fondo}>
      {/* El Pressable interior evita que tocar el calendario lo cierre */}
      <Pressable
        onPress={() => {}}
        style={[
          styles.tarjeta,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={styles.cabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            disabled={!puedeAtras}
            hitSlop={12}
            onPress={() => cambiarMes(-1)}>
            <Text style={[styles.flecha, { color: theme.text, opacity: puedeAtras ? 1 : 0.25 }]}>
              ‹
            </Text>
          </Pressable>

          <ThemedText style={styles.mesTitulo}>{`${MESES[m]} ${anio}`}</ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            disabled={!puedeAdelante}
            hitSlop={12}
            onPress={() => cambiarMes(1)}>
            <Text style={[styles.flecha, { color: theme.text, opacity: puedeAdelante ? 1 : 0.25 }]}>
              ›
            </Text>
          </Pressable>
        </View>

        <View style={styles.fila}>
          {SEMANA.map((d, i) => (
            <View key={i} style={styles.celda}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {d}
              </ThemedText>
            </View>
          ))}
        </View>

        {filas.map((fila, r) => (
          <View key={r} style={styles.fila}>
            {fila.map((dia, c) => {
              if (dia === null) return <View key={c} style={styles.celda} />;

              const fechaDia = new Date(anio, m, dia);
              const seleccionado = mismoDia(fechaDia, fecha);
              const esHoy = mismoDia(fechaDia, hoy);
              const futuro = fechaDia.getTime() > hoy.getTime();

              return (
                <View key={c} style={styles.celda}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${dia} de ${MESES[m]} de ${anio}`}
                    accessibilityState={{ selected: seleccionado }}
                    onPress={() => onElegir(fechaDia)}
                    style={[
                      styles.dia,
                      esHoy && { borderColor: theme.primary, borderWidth: 2 },
                      seleccionado && { backgroundColor: theme.button, borderColor: theme.button },
                    ]}>
                    <Text
                      style={[
                        styles.diaTexto,
                        {
                          color: seleccionado
                            ? theme.onButton
                            : futuro
                              ? theme.textSecondary
                              : theme.text,
                        },
                      ]}>
                      {dia}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.botones}>
          <BotonGrande
            titulo="Hoy"
            variante="secundario"
            compacto
            onPress={() => onElegir(hoy)}
            style={styles.boton}
          />
          <BotonGrande
            titulo="Cerrar"
            variante="secundario"
            compacto
            onPress={onCerrar}
            style={styles.boton}
          />
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  tarjeta: {
    width: "100%",
    maxWidth: 360,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  flecha: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "300",
    paddingHorizontal: 8,
  },
  mesTitulo: {
    fontWeight: "800",
    fontSize: 18,
    textTransform: "capitalize",
  },
  fila: {
    flexDirection: "row",
  },
  celda: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dia: {
    width: "88%",
    height: "88%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  diaTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
  botones: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  boton: {
    flex: 1,
  },
});
