import prisma from "../../config/prisma";

type DurationByStageRow = {
  id_estado: number | null;
  nombre: string | null;
  movimientos: bigint;
  horas_promedio: number | null;
};

const toNumber = (value: bigint | number | null | undefined) => Number(value ?? 0);

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const resolveOutcomeGroup = (estado: string | null, procede: boolean | null) => {
  const normalizedState = normalizeText(estado);

  if (normalizedState.includes("rechaz") || normalizedState.includes("anulad")) {
    return "Rechazados o anulados";
  }

  if (
    normalizedState.includes("resuelt") ||
    normalizedState.includes("cerrad") ||
    normalizedState.includes("finaliz") ||
    normalizedState.includes("complet")
  ) {
    return "Resueltos";
  }

  if (procede === true) {
    return "Resueltos";
  }

  if (procede === false) {
    return "Rechazados o anulados";
  }

  return "En proceso";
};

export const dashboardRepository = {
  async getSummary() {
    const [
      cases,
      totalAcciones,
      accionesAbiertas,
      avanceAcciones,
    ] = await Promise.all([
      prisma.casi_accidentes.findMany({
        select: {
          procede: true,
          estados: {
            select: { nombre: true },
          },
        },
      }),
      prisma.acciones_correctivas.count(),
      prisma.acciones_correctivas.count({
        where: {
          OR: [
            { estado: null },
            { estado: { notIn: ["Finalizada", "Finalizado", "Completada", "Completado", "Cerrada", "Cerrado"] } },
          ],
        },
      }),
      prisma.acciones_correctivas.aggregate({
        _avg: { porcentaje_avance: true },
      }),
    ]);

    const outcomeTotals = cases.reduce(
      (totals, item) => {
        const group = resolveOutcomeGroup(item.estados?.nombre ?? null, item.procede);

        if (group === "Resueltos") totals.resueltos += 1;
        else if (group === "Rechazados o anulados") totals.rechazadosAnulados += 1;
        else totals.enProceso += 1;

        return totals;
      },
      { enProceso: 0, resueltos: 0, rechazadosAnulados: 0 }
    );

    return {
      totalCasos: cases.length,
      casosAceptados: outcomeTotals.resueltos,
      casosRechazados: outcomeTotals.rechazadosAnulados,
      casosPendientes: outcomeTotals.enProceso,
      enProceso: outcomeTotals.enProceso,
      resueltos: outcomeTotals.resueltos,
      rechazadosAnulados: outcomeTotals.rechazadosAnulados,
      totalAcciones,
      accionesAbiertas,
      avancePromedioAcciones: Math.round(avanceAcciones._avg.porcentaje_avance ?? 0),
    };
  },

  async getAcceptedRejected() {
    const cases = await prisma.casi_accidentes.findMany({
      select: {
        procede: true,
        estados: {
          select: { nombre: true },
        },
      },
    });

    const grouped = new Map([
      ["En proceso", 0],
      ["Resueltos", 0],
      ["Rechazados o anulados", 0],
    ]);

    for (const item of cases) {
      const group = resolveOutcomeGroup(item.estados?.nombre ?? null, item.procede);
      grouped.set(group, (grouped.get(group) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([estado, valor]) => ({ estado, valor }))
      .filter((item) => item.valor > 0);
  },

  async getByStatus() {
    const rows = await prisma.casi_accidentes.groupBy({
      by: ["id_estado"],
      _count: { _all: true },
      orderBy: { _count: { id_estado: "desc" } },
    });

    const estados = await prisma.estados.findMany({
      where: { id_estado: { in: rows.map((row) => row.id_estado).filter((id): id is number => id !== null) } },
      select: { id_estado: true, nombre: true },
    });

    const estadoPorId = new Map(estados.map((estado) => [estado.id_estado, estado.nombre]));

    return rows.map((row) => ({
      id_estado: row.id_estado,
      nombre: row.id_estado ? estadoPorId.get(row.id_estado) ?? "Sin nombre" : "Sin estado",
      total: row._count._all,
    }));
  },

  async getByBrigade() {
    const rows = await prisma.casi_accidentes.groupBy({
      by: ["id_brigada"],
      _count: { _all: true },
      orderBy: { _count: { id_brigada: "desc" } },
    });

    const brigadas = await prisma.brigadas.findMany({
      where: { id_brigada: { in: rows.map((row) => row.id_brigada).filter((id): id is number => id !== null) } },
      select: { id_brigada: true, nombre: true },
    });

    const brigadaPorId = new Map(brigadas.map((brigada) => [brigada.id_brigada, brigada.nombre]));

    return rows.map((row) => ({
      id_brigada: row.id_brigada,
      nombre: row.id_brigada ? brigadaPorId.get(row.id_brigada) ?? "Sin nombre" : "Sin brigada",
      total: row._count._all,
    }));
  },

  async getCorrectiveActionProgress() {
    const rows = await prisma.acciones_correctivas.groupBy({
      by: ["estado"],
      _count: { _all: true },
      _avg: { porcentaje_avance: true },
      orderBy: { _count: { estado: "desc" } },
    });

    return rows.map((row) => ({
      estado: row.estado ?? "Sin estado",
      total: row._count._all,
      avancePromedio: Math.round(row._avg.porcentaje_avance ?? 0),
    }));
  },

  async getTimeByStage() {
    const rows = await prisma.$queryRaw<DurationByStageRow[]>`
      WITH movimientos AS (
        SELECT
          h.id_casi_accidente,
          h.id_estado_destino AS id_estado,
          h.fecha,
          LEAD(h.fecha) OVER (
            PARTITION BY h.id_casi_accidente
            ORDER BY h.fecha
          ) AS siguiente_fecha
        FROM historial h
        WHERE h.id_estado_destino IS NOT NULL
          AND h.fecha IS NOT NULL
      )
      SELECT
        e.id_estado,
        e.nombre,
        COUNT(*) AS movimientos,
        AVG(EXTRACT(EPOCH FROM (COALESCE(m.siguiente_fecha, NOW()) - m.fecha)) / 3600.0) AS horas_promedio
      FROM movimientos m
      LEFT JOIN estados e ON e.id_estado = m.id_estado
      GROUP BY e.id_estado, e.nombre
      ORDER BY horas_promedio DESC NULLS LAST
    `;

    return rows.map((row) => ({
      id_estado: row.id_estado,
      nombre: row.nombre ?? "Sin estado",
      movimientos: toNumber(row.movimientos),
      horasPromedio: Number(row.horas_promedio ?? 0),
      diasPromedio: Number(((row.horas_promedio ?? 0) / 24).toFixed(2)),
    }));
  },
};
