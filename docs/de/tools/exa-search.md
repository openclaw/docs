---
read_when:
    - Sie möchten Exa für `web_search` verwenden
    - Sie benötigen ein `EXA_API_KEY`
    - Sie möchten neuronale Suche oder Inhaltsextraktion
summary: Exa-AI-Suche -- neuronale und Keyword-Suche mit Inhaltsextraktion
title: Exa-Suche
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:02:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw unterstützt [Exa AI](https://exa.ai/) als Anbieter für `web_search`. Exa
bietet neuronale, Keyword- und Hybrid-Suchmodi mit integrierter Inhalts-
Extraktion (Highlights, Text, Zusammenfassungen).

## Einen API-Schlüssel beziehen

<Steps>
  <Step title="Ein Konto erstellen">
    Registrieren Sie sich unter [exa.ai](https://exa.ai/) und erzeugen Sie einen API-Schlüssel in Ihrem
    Dashboard.
  </Step>
  <Step title="Den Schlüssel speichern">
    Setzen Sie `EXA_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

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
            apiKey: "exa-...", // optional, wenn EXA_API_KEY gesetzt ist
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

**Alternative über die Umgebung:** Setzen Sie `EXA_API_KEY` in der Gateway-Umgebung.
Bei einer Gateway-Installation legen Sie es in `~/.openclaw/.env` ab.

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number">
Zurückzugebende Ergebnisse (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Suchmodus.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter.
</ParamField>

<ParamField path="date_after" type="string">
Ergebnisse nach diesem Datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Ergebnisse vor diesem Datum (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Optionen für Inhaltsextraktion (siehe unten).
</ParamField>

### Inhaltsextraktion

Exa kann extrahierte Inhalte zusammen mit Suchergebnissen zurückgeben. Übergeben Sie ein Objekt
`contents`, um dies zu aktivieren:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // vollständiger Seitentext
    highlights: { numSentences: 3 }, // Schlüsselsätze
    summary: true, // AI-Zusammenfassung
  },
});
```

| Option für contents | Typ                                                                   | Beschreibung                 |
| ------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`              | `boolean \| { maxCharacters }`                                        | Vollständigen Seitentext extrahieren |
| `highlights`        | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Schlüsselsätze extrahieren   |
| `summary`           | `boolean \| { query }`                                                | AI-generierte Zusammenfassung |

### Suchmodi

| Modus            | Beschreibung                          |
| ---------------- | ------------------------------------- |
| `auto`           | Exa wählt den besten Modus (Standard) |
| `neural`         | Semantische/bedeutungsbasierte Suche  |
| `fast`           | Schnelle Keyword-Suche                |
| `deep`           | Gründliche Deep Search                |
| `deep-reasoning` | Deep Search mit Reasoning             |
| `instant`        | Schnellste Ergebnisse                 |

## Hinweise

- Wenn keine Option `contents` angegeben wird, verwendet Exa standardmäßig `{ highlights: true }`,
  sodass Ergebnisse Auszüge wichtiger Sätze enthalten
- Ergebnisse behalten `highlightScores`- und `summary`-Felder aus der Antwort der Exa-API
  bei, wenn sie verfügbar sind
- Ergebnisbeschreibungen werden zuerst aus Highlights, dann aus der Zusammenfassung und dann aus
  dem vollständigen Text aufgelöst — je nachdem, was verfügbar ist
- `freshness` und `date_after`/`date_before` können nicht kombiniert werden — verwenden Sie einen
  Zeitfiltermodus
- Pro Anfrage können bis zu 100 Ergebnisse zurückgegeben werden (vorbehaltlich der Limits
  des Suchtyps von Exa)
- Ergebnisse werden standardmäßig 15 Minuten zwischengespeichert (konfigurierbar über
  `cacheTtlMinutes`)
- Exa ist eine offizielle API-Integration mit strukturierten JSON-Antworten

## Verwandt

- [Überblick über Web Search](/de/tools/web) -- alle Anbieter und Auto-Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
