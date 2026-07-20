import prisma from "../../config/prisma";
import { DocumentoRepository } from "./documento.repository";
import { DocumentoStorage } from "./documento.storage";
import { DocumentoValidator } from "./documento.validator";

export class DocumentoService {

  private repository = new DocumentoRepository();
  private storage = new DocumentoStorage();

  async subirDocumento(archivo: Express.Multer.File, body: any, usuarioId: number
  ) {

    DocumentoValidator.validar(body);

    const idCaso = Number(body.idCaso);
    const idTipoDocumento = Number(body.idTipoDocumento);

    const ultimoDocumento =
      await this.repository.obtenerUltimaVersion(
        idCaso,
        idTipoDocumento
      );

    const version =
      ultimoDocumento
        ? ultimoDocumento.version! + 1
        : 1;

    if (Number.isNaN(idCaso)) {
      throw new Error("idCaso inválido.");
    }


    if (Number.isNaN(idTipoDocumento)) {
      throw new Error("idTipoDocumento inválido.");
    }

    const caso = await prisma.casi_accidentes.findUnique({
      where: {
        id_casi_accidente: idCaso,
      },
    });

    if (!caso) {
      throw new Error("El caso no existe.");
    }

    if (!caso.numero_caso) {
      throw new Error("El caso no tiene número.");
    }

    const tipoDocumento = await prisma.tipos_documento.findUnique({
      where: {
        id_tipo_documento: idTipoDocumento,
      },
    });

    if (!tipoDocumento) {
      throw new Error("Tipo de documento inválido.");
    }

    const ruta =
      await this.storage.subirArchivo(archivo, caso.numero_caso, tipoDocumento.nombre!, version
      );

    return this.repository.crear({
      nombre_archivo: archivo.originalname,
      ruta_archivo: ruta,
      descripcion: body.descripcion ?? null,
      version: version,
      subido_en: new Date(),

      usuarios: {
        connect: {
          id_usuario: usuarioId,
        },
      },

      tipos_documento: {
        connect: {
          id_tipo_documento: idTipoDocumento,
        },
      },

      casi_accidentes: {
        connect: {
          id_casi_accidente: idCaso,
        },
      },

    });
  }

  async listarPorCaso(idCaso: number) {
    return this.repository.buscarPorCaso(idCaso);
  }

  async obtenerDocumento(id: number) {
    const documento = await this.repository.buscarPorId(id);

    if (!documento) {
      throw new Error("Documento no encontrado.");
    }
    return documento;
  }

  async obtenerUrlDescarga(id: number) {
    const documento = await this.obtenerDocumento(id);

    if (!documento.ruta_archivo) {
      throw new Error("El documento no tiene ruta.");
    }
    return this.storage.obtenerUrl(documento.ruta_archivo);
  }

  async eliminarDocumento(id: number) {
    const documento = await this.obtenerDocumento(id);

    if (documento.ruta_archivo) {
      await this.storage.eliminarArchivo(documento.ruta_archivo);
    }
    await this.repository.eliminar(id);
  }
}