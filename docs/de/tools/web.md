---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten `x_search` aktivieren oder konfigurieren
    - Sie müssen einen Suchanbieter auswählen
    - Sie möchten Auto-Erkennung und Provider-Fallback verstehen
sidebarTitle: Web Search
summary: '`web_search`, `x_search` und `web_fetch` — das Web durchsuchen, X-Beiträge durchsuchen oder Seiteninhalte abrufen'
title: Websuche
x-i18n:
    generated_at: "2026-04-23T06:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Websuche

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Provider und
gibt Ergebnisse zurück. Ergebnisse werden 15 Minuten lang pro Anfrage zwischengespeichert (konfigurierbar).

OpenClaw enthält außerdem `x_search` für X-Beiträge (früher Twitter) und
`web_fetch` für leichtgewichtiges Abrufen von URLs. In dieser Phase bleibt `web_fetch`
lokal, während `web_search` und `x_search` unter der Haube xAI Responses verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browser-Automatisierung. Für
  JS-lastige Seiten oder Logins verwenden Sie den [Web Browser](/de/tools/browser). Für
  das Abrufen einer bestimmten URL verwenden Sie [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Einen Provider auswählen">
    Wählen Sie einen Provider und schließen Sie alle erforderlichen Einrichtungsschritte ab. Einige Provider sind
    schlüsselfrei, andere verwenden API-Schlüssel. Details finden Sie auf den unten verlinkten
    Provider-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle benötigten Anmeldedaten gespeichert. Sie können auch eine Env-
    Variable setzen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt bei API-gestützten
    Providern überspringen.
  </Step>
  <Step title="Verwenden">
    Der Agent kann jetzt `web_search` aufrufen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Für X-Beiträge verwenden Sie:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/de/tools/brave-search">
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context`, Länder-/Sprachfilter. Free Tier verfügbar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Schlüsselfreier Fallback. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale + stichwortbasierte Suche mit Inhaltsextraktion (Highlights, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten in Kombination mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Zitaten über Google-Search-Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Zitaten über xAI-Web-Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Zitaten über Moonshot-Websuche.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Search API von MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Schlüsselfreie Suche über Ihren konfigurierten Ollama-Host. Erfordert `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerung der Inhaltsextraktion und Domain-Filterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbstgehostete Metasuche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und mehr.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` für URL-Extraktion.
  </Card>
</CardGroup>

### Vergleich der Provider

| Provider                                  | Ergebnisstil               | Filter                                           | API-Schlüssel                                                                    |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)              | Strukturierte Snippets     | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/de/tools/duckduckgo-search)    | Strukturierte Snippets     | --                                               | Keiner (schlüsselfrei)                                                           |
| [Exa](/de/tools/exa-search)                  | Strukturiert + extrahiert  | Neuronaler/Stichwort-Modus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                 |
| [Firecrawl](/de/tools/firecrawl)             | Strukturierte Snippets     | Über Tool `firecrawl_search`                     | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/de/tools/gemini-search)            | KI-synthetisiert + Zitate  | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/de/tools/grok-search)                | KI-synthetisiert + Zitate  | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/de/tools/kimi-search)                | KI-synthetisiert + Zitate  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/de/tools/minimax-search)   | Strukturierte Snippets     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/de/tools/ollama-search) | Strukturierte Snippets     | --                                               | Standardmäßig keiner; `ollama signin` erforderlich, kann Bearer-Auth des Ollama-Providers wiederverwenden |
| [Perplexity](/de/tools/perplexity-search)    | Strukturierte Snippets     | Land, Sprache, Zeit, Domains, Inhaltslimits      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/de/tools/searxng-search)          | Strukturierte Snippets     | Kategorien, Sprache                              | Keiner (selbstgehostet)                                                          |
| [Tavily](/de/tools/tavily)                   | Strukturierte Snippets     | Über Tool `tavily_search`                        | `TAVILY_API_KEY`                                                                 |

## Auto-Erkennung

## Native OpenAI-Websuche

Direkte OpenAI-Responses-Modelle verwenden automatisch das gehostete Tool `web_search` von OpenAI, wenn OpenClaw-Websuche aktiviert ist und kein verwalteter Provider festgelegt ist. Dies ist provider-eigenes Verhalten im gebündelten OpenAI-Plugin und gilt nur für nativen OpenAI-API-Verkehr, nicht für OpenAI-kompatible Proxy-Base-URLs oder Azure-Routen. Setzen Sie `tools.web.search.provider` auf einen anderen Provider wie `brave`, um das verwaltete Tool `web_search` für OpenAI-Modelle beizubehalten, oder setzen Sie `tools.web.search.enabled: false`, um sowohl verwaltete Suche als auch native OpenAI-Suche zu deaktivieren.

## Native Codex-Websuche

Codex-fähige Modelle können optional das providernative Responses-Tool `web_search` anstelle der verwalteten Funktion `web_search` von OpenClaw verwenden.

- Konfiguration unter `tools.web.search.openaiCodex`
- Es wird nur für Codex-fähige Modelle aktiviert (`openai-codex/*` oder Provider mit `api: "openai-codex-responses"`)
- Verwaltetes `web_search` gilt weiterhin für Modelle ohne Codex-Fähigkeit
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

Wenn native Codex-Suche aktiviert ist, das aktuelle Modell aber nicht Codex-fähig ist, behält OpenClaw das normale Verhalten von `web_search` bei.

## Websuche einrichten

Provider-Listen in Doku und Einrichtungsabläufen sind alphabetisch. Auto-Erkennung verwendet eine
separate Prioritätsreihenfolge.

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

Danach schlüsselfreie Fallbacks:

10. **DuckDuckGo** -- schlüsselfreier HTML-Fallback ohne Konto oder API-Schlüssel (Reihenfolge 100)
11. **Ollama Web Search** -- schlüsselfreier Fallback über Ihren konfigurierten Ollama-Host; erfordert, dass Ollama erreichbar ist und mit `ollama signin` angemeldet wurde, und kann Bearer-Auth des Ollama-Providers wiederverwenden, wenn der Host sie benötigt (Reihenfolge 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Wenn kein Provider erkannt wird, fällt es auf Brave zurück (Sie erhalten einen Fehler zu einem fehlenden Schlüssel,
der Sie zur Konfiguration auffordert).

<Note>
  Alle Schlüsselfelder der Provider unterstützen SecretRef-Objekte. Plugin-spezifische SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  gebündelten Provider Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity und Tavily
  aufgelöst, unabhängig davon, ob der Provider explizit über `tools.web.search.provider` gewählt wird oder
  über Auto-Erkennung ausgewählt wird. Im Auto-Erkennungsmodus löst OpenClaw nur den
  Schlüssel des ausgewählten Providers auf -- SecretRefs nicht ausgewählter Provider bleiben inaktiv, sodass Sie
  mehrere Provider konfiguriert halten können, ohne Auflösungskosten für
  diejenigen zu zahlen, die Sie nicht verwenden.
</Note>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // Standard: true
        provider: "brave", // oder für Auto-Erkennung weglassen
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Providerspezifische Konfiguration (API-Schlüssel, Base-URLs, Modi) liegt unter
`plugins.entries.<plugin>.config.webSearch.*`. Beispiele finden Sie auf den
Provider-Seiten.

Die Auswahl des Fallback-Providers für `web_fetch` ist separat:

- wählen Sie ihn mit `tools.web.fetch.provider`
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw den ersten bereiten Web-Fetch-
  Provider aus verfügbaren Anmeldedaten automatisch erkennen
- aktuell ist der gebündelte Web-Fetch-Provider Firecrawl, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw außerdem fragen nach:

- der API-Region von Moonshot (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem Standardmodell für die Kimi-Websuche (Standard ist `kimi-k2.6`)

Für `x_search` konfigurieren Sie `plugins.entries.xai.config.xSearch.*`. Es verwendet denselben
Fallback `XAI_API_KEY` wie die Grok-Websuche.
Die Legacy-Konfiguration `tools.web.x_search.*` wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie Grok während `openclaw onboard` oder `openclaw configure --section web` auswählen,
kann OpenClaw außerdem optionales Setup von `x_search` mit demselben Schlüssel anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate oberste
Auswahl eines Websuch-Providers. Wenn Sie einen anderen Provider auswählen, zeigt OpenClaw
die Abfrage für `x_search` nicht an.

### API-Schlüssel speichern

<Tabs>
  <Tab title="Konfigurationsdatei">
    Führen Sie `openclaw configure --section web` aus oder setzen Sie den Schlüssel direkt:

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
    Setzen Sie die Env-Variable des Providers in der Prozessumgebung des Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Für eine Gateway-Installation legen Sie sie in `~/.openclaw/.env` ab.
    Siehe [Env vars](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                         |
| --------------------- | ---------------------------------------------------- |
| `query`               | Suchanfrage (erforderlich)                           |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)       |
| `country`             | 2-stelliger ISO-Ländercode (z. B. "US", "DE")        |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de")              |
| `search_lang`         | Suchsprachcode (nur Brave)                           |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`       |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)            |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)             |
| `ui_lang`             | UI-Sprachcode (nur Brave)                            |
| `domain_filter`       | Array für Domain-Allowlist/Denylist (nur Perplexity) |
| `max_tokens`          | Gesamtes Inhaltsbudget, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity) |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Modus `llm-context` von Brave
  lehnt `ui_lang`, `freshness`, `date_after` und `date_before` ab.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Zitaten zurück. Sie
  akzeptieren `count` zur Kompatibilität mit dem gemeinsamen Tool, aber es ändert nicht die
  Form der geerdeten Antwort.
  Perplexity verhält sich genauso, wenn Sie den Kompatibilitätspfad Sonar/OpenRouter
  verwenden (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`).
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts in privaten Netzwerken oder auf Loopback;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search` nur `query` und `count`
  -- verwenden Sie für erweiterte Optionen deren dedizierte Tools.
</Warning>

## x_search

`x_search` durchsucht X-Beiträge (früher Twitter) mit xAI und gibt
KI-synthetisierte Antworten mit Zitaten zurück. Es akzeptiert natürlichsprachliche Anfragen und
optionale strukturierte Filter. OpenClaw aktiviert das eingebaute xAI-Tool `x_search`
nur für die Anfrage, die diesen Tool-Aufruf bedient.

<Note>
  xAI dokumentiert `x_search` mit Unterstützung für Stichwortsuche, semantische Suche, Benutzer-
  Suche und Thread-Abruf. Für Engagement-Statistiken pro Beitrag wie Reposts,
  Antworten, Lesezeichen oder Aufrufe bevorzugen Sie einen gezielten Lookup für die exakte Beitrags-URL
  oder Status-ID. Breite Stichwortsuchen können den richtigen Beitrag finden, aber weniger
  vollständige Metadaten pro Beitrag zurückgeben. Ein gutes Muster ist: zuerst den Beitrag lokalisieren, dann
  eine zweite `x_search`-Anfrage ausführen, die genau auf diesen Beitrag fokussiert ist.
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
            apiKey: "xai-...", // optional, wenn XAI_API_KEY gesetzt ist
          },
        },
      },
    },
  },
}
```

### x_search-Parameter

| Parameter                    | Beschreibung                                          |
| ---------------------------- | ----------------------------------------------------- |
| `query`                      | Suchanfrage (erforderlich)                            |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken        |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                      |
| `from_date`                  | Nur Beiträge ab diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Beiträge bis zu diesem Datum einschließen (YYYY-MM-DD) |
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
// Statistiken pro Beitrag: wenn möglich die exakte Status-URL oder Status-ID verwenden
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw plugin SDK" });

// Suche speziell für Deutschland
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
- [Web Browser](/de/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Seiten
- [Grok Search](/de/tools/grok-search) -- Grok als Provider für `web_search`
- [Ollama Web Search](/de/tools/ollama-search) -- schlüsselfreie Websuche über Ihren Ollama-Host
