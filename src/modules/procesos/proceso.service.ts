import { AppError } from "../../utils/app-error";
import { procesoRepository } from "./proceso.repository";
import { procesoValidator } from "./proceso.validator";

export const procesoService = {
  getAll() {
    return procesoRepository.findAll();
  },
  async getById(id: number) {
    const id_proceso = procesoValidator.validateId(id);
    const proceso = await procesoRepository.findById(id_proceso);
    if (!proceso) throw new AppError("Proceso no encontrado", 404);
    return proceso;
  },
  async create(data: unknown) {
    const validatedData = procesoValidator.validateCreate(data as any);
    const existing = await procesoRepository.findByNombre(validatedData.nombre);
    if (existing) throw new AppError("Ya existe un proceso con ese nombre", 409);
    return procesoRepository.create(validatedData);
  },
  async update(id: number, data: unknown) {
    const id_proceso = procesoValidator.validateId(id);
    const validatedData = procesoValidator.validateUpdate(data as any);
    const proceso = await procesoRepository.findById(id_proceso);
    if (!proceso) throw new AppError("Proceso no encontrado", 404);
    return procesoRepository.update(id_proceso, validatedData);
  },
  async remove(id: number) {
    const id_proceso = procesoValidator.validateId(id);
    const proceso = await procesoRepository.findById(id_proceso);
    if (!proceso) throw new AppError("Proceso no encontrado", 404);
    return procesoRepository.softDelete(id_proceso);
  },
};
