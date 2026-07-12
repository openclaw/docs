---
read_when:
    - Sie möchten eine Firecrawl-gestützte Webextraktion
    - Sie möchten Firecrawl-`web_fetch` ohne Schlüssel verwenden
    - Sie benötigen einen Firecrawl-API-Schlüssel für die Suche oder höhere Limits.
    - Sie möchten Firecrawl als web_search-Provider verwenden
    - Sie möchten für `web_fetch` eine Extraktion mit Bot-Schutz-Umgehung
summary: Firecrawl-Suche, Scraping und web_fetch-Fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T02:15:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als Provider für `web_search`
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extraktor für `web_fetch`

Es handelt sich um einen gehosteten Extraktions- und Suchdienst, der Bot-Umgehung und Caching unterstützt. Dies ist bei JavaScript-lastigen Websites oder Seiten hilfreich, die einfache HTTP-Abrufe blockieren.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` ohne Schlüssel und API-Schlüssel

Der explizit ausgewählte gehostete Firecrawl-Fallback für `web_fetch` unterstützt einen Einstiegszugang ohne API-Schlüssel. Fügen Sie `FIRECRAWL_API_KEY` zur Gateway-Umgebung hinzu oder konfigurieren Sie ihn, wenn Sie höhere Limits benötigen. Firecrawl für `web_search` und `firecrawl_scrape` erfordert einen API-Schlüssel.

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

- Wenn Sie Firecrawl beim Onboarding oder über `openclaw configure --section web` auswählen, wird das installierte Firecrawl-Plugin automatisch aktiviert.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Verwenden Sie für Firecrawl-spezifische Steuerungsmöglichkeiten wie `sources`, `categories` oder das Scraping von Ergebnissen `firecrawl_search`.
- `baseUrl` verwendet standardmäßig das gehostete Firecrawl unter `https://api.firecrawl.dev`. Selbst gehostete Überschreibungen sind nur für private/interne Endpunkte zulässig; HTTP wird ausschließlich für solche privaten Ziele akzeptiert.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Umgebungsvariablen-Fallback für die Basis-URLs der Firecrawl-Suche und des Firecrawl-Scrapings.
- Firecrawl-Suchanfragen haben standardmäßig ein Zeitlimit von 30 Sekunden; der Parameter `timeoutSeconds` von `firecrawl_search` überschreibt es für den jeweiligen Aufruf.

## Firecrawl-Fallback für `web_fetch` konfigurieren

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

- Der explizit ausgewählte Firecrawl-Fallback für `web_fetch` funktioniert ohne API-Schlüssel. Wenn konfiguriert, sendet OpenClaw für höhere Limits `plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY`.
- Wenn Sie Firecrawl beim Onboarding oder über `openclaw configure --section web` auswählen, wird das Plugin aktiviert und Firecrawl für `web_fetch` ausgewählt, sofern nicht bereits ein anderer Abruf-Provider konfiguriert ist.
- `firecrawl_scrape` erfordert einen API-Schlüssel.
- `maxAgeMs` bestimmt, wie alt zwischengespeicherte Ergebnisse sein dürfen (ms). Der Standardwert beträgt 172.800.000 ms (2 Tage).
- `onlyMainContent` ist standardmäßig `true`; `timeoutSeconds` hat den Standardwert 60.
- Veraltete Konfigurationen unter `tools.web.fetch.firecrawl.*` und `tools.web.search.firecrawl.*` werden durch `openclaw doctor --fix` automatisch migriert.
- Überschreibungen der Firecrawl-Scraping- und Basis-URL unterliegen derselben Regel für gehostete und private Ziele wie die Suche: Öffentlicher gehosteter Datenverkehr verwendet `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte aufgelöst werden.
- `firecrawl_scrape` lehnt offensichtliche private, Loopback-, Metadaten- und Nicht-HTTP(S)-Ziel-URLs ab, bevor sie an Firecrawl weitergeleitet werden. Dies entspricht dem Vertrag zur Zielsicherheit von `web_fetch` für explizite Firecrawl-Scraping-Aufrufe.

`firecrawl_scrape` verwendet dieselben Einstellungen und Umgebungsvariablen unter `plugins.entries.firecrawl.config.webFetch.*` wieder, einschließlich des erforderlichen API-Schlüssels.

### Selbst gehostetes Firecrawl

Legen Sie `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` oder `FIRECRAWL_BASE_URL` fest, wenn Sie Firecrawl selbst betreiben. OpenClaw akzeptiert `http://` nur für Loopback-, private Netzwerk-, `.local`-, `.internal`- oder `.localhost`-Ziele. Öffentliche benutzerdefinierte Hosts werden abgelehnt, damit Firecrawl-API-Schlüssel nicht versehentlich an beliebige Endpunkte gesendet werden.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dieses Tool, wenn Sie anstelle des generischen `web_search` Firecrawl-spezifische Suchsteuerungen benötigen.

Parameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dieses Tool für JavaScript-lastige oder botgeschützte Seiten, bei denen der einfache Abruf mit `web_fetch` unzureichend ist.

Parameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Tarnmodus/Bot-Umgehung

`firecrawl_scrape` und der Firecrawl-Fallback für `web_fetch` verwenden standardmäßig `proxy: "auto"` sowie `storeInCache: true`, sofern der Aufrufer diese Parameter nicht überschreibt. `firecrawl_search` und der Firecrawl-Provider für `web_search` bieten keine Steuerungsmöglichkeiten für `proxy`/`storeInCache`; der Tarn-Proxy-Modus gilt nur für Scraping- und Abrufanfragen.

Der `proxy`-Modus von Firecrawl steuert die Bot-Umgehung (`basic`, `stealth` oder `auto`). Bei `auto` wird nach einem fehlgeschlagenen einfachen Versuch ein erneuter Versuch mit Tarn-Proxys durchgeführt, wodurch möglicherweise mehr Guthaben als beim ausschließlich einfachen Scraping verbraucht wird.

## So verwendet `web_fetch` Firecrawl

Extraktionsreihenfolge von `web_fetch`:

1. Readability (lokal)
2. Konfigurierter Abruf-Provider, beispielsweise Firecrawl (wenn ausgewählt oder anhand konfigurierter Anmeldedaten automatisch erkannt)
3. Einfache HTML-Bereinigung (letzter Fallback)

Die Auswahl wird über `tools.web.fetch.provider` gesteuert. Wenn Sie diese Einstellung weglassen, erkennt OpenClaw anhand der verfügbaren Anmeldedaten automatisch den ersten einsatzbereiten Provider für Webabrufe. Das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Webabruf](/de/tools/web-fetch) -- das Tool `web_fetch` mit Firecrawl-Fallback
- [Tavily](/de/tools/tavily) -- Tools für Suche und Extraktion
