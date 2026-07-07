import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { regionController } from "./region.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", regionController.getAll);
router.get("/:id", regionController.getById);
router.post("/", regionController.create);
router.put("/:id", regionController.update);
router.delete("/:id", regionController.remove);

export default router;
