import { AppError } from "../../utils/app-error";
import { casoRepository } from "./caso.repository";
import { casoValidator } from "./caso.validator";

const ESTADO_REPORTADO_ID = 1;

export const casoService = {
  async create(data: unknown, id_usuario_creacion: number) {
    const validado = casoValidator.validateCreate(data as any);

    const brigada = await casoRepository.findBrigadaById(validado.id_brigada);
    if (!brigada) throw new AppError("La brigada indicada no existe");

    // Hereda region/proceso de la brigada si el frontend no los mando explicitamente.
    const id_region = validado.id_region ?? brigada.id_region;
    const id_proceso = validado.id_proceso ?? brigada.id_proceso;
    const id_contratista = validado.id_contratista ?? brigada.id_contratista;

    if (!id_region) throw new AppError("No se pudo determinar la region (ni enviada ni en la brigada)");
    if (!id_proceso) throw new AppError("No se pudo determinar el proceso (ni enviado ni en la brigada)");

    // Si el frontend mando una region/proceso distinta a la de la brigada, se valida que exista igual.
    const [region, proceso] = await Promise.all([
      casoRepository.findRegionById(id_region),
      casoRepository.findProcesoById(id_proceso),
    ]);
    if (!region) throw new AppError("La region indicada no existe");
    if (!proceso) throw new AppError("El proceso indicado no existe");

    if (id_contratista) {
      const contratista = await casoRepository.findContratistaById(id_contratista);
      if (!contratista) throw new AppError("El contratista indicado no existe");
    }

    const year = new Date().getFullYear();
    const consecutivo = (await casoRepository.countByYear(year)) + 1;
    const numero_caso = `CA-${year}-${String(consecutivo).padStart(4, "0")}`;

    return casoRepository.create({
      numero_caso,
      titulo: validado.titulo,
      descripcion: validado.descripcion,
      fecha_reporte: new Date(),
      id_region,
      id_proceso,
      id_brigada: validado.id_brigada,
      id_contratista,
      id_estado: ESTADO_REPORTADO_ID,
      id_usuario_creacion,
      id_usuario_actual: id_usuario_creacion,
    }, id_usuario_creacion);
    
  },

  async getAll(filters: { id_region?: number; id_estado?: number }) {
    return casoRepository.findAll(filters);
  },

  async getById(id: number) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    return caso;
  },
};