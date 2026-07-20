import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";

export class DocumentoRepository {

  async crear(data: Prisma.documentosCreateInput) {
    return prisma.documentos.create({
      data,
      include: {
        tipos_documento: true,
        usuarios: true,
      },
    });
  }

  async buscarPorId(id: number) {
    return prisma.documentos.findUnique({
      where: {
        id_documento: id,
      },
      include: {
        casi_accidentes: true,
        tipos_documento: true,
        usuarios: true,
      },
    });
  }

  async buscarPorCaso(idCaso: number) {
    return prisma.documentos.findMany({
      where: {
        id_casi_accidente: idCaso,
      },
      include: {
        tipos_documento: true,
        usuarios: true,
      },
      orderBy: {
        subido_en: "desc",
      },
    });
  }

  async eliminar(id: number) {
    return prisma.documentos.delete({
      where: {
        id_documento: id,
      },
    });
  }

  async obtenerUltimaVersion(idCaso: number, idTipoDocumento: number
  ) {

    return prisma.documentos.findFirst({
      where: {
        id_casi_accidente: idCaso, id_tipo_documento: idTipoDocumento
      },

      orderBy: {
        version: "desc"
      }
    });
  }

}