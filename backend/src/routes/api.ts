import { Router } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { authenticate, manageTeam, roles } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { id } from "../services/validation.js";
import { resources, list, get, save, remove } from "../services/resources.js";
export const apiRouter = Router();
apiRouter.use(authenticate);
apiRouter.get("/dashboard", async (req, res) => {
  const [players, clubs, teams, tournaments, matches] = await Promise.all([
    db.player.count(),
    db.club.count(),
    db.team.count(),
    db.tournament.count(),
    db.match.findMany({
      where: { kickoff: { gte: new Date() } },
      include: { homeTeam: true, awayTeam: true, tournament: true },
      orderBy: { kickoff: "asc" },
      take: 5,
    }),
  ]);
  res.json({ players, clubs, teams, tournaments, matches });
});
apiRouter.get("/coaches", async (req, res) =>
  res.json(
    await db.user.findMany({
      where: { role: "COACH" },
      select: { id: true, name: true },
    }),
  ),
);
apiRouter.get("/users", roles("ADMIN"), async (req, res) =>
  res.json(
    await db.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ),
);
apiRouter.patch("/users/:id/role", roles("ADMIN"), async (req, res) => {
  const userId = id.parse(req.params.id);
  const { role } = z
    .object({ role: z.enum(["ADMIN", "COACH", "PLAYER"]) })
    .strict()
    .parse(req.body);
  if (userId === req.user.id)
    throw new HttpError(400, "No puedes cambiar tu propio rol");
  if (role !== "COACH" && (await db.team.count({ where: { coachId: userId } })))
    throw new HttpError(409, "Reasigna los equipos antes de cambiar el rol");
  if (role !== "PLAYER" && (await db.player.count({ where: { userId } })))
    throw new HttpError(
      409,
      "Desvincula el perfil de jugador antes de cambiar el rol",
    );
  res.json(
    await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, role: true },
    }),
  );
});
apiRouter.post(
  "/teams/:id/players",
  roles("ADMIN", "COACH"),
  async (req, res) => {
    const teamId = id.parse(req.params.id);
    await manageTeam(req.user, teamId);
    const { playerId } = z.object({ playerId: id }).strict().parse(req.body);
    res
      .status(201)
      .json(await db.teamPlayer.create({ data: { teamId, playerId } }));
  },
);
apiRouter.delete(
  "/teams/:id/players/:playerId",
  roles("ADMIN", "COACH"),
  async (req, res) => {
    const teamId = id.parse(req.params.id),
      playerId = id.parse(req.params.playerId);
    await manageTeam(req.user, teamId);
    await db.teamPlayer.delete({
      where: { teamId_playerId: { teamId, playerId } },
    });
    res.status(204).end();
  },
);
apiRouter.post(
  "/tournaments/:id/teams",
  roles("ADMIN", "COACH"),
  async (req, res) => {
    const tournamentId = id.parse(req.params.id),
      { teamId } = z.object({ teamId: id }).strict().parse(req.body);
    const team = await manageTeam(req.user, teamId);
    const tournament = await db.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
    });
    if (team.category !== tournament.category)
      throw new HttpError(400, "El equipo debe tener la categoría del torneo");
    res
      .status(201)
      .json(await db.tournamentTeam.create({ data: { tournamentId, teamId } }));
  },
);
apiRouter.delete(
  "/tournaments/:id/teams/:teamId",
  roles("ADMIN", "COACH"),
  async (req, res) => {
    const tournamentId = id.parse(req.params.id),
      teamId = id.parse(req.params.teamId);
    await manageTeam(req.user, teamId);
    await db.tournamentTeam.delete({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });
    res.status(204).end();
  },
);
apiRouter.get("/tournaments/:id/matches", async (req, res) =>
  res.json(
    await db.match.findMany({
      where: { tournamentId: id.parse(req.params.id) },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
    }),
  ),
);
for (const kind of resources) {
  apiRouter.get("/" + kind, async (req, res) => res.json(await list(kind)));
  apiRouter.get("/" + kind + "/:id", async (req, res) =>
    res.json(await get(kind, id.parse(req.params.id))),
  );
  apiRouter.post("/" + kind, async (req, res) =>
    res.status(201).json(await save(kind, req.body, req.user)),
  );
  apiRouter.put("/" + kind + "/:id", async (req, res) =>
    res.json(await save(kind, req.body, req.user, id.parse(req.params.id))),
  );
  apiRouter.delete("/" + kind + "/:id", async (req, res) => {
    await remove(kind, id.parse(req.params.id), req.user);
    res.status(204).end();
  });
}
