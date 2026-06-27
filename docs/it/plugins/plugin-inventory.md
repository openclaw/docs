---
read_when:
    - Stai decidendo se un plugin viene distribuito nel pacchetto npm principale o viene installato separatamente
    - Stai aggiornando i metadati dei pacchetti Plugin inclusi o l'automazione del rilascio
    - È necessario l'elenco canonico dei Plugin interni ed esterni
summary: Inventario generato dei Plugin OpenClaw inclusi nel core, pubblicati esternamente o mantenuti solo come sorgente
title: Inventario dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:52:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventario dei Plugin

Questa pagina è generata da `extensions/*/package.json`, `openclaw.plugin.json`
e dalle esclusioni `files` del pacchetto npm radice. Rigenerala con:

```bash
pnpm plugins:inventory:gen
```

## Definizioni

- **Pacchetto npm core:** integrato nel pacchetto npm `openclaw` e disponibile senza installare un Plugin separato.
- **Pacchetto esterno ufficiale:** Plugin mantenuto da OpenClaw omesso dal pacchetto npm core, mantenuto in questo inventario ufficiale e installato su richiesta tramite ClawHub e/o npm.
- **Solo checkout dei sorgenti:** Plugin locale del repo omesso dagli artefatti npm pubblicati e non pubblicizzato come pacchetto installabile.

I checkout dei sorgenti sono diversi dalle installazioni npm: dopo `pnpm install`, i Plugin
inclusi vengono caricati da `extensions/<id>`, quindi le modifiche locali e le dipendenze
workspace locali del pacchetto sono disponibili.

## Installare un Plugin

Usa il percorso di installazione in ogni voce per decidere se è necessaria l'installazione. I Plugin
che indicano `included in OpenClaw` sono già presenti nel pacchetto core.
I pacchetti esterni ufficiali richiedono un'installazione, quindi un riavvio del Gateway.

Ad esempio, Discord è un pacchetto esterno ufficiale:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante il passaggio di lancio, le normali specifiche bare dei pacchetti continuano a installare da npm.
Usa `clawhub:@openclaw/discord` o `npm:@openclaw/discord` quando ti serve una
sorgente esplicita. Dopo l'installazione, segui la documentazione di configurazione del Plugin, come
[Discord](/it/channels/discord), per aggiungere credenziali e configurazione del canale. Vedi
[Gestire i Plugin](/it/plugins/manage-plugins) per i comandi di aggiornamento, disinstallazione e pubblicazione.

Ogni voce elenca il pacchetto, il percorso di distribuzione e la descrizione.

## Pacchetto npm core

59 Plugin

- **[admin-http-rpc](/it/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluso in OpenClaw. Endpoint HTTP RPC di amministrazione OpenClaw.

- **[alibaba](/it/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluso in OpenClaw. Aggiunge il supporto al provider di generazione video.

- **[anthropic](/it/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Anthropic.

- **[azure-speech](/it/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluso in OpenClaw. Text-to-speech Azure AI Speech (MP3, note vocali Ogg/Opus native, telefonia PCM).

- **[bonjour](/it/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluso in OpenClaw. Pubblicizza il Gateway OpenClaw locale tramite Bonjour/mDNS.

- **[browser](/it/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluso in OpenClaw. Aggiunge strumenti richiamabili dall'agente.

- **[byteplus](/it/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli BytePlus, BytePlus Plan.

- **[canvas](/it/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluso in OpenClaw. Superfici sperimentali di controllo Canvas e rendering A2UI per nodi associati.

- **[codex-supervisor](/it/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - incluso in OpenClaw. Supervisiona le sessioni app-server Codex da OpenClaw.

- **[cohere](/it/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluso in OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin provider Cohere per OpenClaw.

- **[comfy](/it/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli ComfyUI.

- **[copilot-proxy](/it/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Copilot Proxy.

- **[deepgram](/it/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluso in OpenClaw. Aggiunge il supporto al provider di comprensione dei media. Aggiunge il supporto al provider di trascrizione in tempo reale.

- **[document-extract](/it/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluso in OpenClaw. Estrae testo e immagini di pagina di fallback dagli allegati di documenti locali.

- **[duckduckgo](/it/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluso in OpenClaw. Aggiunge il supporto al provider di ricerca web.

- **[elevenlabs](/it/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluso in OpenClaw. Aggiunge il supporto al provider di comprensione dei media. Aggiunge il supporto al provider di trascrizione in tempo reale. Aggiunge il supporto al provider text-to-speech.

- **[fal](/it/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli fal.

- **[file-transfer](/it/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluso in OpenClaw. Recupera, elenca e scrive file sui nodi associati tramite comandi nodo dedicati. Aggira il troncamento di stdout di bash usando base64 su node.invoke per binari fino a 16 MB.

- **[github-copilot](/it/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli GitHub Copilot.

- **[google](/it/plugins/reference/google)** (`@openclaw/google-plugin`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli Google, Google Gemini CLI, Google Vertex.

- **[huggingface](/it/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Hugging Face.

- **[imessage](/it/plugins/reference/imessage)** (`@openclaw/imessage`) - incluso in OpenClaw. Aggiunge la superficie del canale iMessage per inviare e ricevere messaggi OpenClaw.

- **[litellm](/it/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli LiteLLM.

- **[llm-task](/it/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluso in OpenClaw. Strumento LLM generico solo JSON per attività strutturate richiamabile dai workflow.

- **[lmstudio](/it/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli LM Studio.

- **[memory-core](/it/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluso in OpenClaw. Aggiunge strumenti richiamabili dall'agente.

- **[memory-wiki](/it/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluso in OpenClaw. Compilatore wiki persistente e archivio di conoscenza compatibile con Obsidian per OpenClaw.

- **[microsoft](/it/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluso in OpenClaw. Aggiunge il supporto al provider text-to-speech.

- **[microsoft-foundry](/it/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Microsoft Foundry.

- **[migrate-claude](/it/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluso in OpenClaw. Importa in OpenClaw istruzioni Claude Code e Claude Desktop, server MCP, Skills e configurazione sicura.

- **[migrate-hermes](/it/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluso in OpenClaw. Importa in OpenClaw configurazione Hermes, memorie, Skills e credenziali supportate.

- **[minimax](/it/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli MiniMax, MiniMax Portal.

- **[mistral](/it/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Mistral.

- **[novita](/it/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli Novita, Novita AI, Novitaai.

- **[nvidia](/it/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli NVIDIA.

- **[oc-path](/it/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluso in OpenClaw. Aggiunge la CLI openclaw path per l'indirizzamento dei file del workspace oc://.

- **[ollama](/it/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli Ollama, Ollama Cloud.

- **[open-prose](/it/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluso in OpenClaw. Pacchetto di skill OpenProse VM con un comando slash /prose.

- **[openai](/it/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli OpenAI.

- **[opencode](/it/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli OpenCode.

- **[opencode-go](/it/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli OpenCode Go.

- **[openrouter](/it/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli OpenRouter.

- **[policy](/it/plugins/reference/policy)** (`@openclaw/policy`) - incluso in OpenClaw. Aggiunge controlli doctor basati su policy per la conformità del workspace.

- **[runway](/it/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluso in OpenClaw. Aggiunge il supporto al provider di generazione video.

- **[senseaudio](/it/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluso in OpenClaw. Aggiunge il supporto al provider di comprensione dei media.

- **[sglang](/it/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli SGLang.

- **[synthetic](/it/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Synthetic.

- **[telegram](/it/plugins/reference/telegram)** (`@openclaw/telegram`) - incluso in OpenClaw. Aggiunge la superficie del canale Telegram per inviare e ricevere messaggi OpenClaw.

- **[together](/it/plugins/reference/together)** (`@openclaw/together-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Together.

- **[tts-local-cli](/it/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluso in OpenClaw. Aggiunge il supporto al provider text-to-speech.

- **[vllm](/it/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli vLLM.

- **[volcengine](/it/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli Volcengine, Volcengine Plan.

- **[voyage](/it/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluso in OpenClaw. Aggiunge il supporto al provider di embedding della memoria.

- **[vydra](/it/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli Vydra.

- **[web-readability](/it/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluso in OpenClaw. Estrae contenuti leggibili di articoli dalle risposte di recupero web HTML locali.

- **[webhooks](/it/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluso in OpenClaw. Webhook in ingresso autenticati che collegano automazioni esterne ai TaskFlow OpenClaw.

- **[workboard](/it/plugins/reference/workboard)** (`@openclaw/workboard`) - incluso in OpenClaw. Dashboard workboard per issue e sessioni di proprietà dell'agente.

- **[xai](/it/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto al provider di modelli xAI.

- **[xiaomi](/it/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluso in OpenClaw. Aggiunge a OpenClaw il supporto ai provider di modelli Xiaomi, Xiaomi Token Plan.

## Pacchetti esterni ufficiali

68 Plugin

- **[acpx](/it/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP OpenClaw con gestione di sessione e trasporto di proprietà del Plugin.

- **[amazon-bedrock](/it/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin provider Amazon Bedrock per OpenClaw con rilevamento dei modelli, embedding e supporto guardrail.

- **[amazon-bedrock-mantle](/it/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin provider OpenClaw Amazon Bedrock Mantle per il routing dei modelli compatibile con OpenAI.

- **[anthropic-vertex](/it/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin provider OpenClaw Anthropic Vertex per i modelli Claude su Google Vertex AI.

- **[arcee](/it/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Arcee.

- **[brave](/it/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin provider OpenClaw Brave Search per la ricerca web.

- **[cerebras](/it/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Cerebras.

- **[chutes](/it/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Chutes.

- **[clickclack](/it/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Aggiunge la superficie del canale Clickclack per inviare e ricevere messaggi OpenClaw.

- **[cloudflare-ai-gateway](/it/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Cloudflare AI Gateway.

- **[codex](/it/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin OpenClaw per harness app-server Codex e provider di modelli con un catalogo GPT gestito da Codex.

- **[copilot](/it/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra il runtime dell’agente GitHub Copilot.

- **[deepinfra](/it/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli DeepInfra.

- **[deepseek](/it/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli DeepSeek.

- **[diagnostics-otel](/it/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Esportatore OpenTelemetry per la diagnostica OpenClaw per metriche, tracce e log.

- **[diagnostics-prometheus](/it/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Esportatore Prometheus per la diagnostica OpenClaw per le metriche di runtime.

- **[diffs](/it/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin OpenClaw di visualizzazione diff in sola lettura e renderer di file per agenti.

- **[diffs-language-pack](/it/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Aggiunge l’evidenziazione della sintassi per linguaggi esterni al set predefinito del visualizzatore di diff.

- **[discord](/it/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin di canale OpenClaw Discord per canali, DM, comandi ed eventi app.

- **[exa](/it/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Aggiunge il supporto per provider di ricerca web.

- **[feishu](/it/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin di canale OpenClaw Feishu/Lark per chat e strumenti aziendali (mantenuto dalla community da @m1heng).

- **[firecrawl](/it/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Aggiunge strumenti richiamabili dagli agenti. Aggiunge il supporto per provider di recupero web. Aggiunge il supporto per provider di ricerca web.

- **[fireworks](/it/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Fireworks.

- **[gmi](/it/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin provider OpenClaw GMI Cloud.

- **[google-meet](/it/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin partecipante OpenClaw Google Meet per partecipare alle chiamate tramite trasporti Chrome o Twilio.

- **[googlechat](/it/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin di canale OpenClaw Google Chat per spazi e messaggi diretti.

- **[gradium](/it/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Aggiunge il supporto per provider di sintesi vocale.

- **[groq](/it/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Groq.

- **[inworld](/it/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Sintesi vocale in streaming Inworld (MP3, OGG_OPUS, PCM per telefonia).

- **[irc](/it/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Aggiunge la superficie del canale IRC per inviare e ricevere messaggi OpenClaw.

- **[kilocode](/it/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Kilocode.

- **[kimi](/it/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Kimi, Kimi Coding.

- **[line](/it/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin di canale OpenClaw LINE per chat LINE Bot API.

- **[llama-cpp](/it/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embedding GGUF locali tramite node-llama-cpp.

- **[lobster](/it/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin strumento di workflow Lobster per pipeline tipizzate e approvazioni riprendibili.

- **[matrix](/it/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin di canale OpenClaw Matrix per stanze e messaggi diretti.

- **[mattermost](/it/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Aggiunge la superficie del canale Mattermost per inviare e ricevere messaggi OpenClaw.

- **[memory-lancedb](/it/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin di memoria a lungo termine OpenClaw basato su LanceDB con richiamo automatico, acquisizione automatica e ricerca vettoriale.

- **[moonshot](/it/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Moonshot.

- **[msteams](/it/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin di canale OpenClaw Microsoft Teams per conversazioni bot.

- **[nextcloud-talk](/it/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin di canale OpenClaw Nextcloud Talk per conversazioni.

- **[nostr](/it/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin di canale OpenClaw Nostr per messaggi diretti cifrati NIP-04.

- **[openshell](/it/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend sandbox OpenClaw per la CLI NVIDIA OpenShell con workspace locali replicati ed esecuzione di comandi SSH.

- **[parallel](/it/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Aggiunge il supporto per provider di ricerca web.

- **[perplexity](/it/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Aggiunge il supporto per provider di ricerca web.

- **[pixverse](/it/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin provider OpenClaw PixVerse per la generazione video.

- **[qianfan](/it/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Qianfan.

- **[qqbot](/it/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin di canale OpenClaw QQ Bot per workflow di gruppo e messaggi diretti.

- **[qwen](/it/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Aggiunge a OpenClaw il supporto per provider di modelli Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI.

- **[raft](/it/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin di canale OpenClaw Raft per bridge di riattivazione CLI sicuri.

- **[searxng](/it/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Aggiunge il supporto per provider di ricerca web.

- **[signal](/it/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Aggiunge la superficie del canale Signal per inviare e ricevere messaggi OpenClaw.

- **[slack](/it/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin di canale OpenClaw Slack per canali, DM, comandi ed eventi app.

- **[sms](/it/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin di canale SMS Twilio per messaggi di testo OpenClaw.

- **[stepfun](/it/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli StepFun, StepFun Plan.

- **[synology-chat](/it/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin di canale Synology Chat per canali OpenClaw e messaggi diretti.

- **[tavily](/it/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Aggiunge strumenti richiamabili dagli agenti. Aggiunge il supporto per provider di ricerca web.

- **[tencent](/it/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Tencent TokenHub.

- **[tlon](/it/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin di canale OpenClaw Tlon/Urbit per workflow di chat.

- **[tokenjuice](/it/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compatta i risultati degli strumenti exec e bash con i riduttori tokenjuice.

- **[twitch](/it/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin di canale OpenClaw Twitch per workflow di chat e moderazione.

- **[venice](/it/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Venice.

- **[vercel-ai-gateway](/it/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Vercel AI Gateway.

- **[voice-call](/it/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin OpenClaw voice-call per chiamate telefoniche Twilio, Telnyx e Plivo.

- **[whatsapp](/it/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin di canale OpenClaw WhatsApp per chat WhatsApp Web.

- **[zai](/it/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Aggiunge a OpenClaw il supporto per il provider di modelli Z.AI.

- **[zalo](/it/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin di canale OpenClaw Zalo per chat bot e Webhook.

- **[zalouser](/it/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin OpenClaw Zalo Personal Account tramite integrazione zca-js nativa.

## Solo checkout sorgente

3 plugin

- **[qa-channel](/it/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - solo checkout sorgente. Aggiunge la superficie QA Channel per inviare e ricevere messaggi OpenClaw.

- **[qa-lab](/it/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - solo checkout sorgente. Plugin OpenClaw QA lab con interfaccia utente debugger privata e runner di scenari.

- **[qa-matrix](/it/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - solo checkout del sorgente. Runner e substrato di trasporto Matrix QA.
