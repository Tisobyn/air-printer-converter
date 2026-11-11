import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { contentMatchesExtension } from "../src/validate.js";

const dir = await mkdtemp(path.join(tmpdir(), "val-"));
const make = async (name, bytes) => { const p = path.join(dir, name); await writeFile(p, bytes); return p; };

test("accepts matching signatures", async () => {
  assert.equal(await contentMatchesExtension(await make("a", Buffer.from("PK\x03\x04")), "x.docx"), true);
  assert.equal(await contentMatchesExtension(await make("b", Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1])), "x.doc"), true);
  assert.equal(await contentMatchesExtension(await make("c", "{\\rtf1 hi"), "x.rtf"), true);
  assert.equal(await contentMatchesExtension(await make("d", "hello"), "x.txt"), true);
});

test("rejects mismatches", async () => {
  assert.equal(await contentMatchesExtension(await make("e", "plain text"), "x.docx"), false);
  assert.equal(await contentMatchesExtension(await make("f", Buffer.from("PK\x03\x04")), "x.doc"), false);
  assert.equal(await contentMatchesExtension(await make("g", Buffer.from([0x4d, 0x5a, 0, 0])), "x.txt"), false);
  assert.equal(await contentMatchesExtension(await make("h", ""), "x.txt"), false);
});
