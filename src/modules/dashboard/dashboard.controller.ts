import { Request, Response } from "express";
import { DashboardFilters, DashboardOutcomeFilter } from "./dashboard.repository";
import { dashboardService } from "./dashboard.service";

const handleError = (res: Response) => {
  return res.status(500).json({ message: "Error interno del servidor" });
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const toEndOfDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toStartOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseOutcome = (value: unknown): DashboardOutcomeFilter | undefined => {
  if (value === "en_proceso" || value === "resueltos" || value === "rechazados_anulados") {
    return value;
  }

  return undefined;
};

const getFilters = (req: Request): DashboardFilters => ({
  fechaInicio: typeof req.query.fechaInicio === "string" ? toStartOfDay(req.query.fechaInicio) : undefined,
  fechaFin: typeof req.query.fechaFin === "string" ? toEndOfDay(req.query.fechaFin) : undefined,
  id_estado: toNumber(req.query.id_estado),
  id_brigada: toNumber(req.query.id_brigada),
  id_proceso: toNumber(req.query.id_proceso),
  id_region: toNumber(req.query.id_region),
  resultado: parseOutcome(req.query.resultado),
});

export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    try {
      const data = await dashboardService.getSummary(getFilters(req));
      return res.json({ message: "Resumen del dashboard obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getAcceptedRejected(req: Request, res: Response) {
    try {
      const data = await dashboardService.getAcceptedRejected(getFilters(req));
      return res.json({ message: "Casos aceptados y rechazados obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const data = await dashboardService.getByStatus(getFilters(req));
      return res.json({ message: "Casos por estado obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getByBrigade(req: Request, res: Response) {
    try {
      const data = await dashboardService.getByBrigade(getFilters(req));
      return res.json({ message: "Casos por brigada obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getByProcess(req: Request, res: Response) {
    try {
      const data = await dashboardService.getByProcess(getFilters(req));
      return res.json({ message: "Casos por proceso obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getStageFlow(req: Request, res: Response) {
    try {
      const data = await dashboardService.getStageFlow(getFilters(req));
      return res.json({ message: "Flujo por etapas obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getCorrectiveActionProgress(req: Request, res: Response) {
    try {
      const data = await dashboardService.getCorrectiveActionProgress(getFilters(req));
      return res.json({ message: "Avance de acciones correctivas obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getTimeByStage(req: Request, res: Response) {
    try {
      const data = await dashboardService.getTimeByStage(getFilters(req));
      return res.json({ message: "Tiempo por etapa obtenido exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getMonthlyByStage(req: Request, res: Response) {
    try {
      const data = await dashboardService.getMonthlyByStage(getFilters(req));
      return res.json({ message: "Reportes por mes y etapa obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },

  async getFilterOptions(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getFilterOptions();
      return res.json({ message: "Filtros del dashboard obtenidos exitosamente", data });
    } catch {
      return handleError(res);
    }
  },
};
