// Placeholder for centralized error handling.
export const errorMiddleware = () => {
  return (_err: unknown, _req: unknown, _res: unknown, next: () => void) => next();
};
