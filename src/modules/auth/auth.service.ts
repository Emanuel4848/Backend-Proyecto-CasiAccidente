import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { authRepository } from "./auth.repository";

class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type LoginInput = {
  correo: string;
  password: string;
};

export type AuthTokenPayload = {
  id_usuario: number;
  id_rol: number;
  correo: string;
  rol: string;
  jti: string;
};

export const authService = {
  async login({ correo, password }: LoginInput) {
    const user = await authRepository.findUserByCorreo(correo);

    if (!user || !user.correo || !user.password) {
      throw new AuthError("Credenciales invalidas", 401);
    }

    if (!user.activo) {
      throw new AuthError("Usuario inactivo", 403);
    }

    const userRol = user.usuario_roles.find((usuarioRol) => usuarioRol.roles);

    if (!userRol?.roles?.nombre) {
      throw new AuthError("Usuario sin rol asignado", 403);
    }

    const passwordValida = await bcrypt.compare(password, user.password);

    if (!passwordValida) {
      throw new AuthError("Credenciales invalidas", 401);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AuthError("JWT_SECRET no esta configurado", 500);
    }

    const maxSessions = Math.max(1, Number(process.env.MAX_SESIONES_POR_USUARIO) || 3);
    try {
      await authRepository.removeExpiredSessions();
      const active = await authRepository.findActiveSessions(user.id_usuario);
      while (active.length >= maxSessions) {
        const oldest = active.shift();
        if (oldest) await authRepository.deleteSession(oldest.session_id);
      }
    } catch {
      throw new AuthError("No se pudo iniciar sesión por un problema de almacenamiento", 503);
    }
    const sessionId = randomUUID();

    const payload: AuthTokenPayload = {
      id_usuario: user.id_usuario,
      id_rol: userRol.roles.id_rol,
      correo: user.correo,
      rol: userRol.roles.nombre,
      jti: sessionId,
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "8h",
    });
    try {
      await authRepository.createSession(sessionId, user.id_usuario, new Date(Date.now() + 8 * 60 * 60 * 1000));
    } catch {
      throw new AuthError("No se pudo registrar la sesión. Verifica la migración de sesiones activas", 503);
    }

    return {
      token,
      user: {
        id_usuario: user.id_usuario,
        id_rol: userRol.roles.id_rol,
        nombre: user.nombre,
        correo: user.correo,
        rol: userRol.roles.nombre,
      },
    };
  },
};

export { AuthError };
