import { historialRepository } from "./historial.repository";

export const historialService = {
  async obtenerPorNumeroCaso(numeroCaso: string) {
    const numero = numeroCaso.trim();

    if (!numero) {
      return null;
    }

    const caso = await historialRepository.findCasoByNumeroCaso(numero);

    if (!caso) {
      return null;
    }

    const historial = await historialRepository.obtenerPorNumeroCaso(numero);

    return {
      caso,
      historial: historial.map((h: any) => {
        const nombreEstadoDestino = h.estados_historial_id_estado_destinoToestados?.nombre || "Actualizado";

        return {
          id_historial: h.id_historial,
          accion: h.accion,
          estado: nombreEstadoDestino,
          comentario: h.motivo || h.comentario || "",
          fecha: h.fecha,
          usuario: h.usuarios?.nombre || h.usuarios?.correo || `Usuario #${h.id_usuario_accion}`,
          estado_origen: h.estados_historial_id_estado_origenToestados?.nombre || "Estado inicial",
          estado_destino: nombreEstadoDestino,
        };
      }),
    };
  },
};