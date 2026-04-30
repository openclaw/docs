---
read_when:
    - Sie möchten verstehen, welche Funktionen kostenpflichtige APIs aufrufen können
    - Sie müssen Schlüssel, Kosten und Nutzungstransparenz prüfen
    - Sie erklären die Kostenberichterstattung von /status oder /usage
summary: Prüfen Sie, was Geld ausgeben kann, welche Schlüssel verwendet werden und wie Sie die Nutzung anzeigen
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-30T07:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# API-Nutzung & Kosten

Dieses Dokument listet **Funktionen auf, die API-Schlüssel verwenden können**, und zeigt, wo ihre Kosten sichtbar werden. Es konzentriert sich auf
OpenClaw-Funktionen, die Provider-Nutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten sichtbar werden (Chat + CLI)

**Kostensnapshot pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Tokens der letzten Antwort.
- Wenn das Modell **API-Schlüssel-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort.
- Wenn Live-Sitzungsmetadaten spärlich sind, kann `/status` Token-/Cache-
  Zähler und die aktive Runtime-Modellbezeichnung aus dem neuesten Transkript-Nutzungseintrag
  wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und promptgroße
  Transkript-Gesamtsummen können gewinnen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten** (nur API-Schlüssel).
- `/usage tokens` zeigt nur Tokens; OAuth-/Token- und CLI-Abläufe im Abonnementstil blenden Dollarkosten aus.
- Hinweis zur Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet Eingabe-Tokens
  bei Bedarf aus `stats.input_tokens - stats.cached` ab.

Anthropic-Hinweis: Mitarbeitende von Anthropic haben uns mitgeteilt, dass Claude CLI-Nutzung im OpenClaw-Stil
wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p`
für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Dollarschätzung pro Nachricht bereit, die OpenClaw
in `/usage full` anzeigen kann.

**CLI-Nutzungsfenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster** von Providern
  (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Die menschenlesbare Ausgabe wird Provider-übergreifend auf `X% left` normalisiert.
- Aktuelle Provider für Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- MiniMax-Hinweis: Die rohen Felder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den
  Chatmodell-Eintrag, leitet die Fensterbezeichnung bei Bedarf aus Zeitstempeln ab und
  nimmt den Modellnamen in die Planbezeichnung auf.
- Die Nutzungsauthentifizierung für diese Kontingentfenster stammt aus Provider-spezifischen Hooks, wenn
  verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-
  Zugangsdaten aus Authentifizierungsprofilen, Env oder Konfiguration zurück.

Details und Beispiele finden Sie unter [Token-Nutzung & Kosten](/de/reference/token-use).

## Wie Schlüssel gefunden werden

OpenClaw kann Zugangsdaten aus folgenden Quellen übernehmen:

- **Authentifizierungsprofile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Env des Skill-Prozesses exportieren können.

## Funktionen, die Schlüssel verbrauchen können

### 1) Kernmodellantworten (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Modell-Provider** (OpenAI, Anthropic usw.). Dies ist die
primäre Quelle für Nutzung und Kosten.

Dies umfasst auch gehostete Provider im Abonnementstil, die weiterhin außerhalb
der lokalen UI von OpenClaw abrechnen, etwa **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
Anthropics OpenClaw-Claude-Anmeldepfad mit aktiviertem **Extra Usage**.

Siehe [Modelle](/de/providers/models) für die Preiskonfiguration und [Token-Nutzung & Kosten](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können zusammengefasst/transkribiert werden, bevor die Antwort ausgeführt wird. Dies verwendet Modell-/Provider-APIs.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Medienverständnis](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsame Generierungsfunktionen können ebenfalls Provider-Schlüssel verbrauchen:

- Bildgenerierung: OpenAI / Google / DeepInfra / fal / MiniMax
- Videogenerierung: DeepInfra / Qwen

Die Bildgenerierung kann einen authentifizierungsbasierten Standard-Provider ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein explizites `agents.defaults.videoGenerationModel` wie
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Modelle](/de/concepts/models).

### 4) Memory-Embeddings + semantische Suche

Die semantische Memory-Suche verwendet **Embedding-APIs**, wenn sie für Remote-Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra-Embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio-Embeddings (lokal/selbst gehostet)
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; normalerweise keine Abrechnung über gehostete API)
- Optionaler Fallback auf einen Remote-Provider, wenn lokale Embeddings fehlschlagen

Sie können es mit `memorySearch.provider = "local"` lokal halten (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Websuch-Tool

`web_search` kann abhängig von Ihrem Provider Nutzungsgebühren verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: schlüsselfrei für einen erreichbaren, angemeldeten lokalen Ollama-Host; direkte Suche über `https://ollama.com` verwendet `OLLAMA_API_KEY`, und authentifizierungsgeschützte Hosts können normale Ollama-Provider-Bearer-Authentifizierung wiederverwenden
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Fallback (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine Abrechnung über gehostete API)

Legacy-Provider-Pfade `tools.web.search.*` werden weiterhin über den temporären Kompatibilitäts-Shim geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Kostenloses Guthaben für Brave Search:** Jeder Brave-Plan enthält \$5/Monat an sich erneuerndem
kostenlosem Guthaben. Der Search-Plan kostet \$5 pro 1.000 Anfragen, sodass das Guthaben
1.000 Anfragen/Monat kostenlos abdeckt. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest,
um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Schlüssel vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, fällt das Tool auf direkten Fetch plus das gebündelte `web-readability`-Plugin zurück (keine kostenpflichtige API). Deaktivieren Sie `plugins.entries.web-readability.enabled`, um die lokale Readability-Extraktion zu überspringen.

Siehe [Web-Tools](/de/tools/web).

### 6) Provider-Nutzungssnapshots (Status/Health)

Einige Statusbefehle rufen **Provider-Nutzungsendpunkte** auf, um Kontingentfenster oder Authentifizierungsstatus anzuzeigen.
Dies sind normalerweise Aufrufe mit geringem Volumen, sie treffen aber dennoch Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Modelle-CLI](/de/cli/models).

### 7) Compaction-Schutz-Zusammenfassung

Der Compaction-Schutz kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, was
beim Ausführen Provider-APIs aufruft.

Siehe [Sitzungsverwaltung + Compaction](/de/reference/session-management-compaction).

### 8) Modellscan / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet `OPENROUTER_API_KEY`, wenn
Prüfen aktiviert ist.

Siehe [Modelle-CLI](/de/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann **ElevenLabs** aufrufen, wenn konfiguriert:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (Drittanbieter-APIs)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, können gemäß dem Provider des Skills Kosten entstehen.

Siehe [Skills](/de/tools/skills).

## Verwandt

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
