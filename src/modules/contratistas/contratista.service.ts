import { AppError } from "../../utils/app-error";
import { contratistaRepository } from "./contratista.repository";
import { contratistaValidator } from "./contratista.validator";

export const contratistaService = {
  getAll() {
    return contratistaRepository.findAll();
  },
  async getById(id: number) {
    const id_contratista = contratistaValidator.validateId(id);
    const contratista = await contratistaRepository.findById(id_contratista);
    if (!contratista) throw new AppError("Contratista no encontrado", 404);
    return contratista;
  },
  async create(data: unknown) {
    const validatedData = contratistaValidator.validateCreate(data as any);
    return contratistaRepository.create(validatedData);
  },
  async update(id: number, data: unknown) {
    const id_contratista = contratistaValidator.validateId(id);
    const validatedData = contratistaValidator.validateUpdate(data as any);
    const contratista = await contratistaRepository.findById(id_contratista);
    if (!contratista) throw new AppError("Contratista no encontrado", 404);
    return contratistaRepository.update(id_contratista, validatedData);
  },
  async remove(id: number) {
    const id_contratista = contratistaValidator.validateId(id);
    const contratista = await contratistaRepository.findById(id_contratista);
    if (!contratista) throw new AppError("Contratista no encontrado", 404);
    return contratistaRepository.softDelete(id_contratista);
  },
};
