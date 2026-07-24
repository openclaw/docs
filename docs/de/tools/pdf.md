---
read_when:
    - Sie möchten PDFs von Agenten analysieren
    - Sie benötigen die genauen Parameter und Beschränkungen des PDF-Tools
    - Sie debuggen den nativen PDF-Modus im Vergleich zum Extraktions-Fallback.
summary: Analysieren Sie ein oder mehrere PDF-Dokumente mit nativer Provider-Unterstützung und Extraktion als Fallback
title: PDF-Tool
x-i18n:
    generated_at: "2026-07-24T05:21:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e0e5b897e1e122af4b2f6f9a3eaeb73f6e93af1051d306ad82539b258de90c49
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analysiert ein oder mehrere PDF-Dokumente und gibt Text zurück. Das Tool verwendet die native Dokumenteingabe bei Anthropic- und Google-Modellen und greift bei jedem anderen Provider auf die Text-/Bildextraktion zurück.

## Verfügbarkeit

Das Tool wird nur registriert, wenn OpenClaw ein PDF-fähiges Modell für den Agenten auflösen kann. Auflösungsreihenfolge:

1. `agents.defaults.pdfModel` (explizites primäres Modell/Fallbacks)
2. `agents.defaults.imageModel` (explizites primäres Modell/Fallbacks)
3. Das aufgelöste Sitzungs-/Standardmodell des Agenten, sofern dessen Provider die native PDF-Eingabe unterstützt (Anthropic, Google) oder bereits über ein konfiguriertes Vision-Modell verfügt
4. Automatisch erkannte bild-/visionfähige Provider mit verwendbarer Authentifizierung, wobei Provider mit nativer PDF-Unterstützung bevorzugt werden

Die Authentifizierung jedes Fallback-Kandidaten wird vor der Verwendung geprüft. Daher zählt ein konfiguriertes `provider/model` nur, wenn OpenClaw den Agenten bei diesem Provider authentifizieren kann. Wenn kein verwendbares Modell aufgelöst werden kann, wird das Tool `pdf` nicht bereitgestellt.

## Eingabereferenz

<ParamField path="pdf" type="string">
Ein PDF-Pfad oder eine PDF-URL.
</ParamField>

<ParamField path="pdfs" type="string[]">
Mehrere PDF-Pfade oder -URLs, insgesamt bis zu 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analyseanweisung.
</ParamField>

<ParamField path="pages" type="string">
Seitenfilter wie `1-5` oder `1,3,7-9`. Wird im nativen Provider-Modus nicht unterstützt.
</ParamField>

<ParamField path="password" type="string">
Passwort für verschlüsselte PDFs. Gilt für jede PDF-Datei in der Anfrage und wird nur im Extraktions-Fallback-Modus verwendet.
</ParamField>

<ParamField path="model" type="string">
Optionale Modellüberschreibung im Format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Größenbegrenzung pro PDF in MB. Standardmäßig `agents.defaults.pdfMaxMb` oder `10`, falls nicht festgelegt.
</ParamField>

Hinweise:

- `pdf` und `pdfs` werden vor dem Laden zusammengeführt und dedupliziert; mindestens eines davon ist erforderlich.
- `pages` wird als 1-basierte Seitennummern geparst, dedupliziert, sortiert und auf `agents.defaults.pdfMaxPages` begrenzt (Standardwert `20`). Ein Bereich, der keine gültigen Seiten umfasst, führt vor dem Modellaufruf zu einem Fehler.

## Unterstützte PDF-Referenzen

- Lokaler Dateipfad (einschließlich Erweiterung von `~`)
- `file://`-URL
- `http://`- und `https://`-URL
- Von OpenClaw verwaltete eingehende Referenzen wie `media://inbound/<id>`

Andere URI-Schemata (zum Beispiel `ftp://`) geben `details.error = "unsupported_pdf_reference"` zurück. Remote-URLs vom Typ `http(s)` werden abgelehnt, wenn das Tool in einer Sandbox ausgeführt wird. Wenn die Dateirichtlinie auf den Arbeitsbereich beschränkt ist, werden lokale Pfade außerhalb der zulässigen Stammverzeichnisse abgelehnt; verwaltete eingehende Referenzen und wiedergegebene Pfade im Speicher für eingehende Medien von OpenClaw bleiben zulässig.

## Ausführungsmodi

### Nativer Provider-Modus

Wird für die Provider `anthropic` und `google` verwendet (die einzigen Provider, die derzeit native Unterstützung für PDF-Dokumente deklarieren). Die unverarbeiteten PDF-Bytes werden pro Datei direkt als nativer Dokument-/Inline-PDF-Teil an die Provider-API gesendet.

Beschränkungen:

- `pages` wird nicht unterstützt; wenn es festgelegt ist, löst das Tool `pages is not supported with native PDF providers` aus.
- `password` wird nicht unterstützt; wenn es festgelegt ist, löst das Tool `password is not supported with native PDF providers` aus. Verwenden Sie für verschlüsselte PDFs ein nicht natives Modell.

### Extraktions-Fallback-Modus

Wird für jeden anderen Provider verwendet.

1. Extrahiert Text aus den ausgewählten Seiten (bis zu `agents.defaults.pdfMaxPages`, Standardwert `20`) über das gebündelte Plugin `document-extract`, das für die Text- und Bildextraktion das Paket `clawpdf` (PDFium WebAssembly) verwendet.
2. Wenn der extrahierte Text kürzer als `200` Zeichen ist, werden dieselben Seiten als PNG-Bilder gerendert. Das Renderbudget beträgt insgesamt `4,000,000` Pixel und wird auf alle Seiten verteilt, für die Bilder benötigt werden (proportional pro verbleibender Seite, nicht pro Seite). Textseiten, die bereits genügend Text enthalten, überspringen das Rendering daher vollständig.
3. Sendet den extrahierten Text (und alle gerenderten Bilder) zusammen mit der Anweisung an das ausgewählte Modell.

Details:

- Verschlüsselte PDFs werden mit dem übergeordneten Parameter `password` geöffnet.
- Wenn das Modell keine Bildeingabe unterstützt und kein Text extrahiert werden kann, gibt das Tool einen Fehler aus.
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

| Schlüssel                      | Standardwert | Bedeutung                                                                                                        |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`    | nicht festgelegt   | Explizite primäre/Fallback-PDF-Modelle; fällt auf `imageModel` und anschließend auf das Sitzungsmodell zurück. |
| `agents.defaults.pdfMaxMb`    | `10`    | Größenbegrenzung pro PDF in MB.                                                                   |
| `agents.defaults.pdfMaxPages` | `20`    | Maximale Anzahl verarbeiteter Seiten pro PDF.                                                              |

Ausführliche Informationen zu den Feldern finden Sie in der [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults).

## Ausgabedetails

Das Tool gibt Text in `content[0].text` und strukturierte Metadaten in `details` zurück.

Gängige Felder von `details`:

- `model`: aufgelöste Modellreferenz (`provider/model`)
- `native`: `true` für den nativen Provider-Modus, `false` für den Fallback
- `attempts`: fehlgeschlagene Fallback-Versuche vor dem Erfolg

Pfadfelder:

- Einzelne PDF-Eingabe: `details.pdf`
- Mehrere PDF-Eingaben: `details.pdfs[]` mit `pdf`-Einträgen
- Metadaten zur Umschreibung von Sandbox-Pfaden (falls zutreffend): `rewrittenFrom`

## Fehlerverhalten

| Bedingung                         | Ergebnis                                                         |
| --------------------------------- | -------------------------------------------------------------- |
| Keine PDF-Eingabe                      | Löst `pdf required: provide a path or URL to a PDF document` aus |
| Mehr als 10 PDFs                 | `details.error = "too_many_pdfs"`                              |
| Nicht unterstütztes Referenzschema      | `details.error = "unsupported_pdf_reference"`                  |
| `pages` mit einem nativen Provider    | Löst `pages is not supported with native PDF providers` aus      |
| `password` mit einem nativen Provider | Löst `password is not supported with native PDF providers` aus   |

## Beispiele

Einzelne PDF-Datei:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Fassen Sie diesen Bericht in 5 Stichpunkten zusammen"
}
```

Mehrere PDF-Dateien:

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

Verschlüsselte PDF-Datei mit Extraktions-Fallback:

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
