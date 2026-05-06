---
read_when:
    - Sie möchten Perplexity Search für die Websuche verwenden
    - Sie müssen PERPLEXITY_API_KEY oder OPENROUTER_API_KEY eingerichtet haben
summary: Perplexity Search API und Sonar/OpenRouter-Kompatibilität für web_search
title: Perplexity-Suche
x-i18n:
    generated_at: "2026-05-06T07:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw unterstützt die Perplexity Search API als `web_search`-Provider.
Sie gibt strukturierte Ergebnisse mit den Feldern `title`, `url` und `snippet` zurück.

Aus Kompatibilitätsgründen unterstützt OpenClaw außerdem ältere Setups mit Perplexity Sonar/OpenRouter.
Wenn Sie `OPENROUTER_API_KEY`, einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey` verwenden oder `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` setzen, wechselt der Provider zum Chat-Completions-Pfad und gibt KI-generierte Antworten mit Zitaten statt strukturierter Search-API-Ergebnisse zurück.

## Einen Perplexity-API-Schlüssel erhalten

1. Erstellen Sie ein Perplexity-Konto unter [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generieren Sie im Dashboard einen API-Schlüssel
3. Speichern Sie den Schlüssel in der Konfiguration oder setzen Sie `PERPLEXITY_API_KEY` in der Gateway-Umgebung.

## OpenRouter-Kompatibilität

Wenn Sie bereits OpenRouter für Perplexity Sonar verwendet haben, behalten Sie `provider: "perplexity"` bei und setzen Sie `OPENROUTER_API_KEY` in der Gateway-Umgebung, oder speichern Sie einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey`.

Optionale Kompatibilitätssteuerungen:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Konfigurationsbeispiele

### Native Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter-/Sonar-Kompatibilität

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Wo der Schlüssel gesetzt wird

**Über die Konfiguration:** Führen Sie `openclaw configure --section web` aus. Der Schlüssel wird in
`~/.openclaw/openclaw.json` unter `plugins.entries.perplexity.config.webSearch.apiKey` gespeichert.
Dieses Feld akzeptiert auch SecretRef-Objekte.

**Über die Umgebung:** Setzen Sie `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
in der Prozessumgebung des Gateway. Bei einer Gateway-Installation legen Sie den Wert in
`~/.openclaw/.env` (oder Ihrer Dienstumgebung) ab. Siehe [Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

Wenn `provider: "perplexity"` konfiguriert ist und die Perplexity-Schlüssel-SecretRef nicht aufgelöst werden kann und kein Env-Fallback vorhanden ist, schlägt Start/Neuladen schnell fehl.

## Tool-Parameter

Diese Parameter gelten für den nativen Perplexity-Search-API-Pfad.

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
ISO-639-1-Sprachcode (z. B. `en`, `de`, `fr`).
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

<ParamField path="domain_filter" type="string[]">
Domain-Allowlist-/Denylist-Array (max. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Gesamtes Inhaltsbudget (max. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Token-Limit pro Seite.
</ParamField>

Für den älteren Sonar-/OpenRouter-Kompatibilitätspfad:

- `query`, `count` und `freshness` werden akzeptiert
- `count` dient dort nur der Kompatibilität; die Antwort ist weiterhin eine einzige synthetisierte
  Antwort mit Zitaten statt einer Liste mit N Ergebnissen
- Filter, die nur für die Search API gelten, wie `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` und `max_tokens_per_page`,
  geben explizite Fehler zurück

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

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regeln für Domain-Filter

- Maximal 20 Domains pro Filter
- Allowlist und Denylist können nicht in derselben Anfrage kombiniert werden
- Verwenden Sie das Präfix `-` für Denylist-Einträge (z. B. `["-reddit.com"]`)

## Hinweise

- Die Perplexity Search API gibt strukturierte Websuche-Ergebnisse zurück (`title`, `url`, `snippet`)
- OpenRouter oder explizite Werte für `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schalten Perplexity aus Kompatibilitätsgründen zurück auf Sonar-Chat-Completions
- Sonar-/OpenRouter-Kompatibilität gibt eine synthetisierte Antwort mit Zitaten zurück, keine strukturierten Ergebniszeilen
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (konfigurierbar über `cacheTtlMinutes`)

## Verwandt

<CardGroup cols={2}>
  <Card title="Websuche-Überblick" href="/de/tools/web" icon="globe">
    Alle Provider und Regeln zur automatischen Erkennung.
  </Card>
  <Card title="Brave-Suche" href="/de/tools/brave-search" icon="shield">
    Strukturierte Ergebnisse mit Länder- und Sprachfiltern.
  </Card>
  <Card title="Exa-Suche" href="/de/tools/exa-search" icon="magnifying-glass">
    Neurale Suche mit Inhaltsextraktion.
  </Card>
  <Card title="Perplexity-Search-API-Dokumentation" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Offizielle Schnellstartanleitung und Referenz zur Perplexity Search API.
  </Card>
</CardGroup>
