import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile, mkdtemp, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";

let server, base;
const hasSoffice = (() => { try { execFileSync("which", [process.env.SOFFICE_PATH || "soffice"]); return true; } catch { return false; } })();

before(async () => {
  await new Promise((r) => { server = createApp({ apiKey: "secret", maxMb: 1, maxConcurrent: 2 }).listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const post = (name, content, headers = { "x-api-key": "secret" }) => {
  const form = new FormData();
  form.append("file", new Blob([content]), name);
  return fetch(`${base}/convert`, { method: "POST", body: form, headers });
};

test("health", async () => assert.equal((await fetch(`${base}/health`)).status, 200));
test("rejects missing/wrong API key", async () => {
  assert.equal((await post("a.txt", "hi", {})).status, 401);
  assert.equal((await post("a.txt", "hi", { "x-api-key": "nope" })).status, 401);
});
test("400 without file", async () => {
  const r = await fetch(`${base}/convert`, { method: "POST", body: new FormData(), headers: { "x-api-key": "secret" } });
  assert.equal(r.status, 400);
});
test("415 for unsupported extension", async () => assert.equal((await post("a.exe", "hi")).status, 415));
test("415 when content does not match extension", async () => assert.equal((await post("fake.docx", "not a zip")).status, 415));
test("413 when too large", async () => assert.equal((await post("big.txt", "a".repeat(2 * 1024 * 1024))).status, 413));

test("converts txt to a real PDF", { skip: !hasSoffice && "soffice not installed" }, async () => {
  const r = await post("note.txt", "Hello PDF");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
});

test("timeout kills the whole process group", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "fake-"));
  const marker = `fake-soffice-child-${process.pid}`;
  const script = path.join(dir, "soffice");
  // Mimics the soffice wrapper: spawns a long-running child, then waits.
  await writeFile(script, `#!/bin/sh\nexec -a ${marker} sleep 300 &\nwait\n`);
  await chmod(script, 0o755);
  process.env.SOFFICE_PATH = script;
  process.env.CONVERT_TIMEOUT_MS = "500";
  try {
    assert.equal((await post("t.txt", "hi")).status, 504);
    await new Promise((r) => setTimeout(r, 300));
    let alive = "";
    try { alive = execFileSync("pgrep", ["-f", marker]).toString().trim(); } catch {}
    assert.equal(alive, "", "child process should be dead");
  } finally {
    delete process.env.SOFFICE_PATH; delete process.env.CONVERT_TIMEOUT_MS;
  }
});
