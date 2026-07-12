---
read_when:
    - Vous souhaitez réduire le coût en jetons des prompts grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans les configurations multi-agents
    - Vous ajustez conjointement le Heartbeat et la purge selon la durée de vie du cache.
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement des fournisseurs et méthodes d’optimisation
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-07-12T03:04:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

La mise en cache des prompts permet à un fournisseur de modèles de réutiliser un préfixe de prompt inchangé (instructions système/développeur, définitions d’outils, autre contexte stable) entre les tours, au lieu de le retraiter à chaque requête. Cela réduit le coût en jetons et la latence lors des sessions de longue durée avec un contexte répété.

OpenClaw normalise l’utilisation des fournisseurs dans `cacheRead` et `cacheWrite` lorsque l’API en amont expose ces compteurs. Les résumés d’utilisation (`/status` et similaires) se rabattent sur la dernière entrée d’utilisation de la transcription lorsque l’instantané de la session active ne contient pas de compteurs de cache ; une valeur active non nulle prévaut toujours sur la valeur de repli.

Références des fournisseurs :

- [Mise en cache des prompts Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Mise en cache des prompts OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Paramètres principaux

### `cacheRetention`

Valeurs : `"none" | "short" | "long"`. Configurable comme valeur par défaut globale, par modèle et par agent.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # aucune | courte | longue
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # remplace la valeur par défaut globale pour ce modèle
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # remplace les deux valeurs par défaut pour cet agent
```

Ordre de fusion (la dernière valeur l’emporte) :

1. `agents.defaults.params` - valeur par défaut globale pour tous les modèles
2. `agents.defaults.models["provider/model"].params` - remplacement par modèle
3. `agents.list[].params` - remplacement par agent, associé selon l’identifiant de l’agent

Source : `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte des résultats d’outils après l’expiration de la fenêtre de durée de vie du cache, afin qu’une requête suivant une période d’inactivité ne remette pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consultez [Élagage des sessions](/fr/concepts/session-pruning) pour connaître le comportement complet.

### Maintien à chaud par Heartbeat

Heartbeat peut maintenir les fenêtres de cache à chaud et réduire les écritures répétées dans le cache après des périodes d’inactivité. Configurable globalement (`agents.defaults.heartbeat`) ou par agent (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportement des fournisseurs

### Anthropic (API directe et Vertex AI)

- `cacheRetention` est pris en charge pour les fournisseurs `anthropic` et `anthropic-vertex`, ainsi que pour les modèles Claude sur `amazon-bedrock` et les points de terminaison personnalisés compatibles avec `anthropic-messages` lorsque `cacheRetention` est défini explicitement.
- Lorsqu’il n’est pas défini, OpenClaw initialise `cacheRetention: "short"` pour Anthropic en accès direct (fournisseurs `anthropic` et `anthropic-vertex` uniquement ; les autres routes de la famille Anthropic exigent une valeur explicite).
- Les réponses Anthropic Messages natives exposent `cache_read_input_tokens` et `cache_creation_input_tokens`, associés à `cacheRead` et `cacheWrite`.
- `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes. `cacheRetention: "long"` demande une durée de vie de 1 heure (`cache_control: { type: "ephemeral", ttl: "1h" }`) lorsqu’il est défini explicitement. Une rétention longue implicite ou pilotée par l’environnement (`OPENCLAW_CACHE_RETENTION=long` sans `cacheRetention` explicite) ne passe à la durée de vie de 1 heure que sur les hôtes `api.anthropic.com` ou Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) ; les autres hôtes conservent le cache de 5 minutes.

Source : `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents pris en charge ; OpenClaw n’injecte pas de marqueurs de cache au niveau des blocs.
- OpenClaw envoie `prompt_cache_key` afin de stabiliser le routage du cache entre les tours. Les hôtes directs `api.openai.com` en bénéficient automatiquement. Les proxys compatibles avec OpenAI (oMLX, llama.cpp, points de terminaison personnalisés) doivent définir `compat.supportsPromptCacheKey: true` dans la configuration du modèle pour l’activer ; ce paramètre n’est jamais détecté automatiquement pour un proxy.
- `prompt_cache_retention: "24h"` n’est ajouté que lorsque `cacheRetention: "long"` est sélectionné et que le point de terminaison résolu prend en charge à la fois la clé de cache et la rétention longue (`compat.supportsLongCacheRetention`, défini sur vrai par défaut ; les profils de compatibilité Together AI et Cloudflare la désactivent). `cacheRetention: "none"` supprime les deux champs.
- Les accès au cache apparaissent via `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (API Responses), associés à `cacheRead`.
- Les charges utiles de l’API Responses peuvent également exposer `input_tokens_details.cache_write_tokens`, associé à `cacheWrite` et facturé au tarif d’écriture dans le cache du modèle ; les charges utiles Responses qui omettent ce champ conservent `cacheWrite` à `0`. L’API Chat Completions d’OpenAI ne documente ni n’émet de compteur `cache_write_tokens`, mais OpenClaw lit néanmoins `prompt_tokens_details.cache_write_tokens` dans ce cas pour les proxys compatibles avec OpenRouter et de type DeepSeek qui signalent un nombre d’écritures distinct.
- En pratique, OpenAI se comporte davantage comme un cache du préfixe initial que comme la réutilisation de l’historique complet glissant d’Anthropic ; consultez les [attentes en conditions réelles pour OpenAI](#openai-live-expectations) ci-dessous.

### Amazon Bedrock

- Les références de modèles Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, ainsi que les préfixes de profils d’inférence système AWS `us.`/`eu.`/`global.anthropic.claude*`) prennent en charge la transmission explicite de `cacheRetention`.
- Les modèles Bedrock autres qu’Anthropic (par exemple `amazon.nova-*`) sont résolus sans rétention de cache à l’exécution, quelle que soit la valeur configurée de `cacheRetention`.
- Les ARN opaques de profils d’inférence d’applications Bedrock (identifiants de profil ne contenant pas `claude`) sont également résolus sans rétention de cache, sauf si `cacheRetention` est défini explicitement, car la famille du modèle ne peut pas être déduite du seul ARN.

### OpenRouter

Pour les références de modèles `openrouter/anthropic/*`, OpenClaw injecte des marqueurs Anthropic `cache_control` dans les blocs de prompts système/développeur, mais uniquement lorsque la requête cible toujours une route OpenRouter vérifiée (`openrouter` sur son point de terminaison par défaut, ou tout fournisseur/URL de base résolu vers `openrouter.ai`). Le rediriger vers une URL de proxy arbitraire compatible avec OpenAI interrompt cette injection.

`contextPruning.mode: "cache-ttl"` est autorisé pour les références de modèles `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` et `openrouter/zai/*`, car ces routes gèrent la mise en cache des prompts côté fournisseur sans nécessiter les marqueurs injectés par OpenClaw.

Source : `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La création du cache DeepSeek sur OpenRouter s’effectue au mieux et peut prendre quelques secondes ; une requête immédiatement consécutive peut encore afficher `cached_tokens: 0`. Vérifiez avec une requête répétée ayant le même préfixe après un court délai, en utilisant `usage.prompt_tokens_details.cached_tokens` comme indicateur d’accès au cache.

### Google Gemini (API directe)

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les accès au cache via `cachedContentTokenCount` en amont, associé à `cacheRead`.
- Familles de modèles admissibles : `gemini-2.5*` et `gemini-3*` (à l’exclusion des variantes Live/d’aperçu ne correspondant pas à ces préfixes, par exemple `gemini-live-2.5-flash-preview`).
- Lorsque `cacheRetention` est défini sur un modèle admissible, OpenClaw crée, réutilise et actualise automatiquement une ressource `cachedContents` pour le prompt système ; aucun identifiant de contenu mis en cache manuel n’est nécessaire. La durée de vie est de `300s` pour `cacheRetention: "short"` et de `3600s` pour `"long"`.
- Vous pouvez toujours transmettre un identifiant de contenu mis en cache Gemini préexistant via `params.cachedContent` (ou l’ancien `params.cached_content`) ; un identifiant explicite ignore entièrement le mécanisme de gestion automatique du cache.
- Ce mécanisme est distinct de la mise en cache des préfixes de prompts Anthropic/OpenAI : OpenClaw gère une ressource `cachedContents` native du fournisseur pour Gemini au lieu d’injecter des marqueurs de cache en ligne.

Source : `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Fournisseurs pilotés par une CLI (Claude Code, Gemini CLI)

Les moteurs CLI qui émettent des événements d’utilisation JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passent par un analyseur d’utilisation commun qui reconnaît plusieurs variantes de noms de champs, notamment un simple compteur `cached` associé à `cacheRead`. Lorsque la charge utile JSON de la CLI omet un champ direct de jetons d’entrée, OpenClaw le calcule sous la forme `input_tokens - cached`. Il s’agit uniquement d’une normalisation de l’utilisation : cela ne crée pas de marqueurs de cache de prompts de type Anthropic/OpenAI pour ces modèles pilotés par une CLI.

Source : `src/agents/cli-output.ts` (`toCliUsage`).

### Autres fournisseurs

Si un fournisseur ne prend en charge aucun des modes de cache ci-dessus, `cacheRetention` n’a aucun effet.

## Limite du cache du prompt système

OpenClaw divise le prompt système en un **préfixe stable** et un **suffixe variable** au niveau d’une limite interne du préfixe de cache. Le contenu situé au-dessus de la limite (définitions d’outils, métadonnées des Skills, fichiers de l’espace de travail) est ordonné de manière à rester identique octet par octet entre les tours. Le contenu situé sous la limite (par exemple `HEARTBEAT.md`, les horodatages d’exécution et d’autres métadonnées propres à chaque tour) peut changer sans invalider le préfixe mis en cache.

Principaux choix de conception :

- Les fichiers de contexte de projet stables de l’espace de travail sont placés avant `HEARTBEAT.md`, afin que les variations du Heartbeat n’invalident pas le préfixe stable.
- La limite s’applique à la mise en forme des transports des familles Anthropic et OpenAI, de Google et de la CLI, afin que tous les fournisseurs pris en charge bénéficient de la même stabilité du préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont acheminées via une mise en forme du cache tenant compte de la limite, afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.
- Les empreintes des prompts système sont normalisées (espaces, fins de ligne, contexte ajouté par les hooks, ordre des capacités d’exécution), afin que les prompts sémantiquement inchangés partagent le cache entre les tours.

Si vous observez des pics inattendus de `cacheWrite` après une modification de configuration ou de l’espace de travail, vérifiez si celle-ci se situe au-dessus ou au-dessous de la limite du cache. Déplacer le contenu variable sous la limite (ou le stabiliser) résout généralement le problème.

## Mécanismes de protection de la stabilité du cache d’OpenClaw

- Les catalogues d’outils MCP intégrés sont triés de manière déterministe (d’abord par nom de serveur, puis par nom d’outil) avant l’enregistrement des outils, afin que les changements d’ordre de `listTools()` ne modifient pas le bloc d’outils et n’invalident pas les préfixes du cache de prompts.
- Les anciennes sessions comportant des blocs d’images persistants conservent intacts les **3 tours terminés les plus récents** (en comptant tous les tours terminés, pas seulement ceux comportant des images). Les anciens blocs d’images déjà traités sont remplacés par un marqueur textuel, afin que les requêtes consécutives riches en images ne continuent pas à renvoyer de grandes charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (valeur par défaut recommandée)

Conservez une base de longue durée sur votre agent principal et désactivez la mise en cache sur les agents de notification à activité intermittente :

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Configuration de référence privilégiant les coûts

- Définissez la valeur de référence `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Conservez un intervalle de Heartbeat inférieur à votre durée de vie uniquement pour les agents qui bénéficient de caches maintenus à chaud.

## Tests de régression en conditions réelles

OpenClaw exécute une porte de régression combinée du cache en conditions réelles couvrant les préfixes répétés, les tours d’outils, les tours d’images, les transcriptions d’outils de type MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez-la avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les valeurs les plus récemment observées en conditions réelles, ainsi que les seuils minimaux de régression propres à chaque fournisseur que le test vérifie. Chaque exécution utilise de nouveaux identifiants de session et espaces de noms de prompts propres à l’exécution, afin que l’état de cache précédent ne contamine pas l’échantillon actuel. Anthropic et OpenAI appliquent des règles différentes : le non-respect d’un seuil minimal Anthropic constitue une régression bloquante (le test échoue), tandis que le non-respect d’un seuil minimal OpenAI fait uniquement l’objet d’une surveillance (enregistré comme avertissement, sans faire échouer l’exécution). Ils ne partagent pas un seuil unique commun à tous les fournisseurs.

### Attentes en conditions réelles pour Anthropic

- Attendez-vous à des écritures explicites de préchauffage via `cacheWrite`.
- Attendez-vous à une réutilisation de la quasi-totalité de l’historique lors des tours répétés, car le contrôle du cache d’Anthropic fait progresser le point de rupture du cache au fil de la conversation.
- Les seuils minimaux de référence pour les parcours stables, avec outils, avec images et de type MCP constituent des barrières strictes contre les régressions.

### Attentes pour les tests en conditions réelles avec OpenAI

- Attendez-vous uniquement à `cacheRead` ; `cacheWrite` reste à `0` avec Chat Completions.
- Considérez la réutilisation du cache lors des tours répétés comme un plateau propre au fournisseur, et non comme une réutilisation progressive de l’historique complet à la manière d’Anthropic.
- Les seuils sont uniquement surveillés (un seuil non atteint est journalisé comme avertissement, sans entraîner l’échec du test) et sont dérivés du comportement observé en conditions réelles avec `gpt-5.4-mini` :

| Scénario                   | Seuil de `cacheRead` | Seuil du taux de succès |
| -------------------------- | -------------------: | ----------------------: |
| Préfixe stable             |                4 608 |                    0,90 |
| Transcription avec outils  |                4 096 |                    0,85 |
| Transcription avec images  |                3 840 |                    0,82 |
| Transcription de type MCP  |                4 096 |                    0,85 |

Les valeurs de référence observées le plus récemment (dans `live-cache-regression-baseline.ts`) étaient les suivantes : préfixe stable `cacheRead=4864`, taux de succès `0,966` ; transcription avec outils `cacheRead=4608`, taux de succès `0,896` ; transcription avec images `cacheRead=4864`, taux de succès `0,954` ; transcription de type MCP `cacheRead=4608`, taux de succès `0,891`.

Pourquoi les assertions diffèrent : Anthropic expose des points de rupture de cache explicites et une réutilisation progressive de l’historique de conversation, tandis que le préfixe effectivement réutilisable d’OpenAI dans le trafic réel peut atteindre un plateau avant le prompt complet. Comparer les deux fournisseurs à un seuil de pourcentage unique et commun produit de fausses régressions.

## Configuration de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facultatif
    includeMessages: false # true par défaut
    includePrompt: false # true par défaut
    includeSystem: false # true par défaut
```

Valeurs par défaut :

| Clé               | Valeur par défaut                           |
| ----------------- | ------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                      |
| `includePrompt`   | `true`                                      |
| `includeSystem`   | `true`                                      |

### Variables d’environnement (débogage ponctuel)

| Variable                             | Effet                                           |
| ------------------------------------ | ----------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Active le traçage du cache                      |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Remplace le chemin de sortie                    |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Active ou désactive la capture complète des messages |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Active ou désactive la capture du texte du prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Active ou désactive la capture du prompt système |

### Éléments à examiner

- Les événements de traçage du cache sont au format JSONL et comportent des instantanés par étape tels que `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’incidence des jetons mis en cache à chaque tour est visible dans les interfaces d’utilisation habituelles : `cacheRead` et `cacheWrite` apparaissent dans `/usage tokens`, `/status`, les récapitulatifs d’utilisation des sessions et les mises en page personnalisées de `messages.usageTemplate`.
- Pour Anthropic, attendez-vous à voir à la fois `cacheRead` et `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à voir `cacheRead` lors des accès réussis au cache ; `cacheWrite` n’est renseigné que dans les charges utiles de Responses API qui l’incluent (voir [OpenAI](#openai-direct-api) ci-dessus).
- OpenAI renvoie également des en-têtes de traçage et de limitation du débit, tels que `x-request-id`, `openai-processing-ms` et `x-ratelimit-*` ; utilisez-les pour tracer les requêtes, mais le décompte des accès réussis au cache doit toujours provenir de la charge utile d’utilisation, et non des en-têtes.

## Dépannage rapide

- **Valeur élevée de `cacheWrite` à la plupart des tours** : recherchez des entrées volatiles dans le prompt système ; vérifiez que le modèle ou le fournisseur prend en charge vos paramètres de cache.
- **Valeur élevée de `cacheWrite` avec Anthropic** : cela signifie souvent que le point de rupture du cache se situe sur du contenu qui change à chaque requête.
- **Valeur faible de `cacheRead` avec OpenAI** : vérifiez que le préfixe stable se trouve au début, que le préfixe répété contient au moins 1 024 jetons et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- **Aucun effet de `cacheRetention`** : vérifiez que la clé du modèle correspond à `agents.defaults.models["provider/model"]`.
- **Requêtes Bedrock Nova avec des paramètres de cache** : comportement attendu — celles-ci sont résolues sans conservation du cache lors de l’exécution.

Documentation connexe :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Contenu connexe

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
