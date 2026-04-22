---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten `x_search` aktivieren oder konfigurieren
    - Sie müssen einen Such-Provider auswählen
    - Sie möchten Auto-Erkennung und Provider-Fallback verstehen
sidebarTitle: Web Search
summary: '`web_search`, `x_search` und `web_fetch` — das Web durchsuchen, X-Posts durchsuchen oder Seiteninhalte abrufen'
title: Websuche
x-i18n:
    generated_at: "2026-04-22T04:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Websuche

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Provider und
gibt Ergebnisse zurück. Ergebnisse werden 15 Minuten lang pro Suchanfrage zwischengespeichert (konfigurierbar).

OpenClaw enthält außerdem `x_search` für X-Posts (ehemals Twitter) und
`web_fetch` für leichtgewichtiges Abrufen von URLs. In dieser Phase bleibt
`web_fetch` lokal, während `web_search` und `x_search` unter der Haube xAI Responses verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browser-Automatisierung. Für
  JS-lastige Websites oder Logins verwenden Sie den [Web Browser](/de/tools/browser). Zum
  Abrufen einer bestimmten URL verwenden Sie [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Einen Provider auswählen">
    Wählen Sie einen Provider und schließen Sie gegebenenfalls die erforderliche Einrichtung ab. Einige Provider sind
    ohne Key nutzbar, andere verwenden API-Keys. Details finden Sie auf den unten
    verlinkten Provider-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und gegebenenfalls erforderliche Anmeldedaten gespeichert. Sie können auch eine env-
    Variable setzen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt bei API-basierten
    Providern überspringen.
  </Step>
  <Step title="Verwenden">
    Der Agent kann jetzt `web_search` aufrufen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Für X-Posts verwenden Sie:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/de/tools/brave-search">
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context`, Länder-/Sprachfilter. Kostenlose Stufe verfügbar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Key-freier Fallback. Kein API-Key erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale + Schlüsselwortsuche mit Inhaltsextraktion (Highlights, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten zusammen mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Zitaten über Google-Search-Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Zitaten über xAI-Web-Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Zitaten über die Websuche von Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API von MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Key-freie Suche über Ihren konfigurierten Ollama-Host. Erfordert `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerung für Inhaltsextraktion und Domain-Filterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbst gehostete Metasuche. Kein API-Key erforderlich. Aggregiert Google, Bing, DuckDuckGo und mehr.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` für URL-Extraktion.
  </Card>
</CardGroup>

### Provider-Vergleich

| Provider                                  | Ergebnisstil               | Filter                                           | API-Key                                                                         |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)              | Strukturierte Snippets     | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/de/tools/duckduckgo-search)    | Strukturierte Snippets     | --                                               | Kein (key-frei)                                                                  |
| [Exa](/de/tools/exa-search)                  | Strukturiert + extrahiert  | Neuronaler/Schlüsselwort-Modus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                             |
| [Firecrawl](/de/tools/firecrawl)             | Strukturierte Snippets     | Über Tool `firecrawl_search`                     | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/de/tools/gemini-search)            | KI-synthetisiert + Zitate  | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/de/tools/grok-search)                | KI-synthetisiert + Zitate  | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/de/tools/kimi-search)                | KI-synthetisiert + Zitate  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/de/tools/minimax-search)   | Strukturierte Snippets     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/de/tools/ollama-search) | Strukturierte Snippets     | --                                               | Standardmäßig keiner; `ollama signin` erforderlich, kann Bearer-Auth des Ollama-Providers wiederverwenden |
| [Perplexity](/de/tools/perplexity-search)    | Strukturierte Snippets     | Land, Sprache, Zeit, Domains, Inhaltsgrenzen     | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/de/tools/searxng-search)          | Strukturierte Snippets     | Kategorien, Sprache                              | Kein (selbst gehostet)                                                           |
| [Tavily](/de/tools/tavily)                   | Strukturierte Snippets     | Über Tool `tavily_search`                        | `TAVILY_API_KEY`                                                                 |

## Auto-Erkennung

## Native Codex-Websuche

Codex-fähige Modelle können optional das provider-native Responses-Tool `web_search` anstelle von OpenClaws verwalteter Funktion `web_search` verwenden.

- Konfigurieren Sie es unter `tools.web.search.openaiCodex`
- Es wird nur für Codex-fähige Modelle aktiviert (`openai-codex/*` oder Provider mit `api: "openai-codex-responses"`)
- Verwaltetes `web_search` gilt weiterhin für Nicht-Codex-Modelle
- `mode: "cached"` ist die Standard- und empfohlene Einstellung
- `tools.web.search.enabled: false` deaktiviert sowohl verwaltete als auch native Suche

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Wenn native Codex-Suche aktiviert ist, das aktuelle Modell aber nicht Codex-fähig ist, behält OpenClaw das normale verwaltete Verhalten von `web_search` bei.

## Websuche einrichten

Provider-Listen in Docs und Setup-Abläufen sind alphabetisch sortiert. Die Auto-Erkennung verwendet eine
separate Vorrangreihenfolge.

Wenn kein `provider` gesetzt ist, prüft OpenClaw Provider in dieser Reihenfolge und verwendet den
ersten, der bereit ist:

Zuerst API-gestützte Provider:

1. **Brave** -- `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey` (Reihenfolge 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey` (Reihenfolge 15)
3. **Gemini** -- `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey` (Reihenfolge 20)
4. **Grok** -- `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` (Reihenfolge 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey` (Reihenfolge 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey` (Reihenfolge 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey` (Reihenfolge 60)
8. **Exa** -- `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey` (Reihenfolge 65)
9. **Tavily** -- `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey` (Reihenfolge 70)

Danach key-freie Fallbacks:

10. **DuckDuckGo** -- key-freier HTML-Fallback ohne Konto oder API-Key (Reihenfolge 100)
11. **Ollama Web Search** -- key-freier Fallback über Ihren konfigurierten Ollama-Host; erfordert, dass Ollama erreichbar ist und mit `ollama signin` angemeldet wurde, und kann Bearer-Auth des Ollama-Providers wiederverwenden, falls der Host sie benötigt (Reihenfolge 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Wenn kein Provider erkannt wird, fällt OpenClaw auf Brave zurück (Sie erhalten dann einen Fehler wegen eines fehlenden Keys,
der Sie zur Konfiguration auffordert).

<Note>
  Alle Provider-Key-Felder unterstützen SecretRef-Objekte. Plugin-spezifische SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  gebündelten Provider Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity und Tavily
  aufgelöst, unabhängig davon, ob der Provider explizit über `tools.web.search.provider` ausgewählt oder
  durch Auto-Erkennung gewählt wurde. Im Auto-Erkennungsmodus löst OpenClaw nur den
  Key des ausgewählten Providers auf -- SecretRefs nicht ausgewählter Provider bleiben inaktiv, sodass Sie
  mehrere Provider konfiguriert halten können, ohne Auflösungskosten für die
  derzeit nicht verwendeten zu zahlen.
</Note>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // Standard: true
        provider: "brave", // oder weglassen für Auto-Erkennung
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Provider-spezifische Konfiguration (API-Keys, Base-URLs, Modi) liegt unter
`plugins.entries.<plugin>.config.webSearch.*`. Beispiele finden Sie auf den
Provider-Seiten.

Die Auswahl des Fallback-Providers für `web_fetch` ist getrennt:

- wählen Sie ihn mit `tools.web.fetch.provider`
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw den ersten bereiten `web_fetch`-
  Provider aus den verfügbaren Anmeldedaten automatisch erkennen
- aktuell ist der gebündelte `web_fetch`-Provider Firecrawl, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw zusätzlich fragen nach:

- der Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem Standard-Kimi-Websuchmodell (Standard ist `kimi-k2.6`)

Für `x_search` konfigurieren Sie `plugins.entries.xai.config.xSearch.*`. Es verwendet denselben
Fallback `XAI_API_KEY` wie die Grok-Websuche.
Legacy-Konfiguration `tools.web.x_search.*` wird durch `openclaw doctor --fix` automatisch migriert.
Wenn Sie während `openclaw onboard` oder `openclaw configure --section web` Grok wählen,
kann OpenClaw außerdem eine optionale Einrichtung von `x_search` mit demselben Key anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate oberste
Provider-Auswahl für die Websuche. Wenn Sie einen anderen Provider wählen, zeigt OpenClaw
keinen Prompt für `x_search` an.

### API-Keys speichern

<Tabs>
  <Tab title="Konfigurationsdatei">
    Führen Sie `openclaw configure --section web` aus oder setzen Sie den Key direkt:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Umgebungsvariable">
    Setzen Sie die env-Variable des Providers in der Prozessumgebung des Gateways:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bei einer Gateway-Installation legen Sie sie in `~/.openclaw/.env` ab.
    Siehe [Env vars](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                         |
| --------------------- | ---------------------------------------------------- |
| `query`               | Suchanfrage (erforderlich)                           |
| `count`               | Zurückzugebende Ergebnisse (1–10, Standard: 5)       |
| `country`             | 2-stelliger ISO-Ländercode (z. B. "US", "DE")        |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de")              |
| `search_lang`         | Suchsprachen-Code (nur Brave)                        |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`       |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)            |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)             |
| `ui_lang`             | UI-Sprachcode (nur Brave)                            |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (nur Perplexity)    |
| `max_tokens`          | Gesamtes Inhaltsbudget, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity) |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Brave-Modus `llm-context`
  lehnt `ui_lang`, `freshness`, `date_after` und `date_before` ab.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Zitaten zurück. Sie
  akzeptieren `count` für Kompatibilität mit dem gemeinsamen Tool, aber es ändert nicht die
  Form der grounded Antwort.
  Perplexity verhält sich genauso, wenn Sie den Sonar-/OpenRouter-
  Kompatibilitätspfad verwenden (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`).
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts im privaten Netzwerk oder auf Loopback;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search` nur `query` und `count`
  -- verwenden Sie ihre dedizierten Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` fragt X-Posts (ehemals Twitter) über xAI ab und gibt
KI-synthetisierte Antworten mit Zitaten zurück. Es akzeptiert natürlichsprachliche Suchanfragen und
optionale strukturierte Filter. OpenClaw aktiviert das integrierte xAI-Tool `x_search`
nur für die Anfrage, die diesem Tool-Aufruf dient.

<Note>
  xAI dokumentiert `x_search` als Unterstützung für Schlüsselwortsuche, semantische Suche, Benutzer-
  Suche und Thread-Abruf. Für Engagement-Statistiken pro Post wie Reposts,
  Antworten, Lesezeichen oder Aufrufe sollten Sie bevorzugt einen gezielten Lookup für die exakte Post-URL
  oder Status-ID verwenden. Breite Schlüsselwortsuchen können den richtigen Post zwar finden, aber weniger
  vollständige Metadaten pro Post zurückgeben. Ein gutes Muster ist: zuerst den Post finden, dann
  eine zweite `x_search`-Anfrage auf genau diesen Post fokussieren.
</Note>

### Konfiguration von x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Parameter von x_search

| Parameter                    | Beschreibung                                         |
| ---------------------------- | ---------------------------------------------------- |
| `query`                      | Suchanfrage (erforderlich)                           |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken       |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                     |
| `from_date`                  | Nur Posts an oder nach diesem Datum einbeziehen (YYYY-MM-DD) |
| `to_date`                    | Nur Posts an oder vor diesem Datum einbeziehen (YYYY-MM-DD) |
| `enable_image_understanding` | xAI Bilder prüfen lassen, die an passende Posts angehängt sind |
| `enable_video_understanding` | xAI Videos prüfen lassen, die an passende Posts angehängt sind |

### Beispiel für x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiken pro Post: verwenden Sie nach Möglichkeit die exakte Status-URL oder Status-ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw plugin SDK" });

// Deutschspezifische Suche
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Aktuelle Ergebnisse (letzte Woche)
await web_search({ query: "AI developments", freshness: "week" });

// Datumsbereich
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain-Filterung (nur Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlists verwenden, fügen Sie `web_search`, `x_search` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // oder: allow: ["group:web"]  (enthält web_search, x_search und web_fetch)
  },
}
```

## Verwandt

- [Web Fetch](/de/tools/web-fetch) -- eine URL abrufen und lesbaren Inhalt extrahieren
- [Web Browser](/de/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Websites
- [Grok Search](/de/tools/grok-search) -- Grok als Provider für `web_search`
- [Ollama Web Search](/de/tools/ollama-search) -- key-freie Websuche über Ihren Ollama-Host
