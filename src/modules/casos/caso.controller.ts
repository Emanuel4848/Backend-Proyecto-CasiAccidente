import { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { casoService } from "./caso.service";
import { AppError } from "../../utils/app-error";

export const casoController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const caso = await casoService.create(req.body, req.user.id_usuario);
      return res.status(201).json({ message: "Caso registrado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { id_region, id_estado, id_brigada } = req.query;
      const filters = {
        id_region: id_region ? Number(id_region) : undefined,
        id_estado: id_estado ? Number(id_estado) : undefined,
        id_brigada: id_brigada ? Number(id_brigada) : undefined,
      };
      const data = await casoService.getAll(filters);
      return res.json({ message: "Casos obtenidos exitosamente", data });
    } catch {
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const caso = await casoService.getById(Number(req.params.id));
      return res.json({ message: "Caso obtenido exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const caso = await casoService.update(Number(req.params.id), req.body);
      return res.json({ message: "Caso actualizado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const motivo = req.body?.motivo ?? null;
      const caso = await casoService.anular(Number(req.params.id), req.user.id_usuario, motivo);
      return res.json({ message: "Caso anulado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  async reactivar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new AppError("No autenticado", 401);
      const caso = await casoService.reactivar(Number(req.params.id), req.user.id_usuario);
      return res.json({ message: "Caso reactivado exitosamente", data: caso });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },

};