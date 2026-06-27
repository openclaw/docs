---
read_when:
    - Vous voulez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous devez auditer les clés, les coûts et la visibilité de l’utilisation
    - Vous expliquez le reporting des coûts de /status ou /usage
summary: Auditez ce qui peut dépenser de l’argent, les clés utilisées et la façon de consulter l’utilisation
title: Utilisation de l’API et coûts
x-i18n:
    generated_at: "2026-06-27T18:09:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Ce document répertorie les **fonctionnalités qui peuvent invoquer des clés API** et où leurs coûts apparaissent. Il se concentre sur
les fonctionnalités d’OpenClaw qui peuvent générer de l’utilisation fournisseur ou des appels API payants.

## Où les coûts apparaissent (chat + CLI)

**Instantané du coût par session**

- `/status` affiche le modèle de la session actuelle, l’utilisation du contexte et les tokens de la dernière réponse.
- Si OpenClaw dispose de métadonnées d’utilisation et d’une tarification locale pour le modèle actif,
  `/status` affiche aussi le **coût estimé** de la dernière réponse. Cela peut inclure
  des fournisseurs sans clé API à tarification explicite, comme les modèles Bedrock `aws-sdk`.
- Si les métadonnées de session en direct sont limitées, `/status` peut récupérer les compteurs
  de tokens/cache et le libellé du modèle d’exécution actif depuis la dernière entrée d’utilisation
  de la transcription. Les valeurs en direct non nulles existantes restent prioritaires, et les totaux
  de transcription de taille prompt peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.

**Pied de page de coût par message**

- `/usage full` ajoute un pied de page d’utilisation à chaque réponse, y compris le **coût estimé**
  lorsque la tarification locale est configurée pour le modèle actif et que les métadonnées d’utilisation
  sont disponibles.
- `/usage tokens` affiche uniquement les tokens ; les flux OAuth/token de type abonnement et les flux CLI
  continuent d’afficher uniquement les tokens, sauf si ce runtime fournit des métadonnées d’utilisation compatibles
  et qu’un prix local explicite est configuré.
- Note Gemini CLI : la sortie par défaut `stream-json` et les remplacements JSON hérités
  lisent tous deux l’utilisation depuis `stats`, normalisent `stats.cached` en `cacheRead` et
  dérivent les tokens d’entrée depuis `stats.input_tokens - stats.cached` si nécessaire.

Note Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI de type OpenClaw est
à nouveau autorisée ; OpenClaw considère donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme
approuvées pour cette intégration, sauf si Anthropic publie une nouvelle politique.
Anthropic n’expose toujours pas d’estimation en dollars par message qu’OpenClaw pourrait
afficher dans `/usage full`.

**Fenêtres d’utilisation CLI (quotas fournisseur)**

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d’utilisation** fournisseur
  (instantanés de quota, pas des coûts par message).
- La sortie humaine est normalisée en `X% left` pour tous les fournisseurs.
- Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Note MiniMax : ses champs bruts `usage_percent` / `usagePercent` signifient quota restant ;
  OpenClaw les inverse donc avant l’affichage. Les champs basés sur des nombres restent prioritaires
  lorsqu’ils sont présents. Si le fournisseur renvoie `model_remains`, OpenClaw privilégie l’entrée
  du modèle de chat, déduit le libellé de la fenêtre à partir des horodatages si nécessaire, et
  inclut le nom du modèle dans le libellé du plan.
- L’authentification d’utilisation pour ces fenêtres de quota provient de hooks propres au fournisseur lorsqu’ils
  sont disponibles ; sinon, OpenClaw se rabat sur des identifiants OAuth/API-key correspondants
  issus des profils d’authentification, de l’env ou de la config.

Consultez [Utilisation des tokens et coûts](/fr/reference/token-use) pour plus de détails et d’exemples.

## Comment les clés sont découvertes

OpenClaw peut récupérer les identifiants depuis :

- **Profils d’authentification** (par agent, stockés dans `auth-profiles.json`).
- **Variables d’environnement** (par ex. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) qui peuvent exporter des clés vers l’env du processus de skill.

## Fonctionnalités qui peuvent dépenser des clés

### 1) Réponses du modèle principal (chat + outils)

Chaque réponse ou appel d’outil utilise le **fournisseur de modèle actuel** (OpenAI, Anthropic, etc.). C’est la
principale source d’utilisation et de coût.

Cela inclut aussi les fournisseurs hébergés de type abonnement qui facturent toujours en dehors
de l’interface locale d’OpenClaw, comme **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, et
le parcours de connexion Claude d’OpenClaw via Anthropic avec **Extra Usage** activé.

Consultez [Modèles](/fr/providers/models) pour la config de tarification et [Utilisation des tokens et coûts](/fr/reference/token-use) pour l’affichage.

### 2) Compréhension des médias (audio/image/vidéo)

Les médias entrants peuvent être résumés/transcrits avant l’exécution de la réponse. Cela utilise les API de modèles/fournisseurs.

- Audio : OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Image : OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vidéo : Google / Qwen / Moonshot.

Consultez [Compréhension des médias](/fr/nodes/media-understanding).

### 3) Génération d’images et de vidéos

Les capacités de génération partagées peuvent aussi dépenser des clés fournisseur :

- Génération d’images : OpenAI / Google / DeepInfra / fal / MiniMax
- Génération de vidéos : DeepInfra / Qwen

La génération d’images peut déduire un fournisseur par défaut adossé à l’authentification lorsque
`agents.defaults.imageGenerationModel` n’est pas défini. La génération de vidéos exige actuellement
un `agents.defaults.videoGenerationModel` explicite, tel que
`qwen/wan2.6-t2v`.

Consultez [Génération d’images](/fr/tools/image-generation), [Qwen Cloud](/fr/providers/qwen)
et [Modèles](/fr/concepts/models).

### 4) Embeddings mémoire + recherche sémantique

La recherche sémantique en mémoire utilise des **API d’embeddings** lorsqu’elle est configurée pour des fournisseurs distants :

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "deepinfra"` → embeddings DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings LM Studio (local/auto-hébergé)
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/auto-hébergé ; généralement sans facturation API hébergée)
- Repli facultatif vers un fournisseur distant si les embeddings locaux échouent

Vous pouvez la garder locale avec `memorySearch.provider = "local"` (aucune utilisation d’API).

Consultez [Mémoire](/fr/concepts/memory).

### 5) Outil de recherche web

`web_search` peut entraîner des frais d’utilisation selon votre fournisseur :

- **Brave Search API** : `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa** : `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl** : `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)** : `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)** : profil OAuth xAI, `XAI_API_KEY`, ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)** : `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search** : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search** : sans clé pour un hôte Ollama local connecté et accessible ; la recherche directe `https://ollama.com` utilise `OLLAMA_API_KEY`, et les hôtes protégés par authentification peuvent réutiliser l’authentification bearer normale du fournisseur Ollama
- **Perplexity Search API** : `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily** : `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo** : fournisseur sans clé lorsqu’il est explicitement sélectionné (pas de facturation API, mais non officiel et basé sur HTML)
- **SearXNG** : `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sans clé/auto-hébergé ; pas de facturation API hébergée)

Les chemins fournisseur hérités `tools.web.search.*` se chargent toujours via le shim de compatibilité temporaire, mais ils ne constituent plus la surface de config recommandée.

**Crédit gratuit Brave Search :** Chaque plan Brave inclut 5 \$ par mois de
crédit gratuit renouvelé. Le plan Search coûte 5 \$ pour 1 000 requêtes, donc le crédit couvre
1 000 requêtes par mois sans frais. Définissez votre limite d’utilisation dans le tableau de bord Brave
pour éviter les frais inattendus.

Consultez [Outils web](/fr/tools/web).

### 5) Outil de récupération web (Firecrawl)

`web_fetch` peut appeler **Firecrawl** avec un accès de démarrage sans clé. Ajoutez une clé API
pour des limites plus élevées :

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl n’est pas configuré, l’outil se rabat sur une récupération directe plus le plugin `web-readability` inclus (pas d’API payante). Désactivez `plugins.entries.web-readability.enabled` pour ignorer l’extraction Readability locale.

Consultez [Outils web](/fr/tools/web).

### 6) Instantanés d’utilisation fournisseur (statut/santé)

Certaines commandes de statut appellent des **points de terminaison d’utilisation fournisseur** pour afficher des fenêtres de quota ou l’état d’authentification.
Ce sont généralement des appels à faible volume, mais ils touchent tout de même les API fournisseur :

- `openclaw status --usage`
- `openclaw models status --json`

Consultez [CLI des modèles](/fr/cli/models).

### 7) Résumé de protection Compaction

La protection Compaction peut résumer l’historique de session avec le **modèle actuel**, ce qui
invoque les API fournisseur lorsqu’elle s’exécute.

Consultez [Gestion de session + Compaction](/fr/reference/session-management-compaction).

### 8) Analyse / sonde de modèles

`openclaw models scan` peut sonder des modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque
la sonde est activée.

Consultez [CLI des modèles](/fr/cli/models).

### 9) Talk (parole)

Le mode Talk peut invoquer **ElevenLabs** lorsqu’il est configuré :

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Consultez [Mode Talk](/fr/nodes/talk).

### 10) Skills (API tierces)

Les Skills peuvent stocker `apiKey` dans `skills.entries.<name>.apiKey`. Si un skill utilise cette clé pour des
API externes, il peut entraîner des coûts selon le fournisseur du skill.

Consultez [Skills](/fr/tools/skills).

## Connexe

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
