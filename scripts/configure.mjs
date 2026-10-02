import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
const production = process.argv[2] === "production";
const target = production ? ".env.production" : ".env.development";
if (existsSync(target))
  throw new Error(`${target} ya existe. No se sobrescribirá.`);
const password = randomBytes(24).toString("hex"),
  jwt = randomBytes(32).toString("hex"),
  seed = randomBytes(18).toString("base64url");
const domain = process.argv[3];
if (production && (!domain || !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain)))
  throw new Error(
    "Uso: node scripts/configure.mjs production tu-dominio.example.com",
  );
writeFileSync(
  target,
  `NODE_ENV=${production ? "production" : "development"}
PORT=4000
POSTGRES_USER=${production ? "fucho_prod" : "fucho_dev"}
POSTGRES_DB=${production ? "fuchojuana_prod" : "fuchojuana_dev"}
POSTGRES_PASSWORD=${password}
DATABASE_URL=postgresql://${production ? "fucho_prod" : "fucho_dev"}:${password}@${production ? "db:5432" : "127.0.0.1:55432"}/${production ? "fuchojuana_prod" : "fuchojuana_dev"}
JWT_SECRET=${jwt}
FRONTEND_ORIGIN=${production ? "https://" + domain : "http://localhost:8081,http://127.0.0.1:8081"}
EXPO_PUBLIC_API_URL=${production ? "/api" : "http://localhost:4000/api"}
SEED_PASSWORD=${seed}
TRUST_PROXY=${production ? "2" : "0"}
${production ? "SITE_ADDRESS=" + domain + "\nALLOW_PRODUCTION_SEED=false" : ""}
`,
  { mode: 0o600 },
);
console.log(
  `Creado ${target} con secretos aleatorios. La contraseña de demostración está en SEED_PASSWORD; no compartas el archivo.`,
);
