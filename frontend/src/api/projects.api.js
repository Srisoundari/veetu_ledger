import { http } from "./client";

export const projectsApi = {
  list:        ()                => http.get("/projects/"),
  balance:     ()                => http.get("/projects/balance"),
  create:      (data)            => http.post("/projects/", data),
  update:      (id, data)        => http.patch(`/projects/${id}`, data),
  complete:    (id)              => http.patch(`/projects/${id}/complete`),
  delete:      (id)              => http.delete(`/projects/${id}`),
  listEntries: (id)              => http.get(`/projects/${id}/entries`),
  addEntry:    (id, data)        => http.post(`/projects/${id}/entries`, data),
  updateEntry: (pid, eid, data)  => http.patch(`/projects/${pid}/entries/${eid}`, data),
  summary:     (id)              => http.get(`/projects/${id}/summary`),
  deleteEntry: (pid, eid)        => http.delete(`/projects/${pid}/entries/${eid}`),
};
