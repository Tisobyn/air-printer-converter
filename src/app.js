import express from "express";
import multer from "multer";
import { rm } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import { convertToPdf, SUPPORTED_EXTENSIONS } from "./convert.js";

function keyMatches(given, expected) {
  const a = Buffer.from(given || ""), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createApp({
  apiKey = process.env.API_KEY,
  maxMb = Number(process.env.MAX_FILE_MB || 25),
} = {}) {
  const upload = multer({
    dest: path.join(process.env.TMPDIR || "/tmp", "uploads"),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
  });
  const app = express();

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/formats", (_req, res) => res.json({ extensions: [...SUPPORTED_EXTENSIONS] }));

  app.post("/convert", (req, res, next) => {
    if (apiKey && !keyMatches(req.get("x-api-key"), apiKey)) return res.status(401).json({ error: "Unauthorized" });
    next();
  }, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Send a multipart field named 'file'" });
    try {
      const { pdf, engine } = await convertToPdf(req.file.path, req.file.originalname);
      const base = path.basename(req.file.originalname, path.extname(req.file.originalname)) || "document";
      res.set({
        "X-Converted-By": engine,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(base)}.pdf`,
      }).send(pdf);
    } catch (err) {
      if (err.status === 503) res.set("Retry-After", "5");
      res.status(err.status || 500).json({ error: err.message });
    } finally {
      await rm(req.file.path, { force: true });
    }
  });

  app.use((err, _req, res, _next) => {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || 500;
    res.status(status).json({ error: err.message });
  });

  return app;
}
