---
read_when:
    - Vous souhaitez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous devez auditer les clés, les coûts et la visibilité de l’utilisation
    - Vous expliquez le rapport des coûts de /status ou /usage
summary: Auditez ce qui peut engendrer des dépenses, les clés utilisées et la manière de consulter l’utilisation
title: Utilisation et coûts de l’API
x-i18n:
    generated_at: "2026-07-12T03:17:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Carte des fonctionnalités d’OpenClaw susceptibles d’appeler des API de fournisseurs payantes, indiquant où chacune lit ses identifiants et où apparaît le coût qui en résulte.

## Où apparaissent les coûts

**`/status`** (instantané par session)

- Affiche le modèle de la session actuelle, l’utilisation du contexte et les tokens de la dernière réponse.
- Ajoute un **coût estimé** pour la dernière réponse lorsqu’OpenClaw dispose des métadonnées d’utilisation et de la tarification locale du modèle actif, y compris pour les fournisseurs sans clé d’API dont le prix est explicitement défini, tels que les modèles Bedrock `aws-sdk`.
- Si l’instantané de la session en cours est incomplet, `/status` récupère les compteurs de tokens et de cache ainsi que le libellé du modèle actif à partir de la dernière entrée d’utilisation de la transcription. Les valeurs actives non nulles existantes prévalent sur les données de transcription ; un total de transcription correspondant à la taille de l’invite peut néanmoins prévaloir lorsque le total stocké est absent ou inférieur.

**`/usage`** (pied de page par message)

- `/usage full` ajoute un pied de page d’utilisation à chaque réponse, avec le **coût estimé** lorsque la tarification locale est configurée et que les métadonnées d’utilisation sont disponibles.
- `/usage tokens` affiche uniquement les tokens. Les exécutions CLI et celles utilisant un abonnement avec OAuth ou un token affichent uniquement les tokens, sauf si elles fournissent des métadonnées d’utilisation compatibles ainsi qu’un prix local explicite.
- `/usage cost` affiche un récapitulatif local des coûts ; `/usage off` désactive le pied de page.
- Remarque concernant Gemini CLI : les sorties `stream-json` et l’ancien format `json` incluent toutes deux l’utilisation dans `stats`. OpenClaw normalise `stats.cached` en `cacheRead` et, si nécessaire, calcule les tokens d’entrée avec `stats.input_tokens - stats.cached`.

**Interface de contrôle → Utilisation** (analyse intersessions)

- Affiche les totaux de tokens et de coûts estimés dérivés des transcriptions pour la plage de dates sélectionnée, avec une ventilation par fournisseur, modèle, agent, canal et type de token.
- Compare des fenêtres calendaires plus courtes se terminant à la date de fin de la plage sélectionnée. Les dates manquantes sont comptabilisées comme des jours calendaires sans utilisation ; elles ne sont pas ignorées pour créer une fenêtre plus dense.
- Indique directement l’échelle du graphique quotidien. Un badge `√` signifie qu’une compression par racine carrée permet de conserver la visibilité des jours à faible utilisation.
- Ces totaux décrivent l’historique local des sessions disponible, et non une facture de fournisseur ni un registre de facturation cumulé. L’interface avertit lorsque la tarification manque pour certaines entrées.

**Fenêtres d’utilisation de la CLI** (quotas des fournisseurs, et non coût par message)

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d’utilisation** des fournisseurs sous la forme `X% left`.
- Fournisseurs actuels prenant en charge les fenêtres d’utilisation : Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (couvre l’authentification OAuth/par token de ChatGPT/Codex), Xiaomi et z.ai. Consultez [CLI des modèles](/fr/cli/models) et [CLI des canaux](/fr/cli/channels) pour obtenir la liste complète des fournisseurs et des indicateurs.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax indiquent le quota restant ; OpenClaw les inverse donc. Les champs fondés sur un décompte prévalent lorsqu’ils sont présents. Si la réponse contient un tableau `model_remains`, OpenClaw sélectionne l’entrée du modèle de discussion, déduit au besoin le libellé de la fenêtre à partir des horodatages et inclut le nom du modèle dans le libellé de l’offre.
- L’authentification utilisée pour consulter l’utilisation provient des hooks propres au fournisseur lorsqu’ils sont disponibles. Dans le cas contraire, OpenClaw utilise les identifiants OAuth ou de clé d’API correspondants provenant des profils d’authentification, de l’environnement ou de la configuration.

Consultez [Utilisation des tokens et coûts](/fr/reference/token-use) pour des exemples détaillés.

<Note>
Anthropic a confirmé que la réutilisation de Claude CLI, notamment `claude -p`, constitue un modèle d’intégration autorisé, sauf publication d’une nouvelle politique. Anthropic ne fournit aucune estimation monétaire par message ; `/usage full` ne peut donc pas afficher le coût de l’utilisation de Claude CLI.
</Note>

## Méthodes de détection des clés

- **Profils d’authentification** : propres à chaque agent, stockés dans `auth-profiles.json`.
- **Variables d’environnement** : par exemple `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuration** : `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills** : `skills.entries.<name>.apiKey`, qui peut exporter la clé vers l’environnement du processus de la Skill.

## Fonctionnalités susceptibles d’utiliser des clés payantes

### Réponses du modèle principal (discussion et outils)

Chaque réponse ou appel d’outil s’exécute sur le fournisseur du modèle actuel. Il s’agit de la principale source d’utilisation et de coûts, y compris pour les offres hébergées par abonnement dont la facturation s’effectue en dehors de l’interface locale d’OpenClaw : OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan et le mode de connexion à Claude d’Anthropic lorsque l’option Extra Usage est activée.

Consultez [Modèles](/fr/providers/models) pour la configuration de la tarification et [Utilisation des tokens et coûts](/fr/reference/token-use) pour l’affichage.

### Compréhension des médias (audio, image et vidéo)

Les médias entrants peuvent être résumés ou transcrits par l’API d’un fournisseur avant l’exécution du pipeline de réponse. La prise en charge des fournisseurs est enregistrée par Plugin et évolue à mesure que des Plugins sont ajoutés ; consultez [Compréhension des médias](/fr/nodes/media-understanding) pour connaître la liste et la configuration actuelles.

### Génération d’images et de vidéos

`image_generate` et `video_generate` acheminent la requête vers tout fournisseur configuré disponible. La génération d’images peut déduire un fournisseur par défaut disposant d’une authentification lorsque `agents.defaults.imageGenerationModel` n’est pas défini ; la génération de vidéos exige une valeur explicite pour `agents.defaults.videoGenerationModel` (par exemple `qwen/wan2.6-t2v`).

Consultez [Génération d’images](/fr/tools/image-generation) et [Génération de vidéos](/fr/tools/video-generation) pour connaître la liste actuelle des fournisseurs.

### Plongements de mémoire et recherche sémantique

La recherche sémantique dans la mémoire utilise des API de plongement lorsque `agents.defaults.memorySearch.provider` désigne un adaptateur distant (par exemple `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` ou `"ollama"` s’exécute sur un serveur local ou auto-hébergé et n’entraîne généralement aucune facturation d’hébergement. `memorySearch.provider = "local"` conserve toutes les opérations sur l’appareil, sans utiliser d’API. Un fournisseur `memorySearch.fallback` facultatif peut prendre le relais en cas d’échec des plongements locaux.

Consultez [Mémoire](/fr/concepts/memory).

### Outil de recherche Web

`web_search` peut entraîner des frais d’utilisation selon le fournisseur sélectionné. Chaque fournisseur lit d’abord sa clé depuis une variable d’environnement, puis depuis `plugins.entries.<id>.config.webSearch.apiKey` :

| Fournisseur            | Variable(s) d’environnement                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | sans clé ; non officiel, fondé sur HTML, sans facturation                                                                                                              |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok (xAI)             | profil OAuth xAI ou `XAI_API_KEY`                                                                                                                                      |
| Kimi (Moonshot)        | `KIMI_API_KEY` ou `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY`                                                                          |
| Ollama Web Search      | sans clé pour un hôte local accessible avec une session ouverte ; la recherche directe sur `https://ollama.com` utilise `OLLAMA_API_KEY` ; les hôtes protégés par authentification réutilisent l’authentification normale par jeton au porteur du fournisseur Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL` ; sans clé/auto-hébergé, sans facturation d’hébergement                                                                                              |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

Les anciens chemins de configuration `tools.web.search.*` sont toujours chargés par l’intermédiaire d’une couche de compatibilité, mais ne constituent plus l’interface recommandée.

**Crédit gratuit Brave Search** : chaque offre comprend un crédit gratuit renouvelable de 5 $ par mois. L’offre Search coûte 5 $ pour 1 000 requêtes ; le crédit couvre donc gratuitement 1 000 requêtes par mois. Définissez une limite d’utilisation dans le tableau de bord Brave afin d’éviter les frais imprévus.

Consultez [Outils Web](/fr/tools/web).

### Outil de récupération Web (Firecrawl)

`web_fetch` peut appeler Firecrawl avec un accès de démarrage sans clé ; ajoutez `FIRECRAWL_API_KEY` (ou `plugins.entries.firecrawl.config.webFetch.apiKey`) pour bénéficier de limites plus élevées. Si Firecrawl n’est pas configuré, l’outil utilise en repli une récupération directe ainsi que le Plugin `web-readability` intégré, sans API payante. Désactivez `plugins.entries.web-readability.enabled` pour ignorer l’extraction Readability locale.

Consultez [Outils Web](/fr/tools/web).

### Instantanés d’utilisation des fournisseurs (état/santé)

`openclaw status --usage` et `openclaw models status --json` appellent les points de terminaison d’utilisation des fournisseurs afin d’afficher les fenêtres de quota ou l’état de l’authentification. Ces appels sont peu fréquents, mais sollicitent tout de même les API des fournisseurs.

Consultez [CLI des modèles](/fr/cli/models).

### Résumé de protection de la Compaction

Le mécanisme de protection de la Compaction peut résumer l’historique de la session à l’aide du modèle actuel, ce qui appelle les API du fournisseur lorsqu’il s’exécute.

Consultez [Gestion des sessions et Compaction](/fr/reference/session-management-compaction).

### Analyse / sondage des modèles

`openclaw models scan` peut sonder les modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque le sondage est activé.

Consultez [CLI des modèles](/fr/cli/models).

### Conversation vocale

Le mode de conversation vocale peut appeler ElevenLabs lorsqu’il est configuré : `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`.

Consultez [Mode de conversation vocale](/fr/nodes/talk).

### Skills (API tierces)

Les Skills peuvent stocker une `apiKey` dans `skills.entries.<name>.apiKey`. Si une Skill utilise cette clé avec une API externe, le coût dépend du fournisseur de la Skill.

Consultez [Skills](/fr/tools/skills).

## Ressources connexes

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Mise en cache des invites](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
