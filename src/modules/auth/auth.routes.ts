import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authController } from "./auth.controller";

const router = Router();

router.post("/login", authController.login);
router.get("/profile", authMiddleware, authController.profile); //ruta solo para validar

export default router;
