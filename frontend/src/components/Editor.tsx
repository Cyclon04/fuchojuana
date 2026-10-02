import React, { useEffect, useState } from "react";
import { Modal, View, Text, ScrollView } from "react-native";
import { useAuth } from "../context/Auth";
import { request } from "../api";
import { configs } from "../config";
import { localDateTime, toISO } from "../dates";
import type { Resource, RecordItem, Option } from "../types";
import { Input, Button, Notice, styles } from "./ui";
import { Select } from "./Select";
export function Editor({
  kind,
  record,
  onClose,
  onSaved,
}: {
  kind: Resource;
  record: RecordItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token, user } = useAuth(),
    config = configs[kind];
  const [values, setValues] = useState<Record<string, string>>({}),
    [options, setOptions] = useState<Record<string, readonly Option[]>>({}),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const initial: Record<string, string> = {};
    for (const f of config.fields) {
      const raw = record?.[f.key];
      initial[f.key] =
        raw == null
          ? ""
          : f.type === "date"
            ? String(raw).slice(0, 10)
            : f.type === "datetime"
              ? localDateTime(String(raw))
              : String(raw);
    }
    if (kind === "teams" && user?.role === "COACH") initial.coachId = user.id;
    setValues(initial);
    Promise.all(
      config.fields
        .filter((f) => f.source)
        .map(async (f) => {
          let rows = await request<RecordItem[]>("/" + f.source, token);
          if (f.source === "users")
            rows = rows.filter((r) => r.role === "PLAYER");
          if (f.key === "coachId" && user?.role === "COACH")
            rows = rows.filter((r) => r.id === user.id);
          return [
            f.key,
            [
              ...(f.optional ? [{ value: "", label: "Sin vincular" }] : []),
              ...rows.map((r) => ({ value: r.id, label: r.name || r.id })),
            ],
          ] as const;
        }),
    )
      .then((entries) => {
        if (active) setOptions(Object.fromEntries(entries));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [kind, record, token]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      for (const f of config.fields) {
        const v = values[f.key]?.trim() || "";
        if (!v && !f.optional) throw new Error(`Completa: ${f.label}`);
        body[f.key] =
          f.type === "number"
            ? v === ""
              ? null
              : Number(v)
            : f.type === "datetime"
              ? toISO(v)
              : f.key === "userId"
                ? v || null
                : v;
      }
      await request(
        "/" + kind + (record ? "/" + record.id : ""),
        token,
        record ? "PUT" : "POST",
        body,
      );
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
            {
              width: "100%",
              maxWidth: 560,
              maxHeight: "92%",
              padding: 24,
              gap: 18,
            },
          ]}
        >
          <Text style={styles.h2}>
            {record ? "Editar" : "Crear"} {config.singular}
          </Text>
          <ScrollView contentContainerStyle={{ gap: 15, paddingBottom: 12 }}>
            {error && <Notice text={error} error />}
            {config.fields.map((f) =>
              f.type === "select" ? (
                <Select
                  key={f.key}
                  label={f.label + (f.optional ? " (opcional)" : "")}
                  value={values[f.key] || ""}
                  options={f.options || options[f.key] || []}
                  onChange={(v) => setValues({ ...values, [f.key]: v })}
                />
              ) : (
                <Input
                  key={f.key}
                  label={f.label + (f.optional ? " (opcional)" : "")}
                  value={values[f.key] || ""}
                  onChange={(v) => setValues({ ...values, [f.key]: v })}
                  number={f.type === "number"}
                />
              ),
            )}
          </ScrollView>
          <View style={[styles.row, { justifyContent: "flex-end" }]}>
            <Button
              title="Cancelar"
              secondary
              onPress={onClose}
              disabled={busy}
            />
            <Button
              title={busy ? "Guardando…" : "Guardar"}
              onPress={save}
              disabled={busy || loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
