import prisma from "../../config/prisma";

const includeRoles = {
  usuario_roles: {
    include: {
      roles: true,
    },
  },
};

export const usuarioRepository = {
  findAll() {
    return prisma.usuarios.findMany({
      orderBy: { id_usuario: "asc" },
      include: includeRoles,
    });
  },

  findById(id_usuario: number) {
    return prisma.usuarios.findUnique({
      where: { id_usuario },
      include: includeRoles,
    });
  },

  findByCorreo(correo: string) {
    return prisma.usuarios.findUnique({
      where: { correo },
    });
  },

  findRolById(id_rol: number) {
    return prisma.roles.findUnique({
      where: { id_rol },
    });
  },

  create(data: { nombre: string; correo: string; password: string; id_rol: number; activo: boolean }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.usuarios.create({
        data: {
          nombre: data.nombre,
          correo: data.correo,
          password: data.password,
          activo: data.activo,
          creado_en: new Date(),
        },
      });

      await tx.usuario_roles.create({
        data: {
          id_usuario: user.id_usuario,
          id_rol: data.id_rol,
        },
      });

      return tx.usuarios.findUnique({
        where: { id_usuario: user.id_usuario },
        include: includeRoles,
      });
    });
  },

  update(
    id_usuario: number,
    data: { nombre?: string; correo?: string; password?: string; id_rol?: number; activo?: boolean }
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.usuarios.update({
        where: { id_usuario },
        data: {
          nombre: data.nombre,
          correo: data.correo,
          password: data.password,
          activo: data.activo,
        },
      });

      if (data.id_rol) {
        await tx.usuario_roles.deleteMany({ where: { id_usuario } });
        await tx.usuario_roles.create({
          data: {
            id_usuario,
            id_rol: data.id_rol,
          },
        });
      }

      return tx.usuarios.findUnique({
        where: { id_usuario },
        include: includeRoles,
      });
    });
  },

  softDelete(id_usuario: number) {
    return prisma.usuarios.update({
      where: { id_usuario },
      data: { activo: false },
      include: includeRoles,
    });
  },
};
