import { Router } from "express";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Dashboard module ready" });
});

router.get("/resumen", dashboardController.getSummary);
router.get("/aceptados-rechazados", dashboardController.getAcceptedRejected);
router.get("/por-estado", dashboardController.getByStatus);
router.get("/por-brigada", dashboardController.getByBrigade);
router.get("/avance-acciones", dashboardController.getCorrectiveActionProgress);
router.get("/tiempo-por-etapa", dashboardController.getTimeByStage);

export default router;
