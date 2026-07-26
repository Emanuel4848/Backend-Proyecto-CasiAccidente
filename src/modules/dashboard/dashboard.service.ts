import { dashboardRepository } from "./dashboard.repository";

export const dashboardService = {
  getSummary() {
    return dashboardRepository.getSummary();
  },

  getAcceptedRejected() {
    return dashboardRepository.getAcceptedRejected();
  },

  getByStatus() {
    return dashboardRepository.getByStatus();
  },

  getByBrigade() {
    return dashboardRepository.getByBrigade();
  },

  getCorrectiveActionProgress() {
    return dashboardRepository.getCorrectiveActionProgress();
  },

  getTimeByStage() {
    return dashboardRepository.getTimeByStage();
  },
};
