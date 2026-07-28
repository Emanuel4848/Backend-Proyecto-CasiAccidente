import prisma from "../../config/prisma";
import { DocumentoRepository } from "./documento.repository";
import { DocumentoStorage } from "./documento.storage";
import { DocumentoValidator } from "./documento.validator";

export class DocumentoService {

  private repository = new DocumentoRepository();
  private storage = new DocumentoStorage();

  async subirDocumentos(archivos: Express.Multer.File[], body: any, usuarioId: number) {
    DocumentoValidator.validar(body);

    const idCaso = Number(body.idCaso);
    const idTipoDocumento = Number(body.idTipoDocumento);

    if (Number.isNaN(idCaso)) {
      throw new Error("idCaso inválido.");
    }

    if (Number.isNaN(idTipoDocumento)) {
      throw new Error("idTipoDocumento inválido.");
    }

    if (!archivos || archivos.length === 0) {
      throw new Error("Debe seleccionar al menos un archivo.");
    }

    const caso = await prisma.casi_accidentes.findUnique({
      where: { id_casi_accidente: idCaso },
    });

    if (!caso) throw new Error("El caso no existe.");
    if (!caso.numero_caso) throw new Error("El caso no tiene número.");

    const tipoDocumento = await prisma.tipos_documento.findUnique({
      where: { id_tipo_documento: idTipoDocumento },
    });

    if (!tipoDocumento) throw new Error("Tipo de documento inválido.");

    // Obtener la última versión actual en la BD para este tipo y caso
    const ultimoDocumento = await this.repository.obtenerUltimaVersion(idCaso, idTipoDocumento);
    let versionActual = ultimoDocumento ? ultimoDocumento.version! : 0;

    const documentosCreados = [];

    // Iterar sobre cada archivo recibido en el lote
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      versionActual++; // Incrementa la versión de forma secuencial por cada archivo del lote

      // Maneja comentarios independientes por archivo (si se envían en array) o un comentario general/nulo
      const descripcion = (body.descripciones && body.descripciones[i]) 
        ? body.descripciones[i] 
        : (body.descripcion ?? null);

      const ruta = await this.storage.subirArchivo(
        archivo,
        caso.numero_caso,
        tipoDocumento.nombre!,
        versionActual
      );

      const documentoCreado = await this.repository.crear({
        nombre_archivo: archivo.originalname,
        ruta_archivo: ruta,
        descripcion: descripcion,
        version: versionActual,
        subido_en: new Date(),

        usuarios: {
          connect: { id_usuario: usuarioId },
        },

        tipos_documento: {
          connect: { id_tipo_documento: idTipoDocumento },
        },

        casi_accidentes: {
          connect: { id_casi_accidente: idCaso },
        },
      });

      documentosCreados.push(documentoCreado);
    }

    return documentosCreados;
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