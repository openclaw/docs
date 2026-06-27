---
read_when:
    - Vous souhaitez réduire les coûts en tokens de prompt grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans les configurations multi-agents
    - Vous ajustez ensemble le Heartbeat et le nettoyage du TTL du cache
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement du fournisseur et modèles d’ajustement
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-06-27T18:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

La mise en cache des prompts signifie que le fournisseur de modèle peut réutiliser les préfixes de prompt inchangés (généralement les instructions système/développeur et autre contexte stable) d’un tour à l’autre au lieu de les retraiter à chaque fois. OpenClaw normalise l’usage fournisseur en `cacheRead` et `cacheWrite` lorsque l’API amont expose directement ces compteurs.

Les surfaces d’état peuvent également récupérer les compteurs de cache depuis le journal
d’usage de la transcription la plus récente lorsque l’instantané de session en direct ne les contient pas, afin que `/status` puisse continuer à
afficher une ligne de cache après une perte partielle des métadonnées de session. Les valeurs de cache en direct non nulles existantes
gardent la priorité sur les valeurs de repli issues de la transcription.

Pourquoi c’est important : coût en tokens réduit, réponses plus rapides et performances plus prévisibles pour les sessions longues. Sans mise en cache, les prompts répétés paient le coût complet du prompt à chaque tour, même lorsque la majeure partie de l’entrée n’a pas changé.

Les sections ci-dessous couvrent chaque réglage lié au cache qui affecte la réutilisation des prompts et le coût en tokens.

Références fournisseur :

- Mise en cache des prompts Anthropic : [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Mise en cache des prompts OpenAI : [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- En-têtes d’API OpenAI et identifiants de requête : [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identifiants de requête et erreurs Anthropic : [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Principaux réglages

### `cacheRetention` (valeur globale par défaut, modèle et par agent)

Définir la rétention du cache comme valeur globale par défaut pour tous les modèles :

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Remplacer par modèle :

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

1. `agents.defaults.params` (valeur globale par défaut — s’applique à tous les modèles)
2. `agents.defaults.models["provider/model"].params` (remplacement par modèle)
3. `agents.list[].params` (id d’agent correspondant ; remplace par clé)

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte de résultats d’outils après les fenêtres de TTL du cache afin que les requêtes après inactivité ne remettent pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Voir [Élagage de session](/fr/concepts/session-pruning) pour le comportement complet.

### Maintien au chaud par Heartbeat

Heartbeat peut garder les fenêtres de cache au chaud et réduire les écritures répétées dans le cache après des intervalles d’inactivité.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat par agent est pris en charge dans `agents.list[].heartbeat`.

## Comportement fournisseur

### Anthropic (API directe)

- `cacheRetention` est pris en charge.
- Avec les profils d’authentification par clé d’API Anthropic, OpenClaw initialise `cacheRetention: "short"` pour les références de modèles Anthropic lorsqu’il n’est pas défini.
- Les réponses Messages natives Anthropic exposent à la fois `cache_read_input_tokens` et `cache_creation_input_tokens`, ce qui permet à OpenClaw d’afficher `cacheRead` et `cacheWrite`.
- Pour les requêtes Anthropic natives, `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes, et `cacheRetention: "long"` passe au TTL d’une heure uniquement sur les hôtes directs `api.anthropic.com`.

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents pris en charge. OpenClaw n’a pas besoin d’injecter des marqueurs de cache au niveau des blocs.
- OpenClaw utilise `prompt_cache_key` pour garder un routage de cache stable d’un tour à l’autre. Les hôtes OpenAI directs utilisent `prompt_cache_retention: "24h"` lorsque `cacheRetention: "long"` est sélectionné.
- Les fournisseurs Completions compatibles OpenAI reçoivent `prompt_cache_key` uniquement lorsque leur configuration de modèle définit explicitement `compat.supportsPromptCacheKey: true`. La transmission de rétention longue est une capacité distincte : `cacheRetention: "long"` explicite envoie `prompt_cache_retention: "24h"` uniquement lorsque cette entrée compat prend également en charge la rétention longue du cache. Des fournisseurs comme Mistral peuvent activer les clés de cache tout en définissant `compat.supportsLongCacheRetention: false` pour supprimer le champ de rétention longue. `cacheRetention: "none"` supprime les deux champs.
- Les réponses OpenAI exposent les tokens de prompt mis en cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` sur les événements de l’API Responses). OpenClaw associe cela à `cacheRead`.
- OpenAI n’expose pas de compteur séparé de tokens d’écriture de cache, donc `cacheWrite` reste à `0` sur les chemins OpenAI même lorsque le fournisseur chauffe un cache.
- OpenAI renvoie des en-têtes utiles de traçage et de limite de débit, tels que `x-request-id`, `openai-processing-ms` et `x-ratelimit-*`, mais la comptabilisation des hits de cache doit venir de la charge utile d’usage, pas des en-têtes.
- En pratique, OpenAI se comporte souvent comme un cache de préfixe initial plutôt que comme une réutilisation d’historique complet mobile à la manière d’Anthropic. Les tours de texte à long préfixe stable peuvent approcher un plateau de `4864` tokens mis en cache dans les sondes en direct actuelles, tandis que les transcriptions riches en outils ou de style MCP plafonnent souvent autour de `4608` tokens mis en cache, même sur des répétitions exactes.

### Anthropic Vertex

- Les modèles Anthropic sur Vertex AI (`anthropic-vertex/*`) prennent en charge `cacheRetention` de la même manière qu’Anthropic direct.
- `cacheRetention: "long"` correspond au vrai TTL de cache de prompt d’une heure sur les points de terminaison Vertex AI.
- La rétention de cache par défaut pour `anthropic-vertex` correspond aux valeurs par défaut d’Anthropic direct.
- Les requêtes Vertex sont routées via une mise en forme du cache tenant compte des limites afin que la réutilisation du cache reste alignée avec ce que les fournisseurs reçoivent réellement.

### Amazon Bedrock

- Les références de modèles Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) prennent en charge la transmission explicite de `cacheRetention`.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.

### Modèles OpenRouter

Pour les références de modèles `openrouter/anthropic/*`, OpenClaw injecte le
`cache_control` Anthropic sur les blocs de prompt système/développeur afin d’améliorer la
réutilisation du cache de prompt uniquement lorsque la requête cible encore une route OpenRouter vérifiée
(`openrouter` sur son point de terminaison par défaut, ou tout fournisseur/URL de base qui se résout
en `openrouter.ai`).

Pour les références de modèles `openrouter/deepseek/*`, `openrouter/moonshot*/*` et `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` est autorisé, car OpenRouter
gère automatiquement la mise en cache des prompts côté fournisseur. OpenClaw n’injecte pas
de marqueurs `cache_control` Anthropic dans ces requêtes.

La construction du cache DeepSeek est effectuée au mieux et peut prendre quelques secondes. Un
suivi immédiat peut encore afficher `cached_tokens: 0` ; vérifiez avec une requête répétée
au même préfixe après un court délai et utilisez `usage.prompt_tokens_details.cached_tokens`
comme signal de hit de cache.

Si vous redirigez le modèle vers une URL de proxy arbitraire compatible OpenAI, OpenClaw
cesse d’injecter ces marqueurs de cache Anthropic propres à OpenRouter.

### Autres fournisseurs

Si le fournisseur ne prend pas en charge ce mode de cache, `cacheRetention` n’a aucun effet.

### API directe Google Gemini

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les hits de cache
  via `cachedContentTokenCount` en amont ; OpenClaw associe cela à `cacheRead`.
- Lorsque `cacheRetention` est défini sur un modèle Gemini direct, OpenClaw crée,
  réutilise et actualise automatiquement des ressources `cachedContents` pour les prompts système
  lors des exécutions Google AI Studio. Cela signifie que vous n’avez plus besoin de précréer
  manuellement un handle de contenu mis en cache.
- Vous pouvez toujours transmettre un handle de contenu mis en cache Gemini préexistant en tant que
  `params.cachedContent` (ou l’ancien `params.cached_content`) sur le modèle configuré.
- Cela est distinct de la mise en cache de préfixe de prompt Anthropic/OpenAI. Pour Gemini,
  OpenClaw gère une ressource native fournisseur `cachedContents` plutôt que
  d’injecter des marqueurs de cache dans la requête.

### Usage de Gemini CLI

- La sortie Gemini CLI `stream-json` peut exposer les hits de cache via `stats.cached` ;
  OpenClaw associe cela à `cacheRead`. Les anciens remplacements `--output-format json` utilisent
  la même normalisation d’usage.
- Si la CLI omet une valeur directe `stats.input`, OpenClaw dérive les tokens d’entrée
  à partir de `stats.input_tokens - stats.cached`.
- Il ne s’agit que d’une normalisation d’usage. Cela ne signifie pas qu’OpenClaw crée
  des marqueurs de cache de prompt de style Anthropic/OpenAI pour Gemini CLI.

## Limite de cache du prompt système

OpenClaw divise le prompt système en un **préfixe stable** et un **suffixe volatile**
séparés par une limite interne de préfixe de cache. Le contenu au-dessus de la
limite (définitions d’outils, métadonnées Skills, fichiers de l’espace de travail et autre
contexte relativement statique) est ordonné pour rester identique octet pour octet d’un tour à l’autre.
Le contenu sous la limite (par exemple `HEARTBEAT.md`, les horodatages d’exécution et
d’autres métadonnées par tour) peut changer sans invalider le préfixe
mis en cache.

Choix de conception clés :

- Les fichiers stables de contexte de projet de l’espace de travail sont ordonnés avant `HEARTBEAT.md` afin que
  le bruit Heartbeat ne casse pas le préfixe stable.
- La limite est appliquée sur les familles Anthropic, OpenAI, Google et
  la mise en forme de transport CLI afin que tous les fournisseurs pris en charge bénéficient de la même stabilité de préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont routées via
  une mise en forme du cache tenant compte des limites afin que la réutilisation du cache reste alignée avec ce que les fournisseurs
  reçoivent réellement.
- Les empreintes de prompt système sont normalisées (espaces, fins de ligne,
  contexte ajouté par des hooks, ordre des capacités d’exécution) afin que les prompts sémantiquement inchangés
  partagent le KV/cache d’un tour à l’autre.

Si vous observez des pics inattendus de `cacheWrite` après un changement de configuration ou d’espace de travail,
vérifiez si le changement se situe au-dessus ou au-dessous de la limite de cache. Déplacer
le contenu volatile sous la limite (ou le stabiliser) résout souvent le
problème.

## Garde-fous de stabilité du cache OpenClaw

OpenClaw garde également plusieurs formes de charge utile sensibles au cache déterministes avant que
la requête n’atteigne le fournisseur :

- Les catalogues d’outils MCP du bundle sont triés de manière déterministe avant l’enregistrement des outils,
  afin que les changements d’ordre de `listTools()` ne perturbent pas le bloc d’outils ni ne
  cassent les préfixes de cache de prompt.
- Les sessions héritées avec des blocs d’images persistés conservent intacts les **3 tours terminés
  les plus récents** ; les blocs d’images plus anciens déjà traités peuvent être
  remplacés par un marqueur afin que les suivis riches en images ne continuent pas à renvoyer de grandes
  charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (valeur par défaut recommandée)

Conservez une base durable sur votre agent principal, désactivez la mise en cache sur les agents de notification à rafales :

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

### Base axée sur le coût

- Définissez la base `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Gardez Heartbeat sous votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Diagnostics de cache

OpenClaw expose des diagnostics dédiés de trace de cache pour les exécutions d’agents intégrés.

Pour les diagnostics normaux destinés à l’utilisateur, `/status` et les autres résumés d’usage peuvent utiliser
la dernière entrée d’usage de transcription comme source de repli pour `cacheRead` /
`cacheWrite` lorsque l’entrée de session en direct ne contient pas ces compteurs.

## Tests de régression en direct

OpenClaw conserve une porte de régression de cache en direct combinée pour les préfixes répétés, les tours d’outils, les tours d’images, les transcriptions d’outils de style MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez la porte en direct étroite avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de base stocke les nombres en direct observés les plus récents, ainsi que les seuils de régression propres au fournisseur utilisés par le test.
Le runner utilise également de nouveaux identifiants de session et espaces de noms de prompts à chaque exécution afin que l’état de cache précédent ne pollue pas l’échantillon de régression actuel.

Ces tests n’utilisent intentionnellement pas des critères de réussite identiques selon les fournisseurs.

### Attentes des tests en direct Anthropic

- Attendez-vous à des écritures de préchauffage explicites via `cacheWrite`.
- Attendez-vous à une réutilisation de l’historique presque complète lors des tours répétés, car le contrôle de cache Anthropic fait avancer le point de rupture du cache au fil de la conversation.
- Les assertions en direct actuelles utilisent encore des seuils de taux d’accès élevés pour les chemins stables, avec outils et avec images.

### Attentes des tests en direct OpenAI

- Attendez-vous uniquement à `cacheRead`. `cacheWrite` reste à `0`.
- Traitez la réutilisation du cache lors des tours répétés comme un plateau propre au fournisseur, et non comme une réutilisation mobile de l’historique complet à la manière d’Anthropic.
- Les assertions en direct actuelles utilisent des planchers conservateurs dérivés du comportement en direct observé sur `gpt-5.4-mini` :
  - préfixe stable : `cacheRead >= 4608`, taux d’accès `>= 0.90`
  - transcript d’outil : `cacheRead >= 4096`, taux d’accès `>= 0.85`
  - transcript d’image : `cacheRead >= 3840`, taux d’accès `>= 0.82`
  - transcript de type MCP : `cacheRead >= 4096`, taux d’accès `>= 0.85`

La vérification en direct combinée la plus récente, le 2026-04-04, a abouti à :

- préfixe stable : `cacheRead=4864`, taux d’accès `0.966`
- transcript d’outil : `cacheRead=4608`, taux d’accès `0.896`
- transcript d’image : `cacheRead=4864`, taux d’accès `0.954`
- transcript de type MCP : `cacheRead=4608`, taux d’accès `0.891`

Le temps local récent en temps réel pour le contrôle combiné était d’environ `88s`.

Pourquoi les assertions diffèrent :

- Anthropic expose des points de rupture de cache explicites et une réutilisation mobile de l’historique de conversation.
- La mise en cache des prompts OpenAI reste sensible au préfixe exact, mais le préfixe effectivement réutilisable dans le trafic Responses en direct peut plafonner avant le prompt complet.
- Pour cette raison, comparer Anthropic et OpenAI avec un seul seuil de pourcentage commun à tous les fournisseurs crée de fausses régressions.

### Configuration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Valeurs par défaut :

- `filePath` : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages` : `true`
- `includePrompt` : `true`
- `includeSystem` : `true`

### Bascules d’environnement (débogage ponctuel)

- `OPENCLAW_CACHE_TRACE=1` active le traçage du cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` remplace le chemin de sortie.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` active ou désactive la capture de la charge utile complète des messages.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` active ou désactive la capture du texte du prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` active ou désactive la capture du prompt système.

### Éléments à inspecter

- Les événements de trace du cache sont au format JSONL et incluent des instantanés intermédiaires comme `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’impact des jetons de cache par tour est visible dans les surfaces d’utilisation normales via `cacheRead` et `cacheWrite` (par exemple `/usage full` et les résumés d’utilisation de session).
- Pour Anthropic, attendez-vous à la fois à `cacheRead` et `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à `cacheRead` lors des accès au cache et à ce que `cacheWrite` reste à `0` ; OpenAI ne publie pas de champ de jetons distinct pour l’écriture dans le cache.
- Si vous avez besoin du traçage des requêtes, journalisez les ID de requête et les en-têtes de limite de débit séparément des métriques de cache. La sortie actuelle de trace du cache d’OpenClaw est centrée sur la forme du prompt et de la session ainsi que sur l’utilisation normalisée des jetons, plutôt que sur les en-têtes bruts de réponse du fournisseur.

## Dépannage rapide

- `cacheWrite` élevé sur la plupart des tours : vérifiez les entrées volatiles du prompt système et confirmez que le modèle/fournisseur prend en charge vos paramètres de cache.
- `cacheWrite` élevé sur Anthropic : cela signifie souvent que le point de rupture du cache tombe sur du contenu qui change à chaque requête.
- `cacheRead` OpenAI faible : vérifiez que le préfixe stable se trouve au début, que le préfixe répété contient au moins 1024 jetons et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- Aucun effet de `cacheRetention` : confirmez que la clé de modèle correspond à `agents.defaults.models["provider/model"]`.
- Requêtes Bedrock Nova/Mistral avec paramètres de cache : forçage d’exécution attendu vers `none`.

Documentation associée :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Élagage de session](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Associé

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
