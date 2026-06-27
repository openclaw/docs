---
read_when:
    - Je bepaalt of een Plugin in het kern-npm-pakket wordt meegeleverd of afzonderlijk wordt geïnstalleerd
    - Je werkt meegeleverde Plugin-pakketmetadata of releaseautomatisering bij
    - Je hebt de canonieke lijst met interne versus externe Plugins nodig
summary: Gegenereerde inventaris van OpenClaw-Plugins die in de kern worden meegeleverd, extern worden gepubliceerd of alleen als broncode worden behouden
title: Plugin-inventaris
x-i18n:
    generated_at: "2026-06-27T17:57:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin-inventaris

Deze pagina wordt gegenereerd uit `extensions/*/package.json`, `openclaw.plugin.json`
en de uitsluitingen in `files` van het root-npm-pakket. Genereer deze opnieuw met:

```bash
pnpm plugins:inventory:gen
```

## Definities

- **Core npm-pakket:** ingebouwd in het npm-pakket `openclaw` en beschikbaar zonder aparte Plugin-installatie.
- **Officieel extern pakket:** door OpenClaw onderhouden Plugin dat is weggelaten uit het core-npm-pakket, in deze officiële inventaris wordt bijgehouden en op aanvraag via ClawHub en/of npm wordt geïnstalleerd.
- **Alleen bron-checkout:** repo-lokaal Plugin dat is weggelaten uit gepubliceerde npm-artefacten en niet wordt aangeboden als installeerbaar pakket.

Bron-checkouts verschillen van npm-installaties: na `pnpm install` laden gebundelde
plugins vanuit `extensions/<id>`, zodat lokale bewerkingen en pakketlokale workspace-
afhankelijkheden beschikbaar zijn.

## Een Plugin installeren

Gebruik de installatieroute in elke vermelding om te bepalen of installatie nodig is. Plugins
waarbij `included in OpenClaw` staat, zijn al aanwezig in het core-pakket.
Officiële externe pakketten hebben één installatie nodig, gevolgd door een Gateway-herstart.

Discord is bijvoorbeeld een officieel extern pakket:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Tijdens de launch-overgang installeren gewone kale pakketspecificaties nog steeds vanuit npm.
Gebruik `clawhub:@openclaw/discord` of `npm:@openclaw/discord` wanneer je een
expliciete bron nodig hebt. Volg na installatie de installatiedocumentatie van het Plugin, zoals
[Discord](/nl/channels/discord), om referenties en kanaalconfiguratie toe te voegen. Zie
[Plugins beheren](/nl/plugins/manage-plugins) voor opdrachten voor bijwerken, verwijderen en publiceren.

Elke vermelding toont het pakket, de distributieroute en de beschrijving.

## Core npm-pakket

59 plugins

- **[admin-http-rpc](/nl/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - opgenomen in OpenClaw. OpenClaw admin HTTP RPC-eindpunt.

- **[alibaba](/nl/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor een provider voor videogeneratie.

- **[anthropic](/nl/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Anthropic-modelprovider toe aan OpenClaw.

- **[azure-speech](/nl/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - opgenomen in OpenClaw. Azure AI Speech tekst-naar-spraak (MP3, native Ogg/Opus-spraaknotities, PCM-telefonie).

- **[bonjour](/nl/plugins/reference/bonjour)** (`@openclaw/bonjour`) - opgenomen in OpenClaw. Kondig de lokale OpenClaw-gateway aan via Bonjour/mDNS.

- **[browser](/nl/plugins/reference/browser)** (`@openclaw/browser-plugin`) - opgenomen in OpenClaw. Voegt tools toe die door agents kunnen worden aangeroepen.

- **[byteplus](/nl/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de BytePlus- en BytePlus Plan-modelprovider toe aan OpenClaw.

- **[canvas](/nl/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - opgenomen in OpenClaw. Experimentele Canvas-besturing en A2UI-renderingoppervlakken voor gekoppelde nodes.

- **[codex-supervisor](/nl/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - opgenomen in OpenClaw. Beheer Codex app-server-sessies vanuit OpenClaw.

- **[cohere](/nl/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - opgenomen in OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw Cohere-provider-Plugin.

- **[comfy](/nl/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de ComfyUI-modelprovider toe aan OpenClaw.

- **[copilot-proxy](/nl/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Copilot Proxy-modelprovider toe aan OpenClaw.

- **[deepgram](/nl/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor providers voor mediabegrip. Voegt ondersteuning toe voor providers voor realtime transcriptie.

- **[document-extract](/nl/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - opgenomen in OpenClaw. Extraheer tekst en fallback-pagina-afbeeldingen uit lokale documentbijlagen.

- **[duckduckgo](/nl/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor webzoekproviders.

- **[elevenlabs](/nl/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor providers voor mediabegrip. Voegt ondersteuning toe voor providers voor realtime transcriptie. Voegt ondersteuning toe voor tekst-naar-spraakproviders.

- **[fal](/nl/plugins/reference/fal)** (`@openclaw/fal-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de fal-modelprovider toe aan OpenClaw.

- **[file-transfer](/nl/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - opgenomen in OpenClaw. Haal bestanden op, vermeld ze en schrijf ze op gekoppelde nodes via speciale node-opdrachten. Omzeilt afkapping van bash-stdout door base64 via node.invoke te gebruiken voor binaire bestanden tot 16 MB.

- **[github-copilot](/nl/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de GitHub Copilot-modelprovider toe aan OpenClaw.

- **[google](/nl/plugins/reference/google)** (`@openclaw/google-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Google-, Google Gemini CLI- en Google Vertex-modelprovider toe aan OpenClaw.

- **[huggingface](/nl/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Hugging Face-modelprovider toe aan OpenClaw.

- **[imessage](/nl/plugins/reference/imessage)** (`@openclaw/imessage`) - opgenomen in OpenClaw. Voegt het iMessage-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[litellm](/nl/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de LiteLLM-modelprovider toe aan OpenClaw.

- **[llm-task](/nl/plugins/reference/llm-task)** (`@openclaw/llm-task`) - opgenomen in OpenClaw. Generieke JSON-only LLM-tool voor gestructureerde taken die vanuit workflows kunnen worden aangeroepen.

- **[lmstudio](/nl/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de LM Studio-modelprovider toe aan OpenClaw.

- **[memory-core](/nl/plugins/reference/memory-core)** (`@openclaw/memory-core`) - opgenomen in OpenClaw. Voegt tools toe die door agents kunnen worden aangeroepen.

- **[memory-wiki](/nl/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - opgenomen in OpenClaw. Persistente wikicompiler en Obsidian-vriendelijke kenniskluis voor OpenClaw.

- **[microsoft](/nl/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor tekst-naar-spraakproviders.

- **[microsoft-foundry](/nl/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.

- **[migrate-claude](/nl/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - opgenomen in OpenClaw. Importeert Claude Code- en Claude Desktop-instructies, MCP-servers, Skills en veilige configuratie in OpenClaw.

- **[migrate-hermes](/nl/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - opgenomen in OpenClaw. Importeert Hermes-configuratie, herinneringen, Skills en ondersteunde referenties in OpenClaw.

- **[minimax](/nl/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de MiniMax- en MiniMax Portal-modelprovider toe aan OpenClaw.

- **[mistral](/nl/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Mistral-modelprovider toe aan OpenClaw.

- **[novita](/nl/plugins/reference/novita)** (`@openclaw/novita-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Novita-, Novita AI- en Novitaai-modelprovider toe aan OpenClaw.

- **[nvidia](/nl/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de NVIDIA-modelprovider toe aan OpenClaw.

- **[oc-path](/nl/plugins/reference/oc-path)** (`@openclaw/oc-path`) - opgenomen in OpenClaw. Voegt de openclaw path CLI toe voor oc://-adressering van workspacebestanden.

- **[ollama](/nl/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Ollama- en Ollama Cloud-modelprovider toe aan OpenClaw.

- **[open-prose](/nl/plugins/reference/open-prose)** (`@openclaw/open-prose`) - opgenomen in OpenClaw. OpenProse VM-Skill-pakket met een /prose slash-opdracht.

- **[openai](/nl/plugins/reference/openai)** (`@openclaw/openai-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de OpenAI-modelprovider toe aan OpenClaw.

- **[opencode](/nl/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de OpenCode-modelprovider toe aan OpenClaw.

- **[opencode-go](/nl/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de OpenCode Go-modelprovider toe aan OpenClaw.

- **[openrouter](/nl/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de OpenRouter-modelprovider toe aan OpenClaw.

- **[policy](/nl/plugins/reference/policy)** (`@openclaw/policy`) - opgenomen in OpenClaw. Voegt policy-ondersteunde doctor-controles toe voor workspace-conformiteit.

- **[runway](/nl/plugins/reference/runway)** (`@openclaw/runway-provider`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor een provider voor videogeneratie.

- **[senseaudio](/nl/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor providers voor mediabegrip.

- **[sglang](/nl/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de SGLang-modelprovider toe aan OpenClaw.

- **[synthetic](/nl/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Synthetic-modelprovider toe aan OpenClaw.

- **[telegram](/nl/plugins/reference/telegram)** (`@openclaw/telegram`) - opgenomen in OpenClaw. Voegt het Telegram-kanaaloppervlak toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[together](/nl/plugins/reference/together)** (`@openclaw/together-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Together-modelprovider toe aan OpenClaw.

- **[tts-local-cli](/nl/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor tekst-naar-spraakproviders.

- **[vllm](/nl/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de vLLM-modelprovider toe aan OpenClaw.

- **[volcengine](/nl/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Volcengine- en Volcengine Plan-modelprovider toe aan OpenClaw.

- **[voyage](/nl/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - opgenomen in OpenClaw. Voegt ondersteuning toe voor providers voor geheugen-embeddings.

- **[vydra](/nl/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Vydra-modelprovider toe aan OpenClaw.

- **[web-readability](/nl/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - opgenomen in OpenClaw. Extraheer leesbare artikelinhoud uit lokale HTML-webfetch-antwoorden.

- **[webhooks](/nl/plugins/reference/webhooks)** (`@openclaw/webhooks`) - opgenomen in OpenClaw. Geauthenticeerde inkomende webhooks die externe automatisering koppelen aan OpenClaw TaskFlows.

- **[workboard](/nl/plugins/reference/workboard)** (`@openclaw/workboard`) - opgenomen in OpenClaw. Dashboard-workboard voor issues en sessies die eigendom zijn van agents.

- **[xai](/nl/plugins/reference/xai)** (`@openclaw/xai-plugin`) - opgenomen in OpenClaw. Voegt ondersteuning voor de xAI-modelprovider toe aan OpenClaw.

- **[xiaomi](/nl/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - opgenomen in OpenClaw. Voegt ondersteuning voor de Xiaomi- en Xiaomi Token Plan-modelprovider toe aan OpenClaw.

## Officiële externe pakketten

68 plugins

- **[acpx](/nl/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. OpenClaw ACP-runtimebackend met Plugin-eigen sessie- en transportbeheer.

- **[amazon-bedrock](/nl/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock-provider-Plugin met modelontdekking, embeddings en guardrail-ondersteuning.

- **[amazon-bedrock-mantle](/nl/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenClaw Amazon Bedrock Mantle-provider-Plugin voor OpenAI-compatibele modelroutering.

- **[anthropic-vertex](/nl/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. OpenClaw Anthropic Vertex-provider-Plugin voor Claude-modellen op Google Vertex AI.

- **[arcee](/nl/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Voegt ondersteuning voor de Arcee-modelprovider toe aan OpenClaw.

- **[brave](/nl/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. OpenClaw Brave Search-provider-Plugin voor zoeken op het web.

- **[cerebras](/nl/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Voegt ondersteuning voor de Cerebras-modelprovider toe aan OpenClaw.

- **[chutes](/nl/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Voegt ondersteuning voor de Chutes-modelprovider toe aan OpenClaw.

- **[clickclack](/nl/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Voegt de Clickclack-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[cloudflare-ai-gateway](/nl/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Voegt ondersteuning voor de Cloudflare AI Gateway-modelprovider toe aan OpenClaw.

- **[codex](/nl/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. OpenClaw Codex app-server-harnas en modelprovider-Plugin met een door Codex beheerde GPT-catalogus.

- **[copilot](/nl/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registreert de GitHub Copilot-agentruntime.

- **[deepinfra](/nl/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Voegt ondersteuning voor de DeepInfra-modelprovider toe aan OpenClaw.

- **[deepseek](/nl/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Voegt ondersteuning voor de DeepSeek-modelprovider toe aan OpenClaw.

- **[diagnostics-otel](/nl/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. OpenClaw-diagnostiekexporter voor OpenTelemetry voor metrieken, traces en logs.

- **[diagnostics-prometheus](/nl/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. OpenClaw-diagnostiekexporter voor Prometheus voor runtimemetrieken.

- **[diffs](/nl/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. OpenClaw alleen-lezen diffviewer-Plugin en bestandsrenderer voor agents.

- **[diffs-language-pack](/nl/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Voegt syntaxismarkering toe voor talen buiten de standaardset van de diffviewer.

- **[discord](/nl/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. OpenClaw Discord-kanaal-Plugin voor kanalen, DM's, opdrachten en app-gebeurtenissen.

- **[exa](/nl/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Voegt ondersteuning voor een zoekprovider op het web toe.

- **[feishu](/nl/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. OpenClaw Feishu/Lark-kanaal-Plugin voor chats en werkplektools (door de community onderhouden door @m1heng).

- **[firecrawl](/nl/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Voegt door agents aanroepbare tools toe. Voegt ondersteuning voor een webophaalprovider toe. Voegt ondersteuning voor een zoekprovider op het web toe.

- **[fireworks](/nl/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Voegt ondersteuning voor de Fireworks-modelprovider toe aan OpenClaw.

- **[gmi](/nl/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud-provider-Plugin.

- **[google-meet](/nl/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. OpenClaw Google Meet-deelnemer-Plugin voor deelname aan gesprekken via Chrome- of Twilio-transports.

- **[googlechat](/nl/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. OpenClaw Google Chat-kanaal-Plugin voor ruimtes en directe berichten.

- **[gradium](/nl/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Voegt ondersteuning voor een tekst-naar-spraakprovider toe.

- **[groq](/nl/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Voegt ondersteuning voor de Groq-modelprovider toe aan OpenClaw.

- **[inworld](/nl/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld streaming tekst-naar-spraak (MP3, OGG_OPUS, PCM-telefonie).

- **[irc](/nl/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Voegt de IRC-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[kilocode](/nl/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Voegt ondersteuning voor de Kilocode-modelprovider toe aan OpenClaw.

- **[kimi](/nl/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Voegt ondersteuning voor de Kimi- en Kimi Coding-modelprovider toe aan OpenClaw.

- **[line](/nl/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. OpenClaw LINE-kanaal-Plugin voor LINE Bot API-chats.

- **[llama-cpp](/nl/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokale GGUF-embeddings via node-llama-cpp.

- **[lobster](/nl/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Lobster-workflowtool-Plugin voor getypeerde pipelines en hervatbare goedkeuringen.

- **[matrix](/nl/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. OpenClaw Matrix-kanaal-Plugin voor rooms en directe berichten.

- **[mattermost](/nl/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Voegt de Mattermost-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[memory-lancedb](/nl/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. OpenClaw langetermijngeheugen-Plugin met LanceDB-backend, auto-recall, auto-capture en vectorzoeken.

- **[moonshot](/nl/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Voegt ondersteuning voor de Moonshot-modelprovider toe aan OpenClaw.

- **[msteams](/nl/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. OpenClaw Microsoft Teams-kanaal-Plugin voor botgesprekken.

- **[nextcloud-talk](/nl/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. OpenClaw Nextcloud Talk-kanaal-Plugin voor gesprekken.

- **[nostr](/nl/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. OpenClaw Nostr-kanaal-Plugin voor met NIP-04 versleutelde directe berichten.

- **[openshell](/nl/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. OpenClaw-sandboxbackend voor de NVIDIA OpenShell CLI met gespiegelde lokale werkruimten en uitvoering van SSH-opdrachten.

- **[parallel](/nl/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Voegt ondersteuning voor een zoekprovider op het web toe.

- **[perplexity](/nl/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Voegt ondersteuning voor een zoekprovider op het web toe.

- **[pixverse](/nl/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse-videogeneratieprovider-Plugin.

- **[qianfan](/nl/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Voegt ondersteuning voor de Qianfan-modelprovider toe aan OpenClaw.

- **[qqbot](/nl/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. OpenClaw QQ Bot-kanaal-Plugin voor groeps- en direct-message-workflows.

- **[qwen](/nl/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Voegt ondersteuning voor de Qwen-, Qwen Cloud-, Model Studio-, DashScope-, Qwen Oauth-, Qwen Portal- en Qwen CLI-modelprovider toe aan OpenClaw.

- **[raft](/nl/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. OpenClaw Raft-kanaal-Plugin voor veilige CLI-wake-bridges.

- **[searxng](/nl/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Voegt ondersteuning voor een zoekprovider op het web toe.

- **[signal](/nl/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Voegt de Signal-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[slack](/nl/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. OpenClaw Slack-kanaal-Plugin voor kanalen, DM's, opdrachten en app-gebeurtenissen.

- **[sms](/nl/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Twilio SMS-kanaal-Plugin voor OpenClaw-tekstberichten.

- **[stepfun](/nl/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Voegt ondersteuning voor de StepFun- en StepFun Plan-modelprovider toe aan OpenClaw.

- **[synology-chat](/nl/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Synology Chat-kanaal-Plugin voor OpenClaw-kanalen en directe berichten.

- **[tavily](/nl/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Voegt door agents aanroepbare tools toe. Voegt ondersteuning voor een zoekprovider op het web toe.

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

## Alleen broncheckout

3 Plugins

- **[qa-channel](/nl/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - alleen broncheckout. Voegt de QA Channel-kanaalinterface toe voor het verzenden en ontvangen van OpenClaw-berichten.

- **[qa-lab](/nl/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - alleen broncheckout. OpenClaw QA-lab-Plugin met privédebugger-UI en scenariorunner.

- **[qa-matrix](/nl/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - alleen source checkout. Matrix QA-transportrunner en substraat.
