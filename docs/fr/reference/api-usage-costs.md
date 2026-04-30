---
read_when:
    - Vous souhaitez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous devez auditer les clés, les coûts et la visibilité de l’utilisation
    - Vous expliquez les rapports de coûts de /status ou /usage
summary: Auditer ce qui peut engager des dépenses, les clés utilisées et comment consulter l’utilisation
title: Utilisation de l’API et coûts
x-i18n:
    generated_at: "2026-04-30T07:46:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# Utilisation de l’API et coûts

Ce document répertorie les **fonctionnalités pouvant invoquer des clés API** et où leurs coûts apparaissent. Il se concentre sur les fonctionnalités d’OpenClaw qui peuvent générer de l’utilisation fournisseur ou des appels API payants.

## Où les coûts apparaissent (chat + CLI)

**Instantané du coût par session**

- `/status` affiche le modèle de la session actuelle, l’utilisation du contexte et les tokens de la dernière réponse.
- Si le modèle utilise une **authentification par clé API**, `/status` affiche aussi le **coût estimé** de la dernière réponse.
- Si les métadonnées de session en direct sont limitées, `/status` peut récupérer les compteurs de tokens/cache et l’étiquette du modèle d’exécution actif depuis la dernière entrée d’utilisation du transcript. Les valeurs en direct non nulles existantes restent prioritaires, et les totaux du transcript à la taille du prompt peuvent l’emporter lorsque les totaux stockés sont manquants ou plus petits.

**Pied de page de coût par message**

- `/usage full` ajoute un pied de page d’utilisation à chaque réponse, avec le **coût estimé** (clé API uniquement).
- `/usage tokens` affiche uniquement les tokens ; les flux OAuth/token de type abonnement et les flux CLI masquent le coût en dollars.
- Note Gemini CLI : lorsque la CLI renvoie une sortie JSON, OpenClaw lit l’utilisation depuis `stats`, normalise `stats.cached` en `cacheRead`, et déduit les tokens d’entrée à partir de `stats.input_tokens - stats.cached` si nécessaire.

Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI façon OpenClaw est de nouveau autorisée ; OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique. Anthropic n’expose toujours pas d’estimation du coût en dollars par message qu’OpenClaw pourrait afficher dans `/usage full`.

**Fenêtres d’utilisation CLI (quotas fournisseur)**

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d’utilisation** des fournisseurs (instantanés de quota, pas coûts par message).
- La sortie lisible par un humain est normalisée en `X% left` pour tous les fournisseurs.
- Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Note MiniMax : ses champs bruts `usage_percent` / `usagePercent` indiquent le quota restant ; OpenClaw les inverse donc avant l’affichage. Les champs basés sur des décomptes restent prioritaires lorsqu’ils sont présents. Si le fournisseur renvoie `model_remains`, OpenClaw préfère l’entrée du modèle de chat, déduit l’étiquette de fenêtre depuis les horodatages si nécessaire, et inclut le nom du modèle dans l’étiquette du forfait.
- L’authentification d’utilisation pour ces fenêtres de quota provient de hooks propres aux fournisseurs lorsqu’ils sont disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé API correspondants depuis les profils d’authentification, l’environnement ou la configuration.

Consultez [Utilisation des tokens et coûts](/fr/reference/token-use) pour les détails et exemples.

## Comment les clés sont découvertes

OpenClaw peut récupérer les identifiants depuis :

- **Profils d’authentification** (par agent, stockés dans `auth-profiles.json`).
- **Variables d’environnement** (par exemple `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) pouvant exporter des clés vers l’environnement du processus de skill.

## Fonctionnalités pouvant dépenser des clés

### 1) Réponses du modèle principal (chat + outils)

Chaque réponse ou appel d’outil utilise le **fournisseur de modèle actuel** (OpenAI, Anthropic, etc.). C’est la principale source d’utilisation et de coût.

Cela inclut aussi les fournisseurs hébergés de type abonnement qui facturent néanmoins en dehors de l’interface locale d’OpenClaw, comme **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, et le chemin de connexion Claude d’OpenClaw via Anthropic avec **Extra Usage** activé.

Consultez [Modèles](/fr/providers/models) pour la configuration des prix et [Utilisation des tokens et coûts](/fr/reference/token-use) pour l’affichage.

### 2) Compréhension des médias (audio/image/vidéo)

Les médias entrants peuvent être résumés/transcrits avant l’exécution de la réponse. Cela utilise les API de modèle/fournisseur.

- Audio : OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Image : OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vidéo : Google / Qwen / Moonshot.

Consultez [Compréhension des médias](/fr/nodes/media-understanding).

### 3) Génération d’images et de vidéos

Les capacités de génération partagées peuvent aussi dépenser des clés fournisseur :

- Génération d’images : OpenAI / Google / DeepInfra / fal / MiniMax
- Génération de vidéos : DeepInfra / Qwen

La génération d’images peut inférer un fournisseur par défaut adossé à l’authentification lorsque `agents.defaults.imageGenerationModel` n’est pas défini. La génération de vidéos exige actuellement un `agents.defaults.videoGenerationModel` explicite, par exemple `qwen/wan2.6-t2v`.

Consultez [Génération d’images](/fr/tools/image-generation), [Qwen Cloud](/fr/providers/qwen) et [Modèles](/fr/concepts/models).

### 4) Embeddings mémoire + recherche sémantique

La recherche sémantique en mémoire utilise des **API d’embeddings** lorsqu’elle est configurée pour des fournisseurs distants :

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "deepinfra"` → embeddings DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings LM Studio (local/auto-hébergé)
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/auto-hébergé ; généralement aucune facturation d’API hébergée)
- Bascule de secours facultative vers un fournisseur distant si les embeddings locaux échouent

Vous pouvez la garder locale avec `memorySearch.provider = "local"` (aucune utilisation d’API).

Consultez [Mémoire](/fr/concepts/memory).

### 5) Outil de recherche web

`web_search` peut entraîner des frais d’utilisation selon votre fournisseur :

- **Brave Search API** : `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa** : `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl** : `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)** : `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)** : `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)** : `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search** : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search** : sans clé pour un hôte Ollama local connecté et joignable ; la recherche directe sur `https://ollama.com` utilise `OLLAMA_API_KEY`, et les hôtes protégés par authentification peuvent réutiliser l’authentification bearer habituelle du fournisseur Ollama
- **Perplexity Search API** : `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily** : `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo** : solution de secours sans clé (aucune facturation d’API, mais non officielle et basée sur HTML)
- **SearXNG** : `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sans clé/auto-hébergé ; aucune facturation d’API hébergée)

Les anciens chemins fournisseur `tools.web.search.*` se chargent encore via la couche de compatibilité temporaire, mais ils ne sont plus la surface de configuration recommandée.

**Crédit gratuit Brave Search :** Chaque forfait Brave inclut 5 \$US/mois de crédit gratuit renouvelé. Le forfait Search coûte 5 \$US pour 1 000 requêtes ; le crédit couvre donc 1 000 requêtes/mois sans frais. Définissez votre limite d’utilisation dans le tableau de bord Brave pour éviter les frais inattendus.

Consultez [Outils web](/fr/tools/web).

### 5) Outil de récupération web (Firecrawl)

`web_fetch` peut appeler **Firecrawl** lorsqu’une clé API est présente :

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl n’est pas configuré, l’outil se rabat sur la récupération directe plus le plugin `web-readability` groupé (aucune API payante). Désactivez `plugins.entries.web-readability.enabled` pour ignorer l’extraction Readability locale.

Consultez [Outils web](/fr/tools/web).

### 6) Instantanés d’utilisation fournisseur (statut/santé)

Certaines commandes de statut appellent les **points de terminaison d’utilisation fournisseur** pour afficher les fenêtres de quota ou l’état de l’authentification. Ce sont généralement des appels à faible volume, mais ils atteignent quand même les API fournisseur :

- `openclaw status --usage`
- `openclaw models status --json`

Consultez [CLI des modèles](/fr/cli/models).

### 7) Résumé de protection de Compaction

La protection de Compaction peut résumer l’historique de session avec le **modèle actuel**, ce qui invoque les API fournisseur lorsqu’elle s’exécute.

Consultez [Gestion des sessions + Compaction](/fr/reference/session-management-compaction).

### 8) Analyse / sonde de modèles

`openclaw models scan` peut sonder les modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque la sonde est activée.

Consultez [CLI des modèles](/fr/cli/models).

### 9) Talk (voix)

Le mode Talk peut invoquer **ElevenLabs** lorsqu’il est configuré :

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Consultez [Mode Talk](/fr/nodes/talk).

### 10) Skills (API tierces)

Les Skills peuvent stocker `apiKey` dans `skills.entries.<name>.apiKey`. Si un skill utilise cette clé pour des API externes, il peut entraîner des coûts selon le fournisseur du skill.

Consultez [Skills](/fr/tools/skills).

## Liens associés

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
