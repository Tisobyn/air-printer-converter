import { open } from "node:fs/promises";
import path from "node:path";

const ZIP = [0x50, 0x4b]; // "PK"
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const KIND = {
  zip: [".docx", ".dotx", ".xlsx", ".pptx", ".odt", ".ods", ".odp", ".pages", ".numbers", ".key"],
  ole: [".doc", ".dot", ".xls", ".ppt"],
  rtf: [".rtf"],
  text: [".txt", ".csv", ".html", ".htm"],
};

const startsWith = (buf, sig) => sig.every((b, i) => buf[i] === b);

/** Checks that the file's real content matches its extension. Returns true/false. */
export async function contentMatchesExtension(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(8192);
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    const head = buf.subarray(0, bytesRead);
    if (bytesRead === 0) return false;
    if (KIND.zip.includes(ext)) return startsWith(head, ZIP);
    if (KIND.ole.includes(ext)) return startsWith(head, OLE);
    if (KIND.rtf.includes(ext)) return head.subarray(0, 5).toString("latin1") === "{\\rtf";
    if (KIND.text.includes(ext)) return !head.includes(0); // no NUL bytes => not binary
    return false;
  } finally {
    await fh.close();
  }
}
