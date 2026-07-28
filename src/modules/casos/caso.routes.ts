import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { casoController } from "./caso.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", casoController.create);
router.get("/", casoController.getAll);
router.get("/bandeja", casoController.getBandeja);
router.get("/:id", casoController.getById);
router.put("/:id", casoController.update);
router.delete("/:id", casoController.remove);
router.patch("/:id/reactivar", casoController.reactivar);
router.patch("/:id/rechazar", casoController.rechazar);
router.patch("/:id/cerrar", casoController.cerrar);
router.post("/:id/evaluar", casoController.evaluar);
router.patch('/:id/procedencia', authMiddleware, casoController.validarProcedencia);
router.get("/bandeja/conteo", authMiddleware, casoController.contarBandeja.bind(casoController));
router.get('/regiones', authMiddleware, casoController.getRegiones.bind(casoController));

export default router;