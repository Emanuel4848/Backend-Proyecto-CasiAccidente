import { Request, Response, NextFunction } from "express";
import { accionCorrectivaService } from "./accion-correctiva.service";

export const accionCorrectivaController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const acciones = await accionCorrectivaService.getAll();
      return res.status(200).json({
        success: true,
        data: acciones,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        ...req.body,
        id_usuario_creador: (req as any).user?.id_usuario || req.body.id_usuario_creador
      };

      const nuevaAccion = await accionCorrectivaService.create(payload);
      
      return res.status(201).json({
        success: true,
        message: "Acción correctiva creada y asignada correctamente",
        data: nuevaAccion,
      });
    } catch (error) {
      next(error);
    }
  },

};