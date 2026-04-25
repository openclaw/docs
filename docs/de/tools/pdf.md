---
read_when:
    - Du möchtest PDFs von Agenten aus analysieren.
    - Du benötigst die genauen Parameter und Grenzen des PDF-Tools.
    - Du untersuchst den nativen PDF-Modus im Vergleich zum Extraktions-Fallback.
summary: Ein oder mehrere PDF-Dokumente mit nativer Anbieterunterstützung und Extraktions-Fallback analysieren
title: PDF-Tool
x-i18n:
    generated_at: "2026-04-25T13:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück.

Kurzüberblick zum Verhalten:

- Nativer Anbietermodus für die Modellanbieter Anthropic und Google.
- Extraktions-Fallback-Modus für andere Anbieter (zuerst Text extrahieren, dann bei Bedarf Seitenbilder).
- Unterstützt einzelne (`pdf`) oder mehrere (`pdfs`) Eingaben, maximal 10 PDFs pro Aufruf.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw eine PDF-fähige Modellkonfiguration für den Agenten auflösen kann:

1. `agents.defaults.pdfModel`
2. Fallback auf `agents.defaults.imageModel`
3. Fallback auf das aufgelöste Sitzungs-/Standardmodell des Agenten
4. wenn native PDF-Anbieter Authentifizierung benötigen, werden sie vor generischen Image-Fallback-Kandidaten bevorzugt

Wenn kein nutzbares Modell aufgelöst werden kann, wird das Tool `pdf` nicht bereitgestellt.

Hinweise zur Verfügbarkeit:

- Die Fallback-Kette ist Auth-bewusst. Ein konfiguriertes `provider/model` zählt nur, wenn OpenClaw diesen Anbieter für den Agenten tatsächlich authentifizieren kann.
- Native PDF-Anbieter sind derzeit **Anthropic** und **Google**.
- Wenn der aufgelöste Sitzungs-/Standardanbieter bereits ein konfiguriertes Vision-/PDF-Modell hat, verwendet das PDF-Tool dieses erneut, bevor es auf andere Auth-gestützte Anbieter zurückfällt.

## Eingabereferenz

<ParamField path="pdf" type="string">
Ein PDF-Pfad oder eine PDF-URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Mehrere PDF-Pfade oder -URLs, insgesamt bis zu 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyse-Prompt.
</ParamField>

<ParamField path="pages" type="string">
Seitenfilter wie `1-5` oder `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Optionale Modellüberschreibung im Format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenlimit pro PDF in MB. Standard ist `agents.defaults.pdfMaxBytesMb` oder `10`.
</ParamField>

Hinweise zur Eingabe:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert.
- Wenn keine PDF-Eingabe angegeben wird, gibt das Tool einen Fehler zurück.
- `pages` wird als 1-basierte Seitenzahlen geparst, dedupliziert, sortiert und auf die konfigurierte maximale Seitenzahl begrenzt.
- `maxBytesMb` ist standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`.

## Unterstützte PDF-Referenzen

- lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL
- von OpenClaw verwaltete eingehende Referenzen wie `media://inbound/<id>`

Hinweise zu Referenzen:

- Andere URI-Schemata (zum Beispiel `ftp://`) werden mit `unsupported_pdf_reference` abgelehnt.
- Im Sandbox-Modus werden entfernte `http(s)`-URLs abgelehnt.
- Wenn eine Dateirichtlinie nur für den Workspace aktiviert ist, werden lokale Dateipfade außerhalb der erlaubten Wurzeln abgelehnt.
- Verwaltete eingehende Referenzen und wiedergegebene Pfade unter OpenClaws eingehendem Medienspeicher sind mit einer Dateirichtlinie nur für den Workspace erlaubt.

## Ausführungsmodi

### Nativer Anbietermodus

Der native Modus wird für den Anbieter `anthropic` und `google` verwendet.
Das Tool sendet rohe PDF-Bytes direkt an Anbieter-APIs.

Grenzen des nativen Modus:

- `pages` wird nicht unterstützt. Wenn es gesetzt ist, gibt das Tool einen Fehler zurück.
- Mehrere PDF-Eingaben werden unterstützt; jede PDF wird vor dem Prompt als nativer Dokumentblock bzw. inline-PDF-Teil gesendet.

### Extraktions-Fallback-Modus

Der Fallback-Modus wird für nicht native Anbieter verwendet.

Ablauf:

1. Text aus ausgewählten Seiten extrahieren (bis zu `agents.defaults.pdfMaxPages`, Standard `20`).
2. Wenn die Länge des extrahierten Texts unter `200` Zeichen liegt, ausgewählte Seiten als PNG-Bilder rendern und einschließen.
3. Extrahierten Inhalt zusammen mit dem Prompt an das ausgewählte Modell senden.

Details zum Fallback:

- Die Extraktion von Seitenbildern verwendet ein Pixelbudget von `4,000,000`.
- Wenn das Zielmodell keine Bildeingaben unterstützt und kein extrahierbarer Text vorhanden ist, gibt das Tool einen Fehler zurück.
- Wenn die Textextraktion erfolgreich ist, die Bildextraktion aber Vision bei einem reinen Textmodell erfordern würde, verwirft OpenClaw die gerenderten Bilder und fährt nur mit dem extrahierten Text fort.
- Der Extraktions-Fallback verwendet das gebündelte Plugin `document-extract`. Das Plugin besitzt `pdfjs-dist`; `@napi-rs/canvas` wird nur verwendet, wenn ein Fallback für das Rendern von Bildern verfügbar ist.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) für vollständige Felddetails.

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Häufige `details`-Felder:

- `model`: aufgelöste Modellreferenz (`provider/model`)
- `native`: `true` für nativen Anbietermodus, `false` für Fallback
- `attempts`: Fallback-Versuche, die vor dem Erfolg fehlgeschlagen sind

Pfadfelder:

- einzelne PDF-Eingabe: `details.pdf`
- mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zum Umschreiben von Sandbox-Pfaden (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

- Fehlende PDF-Eingabe: löst `pdf required: provide a path or URL to a PDF document` aus
- Zu viele PDFs: gibt einen strukturierten Fehler in `details.error = "too_many_pdfs"` zurück
- Nicht unterstütztes Referenzschema: gibt `details.error = "unsupported_pdf_reference"` zurück
- Nativer Modus mit `pages`: löst den eindeutigen Fehler `pages is not supported with native PDF providers` aus

## Beispiele

Einzelne PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Mehrere PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Seitengefiltertes Fallback-Modell:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Zugehörig

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agenten-Tools
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfiguration für pdfMaxBytesMb und pdfMaxPages
