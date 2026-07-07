import { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { contratistaService } from "./contratista.service";

const getIdParam = (req: Request) => Number(req.params.id);
const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const contratistaController = {
  async getAll(_req: Request, res: Response) {
    const data = await contratistaService.getAll();
    return res.json({ message: "Contratistas obtenidos exitosamente", data });
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await contratistaService.getById(getIdParam(req));
      return res.json({ message: "Contratista obtenido exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await contratistaService.create(req.body);
      return res.status(201).json({ message: "Contratista creado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await contratistaService.update(getIdParam(req), req.body);
      return res.json({ message: "Contratista actualizado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
  async remove(req: Request, res: Response) {
    try {
      const data = await contratistaService.remove(getIdParam(req));
      return res.json({ message: "Contratista desactivado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
