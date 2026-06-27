---
read_when:
    - Sie entscheiden, ob ein Plugin im Core-npm-Paket ausgeliefert oder separat installiert wird
    - Sie aktualisieren gebündelte Plugin-Paketmetadaten oder Release-Automatisierung
    - Sie benötigen die kanonische Liste interner und externer Plugins
summary: Generiertes Inventar der OpenClaw-Plugins, die im Kern ausgeliefert, extern veröffentlicht oder nur als Quellcode bereitgehalten werden
title: Plugin-Inventar
x-i18n:
    generated_at: "2026-06-27T17:51:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin-Inventar

Diese Seite wird aus `extensions/*/package.json`, `openclaw.plugin.json`
und den Ausschlüssen unter `files` im npm-Root-Paket generiert. Generieren Sie sie neu mit:

```bash
pnpm plugins:inventory:gen
```

## Definitionen

- **Core-npm-Paket:** im npm-Paket `openclaw` integriert und ohne separate Plugin-Installation verfügbar.
- **Offizielles externes Paket:** von OpenClaw gepflegtes Plugin, das aus dem Core-npm-Paket ausgelassen wird, in diesem offiziellen Inventar geführt wird und bei Bedarf über ClawHub und/oder npm installiert wird.
- **Nur Source-Checkout:** repo-lokales Plugin, das aus veröffentlichten npm-Artefakten ausgelassen und nicht als installierbares Paket beworben wird.

Source-Checkouts unterscheiden sich von npm-Installationen: Nach `pnpm install` werden gebündelte
Plugins aus `extensions/<id>` geladen, sodass lokale Änderungen und package-lokale Workspace-
Abhängigkeiten verfügbar sind.

## Plugin installieren

Verwenden Sie die Installationsroute in jedem Eintrag, um zu entscheiden, ob eine Installation erforderlich ist. Plugins,
bei denen `included in OpenClaw` steht, sind bereits im Core-Paket vorhanden.
Offizielle externe Pakete benötigen eine Installation und danach einen Gateway-Neustart.

Discord ist zum Beispiel ein offizielles externes Paket:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Während der Launch-Umstellung werden gewöhnliche nackte Paket-Spezifikationen weiterhin von npm installiert.
Verwenden Sie `clawhub:@openclaw/discord` oder `npm:@openclaw/discord`, wenn Sie eine
explizite Quelle benötigen. Folgen Sie nach der Installation der Setup-Dokumentation des Plugins, z. B.
[Discord](/de/channels/discord), um Anmeldedaten und Channel-Konfiguration hinzuzufügen. Siehe
[Plugins verwalten](/de/plugins/manage-plugins) für Befehle zum Aktualisieren, Deinstallieren und Veröffentlichen.

Jeder Eintrag listet Paket, Distributionsroute und Beschreibung auf.

## Core-npm-Paket

59 Plugins

- **[admin-http-rpc](/de/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - in OpenClaw enthalten. OpenClaw-Admin-HTTP-RPC-Endpunkt.

- **[alibaba](/de/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Videogenerierung hinzu.

- **[anthropic](/de/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Anthropic-Modell-Provider hinzu.

- **[azure-speech](/de/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - in OpenClaw enthalten. Azure AI Speech Text-to-Speech (MP3, native Ogg/Opus-Sprachnachrichten, PCM-Telefonie).

- **[bonjour](/de/plugins/reference/bonjour)** (`@openclaw/bonjour`) - in OpenClaw enthalten. Kündigt das lokale OpenClaw-Gateway über Bonjour/mDNS an.

- **[browser](/de/plugins/reference/browser)** (`@openclaw/browser-plugin`) - in OpenClaw enthalten. Fügt vom Agent aufrufbare Tools hinzu.

- **[byteplus](/de/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider BytePlus und BytePlus Plan hinzu.

- **[canvas](/de/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - in OpenClaw enthalten. Experimentelle Canvas-Steuerung und A2UI-Rendering-Oberflächen für gekoppelte Nodes.

- **[codex-supervisor](/de/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - in OpenClaw enthalten. Überwacht Codex-App-Server-Sitzungen aus OpenClaw.

- **[cohere](/de/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - in OpenClaw enthalten; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw-Cohere-Provider-Plugin.

- **[comfy](/de/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den ComfyUI-Modell-Provider hinzu.

- **[copilot-proxy](/de/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Copilot-Proxy-Modell-Provider hinzu.

- **[deepgram](/de/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Medienverständnis hinzu. Fügt Provider-Unterstützung für Echtzeit-Transkription hinzu.

- **[document-extract](/de/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - in OpenClaw enthalten. Extrahiert Text und Fallback-Seitenbilder aus lokalen Dokumentanhängen.

- **[duckduckgo](/de/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Websuche hinzu.

- **[elevenlabs](/de/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Medienverständnis hinzu. Fügt Provider-Unterstützung für Echtzeit-Transkription hinzu. Fügt Text-to-Speech-Provider-Unterstützung hinzu.

- **[fal](/de/plugins/reference/fal)** (`@openclaw/fal-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den fal-Modell-Provider hinzu.

- **[file-transfer](/de/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - in OpenClaw enthalten. Ruft Dateien auf gekoppelten Nodes über dedizierte Node-Befehle ab, listet sie auf und schreibt sie. Umgeht die Kürzung der Bash-Standardausgabe, indem für Binärdateien bis 16 MB base64 über node.invoke verwendet wird.

- **[github-copilot](/de/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den GitHub Copilot-Modell-Provider hinzu.

- **[google](/de/plugins/reference/google)** (`@openclaw/google-plugin`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Google, Google Gemini CLI und Google Vertex hinzu.

- **[huggingface](/de/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Hugging Face-Modell-Provider hinzu.

- **[imessage](/de/plugins/reference/imessage)** (`@openclaw/imessage`) - in OpenClaw enthalten. Fügt die iMessage-Channel-Oberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[litellm](/de/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den LiteLLM-Modell-Provider hinzu.

- **[llm-task](/de/plugins/reference/llm-task)** (`@openclaw/llm-task`) - in OpenClaw enthalten. Generisches JSON-only-LLM-Tool für strukturierte Aufgaben, das aus Workflows aufgerufen werden kann.

- **[lmstudio](/de/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den LM Studio-Modell-Provider hinzu.

- **[memory-core](/de/plugins/reference/memory-core)** (`@openclaw/memory-core`) - in OpenClaw enthalten. Fügt vom Agent aufrufbare Tools hinzu.

- **[memory-wiki](/de/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - in OpenClaw enthalten. Persistenter Wiki-Compiler und Obsidian-freundlicher Wissensspeicher für OpenClaw.

- **[microsoft](/de/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - in OpenClaw enthalten. Fügt Text-to-Speech-Provider-Unterstützung hinzu.

- **[microsoft-foundry](/de/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Microsoft Foundry-Modell-Provider hinzu.

- **[migrate-claude](/de/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - in OpenClaw enthalten. Importiert Claude Code- und Claude Desktop-Anweisungen, MCP-Server, Skills und sichere Konfiguration in OpenClaw.

- **[migrate-hermes](/de/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - in OpenClaw enthalten. Importiert Hermes-Konfiguration, Erinnerungen, Skills und unterstützte Anmeldedaten in OpenClaw.

- **[minimax](/de/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider MiniMax und MiniMax Portal hinzu.

- **[mistral](/de/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Mistral-Modell-Provider hinzu.

- **[novita](/de/plugins/reference/novita)** (`@openclaw/novita-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Novita, Novita AI und Novitaai hinzu.

- **[nvidia](/de/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den NVIDIA-Modell-Provider hinzu.

- **[oc-path](/de/plugins/reference/oc-path)** (`@openclaw/oc-path`) - in OpenClaw enthalten. Fügt die openclaw path CLI für die Adressierung von Workspace-Dateien mit oc:// hinzu.

- **[ollama](/de/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Ollama und Ollama Cloud hinzu.

- **[open-prose](/de/plugins/reference/open-prose)** (`@openclaw/open-prose`) - in OpenClaw enthalten. OpenProse-VM-Skill-Pack mit einem /prose-Slash-Befehl.

- **[openai](/de/plugins/reference/openai)** (`@openclaw/openai-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenAI-Modell-Provider hinzu.

- **[opencode](/de/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenCode-Modell-Provider hinzu.

- **[opencode-go](/de/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenCode Go-Modell-Provider hinzu.

- **[openrouter](/de/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenRouter-Modell-Provider hinzu.

- **[policy](/de/plugins/reference/policy)** (`@openclaw/policy`) - in OpenClaw enthalten. Fügt richtliniengestützte Doctor-Prüfungen für Workspace-Konformität hinzu.

- **[runway](/de/plugins/reference/runway)** (`@openclaw/runway-provider`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Videogenerierung hinzu.

- **[senseaudio](/de/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Medienverständnis hinzu.

- **[sglang](/de/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den SGLang-Modell-Provider hinzu.

- **[synthetic](/de/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Synthetic-Modell-Provider hinzu.

- **[telegram](/de/plugins/reference/telegram)** (`@openclaw/telegram`) - in OpenClaw enthalten. Fügt die Telegram-Channel-Oberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[together](/de/plugins/reference/together)** (`@openclaw/together-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Together-Modell-Provider hinzu.

- **[tts-local-cli](/de/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - in OpenClaw enthalten. Fügt Text-to-Speech-Provider-Unterstützung hinzu.

- **[vllm](/de/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den vLLM-Modell-Provider hinzu.

- **[volcengine](/de/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Volcengine und Volcengine Plan hinzu.

- **[voyage](/de/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - in OpenClaw enthalten. Fügt Provider-Unterstützung für Memory-Embeddings hinzu.

- **[vydra](/de/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Vydra-Modell-Provider hinzu.

- **[web-readability](/de/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - in OpenClaw enthalten. Extrahiert lesbare Artikelinhalte aus lokalen HTML-Web-Fetch-Antworten.

- **[webhooks](/de/plugins/reference/webhooks)** (`@openclaw/webhooks`) - in OpenClaw enthalten. Authentifizierte eingehende Webhooks, die externe Automatisierung an OpenClaw TaskFlows binden.

- **[workboard](/de/plugins/reference/workboard)** (`@openclaw/workboard`) - in OpenClaw enthalten. Dashboard-Workboard für agenteneigene Issues und Sitzungen.

- **[xai](/de/plugins/reference/xai)** (`@openclaw/xai-plugin`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den xAI-Modell-Provider hinzu.

- **[xiaomi](/de/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Xiaomi und Xiaomi Token Plan hinzu.

## Offizielle externe Pakete

68 Plugins

- **[acpx](/de/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. OpenClaw ACP-Runtime-Backend mit Plugin-eigener Sitzungs- und Transportverwaltung.

- **[amazon-bedrock](/de/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. OpenClaw-Amazon-Bedrock-Provider-Plugin mit Modellerkennung, Embeddings und Guardrail-Unterstützung.

- **[amazon-bedrock-mantle](/de/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock Mantle Provider-Plugin für OpenAI-kompatibles Modell-Routing.

- **[anthropic-vertex](/de/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. OpenClaw Anthropic Vertex Provider-Plugin für Claude-Modelle auf Google Vertex AI.

- **[arcee](/de/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Fügt OpenClaw Unterstützung für den Arcee-Modell-Provider hinzu.

- **[brave](/de/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. OpenClaw Brave Search Provider-Plugin für die Websuche.

- **[cerebras](/de/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Fügt OpenClaw Unterstützung für den Cerebras-Modell-Provider hinzu.

- **[chutes](/de/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Fügt OpenClaw Unterstützung für den Chutes-Modell-Provider hinzu.

- **[clickclack](/de/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Fügt die Clickclack-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[cloudflare-ai-gateway](/de/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Cloudflare AI Gateway-Modell-Provider hinzu.

- **[codex](/de/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. OpenClaw Codex-App-Server-Harness und Modell-Provider-Plugin mit einem von Codex verwalteten GPT-Katalog.

- **[copilot](/de/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registriert die GitHub Copilot-Agent-Runtime.

- **[deepinfra](/de/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Fügt OpenClaw Unterstützung für den DeepInfra-Modell-Provider hinzu.

- **[deepseek](/de/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Fügt OpenClaw Unterstützung für den DeepSeek-Modell-Provider hinzu.

- **[diagnostics-otel](/de/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. OpenClaw-Diagnose-OpenTelemetry-Exporter für Metriken, Traces und Logs.

- **[diagnostics-prometheus](/de/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. OpenClaw-Diagnose-Prometheus-Exporter für Runtime-Metriken.

- **[diffs](/de/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. OpenClaw-Plugin für schreibgeschützte Diff-Anzeige und Datei-Renderer für Agenten.

- **[diffs-language-pack](/de/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Fügt Syntaxhervorhebung für Sprachen außerhalb des Standardumfangs des Diffs-Viewers hinzu.

- **[discord](/de/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. OpenClaw Discord-Kanal-Plugin für Kanäle, DMs, Befehle und App-Ereignisse.

- **[exa](/de/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Fügt Unterstützung für Websuche-Provider hinzu.

- **[feishu](/de/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. OpenClaw Feishu/Lark-Kanal-Plugin für Chats und Arbeitsplatz-Tools (von der Community gepflegt durch @m1heng).

- **[firecrawl](/de/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Fügt von Agenten aufrufbare Tools hinzu. Fügt Unterstützung für Webabruf-Provider hinzu. Fügt Unterstützung für Websuche-Provider hinzu.

- **[fireworks](/de/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Fügt OpenClaw Unterstützung für den Fireworks-Modell-Provider hinzu.

- **[gmi](/de/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud Provider-Plugin.

- **[google-meet](/de/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. OpenClaw Google Meet-Teilnehmer-Plugin zum Beitreten zu Anrufen über Chrome- oder Twilio-Transporte.

- **[googlechat](/de/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. OpenClaw Google Chat-Kanal-Plugin für Spaces und Direktnachrichten.

- **[gradium](/de/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Fügt Unterstützung für Text-to-Speech-Provider hinzu.

- **[groq](/de/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Fügt OpenClaw Unterstützung für den Groq-Modell-Provider hinzu.

- **[inworld](/de/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld-Streaming-Text-to-Speech (MP3, OGG_OPUS, PCM-Telefonie).

- **[irc](/de/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Fügt die IRC-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[kilocode](/de/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Fügt OpenClaw Unterstützung für den Kilocode-Modell-Provider hinzu.

- **[kimi](/de/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Fügt OpenClaw Unterstützung für Kimi- und Kimi-Coding-Modell-Provider hinzu.

- **[line](/de/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. OpenClaw LINE-Kanal-Plugin für LINE Bot API-Chats.

- **[llama-cpp](/de/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokale GGUF-Embeddings über node-llama-cpp.

- **[lobster](/de/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Lobster-Workflow-Tool-Plugin für typisierte Pipelines und fortsetzbare Genehmigungen.

- **[matrix](/de/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. OpenClaw Matrix-Kanal-Plugin für Räume und Direktnachrichten.

- **[mattermost](/de/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Fügt die Mattermost-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[memory-lancedb](/de/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. OpenClaw Langzeitgedächtnis-Plugin auf Basis von LanceDB mit automatischem Abruf, automatischer Erfassung und Vektorsuche.

- **[moonshot](/de/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Fügt OpenClaw Unterstützung für den Moonshot-Modell-Provider hinzu.

- **[msteams](/de/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. OpenClaw Microsoft Teams-Kanal-Plugin für Bot-Unterhaltungen.

- **[nextcloud-talk](/de/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. OpenClaw Nextcloud Talk-Kanal-Plugin für Unterhaltungen.

- **[nostr](/de/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. OpenClaw Nostr-Kanal-Plugin für NIP-04-verschlüsselte Direktnachrichten.

- **[openshell](/de/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. OpenClaw-Sandbox-Backend für die NVIDIA OpenShell CLI mit gespiegelten lokalen Arbeitsbereichen und SSH-Befehlsausführung.

- **[parallel](/de/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Fügt Unterstützung für Websuche-Provider hinzu.

- **[perplexity](/de/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Fügt Unterstützung für Websuche-Provider hinzu.

- **[pixverse](/de/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse Provider-Plugin für Videogenerierung.

- **[qianfan](/de/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Fügt OpenClaw Unterstützung für den Qianfan-Modell-Provider hinzu.

- **[qqbot](/de/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. OpenClaw QQ Bot-Kanal-Plugin für Gruppen- und Direktnachrichten-Workflows.

- **[qwen](/de/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Fügt OpenClaw Unterstützung für Qwen-, Qwen Cloud-, Model Studio-, DashScope-, Qwen Oauth-, Qwen Portal- und Qwen CLI-Modell-Provider hinzu.

- **[raft](/de/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. OpenClaw Raft-Kanal-Plugin für sichere CLI-Wake-Bridges.

- **[searxng](/de/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Fügt Unterstützung für Websuche-Provider hinzu.

- **[signal](/de/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Fügt die Signal-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[slack](/de/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. OpenClaw Slack-Kanal-Plugin für Kanäle, DMs, Befehle und App-Ereignisse.

- **[sms](/de/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Twilio SMS-Kanal-Plugin für OpenClaw-Textnachrichten.

- **[stepfun](/de/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Fügt OpenClaw Unterstützung für StepFun- und StepFun-Plan-Modell-Provider hinzu.

- **[synology-chat](/de/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Synology Chat-Kanal-Plugin für OpenClaw-Kanäle und Direktnachrichten.

- **[tavily](/de/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Fügt von Agenten aufrufbare Tools hinzu. Fügt Unterstützung für Websuche-Provider hinzu.

- **[tencent](/de/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Fügt OpenClaw Unterstützung für den Tencent TokenHub-Modell-Provider hinzu.

- **[tlon](/de/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. OpenClaw Tlon/Urbit-Kanal-Plugin für Chat-Workflows.

- **[tokenjuice](/de/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Komprimiert Ergebnisse von exec- und bash-Tools mit tokenjuice-Reduzierern.

- **[twitch](/de/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. OpenClaw Twitch-Kanal-Plugin für Chat- und Moderations-Workflows.

- **[venice](/de/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Fügt OpenClaw Unterstützung für den Venice-Modell-Provider hinzu.

- **[vercel-ai-gateway](/de/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Vercel AI Gateway-Modell-Provider hinzu.

- **[voice-call](/de/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. OpenClaw voice-call-Plugin für Telefonanrufe über Twilio, Telnyx und Plivo.

- **[whatsapp](/de/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. OpenClaw WhatsApp-Kanal-Plugin für WhatsApp Web-Chats.

- **[zai](/de/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Fügt OpenClaw Unterstützung für den Z.AI-Modell-Provider hinzu.

- **[zalo](/de/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. OpenClaw Zalo-Kanal-Plugin für Bot- und Webhook-Chats.

- **[zalouser](/de/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. OpenClaw Zalo Personal Account-Plugin über native zca-js-Integration.

## Nur Source-Checkout

3 Plugins

- **[qa-channel](/de/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - nur Source-Checkout. Fügt die QA Channel-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[qa-lab](/de/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - nur Source-Checkout. OpenClaw QA-Lab-Plugin mit privater Debugger-UI und Szenario-Runner.

- **[qa-matrix](/de/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - nur Source-Checkout. Matrix-QA-Transport-Runner und Substrat.
