import { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { AuthError, authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        return res.status(400).json({
          message: "Correo y password son obligatorios",
        });
      }

      const data = await authService.login({ correo, password });

      return res.json({
        message: "Inicio de sesión exitoso",
        data,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  },

  profile(req: AuthRequest, res: Response) {
    return res.json({
      message: "Perfil obtenido exitosamente",
      data: {
        user: req.user,
      },
    });
  },
};
