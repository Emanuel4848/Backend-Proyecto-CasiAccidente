import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { usuarioController } from "./usuario.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLE_IDS.ADMINISTRADOR));

router.get("/", usuarioController.getAll);
router.get("/:id", usuarioController.getById);
router.post("/", usuarioController.create);
router.put("/:id", usuarioController.update);
router.get("/:id/regiones", usuarioController.getRegiones);
router.put("/:id/regiones", usuarioController.setRegiones);
router.delete("/:id", usuarioController.remove);

export default router;
