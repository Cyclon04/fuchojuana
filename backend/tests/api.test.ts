import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/config/db.js";
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL!).pathname.endsWith("_test")
)
  throw new Error("Las pruebas solo pueden usar una base que termine en _test");
const password = "Test-" + randomUUID();
let admin: string,
  coach: string,
  otherCoach: string,
  player: string,
  coachId: string,
  otherCoachId: string;
let clubId: string,
  team1: string,
  team2: string,
  tournamentId: string,
  playerId: string,
  matchId: string;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
before(async () => {
  await db.match.deleteMany();
  await db.tournamentTeam.deleteMany();
  await db.teamPlayer.deleteMany();
  await db.tournament.deleteMany();
  await db.team.deleteMany();
  await db.club.deleteMany();
  await db.player.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  for (const [name, role] of [
    ["admin", "ADMIN"],
    ["coach", "COACH"],
    ["other", "COACH"],
    ["player", "PLAYER"],
  ] as const) {
    const user = await db.user.create({
      data: {
        name,
        email: name + "@test.local",
        role,
        passwordHash: await bcrypt.hash(password, 4),
      },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password })
      .expect(200);
    if (name === "admin") admin = res.body.token;
    if (name === "coach") {
      coach = res.body.token;
      coachId = user.id;
    }
    if (name === "other") {
      otherCoach = res.body.token;
      otherCoachId = user.id;
    }
    if (name === "player") player = res.body.token;
  }
});
after(() => db.$disconnect());
test("PostgreSQL conectado y rutas privadas protegidas", async () => {
  const h = await request(app).get("/api/health").expect(200);
  assert.equal(h.body.database, "postgresql");
  await request(app).get("/api/players").expect(401);
});
test("Registro seguro, sin escalamiento de rol ni hashes expuestos", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Prueba", email: "bad@test.local", password, role: "ADMIN" })
    .expect(400);
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Prueba", email: "new@test.local", password })
    .expect(201);
  assert.equal(res.body.user.role, "PLAYER");
  assert.equal(res.body.user.passwordHash, undefined);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Prueba", email: "new@test.local", password })
    .expect(409);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "new@test.local", password: "incorrect-password" })
    .expect(401);
});
test("Roles y validación en clubes", async () => {
  await request(app)
    .post("/api/clubs")
    .set(auth(player))
    .send({ name: "Club", neighborhood: "Centro" })
    .expect(403);
  await request(app)
    .post("/api/clubs")
    .set(auth(admin))
    .send({ name: "" })
    .expect(400);
  const c = await request(app)
    .post("/api/clubs")
    .set(auth(admin))
    .send({ name: "Club de prueba", neighborhood: "Centro" })
    .expect(201);
  clubId = c.body.id;
  await request(app)
    .put("/api/clubs/" + clubId)
    .set(auth(admin))
    .send({
      name: "Club actualizado",
      neighborhood: "Playas",
      description: "Prueba de edición",
    })
    .expect(200);
});
test("Equipos y autorización por propiedad", async () => {
  const a = await request(app)
    .post("/api/teams")
    .set(auth(coach))
    .send({ name: "Local", category: "Libre", clubId, coachId })
    .expect(201);
  team1 = a.body.id;
  const b = await request(app)
    .post("/api/teams")
    .set(auth(admin))
    .send({
      name: "Visitante",
      category: "Libre",
      clubId,
      coachId: otherCoachId,
    })
    .expect(201);
  team2 = b.body.id;
  await request(app)
    .put("/api/teams/" + team2)
    .set(auth(coach))
    .send({ name: "Intrusión", category: "Libre", clubId, coachId })
    .expect(403);
  await request(app)
    .delete("/api/clubs/" + clubId)
    .set(auth(admin))
    .expect(409);
});
test("CRUD jugadores y plantillas", async () => {
  const payload = {
    name: "Jugador de prueba",
    birthDate: "2001-03-15",
    position: "Medio",
    jerseyNumber: 8,
  };
  const p = await request(app)
    .post("/api/players")
    .set(auth(admin))
    .send(payload)
    .expect(201);
  playerId = p.body.id;
  await request(app)
    .put("/api/players/" + playerId)
    .set(auth(admin))
    .send({ ...payload, name: "Jugador actualizado" })
    .expect(200);
  await request(app)
    .post("/api/teams/" + team1 + "/players")
    .set(auth(otherCoach))
    .send({ playerId })
    .expect(403);
  await request(app)
    .post("/api/teams/" + team1 + "/players")
    .set(auth(coach))
    .send({ playerId })
    .expect(201);
  await request(app)
    .post("/api/teams/" + team1 + "/players")
    .set(auth(coach))
    .send({ playerId })
    .expect(409);
  const detail = await request(app)
    .get("/api/players/" + playerId)
    .set(auth(player))
    .expect(200);
  assert.equal(detail.body.memberships[0].team.id, team1);
  await request(app)
    .delete("/api/teams/" + team1 + "/players/" + playerId)
    .set(auth(coach))
    .expect(204);
});
test("Torneos, fechas, categorías e inscripciones", async () => {
  const payload = {
    name: "Copa de pruebas",
    location: "CREA",
    category: "Libre",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  };
  await request(app)
    .post("/api/tournaments")
    .set(auth(admin))
    .send({ ...payload, endDate: "2026-09-01" })
    .expect(400);
  const t = await request(app)
    .post("/api/tournaments")
    .set(auth(admin))
    .send(payload)
    .expect(201);
  tournamentId = t.body.id;
  await request(app)
    .post(`/api/tournaments/${tournamentId}/teams`)
    .set(auth(coach))
    .send({ teamId: team2 })
    .expect(403);
  await request(app)
    .post(`/api/tournaments/${tournamentId}/teams`)
    .set(auth(coach))
    .send({ teamId: team1 })
    .expect(201);
  await request(app)
    .post(`/api/tournaments/${tournamentId}/teams`)
    .set(auth(admin))
    .send({ teamId: team2 })
    .expect(201);
  await request(app)
    .put("/api/teams/" + team1)
    .set(auth(coach))
    .send({ name: "Local", category: "Sub-17", clubId, coachId })
    .expect(409);
});
test("Partidos, resultados y restricciones referenciales", async () => {
  const payload = {
    tournamentId,
    homeTeamId: team1,
    awayTeamId: team2,
    kickoff: "2026-10-15T19:00:00-07:00",
    location: "CREA",
  };
  await request(app)
    .post("/api/matches")
    .set(auth(admin))
    .send({ ...payload, awayTeamId: team1 })
    .expect(400);
  await request(app)
    .post("/api/matches")
    .set(auth(admin))
    .send({ ...payload, kickoff: "2026-12-15T19:00:00-08:00" })
    .expect(400);
  const m = await request(app)
    .post("/api/matches")
    .set(auth(admin))
    .send(payload)
    .expect(201);
  matchId = m.body.id;
  await request(app)
    .put("/api/matches/" + matchId)
    .set(auth(admin))
    .send({ ...payload, kickoff: "2026-10-31T23:30:00-07:00" })
    .expect(200);
  await request(app)
    .put("/api/matches/" + matchId)
    .set(auth(admin))
    .send({ ...payload, homeScore: 2 })
    .expect(400);
  await request(app)
    .put("/api/matches/" + matchId)
    .set(auth(admin))
    .send({ ...payload, homeScore: 2, awayScore: 1 })
    .expect(200);
  await request(app)
    .delete(`/api/tournaments/${tournamentId}/teams/${team1}`)
    .set(auth(admin))
    .expect(409);
  const matches = await request(app)
    .get(`/api/tournaments/${tournamentId}/matches`)
    .set(auth(player))
    .expect(200);
  assert.equal(matches.body[0].homeScore, 2);
});
test("Usuarios y cierre de sesión revocable", async () => {
  await request(app).get("/api/users").set(auth(player)).expect(403);
  const users = await request(app)
    .get("/api/users")
    .set(auth(admin))
    .expect(200);
  assert.ok(
    users.body.every((u: Record<string, unknown>) => !("passwordHash" in u)),
  );
  await request(app).post("/api/auth/logout").set(auth(player)).expect(204);
  await request(app).get("/api/players").set(auth(player)).expect(401);
});
test("Eliminar recursos y consultar inexistentes", async () => {
  await request(app)
    .delete("/api/matches/" + matchId)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .delete("/api/tournaments/" + tournamentId)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .delete("/api/teams/" + team1)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .delete("/api/teams/" + team2)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .delete("/api/players/" + playerId)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .delete("/api/clubs/" + clubId)
    .set(auth(admin))
    .expect(204);
  await request(app)
    .get("/api/players/" + playerId)
    .set(auth(admin))
    .expect(404);
  await request(app)
    .get("/api/players/not-a-uuid")
    .set(auth(admin))
    .expect(400);
});
