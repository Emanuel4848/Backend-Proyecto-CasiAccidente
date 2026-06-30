import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../modules/auth/auth.service";

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export const authMiddleware = (
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
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "JWT_SECRET no esta configurado",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    req.user = decoded;

    return next();
  } catch {
    return res.status(401).json({
      message: "Token invalido o expirado",
    });
  }
};
