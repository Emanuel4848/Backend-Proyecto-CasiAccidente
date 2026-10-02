import { Router } from "express";
import { accionCorrectivaController } from "./accion-correctiva.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Acciones correctivas module ready" });
});

router.use(authMiddleware);
router.get("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.PRL_CONTRATISTA, ROLE_IDS.RESPONSABLE_PROCESO, ROLE_IDS.GESTOR_SYMA, ROLE_IDS.GESTION_CONTROL_SYMA), accionCorrectivaController.getAll);
router.post("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.PRL_CONTRATISTA), accionCorrectivaController.create);

export default router;
