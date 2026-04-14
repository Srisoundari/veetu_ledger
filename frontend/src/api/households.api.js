import { http } from "./client";

export const householdsApi = {
  create:        (name)           => http.post("/households/create", { name }),
  join:          (code)           => http.post(`/households/join/${code}`),
  me:            ()               => http.get("/households/me"),
  members:       ()               => http.get("/households/members"),
  rename:        (name)           => http.patch("/households/rename", { name }),
  newInvite:     ()               => http.patch("/households/new-invite"),
  leave:         ()               => http.delete("/households/leave"),
  updateProfile: (name, language) => http.patch("/households/profile", { name, language }),
};
