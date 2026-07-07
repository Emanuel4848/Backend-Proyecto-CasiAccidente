import { AppError } from "../../utils/app-error";
import { regionRepository } from "./region.repository";
import { regionValidator } from "./region.validator";

export const regionService = {
  getAll() {
    return regionRepository.findAll();
  },
  async getById(id: number) {
    const id_region = regionValidator.validateId(id);
    const region = await regionRepository.findById(id_region);
    if (!region) throw new AppError("Region no encontrada", 404);
    return region;
  },
  async create(data: unknown) {
    const validatedData = regionValidator.validateCreate(data as any);
    const existing = await regionRepository.findByNombre(validatedData.nombre);
    if (existing) throw new AppError("Ya existe una region con ese nombre", 409);
    return regionRepository.create(validatedData);
  },
  async update(id: number, data: unknown) {
    const id_region = regionValidator.validateId(id);
    const validatedData = regionValidator.validateUpdate(data as any);
    const region = await regionRepository.findById(id_region);
    if (!region) throw new AppError("Region no encontrada", 404);
    return regionRepository.update(id_region, validatedData);
  },
  async remove(id: number) {
    const id_region = regionValidator.validateId(id);
    const region = await regionRepository.findById(id_region);
    if (!region) throw new AppError("Region no encontrada", 404);
    return regionRepository.softDelete(id_region);
  },
};
