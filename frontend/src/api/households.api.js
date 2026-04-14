import { http } from "./client";

export const householdsApi = {
  create:        (name)           => http.post("/households/create", { name }),
  join:          (code)           => http.post(`/households/join/${code}`),
  me:            ()               => http.get("/households/me"),
  updateProfile: (name, language) => http.patch("/households/profile", { name, language }),
};
