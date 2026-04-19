import { http } from "./client";

export const dashboardApi = {
  get: (month) => http.get(`/dashboard/${month ? `?month=${month}` : ""}`),
};
