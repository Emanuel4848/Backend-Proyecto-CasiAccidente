import { Request, Response } from "express";
import { rolService } from "./rol.service";

export const rolController = {
  async getAll(_req: Request, res: Response) {
    try {
      const data = await rolService.getAll();
      return res.json({ message: "Roles obtenidos exitosamente", data });
    } catch {
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
