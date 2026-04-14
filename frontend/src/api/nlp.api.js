import { http } from "./client";

export const nlpApi = {
  parse: (text, language) => http.post("/nlp/parse", { text, language }),
};
