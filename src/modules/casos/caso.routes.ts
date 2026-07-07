import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { casoController } from "./caso.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", casoController.create);
router.get("/", casoController.getAll);
router.get("/:id", casoController.getById);

export default router;