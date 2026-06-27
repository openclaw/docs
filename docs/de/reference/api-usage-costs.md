---
read_when:
    - Sie möchten verstehen, welche Funktionen kostenpflichtige APIs aufrufen können
    - Sie müssen Schlüssel, Kosten und Nutzungstransparenz prüfen
    - Sie erklären die Kostenberichterstattung für /status oder /usage
summary: Überprüfen, was Geld ausgeben kann, welche Schlüssel verwendet werden und wie Sie die Nutzung anzeigen können
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-06-27T18:09:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Dieses Dokument listet **Funktionen auf, die API-Schlüssel aufrufen können**, und zeigt, wo deren Kosten erscheinen. Es konzentriert sich auf
OpenClaw-Funktionen, die Provider-Nutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten erscheinen (Chat + CLI)

**Kostensnapshot pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Tokens der letzten Antwort.
- Wenn OpenClaw Nutzungsmetadaten und lokale Preise für das aktive Modell hat,
  zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort. Dies kann
  ausdrücklich bepreiste Provider ohne API-Schlüssel einschließen, z. B. Bedrock-Modelle mit `aws-sdk`.
- Wenn Live-Sitzungsmetadaten spärlich sind, kann `/status` Token-/Cache-
  Zähler und die Bezeichnung des aktiven Laufzeitmodells aus dem neuesten Transcript-Nutzungseintrag
  wiederherstellen. Bestehende Live-Werte ungleich null haben weiterhin Vorrang, und
  promptgroße Transcript-Summen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten**,
  wenn lokale Preise für das aktive Modell konfiguriert sind und Nutzungsmetadaten
  verfügbar sind.
- `/usage tokens` zeigt nur Tokens an; OAuth-/Token- und CLI-Flows im Abo-Stil
  zeigen weiterhin nur Tokens an, sofern diese Runtime keine kompatiblen Nutzungsmetadaten liefert
  und kein ausdrücklicher lokaler Preis konfiguriert ist.
- Hinweis zu Gemini CLI: Die standardmäßige `stream-json`-Ausgabe und Legacy-JSON-Overrides
  lesen beide die Nutzung aus `stats`, normalisieren `stats.cached` zu `cacheRead` und
  leiten Eingabe-Tokens bei Bedarf aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Anthropic-Mitarbeitende haben uns mitgeteilt, dass Claude-CLI-Nutzung im OpenClaw-Stil
wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p`
für diese Integration als
genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Dollar-Schätzung pro Nachricht bereit, die OpenClaw
in `/usage full` anzeigen könnte.

**CLI-Nutzungsfenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster** der Provider
  (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Die menschenlesbare Ausgabe wird Provider-übergreifend auf `X% left` normalisiert.
- Aktuelle Provider für Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die Rohfelder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den
  Chatmodell-Eintrag, leitet die Fensterbezeichnung bei Bedarf aus Zeitstempeln ab und
  nimmt den Modellnamen in die Tarifbezeichnung auf.
- Die Nutzungs-Authentifizierung für diese Kontingentfenster stammt, wenn verfügbar,
  aus Provider-spezifischen Hooks; andernfalls fällt OpenClaw auf passende OAuth-/API-Schlüssel-
  Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.

Details und Beispiele finden Sie unter [Token-Nutzung und Kosten](/de/reference/token-use).

## Wie Schlüssel erkannt werden

OpenClaw kann Anmeldedaten aus folgenden Quellen übernehmen:

- **Auth-Profile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Prozess-Env des Skills exportieren können.

## Funktionen, die Schlüssel verbrauchen können

### 1) Kernmodellantworten (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf nutzt den **aktuellen Modell-Provider** (OpenAI, Anthropic usw.). Dies ist die
primäre Quelle für Nutzung und Kosten.

Dies umfasst auch gehostete Provider im Abo-Stil, die weiterhin außerhalb
der lokalen OpenClaw-UI abrechnen, z. B. **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
Anthropics OpenClaw-Claude-Anmeldepfad mit aktivierter **Extra Usage**.

Siehe [Modelle](/de/providers/models) für Preiskonfiguration und [Token-Nutzung und Kosten](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können vor dem Ausführen der Antwort zusammengefasst/transkribiert werden. Dies nutzt Modell-/Provider-APIs.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Medienverständnis](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsame Generierungsfunktionen können ebenfalls Provider-Schlüssel verbrauchen:

- Bildgenerierung: OpenAI / Google / DeepInfra / fal / MiniMax
- Videogenerierung: DeepInfra / Qwen

Die Bildgenerierung kann einen auth-gestützten Provider-Standard ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein ausdrückliches `agents.defaults.videoGenerationModel` wie
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Modelle](/de/concepts/models).

### 4) Memory-Embeddings + semantische Suche

Die semantische Memory-Suche nutzt **Embedding-APIs**, wenn sie für Remote-Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra-Embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio-Embeddings (lokal/selbst gehostet)
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; in der Regel keine Abrechnung über gehostete API)
- Optionaler Fallback auf einen Remote-Provider, wenn lokale Embeddings fehlschlagen

Mit `memorySearch.provider = "local"` können Sie lokal bleiben (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Websuche-Tool

`web_search` kann je nach Ihrem Provider Nutzungskosten verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: xAI-OAuth-Profil, `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: schlüsselfrei für einen erreichbaren, angemeldeten lokalen Ollama-Host; direkte Suche über `https://ollama.com` nutzt `OLLAMA_API_KEY`, und auth-geschützte Hosts können normale Bearer-Auth des Ollama-Providers wiederverwenden
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Provider bei ausdrücklicher Auswahl (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine Abrechnung über gehostete API)

Legacy-Provider-Pfade `tools.web.search.*` werden weiterhin über den temporären Kompatibilitäts-Shim geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Kostenloses Brave Search-Guthaben:** Jeder Brave-Tarif enthält \$5/Monat an erneuerbarem
kostenlosem Guthaben. Der Search-Tarif kostet \$5 pro 1.000 Anfragen, daher deckt das Guthaben
1.000 Anfragen/Monat kostenlos ab. Setzen Sie Ihr Nutzungslimit im Brave-Dashboard,
um unerwartete Kosten zu vermeiden.

Siehe [Webtools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** mit schlüssellosem Starter-Zugriff aufrufen. Fügen Sie einen API-Schlüssel
für höhere Limits hinzu:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, fällt das Tool auf direktes Fetch plus das gebündelte `web-readability`-Plugin zurück (keine kostenpflichtige API). Deaktivieren Sie `plugins.entries.web-readability.enabled`, um lokale Readability-Extraktion zu überspringen.

Siehe [Webtools](/de/tools/web).

### 6) Provider-Nutzungssnapshots (Status/Health)

Einige Statusbefehle rufen **Provider-Nutzungsendpunkte** auf, um Kontingentfenster oder Auth-Health anzuzeigen.
Dies sind typischerweise Aufrufe mit geringem Volumen, treffen aber dennoch Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Modelle-CLI](/de/cli/models).

### 7) Schutz-Zusammenfassung bei Compaction

Der Compaction-Schutz kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, was
Provider-APIs aufruft, wenn er ausgeführt wird.

Siehe [Sitzungsverwaltung + Compaction](/de/reference/session-management-compaction).

### 8) Modellscan / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und nutzt `OPENROUTER_API_KEY`, wenn
das Prüfen aktiviert ist.

Siehe [Modelle-CLI](/de/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann **ElevenLabs** aufrufen, wenn konfiguriert:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (Drittanbieter-APIs)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs nutzt, können gemäß dem Provider des Skills Kosten entstehen.

Siehe [Skills](/de/tools/skills).

## Verwandte Themen

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
