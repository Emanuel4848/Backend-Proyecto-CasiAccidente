import { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { brigadaService } from "./brigada.service";

const getIdParam = (req: Request) => Number(req.params.id);
const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const brigadaController = {
  async getAll(req: Request, res: Response) {
    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await brigadaService.getAll(search);
    return res.json({ message: "Brigadas obtenidas exitosamente", data });
  },
  async getCatalogos(_req: Request, res: Response) {
    const data = await brigadaService.getCatalogos();
    return res.json({ message: "Catalogos de brigadas obtenidos exitosamente", data });
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await brigadaService.getById(getIdParam(req));
      return res.json({ message: "Brigada obtenida exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await brigadaService.create(req.body);
      return res.status(201).json({ message: "Brigada creada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await brigadaService.update(getIdParam(req), req.body);
      return res.json({ message: "Brigada actualizada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async remove(req: Request, res: Response) {
    try {
      const data = await brigadaService.remove(getIdParam(req));
      return res.json({ message: "Brigada desactivada exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
