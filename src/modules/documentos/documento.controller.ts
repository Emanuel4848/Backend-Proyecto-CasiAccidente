import { Response, NextFunction } from "express";
import { DocumentoService } from "./documento.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

const service = new DocumentoService();

export class DocumentoController {

    async subir(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado."
                });
            }

            const archivos = req.files as Express.Multer.File[];
            if (!archivos || archivos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Debe seleccionar al menos un archivo."
                });
            }

            const documentos = await service.subirDocumentos(
                archivos, 
                req.body, 
                req.user!.id_usuario
            );

            return res.status(201).json({
                success: true,
                message: "Documentos cargados correctamente.",
                data: documentos
            });

        } catch (error) {
            next(error);
        }
    }

    async listarPorCaso(req: AuthRequest, res: Response, next: NextFunction
    ) {
        try {
            const idCaso = Number(req.params.idCaso);
            const documentos = await service.listarPorCaso(idCaso);

            return res.json({
                success: true,
                data: documentos
            });

        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req: AuthRequest, res: Response, next: NextFunction
    ) {
        try {
            const id = Number(req.params.id);
            const documento = await service.obtenerDocumento(id);

            return res.json({
                success: true,
                data: documento
            });

        } catch (error) {
            next(error);
        }
    }

    async obtenerUrl(req: AuthRequest, res: Response, next: NextFunction
    ) {
        try {
            const id = Number(req.params.id);
            const url = await service.obtenerUrlDescarga(id);

            return res.json({
                success: true,
                data: {
                    url
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async eliminar(req: AuthRequest, res: Response, next: NextFunction
    ) {
        try {
            const id = Number(req.params.id);
            await service.eliminarDocumento(id);
            return res.json({
                success: true,
                message: "Documento eliminado correctamente."
            });
        } catch (error) {
            next(error);
        }
    }
}