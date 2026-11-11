# How it works

> **PDF version (4 pages, easy to share):** [AirPrinter-Converter-Diagrams.pdf](AirPrinter-Converter-Diagrams.pdf)
> Pages: 1. Overview, 2. Request sequence, 3. Scaling, 4. Where user data goes. Sources: [diagrams/](diagrams/).

## In one picture

```mermaid
flowchart TD
    A["iOS / Android app<br/>sends a document"] --> B["POST /convert"]
    B --> C{"API key OK?<br/>file size OK?"}
    C -- no --> E1["401 / 413 error"]
    C -- yes --> D{"Type allowed AND<br/>content matches extension?"}
    D -- no --> E2["415 error"]
    D -- yes --> F{"CloudConvert<br/>key set?"}
    F -- yes --> G["CloudConvert<br/>(max 45 s)"]
    G -- success --> H["PDF"]
    G -- "fails / timeout" --> I
    F -- no --> I["Our LibreOffice<br/>(max 60 s)"]
    I -- success --> H
    I -- "server full" --> E3["503 busy, retry"]
    I -- "broken file / timeout" --> E4["422 / 504 error"]
    H --> J["Delete temp files<br/>(also at CloudConvert)"]
    J --> K["200 + PDF<br/>header X-Converted-By"]
    K --> L["App shows the PDF"]
```

## Step by step (happy path)

```mermaid
sequenceDiagram
    participant App as App
    participant API as Our server
    participant CC as CloudConvert
    participant LO as LibreOffice

    App->>API: POST /convert (file)
    API->>API: check key, size, type, content
    API->>CC: upload file, convert to PDF
    alt CloudConvert works
        CC-->>API: PDF
        API->>CC: delete job
    else CloudConvert fails or is slow
        API->>LO: convert locally
        LO-->>API: PDF
    end
    API->>API: delete temp files
    API-->>App: 200 + PDF (X-Converted-By)
```

## Who does what

| Part | Job |
|---|---|
| App (iOS / Android) | Picks the file, uploads it, shows the PDF or the error |
| Our server (Node + Express) | Checks the file, picks the engine, returns the PDF |
| CloudConvert | **First engine.** Converts online. Costs money per file |
| LibreOffice | **Backup engine.** Runs on our server. Free, but uses our CPU and RAM |

## Why two engines
- CloudConvert is the main one: good quality, and our server stays free.
- LibreOffice is the safety net: if CloudConvert is down, out of credits or slow, users still get a PDF.

## Where the file goes
1. Phone → our server (HTTPS)
2. Our server → CloudConvert (HTTPS)
3. CloudConvert → our server (PDF)
4. Our server → phone (PDF)

Our server and CloudConvert both delete the file right after.
