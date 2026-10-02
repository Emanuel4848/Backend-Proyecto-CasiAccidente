import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { casoController } from "./caso.controller";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { ROLE_IDS } from "../../utils/role-ids";

const router = Router();

router.use(authMiddleware);

router.post("/", casoController.create);
router.get("/", casoController.getAll);
router.get("/bandeja", casoController.getBandeja);
router.get("/bandeja/conteo", casoController.contarBandeja.bind(casoController));
router.get('/regiones', casoController.getRegiones.bind(casoController));
router.get('/acciones-correctivas', casoController.getAccionesCorrectivas);
router.get("/:id", casoController.getById);
router.put("/:id", casoController.update);
router.delete("/:id", casoController.remove);
router.patch("/:id/reactivar", casoController.reactivar);
router.patch("/:id/rechazar", casoController.rechazar);
router.patch("/:id/cerrar", casoController.cerrar);
router.post("/:id/evaluar", casoController.evaluar);
router.patch('/:id/procedencia', roleMiddleware(ROLE_IDS.PRL_CONTRATISTA), casoController.validarProcedencia);
router.patch('/:id/responsable', roleMiddleware(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.RESPONSABLE_PROCESO), casoController.gestionarResponsable);
router.patch('/:id/syma', roleMiddleware(ROLE_IDS.GESTOR_SYMA, ROLE_IDS.GESTION_CONTROL_SYMA), casoController.gestionarSyma);
router.patch('/:id/prl', roleMiddleware(ROLE_IDS.PRL_CONTRATISTA), casoController.gestionarPrl);

export default router;
