---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten x_search aktivieren oder konfigurieren
    - Sie müssen einen Such-Provider auswählen
    - Sie möchten die automatische Erkennung und die Provider-Auswahl verstehen
sidebarTitle: Web Search
summary: web_search, x_search und web_fetch – das Web durchsuchen, X-Beiträge durchsuchen oder Seiteninhalte abrufen
title: Websuche
x-i18n:
    generated_at: "2026-07-24T04:14:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 997e51064b0cd08d0f30987aa038e2f4a98da22f1094974b45f59c18491bd979
    source_path: tools/web.md
    workflow: 16
---

`web_search` durchsucht das Web mit Ihrem konfigurierten Provider und gibt
normalisierte Ergebnisse zurück, die 15 Minuten lang nach Suchanfrage zwischengespeichert werden (konfigurierbar). OpenClaw
enthält außerdem `x_search` für Beiträge auf X (ehemals Twitter) und `web_fetch` zum
leichtgewichtigen Abrufen von URLs. `web_fetch` wird immer lokal ausgeführt; `web_search` wird
über xAI Responses geleitet, wenn Grok der Provider ist, und `x_search` verwendet immer
xAI Responses.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool und keine Browserautomatisierung. Verwenden Sie für
  JS-lastige Websites oder Anmeldungen den [Webbrowser](/de/tools/browser). Verwenden Sie zum
  Abrufen einer bestimmten URL [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    Wählen Sie einen Provider aus und führen Sie alle erforderlichen Einrichtungsschritte durch. Einige Provider
    benötigen keinen Schlüssel, andere benötigen einen API-Schlüssel. Einzelheiten finden Sie auf den
    nachstehenden Provider-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle benötigten Anmeldedaten gespeichert. Bei API-gestützten
    Providern können Sie stattdessen die Umgebungsvariable des Providers festlegen (zum Beispiel
    `BRAVE_API_KEY`) und diesen Schritt überspringen.
  </Step>
  <Step title="Verwenden">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Für Beiträge auf X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Provider auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/de/tools/brave-search">
    Strukturierte Ergebnisse mit Ausschnitten. Unterstützt den `llm-context`-Modus sowie Länder-/Sprachfilter. Eine kostenlose Stufe ist verfügbar.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/de/plugins/codex-harness">
    KI-synthetisierte, quellenbasierte Antworten über Ihr Codex-App-Server-Konto.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Schlüsselfreier Provider. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale und schlagwortbasierte Suche mit Inhaltsextraktion (Hervorhebungen, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Für eine umfassende Extraktion am besten mit `firecrawl_search` und `firecrawl_scrape` kombinieren.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Quellenangaben über die Fundierung durch die Google-Suche.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Quellenangaben über die Web-Fundierung von xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Quellenangaben über die Websuche von Moonshot; nicht fundierte Chat-Rückfälle schlagen explizit fehl.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API des MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Suche über einen angemeldeten lokalen Ollama-Host oder die gehostete Ollama-API.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/de/tools/parallel-search">
    Kostenpflichtige Parallel Search API (`PARALLEL_API_KEY`); höhere Ratenbegrenzungen und Zieloptimierung.
  </Card>
  <Card title="Parallel Search (Kostenlos)" icon="layer-group" href="/de/tools/parallel-search">
    Schlüsselfreie optionale Aktivierung. Das kostenlose Search MCP von Parallel mit für LLMs optimierten, dichten Auszügen und ohne API-Schlüssel.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerelementen für die Inhaltsextraktion und Domainfilterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbst gehostete Metasuche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und weitere.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` zur URL-Extraktion.
  </Card>
</CardGroup>

### Provider-Vergleich

| Provider                                         | Ergebnisdarstellung                                                   | Filter                                          | API-Schlüssel                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)                     | Strukturierte Ausschnitte                                            | Land, Sprache, Zeit, `llm-context`-Modus      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/de/plugins/codex-harness)    | KI-synthetisiert + Quell-URLs                                   | Domains, Kontextgröße, Benutzerstandort             | Keiner; verwendet die Codex/OpenAI-Anmeldung                                                         |
| [DuckDuckGo](/de/tools/duckduckgo-search)           | Strukturierte Ausschnitte                                            | --                                               | Keiner (schlüsselfrei)                                                                         |
| [Exa](/de/tools/exa-search)                         | Strukturiert + extrahiert                                         | Neuronaler/Schlagwortmodus, Datum, Inhaltsextraktion    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/de/tools/firecrawl)                    | Strukturierte Ausschnitte                                            | Über das Tool `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/de/tools/gemini-search)                   | KI-synthetisiert + Quellenangaben                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/de/tools/grok-search)                       | KI-synthetisiert + Quellenangaben                                     | --                                               | xAI OAuth, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/de/tools/kimi-search)                       | KI-synthetisiert + Quellenangaben; schlägt bei nicht fundierten Chat-Rückfällen fehl | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/de/tools/minimax-search)          | Strukturierte Ausschnitte                                            | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/de/tools/ollama-search)        | Strukturierte Ausschnitte                                            | --                                               | Keiner für angemeldete lokale Hosts; `OLLAMA_API_KEY` für die direkte `https://ollama.com`-Suche |
| [Parallel](/de/tools/parallel-search)               | Dichte, für den LLM-Kontext eingestufte Auszüge                          | --                                               | `PARALLEL_API_KEY` (kostenpflichtig)                                                               |
| [Parallel Search (Kostenlos)](/de/tools/parallel-search) | Dichte, für den LLM-Kontext eingestufte Auszüge                          | --                                               | Keiner (kostenloses Search MCP)                                                                  |
| [Perplexity](/de/tools/perplexity-search)           | Strukturierte Ausschnitte                                            | Land, Sprache, Zeit, Domains, Inhaltsbegrenzungen | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/de/tools/searxng-search)                 | Strukturierte Ausschnitte                                            | Kategorien, Sprache                             | Keiner (selbst gehostet)                                                                      |
| [Tavily](/de/tools/tavily)                          | Strukturierte Ausschnitte                                            | Über das Tool `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Ergebnisstruktur

`web_search` normalisiert jeden gebündelten und externen Plugin-Provider an der zentralen
Tool-Grenze. Aufrufer erhalten genau eine dieser abgeschlossenen Strukturen:

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

Strukturierte Provider verwenden `kind: "results"`; synthetisierende Provider verwenden
`kind: "answer"`. Externe Plugin-Provider, deren Nutzdaten keiner der beiden Strukturen
entsprechen, werden aus Kompatibilitätsgründen unverändert als `kind: "raw"` weitergegeben. Providerspezifische
Felder wie Rohbewertungen, Auszüge, verwandte Suchanfragen, Offsets von Inline-Quellenangaben,
Modell-IDs oder Sitzungsmetadaten werden in normalisierten
Zweigen nicht weitergegeben. Verwenden Sie das dedizierte Tool eines Providers, wenn dessen umfangreichere Antwort Teil Ihres
Workflows ist.

`externalContent.wrapped: true` ist eine Vertrauensmarkierung, deren Wahrheitsgehalt durch die Grenze selbst
gewährleistet wird: Provider-Prosa (`title`, `snippet`, `siteName`, `content`, Titel von Quellenangaben,
Fehler-`message`) wird von allen bereits vorhandenen Umschlagzeilen befreit und
an der zentralen Grenze genau einmal neu umschlossen, sodass keine Provider-Metadaten
die Markierung vortäuschen können. `query` ist immer die angeforderte Suchanfrage, URLs von Quellenangaben und Ergebnissen
müssen als http(s) geparst werden können, `published` muss die Form eines ISO-Datums haben, URLs werden kanonisiert ausgegeben und
Nutzdaten, die einen `error`-Schlüssel enthalten, werden immer als `kind: "error"` gemeldet, wobei der
ursprüngliche Provider-Code innerhalb der umschlossenen Nachricht erhalten bleibt. Unverändert weitergegebene
Nutzdaten behalten alle vom Provider gesetzten Markierungen bei.

## Automatische Erkennung

Provider-Listen in der Dokumentation und in Einrichtungsabläufen sind alphabetisch sortiert. Die automatische Erkennung verwendet eine
separate, feste Rangfolge und wählt einen Provider, der Anmeldedaten
(`requiresCredential !== false`) benötigt, nur aus, wenn sie konfigurierte Anmeldedaten findet. Wenn
kein `provider` festgelegt ist, prüft OpenClaw die Provider in dieser Reihenfolge und verwendet den
ersten einsatzbereiten:

Zuerst API-gestützte Provider:

1. **Brave** -- `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey` (Reihenfolge 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey` (Reihenfolge 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` oder `models.providers.google.apiKey` (Reihenfolge 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` (Reihenfolge 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey` (Reihenfolge 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey` (Reihenfolge 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey` (Reihenfolge 60)
8. **Exa** -- `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`; optional überschreibt `plugins.entries.exa.config.webSearch.baseUrl` den Exa-Endpunkt (Reihenfolge 65)
9. **Tavily** -- `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey` (Reihenfolge 70)
10. **Parallel** -- kostenpflichtige Parallel Search API über `PARALLEL_API_KEY` oder `plugins.entries.parallel.config.webSearch.apiKey`; optional überschreibt `plugins.entries.parallel.config.webSearch.baseUrl` den Endpunkt (Reihenfolge 75)

Danach folgen konfigurierte Endpunkt-Provider:

11. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Provider ohne Schlüssel wie **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** und **Codex Hosted Search** werden bei der automatischen Erkennung
nie ausgewählt, obwohl sie intern einen Reihenfolgewert haben. Sie werden nur verwendet, wenn Sie
sie ausdrücklich mit `tools.web.search.provider` oder über
`openclaw configure --section web` auswählen. OpenClaw sendet verwaltete
`web_search`-Abfragen nicht allein deshalb an einen Provider ohne Schlüssel, weil kein
API-gestützter Provider konfiguriert ist.

OpenAI-Responses-Modelle bilden eine Ausnahme: Solange `tools.web.search.provider`
nicht gesetzt ist, verwenden sie die native Websuche von OpenAI anstelle der oben genannten
verwalteten Provider (siehe unten). Setzen Sie `tools.web.search.provider` auf
`parallel-free` (oder einen anderen Provider), um sie stattdessen über den verwalteten Pfad
zu leiten.

<Note>
  Alle Provider-Schlüsselfelder unterstützen SecretRef-Objekte. Plugin-spezifische SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  installierten API-gestützten Websuch-Provider aufgelöst, darunter Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity und Tavily,
  unabhängig davon, ob der Provider ausdrücklich über `tools.web.search.provider` ausgewählt oder
  durch die automatische Erkennung bestimmt wird. Im Modus der automatischen Erkennung löst OpenClaw nur den
  Schlüssel des ausgewählten Providers auf – nicht ausgewählte SecretRefs bleiben inaktiv, sodass Sie
  mehrere Provider konfigurieren können, ohne Auflösungskosten für diejenigen zu verursachen,
  die Sie nicht verwenden.
</Note>

## Native OpenAI-Websuche

Direkte OpenAI-Responses-Modelle (`api: "openai-responses"`, Provider `openai`,
keine Basis-URL oder eine offizielle OpenAI-API-Basis-URL) verwenden automatisch das gehostete
`web_search`-Tool von OpenAI, wenn die OpenClaw-Websuche aktiviert und kein
verwalteter Provider festgelegt ist. Dieses Verhalten gehört dem Provider im mitgelieferten
OpenAI-Plugin und gilt nicht für OpenAI-kompatible Proxy-Basis-URLs oder Azure-
Routen. Setzen Sie `tools.web.search.provider` auf einen anderen Provider wie `brave`, um
das verwaltete `web_search`-Tool für OpenAI-Modelle beizubehalten, oder setzen Sie
`tools.web.search.enabled: false`, um sowohl die verwaltete Suche als auch die native
OpenAI-Suche zu deaktivieren.

## Native Codex-Websuche

Die Codex-App-Server-Laufzeit verwendet automatisch das gehostete `web_search`-Tool von Codex,
wenn die Websuche aktiviert und kein verwalteter Provider ausgewählt ist. Die native gehostete
Suche und das dynamische verwaltete `web_search`-Tool von OpenClaw schließen sich gegenseitig aus,
sodass die verwaltete Suche native Domainbeschränkungen nicht umgehen kann. OpenClaw verwendet das
verwaltete Tool, wenn die gehostete Suche nicht verfügbar oder ausdrücklich deaktiviert ist oder
durch einen ausgewählten verwalteten Provider ersetzt wird. OpenClaw lässt die eigenständige
`web.run`-Erweiterung von Codex deaktiviert (`features.standalone_web_search: false`),
da der App-Server-Produktivverkehr deren benutzerdefinierten `web`-
Namensraum ablehnt.

- Konfigurieren Sie die native Suche unter `tools.web.search.openaiCodex`
- Setzen Sie `tools.web.search.provider: "codex"`, um Codex Hosted Search als
  verwalteten `web_search`-Provider für ein beliebiges übergeordnetes Modell bereitzustellen. Jeder Aufruf führt eine
  begrenzte kurzlebige Codex-App-Server-Runde aus und schlägt fehl, wenn Codex kein
  gehostetes `webSearch`-Element ausgibt.
- `mode: "cached"` ist die Standardeinstellung, Codex löst sie jedoch für uneingeschränkte
  App-Server-Runden in einen aktiven externen Zugriff auf; setzen Sie `"live"`, um
  den aktiven Zugriff ausdrücklich anzufordern
- Setzen Sie `tools.web.search.provider` auf einen verwalteten Provider wie `brave`, um
  stattdessen das verwaltete `web_search` von OpenClaw zu verwenden
- Setzen Sie `tools.web.search.openaiCodex.enabled: false`, um die von Codex gehostete
  Suche abzulehnen; andere verwaltete Provider bleiben verfügbar
- Durch die Einschränkung der nativen Codex-Tool-Oberfläche bleibt auch das verwaltete `web_search`
  verfügbar
- Wenn `allowedDomains` gesetzt ist, schlägt der automatische verwaltete Fallback geschlossen fehl, falls
  die gehostete Suche nicht verfügbar ist, sodass die native Positivliste nicht umgangen werden kann
- Reine LLM-Ausführungen mit deaktivierten Tools deaktivieren sowohl die native als auch die verwaltete Suche
- `tools.web.search.enabled: false` deaktiviert sowohl die verwaltete als auch die native Suche

Dauerhafte Änderungen an der effektiven Codex-Suchrichtlinie starten einen neuen gebundenen Thread, damit
ein bereits geladener App-Server-Thread keinen veralteten Zugriff auf die gehostete Suche behalten kann.
Vorübergehende Einschränkungen pro Runde verwenden einen temporären eingeschränkten Thread und behalten
die bestehende Bindung für eine spätere Fortsetzung bei.

Direkter OpenAI-ChatGPT-Responses-Datenverkehr kann ebenfalls das gehostete
`web_search`-Tool von OpenAI verwenden. Dieser separate Pfad bleibt über
`tools.web.search.openaiCodex.enabled: true` optional und gilt nur für geeignete
`openai/*`-Modelle, die `api: "openai-chatgpt-responses"` verwenden.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: Codex Hosted Search auch von übergeordneten Nicht-Codex-Modellen aus verwenden.
        provider: "codex",
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

Für Laufzeiten und Provider, die die native Codex-Suche nicht unterstützen, kann Codex
den verwalteten `web_search`-Fallback über den dynamischen Tool-Namensraum von OpenClaw verwenden.
Verwenden Sie einen ausdrücklich ausgewählten verwalteten Provider, wenn Sie die Provider-spezifischen
Netzwerkkontrollen von OpenClaw anstelle der von Codex gehosteten Suche benötigen.

Durch die Auswahl von `provider: "codex"` wird das mitgelieferte `codex`-Plugin aktiviert und es werden dieselben
oben gezeigten `tools.web.search.openaiCodex`-Beschränkungen verwendet. Authentifizieren Sie zunächst den
Codex-App-Server mit `openclaw models auth login --provider openai`.
Der übergeordnete Agent kann ein beliebiges Modell oder eine beliebige Laufzeit verwenden; nur der begrenzte Such-Worker
wird über Codex ausgeführt.

## Netzwerksicherheit

Verwaltete HTTP-Aufrufe von `web_search`-Providern verwenden den geschützten Abrufpfad von OpenClaw,
der auf den eigenen Hostnamen des aktuellen Providers beschränkt ist. Ausschließlich für diesen Hostnamen
erlaubt OpenClaw Fake-IP-DNS-Antworten von Surge, Clash und sing-box in
`198.18.0.0/15` und `fc00::/7`. Andere private, Loopback-, Link-Local- und
Metadatenziele bleiben blockiert. Codex Hosted Search bildet die Ausnahme:
Der begrenzte Worker delegiert den Netzwerkzugriff an das gehostete
`web_search`-Tool des Codex-App-Servers.

Diese automatische Freigabe gilt nicht für beliebige `web_fetch`-URLs. Aktivieren Sie für
`web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` nur dann ausdrücklich, wenn Ihr
vertrauenswürdiger Proxy Eigentümer dieser synthetischen Bereiche ist.

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // Standard: true
        provider: "brave", // oder für die automatische Erkennung weglassen
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Provider-spezifische Konfigurationen (API-Schlüssel, Basis-URLs, Modi) befinden sich unter
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kann außerdem
`models.providers.google.apiKey` und `models.providers.google.baseUrl` als nachrangige
Fallbacks nach seiner dedizierten Websuchkonfiguration und `GEMINI_API_KEY` wiederverwenden. Beispiele finden Sie auf den
Provider-Seiten.
Grok kann außerdem ein xAI-OAuth-Authentifizierungsprofil aus `openclaw models auth login
--provider xai --method oauth` wiederverwenden; die API-Schlüssel-Konfiguration bleibt der Fallback.

`tools.web.search.provider` wird anhand der Websuch-Provider-IDs validiert,
die von den Manifesten mitgelieferter und installierter Plugins deklariert werden. Ein Tippfehler wie `"brvae"`
führt zu einem Fehler bei der Konfigurationsvalidierung, statt stillschweigend auf die automatische Erkennung zurückzufallen. Wenn für einen
konfigurierten Provider nur veraltete Plugin-Nachweise vorhanden sind, etwa ein verbliebener
`plugins.entries.<plugin>`-Block nach der Deinstallation eines Drittanbieter-Plugins,
bleibt der Start von OpenClaw stabil und es wird eine Warnung ausgegeben, damit Sie das
Plugin neu installieren oder `openclaw doctor --fix` ausführen können, um die veraltete Konfiguration zu bereinigen.

Die Auswahl des `web_fetch`-Fallback-Providers erfolgt separat:

- Wählen Sie ihn mit `tools.web.fetch.provider` aus
- oder lassen Sie dieses Feld weg und erlauben Sie OpenClaw, anhand der konfigurierten Anmeldedaten den ersten bereiten Webabruf-
  Provider automatisch zu erkennen
- Nicht in einer Sandbox ausgeführtes `web_fetch` kann installierte Plugin-Provider verwenden, die
  `contracts.webFetchProviders` deklarieren; Abrufe in einer Sandbox erlauben mitgelieferte Provider und
  verifizierte offizielle Plugin-Installationen, schließen jedoch externe Drittanbieter-Plugins aus
- Das offizielle Firecrawl-Plugin ist derzeit der einzige mitgelieferte `webFetchProviders`-
  Mitwirkende und wird unter
  `plugins.entries.firecrawl.config.webFetch.*` konfiguriert

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw außerdem Folgendes abfragen:

- die Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- das standardmäßige Kimi-Websuchmodell (Standardwert: `kimi-k2.6`)

Konfigurieren Sie für `x_search` den Wert `plugins.entries.xai.config.xSearch.*`. Es verwendet dasselbe
xAI-Authentifizierungsprofil wie der Chat oder die von der Grok-Websuche verwendeten
`XAI_API_KEY`- bzw. Plugin-Websuch-Anmeldedaten.
Die veraltete `tools.web.x_search.*`-Konfiguration wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie während `openclaw onboard` oder `openclaw configure --section web` Grok auswählen,
bietet OpenClaw direkt nach Abschluss der Grok-Einrichtung außerdem eine optionale Einrichtung von
`x_search` mit denselben Anmeldedaten an. Dies ist ein separater Folgeschritt innerhalb des Grok-
Pfads und keine separate Auswahl eines Websuch-Providers auf oberster Ebene. Wenn Sie einen anderen
Provider auswählen, zeigt OpenClaw die Eingabeaufforderung `x_search` nicht an.

### API-Schlüssel speichern

<Tabs>
  <Tab title="Konfigurationsdatei">
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
  <Tab title="Umgebungsvariable">
    Legen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Gateways fest:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Legen Sie sie bei einer Gateway-Installation in `~/.openclaw/.env` ab.
    Siehe [Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Suchanfrage (erforderlich)                                         |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)                     |
| `country`             | 2-stelliger ISO-Ländercode (z. B. "US", "DE")                      |
| `language`            | Sprachcode nach ISO 639-1 (z. B. "en", "de")                       |
| `search_lang`         | Code der Suchsprache (nur Brave)                                   |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`                    |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)                           |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)                            |
| `ui_lang`             | Sprachcode der Benutzeroberfläche (nur Brave)                       |
| `domain_filter`       | Array mit zulässigen/gesperrten Domains (nur Perplexity)           |
| `max_tokens`          | Gesamtes Token-Budget für Inhalte, nur native Perplexity Search API |
| `max_tokens_per_page` | Token-Limit für die Extraktion pro Seite, nur native Perplexity Search API |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Brave-Modus `llm-context`
  lehnt `ui_lang` ab; `date_before` erfordert außerdem `date_after`, da benutzerdefinierte
  Aktualitätszeiträume von Brave sowohl ein Start- als auch ein Enddatum erfordern.
  Gemini, Grok und Kimi geben eine einzelne synthetisierte Antwort mit Quellenangaben zurück. Sie
  akzeptieren `count` zur Kompatibilität mit dem gemeinsam genutzten Tool, dies ändert jedoch nicht die
  Form der fundierten Antwort. Gemini behandelt die Aktualitätseinstellung `day` als Hinweis auf die zeitliche Nähe; weiter gefasste
  Aktualitätswerte und explizite Datumsangaben legen Zeiträume für die Fundierung durch Google Search fest.
  Perplexity verhält sich ebenso, wenn Sie den Kompatibilitätspfad Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`) verwenden; dieser Pfad unterstützt außerdem `max_tokens` und
  `max_tokens_per_page` nicht.
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts im privaten Netzwerk oder auf der Loopback-Schnittstelle;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen `query` und `count` über `web_search`
  nur eingeschränkt – verwenden Sie für erweiterte Optionen deren dedizierte Tools.
</Warning>

## x_search

`x_search` durchsucht mit xAI Beiträge auf X (früher Twitter) und gibt
KI-synthetisierte Antworten mit Quellenangaben zurück. Es akzeptiert natürlichsprachliche Anfragen und
optionale strukturierte Filter. OpenClaw erstellt das integrierte xAI-Tool `x_search`
für jede Anfrage neu, statt es dauerhaft zu registrieren. Daher ist es nur
in dem Turn aktiv, in dem es tatsächlich aufgerufen wird.

<Warning>
  `x_search` wird auf den Servern von xAI ausgeführt. xAI berechnet $5 pro 1,000 Tool-Aufrufe zuzüglich der
  Eingabe- und Ausgabe-Token des Modells.
</Warning>

<Note>
  Laut xAI unterstützt `x_search` die Stichwortsuche, semantische Suche, Benutzersuche
  und das Abrufen von Threads. Für Interaktionsstatistiken einzelner Beiträge wie Reposts,
  Antworten, Lesezeichen oder Aufrufe empfiehlt sich eine gezielte Suche nach der exakten Beitrags-URL
  oder Status-ID. Eine breit angelegte Stichwortsuche kann den richtigen Beitrag finden, aber weniger
  vollständige Metadaten zu diesem Beitrag zurückgeben. Ein bewährtes Vorgehen: Suchen Sie zunächst den Beitrag und
  führen Sie anschließend eine zweite `x_search`-Abfrage aus, die gezielt auf diesen Beitrag ausgerichtet ist.
</Note>

### x_search-Konfiguration

Wenn `enabled` nicht angegeben ist, wird `x_search` nur bereitgestellt, wenn der Provider des aktiven Modells
`xai` ist und xAI-Anmeldedaten aufgelöst werden können. Legen Sie bei einem aktiven Modell mit einem bekannten
Nicht-xAI-Provider `plugins.entries.xai.config.xSearch.enabled` auf `true` fest, um
die providerübergreifende Nutzung zu aktivieren. Wenn der Provider des aktiven Modells fehlt oder
nicht aufgelöst werden kann, bleibt das Tool ausgeblendet. Legen Sie `enabled` auf `false` fest, um es für
jeden Provider zu deaktivieren. xAI-Anmeldedaten sind immer erforderlich.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // für einen bekannten Nicht-xAI-Modell-Provider erforderlich
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // optional, überschreibt webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional, wenn ein xAI-Authentifizierungsprofil oder XAI_API_KEY festgelegt ist
            baseUrl: "https://api.x.ai/v1", // optionale gemeinsam genutzte Basis-URL für xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` sendet Anfragen an `<baseUrl>/responses`, wenn
`plugins.entries.xai.config.xSearch.baseUrl` festgelegt ist. Wenn dieses Feld nicht angegeben ist,
wird zunächst auf `plugins.entries.xai.config.webSearch.baseUrl` und anschließend auf den
öffentlichen xAI-Endpunkt (`https://api.x.ai/v1`) zurückgegriffen.

### x_search-Parameter

| Parameter                    | Beschreibung                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Suchanfrage (erforderlich)                             |
| `allowed_x_handles`          | Ergebnisse auf höchstens 20 X-Handles beschränken      |
| `excluded_x_handles`         | Höchstens 20 X-Handles ausschließen                    |
| `from_date`                  | Nur Beiträge an oder nach diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Beiträge an oder vor diesem Datum einschließen (YYYY-MM-DD) |
| `enable_image_understanding` | xAI erlauben, Bilder in übereinstimmenden Beiträgen zu untersuchen |
| `enable_video_understanding` | xAI erlauben, Videos in übereinstimmenden Beiträgen zu untersuchen |

`allowed_x_handles` und `excluded_x_handles` schließen sich gegenseitig aus.

### x_search-Beispiel

```javascript
await x_search({
  query: "Abendessenrezepte",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiken pro Beitrag: Verwenden Sie nach Möglichkeit die exakte Status-URL oder Status-ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw Plugin SDK" });

// Deutschland-spezifische Suche
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Aktuelle Ergebnisse (vergangene Woche)
await web_search({ query: "KI-Entwicklungen", freshness: "week" });

// Datumsbereich
await web_search({
  query: "Klimaforschung",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain-Filterung (nur Perplexity)
await web_search({
  query: "Produktbewertungen",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Tool-Profile

Wenn Sie Tool-Profile oder Zulässigkeitslisten verwenden, fügen Sie `web_search`, `x_search` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // oder: allow: ["group:web"]  (enthält web_search, x_search und web_fetch)
  },
}
```

## Verwandte Themen

- [Web Fetch](/de/tools/web-fetch) – eine URL abrufen und lesbare Inhalte extrahieren
- [Webbrowser](/de/tools/browser) – vollständige Browserautomatisierung für Websites mit intensiver JS-Nutzung
- [Grok-Suche](/de/tools/grok-search) – Grok als `web_search`-Provider
- [Ollama-Websuche](/de/tools/ollama-search) – schlüsselfreie Websuche über Ihren Ollama-Host
