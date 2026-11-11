import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { createApp } from "../src/app.js";

const hasSoffice = (() => { try { execFileSync("which", ["soffice"]); return true; } catch { return false; } })();
let fake, app, base, failJobs = false, deleted = false;

before(async () => {
  fake = http.createServer((req, res) => {
    const origin = `http://localhost:${fake.address().port}`;
    const json = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    req.resume();
    req.on("end", () => {
      if (req.url === "/v2/jobs" && req.method === "POST") {
        if (failJobs) return json(500, {});
        if (req.headers.authorization !== "Bearer test-key") return json(401, {});
        return json(201, { data: { id: "job1", tasks: [{ name: "import-file", result: { form: { url: `${origin}/upload`, parameters: { k: "v" } } } }] } });
      }
      if (req.url === "/upload") return json(201, {});
      if (req.url === "/v2/jobs/job1" && req.method === "GET") return json(200, { data: { status: "finished", tasks: [{ name: "export-file", result: { files: [{ url: `${origin}/out.pdf` }] } }] } });
      if (req.url === "/out.pdf") { res.writeHead(200); return res.end("%PDF-1.7 fake"); }
      if (req.url === "/v2/jobs/job1" && req.method === "DELETE") { deleted = true; res.writeHead(204); return res.end(); }
      json(404, {});
    });
  });
  await new Promise((r) => fake.listen(0, r));
  const u = `http://localhost:${fake.address().port}`;
  Object.assign(process.env, { CLOUDCONVERT_API_KEY: "test-key", CLOUDCONVERT_API_URL: u, CLOUDCONVERT_SYNC_URL: u });
  await new Promise((r) => { app = createApp({ apiKey: "" }).listen(0, r); });
  base = `http://localhost:${app.address().port}`;
});
after(() => { app.close(); fake.close(); });

const send = () => {
  const form = new FormData();
  form.append("file", new Blob(["Hello"]), "note.txt");
  return fetch(`${base}/convert`, { method: "POST", body: form });
};

test("uses CloudConvert first and deletes the job after", async () => {
  deleted = false;
  const r = await send();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-converted-by"), "cloudconvert");
  assert.equal(Buffer.from(await r.arrayBuffer()).toString(), "%PDF-1.7 fake");
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(deleted, true);
});

test("falls back to LibreOffice when CloudConvert fails", { skip: !hasSoffice && "soffice not installed" }, async () => {
  failJobs = true;
  const r = await send();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-converted-by"), "libreoffice");
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
});

test("skips CloudConvert when no key is set", { skip: !hasSoffice && "soffice not installed" }, async () => {
  failJobs = false;
  const key = process.env.CLOUDCONVERT_API_KEY;
  delete process.env.CLOUDCONVERT_API_KEY;
  try {
    assert.equal((await send()).headers.get("x-converted-by"), "libreoffice");
  } finally { process.env.CLOUDCONVERT_API_KEY = key; }
});
