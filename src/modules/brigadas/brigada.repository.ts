import prisma from "../../config/prisma";

const includeCatalogs = {
  regiones: true,
  procesos: true,
  contratistas: true,
  brigada_asignacion: {
    where: { activo: true },
    include: {
      usuarios_prl: { select: { id_usuario: true, nombre: true, correo: true } },
      usuarios_responsable: { select: { id_usuario: true, nombre: true, correo: true } },
    },
    take: 1 as const,
  },
};

export const brigadaRepository = {
  findAll(params?: { search?: string; take?: number }) {
    const { search, take } = params ?? {};
    return prisma.brigadas.findMany({
      where: search
        ? { nombre: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { id_brigada: "asc" },
      include: includeCatalogs,
      take: take ?? undefined,
    });
  },
  findById(id_brigada: number) {
    return prisma.brigadas.findUnique({
      where: { id_brigada },
      include: includeCatalogs,
    });
  },
  async findCatalogos() {
    const [regiones, procesos, contratistas] = await Promise.all([
      prisma.regiones.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.procesos.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.contratistas.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    return {
      regiones,
      procesos,
      contratistas,
    };
  },
  findRegionById(id_region: number) {
    return prisma.regiones.findUnique({ where: { id_region } });
  },
  findProcesoById(id_proceso: number) {
    return prisma.procesos.findUnique({ where: { id_proceso } });
  },
  findContratistaById(id_contratista: number) {
    return prisma.contratistas.findUnique({ where: { id_contratista } });
  },
  create(data: {
    nombre: string;
    id_region: number | null;
    activo: boolean;
  }) {
    return prisma.brigadas.create({
      data,
      include: includeCatalogs,
    });
  },
  update(
    id_brigada: number,
    data: {
      nombre?: string;
      id_region?: number | null;
      activo?: boolean;
    }
  ) {
    return prisma.brigadas.update({
      where: { id_brigada },
      data,
      include: includeCatalogs,
    });
  },
  softDelete(id_brigada: number) {
    return prisma.brigadas.update({
      where: { id_brigada },
      data: { activo: false },
      include: includeCatalogs,
    });
  },
  findAsignacionActiva(id_brigada: number) {
    return prisma.brigada_asignacion.findFirst({
      where: { id_brigada, activo: true },
    });
  },
  async setAsignacion(
    id_brigada: number,
    data: { id_usuario_prl: number | null; id_usuario_responsable: number | null }
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.brigada_asignacion.updateMany({
        where: { id_brigada, activo: true },
        data: { activo: false },
      });
      return tx.brigada_asignacion.create({
        data: {
          id_brigada,
          id_usuario_prl: data.id_usuario_prl,
          id_usuario_responsable: data.id_usuario_responsable,
          activo: true,
        },
        include: {
          usuarios_prl: { select: { id_usuario: true, nombre: true, correo: true } },
          usuarios_responsable: { select: { id_usuario: true, nombre: true, correo: true } },
        },
      });
    });
  },
};
