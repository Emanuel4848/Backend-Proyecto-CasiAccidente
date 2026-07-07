import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { contratistaController } from "./contratista.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", contratistaController.getAll);
router.get("/:id", contratistaController.getById);
router.post("/", contratistaController.create);
router.put("/:id", contratistaController.update);
router.delete("/:id", contratistaController.remove);

export default router;
