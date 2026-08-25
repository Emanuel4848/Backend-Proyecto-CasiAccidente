import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import usuarioRoutes from "./modules/usuarios/usuario.routes";
import rolRoutes from "./modules/roles/rol.routes";
import regionRoutes from "./modules/regiones/region.routes";
import procesoRoutes from "./modules/procesos/proceso.routes";
import brigadaRoutes from "./modules/brigadas/brigada.routes";
import contratistaRoutes from "./modules/contratistas/contratista.routes";
import casoRoutes from "./modules/casos/caso.routes";
import documentoRoutes from "./modules/documentos/documento.routes";
import accionCorrectivaRoutes from "./modules/acciones-correctivas/accion-correctiva.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import historialRoutes from "./modules/historial/historial.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import accionesRoutes from "./modules/acciones-correctivas/accion-correctiva.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Casi Accidentes funcionando",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend-casi-accidentes",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/regiones", regionRoutes);
app.use("/api/procesos", procesoRoutes);
app.use("/api/brigadas", brigadaRoutes);
app.use("/api/contratistas", contratistaRoutes);
app.use("/api/casos", casoRoutes);
app.use("/api/documentos", documentoRoutes);
app.use("/api/acciones-correctivas", accionCorrectivaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/acciones", accionesRoutes);

app.use(errorMiddleware);

export default app;
