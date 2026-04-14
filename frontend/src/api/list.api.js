import { http } from "./client";

export const listApi = {
  get:       ()     => http.get("/list/"),
  add:       (data) => http.post("/list/", data),
  markDone:  (id)   => http.patch(`/list/${id}/done`),
  delete:    (id)   => http.delete(`/list/${id}`),
  clearDone: ()     => http.delete("/list/"),
};
