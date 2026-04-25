---
read_when:
    - Sie möchten verstehen, welche Funktionen kostenpflichtige APIs aufrufen können
    - Sie müssen Schlüssel, Kosten und die Sichtbarkeit der Nutzung prüfen
    - Sie erklären die Kostenberichterstattung von /status oder /usage
summary: Prüfen, was Kosten verursachen kann, welche Schlüssel verwendet werden und wie sich die Nutzung anzeigen lässt
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-25T13:55:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API-Nutzung und Kosten

Dieses Dokument listet **Funktionen auf, die API-Schlüssel verwenden können**, und wo ihre Kosten angezeigt werden. Es konzentriert sich auf
OpenClaw-Funktionen, die Anbieternutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten angezeigt werden (Chat + CLI)

**Kostenübersicht pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Token der letzten Antwort.
- Wenn das Modell **API-Schlüssel-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort an.
- Wenn Live-Sitzungsmetadaten lückenhaft sind, kann `/status` Token-/Cache-
  Zähler und die Kennzeichnung des aktiven Laufzeitmodells aus dem neuesten Nutzungs-
  Eintrag im Transkript wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und promptgroße
  Transkript-Gesamtwerte können gewinnen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten** (nur bei API-Schlüsseln).
- `/usage tokens` zeigt nur Token an; abonnementartige OAuth-/Token- und CLI-Abläufe blenden Dollar-Kosten aus.
- Hinweis zu Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet Eingabe-Token
  bei Bedarf aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung im Stil von OpenClaw Claude CLI
wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p`
für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Schätzung in Dollar pro Nachricht bereit, die OpenClaw
in `/usage full` anzeigen könnte.

**CLI-Nutzungsfenster (Anbieter-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster**
  des Anbieters an (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Die für Menschen lesbare Ausgabe wird anbieterübergreifend zu `X% left` normalisiert.
- Aktuelle Anbieter mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die rohen Felder `usage_percent` / `usagePercent` bedeuten dort
  verbleibendes Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Anbieter `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des
  Chat-Modells, leitet bei Bedarf die Kennzeichnung des Fensters aus Zeitstempeln ab und
  schließt den Modellnamen in die Planbezeichnung ein.
- Die Nutzungsauthentifizierung für diese Kontingentfenster kommt aus anbieterspezifischen Hooks, wenn verfügbar;
  andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-
  Anmeldedaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.

Siehe [Token-Nutzung und Kosten](/de/reference/token-use) für Details und Beispiele.

## Wie Schlüssel erkannt werden

OpenClaw kann Anmeldedaten aus folgenden Quellen beziehen:

- **Auth-Profile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel an die Prozessumgebung des Skills exportieren können.

## Funktionen, die Schlüssel verwenden können

### 1) Antworten des Kernmodells (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Modellanbieter** (OpenAI, Anthropic usw.). Dies ist die
primäre Quelle für Nutzung und Kosten.

Dazu gehören auch gehostete Anbieter im Abonnementstil, die weiterhin außerhalb
der lokalen OpenClaw-Benutzeroberfläche abrechnen, etwa **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
Anthropics OpenClaw-Claude-Login-Pfad mit aktiviertem **Extra Usage**.

Siehe [Modelle](/de/providers/models) für die Preiskonfiguration und [Token-Nutzung und Kosten](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können vor der Antwort zusammengefasst/transkribiert werden. Dies verwendet APIs von Modellen/Anbietern.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Medienverständnis](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsame Generierungsfunktionen können ebenfalls Anbieterschlüssel verwenden:

- Bildgenerierung: OpenAI / Google / fal / MiniMax
- Videogenerierung: Qwen

Die Bildgenerierung kann einen Auth-gestützten Standardanbieter ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein explizites `agents.defaults.videoGenerationModel` wie
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Modelle](/de/concepts/models).

### 4) Memory-Einbettungen + semantische Suche

Die semantische Memory-Suche verwendet **Embedding-APIs**, wenn sie für entfernte Anbieter konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio-Embeddings (lokal/selbst gehostet)
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; in der Regel ohne Abrechnung über gehostete APIs)
- Optionaler Fallback auf einen entfernten Anbieter, wenn lokale Embeddings fehlschlagen

Sie können lokal bleiben mit `memorySearch.provider = "local"` (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Websuchtool

`web_search` kann je nach Anbieter Nutzungskosten verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: standardmäßig ohne Schlüssel, erfordert aber einen erreichbaren Ollama-Host plus `ollama signin`; kann auch die normale Bearer-Authentifizierung des Ollama-Anbieters wiederverwenden, wenn der Host sie verlangt
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Fallback (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine Abrechnung über gehostete APIs)

Veraltete Anbieterpfade unter `tools.web.search.*` werden weiterhin über den temporären Kompatibilitäts-Shim geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Brave Search Gratisguthaben:** Jeder Brave-Tarif enthält 5 $/Monat an erneuerbarem
Gratisguthaben. Der Search-Tarif kostet 5 $ pro 1.000 Anfragen, sodass das Guthaben
1.000 Anfragen/Monat ohne Kosten abdeckt. Setzen Sie Ihr Nutzungslimit im Brave-Dashboard,
um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Schlüssel vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, greift das Tool auf direktes Fetch plus das gebündelte Plugin `web-readability` zurück (keine kostenpflichtige API). Deaktivieren Sie `plugins.entries.web-readability.enabled`, um die lokale Readability-Extraktion zu überspringen.

Siehe [Web-Tools](/de/tools/web).

### 6) Anbieter-Nutzungs-Snapshots (Status/Health)

Einige Statusbefehle rufen **Nutzungsendpunkte von Anbietern** auf, um Kontingentfenster oder den Auth-Status anzuzeigen.
Dies sind in der Regel Aufrufe mit geringem Volumen, sie treffen aber dennoch Anbieter-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Models CLI](/de/cli/models).

### 7) Zusammenfassung als Schutzmaßnahme bei Compaction

Die Schutzmaßnahme bei Compaction kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, was
bei Ausführung Anbieter-APIs aufruft.

Siehe [Sitzungsverwaltung + Compaction](/de/reference/session-management-compaction).

### 8) Modellsuche / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet `OPENROUTER_API_KEY`, wenn
die Prüfung aktiviert ist.

Siehe [Models CLI](/de/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann bei entsprechender Konfiguration **ElevenLabs** aufrufen:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (APIs von Drittanbietern)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, kann er entsprechend dem Anbieter des Skills Kosten verursachen.

Siehe [Skills](/de/tools/skills).

## Verwandt

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Prompt-Caching](/de/reference/prompt-caching)
- [Nutzungsverfolgung](/de/concepts/usage-tracking)
