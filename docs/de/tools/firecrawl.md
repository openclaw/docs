---
read_when:
    - Sie möchten eine Firecrawl-gestützte Webextraktion
    - Sie möchten Firecrawl web_fetch ohne Schlüssel verwenden
    - Sie benötigen einen Firecrawl-API-Schlüssel für Suche oder höhere Limits
    - Sie möchten Firecrawl als web_search-Provider verwenden
    - Sie möchten Anti-Bot-Extraktion für web_fetch
summary: Firecrawl-Suche, Scraping und web_fetch-Fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extraktor für `web_fetch`

Es ist ein gehosteter Extraktions-/Suchdienst, der Bot-Umgehung und Caching unterstützt,
was bei JS-lastigen Websites oder Seiten hilft, die einfache HTTP-Abrufe blockieren.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Keyless web_fetch und API-Schlüssel

Der explizit ausgewählte gehostete Firecrawl-`web_fetch`-Fallback unterstützt Starter-Zugriff
ohne API-Schlüssel. Fügen Sie `FIRECRAWL_API_KEY` in der Gateway-Umgebung hinzu
oder konfigurieren Sie ihn, wenn Sie höhere Limits benötigen. Firecrawl-`web_search` und
`firecrawl_scrape` erfordern einen API-Schlüssel.

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

- Die Auswahl von Firecrawl im Onboarding oder mit `openclaw configure --section web` aktiviert das installierte Firecrawl-Plugin automatisch.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Verwenden Sie für Firecrawl-spezifische Steuerungen wie `sources`, `categories` oder Ergebnis-Scraping `firecrawl_search`.
- `baseUrl` verwendet standardmäßig das gehostete Firecrawl unter `https://api.firecrawl.dev`. Selbst gehostete Überschreibungen sind nur für private/interne Endpunkte erlaubt; HTTP wird nur für diese privaten Ziele akzeptiert.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Env-Fallback für Firecrawl-Such- und Scrape-Basis-URLs.

## Firecrawl-web_fetch-Fallback konfigurieren

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Der explizit ausgewählte Firecrawl-`web_fetch`-Fallback funktioniert ohne API-Schlüssel. Wenn konfiguriert, sendet OpenClaw `plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY` für höhere Limits.
- Die Auswahl von Firecrawl während des Onboardings oder mit `openclaw configure --section web` aktiviert das Plugin und wählt Firecrawl für `web_fetch` aus, sofern nicht bereits ein anderer Fetch-Provider konfiguriert ist.
- `firecrawl_scrape` erfordert einen API-Schlüssel.
- `maxAgeMs` steuert, wie alt zwischengespeicherte Ergebnisse sein dürfen (ms). Standardwert ist 2 Tage.
- Die Legacy-Konfiguration `tools.web.fetch.firecrawl.*` wird durch `openclaw doctor --fix` automatisch migriert.
- Firecrawl-Scrape-/Basis-URL-Überschreibungen folgen derselben Hosted-/Privat-Regel wie die Suche: Öffentlicher gehosteter Traffic verwendet `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte auflösen.
- `firecrawl_scrape` lehnt offensichtliche private, Loopback-, Metadata- und Nicht-HTTP(S)-Ziel-URLs ab, bevor sie an Firecrawl weitergeleitet werden, entsprechend dem Ziel-Sicherheitsvertrag von `web_fetch` für explizite Firecrawl-Scrape-Aufrufe.

`firecrawl_scrape` verwendet dieselben Einstellungen und Env-Variablen aus `plugins.entries.firecrawl.config.webFetch.*` wieder, einschließlich des erforderlichen API-Schlüssels.

### Selbst gehostetes Firecrawl

Legen Sie `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` oder `FIRECRAWL_BASE_URL` fest,
wenn Sie Firecrawl selbst betreiben. OpenClaw akzeptiert `http://` nur für Loopback-,
private Netzwerk-, `.local`-, `.internal`- oder `.localhost`-Ziele. Öffentliche benutzerdefinierte
Hosts werden abgelehnt, damit Firecrawl-API-Schlüssel nicht versehentlich an beliebige
Endpunkte gesendet werden.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dies, wenn Sie Firecrawl-spezifische Suchsteuerungen statt des generischen `web_search` wünschen.

Kernparameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dies für JS-lastige oder bot-geschützte Seiten, bei denen einfaches `web_fetch` schwach ist.

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
Wenn proxy weggelassen wird, verwendet Firecrawl standardmäßig `auto`. `auto` versucht es erneut mit Stealth-Proxys, wenn ein einfacher Versuch fehlschlägt, was mehr Credits
verbrauchen kann als Basic-only-Scraping.

## Wie `web_fetch` Firecrawl verwendet

`web_fetch`-Extraktionsreihenfolge:

1. Readability (lokal)
2. Firecrawl (wenn ausgewählt oder automatisch aus konfigurierten Zugangsdaten erkannt)
3. Einfache HTML-Bereinigung (letzter Fallback)

Der Auswahlregler ist `tools.web.fetch.provider`. Wenn Sie ihn weglassen, erkennt OpenClaw
automatisch den ersten bereiten Web-Fetch-Provider aus den verfügbaren Zugangsdaten.
Das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.

## Verwandt

- [Web Search-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Web Fetch](/de/tools/web-fetch) -- web_fetch-Tool mit Firecrawl-Fallback
- [Tavily](/de/tools/tavily) -- Such- und Extraktionstools
