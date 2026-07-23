import { AppError } from "../../utils/app-error";
import { casoRepository } from "./caso.repository";
import { casoValidator } from "./caso.validator";
import prisma from "../../config/prisma";

const ESTADO_REPORTADO_ID = 1;
const ESTADOS_EDITABLES = [5, 7, 8, 9, 10]; // Rechazado SYMA, Pend. formato inicial, Pend. formato divulgacion, Pend. acciones correctivas, Pend. evidencias
const ESTADO_ANULADO_ID = 14;


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

  async getAll(filters: { id_region?: number; id_estado?: number; id_brigada?: number }) {
    return casoRepository.findAll(filters);
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
    if (caso.id_estado === 12 || caso.id_estado === 13) {
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

 async rechazar(id: number, id_usuario_accion: number, motivo: string) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado === ESTADO_ANULADO_ID) {
      throw new AppError("No se puede rechazar un caso que esta anulado", 409);
    }
    if (caso.id_estado === 12 || caso.id_estado === 13) {
      throw new AppError("Transicion ilegal: No se puede rechazar un caso que ya esta cerrado", 409);
    }

    const estadoRechazado = await prisma.estados.findFirst({
      where: { nombre: { contains: "Rechazado", mode: "insensitive" } },
    });

    if (!estadoRechazado) {
      throw new AppError("El estado de rechazo no esta configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoRechazado.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.rechazos.create({
          data: {
            id_casi_accidente,
            id_usuario: id_usuario_accion,
            motivo,
            fecha_rechazo: new Date(),
          },
        });

        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_actual: id_usuario_accion,
            actualizado_en: new Date(),
          },
        });

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: idEstadoOrigen,
            id_estado_destino: idEstadoDestino,
            accion: "RECHAZAR",
            motivo,
            fecha: new Date(),
          },
        });

        // Bitácora corregida con relaciones
        await tx.bitacora.create({
          data: {
            accion: `Usuario ${id_usuario_accion} rechazó el caso ${caso.numero_caso}`,
            fecha_accion: new Date(),
            casi_accidentes: {
              connect: { id_casi_accidente },
            },
            usuarios: {
              connect: { id_usuario: id_usuario_accion },
            },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción de rechazo: ${error.message}`, 500);
    }
  },

  async cerrar(id: number, id_usuario_accion: number, tipo_cierre: string, motivo_cierre?: string) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado === ESTADO_ANULADO_ID) {
      throw new AppError("No se puede cerrar un caso que esta anulado", 409);
    }
    if (caso.id_estado === 12 || caso.id_estado === 13) {
      throw new AppError("Este caso ya se encuentra cerrado", 409);
    }

    const estadoCerrado = await prisma.estados.findFirst({
      where: { nombre: { contains: "Cerrado", mode: "insensitive" } },
    });

    if (!estadoCerrado) {
      throw new AppError("El estado de cierre no esta configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoCerrado.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_actual: id_usuario_accion,
            id_usuario_cierre: id_usuario_accion,
            fecha_cierre: new Date(),
            tipo_cierre: tipo_cierre || "CIERRE_DIRECTO",
            actualizado_en: new Date(),
          },
        });

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: idEstadoOrigen,
            id_estado_destino: idEstadoDestino,
            accion: "CERRAR",
            motivo: motivo_cierre || "Cierre de casi accidente registrado por Gestión y Control SYMA",
            fecha: new Date(),
          },
        });

        // Bitácora corregida con relaciones
        await tx.bitacora.create({
          data: {
            accion: `Usuario ${id_usuario_accion} realizó el cierre del caso ${caso.numero_caso}`,
            fecha_accion: new Date(),
            casi_accidentes: {
              connect: { id_casi_accidente },
            },
            usuarios: {
              connect: { id_usuario: id_usuario_accion },
            },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción de cierre: ${error.message}`, 500);
    }
  },

  async evaluar(id: number, id_usuario_accion: number) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado === ESTADO_ANULADO_ID) {
      throw new AppError("No se puede evaluar un caso que esta anulado", 409);
    }
    if (caso.id_estado !== ESTADO_REPORTADO_ID) {
      throw new AppError("El caso ya ha sido evaluado o no se encuentra en estado inicial", 409);
    }

    // Busca el estado destino (ej. "Evaluado" o el siguiente en la cadena)
    const estadoEvaluado = await prisma.estados.findFirst({
      where: { nombre: { contains: "Evaluado", mode: "insensitive" } },
    });

    if (!estadoEvaluado) {
      throw new AppError("El estado de evaluacion no esta configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoEvaluado.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_actual: id_usuario_accion,
            actualizado_en: new Date(),
          },
        });

        // Registro de trazabilidad para la Línea de Tiempo
        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: idEstadoOrigen,
            id_estado_destino: idEstadoDestino,
            accion: "EVALUAR",
            motivo: "Evaluación inicial de casi accidente",
            fecha: new Date(),
          },
        });

        // Bitácora de auditoría
        await tx.bitacora.create({
          data: {
            accion: `Usuario ${id_usuario_accion} evaluó el caso ${caso.numero_caso}`,
            fecha_accion: new Date(),
            casi_accidentes: {
              connect: { id_casi_accidente },
            },
            usuarios: {
              connect: { id_usuario: id_usuario_accion },
            },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción de evaluación: ${error.message}`, 500);
    }
  },

};