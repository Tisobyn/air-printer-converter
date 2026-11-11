# Tech stack

## What it is
Backend service for the Air Printer "Convertation" feature. Takes a document, returns a PDF.

## Main parts

| Part | What | Version | Why |
|---|---|---|---|
| Node.js | Runs the server | 26.10.0 (local) / 20 (Docker image `node:20-bookworm-slim`) | Needs 20 or newer |
| Express | Web framework (routes, responses) | 4.22.3 (`^4.21.0`) | Simple HTTP API |
| Multer | Receives file uploads | 2.5.0 (`^2.5.0`) | Handles `multipart/form-data` |
| LibreOffice (`soffice`, headless) | **Does the real conversion** to PDF | 26.8.2.2 (local Mac) / Debian package in Docker | Reads .doc/.docx/.xls/.ppt etc. |
| Docker | Packaging and deployment | Base: Debian 12 (bookworm) | Same setup everywhere |

Node built-ins only (no extra packages): `node:test` (tests), `node:child_process` (starts LibreOffice), `node:crypto` (API key check).

## Dependencies
Only 2 runtime packages: `express`, `multer`. No dev dependencies. No database. No cloud services.

## Project files
- `src/server.js` — starts the server
- `src/app.js` — routes (`/convert`, `/formats`, `/health`)
- `src/convert.js` — runs LibreOffice, timeout, locked-down profile
- `src/validate.js` — checks file content matches its extension
- `test/` — 10 tests (`npm test`)
- `scripts/to-desktop.sh` — converts a file and saves the PDF to Desktop
- `Dockerfile` — image with LibreOffice and fonts

## Config (environment variables)
`PORT` (3000), `API_KEY`, `MAX_FILE_MB` (25), `MAX_CONCURRENT` (2), `CONVERT_TIMEOUT_MS` (60000), `SOFFICE_PATH`.

## Infrastructure
- Not deployed yet. Git is local only (3 commits, no remote).
- Needs about 1–2 GB RAM per container.

## Note on versions
The Docker image installs LibreOffice from Debian bookworm, which is an older version than the 26.8 on this Mac. Output can differ slightly between them. Test on the Docker image before release.
