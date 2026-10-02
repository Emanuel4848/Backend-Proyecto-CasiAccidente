import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authController } from "./auth.controller";
import { rateLimit } from "express-rate-limit";

const router = Router();

router.post("/login", rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false }), authController.login);
router.get("/profile", authMiddleware, authController.profile); //ruta solo para validar

export default router;
