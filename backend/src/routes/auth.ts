import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { db } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { createSession, login, publicUser } from "../services/auth.js";
export const authRouter = Router();
const credentials = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(10)
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "La contraseña excede 72 bytes",
    ),
});
authRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Intenta más tarde." },
  }),
);
authRouter.post("/register", async (req, res) => {
  const data = credentials
    .extend({ name: z.string().trim().min(2).max(100) })
    .strict()
    .parse(req.body);
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: "PLAYER",
    },
  });
  res.status(201).json(await createSession(user));
});
authRouter.post("/login", async (req, res) => {
  const d = credentials.parse(req.body);
  res.json(await login(d.email, d.password));
});
authRouter.get("/me", authenticate, async (req, res) =>
  res.json(
    publicUser(await db.user.findUniqueOrThrow({ where: { id: req.user.id } })),
  ),
);
authRouter.post("/logout", authenticate, async (req, res) => {
  await db.session.delete({ where: { id: req.user.sessionId } });
  res.status(204).end();
});
