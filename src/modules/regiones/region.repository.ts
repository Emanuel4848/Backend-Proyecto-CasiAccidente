import prisma from "../../config/prisma";

export const regionRepository = {
  findAll() {
    return prisma.regiones.findMany({ orderBy: { id_region: "asc" } });
  },
  findById(id_region: number) {
    return prisma.regiones.findUnique({ where: { id_region } });
  },
  findByNombre(nombre: string) {
    return prisma.regiones.findFirst({ where: { nombre } });
  },
  create(data: { nombre: string; descripcion: string | null; activo: boolean }) {
    return prisma.regiones.create({ data });
  },
  update(id_region: number, data: { nombre?: string; descripcion?: string | null; activo?: boolean }) {
    return prisma.regiones.update({ where: { id_region }, data });
  },
  softDelete(id_region: number) {
    return prisma.regiones.update({ where: { id_region }, data: { activo: false } });
  },
};
