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
};