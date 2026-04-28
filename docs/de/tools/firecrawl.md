---
read_when:
- You want Firecrawl-backed web extraction
- Sie benötigen einen Firecrawl-API key
- Sie möchten Firecrawl als `web_search`-Provider ఉపయోగించాలనుకుంటున్నారు
- Sie möchten Anti-Bot-Extraktion für `web_fetch` nutzen
summary: Firecrawl-Suche, Scraping und `web_fetch`-Fallback
title: Firecrawl
x-i18n:
  generated_at: '2026-04-24T07:03:17Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
  source_path: tools/firecrawl.md
  workflow: 15
---

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extractor für `web_fetch`

Es ist ein gehosteter Extraktions-/Suchdienst, der Bot-Umgehung und Caching unterstützt,
was bei JavaScript-lastigen Websites oder Seiten hilft, die einfache HTTP-Fetches blockieren.

## Einen API key abrufen

1. Erstellen Sie ein Firecrawl-Konto und generieren Sie einen API key.
2. Speichern Sie ihn in der Konfiguration oder setzen Sie `FIRECRAWL_API_KEY` in der Gateway-Umgebung.

## Firecrawl-Suche konfigurieren

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Hinweise:

- Die Auswahl von Firecrawl im Onboarding oder über `openclaw configure --section web` aktiviert das gebündelte Firecrawl-Plugin automatisch.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Für Firecrawl-spezifische Steuerungen wie `sources`, `categories` oder Result-Scraping verwenden Sie `firecrawl_search`.
- Überschreibungen von `baseUrl` müssen auf `https://api.firecrawl.dev` bleiben.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Env-Fallback für Base-URLs von Firecrawl-Suche und -Scrape.

## Firecrawl-Scrape + `web_fetch`-Fallback konfigurieren

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Hinweise:

- Firecrawl-Fallback-Versuche laufen nur, wenn ein API key verfügbar ist (`plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY`).
- `maxAgeMs` steuert, wie alt gecachte Ergebnisse sein dürfen (ms). Standard ist 2 Tage.
- Veraltete Konfiguration `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.
- Überschreibungen für Firecrawl-Scrape/Base-URL sind auf `https://api.firecrawl.dev` beschränkt.

`firecrawl_scrape` verwendet dieselben Einstellungen und Env-Variablen aus `plugins.entries.firecrawl.config.webFetch.*` wieder.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dies, wenn Sie Firecrawl-spezifische Suchsteuerungen statt des generischen `web_search` möchten.

Kernparameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dies für JavaScript-lastige oder botgeschützte Seiten, bei denen einfaches `web_fetch` schwach ist.

Kernparameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / Bot-Umgehung

Firecrawl stellt einen **Proxy-Modus**-Parameter für Bot-Umgehung bereit (`basic`, `stealth` oder `auto`).
OpenClaw verwendet für Firecrawl-Anfragen immer `proxy: "auto"` plus `storeInCache: true`.
Wenn `proxy` weggelassen wird, verwendet Firecrawl standardmäßig `auto`. `auto` wiederholt mit Stealth-Proxys, wenn ein grundlegender Versuch fehlschlägt, was mehr Credits
als reines Basic-Scraping verbrauchen kann.

## Wie `web_fetch` Firecrawl verwendet

Reihenfolge der Extraktion bei `web_fetch`:

1. Readability (lokal)
2. Firecrawl (wenn ausgewählt oder automatisch als aktiver `web_fetch`-Fallback erkannt)
3. Grundlegende HTML-Bereinigung (letzter Fallback)

Die Auswahl erfolgt über `tools.web.fetch.provider`. Wenn Sie diesen Wert weglassen, erkennt OpenClaw
automatisch den ersten einsatzbereiten `web_fetch`-Provider anhand verfügbarer Zugangsdaten.
Heute ist der gebündelte Provider Firecrawl.

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und Auto-Erkennung
- [Web Fetch](/de/tools/web-fetch) -- `web_fetch`-Tool mit Firecrawl-Fallback
- [Tavily](/de/tools/tavily) -- Such- und Extraktionstools
