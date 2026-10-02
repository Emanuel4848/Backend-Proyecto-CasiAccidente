import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./auth.middleware";

export const roleMiddleware = (...allowedRoles: number[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" });
    if (!allowedRoles.includes(Number(req.user.id_rol))) {
      return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    return next();
  };
};
