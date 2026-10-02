import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { procesoController } from "./proceso.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);

router.get("/", procesoController.getAll);
router.get("/:id", procesoController.getById);
router.post("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR), procesoController.create);
router.put("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), procesoController.update);
router.delete("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), procesoController.remove);

export default router;
