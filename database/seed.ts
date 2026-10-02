import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Define SEED_PASSWORD con al menos 12 caracteres");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_SEED !== "true"
  )
    throw new Error(
      "El seed de demostración en producción requiere ALLOW_PRODUCTION_SEED=true",
    );
  const hash = await bcrypt.hash(password, 12);
  const users = await Promise.all(
    [
      {
        email: "admin@fuchojuana.test",
        name: "Roberto Bernal",
        role: "ADMIN" as const,
      },
      {
        email: "entrenador@fuchojuana.test",
        name: "Diego Martínez",
        role: "COACH" as const,
      },
      {
        email: "jugador@fuchojuana.test",
        name: "Alex Rivera",
        role: "PLAYER" as const,
      },
    ].map((u) =>
      db.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: hash },
      }),
    ),
  );
  const coach = users[1];
  const names = ["Club Frontera", "Deportivo Playas", "Club Zona Río"];
  const clubs = await Promise.all(
    names.map((name, i) =>
      db.club.upsert({
        where: { name },
        update: {},
        create: {
          name,
          neighborhood: ["Zona Centro", "Playas de Tijuana", "Zona Río"][i],
          description:
            "Club de fútbol comunitario en Tijuana. Datos de demostración.",
        },
      }),
    ),
  );
  const teams = await Promise.all(
    ["Frontera FC", "Playas United", "Río Tijuana"].map((name, i) =>
      db.team.upsert({
        where: { name },
        update: {},
        create: {
          name,
          category: "Libre",
          clubId: clubs[i].id,
          coachId: coach.id,
        },
      }),
    ),
  );
  const playerNames = [
    "Alex Rivera",
    "Mateo López",
    "Santiago Ruiz",
    "Emiliano Torres",
    "Diego Castro",
    "Daniel Pérez",
    "Ángel Navarro",
    "Leo Mendoza",
    "Iván Flores",
    "Andrés Soto",
    "Luis Vega",
    "Pablo Ramos",
  ];
  for (const [i, name] of playerNames.entries()) {
    const id = `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const player = await db.player.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name,
        birthDate: new Date(`200${i % 7}-05-14`),
        position: ["Portero", "Defensa", "Medio", "Delantero"][i % 4],
        jerseyNumber: i + 1,
        userId: i === 0 ? users[2].id : undefined,
      },
    });
    await db.teamPlayer.upsert({
      where: {
        teamId_playerId: { teamId: teams[i % 3].id, playerId: player.id },
      },
      update: {},
      create: { teamId: teams[i % 3].id, playerId: player.id },
    });
  }
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0),
  );
  const tournament = await db.tournament.upsert({
    where: { id: "20000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "20000000-0000-4000-8000-000000000001",
      name: "Copa Frontera",
      category: "Libre",
      location: "Unidad Deportiva CREA",
      startDate: start,
      endDate: end,
    },
  });
  for (const team of teams)
    await db.tournamentTeam.upsert({
      where: {
        tournamentId_teamId: { tournamentId: tournament.id, teamId: team.id },
      },
      update: {},
      create: { tournamentId: tournament.id, teamId: team.id },
    });
  for (let i = 0; i < 3; i++)
    await db.match.upsert({
      where: {
        id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      },
      update: {},
      create: {
        id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        tournamentId: tournament.id,
        homeTeamId: teams[i].id,
        awayTeamId: teams[(i + 1) % 3].id,
        kickoff: new Date(now.getTime() + (i + 2) * 86400000),
        location: ["Cancha CREA 1", "Campo Playas", "Cancha Zona Río"][i],
      },
    });
  console.log(
    "Seed listo: 3 usuarios, 12 jugadores, 3 clubes, 3 equipos, 1 torneo y 3 partidos. Contraseña: la definida en SEED_PASSWORD.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
