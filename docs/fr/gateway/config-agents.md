---
read_when:
    - Ajuster les paramètres par défaut de l’agent (modèles, réflexion, espace de travail, heartbeat, médias, Skills)
    - Configuration du routage et des liaisons multi-agents
    - Ajustement du comportement de session, de remise des messages et du mode conversationnel
summary: Valeurs par défaut des agents, routage multi-agent, session, messages et configuration de discussion
title: Configuration — agents
x-i18n:
    generated_at: "2026-07-01T12:59:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, le runtime Gateway et les autres
clés de premier niveau, consultez la [Référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Par défaut : `OPENCLAW_WORKSPACE_DIR` lorsqu’il est défini, sinon `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Une valeur explicite `agents.defaults.workspace` prévaut sur
`OPENCLAW_WORKSPACE_DIR`. Utilisez la variable d’environnement pour faire pointer les agents par défaut
vers un espace de travail monté lorsque vous ne voulez pas écrire ce chemin dans la configuration.

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
      { id: "locked-down", skills: [] }, // aucune Skills
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune Skills.
- Une liste `agents.list[].skills` non vide constitue l’ensemble final pour cet agent ; elle
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

Contrôle le moment où les fichiers d’amorçage de l’espace de travail sont injectés dans le prompt système. Par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse terminée de l’assistant) ignorent la réinjection de l’amorçage de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent tout de même le contexte.
- `"never"` : désactive l’amorçage de l’espace de travail et l’injection des fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui possèdent entièrement le cycle de vie de leur prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Remplacement par agent : `agents.list[].contextInjection`. Les valeurs omises héritent de
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier d’amorçage de l’espace de travail avant troncature. Par défaut : `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Remplacement par agent : `agents.list[].bootstrapMaxChars`. Les valeurs omises héritent de
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Nombre maximal total de caractères injectés sur l’ensemble des fichiers d’amorçage de l’espace de travail. Par défaut : `60000`.

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
Par défaut : `"always"`.

- `"off"` : n’injecte jamais de texte d’avis de troncature dans le prompt système.
- `"once"` : injecte un avis concis une seule fois par signature de troncature unique.
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe (recommandé).

Les décomptes bruts/injectés détaillés et les champs de réglage de configuration restent dans les diagnostics tels
que les rapports de contexte/état et les journaux ; le contexte utilisateur/runtime WebChat courant ne
reçoit que l’avis concis de récupération.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw possède plusieurs budgets de prompt/contexte à fort volume, et ils sont
volontairement répartis par sous-système au lieu de transiter tous par un même
paramètre générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale de l’amorçage de l’espace de travail.
- `agents.defaults.startupContext.*` :
  prélude ponctuel de réinitialisation/démarrage pour l’exécution du modèle, incluant les récents fichiers quotidiens
  `memory/*.md`. Les commandes de chat simples `/new` et `/reset` sont
  acquittées sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte des Skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits bornés du runtime et blocs injectés détenus par le runtime.
- `memory.qmd.limits.*` :
  dimensionnement de l’extrait de recherche mémoire indexée et de l’injection.

Utilisez le remplacement par agent correspondant uniquement lorsqu’un agent a besoin d’un budget
différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le prélude de démarrage du premier tour injecté lors des exécutions du modèle après réinitialisation/démarrage.
Les commandes de chat simples `/new` et `/reset` acquittent la réinitialisation sans invoquer
le modèle ; elles ne chargent donc pas ce prélude.

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

- `memoryGetMaxChars` : plafond par défaut des extraits `memory_get` avant l’ajout des
  métadonnées de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond avancé des résultats d’outils live utilisé pour les résultats persistés
  et la récupération après dépassement. Laissez-le non défini pour le plafond automatique de contexte modèle :
  `16000` caractères sous 100K tokens, `32000` caractères à 100K+ tokens et `64000`
  caractères à 200K+ tokens. Les valeurs explicites jusqu’à `1000000` sont acceptées pour
  les modèles à long contexte, mais le plafond effectif reste limité à environ 30 %
  de la fenêtre de contexte du modèle. `openclaw doctor --deep` affiche le plafond effectif,
  et doctor avertit uniquement lorsqu’un remplacement explicite est obsolète ou sans effet.
- `postCompactionMaxChars` : plafond d’extrait AGENTS.md utilisé pendant l’injection de
  rafraîchissement après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent pour les paramètres partagés `contextLimits`. Les champs omis héritent
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

Plafond global de la liste compacte des Skills injectée dans le prompt système. Cela
n’affecte pas la lecture à la demande des fichiers `SKILL.md`.

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

Remplacement par agent pour le budget du prompt des Skills.

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

Taille maximale en pixels du plus long côté d’image dans les blocs d’images de transcript/d’outil avant les appels fournisseur.
Par défaut : `1200`.

Des valeurs plus basses réduisent généralement l’utilisation des tokens vision et la taille de charge utile des requêtes pour les exécutions riches en captures d’écran.
Des valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Préférence de compression/détail des outils d’image pour les images chargées depuis des chemins de fichiers, des URL et des références média.
Par défaut : `auto`.

OpenClaw adapte l’échelle de redimensionnement au modèle d’image sélectionné. Par exemple, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL et les modèles de vision Llama 4 hébergés peuvent utiliser des images plus grandes que les chemins de vision haute définition plus anciens/par défaut, tandis que les tours multi-images sont compressés plus agressivement en mode `auto` pour maîtriser le coût en tokens et la latence.

Valeurs :

- `auto` : s’adapte aux limites du modèle et au nombre d’images.
- `efficient` : privilégie les images plus petites pour réduire l’utilisation des tokens et des octets.
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

Format de l’heure dans le prompt système. Par défaut : `auto` (préférence du système d’exploitation).

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
      params: { cacheRetention: "long" }, // paramètres fournisseur globaux par défaut
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
  - Utilisé par le chemin de l’outil `image` comme configuration de modèle de vision.
  - Également utilisé comme routage de secours lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Préférez les références explicites `provider/model`. Les identifiants nus sont acceptés pour compatibilité ; si un identifiant nu correspond de façon unique à une entrée configurée compatible image dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës nécessitent un préfixe de fournisseur explicite.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/Plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images Gemini native, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie OpenAI PNG/WebP à arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification du fournisseur correspondant (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - En cas d’omission, `image_generate` peut encore déduire une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération de musique et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, ou `minimax/music-2.6`.
  - En cas d’omission, `music_generate` peut encore déduire une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/clé d’API du fournisseur correspondant.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération de vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, ou `qwen/wan2.7-r2v`.
  - En cas d’omission, `video_generate` peut encore déduire une valeur par défaut de fournisseur avec authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de vidéo enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/clé d’API du fournisseur correspondant.
  - Le Plugin officiel de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, 10 secondes de durée, ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage du modèle.
  - En cas d’omission, l’outil PDF se replie sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages par défaut prises en compte par le mode de secours d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau détaillé par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `toolProgressDetail` : mode de détail pour les résumés d’outils `/verbose` et les lignes d’outil de brouillon de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande/le détail brut quand disponible). `agents.list[].toolProgressDetail` par agent remplace cette valeur par défaut.
- `reasoningDefault` : visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs par défaut de raisonnement configurées ne sont appliquées que pour les propriétaires, les expéditeurs autorisés ou les contextes Gateway d’administrateur opérateur lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par exemple `openai/gpt-5.5` pour un accès par clé d’API OpenAI ou Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant exact de modèle, et seulement ensuite se replie sur le fournisseur par défaut configuré (comportement de compatibilité obsolète ; préférez donc `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se replie sur le premier fournisseur/modèle configuré au lieu de présenter une valeur par défaut obsolète de fournisseur supprimé.
- `models` : le catalogue de modèles configuré et la liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (propres au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routage OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilisez des entrées `provider/*` comme `"openai/*": {}` ou `"vllm/*": {}` pour afficher tous les modèles découverts pour les fournisseurs sélectionnés sans lister manuellement chaque identifiant de modèle.
  - Ajoutez `agentRuntime` à une entrée `provider/*` lorsque chaque modèle découvert dynamiquement pour ce fournisseur doit utiliser le même runtime. La politique de runtime exacte `provider/model` reste prioritaire sur le caractère générique.
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de liste d’autorisation sauf si vous passez `--replace`.
  - Les flux de configuration/intégration limités à un fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette map et préservent les fournisseurs sans rapport déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres globaux par défaut du fournisseur appliqués à tous les modèles. Définis dans `agents.defaults.params` (par exemple `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `models.providers.openrouter.params.provider` : politique de routage de fournisseur par défaut à l’échelle d’OpenRouter. OpenClaw la transmet à l’objet `provider` de requête d’OpenRouter ; `agents.defaults.models["openrouter/<model>"].params.provider` par modèle et les paramètres d’agent remplacent par clé. Voir [Routage de fournisseur OpenRouter](/fr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody` : JSON de relais avancé fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. S’il entre en collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de complétions non natives retirent quand même ensuite `store`, propre à OpenAI.
- `params.chat_template_kwargs` : arguments de modèle de discussion compatibles vLLM/OpenAI fusionnés dans les corps de requête de niveau supérieur `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la pensée désactivée, le Plugin vLLM fourni envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` reste prioritaire en dernier. Les modèles de pensée Qwen et Nemotron vLLM configurés exposent des choix `/think` binaires (`off`, `on`) au lieu de l’échelle d’effort à plusieurs niveaux.
- `compat.thinkingFormat` : style de charge utile de pensée compatible OpenAI. Utilisez `"together"` pour `reasoning.enabled` de style Together, `"qwen"` pour `enable_thinking` de niveau supérieur de style Qwen, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les backends de la famille Qwen qui prennent en charge les kwargs de modèle de discussion au niveau requête, comme vLLM. OpenClaw mappe la pensée désactivée vers `false` et la pensée activée vers `true`, et les modèles Qwen vLLM configurés exposent des choix `/think` binaires pour ces formats.
- `compat.supportedReasoningEfforts` : liste d’efforts de raisonnement compatibles OpenAI par modèle. Incluez `"xhigh"` pour les points de terminaison personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session Gateway, la validation des correctifs de session, la validation CLI d’agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking` : option d’activation propre à Z.AI pour la pensée préservée. Lorsqu’elle est activée et que la pensée est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue le `reasoning_content` précédent ; voir [Pensée Z.AI et pensée préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `localService` : gestionnaire de processus facultatif au niveau fournisseur pour les serveurs de modèles locaux/auto-hébergés. Lorsque le modèle sélectionné appartient à ce fournisseur, OpenClaw sonde `healthUrl` (ou `baseUrl + "/models"`), démarre `command` avec `args` si le point de terminaison est indisponible, attend jusqu’à `readyTimeoutMs`, puis envoie la requête du modèle. `command` doit être un chemin absolu. `idleStopMs: 0` maintient le processus en vie jusqu’à la fermeture d’OpenClaw ; une valeur positive arrête le processus lancé par OpenClaw après ce nombre de millisecondes d’inactivité. Voir [Services de modèles locaux](/fr/gateway/local-model-services).
- La politique de runtime appartient aux fournisseurs ou aux modèles, pas à `agents.defaults`. Utilisez `models.providers.<provider>.agentRuntime` pour les règles à l’échelle du fournisseur ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` pour les règles propres au modèle. Les modèles d’agent OpenAI sur le fournisseur officiel OpenAI sélectionnent Codex par défaut.
- Les rédacteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de secours) enregistrent la forme canonique d’objet et préservent les listes de secours existantes lorsque c’est possible.
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

- `id` : `"auto"`, `"openclaw"`, un identifiant de harness de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex intégré enregistre `codex` ; le plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `id: "auto"` permet aux harnesses de plugin enregistrés de revendiquer les tours pris en charge et utilise OpenClaw lorsqu’aucun harness ne correspond. Un runtime de plugin explicite comme `id: "codex"` exige ce harness et échoue en mode fermé s’il est indisponible ou échoue.
- `id: "pi"` est accepté uniquement comme alias obsolète de `openclaw` afin de préserver les configurations livrées avec v2026.5.22 et versions antérieures. Les nouvelles configurations doivent utiliser `openclaw`.
- La priorité du runtime applique d’abord la stratégie exacte du modèle (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`), puis `agents.list[]` / `agents.defaults.models["provider/*"]`, puis la stratégie à l’échelle du fournisseur dans `models.providers.<provider>.agentRuntime`.
- Les clés de runtime d’agent complet sont héritées. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, les épinglages de runtime de session et `OPENCLAW_AGENT_RUNTIME` sont ignorés par la sélection du runtime. Exécutez `openclaw doctor --fix` pour supprimer les valeurs obsolètes.
- Les modèles d’agent OpenAI utilisent le harness Codex par défaut ; le provider/model `agentRuntime.id: "codex"` reste valide lorsque vous voulez le rendre explicite.
- Pour les déploiements Claude CLI, préférez `model: "anthropic/claude-opus-4-8"` avec `agentRuntime.id: "claude-cli"` limité au modèle. Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore par compatibilité, mais les nouvelles configurations doivent garder la sélection provider/model canonique et placer le backend d’exécution dans la stratégie de runtime provider/model.
- Cela contrôle uniquement l’exécution des tours d’agent textuels. La génération de médias, la vision, les PDF, la musique, la vidéo et le TTS utilisent toujours leurs paramètres provider/model.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`) :

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

Vos alias configurés l’emportent toujours sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode de réflexion sauf si vous définissez `--thinking off` ou `agents.defaults.models["zai/<model>"].params.thinking` vous-même.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Anthropic Claude Opus 4.8 garde la réflexion désactivée par défaut dans OpenClaw ; lorsque la réflexion adaptative est explicitement activée, la valeur par défaut de l’effort détenue par le fournisseur Anthropic est `high`. Les modèles Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours en texte seul (sans appels d’outils). Utile comme sauvegarde lorsque les fournisseurs d’API échouent.

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
- Sessions prises en charge lorsque `sessionArg` est défini.
- Transfert des images pris en charge lorsque `imageArg` accepte des chemins de fichiers.
- `reseedFromRawTranscriptWhenUncompacted: true` permet à un backend de récupérer des sessions sûres
  invalidées depuis une fin bornée de transcript OpenClaw brut avant que le
  premier résumé de compaction n’existe. Les changements de profil d’authentification ou d’époque d’identifiants
  ne réensemencent toujours jamais depuis le brut.

### `agents.defaults.promptOverlays`

Superpositions de prompts indépendantes du fournisseur, appliquées par famille de modèles aux surfaces de prompt assemblées par OpenClaw. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé sur les routes OpenClaw/fournisseur ; `personality` contrôle uniquement la couche de style d’interaction conviviale. Les routes natives de serveur d’application Codex conservent les instructions de base/modèle détenues par Codex au lieu de cette superposition GPT-5 d’OpenClaw, et OpenClaw désactive la personnalité intégrée de Codex pour les threads natifs.

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
- `"off"` désactive uniquement la couche conviviale ; le contrat de comportement GPT-5 balisé reste activé.
- L’ancien `plugins.entries.openai.config.personality` est encore lu lorsque ce paramètre partagé n’est pas défini.

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

- `every` : chaîne de durée (ms/s/m/h). Valeur par défaut : `30m` (authentification par clé d’API) ou `1h` (authentification OAuth). Définissez sur `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque la valeur est false, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte de démarrage. Valeur par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque la valeur est true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : durée maximale autorisée, en secondes, pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds` lorsqu’il est défini, sinon la cadence Heartbeat plafonnée à 600 secondes.
- `directPolicy` : stratégie de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque la valeur est true, les exécutions Heartbeat utilisent un contexte de démarrage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers de démarrage de l’espace de travail.
- `isolatedSession` : lorsque la valeur est true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Même modèle d’isolation que le Cron `sessionTarget: "isolated"`. Réduit le coût en tokens par Heartbeat d’environ 100K à environ 2-5K tokens.
- `skipWhenBusy` : lorsque la valeur est true, les exécutions Heartbeat sont différées sur les voies occupées supplémentaires de cet agent : son propre travail de sous-agent indexé par clé de session ou de commande imbriquée. Les voies Cron diffèrent toujours les Heartbeats, même sans ce drapeau.
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

- `mode` : `default` ou `safeguard` (résumé par segments pour les historiques longs). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un plugin de fournisseur de compaction enregistré. Lorsqu’il est défini, la méthode `summarize()` du fournisseur est appelée à la place du résumé LLM intégré. Revient à l’intégration en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisées pour une seule opération de compaction avant qu’OpenClaw l’interrompe. Valeur par défaut : `180`.
- `keepRecentTokens` : budget du point de coupe de l’agent pour conserver textuellement la fin la plus récente de la transcription. La commande manuelle `/compact` le respecte lorsqu’il est explicitement défini ; sinon, la compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` préfixe les consignes intégrées de conservation des identifiants opaques pendant le résumé de compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés de sauvegarde. Activé par défaut en mode sauvegarde ; définissez `enabled: false` pour ignorer l’audit.
- `midTurnPrecheck` : vérification facultative de pression de boucle d’outils. Lorsque `enabled: true`, OpenClaw vérifie la pression du contexte après l’ajout des résultats d’outils et avant l’appel suivant au modèle. Si le contexte ne tient plus, il interrompt la tentative en cours avant de soumettre le prompt et réutilise le chemin de récupération de pré-vérification existant pour tronquer les résultats d’outils ou compacter puis réessayer. Fonctionne avec les modes de compaction `default` et `safeguard`. Valeur par défaut : désactivé.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d’AGENTS.md à réinjecter après compaction. La réinjection est désactivée lorsqu’elle n’est pas définie ou vaut `[]`. Définir explicitement `["Session Startup", "Red Lines"]` active cette paire et conserve le repli historique `Every Session`/`Safety`. N’activez ceci que lorsque le contexte supplémentaire vaut le risque de dupliquer les consignes du projet déjà capturées dans le résumé de compaction.
- `model` : `provider/model-id` facultatif ou alias nu provenant de `agents.defaults.models`, uniquement pour le résumé de compaction. Les alias nus sont résolus avant l’envoi ; les identifiants de modèle littéraux configurés conservent la priorité en cas de collision. Utilisez ceci lorsque la session principale doit conserver un modèle, mais que les résumés de compaction doivent s’exécuter sur un autre ; lorsqu’il n’est pas défini, la compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une compaction réussie puisse basculer vers une transcription successeure plus petite. Désactivé lorsqu’il n’est pas défini ou vaut `0`.
- `notifyUser` : lorsque `true`, envoie de brefs avis à l’utilisateur au démarrage et à la fin de la compaction (par exemple, "Compacting context..." et "Compaction complete"). Désactivé par défaut pour que la compaction reste silencieuse.
- `memoryFlush` : tour agentique silencieux avant l’auto-compaction pour stocker des souvenirs durables. Définissez `model` sur un fournisseur/modèle exact, comme `ollama/qwen3:8b`, lorsque ce tour de maintenance doit rester sur un modèle local ; la substitution n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.runRetries`

Limites d’itération des nouvelles tentatives de la boucle d’exécution externe pour le runtime d’agent intégré afin d’éviter les boucles d’exécution infinies pendant la récupération après échec. Notez que ce paramètre ne s’applique actuellement qu’au runtime d’agent intégré, pas aux runtimes ACP ni CLI.

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
- L’élagage réduit d’abord en douceur les résultats d’outils surdimensionnés, puis efface complètement les résultats d’outils plus anciens si nécessaire.
- `softTrimRatio` et `hardClearRatio` acceptent des valeurs de `0.0` à `1.0` ; la validation de configuration rejette les valeurs hors de cette plage.

**Réduction douce** conserve le début + la fin et insère `...` au milieu.

**Effacement complet** remplace tout le résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’image ne sont jamais réduits ni effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des nombres exacts de tokens.
- S’il existe moins de `keepLastAssistants` messages d’assistant, l’élagage est ignoré.

</Accordion>

Voir [Élagage de session](/fr/concepts/session-pruning) pour les détails du comportement.

### Diffusion par blocs

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

- Les canaux autres que Telegram exigent `*.blockStreaming: true` explicite pour activer les réponses par blocs.
- Substitutions par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500 ms. Substitution par agent : `agents.list[].humanDelay`.

Voir [Diffusion](/fr/concepts/streaming) pour les détails de comportement et de segmentation.

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

Isolement facultatif pour l’agent intégré. Voir [Isolement](/fr/gateway/sandboxing) pour le guide complet.

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
- `ssh` : runtime distant générique basé sur SSH
- `openshell` : runtime OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres au runtime se déplacent vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par périmètre
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenu en ligne ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires au runtime
- `strictHostKeyChecking` / `updateHostKeys` : réglages de politique de clé d’hôte OpenSSH

**Priorité de l’authentification SSH :**

- `identityData` l’emporte sur `identityFile`
- `certificateData` l’emporte sur `certificateFile`
- `knownHostsData` l’emporte sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues à partir de l’instantané du runtime de secrets actif avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise l’espace de travail distant une fois après création ou recréation
- conserve ensuite l’espace de travail SSH distant comme référence canonique
- achemine `exec`, les outils de fichiers et les chemins de médias via SSH
- ne synchronise pas automatiquement les modifications distantes vers l’hôte
- ne prend pas en charge les conteneurs de navigateur sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par périmètre sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox à `/workspace`, espace de travail de l’agent monté en lecture seule à `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture à `/workspace`

**Périmètre :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (sans isolation entre sessions)

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

- `mirror` : initialise le distant depuis le local avant l’exécution, resynchronise après l’exécution ; l’espace de travail local reste canonique
- `remote` : initialise le distant une seule fois à la création du bac à sable, puis conserve l’espace de travail distant comme canonique

En mode `remote`, les modifications locales à l’hôte effectuées en dehors d’OpenClaw ne sont pas synchronisées automatiquement dans le bac à sable après l’étape d’initialisation.
Le transport utilise SSH vers le bac à sable OpenShell, mais le plugin possède le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine accessible en écriture et l’utilisateur root.

**Les conteneurs utilisent `network: "none"` par défaut** — définissez-le sur `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut, sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (mesure d’urgence).
Les tours app-server Codex dans un bac à sable OpenClaw actif utilisent ce même paramètre de sortie pour leur accès réseau natif en mode code.

**Les pièces jointes entrantes** sont préparées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans l’invite système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise l’authentification VNC par défaut et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez-le sur `bridge` uniquement lorsque vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` restreint facultativement l’entrée CDP à la bordure du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du navigateur en bac à sable. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut correspondent à la base de l’image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

La mise en bac à sable du navigateur et `sandbox.docker.binds` fonctionnent uniquement avec Docker.

Construire les images (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Pour les installations npm sans checkout source, consultez [Mise en bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

### `agents.list` (remplacements par agent)

Utilisez `agents.list[].tts` pour donner à un agent son propre fournisseur TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc de l’agent effectue une fusion profonde par-dessus
`messages.tts`, afin que les identifiants partagés puissent rester au même endroit tandis que les agents
individuels ne remplacent que les champs de voix ou de fournisseur dont ils ont besoin. Le remplacement de l’agent actif
s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et à
l’outil d’agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
pour des exemples de fournisseurs et l’ordre de précédence.

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
- `default` : lorsque plusieurs sont définis, le premier l’emporte (avertissement journalisé). Si aucun n’est défini, la première entrée de la liste est utilisée par défaut.
- `model` : la forme chaîne définit un primaire strict par agent sans repli de modèle ; la forme objet `{ primary }` est également stricte sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour inscrire cet agent au repli, ou `{ primary, fallbacks: [] }` pour rendre le comportement strict explicite. Les tâches Cron qui remplacent uniquement `primary` héritent toujours des replis par défaut, sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez-les pour les remplacements propres à un agent, comme `cacheRetention`, `temperature` ou `maxTokens`, sans dupliquer tout le catalogue de modèles.
- `tts` : remplacements facultatifs de synthèse vocale par agent. Le bloc effectue une fusion profonde par-dessus `messages.tts`, donc conservez les identifiants de fournisseur partagés et la politique de repli dans `messages.tts`, puis définissez ici uniquement les valeurs propres à la persona, comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d’autorisation de Skills facultative par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsque défini ; une liste explicite remplace les valeurs par défaut au lieu de les fusionner, et `[]` signifie aucune Skills.
- `thinkingDefault` : niveau de pensée par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil de fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la pensée dynamique possédée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`"auto" | true | false`). S’applique lorsqu’aucun remplacement du mode rapide par message ou par session n’est défini.
- `models` : catalogue de modèles/remplacements d’exécution facultatifs par agent, indexés par les identifiants complets `provider/model`. Utilisez `models["provider/model"].agentRuntime` pour les exceptions d’exécution par agent.
- `runtime` : descripteur d’exécution facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- Les fichiers image `identity.avatar` locaux relatifs à l’espace de travail sont limités à 2 Mo. Les URL `http(s)` et les URI `data:` ne sont pas vérifiées avec la limite de taille de fichier locale.
- `identity` dérive les valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des identifiants d’agents configurés pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = toute cible configurée ; par défaut : même agent uniquement). Incluez l’identifiant du demandeur lorsque les appels `agentId` ciblant lui-même doivent être autorisés. Les entrées obsolètes dont la configuration d’agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer, ou ajoutez une entrée minimale `agents.list[]` si cette cible doit rester lançable tout en héritant des valeurs par défaut.
- Garde d’héritage du bac à sable : si la session demandeuse est en bac à sable, `sessions_spawn` rejette les cibles qui s’exécuteraient sans bac à sable.
- `subagents.requireAgentId` : lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite du profil ; par défaut : faux).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans un seul Gateway. Consultez [Multi-Agent](/fr/concepts/multi-agent).

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
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; propre au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans peer/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité de conversation exacte (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre des niveaux de liaison de route ci-dessus.

### Profils d’accès par agent

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

Consultez [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour les détails de précédence.

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
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est prévu).
- **`dmScope`** : mode de regroupement des messages directs.
  - `main` : tous les messages directs partagent la session principale.
  - `per-peer` : isole par identifiant d’expéditeur sur l’ensemble des canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour les configurations multicomptes).
- **`identityLinks`** : associe des identifiants canoniques à des pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes Dock comme `/dock_discord` utilisent la même association pour basculer la route de réponse de la session active vers un autre pair de canal lié ; consultez [Ancrage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, la première expiration l’emporte. La fraîcheur de réinitialisation quotidienne utilise le champ `sessionStartedAt` de la ligne de session ; la fraîcheur de réinitialisation pour inactivité utilise `lastInteractionAt`. Les écritures en arrière-plan ou liées à des événements système, comme Heartbeat, les réveils cron, les notifications exec et la comptabilité du Gateway, peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas les sessions quotidiennes ou inactives à jour.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`mainKey`** : champ hérité. Le runtime utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents pendant les échanges agent à agent (entier, plage : `0`-`20`, valeur par défaut : `5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’alias hérité `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage et de conservation du magasin de sessions.
  - `mode` : `enforce` applique le nettoyage et constitue la valeur par défaut ; `warn` émet uniquement des avertissements.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`). Le runtime écrit le nettoyage par lots avec un petit tampon de seuil haut pour les limites de taille de production ; `openclaw sessions cleanup --enforce` applique immédiatement la limite.
  - Les sessions de sondage de courte durée des exécutions de modèle du Gateway utilisent une conservation fixe de `24h`, mais le nettoyage est déclenché par la pression : il supprime uniquement les lignes obsolètes de sondage strict d’exécution de modèle lorsque la pression de maintenance ou de limite des entrées de session est atteinte. Seules les clés de sondage explicites strictes correspondant à `agent:*:explicit:model-run-<uuid>` sont éligibles ; les sessions normales directes, de groupe, de fil, cron, hook, Heartbeat, ACP et de sous-agent n’héritent pas de cette conservation de 24 h. Lorsque le nettoyage d’exécution de modèle s’exécute, il se lance avant le nettoyage plus large des entrées obsolètes `pruneAfter` et la limite `maxEntries`.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : conservation des archives de transcript `*.reset.<timestamp>`. Par défaut, utilise `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il consigne des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut, `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liées aux fils.
  - `enabled` : commutateur par défaut principal (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : délai d’inactivité par défaut avant désactivation automatique du focus, en heures (`0` désactive ; les fournisseurs peuvent le remplacer)
  - `maxAgeHours` : âge maximal strict par défaut, en heures (`0` désactive ; les fournisseurs peuvent le remplacer)
  - `spawnSessions` : garde par défaut pour créer des sessions de travail liées aux fils depuis `sessions_spawn` et les créations de fils ACP. Par défaut à `true` lorsque les liaisons de fils sont activées ; les fournisseurs/comptes peuvent le remplacer.
  - `defaultSpawnContext` : contexte de sous-agent natif par défaut pour les créations liées aux fils (`"fork"` ou `"isolated"`). Par défaut à `"fork"`.

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

| Variable          | Description            | Exemple                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nom court du modèle    | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur     | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel | `high`, `low`, `off`        |
| `{identity.name}` | Nom de l’identité de l’agent | (identique à `"auto"`)      |

Les variables ne tiennent pas compte de la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé après la réponse sur les canaux compatibles avec les réactions, comme Slack, Discord, Telegram, WhatsApp et iMessage.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord, Telegram et WhatsApp.
  Sur Slack et Discord, une valeur non définie conserve les réactions d’état activées lorsque les réactions d’accusé sont actives.
  Sur Telegram et WhatsApp, définissez-la explicitement sur `true` pour activer les réactions d’état du cycle de vie.
- `messages.statusReactions.emojis` : remplace les clés d’emoji du cycle de vie :
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` et `stallHard`.
  Telegram n’autorise qu’un ensemble fixe de réactions ; les emoji configurés non pris en charge se replient donc
  sur la variante d’état prise en charge la plus proche pour cette discussion.

### Anti-rebond entrant

Regroupe les messages rapides contenant uniquement du texte du même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent un envoi immédiat. Les commandes de contrôle contournent l’anti-rebond.

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
- Les clés d’API se replient sur `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs de synthèse vocale groupés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation du modèle et de la voix.

---

## Talk

Valeurs par défaut du mode Talk (macOS/iOS/Android).

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
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existent uniquement pour la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers `talk.providers.<provider>`.
- Les identifiants de voix se replient sur `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte les chaînes en texte clair ou les objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` ne s’applique que lorsqu’aucune clé d’API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. S’il est omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX macOS passe par l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur le `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `consultThinkingLevel` contrôle le niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels `openclaw_agent_consult` realtime Talk de Control UI. Laissez-le non défini pour préserver le comportement normal de session/modèle.
- `consultFastMode` définit un remplacement ponctuel du mode rapide pour les consultations realtime Talk de Control UI sans modifier le réglage normal du mode rapide de la session.
- `speechLocale` définit l’identifiant de langue BCP 47 utilisé par la reconnaissance vocale Talk iOS/macOS. Laissez-le non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle combien de temps le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Non défini, il conserve la fenêtre de pause par défaut de la plateforme (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` ajoute des instructions système destinées au fournisseur au prompt realtime intégré d’OpenClaw, afin que le style vocal puisse être configuré sans perdre les consignes `openclaw_agent_consult` par défaut.
- `realtime.consultRouting` contrôle le repli du relais Gateway lorsque le fournisseur realtime produit une transcription utilisateur finale sans `openclaw_agent_consult` : `provider-direct` préserve les réponses directes du fournisseur, tandis que `force-agent-consult` achemine la demande finalisée via OpenClaw.

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
