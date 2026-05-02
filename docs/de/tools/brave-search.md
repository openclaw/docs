---
read_when:
    - Sie möchten Brave Search für web_search verwenden
    - Sie benötigen einen BRAVE_API_KEY oder Details zum Plan
summary: Einrichtung der Brave Search API für web_search
title: Brave-Suche
x-i18n:
    generated_at: "2026-05-02T21:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw unterstützt die Brave Search API als `web_search`-Provider.

## API-Schlüssel erhalten

1. Erstellen Sie ein Brave Search API-Konto unter [https://brave.com/search/api/](https://brave.com/search/api/)
2. Wählen Sie im Dashboard den **Search**-Tarif aus und generieren Sie einen API-Schlüssel.
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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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
Das Legacy-`tools.web.search.apiKey` wird weiterhin über die Kompatibilitätsschicht geladen, ist aber nicht mehr der kanonische Konfigurationspfad.

`webSearch.mode` steuert den Brave-Transport:

- `web` (Standard): normale Brave-Websuche mit Titeln, URLs und Snippets
- `llm-context`: Brave LLM Context API mit vorab extrahierten Text-Chunks und Quellen für Grounding

`webSearch.baseUrl` kann Brave-Anfragen an einen vertrauenswürdigen Brave-kompatiblen Proxy
oder ein Gateway leiten. OpenClaw hängt `/res/v1/web/search` oder `/res/v1/llm/context` an
die konfigurierte Basis-URL an und behält die Basis-URL im Cache-Schlüssel bei. Öffentliche
Endpunkte müssen `https://` verwenden; `http://` wird nur für vertrauenswürdige local loopback-
oder Private-Network-Proxy-Hosts akzeptiert.

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1-10).
</ParamField>

<ParamField path="country" type="string">
ISO-Ländercode mit 2 Buchstaben (z. B. `US`, `DE`).
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

- OpenClaw verwendet den Brave-**Search**-Tarif. Wenn Sie ein Legacy-Abonnement haben (z. B. den ursprünglichen Free-Tarif mit 2.000 Abfragen/Monat), bleibt es gültig, enthält aber keine neueren Funktionen wie LLM Context oder höhere Ratenlimits.
- Jeder Brave-Tarif enthält **\$5/Monat kostenloses Guthaben** (erneuernd). Der Search-Tarif kostet \$5 pro 1.000 Anfragen, sodass das Guthaben 1.000 Abfragen/Monat abdeckt. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest, um unerwartete Kosten zu vermeiden. Aktuelle Tarife finden Sie im [Brave API-Portal](https://brave.com/search/api/).
- Der Search-Tarif enthält den LLM Context-Endpunkt und Rechte für KI-Inferenz. Das Speichern von Ergebnissen zum Trainieren oder Abstimmen von Modellen erfordert einen Tarif mit ausdrücklichen Speicherrechten. Siehe die Brave-[Nutzungsbedingungen](https://api-dashboard.search.brave.com/terms-of-service).
- Der Modus `llm-context` gibt Grounding-Quelleneinträge statt der normalen Websuche-Snippet-Struktur zurück.
- Der Modus `llm-context` unterstützt `freshness` und begrenzte Bereiche mit `date_after` + `date_before`. Er unterstützt `ui_lang` nicht; `date_before` ohne `date_after` wird abgelehnt, weil Brave für benutzerdefinierte Aktualitätsbereiche sowohl Start- als auch Enddatum verlangt.
- `ui_lang` muss ein Regions-Subtag wie `en-US` enthalten.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (konfigurierbar über `cacheTtlMinutes`).
- Benutzerdefinierte `webSearch.baseUrl`-Werte werden in die Brave-Cache-Identität einbezogen, sodass
  Proxy-spezifische Antworten nicht kollidieren.
- Aktivieren Sie das Diagnose-Flag `brave.http`, um beim Troubleshooting Brave-Anfrage-URLs/Abfrageparameter, Antwortstatus/-Timing und Search-Cache-Hit/Miss/Write-Ereignisse zu protokollieren. Das Flag protokolliert niemals den API-Schlüssel oder Antworttexte, Suchanfragen können jedoch sensibel sein.

## Verwandte Themen

- [Websuche-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Perplexity Search](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
