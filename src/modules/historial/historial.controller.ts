import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { historialService } from "./historial.service";

const ROL_ADMINISTRADOR = 1;
const ROL_GESTION_CONTROL_SYMA = 6;
const ROLES_PERMITIDOS = [ROL_ADMINISTRADOR, ROL_GESTION_CONTROL_SYMA];

export const historialController = {
  async obtenerPorNumeroCaso(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // TODO: reemplazar esta validacion cuando roleMiddleware tenga validacion real.
      if (!ROLES_PERMITIDOS.includes(req.user.id_rol)) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para consultar la bitacora e historial",
        });
      }

      const numeroCaso = req.params.numeroCaso as string;
      const resultado = await historialService.obtenerPorNumeroCaso(numeroCaso);

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "No se encontro un caso con ese numero",
        });
      }

      return res.json({
        success: true,
        data: resultado.historial,
        caso: resultado.caso,
      });
    } catch (error) {
      next(error);
    }
  },
};