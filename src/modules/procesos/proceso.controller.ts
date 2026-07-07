import { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { procesoService } from "./proceso.service";

const getIdParam = (req: Request) => Number(req.params.id);
const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const procesoController = {
  async getAll(_req: Request, res: Response) {
    const data = await procesoService.getAll();
    return res.json({ message: "Procesos obtenidos exitosamente", data });
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await procesoService.getById(getIdParam(req));
      return res.json({ message: "Proceso obtenido exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await procesoService.create(req.body);
      return res.status(201).json({ message: "Proceso creado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await procesoService.update(getIdParam(req), req.body);
      return res.json({ message: "Proceso actualizado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async remove(req: Request, res: Response) {
    try {
      const data = await procesoService.remove(getIdParam(req));
      return res.json({ message: "Proceso desactivado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
