import bcrypt from "bcryptjs";
import { AppError } from "../../utils/app-error";
import { usuarioRepository } from "./usuario.repository";
import { usuarioValidator } from "./usuario.validator";

export const usuarioService = {
  getAll() {
    return usuarioRepository.findAll();
  },

  async getById(id: number) {
    const id_usuario = usuarioValidator.validateId(id);
    const user = await usuarioRepository.findById(id_usuario);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return user;
  },

  async create(data: unknown) {
    const validatedData = usuarioValidator.validateCreate(data as any);
    const existingUser = await usuarioRepository.findByCorreo(validatedData.correo);

    if (existingUser) {
      throw new AppError("Ya existe un usuario con ese correo", 409);
    }

    const rol = await usuarioRepository.findRolById(validatedData.id_rol);

    if (!rol || rol.activo === false) {
      throw new AppError("El rol indicado no existe o esta inactivo");
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    return usuarioRepository.create({
      ...validatedData,
      password: hashedPassword,
    });
  },

  async update(id: number, data: unknown) {
    const id_usuario = usuarioValidator.validateId(id);
    const validatedData = usuarioValidator.validateUpdate(data as any);
    const user = await usuarioRepository.findById(id_usuario);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (validatedData.correo && validatedData.correo !== user.correo) {
      const existingUser = await usuarioRepository.findByCorreo(validatedData.correo);

      if (existingUser) {
        throw new AppError("Ya existe un usuario con ese correo", 409);
      }
    }

    if (validatedData.id_rol) {
      const rol = await usuarioRepository.findRolById(validatedData.id_rol);

      if (!rol || rol.activo === false) {
        throw new AppError("El rol indicado no existe o esta inactivo");
      }
    }

    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    return usuarioRepository.update(id_usuario, validatedData);
  },

  async remove(id: number) {
    const id_usuario = usuarioValidator.validateId(id);
    const user = await usuarioRepository.findById(id_usuario);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return usuarioRepository.softDelete(id_usuario);
  },

  async getRegiones(id: number) {
    const id_usuario = usuarioValidator.validateId(id);
    return usuarioRepository.findRegionesAsignadas(id_usuario);
  },

  async setRegiones(id: number, data: { id_rol: number; ids_region: number[] }) {
    const id_usuario = usuarioValidator.validateId(id);
    const user = await usuarioRepository.findById(id_usuario);
    if (!user) throw new AppError("Usuario no encontrado", 404);

    if (!Array.isArray(data.ids_region)) {
      throw new AppError("ids_region debe ser un arreglo de IDs de region");
    }
    if (!data.id_rol) {
      throw new AppError("id_rol es obligatorio para registrar el contexto de la asignacion");
    }

    return usuarioRepository.setRegiones(id_usuario, data.id_rol, data.ids_region);
  },
};
