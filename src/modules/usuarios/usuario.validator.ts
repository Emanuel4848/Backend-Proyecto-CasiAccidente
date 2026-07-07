import { AppError } from "../../utils/app-error";

type UsuarioInput = {
  nombre?: string;
  correo?: string;
  password?: string;
  id_rol?: number;
  activo?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseId = (value: unknown, field: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${field} debe ser un numero entero positivo`);
  }

  return id;
};

export const usuarioValidator = {
  validateCreate(data: UsuarioInput) {
    if (!data.nombre?.trim()) {
      throw new AppError("El nombre es obligatorio");
    }

    if (!data.correo?.trim() || !emailRegex.test(data.correo)) {
      throw new AppError("El correo no tiene un formato valido");
    }

    if (!data.password || data.password.length < 6) {
      throw new AppError("El password debe tener al menos 6 caracteres");
    }

    return {
      nombre: data.nombre.trim(),
      correo: data.correo.trim().toLowerCase(),
      password: data.password,
      id_rol: parseId(data.id_rol, "id_rol"),
      activo: data.activo ?? true,
    };
  },

  validateUpdate(data: UsuarioInput) {
    const updateData: UsuarioInput = {};

    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) throw new AppError("El nombre no puede estar vacio");
      updateData.nombre = data.nombre.trim();
    }

    if (data.correo !== undefined) {
      if (!emailRegex.test(data.correo)) throw new AppError("El correo no tiene un formato valido");
      updateData.correo = data.correo.trim().toLowerCase();
    }

    if (data.password !== undefined) {
      if (data.password.length < 6) throw new AppError("El password debe tener al menos 6 caracteres");
      updateData.password = data.password;
    }

    if (data.id_rol !== undefined) updateData.id_rol = parseId(data.id_rol, "id_rol");
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);

    if (Object.keys(updateData).length === 0) {
      throw new AppError("No hay datos para actualizar");
    }

    return updateData;
  },

  validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("El id de usuario no es valido");
    }

    return id;
  },
};
