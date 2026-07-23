import { Router } from "express";
import { accionCorrectivaController } from "./accion-correctiva.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Acciones correctivas module ready" });
});

router.get("/", accionCorrectivaController.getAll);
router.post("/", accionCorrectivaController.create);

export default router;