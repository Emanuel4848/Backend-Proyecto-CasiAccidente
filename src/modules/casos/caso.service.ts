import prisma from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { casoRepository } from "./caso.repository";
import { casoValidator } from "./caso.validator";

const ESTADO_REPORTADO_ID = 1;
const ESTADOS_EDITABLES = [5, 7, 8, 9, 10]; // Rechazado SYMA, Pend. formato inicial, Pend. formato divulgacion, Pend. acciones correctivas, Pend. evidencias
const ESTADO_ANULADO_ID = 14;
const ESTADO_CERRADO_SIN_ACCIONES_ID = 12;
const ESTADO_CERRADO_CON_ACCIONES_ID = 13;

const ROL_ADMINISTRADOR = 1;
const ROL_BRIGADA = 2;
const ROL_PRL_CONTRATISTA = 3;
const ROL_RESPONSABLE_PROCESO = 4;
const ROL_GESTOR_SYMA = 5;
const ROL_GESTION_CONTROL_SYMA = 6;

export const casoService = {
  async create(data: unknown, id_usuario_creacion: number) {
    const validado = casoValidator.validateCreate(data as any);

    const brigada = await casoRepository.findBrigadaById(validado.id_brigada);
    if (!brigada) throw new AppError("La brigada indicada no existe");

    // Hereda region/proceso de la brigada si el frontend no los mando explicitamente.
    const id_region = validado.id_region ?? brigada.id_region;
    const id_proceso = validado.id_proceso ?? brigada.id_proceso;
    const id_contratista = validado.id_contratista ?? brigada.id_contratista;

    if (!id_region) throw new AppError("No se pudo determinar la region ");
    if (!id_proceso) throw new AppError("No se pudo determinar el proceso ");
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
      id_usuario_prl: id_usuario_creacion, 
    }, id_usuario_creacion);

  },

  async getAll(
    filters: { id_region?: number; id_estado?: number; id_brigada?: number },
    user: { id_usuario: number; id_rol: number }
  ) {
    const where: Record<string, unknown> = {
      id_region: filters.id_region,
      id_estado: filters.id_estado,
      id_brigada: filters.id_brigada,
    };

    if (user.id_rol !== ROL_ADMINISTRADOR && user.id_rol !== ROL_GESTION_CONTROL_SYMA) {
      where.id_casi_accidente = -1;
    }

    return casoRepository.findAll(where);
  },

  async getBandeja(
    filters: { id_region?: number; id_estado?: number; id_brigada?: number },
    user: { id_usuario: number; id_rol: number }
  ) {
    const where: Record<string, unknown> = {
      id_region: filters.id_region,
      id_brigada: filters.id_brigada,
      id_estado: filters.id_estado ?? {
        notIn: [ESTADO_ANULADO_ID, ESTADO_CERRADO_SIN_ACCIONES_ID, ESTADO_CERRADO_CON_ACCIONES_ID],
      },
    };

    switch (user.id_rol) {
      case ROL_PRL_CONTRATISTA:
        where.id_usuario_prl = user.id_usuario;
        break;

      case ROL_RESPONSABLE_PROCESO:
        where.id_usuario_responsable = user.id_usuario;
        break;

      case ROL_GESTOR_SYMA: {
        const asignaciones = await prisma.usuario_asignacion.findMany({
          where: { id_usuario: user.id_usuario, activo: true },
          select: { id_region: true },
        });
        where.id_region = filters.id_region ?? { in: asignaciones.map((a) => a.id_region) };
        break;
      }

      case ROL_BRIGADA: {
        const asignaciones = await prisma.usuario_asignacion.findMany({
          where: { id_usuario: user.id_usuario, activo: true },
          select: { id_region: true },
        });
        where.id_region = filters.id_region ?? { in: asignaciones.map((a) => a.id_region) };
        break;
      }

      default:
        where.id_casi_accidente = -1;
    }

    return casoRepository.findAll(where);
  },

  async getById(id: number) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    return caso;
  },

  async update(id: number, data: unknown) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (!ESTADOS_EDITABLES.includes(caso.id_estado as number)) {
      throw new AppError(`No se puede editar un caso en el estado actual (${caso.estados?.nombre})`, 403);
    }

    const validado = casoValidator.validateUpdate(data as any);

    if (validado.id_region) {
      const region = await casoRepository.findRegionById(validado.id_region as number);
      if (!region) throw new AppError("La region indicada no existe");
    }
    if (validado.id_proceso) {
      const proceso = await casoRepository.findProcesoById(validado.id_proceso as number);
      if (!proceso) throw new AppError("El proceso indicado no existe");
    }
    if (validado.id_brigada) {
      const brigada = await casoRepository.findBrigadaById(validado.id_brigada as number);
      if (!brigada) throw new AppError("La brigada indicada no existe");
    }
    if (validado.id_contratista) {
      const contratista = await casoRepository.findContratistaById(validado.id_contratista as number);
      if (!contratista) throw new AppError("El contratista indicado no existe");
    }

    return casoRepository.update(id_casi_accidente, validado);
  },

  async anular(id: number, id_usuario_accion: number, motivo: string | null) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado === ESTADO_ANULADO_ID) {
      throw new AppError("Este caso ya esta anulado", 400);
    }
    if (caso.id_estado === ESTADO_CERRADO_SIN_ACCIONES_ID || caso.id_estado === ESTADO_CERRADO_CON_ACCIONES_ID) {
      throw new AppError("No se puede anular un caso que ya esta cerrado", 403);
    }

    return casoRepository.anular(id_casi_accidente, caso.id_estado as number, id_usuario_accion, motivo);
  },

  async reactivar(id: number, id_usuario_accion: number) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado !== ESTADO_ANULADO_ID) {
      throw new AppError("Solo se pueden reactivar casos que esten anulados", 400);
    }

    const ultimaAnulacion = await casoRepository.findUltimaAnulacion(id_casi_accidente);
    if (!ultimaAnulacion || !ultimaAnulacion.id_estado_origen) {
      throw new AppError("No se encontro el estado previo a la anulacion en el historial", 409);
    }

    return casoRepository.reactivar(id_casi_accidente, ultimaAnulacion.id_estado_origen, id_usuario_accion);
  },

};