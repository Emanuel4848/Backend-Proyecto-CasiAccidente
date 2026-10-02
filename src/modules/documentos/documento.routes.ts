import { Router } from "express";
import { DocumentoController } from "./documento.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();
const controller = new DocumentoController();

router.post(
    "/",
    authMiddleware,
    roleMiddleware(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.PRL_CONTRATISTA),
    upload.array("archivos", 10),
    controller.subir.bind(controller)
);

router.get(
    "/caso/id/:idCaso",
    authMiddleware,
    controller.listarPorCaso.bind(controller)
);

router.get(
    "/caso/numero/:numeroCaso",
    authMiddleware,
    controller.obtenerPorNumeroCaso.bind(controller)
);

router.get(
    "/:id",
    authMiddleware,
    controller.obtenerPorId.bind(controller)
);

router.get(
    "/:id/url",
    authMiddleware,
    controller.obtenerUrl.bind(controller)
);

router.delete(
    "/:id",
    authMiddleware,
    controller.eliminar.bind(controller)
);

export default router;
