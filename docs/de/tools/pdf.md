---
read_when:
    - Sie möchten PDFs von Agenten analysieren
    - Sie benötigen die genauen Parameter und Beschränkungen des PDF-Tools.
    - Sie debuggen den nativen PDF-Modus im Vergleich zum Extraktions-Fallback
summary: Analysieren Sie ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktion als Fallback
title: PDF-Werkzeug
x-i18n:
    generated_at: "2026-07-12T15:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück. Das Tool verwendet die native Dokumenteingabe bei Modellen von Anthropic und Google und greift bei allen anderen Providern auf die Text-/Bildextraktion zurück.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw ein PDF-fähiges Modell für den Agenten ermitteln kann. Reihenfolge der Ermittlung:

1. `agents.defaults.pdfModel` (explizites primäres Modell/Fallbacks)
2. `agents.defaults.imageModel` (explizites primäres Modell/Fallbacks)
3. Das ermittelte Sitzungs-/Standardmodell des Agenten, sofern dessen Provider die native PDF-Eingabe unterstützt (Anthropic, Google) oder bereits über ein konfiguriertes Vision-Modell verfügt
4. Automatisch erkannte bild-/vision-fähige Provider mit verwendbarer Authentifizierung, wobei Provider mit nativer PDF-Unterstützung bevorzugt werden

Die Authentifizierung jedes Fallback-Kandidaten wird vor der Verwendung geprüft. Ein konfiguriertes `provider/model` zählt daher nur, wenn OpenClaw den Provider für den Agenten authentifizieren kann. Wenn kein verwendbares Modell ermittelt wird, wird das Tool `pdf` nicht bereitgestellt.

## Eingabereferenz

<ParamField path="pdf" type="string">
Ein PDF-Pfad oder eine URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Mehrere PDF-Pfade oder URLs, insgesamt bis zu 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analysieren Sie dieses PDF-Dokument.">
Analyse-Prompt.
</ParamField>

<ParamField path="pages" type="string">
Seitenfilter wie `1-5` oder `1,3,7-9`. Wird im nativen Provider-Modus nicht unterstützt.
</ParamField>

<ParamField path="password" type="string">
Passwort für verschlüsselte PDFs. Gilt für jedes PDF in der Anfrage und wird nur im Extraktions-Fallback-Modus verwendet.
</ParamField>

<ParamField path="model" type="string">
Optionale Modellüberschreibung im Format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenbeschränkung pro PDF in MB. Standardmäßig `agents.defaults.pdfMaxBytesMb` oder `10`, falls nicht festgelegt.
</ParamField>

Hinweise:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert; mindestens eine Angabe ist erforderlich.
- `pages` wird als 1-basierte Seitennummern interpretiert, dedupliziert, sortiert und auf `agents.defaults.pdfMaxPages` (Standardwert `20`) begrenzt. Ein Bereich, der keine innerhalb der Grenzen liegenden Seiten enthält, führt vor dem Modellaufruf zu einem Fehler.

## Unterstützte PDF-Referenzen

- Lokaler Dateipfad (einschließlich `~`-Erweiterung)
- `file://`-URL
- `http://`- und `https://`-URL
- Von OpenClaw verwaltete eingehende Referenzen wie `media://inbound/<id>`

Andere URI-Schemata (zum Beispiel `ftp://`) geben `details.error = "unsupported_pdf_reference"` zurück. Entfernte `http(s)`-URLs werden abgelehnt, wenn das Tool in einer Sandbox ausgeführt wird. Bei aktivierter Dateirichtlinie, die den Zugriff auf den Workspace beschränkt, werden lokale Pfade außerhalb der zulässigen Wurzeln abgelehnt; verwaltete eingehende Referenzen und erneut wiedergegebene Pfade im Speicher für eingehende Medien von OpenClaw bleiben zulässig.

## Ausführungsmodi

### Nativer Provider-Modus

Wird für die Provider `anthropic` und `google` verwendet (die einzigen Provider, die derzeit native Unterstützung für PDF-Dokumente deklarieren). Die rohen PDF-Bytes werden pro Datei direkt als nativer Dokument-/Inline-PDF-Teil an die Provider-API gesendet.

Beschränkungen:

- `pages` wird nicht unterstützt; falls festgelegt, löst das Tool `pages is not supported with native PDF providers` aus.
- `password` wird nicht unterstützt; falls festgelegt, löst das Tool `password is not supported with native PDF providers` aus. Verwenden Sie für verschlüsselte PDFs ein nicht natives Modell.

### Extraktions-Fallback-Modus

Wird für alle anderen Provider verwendet.

1. Extrahiert über das gebündelte Plugin `document-extract` Text aus den ausgewählten Seiten (bis zu `agents.defaults.pdfMaxPages`, Standardwert `20`). Das Plugin verwendet das Paket `clawpdf` (PDFium WebAssembly) zur Text- und Bildextraktion.
2. Wenn der extrahierte Text kürzer als `200` Zeichen ist, werden dieselben Seiten als PNG-Bilder gerendert. Das Renderbudget beträgt insgesamt `4,000,000` Pixel und wird auf alle Seiten verteilt, für die Bilder erforderlich sind (proportional pro verbleibender Seite, nicht pro Seite). Textseiten, die bereits genügend Text enthalten, überspringen das Rendering daher vollständig.
3. Sendet den extrahierten Text (und alle gerenderten Bilder) zusammen mit dem Prompt an das ausgewählte Modell.

Details:

- Verschlüsselte PDFs werden mit dem übergeordneten Parameter `password` geöffnet.
- Wenn das Modell keine Bildeingabe unterstützt und kein Text extrahiert werden kann, gibt das Tool einen Fehler zurück.
- Wenn das Rendern der Bilder fehlschlägt, verwirft OpenClaw die Bilder und fährt mit dem extrahierten Text fort.
- Wenn das Zielmodell ausschließlich Text unterstützt und die Extraktion Bilder erzeugt hat, verwirft OpenClaw die Bilder und sendet nur den Text.

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

| Schlüssel                        | Standardwert      | Bedeutung                                                                                                          |
| -------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`       | nicht festgelegt  | Explizite primäre/Fallback-PDF-Modelle; greift auf `imageModel` und anschließend auf das Sitzungsmodell zurück.    |
| `agents.defaults.pdfMaxBytesMb`  | `10`              | Größenbeschränkung pro PDF in MB.                                                                                  |
| `agents.defaults.pdfMaxPages`    | `20`              | Maximale Anzahl der pro PDF verarbeiteten Seiten.                                                                  |

Vollständige Details zu den Feldern finden Sie in der [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults).

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Gängige `details`-Felder:

- `model`: ermittelte Modellreferenz (`provider/model`)
- `native`: `true` für den nativen Provider-Modus, `false` für den Fallback
- `attempts`: Fallback-Versuche, die vor dem Erfolg fehlgeschlagen sind

Pfadfelder:

- Einzelne PDF-Eingabe: `details.pdf`
- Mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zur Umschreibung von Sandbox-Pfaden (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

| Bedingung                          | Ergebnis                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| Keine PDF-Eingabe                  | Löst `pdf required: provide a path or URL to a PDF document` aus |
| Mehr als 10 PDFs                   | `details.error = "too_many_pdfs"`                              |
| Nicht unterstütztes Referenzschema | `details.error = "unsupported_pdf_reference"`                  |
| `pages` mit einem nativen Provider | Löst `pages is not supported with native PDF providers` aus    |
| `password` mit einem nativen Provider | Löst `password is not supported with native PDF providers` aus |

## Beispiele

Einzelnes PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Fassen Sie diesen Bericht in 5 Stichpunkten zusammen"
}
```

Mehrere PDFs:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Vergleichen Sie Risiken und Änderungen des Zeitplans in beiden Dokumenten"
}
```

Fallback-Modell mit Seitenfilter:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extrahieren Sie nur Vorfälle mit Auswirkungen auf Kunden"
}
```

Verschlüsseltes PDF mit Extraktions-Fallback:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Fassen Sie diesen Vertrag zusammen"
}
```

## Verwandte Themen

- [Tool-Übersicht](/de/tools) – alle verfügbaren Agenten-Tools
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) – Konfiguration von pdfMaxBytesMb und pdfMaxPages
