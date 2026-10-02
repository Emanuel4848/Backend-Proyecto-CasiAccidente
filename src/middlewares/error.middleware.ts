import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  const status = err instanceof AppError ? err.statusCode : Number(err?.status) || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === "production" && status >= 500 ? "Error interno del servidor" : err.message || "Error interno del servidor",
  });
};
