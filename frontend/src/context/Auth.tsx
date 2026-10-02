import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { request, setUnauthorizedHandler } from "../api";
import type { User } from "../types";
const storage = {
  get: async () =>
    Platform.OS === "web"
      ? sessionStorage.getItem("fucho-session")
      : SecureStore.getItemAsync("fucho-session"),
  set: async (t: string) => {
    if (Platform.OS === "web") sessionStorage.setItem("fucho-session", t);
    else await SecureStore.setItemAsync("fucho-session", t);
  },
  clear: async () => {
    if (Platform.OS === "web") sessionStorage.removeItem("fucho-session");
    else await SecureStore.deleteItemAsync("fucho-session");
  },
};
type AuthValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<AuthValue>(null!);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [token, setToken] = useState<string | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void storage.clear();
      setUser(null);
      setToken(null);
    });
    return () => setUnauthorizedHandler(undefined);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.get();
        if (stored) {
          setUser(await request<User>("/auth/me", stored));
          setToken(stored);
        }
      } catch {
        await storage.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  async function signIn(email: string, password: string, name?: string) {
    const data = await request<{ token: string; user: User }>(
      name ? "/auth/register" : "/auth/login",
      null,
      "POST",
      { email, password, ...(name ? { name } : {}) },
    );
    await storage.set(data.token);
    setToken(data.token);
    setUser(data.user);
  }
  async function signOut() {
    if (token) await request("/auth/logout", token, "POST");
    await storage.clear();
    setToken(null);
    setUser(null);
  }
  return (
    <Context.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </Context.Provider>
  );
}
