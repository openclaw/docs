---
read_when:
    - Sie möchten Brave Search für web_search verwenden
    - Sie benötigen einen BRAVE_API_KEY oder Tarifdetails
summary: Einrichtung der Brave Search API für web_search
title: Brave-Suche
x-i18n:
    generated_at: "2026-05-02T06:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5b6624d078ba55e30fbac4dd863a0d016e2e8d160e32bcc406e5070998241ba
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw unterstützt Brave Search API als `web_search`-Provider.

## API-Schlüssel abrufen

1. Erstellen Sie ein Brave Search API-Konto unter [https://brave.com/search/api/](https://brave.com/search/api/)
2. Wählen Sie im Dashboard den **Search**-Plan aus und generieren Sie einen API-Schlüssel.
3. Speichern Sie den Schlüssel in der Konfiguration oder setzen Sie `BRAVE_API_KEY` in der Gateway-Umgebung.

## Konfigurationsbeispiel

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Provider-spezifische Brave-Sucheinstellungen liegen jetzt unter `plugins.entries.brave.config.webSearch.*`.
Das ältere `tools.web.search.apiKey` wird weiterhin über die Kompatibilitätsschicht geladen, ist aber nicht mehr der kanonische Konfigurationspfad.

`webSearch.mode` steuert den Brave-Transport:

- `web` (Standard): normale Brave-Websuche mit Titeln, URLs und Snippets
- `llm-context`: Brave LLM Context API mit vorab extrahierten Textblöcken und Quellen für Grounding

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1-10).
</ParamField>

<ParamField path="country" type="string">
2-stelliger ISO-Ländercode (z. B. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO-639-1-Sprachcode für Suchergebnisse (z. B. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave-Suchsprachcode (z. B. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
ISO-Sprachcode für UI-Elemente.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter - `day` entspricht 24 Stunden.
</ParamField>

<ParamField path="date_after" type="string">
Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

**Beispiele:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Hinweise

- OpenClaw verwendet den Brave-**Search**-Plan. Wenn Sie ein älteres Abonnement haben (z. B. den ursprünglichen Free-Plan mit 2.000 Anfragen/Monat), bleibt es gültig, umfasst aber keine neueren Funktionen wie LLM Context oder höhere Ratenlimits.
- Jeder Brave-Plan enthält **\$5/Monat kostenloses Guthaben** (wird erneuert). Der Search-Plan kostet \$5 pro 1.000 Anfragen, daher deckt das Guthaben 1.000 Abfragen/Monat ab. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest, um unerwartete Kosten zu vermeiden. Aktuelle Pläne finden Sie im [Brave API-Portal](https://brave.com/search/api/).
- Der Search-Plan umfasst den LLM Context-Endpunkt und KI-Inferenzrechte. Zum Speichern von Ergebnissen für das Trainieren oder Anpassen von Modellen ist ein Plan mit ausdrücklichen Speicherrechten erforderlich. Siehe die Brave-[Nutzungsbedingungen](https://api-dashboard.search.brave.com/terms-of-service).
- Der `llm-context`-Modus gibt fundierte Quelleinträge statt der normalen Websuche-Snippet-Struktur zurück.
- Der `llm-context`-Modus unterstützt `freshness` und begrenzte Bereiche mit `date_after` + `date_before`. Er unterstützt `ui_lang` nicht; `date_before` ohne `date_after` wird abgelehnt, da Brave für benutzerdefinierte Aktualitätsbereiche sowohl Start- als auch Enddatum verlangt.
- `ui_lang` muss ein Regionssubtag wie `en-US` enthalten.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (über `cacheTtlMinutes` konfigurierbar).

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
