import { Router } from "express";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Dashboard module ready" });
});

router.get("/filtros", dashboardController.getFilterOptions);
router.get("/resumen", dashboardController.getSummary);
router.get("/aceptados-rechazados", dashboardController.getAcceptedRejected);
router.get("/por-estado", dashboardController.getByStatus);
router.get("/por-brigada", dashboardController.getByBrigade);
router.get("/por-proceso", dashboardController.getByProcess);
router.get("/flujo-etapas", dashboardController.getStageFlow);
router.get("/avance-acciones", dashboardController.getCorrectiveActionProgress);
router.get("/tiempo-por-etapa", dashboardController.getTimeByStage);
router.get("/reportes-mensuales", dashboardController.getMonthlyByStage);

export default router;
