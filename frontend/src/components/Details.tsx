import React, { useEffect, useState } from "react";
import { Modal, View, Text, ScrollView } from "react-native";
import { useAuth } from "../context/Auth";
import { request } from "../api";
import type { RecordItem, Resource } from "../types";
import { Button, Notice, styles, colors } from "./ui";
import { Select } from "./Select";
export function Details({
  kind,
  record,
  onClose,
  onChanged,
}: {
  kind: Resource;
  record: RecordItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { token, user } = useAuth();
  const [data, setData] = useState(record),
    [available, setAvailable] = useState<RecordItem[]>([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const isTeam = kind === "teams",
    isTournament = kind === "tournaments",
    related = isTeam ? "players" : "teams";
  const canManage =
    user?.role === "ADMIN" ||
    (user?.role === "COACH" &&
      (isTournament || (isTeam && data.coachId === user.id)));
  type Link = {
    playerId?: string;
    teamId?: string;
    player?: RecordItem;
    team?: RecordItem;
  };
  const links =
    ((isTeam ? data.players : isTournament ? data.teams : []) as Link[]) || [];
  async function load() {
    const [fresh, choices] = await Promise.all([
      request<RecordItem>("/" + kind + "/" + record.id, token),
      request<RecordItem[]>("/" + related, token),
    ]);
    setData(fresh);
    setAvailable(choices);
  }
  useEffect(() => {
    if (isTeam || isTournament) load().catch((e) => setError(e.message));
  }, []);
  async function change(id?: string) {
    setError("");
    setBusy(true);
    try {
      await request(
        `/${kind}/${record.id}/${related}${id ? "/" + id : ""}`,
        token,
        id ? "DELETE" : "POST",
        id ? undefined : { [isTeam ? "playerId" : "teamId"]: selected },
      );
      setSelected("");
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const eligible = available.filter(
    (a) =>
      !links.some((l) => (isTeam ? l.playerId : l.teamId) === a.id) &&
      (!isTournament ||
        (a.category === data.category &&
          (user?.role === "ADMIN" || a.coachId === user?.id))),
  );
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#10271FC0",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={[
            styles.card,
            { width: "100%", maxWidth: 650, maxHeight: "90%", gap: 20 },
          ]}
        >
          <Text style={styles.h2}>{data.name || "Detalle del partido"}</Text>
          <ScrollView contentContainerStyle={{ gap: 15 }}>
            {error && <Notice text={error} error />}
            <Text style={styles.muted}>
              {String(
                data.category || data.position || data.neighborhood || "",
              )}
              {data.location ? " · " + data.location : ""}
            </Text>
            {isTeam && (
              <Text style={styles.muted}>
                Club: {String((data.club as RecordItem)?.name || "")} ·
                Entrenador: {String((data.coach as RecordItem)?.name || "")}
              </Text>
            )}
            {isTournament && (
              <Text style={styles.muted}>
                {String(data.startDate).slice(0, 10)} al{" "}
                {String(data.endDate).slice(0, 10)}
              </Text>
            )}
            {(isTeam || isTournament) && (
              <>
                <Text style={styles.label}>
                  {isTeam ? "Plantilla" : "Equipos inscritos"} ({links.length})
                </Text>
                {links.map((l) => {
                  const item = (isTeam ? l.player : l.team)!;
                  const removable =
                    user?.role === "ADMIN" ||
                    (user?.role === "COACH" &&
                      (isTeam || item.coachId === user.id));
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.row,
                        {
                          justifyContent: "space-between",
                          borderBottomWidth: 1,
                          borderColor: colors.line,
                          paddingVertical: 10,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.ink, flex: 1 }}>
                        {item.name}
                      </Text>
                      {removable && (
                        <Button
                          title="Quitar"
                          secondary
                          disabled={busy}
                          onPress={() => change(item.id)}
                        />
                      )}
                    </View>
                  );
                })}
                {!links.length && (
                  <Text style={styles.muted}>
                    Todavía no hay registros asociados.
                  </Text>
                )}
                {canManage && (
                  <>
                    <Select
                      label={isTeam ? "Agregar jugador" : "Inscribir equipo"}
                      value={selected}
                      options={eligible.map((a) => ({
                        value: a.id,
                        label: a.name || a.id,
                      }))}
                      onChange={setSelected}
                    />
                    <Button
                      title={
                        isTeam ? "Agregar a plantilla" : "Inscribir al torneo"
                      }
                      onPress={() => change()}
                      disabled={!selected || busy}
                    />
                  </>
                )}
                {isTournament && (
                  <>
                    <Text style={[styles.label, { marginTop: 10 }]}>
                      Partidos del torneo
                    </Text>
                    {((data.matches || []) as RecordItem[]).length === 0 && (
                      <Text style={styles.muted}>
                        No hay partidos programados.
                      </Text>
                    )}
                    {((data.matches || []) as RecordItem[]).map((m) => (
                      <View key={m.id} style={{ gap: 5, paddingVertical: 8 }}>
                        <Text style={styles.label}>
                          {String((m.homeTeam as RecordItem).name)}{" "}
                          {m.homeScore == null
                            ? "vs"
                            : String(m.homeScore) +
                              " - " +
                              String(m.awayScore)}{" "}
                          {String((m.awayTeam as RecordItem).name)}
                        </Text>
                        <Text style={styles.muted}>
                          {new Date(String(m.kickoff)).toLocaleString("es-MX", {
                            timeZone: "America/Tijuana",
                          })}{" "}
                          · {String(m.location)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
            {kind === "players" && (
              <>
                <Text style={styles.muted}>
                  Nacimiento: {String(data.birthDate).slice(0, 10)} · Camiseta:{" "}
                  {String(data.jerseyNumber ?? "Sin asignar")}
                </Text>
                <Text style={styles.label}>Equipos</Text>
                {((data.memberships || []) as { team: RecordItem }[]).map(
                  (m) => (
                    <Text key={m.team.id} style={styles.muted}>
                      {m.team.name}
                    </Text>
                  ),
                )}
              </>
            )}
            {kind === "clubs" && (
              <Text style={styles.muted}>
                {String(data.description || "Sin descripción")}
              </Text>
            )}
          </ScrollView>
          <Button title="Cerrar" secondary onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
