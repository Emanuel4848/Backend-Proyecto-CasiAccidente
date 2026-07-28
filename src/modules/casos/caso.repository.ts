import prisma from "../../config/prisma";

const includeCatalogs = {
  regiones: true,
  procesos: true,
  brigadas: true,
  contratistas: true,
  estados: true,
};

const ESTADO_ANULADO_ID = 14;

export const casoRepository = {
  countByYear(year: number) {
    return prisma.casi_accidentes.count({
      where: {
        fecha_reporte: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
  },
  findRegionById(id_region: number) {
    return prisma.regiones.findUnique({ where: { id_region } });
  },
  findProcesoById(id_proceso: number) {
    return prisma.procesos.findUnique({ where: { id_proceso } });
  },
  findBrigadaById(id_brigada: number) {
    return prisma.brigadas.findUnique({ where: { id_brigada } });
  },
  findContratistaById(id_contratista: number) {
    return prisma.contratistas.findUnique({ where: { id_contratista } });
  },
  create(
    data: {
      numero_caso: string;
      titulo: string;
      descripcion: string;
      fecha_reporte: Date;
      id_region: number;
      id_proceso: number;
      id_brigada: number;
      id_contratista: number | null;
      id_estado: number;
      id_usuario_creacion: number;
      id_usuario_actual: number;
    },
    id_usuario_accion: number
  ) {
    return prisma.$transaction(
      async (tx) => {
        const ahora = new Date();

        const caso = await tx.casi_accidentes.create({
          data: {
            ...data,
            creado_en: ahora,
            actualizado_en: ahora,
          },
          include: includeCatalogs,
        });

        await tx.historial.create({
          data: {
            id_casi_accidente: caso.id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: null,
            id_estado_destino: caso.id_estado,
            accion: "Creacion",
            comentario: "Registro inicial del casi accidente",
            fecha: ahora,
          },
        });

        return caso;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );
  },
  findAll(filters: { id_region?: number; id_estado?: number; id_brigada?: number }) {
    return prisma.casi_accidentes.findMany({
      where: {
        id_region: filters.id_region,
        id_estado: filters.id_estado,
        id_brigada: filters.id_brigada,
      },
      orderBy: { creado_en: "desc" },
      include: includeCatalogs,
    });
  },
  findById(id_casi_accidente: number) {
    return prisma.casi_accidentes.findUnique({
      where: { id_casi_accidente },
      include: includeCatalogs,
    });
  },

  update(id_casi_accidente: number, data: Record<string, unknown>) {
    return prisma.casi_accidentes.update({
      where: { id_casi_accidente },
      data: { ...data, actualizado_en: new Date() },
      include: includeCatalogs,
    });
  },

  anular(id_casi_accidente: number, id_estado_origen: number, id_usuario_accion: number, motivo: string | null) {
    return prisma.$transaction(
      async (tx) => {
        const ahora = new Date();

        const caso = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: { id_estado: ESTADO_ANULADO_ID, actualizado_en: ahora },
          include: includeCatalogs,
        });

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen,
            id_estado_destino: ESTADO_ANULADO_ID,
            accion: "Anulacion",
            motivo: motivo ?? "Sin motivo especificado",
            fecha: ahora,
          },
        });

        return caso;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );
  },

  findUltimaAnulacion(id_casi_accidente: number) {
    return prisma.historial.findFirst({
      where: { id_casi_accidente, accion: "Anulacion" },
      orderBy: { fecha: "desc" },
    });
  },

  reactivar(id_casi_accidente: number, id_estado_destino: number, id_usuario_accion: number) {
    return prisma.$transaction(
      async (tx) => {
        const ahora = new Date();

        const caso = await tx.casi_accidentes.update({
          where: { id_casi_accidente },
          data: { id_estado: id_estado_destino, actualizado_en: ahora },
          include: includeCatalogs,
        });

        await tx.historial.create({
          data: {
            id_casi_accidente,
            id_usuario_accion,
            id_estado_origen: ESTADO_ANULADO_ID,
            id_estado_destino,
            accion: "Reactivacion",
            comentario: "Caso reactivado, restaurado al estado previo a la anulacion",
            fecha: ahora,
          },
        });

        return caso;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );
  },
};