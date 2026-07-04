import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Casos module ready" });
});

export default router;
