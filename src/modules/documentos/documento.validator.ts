export class DocumentoValidator {
  static validar(body: any) {
    if (!body.idCaso) {
      throw new Error("El idCaso es obligatorio.");
    }

    if (!body.idTipoDocumento) {
      throw new Error("El tipo de documento es obligatorio.");
    }
  }
}