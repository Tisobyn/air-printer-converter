import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const SUPPORTED_EXTENSIONS = new Set([
  ".doc", ".docx", ".dot", ".dotx", ".rtf", ".odt", ".txt", ".html", ".htm",
  ".xls", ".xlsx", ".ods", ".csv",
  ".ppt", ".pptx", ".odp", ".pages", ".numbers", ".key",
]);

const SOFFICE = process.env.SOFFICE_PATH || "soffice";
const TIMEOUT_MS = Number(process.env.CONVERT_TIMEOUT_MS || 60_000);

/** Convert a file on disk to PDF; resolves with the PDF bytes. */
export async function convertToPdf(inputPath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw Object.assign(new Error(`Unsupported file type: ${ext || "(none)"}`), { status: 415 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "convert-"));
  try {
    // Fixed, sanitized name inside our own dir; separate profile so parallel runs don't clash.
    const src = path.join(workDir, `input${ext}`);
    await copyFile(inputPath, src);
    const profile = `file://${path.join(workDir, "profile")}`;

    await run(SOFFICE, [
      `-env:UserInstallation=${profile}`,
      "--headless", "--norestore", "--convert-to", "pdf", "--outdir", workDir, src,
    ]);
    return await readFile(path.join(workDir, "input.pdf"));
  } catch (err) {
    if (err.code === "ENOENT" && err.syscall?.startsWith("spawn")) {
      throw Object.assign(new Error("LibreOffice (soffice) is not installed"), { status: 500 });
    }
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(Object.assign(new Error("Conversion timed out"), { status: 504 }));
    }, TIMEOUT_MS);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(Object.assign(new Error(`Conversion failed: ${stderr.trim()}`), { status: 422 }));
    });
  });
}
