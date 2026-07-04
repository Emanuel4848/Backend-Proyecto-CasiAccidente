import { env } from "./env";

export const jwtConfig = {
  secret: env.JWT_SECRET || "dev-secret",
};
