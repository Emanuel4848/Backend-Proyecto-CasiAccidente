import { DashboardFilters, dashboardRepository } from "./dashboard.repository";

export const dashboardService = {
  getSummary(filters?: DashboardFilters) {
    return dashboardRepository.getSummary(filters);
  },

  getAcceptedRejected(filters?: DashboardFilters) {
    return dashboardRepository.getAcceptedRejected(filters);
  },

  getByStatus(filters?: DashboardFilters) {
    return dashboardRepository.getByStatus(filters);
  },

  getByBrigade(filters?: DashboardFilters) {
    return dashboardRepository.getByBrigade(filters);
  },

  getByProcess(filters?: DashboardFilters) {
    return dashboardRepository.getByProcess(filters);
  },

  getStageFlow(filters?: DashboardFilters) {
    return dashboardRepository.getStageFlow(filters);
  },

  getCorrectiveActionProgress(filters?: DashboardFilters) {
    return dashboardRepository.getCorrectiveActionProgress(filters);
  },

  getTimeByStage(filters?: DashboardFilters) {
    return dashboardRepository.getTimeByStage(filters);
  },

  getMonthlyByStage(filters?: DashboardFilters) {
    return dashboardRepository.getMonthlyByStage(filters);
  },

  getFilterOptions() {
    return dashboardRepository.getFilterOptions();
  },
};
