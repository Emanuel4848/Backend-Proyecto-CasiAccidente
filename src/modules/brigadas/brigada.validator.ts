import { AppError } from "../../utils/app-error";

type BrigadaInput = {
  nombre?: string;
  id_region?: number;
  id_proceso?: number;
  id_contratista?: number;
  activo?: boolean;
};

const parseOptionalId = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return null;

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(`${field} debe ser un numero entero positivo`);
  return id;
};

export const brigadaValidator = {
  validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new AppError("El id de brigada no es valido");
    return id;
  },
  validateCreate(data: BrigadaInput) {
    if (!data.nombre?.trim()) throw new AppError("El nombre es obligatorio");
    return {
      nombre: data.nombre.trim(),
      id_region: parseOptionalId(data.id_region, "id_region"),
      id_proceso: parseOptionalId(data.id_proceso, "id_proceso"),
      id_contratista: parseOptionalId(data.id_contratista, "id_contratista"),
      activo: data.activo ?? true,
    };
  },
  validateUpdate(data: BrigadaInput) {
    const updateData: BrigadaInput = {};
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) throw new AppError("El nombre no puede estar vacio");
      updateData.nombre = data.nombre.trim();
    }
    if (data.id_region !== undefined) updateData.id_region = parseOptionalId(data.id_region, "id_region") ?? undefined;
    if (data.id_proceso !== undefined) updateData.id_proceso = parseOptionalId(data.id_proceso, "id_proceso") ?? undefined;
    if (data.id_contratista !== undefined) {
      updateData.id_contratista = parseOptionalId(data.id_contratista, "id_contratista") ?? undefined;
    }
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
    if (Object.keys(updateData).length === 0) throw new AppError("No hay datos para actualizar");
    return updateData;
  },
};
