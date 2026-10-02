import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../modules/auth/auth.service";
import { env } from "../config/env";
import { authRepository } from "../modules/auth/auth.repository";

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token no proporcionado",
    });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "JWT_SECRET no esta configurado",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    if (!decoded.jti) return res.status(401).json({ message: "La sesión del token no es válida" });
    let session;
    try {
      session = await authRepository.isSessionActive(decoded.jti);
    } catch (error) {
      return next(error);
    }
    if (!session) return res.status(401).json({ message: "La sesión expiró o fue cerrada" });
    req.user = decoded;

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token invalido o expirado" });
    }
    return next(error);
  }
};
