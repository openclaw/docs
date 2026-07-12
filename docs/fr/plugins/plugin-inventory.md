---
read_when:
    - Vous déterminez si un plugin est distribué dans le package npm principal ou installé séparément
    - Vous mettez à jour les métadonnées des paquets de plugins intégrés ou l’automatisation des versions
    - Vous avez besoin de la liste canonique des plugins internes et externes
summary: Inventaire généré des plugins OpenClaw intégrés au cœur, publiés séparément ou disponibles uniquement sous forme de code source
title: Inventaire des Plugins
x-i18n:
    generated_at: "2026-07-12T15:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
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

- **Paquet npm principal :** intégré au paquet npm `openclaw` et disponible sans installation distincte d’un plugin.
- **Paquet externe officiel :** plugin maintenu par OpenClaw, absent du paquet npm principal, répertorié dans cet inventaire officiel et installé à la demande via ClawHub et/ou npm.
- **Uniquement dans une copie de travail des sources :** plugin local au dépôt, absent des artefacts npm publiés et non présenté comme un paquet installable.

Les copies de travail des sources diffèrent des installations npm : après `pnpm install`, les plugins intégrés sont chargés depuis `extensions/<id>`, afin que les modifications locales et les dépendances propres au paquet dans l’espace de travail soient disponibles.

## Installer un plugin

Utilisez la méthode d’installation indiquée dans chaque entrée pour déterminer si une installation est nécessaire. Les plugins portant la mention `included in OpenClaw` sont déjà présents dans le paquet principal. Les paquets externes officiels nécessitent une installation, puis un redémarrage du Gateway.

Par exemple, Discord est un paquet externe officiel :

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Pendant la transition de lancement, les spécifications de paquet ordinaires sans préfixe sont toujours installées depuis npm.
Utilisez `clawhub:@openclaw/discord` ou `npm:@openclaw/discord` lorsque vous avez besoin d’une
source explicite. Après l’installation, suivez la documentation de configuration du plugin, telle que
[Discord](/fr/channels/discord), pour ajouter les identifiants et la configuration du canal. Consultez
[Gérer les plugins](/fr/plugins/manage-plugins) pour connaître les commandes de mise à jour, de désinstallation et de publication.

Chaque entrée indique le paquet, le canal de distribution et sa description.

## Paquet npm principal

64 plugins

- **[admin-http-rpc](/fr/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - inclus dans OpenClaw. Point de terminaison RPC HTTP d’administration d’OpenClaw.

- **[alibaba](/fr/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - inclus dans OpenClaw. Ajoute la prise en charge du fournisseur de génération vidéo.

- **[anthropic](/fr/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - inclus dans OpenClaw. Modèles Anthropic, CLI Claude et catalogue natif de sessions Claude.

- **[azure-speech](/fr/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - inclus dans OpenClaw. Synthèse vocale Azure AI Speech (MP3, messages vocaux Ogg/Opus natifs, téléphonie PCM).

- **[bonjour](/fr/plugins/reference/bonjour)** (`@openclaw/bonjour`) - inclus dans OpenClaw. Annonce le Gateway OpenClaw local via Bonjour/mDNS.

- **[browser](/fr/plugins/reference/browser)** (`@openclaw/browser-plugin`) - inclus dans OpenClaw. Ajoute des outils invocables par les agents.

- **[byteplus](/fr/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles BytePlus et BytePlus Plan.

- **[canvas](/fr/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - inclus dans OpenClaw. Surfaces expérimentales de contrôle de Canvas et de rendu A2UI pour les nœuds appairés.

- **[clawrouter](/fr/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles ClawRouter.

- **[cohere](/fr/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - inclus dans OpenClaw ; npm ; ClawHub : `clawhub:@openclaw/cohere-provider`. Plugin fournisseur Cohere pour OpenClaw.

- **[comfy](/fr/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles ComfyUI.

- **[copilot-proxy](/fr/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Copilot Proxy.

- **[crabbox](/fr/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - inclus dans OpenClaw. Fournisseur de workers cloud reposant sur la CLI Crabbox.

- **[deepgram](/fr/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d'un fournisseur de compréhension des médias. Ajoute la prise en charge d'un fournisseur de transcription en temps réel.

- **[document-extract](/fr/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - inclus dans OpenClaw. Extrait le texte et, en solution de repli, les images des pages à partir de pièces jointes de documents locaux.

- **[duckduckgo](/fr/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - inclus dans OpenClaw. Ajoute la prise en charge d'un fournisseur de recherche sur le Web.

- **[elevenlabs](/fr/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - inclus dans OpenClaw. Ajoute la prise en charge d'un fournisseur de compréhension des médias. Ajoute la prise en charge d'un fournisseur de transcription en temps réel. Ajoute la prise en charge d'un fournisseur de synthèse vocale.

- **[fal](/fr/plugins/reference/fal)** (`@openclaw/fal-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles fal.

- **[file-transfer](/fr/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - inclus dans OpenClaw. Récupère, répertorie et écrit des fichiers sur les nœuds appairés au moyen de commandes de nœud dédiées. Contourne la troncation de la sortie standard de bash en utilisant base64 via node.invoke pour les fichiers binaires jusqu'à 16 MB.

- **[github-copilot](/fr/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles GitHub Copilot.

- **[google](/fr/plugins/reference/google)** (`@openclaw/google-plugin`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Google, Google Gemini CLI et Google Vertex.

- **[huggingface](/fr/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Hugging Face.

- **[imessage](/fr/plugins/reference/imessage)** (`@openclaw/imessage`) - inclus dans OpenClaw. Ajoute l'interface de canal iMessage permettant d'envoyer et de recevoir des messages OpenClaw.

- **[litellm](/fr/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles LiteLLM.

- **[llm-task](/fr/plugins/reference/llm-task)** (`@openclaw/llm-task`) - inclus dans OpenClaw. Outil LLM générique utilisant exclusivement JSON pour les tâches structurées pouvant être appelées depuis des workflows.

- **[lmstudio](/fr/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles LM Studio.

- **[logbook](/fr/plugins/reference/logbook)** (`@openclaw/logbook`) - inclus dans OpenClaw. Journal de travail automatique : capture périodiquement des instantanés d’écran depuis un Node associé et les transforme en une chronologie consultable de votre journée.

- **[memory-core](/fr/plugins/reference/memory-core)** (`@openclaw/memory-core`) - inclus dans OpenClaw. Ajoute des outils pouvant être appelés par les agents.

- **[memory-wiki](/fr/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - inclus dans OpenClaw. Compilateur de wiki persistant et coffre de connaissances compatible avec Obsidian pour OpenClaw.

- **[meta](/plugins/reference/meta)** (`@openclaw/meta-provider`) - inclus dans OpenClaw ; npm ; ClawHub : `clawhub:@openclaw/meta-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Meta.

- **[microsoft](/fr/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de synthèse vocale.

- **[microsoft-foundry](/fr/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Microsoft Foundry.

- **[migrate-claude](/fr/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - inclus dans OpenClaw. Importe dans OpenClaw les instructions, serveurs MCP, Skills et configurations sûres de Claude Code et Claude Desktop.

- **[migrate-hermes](/fr/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - inclus dans OpenClaw. Importe dans OpenClaw la configuration, les mémoires, les Skills et les identifiants pris en charge de Hermes.

- **[minimax](/fr/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles MiniMax et MiniMax Portal.

- **[mistral](/fr/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Mistral.

- **[novita](/fr/plugins/reference/novita)** (`@openclaw/novita-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Novita, Novita AI et Novitaai.

- **[nvidia](/fr/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles NVIDIA.

- **[oc-path](/fr/plugins/reference/oc-path)** (`@openclaw/oc-path`) - inclus dans OpenClaw. Ajoute la CLI de chemins openclaw pour l’adressage des fichiers de l’espace de travail avec oc://.

- **[ollama](/fr/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Ollama et Ollama Cloud.

- **[open-prose](/fr/plugins/reference/open-prose)** (`@openclaw/open-prose`) - inclus dans OpenClaw. Ensemble de Skills pour la machine virtuelle OpenProse avec une commande oblique /prose.

- **[openai](/fr/plugins/reference/openai)** (`@openclaw/openai-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenAI.

- **[opencode](/fr/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenCode.

- **[opencode-go](/fr/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenCode Go.

- **[openrouter](/fr/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles OpenRouter.

- **[policy](/fr/plugins/reference/policy)** (`@openclaw/policy`) - inclus dans OpenClaw. Ajoute des contrôles doctor fondés sur des stratégies pour vérifier la conformité de l’espace de travail.

- **[runway](/fr/plugins/reference/runway)** (`@openclaw/runway-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de génération vidéo.

- **[senseaudio](/fr/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de compréhension des médias.

- **[sglang](/fr/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles SGLang.

- **[synthetic](/fr/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Synthetic.

- **[telegram](/fr/plugins/reference/telegram)** (`@openclaw/telegram`) - inclus dans OpenClaw. Ajoute l’interface du canal Telegram pour envoyer et recevoir des messages OpenClaw.

- **[together](/fr/plugins/reference/together)** (`@openclaw/together-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Together.

- **[tts-local-cli](/fr/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de synthèse vocale.

- **[vault](/fr/plugins/reference/vault)** (`@openclaw/vault`) - inclus dans OpenClaw. Intégration du fournisseur SecretRef HashiCorp Vault.

- **[vllm](/fr/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles vLLM.

- **[volcengine](/fr/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Volcengine et Volcengine Plan.

- **[voyage](/fr/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - inclus dans OpenClaw. Ajoute la prise en charge d’un fournisseur de vectorisation de la mémoire.

- **[vydra](/fr/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Vydra.

- **[web-readability](/fr/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - inclus dans OpenClaw. Extrait le contenu lisible des articles à partir des réponses HTML locales de récupération web.

- **[webhooks](/fr/plugins/reference/webhooks)** (`@openclaw/webhooks`) - inclus dans OpenClaw. Webhooks entrants authentifiés qui relient des automatisations externes aux TaskFlows OpenClaw.

- **[workboard](/fr/plugins/reference/workboard)** (`@openclaw/workboard`) - inclus dans OpenClaw. Tableau de bord de travail pour les tickets et les sessions gérés par les agents.

- **[workspaces](/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) - inclus dans OpenClaw. Backend de documents et de plan de contrôle Workspaces composable par les agents.

- **[xai](/fr/plugins/reference/xai)** (`@openclaw/xai-plugin`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge du fournisseur de modèles xAI.

- **[xiaomi](/fr/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - inclus dans OpenClaw. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Xiaomi et Xiaomi Token Plan.

## Paquets externes officiels

70 plugins

- **[acpx](/fr/plugins/reference/acpx)** (`@openclaw/acpx`) - npm ; ClawHub. Backend d’exécution ACP d’OpenClaw avec gestion des sessions et du transport assurée par le plugin.

- **[amazon-bedrock](/fr/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm ; ClawHub. Plugin de fournisseur Amazon Bedrock pour OpenClaw, avec découverte des modèles, embeddings et prise en charge des garde-fous.

- **[amazon-bedrock-mantle](/fr/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm ; ClawHub. Plugin de fournisseur Amazon Bedrock Mantle pour OpenClaw destiné au routage de modèles compatibles avec OpenAI.

- **[anthropic-vertex](/fr/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm ; ClawHub. Plugin de fournisseur Anthropic Vertex pour OpenClaw destiné aux modèles Claude sur Google Vertex AI.

- **[arcee](/fr/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm ; ClawHub : `clawhub:@openclaw/arcee-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Arcee.

- **[brave](/fr/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm ; ClawHub. Plugin de fournisseur Brave Search pour la recherche sur le Web dans OpenClaw.

- **[cerebras](/fr/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm ; ClawHub : `clawhub:@openclaw/cerebras-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Cerebras.

- **[chutes](/fr/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm ; ClawHub : `clawhub:@openclaw/chutes-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Chutes.

- **[clickclack](/fr/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm ; ClawHub : `clawhub:@openclaw/clickclack`. Ajoute le canal Clickclack pour envoyer et recevoir des messages OpenClaw.

- **[cloudflare-ai-gateway](/fr/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Cloudflare AI Gateway.

- **[codex](/fr/plugins/reference/codex)** (`@openclaw/codex`) - npm ; ClawHub. Harnais de serveur d’application Codex, fournisseur de modèles et catalogue de sessions natives.

- **[copilot](/fr/plugins/reference/copilot)** (`@openclaw/copilot`) - npm ; ClawHub : `clawhub:@openclaw/copilot`. Enregistre l’environnement d’exécution d’agent GitHub Copilot.

- **[deepinfra](/fr/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepinfra-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles DeepInfra.

- **[deepseek](/fr/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm ; ClawHub : `clawhub:@openclaw/deepseek-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles DeepSeek.

- **[diagnostics-otel](/fr/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-otel`. Exportateur de diagnostics OpenTelemetry d’OpenClaw pour les métriques, les traces et les journaux.

- **[diagnostics-prometheus](/fr/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm ; ClawHub : `clawhub:@openclaw/diagnostics-prometheus`. Exportateur de diagnostics Prometheus d’OpenClaw pour les métriques d’exécution.

- **[diffs](/fr/plugins/reference/diffs)** (`@openclaw/diffs`) - npm ; ClawHub. Plugin de visualisation des différences en lecture seule et moteur de rendu de fichiers pour les agents OpenClaw.

- **[diffs-language-pack](/fr/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm ; ClawHub : `clawhub:@openclaw/diffs-language-pack`. Ajoute la coloration syntaxique pour les langages absents de l’ensemble par défaut du visualiseur de différences.

- **[discord](/fr/plugins/reference/discord)** (`@openclaw/discord`) - npm ; ClawHub. Plugin de canal Discord pour OpenClaw, destiné aux canaux, messages privés, commandes et événements d’application.

- **[exa](/fr/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm ; ClawHub : `clawhub:@openclaw/exa-plugin`. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[featherless](/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm ; ClawHub : `clawhub:@openclaw/featherless-provider`. Plugin de fournisseur Featherless AI pour OpenClaw.

- **[feishu](/fr/plugins/reference/feishu)** (`@openclaw/feishu`) - npm ; ClawHub. Plugin de canal Feishu/Lark pour OpenClaw, destiné aux discussions et aux outils de travail (maintenu par la communauté par @m1heng).

- **[firecrawl](/fr/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm ; ClawHub : `clawhub:@openclaw/firecrawl-plugin`. Ajoute des outils accessibles aux agents. Ajoute la prise en charge d’un fournisseur de récupération de contenu Web. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[fireworks](/fr/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm ; ClawHub : `clawhub:@openclaw/fireworks-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Fireworks.

- **[gmi](/fr/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm ; ClawHub : `clawhub:@openclaw/gmi-provider`. Plugin de fournisseur GMI Cloud pour OpenClaw.

- **[google-meet](/fr/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm ; ClawHub. Plugin de participant Google Meet pour OpenClaw permettant de rejoindre des appels via les transports Chrome ou Twilio.

- **[googlechat](/fr/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm ; ClawHub. Plugin de canal Google Chat pour OpenClaw, destiné aux espaces et aux messages privés.

- **[gradium](/fr/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm ; ClawHub : `clawhub:@openclaw/gradium-speech`. Ajoute la prise en charge d’un fournisseur de synthèse vocale.

- **[groq](/fr/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm ; ClawHub : `clawhub:@openclaw/groq-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Groq.

- **[inworld](/fr/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm ; ClawHub : `clawhub:@openclaw/inworld-speech`. Synthèse vocale en continu d’Inworld (MP3, OGG_OPUS, PCM pour la téléphonie).

- **[irc](/fr/plugins/reference/irc)** (`@openclaw/irc`) - npm ; ClawHub : `clawhub:@openclaw/irc`. Ajoute le canal IRC pour envoyer et recevoir des messages OpenClaw.

- **[kilocode](/fr/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm ; ClawHub : `clawhub:@openclaw/kilocode-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Kilocode.

- **[kimi](/fr/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm ; ClawHub : `clawhub:@openclaw/kimi-provider`. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Kimi et Kimi Coding.

- **[line](/fr/plugins/reference/line)** (`@openclaw/line`) - npm ; ClawHub. Plugin de canal LINE pour OpenClaw, destiné aux discussions de l’API LINE Bot.

- **[llama-cpp](/fr/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm ; ClawHub. Embeddings GGUF locaux via node-llama-cpp.

- **[lobster](/fr/plugins/reference/lobster)** (`@openclaw/lobster`) - npm ; ClawHub. Plugin d’outil de workflow Lobster pour les pipelines typés et les approbations pouvant être reprises.

- **[longcat](/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm ; ClawHub : `clawhub:@openclaw/longcat-provider`. Plugin de fournisseur LongCat pour OpenClaw.

- **[matrix](/fr/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub : `clawhub:@openclaw/matrix` ; npm. Plugin de canal Matrix pour OpenClaw, destiné aux salons et aux messages privés.

- **[mattermost](/fr/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm ; ClawHub : `clawhub:@openclaw/mattermost`. Ajoute le canal Mattermost pour envoyer et recevoir des messages OpenClaw.

- **[memory-lancedb](/fr/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm ; ClawHub. Plugin de mémoire à long terme d’OpenClaw fondé sur LanceDB, avec rappel automatique, capture automatique et recherche vectorielle.

- **[moonshot](/fr/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm ; ClawHub : `clawhub:@openclaw/moonshot-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Moonshot.

- **[msteams](/fr/plugins/reference/msteams)** (`@openclaw/msteams`) - npm ; ClawHub. Plugin de canal Microsoft Teams pour OpenClaw, destiné aux conversations avec des bots.

- **[nextcloud-talk](/fr/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm ; ClawHub. Plugin de canal Nextcloud Talk pour OpenClaw, destiné aux conversations.

- **[nostr](/fr/plugins/reference/nostr)** (`@openclaw/nostr`) - npm ; ClawHub. Plugin de canal Nostr pour OpenClaw, destiné aux messages privés chiffrés NIP-04.

- **[openshell](/fr/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm ; ClawHub. Backend de bac à sable OpenClaw pour la CLI NVIDIA OpenShell, avec espaces de travail locaux mis en miroir et exécution de commandes SSH.

- **[parallel](/fr/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm ; ClawHub : `clawhub:@openclaw/parallel-plugin`. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[perplexity](/fr/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm ; ClawHub : `clawhub:@openclaw/perplexity-plugin`. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[pixverse](/fr/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm ; ClawHub : `clawhub:@openclaw/pixverse-provider`. Plugin de fournisseur de génération vidéo PixVerse pour OpenClaw.

- **[qianfan](/fr/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm ; ClawHub : `clawhub:@openclaw/qianfan-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Qianfan.

- **[qqbot](/fr/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm ; ClawHub. Plugin de canal QQ Bot pour OpenClaw, destiné aux workflows de groupe et de messages privés.

- **[qwen](/fr/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm ; ClawHub : `clawhub:@openclaw/qwen-provider`. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan et Bailian Token Plan.

- **[raft](/fr/plugins/reference/raft)** (`@openclaw/raft`) - npm ; ClawHub. Plugin de canal Raft pour OpenClaw, destiné aux ponts sécurisés d’activation de la CLI.

- **[searxng](/fr/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm ; ClawHub : `clawhub:@openclaw/searxng-plugin`. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[signal](/fr/plugins/reference/signal)** (`@openclaw/signal`) - npm ; ClawHub : `clawhub:@openclaw/signal`. Ajoute le canal Signal pour envoyer et recevoir des messages OpenClaw.

- **[slack](/fr/plugins/reference/slack)** (`@openclaw/slack`) - npm ; ClawHub. Plugin de canal Slack pour OpenClaw, destiné aux canaux, messages privés, commandes et événements d’application.

- **[sms](/fr/plugins/reference/sms)** (`@openclaw/sms`) - npm ; ClawHub : `clawhub:@openclaw/sms`. Plugin de canal SMS Twilio pour les messages texte OpenClaw.

- **[stepfun](/fr/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm ; ClawHub : `clawhub:@openclaw/stepfun-provider`. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles StepFun et StepFun Plan.

- **[synology-chat](/fr/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm ; ClawHub. Plugin de canal Synology Chat pour les canaux et les messages privés OpenClaw.

- **[tavily](/fr/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm ; ClawHub : `clawhub:@openclaw/tavily-plugin`. Ajoute des outils accessibles aux agents. Ajoute la prise en charge d’un fournisseur de recherche sur le Web.

- **[tencent](/fr/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm ; ClawHub : `clawhub:@openclaw/tencent-provider`. Ajoute à OpenClaw la prise en charge des fournisseurs de modèles Tencent TokenHub et Tencent Tokenplan.

- **[tlon](/fr/plugins/reference/tlon)** (`@openclaw/tlon`) - npm ; ClawHub. Plugin de canal Tlon/Urbit pour OpenClaw, destiné aux workflows de discussion.

- **[tokenjuice](/fr/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm ; ClawHub : `clawhub:@openclaw/tokenjuice`. Compacte les résultats des outils exec et bash à l’aide des réducteurs tokenjuice.

- **[twitch](/fr/plugins/reference/twitch)** (`@openclaw/twitch`) - npm ; ClawHub. Plugin de canal Twitch pour OpenClaw, destiné aux workflows de discussion et de modération.

- **[venice](/fr/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm ; ClawHub : `clawhub:@openclaw/venice-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Venice.

- **[vercel-ai-gateway](/fr/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm ; ClawHub : `clawhub:@openclaw/vercel-ai-gateway-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Vercel AI Gateway.

- **[voice-call](/fr/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm ; ClawHub. Plugin d’appels vocaux OpenClaw pour les appels téléphoniques via Twilio, Telnyx et Plivo.

- **[whatsapp](/fr/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub : `clawhub:@openclaw/whatsapp` ; npm. Plugin de canal WhatsApp OpenClaw pour les conversations WhatsApp Web.

- **[zai](/fr/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm ; ClawHub : `clawhub:@openclaw/zai-provider`. Ajoute à OpenClaw la prise en charge du fournisseur de modèles Z.AI.

- **[zalo](/fr/plugins/reference/zalo)** (`@openclaw/zalo`) - npm ; ClawHub. Plugin de canal Zalo OpenClaw pour les conversations avec des bots et par webhook.

- **[zalouser](/fr/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm ; ClawHub. Plugin OpenClaw pour les comptes personnels Zalo via l’intégration native zca-js.

## Uniquement dans une copie de travail des sources

3 plugins

- **[qa-channel](/fr/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - uniquement dans une copie de travail des sources. Ajoute l’interface QA Channel pour envoyer et recevoir des messages OpenClaw.

- **[qa-lab](/fr/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - uniquement dans une copie de travail des sources. Plugin de laboratoire d’assurance qualité OpenClaw avec une interface privée de débogage et un exécuteur de scénarios.

- **[qa-matrix](/fr/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - uniquement dans une copie de travail des sources. Exécuteur et infrastructure de transport d’assurance qualité Matrix.
