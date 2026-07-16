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
    generated_at: "2026-07-16T13:32:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` durchsucht das Web mit Ihrem konfigurierten Provider und gibt
normalisierte Ergebnisse zurück, die pro Suchanfrage 15 Minuten lang zwischengespeichert werden (konfigurierbar). OpenClaw
enthält außerdem `x_search` für Beiträge auf X (ehemals Twitter) und `web_fetch` zum
einfachen Abrufen von URLs. `web_fetch` wird immer lokal ausgeführt; `web_search` wird
über xAI Responses geleitet, wenn Grok der Provider ist, und `x_search` verwendet immer
xAI Responses.

<Info>
  `web_search` ist ein einfaches HTTP-Tool und keine Browserautomatisierung. Verwenden Sie für
  Websites mit hohem JavaScript-Anteil oder Anmeldungen den [Webbrowser](/de/tools/browser). Verwenden Sie zum
  Abrufen einer bestimmten URL [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    Wählen Sie einen Provider aus und schließen Sie alle erforderlichen Einrichtungsschritte ab. Einige Provider
    benötigen keinen Schlüssel, andere einen API-Schlüssel. Weitere
    Informationen finden Sie auf den unten aufgeführten Provider-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle erforderlichen Anmeldedaten gespeichert. Bei API-basierten
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
    Strukturierte Ergebnisse mit Auszügen. Unterstützt den Modus `llm-context` sowie Länder- und Sprachfilter. Kostenloses Kontingent verfügbar.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/de/plugins/codex-harness">
    KI-generierte, quellenbasierte Antworten über Ihr Codex-App-Server-Konto.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Schlüsselfreier Provider. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale Suche und Stichwortsuche mit Inhaltsextraktion (Hervorhebungen, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Für eine gründliche Extraktion am besten mit `firecrawl_search` und `firecrawl_scrape` kombinieren.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-generierte Antworten mit Quellenangaben durch die Einbindung der Google-Suche.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-generierte Antworten mit Quellenangaben durch die Web-Einbindung von xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-generierte Antworten mit Quellenangaben über die Websuche von Moonshot; nicht quellenbasierte Chat-Rückfälle schlagen ausdrücklich fehl.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API des MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Suche über einen angemeldeten lokalen Ollama-Host oder die gehostete Ollama-API.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/de/tools/parallel-search">
    Kostenpflichtige Parallel Search API (`PARALLEL_API_KEY`); höhere Ratenlimits und zielorientierte Optimierung.
  </Card>
  <Card title="Parallel Search (kostenlos)" icon="layer-group" href="/de/tools/parallel-search">
    Schlüsselfreie optionale Nutzung. Das kostenlose Search MCP von Parallel mit für LLMs optimierten, informationsreichen Auszügen und ohne API-Schlüssel.
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

| Provider                                         | Ergebnisdarstellung                                             | Filter                                           | API-Schlüssel                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)                     | Strukturierte Auszüge                                           | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/de/plugins/codex-harness)    | KI-generiert + Quell-URLs                                       | Domains, Kontextgröße, Benutzerstandort          | Keiner; verwendet die Codex/OpenAI-Anmeldung                                            |
| [DuckDuckGo](/de/tools/duckduckgo-search)           | Strukturierte Auszüge                                           | --                                               | Keiner (schlüsselfrei)                                                                  |
| [Exa](/de/tools/exa-search)                         | Strukturiert + extrahiert                                       | Neuronaler/Stichwortmodus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                      |
| [Firecrawl](/de/tools/firecrawl)                    | Strukturierte Auszüge                                           | Über das Tool `firecrawl_search`                 | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/de/tools/gemini-search)                   | KI-generiert + Quellenangaben                                   | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/de/tools/grok-search)                       | KI-generiert + Quellenangaben                                   | --                                               | xAI OAuth, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/de/tools/kimi-search)                       | KI-generiert + Quellenangaben; schlägt bei nicht quellenbasierten Chat-Rückfällen fehl | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/de/tools/minimax-search)          | Strukturierte Auszüge                                           | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/de/tools/ollama-search)        | Strukturierte Auszüge                                           | --                                               | Keiner für angemeldete lokale Hosts; `OLLAMA_API_KEY` für die direkte Suche mit `https://ollama.com` |
| [Parallel](/de/tools/parallel-search)               | Informationsreiche, für den LLM-Kontext eingestufte Auszüge    | --                                               | `PARALLEL_API_KEY` (kostenpflichtig)                                                    |
| [Parallel Search (kostenlos)](/de/tools/parallel-search) | Informationsreiche, für den LLM-Kontext eingestufte Auszüge | --                                               | Keiner (kostenloses Search MCP)                                                         |
| [Perplexity](/de/tools/perplexity-search)           | Strukturierte Auszüge                                           | Land, Sprache, Zeit, Domains, Inhaltslimits       | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/de/tools/searxng-search)                 | Strukturierte Auszüge                                           | Kategorien, Sprache                              | Keiner (selbst gehostet)                                                               |
| [Tavily](/de/tools/tavily)                          | Strukturierte Auszüge                                           | Über das Tool `tavily_search`                 | `TAVILY_API_KEY`                                                                        |

## Automatische Erkennung

Provider-Listen in der Dokumentation und in Einrichtungsabläufen sind alphabetisch sortiert. Die automatische Erkennung verwendet eine
separate, feste Prioritätsreihenfolge und wählt einen Provider, der
Anmeldedaten (`requiresCredential !== false`) benötigt, nur dann aus, wenn diese konfiguriert sind. Wenn
kein `provider` festgelegt ist, prüft OpenClaw die Provider in dieser Reihenfolge und verwendet den
ersten einsatzbereiten Provider:

Zuerst API-basierte Provider:

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

Danach Provider mit konfiguriertem Endpunkt:

11. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Schlüsselfreie Provider wie **Parallel Search (kostenlos)**, **DuckDuckGo**,
**Ollama Web Search** und **Codex Hosted Search** werden bei der automatischen Erkennung nie ausgewählt,
obwohl sie einen internen Reihenfolgewert haben. Sie werden nur verwendet, wenn Sie sie
explizit mit `tools.web.search.provider` oder über
`openclaw configure --section web` auswählen. OpenClaw sendet verwaltete
`web_search`-Suchanfragen nicht allein deshalb an einen schlüsselfreien Provider, weil kein API-basierter
Provider konfiguriert ist.

OpenAI-Responses-Modelle bilden eine Ausnahme: Solange `tools.web.search.provider`
nicht festgelegt ist, verwenden sie statt der oben genannten verwalteten
Provider die native Websuche von OpenAI (siehe unten). Setzen Sie `tools.web.search.provider` auf
`parallel-free` (oder einen anderen Provider), um sie stattdessen über den verwalteten Pfad
zu leiten.

<Note>
  Alle Provider-Schlüsselfelder unterstützen SecretRef-Objekte. Plugin-bezogene SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  installierten API-basierten Websuch-Provider aufgelöst, darunter Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity und Tavily,
  unabhängig davon, ob der Provider explizit über `tools.web.search.provider` ausgewählt oder
  durch die automatische Erkennung bestimmt wird. Im Modus der automatischen Erkennung löst OpenClaw nur den
  Schlüssel des ausgewählten Providers auf – nicht ausgewählte SecretRefs bleiben inaktiv, sodass Sie
  mehrere Provider konfigurieren können, ohne die Auflösungskosten für nicht verwendete
  Provider zu tragen.
</Note>

## Native OpenAI-Websuche

Direkte OpenAI-Responses-Modelle (`api: "openai-responses"`, Provider `openai`,
keine Basis-URL oder eine offizielle OpenAI-API-Basis-URL) verwenden automatisch das von OpenAI gehostete
Tool `web_search`, wenn die OpenClaw-Websuche aktiviert und kein
verwalteter Provider fest vorgegeben ist. Dieses Verhalten gehört dem Provider im mitgelieferten
OpenAI-Plugin und gilt nicht für OpenAI-kompatible Proxy-Basis-URLs oder Azure-
Routen. Setzen Sie `tools.web.search.provider` auf einen anderen Provider wie `brave`, um
das verwaltete Tool `web_search` für OpenAI-Modelle beizubehalten, oder setzen Sie
`tools.web.search.enabled: false`, um sowohl die verwaltete Suche als auch die native
OpenAI-Suche zu deaktivieren.

## Native Codex-Websuche

Die Codex-App-Server-Runtime verwendet das gehostete `web_search`-Tool von Codex automatisch,
wenn die Websuche aktiviert und kein verwalteter Provider ausgewählt ist. Die native gehostete
Suche und das verwaltete dynamische `web_search`-Tool von OpenClaw schließen sich gegenseitig aus,
sodass die verwaltete Suche native Domainbeschränkungen nicht umgehen kann. OpenClaw verwendet das
verwaltete Tool, wenn die gehostete Suche nicht verfügbar, ausdrücklich deaktiviert oder
durch einen ausgewählten verwalteten Provider ersetzt wurde. OpenClaw lässt die eigenständige
`web.run`-Erweiterung von Codex deaktiviert (`features.standalone_web_search: false`),
da produktiver App-Server-Datenverkehr deren benutzerdefinierten `web`-
Namespace ablehnt.

- Konfigurieren Sie die native Suche unter `tools.web.search.openaiCodex`
- Legen Sie `tools.web.search.provider: "codex"` fest, um Codex Hosted Search als
  verwalteten `web_search`-Provider für ein beliebiges übergeordnetes Modell bereitzustellen. Jeder Aufruf führt einen
  begrenzten kurzlebigen Codex-App-Server-Durchlauf aus und schlägt fehl, wenn Codex kein
  gehostetes `webSearch`-Element ausgibt.
- `mode: "cached"` ist die Standardeinstellung, Codex löst sie jedoch für uneingeschränkte
  App-Server-Durchläufe in einen externen Live-Zugriff auf; legen Sie `"live"` fest, um
  den Live-Zugriff ausdrücklich anzufordern
- Legen Sie `tools.web.search.provider` auf einen verwalteten Provider wie `brave` fest, um
  stattdessen das verwaltete `web_search` von OpenClaw zu verwenden
- Legen Sie `tools.web.search.openaiCodex.enabled: false` fest, um die von Codex gehostete
  Suche abzulehnen; andere verwaltete Provider bleiben verfügbar
- Eine Einschränkung der nativen Codex-Tool-Oberfläche lässt das verwaltete `web_search`
  ebenfalls verfügbar
- Wenn `allowedDomains` festgelegt ist, schlägt der automatische verwaltete Fallback geschlossen fehl,
  falls die gehostete Suche nicht verfügbar ist, sodass die native Positivliste nicht umgangen werden kann
- LLM-only-Durchläufe mit deaktivierten Tools deaktivieren sowohl die native als auch die verwaltete Suche
- `tools.web.search.enabled: false` deaktiviert sowohl die verwaltete als auch die native Suche

Dauerhafte Änderungen an der wirksamen Codex-Suchrichtlinie starten einen neuen gebundenen Thread, damit
ein bereits geladener App-Server-Thread keinen veralteten Zugriff auf die gehostete Suche beibehalten kann.
Vorübergehende Einschränkungen pro Durchlauf verwenden einen temporären eingeschränkten Thread und bewahren
die bestehende Bindung für eine spätere Fortsetzung.

Direkter OpenAI-ChatGPT-Responses-Datenverkehr kann ebenfalls das gehostete
`web_search`-Tool von OpenAI verwenden. Dieser separate Pfad bleibt über
`tools.web.search.openaiCodex.enabled: true` optional und gilt nur für berechtigte
`openai/*`-Modelle, die `api: "openai-chatgpt-responses"` verwenden.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: Codex Hosted Search auch aus übergeordneten Nicht-Codex-Modellen verwenden.
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

Für Runtimes und Provider, die die native Codex-Suche nicht unterstützen, kann Codex
den verwalteten `web_search`-Fallback über den dynamischen Tool-Namespace von OpenClaw verwenden.
Verwenden Sie einen expliziten verwalteten Provider, wenn Sie die providerspezifischen
Netzwerksteuerungen von OpenClaw anstelle der von Codex gehosteten Suche benötigen.

Durch Auswahl von `provider: "codex"` wird das gebündelte `codex`-Plugin aktiviert und es werden die
gleichen oben gezeigten `tools.web.search.openaiCodex`-Einschränkungen verwendet. Authentifizieren Sie zunächst den
Codex-App-Server mit `openclaw models auth login --provider openai`.
Der übergeordnete Agent kann ein beliebiges Modell oder eine beliebige Runtime verwenden; nur der begrenzte Such-Worker
wird über Codex ausgeführt.

## Netzwerksicherheit

Verwaltete HTTP-Aufrufe des `web_search`-Providers verwenden den abgesicherten Abrufpfad von OpenClaw,
beschränkt auf den eigenen Hostnamen des aktuellen Providers. Nur für diesen Hostnamen
erlaubt OpenClaw Fake-IP-DNS-Antworten von Surge, Clash und sing-box in
`198.18.0.0/15` und `fc00::/7`. Andere private, Loopback-, Link-Local- und
Metadatenziele bleiben blockiert. Codex Hosted Search ist die Ausnahme:
Sein begrenzter Worker delegiert den Netzwerkzugriff an das gehostete
`web_search`-Tool des Codex-App-Servers.

Diese automatische Zulassung gilt nicht für beliebige `web_fetch`-URLs. Aktivieren Sie für
`web_fetch` die Optionen `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
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

Providerspezifische Konfigurationen (API-Schlüssel, Basis-URLs, Modi) befinden sich unter
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kann außerdem
`models.providers.google.apiKey` und `models.providers.google.baseUrl` als nachrangige
Fallbacks nach seiner dedizierten Websuchkonfiguration und `GEMINI_API_KEY` wiederverwenden. Beispiele finden Sie auf den
Provider-Seiten.
Grok kann außerdem ein xAI-OAuth-Authentifizierungsprofil aus `openclaw models auth login
--provider xai --method oauth` wiederverwenden; die API-Schlüssel-Konfiguration bleibt der Fallback.

`tools.web.search.provider` wird anhand der Websuch-Provider-IDs validiert,
die von den Manifesten gebündelter und installierter Plugins deklariert werden. Ein Tippfehler wie `"brvae"`
führt zu einem Fehler bei der Konfigurationsvalidierung, statt stillschweigend auf die automatische Erkennung zurückzufallen. Wenn für einen
konfigurierten Provider nur veraltete Plugin-Nachweise vorliegen, etwa ein übrig gebliebener
`plugins.entries.<plugin>`-Block nach der Deinstallation eines Drittanbieter-Plugins,
bleibt der Start von OpenClaw robust und es wird eine Warnung ausgegeben, damit Sie das
Plugin neu installieren oder `openclaw doctor --fix` ausführen können, um die veraltete Konfiguration zu bereinigen.

Die Auswahl des `web_fetch`-Fallback-Providers erfolgt separat:

- Wählen Sie ihn mit `tools.web.fetch.provider` aus
- oder lassen Sie dieses Feld weg und überlassen Sie OpenClaw die automatische Erkennung des ersten bereiten Web-Abruf-
  Providers anhand der konfigurierten Anmeldedaten
- Nicht in einer Sandbox ausgeführtes `web_fetch` kann installierte Plugin-Provider verwenden, die
  `contracts.webFetchProviders` deklarieren; Sandbox-Abrufe erlauben gebündelte Provider und
  verifizierte Installationen offizieller Plugins, schließen externe Drittanbieter-Plugins jedoch aus
- Das offizielle Firecrawl-Plugin ist derzeit der einzige gebündelte Mitwirkende zu `webFetchProviders`,
  konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw außerdem Folgendes abfragen:

- die Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- das standardmäßige Kimi-Websuchmodell (Standardwert: `kimi-k2.6`)

Konfigurieren Sie für `x_search` die Option `plugins.entries.xai.config.xSearch.*`. Sie verwendet dasselbe
xAI-Authentifizierungsprofil wie der Chat oder die von der Grok-Websuche verwendeten
`XAI_API_KEY`- bzw. Plugin-Websuch-Anmeldedaten.
Die ältere `tools.web.x_search.*`-Konfiguration wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie Grok während `openclaw onboard` oder `openclaw configure --section web` auswählen,
bietet OpenClaw unmittelbar nach Abschluss der Grok-Einrichtung außerdem die optionale Einrichtung von `x_search`
mit denselben Anmeldedaten an. Dies ist ein separater Folgeschritt innerhalb des Grok-
Pfads und keine separate Websuch-Provider-Auswahl auf oberster Ebene. Wenn Sie einen anderen
Provider auswählen, zeigt OpenClaw die `x_search`-Eingabeaufforderung nicht an.

### Speichern von API-Schlüsseln

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
| `country`             | Zweistelliger ISO-Ländercode (z. B. "US", "DE")                    |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de")                            |
| `search_lang`         | Suchsprachcode (nur Brave)                                         |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`                    |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)                          |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)                           |
| `ui_lang`             | Sprachcode der Benutzeroberfläche (nur Brave)                      |
| `domain_filter`       | Array mit Domain-Positivliste/-Negativliste (nur Perplexity)       |
| `max_tokens`          | Gesamtes Tokenbudget für Inhalte, nur native Perplexity Search API |
| `max_tokens_per_page` | Tokenlimit für die Extraktion pro Seite, nur native Perplexity Search API |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der `llm-context`-Modus von Brave
  lehnt `ui_lang` ab; `date_before` erfordert außerdem `date_after`, da benutzerdefinierte
  Aktualitätsbereiche von Brave sowohl ein Start- als auch ein Enddatum erfordern.
  Gemini, Grok und Kimi geben eine einzige synthetisierte Antwort mit Quellenangaben zurück. Sie
  akzeptieren `count` zur Kompatibilität mit gemeinsam genutzten Tools, der Parameter ändert jedoch nicht die
  Form der fundierten Antwort. Gemini behandelt die Aktualität von `day` als Aktualitätshinweis; weiter gefasste
  Aktualitätswerte und explizite Datumsangaben legen Zeitbereiche für die Fundierung mit Google Search fest.
  Perplexity verhält sich genauso, wenn Sie den Sonar/OpenRouter-
  Kompatibilitätspfad (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`) verwenden; dieser Pfad entfernt außerdem die Unterstützung für `max_tokens` und
  `max_tokens_per_page`.
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts in privaten Netzwerken oder Loopback-Hosts;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen `query` und `count` über `web_search`
  nur eingeschränkt – verwenden Sie deren dedizierte Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` durchsucht mit xAI Beiträge auf X (ehemals Twitter) und gibt
KI-synthetisierte Antworten mit Quellenangaben zurück. Es akzeptiert natürlichsprachliche Anfragen und
optionale strukturierte Filter. OpenClaw erstellt das integrierte xAI-Tool `x_search`
für jede Anfrage neu, statt es dauerhaft zu registrieren, sodass es nur
für den Durchlauf aktiv ist, der es tatsächlich aufruft.

<Warning>
  `x_search` wird auf den Servern von xAI ausgeführt. xAI berechnet 5 USD pro 1.000 Tool-Aufrufe zuzüglich der
  Eingabe- und Ausgabe-Token des Modells.
</Warning>

<Note>
  Laut xAI unterstützt `x_search` die Schlüsselwortsuche, semantische Suche, Benutzersuche
  und das Abrufen von Threads. Für Interaktionsstatistiken einzelner Beiträge wie Reposts,
  Antworten, Lesezeichen oder Aufrufe sollten Sie eine gezielte Suche nach der exakten Beitrags-URL
  oder Status-ID bevorzugen. Eine allgemeine Schlüsselwortsuche kann zwar den richtigen Beitrag finden, aber weniger
  vollständige Metadaten zum jeweiligen Beitrag zurückgeben. Ein gutes Vorgehen besteht darin, zuerst den Beitrag zu finden und anschließend
  eine zweite `x_search`-Anfrage auszuführen, die sich auf genau diesen Beitrag konzentriert.
</Note>

### x_search-Konfiguration

Wenn `enabled` weggelassen wird, wird `x_search` nur bereitgestellt, wenn der Provider des aktiven Modells
`xai` ist und xAI-Anmeldedaten aufgelöst werden können. Legen Sie für ein aktives Modell mit einem bekannten
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
            enabled: true, // erforderlich für einen bekannten Modell-Provider außer xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // optional, überschreibt webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional, wenn ein xAI-Authentifizierungsprofil oder XAI_API_KEY festgelegt ist
            baseUrl: "https://api.x.ai/v1", // optionale gemeinsame Basis-URL für xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` sendet an `<baseUrl>/responses`, wenn
`plugins.entries.xai.config.xSearch.baseUrl` festgelegt ist. Wenn dieses Feld ausgelassen wird,
wird ersatzweise `plugins.entries.xai.config.webSearch.baseUrl`, danach das
veraltete `tools.web.search.grok.baseUrl` und schließlich der öffentliche xAI-Endpunkt
(`https://api.x.ai/v1`) verwendet.

### x_search-Parameter

| Parameter                    | Beschreibung                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Suchanfrage (erforderlich)                             |
| `allowed_x_handles`          | Ergebnisse auf höchstens 20 X-Handles beschränken      |
| `excluded_x_handles`         | Höchstens 20 X-Handles ausschließen                    |
| `from_date`                  | Nur Beiträge ab diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Beiträge bis zu diesem Datum einschließen (YYYY-MM-DD) |
| `enable_image_understanding` | xAI die Untersuchung von Bildern erlauben, die an übereinstimmende Beiträge angehängt sind |
| `enable_video_understanding` | xAI die Untersuchung von Videos erlauben, die an übereinstimmende Beiträge angehängt sind |

`allowed_x_handles` und `excluded_x_handles` schließen sich gegenseitig aus.

### x_search-Beispiel

```javascript
await x_search({
  query: "Rezepte fürs Abendessen",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiken pro Beitrag: Verwenden Sie nach Möglichkeit die genaue Status-URL oder Status-ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw Plugin-SDK" });

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

// Domainfilterung (nur Perplexity)
await web_search({
  query: "Produktbewertungen",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Tool-Profile

Wenn Sie Tool-Profile oder Positivlisten verwenden, fügen Sie `web_search`, `x_search` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // oder: allow: ["group:web"]  (enthält web_search, x_search und web_fetch)
  },
}
```

## Verwandte Themen

- [Web Fetch](/de/tools/web-fetch) -- eine URL abrufen und lesbare Inhalte extrahieren
- [Web Browser](/de/tools/browser) -- vollständige Browserautomatisierung für JS-intensive Websites
- [Grok Search](/de/tools/grok-search) -- Grok als `web_search`-Provider
- [Ollama Web Search](/de/tools/ollama-search) -- schlüsselfreie Websuche über Ihren Ollama-Host
