import { z } from "zod";
export const id = z.string().uuid();
const text = z.string().trim().min(2).max(160);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Fecha inválida",
  )
  .transform((v) => new Date(v));
export const playerSchema = z
  .object({
    name: text,
    birthDate: date.refine(
      (v) => v <= new Date(),
      "La fecha debe estar en el pasado",
    ),
    position: z.enum(["Portero", "Defensa", "Medio", "Delantero"]),
    jerseyNumber: z.number().int().min(0).max(99).nullable().optional(),
    userId: id.nullable().optional(),
  })
  .strict();
export const clubSchema = z
  .object({
    name: text,
    neighborhood: text,
    description: z.string().max(1000).default(""),
  })
  .strict();
export const teamSchema = z
  .object({ name: text, category: text, clubId: id, coachId: id })
  .strict();
export const tournamentSchema = z
  .object({
    name: text,
    location: text,
    category: text,
    startDate: date,
    endDate: date,
  })
  .strict()
  .refine(
    (d) => d.endDate >= d.startDate,
    "La fecha final debe ser posterior a la inicial",
  );
export const matchSchema = z
  .object({
    tournamentId: id,
    homeTeamId: id,
    awayTeamId: id,
    kickoff: z
      .string()
      .datetime({ offset: true })
      .transform((v) => new Date(v)),
    location: text,
    homeScore: z.number().int().min(0).max(99).nullable().default(null),
    awayScore: z.number().int().min(0).max(99).nullable().default(null),
  })
  .strict()
  .refine(
    (d) => d.homeTeamId !== d.awayTeamId,
    "Selecciona dos equipos distintos",
  )
  .refine(
    (d) => (d.homeScore === null) === (d.awayScore === null),
    "Captura ambos marcadores",
  );
