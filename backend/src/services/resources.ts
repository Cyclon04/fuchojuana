import { db } from "../config/db.js";
import { HttpError } from "../middleware/errors.js";
import { manageTeam } from "../middleware/auth.js";
import {
  playerSchema,
  clubSchema,
  teamSchema,
  tournamentSchema,
  matchSchema,
} from "./validation.js";
export type Resource =
  "players" | "clubs" | "teams" | "tournaments" | "matches";
export const resources: Resource[] = [
  "players",
  "clubs",
  "teams",
  "tournaments",
  "matches",
];
export const tijuanaDay = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
const playerInclude = { memberships: { include: { team: true } } };
const teamInclude = {
  club: true,
  coach: { select: { id: true, name: true } },
  players: { include: { player: true } },
};
const tournamentInclude = {
  teams: { include: { team: true } },
  matches: { include: { homeTeam: true, awayTeam: true } },
};
const matchInclude = { homeTeam: true, awayTeam: true, tournament: true };
export async function list(kind: Resource) {
  switch (kind) {
    case "players":
      return db.player.findMany({
        include: playerInclude,
        orderBy: { name: "asc" },
      });
    case "clubs":
      return db.club.findMany({
        include: { _count: { select: { teams: true } } },
        orderBy: { name: "asc" },
      });
    case "teams":
      return db.team.findMany({
        include: teamInclude,
        orderBy: { name: "asc" },
      });
    case "tournaments":
      return db.tournament.findMany({
        include: tournamentInclude,
        orderBy: { startDate: "desc" },
      });
    case "matches":
      return db.match.findMany({
        include: matchInclude,
        orderBy: { kickoff: "asc" },
      });
  }
}
export async function get(kind: Resource, id: string) {
  switch (kind) {
    case "players":
      return db.player.findUniqueOrThrow({
        where: { id },
        include: playerInclude,
      });
    case "clubs":
      return db.club.findUniqueOrThrow({
        where: { id },
        include: { teams: true },
      });
    case "teams":
      return db.team.findUniqueOrThrow({ where: { id }, include: teamInclude });
    case "tournaments":
      return db.tournament.findUniqueOrThrow({
        where: { id },
        include: tournamentInclude,
      });
    case "matches":
      return db.match.findUniqueOrThrow({
        where: { id },
        include: matchInclude,
      });
  }
}
export async function save(
  kind: Resource,
  body: unknown,
  user: Express.Request["user"],
  id?: string,
) {
  if (user.role !== "ADMIN" && !(kind === "teams" && user.role === "COACH"))
    throw new HttpError(403, "Esta acción requiere administrador");
  switch (kind) {
    case "players": {
      const data = playerSchema.parse(body);
      if (data.userId) {
        const u = await db.user.findUnique({ where: { id: data.userId } });
        if (u?.role !== "PLAYER")
          throw new HttpError(400, "La cuenta debe tener rol jugador");
      }
      return id
        ? db.player.update({ where: { id }, data })
        : db.player.create({ data });
    }
    case "clubs": {
      const data = clubSchema.parse(body);
      return id
        ? db.club.update({ where: { id }, data })
        : db.club.create({ data });
    }
    case "teams": {
      const data = teamSchema.parse(body);
      if (id) await manageTeam(user, id);
      if (user.role === "COACH" && data.coachId !== user.id)
        throw new HttpError(403, "Debes ser el entrenador de tu equipo");
      const coach = await db.user.findUnique({ where: { id: data.coachId } });
      if (coach?.role !== "COACH")
        throw new HttpError(400, "Selecciona una cuenta de entrenador");
      if (
        id &&
        (await db.tournamentTeam.count({
          where: {
            teamId: id,
            tournament: { category: { not: data.category } },
          },
        }))
      )
        throw new HttpError(
          409,
          "La categoría debe coincidir con los torneos inscritos",
        );
      return id
        ? db.team.update({ where: { id }, data })
        : db.team.create({ data });
    }
    case "tournaments": {
      const data = tournamentSchema.parse(body);
      if (id) {
        const matches = await db.match.findMany({
          where: { tournamentId: id },
          select: { kickoff: true },
        });
        if (
          matches.some(
            (m) =>
              tijuanaDay(m.kickoff) <
                data.startDate.toISOString().slice(0, 10) ||
              tijuanaDay(m.kickoff) > data.endDate.toISOString().slice(0, 10),
          )
        )
          throw new HttpError(409, "Hay partidos fuera de las nuevas fechas");
        if (
          await db.tournamentTeam.count({
            where: {
              tournamentId: id,
              team: { category: { not: data.category } },
            },
          })
        )
          throw new HttpError(
            409,
            "La categoría no coincide con los equipos inscritos",
          );
      }
      return id
        ? db.tournament.update({ where: { id }, data })
        : db.tournament.create({ data });
    }
    case "matches": {
      const data = matchSchema.parse(body);
      const tournament = await db.tournament.findUniqueOrThrow({
        where: { id: data.tournamentId },
      });
      if (
        tijuanaDay(data.kickoff) <
          tournament.startDate.toISOString().slice(0, 10) ||
        tijuanaDay(data.kickoff) > tournament.endDate.toISOString().slice(0, 10)
      )
        throw new HttpError(
          400,
          "El partido debe estar dentro de las fechas del torneo en Tijuana",
        );
      if (
        (await db.tournamentTeam.count({
          where: {
            tournamentId: data.tournamentId,
            teamId: { in: [data.homeTeamId, data.awayTeamId] },
          },
        })) !== 2
      )
        throw new HttpError(
          400,
          "Ambos equipos deben estar inscritos en el torneo",
        );
      return id
        ? db.match.update({ where: { id }, data })
        : db.match.create({ data });
    }
  }
}
export async function remove(
  kind: Resource,
  id: string,
  user: Express.Request["user"],
) {
  if (user.role !== "ADMIN")
    throw new HttpError(403, "Esta acción requiere administrador");
  switch (kind) {
    case "players":
      return db.player.delete({ where: { id } });
    case "clubs":
      return db.club.delete({ where: { id } });
    case "teams":
      return db.team.delete({ where: { id } });
    case "tournaments":
      return db.tournament.delete({ where: { id } });
    case "matches":
      return db.match.delete({ where: { id } });
  }
}
