---
read_when:
    - Vous décidez si un Plugin est livré dans le package npm principal ou installé séparément
    - Vous mettez à jour les métadonnées du paquet de Plugin groupé ou l’automatisation des publications
    - Vous avez besoin de la liste canonique des plugins internes et externes
summary: Inventaire généré des Plugins OpenClaw livrés dans le cœur, publiés en externe ou conservés uniquement sous forme de source
title: Inventaire des Plugins
x-i18n:
    generated_at: "2026-07-04T03:46:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventaire des Plugins

Cette page est générée à partir de `extensions/*/package.json`, `openclaw.plugin.json`,
et des exclusions `files` du package npm racine. Régénérez-la avec :

```bash
pnpm plugins:inventory:gen
```

## Définitions

- **Package npm principal :** intégré au package npm `openclaw` et disponible sans installation séparée de Plugin.
- **Package externe officiel :** Plugin maintenu par OpenClaw, omis du package npm principal, conservé dans cet inventaire officiel et installé à la demande via ClawHub et/ou npm.
- **Uniquement dans le checkout source :** Plugin local au dépôt, omis des artefacts npm publiés et non présenté comme package installable.

Les checkouts source diffèrent des installations npm : après `pnpm install`, les
Plugins intégrés se chargent depuis `extensions/<id>`, ce qui rend disponibles
les modifications locales et les dépendances d’espace de travail propres au package.

## Installer un Plugin

Utilisez la route d’installation de chaque entrée pour décider si une installation est nécessaire. Les Plugins
qui indiquent `included in OpenClaw` sont déjà présents dans le package principal.
Les packages externes officiels nécessitent une installation, puis un redémarrage du Gateway.

Par exemple, Discord est un package externe officiel :

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Pendant la bascule de lancement, les spécifications de package simples ordinaires s’installent encore depuis npm.
Utilisez `clawhub:@openclaw/discord` ou `npm:@openclaw/discord` lorsque vous avez besoin d’une
source explicite. Après l’installation, suivez la documentation de configuration du Plugin, comme
[Discord](/fr/channels/discord), pour ajouter les identifiants et la configuration du canal. Consultez
[Gérer les Plugins](/fr/plugins/manage-plugins) pour les commandes de mise à jour, de désinstallation et de publication.

Chaque entrée liste le package, la route de distribution et la description.

## Package npm principal

60 Plugins

- **[admin-http-rpc](/fr/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - inclus dans OpenClaw. Point de terminaison RPC HTTP d’administration OpenClaw.

- **[alibaba](/fr/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de génération vidéo.

- **[anthropic](/fr/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Anthropic.

- **[azure-speech](/fr/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - inclus dans OpenClaw. Synthèse vocale Azure AI Speech (MP3, notes vocales Ogg/Opus natives, téléphonie PCM).

- **[bonjour](/fr/plugins/reference/bonjour)** (`@openclaw/bonjour`) - inclus dans OpenClaw. Annonce le Gateway OpenClaw local via Bonjour/mDNS.

- **[browser](/fr/plugins/reference/browser)** (`@openclaw/browser-plugin`) - inclus dans OpenClaw. Ajoute des outils appelables par l’agent.

- **[byteplus](/fr/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles BytePlus et BytePlus Plan.

- **[canvas](/fr/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - inclus dans OpenClaw. Surfaces expérimentales de contrôle Canvas et de rendu A2UI pour les nœuds appairés.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles ClawRouter.

- **[codex-supervisor](/fr/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - inclus dans OpenClaw. Supervise les sessions de serveur d’application Codex depuis OpenClaw.

- **[cohere](/fr/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - inclus dans OpenClaw ; npm ; ClawHub : `clawhub:@openclaw/cohere-provider`. Plugin de fournisseur Cohere OpenClaw.

- **[comfy](/fr/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles ComfyUI.

- **[copilot-proxy](/fr/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Copilot Proxy.

- **[deepgram](/fr/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension multimédia. Ajoute la prise en charge du fournisseur de transcription en temps réel.

- **[document-extract](/fr/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - inclus dans OpenClaw. Extrait du texte et, en secours, des images de pages depuis des pièces jointes de documents locales.

- **[duckduckgo](/fr/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de recherche Web.

- **[elevenlabs](/fr/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension multimédia. Ajoute la prise en charge du fournisseur de transcription en temps réel. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[fal](/fr/plugins/reference/fal)** (`@openclaw/fal-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles fal.

- **[file-transfer](/fr/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - inclus dans OpenClaw. Récupérez, listez et écrivez des fichiers sur des nœuds appairés via des commandes de nœud dédiées. Contourne la troncature stdout de bash en utilisant base64 via node.invoke pour les binaires jusqu’à 16 Mo.

- **[github-copilot](/fr/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles GitHub Copilot.

- **[google](/fr/plugins/reference/google)** (`@openclaw/google-plugin`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Google, Google Gemini CLI et Google Vertex.

- **[huggingface](/fr/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Hugging Face.

- **[imessage](/fr/plugins/reference/imessage)** (`@openclaw/imessage`) - inclus dans OpenClaw. Ajoute la surface de canal iMessage pour envoyer et recevoir des messages OpenClaw.

- **[litellm](/fr/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles LiteLLM.

- **[llm-task](/fr/plugins/reference/llm-task)** (`@openclaw/llm-task`) - inclus dans OpenClaw. Outil LLM générique uniquement JSON pour les tâches structurées appelables depuis les workflows.

- **[lmstudio](/fr/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles LM Studio.

- **[memory-core](/fr/plugins/reference/memory-core)** (`@openclaw/memory-core`) - inclus dans OpenClaw. Ajoute des outils appelables par l’agent.

- **[memory-wiki](/fr/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - inclus dans OpenClaw. Compilateur wiki persistant et coffre de connaissances compatible Obsidian pour OpenClaw.

- **[microsoft](/fr/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[microsoft-foundry](/fr/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Microsoft Foundry.

- **[migrate-claude](/fr/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - inclus dans OpenClaw. Importe dans OpenClaw les instructions Claude Code et Claude Desktop, les serveurs MCP, les Skills et la configuration sûre.

- **[migrate-hermes](/fr/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - inclus dans OpenClaw. Importe dans OpenClaw la configuration Hermes, les mémoires, les Skills et les identifiants pris en charge.

- **[minimax](/fr/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles MiniMax et MiniMax Portal.

- **[mistral](/fr/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Mistral.

- **[novita](/fr/plugins/reference/novita)** (`@openclaw/novita-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Novita, Novita AI et Novitaai.

- **[nvidia](/fr/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles NVIDIA.

- **[oc-path](/fr/plugins/reference/oc-path)** (`@openclaw/oc-path`) - inclus dans OpenClaw. Ajoute la CLI de chemin openclaw pour l’adressage de fichiers d’espace de travail oc://.

- **[ollama](/fr/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Ollama et Ollama Cloud.

- **[open-prose](/fr/plugins/reference/open-prose)** (`@openclaw/open-prose`) - inclus dans OpenClaw. Pack de Skills VM OpenProse avec une commande slash /prose.

- **[openai](/fr/plugins/reference/openai)** (`@openclaw/openai-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenAI.

- **[opencode](/fr/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenCode.

- **[opencode-go](/fr/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenCode Go.

- **[openrouter](/fr/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenRouter.

- **[policy](/fr/plugins/reference/policy)** (`@openclaw/policy`) - inclus dans OpenClaw. Ajoute des vérifications doctor adossées à une stratégie pour la conformité de l’espace de travail.

- **[runway](/fr/plugins/reference/runway)** (`@openclaw/runway-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de génération vidéo.

- **[senseaudio](/fr/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension multimédia.

- **[sglang](/fr/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles SGLang.

- **[synthetic](/fr/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Synthetic.

- **[telegram](/fr/plugins/reference/telegram)** (`@openclaw/telegram`) - inclus dans OpenClaw. Ajoute la surface de canal Telegram pour envoyer et recevoir des messages OpenClaw.

- **[together](/fr/plugins/reference/together)** (`@openclaw/together-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Together.

- **[tts-local-cli](/fr/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[vllm](/fr/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles vLLM.

- **[volcengine](/fr/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Volcengine et Volcengine Plan.

- **[voyage](/fr/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur d’embeddings mémoire.

- **[vydra](/fr/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Vydra.

- **[web-readability](/fr/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - inclus dans OpenClaw. Extrait le contenu lisible d’articles depuis des réponses locales de récupération Web HTML.

- **[webhooks](/fr/plugins/reference/webhooks)** (`@openclaw/webhooks`) - inclus dans OpenClaw. Webhooks entrants authentifiés qui lient l’automatisation externe aux TaskFlows OpenClaw.

- **[workboard](/fr/plugins/reference/workboard)** (`@openclaw/workboard`) - inclus dans OpenClaw. Tableau de bord de travail pour les issues et sessions détenues par l’agent.

- **[xai](/fr/plugins/reference/xai)** (`@openclaw/xai-plugin`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles xAI.

- **[xiaomi](/fr/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Xiaomi et Xiaomi Token Plan.

## Packages externes officiels

68 Plugins

- **[acpx](/fr/plugins/reference/acpx)** (`@openclaw/acpx`) - npm ; ClawHub. Backend d’exécution ACP OpenClaw avec gestion des sessions et du transport détenue par le Plugin.

- **[amazon-bedrock](/fr/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm ; ClawHub. Plugin de fournisseur Amazon Bedrock OpenClaw avec découverte de modèles, embeddings et prise en charge des garde-fous.

- **[amazon-bedrock-mantle](/fr/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm ; ClawHub. Plugin de fournisseur OpenClaw Amazon Bedrock Mantle pour le routage de modèles compatible OpenAI.

- **[anthropic-vertex](/fr/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm ; ClawHub. Plugin de fournisseur OpenClaw Anthropic Vertex pour les modèles Claude sur Google Vertex AI.

- **[arcee](/fr/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm ; ClawHub : `clawhub:@openclaw/arcee-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Arcee.

- **[brave](/fr/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm ; ClawHub. Plugin de fournisseur OpenClaw Brave Search pour la recherche web.

- **[cerebras](/fr/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm ; ClawHub : `clawhub:@openclaw/cerebras-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Cerebras.

- **[chutes](/fr/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm ; ClawHub : `clawhub:@openclaw/chutes-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Chutes.

- **[clickclack](/fr/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm ; ClawHub : `clawhub:@openclaw/clickclack`. Ajoute la surface de canal Clickclack pour envoyer et recevoir des messages OpenClaw.

- **[cloudflare-ai-gateway](/fr/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Cloudflare AI Gateway.

- **[codex](/fr/plugins/reference/codex)** (`@openclaw/codex`) - npm ; ClawHub. Plugin de harnais serveur d’application OpenClaw Codex et de fournisseur de modèles avec un catalogue GPT géré par Codex.

- **[copilot](/fr/plugins/reference/copilot)** (`@openclaw/copilot`) - npm ; ClawHub : `clawhub:@openclaw/copilot`. Enregistre le runtime d’agent GitHub Copilot.

- **[deepinfra](/fr/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepinfra-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles DeepInfra.

- **[deepseek](/fr/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepseek-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles DeepSeek.

- **[diagnostics-otel](/fr/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-otel`. Exportateur de diagnostics OpenClaw OpenTelemetry pour les métriques, les traces et les journaux.

- **[diagnostics-prometheus](/fr/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-prometheus`. Exportateur de diagnostics OpenClaw Prometheus pour les métriques de runtime.

- **[diffs](/fr/plugins/reference/diffs)** (`@openclaw/diffs`) - npm ; ClawHub. Plugin OpenClaw de visualisation de diff en lecture seule et moteur de rendu de fichiers pour agents.

- **[diffs-language-pack](/fr/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm ; ClawHub : `clawhub:@openclaw/diffs-language-pack`. Ajoute la coloration syntaxique pour les langages hors de l’ensemble par défaut de la visionneuse de diffs.

- **[discord](/fr/plugins/reference/discord)** (`@openclaw/discord`) - npm ; ClawHub. Plugin de canal OpenClaw Discord pour les canaux, les messages privés, les commandes et les événements d’application.

- **[exa](/fr/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm ; ClawHub : `clawhub:@openclaw/exa-plugin`. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[feishu](/fr/plugins/reference/feishu)** (`@openclaw/feishu`) - npm ; ClawHub. Plugin de canal OpenClaw Feishu/Lark pour les discussions et les outils de travail (maintenu par la communauté par @m1heng).

- **[firecrawl](/fr/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm ; ClawHub : `clawhub:@openclaw/firecrawl-plugin`. Ajoute des outils appelables par les agents. Ajoute la prise en charge d’un fournisseur de récupération web. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[fireworks](/fr/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm ; ClawHub : `clawhub:@openclaw/fireworks-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Fireworks.

- **[gmi](/fr/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm ; ClawHub : `clawhub:@openclaw/gmi-provider`. Plugin de fournisseur OpenClaw GMI Cloud.

- **[google-meet](/fr/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm ; ClawHub. Plugin de participant OpenClaw Google Meet pour rejoindre des appels via les transports Chrome ou Twilio.

- **[googlechat](/fr/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm ; ClawHub. Plugin de canal OpenClaw Google Chat pour les espaces et les messages directs.

- **[gradium](/fr/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm ; ClawHub : `clawhub:@openclaw/gradium-speech`. Ajoute la prise en charge d’un fournisseur de synthèse vocale.

- **[groq](/fr/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm ; ClawHub : `clawhub:@openclaw/groq-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Groq.

- **[inworld](/fr/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm ; ClawHub : `clawhub:@openclaw/inworld-speech`. Synthèse vocale en streaming Inworld (MP3, OGG_OPUS, PCM téléphonie).

- **[irc](/fr/plugins/reference/irc)** (`@openclaw/irc`) - npm ; ClawHub : `clawhub:@openclaw/irc`. Ajoute la surface de canal IRC pour envoyer et recevoir des messages OpenClaw.

- **[kilocode](/fr/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm ; ClawHub : `clawhub:@openclaw/kilocode-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Kilocode.

- **[kimi](/fr/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm ; ClawHub : `clawhub:@openclaw/kimi-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Kimi, Kimi Coding.

- **[line](/fr/plugins/reference/line)** (`@openclaw/line`) - npm ; ClawHub. Plugin de canal OpenClaw LINE pour les discussions LINE Bot API.

- **[llama-cpp](/fr/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm ; ClawHub. Embeddings GGUF locaux via node-llama-cpp.

- **[lobster](/fr/plugins/reference/lobster)** (`@openclaw/lobster`) - npm ; ClawHub. Plugin d’outil de workflow Lobster pour les pipelines typés et les approbations reprenables.

- **[matrix](/fr/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub : `clawhub:@openclaw/matrix` ; npm. Plugin de canal OpenClaw Matrix pour les salons et les messages directs.

- **[mattermost](/fr/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm ; ClawHub : `clawhub:@openclaw/mattermost`. Ajoute la surface de canal Mattermost pour envoyer et recevoir des messages OpenClaw.

- **[memory-lancedb](/fr/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm ; ClawHub. Plugin de mémoire à long terme OpenClaw adossé à LanceDB, avec rappel automatique, capture automatique et recherche vectorielle.

- **[moonshot](/fr/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm ; ClawHub : `clawhub:@openclaw/moonshot-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Moonshot.

- **[msteams](/fr/plugins/reference/msteams)** (`@openclaw/msteams`) - npm ; ClawHub. Plugin de canal OpenClaw Microsoft Teams pour les conversations de bot.

- **[nextcloud-talk](/fr/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm ; ClawHub. Plugin de canal OpenClaw Nextcloud Talk pour les conversations.

- **[nostr](/fr/plugins/reference/nostr)** (`@openclaw/nostr`) - npm ; ClawHub. Plugin de canal OpenClaw Nostr pour les messages directs chiffrés NIP-04.

- **[openshell](/fr/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm ; ClawHub. Backend de bac à sable OpenClaw pour la CLI NVIDIA OpenShell avec espaces de travail locaux en miroir et exécution de commandes SSH.

- **[parallel](/fr/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm ; ClawHub : `clawhub:@openclaw/parallel-plugin`. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[perplexity](/fr/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm ; ClawHub : `clawhub:@openclaw/perplexity-plugin`. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[pixverse](/fr/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm ; ClawHub : `clawhub:@openclaw/pixverse-provider`. Plugin de fournisseur OpenClaw PixVerse pour la génération vidéo.

- **[qianfan](/fr/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm ; ClawHub : `clawhub:@openclaw/qianfan-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Qianfan.

- **[qqbot](/fr/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm ; ClawHub. Plugin de canal OpenClaw QQ Bot pour les workflows de groupe et de messages directs.

- **[qwen](/fr/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm ; ClawHub : `clawhub:@openclaw/qwen-provider`. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI.

- **[raft](/fr/plugins/reference/raft)** (`@openclaw/raft`) - npm ; ClawHub. Plugin de canal OpenClaw Raft pour des ponts de réveil CLI sécurisés.

- **[searxng](/fr/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm ; ClawHub : `clawhub:@openclaw/searxng-plugin`. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[signal](/fr/plugins/reference/signal)** (`@openclaw/signal`) - npm ; ClawHub : `clawhub:@openclaw/signal`. Ajoute la surface de canal Signal pour envoyer et recevoir des messages OpenClaw.

- **[slack](/fr/plugins/reference/slack)** (`@openclaw/slack`) - npm ; ClawHub. Plugin de canal OpenClaw Slack pour les canaux, les messages privés, les commandes et les événements d’application.

- **[sms](/fr/plugins/reference/sms)** (`@openclaw/sms`) - npm ; ClawHub : `clawhub:@openclaw/sms`. Plugin de canal SMS Twilio pour les messages texte OpenClaw.

- **[stepfun](/fr/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm ; ClawHub : `clawhub:@openclaw/stepfun-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles StepFun, StepFun Plan.

- **[synology-chat](/fr/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm ; ClawHub. Plugin de canal Synology Chat pour les canaux OpenClaw et les messages directs.

- **[tavily](/fr/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm ; ClawHub : `clawhub:@openclaw/tavily-plugin`. Ajoute des outils appelables par les agents. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[tencent](/fr/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm ; ClawHub : `clawhub:@openclaw/tencent-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Tencent TokenHub.

- **[tlon](/fr/plugins/reference/tlon)** (`@openclaw/tlon`) - npm ; ClawHub. Plugin de canal OpenClaw Tlon/Urbit pour les workflows de discussion.

- **[tokenjuice](/fr/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm ; ClawHub : `clawhub:@openclaw/tokenjuice`. Compacte les résultats des outils exec et bash avec des réducteurs tokenjuice.

- **[twitch](/fr/plugins/reference/twitch)** (`@openclaw/twitch`) - npm ; ClawHub. Plugin de canal OpenClaw Twitch pour les workflows de discussion et de modération.

- **[venice](/fr/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm ; ClawHub : `clawhub:@openclaw/venice-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Venice.

- **[vercel-ai-gateway](/fr/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/vercel-ai-gateway-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Vercel AI Gateway.

- **[voice-call](/fr/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm ; ClawHub. Plugin OpenClaw voice-call pour les appels téléphoniques Twilio, Telnyx et Plivo.

- **[whatsapp](/fr/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub : `clawhub:@openclaw/whatsapp` ; npm. Plugin de canal OpenClaw WhatsApp pour les discussions WhatsApp Web.

- **[zai](/fr/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm ; ClawHub : `clawhub:@openclaw/zai-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Z.AI.

- **[zalo](/fr/plugins/reference/zalo)** (`@openclaw/zalo`) - npm ; ClawHub. Plugin de canal OpenClaw Zalo pour les discussions de bot et de Webhook.

- **[zalouser](/fr/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm ; ClawHub. Plugin de compte personnel OpenClaw Zalo via l’intégration native zca-js.

## Checkout source uniquement

3 Plugins

- **[qa-channel](/fr/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - checkout source uniquement. Ajoute la surface QA Channel pour envoyer et recevoir des messages OpenClaw.

- **[qa-lab](/fr/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - checkout source uniquement. Plugin de labo QA OpenClaw avec interface de débogage privée et exécuteur de scénarios.

- **[matrice QA](/fr/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - dépôt source uniquement. Exécuteur et substrat de transport de matrice QA.
