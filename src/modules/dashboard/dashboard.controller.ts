import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

const handleError = (res: Response) => {
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const dashboardController = {
  async getSummary(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getSummary();
      return res.json({ message: "Resumen del dashboard obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getAcceptedRejected(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getAcceptedRejected();
      return res.json({ message: "Casos aceptados y rechazados obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getByStatus(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getByStatus();
      return res.json({ message: "Casos por estado obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getByBrigade(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getByBrigade();
      return res.json({ message: "Casos por brigada obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getCorrectiveActionProgress(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getCorrectiveActionProgress();
      return res.json({ message: "Avance de acciones correctivas obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getTimeByStage(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getTimeByStage();
      return res.json({ message: "Tiempo por etapa obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },
};
