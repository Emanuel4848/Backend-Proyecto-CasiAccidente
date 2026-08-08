import { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { usuarioService } from "./usuario.service";

const getIdParam = (req: Request) => Number(req.params.id);

export const usuarioController = {
  async getAll(_req: Request, res: Response) {
    const data = await usuarioService.getAll();
    return res.json({ message: "Usuarios obtenidos exitosamente", data });
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await usuarioService.getById(getIdParam(req));
      return res.json({ message: "Usuario obtenido exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await usuarioService.create(req.body);
      return res.status(201).json({ message: "Usuario creado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await usuarioService.update(getIdParam(req), req.body);
      return res.json({ message: "Usuario actualizado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const data = await usuarioService.remove(getIdParam(req));
      return res.json({ message: "Usuario desactivado exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getRegiones(req: Request, res: Response) {
    try {
      const data = await usuarioService.getRegiones(getIdParam(req));
      return res.json({ message: "Regiones obtenidas exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async setRegiones(req: Request, res: Response) {
    try {
      const data = await usuarioService.setRegiones(getIdParam(req), req.body);
      return res.json({ message: "Regiones asignadas exitosamente", data });
    } catch (error) {
      return handleError(error, res);
    }
  },
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
};
