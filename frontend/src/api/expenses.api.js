import { http } from "./client";

export const expensesApi = {
  list:   (month) => http.get(`/expenses/${month ? `?month=${month}` : ""}`),
  create: (data)  => http.post("/expenses/", data),
  delete: (id)    => http.delete(`/expenses/${id}`),
};
