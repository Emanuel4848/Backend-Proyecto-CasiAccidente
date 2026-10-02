import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { contratistaController } from "./contratista.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);

router.get("/", contratistaController.getAll);
router.get("/:id", contratistaController.getById);
router.post("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR), contratistaController.create);
router.put("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), contratistaController.update);
router.delete("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), contratistaController.remove);

export default router;
