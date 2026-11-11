# Known problems

## 1. Format problems

| Format | Problem |
|---|---|
| `.pages` `.numbers` `.key` (Apple) | Often fail or look wrong. Not reliable. Most risky. |
| `.pptx` `.ppt` | Fonts, charts, SmartArt, animations can shift or flatten. |
| `.xlsx` `.xls` `.csv` | Wide sheets split across many pages. Huge sheets can time out. Non-UTF-8 CSV shows garbled text. |
| `.docx` `.doc` | Mostly fine. Calibri etc. are replaced, so lines can move. Comments / tracked changes may look odd. |
| `.html` | No external CSS, images or scripts. Looks plain. |
| `.txt` `.rtf` `.odt` | Fine. |
| Password-protected | Always fails (422). |
| Broken file | Always fails (422). |
| Images, `.pdf`, `.md`, `.epub` | Not supported. |

**Tested for real:** `.doc` `.docx` `.rtf` `.ppt` `.xls` `.txt`. Everything else is untested.

## 2. CloudConvert
- **Not tested with a real key yet.** Only tested against a fake server. Try it in the sandbox (`CLOUDCONVERT_SANDBOX=true`) first.
- **Costs money** per conversion (and has a free daily limit). If the key runs out of credits, every request falls back to LibreOffice, which is slower and gets 503 under load. Watch your balance.
- **Slower worst case:** CloudConvert times out after 45 s, then LibreOffice runs. A bad file can take ~100 s before it fails.
- **Privacy:** user files leave our server and go to CloudConvert. We delete the job right after, but it must be in the Privacy Policy (see `LEGAL_NOTES.md`).
- **Two engines = two looks.** The same file can look a bit different depending on which engine did it.
- If CloudConvert is the main engine, the "fonts" and "format" problems below mostly apply to the fallback only.

## 3. Fonts
The Docker image has only basic fonts. Chinese, Japanese, Korean, Arabic, Hindi and emoji show as empty boxes.
**Fix:** add `fonts-noto-cjk fonts-noto-core fonts-noto-color-emoji fonts-crosextra-carlito` to the Dockerfile.

## 4. Too many users

| Users | Result |
|---|---|
| ~100 | One small server (2 GB RAM, 2 CPU) is OK. |
| ~1000 | One server is **not** enough. Users get 503 "busy". |

With CloudConvert on, most load goes to them, so our server is much less busy. Only the fallback uses our CPU.
Why (fallback): each conversion starts LibreOffice (5–10 seconds, 150–500 MB RAM). Default is 2 at the same time (`MAX_CONCURRENT`). The rest get 503.

**Fixes, in order:**
1. Run 2–3 copies of the Docker container.
2. Add a job queue (Redis / SQS): upload → get job ID → poll for result.
3. Add rate limit per user / IP.
4. Keep LibreOffice running between jobs (faster).

## 5. Security
- The API key inside the app can be extracted. It only stops casual abuse. Use subscription check or Apple App Attest for real protection.
- Users upload private documents. Files are deleted right after conversion. Mention this in the privacy policy and App Store privacy details.
- Documents are untrusted. Run Docker with the hardened command in `README.md`.

## 6. Other
- First conversion after start is slower (~6 s).
- Max file size: 25 MB. Timeout: 60 s. Both can be changed (`MAX_FILE_MB`, `CONVERT_TIMEOUT_MS`).
- Server is not deployed yet. Phones cannot reach `localhost`.
- No remote git repo yet (not backed up).
