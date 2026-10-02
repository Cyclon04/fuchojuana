import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";
declare global {
  namespace Express {
    interface Request {
      user: { id: string; role: Role; sessionId: string };
    }
  }
}
export const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const raw = req.headers.authorization?.replace(/^Bearer /, "");
    if (!raw) throw new Error();
    const claims = jwt.verify(raw, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "fuchojuana",
      audience: "fuchojuana-app",
    }) as jwt.JwtPayload;
    const session = await db.session.findUnique({
      where: { id: claims.jti },
      include: { user: true },
    });
    if (
      !session ||
      session.expiresAt < new Date() ||
      session.userId !== claims.sub
    )
      throw new Error();
    req.user = {
      id: session.userId,
      role: session.user.role,
      sessionId: session.id,
    };
    next();
  } catch {
    next(new HttpError(401, "Inicia sesión para continuar"));
  }
};
export const roles =
  (...allowed: Role[]): RequestHandler =>
  (req, res, next) =>
    allowed.includes(req.user.role)
      ? next()
      : next(new HttpError(403, "No tienes permiso para esta acción"));
export async function manageTeam(user: Express.Request["user"], id: string) {
  const team = await db.team.findUnique({ where: { id } });
  if (!team) throw new HttpError(404, "Equipo no encontrado");
  if (
    user.role !== "ADMIN" &&
    (user.role !== "COACH" || team.coachId !== user.id)
  )
    throw new HttpError(403, "Solo puedes administrar tus equipos");
  return team;
}
