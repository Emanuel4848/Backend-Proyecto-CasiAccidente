import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Procesos module ready" });
});

export default router;
