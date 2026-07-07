import { AppError } from "../../utils/app-error";

type ContratistaInput = {
  nombre?: string;
  correo?: string;
  telefono?: string;
  activo?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const contratistaValidator = {
  validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new AppError("El id de contratista no es valido");
    return id;
  },
  validateCreate(data: ContratistaInput) {
    if (!data.nombre?.trim()) throw new AppError("El nombre es obligatorio");
    if (data.correo && !emailRegex.test(data.correo)) throw new AppError("El correo no tiene un formato valido");
    return {
      nombre: data.nombre.trim(),
      correo: data.correo?.trim().toLowerCase() || null,
      telefono: data.telefono?.trim() || null,
      activo: data.activo ?? true,
    };
  },
  validateUpdate(data: ContratistaInput) {
    const updateData: ContratistaInput = {};
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) throw new AppError("El nombre no puede estar vacio");
      updateData.nombre = data.nombre.trim();
    }
    if (data.correo !== undefined) {
      if (data.correo && !emailRegex.test(data.correo)) throw new AppError("El correo no tiene un formato valido");
      updateData.correo = data.correo?.trim().toLowerCase();
    }
    if (data.telefono !== undefined) updateData.telefono = data.telefono?.trim();
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
    if (Object.keys(updateData).length === 0) throw new AppError("No hay datos para actualizar");
    return updateData;
  },
};
