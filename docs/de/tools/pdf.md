---
read_when:
    - Sie möchten PDFs von Agenten analysieren
    - Sie benötigen die genauen Parameter und Limits des PDF-Tools
    - Sie debuggen den nativen PDF-Modus im Vergleich zum Extraktions-Fallback.
summary: Analysieren Sie ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktions-Fallback
title: PDF-Tool
x-i18n:
    generated_at: "2026-06-27T18:20:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück.

Kurzverhalten:

- Nativer Provider-Modus für Anthropic- und Google-Model-Provider.
- Extraktions-Fallback-Modus für andere Provider (zuerst Text extrahieren, dann bei Bedarf Seitenbilder).
- Unterstützt einzelne (`pdf`) oder mehrere (`pdfs`) Eingaben, maximal 10 PDFs pro Aufruf.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw eine PDF-fähige Modellkonfiguration für den Agenten auflösen kann:

1. `agents.defaults.pdfModel`
2. Fallback auf `agents.defaults.imageModel`
3. Fallback auf das aufgelöste Sitzungs-/Standardmodell des Agenten
4. Wenn native PDF-Provider authentifizierungsbasiert verfügbar sind, werden sie generischen Kandidaten für den Bild-Fallback vorgezogen

Wenn kein verwendbares Modell aufgelöst werden kann, wird das Tool `pdf` nicht bereitgestellt.

Hinweise zur Verfügbarkeit:

- Die Fallback-Kette berücksichtigt Authentifizierung. Ein konfiguriertes `provider/model` zählt nur, wenn
  OpenClaw diesen Provider für den Agenten tatsächlich authentifizieren kann.
- Native PDF-Provider sind derzeit **Anthropic** und **Google**.
- Wenn der aufgelöste Sitzungs-/Standard-Provider bereits ein konfiguriertes Vision-/PDF-
  Modell hat, verwendet das PDF-Tool dieses erneut, bevor es auf andere authentifizierungsbasierte
  Provider zurückfällt.

## Eingabereferenz

<ParamField path="pdf" type="string">
Ein PDF-Pfad oder eine URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Mehrere PDF-Pfade oder URLs, insgesamt bis zu 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyse-Prompt.
</ParamField>

<ParamField path="pages" type="string">
Seitenfilter wie `1-5` oder `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Passwort für verschlüsselte PDFs im Extraktions-Fallback-Modus.
</ParamField>

<ParamField path="model" type="string">
Optionale Modellüberschreibung in der Form `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenlimit pro PDF in MB. Standardwert ist `agents.defaults.pdfMaxBytesMb` oder `10`.
</ParamField>

Eingabehinweise:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert.
- Wenn keine PDF-Eingabe angegeben ist, gibt das Tool einen Fehler aus.
- `pages` wird als 1-basierte Seitenzahlen geparst, dedupliziert, sortiert und auf die konfigurierte maximale Seitenanzahl begrenzt.
- `password` gilt für jedes PDF in der Anfrage und wird nur vom Extraktions-Fallback-Modus verwendet.
- `maxBytesMb` verwendet standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`.

## Unterstützte PDF-Referenzen

- lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL
- von OpenClaw verwaltete eingehende Refs wie `media://inbound/<id>`

Hinweise zu Referenzen:

- Andere URI-Schemata (zum Beispiel `ftp://`) werden mit `unsupported_pdf_reference` abgelehnt.
- Im Sandbox-Modus werden Remote-`http(s)`-URLs abgelehnt.
- Bei aktivierter Workspace-only-Dateirichtlinie werden lokale Dateipfade außerhalb erlaubter Wurzeln abgelehnt.
- Verwaltete eingehende Refs und wiedergegebene Pfade unter OpenClaws Speicher für eingehende Medien sind mit Workspace-only-Dateirichtlinie erlaubt.

## Ausführungsmodi

### Nativer Provider-Modus

Der native Modus wird für Provider `anthropic` und `google` verwendet.
Das Tool sendet rohe PDF-Bytes direkt an Provider-APIs.

Einschränkungen im nativen Modus:

- `pages` wird nicht unterstützt. Wenn gesetzt, gibt das Tool einen Fehler zurück.
- `password` wird nicht unterstützt. Verwenden Sie ein nicht-natives Modell, um verschlüsselte PDFs zu analysieren.
- Mehrere PDF-Eingaben werden unterstützt; jedes PDF wird vor dem Prompt als nativer Dokumentblock /
  Inline-PDF-Teil gesendet.

### Extraktions-Fallback-Modus

Der Fallback-Modus wird für nicht-native Provider verwendet.

Ablauf:

1. Text aus ausgewählten Seiten extrahieren (bis zu `agents.defaults.pdfMaxPages`, Standardwert `20`).
2. Wenn die Länge des extrahierten Texts unter `200` Zeichen liegt, ausgewählte Seiten als PNG-Bilder rendern und einschließen.
3. Extrahierten Inhalt plus Prompt an das ausgewählte Modell senden.

Fallback-Details:

- Die Extraktion von Seitenbildern verwendet ein Pixelbudget von `4,000,000`.
- Verschlüsselte PDFs können mit dem Top-Level-Parameter `password` geöffnet werden.
- Wenn das Zielmodell keine Bildeingabe unterstützt und kein extrahierbarer Text vorhanden ist, gibt das Tool einen Fehler aus.
- Wenn die Textextraktion erfolgreich ist, die Bildextraktion auf einem
  reinen Textmodell jedoch Vision erfordern würde, verwirft OpenClaw die gerenderten Bilder und fährt mit dem
  extrahierten Text fort.
- Der Extraktions-Fallback verwendet das gebündelte Plugin `document-extract`. Das Plugin besitzt
  `clawpdf`, das Textextraktion und Bildrendering über PDFium
  WebAssembly bereitstellt.

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

Weitere Felddetails finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Häufige `details`-Felder:

- `model`: aufgelöste Modellreferenz (`provider/model`)
- `native`: `true` für nativen Provider-Modus, `false` für Fallback
- `attempts`: Fallback-Versuche, die vor dem Erfolg fehlgeschlagen sind

Pfadfelder:

- einzelne PDF-Eingabe: `details.pdf`
- mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zur Sandbox-Pfadumschreibung (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

- Fehlende PDF-Eingabe: wirft `pdf required: provide a path or URL to a PDF document`
- Zu viele PDFs: gibt strukturierten Fehler in `details.error = "too_many_pdfs"` zurück
- Nicht unterstütztes Referenzschema: gibt `details.error = "unsupported_pdf_reference"` zurück
- Nativer Modus mit `pages`: wirft eindeutigen Fehler `pages is not supported with native PDF providers`

## Beispiele

Einzelnes PDF:

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

Fallback-Modell mit Seitenfilter:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Verschlüsseltes PDF mit Extraktions-Fallback:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Verwandt

- [Tools-Übersicht](/de/tools) - alle verfügbaren Agent-Tools
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Konfiguration von pdfMaxBytesMb und pdfMaxPages
