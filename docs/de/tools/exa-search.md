---
read_when:
    - Sie möchten Exa für `web_search` verwenden
    - Sie benötigen einen EXA_API_KEY
    - Sie möchten neuronale Suche oder Inhaltsextraktion
summary: Exa-AI-Suche – neuronale und Stichwortsuche mit Inhaltsextraktion
title: Exa-Suche
x-i18n:
    generated_at: "2026-07-12T16:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) ist ein `web_search`-Provider mit neuronalen, schlüsselwortbasierten und
hybriden Suchmodi sowie integrierter Inhaltsextraktion (Hervorhebungen, Text,
Zusammenfassungen).

## Plugin installieren

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API-Schlüssel abrufen

<Steps>
  <Step title="Konto erstellen">
    Registrieren Sie sich bei [exa.ai](https://exa.ai/) und generieren Sie über Ihr
    Dashboard einen API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `EXA_API_KEY` in der Gateway-Umgebung fest oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional, wenn EXA_API_KEY festgelegt ist
            baseUrl: "https://api.exa.ai", // optional; OpenClaw hängt /search an
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternative über Umgebungsvariable:** Legen Sie `EXA_API_KEY` in der Gateway-Umgebung fest. Bei
einer Gateway-Installation tragen Sie ihn in `~/.openclaw/.env` ein. Siehe
[Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

## Basis-URL überschreiben

Legen Sie `plugins.entries.exa.config.webSearch.baseUrl` fest, um Exa-Suchanfragen
über einen kompatiblen Proxy oder einen alternativen Endpunkt zu leiten. OpenClaw
normalisiert reine Hostnamen, indem es `https://` voranstellt, und hängt `/search` an, sofern
der Pfad nicht bereits damit endet. Der aufgelöste Endpunkt ist Bestandteil des
Such-Cache-Schlüssels, sodass Ergebnisse verschiedener Endpunkte niemals gemeinsam verwendet werden.

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1–100, abhängig von den Einschränkungen des Exa-Suchtyps).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Suchmodus.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter. Kann nicht mit `date_after`/`date_before` kombiniert werden.
</ParamField>

<ParamField path="date_after" type="string">
Ergebnisse nach diesem Datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Ergebnisse vor diesem Datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Optionen zur Inhaltsextraktion (siehe unten).
</ParamField>

### Inhaltsextraktion

Übergeben Sie ein `contents`-Objekt, um die extrahierten Inhalte in den Ergebnissen zu steuern:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // vollständiger Seitentext
    highlights: { numSentences: 3 }, // Kernsätze
    summary: true, // KI-Zusammenfassung
  },
});
```

| Inhaltsoption   | Typ                                                                   | Beschreibung                    |
| --------------- | --------------------------------------------------------------------- | ------------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Vollständigen Seitentext extrahieren |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Kernsätze extrahieren           |
| `summary`       | `boolean \| { query }`                                                | KI-generierte Zusammenfassung   |

Wenn `contents` nicht angegeben wird, verwendet Exa standardmäßig `{ highlights: true }`, sodass die Ergebnisse
Auszüge mit Kernsätzen enthalten. Ergebnisbeschreibungen werden zuerst aus Hervorhebungen,
dann aus der Zusammenfassung und anschließend aus dem vollständigen Text bezogen – je nachdem, was zuerst verfügbar ist. Die Ergebnisse
behalten außerdem die ursprünglichen Felder `highlightScores` und `summary` aus der Antwort der Exa API
bei, sofern diese verfügbar sind.

### Suchmodi

| Modus            | Beschreibung                                 |
| ---------------- | -------------------------------------------- |
| `auto`           | Exa wählt den besten Modus (Standard)        |
| `neural`         | Semantische/bedeutungsbasierte Suche         |
| `fast`           | Schnelle Schlüsselwortsuche                  |
| `deep`           | Gründliche Tiefensuche                       |
| `deep-reasoning` | Tiefensuche mit Schlussfolgerung             |
| `instant`        | Schnellste Ergebnisse                        |

## Hinweise

- `count` akzeptiert bis zu 100, abhängig von den Einschränkungen des Exa-Suchtyps.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert. Konfigurieren Sie die gemeinsamen
  Einstellungen `tools.web.search.cacheTtlMinutes` (Minuten) und
  `tools.web.search.timeoutSeconds` (Standardwert: 30s), um die Zwischenspeicherung und
  das Anfrage-Timeout für alle `web_search`-Provider einschließlich Exa zu ändern.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domainfilterung
