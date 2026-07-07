import { AppError } from "../../utils/app-error";

type CatalogInput = {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
};

export const regionValidator = {
  validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new AppError("El id de region no es valido");
    return id;
  },

  validateCreate(data: CatalogInput) {
    if (!data.nombre?.trim()) throw new AppError("El nombre es obligatorio");
    return {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      activo: data.activo ?? true,
    };
  },

  validateUpdate(data: CatalogInput) {
    const updateData: CatalogInput = {};
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) throw new AppError("El nombre no puede estar vacio");
      updateData.nombre = data.nombre.trim();
    }
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion?.trim();
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
    if (Object.keys(updateData).length === 0) throw new AppError("No hay datos para actualizar");
    return updateData;
  },
};
