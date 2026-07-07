import prisma from "../../config/prisma";

export const contratistaRepository = {
  findAll() {
    return prisma.contratistas.findMany({ orderBy: { id_contratista: "asc" } });
  },
  findById(id_contratista: number) {
    return prisma.contratistas.findUnique({ where: { id_contratista } });
  },
  create(data: { nombre: string; correo: string | null; telefono: string | null; activo: boolean }) {
    return prisma.contratistas.create({ data });
  },
  update(
    id_contratista: number,
    data: { nombre?: string; correo?: string | null; telefono?: string | null; activo?: boolean }
  ) {
    return prisma.contratistas.update({ where: { id_contratista }, data });
  },
  softDelete(id_contratista: number) {
    return prisma.contratistas.update({ where: { id_contratista }, data: { activo: false } });
  },
};
