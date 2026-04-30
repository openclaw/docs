---
read_when:
    - Sie möchten web_search aktivieren oder konfigurieren
    - Sie möchten x_search aktivieren oder konfigurieren
    - Sie müssen einen Suchanbieter auswählen
    - Sie möchten die automatische Erkennung und den Provider-Fallback verstehen
sidebarTitle: Web Search
summary: web_search, x_search und web_fetch -- das Web durchsuchen, X-Beiträge durchsuchen oder Seiteninhalte abrufen
title: Websuche
x-i18n:
    generated_at: "2026-04-30T07:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Provider und
gibt Ergebnisse zurück. Ergebnisse werden pro Abfrage 15 Minuten lang zwischengespeichert (konfigurierbar).

OpenClaw enthält außerdem `x_search` für Beiträge auf X (früher Twitter) und
`web_fetch` für leichtgewichtiges URL-Abrufen. In dieser Phase bleibt `web_fetch`
lokal, während `web_search` und `x_search` intern xAI Responses verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browser-Automatisierung. Verwenden Sie für
  JS-lastige Websites oder Logins den [Webbrowser](/de/tools/browser). Verwenden Sie zum
  Abrufen einer bestimmten URL [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    Wählen Sie einen Provider aus und schließen Sie alle erforderlichen Einrichtungsschritte ab. Einige Provider sind
    schlüsselfrei, während andere API-Schlüssel verwenden. Details finden Sie auf den unten aufgeführten
    Provider-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle benötigten Zugangsdaten gespeichert. Sie können auch eine Umgebungsvariable
    setzen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt bei API-gestützten
    Providern überspringen.
  </Step>
  <Step title="Verwenden">
    Der Agent kann jetzt `web_search` aufrufen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Verwenden Sie für X-Beiträge:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Provider auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/de/tools/brave-search">
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context` sowie Länder-/Sprachfilter. Kostenloses Kontingent verfügbar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Schlüsselfreier Fallback. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale Suche und Schlüsselwortsuche mit Inhaltsextraktion (Hervorhebungen, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten zusammen mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Zitaten über Google Search Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Zitaten über xAI Web Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Zitaten über Moonshot-Websuche.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API des MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Suche über einen angemeldeten lokalen Ollama-Host oder die gehostete Ollama-API.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerungen für Inhaltsextraktion und Domain-Filterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbst gehostete Metasuche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und mehr.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` für URL-Extraktion.
  </Card>
</CardGroup>

### Provider-Vergleich

| Provider                                  | Ergebnisstil              | Filter                                           | API-Schlüssel                                                                           |
| ----------------------------------------- | ------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)              | Strukturierte Snippets    | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/de/tools/duckduckgo-search)    | Strukturierte Snippets    | --                                               | Keiner (schlüsselfrei)                                                                  |
| [Exa](/de/tools/exa-search)                  | Strukturiert + extrahiert | Neuronaler/Schlüsselwortmodus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                           |
| [Firecrawl](/de/tools/firecrawl)             | Strukturierte Snippets    | Über das Tool `firecrawl_search`                 | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/de/tools/gemini-search)            | KI-synthetisiert + Zitate | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/de/tools/grok-search)                | KI-synthetisiert + Zitate | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/de/tools/kimi-search)                | KI-synthetisiert + Zitate | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/de/tools/minimax-search)   | Strukturierte Snippets    | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/de/tools/ollama-search) | Strukturierte Snippets    | --                                               | Keiner für angemeldete lokale Hosts; `OLLAMA_API_KEY` für direkte Suche über `https://ollama.com` |
| [Perplexity](/de/tools/perplexity-search)    | Strukturierte Snippets    | Land, Sprache, Zeit, Domains, Inhaltslimits      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/de/tools/searxng-search)          | Strukturierte Snippets    | Kategorien, Sprache                              | Keiner (selbst gehostet)                                                                |
| [Tavily](/de/tools/tavily)                   | Strukturierte Snippets    | Über das Tool `tavily_search`                    | `TAVILY_API_KEY`                                                                        |

## Automatische Erkennung

## Native OpenAI-Websuche

Direkte OpenAI-Responses-Modelle verwenden automatisch das von OpenAI gehostete Tool `web_search`, wenn die OpenClaw-Websuche aktiviert ist und kein verwalteter Provider festgelegt wurde. Dies ist Provider-eigenes Verhalten im gebündelten OpenAI-Plugin und gilt nur für nativen OpenAI-API-Datenverkehr, nicht für OpenAI-kompatible Proxy-Basis-URLs oder Azure-Routen. Setzen Sie `tools.web.search.provider` auf einen anderen Provider wie `brave`, um das verwaltete Tool `web_search` für OpenAI-Modelle beizubehalten, oder setzen Sie `tools.web.search.enabled: false`, um sowohl die verwaltete Suche als auch die native OpenAI-Suche zu deaktivieren.

## Native Codex-Websuche

Codex-fähige Modelle können optional das Provider-native Responses-Tool `web_search` anstelle der verwalteten Funktion `web_search` von OpenClaw verwenden.

- Konfigurieren Sie es unter `tools.web.search.openaiCodex`
- Es wird nur für Codex-fähige Modelle aktiviert (`openai-codex/*` oder Provider mit `api: "openai-codex-responses"`)
- Das verwaltete `web_search` gilt weiterhin für Nicht-Codex-Modelle
- `mode: "cached"` ist die Standardeinstellung und empfohlene Einstellung
- `tools.web.search.enabled: false` deaktiviert sowohl die verwaltete als auch die native Suche

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

Wenn die native Codex-Suche aktiviert ist, das aktuelle Modell aber nicht Codex-fähig ist, behält OpenClaw das normale verwaltete `web_search`-Verhalten bei.

## Websuche einrichten

Provider-Listen in Dokumentation und Einrichtungsabläufen sind alphabetisch sortiert. Die automatische Erkennung verwendet eine
separate Prioritätsreihenfolge.

Wenn kein `provider` gesetzt ist, prüft OpenClaw die Provider in dieser Reihenfolge und verwendet den
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

Danach schlüsselfreie Fallbacks:

10. **DuckDuckGo** -- schlüsselfreier HTML-Fallback ohne Konto oder API-Schlüssel (Reihenfolge 100)
11. **Ollama Web Search** -- schlüsselfreier Fallback über Ihren konfigurierten lokalen Ollama-Host, wenn er erreichbar und mit `ollama signin` angemeldet ist; kann Ollama-Provider-Bearer-Authentifizierung wiederverwenden, wenn der Host sie benötigt, und kann direkte Suche über `https://ollama.com` aufrufen, wenn mit `OLLAMA_API_KEY` konfiguriert (Reihenfolge 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Wenn kein Provider erkannt wird, fällt es auf Brave zurück (Sie erhalten dann einen Fehler wegen fehlendem Schlüssel,
der Sie zur Konfiguration auffordert).

<Note>
  Alle Provider-Schlüsselfelder unterstützen SecretRef-Objekte. Plugin-bezogene SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  gebündelten API-gestützten Websuche-Provider aufgelöst, einschließlich Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity und Tavily,
  unabhängig davon, ob der Provider explizit über `tools.web.search.provider` ausgewählt oder
  per automatischer Erkennung ausgewählt wird. Im Modus der automatischen Erkennung löst OpenClaw nur den
  ausgewählten Provider-Schlüssel auf -- nicht ausgewählte SecretRefs bleiben inaktiv, sodass Sie
  mehrere Provider konfiguriert lassen können, ohne Auflösungskosten für die
  nicht verwendeten zu verursachen.
</Note>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Provider-spezifische Konfiguration (API-Schlüssel, Basis-URLs, Modi) befindet sich unter
`plugins.entries.<plugin>.config.webSearch.*`. Beispiele finden Sie auf den Provider-Seiten.

Die Auswahl des Fallback-Providers für `web_fetch` ist getrennt:

- Wählen Sie ihn mit `tools.web.fetch.provider`
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw den ersten bereiten Web-Fetch-Provider
  aus den verfügbaren Zugangsdaten automatisch erkennen
- heute ist der gebündelte Web-Fetch-Provider Firecrawl, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw außerdem fragen nach:

- der Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem standardmäßigen Kimi-Websuchmodell (Standard ist `kimi-k2.6`)

Für `x_search` konfigurieren Sie `plugins.entries.xai.config.xSearch.*`. Es verwendet denselben Fallback `XAI_API_KEY` wie die Grok-Websuche.
Die Legacy-Konfiguration `tools.web.x_search.*` wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie während `openclaw onboard` oder `openclaw configure --section web` Grok auswählen,
kann OpenClaw auch die optionale Einrichtung von `x_search` mit demselben Schlüssel anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate Websuche-Provider-Auswahl auf oberster Ebene. Wenn Sie einen anderen Provider auswählen, zeigt OpenClaw die Eingabeaufforderung für `x_search` nicht an.

### API-Schlüssel speichern

<Tabs>
  <Tab title="Config file">
    Führen Sie `openclaw configure --section web` aus oder legen Sie den Schlüssel direkt fest:

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
  <Tab title="Environment variable">
    Legen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Gateway fest:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bei einer Gateway-Installation legen Sie sie in `~/.openclaw/.env` ab.
    Siehe [Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                           |
| --------------------- | ------------------------------------------------------ |
| `query`               | Suchanfrage (erforderlich)                             |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)         |
| `country`             | Zweistelliger ISO-Ländercode (z. B. "US", "DE")       |
| `language`            | Sprachcode nach ISO 639-1 (z. B. "en", "de")          |
| `search_lang`         | Suchsprachcode (nur Brave)                             |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`         |
| `date_after`          | Ergebnisse nach diesem Datum (JJJJ-MM-TT)              |
| `date_before`         | Ergebnisse vor diesem Datum (JJJJ-MM-TT)               |
| `ui_lang`             | UI-Sprachcode (nur Brave)                              |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (nur Perplexity)      |
| `max_tokens`          | Gesamtes Inhaltsbudget, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity)  |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Brave-Modus `llm-context`
  lehnt `ui_lang`, `freshness`, `date_after` und `date_before` ab.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Zitaten zurück. Sie
  akzeptieren `count` für Kompatibilität mit gemeinsam genutzten Tools, aber es ändert nicht die
  Form der fundierten Antwort.
  Perplexity verhält sich genauso, wenn Sie den Sonar/OpenRouter-Kompatibilitätspfad
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`) verwenden.
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts in privaten Netzwerken oder local loopback;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search`
  nur `query` und `count` -- verwenden Sie ihre dedizierten Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` fragt Beiträge auf X (ehemals Twitter) mit xAI ab und gibt
KI-synthetisierte Antworten mit Zitaten zurück. Es akzeptiert natürlichsprachliche Anfragen und
optionale strukturierte Filter. OpenClaw aktiviert das integrierte xAI-Tool `x_search`
nur für die Anfrage, die diesen Tool-Aufruf bedient.

<Note>
  xAI dokumentiert `x_search` mit Unterstützung für Stichwortsuche, semantische Suche, Nutzersuche
  und Thread-Abruf. Für Interaktionsstatistiken pro Beitrag wie Reposts,
  Antworten, Lesezeichen oder Aufrufe bevorzugen Sie eine gezielte Abfrage der exakten Beitrags-URL
  oder Status-ID. Breite Stichwortsuchen können den richtigen Beitrag finden, liefern aber weniger
  vollständige Metadaten pro Beitrag. Ein gutes Muster ist: zuerst den Beitrag finden, dann
  eine zweite `x_search`-Abfrage ausführen, die auf genau diesen Beitrag fokussiert ist.
</Note>

### x_search-Konfiguration

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

### x_search-Parameter

| Parameter                    | Beschreibung                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Suchanfrage (erforderlich)                             |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken         |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                       |
| `from_date`                  | Nur Beiträge an oder nach diesem Datum einschließen (JJJJ-MM-TT) |
| `to_date`                    | Nur Beiträge an oder vor diesem Datum einschließen (JJJJ-MM-TT) |
| `enable_image_understanding` | xAI Bilder prüfen lassen, die an passende Beiträge angehängt sind |
| `enable_video_understanding` | xAI Videos prüfen lassen, die an passende Beiträge angehängt sind |

### x_search-Beispiel

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Verwandte Themen

- [Web Fetch](/de/tools/web-fetch) -- eine URL abrufen und lesbaren Inhalt extrahieren
- [Web Browser](/de/tools/browser) -- vollständige Browserautomatisierung für JS-lastige Websites
- [Grok-Suche](/de/tools/grok-search) -- Grok als `web_search`-Provider
- [Ollama-Websuche](/de/tools/ollama-search) -- Websuche ohne Schlüssel über Ihren Ollama-Host
