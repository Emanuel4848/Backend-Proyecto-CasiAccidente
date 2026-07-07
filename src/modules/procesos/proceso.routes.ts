import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { procesoController } from "./proceso.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", procesoController.getAll);
router.get("/:id", procesoController.getById);
router.post("/", procesoController.create);
router.put("/:id", procesoController.update);
router.delete("/:id", procesoController.remove);

export default router;
