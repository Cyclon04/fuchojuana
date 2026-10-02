import dotenv from "dotenv";
import { z } from "zod";
dotenv.config({
  quiet: true,
  path: process.env.ENV_FILE || "../.env.development",
});
export const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    FRONTEND_ORIGIN: z.string().default("http://localhost:8081"),
    TRUST_PROXY: z.coerce.number().default(0),
  })
  .parse(process.env);
