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

## 2. Fonts
The Docker image has only basic fonts. Chinese, Japanese, Korean, Arabic, Hindi and emoji show as empty boxes.
**Fix:** add `fonts-noto-cjk fonts-noto-core fonts-noto-color-emoji fonts-crosextra-carlito` to the Dockerfile.

## 3. Too many users

| Users | Result |
|---|---|
| ~100 | One small server (2 GB RAM, 2 CPU) is OK. |
| ~1000 | One server is **not** enough. Users get 503 "busy". |

Why: each conversion starts LibreOffice (5–10 seconds, 150–500 MB RAM). Default is 2 at the same time (`MAX_CONCURRENT`). The rest get 503.

**Fixes, in order:**
1. Run 2–3 copies of the Docker container.
2. Add a job queue (Redis / SQS): upload → get job ID → poll for result.
3. Add rate limit per user / IP.
4. Keep LibreOffice running between jobs (faster).

## 4. Security
- The API key inside the app can be extracted. It only stops casual abuse. Use subscription check or Apple App Attest for real protection.
- Users upload private documents. Files are deleted right after conversion. Mention this in the privacy policy and App Store privacy details.
- Documents are untrusted. Run Docker with the hardened command in `README.md`.

## 5. Other
- First conversion after start is slower (~6 s).
- Max file size: 25 MB. Timeout: 60 s. Both can be changed (`MAX_FILE_MB`, `CONVERT_TIMEOUT_MS`).
- Server is not deployed yet. Phones cannot reach `localhost`.
- No remote git repo yet (not backed up).
