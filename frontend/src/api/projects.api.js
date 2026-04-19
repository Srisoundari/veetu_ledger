import { http } from "./client";

export const projectsApi = {
  list:     ()            => http.get("/projects/"),
  balance:  ()            => http.get("/projects/balance"),
  create:   (data)        => http.post("/projects/", data),
  update:   (id, data)    => http.patch(`/projects/${id}`, data),
  complete: (id)          => http.patch(`/projects/${id}/complete`),
  delete:   (id)          => http.delete(`/projects/${id}`),
};
