import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { casoController } from "./caso.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", casoController.create);
router.get("/", casoController.getAll);
router.get("/:id", casoController.getById);
router.put("/:id", casoController.update);
router.delete("/:id", casoController.remove);
router.patch("/:id/reactivar", casoController.reactivar);
router.patch("/:id/rechazar", casoController.rechazar);
router.patch("/:id/cerrar", casoController.cerrar);
router.post('/:id/evaluar', authMiddleware, casoController.evaluar);

export default router;