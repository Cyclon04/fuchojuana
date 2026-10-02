export type Role = "ADMIN" | "COACH" | "PLAYER";
export type User = { id: string; name: string; email: string; role: Role };
export type RecordItem = { id: string; name?: string; [key: string]: unknown };
export type Resource =
  "players" | "clubs" | "teams" | "tournaments" | "matches" | "users";
export type Option = { value: string; label: string };
export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime" | "select";
  options?: Option[];
  source?: Resource | "coaches";
  optional?: boolean;
};
export type Config = {
  title: string;
  singular: string;
  eyebrow: string;
  description: string;
  icon: string;
  fields: Field[];
};
