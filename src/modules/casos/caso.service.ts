import { AppError } from "../../utils/app-error";
import { casoRepository } from "./caso.repository";
import { casoValidator } from "./caso.validator";
import prisma from "../../config/prisma";

const ESTADO_REPORTADO_ID = 1;
const ESTADOS_EDITABLES = [5, 7, 8, 9, 10]; 
const ESTADO_ANULADO_ID = 14;

async function filtrarCasosPorRol(user: { id_usuario: number; id_rol: number }, casos: any[]) {
  const asignaciones = await prisma.usuario_asignacion.findMany({
    where: { id_usuario: user.id_usuario, activo: true },
  });

  const regionesPermitidas = asignaciones
    .map((a) => a.id_region)
    .filter((r): r is number => r !== null);
  const procesosPermitidos = asignaciones
    .map((a) => a.id_proceso)
    .filter((p): p is number => p !== null);

  switch (user.id_rol) {
    case 2:
      return casos.filter(
        (caso: any) =>
          caso.id_usuario_creacion === user.id_usuario ||
          (regionesPermitidas.length > 0 && regionesPermitidas.includes(caso.id_region))
      );

    case 3: 
      return casos.filter((caso: any) => {
        const esSuCreador = caso.id_usuario_creacion === user.id_usuario;
        const esSuPrl = caso.id_usuario_prl === user.id_usuario;
        const esReportado = caso.id_estado === 1; // Estado Reportado (recién creado por brigada)
        const esDeSuRegion = regionesPermitidas.length === 0 || regionesPermitidas.includes(caso.id_region);

        return esSuCreador || esSuPrl || (esReportado && esDeSuRegion);
      });

    case 4:
      return casos.filter(
        (caso: any) =>
          caso.id_usuario_responsable === user.id_usuario ||
          (procesosPermitidos.length > 0 && procesosPermitidos.includes(caso.id_proceso)) ||
          (regionesPermitidas.length > 0 && regionesPermitidas.includes(caso.id_region))
      );

    case 5: 
    case 6: 
      return casos.filter((caso: any) => {
        const esSuSyma = caso.id_usuario_syma === user.id_usuario;
        const esDeSuRegion = regionesPermitidas.length > 0 && regionesPermitidas.includes(caso.id_region);

        const enFaseSyma = caso.id_estado >= 7;

        return esSuSyma || (esDeSuRegion && enFaseSyma);
      });

    default:
      return casos;
  }
}

export const casoService = {
  async create(data: unknown, id_usuario_creacion: number) {
    const validado = casoValidator.validateCreate(data as any);

    const brigada = await casoRepository.findBrigadaById(validado.id_brigada);
    if (!brigada) throw new AppError("La brigada indicada no existe");

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
    }, id_usuario_creacion);
  },

  async getAll(user: { id_usuario: number; id_rol: number }, filters: { id_region?: number; id_estado?: number; id_brigada?: number }) {
    const casos = await casoRepository.findAll(filters);
    return filtrarCasosPorRol(user, casos);
  },

  async getBandeja(
    user: { id_usuario: number; id_rol: number; id_region?: number },
    filters: { id_region?: number; id_estado?: number; id_brigada?: number }
  ) {
    const casos = await casoRepository.findAll(filters);
    return filtrarCasosPorRol(user, casos);
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

  async validarProcedencia(id: number, id_usuario_accion: number, procede: boolean, motivo?: string) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    if (caso.id_estado !== ESTADO_REPORTADO_ID) {
      throw new AppError("El caso ya ha sido evaluado o no se encuentra en estado inicial", 409);
    }

    const nombreEstadoDestino = procede ? "En Análisis" : "Rechazado";
    const estadoDestino = await prisma.estados.findFirst({
      where: { nombre: { contains: procede ? "Análisis" : "Rechazado", mode: "insensitive" } },
    });

    if (!estadoDestino) {
      throw new AppError(`El estado de destino (${nombreEstadoDestino}) no está configurado en el sistema`, 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoDestino.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            procede: procede,
            id_usuario_prl: id_usuario_accion,
            id_usuario_actual: id_usuario_accion,
            actualizado_en: new Date(),
          },
        });

        if (!procede && motivo) {
          await tx.rechazos.create({
            data: {
              id_casi_accidente,
              id_usuario: id_usuario_accion,
              motivo,
              fecha_rechazo: new Date(),
            },
          });
        }

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: idEstadoOrigen,
            id_estado_destino: idEstadoDestino,
            accion: procede ? "VALIDAR_PROCEDE" : "VALIDAR_NO_PROCEDE",
            motivo: motivo || (procede ? "Caso validado como procedente por PRL" : "Caso no procedente"),
            fecha: new Date(),
          },
        });

        await tx.bitacora.create({
          data: {
            accion: `Usuario ${id_usuario_accion} validó el caso ${caso.numero_caso} como: ${procede ? 'PROCEDE' : 'NO PROCEDE'}`,
            fecha_accion: new Date(),
            casi_accidentes: { connect: { id_casi_accidente } },
            usuarios: { connect: { id_usuario: id_usuario_accion } },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción de validación: ${error.message}`, 500);
    }
  },

  async contarBandeja(user: { id_usuario: number; id_rol: number; id_region?: number }) {
    const casosBandeja = await this.getBandeja(user, {});
    const estadosPendientes = [1, 2, 3, 4, 7, 8, 9, 10, 11]; 
    const pendientes = casosBandeja.filter((c: any) => estadosPendientes.includes(c.id_estado));
    return pendientes.length;
  },

  async getRegiones() {
    return await prisma.regiones.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
};