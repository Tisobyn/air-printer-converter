<h1 align="center">📄 air-printer-converter</h1>

<p align="center">
  Backend for the <b>Air Printer "Convertation"</b> feature.<br>
  Upload a document, get a PDF back.
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node-%E2%89%A520-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white">
  <img alt="CloudConvert" src="https://img.shields.io/badge/CloudConvert-API%20v2-2f6fdb">
  <img alt="LibreOffice" src="https://img.shields.io/badge/LibreOffice-headless-18A303?logo=libreoffice&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white">
</p>

---

## ✨ What it does

```
 iOS / Android app ──(file)──▶ server ──▶ ☁️ CloudConvert ──▶ 📕 PDF ──▶ app
                                  │             ✖ fails / no key / timeout
                                  └──▶ 🖥 our LibreOffice ──▶ 📕 PDF ──▶ app
```

The response header `X-Converted-By` says which engine did the job: `cloudconvert` or `libreoffice`.

Files are checked, converted, and **deleted right after** (also at CloudConvert). No database, no accounts.

## 📚 Supported formats

| Type | Extensions | Status |
|---|---|---|
| Word / text | `.doc` `.docx` `.dot` `.dotx` `.rtf` `.odt` `.txt` `.html` `.htm` | ✅ `.doc` `.docx` `.rtf` `.txt` tested |
| Spreadsheets | `.xls` `.xlsx` `.ods` `.csv` | ⚠️ `.xls` tested |
| Presentations | `.ppt` `.pptx` `.odp` | ⚠️ `.ppt` tested |
| Apple iWork | `.pages` `.numbers` `.key` | ❌ unreliable |

Details: [docs/KNOWN_PROBLEMS.md](docs/KNOWN_PROBLEMS.md)

## 🚀 Quick start

**1. Install LibreOffice** (needed for the real conversion)
```bash
brew install --cask libreoffice
export SOFFICE_PATH=/Applications/LibreOffice.app/Contents/MacOS/soffice
```

**2. Run the server**
```bash
npm install
npm start
```
To use CloudConvert, copy `.env.example` to `.env`, add your key, then run `npm run start:env`.
Without a key the server uses only LibreOffice.

**3. Convert a file**
```bash
curl -F file=@report.docx http://localhost:3000/convert -o report.pdf
```

Or save the result straight to your Desktop:
```bash
scripts/to-desktop.sh ~/Downloads/report.docx
```

## 🐳 Docker

Documents are untrusted input, so run it locked down:

```bash
docker build -t air-printer-converter .
docker run -p 3000:3000 --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges --memory 1g --cpus 2 --pids-limit 256 \
  -e API_KEY=change-me -e CLOUDCONVERT_API_KEY=your-key air-printer-converter
```

> 💡 If you can, also block the container's outbound network at the host or firewall level.

## 🔌 API

| Method | Path | Description |
|---|---|---|
| `POST` | `/convert` | Multipart field `file` → returns `application/pdf` |
| `GET` | `/formats` | List of supported extensions |
| `GET` | `/health` | Liveness check → `{"ok": true}` |

If `API_KEY` is set, send it as the `X-API-Key` header.

### Status codes

| Code | Meaning |
|---|---|
| `200` | ✅ PDF returned |
| `400` | No file sent |
| `401` | Wrong or missing API key |
| `413` | File too large |
| `415` | Unsupported type, or content doesn't match the extension |
| `422` | Conversion failed (broken or password-protected file) |
| `503` | Server busy (LibreOffice full), retry in a few seconds |
| `504` | Conversion timed out |

Errors are JSON: `{"error": "message"}`

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `API_KEY` | – | If set, clients must send `X-API-Key` |
| `MAX_FILE_MB` | `25` | Max upload size |
| `MAX_CONCURRENT` | `2` | Conversions at the same time |
| `CONVERT_TIMEOUT_MS` | `60000` | Kill a conversion after this time |
| `SOFFICE_PATH` | `soffice` | Path to the LibreOffice binary |
| `CLOUDCONVERT_API_KEY` | – | Turns on CloudConvert as the first engine. Without it, only LibreOffice is used |
| `CLOUDCONVERT_SANDBOX` | `false` | `true` = use CloudConvert sandbox (free testing) |
| `CLOUDCONVERT_TIMEOUT_MS` | `45000` | Give up on CloudConvert after this time, then fall back |

## 🧪 Tests

```bash
npm test
```
13 tests (CloudConvert is tested against a fake local server, no real key needed). The real-conversion tests are skipped if `soffice` is not installed.

## 🗂 Project structure

```
src/
  server.js     starts the server
  app.js        routes
  convert.js    picks the engine: CloudConvert, then LibreOffice (timeout, locked-down profile)
  cloudconvert.js  CloudConvert API client
  validate.js   checks file content matches its extension
test/           node:test suite
scripts/        to-desktop.sh helper
docs/           guides (below)
docs/diagrams/  diagram sources (SVG) and generate.py
.env.example    all settings, copy to .env
Dockerfile
```

## 🧭 Status

| Done | Still to do |
|---|---|
| ✅ Convert API, validation, tests | ⬜ Try CloudConvert with a real key (sandbox first) |
| ✅ CloudConvert first, LibreOffice fallback | ⬜ Test .xlsx, .pptx, .odt, .csv, .html and iWork files |
| ✅ Docs and diagrams | ⬜ Add more fonts to the Dockerfile (CJK, Arabic, emoji) |
| ✅ Docker image written | ⬜ Build and test the Docker image (Docker not installed here) |
| | ⬜ Deploy, HTTPS, set `API_KEY` |
| | ⬜ Connect the iOS and Android apps |
| | ⬜ Final Privacy Policy and Terms |
| | ⬜ Push to GitHub (repo is local only) |

## 📖 Docs

| File | For |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrams: how a request flows. PDF: [AirPrinter-Converter-Diagrams.pdf](docs/AirPrinter-Converter-Diagrams.pdf) |
| [SWIFT_INTEGRATION.md](docs/SWIFT_INTEGRATION.md) | iOS and Android developers: how to connect |
| [KNOWN_PROBLEMS.md](docs/KNOWN_PROBLEMS.md) | Format, font, scaling and security limits |
| [TECH_STACK.md](docs/TECH_STACK.md) | What we use and which versions |
| [LEGAL_NOTES.md](docs/LEGAL_NOTES.md) | What to put in Privacy Policy and Terms |
