import prisma from "../../config/prisma";

const includeCatalogs = {
  regiones: true,
  procesos: true,
  contratistas: true,
};

export const brigadaRepository = {
  findAll() {
    return prisma.brigadas.findMany({
      orderBy: { id_brigada: "asc" },
      include: includeCatalogs,
    });
  },
  findById(id_brigada: number) {
    return prisma.brigadas.findUnique({
      where: { id_brigada },
      include: includeCatalogs,
    });
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
    id_proceso: number | null;
    id_contratista: number | null;
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
      id_proceso?: number | null;
      id_contratista?: number | null;
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
};
