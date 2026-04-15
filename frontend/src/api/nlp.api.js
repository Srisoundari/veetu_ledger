import { http } from "./client";

export const nlpApi = {
  parse: (text, language)               => http.post("/nlp/parse", { text, language }),
  save:  (items, project_id = null)     => http.post("/nlp/save",  { items, project_id }),
};
