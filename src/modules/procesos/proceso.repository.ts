import prisma from "../../config/prisma";

export const procesoRepository = {
  findAll() {
    return prisma.procesos.findMany({ orderBy: { id_proceso: "asc" } });
  },
  findById(id_proceso: number) {
    return prisma.procesos.findUnique({ where: { id_proceso } });
  },
  findByNombre(nombre: string) {
    return prisma.procesos.findFirst({ where: { nombre } });
  },
  create(data: { nombre: string; descripcion: string | null; activo: boolean }) {
    return prisma.procesos.create({ data });
  },
  update(id_proceso: number, data: { nombre?: string; descripcion?: string | null; activo?: boolean }) {
    return prisma.procesos.update({ where: { id_proceso }, data });
  },
  softDelete(id_proceso: number) {
    return prisma.procesos.update({ where: { id_proceso }, data: { activo: false } });
  },
};
