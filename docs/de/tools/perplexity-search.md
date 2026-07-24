---
read_when:
    - Sie möchten Perplexity Search für die Websuche verwenden
    - Sie müssen `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY` einrichten.
summary: Perplexity Search API und Sonar-/OpenRouter-Kompatibilität für web_search
title: Perplexity-Suche
x-i18n:
    generated_at: "2026-07-24T04:11:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw unterstützt die Perplexity Search API als `web_search`-Provider. Sie gibt strukturierte Ergebnisse mit den Feldern `title`, `url` und `snippet` zurück.

Aus Kompatibilitätsgründen unterstützt OpenClaw auch ältere Perplexity-Sonar-/OpenRouter-Konfigurationen. Wenn Sie `OPENROUTER_API_KEY`, einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey` verwenden oder `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` festlegen, wechselt der Provider zum Chat-Completions-Pfad und gibt statt strukturierter Search-API-Ergebnisse KI-generierte Antworten mit Quellenangaben zurück.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity-API-Schlüssel abrufen

1. Erstellen Sie unter [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) ein Perplexity-Konto.
2. Generieren Sie im Dashboard einen API-Schlüssel.
3. Speichern Sie den Schlüssel in der Konfiguration oder legen Sie `PERPLEXITY_API_KEY` in der Gateway-Umgebung fest.

## OpenRouter-Kompatibilität

Wenn Sie OpenRouter bereits für Perplexity Sonar verwendet haben, behalten Sie `provider: "perplexity"` bei und legen Sie `OPENROUTER_API_KEY` in der Gateway-Umgebung fest oder speichern Sie einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey`.

Optionale Kompatibilitätseinstellungen:

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

## Ort zum Festlegen des Schlüssels

**Über die Konfiguration:** Führen Sie `openclaw configure --section web` aus. Dadurch wird der Schlüssel in `~/.openclaw/openclaw.json` unter `plugins.entries.perplexity.config.webSearch.apiKey` gespeichert. Dieses Feld akzeptiert auch SecretRef-Objekte.

**Über die Umgebung:** Legen Sie `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY` in der Prozessumgebung des Gateways fest. Tragen Sie den Wert bei einer Gateway-Installation in `~/.openclaw/.env` (oder in Ihrer Dienstumgebung) ein. Weitere Informationen finden Sie unter [Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

Wenn `provider: "perplexity"` konfiguriert ist und die SecretRef für den Perplexity-Schlüssel nicht aufgelöst werden kann und keine Umgebungsvariable als Ausweichmöglichkeit vorhanden ist, schlägt der Start bzw. das erneute Laden sofort fehl.

## Tool-Parameter

Diese Parameter gelten für den nativen Pfad der Perplexity Search API.

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1-10).
</ParamField>

<ParamField path="country" type="string">
Zweistelliger ISO-Ländercode (z. B. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Sprachcode gemäß ISO 639-1 (z. B. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter – `day` entspricht 24 Stunden.
</ParamField>

<ParamField path="date_after" type="string">
Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array mit zugelassenen/ausgeschlossenen Domains (maximal 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Gesamtes Inhaltsbudget (maximal 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Token-Limit pro Seite.
</ParamField>

Für den älteren Sonar-/OpenRouter-Kompatibilitätspfad gilt:

- `query`, `count` und `freshness` werden akzeptiert.
- `count` dient dort nur der Kompatibilität; die Antwort besteht weiterhin aus einer einzelnen generierten Antwort mit Quellenangaben und nicht aus einer Liste mit N Ergebnissen.
- Filter, die ausschließlich für die Search API gelten (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`), geben explizite Fehler zurück.

**Beispiele:**

```javascript
// Länder- und sprachspezifische Suche
await web_search({
  query: "erneuerbare Energien",
  country: "DE",
  language: "de",
});

// Aktuelle Ergebnisse (vergangene Woche)
await web_search({
  query: "KI-Neuigkeiten",
  freshness: "week",
});

// Suche nach Datumsbereich
await web_search({
  query: "KI-Entwicklungen",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domainfilterung (Zulassungsliste)
await web_search({
  query: "Klimaforschung",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domainfilterung (Sperrliste – mit - voranstellen)
await web_search({
  query: "Produktbewertungen",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Umfangreichere Inhaltsextraktion
await web_search({
  query: "detaillierte KI-Forschung",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regeln für Domainfilter

- Maximal 20 Domains pro Filter.
- Einträge aus Zulassungs- und Sperrlisten dürfen nicht in derselben Anfrage kombiniert werden.
- Verwenden Sie für Einträge in der Sperrliste das Präfix `-` (z. B. `["-reddit.com"]`).

## Hinweise

- Die Perplexity Search API gibt strukturierte Websuchergebnisse zurück (`title`, `url`, `snippet`).
- OpenRouter oder explizite Angaben für `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` stellen Perplexity aus Kompatibilitätsgründen wieder auf Sonar Chat Completions um.
- Die Sonar-/OpenRouter-Kompatibilität gibt eine einzelne generierte Antwort mit Quellenangaben zurück, keine strukturierten Ergebniszeilen.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (über `cacheTtlMinutes` konfigurierbar).

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Übersicht der Websuche" href="/de/tools/web" icon="globe">
    Alle Provider und Regeln zur automatischen Erkennung.
  </Card>
  <Card title="Brave-Suche" href="/de/tools/brave-search" icon="shield">
    Strukturierte Ergebnisse mit Länder- und Sprachfiltern.
  </Card>
  <Card title="Exa-Suche" href="/de/tools/exa-search" icon="magnifying-glass">
    Neuronale Suche mit Inhaltsextraktion.
  </Card>
  <Card title="Dokumentation zur Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Offizieller Schnellstart und Referenz für die Perplexity Search API.
  </Card>
</CardGroup>
