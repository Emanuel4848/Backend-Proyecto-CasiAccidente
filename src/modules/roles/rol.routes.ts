import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolController } from "./rol.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLE_IDS.ADMINISTRADOR));

router.get("/", rolController.getAll);

router.get("/health", (_req, res) => {
  res.json({ message: "Roles module ready" });
});

export default router;
