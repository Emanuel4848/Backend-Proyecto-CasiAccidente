import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { regionController } from "./region.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);

router.get("/", regionController.getAll);
router.get("/:id", regionController.getById);
router.post("/", roleMiddleware(ROLE_IDS.ADMINISTRADOR), regionController.create);
router.put("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), regionController.update);
router.delete("/:id", roleMiddleware(ROLE_IDS.ADMINISTRADOR), regionController.remove);

export default router;
