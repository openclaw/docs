---
read_when:
    - Vous souhaitez réduire les coûts en jetons des invites grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans des configurations multi-agents
    - Vous ajustez ensemble l’élagage du Heartbeat et du `cache-ttl`
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement du fournisseur et modèles d’ajustement
title: Mise en cache des invites
x-i18n:
    generated_at: "2026-04-25T13:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

La mise en cache des invites signifie que le fournisseur de modèle peut réutiliser des préfixes d’invite inchangés (généralement les instructions système/développeur et autre contexte stable) d’un tour à l’autre au lieu de les retraiter à chaque fois. OpenClaw normalise l’utilisation du fournisseur en `cacheRead` et `cacheWrite` lorsque l’API amont expose directement ces compteurs.

Les surfaces d’état peuvent également récupérer les compteurs de cache à partir du journal d’utilisation de la transcription la plus récente lorsque l’instantané de session en direct ne les contient pas, afin que `/status` puisse continuer à afficher une ligne de cache après une perte partielle des métadonnées de session. Les valeurs de cache en direct existantes non nulles restent prioritaires sur les valeurs de repli de la transcription.

Pourquoi c’est important : coût en jetons plus faible, réponses plus rapides et performances plus prévisibles pour les sessions de longue durée. Sans mise en cache, les invites répétées paient le coût complet de l’invite à chaque tour même lorsque la majeure partie de l’entrée n’a pas changé.

Les sections ci-dessous couvrent tous les paramètres liés au cache qui affectent la réutilisation des invites et le coût en jetons.

Références des fournisseurs :

- Mise en cache des invites Anthropic : [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Mise en cache des invites OpenAI : [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- En-têtes d’API OpenAI et identifiants de requête : [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identifiants de requête et erreurs Anthropic : [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Paramètres principaux

### `cacheRetention` (valeur par défaut globale, modèle et par agent)

Définissez la conservation du cache comme valeur par défaut globale pour tous les modèles :

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Remplacez par modèle :

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Remplacement par agent :

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordre de fusion de la configuration :

1. `agents.defaults.params` (valeur par défaut globale — s’applique à tous les modèles)
2. `agents.defaults.models["provider/model"].params` (remplacement par modèle)
3. `agents.list[].params` (id d’agent correspondant ; remplace par clé)

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte de résultat d’outil après les fenêtres TTL du cache afin que les requêtes après inactivité ne remettent pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Voir [Élagage de session](/fr/concepts/session-pruning) pour le comportement complet.

### Heartbeat keep-warm

Heartbeat peut maintenir les fenêtres de cache chaudes et réduire les écritures de cache répétées après des périodes d’inactivité.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat par agent est pris en charge dans `agents.list[].heartbeat`.

## Comportement du fournisseur

### Anthropic (API directe)

- `cacheRetention` est pris en charge.
- Avec les profils d’authentification par clé API Anthropic, OpenClaw initialise `cacheRetention: "short"` pour les références de modèle Anthropic lorsqu’elle n’est pas définie.
- Les réponses natives Anthropic Messages exposent à la fois `cache_read_input_tokens` et `cache_creation_input_tokens`, donc OpenClaw peut afficher à la fois `cacheRead` et `cacheWrite`.
- Pour les requêtes Anthropic natives, `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes, et `cacheRetention: "long"` passe au TTL d’1 heure uniquement sur les hôtes directs `api.anthropic.com`.

### OpenAI (API directe)

- La mise en cache des invites est automatique sur les modèles récents pris en charge. OpenClaw n’a pas besoin d’injecter des marqueurs de cache au niveau des blocs.
- OpenClaw utilise `prompt_cache_key` pour garder un routage de cache stable d’un tour à l’autre et utilise `prompt_cache_retention: "24h"` uniquement lorsque `cacheRetention: "long"` est sélectionné sur des hôtes OpenAI directs.
- Les fournisseurs Completions compatibles OpenAI reçoivent `prompt_cache_key` uniquement lorsque leur configuration de modèle définit explicitement `compat.supportsPromptCacheKey: true` ; `cacheRetention: "none"` le supprime toujours.
- Les réponses OpenAI exposent les jetons d’invite mis en cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` sur les événements de l’API Responses). OpenClaw l’associe à `cacheRead`.
- OpenAI n’expose pas de compteur distinct de jetons d’écriture dans le cache, donc `cacheWrite` reste à `0` sur les chemins OpenAI même lorsque le fournisseur réchauffe un cache.
- OpenAI renvoie des en-têtes utiles de traçage et de limitation de débit comme `x-request-id`, `openai-processing-ms` et `x-ratelimit-*`, mais le comptage des accès au cache doit provenir de la charge utile d’utilisation, pas des en-têtes.
- En pratique, OpenAI se comporte souvent comme un cache de préfixe initial plutôt que comme la réutilisation mobile de l’historique complet de style Anthropic. Les tours avec un long préfixe stable peuvent atteindre un plateau proche de `4864` jetons mis en cache dans les sondes en direct actuelles, tandis que les transcriptions riches en outils ou de type MCP plafonnent souvent près de `4608` jetons mis en cache même lors de répétitions exactes.

### Anthropic Vertex

- Les modèles Anthropic sur Vertex AI (`anthropic-vertex/*`) prennent en charge `cacheRetention` de la même manière qu’Anthropic direct.
- `cacheRetention: "long"` correspond au vrai TTL de cache d’invite d’1 heure sur les points de terminaison Vertex AI.
- La conservation du cache par défaut pour `anthropic-vertex` correspond aux valeurs par défaut d’Anthropic direct.
- Les requêtes Vertex sont routées via une mise en forme du cache tenant compte des frontières afin que la réutilisation du cache reste alignée avec ce que les fournisseurs reçoivent réellement.

### Amazon Bedrock

- Les références de modèle Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) prennent en charge le passage explicite de `cacheRetention`.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.

### Modèles OpenRouter

Pour les références de modèle `openrouter/anthropic/*`, OpenClaw injecte `cache_control` Anthropic sur les blocs d’invite système/développeur afin d’améliorer la réutilisation du cache d’invite uniquement lorsque la requête cible encore une route OpenRouter vérifiée (`openrouter` sur son point de terminaison par défaut, ou tout fournisseur/URL de base qui se résout vers `openrouter.ai`).

Pour les références de modèle `openrouter/deepseek/*`, `openrouter/moonshot*/*` et `openrouter/zai/*`, `contextPruning.mode: "cache-ttl"` est autorisé parce qu’OpenRouter gère automatiquement la mise en cache des invites côté fournisseur. OpenClaw n’injecte pas de marqueurs Anthropic `cache_control` dans ces requêtes.

La construction du cache DeepSeek est en mode best-effort et peut prendre quelques secondes. Un suivi immédiat peut encore afficher `cached_tokens: 0` ; vérifiez avec une requête répétée avec le même préfixe après un court délai et utilisez `usage.prompt_tokens_details.cached_tokens` comme signal d’accès au cache.

Si vous redirigez le modèle vers une URL proxy compatible OpenAI arbitraire, OpenClaw cesse d’injecter ces marqueurs de cache Anthropic spécifiques à OpenRouter.

### Autres fournisseurs

Si le fournisseur ne prend pas en charge ce mode de cache, `cacheRetention` n’a aucun effet.

### API directe Google Gemini

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les accès au cache via `cachedContentTokenCount` en amont ; OpenClaw l’associe à `cacheRead`.
- Lorsque `cacheRetention` est définie sur un modèle Gemini direct, OpenClaw crée, réutilise et actualise automatiquement les ressources `cachedContents` pour les invites système dans les exécutions Google AI Studio. Cela signifie que vous n’avez plus besoin de précréer manuellement un handle de contenu mis en cache.
- Vous pouvez toujours transmettre un handle Gemini de contenu mis en cache existant via `params.cachedContent` (ou l’ancien `params.cached_content`) sur le modèle configuré.
- Ceci est distinct de la mise en cache de préfixe d’invite Anthropic/OpenAI. Pour Gemini, OpenClaw gère une ressource `cachedContents` native du fournisseur plutôt que d’injecter des marqueurs de cache dans la requête.

### Utilisation JSON de Gemini CLI

- La sortie JSON de Gemini CLI peut également exposer les accès au cache via `stats.cached` ; OpenClaw l’associe à `cacheRead`.
- Si le CLI omet une valeur directe `stats.input`, OpenClaw dérive les jetons d’entrée à partir de `stats.input_tokens - stats.cached`.
- Il s’agit uniquement d’une normalisation de l’utilisation. Cela ne signifie pas qu’OpenClaw crée des marqueurs de cache d’invite de style Anthropic/OpenAI pour Gemini CLI.

## Frontière de cache de l’invite système

OpenClaw divise l’invite système en un **préfixe stable** et un **suffixe volatile** séparés par une frontière interne de préfixe de cache. Le contenu au-dessus de la frontière (définitions d’outils, métadonnées de Skills, fichiers d’espace de travail et autre contexte relativement statique) est ordonné pour rester identique octet pour octet d’un tour à l’autre. Le contenu sous la frontière (par exemple `HEARTBEAT.md`, horodatages d’exécution et autres métadonnées par tour) peut changer sans invalider le préfixe mis en cache.

Choix de conception principaux :

- Les fichiers stables de contexte de projet de l’espace de travail sont ordonnés avant `HEARTBEAT.md` afin que les changements de Heartbeat n’invalident pas le préfixe stable.
- La frontière s’applique à la mise en forme du cache des transports de la famille Anthropic, de la famille OpenAI, Google et CLI afin que tous les fournisseurs pris en charge bénéficient de la même stabilité de préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont routées via une mise en forme du cache tenant compte des frontières afin que la réutilisation du cache reste alignée avec ce que les fournisseurs reçoivent réellement.
- Les empreintes des invites système sont normalisées (espaces, fins de ligne, contexte ajouté par hook, ordre des capacités d’exécution) afin que des invites sémantiquement inchangées partagent le KV/cache d’un tour à l’autre.

Si vous constatez des pics inattendus de `cacheWrite` après un changement de configuration ou d’espace de travail, vérifiez si ce changement se situe au-dessus ou au-dessous de la frontière de cache. Déplacer le contenu volatile sous la frontière (ou le stabiliser) résout souvent le problème.

## Garde-fous de stabilité du cache OpenClaw

OpenClaw conserve également plusieurs formes de charges utiles sensibles au cache déterministes avant que la requête n’atteigne le fournisseur :

- Les catalogues d’outils MCP groupés sont triés de manière déterministe avant l’enregistrement des outils, afin que les changements d’ordre de `listTools()` ne modifient pas le bloc d’outils et n’invalident pas les préfixes du cache d’invite.
- Les sessions héritées avec des blocs d’image persistants conservent intacts les **3 tours terminés les plus récents** ; les anciens blocs d’image déjà traités peuvent être remplacés par un marqueur afin que les suivis riches en images ne renvoient pas en permanence de grandes charges utiles obsolètes.

## Modèles d’ajustement

### Trafic mixte (valeur par défaut recommandée)

Conservez une base de référence longue durée sur votre agent principal, désactivez la mise en cache sur les agents de notification en rafale :

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

### Base de référence orientée coût

- Définissez la base `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Gardez Heartbeat en dessous de votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Diagnostics du cache

OpenClaw expose des diagnostics dédiés de traçage du cache pour les exécutions d’agents intégrés.

Pour les diagnostics normaux destinés aux utilisateurs, `/status` et d’autres résumés d’utilisation peuvent utiliser la dernière entrée d’utilisation de transcription comme source de repli pour `cacheRead` / `cacheWrite` lorsque l’entrée de session en direct ne contient pas ces compteurs.

## Tests de régression en direct

OpenClaw conserve une porte unique combinée de régression de cache en direct pour les préfixes répétés, les tours d’outils, les tours d’images, les transcriptions d’outils de type MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez la porte en direct ciblée avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les nombres observés en direct les plus récents ainsi que les seuils de régression spécifiques au fournisseur utilisés par le test.
L’exécuteur utilise également de nouveaux identifiants de session par exécution et des espaces de noms d’invite afin que l’état de cache précédent ne pollue pas l’échantillon de régression actuel.

Ces tests n’utilisent intentionnellement pas des critères de réussite identiques selon les fournisseurs.

### Attentes en direct Anthropic

- Attendez-vous à des écritures explicites d’échauffement via `cacheWrite`.
- Attendez-vous à une réutilisation quasi complète de l’historique sur les tours répétés, car le contrôle de cache Anthropic fait progresser le point d’arrêt du cache au fil de la conversation.
- Les assertions en direct actuelles utilisent encore des seuils de taux d’accès élevés pour les chemins stables, les outils et les images.

### Attentes en direct OpenAI

- Attendez-vous à `cacheRead` uniquement. `cacheWrite` reste à `0`.
- Traitez la réutilisation du cache sur les tours répétés comme un plateau spécifique au fournisseur, et non comme une réutilisation mobile de l’historique complet de style Anthropic.
- Les assertions en direct actuelles utilisent des vérifications de seuil conservatrices dérivées du comportement observé en direct sur `gpt-5.4-mini` :
  - préfixe stable : `cacheRead >= 4608`, taux d’accès `>= 0.90`
  - transcription d’outil : `cacheRead >= 4096`, taux d’accès `>= 0.85`
  - transcription d’image : `cacheRead >= 3840`, taux d’accès `>= 0.82`
  - transcription de type MCP : `cacheRead >= 4096`, taux d’accès `>= 0.85`

La nouvelle vérification combinée en direct du 2026-04-04 a abouti à :

- préfixe stable : `cacheRead=4864`, taux d’accès `0.966`
- transcription d’outil : `cacheRead=4608`, taux d’accès `0.896`
- transcription d’image : `cacheRead=4864`, taux d’accès `0.954`
- transcription de type MCP : `cacheRead=4608`, taux d’accès `0.891`

Le temps récent en horloge murale locale pour la porte combinée était d’environ `88s`.

Pourquoi les assertions diffèrent :

- Anthropic expose des points d’arrêt de cache explicites et une réutilisation mobile de l’historique de conversation.
- La mise en cache des invites OpenAI reste sensible au préfixe exact, mais le préfixe effectivement réutilisable dans le trafic Responses en direct peut plafonner avant l’invite complète.
- Pour cette raison, comparer Anthropic et OpenAI avec un seul seuil de pourcentage inter-fournisseurs crée de fausses régressions.

### Configuration `diagnostics.cacheTrace`

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

- `filePath` : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages` : `true`
- `includePrompt` : `true`
- `includeSystem` : `true`

### Variables d’environnement (débogage ponctuel)

- `OPENCLAW_CACHE_TRACE=1` active le traçage du cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` remplace le chemin de sortie.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` active ou désactive la capture complète des charges utiles des messages.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` active ou désactive la capture du texte de l’invite.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` active ou désactive la capture de l’invite système.

### Que vérifier

- Les événements de traçage du cache sont en JSONL et incluent des instantanés intermédiaires comme `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’impact par tour des jetons de cache est visible dans les surfaces d’utilisation normales via `cacheRead` et `cacheWrite` (par exemple `/usage full` et les résumés d’utilisation de session).
- Pour Anthropic, attendez-vous à voir à la fois `cacheRead` et `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à `cacheRead` lors des accès au cache et à ce que `cacheWrite` reste à `0` ; OpenAI ne publie pas de champ distinct de jetons d’écriture de cache.
- Si vous avez besoin d’un traçage des requêtes, journalisez les identifiants de requête et les en-têtes de limitation de débit séparément des métriques de cache. La sortie actuelle de traçage du cache d’OpenClaw est centrée sur la forme de l’invite/session et l’utilisation normalisée des jetons plutôt que sur les en-têtes bruts de réponse du fournisseur.

## Dépannage rapide

- `cacheWrite` élevé sur la plupart des tours : vérifiez les entrées volatiles de l’invite système et confirmez que le modèle/fournisseur prend en charge vos paramètres de cache.
- `cacheWrite` élevé sur Anthropic : cela signifie souvent que le point d’arrêt du cache tombe sur un contenu qui change à chaque requête.
- `cacheRead` OpenAI faible : vérifiez que le préfixe stable est au début, que le préfixe répété fait au moins 1024 jetons et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- Aucun effet de `cacheRetention` : confirmez que la clé du modèle correspond à `agents.defaults.models["provider/model"]`.
- Requêtes Bedrock Nova/Mistral avec paramètres de cache : forçage attendu à l’exécution vers `none`.

Documentation associée :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Élagage de session](/fr/concepts/session-pruning)
- [Référence de configuration Gateway](/fr/gateway/configuration-reference)

## Lié

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
