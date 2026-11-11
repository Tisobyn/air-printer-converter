# What to add to Privacy Policy and Terms

> Not legal advice. Have a lawyer check the final text. Facts below are based on how the server works today.

## What actually happens with user data
1. User picks a document in the app.
2. The app uploads it to our server over HTTPS.
3. The server converts it and sends the PDF back.
4. The server deletes the uploaded file and the PDF copy right after the conversion (also after errors).

The server does **not** save file contents, read them or log them. It has no database and no user accounts.

**Still check:** your hosting provider (Fly.io, Cloud Run, etc.) may keep request logs (IP address, time, file size, status code). Read their docs and write the real answer in the policy.

---

## Privacy Policy: add this

1. **What we collect when you use Convert:** the document you choose to convert. Technical data: IP address, time of request, file size, errors (in server logs).
2. **Why:** only to convert your file to PDF.
3. **Where it goes:** sent to our server (and our hosting provider: name them) over an encrypted connection.
4. **How long we keep it:** the document is deleted right after conversion. Logs (without file content) are kept for [X days: check hosting settings].
5. **We do not:** read your documents, sell them, use them for ads or use them to train AI.
6. **Third parties:** hosting provider [name]. No other service gets your files.
7. **Your rights:** (GDPR / CCPA) ask what we hold, ask us to delete it, contact: [email].
8. **Children:** [your app's age rule].
9. **Changes:** how you will tell users about policy updates.
10. **Contact:** [email].

Tip: the user chooses to send the file. Say clearly in the app, before the first upload: "Your document is sent to our server for conversion and deleted right after."

## App Store "App Privacy" (Connect form)
- **User Content → Other User Content:** yes, collected (the uploaded document).
- Used for: **App Functionality** only.
- Linked to the user's identity: **No**, if you add no accounts or IDs to the request.
- Used for tracking: **No**.
- If the server logs IP addresses, also declare that data (identifiers / diagnostics), as your hosting logs it.

---

## Terms of Use: add this

1. **What the feature does:** converts your documents to PDF.
2. **Your files:** you must have the right to convert them. You keep all rights to them. We take none.
3. **No illegal or harmful content:** no malware, no files that break the law or others' rights.
4. **No guarantee of exact result:** layout, fonts, colors and page breaks can differ from the original. Check the PDF before you rely on it.
5. **Limits:** max file size [25 MB], supported formats only, fair use (we may limit requests).
6. **Not supported:** password-protected, damaged or very large files may fail.
7. **Availability:** the service may be down, slow or changed without notice.
8. **Backups:** we do not store your files, so we cannot recover them. Keep your originals.
9. **Liability:** limited as far as the law allows (lawyer writes this part).
10. **Ending access:** we may block misuse.
11. **Law and contact:** governing law [country], contact [email].

---

## Before you publish
- [ ] Fill in every [bracket].
- [ ] Confirm the log retention of your hosting provider.
- [ ] Put the policy URL in App Store Connect and inside the app.
- [ ] Add the one-line notice before the first upload.
- [ ] Re-check this file if you add accounts, analytics, file storage, or a queue (a queue may keep files longer).
