import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Dashboard module ready" });
});

export default router;
