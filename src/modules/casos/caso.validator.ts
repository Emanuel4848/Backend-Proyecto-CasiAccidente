import { AppError } from "../../utils/app-error";

type CasoInput = {
  titulo?: string;
  descripcion?: string;
  id_region?: number;
  id_proceso?: number;
  id_brigada?: number;
  id_contratista?: number;
};

const parseRequiredId = (value: unknown, field: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${field} es obligatorio y debe ser un numero entero positivo`);
  }
  return id;
};

const parseOptionalId = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${field} debe ser un numero entero positivo`);
  }
  return id;
};

export const casoValidator = {
  validateId(id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new AppError("El id de caso no es valido");
    return id;
  },
  validateCreate(data: CasoInput) {
    if (!data.titulo?.trim()) throw new AppError("El titulo es obligatorio");
    if (!data.descripcion?.trim()) throw new AppError("La descripcion es obligatoria");

    return {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
      id_brigada: parseRequiredId(data.id_brigada, "id_brigada"),
      id_region: parseOptionalId(data.id_region, "id_region"),
      id_proceso: parseOptionalId(data.id_proceso, "id_proceso"),
      id_contratista: parseOptionalId(data.id_contratista, "id_contratista"),
    };
  },

  validateUpdate(data: CasoInput) {
    const parsed: Record<string, unknown> = {};

    if (data.titulo !== undefined) {
      if (!data.titulo.trim()) throw new AppError("El titulo no puede quedar vacio");
      parsed.titulo = data.titulo.trim();
    }
    if (data.descripcion !== undefined) {
      if (!data.descripcion.trim()) throw new AppError("La descripcion no puede quedar vacia");
      parsed.descripcion = data.descripcion.trim();
    }
    if (data.id_brigada !== undefined) parsed.id_brigada = parseRequiredId(data.id_brigada, "id_brigada");
    if (data.id_region !== undefined) parsed.id_region = parseRequiredId(data.id_region, "id_region");
    if (data.id_proceso !== undefined) parsed.id_proceso = parseRequiredId(data.id_proceso, "id_proceso");
    if (data.id_contratista !== undefined) parsed.id_contratista = parseOptionalId(data.id_contratista, "id_contratista");

    if (Object.keys(parsed).length === 0) {
      throw new AppError("Debe enviar al menos un campo para actualizar");
    }
    return parsed;
  },

};