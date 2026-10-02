import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { historialController } from "./historial.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.get(
  "/caso/numero/:numeroCaso",
  authMiddleware,
  roleMiddleware(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GESTOR_SYMA, ROLE_IDS.GESTION_CONTROL_SYMA),
  historialController.obtenerPorNumeroCaso.bind(historialController)
);

export default router;
