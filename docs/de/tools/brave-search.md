---
read_when:
    - Sie möchten Brave Search für `web_search` verwenden
    - Sie benötigen einen BRAVE_API_KEY oder Tarifdetails.
summary: Einrichtung der Brave Search API für web_search
title: Brave-Suche
x-i18n:
    generated_at: "2026-07-12T02:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw unterstützt die Brave Search API als `web_search`-Provider.

## API-Schlüssel abrufen

1. Erstellen Sie unter [https://brave.com/search/api/](https://brave.com/search/api/) ein Brave-Search-API-Konto.
2. Wählen Sie im Dashboard den Tarif **Search** aus und generieren Sie einen API-Schlüssel.
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
            mode: "web", // oder "llm-context"
            baseUrl: "https://api.search.brave.com", // optionale Überschreibung der Proxy-/Basis-URL
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

Provider-spezifische Einstellungen für die Brave-Suche befinden sich unter `plugins.entries.brave.config.webSearch.*`; dies ist der kanonische Konfigurationspfad. Ein gemeinsam genutztes `tools.web.search.apiKey` auf oberster Ebene und ein bereichsspezifisches `tools.web.search.brave.*` werden weiterhin über eine Kompatibilitätszusammenführung geladen, neue Konfigurationen sollten jedoch den oben genannten Plugin-spezifischen Pfad verwenden.

`webSearch.mode` steuert den Brave-Transport:

- `web` (Standard): normale Brave-Websuche mit Titeln, URLs und Auszügen
- `llm-context`: Brave LLM Context API mit vorab extrahierten Textabschnitten und Quellen zur Fundierung

`webSearch.baseUrl` kann Brave-Anfragen an einen vertrauenswürdigen, Brave-kompatiblen Proxy
oder ein Gateway weiterleiten. OpenClaw hängt `/res/v1/web/search` oder `/res/v1/llm/context` an
die konfigurierte Basis-URL an und berücksichtigt die Basis-URL im Cache-Schlüssel. Öffentliche
Endpunkte müssen `https://` verwenden; `http://` wird nur für vertrauenswürdige local loopback-
oder Proxy-Hosts in privaten Netzwerken akzeptiert.

## Tool-Parameter

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1–10).
</ParamField>

<ParamField path="country" type="string">
Zweistelliger ISO-Ländercode (z. B. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO-639-1-Sprachcode für Suchergebnisse (z. B. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Brave-Sprachcode für die Suche (z. B. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
ISO-Sprachcode für Elemente der Benutzeroberfläche.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter – `day` entspricht 24 Stunden.
</ParamField>

<ParamField path="date_after" type="string">
Nur Ergebnisse, die nach diesem Datum (`YYYY-MM-DD`) veröffentlicht wurden.
</ParamField>

<ParamField path="date_before" type="string">
Nur Ergebnisse, die vor diesem Datum (`YYYY-MM-DD`) veröffentlicht wurden.
</ParamField>

**Beispiele:**

```javascript
// Länder- und sprachspezifische Suche
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Aktuelle Ergebnisse (vergangene Woche)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Suche in einem Datumsbereich
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Hinweise

- OpenClaw verwendet den Brave-Tarif **Search**. Wenn Sie ein älteres Abonnement haben (z. B. den ursprünglichen kostenlosen Tarif mit 2.000 Anfragen pro Monat), bleibt es gültig, enthält jedoch keine neueren Funktionen wie LLM Context oder höhere Ratenlimits.
- Jeder Brave-Tarif umfasst **\$5 kostenloses Guthaben pro Monat** (wird monatlich erneuert). Der Search-Tarif kostet \$5 pro 1.000 Anfragen, sodass das Guthaben 1.000 Anfragen pro Monat abdeckt. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest, um unerwartete Kosten zu vermeiden. Aktuelle Tarife finden Sie im [Brave-API-Portal](https://brave.com/search/api/).
- Der Search-Tarif umfasst den LLM-Context-Endpunkt und Rechte zur KI-Inferenz. Für das Speichern von Ergebnissen zum Trainieren oder Abstimmen von Modellen ist ein Tarif mit ausdrücklichen Speicherrechten erforderlich. Siehe die [Nutzungsbedingungen](https://api-dashboard.search.brave.com/terms-of-service) von Brave.
- Der Modus `llm-context` gibt fundierte Quelleinträge anstelle der normalen Auszüge der Websuche zurück.
- Der Modus `llm-context` unterstützt `freshness` und begrenzte Bereiche mit `date_after` und `date_before`. Er unterstützt `ui_lang` nicht; `date_before` ohne `date_after` wird abgelehnt, da Brave bei benutzerdefinierten Aktualitätsbereichen sowohl ein Start- als auch ein Enddatum voraussetzt.
- `ui_lang` muss ein Regions-Subtag wie `en-US` enthalten.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (über `cacheTtlMinutes` konfigurierbar).
- Benutzerdefinierte Werte für `webSearch.baseUrl` werden in die Brave-Cache-Identität einbezogen, sodass
  Proxy-spezifische Antworten nicht miteinander kollidieren.
- Aktivieren Sie zur Fehlerbehebung das Diagnose-Flag `brave.http`, um Brave-Anfrage-URLs und Abfrageparameter, Antwortstatus und -dauer sowie Treffer-, Fehltreffer- und Schreibereignisse des Such-Caches zu protokollieren. Das Flag protokolliert weder den API-Schlüssel noch Antwortinhalte, Suchanfragen können jedoch vertraulich sein.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Perplexity-Suche](/de/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
- [Exa-Suche](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
