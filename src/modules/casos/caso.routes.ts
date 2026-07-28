import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { casoController } from "./caso.controller";

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
router.patch('/:id/procedencia', casoController.validarProcedencia);
router.patch('/:id/responsable', casoController.gestionarResponsable);
router.patch('/:id/syma', casoController.gestionarSyma);
router.patch('/:id/prl', casoController.gestionarPrl);

export default router;