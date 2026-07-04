---
read_when:
    - Je bepaalt of een Plugin in het core-npm-pakket wordt meegeleverd of apart wordt geïnstalleerd
    - Je werkt gebundelde Plugin-pakketmetadata of releaseautomatisering bij
    - Je hebt de canonieke lijst met interne versus externe Plugins nodig
summary: Gegenereerde inventaris van OpenClaw-plugins die in core worden meegeleverd, extern worden gepubliceerd of alleen als broncode worden behouden
title: Plugin-inventaris
x-i18n:
    generated_at: "2026-07-04T03:55:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin-inventaris

Deze pagina wordt gegenereerd uit `extensions/*/package.json`, `openclaw.plugin.json`
en de uitsluitingen voor `files` in het root-npm-pakket. Genereer deze opnieuw met:

```bash
pnpm plugins:inventory:gen
```

## Definities

- **Core-npm-pakket:** ingebouwd in het `openclaw`-npm-pakket en beschikbaar zonder aparte plugin-installatie.
- **Officieel extern pakket:** door OpenClaw onderhouden plugin die is weggelaten uit het core-npm-pakket, in deze officiële inventaris wordt bijgehouden en op aanvraag via ClawHub en/of npm wordt geïnstalleerd.
- **Alleen source-checkout:** repo-lokale plugin die is weggelaten uit gepubliceerde npm-artefacten en niet wordt aangeboden als installeerbaar pakket.

Source-checkouts verschillen van npm-installaties: na `pnpm install` laden gebundelde
plugins vanuit `extensions/<id>`, zodat lokale wijzigingen en pakket-lokale workspace-
dependencies beschikbaar zijn.

## Een plugin installeren

Gebruik de installatieroute in elke vermelding om te bepalen of installatie nodig is. Plugins
waarbij `included in OpenClaw` staat, zijn al aanwezig in het core-pakket.
Officiële externe pakketten hebben één installatie nodig en daarna een herstart van de Gateway.

Discord is bijvoorbeeld een officieel extern pakket:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Tijdens de lanceringsovergang installeren gewone kale pakketspecificaties nog steeds vanuit npm.
Gebruik `clawhub:@openclaw/discord` of `npm:@openclaw/discord` wanneer u een
expliciete bron nodig hebt. Volg na installatie de setupdocumentatie van de plugin, zoals
[Discord](/nl/channels/discord), om referenties en kanaalconfiguratie toe te voegen. Zie
[Plugins beheren](/nl/plugins/manage-plugins) voor opdrachten voor bijwerken, verwijderen en publiceren.

Elke vermelding geeft het pakket, de distributieroute en de beschrijving.

## Core-npm-pakket

60 plugins

- **[admin-http-rpc](/nl/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - opgenomen in OpenClaw. OpenClaw admin HTTP RPC-eindpunt.

- **[alibaba](/nl/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor provider voor videogeneratie toe.

- **[anthropic](/nl/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Anthropic-modelprovider toe aan OpenClaw.

- **[azure-speech](/nl/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - opgenomen in OpenClaw. Azure AI Speech tekst-naar-spraak (MP3, native Ogg/Opus-spraaknotities, PCM-telefonie).

- **[bonjour](/nl/plugins/reference/bonjour)** (`@openclaw/bonjour`) - opgenomen in OpenClaw. Adverteer de lokale OpenClaw-gateway via Bonjour/mDNS.

- **[browser](/nl/plugins/reference/browser)** (`@openclaw/browser-plugin`) - opgenomen in OpenClaw. Voegt tools toe die door agents kunnen worden aangeroepen.

- **[byteplus](/nl/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor BytePlus- en BytePlus Plan-modelproviders toe aan OpenClaw.

- **[canvas](/nl/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - opgenomen in OpenClaw. Experimentele Canvas-besturing en A2UI-renderingoppervlakken voor gekoppelde nodes.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - opgenomen in OpenClaw. Voegt ondersteuning voor ClawRouter-modelprovider toe aan OpenClaw.

- **[codex-supervisor](/nl/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - opgenomen in OpenClaw. Beheer Codex app-server-sessies vanuit OpenClaw.

- **[cohere](/nl/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - opgenomen in OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw Cohere-providerplugin.

- **[comfy](/nl/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor ComfyUI-modelprovider toe aan OpenClaw.

- **[copilot-proxy](/nl/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - opgenomen in OpenClaw. Voegt ondersteuning voor Copilot Proxy-modelprovider toe aan OpenClaw.

- **[deepgram](/nl/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor provider voor mediabegrip toe. Voegt ondersteuning voor provider voor realtime transcriptie toe.

- **[document-extract](/nl/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - opgenomen in OpenClaw. Extraheer tekst en fallback-pagina-afbeeldingen uit lokale documentbijlagen.

- **[duckduckgo](/nl/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning voor webzoekprovider toe.

- **[elevenlabs](/nl/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - opgenomen in OpenClaw. Voegt ondersteuning voor provider voor mediabegrip toe. Voegt ondersteuning voor provider voor realtime transcriptie toe. Voegt ondersteuning voor tekst-naar-spraakprovider toe.

- **[fal](/nl/plugins/reference/fal)** (`@openclaw/fal-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor fal-modelprovider toe aan OpenClaw.

- **[file-transfer](/nl/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - opgenomen in OpenClaw. Haal bestanden op, lijst ze op en schrijf ze op gekoppelde nodes via specifieke node-opdrachten. Omzeilt bash-stdout-afkapping door base64 via node.invoke te gebruiken voor binaries tot 16 MB.

- **[github-copilot](/nl/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor GitHub Copilot-modelprovider toe aan OpenClaw.

- **[google](/nl/plugins/reference/google)** (`@openclaw/google-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning voor Google-, Google Gemini CLI- en Google Vertex-modelproviders toe aan OpenClaw.

- **[huggingface](/nl/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Hugging Face-modelprovider toe aan OpenClaw.

- **[imessage](/nl/plugins/reference/imessage)** (`@openclaw/imessage`) - opgenomen in OpenClaw. Voegt het iMessage-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[litellm](/nl/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor LiteLLM-modelprovider toe aan OpenClaw.

- **[llm-task](/nl/plugins/reference/llm-task)** (`@openclaw/llm-task`) - opgenomen in OpenClaw. Generieke JSON-only LLM-tool voor gestructureerde taken die vanuit workflows kan worden aangeroepen.

- **[lmstudio](/nl/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor LM Studio-modelprovider toe aan OpenClaw.

- **[memory-core](/nl/plugins/reference/memory-core)** (`@openclaw/memory-core`) - opgenomen in OpenClaw. Voegt tools toe die door agents kunnen worden aangeroepen.

- **[memory-wiki](/nl/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - opgenomen in OpenClaw. Persistente wiki-compiler en Obsidian-vriendelijke kennisvault voor OpenClaw.

- **[microsoft](/nl/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - opgenomen in OpenClaw. Voegt ondersteuning voor tekst-naar-spraakprovider toe.

- **[microsoft-foundry](/nl/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - opgenomen in OpenClaw. Voegt ondersteuning voor Microsoft Foundry-modelprovider toe aan OpenClaw.

- **[migrate-claude](/nl/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - opgenomen in OpenClaw. Importeert Claude Code- en Claude Desktop-instructies, MCP-servers, skills en veilige configuratie in OpenClaw.

- **[migrate-hermes](/nl/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - opgenomen in OpenClaw. Importeert Hermes-configuratie, herinneringen, skills en ondersteunde referenties in OpenClaw.

- **[minimax](/nl/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor MiniMax- en MiniMax Portal-modelproviders toe aan OpenClaw.

- **[mistral](/nl/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Mistral-modelprovider toe aan OpenClaw.

- **[novita](/nl/plugins/reference/novita)** (`@openclaw/novita-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Novita-, Novita AI- en Novitaai-modelproviders toe aan OpenClaw.

- **[nvidia](/nl/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor NVIDIA-modelprovider toe aan OpenClaw.

- **[oc-path](/nl/plugins/reference/oc-path)** (`@openclaw/oc-path`) - opgenomen in OpenClaw. Voegt de openclaw path-CLI toe voor oc:// workspace-bestandsadressering.

- **[ollama](/nl/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Ollama- en Ollama Cloud-modelproviders toe aan OpenClaw.

- **[open-prose](/nl/plugins/reference/open-prose)** (`@openclaw/open-prose`) - opgenomen in OpenClaw. OpenProse VM skill-pack met een slash-opdracht /prose.

- **[openai](/nl/plugins/reference/openai)** (`@openclaw/openai-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor OpenAI-modelprovider toe aan OpenClaw.

- **[opencode](/nl/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor OpenCode-modelprovider toe aan OpenClaw.

- **[opencode-go](/nl/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor OpenCode Go-modelprovider toe aan OpenClaw.

- **[openrouter](/nl/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor OpenRouter-modelprovider toe aan OpenClaw.

- **[policy](/nl/plugins/reference/policy)** (`@openclaw/policy`) - opgenomen in OpenClaw. Voegt policy-ondersteunde doctor-controles toe voor workspace-conformiteit.

- **[runway](/nl/plugins/reference/runway)** (`@openclaw/runway-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor provider voor videogeneratie toe.

- **[senseaudio](/nl/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor provider voor mediabegrip toe.

- **[sglang](/nl/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor SGLang-modelprovider toe aan OpenClaw.

- **[synthetic](/nl/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Synthetic-modelprovider toe aan OpenClaw.

- **[telegram](/nl/plugins/reference/telegram)** (`@openclaw/telegram`) - opgenomen in OpenClaw. Voegt het Telegram-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[together](/nl/plugins/reference/together)** (`@openclaw/together-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Together-modelprovider toe aan OpenClaw.

- **[tts-local-cli](/nl/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - opgenomen in OpenClaw. Voegt ondersteuning voor tekst-naar-spraakprovider toe.

- **[vllm](/nl/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor vLLM-modelprovider toe aan OpenClaw.

- **[volcengine](/nl/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Volcengine- en Volcengine Plan-modelproviders toe aan OpenClaw.

- **[voyage](/nl/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor memory-embeddingprovider toe.

- **[vydra](/nl/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Vydra-modelprovider toe aan OpenClaw.

- **[web-readability](/nl/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - opgenomen in OpenClaw. Extraheer leesbare artikelinhoud uit lokale HTML-webfetch-antwoorden.

- **[webhooks](/nl/plugins/reference/webhooks)** (`@openclaw/webhooks`) - opgenomen in OpenClaw. Geauthenticeerde inkomende webhooks die externe automatisering koppelen aan OpenClaw TaskFlows.

- **[workboard](/nl/plugins/reference/workboard)** (`@openclaw/workboard`) - opgenomen in OpenClaw. Dashboardwerkbord voor issues en sessies die eigendom zijn van agents.

- **[xai](/nl/plugins/reference/xai)** (`@openclaw/xai-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning voor xAI-modelprovider toe aan OpenClaw.

- **[xiaomi](/nl/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor Xiaomi- en Xiaomi Token Plan-modelproviders toe aan OpenClaw.

## Officiële externe pakketten

68 plugins

- **[acpx](/nl/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. OpenClaw ACP-runtimebackend met plugin-eigen sessie- en transportbeheer.

- **[amazon-bedrock](/nl/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock-providerplugin met modeldetectie, embeddings en ondersteuning voor guardrails.

- **[amazon-bedrock-mantle](/nl/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock Mantle-provider-Plugin voor OpenAI-compatibele modelroutering.

- **[anthropic-vertex](/nl/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. OpenClaw Anthropic Vertex-provider-Plugin voor Claude-modellen op Google Vertex AI.

- **[arcee](/nl/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Voegt ondersteuning voor de Arcee-modelprovider toe aan OpenClaw.

- **[brave](/nl/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. OpenClaw Brave Search-provider-Plugin voor zoeken op het web.

- **[cerebras](/nl/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Voegt ondersteuning voor de Cerebras-modelprovider toe aan OpenClaw.

- **[chutes](/nl/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Voegt ondersteuning voor de Chutes-modelprovider toe aan OpenClaw.

- **[clickclack](/nl/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Voegt het Clickclack-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[cloudflare-ai-gateway](/nl/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Voegt ondersteuning voor de Cloudflare AI Gateway-modelprovider toe aan OpenClaw.

- **[codex](/nl/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. OpenClaw Codex-appserverharnas en modelprovider-Plugin met een door Codex beheerde GPT-catalogus.

- **[copilot](/nl/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registreert de GitHub Copilot-agentruntime.

- **[deepinfra](/nl/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Voegt ondersteuning voor de DeepInfra-modelprovider toe aan OpenClaw.

- **[deepseek](/nl/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Voegt ondersteuning voor de DeepSeek-modelprovider toe aan OpenClaw.

- **[diagnostics-otel](/nl/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. OpenClaw-diagnostiekexporter voor OpenTelemetry voor metrics, traces en logs.

- **[diagnostics-prometheus](/nl/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. OpenClaw-diagnostiekexporter voor Prometheus voor runtimemetrics.

- **[diffs](/nl/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. OpenClaw alleen-lezen diffviewer-Plugin en bestandsrenderer voor agents.

- **[diffs-language-pack](/nl/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Voegt syntaxmarkering toe voor talen buiten de standaardset van de diffviewer.

- **[discord](/nl/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. OpenClaw Discord-kanaal-Plugin voor kanalen, privéberichten, opdrachten en appgebeurtenissen.

- **[exa](/nl/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Voegt ondersteuning voor een webzoekprovider toe.

- **[feishu](/nl/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. OpenClaw Feishu/Lark-kanaal-Plugin voor chats en werkplektools (onderhouden door de community door @m1heng).

- **[firecrawl](/nl/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Voegt tools toe die door agents kunnen worden aangeroepen. Voegt ondersteuning voor een webophaalprovider toe. Voegt ondersteuning voor een webzoekprovider toe.

- **[fireworks](/nl/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Voegt ondersteuning voor de Fireworks-modelprovider toe aan OpenClaw.

- **[gmi](/nl/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud-provider-Plugin.

- **[google-meet](/nl/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. OpenClaw Google Meet-deelnemer-Plugin voor deelnemen aan gesprekken via Chrome- of Twilio-transports.

- **[googlechat](/nl/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. OpenClaw Google Chat-kanaal-Plugin voor spaces en directe berichten.

- **[gradium](/nl/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Voegt ondersteuning voor een tekst-naar-spraakprovider toe.

- **[groq](/nl/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Voegt ondersteuning voor de Groq-modelprovider toe aan OpenClaw.

- **[inworld](/nl/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld-streaming tekst-naar-spraak (MP3, OGG_OPUS, PCM-telefonie).

- **[irc](/nl/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Voegt het IRC-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[kilocode](/nl/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Voegt ondersteuning voor de Kilocode-modelprovider toe aan OpenClaw.

- **[kimi](/nl/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Voegt ondersteuning voor de Kimi- en Kimi Coding-modelprovider toe aan OpenClaw.

- **[line](/nl/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. OpenClaw LINE-kanaal-Plugin voor LINE Bot API-chats.

- **[llama-cpp](/nl/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokale GGUF-embeddings via node-llama-cpp.

- **[lobster](/nl/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Lobster-workflowtool-Plugin voor getypeerde pipelines en hervatbare goedkeuringen.

- **[matrix](/nl/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. OpenClaw Matrix-kanaal-Plugin voor rooms en directe berichten.

- **[mattermost](/nl/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Voegt het Mattermost-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[memory-lancedb](/nl/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. OpenClaw langetermijngeheugen-Plugin met LanceDB-backend, automatische herinnering, automatische vastlegging en vectorzoekfunctie.

- **[moonshot](/nl/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Voegt ondersteuning voor de Moonshot-modelprovider toe aan OpenClaw.

- **[msteams](/nl/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. OpenClaw Microsoft Teams-kanaal-Plugin voor botgesprekken.

- **[nextcloud-talk](/nl/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. OpenClaw Nextcloud Talk-kanaal-Plugin voor gesprekken.

- **[nostr](/nl/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. OpenClaw Nostr-kanaal-Plugin voor met NIP-04 versleutelde directe berichten.

- **[openshell](/nl/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. OpenClaw-sandboxbackend voor de NVIDIA OpenShell CLI met gespiegelde lokale werkruimten en uitvoering van SSH-opdrachten.

- **[parallel](/nl/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Voegt ondersteuning voor een webzoekprovider toe.

- **[perplexity](/nl/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Voegt ondersteuning voor een webzoekprovider toe.

- **[pixverse](/nl/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse-provider-Plugin voor videogeneratie.

- **[qianfan](/nl/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Voegt ondersteuning voor de Qianfan-modelprovider toe aan OpenClaw.

- **[qqbot](/nl/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. OpenClaw QQ Bot-kanaal-Plugin voor workflows voor groepen en directe berichten.

- **[qwen](/nl/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Voegt ondersteuning voor de Qwen-, Qwen Cloud-, Model Studio-, DashScope-, Qwen Oauth-, Qwen Portal- en Qwen CLI-modelprovider toe aan OpenClaw.

- **[raft](/nl/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. OpenClaw Raft-kanaal-Plugin voor veilige CLI-wakebridges.

- **[searxng](/nl/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Voegt ondersteuning voor een webzoekprovider toe.

- **[signal](/nl/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Voegt het Signal-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[slack](/nl/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. OpenClaw Slack-kanaal-Plugin voor kanalen, privéberichten, opdrachten en appgebeurtenissen.

- **[sms](/nl/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Twilio SMS-kanaal-Plugin voor OpenClaw-tekstberichten.

- **[stepfun](/nl/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Voegt ondersteuning voor de StepFun- en StepFun Plan-modelprovider toe aan OpenClaw.

- **[synology-chat](/nl/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Synology Chat-kanaal-Plugin voor OpenClaw-kanalen en directe berichten.

- **[tavily](/nl/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Voegt tools toe die door agents kunnen worden aangeroepen. Voegt ondersteuning voor een webzoekprovider toe.

- **[tencent](/nl/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Voegt ondersteuning voor de Tencent TokenHub-modelprovider toe aan OpenClaw.

- **[tlon](/nl/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. OpenClaw Tlon/Urbit-kanaal-Plugin voor chatworkflows.

- **[tokenjuice](/nl/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Comprimeert resultaten van exec- en bash-tools met tokenjuice-reducers.

- **[twitch](/nl/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. OpenClaw Twitch-kanaal-Plugin voor chat- en moderatieworkflows.

- **[venice](/nl/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Voegt ondersteuning voor de Venice-modelprovider toe aan OpenClaw.

- **[vercel-ai-gateway](/nl/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Voegt ondersteuning voor de Vercel AI Gateway-modelprovider toe aan OpenClaw.

- **[voice-call](/nl/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. OpenClaw voice-call-Plugin voor telefoongesprekken via Twilio, Telnyx en Plivo.

- **[whatsapp](/nl/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. OpenClaw WhatsApp-kanaal-Plugin voor WhatsApp Web-chats.

- **[zai](/nl/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Voegt ondersteuning voor de Z.AI-modelprovider toe aan OpenClaw.

- **[zalo](/nl/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. OpenClaw Zalo-kanaal-Plugin voor bot- en Webhook-chats.

- **[zalouser](/nl/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. OpenClaw Zalo Personal Account-Plugin via native zca-js-integratie.

## Alleen source-checkout

3 Plugins

- **[qa-channel](/nl/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - alleen source-checkout. Voegt het QA Channel-oppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[qa-lab](/nl/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - alleen source-checkout. OpenClaw QA lab-Plugin met privédebugger-UI en scenariorunner.

- **[qa-matrix](/nl/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - alleen broncode-checkout. Matrix QA-transportrunner en substraat.
