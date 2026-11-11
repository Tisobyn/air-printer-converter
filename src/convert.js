import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, copyFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { contentMatchesExtension } from "./validate.js";

export const SUPPORTED_EXTENSIONS = new Set([
  ".doc", ".docx", ".dot", ".dotx", ".rtf", ".odt", ".txt", ".html", ".htm",
  ".xls", ".xlsx", ".ods", ".csv",
  ".ppt", ".pptx", ".odp", ".pages", ".numbers", ".key",
]);

// Locks down the throwaway LibreOffice profile: no macros, never refresh external links.
const PROFILE_SETTINGS = `<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item>
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="DisableMacrosExecution" oor:op="fuse"><value>true</value></prop></item>
<item oor:path="/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>2</value></prop></item>
<item oor:path="/org.openoffice.Office.Calc/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>2</value></prop></item>
</oor:items>`;

/** Convert a file on disk to PDF; resolves with the PDF bytes. */
export async function convertToPdf(inputPath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw Object.assign(new Error(`Unsupported file type: ${ext || "(none)"}`), { status: 415 });
  }
  if (!(await contentMatchesExtension(inputPath, originalName))) {
    throw Object.assign(new Error("File content does not match its extension"), { status: 415 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "convert-"));
  try {
    const src = path.join(workDir, `input${ext}`);
    await copyFile(inputPath, src);
    const profileDir = path.join(workDir, "profile");
    await mkdir(path.join(profileDir, "user"), { recursive: true });
    await writeFile(path.join(profileDir, "user", "registrymodifications.xcu"), PROFILE_SETTINGS);

    await run(process.env.SOFFICE_PATH || "soffice", [
      `-env:UserInstallation=file://${profileDir}`,
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
  const timeoutMs = Number(process.env.CONVERT_TIMEOUT_MS || 60_000);
  return new Promise((resolve, reject) => {
    // detached => own process group, so we can kill soffice AND soffice.bin together.
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"], detached: true });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    const killGroup = () => { try { process.kill(-child.pid, "SIGKILL"); } catch {} };
    const timer = setTimeout(() => {
      killGroup();
      reject(Object.assign(new Error("Conversion timed out"), { status: 504 }));
    }, timeoutMs);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      killGroup(); // sweep any stragglers
      code === 0 ? resolve() : reject(Object.assign(new Error(`Conversion failed: ${stderr.trim()}`), { status: 422 }));
    });
  });
}
