import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
  correo: string;
  rol: string;
};

export const authService = {
  async login({ correo, password }: LoginInput) {
    const user = await authRepository.findUserByCorreo(correo);

    if (!user) {
      throw new AuthError("Credenciales invalidas", 401);
    }

    if (!user.activo) {
      throw new AuthError("Usuario inactivo", 403);
    }

    const passwordValida = await bcrypt.compare(password, user.password);

    if (!passwordValida) {
      throw new AuthError("Credenciales invalidas", 401);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AuthError("JWT_SECRET no esta configurado", 500);
    }

    const payload: AuthTokenPayload = {
      id_usuario: user.id_usuario,
      correo: user.correo,
      rol: user.rol.nombre,
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "8h",
    });

    return {
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol.nombre,
      },
    };
  },
};

export { AuthError };
