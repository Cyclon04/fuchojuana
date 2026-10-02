import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errors.js";
import type { User } from "@prisma/client";
export const publicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await db.session.create({
    data: { userId: user.id, expiresAt },
  });
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    jwtid: session.id,
    expiresIn: "8h",
    issuer: "fuchojuana",
    audience: "fuchojuana-app",
    algorithm: "HS256",
  });
  return { token, expiresAt, user: publicUser(user) };
}
export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new HttpError(401, "Correo o contraseña incorrectos");
  return createSession(user);
}
