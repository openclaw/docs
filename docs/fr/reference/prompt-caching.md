---
read_when:
    - Vous voulez réduire les coûts en tokens de prompt grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans les configurations multi-agents
    - Vous réglez conjointement Heartbeat et l’élagage de cache-ttl
summary: Paramètres de mise en cache des prompts, ordre de fusion, comportement des fournisseurs et schémas de réglage
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-07-01T18:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

La mise en cache des prompts signifie que le fournisseur du modèle peut réutiliser les préfixes de prompt inchangés (généralement les instructions système/développeur et d’autres contextes stables) d’un tour à l’autre au lieu de les retraiter à chaque fois. OpenClaw normalise l’utilisation du fournisseur en `cacheRead` et `cacheWrite` lorsque l’API amont expose directement ces compteurs.

Les surfaces d’état peuvent aussi récupérer les compteurs de cache depuis le journal
d’utilisation de la transcription la plus récente lorsque l’instantané de session en direct
ne les contient pas, afin que `/status` puisse continuer à afficher
une ligne de cache après une perte partielle des métadonnées de session. Les valeurs de cache
en direct non nulles existantes restent prioritaires sur les valeurs de secours issues de la transcription.

Pourquoi c’est important : coût en tokens plus faible, réponses plus rapides et performances plus prévisibles pour les sessions de longue durée. Sans mise en cache, les prompts répétés paient le coût complet du prompt à chaque tour, même lorsque la plupart des entrées n’ont pas changé.

Les sections ci-dessous couvrent tous les réglages liés au cache qui influencent la réutilisation des prompts et le coût en tokens.

Références des fournisseurs :

- Mise en cache des prompts Anthropic : [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Mise en cache des prompts OpenAI : [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- En-têtes de l’API OpenAI et ID de requête : [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID de requête et erreurs Anthropic : [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Réglages principaux

### `cacheRetention` (valeur par défaut globale, modèle et par agent)

Définissez la rétention du cache comme valeur par défaut globale pour tous les modèles :

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Remplacez-la par modèle :

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
3. `agents.list[].params` (ID d’agent correspondant ; remplace par clé)

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte de résultats d’outils après les fenêtres de TTL du cache afin que les requêtes après inactivité ne remettent pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consultez [Élagage de session](/fr/concepts/session-pruning) pour le comportement complet.

### Heartbeat keep-warm

Heartbeat peut maintenir les fenêtres de cache au chaud et réduire les écritures répétées dans le cache après des périodes d’inactivité.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Le Heartbeat par agent est pris en charge dans `agents.list[].heartbeat`.

## Comportement des fournisseurs

### Anthropic (API directe)

- `cacheRetention` est pris en charge.
- Avec les profils d’authentification par clé API Anthropic, OpenClaw initialise `cacheRetention: "short"` pour les références de modèles Anthropic lorsqu’il n’est pas défini.
- Les réponses Messages natives d’Anthropic exposent à la fois `cache_read_input_tokens` et `cache_creation_input_tokens`, ce qui permet à OpenClaw d’afficher `cacheRead` et `cacheWrite`.
- Pour les requêtes Anthropic natives, `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes, et `cacheRetention: "long"` passe au TTL de 1 heure uniquement sur les hôtes directs `api.anthropic.com`.

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents pris en charge. OpenClaw n’a pas besoin d’injecter de marqueurs de cache au niveau des blocs.
- OpenClaw utilise `prompt_cache_key` pour garder le routage du cache stable d’un tour à l’autre. Les hôtes OpenAI directs utilisent `prompt_cache_retention: "24h"` lorsque `cacheRetention: "long"` est sélectionné.
- Les fournisseurs Completions compatibles OpenAI reçoivent `prompt_cache_key` uniquement lorsque leur configuration de modèle définit explicitement `compat.supportsPromptCacheKey: true`. Le transfert de rétention longue est une capacité distincte : `cacheRetention: "long"` explicite envoie `prompt_cache_retention: "24h"` uniquement lorsque cette entrée compat prend aussi en charge la rétention longue du cache. Les fournisseurs comme Mistral peuvent activer les clés de cache tout en définissant `compat.supportsLongCacheRetention: false` pour supprimer le champ de rétention longue. `cacheRetention: "none"` supprime les deux champs.
- Les réponses OpenAI exposent les tokens de prompt mis en cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` sur les événements de l’API Responses). OpenClaw mappe cela vers `cacheRead`.
- L’utilisation GPT-5.6 Responses peut aussi exposer `input_tokens_details.cache_write_tokens`. OpenClaw mappe cela vers `cacheWrite` et le tarifie au taux d’écriture cache du modèle ; les réponses Responses qui omettent le champ gardent `cacheWrite` à `0`.
- OpenAI renvoie des en-têtes utiles de traçage et de limite de débit, comme `x-request-id`, `openai-processing-ms` et `x-ratelimit-*`, mais la comptabilisation des hits de cache doit venir de la charge utile d’utilisation, pas des en-têtes.
- En pratique, OpenAI se comporte souvent comme un cache de préfixe initial plutôt que comme une réutilisation de tout l’historique mobile à la manière d’Anthropic. Les tours de texte à long préfixe stable peuvent atteindre un plateau proche de `4864` tokens mis en cache dans les sondes en direct actuelles, tandis que les transcriptions riches en outils ou de style MCP plafonnent souvent près de `4608` tokens mis en cache, même lors de répétitions exactes.

### Anthropic Vertex

- Les modèles Anthropic sur Vertex AI (`anthropic-vertex/*`) prennent en charge `cacheRetention` de la même façon que l’Anthropic direct.
- `cacheRetention: "long"` correspond au véritable TTL de cache de prompt de 1 heure sur les points de terminaison Vertex AI.
- La rétention de cache par défaut pour `anthropic-vertex` correspond aux valeurs par défaut d’Anthropic direct.
- Les requêtes Vertex sont routées via une mise en forme du cache consciente des limites afin que la réutilisation du cache reste alignée avec ce que les fournisseurs reçoivent réellement.

### Amazon Bedrock

- Les références de modèles Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) prennent en charge le transfert explicite de `cacheRetention`.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.

### Modèles OpenRouter

Pour les références de modèles `openrouter/anthropic/*`, OpenClaw injecte le
`cache_control` Anthropic dans les blocs de prompt système/développeur afin d’améliorer la réutilisation
du cache de prompt uniquement lorsque la requête cible toujours une route OpenRouter vérifiée
(`openrouter` sur son point de terminaison par défaut, ou tout fournisseur/URL de base qui se résout
en `openrouter.ai`).

Pour les références de modèles `openrouter/deepseek/*`, `openrouter/moonshot*/*` et `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` est autorisé parce qu’OpenRouter
gère automatiquement la mise en cache des prompts côté fournisseur. OpenClaw n’injecte pas
de marqueurs Anthropic `cache_control` dans ces requêtes.

La construction du cache DeepSeek est au mieux opportuniste et peut prendre quelques secondes. Un
suivi immédiat peut encore afficher `cached_tokens: 0` ; vérifiez avec une requête répétée
au même préfixe après un court délai et utilisez `usage.prompt_tokens_details.cached_tokens`
comme signal de hit de cache.

Si vous repointez le modèle vers une URL proxy arbitraire compatible OpenAI, OpenClaw
cesse d’injecter ces marqueurs de cache Anthropic propres à OpenRouter.

### Autres fournisseurs

Si le fournisseur ne prend pas en charge ce mode de cache, `cacheRetention` n’a aucun effet.

### API directe Google Gemini

- Le transport Gemini direct (`api: "google-generative-ai"`) signale les hits de cache
  via le `cachedContentTokenCount` amont ; OpenClaw le mappe vers `cacheRead`.
- Lorsque `cacheRetention` est défini sur un modèle Gemini direct, OpenClaw crée,
  réutilise et actualise automatiquement les ressources `cachedContents` pour les prompts système
  sur les exécutions Google AI Studio. Cela signifie que vous n’avez plus besoin de précréer
  manuellement un handle de contenu mis en cache.
- Vous pouvez toujours transmettre un handle Gemini de contenu mis en cache préexistant via
  `params.cachedContent` (ou l’ancien `params.cached_content`) sur le modèle configuré.
- Ceci est distinct de la mise en cache des préfixes de prompt Anthropic/OpenAI. Pour Gemini,
  OpenClaw gère une ressource native du fournisseur `cachedContents` plutôt que
  d’injecter des marqueurs de cache dans la requête.

### Utilisation de la CLI Gemini

- La sortie Gemini CLI `stream-json` peut exposer les hits de cache via `stats.cached` ;
  OpenClaw mappe cela vers `cacheRead`. Les anciens remplacements `--output-format json` utilisent
  la même normalisation de l’utilisation.
- Si la CLI omet une valeur directe `stats.input`, OpenClaw déduit les tokens d’entrée
  depuis `stats.input_tokens - stats.cached`.
- Il s’agit uniquement de normalisation de l’utilisation. Cela ne signifie pas qu’OpenClaw crée
  des marqueurs de cache de prompt de style Anthropic/OpenAI pour Gemini CLI.

## Limite de cache du prompt système

OpenClaw divise le prompt système en un **préfixe stable** et un **suffixe volatil**
séparés par une limite interne de préfixe de cache. Le contenu au-dessus de la
limite (définitions d’outils, métadonnées de Skills, fichiers de l’espace de travail et autre
contexte relativement statique) est ordonné pour rester identique octet pour octet d’un tour à l’autre.
Le contenu sous la limite (par exemple `HEARTBEAT.md`, les horodatages d’exécution et
d’autres métadonnées propres à chaque tour) peut changer sans invalider le préfixe
mis en cache.

Choix de conception clés :

- Les fichiers de contexte de projet stables de l’espace de travail sont ordonnés avant `HEARTBEAT.md` afin que
  les changements fréquents du heartbeat ne cassent pas le préfixe stable.
- La limite est appliquée à la mise en forme des transports Anthropic-family, OpenAI-family, Google et
  CLI afin que tous les fournisseurs pris en charge bénéficient de la même stabilité de préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont routées via
  une mise en forme du cache consciente des limites afin que la réutilisation du cache reste alignée avec ce que les fournisseurs
  reçoivent réellement.
- Les empreintes du prompt système sont normalisées (espaces, fins de ligne,
  contexte ajouté par les hooks, ordre des capacités d’exécution) afin que les prompts sémantiquement
  inchangés partagent le KV/cache d’un tour à l’autre.

Si vous voyez des pics inattendus de `cacheWrite` après un changement de configuration ou d’espace de travail,
vérifiez si le changement atterrit au-dessus ou au-dessous de la limite du cache. Déplacer
le contenu volatil sous la limite (ou le stabiliser) résout souvent
le problème.

## Garde-fous de stabilité du cache OpenClaw

OpenClaw garde aussi plusieurs formes de charges utiles sensibles au cache déterministes avant que
la requête n’atteigne le fournisseur :

- Les catalogues d’outils Bundle MCP sont triés de façon déterministe avant l’enregistrement des outils,
  afin que les changements d’ordre de `listTools()` ne modifient pas le bloc d’outils et
  ne cassent pas les préfixes de cache de prompt.
- Les sessions anciennes avec des blocs d’image persistés conservent les **3 tours terminés
  les plus récents** intacts ; les blocs d’image plus anciens déjà traités peuvent être
  remplacés par un marqueur afin que les suivis riches en images ne renvoient pas en permanence de grandes
  charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (valeur par défaut recommandée)

Gardez une base de référence longue durée sur votre agent principal, désactivez la mise en cache sur les agents de notification par rafales :

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

### Base de référence axée sur les coûts

- Définissez la base de référence `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Gardez le heartbeat sous votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Diagnostics du cache

OpenClaw expose des diagnostics dédiés de trace de cache pour les exécutions d’agents intégrées.

Pour les diagnostics ordinaires visibles par l’utilisateur, `/status` et d’autres résumés d’utilisation peuvent utiliser
la dernière entrée d’utilisation de transcription comme source de secours pour `cacheRead` /
`cacheWrite` lorsque l’entrée de session en direct ne contient pas ces compteurs.

## Tests de régression en direct

OpenClaw conserve un seul garde-fou combiné de régression de cache en direct pour les préfixes répétés, les tours d’outils, les tours d’image, les transcriptions d’outils de style MCP et un contrôle Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez le garde-fou en direct ciblé avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les nombres en direct observés les plus récents, ainsi que les seuils minimaux de régression propres à chaque fournisseur utilisés par le test.
L’exécuteur utilise aussi de nouveaux ID de session et espaces de noms d’invite à chaque exécution, afin que l’état de cache précédent ne pollue pas l’échantillon de régression actuel.

Ces tests n’utilisent volontairement pas des critères de réussite identiques pour tous les fournisseurs.

### Attentes en direct pour Anthropic

- Attendez-vous à des écritures de préchauffage explicites via `cacheWrite`.
- Attendez-vous à une réutilisation de presque tout l’historique lors des tours répétés, car le contrôle du cache Anthropic fait avancer le point de rupture du cache au fil de la conversation.
- Les assertions en direct actuelles utilisent encore des seuils élevés de taux de réussite pour les chemins stable, outil et image.

### Attentes en direct pour OpenAI

- Attendez-vous uniquement à `cacheRead`. `cacheWrite` reste à `0`.
- Traitez la réutilisation du cache sur les tours répétés comme un plateau propre au fournisseur, et non comme une réutilisation mobile de tout l’historique à la manière d’Anthropic.
- Les assertions en direct actuelles utilisent des vérifications de seuils prudentes dérivées du comportement en direct observé sur `gpt-5.4-mini` :
  - préfixe stable : `cacheRead >= 4608`, taux de réussite `>= 0.90`
  - transcription d’outil : `cacheRead >= 4096`, taux de réussite `>= 0.85`
  - transcription d’image : `cacheRead >= 3840`, taux de réussite `>= 0.82`
  - transcription de style MCP : `cacheRead >= 4096`, taux de réussite `>= 0.85`

La nouvelle vérification en direct combinée du 2026-04-04 a donné :

- préfixe stable : `cacheRead=4864`, taux de réussite `0.966`
- transcription d’outil : `cacheRead=4608`, taux de réussite `0.896`
- transcription d’image : `cacheRead=4864`, taux de réussite `0.954`
- transcription de style MCP : `cacheRead=4608`, taux de réussite `0.891`

Le temps écoulé réel local récent pour la porte combinée était d’environ `88s`.

Pourquoi les assertions diffèrent :

- Anthropic expose des points de rupture de cache explicites et une réutilisation mobile de l’historique de conversation.
- La mise en cache des invites OpenAI reste sensible au préfixe exact, mais le préfixe effectivement réutilisable dans le trafic Responses en direct peut plafonner avant l’invite complète.
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

### Variables d’environnement (débogage ponctuel)

- `OPENCLAW_CACHE_TRACE=1` active le traçage du cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` remplace le chemin de sortie.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` active ou désactive la capture de la charge utile complète des messages.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` active ou désactive la capture du texte de l’invite.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` active ou désactive la capture de l’invite système.

### Ce qu’il faut inspecter

- Les événements de trace de cache sont en JSONL et incluent des instantanés par étape comme `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’impact des jetons de cache par tour est visible dans les surfaces d’utilisation normales via `cacheRead` et `cacheWrite` (par exemple `/usage tokens`, `/status`, les résumés d’utilisation de session et les mises en page `messages.usageTemplate` personnalisées).
- Pour Anthropic, attendez-vous à la fois à `cacheRead` et à `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à `cacheRead` lors des succès de cache. GPT-5.6 Responses peut aussi signaler `cacheWrite` pendant l’écriture des segments d’invite ; les autres charges utiles Responses qui omettent le compteur d’écriture le maintiennent à `0`.
- Si vous avez besoin de tracer les requêtes, consignez les ID de requête et les en-têtes de limite de débit séparément des métriques de cache. La sortie actuelle de trace de cache d’OpenClaw se concentre sur la forme des invites/sessions et l’utilisation normalisée des jetons plutôt que sur les en-têtes bruts de réponse du fournisseur.

## Dépannage rapide

- `cacheWrite` élevé sur la plupart des tours : vérifiez les entrées volatiles de l’invite système et assurez-vous que le modèle/fournisseur prend en charge vos paramètres de cache.
- `cacheWrite` élevé sur Anthropic : cela signifie souvent que le point de rupture du cache tombe sur du contenu qui change à chaque requête.
- `cacheRead` faible sur OpenAI : vérifiez que le préfixe stable est au début, que le préfixe répété compte au moins 1024 jetons et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- Aucun effet de `cacheRetention` : confirmez que la clé de modèle correspond à `agents.defaults.models["provider/model"]`.
- Requêtes Bedrock Nova/Mistral avec paramètres de cache : forçage d’exécution attendu sur `none`.

Docs connexes :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Élagage de session](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Connexe

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Utilisation de l’API et coûts](/fr/reference/api-usage-costs)
