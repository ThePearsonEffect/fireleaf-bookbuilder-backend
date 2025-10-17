// functions/index.js
import { onRequest } from "firebase-functions/v2/https";
import { api } from "./api/router.js";

export const apiApp = onRequest({ region: "us-central1" }, api);
