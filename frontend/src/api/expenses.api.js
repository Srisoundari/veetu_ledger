import { http } from "./client";

export const expensesApi = {
  list: (opts = {}) => {
    const qs = new URLSearchParams();
    if (opts.month)      qs.set("month", opts.month);
    if (opts.projectId)  qs.set("project_id", opts.projectId);
    const s = qs.toString();
    return http.get(`/expenses/${s ? `?${s}` : ""}`);
  },
  summary: (projectId) =>
    http.get(`/expenses/summary${projectId ? `?project_id=${projectId}` : ""}`),
  create: (data)        => http.post("/expenses/", data),
  update: (id, data)    => http.patch(`/expenses/${id}`, data),
  delete: (id)          => http.delete(`/expenses/${id}`),
};
