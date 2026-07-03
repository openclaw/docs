---
read_when:
    - Réglage des paramètres par défaut des agents (modèles, réflexion, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage multi-agent et des liaisons
    - Ajuster le comportement de session, de livraison des messages et du mode conversationnel
summary: Paramètres par défaut des agents, routage multi-agent, session, messages et configuration de conversation
title: Configuration — agents
x-i18n:
    generated_at: "2026-07-03T13:27:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration limitées aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, l’exécution du Gateway et les autres
clés de niveau supérieur, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Valeur par défaut : `OPENCLAW_WORKSPACE_DIR` lorsqu’elle est définie, sinon `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Une valeur explicite `agents.defaults.workspace` a priorité sur
`OPENCLAW_WORKSPACE_DIR`. Utilisez la variable d’environnement pour faire pointer les agents par défaut
vers un espace de travail monté lorsque vous ne voulez pas inscrire ce chemin dans la configuration.

### `agents.defaults.repoRoot`

Racine de dépôt facultative affichée dans la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Liste d’autorisation de Skills par défaut facultative pour les agents qui ne définissent pas
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucune skill
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour autoriser les skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune skill.
- Une liste `agents.list[].skills` non vide constitue l’ensemble final pour cet agent ; elle
  n’est pas fusionnée avec les valeurs par défaut.

### `agents.defaults.skipBootstrap`

Désactive la création automatique des fichiers d’amorçage de l’espace de travail (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignore la création de certains fichiers facultatifs de l’espace de travail tout en écrivant les fichiers d’amorçage requis. Valeurs valides : `SOUL.md`, `USER.md`, `HEARTBEAT.md` et `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Contrôle quand les fichiers d’amorçage de l’espace de travail sont injectés dans le prompt système. Valeur par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse d’assistant terminée) ignorent la réinjection de l’amorçage de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent tout de même le contexte.
- `"never"` : désactive l’injection de l’amorçage de l’espace de travail et des fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui contrôlent entièrement le cycle de vie de leur prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte, ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Remplacement par agent : `agents.list[].contextInjection`. Les valeurs omises héritent de
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier d’amorçage de l’espace de travail avant troncature. Valeur par défaut : `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Remplacement par agent : `agents.list[].bootstrapMaxChars`. Les valeurs omises héritent de
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Nombre total maximal de caractères injectés sur l’ensemble des fichiers d’amorçage de l’espace de travail. Valeur par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Remplacement par agent : `agents.list[].bootstrapTotalMaxChars`. Les valeurs omises
héritent de `agents.defaults.bootstrapTotalMaxChars`.

### Remplacements de profil d’amorçage par agent

Utilisez les remplacements de profil d’amorçage par agent lorsqu’un agent a besoin d’un comportement
d’injection de prompt différent des valeurs par défaut partagées. Les champs omis héritent de
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle l’avis visible par l’agent dans le prompt système lorsque le contexte d’amorçage est tronqué.
Valeur par défaut : `"always"`.

- `"off"` : n’injecte jamais de texte d’avis de troncature dans le prompt système.
- `"once"` : injecte un avis concis une fois par signature de troncature unique.
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe (recommandé).

Les décomptes bruts/injectés détaillés et les champs de réglage de configuration restent dans les diagnostics tels
que les rapports d’état/contexte et les journaux ; le contexte utilisateur/runtime WebChat courant ne
reçoit que l’avis de récupération concis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw dispose de plusieurs budgets de prompt/contexte à volume élevé, et ils sont
intentionnellement répartis par sous-système au lieu de passer tous par un réglage
générique unique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale de l’amorçage de l’espace de travail.
- `agents.defaults.startupContext.*` :
  préambule ponctuel de réinitialisation/démarrage pour l’exécution du modèle, incluant les fichiers
  `memory/*.md` quotidiens récents. Les commandes de chat simples `/new` et `/reset` sont
  accusées réception sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte de skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits runtime bornés et blocs injectés appartenant au runtime.
- `memory.qmd.limits.*` :
  extrait indexé de recherche mémoire et dimensionnement de l’injection.

Utilisez le remplacement par agent correspondant uniquement lorsqu’un agent a besoin d’un
budget différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage du premier tour injecté lors des exécutions du modèle après réinitialisation/démarrage.
Les commandes de chat simples `/new` et `/reset` accusent réception de la réinitialisation sans invoquer
le modèle ; elles ne chargent donc pas ce préambule.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valeurs par défaut partagées pour les surfaces de contexte runtime bornées.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars` : plafond d’extrait `memory_get` par défaut avant l’ajout des
  métadonnées de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes `memory_get` par défaut lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond avancé des résultats d’outils en direct utilisé pour les résultats
  persistés et la récupération en cas de dépassement. Laissez-le non défini pour le plafond automatique du contexte modèle :
  `16000` caractères sous 100 000 tokens, `32000` caractères à 100 000+ tokens et `64000`
  caractères à 200 000+ tokens. Les valeurs explicites jusqu’à `1000000` sont acceptées pour
  les modèles à long contexte, mais le plafond effectif reste limité à environ 30 % de
  la fenêtre de contexte du modèle. `openclaw doctor --deep` affiche le plafond effectif,
  et doctor n’émet un avertissement que lorsqu’un remplacement explicite est obsolète ou sans effet.
- `postCompactionMaxChars` : plafond d’extrait AGENTS.md utilisé pendant l’injection de
  rafraîchissement après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent pour les réglages partagés `contextLimits`. Les champs omis héritent
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // plafond avancé pour cet agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Plafond global pour la liste compacte de skills injectée dans le prompt système. Cela
n’affecte pas la lecture des fichiers `SKILL.md` à la demande.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Remplacement par agent pour le budget du prompt de skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Taille maximale en pixels du plus long côté de l’image dans les blocs image de transcript/outil avant les appels fournisseur.
Valeur par défaut : `1200`.

Des valeurs plus basses réduisent généralement l’utilisation de tokens de vision et la taille de la charge utile de requête pour les exécutions riches en captures d’écran.
Des valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Préférence de compression/détail des outils d’image pour les images chargées depuis des chemins de fichiers, des URL et des références média.
Valeur par défaut : `auto`.

OpenClaw adapte l’échelle de redimensionnement au modèle d’image sélectionné. Par exemple, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL et les modèles de vision Llama 4 hébergés peuvent utiliser des images plus grandes que les chemins de vision anciens/par défaut à haut niveau de détail, tandis que les tours multi-images sont compressés plus agressivement en mode `auto` afin de maîtriser le coût en tokens et la latence.

Valeurs :

- `auto` : s’adapte aux limites du modèle et au nombre d’images.
- `efficient` : privilégie des images plus petites pour réduire l’utilisation de tokens et d’octets.
- `balanced` : utilise l’échelle standard intermédiaire.
- `high` : préserve davantage de détails pour les captures d’écran, les diagrammes et les images de documents.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire pour le contexte du prompt système (pas pour les horodatages des messages). Se rabat sur le fuseau horaire de l’hôte.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format de l’heure dans le prompt système. Valeur par défaut : `auto` (préférence du système d’exploitation).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // paramètres fournisseur par défaut globaux
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - La forme chaîne définit uniquement le modèle principal.
  - La forme objet définit le modèle principal ainsi que des modèles de basculement ordonnés.
- `imageModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin d’outil `image` comme configuration de modèle de vision.
  - Également utilisé comme routage de repli lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Préférez les références explicites `provider/model`. Les identifiants nus sont acceptés par compatibilité ; si un identifiant nu correspond de manière unique à une entrée configurée compatible image dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës nécessitent un préfixe de fournisseur explicite.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/Plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images native Gemini, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie OpenAI PNG/WebP avec arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification fournisseur correspondante (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Si omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API fournisseur correspondante.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Si omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API fournisseur correspondante.
  - Le Plugin officiel de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage de modèle.
  - Si omis, l’outil PDF se replie sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages considéré par défaut par le mode de repli d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau détaillé par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `toolProgressDetail` : mode de détail pour les résumés d’outils `/verbose` et les lignes d’outil de brouillon de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande/le détail brut lorsque disponible). `agents.list[].toolProgressDetail` par agent remplace cette valeur par défaut.
- `reasoningDefault` : visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs par défaut de raisonnement configurées ne sont appliquées que pour les propriétaires, les expéditeurs autorisés ou les contextes Gateway administrateur-opérateur lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par ex. `openai/gpt-5.5` pour un accès OpenAI par clé d’API ou Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant exact de modèle, et seulement ensuite se replie sur le fournisseur par défaut configuré (comportement de compatibilité obsolète, préférez donc un `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se replie sur le premier fournisseur/modèle configuré au lieu de remonter une valeur par défaut de fournisseur supprimé obsolète.
- `models` : catalogue de modèles configuré et liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (propres au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routage OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilisez des entrées `provider/*` comme `"openai/*": {}` ou `"vllm/*": {}` pour afficher tous les modèles découverts pour les fournisseurs sélectionnés sans lister manuellement chaque identifiant de modèle.
  - Ajoutez `agentRuntime` à une entrée `provider/*` lorsque chaque modèle découvert dynamiquement pour ce fournisseur doit utiliser le même runtime. La politique de runtime exacte `provider/model` prévaut toujours sur le joker.
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation, sauf si vous passez `--replace`.
  - Les flux de configuration/d’onboarding limités à un fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette carte et préservent les fournisseurs sans rapport déjà configurés.
  - Pour les modèles OpenAI Responses directs, la compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres de fournisseur globaux par défaut appliqués à tous les modèles. Définis dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `models.providers.openrouter.params.provider` : politique de routage fournisseur par défaut à l’échelle d’OpenRouter. OpenClaw la transmet à l’objet `provider` de la requête OpenRouter ; les paramètres par modèle `agents.defaults.models["openrouter/<model>"].params.provider` et les paramètres d’agent remplacent par clé. Voir [routage fournisseur OpenRouter](/fr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody` : JSON avancé de transmission directe fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. S’il entre en collision avec des clés de requête générées, le corps supplémentaire gagne ; les routes de complétions non natives retirent quand même ensuite le `store` propre à OpenAI.
- `params.chat_template_kwargs` : arguments de modèle de chat vLLM/compatibles OpenAI fusionnés dans les corps de requête de premier niveau `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la réflexion désactivée, le Plugin vLLM inclus envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` a toujours la priorité finale. Les modèles de réflexion vLLM Qwen et Nemotron configurés exposent des choix `/think` binaires (`off`, `on`) au lieu de l’échelle d’effort à plusieurs niveaux.
- `compat.thinkingFormat` : style de charge utile de réflexion compatible OpenAI. Utilisez `"together"` pour `reasoning.enabled` de style Together, `"qwen"` pour `enable_thinking` de premier niveau de style Qwen, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les backends de la famille Qwen qui prennent en charge les kwargs de modèle de chat au niveau requête, comme vLLM. OpenClaw mappe la réflexion désactivée à `false` et la réflexion activée à `true`, et les modèles vLLM Qwen configurés exposent des choix `/think` binaires pour ces formats.
- `compat.supportedReasoningEfforts` : liste d’efforts de raisonnement compatible OpenAI par modèle. Incluez `"xhigh"` pour les endpoints personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commande, les lignes de session Gateway, la validation des patchs de session, la validation de la CLI d’agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking` : option d’activation propre à Z.AI pour la réflexion préservée. Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue le `reasoning_content` antérieur ; voir [réflexion Z.AI et réflexion préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `localService` : gestionnaire de processus facultatif de niveau fournisseur pour les serveurs de modèles locaux/auto-hébergés. Lorsque le modèle sélectionné appartient à ce fournisseur, OpenClaw sonde `healthUrl` (ou `baseUrl + "/models"`), démarre `command` avec `args` si l’endpoint est indisponible, attend jusqu’à `readyTimeoutMs`, puis envoie la requête de modèle. `command` doit être un chemin absolu. `idleStopMs: 0` garde le processus actif jusqu’à la fermeture d’OpenClaw ; une valeur positive arrête le processus lancé par OpenClaw après ce nombre de millisecondes d’inactivité. Voir [services de modèles locaux](/fr/gateway/local-model-services).
- La politique de runtime appartient aux fournisseurs ou aux modèles, pas à `agents.defaults`. Utilisez `models.providers.<provider>.agentRuntime` pour des règles à l’échelle du fournisseur ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` pour des règles propres au modèle. Les modèles d’agent OpenAI sur le fournisseur OpenAI officiel sélectionnent Codex par défaut.
- Les rédacteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de repli) enregistrent la forme objet canonique et préservent les listes de repli existantes lorsque possible.
- `maxConcurrent` : nombre maximal d’exécutions d’agents parallèles entre sessions (chaque session reste sérialisée). Par défaut : 4.

### Politique de runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id` : `"auto"`, `"openclaw"`, un id de harnais de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex intégré enregistre `codex` ; le plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `id: "auto"` permet aux harnais de plugin enregistrés de revendiquer les tours pris en charge et utilise OpenClaw lorsqu’aucun harnais ne correspond. Un runtime de plugin explicite comme `id: "codex"` exige ce harnais et échoue en mode fermé s’il est indisponible ou échoue.
- `id: "pi"` n’est accepté que comme alias obsolète de `openclaw` afin de préserver les configurations livrées avec v2026.5.22 et antérieures. Les nouvelles configurations doivent utiliser `openclaw`.
- La précédence du runtime est d’abord la politique exacte du modèle (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`), puis `agents.list[]` / `agents.defaults.models["provider/*"]`, puis la politique à l’échelle du fournisseur dans `models.providers.<provider>.agentRuntime`.
- Les clés de runtime d’agent complet sont héritées. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, les épinglages de runtime de session et `OPENCLAW_AGENT_RUNTIME` sont ignorés par la sélection du runtime. Exécutez `openclaw doctor --fix` pour supprimer les valeurs obsolètes.
- Les modèles d’agent OpenAI utilisent le harnais Codex par défaut ; `agentRuntime.id: "codex"` pour le fournisseur/modèle reste valide lorsque vous voulez le rendre explicite.
- Pour les déploiements Claude CLI, privilégiez `model: "anthropic/claude-opus-4-8"` avec `agentRuntime.id: "claude-cli"` limité au modèle. Les références de modèle héritées `claude-cli/claude-opus-4-7` fonctionnent toujours pour compatibilité, mais les nouvelles configurations doivent garder la sélection fournisseur/modèle canonique et placer le backend d’exécution dans la politique de runtime fournisseur/modèle.
- Cela contrôle uniquement l’exécution des tours d’agent textuels. La génération de médias, la vision, les PDF, la musique, la vidéo et la synthèse vocale utilisent toujours leurs paramètres fournisseur/modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle se trouve dans `agents.defaults.models`) :

| Alias               | Modèle                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode de réflexion, sauf si vous définissez `--thinking off` ou `agents.defaults.models["zai/<model>"].params.thinking` vous-même.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Anthropic Claude Opus 4.8 garde la réflexion désactivée par défaut dans OpenClaw ; lorsque la réflexion adaptative est explicitement activée, la valeur d’effort par défaut détenue par le fournisseur Anthropic est `high`. Les modèles Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours en texte uniquement (sans appels d’outils). Utile comme solution de secours lorsque les fournisseurs d’API échouent.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Les backends CLI sont d’abord textuels ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- La transmission d’images est prise en charge lorsque `imageArg` accepte des chemins de fichiers.
- `reseedFromRawTranscriptWhenUncompacted: true` permet à un backend de récupérer des sessions invalidées sûres à partir d’une queue bornée de transcript OpenClaw brut avant que le premier résumé de Compaction existe. Les changements de profil d’authentification ou d’époque d’identifiants ne réensemencent toujours jamais à partir du brut.

### `agents.defaults.promptOverlays`

Surcouches de prompt indépendantes du fournisseur appliquées par famille de modèles sur les surfaces de prompt assemblées par OpenClaw. Les ids de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé sur les routes OpenClaw/fournisseur ; `personality` contrôle uniquement la couche conviviale de style d’interaction. Les routes natives de serveur d’application Codex conservent les instructions de base/modèle détenues par Codex au lieu de cette surcouche GPT-5 OpenClaw, et OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (par défaut) et `"on"` activent la couche conviviale de style d’interaction.
- `"off"` désactive uniquement la couche conviviale ; le contrat de comportement GPT-5 balisé reste activé.
- L’ancien `plugins.entries.openai.config.personality` est encore lu lorsque ce réglage partagé n’est pas défini.

### `agents.defaults.heartbeat`

Exécutions Heartbeat périodiques.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every` : chaîne de durée (ms/s/m/h). Valeur par défaut : `30m` (authentification par clé API) ou `1h` (authentification OAuth). Définissez sur `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque false, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte de bootstrap. Valeur par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : durée maximale en secondes autorisée pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds` lorsqu’il est défini, sinon la cadence Heartbeat plafonnée à 600 secondes.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque true, les exécutions Heartbeat utilisent un contexte de bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers de bootstrap de l’espace de travail.
- `isolatedSession` : lorsque true, chaque Heartbeat s’exécute dans une session fraîche, sans historique de conversation antérieur. Même schéma d’isolation que le cron `sessionTarget: "isolated"`. Réduit le coût en tokens par Heartbeat d’environ 100 K à environ 2 à 5 K tokens.
- `skipWhenBusy` : lorsque true, les exécutions Heartbeat sont différées sur les voies occupées supplémentaires de cet agent : son propre sous-agent indexé par clé de session ou son travail de commande imbriqué. Les voies Cron différent toujours les Heartbeats, même sans ce drapeau.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- Les Heartbeats exécutent des tours d’agent complets — des intervalles plus courts consomment plus de tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode` : `default` ou `safeguard` (résumé par morceaux pour les longs historiques). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un Plugin fournisseur de compaction enregistré. Lorsqu’il est défini, la fonction `summarize()` du fournisseur est appelée à la place du résumé LLM intégré. Revient au mécanisme intégré en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisées pour une seule opération de compaction avant qu’OpenClaw ne l’abandonne. Valeur par défaut : `180`.
- `keepRecentTokens` : budget de point de coupure de l’agent pour conserver textuellement la fin la plus récente de la transcription. La commande manuelle `/compact` le respecte lorsqu’il est explicitement défini ; sinon, la compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` préfixe des consignes intégrées de conservation des identifiants opaques pendant le résumé de compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés de protection. Activé par défaut en mode de protection ; définissez `enabled: false` pour ignorer l’audit.
- `midTurnPrecheck` : vérification facultative de pression de la boucle d’outils. Lorsque `enabled: true`, OpenClaw vérifie la pression du contexte après l’ajout des résultats d’outils et avant le prochain appel au modèle. Si le contexte ne tient plus, il abandonne la tentative en cours avant de soumettre le prompt et réutilise le chemin de récupération de prévérification existant pour tronquer les résultats d’outils ou compacter puis réessayer. Fonctionne avec les modes de compaction `default` et `safeguard`. Valeur par défaut : désactivé.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d’AGENTS.md à réinjecter après la compaction. La réinjection est désactivée lorsque cette option n’est pas définie ou vaut `[]`. Définir explicitement `["Session Startup", "Red Lines"]` active cette paire et conserve le repli hérité `Every Session`/`Safety`. Activez ceci uniquement lorsque le contexte supplémentaire vaut le risque de dupliquer des consignes de projet déjà capturées dans le résumé de compaction.
- `model` : `provider/model-id` facultatif ou alias simple issu de `agents.defaults.models` pour le résumé de compaction uniquement. Les alias simples sont résolus avant l’envoi ; les identifiants de modèles littéraux configurés gardent la priorité en cas de collision. Utilisez ceci lorsque la session principale doit conserver un modèle, mais que les résumés de compaction doivent s’exécuter sur un autre ; lorsqu’il n’est pas défini, la compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une compaction réussie puisse effectuer une rotation vers une transcription successeur plus petite. Désactivé lorsqu’il n’est pas défini ou vaut `0`.
- `notifyUser` : lorsque `true`, envoie de brèves notifications à l’utilisateur lorsque la compaction commence et lorsqu’elle se termine (par exemple, « Compactage du contexte... » et « Compaction terminée »). Désactivé par défaut pour que la compaction reste silencieuse.
- `memoryFlush` : tour agentique silencieux avant l’auto-compaction pour stocker des souvenirs durables. Définissez `model` sur un fournisseur/modèle exact comme `ollama/qwen3:8b` lorsque ce tour de maintenance doit rester sur un modèle local ; la substitution n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.runRetries`

Limites d’itérations de nouvelle tentative de la boucle d’exécution externe pour le runtime d’agent intégré afin d’éviter les boucles d’exécution infinies pendant la récupération après échec. Notez que ce paramètre ne s’applique actuellement qu’au runtime d’agent intégré, pas aux runtimes ACP ni CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base` : nombre de base d’itérations de nouvelle tentative d’exécution pour la boucle d’exécution externe. Valeur par défaut : `24`.
- `perProfile` : itérations supplémentaires de nouvelle tentative d’exécution accordées par candidat de profil de repli. Valeur par défaut : `8`.
- `min` : limite absolue minimale pour les itérations de nouvelle tentative d’exécution. Valeur par défaut : `32`.
- `max` : limite absolue maximale pour les itérations de nouvelle tentative d’exécution afin d’éviter une exécution incontrôlée. Valeur par défaut : `160`.

### `agents.defaults.contextPruning`

Élague les **anciens résultats d’outils** du contexte en mémoire avant l’envoi au LLM. Ne modifie **pas** l’historique de session sur disque.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` active les passes d’élagage.
- `ttl` contrôle la fréquence à laquelle l’élagage peut s’exécuter à nouveau (après le dernier accès au cache).
- L’élagage raccourcit d’abord en douceur les résultats d’outils surdimensionnés, puis efface complètement les résultats d’outils plus anciens si nécessaire.
- `softTrimRatio` et `hardClearRatio` acceptent les valeurs de `0.0` à `1.0` ; la validation de configuration rejette les valeurs hors de cette plage.

**Raccourcissement doux** conserve le début + la fin et insère `...` au milieu.

**Effacement complet** remplace l’intégralité du résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’images ne sont jamais raccourcis ni effacés.
- Les ratios sont basés sur les caractères (approximatifs), et non sur des nombres exacts de tokens.
- Si moins de `keepLastAssistants` messages d’assistant existent, l’élagage est ignoré.

</Accordion>

Voir [Élagage de session](/fr/concepts/session-pruning) pour les détails de comportement.

### Streaming par blocs

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Les canaux autres que Telegram nécessitent `*.blockStreaming: true` explicite pour activer les réponses par blocs.
- Substitutions de canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500 ms. Substitution par agent : `agents.list[].humanDelay`.

Voir [Streaming](/fr/concepts/streaming) pour les détails de comportement et de découpage en morceaux.

### Indicateurs de saisie

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valeurs par défaut : `instant` pour les conversations directes/mentions, `message` pour les conversations de groupe sans mention.
- Substitutions par session : `session.typingMode`, `session.typingIntervalSeconds`.

Voir [Indicateurs de saisie](/fr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facultatif pour l’agent intégré. Voir [Sandboxing](/fr/gateway/sandboxing) pour le guide complet.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend :**

- `docker` : runtime Docker local (par défaut)
- `ssh` : runtime distant générique adossé à SSH
- `openshell` : runtime OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres au runtime sont déplacés vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH sous la forme `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus en ligne ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires au runtime
- `strictHostKeyChecking` / `updateHostKeys` : réglages de stratégie de clé d’hôte OpenSSH

**Priorité de l’authentification SSH :**

- `identityData` l’emporte sur `identityFile`
- `certificateData` l’emporte sur `certificateFile`
- `knownHostsData` l’emporte sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues à partir de l’instantané actif du runtime de secrets avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise l’espace de travail distant une fois après la création ou la recréation
- conserve ensuite l’espace de travail SSH distant comme canonique
- achemine `exec`, les outils de fichiers et les chemins de médias via SSH
- ne synchronise pas automatiquement les modifications distantes vers l’hôte
- ne prend pas en charge les conteneurs de navigateur sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par portée sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox dans `/workspace`, espace de travail de l’agent monté en lecture seule dans `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture dans `/workspace`

**Portée :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (aucune isolation entre sessions)

**Configuration du Plugin OpenShell :**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell :**

- `mirror` : amorce le distant depuis le local avant l’exécution, resynchronise après l’exécution ; l’espace de travail local reste canonique
- `remote` : amorce le distant une fois lors de la création du bac à sable, puis conserve l’espace de travail distant comme canonique

En mode `remote`, les modifications locales à l’hôte effectuées en dehors d’OpenClaw ne sont pas synchronisées automatiquement dans le bac à sable après l’étape d’amorçage.
Le transport utilise SSH vers le bac à sable OpenShell, mais le Plugin possède le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine inscriptible et l’utilisateur root.

**Les conteneurs utilisent par défaut `network: "none"`** — définissez-le sur `"bridge"` (ou sur un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (solution d’urgence).
Les tours du serveur d’application Codex dans un bac à sable OpenClaw actif utilisent ce même réglage de sortie pour leur accès réseau natif en mode code.

**Les pièces jointes entrantes** sont préparées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôtes supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise l’authentification VNC par défaut et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez-le sur `bridge` uniquement lorsque vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` restreint facultativement l’entrée CDP au bord du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur du navigateur en bac à sable. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
- Les valeurs de lancement par défaut sont définies dans `scripts/sandbox-browser-entrypoint.sh` et réglées pour les hôtes de conteneurs :
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (activé par défaut)
  - `--disable-3d-apis`, `--disable-software-rasterizer` et `--disable-gpu` sont
    activés par défaut et peuvent être désactivés avec
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l’utilisation de WebGL/3D l’exige.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` réactive les extensions si votre flux de travail
    en dépend.
  - `--renderer-process-limit=2` peut être modifié avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la limite
    de processus par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l’image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le bac à sable du navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Pour les installations npm sans checkout source, consultez [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

### `agents.list` (remplacements par agent)

Utilisez `agents.list[].tts` pour donner à un agent son propre fournisseur TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc agent est fusionné en profondeur par-dessus
`messages.tts`, afin que les identifiants partagés puissent rester au même endroit pendant que les agents individuels
ne remplacent que les champs de voix ou de fournisseur dont ils ont besoin. Le remplacement de l’agent actif
s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et
à l’outil agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
pour des exemples de fournisseurs et l’ordre de priorité.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id` : identifiant d’agent stable (obligatoire).
- `default` : lorsque plusieurs sont définis, le premier gagne (avertissement journalisé). Si aucun n’est défini, la première entrée de liste est la valeur par défaut.
- `model` : la forme chaîne définit un modèle principal strict par agent sans modèle de secours ; la forme objet `{ primary }` est également stricte sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour inscrire cet agent au repli, ou `{ primary, fallbacks: [] }` pour rendre explicite le comportement strict. Les tâches Cron qui ne remplacent que `primary` héritent toujours des replis par défaut sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour les remplacements propres à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts` : remplacements de synthèse vocale facultatifs par agent. Le bloc est fusionné en profondeur par-dessus `messages.tts`, donc conservez les identifiants de fournisseur partagés et la stratégie de repli dans `messages.tts`, et définissez ici uniquement les valeurs propres à la persona, comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d’autorisation Skills facultative par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsque c’est défini ; une liste explicite remplace les valeurs par défaut au lieu de les fusionner, et `[]` signifie aucune Skills.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique possédée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`"auto" | true | false`). S’applique lorsqu’aucun remplacement de mode rapide par message ou par session n’est défini.
- `models` : remplacements facultatifs par agent du catalogue de modèles/de l’exécution, indexés par identifiants complets `provider/model`. Utilisez `models["provider/model"].agentRuntime` pour les exceptions d’exécution par agent.
- `runtime` : descripteur d’exécution facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- Les fichiers image `identity.avatar` locaux relatifs à l’espace de travail sont limités à 2 Mo. Les URL `http(s)` et les URI `data:` ne sont pas vérifiées avec la limite locale de taille de fichier.
- `identity` dérive les valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation d’identifiants d’agents configurés pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = toute cible configurée ; par défaut : même agent uniquement). Incluez l’identifiant du demandeur lorsque les appels `agentId` ciblant lui-même doivent être autorisés. Les entrées obsolètes dont la configuration d’agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer, ou ajoutez une entrée minimale `agents.list[]` si cette cible doit rester invocable tout en héritant des valeurs par défaut.
- Garde d’héritage du bac à sable : si la session demandeuse est en bac à sable, `sessions_spawn` rejette les cibles qui s’exécuteraient sans bac à sable.
- `subagents.requireAgentId` : lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite de profil ; par défaut : false).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans un seul Gateway. Consultez [Multi-agent](/fr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Champs de correspondance de liaison

- `type` (facultatif) : `route` pour le routage normal (un type manquant vaut par défaut route), `acp` pour les liaisons de conversation ACP persistantes.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; propre au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans pair/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante gagne.

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre par niveaux de liaison de route ci-dessus.

### Profils d’accès par agent

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="No filesystem access (messaging only)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consultez [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) pour les détails de précédence.

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field details">

- **`scope`** : stratégie de regroupement de session de base pour les contextes de discussion de groupe.
  - `per-sender` (par défaut) : chaque expéditeur obtient une session isolée dans un contexte de canal.
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsque le contexte partagé est voulu).
- **`dmScope`** : façon dont les MP sont regroupés.
  - `main` : tous les MP partagent la session principale.
  - `per-peer` : isole par identifiant d’expéditeur entre les canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateur).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour les configurations multi-compte).
- **`identityLinks`** : associe des identifiants canoniques à des pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes Dock telles que `/dock_discord` utilisent la même association pour basculer la route de réponse de la session active vers un autre pair de canal lié ; voir [l’arrimage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, le premier à expirer l’emporte. La fraîcheur de la réinitialisation quotidienne utilise le `sessionStartedAt` de la ligne de session ; la fraîcheur de la réinitialisation après inactivité utilise `lastInteractionAt`. Les écritures en arrière-plan/événement système telles que Heartbeat, les réveils Cron, les notifications exec et la comptabilité Gateway peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas fraîches les sessions quotidiennes/inactives.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`mainKey`** : champ hérité. Le runtime utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents lors des échanges agent-à-agent (entier, plage : `0`-`20`, par défaut : `5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’alias hérité `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage et de rétention du magasin de sessions.
  - `mode` : `enforce` applique le nettoyage et constitue la valeur par défaut ; `warn` émet uniquement des avertissements.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`). Le runtime écrit le nettoyage par lots avec une petite marge haute pour les plafonds de taille production ; `openclaw sessions cleanup --enforce` applique immédiatement le plafond.
  - Les sessions de sonde d’exécution de modèle Gateway à courte durée de vie utilisent une rétention fixe de `24h`, mais le nettoyage est déclenché par la pression : il ne supprime les lignes obsolètes de sonde stricte d’exécution de modèle que lorsque la maintenance ou la pression de plafond des entrées de session est atteinte. Seules les clés de sonde explicite stricte correspondant à `agent:*:explicit:model-run-<uuid>` sont éligibles ; les sessions normales directes, de groupe, de thread, Cron, hook, Heartbeat, ACP et sous-agent n’héritent pas de cette rétention de 24 h. Lorsque le nettoyage des exécutions de modèle s’exécute, il s’exécute avant le nettoyage plus large des entrées obsolètes `pruneAfter` et le plafond `maxEntries`.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>`. Utilise par défaut `pruneAfter` ; définissez sur `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il journalise des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Utilise par défaut `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liées aux threads.
  - `enabled` : commutateur par défaut principal (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : désactivation automatique par défaut après inactivité, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `maxAgeHours` : âge maximal strict par défaut, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `spawnSessions` : garde par défaut pour créer des sessions de travail liées aux threads depuis `sessions_spawn` et les créations de threads ACP. Utilise par défaut `true` lorsque les liaisons de thread sont activées ; les fournisseurs/comptes peuvent remplacer.
  - `defaultSpawnContext` : contexte natif de sous-agent par défaut pour les créations liées aux threads (`"fork"` ou `"isolated"`). Utilise par défaut `"fork"`.

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Préfixe de réponse

Remplacements par canal/compte : `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Résolution (le plus spécifique l’emporte) : compte → canal → global. `""` désactive et arrête la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables de modèle :**

| Variable          | Description              | Exemple                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nom court du modèle      | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur       | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent | (identique à `"auto"`)      |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Utilise par défaut `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé après la réponse sur les canaux prenant en charge les réactions tels que Slack, Discord, Signal, Telegram, WhatsApp et iMessage.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord, Signal, Telegram et WhatsApp.
  Sur Slack et Discord, l’absence de valeur conserve les réactions d’état activées lorsque les réactions d’accusé sont actives.
  Sur Signal, Telegram et WhatsApp, définissez explicitement cette option sur `true` pour activer les réactions d’état du cycle de vie.
- `messages.statusReactions.emojis` : remplace les clés d’emoji du cycle de vie :
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` et `stallHard`.
  Telegram n’autorise qu’un ensemble fixe de réactions ; les emoji configurés non pris en charge se replient donc
  sur la variante d’état prise en charge la plus proche pour cette discussion.

### Anti-rebond entrant

Regroupe les messages texte uniquement envoyés rapidement par le même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent l’envoi immédiatement. Les commandes de contrôle contournent l’anti-rebond.

### TTS (synthèse vocale)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` contrôle le mode auto-TTS par défaut : `off`, `always`, `inbound` ou `tagged`. `/tts on|off` peut remplacer les préférences locales, et `/tts status` affiche l’état effectif.
- `summaryModel` remplace `agents.defaults.model.primary` pour le résumé automatique.
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut `false` par défaut (opt-in).
- Les clés d’API se rabattent sur `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs de synthèse vocale groupés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation du modèle et de la voix.

---

## Talk

Valeurs par défaut pour le mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs Talk sont configurés.
- Les clés Talk plates héritées (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sont uniquement destinées à la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée dans `talk.providers.<provider>`.
- Les identifiants de voix se rabattent sur `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte des chaînes en clair ou des objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé d’API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. S’il est omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX sur macOS passe par l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `consultThinkingLevel` contrôle le niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels Control UI Talk realtime `openclaw_agent_consult`. Laissez-le non défini pour préserver le comportement normal de la session/du modèle.
- `consultFastMode` définit un remplacement ponctuel du mode rapide pour les consultations Control UI Talk realtime sans modifier le réglage normal du mode rapide de la session.
- `speechLocale` définit l’identifiant de locale BCP 47 utilisé par la reconnaissance vocale Talk iOS/macOS. Laissez-le non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle combien de temps le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Non défini, il conserve la fenêtre de pause par défaut de la plateforme (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` ajoute des instructions système destinées au fournisseur au prompt realtime intégré d’OpenClaw, afin que le style vocal puisse être configuré sans perdre les instructions par défaut de `openclaw_agent_consult`.
- `realtime.consultRouting` contrôle le repli du relais Gateway lorsque le fournisseur realtime produit une transcription utilisateur finale sans `openclaw_agent_consult` : `provider-direct` préserve les réponses directes du fournisseur, tandis que `force-agent-consult` achemine la requête finalisée via OpenClaw.

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
