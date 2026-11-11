import { readFile } from "node:fs/promises";

const settings = () => {
  const sandbox = process.env.CLOUDCONVERT_SANDBOX === "true";
  return {
    key: process.env.CLOUDCONVERT_API_KEY,
    api: process.env.CLOUDCONVERT_API_URL || (sandbox ? "https://api.sandbox.cloudconvert.com" : "https://api.cloudconvert.com"),
    sync: process.env.CLOUDCONVERT_SYNC_URL || (sandbox ? "https://sync.api.sandbox.cloudconvert.com" : "https://sync.api.cloudconvert.com"),
    timeoutMs: Number(process.env.CLOUDCONVERT_TIMEOUT_MS || 45_000),
  };
};

export const cloudConvertEnabled = () => Boolean(process.env.CLOUDCONVERT_API_KEY);

async function check(res, what) {
  if (!res.ok) throw new Error(`CloudConvert ${what} failed: HTTP ${res.status}`);
  return res;
}

/** Converts via CloudConvert. Throws on any problem so the caller can fall back. */
export async function convertWithCloudConvert(inputPath, ext) {
  const c = settings();
  const signal = AbortSignal.timeout(c.timeoutMs);
  const auth = { Authorization: `Bearer ${c.key}` };
  let jobId;
  try {
    const created = await check(await fetch(`${c.api}/v2/jobs`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        tasks: {
          "import-file": { operation: "import/upload" },
          "convert-file": { operation: "convert", input: "import-file", input_format: ext.slice(1), output_format: "pdf" },
          "export-file": { operation: "export/url", input: "convert-file" },
        },
      }),
    }), "create job");
    const job = (await created.json()).data;
    jobId = job.id;

    const form = job.tasks.find((t) => t.name === "import-file")?.result?.form;
    if (!form) throw new Error("CloudConvert gave no upload form");
    const body = new FormData();
    for (const [k, v] of Object.entries(form.parameters || {})) body.append(k, v);
    body.append("file", new Blob([await readFile(inputPath)]), `input${ext}`);
    await check(await fetch(form.url, { method: "POST", body, signal }), "upload");

    const done = (await (await check(await fetch(`${c.sync}/v2/jobs/${jobId}`, { headers: auth, signal }), "wait for job")).json()).data;
    if (done.status !== "finished") throw new Error(`CloudConvert job ${done.status}`);
    const fileUrl = done.tasks.find((t) => t.name === "export-file")?.result?.files?.[0]?.url;
    if (!fileUrl) throw new Error("CloudConvert returned no file");

    const pdf = Buffer.from(await (await check(await fetch(fileUrl, { signal }), "download")).arrayBuffer());
    if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("CloudConvert returned a non-PDF");
    return pdf;
  } finally {
    // Privacy: remove the user's file from CloudConvert right away (best effort).
    if (jobId) fetch(`${c.api}/v2/jobs/${jobId}`, { method: "DELETE", headers: auth }).catch(() => {});
  }
}
