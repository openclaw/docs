---
read_when:
    - Sie möchten Exa für web_search verwenden
    - Sie benötigen einen EXA_API_KEY
    - Sie möchten neuronale Suche oder Inhaltsextraktion
summary: Exa-AI-Suche -- neuronale Suche und Schlüsselwortsuche mit Inhaltsextraktion
title: Exa-Suche
x-i18n:
    generated_at: "2026-06-27T18:17:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw unterstützt [Exa AI](https://exa.ai/) als `web_search`-Provider. Exa
bietet neuronale, schlüsselwortbasierte und hybride Suchmodi mit integrierter
Inhaltsextraktion (Highlights, Text, Zusammenfassungen).

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann Gateway neu:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API-Schlüssel abrufen

<Steps>
  <Step title="Konto erstellen">
    Registrieren Sie sich unter [exa.ai](https://exa.ai/) und generieren Sie einen API-Schlüssel in Ihrem
    Dashboard.
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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**Alternative über Umgebung:** Legen Sie `EXA_API_KEY` in der Gateway-Umgebung fest.
Bei einer Gateway-Installation tragen Sie ihn in `~/.openclaw/.env` ein.

## Base-URL überschreiben

Legen Sie `plugins.entries.exa.config.webSearch.baseUrl` fest, wenn Exa-Suchanfragen
über einen kompatiblen Proxy oder einen alternativen Exa-Endpunkt laufen sollen. OpenClaw
normalisiert reine Hosts, indem `https://` vorangestellt wird, und hängt `/search` an, sofern der
Pfad dort nicht bereits endet. Der aufgelöste Endpunkt wird in den Suchcache-Schlüssel
aufgenommen, sodass Ergebnisse verschiedener Exa-Endpunkte nicht geteilt werden.

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
Optionen für die Inhaltsextraktion (siehe unten).
</ParamField>

### Inhaltsextraktion

Exa kann extrahierte Inhalte zusammen mit Suchergebnissen zurückgeben. Übergeben Sie ein `contents`-
Objekt, um dies zu aktivieren:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Inhaltsoption | Typ                                                                   | Beschreibung                         |
| -------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `text`         | `boolean \| { maxCharacters }`                                        | Vollständigen Seitentext extrahieren |
| `highlights`   | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Schlüsselsätze extrahieren           |
| `summary`      | `boolean \| { query }`                                                | KI-generierte Zusammenfassung        |

### Suchmodi

| Modus            | Beschreibung                                      |
| ---------------- | ------------------------------------------------- |
| `auto`           | Exa wählt den besten Modus aus (Standard)         |
| `neural`         | Semantische/bedeutungsbasierte Suche              |
| `fast`           | Schnelle schlüsselwortbasierte Suche              |
| `deep`           | Gründliche Tiefensuche                            |
| `deep-reasoning` | Tiefensuche mit Reasoning                         |
| `instant`        | Schnellste Ergebnisse                             |

## Hinweise

- Wenn keine `contents`-Option angegeben ist, verwendet Exa standardmäßig `{ highlights: true }`,
  sodass Ergebnisse Auszüge mit Schlüsselsätzen enthalten
- Ergebnisse behalten die Felder `highlightScores` und `summary` aus der Exa-API-
  Antwort bei, wenn sie verfügbar sind
- Ergebnisbeschreibungen werden zuerst aus Highlights, dann aus der Zusammenfassung und dann aus
  dem vollständigen Text aufgelöst – je nachdem, was verfügbar ist
- `freshness` und `date_after`/`date_before` können nicht kombiniert werden – verwenden Sie einen
  Zeitfiltermodus
- Pro Anfrage können bis zu 100 Ergebnisse zurückgegeben werden (abhängig von den Exa-Suchtyp-
  Limits)
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (konfigurierbar über
  `cacheTtlMinutes`)
- Exa ist eine offizielle API-Integration mit strukturierten JSON-Antworten

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
