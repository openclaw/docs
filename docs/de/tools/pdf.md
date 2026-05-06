---
read_when:
    - Sie möchten PDFs von Agenten analysieren
    - Sie benötigen genaue Parameter und Grenzwerte für das PDF-Tool
    - Sie debuggen den nativen PDF-Modus im Vergleich zum Extraktions-Fallback
summary: Analysieren Sie ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktions-Fallback
title: PDF-Tool
x-i18n:
    generated_at: "2026-05-06T07:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück.

Kurzverhalten:

- Nativer Provider-Modus für Anthropic- und Google-Modell-Provider.
- Extraktions-Fallback-Modus für andere Provider (zuerst Text extrahieren, dann bei Bedarf Seitenbilder).
- Unterstützt einzelne (`pdf`) oder mehrere (`pdfs`) Eingaben, maximal 10 PDFs pro Aufruf.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw eine PDF-fähige Modellkonfiguration für den Agent auflösen kann:

1. `agents.defaults.pdfModel`
2. Fallback auf `agents.defaults.imageModel`
3. Fallback auf das aufgelöste Sitzungs-/Standardmodell des Agents
4. Wenn native PDF-Provider authentifizierungsbasiert sind, werden sie generischen Bild-Fallback-Kandidaten vorgezogen

Wenn kein verwendbares Modell aufgelöst werden kann, wird das `pdf`-Tool nicht bereitgestellt.

Hinweise zur Verfügbarkeit:

- Die Fallback-Kette berücksichtigt die Authentifizierung. Ein konfiguriertes `provider/model` zählt nur, wenn
  OpenClaw den Provider für den Agent tatsächlich authentifizieren kann.
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

<ParamField path="model" type="string">
Optionale Modellüberschreibung in der Form `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenlimit pro PDF in MB. Standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`.
</ParamField>

Eingabehinweise:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert.
- Wenn keine PDF-Eingabe bereitgestellt wird, gibt das Tool einen Fehler aus.
- `pages` wird als 1-basierte Seitennummern geparst, dedupliziert, sortiert und auf die konfigurierte maximale Seitenanzahl begrenzt.
- `maxBytesMb` ist standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`.

## Unterstützte PDF-Referenzen

- lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL
- Von OpenClaw verwaltete eingehende Referenzen wie `media://inbound/<id>`

Referenzhinweise:

- Andere URI-Schemata (zum Beispiel `ftp://`) werden mit `unsupported_pdf_reference` abgelehnt.
- Im Sandbox-Modus werden entfernte `http(s)`-URLs abgelehnt.
- Wenn die Nur-Workspace-Dateirichtlinie aktiviert ist, werden lokale Dateipfade außerhalb erlaubter Wurzeln abgelehnt.
- Verwaltete eingehende Referenzen und erneut abgespielte Pfade unter OpenClaws eingehendem Medienspeicher sind mit der Nur-Workspace-Dateirichtlinie erlaubt.

## Ausführungsmodi

### Nativer Provider-Modus

Der native Modus wird für die Provider `anthropic` und `google` verwendet.
Das Tool sendet rohe PDF-Bytes direkt an Provider-APIs.

Grenzen des nativen Modus:

- `pages` wird nicht unterstützt. Wenn gesetzt, gibt das Tool einen Fehler zurück.
- Eingaben mit mehreren PDFs werden unterstützt; jedes PDF wird vor dem Prompt als nativer Dokumentblock /
  Inline-PDF-Teil gesendet.

### Extraktions-Fallback-Modus

Der Fallback-Modus wird für nicht-native Provider verwendet.

Ablauf:

1. Text aus ausgewählten Seiten extrahieren (bis zu `agents.defaults.pdfMaxPages`, Standard `20`).
2. Wenn die extrahierte Textlänge unter `200` Zeichen liegt, ausgewählte Seiten als PNG-Bilder rendern und einbeziehen.
3. Extrahierten Inhalt plus Prompt an das ausgewählte Modell senden.

Fallback-Details:

- Die Seitenbildextraktion verwendet ein Pixelbudget von `4,000,000`.
- Wenn das Zielmodell keine Bildeingabe unterstützt und kein extrahierbarer Text vorhanden ist, gibt das Tool einen Fehler aus.
- Wenn die Textextraktion erfolgreich ist, die Bildextraktion jedoch Vision für ein
  reines Textmodell erfordern würde, verwirft OpenClaw die gerenderten Bilder und fährt mit dem
  extrahierten Text fort.
- Der Extraktions-Fallback verwendet das gebündelte `document-extract`-Plugin. Das Plugin besitzt
  `pdfjs-dist`; `@napi-rs/canvas` wird nur verwendet, wenn der Fallback für das Rendern von Bildern
  verfügbar ist.

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
- `native`: `true` für den nativen Provider-Modus, `false` für den Fallback
- `attempts`: Fallback-Versuche, die vor dem Erfolg fehlgeschlagen sind

Pfadfelder:

- einzelne PDF-Eingabe: `details.pdf`
- mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zur Sandbox-Pfadumschreibung (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

- Fehlende PDF-Eingabe: löst `pdf required: provide a path or URL to a PDF document` aus
- Zu viele PDFs: gibt einen strukturierten Fehler in `details.error = "too_many_pdfs"` zurück
- Nicht unterstütztes Referenzschema: gibt `details.error = "unsupported_pdf_reference"` zurück
- Nativer Modus mit `pages`: löst einen klaren Fehler `pages is not supported with native PDF providers` aus

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

## Verwandt

- [Tools-Übersicht](/de/tools) - alle verfügbaren Agent-Tools
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - pdfMaxBytesMb- und pdfMaxPages-Konfiguration
