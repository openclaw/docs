---
read_when:
    - Vous souhaitez réduire le coût en jetons des prompts grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache propre à chaque agent dans les configurations multi-agents
    - Vous ajustez conjointement le Heartbeat et l’élagage selon la durée de vie du cache.
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement des fournisseurs et méthodes d’optimisation
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-07-16T13:47:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

La mise en cache des prompts permet à un fournisseur de modèles de réutiliser un préfixe de prompt inchangé (instructions système/développeur, définitions d'outils, autre contexte stable) d'un tour à l'autre au lieu de le retraiter à chaque requête. Cela réduit le coût en jetons et la latence des sessions de longue durée dont le contexte se répète.

OpenClaw normalise l'utilisation du fournisseur dans `cacheRead` et `cacheWrite` partout où l'API en amont expose ces compteurs. Les récapitulatifs d'utilisation (`/status` et similaires) se rabattent sur la dernière entrée d'utilisation de la transcription lorsque l'instantané de la session en direct ne contient pas de compteurs de cache ; une valeur en direct non nulle prévaut toujours sur la valeur de secours.

Références des fournisseurs :

- [Mise en cache des prompts Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Mise en cache des prompts OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Paramètres principaux

### `cacheRetention`

Valeurs : `"none" | "short" | "long"`. Configurable comme valeur globale par défaut, par modèle et par agent.
`"standard"` n'est pas un alias ; utilisez `"short"` pour la fenêtre de cache par défaut du fournisseur. Les valeurs non valides sont ignorées avec un avertissement.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # remplace la valeur globale par défaut pour ce modèle
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # remplace les deux valeurs par défaut pour cet agent
```

Ordre de fusion (la dernière valeur prévaut) :

1. `agents.defaults.params` - valeur globale par défaut pour tous les modèles
2. `agents.defaults.models["provider/model"].params` - remplacement par modèle
3. `agents.list[].params` - remplacement par agent, mis en correspondance selon l'identifiant de l'agent

Source : `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Élague l'ancien contexte des résultats d'outils après l'expiration de la fenêtre TTL du cache, afin qu'une requête suivant une période d'inactivité ne remette pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consultez [Élagage des sessions](/fr/concepts/session-pruning) pour connaître le comportement complet.

### Maintien à chaud par Heartbeat

Heartbeat peut maintenir les fenêtres de cache à chaud et réduire les écritures répétées dans le cache après des périodes d'inactivité. Configurable globalement (`agents.defaults.heartbeat`) ou par agent (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportement des fournisseurs

### Anthropic (API directe et Vertex AI)

- `cacheRetention` est pris en charge pour les fournisseurs `anthropic` et `anthropic-vertex`, ainsi que pour les modèles Claude sur `amazon-bedrock` et les points de terminaison personnalisés compatibles avec `anthropic-messages` lorsque `cacheRetention` est défini explicitement.
- Lorsqu'il n'est pas défini, OpenClaw initialise `cacheRetention: "short"` pour Anthropic en accès direct (fournisseurs `anthropic` et `anthropic-vertex` uniquement ; les autres routes de la famille Anthropic nécessitent une valeur explicite).
- Les réponses Anthropic Messages natives exposent `cache_read_input_tokens` et `cache_creation_input_tokens`, associés à `cacheRead` et `cacheWrite`.
- `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes. `cacheRetention: "long"` demande le TTL de 1 heure (`cache_control: { type: "ephemeral", ttl: "1h" }`) lorsqu'il est défini explicitement. Une conservation longue implicite ou pilotée par l'environnement (`OPENCLAW_CACHE_RETENTION=long` sans `cacheRetention` explicite) ne passe au TTL de 1 heure que sur `api.anthropic.com` ou les hôtes Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`) ; les autres hôtes conservent le cache de 5 minutes.

Source : `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents pris en charge ; OpenClaw n'injecte pas de marqueurs de cache au niveau des blocs.
- OpenClaw envoie `prompt_cache_key` pour maintenir un routage stable du cache d'un tour à l'autre. Les hôtes `api.openai.com` directs le reçoivent automatiquement. Les proxys compatibles avec OpenAI (oMLX, llama.cpp, points de terminaison personnalisés) nécessitent `compat.supportsPromptCacheKey: true` dans la configuration du modèle pour l'activer ; cela n'est jamais détecté automatiquement pour un proxy.
- `prompt_cache_retention: "24h"` n'est ajouté que lorsque `cacheRetention: "long"` est sélectionné et que le point de terminaison résolu prend en charge à la fois la clé de cache et la conservation longue (`compat.supportsLongCacheRetention`, vrai par défaut ; les profils de compatibilité Together AI et Cloudflare la désactivent). `cacheRetention: "none"` supprime les deux champs.
- Les accès au cache sont exposés par `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (API Responses), associés à `cacheRead`.
- Les charges utiles de l'API Responses peuvent également exposer `input_tokens_details.cache_write_tokens`, associé à `cacheWrite` et facturé au tarif d'écriture dans le cache du modèle ; les charges utiles Responses qui omettent le champ maintiennent `cacheWrite` à `0`. L'API Chat Completions d'OpenAI ne documente ni n'émet de compteur `cache_write_tokens`, mais OpenClaw y lit tout de même `prompt_tokens_details.cache_write_tokens` pour les proxys compatibles avec OpenRouter et de type DeepSeek qui signalent un nombre d'écritures distinct.
- En pratique, OpenAI se comporte davantage comme un cache de préfixe initial que comme la réutilisation mobile de l'historique complet d'Anthropic ; consultez les [attentes d'OpenAI en conditions réelles](#openai-live-expectations) ci-dessous.

### Amazon Bedrock

- Les références de modèles Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, ainsi que les préfixes de profils d'inférence système AWS `us.`/`eu.`/`global.anthropic.claude*`) prennent en charge la transmission explicite de `cacheRetention`.
- Les modèles Bedrock autres qu'Anthropic (par exemple `amazon.nova-*`) sont résolus sans conservation du cache à l'exécution, quelle que soit la valeur `cacheRetention` configurée.
- Les ARN opaques des profils d'inférence d'application Bedrock (identifiants de profil qui ne contiennent pas `claude`) sont également résolus sans conservation du cache, sauf si `cacheRetention` est défini explicitement, car la famille de modèles ne peut pas être déduite du seul ARN.

### OpenRouter

Pour les références de modèles `openrouter/anthropic/*`, OpenClaw injecte des marqueurs Anthropic `cache_control` dans les blocs de prompts système/développeur, mais uniquement lorsque la requête cible toujours une route OpenRouter vérifiée (`openrouter` sur son point de terminaison par défaut, ou tout fournisseur ou toute URL de base résolu en `openrouter.ai`). Le fait de rediriger le modèle vers une URL de proxy arbitraire compatible avec OpenAI arrête cette injection.

`contextPruning.mode: "cache-ttl"` est autorisé pour les références de modèles `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` et `openrouter/zai/*`, car ces routes gèrent la mise en cache des prompts côté fournisseur sans nécessiter les marqueurs injectés par OpenClaw.

Source : `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La création du cache DeepSeek sur OpenRouter est effectuée au mieux et peut prendre quelques secondes ; une requête de suivi immédiate peut encore afficher `cached_tokens: 0`. Vérifiez avec une requête répétée ayant le même préfixe après un court délai, en utilisant `usage.prompt_tokens_details.cached_tokens` comme signal d'accès au cache.

### Google Gemini (API directe)

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les accès au cache par l'intermédiaire de `cachedContentTokenCount` en amont, associé à `cacheRead`.
- Familles de modèles admissibles : `gemini-2.5*` et `gemini-3*` (exclut les variantes Live/d'aperçu hors de cette correspondance de préfixe, par exemple `gemini-live-2.5-flash-preview`).
- Lorsque `cacheRetention` est défini sur un modèle admissible, OpenClaw crée, réutilise et actualise automatiquement une ressource `cachedContents` pour le prompt système ; aucun descripteur manuel de contenu mis en cache n'est nécessaire. Le TTL est de `300s` pour `cacheRetention: "short"` et de `3600s` pour `"long"`.
- Vous pouvez toujours transmettre un descripteur de contenu Gemini préalablement mis en cache sous la forme `params.cachedContent` (ou l'ancien `params.cached_content`) ; un descripteur explicite ignore entièrement le chemin de gestion automatique du cache.
- Ce mécanisme est distinct de la mise en cache des préfixes de prompts d'Anthropic/OpenAI : OpenClaw gère une ressource `cachedContents` native du fournisseur pour Gemini au lieu d'injecter des marqueurs de cache en ligne.

Source : `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Fournisseurs avec harnais CLI (Claude Code, Gemini CLI)

Les backends CLI qui émettent des événements d'utilisation JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passent par un analyseur d'utilisation partagé qui reconnaît plusieurs variantes de noms de champs, notamment un simple compteur `cached` associé à `cacheRead`. Lorsque la charge utile JSON de la CLI omet un champ direct de jetons d'entrée, OpenClaw le calcule comme `input_tokens - cached`. Il s'agit uniquement d'une normalisation de l'utilisation ; cela ne crée pas de marqueurs de cache de prompts de type Anthropic/OpenAI pour ces modèles pilotés par la CLI.

Source : `src/agents/cli-output.ts` (`toCliUsage`).

### Autres fournisseurs

Si un fournisseur ne prend en charge aucun des modes de cache ci-dessus, `cacheRetention` n'a aucun effet.

## Limite de cache du prompt système

OpenClaw divise le prompt système en un **préfixe stable** et un **suffixe volatil** au niveau d'une limite interne de préfixe de cache. Le contenu situé au-dessus de la limite (définitions d'outils, métadonnées de Skills, fichiers de l'espace de travail) est ordonné de manière à rester identique octet par octet d'un tour à l'autre. Le contenu situé sous la limite (par exemple `HEARTBEAT.md`, les horodatages d'exécution et les autres métadonnées propres à chaque tour) peut changer sans invalider le préfixe mis en cache.

Choix de conception principaux :

- Les fichiers stables de contexte de projet de l'espace de travail sont placés avant `HEARTBEAT.md` afin que les variations de Heartbeat n'invalident pas le préfixe stable.
- La limite s'applique à la mise en forme des transports des familles Anthropic et OpenAI, de Google et de la CLI, afin que tous les fournisseurs pris en charge bénéficient de la même stabilité du préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont acheminées au moyen d'une mise en forme du cache tenant compte de la limite, afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.
- Les empreintes des prompts système sont normalisées (espaces, fins de ligne, contexte ajouté par les hooks, ordre des capacités d'exécution) afin que les prompts sémantiquement inchangés partagent le cache d'un tour à l'autre.

Si vous constatez des pics inattendus de `cacheWrite` après une modification de la configuration ou de l'espace de travail, vérifiez si la modification se situe au-dessus ou au-dessous de la limite du cache. Déplacer le contenu volatil sous la limite (ou le stabiliser) résout généralement le problème.

## Garde-fous de stabilité du cache d'OpenClaw

- Les catalogues d'outils MCP intégrés sont triés de manière déterministe (d'abord par nom de serveur, puis par nom d'outil) avant l'enregistrement des outils, afin que les changements d'ordre de `listTools()` ne modifient pas le bloc d'outils et n'invalident pas les préfixes du cache de prompts.
- Les anciennes sessions contenant des blocs d'images persistants conservent intacts les **3 tours terminés les plus récents** (en comptant tous les tours terminés, et pas seulement ceux contenant des images). Les anciens blocs d'images déjà traités sont remplacés par un marqueur textuel, afin que les requêtes de suivi comportant de nombreuses images ne continuent pas à renvoyer d'importantes charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (valeur par défaut recommandée)

Conservez une base de longue durée sur votre agent principal et désactivez la mise en cache sur les agents de notification fonctionnant par rafales :

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

### Base privilégiant les coûts

- Définissez la valeur de base `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Maintenez l'intervalle de Heartbeat inférieur à votre TTL uniquement pour les agents qui bénéficient de caches à chaud.

## Tests de régression en conditions réelles

OpenClaw exécute une seule barrière combinée de régression du cache en conditions réelles, couvrant les préfixes répétés, les tours d'outils, les tours d'images, les transcriptions d'outils de type MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez-la avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les nombres observés en direct les plus récents ainsi que les seuils de régression propres à chaque fournisseur auxquels le test compare les résultats. Chaque exécution utilise de nouveaux identifiants de session et espaces de noms d’invite propres à l’exécution, afin que l’état précédent du cache ne contamine pas l’échantillon actuel. Anthropic et OpenAI appliquent des règles différentes : le non-respect d’un seuil Anthropic constitue une régression bloquante (le test échoue), tandis que le non-respect d’un seuil OpenAI est uniquement surveillé (enregistré comme avertissement, sans faire échouer l’exécution). Ils ne partagent pas un seuil unique commun aux fournisseurs.

### Résultats attendus en direct pour Anthropic

- Attendez-vous à des écritures explicites de préchauffage via `cacheWrite`.
- Attendez-vous à une réutilisation de la quasi-totalité de l’historique lors des tours répétés, car le contrôle du cache d’Anthropic fait progresser le point de rupture du cache au fil de la conversation.
- Les seuils de référence pour les voies stables, d’outils, d’images et de style MCP constituent des barrières de régression bloquantes.

### Résultats attendus en direct pour OpenAI

- Attendez-vous uniquement à `cacheRead` ; `cacheWrite` reste à `0` avec Chat Completions.
- Considérez la réutilisation du cache lors des tours répétés comme un plateau propre au fournisseur, et non comme une réutilisation mobile de l’historique complet à la manière d’Anthropic.
- Les seuils sont uniquement surveillés (un non-respect est consigné comme avertissement, sans entraîner l’échec du test) et sont dérivés du comportement observé en direct sur `gpt-5.4-mini` :

| Scénario                    | Seuil de `cacheRead` | Seuil du taux de réussite |
| --------------------------- | --------------------------: | ------------------------: |
| Préfixe stable              |                       4,608 |                      0.90 |
| Transcription d’outil       |                       4,096 |                      0.85 |
| Transcription d’image       |                       3,840 |                      0.82 |
| Transcription de style MCP  |                       4,096 |                      0.85 |

Les nombres de référence observés le plus récemment (provenant de `live-cache-regression-baseline.ts`) étaient les suivants : préfixe stable `cacheRead=4864`, taux de réussite `0.966` ; transcription d’outil `cacheRead=4608`, taux de réussite `0.896` ; transcription d’image `cacheRead=4864`, taux de réussite `0.954` ; transcription de style MCP `cacheRead=4608`, taux de réussite `0.891`.

Pourquoi les assertions diffèrent : Anthropic expose des points de rupture explicites du cache et une réutilisation mobile de l’historique de conversation, tandis que le préfixe effectivement réutilisable d’OpenAI dans le trafic en direct peut atteindre un plateau avant l’invite complète. Comparer les deux fournisseurs à un seuil de pourcentage unique commun aux fournisseurs produit de fausses régressions.

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

| Clé                       | Valeur par défaut                            |
| ------------------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`                           |
| `includeMessages`        | `true`                           |
| `includePrompt`        | `true`                           |
| `includeSystem`        | `true`                           |

### Variables d’environnement (débogage ponctuel)

| Variable                         | Effet                                           |
| -------------------------------- | ----------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`               | Active le traçage du cache                      |
| `OPENCLAW_CACHE_TRACE_FILE=path`               | Remplace le chemin de sortie                    |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1`               | Active ou désactive la capture complète des messages |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`               | Active ou désactive la capture du texte de l’invite |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`               | Active ou désactive la capture de l’invite système |

### Éléments à examiner

- Les événements de traçage du cache sont au format JSONL, avec des instantanés par étape tels que `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’incidence des jetons de cache par tour est visible dans les surfaces d’utilisation normales : `cacheRead` et `cacheWrite` apparaissent dans `/usage tokens`, `/status`, les récapitulatifs d’utilisation des sessions et les dispositions `messages.usageTemplate` personnalisées.
- Pour Anthropic, attendez-vous à la fois à `cacheRead` et à `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à `cacheRead` en cas de succès du cache ; `cacheWrite` n’est renseigné que dans les charges utiles de l’API Responses qui l’incluent (voir [OpenAI](#openai-direct-api) ci-dessus).
- OpenAI renvoie également des en-têtes de traçage et de limitation de débit tels que `x-request-id`, `openai-processing-ms` et `x-ratelimit-*` ; utilisez-les pour tracer les requêtes, mais la comptabilisation des succès du cache doit toujours provenir de la charge utile d’utilisation, et non des en-têtes.

## Dépannage rapide

- **Valeur élevée de `cacheWrite` sur la plupart des tours** : recherchez des entrées volatiles dans l’invite système ; vérifiez que le modèle ou le fournisseur prend en charge vos paramètres de cache.
- **Valeur élevée de `cacheWrite` sur Anthropic** : cela signifie souvent que le point de rupture du cache se trouve sur du contenu qui change à chaque requête.
- **Valeur faible de `cacheRead` pour OpenAI** : vérifiez que le préfixe stable se trouve au début, que le préfixe répété contient au moins 1024 jetons et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- **Aucun effet de `cacheRetention`** : confirmez que la clé du modèle correspond à `agents.defaults.models["provider/model"]`.
- **Requêtes Bedrock Nova avec des paramètres de cache** : comportement attendu — elles sont résolues sans conservation du cache à l’exécution.

Documentation associée :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation et coût des jetons](/fr/reference/token-use)
- [Élagage des sessions](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Contenu associé

- [Utilisation et coût des jetons](/fr/reference/token-use)
- [Utilisation et coûts de l’API](/fr/reference/api-usage-costs)
