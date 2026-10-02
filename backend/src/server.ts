import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./config/db.js";
const server = app.listen(env.PORT, "0.0.0.0", () =>
  console.log(`Fuchojuana API: http://localhost:${env.PORT}`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await db.$disconnect();
      process.exit(0);
    }),
  );
