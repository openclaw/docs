---
read_when:
    - Sie entscheiden, ob ein Plugin im zentralen npm-Paket enthalten ist oder separat installiert wird
    - Sie aktualisieren Paketmetadaten gebündelter Plugins oder die Release-Automatisierung
    - Sie benötigen die kanonische Liste interner und externer Plugins
summary: Generiertes Verzeichnis der OpenClaw-Plugins, die im Kern ausgeliefert, extern veröffentlicht oder ausschließlich als Quellcode vorgehalten werden
title: Plugin-Inventar
x-i18n:
    generated_at: "2026-07-24T03:59:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin-Inventar

Diese Seite wird aus `extensions/*/package.json`, `openclaw.plugin.json`
und den Ausschlüssen des npm-Stammpakets `files` generiert. Generieren Sie sie neu mit:

```bash
pnpm plugins:inventory:gen
```

## Definitionen

- **npm-Kernpaket:** in das npm-Paket `openclaw` integriert und ohne separate Plugin-Installation verfügbar.
- **Offizielles externes Paket:** von OpenClaw gepflegtes Plugin, das nicht im npm-Kernpaket enthalten ist, in diesem offiziellen Inventar geführt und bei Bedarf über ClawHub und/oder npm installiert wird.
- **Nur Quellcode-Checkout:** Repository-lokales Plugin, das nicht in veröffentlichten npm-Artefakten enthalten ist und nicht als installierbares Paket angeboten wird.

Quellcode-Checkouts unterscheiden sich von npm-Installationen: Nach `pnpm install` werden gebündelte
Plugins aus `extensions/<id>` geladen, sodass lokale Änderungen und paketlokale Workspace-
Abhängigkeiten verfügbar sind.

## Plugin installieren

Entnehmen Sie dem Installationsweg jedes Eintrags, ob eine Installation erforderlich ist. Plugins
mit dem Hinweis `included in OpenClaw` sind bereits im Kernpaket enthalten.
Offizielle externe Pakete müssen einmal installiert werden; anschließend ist ein Neustart des Gateways erforderlich.

Discord ist beispielsweise ein offizielles externes Paket:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Während der Umstellung zum Start werden gewöhnliche reine Paketspezifikationen weiterhin aus npm installiert.
Verwenden Sie `clawhub:@openclaw/discord` oder `npm:@openclaw/discord`, wenn Sie eine
explizite Quelle benötigen. Folgen Sie nach der Installation der Einrichtungsdokumentation des Plugins, beispielsweise
[Discord](/de/channels/discord), um Anmeldedaten und die Kanalkonfiguration hinzuzufügen. Unter
[Plugins verwalten](/de/plugins/manage-plugins) finden Sie Befehle zum Aktualisieren, Deinstallieren und
Veröffentlichen.

Jeder Eintrag enthält das Paket, den Distributionsweg und eine Beschreibung.

## npm-Kernpaket

70 Plugins

- **[admin-http-rpc](/de/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) – in OpenClaw enthalten. HTTP-RPC-Endpunkt für die OpenClaw-Administration.

- **[alibaba](/de/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Videogenerierung hinzu.

- **[anthropic](/de/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) – in OpenClaw enthalten. Anthropic-Modelle, Claude CLI und nativer Claude-Sitzungskatalog.

- **[azure-speech](/de/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) – in OpenClaw enthalten. Text-zu-Sprache mit Azure AI Speech (MP3, native Ogg/Opus-Sprachnachrichten, PCM-Telefonie).

- **[bonjour](/de/plugins/reference/bonjour)** (`@openclaw/bonjour`) – in OpenClaw enthalten. Macht das lokale OpenClaw-Gateway über Bonjour/mDNS bekannt.

- **[browser](/de/plugins/reference/browser)** (`@openclaw/browser-plugin`) – in OpenClaw enthalten. Fügt durch Agenten aufrufbare Werkzeuge hinzu.

- **[byteplus](/de/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider BytePlus und BytePlus Plan hinzu.

- **[canvas](/de/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) – in OpenClaw enthalten. Experimentelle Canvas-Steuerungs- und A2UI-Rendering-Oberflächen für gekoppelte Nodes.

- **[clawrouter](/de/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider ClawRouter hinzu.

- **[cohere](/de/plugins/reference/cohere)** (`@openclaw/cohere-provider`) – in OpenClaw enthalten; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw-Provider-Plugin für Cohere.

- **[comfy](/de/plugins/reference/comfy)** (`@openclaw/comfy-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider ComfyUI hinzu.

- **[copilot-proxy](/de/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Copilot Proxy hinzu.

- **[crabbox](/de/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) – in OpenClaw enthalten. Cloud-Worker-Provider auf Grundlage der Crabbox CLI.

- **[cua-computer](/de/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) – in OpenClaw enthalten. Experimentelle Computersteuerung mit cua-driver für Windows- und Linux-Node-Hosts.

- **[deepgram](/de/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Medienanalyse hinzu. Fügt Unterstützung für einen Provider zur Echtzeittranskription hinzu.

- **[document-extract](/de/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) – in OpenClaw enthalten. Extrahiert Text und ersatzweise Seitenbilder aus lokalen Dokumentanhängen.

- **[duckduckgo](/de/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Websuche hinzu.

- **[elevenlabs](/de/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Medienanalyse hinzu. Fügt Unterstützung für einen Provider zur Echtzeittranskription hinzu. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[fal](/de/plugins/reference/fal)** (`@openclaw/fal-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider fal hinzu.

- **[file-transfer](/de/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) – in OpenClaw enthalten. Ruft Dateien auf gekoppelten Nodes über dedizierte Node-Befehle ab, listet sie auf und schreibt sie. Umgeht die Kürzung der bash-Standardausgabe, indem für Binärdateien bis zu 16 MB base64 über node.invoke verwendet wird.

- **[github-copilot](/de/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider GitHub Copilot hinzu.

- **[google](/de/plugins/reference/google)** (`@openclaw/google-plugin`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Google, Google Gemini CLI und Google Vertex hinzu.

- **[huggingface](/de/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Hugging Face hinzu.

- **[imessage](/de/plugins/reference/imessage)** (`@openclaw/imessage`) – in OpenClaw enthalten. Fügt die iMessage-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[linux-canvas](/de/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) – in OpenClaw enthalten. Canvas-Rendering-Bridge für die OpenClaw-Linux-Desktop-App.

- **[linux-node](/de/plugins/reference/linux-node)** (`@openclaw/linux-node`) – in OpenClaw enthalten. Desktop-Benachrichtigungen, Kameraaufnahme und Standort für Linux-Node-Hosts.

- **[litellm](/de/plugins/reference/litellm)** (`@openclaw/litellm-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider LiteLLM hinzu.

- **[llm-task](/de/plugins/reference/llm-task)** (`@openclaw/llm-task`) – in OpenClaw enthalten. Generisches reines JSON-LLM-Werkzeug für strukturierte Aufgaben, das aus Workflows aufgerufen werden kann.

- **[lmstudio](/de/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider LM Studio hinzu.

- **[logbook](/de/plugins/reference/logbook)** (`@openclaw/logbook`) – in OpenClaw enthalten. Automatisches Arbeitsjournal: Erfasst regelmäßig Bildschirmaufnahmen von einem gekoppelten Node und wandelt sie in eine überprüfbare Zeitleiste Ihres Tages um.

- **[memory-core](/de/plugins/reference/memory-core)** (`@openclaw/memory-core`) – in OpenClaw enthalten. Fügt durch Agenten aufrufbare Werkzeuge hinzu.

- **[memory-wiki](/de/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) – in OpenClaw enthalten. Persistenter Wiki-Compiler und Obsidian-kompatibler Wissensspeicher für OpenClaw.

- **[meta](/de/plugins/reference/meta)** (`@openclaw/meta-provider`) – in OpenClaw enthalten; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Meta hinzu.

- **[microsoft](/de/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) – in OpenClaw enthalten. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[microsoft-foundry](/de/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Microsoft Foundry hinzu.

- **[migrate-claude](/de/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) – in OpenClaw enthalten. Importiert Anweisungen, MCP-Server, Skills und sichere Konfigurationen aus Claude Code und Claude Desktop in OpenClaw.

- **[migrate-hermes](/de/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) – in OpenClaw enthalten. Importiert Hermes-Konfiguration, Erinnerungen, Skills und unterstützte Anmeldedaten in OpenClaw.

- **[minimax](/de/plugins/reference/minimax)** (`@openclaw/minimax-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider MiniMax und MiniMax Portal hinzu.

- **[mistral](/de/plugins/reference/mistral)** (`@openclaw/mistral-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Mistral hinzu.

- **[novita](/de/plugins/reference/novita)** (`@openclaw/novita-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Novita, Novita AI und Novitaai hinzu.

- **[nvidia](/de/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider NVIDIA hinzu.

- **[oc-path](/de/plugins/reference/oc-path)** (`@openclaw/oc-path`) – in OpenClaw enthalten. Fügt die openclaw-path-CLI für die Adressierung von Workspace-Dateien über oc:// hinzu.

- **[ollama](/de/plugins/reference/ollama)** (`@openclaw/ollama-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Ollama und Ollama Cloud hinzu.

- **[onepassword](/de/plugins/reference/onepassword)** (`@openclaw/onepassword`) – in OpenClaw enthalten. Kuratierter Broker für 1Password-Geheimnisse mit Genehmigungsrichtlinie und SQLite-Prüfverlauf.

- **[open-prose](/de/plugins/reference/open-prose)** (`@openclaw/open-prose`) – in OpenClaw enthalten. OpenProse-VM-Skill-Paket mit dem Slash-Befehl /prose.

- **[openai](/de/plugins/reference/openai)** (`@openclaw/openai-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider OpenAI hinzu.

- **[opencode](/de/plugins/reference/opencode)** (`@openclaw/opencode-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider OpenCode hinzu.

- **[opencode-go](/de/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider OpenCode Go hinzu.

- **[openrouter](/de/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider OpenRouter hinzu.

- **[policy](/de/plugins/reference/policy)** (`@openclaw/policy`) – in OpenClaw enthalten. Fügt richtliniengestützte Doctor-Prüfungen für die Workspace-Konformität hinzu.

- **[reef](/de/plugins/reference/reef)** (`@openclaw/reef`) – in OpenClaw enthalten. Geschützter, Ende-zu-Ende-verschlüsselter Claw-Kanal.

- **[runway](/de/plugins/reference/runway)** (`@openclaw/runway-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Videogenerierung hinzu.

- **[senseaudio](/de/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Medienanalyse hinzu.

- **[sglang](/de/plugins/reference/sglang)** (`@openclaw/sglang-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider SGLang hinzu.

- **[synthetic](/de/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Synthetic hinzu.

- **[teams-meetings](/de/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) – in OpenClaw enthalten. Ermöglicht die Teilnahme an Microsoft Teams-Besprechungen als Gast über den Chrome-Browser.

- **[telegram](/de/plugins/reference/telegram)** (`@openclaw/telegram`) – in OpenClaw enthalten. Fügt die Telegram-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[together](/de/plugins/reference/together)** (`@openclaw/together-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Together hinzu.

- **[tts-local-cli](/de/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) – in OpenClaw enthalten. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[vault](/de/plugins/reference/vault)** (`@openclaw/vault`) - in OpenClaw enthalten. Integration des HashiCorp-Vault-SecretRef-Providers.

- **[vllm](/de/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den vLLM-Modell-Provider hinzu.

- **[volcengine](/de/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Volcengine und Volcengine Plan hinzu.

- **[voyage](/de/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - in OpenClaw enthalten. Fügt Unterstützung für Provider von Speicher-Embeddings hinzu.

- **[vydra](/de/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Vydra-Modell-Provider hinzu.

- **[web-readability](/de/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - in OpenClaw enthalten. Extrahiert lesbare Artikelinhalte aus Antworten lokaler HTML-Webabrufe.

- **[webhooks](/de/plugins/reference/webhooks)** (`@openclaw/webhooks`) - in OpenClaw enthalten. Authentifizierte eingehende Webhooks, die externe Automatisierungen mit OpenClaw-TaskFlows verbinden.

- **[workboard](/de/plugins/reference/workboard)** (`@openclaw/workboard`) - in OpenClaw enthalten. Dashboard-Arbeitsübersicht für agenteneigene Issues und Sitzungen.

- **[xai](/de/plugins/reference/xai)** (`@openclaw/xai-plugin`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den xAI-Modell-Provider hinzu.

- **[xiaomi](/de/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Xiaomi und Xiaomi Token Plan hinzu.

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - in OpenClaw enthalten. Ermöglicht die Teilnahme an Zoom-Meetings als Gast über den Chrome-Browser.

## Offizielle externe Pakete

72 Plugins

- **[acpx](/de/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. OpenClaw-ACP-Runtime-Backend mit Plugin-eigener Sitzungs- und Transportverwaltung.

- **[amazon-bedrock](/de/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. OpenClaw-Provider-Plugin für Amazon Bedrock mit Modellerkennung sowie Unterstützung für Embeddings und Guardrails.

- **[amazon-bedrock-mantle](/de/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenClaw-Provider-Plugin für Amazon Bedrock Mantle zum OpenAI-kompatiblen Modell-Routing.

- **[anthropic-vertex](/de/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. OpenClaw-Provider-Plugin für Anthropic Vertex zur Verwendung von Claude-Modellen auf Google Vertex AI.

- **[arcee](/de/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Fügt OpenClaw Unterstützung für den Arcee-Modell-Provider hinzu.

- **[baseten](/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`. OpenClaw-Provider-Plugin für Baseten.

- **[brave](/de/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. OpenClaw-Provider-Plugin für Brave Search zur Websuche.

- **[cerebras](/de/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Fügt OpenClaw Unterstützung für den Cerebras-Modell-Provider hinzu.

- **[chutes](/de/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Fügt OpenClaw Unterstützung für den Chutes-Modell-Provider hinzu.

- **[clickclack](/de/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Fügt die Clickclack-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[cloudflare-ai-gateway](/de/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Cloudflare AI Gateway hinzu.

- **[codex](/de/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Harness für den Codex-App-Server und nativer Sitzungskatalog.

- **[copilot](/de/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registriert die GitHub-Copilot-Agenten-Runtime.

- **[deepinfra](/de/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Fügt OpenClaw Unterstützung für den DeepInfra-Modell-Provider hinzu.

- **[deepseek](/de/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Fügt OpenClaw Unterstützung für den DeepSeek-Modell-Provider hinzu.

- **[diagnostics-otel](/de/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. OpenTelemetry-Exporter für die OpenClaw-Diagnose von Metriken, Traces und Protokollen.

- **[diagnostics-prometheus](/de/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Prometheus-Exporter für die OpenClaw-Diagnose von Runtime-Metriken.

- **[diffs](/de/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Schreibgeschütztes OpenClaw-Plugin zur Diff-Anzeige und zum Rendern von Dateien für Agenten.

- **[diffs-language-pack](/de/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Fügt Syntaxhervorhebung für Sprachen außerhalb des Standardsatzes der Diff-Anzeige hinzu.

- **[discord](/de/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Discord-Kanäle, Direktnachrichten, Befehle und App-Ereignisse.

- **[exa](/de/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Fügt Unterstützung für Websuch-Provider hinzu.

- **[featherless](/de/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. OpenClaw-Provider-Plugin für Featherless AI.

- **[feishu](/de/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Feishu/Lark-Chats und Arbeitsplatzwerkzeuge (von der Community unter Federführung von @m1heng gepflegt).

- **[firecrawl](/de/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Fügt von Agenten aufrufbare Werkzeuge hinzu. Fügt Unterstützung für Webabruf-Provider hinzu. Fügt Unterstützung für Websuch-Provider hinzu.

- **[fireworks](/de/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Fügt OpenClaw Unterstützung für den Fireworks-Modell-Provider hinzu.

- **[gmi](/de/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw-Provider-Plugin für GMI Cloud.

- **[google-meet](/de/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. OpenClaw-Teilnehmer-Plugin für Google Meet zur Teilnahme an Anrufen über Chrome- oder Twilio-Transporte.

- **[googlechat](/de/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Google-Chat-Bereiche und Direktnachrichten.

- **[gradium](/de/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Fügt Unterstützung für Text-zu-Sprache-Provider hinzu.

- **[groq](/de/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Fügt OpenClaw Unterstützung für den Groq-Modell-Provider hinzu.

- **[inworld](/de/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld-Streaming für Text-zu-Sprache (MP3, OGG_OPUS, PCM-Telefonie).

- **[irc](/de/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Fügt die IRC-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[kilocode](/de/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Fügt OpenClaw Unterstützung für den Kilocode-Modell-Provider hinzu.

- **[kimi](/de/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Kimi und Kimi Coding hinzu.

- **[line](/de/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Chats über die LINE Bot API.

- **[llama-cpp](/de/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokale GGUF-Textinferenz und Embeddings über node-llama-cpp.

- **[lobster](/de/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Lobster-Workflow-Werkzeug-Plugin für typisierte Pipelines und fortsetzbare Genehmigungen.

- **[longcat](/de/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. OpenClaw-Provider-Plugin für LongCat.

- **[matrix](/de/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. OpenClaw-Kanal-Plugin für Matrix-Räume und Direktnachrichten.

- **[mattermost](/de/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Fügt die Mattermost-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[memory-lancedb](/de/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. LanceDB-basiertes OpenClaw-Plugin für Langzeitgedächtnis mit automatischem Abruf, automatischer Erfassung und Vektorsuche.

- **[moonshot](/de/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Fügt OpenClaw Unterstützung für den Moonshot-Modell-Provider hinzu.

- **[msteams](/de/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Bot-Unterhaltungen in Microsoft Teams.

- **[mxc](/de/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub. Betriebssystemseitig isolierte Werkzeugausführung über MXC: Führt Befehle in einem Windows ProcessContainer mit konfigurierten MXC-Richtliniendateien aus.

- **[nextcloud-talk](/de/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Unterhaltungen über Nextcloud Talk.

- **[nostr](/de/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. OpenClaw-Kanal-Plugin für NIP-04-verschlüsselte Nostr-Direktnachrichten.

- **[openshell](/de/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. OpenClaw-Sandbox-Backend für die NVIDIA OpenShell CLI mit gespiegelten lokalen Arbeitsbereichen und Befehlsausführung über SSH.

- **[parallel](/de/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Fügt Unterstützung für Websuch-Provider hinzu.

- **[perplexity](/de/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Fügt Unterstützung für Websuch-Provider hinzu.

- **[pixverse](/de/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw-Provider-Plugin für die Videogenerierung mit PixVerse.

- **[qianfan](/de/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Fügt OpenClaw Unterstützung für den Qianfan-Modell-Provider hinzu.

- **[qqbot](/de/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Gruppen- und Direktnachrichten-Workflows mit QQ Bot.

- **[qwen](/de/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan und Bailian Token Plan hinzu.

- **[raft](/de/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. OpenClaw-Kanal-Plugin für sichere CLI-Aktivierungsbrücken mit Raft.

- **[searxng](/de/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Fügt Unterstützung für Websuch-Provider hinzu.

- **[signal](/de/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Fügt die Signal-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[slack](/de/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Slack-Kanäle, Direktnachrichten, Befehle und App-Ereignisse.

- **[sms](/de/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Twilio-SMS-Kanal-Plugin für OpenClaw-Textnachrichten.

- **[stepfun](/de/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider StepFun und StepFun Plan hinzu.

- **[synology-chat](/de/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Synology-Chat-Kanal-Plugin für OpenClaw-Kanäle und Direktnachrichten.

- **[tavily](/de/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Fügt durch Agenten aufrufbare Tools hinzu. Fügt Unterstützung für Websuch-Provider hinzu.

- **[tencent](/de/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Tencent TokenHub und Tencent Tokenplan hinzu.

- **[tlon](/de/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. OpenClaw-Kanal-Plugin für Tlon/Urbit-Chat-Workflows.

- **[tokenjuice](/de/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Komprimiert Ergebnisse der exec- und bash-Tools mit Tokenjuice-Reduzierern.

- **[twitch](/de/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. OpenClaw-Twitch-Kanal-Plugin für Chat- und Moderations-Workflows.

- **[venice](/de/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Venice hinzu.

- **[vercel-ai-gateway](/de/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Vercel AI Gateway hinzu.

- **[voice-call](/de/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. OpenClaw-Sprachanruf-Plugin für Telefonanrufe über Twilio, Telnyx und Plivo.

- **[whatsapp](/de/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. OpenClaw-WhatsApp-Kanal-Plugin für Chats über WhatsApp Web.

- **[zai](/de/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Z.AI hinzu.

- **[zalo](/de/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. OpenClaw-Zalo-Kanal-Plugin für Bot- und Webhook-Chats.

- **[zalouser](/de/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. OpenClaw-Plugin für persönliche Zalo-Konten über die native zca-js-Integration.

## Nur im Quellcode-Checkout

2 Plugins

- **[qa-channel](/de/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - nur im Quellcode-Checkout. Fügt die QA-Channel-Oberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[qa-lab](/de/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - nur im Quellcode-Checkout. OpenClaw-QA-Lab-Plugin mit privater Debugger-Benutzeroberfläche und Szenario-Runner.
