import { AppError } from "../../utils/app-error";
import { accionCorrectivaRepository } from "./accion-correctiva.repository";
import prisma from "../../config/prisma";

export const accionCorrectivaService = {
  async getAll() {
    return accionCorrectivaRepository.findAll();
  },

  async create(data: {
    id_casi_accidente: number;
    descripcion: string;
    id_usuario_responsable: number;
    prioridad: string;
    fecha_compromiso: string | Date;
    id_usuario_creador: number; // Requerido para la bitácora
  }) {
    const id_casi_accidente = Number(data.id_casi_accidente);

    // 1. Validar que el caso exista
    const caso = await prisma.casi_accidentes.findUnique({
      where: { id_casi_accidente },
    });
    
    if (!caso) {
      throw new AppError("El caso de casi-accidente indicado no existe", 404);
    }

    // --- MÁQUINA DE ESTADOS RESTRICTIVA ---
    const ESTADOS_CERRADOS = [12, 13]; // 12: Cerrado sin acciones, 13: Cerrado con acciones
    const ESTADO_ANULADO = 14;         // 14: Anulado

    if (caso.id_estado === ESTADO_ANULADO) {
      throw new AppError("Transición ilegal: No se pueden asignar acciones a un caso anulado", 409);
    }
    if (ESTADOS_CERRADOS.includes(caso.id_estado as number)) {
      throw new AppError("Transición ilegal: No se pueden asignar acciones a un caso cerrado", 409);
    }

    // 2. Validar que el usuario responsable exista
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: Number(data.id_usuario_responsable) },
    });
    
    if (!usuario) {
      throw new AppError("El usuario responsable indicado no existe", 404);
    }

    // --- TRANSACCIÓN ATÓMICA Y TRAZABILIDAD ---
    try {
      return await prisma.$transaction(async (tx) => {
        
        // A. Crear la Acción Correctiva
        const nuevaAccion = await tx.acciones_correctivas.create({
          data: {
            id_casi_accidente,
            descripcion: data.descripcion,
            id_usuario_responsable: Number(data.id_usuario_responsable),
            prioridad: data.prioridad || "MEDIA",
            fecha_compromiso: new Date(data.fecha_compromiso),
            estado: "PENDIENTE"
          },
        });

        // B. Actualizar la fecha de modificación del caso
        await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: { actualizado_en: new Date() },
        });

        // C. Registrar en la bitácora (para la auditoría / línea de tiempo)
        await tx.bitacora.create({
          data: {
            accion: `El usuario ${data.id_usuario_creador} asignó una acción correctiva al usuario ${data.id_usuario_responsable}`,
            fecha_accion: new Date(),
            id_casi_accidente: id_casi_accidente,
            id_usuario: data.id_usuario_creador
          },
        });

        return nuevaAccion;
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error en la transacción al crear la acción correctiva: ${error.message}`, 500);
    }
  },
};