import prisma from "../../config/prisma";

export const authRepository = {
  findUserByCorreo(correo: string) {
    return prisma.usuarios.findUnique({
      where: { correo },
      include: {
        rol: true,
      },
    });
  },
};
