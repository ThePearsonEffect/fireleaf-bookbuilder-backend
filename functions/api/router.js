import express from "express";
import cors from "cors";
import { ingestHandler } from "./ingest.js";
import { generateHandler } from "./generate.js";
import { exportDocxHandler } from "./exportDocx.js";
import { exportEpubHandler } from "./exportEpub.js";
import { exportPdfHandler } from "./exportPdf.js";
import {
  brainStatus,
  brainProcess,
  brainActivateLayer,
  brainActivateSuperposition,
  brainCreateDivineChannel,
  brainDecision
} from "./brain.js";

export const api = express();
api.use(cors({ origin: true }));
api.use(express.json({ limit: "10mb" }));

api.get("/health", (req, res) => res.json({ ok: true }));

// Existing endpoints
api.post("/ingest", ingestHandler);
api.post("/generate", generateHandler);
api.post("/export-docx", exportDocxHandler);
api.post("/export-epub", exportEpubHandler);
api.post("/export-pdf", exportPdfHandler);

// Brain endpoints
api.get("/brain/status", brainStatus);
api.post("/brain/process", brainProcess);
api.post("/brain/activate-layer", brainActivateLayer);
api.post("/brain/quantum/superposition", brainActivateSuperposition);
api.post("/brain/divine/channel", brainCreateDivineChannel);
api.post("/brain/decision", brainDecision);
