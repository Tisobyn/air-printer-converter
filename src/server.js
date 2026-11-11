import express from "express";
import multer from "multer";
import { rm } from "node:fs/promises";
import path from "node:path";
import { convertToPdf, SUPPORTED_EXTENSIONS } from "./convert.js";

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.API_KEY; // if set, clients must send X-API-Key
const MAX_MB = Number(process.env.MAX_FILE_MB || 25);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 2);

const upload = multer({ dest: path.join(process.env.TMPDIR || "/tmp", "uploads"), limits: { fileSize: MAX_MB * 1024 * 1024 } });
const app = express();
let active = 0;

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/formats", (_req, res) => res.json({ extensions: [...SUPPORTED_EXTENSIONS] }));

app.post("/convert", (req, res, next) => {
  if (API_KEY && req.get("x-api-key") !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Send a multipart field named 'file'" });
  if (active >= MAX_CONCURRENT) {
    await rm(req.file.path, { force: true });
    return res.status(503).set("Retry-After", "5").json({ error: "Server busy, retry shortly" });
  }
  active++;
  try {
    const pdf = await convertToPdf(req.file.path, req.file.originalname);
    const base = path.basename(req.file.originalname, path.extname(req.file.originalname)) || "document";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(base)}.pdf`,
    }).send(pdf);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    active--;
    await rm(req.file.path, { force: true });
  }
});

app.use((err, _req, res, _next) => {
  const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || 500;
  res.status(status).json({ error: err.message });
});

app.listen(PORT, () => console.log(`Converter listening on :${PORT}`));
