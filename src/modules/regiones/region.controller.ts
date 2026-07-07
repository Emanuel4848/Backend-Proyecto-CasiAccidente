import { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { regionService } from "./region.service";

const getIdParam = (req: Request) => Number(req.params.id);
const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const regionController = {
  async getAll(_req: Request, res: Response) {
    const data = await regionService.getAll();
    return res.json({ message: "Regiones obtenidas exitosamente", data });
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await regionService.getById(getIdParam(req));
      return res.json({ message: "Region obtenida exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await regionService.create(req.body);
      return res.status(201).json({ message: "Region creada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await regionService.update(getIdParam(req), req.body);
      return res.json({ message: "Region actualizada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async remove(req: Request, res: Response) {
    try {
      const data = await regionService.remove(getIdParam(req));
      return res.json({ message: "Region desactivada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
