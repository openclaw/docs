---
read_when:
    - Sie entscheiden, ob ein Plugin im npm-Kernpaket enthalten ist oder separat installiert wird
    - Sie aktualisieren Paketmetadaten gebündelter Plugins oder die Release-Automatisierung
    - Sie benötigen die kanonische Liste interner und externer Plugins
summary: Generiertes Inventar der OpenClaw-Plugins, die im Kern ausgeliefert, extern veröffentlicht oder nur als Quellcode vorgehalten werden
title: Plugin-Inventar
x-i18n:
    generated_at: "2026-07-12T15:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin-Inventar

Diese Seite wird aus `extensions/*/package.json`, `openclaw.plugin.json`
und den `files`-Ausschlüssen des npm-Root-Pakets generiert. Generieren Sie sie neu mit:

```bash
pnpm plugins:inventory:gen
```

## Definitionen

- **npm-Kernpaket:** In das npm-Paket `openclaw` integriert und ohne separate Plugin-Installation verfügbar.
- **Offizielles externes Paket:** Von OpenClaw gepflegtes Plugin, das nicht im npm-Kernpaket enthalten ist, in diesem offiziellen Inventar geführt und bei Bedarf über ClawHub und/oder npm installiert wird.
- **Nur im Quellcode-Checkout:** Repository-lokales Plugin, das nicht in veröffentlichten npm-Artefakten enthalten ist und nicht als installierbares Paket angeboten wird.

Quellcode-Checkouts unterscheiden sich von npm-Installationen: Nach `pnpm install` werden gebündelte
Plugins aus `extensions/<id>` geladen, sodass lokale Änderungen und paketlokale Workspace-
Abhängigkeiten verfügbar sind.

## Plugin installieren

Entscheiden Sie anhand des Installationswegs im jeweiligen Eintrag, ob eine Installation erforderlich ist. Plugins,
bei denen `included in OpenClaw` angegeben ist, sind bereits im Kernpaket enthalten.
Offizielle externe Pakete müssen einmal installiert werden; anschließend ist ein Neustart des Gateways erforderlich.

Discord ist beispielsweise ein offizielles externes Paket:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Während der Umstellung beim Start werden gewöhnliche reine Paketspezifikationen weiterhin von npm installiert.
Verwenden Sie `clawhub:@openclaw/discord` oder `npm:@openclaw/discord`, wenn Sie eine
explizite Quelle benötigen. Folgen Sie nach der Installation der Einrichtungsdokumentation des Plugins, beispielsweise
[Discord](/de/channels/discord), um Anmeldedaten und die Kanalkonfiguration hinzuzufügen. Unter
[Plugins verwalten](/de/plugins/manage-plugins) finden Sie Befehle zum Aktualisieren, Deinstallieren und Veröffentlichen.

Jeder Eintrag enthält das Paket, den Verteilungsweg und eine Beschreibung.

## npm-Kernpaket

64 Plugins

- **[admin-http-rpc](/de/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) – in OpenClaw enthalten. OpenClaw-Admin-HTTP-RPC-Endpunkt.

- **[alibaba](/de/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Videogenerierung hinzu.

- **[anthropic](/de/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) – in OpenClaw enthalten. Anthropic-Modelle, Claude CLI und nativer Katalog für Claude-Sitzungen.

- **[azure-speech](/de/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) – in OpenClaw enthalten. Text-zu-Sprache mit Azure AI Speech (MP3, native Ogg/Opus-Sprachnachrichten, PCM-Telefonie).

- **[bonjour](/de/plugins/reference/bonjour)** (`@openclaw/bonjour`) – in OpenClaw enthalten. Macht das lokale OpenClaw-Gateway über Bonjour/mDNS bekannt.

- **[browser](/de/plugins/reference/browser)** (`@openclaw/browser-plugin`) - in OpenClaw enthalten. Fügt vom Agenten aufrufbare Tools hinzu.

- **[byteplus](/de/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider BytePlus und BytePlus Plan hinzu.

- **[canvas](/de/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - in OpenClaw enthalten. Experimentelle Canvas-Steuerung und A2UI-Rendering-Oberflächen für gekoppelte Nodes.

- **[clawrouter](/de/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider ClawRouter hinzu.

- **[cohere](/de/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - in OpenClaw enthalten; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw-Provider-Plugin für Cohere.

- **[comfy](/de/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider ComfyUI hinzu.

- **[copilot-proxy](/de/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Copilot Proxy hinzu.

- **[crabbox](/de/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - in OpenClaw enthalten. Cloud-Worker-Provider auf Basis der Crabbox CLI.

- **[deepgram](/de/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Medienanalyse hinzu. Fügt Unterstützung für einen Provider zur Echtzeittranskription hinzu.

- **[document-extract](/de/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - in OpenClaw enthalten. Extrahiert Text und ersatzweise Seitenbilder aus lokalen Dokumentanhängen.

- **[duckduckgo](/de/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - in OpenClaw enthalten. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[elevenlabs](/de/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Medienanalyse hinzu. Fügt Unterstützung für einen Provider zur Echtzeittranskription hinzu. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[fal](/de/plugins/reference/fal)** (`@openclaw/fal-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider fal hinzu.

- **[file-transfer](/de/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - in OpenClaw enthalten. Ruft Dateien auf gekoppelten Nodes über dedizierte Node-Befehle ab, listet sie auf und schreibt sie. Umgeht die Kürzung der bash-Standardausgabe, indem für Binärdateien bis zu 16 MB base64 über node.invoke verwendet wird.

- **[github-copilot](/de/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider GitHub Copilot hinzu.

- **[google](/de/plugins/reference/google)** (`@openclaw/google-plugin`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Google, Google Gemini CLI und Google Vertex hinzu.

- **[huggingface](/de/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Hugging Face hinzu.

- **[imessage](/de/plugins/reference/imessage)** (`@openclaw/imessage`) - in OpenClaw enthalten. Fügt die iMessage-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[litellm](/de/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider LiteLLM hinzu.

- **[llm-task](/de/plugins/reference/llm-task)** (`@openclaw/llm-task`) – in OpenClaw enthalten. Generisches, ausschließlich JSON verwendendes LLM-Tool für strukturierte Aufgaben, das aus Workflows aufgerufen werden kann.

- **[lmstudio](/de/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider LM Studio hinzu.

- **[logbook](/de/plugins/reference/logbook)** (`@openclaw/logbook`) – in OpenClaw enthalten. Automatisches Arbeitsjournal: Erfasst regelmäßig Bildschirmaufnahmen von einer gekoppelten Node und wandelt sie in eine überprüfbare Zeitleiste Ihres Tages um.

- **[memory-core](/de/plugins/reference/memory-core)** (`@openclaw/memory-core`) – in OpenClaw enthalten. Fügt Tools hinzu, die von Agenten aufgerufen werden können.

- **[memory-wiki](/de/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) – in OpenClaw enthalten. Persistenter Wiki-Compiler und Obsidian-kompatibler Wissensspeicher für OpenClaw.

- **[meta](/plugins/reference/meta)** (`@openclaw/meta-provider`) – in OpenClaw enthalten; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Meta hinzu.

- **[microsoft](/de/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) – in OpenClaw enthalten. Fügt Unterstützung für einen Text-to-Speech-Provider hinzu.

- **[microsoft-foundry](/de/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Microsoft Foundry hinzu.

- **[migrate-claude](/de/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) – in OpenClaw enthalten. Importiert Anweisungen, MCP-Server, Skills und sichere Konfigurationen aus Claude Code und Claude Desktop in OpenClaw.

- **[migrate-hermes](/de/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - in OpenClaw enthalten. Importiert Hermes-Konfiguration, Erinnerungen, Skills und unterstützte Anmeldedaten in OpenClaw.

- **[minimax](/de/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider MiniMax und MiniMax Portal hinzu.

- **[mistral](/de/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider Mistral hinzu.

- **[novita](/de/plugins/reference/novita)** (`@openclaw/novita-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Novita, Novita AI und Novitaai hinzu.

- **[nvidia](/de/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Modell-Provider NVIDIA hinzu.

- **[oc-path](/de/plugins/reference/oc-path)** (`@openclaw/oc-path`) - in OpenClaw enthalten. Fügt die openclaw-path-CLI zur Adressierung von Workspace-Dateien über oc:// hinzu.

- **[ollama](/de/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Ollama und Ollama Cloud hinzu.

- **[open-prose](/de/plugins/reference/open-prose)** (`@openclaw/open-prose`) - in OpenClaw enthalten. OpenProse-VM-Skill-Paket mit einem /prose-Slash-Befehl.

- **[openai](/de/plugins/reference/openai)** (`@openclaw/openai-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenAI-Modell-Provider hinzu.

- **[opencode](/de/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenCode-Modell-Provider hinzu.

- **[opencode-go](/de/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenCode-Go-Modell-Provider hinzu.

- **[openrouter](/de/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den OpenRouter-Modell-Provider hinzu.

- **[policy](/de/plugins/reference/policy)** (`@openclaw/policy`) – in OpenClaw enthalten. Fügt richtliniengestützte Doctor-Prüfungen für die Konformität des Arbeitsbereichs hinzu.

- **[runway](/de/plugins/reference/runway)** (`@openclaw/runway-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zur Videogenerierung hinzu.

- **[senseaudio](/de/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider zum Medienverständnis hinzu.

- **[sglang](/de/plugins/reference/sglang)** (`@openclaw/sglang-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den SGLang-Modell-Provider hinzu.

- **[synthetic](/de/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Synthetic-Modell-Provider hinzu.

- **[telegram](/de/plugins/reference/telegram)** (`@openclaw/telegram`) – in OpenClaw enthalten. Fügt die Telegram-Kanaloberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[together](/de/plugins/reference/together)** (`@openclaw/together-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Together-Modell-Provider hinzu.

- **[tts-local-cli](/de/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) – in OpenClaw enthalten. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[vault](/de/plugins/reference/vault)** (`@openclaw/vault`) – in OpenClaw enthalten. Integration des HashiCorp-Vault-SecretRef-Providers.

- **[vllm](/de/plugins/reference/vllm)** (`@openclaw/vllm-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den vLLM-Modell-Provider hinzu.

- **[volcengine](/de/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Volcengine und Volcengine Plan hinzu.

- **[voyage](/de/plugins/reference/voyage)** (`@openclaw/voyage-provider`) – in OpenClaw enthalten. Fügt Unterstützung für einen Provider für Speicher-Embeddings hinzu.

- **[vydra](/de/plugins/reference/vydra)** (`@openclaw/vydra-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den Vydra-Modell-Provider hinzu.

- **[web-readability](/de/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) – in OpenClaw enthalten. Extrahiert lesbare Artikelinhalte aus Antworten lokaler HTML-Webabrufe.

- **[webhooks](/de/plugins/reference/webhooks)** (`@openclaw/webhooks`) – in OpenClaw enthalten. Authentifizierte eingehende Webhooks, die externe Automatisierungen mit OpenClaw-TaskFlows verknüpfen.

- **[workboard](/de/plugins/reference/workboard)** (`@openclaw/workboard`) – in OpenClaw enthalten. Dashboard-Arbeitstafel für agenteneigene Issues und Sitzungen.

- **[workspaces](/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) – in OpenClaw enthalten. Von Agenten zusammensetzbares Dokument- und Steuerungsebenen-Backend für Arbeitsbereiche.

- **[xai](/de/plugins/reference/xai)** (`@openclaw/xai-plugin`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für den xAI-Modell-Provider hinzu.

- **[xiaomi](/de/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) – in OpenClaw enthalten. Fügt OpenClaw Unterstützung für die Modell-Provider Xiaomi und Xiaomi Token Plan hinzu.

## Offizielle externe Pakete

70 Plugins

- **[acpx](/de/plugins/reference/acpx)** (`@openclaw/acpx`) – npm; ClawHub. OpenClaw-ACP-Runtime-Backend mit Plugin-eigener Sitzungs- und Transportverwaltung.

- **[amazon-bedrock](/de/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) – npm; ClawHub. OpenClaw-Provider-Plugin für Amazon Bedrock mit Modellerkennung, Embeddings und Unterstützung für Schutzmechanismen.

- **[amazon-bedrock-mantle](/de/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) – npm; ClawHub. OpenClaw-Provider-Plugin für Amazon Bedrock Mantle zur OpenAI-kompatiblen Modellweiterleitung.

- **[anthropic-vertex](/de/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) – npm; ClawHub. OpenClaw-Provider-Plugin für Anthropic Vertex zur Verwendung von Claude-Modellen auf Google Vertex AI.

- **[arcee](/de/plugins/reference/arcee)** (`@openclaw/arcee-provider`) – npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Fügt OpenClaw Unterstützung für den Arcee-Modell-Provider hinzu.

- **[brave](/de/plugins/reference/brave)** (`@openclaw/brave-plugin`) – npm; ClawHub. OpenClaw-Provider-Plugin für Brave Search zur Websuche.

- **[cerebras](/de/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) – npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Fügt OpenClaw Unterstützung für den Cerebras-Modell-Provider hinzu.

- **[chutes](/de/plugins/reference/chutes)** (`@openclaw/chutes-provider`) – npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Fügt OpenClaw Unterstützung für den Chutes-Modell-Provider hinzu.

- **[clickclack](/de/plugins/reference/clickclack)** (`@openclaw/clickclack`) – npm; ClawHub: `clawhub:@openclaw/clickclack`. Fügt die Clickclack-Kanalschnittstelle zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[cloudflare-ai-gateway](/de/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) – npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Cloudflare AI Gateway hinzu.

- **[codex](/de/plugins/reference/codex)** (`@openclaw/codex`) – npm; ClawHub. Codex-App-Server-Harness, Modell-Provider und nativer Sitzungskatalog.

- **[copilot](/de/plugins/reference/copilot)** (`@openclaw/copilot`) – npm; ClawHub: `clawhub:@openclaw/copilot`. Registriert die GitHub-Copilot-Agent-Runtime.

- **[deepinfra](/de/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) – npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Fügt OpenClaw Unterstützung für den DeepInfra-Modell-Provider hinzu.

- **[deepseek](/de/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) – npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Fügt OpenClaw Unterstützung für den DeepSeek-Modell-Provider hinzu.

- **[diagnostics-otel](/de/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) – npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. OpenTelemetry-Exporter der OpenClaw-Diagnose für Metriken, Traces und Protokolle.

- **[diagnostics-prometheus](/de/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) – npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Prometheus-Exporter der OpenClaw-Diagnose für Runtime-Metriken.

- **[diffs](/de/plugins/reference/diffs)** (`@openclaw/diffs`) – npm; ClawHub. Schreibgeschütztes OpenClaw-Plugin zur Anzeige von Diffs und zum Rendern von Dateien für Agents.

- **[diffs-language-pack](/de/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) – npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Fügt Syntaxhervorhebung für Sprachen hinzu, die nicht im Standardsatz des Diff-Viewers enthalten sind.

- **[discord](/de/plugins/reference/discord)** (`@openclaw/discord`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Discord-Kanäle, Direktnachrichten, Befehle und App-Ereignisse.

- **[exa](/de/plugins/reference/exa)** (`@openclaw/exa-plugin`) – npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[featherless](/plugins/reference/featherless)** (`@openclaw/featherless-provider`) – npm; ClawHub: `clawhub:@openclaw/featherless-provider`. OpenClaw-Provider-Plugin für Featherless AI.

- **[feishu](/de/plugins/reference/feishu)** (`@openclaw/feishu`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Feishu/Lark-Chats und Arbeitsplatztools (von der Community durch @m1heng gepflegt).

- **[firecrawl](/de/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) – npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Fügt durch Agents aufrufbare Tools hinzu. Fügt Unterstützung für einen Provider zum Abrufen von Webinhalten hinzu. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[fireworks](/de/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) – npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Fügt OpenClaw Unterstützung für den Fireworks-Modell-Provider hinzu.

- **[gmi](/de/plugins/reference/gmi)** (`@openclaw/gmi-provider`) – npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw-Provider-Plugin für GMI Cloud.

- **[google-meet](/de/plugins/reference/google-meet)** (`@openclaw/google-meet`) – npm; ClawHub. OpenClaw-Teilnehmer-Plugin für Google Meet zum Beitreten zu Anrufen über Chrome- oder Twilio-Transporte.

- **[googlechat](/de/plugins/reference/googlechat)** (`@openclaw/googlechat`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Google Chat-Bereiche und Direktnachrichten.

- **[gradium](/de/plugins/reference/gradium)** (`@openclaw/gradium-speech`) – npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Fügt Unterstützung für einen Text-zu-Sprache-Provider hinzu.

- **[groq](/de/plugins/reference/groq)** (`@openclaw/groq-provider`) – npm; ClawHub: `clawhub:@openclaw/groq-provider`. Fügt OpenClaw Unterstützung für den Groq-Modell-Provider hinzu.

- **[inworld](/de/plugins/reference/inworld)** (`@openclaw/inworld-speech`) – npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld-Streaming für Text-zu-Sprache (MP3, OGG_OPUS, PCM-Telefonie).

- **[irc](/de/plugins/reference/irc)** (`@openclaw/irc`) – npm; ClawHub: `clawhub:@openclaw/irc`. Fügt die IRC-Kanalschnittstelle zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[kilocode](/de/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) – npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Fügt OpenClaw Unterstützung für den Kilocode-Modell-Provider hinzu.

- **[kimi](/de/plugins/reference/kimi)** (`@openclaw/kimi-provider`) – npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Kimi und Kimi Coding hinzu.

- **[line](/de/plugins/reference/line)** (`@openclaw/line`) – npm; ClawHub. OpenClaw-Kanal-Plugin für LINE-Bot-API-Chats.

- **[llama-cpp](/de/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) – npm; ClawHub. Lokale GGUF-Embeddings über node-llama-cpp.

- **[lobster](/de/plugins/reference/lobster)** (`@openclaw/lobster`) – npm; ClawHub. Lobster-Workflow-Tool-Plugin für typisierte Pipelines und fortsetzbare Genehmigungen.

- **[longcat](/plugins/reference/longcat)** (`@openclaw/longcat-provider`) – npm; ClawHub: `clawhub:@openclaw/longcat-provider`. OpenClaw-Provider-Plugin für LongCat.

- **[matrix](/de/plugins/reference/matrix)** (`@openclaw/matrix`) – ClawHub: `clawhub:@openclaw/matrix`; npm. OpenClaw-Kanal-Plugin für Matrix-Räume und Direktnachrichten.

- **[mattermost](/de/plugins/reference/mattermost)** (`@openclaw/mattermost`) – npm; ClawHub: `clawhub:@openclaw/mattermost`. Fügt die Mattermost-Kanalschnittstelle zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[memory-lancedb](/de/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) – npm; ClawHub. LanceDB-basiertes OpenClaw-Plugin für das Langzeitgedächtnis mit automatischem Abruf, automatischer Erfassung und Vektorsuche.

- **[moonshot](/de/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) – npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Fügt OpenClaw Unterstützung für den Moonshot-Modell-Provider hinzu.

- **[msteams](/de/plugins/reference/msteams)** (`@openclaw/msteams`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Microsoft Teams-Bot-Unterhaltungen.

- **[nextcloud-talk](/de/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Nextcloud-Talk-Unterhaltungen.

- **[nostr](/de/plugins/reference/nostr)** (`@openclaw/nostr`) – npm; ClawHub. OpenClaw-Kanal-Plugin für NIP-04-verschlüsselte Direktnachrichten über Nostr.

- **[openshell](/de/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) – npm; ClawHub. OpenClaw-Sandbox-Backend für die NVIDIA-OpenShell-CLI mit gespiegelten lokalen Arbeitsbereichen und SSH-Befehlsausführung.

- **[parallel](/de/tools/parallel-search)** (`@openclaw/parallel-plugin`) – npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[perplexity](/de/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) – npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[pixverse](/de/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) – npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw-Provider-Plugin für die PixVerse-Videogenerierung.

- **[qianfan](/de/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) – npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Fügt OpenClaw Unterstützung für den Qianfan-Modell-Provider hinzu.

- **[qqbot](/de/plugins/reference/qqbot)** (`@openclaw/qqbot`) – npm; ClawHub. OpenClaw-Kanal-Plugin für QQ-Bot-Gruppen- und Direktnachrichten-Workflows.

- **[qwen](/de/plugins/reference/qwen)** (`@openclaw/qwen-provider`) – npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan und Bailian Token Plan hinzu.

- **[raft](/de/plugins/reference/raft)** (`@openclaw/raft`) – npm; ClawHub. OpenClaw-Kanal-Plugin für sichere Raft-CLI-Aktivierungsbrücken.

- **[searxng](/de/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) – npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[signal](/de/plugins/reference/signal)** (`@openclaw/signal`) – npm; ClawHub: `clawhub:@openclaw/signal`. Fügt die Signal-Kanalschnittstelle zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[slack](/de/plugins/reference/slack)** (`@openclaw/slack`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Slack-Kanäle, Direktnachrichten, Befehle und App-Ereignisse.

- **[sms](/de/plugins/reference/sms)** (`@openclaw/sms`) – npm; ClawHub: `clawhub:@openclaw/sms`. Twilio-SMS-Kanal-Plugin für OpenClaw-Textnachrichten.

- **[stepfun](/de/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) – npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider StepFun und StepFun Plan hinzu.

- **[synology-chat](/de/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) – npm; ClawHub. Synology-Chat-Kanal-Plugin für OpenClaw-Kanäle und Direktnachrichten.

- **[tavily](/de/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) – npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Fügt durch Agents aufrufbare Tools hinzu. Fügt Unterstützung für einen Websuch-Provider hinzu.

- **[tencent](/de/plugins/reference/tencent)** (`@openclaw/tencent-provider`) – npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Fügt OpenClaw Unterstützung für die Modell-Provider Tencent TokenHub und Tencent Tokenplan hinzu.

- **[tlon](/de/plugins/reference/tlon)** (`@openclaw/tlon`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Tlon/Urbit-Chat-Workflows.

- **[tokenjuice](/de/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) – npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Komprimiert Ergebnisse der Tools exec und bash mit Tokenjuice-Reduzierern.

- **[twitch](/de/plugins/reference/twitch)** (`@openclaw/twitch`) – npm; ClawHub. OpenClaw-Kanal-Plugin für Twitch-Chat- und Moderations-Workflows.

- **[venice](/de/plugins/reference/venice)** (`@openclaw/venice-provider`) – npm; ClawHub: `clawhub:@openclaw/venice-provider`. Fügt OpenClaw Unterstützung für den Venice-Modell-Provider hinzu.

- **[vercel-ai-gateway](/de/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) – npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Fügt OpenClaw Unterstützung für den Modell-Provider Vercel AI Gateway hinzu.

- **[voice-call](/de/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. OpenClaw-Sprachanruf-Plugin für Telefonanrufe über Twilio, Telnyx und Plivo.

- **[whatsapp](/de/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. OpenClaw-WhatsApp-Kanal-Plugin für Chats über WhatsApp Web.

- **[zai](/de/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Fügt OpenClaw Unterstützung für den Z.AI-Modell-Provider hinzu.

- **[zalo](/de/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. OpenClaw-Zalo-Kanal-Plugin für Bot- und Webhook-Chats.

- **[zalouser](/de/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. OpenClaw-Plugin für persönliche Zalo-Konten über die native zca-js-Integration.

## Nur im Quellcode-Checkout

3 Plugins

- **[qa-channel](/de/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - nur im Quellcode-Checkout. Fügt die QA-Kanal-Oberfläche zum Senden und Empfangen von OpenClaw-Nachrichten hinzu.

- **[qa-lab](/de/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - nur im Quellcode-Checkout. OpenClaw-QA-Labor-Plugin mit privater Debugger-Benutzeroberfläche und Szenario-Runner.

- **[qa-matrix](/de/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - nur im Quellcode-Checkout. Matrix-QA-Transport-Runner und -Substrat.
