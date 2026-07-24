---
read_when:
    - Sie möchten eine Firecrawl-gestützte Webextraktion
    - Sie möchten Firecrawl Search ohne Schlüssel (kostenlos) oder `web_fetch` ohne Schlüssel
    - Sie benötigen einen Firecrawl-API-Schlüssel für die Suche oder höhere Limits.
    - Sie möchten Firecrawl als web_search-Provider verwenden
    - Sie möchten eine Anti-Bot-Extraktion für web_fetch
summary: Firecrawl-Suche, Scraping und web_fetch-Fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-07-24T04:44:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extraktor für `web_fetch`

Es handelt sich um einen gehosteten Extraktions- und Suchdienst, der Bot-Umgehung und Caching unterstützt. Dies hilft bei stark JavaScript-basierten Websites oder Seiten, die einfache HTTP-Abrufe blockieren.

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Schlüsselloser Zugriff und API-Schlüssel

Firecrawl registriert zwei `web_search`-Provider:

- **Firecrawl Search** (`firecrawl`) — verwendet die gehostete `/v2/search`-API mit Ihrem
  Schlüssel; wird automatisch erkannt, wenn ein Schlüssel vorhanden ist.
- **Firecrawl Search (Free)** (`firecrawl-free`) — verwendet den gehosteten schlüssellosen Einstiegstarif,
  kein API-Schlüssel erforderlich. Er ist **nur nach ausdrücklicher Aktivierung** verfügbar und wird nie automatisch ausgewählt, da
  bei seiner Auswahl Ihre Suchanfragen an den kostenlosen Tarif von Firecrawl gesendet werden.

Der explizit ausgewählte Firecrawl-Fallback `web_fetch` ist ebenfalls schlüssellos. Die
expliziten Tools `firecrawl_search` und `firecrawl_scrape` erfordern einen API-Schlüssel. Fügen Sie
`FIRECRAWL_API_KEY` zur Gateway-Umgebung hinzu oder konfigurieren Sie ihn für höhere Limits.

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

- Wenn Sie Firecrawl beim Onboarding oder in `openclaw configure --section web` auswählen, wird das installierte Firecrawl-Plugin automatisch aktiviert.
- Wählen Sie beim Onboarding **Firecrawl Search (Free)** aus (oder legen Sie `provider: "firecrawl-free"` fest), um den Dienst schlüssellos und ohne API-Schlüssel zu verwenden. Der Provider **Firecrawl Search** mit Schlüssel sendet `plugins.entries.firecrawl.config.webSearch.apiKey` oder `FIRECRAWL_API_KEY`.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Verwenden Sie für Firecrawl-spezifische Einstellungen wie `sources`, `categories` oder das Scraping von Ergebnissen `firecrawl_search`.
- `baseUrl` verwendet standardmäßig das gehostete Firecrawl unter `https://api.firecrawl.dev`. Selbst gehostete Überschreibungen sind nur für private/interne Endpunkte zulässig; HTTP wird nur für diese privaten Ziele akzeptiert.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Umgebungsvariablen-Fallback für die Basis-URLs der Firecrawl-Suche und des Scrapings.
- Firecrawl-Suchanfragen haben standardmäßig ein Zeitlimit von 30 Sekunden; der Parameter `timeoutSeconds` von `firecrawl_search` überschreibt es pro Aufruf.

## Firecrawl-Fallback für web_fetch konfigurieren

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

- Der explizit ausgewählte Firecrawl-Fallback `web_fetch` funktioniert ohne API-Schlüssel. Wenn er konfiguriert ist, sendet OpenClaw für höhere Limits `plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY`.
- Wenn Sie Firecrawl während des Onboardings oder in `openclaw configure --section web` auswählen, wird das Plugin aktiviert und Firecrawl für `web_fetch` ausgewählt, sofern nicht bereits ein anderer Abruf-Provider konfiguriert ist.
- `firecrawl_scrape` erfordert einen API-Schlüssel.
- `maxAgeMs` steuert, wie alt zwischengespeicherte Ergebnisse sein dürfen (ms). Der Standardwert beträgt 172,800,000 ms (2 Tage).
- `onlyMainContent` verwendet standardmäßig `true`; `timeoutSeconds` verwendet standardmäßig 60.
- Die veraltete Konfiguration `tools.web.fetch.firecrawl.*` und `tools.web.search.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.
- Überschreibungen der Firecrawl-Scraping-/Basis-URL unterliegen derselben Regel für gehostete/private Endpunkte wie die Suche: Öffentlicher gehosteter Datenverkehr verwendet `https://api.firecrawl.dev`; selbst gehostete Überschreibungen müssen auf private/interne Endpunkte aufgelöst werden.
- `firecrawl_scrape` weist offensichtlich private, Loopback-, Metadaten- und Nicht-HTTP(S)-Ziel-URLs zurück, bevor sie an Firecrawl weitergeleitet werden. Dies entspricht dem Zielsicherheitsvertrag von `web_fetch` für explizite Firecrawl-Scraping-Aufrufe.

`firecrawl_scrape` verwendet dieselben `plugins.entries.firecrawl.config.webFetch.*`-Einstellungen und Umgebungsvariablen einschließlich des erforderlichen API-Schlüssels.

### Selbst gehostetes Firecrawl

Legen Sie `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` oder `FIRECRAWL_BASE_URL` fest, wenn Sie Firecrawl selbst betreiben. OpenClaw akzeptiert `http://` nur für Loopback-, private Netzwerk-, `.local`-, `.internal`- oder `.localhost`-Ziele. Benutzerdefinierte öffentliche Hosts werden abgelehnt, damit Firecrawl-API-Schlüssel nicht versehentlich an beliebige Endpunkte gesendet werden.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dieses Tool, wenn Sie statt des generischen `web_search` Firecrawl-spezifische Sucheinstellungen benötigen. Erfordert einen API-Schlüssel.

Parameter:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (nur Hostnamen; schließen sich gegenseitig aus)
- `tbs` (Zeitfilter, zum Beispiel `qdr:d`, `qdr:w`, `sbd:1`)
- `location` und `country` (Geo-Targeting)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dieses Tool für stark JavaScript-basierte oder botgeschützte Seiten, bei denen der einfache `web_fetch` unzureichend ist.

Parameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth-/Bot-Umgehung

`firecrawl_scrape` und der Firecrawl-Fallback `web_fetch` verwenden standardmäßig `proxy: "auto"` zusammen mit `storeInCache: true`, sofern der Aufrufer diese Parameter nicht überschreibt. `firecrawl_search` und der Firecrawl-Provider `web_search` verfügen über keine `proxy`-/`storeInCache`-Einstellungen; der Stealth-Proxy-Modus gilt nur für Scraping-/Abrufanfragen.

Der Modus `proxy` von Firecrawl steuert die Bot-Umgehung (`basic`, `stealth` oder `auto`). `auto` versucht es erneut mit Stealth-Proxys, wenn ein einfacher Versuch fehlschlägt. Dies kann mehr Credits verbrauchen als ausschließlich einfaches Scraping.

## So verwendet `web_fetch` Firecrawl

Extraktionsreihenfolge von `web_fetch`:

1. Readability (lokal)
2. Konfigurierter Abruf-Provider, beispielsweise Firecrawl (wenn ausgewählt oder anhand konfigurierter Anmeldedaten automatisch erkannt)
3. Einfache HTML-Bereinigung (letzter Fallback)

Die Auswahloption ist `tools.web.fetch.provider`. Wenn Sie sie weglassen, erkennt OpenClaw anhand der verfügbaren Anmeldedaten automatisch den ersten einsatzbereiten Web-Abruf-Provider. Das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [Webabruf](/de/tools/web-fetch) -- web_fetch-Tool mit Firecrawl-Fallback
- [Tavily](/de/tools/tavily) -- Such- und Extraktionstools
