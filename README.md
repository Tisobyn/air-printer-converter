# air-printer-converter

Backend for the Air Printer "Convertation" feature: converts documents (.doc, .docx, .rtf, .odt, .xls(x), .ppt(x), .txt, .html, …) to PDF using headless LibreOffice.

## Run
Local (needs LibreOffice: `brew install --cask libreoffice`):
```bash
npm install && npm start
```
Docker:
```bash
docker build -t air-printer-converter . && docker run -p 3000:3000 air-printer-converter
```

## API
- `POST /convert` — multipart field `file`; returns `application/pdf`.
  ```bash
  curl -F file=@report.docx http://localhost:3000/convert -o report.pdf
  ```
- `GET /formats` — supported extensions. `GET /health` — liveness.

Errors are JSON `{error}`: 400 no file, 401 bad key, 413 too large, 415 unsupported type, 422 conversion failed, 503 busy, 504 timeout.

## Config (env)
`PORT` (3000), `API_KEY` (optional, sent as `X-API-Key`), `MAX_FILE_MB` (25), `MAX_CONCURRENT` (2), `CONVERT_TIMEOUT_MS` (60000), `SOFFICE_PATH`.
