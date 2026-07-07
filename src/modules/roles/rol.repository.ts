import prisma from "../../config/prisma";

export const rolRepository = {
  findAll() {
    return prisma.roles.findMany({
      where: { activo: true },
      orderBy: { id_rol: "asc" },
    });
  },
};
