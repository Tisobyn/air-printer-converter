# How to connect from Swift

## What this does
You send a document to the server. The server sends back a PDF.

## The one request you need
- **POST** `{BASE_URL}/convert`
- Body: `multipart/form-data` with one field named **`file`**
- Header: `X-API-Key: <key>` (only if the server has an API key set)
- Success: status **200**, body is the PDF bytes

## Steps
1. Get the file URL (e.g. from `.fileImporter`).
2. Call `url.startAccessingSecurityScopedResource()` before reading it. Call `stop...` after.
3. Send it with `URLSession.shared.upload(for:from:)`.
4. Save the returned bytes to a `.pdf` file in the temp folder.
5. Give that file URL to your print / preview code.

## Status codes
| Code | Meaning | What to show the user |
|---|---|---|
| 200 | Done | PDF |
| 400 | No file sent | Bug in your code |
| 401 | Wrong API key | Bug / config |
| 413 | File over 25 MB | "File too large" |
| 415 | Unsupported or fake file type | "Format not supported" |
| 422 | Conversion failed (broken or password-protected file) | "Can't convert this file" |
| 503 | Server busy | Wait 5 seconds, retry |
| 504 | Took too long | "Try again" |

Errors come as JSON: `{"error": "message"}`.

## Other endpoints
- `GET /formats` → list of supported file extensions
- `GET /health` → `{"ok": true}`

## Testing
- **Simulator:** `http://localhost:3000`. Add `NSAllowsLocalNetworking = YES` in Info.plist (App Transport Security).
- **Real iPhone:** `localhost` does not work. Use your Mac's IP (same Wi-Fi) or the deployed server.
- **Production:** must be **HTTPS**.
- Run the server: `npm start` in the converter folder. Needs LibreOffice installed.

## Rules
- Set `timeoutInterval` to ~120 seconds. Conversion can take 5–30 seconds.
- Show a loading spinner.
- Do not hardcode the API key in committed code.
- Check the extension on the phone before uploading. Saves a round trip.

## Full code example
See the main conversation / ask for `ConverterService.swift` (about 50 lines, uses async/await).
