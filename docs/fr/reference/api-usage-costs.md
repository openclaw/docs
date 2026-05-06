---
read_when:
    - Vous souhaitez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous devez auditer les clés, les coûts et la visibilité de l’utilisation
    - Vous expliquez le rapport des coûts de /status ou /usage
summary: Auditer ce qui peut engager des dépenses, les clés utilisées et comment consulter l’utilisation
title: Utilisation de l’API et coûts
x-i18n:
    generated_at: "2026-05-06T07:37:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Cette doc répertorie les **fonctionnalités qui peuvent invoquer des clés API** et où leurs coûts apparaissent. Elle se concentre sur
les fonctionnalités OpenClaw qui peuvent générer une utilisation de fournisseurs ou des appels API payants.

## Où les coûts apparaissent (chat + CLI)

**Instantané du coût par session**

- `/status` affiche le modèle de la session actuelle, l’utilisation du contexte et les jetons de la dernière réponse.
- Si le modèle utilise une **authentification par clé API**, `/status` affiche aussi le **coût estimé** de la dernière réponse.
- Si les métadonnées de session en direct sont limitées, `/status` peut récupérer les
  compteurs de jetons/cache et l’étiquette du modèle d’exécution actif depuis la dernière entrée
  d’utilisation du transcript. Les valeurs non nulles existantes en direct restent prioritaires,
  et les totaux du transcript de taille comparable au prompt peuvent l’emporter lorsque les totaux
  stockés sont absents ou plus petits.

**Pied de page de coût par message**

- `/usage full` ajoute un pied de page d’utilisation à chaque réponse, incluant le **coût estimé** (clé API uniquement).
- `/usage tokens` affiche uniquement les jetons ; les flux de type abonnement via OAuth/jeton et CLI masquent le coût en dollars.
- Note Gemini CLI : lorsque la CLI renvoie une sortie JSON, OpenClaw lit l’utilisation depuis
  `stats`, normalise `stats.cached` en `cacheRead`, et dérive les jetons d’entrée
  depuis `stats.input_tokens - stats.cached` si nécessaire.

Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI de type OpenClaw est
à nouveau autorisée ; OpenClaw traite donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme
approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique.
Anthropic n’expose toujours pas d’estimation en dollars par message qu’OpenClaw peut
afficher dans `/usage full`.

**Fenêtres d’utilisation CLI (quotas des fournisseurs)**

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d’utilisation**
  des fournisseurs (instantanés de quotas, pas des coûts par message).
- La sortie lisible par un humain est normalisée en `X% left` pour tous les fournisseurs.
- Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Note MiniMax : ses champs bruts `usage_percent` / `usagePercent` indiquent le quota restant,
  donc OpenClaw les inverse avant l’affichage. Les champs basés sur un décompte restent prioritaires
  lorsqu’ils sont présents. Si le fournisseur renvoie `model_remains`, OpenClaw préfère l’entrée
  du modèle de chat, dérive l’étiquette de fenêtre depuis les horodatages si nécessaire, et
  inclut le nom du modèle dans l’étiquette du forfait.
- L’authentification d’utilisation pour ces fenêtres de quota provient de hooks propres au fournisseur lorsqu’ils
  sont disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé API correspondants
  depuis les profils d’authentification, l’environnement ou la configuration.

Voir [Utilisation des jetons et coûts](/fr/reference/token-use) pour les détails et exemples.

## Comment les clés sont découvertes

OpenClaw peut récupérer des identifiants depuis :

- **Profils d’authentification** (par agent, stockés dans `auth-profiles.json`).
- **Variables d’environnement** (par ex. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) qui peuvent exporter des clés vers l’environnement du processus de skill.

## Fonctionnalités qui peuvent dépenser des clés

### 1) Réponses du modèle principal (chat + outils)

Chaque réponse ou appel d’outil utilise le **fournisseur du modèle actuel** (OpenAI, Anthropic, etc.). C’est la
principale source d’utilisation et de coût.

Cela inclut aussi les fournisseurs hébergés de type abonnement qui facturent tout de même en dehors
de l’interface locale d’OpenClaw, comme **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, et
le chemin de connexion Claude d’OpenClaw chez Anthropic avec **Extra Usage** activé.

Voir [Modèles](/fr/providers/models) pour la configuration des prix et [Utilisation des jetons et coûts](/fr/reference/token-use) pour l’affichage.

### 2) Compréhension des médias (audio/image/vidéo)

Les médias entrants peuvent être résumés/transcrits avant l’exécution de la réponse. Cela utilise les API de modèles/fournisseurs.

- Audio : OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Image : OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vidéo : Google / Qwen / Moonshot.

Voir [Compréhension des médias](/fr/nodes/media-understanding).

### 3) Génération d’images et de vidéos

Les capacités de génération partagées peuvent aussi dépenser des clés de fournisseurs :

- Génération d’images : OpenAI / Google / DeepInfra / fal / MiniMax
- Génération de vidéos : DeepInfra / Qwen

La génération d’images peut déduire un fournisseur par défaut adossé à l’authentification lorsque
`agents.defaults.imageGenerationModel` n’est pas défini. La génération de vidéos nécessite actuellement
un `agents.defaults.videoGenerationModel` explicite tel que
`qwen/wan2.6-t2v`.

Voir [Génération d’images](/fr/tools/image-generation), [Qwen Cloud](/fr/providers/qwen),
et [Modèles](/fr/concepts/models).

### 4) Embeddings de mémoire + recherche sémantique

La recherche sémantique en mémoire utilise des **API d’embedding** lorsqu’elle est configurée pour des fournisseurs distants :

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "deepinfra"` → embeddings DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings LM Studio (local/auto-hébergé)
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/auto-hébergé ; généralement sans facturation d’API hébergée)
- Repli optionnel vers un fournisseur distant si les embeddings locaux échouent

Vous pouvez la garder locale avec `memorySearch.provider = "local"` (aucune utilisation d’API).

Voir [Mémoire](/fr/concepts/memory).

### 5) Outil de recherche web

`web_search` peut entraîner des frais d’utilisation selon votre fournisseur :

- **Brave Search API** : `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa** : `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl** : `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)** : `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)** : `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)** : `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search** : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search** : sans clé pour un hôte Ollama local connecté et joignable ; la recherche directe `https://ollama.com` utilise `OLLAMA_API_KEY`, et les hôtes protégés par authentification peuvent réutiliser l’authentification bearer normale du fournisseur Ollama
- **Perplexity Search API** : `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily** : `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo** : repli sans clé (pas de facturation API, mais non officiel et basé sur HTML)
- **SearXNG** : `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sans clé/auto-hébergé ; pas de facturation d’API hébergée)

Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore via le shim de compatibilité temporaire, mais ils ne sont plus la surface de configuration recommandée.

**Crédit gratuit Brave Search :** Chaque forfait Brave inclut \$5/mois de
crédit gratuit renouvelé. Le forfait Search coûte \$5 pour 1 000 requêtes, donc le crédit couvre
1 000 requêtes/mois sans frais. Définissez votre limite d’utilisation dans le tableau de bord Brave
pour éviter les frais inattendus.

Voir [Outils web](/fr/tools/web).

### 5) Outil de récupération web (Firecrawl)

`web_fetch` peut appeler **Firecrawl** lorsqu’une clé API est présente :

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl n’est pas configuré, l’outil se rabat sur une récupération directe plus le plugin `web-readability` inclus (pas d’API payante). Désactivez `plugins.entries.web-readability.enabled` pour ignorer l’extraction Readability locale.

Voir [Outils web](/fr/tools/web).

### 6) Instantanés d’utilisation des fournisseurs (statut/santé)

Certaines commandes de statut appellent les **endpoints d’utilisation des fournisseurs** pour afficher les fenêtres de quota ou l’état de l’authentification.
Ce sont généralement des appels à faible volume, mais ils touchent tout de même les API des fournisseurs :

- `openclaw status --usage`
- `openclaw models status --json`

Voir [CLI des modèles](/fr/cli/models).

### 7) Résumé de protection de Compaction

La protection de Compaction peut résumer l’historique de session à l’aide du **modèle actuel**, ce qui
invoque les API des fournisseurs lorsqu’elle s’exécute.

Voir [Gestion de session + Compaction](/fr/reference/session-management-compaction).

### 8) Analyse / sonde de modèles

`openclaw models scan` peut sonder les modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque
la sonde est activée.

Voir [CLI des modèles](/fr/cli/models).

### 9) Talk (voix)

Le mode Talk peut invoquer **ElevenLabs** lorsqu’il est configuré :

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Voir [Mode Talk](/fr/nodes/talk).

### 10) Skills (API tierces)

Les Skills peuvent stocker `apiKey` dans `skills.entries.<name>.apiKey`. Si un skill utilise cette clé pour des
API externes, cela peut entraîner des coûts selon le fournisseur du skill.

Voir [Skills](/fr/tools/skills).

## Connexe

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
