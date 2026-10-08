import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";

export type DashboardOutcomeFilter = "en_proceso" | "resueltos" | "rechazados_anulados";

export type DashboardFilters = {
  fechaInicio?: Date;
  fechaFin?: Date;
  id_estado?: number;
  id_brigada?: number;
  id_proceso?: number;
  id_region?: number;
  resultado?: DashboardOutcomeFilter;
};

type CaseForOutcome = {
  procede: boolean | null;
  estados: { nombre: string | null } | null;
};

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

const outcomeFilterByGroup: Record<DashboardOutcomeFilter, string> = {
  en_proceso: "En proceso",
  resueltos: "Resueltos",
  rechazados_anulados: "Rechazados o anulados",
};

const buildCaseWhere = (filters: DashboardFilters = {}): Prisma.casi_accidentesWhereInput => ({
  ...(filters.fechaInicio || filters.fechaFin
    ? {
        fecha_reporte: {
          ...(filters.fechaInicio ? { gte: filters.fechaInicio } : {}),
          ...(filters.fechaFin ? { lte: filters.fechaFin } : {}),
        },
      }
    : {}),
  ...(filters.id_estado ? { id_estado: filters.id_estado } : {}),
  ...(filters.id_brigada ? { id_brigada: filters.id_brigada } : {}),
  ...(filters.id_proceso ? { id_proceso: filters.id_proceso } : {}),
  ...(filters.id_region ? { id_region: filters.id_region } : {}),
});

const matchesOutcomeFilter = (item: CaseForOutcome, filters: DashboardFilters = {}) => {
  if (!filters.resultado) return true;

  const group = resolveOutcomeGroup(item.estados?.nombre ?? null, item.procede);
  return group === outcomeFilterByGroup[filters.resultado];
};

const filteredCases = async (filters: DashboardFilters = {}) =>
  prisma.casi_accidentes.findMany({
    where: buildCaseWhere(filters),
    select: {
      id_casi_accidente: true,
      id_estado: true,
      id_brigada: true,
      id_proceso: true,
      fecha_reporte: true,
      procede: true,
      estados: {
        select: { nombre: true },
      },
    },
  });

const buildActionWhere = async (filters: DashboardFilters = {}): Promise<Prisma.acciones_correctivasWhereInput> => {
  if (!Object.keys(filters).length) return {};

  const cases = await filteredCases(filters);
  const caseIds = cases.filter((item) => matchesOutcomeFilter(item, filters)).map((item) => item.id_casi_accidente);

  if (!caseIds.length) {
    return { id_casi_accidente: { in: [] } };
  }

  return { id_casi_accidente: { in: caseIds } };
};

export const dashboardRepository = {
  async getSummary(filters: DashboardFilters = {}) {
    const actionWhere = await buildActionWhere(filters);
    const [
      cases,
      totalAcciones,
      accionesAbiertas,
      avanceAcciones,
    ] = await Promise.all([
      prisma.casi_accidentes.findMany({
        where: buildCaseWhere(filters),
        select: {
          procede: true,
          estados: {
            select: { nombre: true },
          },
        },
      }),
      prisma.acciones_correctivas.count({ where: actionWhere }),
      prisma.acciones_correctivas.count({
        where: {
          ...actionWhere,
          OR: [
            { estado: null },
            { estado: { notIn: ["Finalizada", "Finalizado", "Completada", "Completado", "Cerrada", "Cerrado"] } },
          ],
        },
      }),
      prisma.acciones_correctivas.aggregate({
        where: actionWhere,
        _avg: { porcentaje_avance: true },
      }),
    ]);

    const matchingCases = cases.filter((item) => matchesOutcomeFilter(item, filters));
    const outcomeTotals = matchingCases.reduce(
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
      totalCasos: matchingCases.length,
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

  async getAcceptedRejected(filters: DashboardFilters = {}) {
    const cases = await prisma.casi_accidentes.findMany({
      where: buildCaseWhere(filters),
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

    for (const item of cases.filter((caseItem) => matchesOutcomeFilter(caseItem, filters))) {
      const group = resolveOutcomeGroup(item.estados?.nombre ?? null, item.procede);
      grouped.set(group, (grouped.get(group) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([estado, valor]) => ({ estado, valor }))
      .filter((item) => item.valor > 0);
  },

  async getByStatus(filters: DashboardFilters = {}) {
    const cases = (await filteredCases(filters)).filter((item) => matchesOutcomeFilter(item, filters));
    const totals = new Map<number | null, number>();

    for (const item of cases) {
      totals.set(item.id_estado, (totals.get(item.id_estado) ?? 0) + 1);
    }

    const estados = await prisma.estados.findMany({
      where: { id_estado: { in: Array.from(totals.keys()).filter((id): id is number => id !== null) } },
      select: { id_estado: true, nombre: true },
    });

    const estadoPorId = new Map(estados.map((estado) => [estado.id_estado, estado.nombre]));

    return Array.from(totals.entries())
      .map(([id_estado, total]) => ({
        id_estado,
        nombre: id_estado ? estadoPorId.get(id_estado) ?? "Sin nombre" : "Sin estado",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getByBrigade(filters: DashboardFilters = {}) {
    const cases = (await filteredCases(filters)).filter((item) => matchesOutcomeFilter(item, filters));
    const totals = new Map<number | null, number>();

    for (const item of cases) {
      totals.set(item.id_brigada, (totals.get(item.id_brigada) ?? 0) + 1);
    }

    const brigadas = await prisma.brigadas.findMany({
      where: { id_brigada: { in: Array.from(totals.keys()).filter((id): id is number => id !== null) } },
      select: { id_brigada: true, nombre: true },
    });

    const brigadaPorId = new Map(brigadas.map((brigada) => [brigada.id_brigada, brigada.nombre]));

    return Array.from(totals.entries())
      .map(([id_brigada, total]) => ({
        id_brigada,
        nombre: id_brigada ? brigadaPorId.get(id_brigada) ?? "Sin nombre" : "Sin brigada",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getByProcess(filters: DashboardFilters = {}) {
    const cases = (await filteredCases(filters)).filter((item) => matchesOutcomeFilter(item, filters));
    const totals = new Map<number | null, number>();

    for (const item of cases) {
      totals.set(item.id_proceso, (totals.get(item.id_proceso) ?? 0) + 1);
    }

    const procesos = await prisma.procesos.findMany({
      where: { id_proceso: { in: Array.from(totals.keys()).filter((id): id is number => id !== null) } },
      select: { id_proceso: true, nombre: true },
    });

    const procesoPorId = new Map(procesos.map((proceso) => [proceso.id_proceso, proceso.nombre]));

    return Array.from(totals.entries())
      .map(([id_proceso, total]) => ({
        id_proceso,
        nombre: id_proceso ? procesoPorId.get(id_proceso) ?? "Sin nombre" : "Sin proceso",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getStageFlow(filters: DashboardFilters = {}) {
    const cases = (await filteredCases(filters)).filter((item) => matchesOutcomeFilter(item, filters));
    const totals = new Map<number | null, number>();

    for (const item of cases) {
      totals.set(item.id_estado, (totals.get(item.id_estado) ?? 0) + 1);
    }

    const estados = await prisma.estados.findMany({
      where: { id_estado: { in: Array.from(totals.keys()).filter((id): id is number => id !== null) } },
      select: { id_estado: true, nombre: true, orden: true },
    });

    const estadoPorId = new Map(estados.map((estado) => [estado.id_estado, estado]));
    const totalCasos = cases.length || 1;

    return Array.from(totals.entries())
      .map(([id_estado, total]) => {
        const estado = id_estado ? estadoPorId.get(id_estado) : null;

        return {
          id_estado,
          nombre: estado?.nombre ?? "Sin estado",
          orden: estado?.orden ?? 999,
          total,
          porcentajeTotal: Math.round((total / totalCasos) * 100),
        };
      })
      .sort((a, b) => a.orden - b.orden || b.total - a.total)
      .map((item, index, rows) => ({
        ...item,
        porcentajeAnterior: index === 0 ? 100 : rows[index - 1].total ? Math.round((item.total / rows[index - 1].total) * 100) : 0,
      }));
  },

  async getCorrectiveActionProgress(filters: DashboardFilters = {}) {
    const actionWhere = await buildActionWhere(filters);
    const rows = await prisma.acciones_correctivas.groupBy({
      by: ["estado"],
      where: actionWhere,
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

  async getTimeByStage(filters: DashboardFilters = {}) {
    const cases = await filteredCases(filters);
    const matchingCaseIds = cases
      .filter((item) => matchesOutcomeFilter(item, filters))
      .map((item) => item.id_casi_accidente);

    if (!matchingCaseIds.length) return [];

    const rows = await prisma.historial.findMany({
      where: {
        id_casi_accidente: { in: matchingCaseIds },
        id_estado_destino: { not: null },
        fecha: { not: null },
      },
      select: {
        id_casi_accidente: true,
        id_estado_destino: true,
        fecha: true,
        estados_historial_id_estado_destinoToestados: {
          select: { nombre: true },
        },
      },
      orderBy: [{ id_casi_accidente: "asc" }, { fecha: "asc" }],
    });

    const durations = new Map<number | null, { nombre: string; horas: number[] }>();
    const now = new Date();
    const esTerminal = (nombre: string) => resolveOutcomeGroup(nombre, null) !== "En proceso";

    for (let index = 0; index < rows.length; index += 1) {
      const current = rows[index];
      const nombreEstado = current.estados_historial_id_estado_destinoToestados?.nombre ?? "Sin estado";
      if (esTerminal(nombreEstado)) continue;
      const siguiente = rows[index + 1];
      const nextDate = siguiente?.id_casi_accidente === current.id_casi_accidente && siguiente.fecha ? siguiente.fecha : now;

      const hours = (nextDate.getTime() - current.fecha!.getTime()) / 3600000;
      const stage = durations.get(current.id_estado_destino) ?? {
        nombre: nombreEstado,
        horas: [],
      };

      stage.horas.push(Math.max(hours, 0));
      durations.set(current.id_estado_destino, stage);
    }

    return Array.from(durations.entries())
      .map(([id_estado, item]) => {
        const horasPromedio = item.horas.reduce((sum, value) => sum + value, 0) / item.horas.length;

        return {
          id_estado,
          nombre: item.nombre,
          movimientos: item.horas.length,
          horasPromedio,
          diasPromedio: Number((horasPromedio / 24).toFixed(2)),
        };
      })
      .sort((a, b) => b.horasPromedio - a.horasPromedio);
  },

  async getMonthlyByStage(filters: DashboardFilters = {}) {
    const cases = (await filteredCases(filters))
      .filter((item) => matchesOutcomeFilter(item, filters) && item.fecha_reporte)
      .sort((a, b) => a.fecha_reporte!.getTime() - b.fecha_reporte!.getTime());

    const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const grouped = new Map<string, { periodo: string; mes: string; total: number; etapas: Map<string, number> }>();

    for (const item of cases) {
      const date = item.fecha_reporte!;
      const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const month = grouped.get(periodo) ?? {
        periodo,
        mes: `${monthNames[date.getMonth()]}. ${date.getFullYear()}`,
        total: 0,
        etapas: new Map<string, number>(),
      };
      const stage = item.estados?.nombre ?? "Sin estado";

      month.total += 1;
      month.etapas.set(stage, (month.etapas.get(stage) ?? 0) + 1);
      grouped.set(periodo, month);
    }

    return Array.from(grouped.values()).map((item) => ({
      periodo: item.periodo,
      mes: item.mes,
      total: item.total,
      etapas: Array.from(item.etapas.entries())
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total),
    }));
  },

  async getFilterOptions() {
    const [estados, brigadas, procesos, regiones] = await Promise.all([
      prisma.estados.findMany({
        where: { activo: { not: false } },
        select: { id_estado: true, nombre: true },
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
      prisma.brigadas.findMany({
        where: { activo: { not: false } },
        select: { id_brigada: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.procesos.findMany({
        where: { activo: { not: false } },
        select: { id_proceso: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.regiones.findMany({
        where: { activo: { not: false } },
        select: { id_region: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    return { estados, brigadas, procesos, regiones };
  },
};
