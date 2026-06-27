---
read_when:
    - Réglage des valeurs par défaut de l’agent (modèles, raisonnement, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage multi-agent et des liaisons
    - Ajuster la session, la remise des messages et le comportement du mode conversationnel
summary: Paramètres par défaut de l’agent, routage multi-agent, session, messages et configuration de discussion
title: Configuration — agents
x-i18n:
    generated_at: "2026-06-27T17:28:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, le runtime Gateway et les autres
clés de premier niveau, consultez la [Référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Valeur par défaut : `OPENCLAW_WORKSPACE_DIR` lorsqu’elle est définie, sinon `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Une valeur explicite `agents.defaults.workspace` prévaut sur
`OPENCLAW_WORKSPACE_DIR`. Utilisez la variable d’environnement pour faire pointer les agents par défaut
vers un espace de travail monté lorsque vous ne voulez pas écrire ce chemin dans la configuration.

### `agents.defaults.repoRoot`

Racine de dépôt facultative affichée dans la ligne Runtime de l’invite système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour des Skills non restreintes par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune Skill.
- Une liste `agents.list[].skills` non vide est l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

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

Contrôle quand les fichiers d’amorçage de l’espace de travail sont injectés dans l’invite système. Valeur par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse d’assistant terminée) ignorent la réinjection de l’amorçage de l’espace de travail, ce qui réduit la taille de l’invite. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive l’amorçage de l’espace de travail et l’injection de fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui maîtrisent entièrement le cycle de vie de leur invite (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent aussi l’injection.

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

Utilisez les remplacements de profil d’amorçage par agent lorsqu’un agent nécessite un comportement
d’injection d’invite différent des valeurs par défaut partagées. Les champs omis héritent de
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

Contrôle l’avis visible par l’agent dans l’invite système lorsque le contexte d’amorçage est tronqué.
Valeur par défaut : `"always"`.

- `"off"` : n’injecte jamais de texte d’avis de troncature dans l’invite système.
- `"once"` : injecte un avis concis une fois par signature de troncature unique.
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe (recommandé).

Les décomptes détaillés bruts/injectés et les champs de réglage de configuration restent dans les diagnostics tels
que les rapports d’état/contexte et les journaux ; le contexte utilisateur/runtime WebChat courant ne
reçoit que l’avis de récupération concis.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw dispose de plusieurs budgets d’invite/contexte à volume élevé, et ils sont
intentionnellement répartis par sous-système au lieu de tous passer par un seul
réglage générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale de l’amorçage de l’espace de travail.
- `agents.defaults.startupContext.*` :
  préambule ponctuel de réinitialisation/démarrage pour l’exécution du modèle, incluant les fichiers quotidiens récents
  `memory/*.md`. Les commandes de chat seules `/new` et `/reset` sont
  acquittées sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte des Skills injectée dans l’invite système.
- `agents.defaults.contextLimits.*` :
  extraits bornés du runtime et blocs injectés appartenant au runtime.
- `memory.qmd.limits.*` :
  dimensionnement des extraits de recherche de mémoire indexée et de l’injection.

Utilisez le remplacement correspondant par agent uniquement lorsqu’un agent nécessite un budget
différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage du premier tour injecté lors des exécutions de modèle après réinitialisation/démarrage.
Les commandes de chat seules `/new` et `/reset` acquittent la réinitialisation sans invoquer
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

- `memoryGetMaxChars` : plafond par défaut de l’extrait `memory_get` avant l’ajout des métadonnées
  de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond avancé des résultats d’outils en direct utilisé pour les résultats persistés
  et la récupération après débordement. Laissez-le non défini pour le plafond automatique du contexte modèle :
  `16000` caractères sous 100K tokens, `32000` caractères à 100K+ tokens et `64000`
  caractères à 200K+ tokens. Les valeurs explicites jusqu’à `1000000` sont acceptées pour
  les modèles à contexte long, mais le plafond effectif reste limité à environ 30 % de
  la fenêtre de contexte du modèle. `openclaw doctor --deep` affiche le plafond effectif,
  et doctor n’avertit que lorsqu’un remplacement explicite est obsolète ou n’a aucun effet.
- `postCompactionMaxChars` : plafond de l’extrait AGENTS.md utilisé pendant l’injection
  d’actualisation après Compaction.

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
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Plafond global pour la liste compacte des Skills injectée dans l’invite système. Cela
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

Remplacement par agent pour le budget d’invite des Skills.

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

Taille maximale en pixels du plus long côté de l’image dans les blocs d’images de transcript/outils avant les appels aux fournisseurs.
Valeur par défaut : `1200`.

Les valeurs plus faibles réduisent généralement l’utilisation de tokens vision et la taille de la charge utile des requêtes pour les exécutions riches en captures d’écran.
Les valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Préférence de compression/détail de l’outil d’image pour les images chargées depuis des chemins de fichiers, des URL et des références média.
Valeur par défaut : `auto`.

OpenClaw adapte l’échelle de redimensionnement au modèle d’image sélectionné. Par exemple, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL et les modèles vision Llama 4 hébergés peuvent utiliser des images plus grandes que les chemins vision plus anciens/par défaut à haut niveau de détail, tandis que les tours multi-images sont compressés plus agressivement en mode `auto` afin de maîtriser le coût en tokens et la latence.

Valeurs :

- `auto` : s’adapte aux limites du modèle et au nombre d’images.
- `efficient` : privilégie les images plus petites pour réduire l’utilisation de tokens et d’octets.
- `balanced` : utilise l’échelle standard de compromis.
- `high` : préserve davantage de détails pour les captures d’écran, les diagrammes et les images de documents.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire pour le contexte de l’invite système (pas pour les horodatages des messages). Se rabat sur le fuseau horaire de l’hôte.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format de l’heure dans l’invite système. Valeur par défaut : `auto` (préférence de l’OS).

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
      params: { cacheRetention: "long" }, // global default provider params
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
  - Utilisé par le chemin de l’outil `image` comme configuration de son modèle de vision.
  - Également utilisé comme routage de repli lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Préférez les références explicites `provider/model`. Les ID nus sont acceptés pour compatibilité ; si un ID nu correspond de manière unique à une entrée configurée compatible image dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës nécessitent un préfixe de fournisseur explicite.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/Plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images Gemini native, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie PNG/WebP OpenAI à arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification du fournisseur correspondant (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des ID de fournisseur.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, ou `minimax/music-2.6`.
  - Si omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l’ordre des ID de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, ou `qwen/wan2.7-r2v`.
  - Si omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des ID de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
  - Le Plugin officiel de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage du modèle.
  - Si omis, l’outil PDF se rabat sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages considéré par le mode de repli d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau verbeux par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `toolProgressDetail` : mode de détail pour les résumés d’outils `/verbose` et les lignes d’outils dans les brouillons de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande/le détail brut quand disponible). `agents.list[].toolProgressDetail` par agent remplace cette valeur par défaut.
- `reasoningDefault` : visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs par défaut de raisonnement configurées ne sont appliquées qu’aux propriétaires, aux expéditeurs autorisés ou aux contextes Gateway opérateur-admin lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par exemple `openai/gpt-5.5` pour l’accès par clé d’API OpenAI ou Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet ID de modèle exact, et seulement ensuite se rabat sur le fournisseur par défaut configuré (comportement de compatibilité obsolète ; préférez donc `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se rabat sur le premier fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.
- `models` : catalogue de modèles configuré et liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifique au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routage OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilisez des entrées `provider/*` telles que `"openai/*": {}` ou `"vllm/*": {}` pour afficher tous les modèles découverts pour des fournisseurs sélectionnés sans lister manuellement chaque ID de modèle.
  - Ajoutez `agentRuntime` à une entrée `provider/*` lorsque chaque modèle découvert dynamiquement pour ce fournisseur doit utiliser le même runtime. La politique de runtime exacte `provider/model` reste prioritaire sur le caractère générique.
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation, sauf si vous passez `--replace`.
  - Les flux de configuration/d’intégration scoped par fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette carte et préservent les fournisseurs sans rapport déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Consultez [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres globaux par défaut du fournisseur appliqués à tous les modèles. Définis dans `agents.defaults.params` (par exemple `{ cacheRetention: "long" }`).
- Précédence de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (ID d’agent correspondant) remplace par clé. Consultez [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `models.providers.openrouter.params.provider` : politique de routage de fournisseur par défaut à l’échelle d’OpenRouter. OpenClaw la transmet à l’objet `provider` de la requête OpenRouter ; `agents.defaults.models["openrouter/<model>"].params.provider` par modèle et les paramètres d’agent remplacent par clé. Consultez [Routage des fournisseurs OpenRouter](/fr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody` : JSON passthrough avancé fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. En cas de collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de complétions non natives suppriment tout de même ensuite le champ OpenAI uniquement `store`.
- `params.chat_template_kwargs` : arguments de modèle de chat compatibles vLLM/OpenAI fusionnés dans les corps de requête de premier niveau `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la réflexion désactivée, le Plugin vLLM groupé envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` conserve la priorité finale. Les modèles de réflexion vLLM Qwen et Nemotron configurés exposent des choix binaires `/think` (`off`, `on`) au lieu de l’échelle d’effort multiniveau.
- `compat.thinkingFormat` : style de charge utile de réflexion compatible OpenAI. Utilisez `"together"` pour `reasoning.enabled` de style Together, `"qwen"` pour `enable_thinking` de premier niveau de style Qwen, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les backends de la famille Qwen qui prennent en charge les kwargs de modèle de chat au niveau requête, comme vLLM. OpenClaw mappe la réflexion désactivée sur `false` et la réflexion activée sur `true`, et les modèles vLLM Qwen configurés exposent des choix binaires `/think` pour ces formats.
- `compat.supportedReasoningEfforts` : liste d’efforts de raisonnement compatibles OpenAI par modèle. Incluez `"xhigh"` pour les endpoints personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session Gateway, la validation des correctifs de session, la validation CLI d’agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking` : option Z.AI uniquement pour la réflexion préservée. Quand elle est activée et que la réflexion est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue le `reasoning_content` antérieur ; consultez [Réflexion Z.AI et réflexion préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `localService` : gestionnaire de processus facultatif au niveau fournisseur pour les serveurs de modèles locaux/auto-hébergés. Lorsque le modèle sélectionné appartient à ce fournisseur, OpenClaw sonde `healthUrl` (ou `baseUrl + "/models"`), démarre `command` avec `args` si l’endpoint est indisponible, attend jusqu’à `readyTimeoutMs`, puis envoie la requête de modèle. `command` doit être un chemin absolu. `idleStopMs: 0` garde le processus actif jusqu’à la fermeture d’OpenClaw ; une valeur positive arrête le processus lancé par OpenClaw après ce nombre de millisecondes d’inactivité. Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- La politique de runtime appartient aux fournisseurs ou aux modèles, pas à `agents.defaults`. Utilisez `models.providers.<provider>.agentRuntime` pour les règles à l’échelle du fournisseur ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` pour les règles propres à un modèle. Les modèles d’agent OpenAI sur le fournisseur OpenAI officiel sélectionnent Codex par défaut.
- Les écrivains de configuration qui mutent ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de replis) enregistrent la forme canonique objet et préservent les listes de replis existantes quand c’est possible.
- `maxConcurrent` : nombre maximal d’exécutions d’agent parallèles entre sessions (chaque session reste sérialisée). Par défaut : 4.

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

- `id` : `"auto"`, `"openclaw"`, un identifiant de harnais de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex intégré enregistre `codex` ; le plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `id: "auto"` permet aux harnais de plugins enregistrés de réclamer les tours pris en charge et utilise OpenClaw lorsqu’aucun harnais ne correspond. Un runtime de plugin explicite tel que `id: "codex"` exige ce harnais et échoue de manière fermée s’il est indisponible ou échoue.
- `id: "pi"` n’est accepté que comme alias obsolète de `openclaw` afin de préserver les configurations livrées dans v2026.5.22 et les versions antérieures. Les nouvelles configurations doivent utiliser `openclaw`.
- La précédence du runtime applique d’abord la stratégie de modèle exacte (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`), puis `agents.list[]` / `agents.defaults.models["provider/*"]`, puis la stratégie à l’échelle du fournisseur dans `models.providers.<provider>.agentRuntime`.
- Les clés de runtime pour l’agent entier sont héritées. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, les épingles de runtime de session et `OPENCLAW_AGENT_RUNTIME` sont ignorés par la sélection du runtime. Exécutez `openclaw doctor --fix` pour supprimer les valeurs obsolètes.
- Les modèles d’agent OpenAI utilisent le harnais Codex par défaut ; provider/model `agentRuntime.id: "codex"` reste valide lorsque vous voulez l’expliciter.
- Pour les déploiements Claude CLI, préférez `model: "anthropic/claude-opus-4-8"` avec `agentRuntime.id: "claude-cli"` limité au modèle. Les références de modèle héritées `claude-cli/claude-opus-4-7` continuent de fonctionner pour la compatibilité, mais les nouvelles configurations doivent conserver la sélection provider/model canonique et placer le backend d’exécution dans la stratégie de runtime provider/model.
- Cela ne contrôle que l’exécution des tours d’agent textuels. La génération de médias, la vision, les PDF, la musique, la vidéo et le TTS utilisent toujours leurs paramètres provider/model.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`) :

| Alias               | Modèle                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode de réflexion sauf si vous définissez `--thinking off` ou `agents.defaults.models["zai/<model>"].params.thinking` vous-même.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Anthropic Claude Opus 4.8 garde la réflexion désactivée par défaut dans OpenClaw ; lorsque la réflexion adaptative est explicitement activée, la valeur d’effort par défaut propre au fournisseur Anthropic est `high`. Les modèles Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours uniquement textuelles (sans appels d’outils). Utile comme sauvegarde lorsque les fournisseurs d’API échouent.

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

- Les backends CLI privilégient le texte ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- Le transfert d’images est pris en charge lorsque `imageArg` accepte des chemins de fichiers.
- `reseedFromRawTranscriptWhenUncompacted: true` permet à un backend de récupérer des sessions invalidées sûres
  à partir d’une queue bornée de transcription brute OpenClaw avant que le
  premier résumé de Compaction n’existe. Les changements de profil d’authentification ou d’époque d’identifiants
  ne réamorcent toujours jamais à partir du brut.

### `agents.defaults.promptOverlays`

Superpositions de prompt indépendantes du fournisseur, appliquées par famille de modèles aux surfaces de prompt assemblées par OpenClaw. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé sur les routes OpenClaw/fournisseur ; `personality` ne contrôle que la couche de style d’interaction conviviale. Les routes natives du serveur d’application Codex conservent les instructions de base/modèle propres à Codex au lieu de cette superposition GPT-5 OpenClaw, et OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs.

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

- `"friendly"` (par défaut) et `"on"` activent la couche de style d’interaction conviviale.
- `"off"` désactive uniquement la couche conviviale ; le contrat de comportement GPT-5 étiqueté reste activé.
- L’ancien `plugins.entries.openai.config.personality` est toujours lu lorsque ce paramètre partagé n’est pas défini.

### `agents.defaults.heartbeat`

Exécutions périodiques de Heartbeat.

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

- `every` : chaîne de durée (ms/s/m/h). Par défaut : `30m` (authentification par clé API) ou `1h` (authentification OAuth). Définissez sur `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque défini sur false, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte d’amorçage. Par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque défini sur true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : temps maximal en secondes autorisé pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds` lorsqu’il est défini, sinon la cadence Heartbeat plafonnée à 600 secondes.
- `directPolicy` : stratégie de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque défini sur true, les exécutions Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsque défini sur true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Même schéma d’isolation que cron `sessionTarget: "isolated"`. Réduit le coût en tokens par Heartbeat d’environ 100K à environ 2-5K tokens.
- `skipWhenBusy` : lorsque défini sur true, les exécutions Heartbeat sont différées sur les voies occupées supplémentaires de cet agent : son propre sous-agent indexé par clé de session ou son travail de commande imbriqué. Les voies Cron différent toujours les Heartbeats, même sans cet indicateur.
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

- `mode` : `default` ou `safeguard` (résumé par segments pour les longs historiques). Voir [Compaction](/fr/concepts/compaction).
- `provider` : id d’un plugin fournisseur de Compaction enregistré. Lorsqu’il est défini, le `summarize()` du fournisseur est appelé à la place du résumé LLM intégré. Revient au mécanisme intégré en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une seule opération de Compaction avant qu’OpenClaw l’abandonne. Valeur par défaut : `180`.
- `keepRecentTokens` : budget de point de coupure de l’agent pour conserver textuellement la fin la plus récente de la transcription. Le `/compact` manuel le respecte lorsqu’il est explicitement défini ; sinon, la Compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` préfixe les consignes intégrées de conservation des identifiants opaques pendant le résumé de Compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés safeguard. Activé par défaut en mode safeguard ; définissez `enabled: false` pour ignorer l’audit.
- `midTurnPrecheck` : vérification facultative de la pression de la boucle d’outils. Lorsque `enabled: true`, OpenClaw vérifie la pression de contexte après l’ajout des résultats d’outils et avant le prochain appel au modèle. Si le contexte ne tient plus, il abandonne la tentative en cours avant de soumettre le prompt et réutilise le chemin de récupération de pré-vérification existant pour tronquer les résultats d’outils ou compacter et réessayer. Fonctionne avec les modes de Compaction `default` et `safeguard`. Valeur par défaut : désactivé.
- `postCompactionSections` : noms facultatifs de sections H2/H3 AGENTS.md à réinjecter après la Compaction. La réinjection est désactivée lorsqu’elle n’est pas définie ou qu’elle vaut `[]`. Définir explicitement `["Session Startup", "Red Lines"]` active cette paire et préserve le repli hérité `Every Session`/`Safety`. Activez ceci uniquement lorsque le contexte supplémentaire justifie le risque de dupliquer des consignes de projet déjà capturées dans le résumé de Compaction.
- `model` : `provider/model-id` facultatif ou alias nu issu de `agents.defaults.models` pour le résumé de Compaction uniquement. Les alias nus sont résolus avant l’envoi ; les IDs de modèles littéraux configurés conservent la priorité en cas de collision. Utilisez ceci lorsque la session principale doit conserver un modèle, mais que les résumés de Compaction doivent s’exécuter sur un autre ; si non défini, la Compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une Compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une Compaction réussie puisse basculer vers une transcription successeure plus petite. Désactivé lorsque non défini ou `0`.
- `notifyUser` : lorsque `true`, envoie de courts avis à l’utilisateur au démarrage et à la fin de la Compaction (par exemple, « Compactage du contexte... » et « Compaction terminée »). Désactivé par défaut pour garder la Compaction silencieuse.
- `memoryFlush` : tour agentique silencieux avant la Compaction automatique pour stocker des souvenirs durables. Définissez `model` sur un fournisseur/modèle exact tel que `ollama/qwen3:8b` lorsque ce tour de maintenance doit rester sur un modèle local ; la substitution n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.runRetries`

Limites d’itérations de nouvelle tentative de la boucle d’exécution externe pour le runtime d’agent intégré, afin d’éviter les boucles d’exécution infinies pendant la récupération après échec. Notez que ce paramètre ne s’applique actuellement qu’au runtime d’agent intégré, pas aux runtimes ACP ni CLI.

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
- `perProfile` : itérations de nouvelle tentative d’exécution supplémentaires accordées par candidat de profil de repli. Valeur par défaut : `8`.
- `min` : limite absolue minimale pour les itérations de nouvelle tentative d’exécution. Valeur par défaut : `32`.
- `max` : limite absolue maximale pour les itérations de nouvelle tentative d’exécution afin d’éviter les exécutions incontrôlées. Valeur par défaut : `160`.

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

<Accordion title="Comportement du mode cache-ttl">

- `mode: "cache-ttl"` active les passes d’élagage.
- `ttl` contrôle la fréquence à laquelle l’élagage peut être relancé (après le dernier accès au cache).
- L’élagage raccourcit d’abord en douceur les résultats d’outils surdimensionnés, puis efface complètement les résultats d’outils plus anciens si nécessaire.
- `softTrimRatio` et `hardClearRatio` acceptent des valeurs de `0.0` à `1.0` ; la validation de configuration rejette les valeurs hors de cette plage.

**Raccourcissement doux** conserve le début + la fin et insère `...` au milieu.

**Effacement complet** remplace tout le résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’images ne sont jamais raccourcis/effacés.
- Les ratios sont basés sur les caractères (approximation), et non sur un nombre exact de tokens.
- S’il existe moins de `keepLastAssistants` messages d’assistant, l’élagage est ignoré.

</Accordion>

Voir [Élagage de session](/fr/concepts/session-pruning) pour les détails du comportement.

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

- Les canaux non Telegram nécessitent `*.blockStreaming: true` explicite pour activer les réponses par blocs.
- Substitutions par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat ont par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500 ms. Substitution par agent : `agents.list[].humanDelay`.

Voir [Streaming](/fr/concepts/streaming) pour les détails de comportement et de segmentation.

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

- Valeurs par défaut : `instant` pour les discussions directes/mentions, `message` pour les discussions de groupe sans mention.
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

<Accordion title="Détails du sandbox">

**Backend :**

- `docker` : runtime Docker local (par défaut)
- `ssh` : runtime distant générique adossé à SSH
- `openshell` : runtime OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres au runtime sont déplacés vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par périmètre
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus inline ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires au runtime
- `strictHostKeyChecking` / `updateHostKeys` : paramètres de politique de clés d’hôte OpenSSH

**Priorité d’authentification SSH :**

- `identityData` prévaut sur `identityFile`
- `certificateData` prévaut sur `certificateFile`
- `knownHostsData` prévaut sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues à partir de l’instantané actif du runtime de secrets avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise l’espace de travail distant une fois après création ou recréation
- garde ensuite l’espace de travail SSH distant comme source canonique
- achemine `exec`, les outils de fichiers et les chemins de médias via SSH
- ne synchronise pas automatiquement les changements distants vers l’hôte
- ne prend pas en charge les conteneurs de navigateur sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par périmètre sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox à `/workspace`, espace de travail de l’agent monté en lecture seule sur `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture sur `/workspace`

**Périmètre :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (pas d’isolation entre sessions)

**Configuration du plugin OpenShell :**

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
          gateway: "lab", // facultatif
          gatewayEndpoint: "https://lab.example", // facultatif
          policy: "strict", // identifiant de stratégie OpenShell facultatif
          providers: ["openai"], // facultatif
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell :**

- `mirror` : amorce le distant depuis le local avant l'exécution, resynchronise après l'exécution ; l'espace de travail local reste canonique
- `remote` : amorce le distant une seule fois lors de la création du bac à sable, puis conserve l'espace de travail distant comme canonique

En mode `remote`, les modifications locales à l'hôte effectuées en dehors d'OpenClaw ne sont pas automatiquement synchronisées dans le bac à sable après l'étape d'amorçage.
Le transport se fait par SSH vers le bac à sable OpenShell, mais le Plugin possède le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s'exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine accessible en écriture, un utilisateur root.

**Par défaut, les conteneurs utilisent `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l'agent a besoin d'un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (solution d'urgence).
Les tours serveur d'application Codex dans un bac à sable OpenClaw actif utilisent ce même réglage de sortie pour leur accès réseau natif en mode code.

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` dans l'espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L'accès observateur noVNC utilise l'authentification VNC par défaut, et OpenClaw émet une URL à jeton de courte durée (au lieu d'exposer le mot de passe dans l'URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez-le sur `bridge` uniquement lorsque vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` restreint facultativement l'entrée CDP au bord du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du navigateur en bac à sable. Lorsqu'il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
- Les valeurs de lancement par défaut sont définies dans `scripts/sandbox-browser-entrypoint.sh` et ajustées pour les hôtes de conteneurs :
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l'utilisation de WebGL/3D l'exige.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` réactive les extensions si votre flux de travail
    en dépend.
  - `--renderer-process-limit=2` peut être modifié avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l'image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d'entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le bac à sable du navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh           # image principale du bac à sable
scripts/sandbox-browser-setup.sh   # image de navigateur facultative
```

Pour les installations npm sans checkout source, consultez [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

### `agents.list` (surcharges par agent)

Utilisez `agents.list[].tts` pour donner à un agent son propre fournisseur TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc de l'agent est fusionné en profondeur par-dessus
`messages.tts`, afin que les identifiants partagés puissent rester au même endroit tandis que les agents
individuels ne surchargent que les champs de voix ou de fournisseur dont ils ont besoin. La surcharge de l'agent actif
s'applique aux réponses parlées automatiques, à `/tts audio`, à `/tts status` et
à l'outil d'agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
pour des exemples de fournisseurs et la précédence.

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
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // surcharge du niveau de réflexion par agent
        reasoningDefault: "on", // surcharge de la visibilité du raisonnement par agent
        fastModeDefault: false, // surcharge du mode rapide par agent
        params: { cacheRetention: "none" }, // surcharge les paramètres defaults.models correspondants par clé
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // remplace agents.defaults.skills lorsque défini
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

- `id` : identifiant d'agent stable (obligatoire).
- `default` : lorsque plusieurs sont définis, le premier l'emporte (avertissement journalisé). Si aucun n'est défini, la première entrée de la liste est la valeur par défaut.
- `model` : la forme chaîne définit un primaire strict par agent sans repli de modèle ; la forme objet `{ primary }` est également stricte sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour activer le repli pour cet agent, ou `{ primary, fallbacks: [] }` pour rendre explicite le comportement strict. Les tâches Cron qui ne surchargent que `primary` héritent toujours des replis par défaut sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l'entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour les surcharges propres à l'agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts` : surcharges de synthèse vocale facultatives par agent. Le bloc est fusionné en profondeur par-dessus `messages.tts`, donc conservez les identifiants de fournisseur partagés et la stratégie de repli dans `messages.tts`, et ne définissez ici que les valeurs propres au persona comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d'autorisation de Skills facultative par agent. Si elle est omise, l'agent hérite de `agents.defaults.skills` lorsque défini ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucune Skills.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Surcharge `agents.defaults.thinkingDefault` pour cet agent lorsqu'aucune surcharge par message ou session n'est définie. Le profil fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique possédée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). Surcharge `agents.defaults.reasoningDefault` pour cet agent lorsqu'aucune surcharge de raisonnement par message ou session n'est définie.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`"auto" | true | false`). S'applique lorsqu'aucune surcharge de mode rapide par message ou session n'est définie.
- `models` : surcharges facultatives de catalogue de modèles/runtime par agent, indexées par identifiants complets `provider/model`. Utilisez `models["provider/model"].agentRuntime` pour les exceptions de runtime par agent.
- `runtime` : descripteur de runtime facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l'agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l'espace de travail, URL `http(s)` ou URI `data:`.
- Les fichiers image `identity.avatar` locaux relatifs à l'espace de travail sont limités à 2 Mo. Les URL `http(s)` et les URI `data:` ne sont pas vérifiées avec la limite de taille de fichier local.
- `identity` dérive les valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d'autorisation d'identifiants d'agents configurés pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = toute cible configurée ; par défaut : même agent uniquement). Incluez l'identifiant du demandeur lorsque les appels `agentId` ciblant soi-même doivent être autorisés. Les entrées obsolètes dont la configuration d'agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer, ou ajoutez une entrée `agents.list[]` minimale si cette cible doit rester lançable tout en héritant des valeurs par défaut.
- Garde d'héritage du bac à sable : si la session demandeuse est en bac à sable, `sessions_spawn` rejette les cibles qui s'exécuteraient sans bac à sable.
- `subagents.requireAgentId` : lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite du profil ; par défaut : false).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans un seul Gateway. Voir [Multi-agent](/fr/concepts/multi-agent).

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

- `type` (facultatif) : `route` pour le routage normal (un type manquant vaut route par défaut), `acp` pour les liaisons de conversation ACP persistantes.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = tout compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; propre au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans pair/guilde/équipe)
5. `match.accountId: "*"` (à l'échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l'emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n'utilise pas l'ordre des niveaux de liaison de routage ci-dessus.

### Profils d'accès par agent

<Accordion title="Accès complet (sans bac à sable)">

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

<Accordion title="Outils en lecture seule + espace de travail">

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

<Accordion title="Aucun accès au système de fichiers (messagerie uniquement)">

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

Consultez [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) pour plus de détails sur la précédence.

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

<Accordion title="Détails des champs de session">

- **`scope`** : stratégie de regroupement de session de base pour les contextes de discussions de groupe.
  - `per-sender` (par défaut) : chaque expéditeur obtient une session isolée dans un contexte de canal.
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est prévu).
- **`dmScope`** : mode de regroupement des messages privés.
  - `main` : tous les messages privés partagent la session principale.
  - `per-peer` : isole par identifiant d’expéditeur entre les canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour le multi-compte).
- **`identityLinks`** : mappe les identifiants canoniques vers des pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes d’ancrage telles que `/dock_discord` utilisent la même mappe pour basculer la route de réponse de la session active vers un autre pair de canal lié ; voir [Ancrage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique principale de réinitialisation. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, le premier délai expiré l’emporte. La fraîcheur de la réinitialisation quotidienne utilise le `sessionStartedAt` de la ligne de session ; la fraîcheur de la réinitialisation sur inactivité utilise `lastInteractionAt`. Les écritures d’arrière-plan/événements système telles que Heartbeat, les réveils Cron, les notifications d’exécution et la comptabilité du Gateway peuvent mettre à jour `updatedAt`, mais elles ne gardent pas les sessions quotidiennes/sur inactivité fraîches.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`mainKey`** : champ hérité. Le runtime utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents pendant les échanges agent-à-agent (entier, plage : `0`-`20`, par défaut : `5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’alias hérité `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage et de rétention du magasin de sessions.
  - `mode` : `enforce` applique le nettoyage et est la valeur par défaut ; `warn` émet seulement des avertissements.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (`30d` par défaut).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (`500` par défaut). Le runtime écrit un nettoyage par lots avec un petit tampon de niveau haut pour les plafonds de taille production ; `openclaw sessions cleanup --enforce` applique le plafond immédiatement.
  - Les sessions de sondage d’exécution de modèle Gateway à courte durée de vie utilisent une rétention fixe de `24h`, mais le nettoyage est conditionné par la pression : il ne supprime les lignes obsolètes de sondage strict d’exécution de modèle que lorsque la pression de maintenance/plafond des entrées de session est atteinte. Seules les clés de sondage explicites strictes correspondant à `agent:*:explicit:model-run-<uuid>` sont éligibles ; les sessions directes, de groupe, de fil, Cron, hook, Heartbeat, ACP et de sous-agent normales n’héritent pas de cette rétention de 24 h. Lorsque le nettoyage d’exécution de modèle s’exécute, il s’exécute avant le nettoyage plus large des entrées obsolètes `pruneAfter` et le plafond `maxEntries`.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : rétention pour les archives de transcript `*.reset.<timestamp>`. La valeur par défaut est `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il journalise des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut à `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs globales par défaut pour les fonctionnalités de sessions liées aux fils.
  - `enabled` : interrupteur principal par défaut (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : délai par défaut, en heures, avant retrait automatique du focus pour inactivité (`0` désactive ; les fournisseurs peuvent le remplacer)
  - `maxAgeHours` : âge maximal strict par défaut, en heures (`0` désactive ; les fournisseurs peuvent le remplacer)
  - `spawnSessions` : garde par défaut pour créer des sessions de travail liées aux fils depuis `sessions_spawn` et les spawns de fils ACP. Par défaut à `true` lorsque les liaisons de fils sont activées ; les fournisseurs/comptes peuvent le remplacer.
  - `defaultSpawnContext` : contexte natif de sous-agent par défaut pour les spawns liés aux fils (`"fork"` ou `"isolated"`). Par défaut à `"fork"`.

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

| Variable          | Description                 | Exemple                     |
| ----------------- | --------------------------- | --------------------------- |
| `{model}`         | Nom court du modèle         | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur          | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel  | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent   | (identique à `"auto"`)      |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé après la réponse sur les canaux compatibles avec les réactions tels que Slack, Discord, Telegram, WhatsApp et iMessage.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord, Telegram et WhatsApp.
  Sur Slack et Discord, une valeur non définie garde les réactions d’état activées lorsque les réactions d’accusé sont actives.
  Sur Telegram et WhatsApp, définissez-le explicitement sur `true` pour activer les réactions d’état du cycle de vie.
- `messages.statusReactions.emojis` : remplace les clés d’emoji du cycle de vie :
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` et `stallHard`.
  Telegram n’autorise qu’un ensemble fixe de réactions ; les emoji configurés non pris en charge se replient donc
  sur la variante d’état prise en charge la plus proche pour cette discussion.

### Débounce entrant

Regroupe les messages texte uniquement rapides du même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent l’envoi immédiatement. Les commandes de contrôle contournent le débounce.

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
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut `false` par défaut (activation explicite).
- Les clés d’API utilisent en repli `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs de synthèse vocale intégrés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque Plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS d’OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Quand `providers.openai.baseUrl` pointe vers un point de terminaison non-OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation des modèles/voix.

---

## Discussion

Valeurs par défaut du mode Discussion (macOS/iOS/Android).

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
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existent uniquement pour la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée dans `talk.providers.<provider>`.
- Les identifiants de voix utilisent en repli `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte les chaînes en clair ou les objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé d’API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. Si cette valeur est omise, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX macOS passe par l’assistant intégré `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur le `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `consultThinkingLevel` contrôle le niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels `openclaw_agent_consult` realtime Talk de Control UI. Laissez non défini pour préserver le comportement normal de session/modèle.
- `consultFastMode` définit un remplacement ponctuel du mode rapide pour les consultations realtime Talk de Control UI sans modifier le réglage normal du mode rapide de la session.
- `speechLocale` définit l’identifiant de locale BCP 47 utilisé par la reconnaissance vocale Talk iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle la durée pendant laquelle le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Laisser non défini conserve la fenêtre de pause par défaut de la plateforme (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` ajoute des instructions système destinées au fournisseur au prompt realtime intégré d’OpenClaw, afin que le style vocal puisse être configuré sans perdre les consignes `openclaw_agent_consult` par défaut.
- `realtime.consultRouting` contrôle le repli du relais Gateway lorsque le fournisseur realtime produit une transcription utilisateur finale sans `openclaw_agent_consult` : `provider-direct` conserve les réponses directes du fournisseur, tandis que `force-agent-consult` route la requête finalisée via OpenClaw.

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
