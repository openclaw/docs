---
read_when:
    - Vous souhaitez réduire le coût en tokens des prompts grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans les configurations multi-agents
    - Vous ajustez conjointement l’élagage du Heartbeat et celui du TTL du cache
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement des fournisseurs et méthodes d’optimisation
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-07-12T15:49:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

La mise en cache du prompt permet à un fournisseur de modèles de réutiliser un préfixe de prompt inchangé (instructions système/développeur, définitions d’outils, autre contexte stable) d’un tour à l’autre au lieu de le retraiter à chaque requête. Cela réduit le coût en jetons et la latence des sessions de longue durée comportant un contexte répété.

OpenClaw normalise l’utilisation du fournisseur dans `cacheRead` et `cacheWrite` lorsque l’API en amont expose ces compteurs. Les récapitulatifs d’utilisation (`/status` et similaires) utilisent en dernier recours la dernière entrée d’utilisation de la transcription lorsque l’instantané de la session active ne contient pas les compteurs de cache ; une valeur active non nulle prévaut toujours sur cette valeur de secours.

Références des fournisseurs :

- [Mise en cache du prompt d’Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Mise en cache du prompt d’OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Paramètres principaux

### `cacheRetention`

Valeurs : `"none" | "short" | "long"`. Configurable comme valeur par défaut globale, par modèle et par agent.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # remplace la valeur par défaut globale pour ce modèle
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # remplace les deux valeurs par défaut pour cet agent
```

Ordre de fusion (la dernière valeur prévaut) :

1. `agents.defaults.params` - valeur par défaut globale pour tous les modèles
2. `agents.defaults.models["provider/model"].params` - remplacement par modèle
3. `agents.list[].params` - remplacement par agent, mis en correspondance selon l’identifiant de l’agent

Source : `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte des résultats d’outils après l’expiration de la fenêtre TTL du cache, afin qu’une requête effectuée après une période d’inactivité ne remette pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consultez [Élagage de session](/fr/concepts/session-pruning) pour connaître le comportement complet.

### Maintien à chaud par Heartbeat

Heartbeat peut maintenir les fenêtres de cache actives et réduire les écritures répétées dans le cache après des périodes d’inactivité. Configurable globalement (`agents.defaults.heartbeat`) ou par agent (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportement des fournisseurs

### Anthropic (API directe et Vertex AI)

- `cacheRetention` est pris en charge pour les fournisseurs `anthropic` et `anthropic-vertex`, ainsi que pour les modèles Claude sur `amazon-bedrock` et les points de terminaison personnalisés compatibles avec `anthropic-messages` lorsque `cacheRetention` est défini explicitement.
- Lorsqu’il n’est pas défini, OpenClaw initialise `cacheRetention: "short"` pour Anthropic en accès direct (fournisseurs `anthropic` et `anthropic-vertex` uniquement ; les autres routes de la famille Anthropic nécessitent une valeur explicite).
- Les réponses natives d’Anthropic Messages exposent `cache_read_input_tokens` et `cache_creation_input_tokens`, associés respectivement à `cacheRead` et `cacheWrite`.
- `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes. `cacheRetention: "long"` demande une durée de vie de 1 heure (`cache_control: { type: "ephemeral", ttl: "1h" }`) lorsqu’il est défini explicitement. Une conservation longue implicite ou pilotée par l’environnement (`OPENCLAW_CACHE_RETENTION=long` sans `cacheRetention` explicite) ne passe à la durée de vie de 1 heure que sur les hôtes `api.anthropic.com` ou Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) ; les autres hôtes conservent le cache de 5 minutes.

Source : `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents compatibles ; OpenClaw n’injecte pas de marqueurs de cache au niveau des blocs.
- OpenClaw envoie `prompt_cache_key` pour maintenir un routage stable du cache d’un tour à l’autre. Les hôtes directs `api.openai.com` en bénéficient automatiquement. Les proxys compatibles avec OpenAI (oMLX, llama.cpp, points de terminaison personnalisés) doivent définir `compat.supportsPromptCacheKey: true` dans la configuration du modèle pour l’activer ; cette prise en charge n’est jamais détectée automatiquement pour un proxy.
- `prompt_cache_retention: "24h"` n’est ajouté que lorsque `cacheRetention: "long"` est sélectionné et que le point de terminaison résolu prend en charge à la fois la clé de cache et la conservation longue (`compat.supportsLongCacheRetention`, activé par défaut ; les profils de compatibilité Together AI et Cloudflare le désactivent). `cacheRetention: "none"` supprime les deux champs.
- Les accès réussis au cache sont exposés par `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (Responses API), associés à `cacheRead`.
- Les charges utiles de Responses API peuvent également exposer `input_tokens_details.cache_write_tokens`, associé à `cacheWrite` et facturé au tarif d’écriture en cache du modèle ; les charges utiles Responses qui omettent ce champ maintiennent `cacheWrite` à `0`. L’API Chat Completions d’OpenAI ne documente ni n’émet de compteur `cache_write_tokens`, mais OpenClaw y lit tout de même `prompt_tokens_details.cache_write_tokens` pour les proxys compatibles avec OpenRouter et de type DeepSeek qui indiquent un nombre d’écritures distinct.
- En pratique, OpenAI se comporte davantage comme un cache de préfixe initial que comme la réutilisation glissante de l’historique complet d’Anthropic ; consultez [Attentes en conditions réelles pour OpenAI](#openai-live-expectations) ci-dessous.

### Amazon Bedrock

- Les références de modèles Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, ainsi que les préfixes de profils d’inférence système AWS `us.`/`eu.`/`global.anthropic.claude*`) prennent en charge la transmission explicite de `cacheRetention`.
- Les modèles Bedrock autres qu’Anthropic (par exemple `amazon.nova-*`) sont résolus sans conservation du cache à l’exécution, quelle que soit la valeur configurée de `cacheRetention`.
- Les ARN opaques de profils d’inférence d’application Bedrock (identifiants de profil ne contenant pas `claude`) sont également résolus sans conservation du cache, sauf si `cacheRetention` est défini explicitement, car la famille du modèle ne peut pas être déduite du seul ARN.

### OpenRouter

Pour les références de modèles `openrouter/anthropic/*`, OpenClaw injecte des marqueurs Anthropic `cache_control` dans les blocs de prompts système/développeur, mais uniquement lorsque la requête cible toujours une route OpenRouter vérifiée (`openrouter` sur son point de terminaison par défaut, ou tout fournisseur ou URL de base résolu vers `openrouter.ai`). Le fait de rediriger le modèle vers une URL de proxy arbitraire compatible avec OpenAI désactive cette injection.

`contextPruning.mode: "cache-ttl"` est autorisé pour les références de modèles `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` et `openrouter/zai/*`, car ces routes gèrent la mise en cache des prompts côté fournisseur sans nécessiter les marqueurs injectés par OpenClaw.

Source : `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La création du cache DeepSeek sur OpenRouter s’effectue au mieux et peut prendre quelques secondes ; une requête de suivi immédiate peut donc encore afficher `cached_tokens: 0`. Vérifiez avec une requête répétée utilisant le même préfixe après un court délai, en prenant `usage.prompt_tokens_details.cached_tokens` comme indicateur d’accès au cache.

### Google Gemini (API directe)

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les accès au cache via la valeur amont `cachedContentTokenCount`, convertie en `cacheRead`.
- Familles de modèles admissibles : `gemini-2.5*` et `gemini-3*` (à l’exclusion des variantes Live/preview qui ne correspondent pas à ces préfixes, par exemple `gemini-live-2.5-flash-preview`).
- Lorsque `cacheRetention` est défini sur un modèle admissible, OpenClaw crée, réutilise et actualise automatiquement une ressource `cachedContents` pour l’invite système ; aucun identifiant manuel de contenu mis en cache n’est nécessaire. La TTL est de `300s` pour `cacheRetention: "short"` et de `3600s` pour `"long"`.
- Vous pouvez toujours transmettre un identifiant de contenu Gemini mis en cache préexistant via `params.cachedContent` (ou l’ancien `params.cached_content`) ; un identifiant explicite ignore entièrement le chemin de gestion automatique du cache.
- Ce mécanisme est distinct de la mise en cache des préfixes d’invite d’Anthropic/OpenAI : OpenClaw gère une ressource `cachedContents` native du fournisseur pour Gemini au lieu d’injecter des marqueurs de cache en ligne.

Source : `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Fournisseurs avec harnais CLI (Claude Code, Gemini CLI)

Les moteurs CLI qui émettent des événements d’utilisation JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passent par un analyseur d’utilisation partagé qui reconnaît plusieurs variantes de noms de champs, notamment un compteur simple `cached` converti en `cacheRead`. Lorsque la charge utile JSON de la CLI omet un champ direct pour les jetons d’entrée, OpenClaw le calcule sous la forme `input_tokens - cached`. Il s’agit uniquement d’une normalisation de l’utilisation : elle ne crée pas de marqueurs de cache d’invite de type Anthropic/OpenAI pour ces modèles pilotés par CLI.

Source : `src/agents/cli-output.ts` (`toCliUsage`).

### Autres fournisseurs

Si un fournisseur ne prend en charge aucun des modes de cache ci-dessus, `cacheRetention` n’a aucun effet.

## Limite du cache de l’invite système

OpenClaw divise l’invite système en un **préfixe stable** et un **suffixe volatil** au niveau d’une limite interne du préfixe de cache. Le contenu situé au-dessus de la limite (définitions d’outils, métadonnées des Skills, fichiers de l’espace de travail) est ordonné afin de rester identique octet par octet d’un tour à l’autre. Le contenu situé sous la limite (par exemple `HEARTBEAT.md`, les horodatages d’exécution et les autres métadonnées propres à chaque tour) peut changer sans invalider le préfixe mis en cache.

Principaux choix de conception :

- Les fichiers stables du contexte de projet de l’espace de travail sont placés avant `HEARTBEAT.md`, afin que les variations du Heartbeat n’invalident pas le préfixe stable.
- La limite s’applique à la mise en forme des transports de la famille Anthropic, de la famille OpenAI, de Google et de la CLI, afin que tous les fournisseurs pris en charge bénéficient de la même stabilité du préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont acheminées à travers une mise en forme du cache tenant compte de la limite, afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.
- Les empreintes des invites système sont normalisées (espaces, fins de ligne, contexte ajouté par les hooks, ordre des capacités d’exécution), afin que les invites sémantiquement inchangées partagent le cache d’un tour à l’autre.

Si vous constatez des pics inattendus de `cacheWrite` après une modification de la configuration ou de l’espace de travail, vérifiez si celle-ci se situe au-dessus ou au-dessous de la limite du cache. Déplacer le contenu volatil sous la limite (ou le stabiliser) résout généralement le problème.

## Protections de stabilité du cache d’OpenClaw

- Les catalogues d’outils MCP intégrés sont triés de façon déterministe (d’abord par nom de serveur, puis par nom d’outil) avant l’enregistrement des outils, afin que les changements d’ordre de `listTools()` ne modifient pas continuellement le bloc des outils et n’invalident pas les préfixes du cache d’invite.
- Les anciennes sessions contenant des blocs d’images persistants conservent intacts les **3 tours terminés les plus récents** (en comptant tous les tours terminés, pas uniquement ceux comportant des images). Les blocs d’images plus anciens déjà traités sont remplacés par un marqueur textuel, afin que les requêtes de suivi riches en images ne continuent pas à renvoyer d’importantes charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (configuration par défaut recommandée)

Conservez une base de référence durable sur votre agent principal et désactivez la mise en cache sur les agents de notification à activité irrégulière :

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

### Base de référence privilégiant les coûts

- Définissez la valeur de base `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Maintenez l’intervalle du Heartbeat inférieur à votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Tests de régression en conditions réelles

OpenClaw exécute un contrôle combiné de régression du cache en conditions réelles couvrant les préfixes répétés, les tours avec outils, les tours avec images, les transcriptions d’outils de type MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez-le avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les nombres observés le plus récemment en conditions réelles, ainsi que les seuils minimaux de régression propres aux fournisseurs auxquels le test compare les résultats. Chaque exécution utilise de nouveaux identifiants de session et espaces de noms d’invite propres à l’exécution, afin que l’état du cache précédent ne contamine pas l’échantillon actuel. Anthropic et OpenAI appliquent des règles différentes : le non-respect d’un seuil minimal Anthropic constitue une régression bloquante (le test échoue), tandis que le non-respect d’un seuil minimal OpenAI fait uniquement l’objet d’une surveillance (enregistré comme avertissement, sans faire échouer l’exécution). Ils ne partagent pas un seuil unique commun à tous les fournisseurs.

### Résultats attendus en conditions réelles pour Anthropic

- Attendez-vous à des écritures explicites de préchauffage via `cacheWrite`.
- Attendez-vous à une réutilisation de la quasi-totalité de l’historique lors des tours répétés, car le contrôle du cache d’Anthropic fait progresser le point de rupture du cache au fil de la conversation.
- Les seuils de référence pour les parcours stables, d’outils, d’images et de type MCP constituent des barrières strictes contre les régressions.

### Comportement attendu d’OpenAI en conditions réelles

- Attendez-vous uniquement à `cacheRead` ; `cacheWrite` reste à `0` avec Chat Completions.
- Considérez la réutilisation du cache lors des tours répétés comme un plateau propre au fournisseur, et non comme la réutilisation mobile de l’historique complet propre à Anthropic.
- Les seuils sont uniquement surveillés (un seuil non atteint est consigné comme avertissement, et non comme échec de test) et dérivés du comportement observé en conditions réelles sur `gpt-5.4-mini` :

| Scénario                   | Seuil de `cacheRead` | Seuil de taux de succès |
| -------------------------- | -------------------: | ----------------------: |
| Préfixe stable             |                4,608 |                    0.90 |
| Transcription d’outil      |                4,096 |                    0.85 |
| Transcription d’image      |                3,840 |                    0.82 |
| Transcription de type MCP  |                4,096 |                    0.85 |

Les valeurs de référence observées le plus récemment (dans `live-cache-regression-baseline.ts`) étaient les suivantes : préfixe stable `cacheRead=4864`, taux de succès `0.966` ; transcription d’outil `cacheRead=4608`, taux de succès `0.896` ; transcription d’image `cacheRead=4864`, taux de succès `0.954` ; transcription de type MCP `cacheRead=4608`, taux de succès `0.891`.

Pourquoi les assertions diffèrent : Anthropic expose des points de rupture de cache explicites et une réutilisation mobile de l’historique de conversation, tandis que le préfixe effectivement réutilisable d’OpenAI dans le trafic réel peut atteindre un plateau avant l’invite complète. Comparer les deux fournisseurs selon un seuil de pourcentage unique commun aux fournisseurs produit de fausses régressions.

## Configuration de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facultatif
    includeMessages: false # valeur par défaut : true
    includePrompt: false # valeur par défaut : true
    includeSystem: false # valeur par défaut : true
```

Valeurs par défaut :

| Clé               | Valeur par défaut                            |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variables d’environnement (débogage ponctuel)

| Variable                             | Effet                                              |
| ------------------------------------ | -------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Active le traçage du cache                         |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Remplace le chemin de sortie                       |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Active ou désactive la capture complète des messages |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Active ou désactive la capture du texte de l’invite |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Active ou désactive la capture de l’invite système |

### Éléments à examiner

- Les événements de traçage du cache sont au format JSONL, avec des instantanés par étape tels que `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’incidence des jetons de cache par tour est visible dans les surfaces d’utilisation habituelles : `cacheRead` et `cacheWrite` apparaissent dans `/usage tokens`, `/status`, les récapitulatifs d’utilisation des sessions et les mises en page personnalisées de `messages.usageTemplate`.
- Avec Anthropic, attendez-vous à la présence de `cacheRead` et de `cacheWrite` lorsque la mise en cache est active.
- Avec OpenAI, attendez-vous à `cacheRead` lors des accès réussis au cache ; `cacheWrite` n’est renseigné que dans les charges utiles de l’API Responses qui l’incluent (voir [OpenAI](#openai-direct-api) ci-dessus).
- OpenAI renvoie également des en-têtes de traçage et de limitation du débit tels que `x-request-id`, `openai-processing-ms` et `x-ratelimit-*` ; utilisez-les pour tracer les requêtes, mais la comptabilisation des accès réussis au cache doit toujours provenir de la charge utile d’utilisation, et non des en-têtes.

## Dépannage rapide

- **Valeur élevée de `cacheWrite` lors de la plupart des tours** : recherchez des entrées volatiles dans l’invite système ; vérifiez que le modèle ou le fournisseur prend en charge vos paramètres de cache.
- **Valeur élevée de `cacheWrite` avec Anthropic** : cela signifie souvent que le point de rupture du cache se situe dans un contenu qui change à chaque requête.
- **Valeur faible de `cacheRead` avec OpenAI** : vérifiez que le préfixe stable se trouve au début, que le préfixe répété contient au moins 1024 jetons et que la même valeur de `prompt_cache_key` est réutilisée pour les tours qui doivent partager un cache.
- **Aucun effet de `cacheRetention`** : vérifiez que la clé du modèle correspond à `agents.defaults.models["provider/model"]`.
- **Requêtes Bedrock Nova avec des paramètres de cache** : comportement attendu — celles-ci sont résolues sans conservation du cache lors de l’exécution.

Documentation associée :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation et coût des jetons](/fr/reference/token-use)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Ressources associées

- [Utilisation et coût des jetons](/fr/reference/token-use)
- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
