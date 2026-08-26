import prisma from "../../config/prisma";

export const historialRepository = {
  findCasoByNumeroCaso(numeroCaso: string) {
    return prisma.casi_accidentes.findUnique({
      where: { numero_caso: numeroCaso },
      select: {
        id_casi_accidente: true,
        numero_caso: true,
        titulo: true,
      },
    });
  },

  async obtenerPorNumeroCaso(numeroCaso: string) {
    // La tabla bitacora se deja fuera de esta respuesta porque es texto libre y
    // redundante con historial. Historial es el log estructurado que permite
    // mostrar estado origen/destino, usuario, motivo y fecha de forma consistente.
    return prisma.historial.findMany({
      where: { casi_accidentes: { numero_caso: numeroCaso } },
      include: {
        usuarios: true,
        casi_accidentes: { select: { numero_caso: true, titulo: true } },
        estados_historial_id_estado_origenToestados: true,
        estados_historial_id_estado_destinoToestados: true,
      },
      orderBy: { fecha: "asc" },
    });
  },
};