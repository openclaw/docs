---
read_when:
    - Sie möchten Firecrawl-gestützte Webextraktion
    - Sie benötigen einen Firecrawl-API-Schlüssel
    - Sie möchten Firecrawl als web_search-Provider verwenden
    - Sie möchten Anti-Bot-Extraktion für web_fetch
summary: Firecrawl-Suche, Scraping und web_fetch-Fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T21:04:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extractor für `web_fetch`

Es ist ein gehosteter Extraktions-/Suchdienst, der Bot-Umgehung und Caching unterstützt,
was bei JS-lastigen Websites oder Seiten hilft, die einfache HTTP-Abrufe blockieren.

## API-Schlüssel abrufen

1. Erstellen Sie ein Firecrawl-Konto und generieren Sie einen API-Schlüssel.
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

- Wenn Sie Firecrawl im Onboarding oder mit `openclaw configure --section web` auswählen, wird das gebündelte Firecrawl-Plugin automatisch aktiviert.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Für Firecrawl-spezifische Steuerungen wie `sources`, `categories` oder Ergebnis-Scraping verwenden Sie `firecrawl_search`.
- `baseUrl` ist standardmäßig das gehostete Firecrawl unter `https://api.firecrawl.dev`. Selbst gehostete Overrides sind nur für private/interne Endpunkte erlaubt; HTTP wird nur für diese privaten Ziele akzeptiert.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Env-Fallback für die Basis-URLs von Firecrawl-Suche und -Scrape.

## Firecrawl-Scrape + web_fetch-Fallback konfigurieren

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

- Firecrawl-Fallback-Versuche werden nur ausgeführt, wenn ein API-Schlüssel verfügbar ist (`plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY`).
- `maxAgeMs` steuert, wie alt gecachte Ergebnisse sein dürfen (ms). Der Standardwert beträgt 2 Tage.
- Die Legacy-Konfiguration `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.
- Overrides für Firecrawl-Scrape-/Basis-URLs folgen derselben Gehostet/Privat-Regel wie die Suche: Öffentlicher gehosteter Traffic verwendet `https://api.firecrawl.dev`; selbst gehostete Overrides müssen zu privaten/internen Endpunkten auflösen.
- `firecrawl_scrape` lehnt offensichtliche private, Loopback-, Metadaten- und Nicht-HTTP(S)-Ziel-URLs ab, bevor sie an Firecrawl weitergeleitet werden, und entspricht damit dem Ziel-Sicherheitsvertrag von `web_fetch` für explizite Firecrawl-Scrape-Aufrufe.

`firecrawl_scrape` verwendet dieselben Einstellungen und Env-Variablen aus `plugins.entries.firecrawl.config.webFetch.*` erneut.

### Selbst gehostetes Firecrawl

Setzen Sie `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` oder `FIRECRAWL_BASE_URL`,
wenn Sie Firecrawl selbst betreiben. OpenClaw akzeptiert `http://` nur für Loopback-,
private Netzwerk-, `.local`-, `.internal`- oder `.localhost`-Ziele. Öffentliche benutzerdefinierte
Hosts werden abgelehnt, damit Firecrawl-API-Schlüssel nicht versehentlich an beliebige Endpunkte
gesendet werden.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dies, wenn Sie Firecrawl-spezifische Suchsteuerungen statt generischem `web_search` möchten.

Kernparameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dies für JS-lastige oder botgeschützte Seiten, bei denen einfaches `web_fetch` schwach ist.

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

Firecrawl stellt einen Parameter für den **Proxy-Modus** zur Bot-Umgehung bereit (`basic`, `stealth` oder `auto`).
OpenClaw verwendet für Firecrawl-Anfragen immer `proxy: "auto"` plus `storeInCache: true`.
Wenn proxy ausgelassen wird, verwendet Firecrawl standardmäßig `auto`. `auto` wiederholt den Versuch mit Stealth-Proxys, wenn ein grundlegender Versuch fehlschlägt, was mehr Credits
als reines Basic-Scraping verbrauchen kann.

## Wie `web_fetch` Firecrawl verwendet

`web_fetch`-Extraktionsreihenfolge:

1. Readability (lokal)
2. Firecrawl (wenn ausgewählt oder automatisch als aktiver Web-Fetch-Fallback erkannt)
3. Grundlegende HTML-Bereinigung (letzter Fallback)

Der Auswahlregler ist `tools.web.fetch.provider`. Wenn Sie ihn auslassen, erkennt OpenClaw
automatisch den ersten bereiten Web-Fetch-Provider aus den verfügbaren Zugangsdaten.
Derzeit ist der gebündelte Provider Firecrawl.

## Verwandte Themen

- [Web-Search-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Web Fetch](/de/tools/web-fetch) -- `web_fetch`-Tool mit Firecrawl-Fallback
- [Tavily](/de/tools/tavily) -- Such- + Extraktionstools
