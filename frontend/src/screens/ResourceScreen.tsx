import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Modal } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Shell } from "../components/Shell";
import { Editor } from "../components/Editor";
import { Details } from "../components/Details";
import { Select } from "../components/Select";
import {
  colors,
  styles,
  Icon,
  Button,
  Notice,
  Loading,
  Badge,
} from "../components/ui";
import { configs } from "../config";
import { useAuth } from "../context/Auth";
import { request } from "../api";
import type { RecordItem, Resource } from "../types";
export function ResourceScreen() {
  const kind = useRoute().name as Resource,
    config = configs[kind],
    { user, token } = useAuth();
  const [rows, setRows] = useState<RecordItem[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [editor, setEditor] = useState<RecordItem | null | undefined>(undefined),
    [detail, setDetail] = useState<RecordItem | null>(null),
    [deleting, setDeleting] = useState<RecordItem | null>(null),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await request<RecordItem[]>("/" + kind, token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [kind, token]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const admin = user?.role === "ADMIN",
    canCreate = admin || (kind === "teams" && user?.role === "COACH");
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await request("/" + kind + "/" + deleting.id, token, "DELETE");
      setDeleting(null);
      setSuccess("Registro eliminado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  async function changeRole(row: RecordItem, role: string) {
    setBusy(true);
    try {
      await request("/users/" + row.id + "/role", token, "PATCH", { role });
      setSuccess("Permisos actualizados.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function title(r: RecordItem) {
    return kind === "matches"
      ? `${(r.homeTeam as RecordItem).name} vs ${(r.awayTeam as RecordItem).name}`
      : r.name || "";
  }
  function subtitle(r: RecordItem) {
    switch (kind) {
      case "players":
        return (
          ((r.memberships || []) as { team: RecordItem }[])
            .map((m) => m.team.name)
            .join(" · ") || "Sin equipo"
        );
      case "clubs":
        return String(r.neighborhood);
      case "teams":
        return `${(r.club as RecordItem).name} · ${(r.coach as RecordItem).name}`;
      case "tournaments":
        return `${r.location} · ${String(r.startDate).slice(0, 10)}`;
      case "matches":
        return `${new Date(String(r.kickoff)).toLocaleString("es-MX", { timeZone: "America/Tijuana" })} · ${r.location}`;
      case "users":
        return String(r.email);
    }
  }
  const filtered = rows.filter((r) =>
    (title(r) + " " + subtitle(r)).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Shell>
      <View
        style={[
          styles.row,
          { justifyContent: "space-between", flexWrap: "wrap", gap: 20 },
        ]}
      >
        <View style={{ gap: 8 }}>
          <Text style={styles.eyebrow}>{config.eyebrow}</Text>
          <Text style={styles.h1}>{config.title}</Text>
          <Text style={styles.muted}>{config.description}</Text>
        </View>
        {canCreate && kind !== "users" && (
          <Button
            title={"Crear " + config.singular}
            icon="plus"
            onPress={() => setEditor(null)}
          />
        )}
      </View>
      {error && <Notice text={error} error />}
      {success && <Notice text={success} />}
      <View style={[styles.card, { gap: 22 }]}>
        <View
          style={[
            styles.row,
            { justifyContent: "space-between", flexWrap: "wrap" },
          ]}
        >
          <View
            style={[
              styles.row,
              styles.input,
              { minWidth: 220, flex: 1, maxWidth: 400 },
            ]}
          >
            <Icon name="search" size={17} color={colors.muted} />
            <TextInput
              accessibilityLabel={"Buscar " + config.title.toLowerCase()}
              placeholder={"Buscar " + config.title.toLowerCase() + "…"}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, fontSize: 13, color: colors.ink, padding: 2 }}
            />
          </View>
          <Text style={styles.muted}>{filtered.length} registros</Text>
          <Button
            title="Actualizar"
            secondary
            icon="refresh-cw"
            onPress={load}
          />
        </View>
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <View style={{ padding: 35, alignItems: "center", gap: 15 }}>
            <Icon name={config.icon} size={35} color={colors.green} />
            <Text style={styles.h2}>
              {search
                ? "Sin coincidencias"
                : "Todo comienza con el primer registro"}
            </Text>
            <Text style={styles.muted}>
              {search
                ? "Prueba con otro nombre."
                : "Usa el botón Crear para empezar a organizar tu comunidad."}
            </Text>
          </View>
        ) : (
          filtered.map((r) => (
            <View
              key={r.id}
              style={{
                paddingVertical: 17,
                borderTopWidth: 1,
                borderColor: colors.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  height: 42,
                  width: 42,
                  borderRadius: 10,
                  backgroundColor: "#EDF2E7",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={config.icon} color={colors.green} />
              </View>
              <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}
                >
                  {title(r)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {subtitle(r)}
                </Text>
              </View>
              <Badge
                text={String(
                  r.category ||
                    r.position ||
                    (kind === "matches"
                      ? r.homeScore == null
                        ? "Programado"
                        : `${r.homeScore} – ${r.awayScore}`
                      : kind === "users"
                        ? r.role
                        : "Tijuana"),
                )}
              />
              {kind === "users" ? (
                <View style={{ minWidth: 180 }}>
                  {r.id !== user?.id && !busy && (
                    <Select
                      label="Rol"
                      value={String(r.role)}
                      options={[
                        { value: "ADMIN", label: "Administrador" },
                        { value: "COACH", label: "Entrenador" },
                        { value: "PLAYER", label: "Jugador" },
                      ]}
                      onChange={(v) => changeRole(r, v)}
                    />
                  )}
                </View>
              ) : (
                <View style={[styles.row, { gap: 7, flexWrap: "wrap" }]}>
                  {kind !== "matches" && (
                    <Button
                      title="Ver"
                      secondary
                      onPress={() => setDetail(r)}
                    />
                  )}{" "}
                  {(admin || (kind === "teams" && r.coachId === user?.id)) && (
                    <Button
                      title="Editar"
                      secondary
                      onPress={() => setEditor(r)}
                    />
                  )}{" "}
                  {admin && (
                    <Button
                      title="Eliminar"
                      secondary
                      onPress={() => setDeleting(r)}
                    />
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>
      {editor !== undefined && (
        <Editor
          kind={kind}
          record={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setSuccess("Cambios guardados.");
            load();
          }}
        />
      )}
      {detail && (
        <Details
          kind={kind}
          record={detail}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      )}
      <Modal
        visible={!!deleting}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleting(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#10271FC0",
            justifyContent: "center",
            alignItems: "center",
            padding: 25,
          }}
        >
          <View
            style={[styles.card, { maxWidth: 450, width: "100%", gap: 20 }]}
          >
            <Text style={styles.h2}>¿Eliminar este registro?</Text>
            <Text style={styles.muted}>
              {deleting && title(deleting)}. Esta acción es permanente. Si tiene
              relaciones activas, primero debes retirarlas.
            </Text>
            <View style={styles.row}>
              <Button
                title="Cancelar"
                secondary
                onPress={() => setDeleting(null)}
                disabled={busy}
              />
              <Button
                title={busy ? "Eliminando…" : "Eliminar"}
                danger
                onPress={remove}
                disabled={busy}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Shell>
  );
}
