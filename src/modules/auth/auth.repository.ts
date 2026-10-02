import prisma from "../../config/prisma";

export const authRepository = {
  removeExpiredSessions() {
    return prisma.sesiones_activas.deleteMany({ where: { expira_en: { lte: new Date() } } });
  },
  findActiveSessions(id_usuario: number) {
    return prisma.sesiones_activas.findMany({ where: { id_usuario, expira_en: { gt: new Date() } }, orderBy: { creado_en: "asc" } });
  },
  deleteSession(session_id: string) {
    return prisma.sesiones_activas.deleteMany({ where: { session_id } });
  },
  createSession(session_id: string, id_usuario: number, expira_en: Date) {
    return prisma.sesiones_activas.create({ data: { session_id, id_usuario, expira_en } });
  },
  isSessionActive(session_id: string) {
    return prisma.sesiones_activas.findFirst({ where: { session_id, expira_en: { gt: new Date() } }, select: { session_id: true } });
  },
  findUserByCorreo(correo: string) {
    return prisma.usuarios.findUnique({
      where: { correo },
      include: {
        usuario_roles: {
          where: {
            roles: {
              activo: true,
            },
          },
          include: {
            roles: true,
          },
        },
      },
    });
  },
};
