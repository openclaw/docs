---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten x_search aktivieren oder konfigurieren
    - Sie müssen einen Such-Provider auswählen
    - Sie möchten die automatische Erkennung und die Provider-Auswahl verstehen
sidebarTitle: Web Search
summary: web_search, x_search und web_fetch -- das Web durchsuchen, X-Beiträge durchsuchen oder Seiteninhalte abrufen
title: Websuche
x-i18n:
    generated_at: "2026-06-27T18:23:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Provider und
gibt Ergebnisse zurück. Ergebnisse werden pro Abfrage 15 Minuten lang gecacht
(konfigurierbar).

OpenClaw enthält außerdem `x_search` für X-Beiträge (früher Twitter) und
`web_fetch` zum einfachen Abrufen von URLs. In dieser Phase bleibt `web_fetch`
lokal, während `web_search` und `x_search` im Hintergrund xAI Responses
verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browserautomatisierung. Für
  JS-lastige Websites oder Anmeldungen verwenden Sie den [Webbrowser](/de/tools/browser). Zum
  Abrufen einer bestimmten URL verwenden Sie [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Choose a provider">
    Wählen Sie einen Provider aus und schließen Sie alle erforderlichen Einrichtungsschritte ab. Einige Provider sind
    ohne Schlüssel nutzbar, während andere API-Schlüssel verwenden. Details finden Sie auf den
    Provider-Seiten unten.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle benötigten Anmeldedaten gespeichert. Sie können auch eine Umgebungsvariable
    festlegen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt für API-gestützte
    Provider überspringen.
  </Step>
  <Step title="Use it">
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
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context` sowie Länder-/Sprachfilter. Kostenloser Tarif verfügbar.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/de/plugins/codex-harness">
    KI-synthetisierte, fundierte Antworten über Ihr Codex-App-Server-Konto.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Provider ohne Schlüssel. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale Suche und Schlagwortsuche mit Inhaltsextraktion (Highlights, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten zusammen mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Quellenangaben über Google Search Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Quellenangaben über xAI Web Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Quellenangaben über die Moonshot-Websuche; nicht fundierte Chat-Fallbacks schlagen ausdrücklich fehl.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API des MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Suche über einen angemeldeten lokalen Ollama-Host oder die gehostete Ollama-API.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/de/tools/parallel-search">
    Kostenpflichtige Parallel Search API (`PARALLEL_API_KEY`); höhere Ratenlimits und objektive Feinabstimmung.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/de/tools/parallel-search">
    Opt-in ohne Schlüssel. Parallels kostenloses Search MCP mit LLM-optimierten dichten Auszügen und ohne API-Schlüssel.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerelementen für Inhaltsextraktion und Domainfilterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbst gehostete Metasuche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und weitere.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` für URL-Extraktion.
  </Card>
</CardGroup>

### Provider-Vergleich

| Provider                                         | Ergebnisstil                                                  | Filter                                           | API-Schlüssel                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)                     | Strukturierte Snippets                                        | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                        |
| [Codex Hosted Search](/de/plugins/codex-harness)    | KI-synthetisiert + Quell-URLs                                 | Domains, Kontextgröße, Nutzerstandort           | Keiner; verwendet Codex/OpenAI-Anmeldung                                               |
| [DuckDuckGo](/de/tools/duckduckgo-search)           | Strukturierte Snippets                                        | --                                               | Keiner (ohne Schlüssel)                                                                |
| [Exa](/de/tools/exa-search)                         | Strukturiert + extrahiert                                     | Neuronaler/Schlagwortmodus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                      |
| [Firecrawl](/de/tools/firecrawl)                    | Strukturierte Snippets                                        | Über das Tool `firecrawl_search`                 | `FIRECRAWL_API_KEY`                                                                    |
| [Gemini](/de/tools/gemini-search)                   | KI-synthetisiert + Quellenangaben                             | --                                               | `GEMINI_API_KEY`                                                                       |
| [Grok](/de/tools/grok-search)                       | KI-synthetisiert + Quellenangaben                             | --                                               | xAI OAuth, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`            |
| [Kimi](/de/tools/kimi-search)                       | KI-synthetisiert + Quellenangaben; schlägt bei nicht fundierten Chat-Fallbacks fehl | --                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                    |
| [MiniMax Search](/de/tools/minimax-search)          | Strukturierte Snippets                                        | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`             |
| [Ollama Web Search](/de/tools/ollama-search)        | Strukturierte Snippets                                        | --                                               | Keiner für angemeldete lokale Hosts; `OLLAMA_API_KEY` für direkte Suche über `https://ollama.com` |
| [Parallel](/de/tools/parallel-search)               | Dichte Auszüge, für LLM-Kontext gerankt                       | --                                               | `PARALLEL_API_KEY` (kostenpflichtig)                                                   |
| [Parallel Search (Free)](/de/tools/parallel-search) | Dichte Auszüge, für LLM-Kontext gerankt                       | --                                               | Keiner (kostenloses Search MCP)                                                        |
| [Perplexity](/de/tools/perplexity-search)           | Strukturierte Snippets                                        | Land, Sprache, Zeit, Domains, Inhaltslimits      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                            |
| [SearXNG](/de/tools/searxng-search)                 | Strukturierte Snippets                                        | Kategorien, Sprache                              | Keiner (selbst gehostet)                                                               |
| [Tavily](/de/tools/tavily)                          | Strukturierte Snippets                                        | Über das Tool `tavily_search`                    | `TAVILY_API_KEY`                                                                       |

## Automatische Erkennung

## Native OpenAI-Websuche

Direkte OpenAI-Responses-Modelle verwenden automatisch das von OpenAI gehostete Tool `web_search`, wenn die OpenClaw-Websuche aktiviert ist und kein verwalteter Provider festgelegt wurde. Dies ist Provider-eigenes Verhalten im gebündelten OpenAI-Plugin und gilt nur für nativen OpenAI-API-Datenverkehr, nicht für OpenAI-kompatible Proxy-Basis-URLs oder Azure-Routen. Setzen Sie `tools.web.search.provider` auf einen anderen Provider wie `brave`, um das verwaltete Tool `web_search` für OpenAI-Modelle beizubehalten, oder setzen Sie `tools.web.search.enabled: false`, um sowohl die verwaltete Suche als auch die native OpenAI-Suche zu deaktivieren.

## Native Codex-Websuche

Die Codex-App-Server-Laufzeit verwendet automatisch das von Codex gehostete Tool `web_search`,
wenn die Websuche aktiviert ist und kein verwalteter Provider ausgewählt wurde. Native gehostete
Suche und das verwaltete dynamische Tool `web_search` von OpenClaw schließen sich gegenseitig aus,
sodass die verwaltete Suche native Domainbeschränkungen nicht umgehen kann. OpenClaw verwendet das
verwaltete Tool, wenn die gehostete Suche nicht verfügbar, ausdrücklich deaktiviert oder
durch einen ausgewählten verwalteten Provider ersetzt wurde. OpenClaw hält die eigenständige
Codex-Erweiterung `web.run` deaktiviert, weil produktiver App-Server-Datenverkehr ihren
nutzerdefinierten Namespace `web` ablehnt.

- Konfigurieren Sie die native Suche unter `tools.web.search.openaiCodex`
- Setzen Sie `tools.web.search.provider: "codex"`, um Codex Hosted Search als
  verwalteten `web_search`-Provider für jedes übergeordnete Modell bereitzustellen. Jeder Aufruf führt einen
  begrenzten kurzlebigen Codex-App-Server-Turn aus und schlägt fehl, wenn Codex kein
  gehostetes `webSearch`-Element ausgibt.
- `mode: "cached"` ist die Standardeinstellung, aber Codex löst sie für uneingeschränkte
  App-Server-Turns in Live-Zugriff auf externe Ressourcen auf; setzen Sie `"live"`, um
  Live-Zugriff ausdrücklich anzufordern
- Setzen Sie `tools.web.search.provider` auf einen verwalteten Provider wie `brave`, um
  stattdessen OpenClaws verwaltetes `web_search` zu verwenden
- Setzen Sie `tools.web.search.openaiCodex.enabled: false`, um die von Codex gehostete
  Suche abzuwählen; andere verwaltete Provider bleiben verfügbar
- Das Einschränken der nativen Codex-Tool-Oberfläche hält außerdem verwaltetes `web_search`
  verfügbar
- Wenn `allowedDomains` gesetzt ist, schlägt der automatische verwaltete Fallback geschlossen fehl, falls
  die gehostete Suche nicht verfügbar ist, sodass die native Zulassungsliste nicht umgangen werden kann
- Tool-deaktivierte reine LLM-Läufe deaktivieren sowohl native als auch verwaltete Suche
- `tools.web.search.enabled: false` deaktiviert sowohl verwaltete als auch native Suche

Persistente effektive Änderungen an der Codex-Suchrichtlinie starten einen neuen gebundenen Thread, damit
ein bereits geladener App-Server-Thread keinen veralteten Zugriff auf gehostete Suche behalten kann.
Vorübergehende Einschränkungen pro Turn verwenden einen temporären eingeschränkten Thread und behalten
die vorhandene Bindung für eine spätere Wiederaufnahme bei.

Direkter OpenAI-ChatGPT-Responses-Datenverkehr kann ebenfalls das von OpenAI gehostete
Tool `web_search` verwenden. Dieser separate Pfad bleibt per Opt-in über
`tools.web.search.openaiCodex.enabled: true` aktiviert und gilt nur für geeignete
`openai/*`-Modelle mit `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
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
den verwalteten `web_search`-Fallback über OpenClaws dynamischen Tool-Namespace verwenden.
Verwenden Sie einen expliziten verwalteten Provider, wenn Sie OpenClaws providerspezifische
Netzwerksteuerungen anstelle der von Codex gehosteten Suche benötigen.

Durch Auswahl von `provider: "codex"` wird das gebündelte `codex`-Plugin aktiviert und es werden die oben gezeigten
gleichen Einschränkungen für `tools.web.search.openaiCodex` verwendet. Authentifizieren Sie zuerst den
Codex-App-Server mit `openclaw models auth login --provider openai`.
Der übergeordnete Agent kann jedes Modell oder jede Runtime verwenden; nur der begrenzte Search-Worker
läuft über Codex.

## Netzwerksicherheit

Verwaltete HTTP-`web_search`-Provider-Aufrufe verwenden den geschützten Fetch-Pfad von OpenClaw. Für
vertrauenswürdige Provider-API-Hosts erlaubt OpenClaw Fake-IP-DNS-Antworten von Surge, Clash und sing-box
in `198.18.0.0/15` und `fc00::/7` nur für diesen Provider-Hostnamen.
Andere private Ziele, Loopback-Ziele, Link-Local-Ziele und Metadatenziele bleiben blockiert.
Codex Hosted Search ist die Ausnahme: Sein begrenzter Worker delegiert den Netzwerkzugriff
an das gehostete `web_search`-Tool des Codex-App-Servers.

Diese automatische Erlaubnis gilt nicht für beliebige `web_fetch`-URLs. Aktivieren Sie für
`web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` und
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` nur dann explizit, wenn Ihr
vertrauenswürdiger Proxy diese synthetischen Bereiche besitzt.

## Websuche einrichten

Provider-Listen in Dokumentation und Einrichtungsabläufen sind alphabetisch. Die automatische Erkennung behält eine
separate Prioritätsreihenfolge bei.

Wenn kein `provider` festgelegt ist, prüft OpenClaw Provider in dieser Reihenfolge und verwendet den
ersten, der bereit ist:

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

Danach konfigurierte Endpunkt-Provider:

11. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Provider ohne Schlüssel wie **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** und **Codex Hosted Search** sind nur verfügbar, wenn Sie
sie explizit mit `tools.web.search.provider` oder über
`openclaw configure --section web` auswählen. OpenClaw sendet verwaltete
`web_search`-Abfragen nicht nur deshalb an einen Provider ohne Schlüssel, weil kein API-gestützter Provider
konfiguriert ist.

OpenAI Responses-Modelle sind eine Ausnahme: Solange `tools.web.search.provider` nicht
gesetzt ist, verwenden sie die native Websuche von OpenAI statt der oben genannten verwalteten Provider.
Setzen Sie `tools.web.search.provider` auf `parallel-free` (oder einen anderen Provider),
um sie über den verwalteten Pfad zu leiten.

<Note>
  Alle Provider-Schlüsselfelder unterstützen SecretRef-Objekte. Plugin-bezogene SecretRefs
  unter `plugins.entries.<plugin>.config.webSearch.apiKey` werden für die
  installierten API-gestützten Websuche-Provider aufgelöst, einschließlich Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity und Tavily,
  unabhängig davon, ob der Provider explizit über `tools.web.search.provider` ausgewählt oder
  durch automatische Erkennung gewählt wird. Im Modus der automatischen Erkennung löst OpenClaw nur den
  ausgewählten Provider-Schlüssel auf -- nicht ausgewählte SecretRefs bleiben inaktiv, sodass Sie
  mehrere Provider konfiguriert halten können, ohne Auflösungskosten für die
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
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kann außerdem
`models.providers.google.apiKey` und `models.providers.google.baseUrl` als nachrangige
Fallbacks nach seiner dedizierten Websuche-Konfiguration und `GEMINI_API_KEY` wiederverwenden. Beispiele finden Sie auf den
Provider-Seiten.
Grok kann außerdem ein xAI-OAuth-Authentifizierungsprofil aus `openclaw models auth login
--provider xai --method oauth` wiederverwenden; API-Schlüssel-Konfiguration bleibt der Fallback.

`tools.web.search.provider` wird gegen die Websuche-Provider-IDs validiert,
die von gebündelten und installierten Plugin-Manifesten deklariert werden. Ein Tippfehler wie `"brvae"`
führt zu einem Fehler bei der Konfigurationsvalidierung, statt stillschweigend auf automatische Erkennung zurückzufallen. Wenn ein
konfigurierter Provider nur veraltete Plugin-Hinweise hat, etwa einen übrig gebliebenen
`plugins.entries.<plugin>`-Block nach der Deinstallation eines Drittanbieter-Plugins,
hält OpenClaw den Start robust und meldet eine Warnung, damit Sie das
Plugin neu installieren oder `openclaw doctor --fix` ausführen können, um die veraltete Konfiguration zu bereinigen.

Die Auswahl des Fallback-Providers für `web_fetch` ist separat:

- Wählen Sie ihn mit `tools.web.fetch.provider` aus
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw den ersten bereiten Web-Fetch-Provider
  aus konfigurierten Anmeldeinformationen automatisch erkennen
- nicht sandboxed `web_fetch` kann installierte Plugin-Provider verwenden, die
  `contracts.webFetchProviders` deklarieren; sandboxed Fetches erlauben gebündelte Provider und
  verifizierte offizielle Plugin-Installationen, schließen aber externe Drittanbieter-Plugins aus
- das offizielle Firecrawl-Plugin stellt Web-Fetch-Fallback bereit, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie während `openclaw onboard` oder
`openclaw configure --section web` **Kimi** auswählen, kann OpenClaw außerdem nach Folgendem fragen:

- der Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem Standardmodell für die Kimi-Websuche (Standard ist `kimi-k2.6`)

Konfigurieren Sie für `x_search` `plugins.entries.xai.config.xSearch.*`. Es verwendet dasselbe
xAI-Authentifizierungsprofil wie Chat oder den `XAI_API_KEY` / die Plugin-Websuche-
Anmeldeinformation, die von der Grok-Websuche verwendet wird.
Veraltete `tools.web.x_search.*`-Konfiguration wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie Grok während `openclaw onboard` oder `openclaw configure --section web` auswählen,
kann OpenClaw außerdem eine optionale `x_search`-Einrichtung mit derselben Anmeldeinformation anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate oberste
Websuche-Provider-Auswahl. Wenn Sie einen anderen Provider wählen, zeigt OpenClaw die
`x_search`-Eingabeaufforderung nicht an.

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
    Legen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Gateway fest:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Legen Sie sie für eine Gateway-Installation in `~/.openclaw/.env` ab.
    Siehe [Umgebungsvariablen](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                           |
| --------------------- | ------------------------------------------------------ |
| `query`               | Suchanfrage (erforderlich)                             |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)         |
| `country`             | 2-Buchstaben-ISO-Ländercode (z. B. "US", "DE")        |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de")              |
| `search_lang`         | Suchsprachcode (nur Brave)                             |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`         |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)              |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)               |
| `ui_lang`             | UI-Sprachcode (nur Brave)                              |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (nur Perplexity)      |
| `max_tokens`          | Gesamtbudget für Inhalt, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity)  |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Brave-Modus `llm-context`
  lehnt `ui_lang` ab; `date_before` benötigt außerdem `date_after`, weil benutzerdefinierte
  Freshness-Bereiche von Brave sowohl Start- als auch Enddaten erfordern.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Zitaten zurück. Sie
  akzeptieren `count` für die Kompatibilität mit gemeinsamen Tools, aber es ändert die
  Form der fundierten Antwort nicht. Gemini behandelt `day`-Freshness als Aktualitätshinweis; breitere
  Freshness-Werte und explizite Daten legen Zeitbereiche für Google Search Grounding fest.
  Perplexity verhält sich genauso, wenn Sie den Sonar/OpenRouter-
  Kompatibilitätspfad verwenden (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`).
  SearXNG akzeptiert `http://` nur für vertrauenswürdige private Netzwerk- oder Loopback-Hosts;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search` nur `query` und `count`
  -- verwenden Sie ihre dedizierten Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` fragt X-Beiträge (ehemals Twitter) mit xAI ab und gibt
KI-synthetisierte Antworten mit Zitaten zurück. Es akzeptiert natürlichsprachliche Abfragen und
optionale strukturierte Filter. OpenClaw aktiviert das integrierte xAI-`x_search`-
Tool nur für die Anfrage, die diesen Tool-Aufruf bedient.

<Note>
  xAI dokumentiert `x_search` mit Unterstützung für Stichwortsuche, semantische Suche, Benutzersuche
  und Thread-Abruf. Für Engagement-Statistiken pro Beitrag wie Reposts,
  Antworten, Bookmarks oder Aufrufe empfiehlt sich eine gezielte Suche nach der exakten Beitrags-URL
  oder Status-ID. Breite Stichwortsuchen können den richtigen Beitrag finden, geben aber weniger
  vollständige Metadaten pro Beitrag zurück. Ein gutes Muster ist: zuerst den Beitrag finden, dann
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` sendet an `<baseUrl>/responses`, wenn
`plugins.entries.xai.config.xSearch.baseUrl` gesetzt ist. Wenn dieses Feld ausgelassen wird,
fällt es auf `plugins.entries.xai.config.webSearch.baseUrl`, dann auf die
veraltete `tools.web.search.grok.baseUrl` und schließlich auf den öffentlichen xAI-Endpunkt zurück.

### x_search-Parameter

| Parameter                    | Beschreibung                                                  |
| ---------------------------- | ------------------------------------------------------------- |
| `query`                      | Suchanfrage (erforderlich)                                    |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken                |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                              |
| `from_date`                  | Nur Beiträge an oder nach diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Beiträge an oder vor diesem Datum einschließen (YYYY-MM-DD) |
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

Wenn Sie Tool-Profile oder Allowlisten verwenden, fügen Sie `web_search`, `x_search` oder `group:web` hinzu:

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
- [Grok Search](/de/tools/grok-search) -- Grok als `web_search`-Provider
- [Ollama Web Search](/de/tools/ollama-search) -- Websuche ohne Schlüssel über Ihren Ollama-Host
