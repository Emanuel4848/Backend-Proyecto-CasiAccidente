import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolController } from "./rol.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", rolController.getAll);

router.get("/health", (_req, res) => {
  res.json({ message: "Roles module ready" });
});

export default router;
