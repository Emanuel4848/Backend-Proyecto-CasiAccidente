import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { brigadaController } from "./brigada.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);

router.get("/", brigadaController.getAll);
router.get("/catalogos", roleMiddleware(ROLE_IDS.ADMINISTRADOR), brigadaController.getCatalogos);
router.get("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), brigadaController.getById);
router.post("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR), brigadaController.create);
router.put("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), brigadaController.update);
router.delete("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), brigadaController.remove);

export default router;
