import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { historialController } from "./historial.controller";

const router = Router();

router.get(
  "/caso/numero/:numeroCaso",
  authMiddleware,
  historialController.obtenerPorNumeroCaso.bind(historialController)
);

export default router;