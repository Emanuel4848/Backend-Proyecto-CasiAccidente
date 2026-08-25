import dotenv from "dotenv";

dotenv.config();

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`);
  }

  return value;
}

export const env = {
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  PORT: process.env.PORT ?? "3000",
  SUPABASE_URL: requiredEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
};
