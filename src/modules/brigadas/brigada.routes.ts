import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { brigadaController } from "./brigada.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", brigadaController.getAll);
router.get("/:id", brigadaController.getById);
router.post("/", brigadaController.create);
router.put("/:id", brigadaController.update);
router.delete("/:id", brigadaController.remove);

export default router;
