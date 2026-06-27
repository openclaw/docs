---
read_when:
    - Vous décidez si un Plugin est livré dans le paquet npm principal ou s’installe séparément
    - Vous mettez à jour les métadonnées des packages de Plugin intégrés ou l’automatisation des releases
    - Vous avez besoin de la liste canonique des Plugins internes et externes
summary: Inventaire généré des plugins OpenClaw livrés dans le noyau, publiés en externe ou conservés uniquement en source
title: Inventaire des Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventaire des Plugins

Cette page est générée à partir de `extensions/*/package.json`, `openclaw.plugin.json`
et des exclusions `files` du package npm racine. Régénérez-la avec :

```bash
pnpm plugins:inventory:gen
```

## Définitions

- **Package npm du noyau :** intégré au package npm `openclaw` et disponible sans installation séparée de Plugin.
- **Package externe officiel :** Plugin maintenu par OpenClaw, omis du package npm du noyau, conservé dans cet inventaire officiel et installé à la demande via ClawHub et/ou npm.
- **Uniquement dans le checkout source :** Plugin local au dépôt, omis des artefacts npm publiés et non annoncé comme package installable.

Les checkouts source diffèrent des installations npm : après `pnpm install`, les Plugins
groupés se chargent depuis `extensions/<id>`, ce qui rend disponibles les modifications locales et les dépendances d’espace de travail propres au package.

## Installer un Plugin

Utilisez la voie d’installation de chaque entrée pour décider si une installation est nécessaire. Les Plugins
qui indiquent `included in OpenClaw` sont déjà présents dans le package du noyau.
Les packages externes officiels nécessitent une installation, puis un redémarrage du Gateway.

Par exemple, Discord est un package externe officiel :

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Pendant la bascule de lancement, les spécifications ordinaires de packages nus s’installent encore depuis npm.
Utilisez `clawhub:@openclaw/discord` ou `npm:@openclaw/discord` lorsque vous avez besoin d’une
source explicite. Après l’installation, suivez la documentation de configuration du Plugin, comme
[Discord](/fr/channels/discord), pour ajouter les identifiants et la configuration du canal. Voir
[Gérer les Plugins](/fr/plugins/manage-plugins) pour les commandes de mise à jour, de désinstallation et de publication.

Chaque entrée liste le package, la voie de distribution et la description.

## Package npm du noyau

59 Plugins

- **[admin-http-rpc](/fr/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - inclus dans OpenClaw. Point de terminaison RPC HTTP d’administration OpenClaw.

- **[alibaba](/fr/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de génération vidéo.

- **[anthropic](/fr/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Anthropic à OpenClaw.

- **[azure-speech](/fr/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - inclus dans OpenClaw. Synthèse vocale Azure AI Speech (MP3, notes vocales Ogg/Opus natives, téléphonie PCM).

- **[bonjour](/fr/plugins/reference/bonjour)** (`@openclaw/bonjour`) - inclus dans OpenClaw. Annonce le Gateway OpenClaw local via Bonjour/mDNS.

- **[browser](/fr/plugins/reference/browser)** (`@openclaw/browser-plugin`) - inclus dans OpenClaw. Ajoute des outils appelables par l’agent.

- **[byteplus](/fr/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles BytePlus et BytePlus Plan à OpenClaw.

- **[canvas](/fr/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - inclus dans OpenClaw. Surfaces expérimentales de contrôle Canvas et de rendu A2UI pour nœuds appairés.

- **[codex-supervisor](/fr/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - inclus dans OpenClaw. Superviser les sessions du serveur d’application Codex depuis OpenClaw.

- **[cohere](/fr/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - inclus dans OpenClaw ; npm ; ClawHub : `clawhub:@openclaw/cohere-provider`. Plugin de fournisseur Cohere OpenClaw.

- **[comfy](/fr/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles ComfyUI à OpenClaw.

- **[copilot-proxy](/fr/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Copilot Proxy à OpenClaw.

- **[deepgram](/fr/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension des médias. Ajoute la prise en charge du fournisseur de transcription en temps réel.

- **[document-extract](/fr/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - inclus dans OpenClaw. Extrait le texte et des images de page de secours à partir de pièces jointes de documents locaux.

- **[duckduckgo](/fr/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de recherche web.

- **[elevenlabs](/fr/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension des médias. Ajoute la prise en charge du fournisseur de transcription en temps réel. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[fal](/fr/plugins/reference/fal)** (`@openclaw/fal-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles fal à OpenClaw.

- **[file-transfer](/fr/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - inclus dans OpenClaw. Récupérez, listez et écrivez des fichiers sur des nœuds appairés via des commandes de nœud dédiées. Contourne la troncature de stdout bash en utilisant base64 via node.invoke pour les binaires jusqu’à 16 Mo.

- **[github-copilot](/fr/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles GitHub Copilot à OpenClaw.

- **[google](/fr/plugins/reference/google)** (`@openclaw/google-plugin`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles Google, Google Gemini CLI et Google Vertex à OpenClaw.

- **[huggingface](/fr/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Hugging Face à OpenClaw.

- **[imessage](/fr/plugins/reference/imessage)** (`@openclaw/imessage`) - inclus dans OpenClaw. Ajoute la surface de canal iMessage pour envoyer et recevoir des messages OpenClaw.

- **[litellm](/fr/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles LiteLLM à OpenClaw.

- **[llm-task](/fr/plugins/reference/llm-task)** (`@openclaw/llm-task`) - inclus dans OpenClaw. Outil LLM générique uniquement JSON pour tâches structurées appelables depuis les workflows.

- **[lmstudio](/fr/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles LM Studio à OpenClaw.

- **[memory-core](/fr/plugins/reference/memory-core)** (`@openclaw/memory-core`) - inclus dans OpenClaw. Ajoute des outils appelables par l’agent.

- **[memory-wiki](/fr/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - inclus dans OpenClaw. Compilateur wiki persistant et coffre de connaissances compatible avec Obsidian pour OpenClaw.

- **[microsoft](/fr/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[microsoft-foundry](/fr/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Microsoft Foundry à OpenClaw.

- **[migrate-claude](/fr/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - inclus dans OpenClaw. Importe les instructions, serveurs MCP, skills et la configuration sûre de Claude Code et Claude Desktop dans OpenClaw.

- **[migrate-hermes](/fr/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - inclus dans OpenClaw. Importe la configuration, les mémoires, les skills et les identifiants pris en charge de Hermes dans OpenClaw.

- **[minimax](/fr/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles MiniMax et MiniMax Portal à OpenClaw.

- **[mistral](/fr/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Mistral à OpenClaw.

- **[novita](/fr/plugins/reference/novita)** (`@openclaw/novita-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles Novita, Novita AI et Novitaai à OpenClaw.

- **[nvidia](/fr/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles NVIDIA à OpenClaw.

- **[oc-path](/fr/plugins/reference/oc-path)** (`@openclaw/oc-path`) - inclus dans OpenClaw. Ajoute la CLI de chemin openclaw pour l’adressage de fichiers d’espace de travail oc://.

- **[ollama](/fr/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles Ollama et Ollama Cloud à OpenClaw.

- **[open-prose](/fr/plugins/reference/open-prose)** (`@openclaw/open-prose`) - inclus dans OpenClaw. Pack de Skills OpenProse VM avec une commande slash /prose.

- **[openai](/fr/plugins/reference/openai)** (`@openclaw/openai-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles OpenAI à OpenClaw.

- **[opencode](/fr/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles OpenCode à OpenClaw.

- **[opencode-go](/fr/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles OpenCode Go à OpenClaw.

- **[openrouter](/fr/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles OpenRouter à OpenClaw.

- **[policy](/fr/plugins/reference/policy)** (`@openclaw/policy`) - inclus dans OpenClaw. Ajoute des contrôles doctor fondés sur des politiques pour la conformité de l’espace de travail.

- **[runway](/fr/plugins/reference/runway)** (`@openclaw/runway-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de génération vidéo.

- **[senseaudio](/fr/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de compréhension des médias.

- **[sglang](/fr/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles SGLang à OpenClaw.

- **[synthetic](/fr/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Synthetic à OpenClaw.

- **[telegram](/fr/plugins/reference/telegram)** (`@openclaw/telegram`) - inclus dans OpenClaw. Ajoute la surface de canal Telegram pour envoyer et recevoir des messages OpenClaw.

- **[together](/fr/plugins/reference/together)** (`@openclaw/together-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Together à OpenClaw.

- **[tts-local-cli](/fr/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[vllm](/fr/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles vLLM à OpenClaw.

- **[volcengine](/fr/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles Volcengine et Volcengine Plan à OpenClaw.

- **[voyage](/fr/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur d’embeddings de mémoire.

- **[vydra](/fr/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles Vydra à OpenClaw.

- **[web-readability](/fr/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - inclus dans OpenClaw. Extrait le contenu lisible d’articles à partir de réponses locales de récupération web HTML.

- **[webhooks](/fr/plugins/reference/webhooks)** (`@openclaw/webhooks`) - inclus dans OpenClaw. Webhooks entrants authentifiés qui lient l’automatisation externe aux TaskFlows OpenClaw.

- **[workboard](/fr/plugins/reference/workboard)** (`@openclaw/workboard`) - inclus dans OpenClaw. Tableau de travail de type tableau de bord pour les issues et sessions possédées par l’agent.

- **[xai](/fr/plugins/reference/xai)** (`@openclaw/xai-plugin`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de modèles xAI à OpenClaw.

- **[xiaomi](/fr/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - inclus dans OpenClaw. Ajoute la prise en charge des fournisseurs de modèles Xiaomi et Xiaomi Token Plan à OpenClaw.

## Packages externes officiels

68 Plugins

- **[acpx](/fr/plugins/reference/acpx)** (`@openclaw/acpx`) - npm ; ClawHub. Backend d’exécution ACP OpenClaw avec gestion des sessions et des transports détenue par le Plugin.

- **[amazon-bedrock](/fr/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm ; ClawHub. Plugin de fournisseur Amazon Bedrock OpenClaw avec découverte des modèles, embeddings et prise en charge des garde-fous.

- **[amazon-bedrock-mantle](/fr/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm ; ClawHub. Plugin fournisseur OpenClaw Amazon Bedrock Mantle pour le routage de modèles compatible OpenAI.

- **[anthropic-vertex](/fr/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm ; ClawHub. Plugin fournisseur OpenClaw Anthropic Vertex pour les modèles Claude sur Google Vertex AI.

- **[arcee](/fr/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm ; ClawHub : `clawhub:@openclaw/arcee-provider`. Ajoute la prise en charge du fournisseur de modèles Arcee à OpenClaw.

- **[brave](/fr/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm ; ClawHub. Plugin fournisseur OpenClaw Brave Search pour la recherche web.

- **[cerebras](/fr/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm ; ClawHub : `clawhub:@openclaw/cerebras-provider`. Ajoute la prise en charge du fournisseur de modèles Cerebras à OpenClaw.

- **[chutes](/fr/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm ; ClawHub : `clawhub:@openclaw/chutes-provider`. Ajoute la prise en charge du fournisseur de modèles Chutes à OpenClaw.

- **[clickclack](/fr/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm ; ClawHub : `clawhub:@openclaw/clickclack`. Ajoute la surface de canal Clickclack pour envoyer et recevoir des messages OpenClaw.

- **[cloudflare-ai-gateway](/fr/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Ajoute la prise en charge du fournisseur de modèles Cloudflare AI Gateway à OpenClaw.

- **[codex](/fr/plugins/reference/codex)** (`@openclaw/codex`) - npm ; ClawHub. Harnais de serveur d’application OpenClaw Codex et Plugin fournisseur de modèles avec un catalogue GPT géré par Codex.

- **[copilot](/fr/plugins/reference/copilot)** (`@openclaw/copilot`) - npm ; ClawHub : `clawhub:@openclaw/copilot`. Enregistre le runtime d’agent GitHub Copilot.

- **[deepinfra](/fr/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepinfra-provider`. Ajoute la prise en charge du fournisseur de modèles DeepInfra à OpenClaw.

- **[deepseek](/fr/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepseek-provider`. Ajoute la prise en charge du fournisseur de modèles DeepSeek à OpenClaw.

- **[diagnostics-otel](/fr/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-otel`. Exportateur de diagnostics OpenClaw OpenTelemetry pour les métriques, les traces et les journaux.

- **[diagnostics-prometheus](/fr/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-prometheus`. Exportateur de diagnostics OpenClaw Prometheus pour les métriques d’exécution.

- **[diffs](/fr/plugins/reference/diffs)** (`@openclaw/diffs`) - npm ; ClawHub. Plugin OpenClaw de visualisation de diff en lecture seule et de rendu de fichiers pour les agents.

- **[diffs-language-pack](/fr/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm ; ClawHub : `clawhub:@openclaw/diffs-language-pack`. Ajoute la coloration syntaxique pour les langages hors de l’ensemble par défaut du visualiseur de diffs.

- **[discord](/fr/plugins/reference/discord)** (`@openclaw/discord`) - npm ; ClawHub. Plugin de canal OpenClaw Discord pour les canaux, les messages privés, les commandes et les événements d’application.

- **[exa](/fr/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm ; ClawHub : `clawhub:@openclaw/exa-plugin`. Ajoute la prise en charge du fournisseur de recherche web.

- **[feishu](/fr/plugins/reference/feishu)** (`@openclaw/feishu`) - npm ; ClawHub. Plugin de canal OpenClaw Feishu/Lark pour les discussions et les outils de travail (maintenu par la communauté par @m1heng).

- **[firecrawl](/fr/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm ; ClawHub : `clawhub:@openclaw/firecrawl-plugin`. Ajoute des outils appelables par les agents. Ajoute la prise en charge du fournisseur de récupération web. Ajoute la prise en charge du fournisseur de recherche web.

- **[fireworks](/fr/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm ; ClawHub : `clawhub:@openclaw/fireworks-provider`. Ajoute la prise en charge du fournisseur de modèles Fireworks à OpenClaw.

- **[gmi](/fr/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm ; ClawHub : `clawhub:@openclaw/gmi-provider`. Plugin fournisseur OpenClaw GMI Cloud.

- **[google-meet](/fr/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm ; ClawHub. Plugin participant OpenClaw Google Meet pour rejoindre des appels via les transports Chrome ou Twilio.

- **[googlechat](/fr/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm ; ClawHub. Plugin de canal OpenClaw Google Chat pour les espaces et les messages directs.

- **[gradium](/fr/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm ; ClawHub : `clawhub:@openclaw/gradium-speech`. Ajoute la prise en charge du fournisseur de synthèse vocale.

- **[groq](/fr/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm ; ClawHub : `clawhub:@openclaw/groq-provider`. Ajoute la prise en charge du fournisseur de modèles Groq à OpenClaw.

- **[inworld](/fr/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm ; ClawHub : `clawhub:@openclaw/inworld-speech`. Synthèse vocale en streaming Inworld (MP3, OGG_OPUS, PCM téléphonie).

- **[irc](/fr/plugins/reference/irc)** (`@openclaw/irc`) - npm ; ClawHub : `clawhub:@openclaw/irc`. Ajoute la surface de canal IRC pour envoyer et recevoir des messages OpenClaw.

- **[kilocode](/fr/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm ; ClawHub : `clawhub:@openclaw/kilocode-provider`. Ajoute la prise en charge du fournisseur de modèles Kilocode à OpenClaw.

- **[kimi](/fr/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm ; ClawHub : `clawhub:@openclaw/kimi-provider`. Ajoute la prise en charge du fournisseur de modèles Kimi, Kimi Coding à OpenClaw.

- **[line](/fr/plugins/reference/line)** (`@openclaw/line`) - npm ; ClawHub. Plugin de canal OpenClaw LINE pour les discussions LINE Bot API.

- **[llama-cpp](/fr/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm ; ClawHub. Embeddings GGUF locaux via node-llama-cpp.

- **[lobster](/fr/plugins/reference/lobster)** (`@openclaw/lobster`) - npm ; ClawHub. Plugin d’outil de workflow Lobster pour des pipelines typés et des approbations reprenables.

- **[matrix](/fr/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub : `clawhub:@openclaw/matrix` ; npm. Plugin de canal OpenClaw Matrix pour les salons et les messages directs.

- **[mattermost](/fr/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm ; ClawHub : `clawhub:@openclaw/mattermost`. Ajoute la surface de canal Mattermost pour envoyer et recevoir des messages OpenClaw.

- **[memory-lancedb](/fr/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm ; ClawHub. Plugin de mémoire à long terme OpenClaw adossé à LanceDB, avec rappel automatique, capture automatique et recherche vectorielle.

- **[moonshot](/fr/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm ; ClawHub : `clawhub:@openclaw/moonshot-provider`. Ajoute la prise en charge du fournisseur de modèles Moonshot à OpenClaw.

- **[msteams](/fr/plugins/reference/msteams)** (`@openclaw/msteams`) - npm ; ClawHub. Plugin de canal OpenClaw Microsoft Teams pour les conversations de bot.

- **[nextcloud-talk](/fr/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm ; ClawHub. Plugin de canal OpenClaw Nextcloud Talk pour les conversations.

- **[nostr](/fr/plugins/reference/nostr)** (`@openclaw/nostr`) - npm ; ClawHub. Plugin de canal OpenClaw Nostr pour les messages directs chiffrés NIP-04.

- **[openshell](/fr/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm ; ClawHub. Backend sandbox OpenClaw pour la CLI NVIDIA OpenShell, avec espaces de travail locaux en miroir et exécution de commandes SSH.

- **[parallel](/fr/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm ; ClawHub : `clawhub:@openclaw/parallel-plugin`. Ajoute la prise en charge du fournisseur de recherche web.

- **[perplexity](/fr/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm ; ClawHub : `clawhub:@openclaw/perplexity-plugin`. Ajoute la prise en charge du fournisseur de recherche web.

- **[pixverse](/fr/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm ; ClawHub : `clawhub:@openclaw/pixverse-provider`. Plugin fournisseur OpenClaw PixVerse de génération vidéo.

- **[qianfan](/fr/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm ; ClawHub : `clawhub:@openclaw/qianfan-provider`. Ajoute la prise en charge du fournisseur de modèles Qianfan à OpenClaw.

- **[qqbot](/fr/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm ; ClawHub. Plugin de canal OpenClaw QQ Bot pour les workflows de groupe et de messages directs.

- **[qwen](/fr/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm ; ClawHub : `clawhub:@openclaw/qwen-provider`. Ajoute la prise en charge du fournisseur de modèles Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI à OpenClaw.

- **[raft](/fr/plugins/reference/raft)** (`@openclaw/raft`) - npm ; ClawHub. Plugin de canal OpenClaw Raft pour des ponts de réveil CLI sécurisés.

- **[searxng](/fr/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm ; ClawHub : `clawhub:@openclaw/searxng-plugin`. Ajoute la prise en charge du fournisseur de recherche web.

- **[signal](/fr/plugins/reference/signal)** (`@openclaw/signal`) - npm ; ClawHub : `clawhub:@openclaw/signal`. Ajoute la surface de canal Signal pour envoyer et recevoir des messages OpenClaw.

- **[slack](/fr/plugins/reference/slack)** (`@openclaw/slack`) - npm ; ClawHub. Plugin de canal OpenClaw Slack pour les canaux, les messages privés, les commandes et les événements d’application.

- **[sms](/fr/plugins/reference/sms)** (`@openclaw/sms`) - npm ; ClawHub : `clawhub:@openclaw/sms`. Plugin de canal Twilio SMS pour les messages texte OpenClaw.

- **[stepfun](/fr/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm ; ClawHub : `clawhub:@openclaw/stepfun-provider`. Ajoute la prise en charge du fournisseur de modèles StepFun, StepFun Plan à OpenClaw.

- **[synology-chat](/fr/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm ; ClawHub. Plugin de canal Synology Chat pour les canaux OpenClaw et les messages directs.

- **[tavily](/fr/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm ; ClawHub : `clawhub:@openclaw/tavily-plugin`. Ajoute des outils appelables par les agents. Ajoute la prise en charge du fournisseur de recherche web.

- **[tencent](/fr/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm ; ClawHub : `clawhub:@openclaw/tencent-provider`. Ajoute la prise en charge du fournisseur de modèles Tencent TokenHub à OpenClaw.

- **[tlon](/fr/plugins/reference/tlon)** (`@openclaw/tlon`) - npm ; ClawHub. Plugin de canal OpenClaw Tlon/Urbit pour les workflows de discussion.

- **[tokenjuice](/fr/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm ; ClawHub : `clawhub:@openclaw/tokenjuice`. Compacte les résultats des outils exec et bash avec des réducteurs tokenjuice.

- **[twitch](/fr/plugins/reference/twitch)** (`@openclaw/twitch`) - npm ; ClawHub. Plugin de canal OpenClaw Twitch pour les workflows de discussion et de modération.

- **[venice](/fr/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm ; ClawHub : `clawhub:@openclaw/venice-provider`. Ajoute la prise en charge du fournisseur de modèles Venice à OpenClaw.

- **[vercel-ai-gateway](/fr/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/vercel-ai-gateway-provider`. Ajoute la prise en charge du fournisseur de modèles Vercel AI Gateway à OpenClaw.

- **[voice-call](/fr/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm ; ClawHub. Plugin OpenClaw voice-call pour les appels téléphoniques Twilio, Telnyx et Plivo.

- **[whatsapp](/fr/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub : `clawhub:@openclaw/whatsapp` ; npm. Plugin de canal OpenClaw WhatsApp pour les discussions WhatsApp Web.

- **[zai](/fr/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm ; ClawHub : `clawhub:@openclaw/zai-provider`. Ajoute la prise en charge du fournisseur de modèles Z.AI à OpenClaw.

- **[zalo](/fr/plugins/reference/zalo)** (`@openclaw/zalo`) - npm ; ClawHub. Plugin de canal OpenClaw Zalo pour les discussions de bot et de webhook.

- **[zalouser](/fr/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm ; ClawHub. Plugin OpenClaw Zalo Personal Account via l’intégration native zca-js.

## Extraction source uniquement

3 Plugins

- **[qa-channel](/fr/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - extraction source uniquement. Ajoute la surface QA Channel pour envoyer et recevoir des messages OpenClaw.

- **[qa-lab](/fr/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - extraction source uniquement. Plugin OpenClaw QA lab avec interface utilisateur de débogueur privée et exécuteur de scénarios.

- **[qa-matrix](/fr/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - uniquement dans une extraction du code source. Exécuteur de transport QA Matrix et substrat.
