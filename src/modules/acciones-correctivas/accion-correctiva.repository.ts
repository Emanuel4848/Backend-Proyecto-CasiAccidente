import prisma from "../../config/prisma";

export const accionCorrectivaRepository = {
  findAll: async () => {
    return prisma.acciones_correctivas.findMany({
      include: {
        casi_accidentes: true,
        usuarios: true,
      },
    });
  },

  async create(data: {
    id_casi_accidente: number;
    descripcion: string;
    id_usuario_responsable: number;
    prioridad: string;
    fecha_compromiso: Date;
  }) {
    return prisma.acciones_correctivas.create({
      data: {
        id_casi_accidente: data.id_casi_accidente,
        descripcion: data.descripcion,
        id_usuario_responsable: data.id_usuario_responsable,
        prioridad: data.prioridad,
        fecha_compromiso: data.fecha_compromiso,
        porcentaje_avance: 0,
        estado: "PENDIENTE",
      },
    });
  },
};