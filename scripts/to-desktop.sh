#!/bin/sh
# Usage: scripts/to-desktop.sh path/to/file.docx   (server must be running: npm start)
# Saves the PDF to ~/Desktop. Env: URL (default http://localhost:3000), API_KEY (optional).
[ -f "$1" ] || { echo "Usage: $0 <file>"; exit 1; }
name=$(basename "$1"); out="$HOME/Desktop/${name%.*}.pdf"
code=$(curl -s -o "$out" -w "%{http_code}" ${API_KEY:+-H "X-API-Key: $API_KEY"} \
  -F "file=@$1" "${URL:-http://localhost:3000}/convert")
if [ "$code" = 200 ]; then echo "Saved $out"; else echo "Failed ($code): $(cat "$out")"; rm -f "$out"; exit 1; fi
