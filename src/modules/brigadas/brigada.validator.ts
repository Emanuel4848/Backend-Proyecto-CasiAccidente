import { AppError } from "../../utils/app-error";

type BrigadaInput = {
  nombre?: string;
  id_region?: number;
  id_usuario_prl?: number | null;
  id_usuario_responsable?: number | null;
  activo?: boolean;
};

const parseOptionalId = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "" || value === 0) return null;

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
      id_usuario_prl: parseOptionalId(data.id_usuario_prl, "id_usuario_prl"),
      id_usuario_responsable: parseOptionalId(data.id_usuario_responsable, "id_usuario_responsable"),
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
    if (data.id_usuario_prl !== undefined) updateData.id_usuario_prl = parseOptionalId(data.id_usuario_prl, "id_usuario_prl");
    if (data.id_usuario_responsable !== undefined) {
      updateData.id_usuario_responsable = parseOptionalId(data.id_usuario_responsable, "id_usuario_responsable");
    }
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
    if (Object.keys(updateData).length === 0) throw new AppError("No hay datos para actualizar");
    return updateData;
  },
};
