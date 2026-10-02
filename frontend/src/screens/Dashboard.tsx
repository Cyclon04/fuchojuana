import React, { useState, useCallback } from "react";
import { Text, View, Pressable, useWindowDimensions } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/Auth";
import { request } from "../api";
import { Shell } from "../components/Shell";
import {
  colors,
  styles,
  Icon,
  Button,
  Loading,
  Notice,
  Badge,
} from "../components/ui";
type Match = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  tournament: { name: string };
  kickoff: string;
  location: string;
};
type Data = {
  players: number;
  clubs: number;
  teams: number;
  tournaments: number;
  matches: Match[];
};
export function Dashboard() {
  const { user, token } = useAuth(),
    { width } = useWindowDimensions(),
    nav = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      request<Data>("/dashboard", token)
        .then(setData)
        .catch((e) => setError(e.message));
    }, [token]),
  );
  return (
    <Shell>
      <View
        style={[
          styles.row,
          { justifyContent: "space-between", flexWrap: "wrap" },
        ]}
      >
        <View style={{ gap: 8 }}>
          <Text style={styles.eyebrow}>TU COMUNIDAD, EN MOVIMIENTO</Text>
          <Text style={styles.h1}>
            Hola, {user?.name.split(" ")[0]}{" "}
            <Text style={{ color: colors.green }}>✦</Text>
          </Text>
          <Text style={styles.muted}>
            Todo listo para una nueva jornada de fútbol.
          </Text>
        </View>
        <Badge
          text={new Date().toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
      </View>
      <View
        style={{
          backgroundColor: colors.green,
          borderRadius: 16,
          padding: 30,
          overflow: "hidden",
          gap: 14,
        }}
      >
        <Text
          style={{
            color: colors.lime,
            fontSize: 10,
            letterSpacing: 2,
            fontWeight: "700",
          }}
        >
          EL FÚTBOL NOS ENCUENTRA
        </Text>
        <Text
          style={{
            fontSize: width > 700 ? 36 : 29,
            fontWeight: "600",
            color: "white",
            letterSpacing: -1,
            maxWidth: 530,
          }}
        >
          Más equipo. Más cancha.{"\n"}Más Tijuana.
        </Text>
        <Text
          style={{
            color: "#D4E4D4",
            fontSize: 13,
            lineHeight: 21,
            maxWidth: 450,
          }}
        >
          Organiza tu club, impulsa a tus jugadores y haz que cada partido
          cuente.
        </Text>
        <View style={{ alignSelf: "flex-start", marginTop: 5 }}>
          <Button
            title="Explorar torneos"
            secondary
            icon="arrow-up-right"
            onPress={() => nav.navigate("tournaments")}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -90,
            top: 20,
            width: 330,
            height: 330,
            borderWidth: 1,
            borderColor: "#64906E",
            borderRadius: 180,
            opacity: 0.4,
          }}
        />
      </View>
      {error && <Notice text={error} error />}
      {!data && !error ? (
        <Loading />
      ) : (
        data && (
          <>
            <View style={styles.grid}>
              {(
                [
                  { key: "players", label: "Jugadores", icon: "users" },
                  { key: "teams", label: "Equipos", icon: "flag" },
                  { key: "clubs", label: "Clubes", icon: "shield" },
                  { key: "tournaments", label: "Torneos", icon: "award" },
                ] as const
              ).map((s) => (
                <Pressable
                  key={s.key}
                  onPress={() => nav.navigate(s.key)}
                  style={[styles.card, { flex: 1, minWidth: 140, gap: 16 }]}
                >
                  <View
                    style={[styles.row, { justifyContent: "space-between" }]}
                  >
                    <Text style={styles.muted}>{s.label}</Text>
                    <Icon name={s.icon} size={18} color={colors.green} />
                  </View>
                  <Text
                    style={{
                      fontSize: 34,
                      fontWeight: "600",
                      color: colors.ink,
                    }}
                  >
                    {data[s.key].toString().padStart(2, "0")}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>
                    Ver {s.label.toLowerCase()} ↗
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.card, { gap: 20 }]}>
              <View
                style={[
                  styles.row,
                  { justifyContent: "space-between", flexWrap: "wrap" },
                ]}
              >
                <View style={{ gap: 5 }}>
                  <Text style={styles.h2}>Próximos encuentros</Text>
                  <Text style={styles.muted}>
                    La siguiente jugada está en el calendario.
                  </Text>
                </View>
                <Button
                  title="Ver calendario"
                  secondary
                  onPress={() => nav.navigate("matches")}
                />
              </View>
              {data.matches.length === 0 ? (
                <Text style={styles.muted}>
                  Aún no hay partidos próximos. Programa la siguiente jornada en
                  Partidos.
                </Text>
              ) : (
                data.matches.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      paddingVertical: 16,
                      borderTopWidth: 1,
                      borderColor: colors.line,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.bg,
                        padding: 12,
                        borderRadius: 9,
                        minWidth: 58,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          color: colors.green,
                          fontWeight: "700",
                        }}
                      >
                        {new Date(m.kickoff).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          timeZone: "America/Tijuana",
                        })}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.muted }}>
                        {new Date(m.kickoff)
                          .toLocaleDateString("es-MX", {
                            month: "short",
                            timeZone: "America/Tijuana",
                          })
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.ink,
                        }}
                      >
                        {m.homeTeam.name}{" "}
                        <Text style={{ color: colors.muted, fontSize: 11 }}>
                          vs
                        </Text>{" "}
                        {m.awayTeam.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {m.tournament.name} · {m.location}
                      </Text>
                    </View>
                    <Badge
                      text={new Date(m.kickoff).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Tijuana",
                      })}
                    />
                  </View>
                ))
              )}
            </View>
          </>
        )
      )}
    </Shell>
  );
}
