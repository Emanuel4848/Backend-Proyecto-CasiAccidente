import { AppError } from "../../utils/app-error";
import { brigadaRepository } from "./brigada.repository";
import { brigadaValidator } from "./brigada.validator";

type BrigadaData = {
  id_region?: number | null;
  id_proceso?: number | null;
  id_contratista?: number | null;
};

const validateRelations = async (data: BrigadaData) => {
  if (data.id_region) {
    const region = await brigadaRepository.findRegionById(data.id_region);
    if (!region || region.activo === false) throw new AppError("La region indicada no existe o esta inactiva");
  }

  if (data.id_proceso) {
    const proceso = await brigadaRepository.findProcesoById(data.id_proceso);
    if (!proceso || proceso.activo === false) throw new AppError("El proceso indicado no existe o esta inactivo");
  }

  if (data.id_contratista) {
    const contratista = await brigadaRepository.findContratistaById(data.id_contratista);
    if (!contratista || contratista.activo === false) {
      throw new AppError("El contratista indicado no existe o esta inactivo");
    }
  }
};

export const brigadaService = {
  getAll() {
    return brigadaRepository.findAll();
  },
  async getById(id: number) {
    const id_brigada = brigadaValidator.validateId(id);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    return brigada;
  },
  async create(data: unknown) {
    const validatedData = brigadaValidator.validateCreate(data as any);
    await validateRelations(validatedData);
    return brigadaRepository.create(validatedData);
  },
  async update(id: number, data: unknown) {
    const id_brigada = brigadaValidator.validateId(id);
    const validatedData = brigadaValidator.validateUpdate(data as any);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    await validateRelations(validatedData);
    return brigadaRepository.update(id_brigada, validatedData);
  },
  async remove(id: number) {
    const id_brigada = brigadaValidator.validateId(id);
    const brigada = await brigadaRepository.findById(id_brigada);
    if (!brigada) throw new AppError("Brigada no encontrada", 404);
    return brigadaRepository.softDelete(id_brigada);
  },
};
