import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { usuarioController } from "./usuario.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", usuarioController.getAll);
router.get("/:id", usuarioController.getById);
router.post("/", usuarioController.create);
router.put("/:id", usuarioController.update);
router.get("/:id/regiones", usuarioController.getRegiones);
router.put("/:id/regiones", usuarioController.setRegiones);
router.delete("/:id", usuarioController.remove);

export default router;
