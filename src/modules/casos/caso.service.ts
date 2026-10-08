import { AppError } from "../../utils/app-error";
import { casoRepository } from "./caso.repository";
import { casoValidator } from "./caso.validator";
import prisma from "../../config/prisma";

const ESTADOS_EDITABLES = [3, 5, 7, 8, 9, 10]; 
const ESTADO_ANULADO_ID = 14;
const ESTADOS_ACCIONES_CORRECTIVAS = [9, 10, 11];

const ESTADO_REPORTADO_ID = 1;
const ROL_ADMINISTRADOR = 1;
const ROL_PRL_CONTRATISTA = 3;
const ROL_RESPONSABLE_PROCESO = 4;
const ROL_GESTOR_SYMA = 5;
const ROL_GESTION_CONTROL_SYMA = 6;

// Helper para normalizar textos (quita tildes y pasa a minúsculas para comparaciones exactas)
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Devuelve las brigadas asignadas a un PRL (tabla brigada_asignacion, no usuario_asignacion)
async function getBrigadasAsignadasPrl(id_usuario: number): Promise<number[]> {
  const asignaciones = await prisma.brigada_asignacion.findMany({
    where: { id_usuario_prl: id_usuario, activo: true },
    select: { id_brigada: true },
  });
  return asignaciones.map((a) => a.id_brigada);
}

// Devuelve las brigadas asignadas a un Responsable del Proceso (tabla brigada_asignacion)
async function getBrigadasAsignadasResponsable(id_usuario: number): Promise<number[]> {
  const asignaciones = await prisma.brigada_asignacion.findMany({
    where: { id_usuario_responsable: id_usuario, activo: true },
    select: { id_brigada: true },
  });
  return asignaciones.map((a) => a.id_brigada);
}

// Devuelve las regiones asignadas a un usuario SYMA / Gestión y Control SYMA (tabla usuario_asignacion)
async function getRegionesAsignadas(id_usuario: number): Promise<number[]> {
  const asignaciones = await prisma.usuario_asignacion.findMany({
    where: { id_usuario, activo: true },
    select: { id_region: true },
  });
  return asignaciones.map((a) => a.id_region).filter((r): r is number => r !== null);
}

async function asegurarAccesoCaso(user: { id_usuario: number; id_rol: number }, caso: any) {
  const role = Number(user.id_rol);
  if (role === ROL_ADMINISTRADOR) return;
  if (role === ROL_PRL_CONTRATISTA && (await getBrigadasAsignadasPrl(user.id_usuario)).includes(Number(caso.id_brigada)) && ![12, 13, 14].includes(Number(caso.id_estado))) return;
  if (role === ROL_RESPONSABLE_PROCESO && (await getBrigadasAsignadasResponsable(user.id_usuario)).includes(Number(caso.id_brigada)) && ![12, 13, 14].includes(Number(caso.id_estado))) return;
  if ([ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA].includes(role) && (await getRegionesAsignadas(user.id_usuario)).includes(Number(caso.id_region)) && ![12, 13, 14].includes(Number(caso.id_estado))) return;
  throw new AppError("No tienes acceso a este caso", 403);
}

async function filtrarCasosPorRol(user: { id_usuario: number; id_rol: number }, casos: any[]) {
  // PROTECCI�N CRÍTICA: Si no hay usuario o rol, no se muestra nada por seguridad
  if (!user || !user.id_rol) {
    return [];
  }

  switch (Number(user.id_rol)) {
    case ROL_PRL_CONTRATISTA: {
      const brigadasAsignadas = await getBrigadasAsignadasPrl(user.id_usuario);
      return casos.filter((caso: any) => brigadasAsignadas.includes(caso.id_brigada) && caso.id_estado !== ESTADO_ANULADO_ID);
    }

    case ROL_RESPONSABLE_PROCESO: {
      const brigadasAsignadas = await getBrigadasAsignadasResponsable(user.id_usuario);
      return casos.filter((caso: any) => brigadasAsignadas.includes(caso.id_brigada) && caso.id_estado !== ESTADO_ANULADO_ID);
    }

    case ROL_GESTOR_SYMA:
    case ROL_GESTION_CONTROL_SYMA: {
      const regionesAsignadas = await getRegionesAsignadas(user.id_usuario);
      return casos.filter((caso: any) => regionesAsignadas.includes(caso.id_region));
    }

    case ROL_ADMINISTRADOR:
      return casos.filter((caso: any) => caso.id_estado !== ESTADO_ANULADO_ID);

    default:
      // Cualquier rol no contemplado (ej. Brigada, que ya no debe tener acceso al sistema) no ve nada.
      return [];
  }
}

export const casoService = {
  async create(data: unknown, user: { id_usuario: number; id_rol: number }) {
    const validado = casoValidator.validateCreate(data as any);
    const id_usuario_creacion = user.id_usuario;

    const brigada = await casoRepository.findBrigadaById(validado.id_brigada);
    if (!brigada) throw new AppError("La brigada indicada no existe");

    const id_region = validado.id_region ?? brigada.id_region;
    const id_proceso = validado.id_proceso ?? brigada.id_proceso;

    if (!id_region) throw new AppError("No se pudo determinar la region ");
    if (!id_proceso) throw new AppError("No se pudo determinar el proceso ");

    const [region, proceso] = await Promise.all([
      casoRepository.findRegionById(id_region),
      casoRepository.findProcesoById(id_proceso),
    ]);
    if (!region) throw new AppError("La region indicada no existe");
    if (!proceso) throw new AppError("El proceso indicado no existe");

    // Determinar el PRL del caso: si quien crea es PRL, se asigna a sí mismo (y debe pertenecer a la brigada).
    // Si es Admin, se toma el PRL ya asignado a la brigada (si existe).
    let id_usuario_prl: number | null = null;

    if (Number(user.id_rol) === ROL_PRL_CONTRATISTA) {
      const asignacion = await prisma.brigada_asignacion.findFirst({
        where: { id_brigada: validado.id_brigada, id_usuario_prl: user.id_usuario, activo: true },
      });
      if (!asignacion) {
        throw new AppError("No estás asignado como PRL de esta brigada, no puedes registrar el caso", 403);
      }
      id_usuario_prl = user.id_usuario;
    } else {
      const asignacionBrigada = await prisma.brigada_asignacion.findFirst({
        where: { id_brigada: validado.id_brigada, activo: true },
      });
      id_usuario_prl = asignacionBrigada?.id_usuario_prl ?? null;
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
      id_estado: ESTADO_REPORTADO_ID,
      id_usuario_creacion,
      id_usuario_actual: id_usuario_creacion,
      id_usuario_prl,
    }, id_usuario_creacion);
  },

  async getAll(user: { id_usuario: number; id_rol: number }, filters: { id_region?: number; id_estado?: number; id_brigada?: number }) {
      const casos = await casoRepository.findAll(filters);
    return filtrarCasosPorRol(user, casos);
  },

  async getBandeja(user: { id_usuario: number; id_rol: number }) {
    // Si no hay usuario o rol válido, no devolvemos nada por seguridad
    if (!user || !user.id_rol) {
      return [];
    }

    const includeCompleto = {
      regiones: true,
      procesos: true,
      brigadas: {
        include: {
          brigada_asignacion: {
            where: { activo: true },
            take: 1 as const,
            include: {
              usuarios_prl: { select: { id_usuario: true, nombre: true } },
              usuarios_responsable: { select: { id_usuario: true, nombre: true } },
            },
          },
        },
      },
      contratistas: true,
      estados: true,
      usuarios_casi_accidentes_id_usuario_prlTousuarios: {
        select: { id_usuario: true, nombre: true, correo: true },
      },
    };

    let filtroBrigada: number[] | null = null; // null = sin restricción por brigada (se filtra por otra vía)
    let filtroRegion: number[] | null = null;

    switch (Number(user.id_rol)) {
      case ROL_PRL_CONTRATISTA:
        filtroBrigada = await getBrigadasAsignadasPrl(user.id_usuario);
        break;

      case ROL_RESPONSABLE_PROCESO:
        filtroBrigada = await getBrigadasAsignadasResponsable(user.id_usuario);
        break;

      case ROL_GESTOR_SYMA:
      case ROL_GESTION_CONTROL_SYMA:
        filtroRegion = await getRegionesAsignadas(user.id_usuario);
        break;

      case ROL_ADMINISTRADOR:
        return await prisma.casi_accidentes.findMany({
          include: includeCompleto,
          orderBy: { creado_en: "desc" },
        });

      default:
        // Cualquier rol no contemplado (ej. Brigada) no ve nada en la bandeja.
        return [];
    }

    // Si el usuario no tiene ninguna brigada/región asignada, su bandeja está vacía (no error, 0 resultados)
    if (filtroBrigada !== null && filtroBrigada.length === 0) return [];
    if (filtroRegion !== null && filtroRegion.length === 0) return [];

    return await prisma.casi_accidentes.findMany({
      where: {
        id_estado: { notIn: [ESTADO_ANULADO_ID] },
        ...(filtroBrigada !== null ? { id_brigada: { in: filtroBrigada } } : {}),
        ...(filtroRegion !== null ? { id_region: { in: filtroRegion } } : {}),
      },
      include: includeCompleto,
      orderBy: { creado_en: "desc" },
    });
  },

  async getById(id: number, user: { id_usuario: number; id_rol: number }) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    await asegurarAccesoCaso(user, caso);
    return caso;
  },

  async update(id: number, data: unknown, user: { id_usuario: number; id_rol: number }) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    await asegurarAccesoCaso(user, caso);

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

    if (Number(user.id_rol) === ROL_PRL_CONTRATISTA && validado.id_brigada !== undefined) {
      const brigadasAsignadas = await getBrigadasAsignadasPrl(user.id_usuario);
      if (!brigadasAsignadas.includes(Number(validado.id_brigada))) throw new AppError("No tienes acceso a esta brigada", 403);
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

  async validarProcedencia(id: number, id_usuario_accion: number, procede: boolean, motivo?: string, id_rol?: number) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    if (id_rol === ROL_PRL_CONTRATISTA && !(await getBrigadasAsignadasPrl(id_usuario_accion)).includes(Number(caso.id_brigada))) throw new AppError("No tienes asignada la brigada de este caso", 403);

    if (caso.id_estado !== ESTADO_REPORTADO_ID) {
      throw new AppError("El caso ya ha sido evaluado o no se encuentra en estado inicial", 409);
    }

    let estadoDestino = null;

    if (procede) {
      estadoDestino = await prisma.estados.findFirst({
        where: {
          AND: [
            {
              OR: [
                { nombre: { contains: "Proceso", mode: "insensitive" } },
                { nombre: { contains: "Analisis", mode: "insensitive" } },
                { nombre: { contains: "Acciones", mode: "insensitive" } },
                { nombre: { contains: "Responsable", mode: "insensitive" } },
              ],
            },
            {
              NOT: { nombre: { contains: "PRL", mode: "insensitive" } },
            },
          ],
        },
      });
    } else {
      estadoDestino = await prisma.estados.findFirst({
        where: {
          OR: [
            { nombre: { contains: "Rechazado", mode: "insensitive" } },
            { nombre: { contains: "Rechazada", mode: "insensitive" } },
          ],
        },
      });
    }

    if (!estadoDestino) {
      const todosLosEstados = await prisma.estados.findMany();
      const nombresDisponibles = todosLosEstados.map(e => e.nombre).join(", ");
      throw new AppError(`No se encontró el estado de destino para (${procede ? "Procedente" : "Rechazado"}). Estados disponibles en BD: [${nombresDisponibles}]`, 500);
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

  async gestionarResponsable(id: number, id_usuario_accion: number, accion: 'AVANZAR' | 'RECHAZAR' | 'ENVIAR_CIERRE', motivo?: string) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    if (!["AVANZAR", "RECHAZAR", "ENVIAR_CIERRE"].includes(accion)) {
      throw new AppError("Acción de Responsable no válida", 400);
    }

    let estadoDestino = null;
    const estadoActualNombre = normalizarTexto(caso.estados?.nombre || "");
    const historialRegistros = await prisma.historial.findMany({
      where: { id_casi_accidente },
      include: { estados_historial_id_estado_destinoToestados: true },
    });
    const pasoPorAccionesCorrectivas = historialRegistros.some((h: any) =>
      Number(h.id_estado_destino) === 9 ||
      normalizarTexto(h.estados_historial_id_estado_destinoToestados?.nombre || "").includes("acciones correctivas")
    );
    if (accion === "ENVIAR_CIERRE" && !pasoPorAccionesCorrectivas) {
      throw new AppError("El caso todavía no cuenta con acciones correctivas para enviar a SYMA", 409);
    }

    if (accion === 'ENVIAR_CIERRE') {
      // El Responsable manda el caso a SYMA para la validacion final de evidencias.
      estadoDestino = await prisma.estados.findFirst({
        where: {
          OR: [
            { id_estado: 11 },
            { nombre: { contains: "evidencias en revision", mode: "insensitive" } },
          ],
        },
      });
    } else if (estadoActualNombre.includes("pendiente de revision del responsable del proceso")) {
      estadoDestino = await prisma.estados.findFirst({
        where: pasoPorAccionesCorrectivas
          ? {
              OR: [
                { id_estado: 11 },
                { nombre: { contains: "Evidencias en revision", mode: "insensitive" } },
              ],
            }
          : { nombre: { contains: "Pendiente de validacion syma", mode: "insensitive" } },
      });
    } else if (estadoActualNombre.includes("aceptado") || estadoActualNombre.includes("procede")) {
      estadoDestino = await prisma.estados.findFirst({
        where: { nombre: { contains: "Pendiente de formato de divulgacion", mode: "insensitive" } },
      });
    } else {
      estadoDestino = await prisma.estados.findFirst({
        where: { nombre: { contains: "Pendiente de formato de divulgacion", mode: "insensitive" } },
      });
    }

    if (!estadoDestino) {
      throw new AppError("El estado de destino para el responsable no está configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoDestino.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_responsable: id_usuario_accion,
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
            accion: `RESPONSABLE_${accion}`,
            motivo: motivo || `Gestión de responsable: Transición a ${estadoDestino.nombre}`,
            fecha: new Date(),
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción de responsable: ${error.message}`, 500);
    }
  },

  // Gestión para el rol SYMA (Distingue entre revisión inicial, divulgación y validación final de evidencias)
  async gestionarSyma(
    id: number,
    user: { id_usuario: number; id_rol: number },
    accion: "APROBAR" | "PROCEDE_SIN_ACCIONES" | "SOLICITAR_ACCIONES" | "RECHAZAR" | undefined,
    aprobado?: boolean,
    motivo?: string,
  ) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    if (![ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA].includes(Number(user.id_rol))) throw new AppError("Solo SYMA puede gestionar esta revisión", 403);
    if (!(await getRegionesAsignadas(user.id_usuario)).includes(Number(caso.id_region))) throw new AppError("No tienes asignada la región de este caso", 403);
    const id_usuario_accion = user.id_usuario;

    const estadoActualNombre = normalizarTexto(caso.estados?.nombre || "");
    const esRevisionEvidencias = estadoActualNombre.includes("evidencias en revision");

    // Verificamos en el historial si el caso ya pasó por el formato de divulgación
    const historialRegistros = await prisma.historial.findMany({
      where: { id_casi_accidente },
      include: {
        estados_historial_id_estado_origenToestados: true,
        estados_historial_id_estado_destinoToestados: true,
      },
    });

    const vieneDeFormatoDivulgacion = historialRegistros.some((h: any) => {
      const accion = normalizarTexto(h.accion || "");
      const estadoOrigen = normalizarTexto(h.estados_historial_id_estado_origenToestados?.nombre || "");
      return accion === "prl_enviar_responsable" &&
        (Number(h.id_estado_origen) === 8 || estadoOrigen.includes("formato de divulgacion"));
    });
    const pasoPorAccionesCorrectivas = historialRegistros.some((h: any) =>
      Number(h.id_estado_destino) === 9 ||
      normalizarTexto(h.estados_historial_id_estado_destinoToestados?.nombre || '').includes("acciones correctivas")
    );

    const requiereDecisionSegundaRevision = vieneDeFormatoDivulgacion && !esRevisionEvidencias && !pasoPorAccionesCorrectivas;
    const decision = accion ?? (aprobado === true ? "APROBAR" : aprobado === false ? "RECHAZAR" : undefined);
    if (!decision) {
      throw new AppError("Selecciona una decisión para la revisión SYMA", 400);
    }
    if (requiereDecisionSegundaRevision && !["PROCEDE_SIN_ACCIONES", "SOLICITAR_ACCIONES", "RECHAZAR"].includes(decision)) {
      throw new AppError("Selecciona una decisión válida para la revisión SYMA", 400);
    }
    if (!requiereDecisionSegundaRevision && ["PROCEDE_SIN_ACCIONES", "SOLICITAR_ACCIONES"].includes(decision)) {
      throw new AppError("Esta decisión solo está disponible durante la revisión del formato de divulgación", 409);
    }
    if (decision !== "APROBAR" && !motivo?.trim()) {
      throw new AppError("El comentario es obligatorio para esta decisión", 400);
    }

    let estadoDestino = null;

    if (decision === "PROCEDE_SIN_ACCIONES") {
      estadoDestino = await prisma.estados.findFirst({ where: { OR: [{ id_estado: 12 }, { nombre: { contains: "cerrado sin acciones", mode: "insensitive" } }] } });
    } else if (decision === "SOLICITAR_ACCIONES") {
      estadoDestino = await prisma.estados.findFirst({ where: { OR: [{ id_estado: 9 }, { nombre: { contains: "pendiente de acciones correctivas", mode: "insensitive" } }, { nombre: { contains: "acciones correctivas", mode: "insensitive" } }] } });
    } else if (decision === "RECHAZAR") {
      if (esRevisionEvidencias || pasoPorAccionesCorrectivas) {
        estadoDestino = await prisma.estados.findFirst({ where: { OR: [{ id_estado: 9 }, { nombre: { contains: "pendiente de acciones correctivas", mode: "insensitive" } }, { nombre: { contains: "acciones correctivas", mode: "insensitive" } }] } });
      } else {
        estadoDestino = await prisma.estados.findFirst({ where: { OR: [{ id_estado: 3 }, { nombre: { contains: "pendiente de revision del responsable", mode: "insensitive" } }, { nombre: { contains: "responsable del proceso", mode: "insensitive" } }] } });
      }
    } else if (decision === "APROBAR") {
      if (esRevisionEvidencias || pasoPorAccionesCorrectivas) {
        // Si SYMA aprueba el flujo final de acciones correctivas, cierra con acciones.
        estadoDestino = await prisma.estados.findFirst({
          where: {
            OR: [
              { id_estado: 13 },
              { nombre: { contains: "cerrado con acciones", mode: "insensitive" } },
            ],
          },
        });
      } else if (!vieneDeFormatoDivulgacion) {
        // 1.ª Revisión: Lo devuelve al Responsable como Aceptado / Procede
        estadoDestino = await prisma.estados.findFirst({
          where: {
            OR: [
              { id_estado: 6 },
              { nombre: { contains: "Aceptado", mode: "insensitive" } },
              { nombre: { contains: "Procede", mode: "insensitive" } },
            ],
          },
        });
      }
    }

    if (!estadoDestino) {
      throw new AppError("El estado de destino SYMA no está configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoDestino.id_estado;
    const esCierre = decision === "PROCEDE_SIN_ACCIONES" || decision === "APROBAR" && (esRevisionEvidencias || pasoPorAccionesCorrectivas);

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_syma: id_usuario_accion,
            id_usuario_actual: id_usuario_accion,
            ...(esCierre ? { 
              fecha_cierre: new Date(), 
              id_usuario_cierre: id_usuario_accion,
              tipo_cierre: decision === "PROCEDE_SIN_ACCIONES" ? "CIERRE_SIN_ACCIONES" : "CIERRE_CON_ACCIONES"
            } : {}),
            actualizado_en: new Date(),
          },
        });

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: idEstadoOrigen,
            id_estado_destino: idEstadoDestino,
            accion: decision === "PROCEDE_SIN_ACCIONES" ? "SYMA_PROCEDE_SIN_ACCIONES" : decision === "SOLICITAR_ACCIONES" ? "SYMA_SOLICITA_ACCIONES" : decision === "RECHAZAR" ? "SYMA_RECHAZAR" : (esRevisionEvidencias ? "SYMA_APROBAR_CIERRE" : (vieneDeFormatoDivulgacion ? "SYMA_APROBAR_DIVULGACION" : "SYMA_APROBAR_INICIAL")),
            motivo: motivo?.trim() || (esRevisionEvidencias ? "SYMA aprobó las evidencias y cerró el caso con acciones" : "Validación SYMA aprobada"),
            fecha: new Date(),
          },
        });

        await tx.bitacora.create({
          data: {
            accion: `Usuario ${user.id_usuario} ejecutó ${decision} en el caso ${caso.numero_caso} durante la fase SYMA`,
            fecha_accion: new Date(),
            casi_accidentes: { connect: { id_casi_accidente } },
            usuarios: { connect: { id_usuario: user.id_usuario } },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción SYMA: ${error.message}`, 500);
    }
  },

  async gestionarPrl(id: number, id_usuario_accion: number, motivo?: string) {
    const id_casi_accidente = casoValidator.validateId(id);
    const caso = await casoRepository.findById(id_casi_accidente);
    if (!caso) throw new AppError("Caso no encontrado", 404);
    if (Number(caso.id_estado) !== 8 && !normalizarTexto(caso.estados?.nombre || "").includes("acciones correctivas")) throw new AppError("El caso no está pendiente de gestión por PRL", 409);
    if (!(await getBrigadasAsignadasPrl(id_usuario_accion)).includes(Number(caso.id_brigada))) throw new AppError("No tienes asignada la brigada de este caso", 403);

    const estadoActualNombre = normalizarTexto(caso.estados?.nombre || "");
    const estaEnFormatoDivulgacion = estadoActualNombre.includes("pendiente de formato de divulgacion");
    const estaEnAccionesCorrectivas = estadoActualNombre.includes("acciones correctivas");
    const minimoDocumentos = estaEnAccionesCorrectivas ? 0 : (estaEnFormatoDivulgacion ? 2 : 3);

    // --- FILTRO: Validar documentos adjuntos segun fase del flujo ---
    const totalDocumentos = await prisma.documentos.count({
      where: { id_casi_accidente },
    });

    if (minimoDocumentos > 0 && totalDocumentos < minimoDocumentos) {
      throw new AppError(`Debe adjuntar al menos ${minimoDocumentos} archivos al caso antes de poder proceder.`, 400);
    }
    // -----------------------------------------------------------------

    const estadoDestino = await prisma.estados.findFirst({
      where: {
        nombre: { contains: "Pendiente de revision del responsable del Proceso", mode: "insensitive" }
      },
    });

    if (!estadoDestino) {
      throw new AppError("El estado de destino para el responsable no está configurado en el sistema", 500);
    }

    const idEstadoOrigen = caso.id_estado as number;
    const idEstadoDestino = estadoDestino.id_estado;

    try {
      return await prisma.$transaction(async (tx) => {
        const casoActualizado = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: {
            id_estado: idEstadoDestino,
            id_usuario_prl: id_usuario_accion,
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
            accion: "PRL_ENVIAR_RESPONSABLE",
            motivo: motivo || "PRL envió el caso de vuelta al Responsable tras adjuntar archivos requeridos",
            fecha: new Date(),
          },
        });

        await tx.bitacora.create({
          data: {
            accion: `Usuario ${id_usuario_accion} envió el caso ${caso.numero_caso} de vuelta al Responsable`,
            fecha_accion: new Date(),
            casi_accidentes: { connect: { id_casi_accidente } },
            usuarios: { connect: { id_usuario: id_usuario_accion } },
          },
        });

        return casoActualizado;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción PRL: ${error.message}`, 500);
    }
  },

  async contarBandeja(user: { id_usuario: number; id_rol: number; id_region?: number }) {
    const casosBandeja = await this.getBandeja(user); // <-- Quita la coma y el {}
    const estadosPendientes = [1, 2, 3, 4, 7, 8, 9, 10, 11]; 
    const pendientes = casosBandeja.filter((c: any) => estadosPendientes.includes(c.id_estado));
    return pendientes.length;
  },

  async getRegiones() {
    return await prisma.regiones.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  },

  async getAccionesCorrectivas(user: { id_usuario: number; id_rol: number }) {
    const casos = await casoRepository.findAll({});
    
    return casos.filter((caso: any) => {
      const nombreEstado = normalizarTexto(caso.estados?.nombre || "");
      return ESTADOS_ACCIONES_CORRECTIVAS.includes(Number(caso.id_estado)) ||
             nombreEstado.includes("pendiente de evidencias") ||
             nombreEstado.includes("evidencias en revision") ||
             nombreEstado.includes("acciones correctivas");
    });
  },
};
