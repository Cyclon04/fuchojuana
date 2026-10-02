import { Platform } from "react-native";
const configured = process.env.EXPO_PUBLIC_API_URL;
export const API_URL =
  configured ||
  (Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:4000/api");
let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler?: () => void) {
  onUnauthorized = handler;
}
export async function request<T>(
  path: string,
  token: string | null = null,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized?.();
      const details = data.details?.fieldErrors;
      const first = details
        ? Object.entries(details)
            .map(([key, value]) => `${key}: ${(value as string[]).join(", ")}`)
            .join(" · ")
        : "";
      throw new Error(
        first ||
          data.details?.formErrors?.join(", ") ||
          data.error ||
          "No se pudo completar la solicitud",
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error(
        "La API tardó demasiado en responder. Revisa la conexión.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
