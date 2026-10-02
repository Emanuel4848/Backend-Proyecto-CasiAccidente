CREATE TABLE "sesiones_activas" (
    "session_id" UUID NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "sesiones_activas_pkey" PRIMARY KEY ("session_id")
);

CREATE INDEX "sesiones_activas_id_usuario_creado_en_idx" ON "sesiones_activas"("id_usuario", "creado_en");
CREATE INDEX "sesiones_activas_expira_en_idx" ON "sesiones_activas"("expira_en");
ALTER TABLE "sesiones_activas" ADD CONSTRAINT "sesiones_activas_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;
