---
read_when:
    - Ajustement des paramètres par défaut de l’agent (modèles, réflexion, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage et des liaisons multi-agents
    - Ajustement du comportement des sessions, de la distribution des messages et du mode conversationnel
summary: Valeurs par défaut de l’agent, routage multi-agent, session, messages et configuration de la parole
title: Configuration — agents
x-i18n:
    generated_at: "2026-07-16T13:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, l’environnement d’exécution du Gateway et les autres
clés de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

### `agents.defaults.workspace`

Valeur par défaut : `OPENCLAW_WORKSPACE_DIR` lorsqu’elle est définie, sinon `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` lorsque `OPENCLAW_PROFILE` est défini sur un profil autre que celui par défaut).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Une valeur explicite de `agents.defaults.workspace` prévaut sur
`OPENCLAW_WORKSPACE_DIR`. Utilisez la variable d’environnement pour faire pointer les agents par défaut
vers un espace de travail monté lorsque vous ne souhaitez pas inscrire ce chemin dans la configuration.

### `agents.defaults.repoRoot`

Racine facultative du dépôt affichée sur la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Liste d’autorisation facultative de Skills par défaut pour les agents qui ne définissent pas
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

- Omettez `agents.defaults.skills` pour autoriser toutes les Skills par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune Skills.
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

Ignore la création de certains fichiers facultatifs de l’espace de travail tout en continuant à écrire les fichiers d’amorçage requis (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valeurs valides : `SOUL.md`, `USER.md`, `HEARTBEAT.md` et `IDENTITY.md`.

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

Contrôle le moment où les fichiers d’amorçage de l’espace de travail sont injectés dans le prompt système. Valeur par défaut : `"always"`.

- `"continuation-skip"` : lors des tours de continuation sûrs (après une réponse terminée de l’assistant), la réinjection de l’amorçage de l’espace de travail est ignorée, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive l’injection des fichiers d’amorçage et de contexte de l’espace de travail à chaque tour. Utilisez cette option uniquement pour les agents qui gèrent intégralement le cycle de vie de leur prompt (moteurs de contexte personnalisés, environnements d’exécution natifs qui construisent leur propre contexte ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

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

Nombre total maximal de caractères injectés pour l’ensemble des fichiers d’amorçage de l’espace de travail. Valeur par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Remplacement par agent : `agents.list[].bootstrapTotalMaxChars`. Les valeurs omises
héritent de `agents.defaults.bootstrapTotalMaxChars`.

### Remplacements du profil d’amorçage par agent

Utilisez des remplacements du profil d’amorçage par agent lorsqu’un agent nécessite un comportement
d’injection du prompt différent des valeurs par défaut partagées. Les champs omis héritent de
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

- `"off"` : n’injecte jamais de texte d’avertissement de troncature dans le prompt système.
- `"once"` : injecte une seule fois un avis concis pour chaque signature de troncature unique.
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe (recommandé).

Les décomptes bruts/injectés détaillés et les champs de réglage de la configuration restent dans les diagnostics tels
que les rapports de contexte/d’état et les journaux ; le contexte utilisateur/d’exécution WebChat courant ne
reçoit que l’avis concis de récupération.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw comporte plusieurs budgets à volume élevé pour les prompts et le contexte, qui sont
intentionnellement répartis par sous-système plutôt que de tous passer par un unique
paramètre générique.

| Budget                                                         | Couvre                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Injection normale de l’amorçage de l’espace de travail                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Préambule ponctuel d’exécution du modèle lors d’une réinitialisation ou d’un démarrage, y compris les fichiers quotidiens récents `memory/*.md`. Les commandes de chat seules `/new` et `/reset` sont confirmées sans invoquer le modèle |
| `skills.limits.*`                                              | Liste compacte des Skills injectée dans le prompt système                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Extraits bornés de l’environnement d’exécution et blocs injectés appartenant à celui-ci                                                                                                      |
| `memory.qmd.limits.*`                                          | Dimensionnement de l’extrait indexé de recherche en mémoire et de son injection                                                                                                              |

Remplacements correspondants par agent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage injecté au premier tour lors des exécutions du modèle après une réinitialisation ou un démarrage.
Les commandes de chat seules `/new` et `/reset` confirment la réinitialisation sans invoquer
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

Valeurs par défaut partagées pour les surfaces bornées du contexte d’exécution.

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

- `memoryGetMaxChars` : limite par défaut de l’extrait `memory_get` avant l’ajout des métadonnées
  de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond avancé des résultats d’outils en direct, utilisé pour les résultats
  persistants et la récupération après dépassement. Laissez-le non défini pour utiliser la limite automatique du contexte du modèle :
  `16000` caractères en dessous de 100K jetons, `32000` caractères à partir de 100K jetons et `64000`
  caractères à partir de 200K jetons. Les valeurs explicites jusqu’à `1000000` sont acceptées pour
  les modèles à contexte long, mais la limite effective reste limitée à environ 30 % de
  la fenêtre de contexte du modèle. `openclaw doctor --deep` affiche la limite effective,
  et doctor n’émet un avertissement que lorsqu’un remplacement explicite est obsolète ou sans effet.
- `postCompactionMaxChars` : limite de l’extrait AGENTS.md utilisé lors de l’injection
  d’actualisation après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent des paramètres partagés `contextLimits`. Les champs omis héritent
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
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

Limite globale de la liste compacte des Skills injectée dans le prompt système. Cela
n’affecte pas la lecture à la demande des fichiers `SKILL.md`.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Remplacement par agent du budget du prompt des Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Taille maximale en pixels du côté le plus long de l’image dans les blocs d’images de transcription/d’outils avant les appels au fournisseur.
Valeur par défaut : `1200`.

Des valeurs plus faibles réduisent généralement l’utilisation de jetons de vision et la taille des charges utiles de requête pour les exécutions comportant de nombreuses captures d’écran.
Des valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Préférence de compression et de niveau de détail de l’outil d’image pour les images chargées depuis des chemins de fichiers, des URL et des références de médias.
Valeur par défaut : `auto`.

OpenClaw adapte l’échelle de redimensionnement au modèle d’image sélectionné. Par exemple, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL et les modèles de vision Llama 4 hébergés peuvent utiliser des images plus grandes que les anciens chemins de vision ou ceux à haut niveau de détail par défaut, tandis que les tours comportant plusieurs images sont compressés plus fortement en mode `auto` afin de maîtriser le coût en jetons et la latence.

Valeurs :

- `auto` : s’adapte aux limites du modèle et au nombre d’images.
- `efficient` : privilégie des images plus petites pour réduire l’utilisation de jetons et d’octets.
- `balanced` : utilise l’échelle intermédiaire standard.
- `high` : préserve davantage de détails pour les captures d’écran, les diagrammes et les images de documents.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire du contexte du prompt système (et non des horodatages des messages). Utilise par défaut le fuseau horaire de l’hôte.

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // paramètres globaux par défaut du fournisseur
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
      maxConcurrent: 4,
    },
  },
}
```

- `model` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - La forme chaîne définit uniquement le modèle principal.
  - La forme objet définit le modèle principal ainsi que les modèles de basculement ordonnés.
- `utilityModel` : référence ou alias `provider/model` facultatif pour les tâches internes courtes. Il est actuellement utilisé pour générer les titres de session de l’interface Control UI, les titres des sujets de messages privés Telegram, les titres des fils de discussion automatiques Discord et la [narration des brouillons de progression](/fr/concepts/progress-drafts#narrated-status). Lorsqu’il n’est pas défini, OpenClaw utilise la valeur par défaut déclarée par le fournisseur principal pour les petits modèles lorsqu’elle existe (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) ; sinon, les tâches de génération de titres utilisent le modèle principal de l’agent, tandis que la narration reste désactivée. Définissez `utilityModel: ""` pour désactiver entièrement le routage des tâches utilitaires. `agents.list[].utilityModel` remplace la valeur par défaut (une valeur vide propre à l’agent le désactive pour cet agent), et un remplacement de modèle propre à l’opération prévaut sur les deux. Les tâches utilitaires effectuent des appels de modèle distincts et envoient au fournisseur du modèle sélectionné le contenu propre à la tâche. La génération des titres du tableau de bord envoie au maximum les 1 000 premiers caractères du premier message qui n’est pas une commande ; la narration envoie la requête entrante ainsi que des résumés d’outils compacts et expurgés. Choisissez un fournisseur qui répond à vos exigences de coût et de traitement des données.
- `imageModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin de l’outil `image` comme configuration de modèle de vision lorsque le modèle actif ne peut pas accepter d’images. Les modèles dotés nativement de capacités de vision reçoivent directement les octets des images chargées.
  - Également utilisé comme routage de secours lorsque le modèle sélectionné ou par défaut ne peut pas accepter d’images en entrée.
  - Privilégiez les références `provider/model` explicites. Les identifiants seuls sont acceptés à des fins de compatibilité ; si un identifiant seul correspond de manière unique à une entrée configurée prenant en charge les images dans `models.providers.*.models`, OpenClaw lui ajoute le fournisseur correspondant. Les correspondances configurées ambiguës nécessitent un préfixe de fournisseur explicite.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la fonctionnalité partagée de génération d’images et par toute future surface d’outil ou de Plugin générant des images.
  - Valeurs courantes : `google/gemini-3.1-flash-image-preview` pour la génération d’images native de Gemini, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images ou `openai/gpt-image-1.5` pour une sortie OpenAI PNG/WebP avec arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez également l’authentification correspondante du fournisseur (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OAuth OpenAI Codex pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - En cas d’omission, `image_generate` peut toujours déduire une valeur par défaut de fournisseur disposant d’une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés, dans l’ordre de leur identifiant.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la fonctionnalité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs courantes : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - En cas d’omission, `music_generate` peut toujours déduire une valeur par défaut de fournisseur disposant d’une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés, dans l’ordre de leur identifiant.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez également l’authentification ou la clé d’API correspondante du fournisseur.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la fonctionnalité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs courantes : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - En cas d’omission, `video_generate` peut toujours déduire une valeur par défaut de fournisseur disposant d’une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés, dans l’ordre de leur identifiant.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez également l’authentification ou la clé d’API correspondante du fournisseur.
  - Le Plugin officiel de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage des modèles.
  - En cas d’omission, l’outil PDF utilise `imageModel` comme solution de secours, puis le modèle résolu de la session ou le modèle par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut de l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis lors de l’appel.
- `pdfMaxPages` : nombre maximal de pages prises en compte par défaut par le mode d’extraction de secours de l’outil `pdf`.
- `verboseDefault` : niveau de verbosité par défaut des agents. Valeurs : `"off"`, `"on"`, `"full"`. Valeur par défaut : `"off"`.
- `toolProgressDetail` : mode de détail pour les résumés de l’outil `/verbose` et les lignes d’outils des brouillons de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande ou les détails bruts lorsqu’ils sont disponibles). La valeur `agents.list[].toolProgressDetail` propre à l’agent remplace cette valeur par défaut.
- `reasoningDefault` : visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. La valeur `agents.list[].reasoningDefault` propre à l’agent remplace cette valeur par défaut. Les valeurs par défaut de raisonnement configurées ne sont appliquées qu’aux propriétaires, aux expéditeurs autorisés ou aux contextes Gateway d’administrateur opérateur lorsqu’aucun remplacement du raisonnement par message ou par session n’est défini.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Valeur par défaut : `"on"`.
- `model.primary` : format `provider/model` (par exemple `openai/gpt-5.6-sol` pour l’accès OAuth Codex). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique parmi les fournisseurs configurés pour cet identifiant de modèle exact, et utilise seulement ensuite le fournisseur par défaut configuré comme solution de secours (comportement de compatibilité obsolète ; privilégiez donc une valeur `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw utilise à la place le premier fournisseur/modèle configuré plutôt que de signaler une valeur par défaut obsolète correspondant à un fournisseur supprimé.
- `models` : catalogue de modèles et liste d’autorisation configurés pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (propre au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routage OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilisez des entrées `provider/*` telles que `"openai/*": {}` ou `"vllm/*": {}` pour afficher tous les modèles découverts des fournisseurs sélectionnés sans répertorier manuellement chaque identifiant de modèle.
  - Ajoutez `agentRuntime` à une entrée `provider/*` lorsque tous les modèles découverts dynamiquement pour ce fournisseur doivent utiliser le même environnement d’exécution. La politique d’environnement d’exécution `provider/model` exacte reste prioritaire sur le caractère générique.
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation, sauf si vous transmettez `--replace`.
  - Les flux de configuration et d’intégration propres à un fournisseur fusionnent les modèles du fournisseur sélectionné dans cette table et conservent les autres fournisseurs déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour cesser d’injecter `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Consultez [Compaction côté serveur d’OpenAI](/fr/providers/openai#advanced-configuration).
- `params` : paramètres globaux par défaut du fournisseur appliqués à tous les modèles. À définir dans `agents.defaults.params` (par exemple `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace les valeurs par clé. Consultez [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `models.providers.openrouter.params.provider` : politique globale par défaut de routage des fournisseurs pour OpenRouter. OpenClaw la transmet à l’objet `provider` de la requête OpenRouter ; les valeurs `agents.defaults.models["openrouter/<model>"].params.provider` propres au modèle et les paramètres de l’agent les remplacent par clé. Consultez [Routage des fournisseurs OpenRouter](/fr/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody` : JSON avancé transmis tel quel et fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles avec OpenAI. En cas de conflit avec les clés de requête générées, le corps supplémentaire prévaut ; les routes de complétion non natives suppriment tout de même ensuite la valeur `store` propre à OpenAI.
- `params.chat_template_kwargs` : arguments de modèle de discussion compatibles avec vLLM/OpenAI, fusionnés dans les corps de requête `api: "openai-completions"` de premier niveau. Pour `vllm/nemotron-3-*` lorsque la réflexion est désactivée, le Plugin vLLM intégré envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les valeurs `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` conserve la priorité finale. Les modèles de réflexion Qwen et Nemotron configurés avec vLLM proposent des choix `/think` binaires (`off`, `on`) au lieu de l’échelle d’effort à plusieurs niveaux.
- `compat.thinkingFormat` : style de charge utile de réflexion compatible avec OpenAI. Utilisez `"together"` pour `reasoning.enabled` au format Together, `"qwen"` pour `enable_thinking` de premier niveau au format Qwen, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les moteurs de la famille Qwen prenant en charge les arguments nommés de modèle de discussion au niveau de la requête, tels que vLLM. OpenClaw associe la réflexion désactivée à `false` et la réflexion activée à `true`, et les modèles Qwen configurés avec vLLM proposent des choix `/think` binaires pour ces formats.
- `compat.supportedReasoningEfforts` : liste des niveaux d’effort de raisonnement compatibles avec OpenAI, propre à chaque modèle. Incluez `"xhigh"` pour les points de terminaison personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session du Gateway, la validation des modifications de session, la validation de la CLI de l’agent et la validation de `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le moteur attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking` : option d’activation propre à Z.AI pour conserver la réflexion. Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue les valeurs `reasoning_content` antérieures ; consultez [Réflexion et conservation de la réflexion avec Z.AI](/fr/providers/zai#advanced-configuration).
- `localService` : gestionnaire de processus facultatif au niveau du fournisseur pour les serveurs de modèles locaux ou auto-hébergés. Lorsque le modèle sélectionné appartient à ce fournisseur, OpenClaw sonde `healthUrl` (ou `baseUrl + "/models"`), démarre `command` avec `args` si le point de terminaison est indisponible, attend jusqu’à `readyTimeoutMs`, puis envoie la requête au modèle. `command` doit être un chemin absolu. `idleStopMs: 0` maintient le processus en cours d’exécution jusqu’à l’arrêt d’OpenClaw ; une valeur positive arrête le processus lancé par OpenClaw après ce nombre de millisecondes d’inactivité. Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- La politique d’exécution doit être définie sur les fournisseurs ou les modèles, et non sur `agents.defaults`. Utilisez `models.providers.<provider>.agentRuntime` pour les règles à l’échelle du fournisseur ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` pour les règles propres à un modèle. Un préfixe de fournisseur/modèle ne sélectionne jamais à lui seul un environnement d’exécution. Lorsque le runtime n’est pas défini ou vaut `auto`, OpenAI ne peut sélectionner implicitement Codex que pour une route HTTPS officielle exacte de Platform Responses ou ChatGPT Responses, sans remplacement explicite dans la requête. Consultez [le runtime d’agent implicite d’OpenAI](/fr/providers/openai#implicit-agent-runtime).
- Les outils d’écriture de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout ou de suppression de solutions de repli) enregistrent la forme objet canonique et conservent, si possible, les listes de solutions de repli existantes.
- `maxConcurrent` : nombre maximal d’exécutions d’agents en parallèle entre les sessions (chaque session restant sérialisée). Valeur par défaut : `4`.

### Politique d’exécution

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
      model: "openai/gpt-5.6-sol",
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

- `id` : `"auto"`, `"openclaw"`, l’identifiant d’un environnement Plugin enregistré ou un alias de backend CLI pris en charge. Le Plugin Codex intégré enregistre `codex` ; le Plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `id: "auto"` permet aux environnements Plugin enregistrés de prendre en charge les routes effectives qui déclarent ou satisfont autrement leur contrat de prise en charge, et utilise OpenClaw lorsqu’aucun environnement ne correspond. Une exécution Plugin explicite telle que `id: "codex"` exige cet environnement ainsi qu’une route effective compatible ; elle échoue de manière fermée si l’un des deux est indisponible ou si l’exécution échoue.
- `id: "pi"` est accepté uniquement comme alias obsolète de `openclaw` afin de préserver les configurations publiées avec la version v2026.5.22 ou une version antérieure. Les nouvelles configurations doivent utiliser `openclaw`.
- L’ordre de priorité de l’exécution est d’abord la politique du modèle exact (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`), puis `agents.list[]` / `agents.defaults.models["provider/*"]`, et enfin la politique globale du fournisseur dans `models.providers.<provider>.agentRuntime`.
- Les clés d’exécution applicables à l’ensemble de l’agent sont obsolètes. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, les épinglages d’exécution de session et `OPENCLAW_AGENT_RUNTIME` sont ignorés lors de la sélection de l’exécution. Exécutez `openclaw doctor --fix` pour supprimer les valeurs obsolètes.
- Les routes HTTPS officielles OpenAI Responses/ChatGPT exactes et admissibles qui ne comportent aucune substitution de requête définie peuvent utiliser implicitement l’environnement Codex. Le paramètre de fournisseur/modèle `agentRuntime.id: "codex"` fait de Codex une exigence à échec fermé, mais ne rend pas compatible une route incompatible.
- Pour les déploiements Claude CLI, privilégiez `model: "anthropic/claude-opus-4-8"` avec `agentRuntime.id: "claude-cli"` limité au modèle. Les références `claude-cli/<model>` héritées fonctionnent toujours à des fins de compatibilité, mais les nouvelles configurations doivent conserver une sélection canonique du fournisseur et du modèle, et placer le backend d’exécution dans la politique d’exécution du fournisseur ou du modèle.
- Cela contrôle uniquement l’exécution des tours d’agent textuels. La génération de médias, la vision, les PDF, la musique, la vidéo et la synthèse vocale utilisent toujours leurs paramètres de fournisseur et de modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle figure dans `agents.defaults.models`) :

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
Les modèles Z.AI activent `tool_stream` par défaut pour la diffusion en continu des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour la désactiver.
Anthropic Claude Opus 4.8 conserve la réflexion désactivée par défaut dans OpenClaw ; lorsque la réflexion adaptative est explicitement activée, la valeur d’effort par défaut propre au fournisseur Anthropic est `high`. Les modèles Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours en mode texte uniquement (sans appel d’outil). Utiles comme solution de repli en cas d’échec des fournisseurs d’API.

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
          // Ou utilisez systemPromptFileArg lorsque la CLI accepte une option de fichier d’invite.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Les backends CLI sont principalement textuels ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- La transmission directe des images est prise en charge lorsque `imageArg` accepte les chemins de fichiers.
- `reseedFromRawTranscriptWhenUncompacted: true` permet à un backend de récupérer des sessions invalidées en toute sécurité à partir d’une fin bornée de transcription OpenClaw brute avant la création du premier résumé de Compaction. Les changements de profil d’authentification ou d’époque des identifiants ne réamorcent toujours jamais une session à partir des données brutes.

### `agents.defaults.promptOverlays`

Surcouches d’invite indépendantes du fournisseur, appliquées par famille de modèles aux surfaces d’invite assemblées par OpenClaw. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé sur les routes OpenClaw/fournisseur ; `personality` contrôle uniquement la couche de style d’interaction conviviale. Les routes natives du serveur d’application Codex conservent les instructions de base et de modèle propres à Codex au lieu de cette surcouche GPT-5 d’OpenClaw, et OpenClaw désactive la personnalité intégrée de Codex pour les fils natifs.

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

- `"friendly"` (valeur par défaut) et `"on"` activent la couche de style d’interaction conviviale.
- `"off"` désactive uniquement la couche conviviale ; le contrat de comportement GPT-5 balisé reste activé.
- L’ancien paramètre `plugins.entries.openai.config.personality` est toujours lu lorsque ce paramètre partagé n’est pas défini.

### `agents.defaults.heartbeat`

Exécutions périodiques de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m désactive
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // valeur par défaut : true ; false omet la section Heartbeat de l’invite système
        lightContext: false, // valeur par défaut : false ; true conserve uniquement HEARTBEAT.md parmi les fichiers d’amorçage de l’espace de travail
        isolatedSession: false, // valeur par défaut : false ; true exécute chaque Heartbeat dans une nouvelle session (sans historique de conversation)
        skipWhenBusy: false, // valeur par défaut : false ; true attend également les voies de sous-agent/imbriquées de cet agent
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (valeur par défaut) | block
        target: "none", // valeur par défaut : none | options : last | whatsapp | telegram | discord | ...
        prompt: "Lisez HEARTBEAT.md s’il existe...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every` : chaîne de durée (ms/s/m/h). Valeur par défaut : `30m` (authentification par clé d’API) ou `1h` (authentification OAuth). Définissez-la sur `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque la valeur est false, omet la section Heartbeat de l’invite système et ignore l’injection de `HEARTBEAT.md` dans le contexte d’amorçage. Valeur par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque la valeur est true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions de Heartbeat.
- `timeoutSeconds` : durée maximale en secondes autorisée pour un tour d’agent Heartbeat avant son abandon. Laissez ce paramètre non défini pour utiliser `agents.defaults.timeoutSeconds` lorsqu’il est défini ; sinon, la cadence de Heartbeat est plafonnée à 600 secondes.
- `directPolicy` : politique de livraison directe/par message privé. `allow` (valeur par défaut) autorise la livraison à une cible directe. `block` supprime la livraison à une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque la valeur est true, les exécutions de Heartbeat utilisent un contexte d’amorçage allégé et conservent uniquement `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsque la valeur est true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Même modèle d’isolation que Cron `sessionTarget: "isolated"`. Réduit le coût en jetons par Heartbeat d’environ 100K à environ 2-5K jetons.
- `skipWhenBusy` : lorsque la valeur est true, les exécutions de Heartbeat sont différées sur les voies occupées supplémentaires de cet agent : les tâches de sous-agent indexées par sa propre clé de session ou les commandes imbriquées. Les voies Cron diffèrent toujours les Heartbeats, même sans cet indicateur.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- Les Heartbeats exécutent des tours d’agent complets — des intervalles plus courts consomment davantage de jetons.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // identifiant d’un Plugin fournisseur de Compaction enregistré (facultatif)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conservez exactement les identifiants de déploiement, les identifiants de ticket et les paires hôte:port.", // utilisé lorsque identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // vérification facultative de la pression dans la boucle d’outils
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // active la réinjection des sections d’AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // substitution facultative du modèle réservé à la Compaction
        truncateAfterCompaction: true, // fait pivoter vers un fichier JSONL successeur plus petit après la Compaction
        maxActiveTranscriptBytes: "20mb", // déclencheur local facultatif de Compaction préalable
        notifyUser: true, // notifications au démarrage/à la fin de la Compaction et en cas de dégradation du vidage de la mémoire (valeur par défaut : false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // substitution facultative du modèle réservé au vidage de la mémoire
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "La session approche de la Compaction. Stockez maintenant les souvenirs durables.",
          prompt: "Écrivez toute note durable dans memory/YYYY-MM-DD.md ; répondez avec le jeton silencieux exact NO_REPLY s’il n’y a rien à stocker.",
        },
      },
    },
  },
}
```

- `mode` : `default` ou `safeguard` (résumé par blocs pour les historiques longs). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d'un Plugin fournisseur de Compaction enregistré. Lorsqu'il est défini, la fonction `summarize()` du fournisseur est appelée à la place du résumé intégré par LLM. En cas d'échec, le résumé intégré est utilisé. La définition d'un fournisseur impose `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une seule opération de Compaction avant son interruption par OpenClaw. Valeur par défaut : `180`.
- `reserveTokens` : marge de jetons maintenue disponible pour la sortie du modèle et les futurs résultats d'outils après la Compaction. Lorsque la fenêtre de contexte du modèle est connue, OpenClaw plafonne la réserve effective afin qu'elle ne puisse pas consommer le budget de l'invite.
- `reserveTokensFloor` : réserve minimale imposée par l'environnement d'exécution intégré. Définissez `0` pour désactiver ce seuil minimal. Celui-ci reste soumis au plafond de la fenêtre de contexte active.
- `keepRecentTokens` : budget du point de coupure de l'agent pour conserver textuellement la partie la plus récente de la transcription. La commande manuelle `/compact` respecte cette valeur lorsqu'elle est explicitement définie ; sinon, la Compaction manuelle constitue un point de contrôle strict.
- `recentTurnsPreserve` : nombre de tours utilisateur/assistant les plus récents conservés textuellement en dehors du résumé de protection. Valeur par défaut : `3`.
- `maxHistoryShare` : fraction maximale du budget de contexte total autorisée pour l'historique conservé après la Compaction (plage `0.1`-`0.9`).
- `identifierPolicy` : `strict` (valeur par défaut), `off` ou `custom`. `strict` ajoute au début les instructions intégrées de conservation des identifiants opaques pendant le résumé de Compaction.
- `identifierInstructions` : texte personnalisé facultatif de conservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés de protection. Activées par défaut en mode de protection ; définissez `enabled: false` pour ignorer l'audit.
- `midTurnPrecheck` : vérification facultative de la pression exercée par la boucle d'outils. Lorsque `enabled: true`, OpenClaw vérifie la pression du contexte après l'ajout des résultats d'outils et avant l'appel suivant du modèle. Si le contexte ne tient plus, il interrompt la tentative en cours avant d'envoyer l'invite et réutilise le chemin de récupération existant de la vérification préalable afin de tronquer les résultats d'outils ou d'effectuer une Compaction puis de réessayer. Fonctionne avec les modes de Compaction `default` et `safeguard`. Valeur par défaut : désactivée.
- `postIndexSync` : mode de réindexation de la mémoire de session après la Compaction. Valeur par défaut : `"async"`. Utilisez `"await"` pour une actualité maximale, `"async"` pour réduire la latence de la Compaction, ou `"off"` uniquement lorsque la synchronisation de la mémoire de session est gérée ailleurs.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d'AGENTS.md à réinjecter après la Compaction. La réinjection est désactivée lorsque cette option n'est pas définie ou vaut `[]`. Définir explicitement `["Session Startup", "Red Lines"]` active cette paire et conserve le mécanisme de repli historique `Every Session`/`Safety`. N'activez cette option que si le contexte supplémentaire justifie le risque de dupliquer des consignes de projet déjà incluses dans le résumé de Compaction.
- `model` : `provider/model-id` facultatif ou alias simple provenant de `agents.defaults.models`, réservé au résumé de Compaction. Les alias simples sont résolus avant l'envoi ; les identifiants de modèle littéraux configurés restent prioritaires en cas de collision. Utilisez cette option lorsque la session principale doit conserver un modèle, mais que les résumés de Compaction doivent être exécutés sur un autre ; lorsqu'elle n'est pas définie, la Compaction utilise le modèle principal de la session.
- `truncateAfterCompaction` : effectue une rotation de la transcription de la session active après la Compaction afin que les tours suivants ne chargent que le résumé et la partie non résumée, tandis que la transcription complète précédente reste archivée. Empêche la croissance illimitée de la transcription active dans les sessions de longue durée. Valeur par défaut : `false`.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une Compaction locale normale avant une exécution lorsque l'historique de transcription dépasse ce seuil. Nécessite `truncateAfterCompaction` afin qu'une Compaction réussie puisse effectuer une rotation vers une transcription suivante plus petite. Désactivé lorsque cette option n'est pas définie ou vaut `0`.
- `notifyUser` : lorsque `true`, envoie à l'utilisateur de brèves notifications de maintenance du contexte : au début et à la fin de la Compaction (par exemple, « Compaction du contexte... » et « Compaction terminée »), et lorsque le vidage de la mémoire précédant la Compaction est épuisé, de sorte que la réponse se poursuit dans un état dégradé (par exemple, « La maintenance de la mémoire a temporairement échoué ; poursuite de votre réponse. »). Désactivé par défaut afin que ces notifications restent silencieuses.
- `memoryFlush` : tour agentique silencieux avant la Compaction automatique pour stocker les souvenirs durables. Définissez `model` sur un fournisseur/modèle exact tel que `ollama/qwen3:8b` lorsque ce tour de maintenance doit rester sur un modèle local ; la substitution n'hérite pas de la chaîne de repli de la session active. `forceFlushTranscriptBytes` impose le vidage lorsque la taille de la transcription atteint le seuil, même si les compteurs de jetons sont obsolètes. Ignoré lorsque l'espace de travail est en lecture seule.

### `agents.defaults.runRetries`

Limites d'itérations de nouvelle tentative de la boucle d'exécution externe pour l'environnement d'exécution d'agent intégré, afin d'éviter les boucles d'exécution infinies pendant la récupération après un échec. Ce paramètre s'applique uniquement à l'environnement d'exécution d'agent intégré, et non aux environnements d'exécution ACP ou CLI.

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
        runRetries: { max: 50 }, // substitutions facultatives par agent
      },
    ],
  },
}
```

- `base` : nombre de base d'itérations de nouvelle tentative d'exécution pour la boucle d'exécution externe. Valeur par défaut : `24`.
- `perProfile` : nombre d'itérations supplémentaires de nouvelle tentative d'exécution accordées pour chaque profil de repli candidat. Valeur par défaut : `8`.
- `min` : limite absolue minimale d'itérations de nouvelle tentative d'exécution. Valeur par défaut : `32`.
- `max` : limite absolue maximale d'itérations de nouvelle tentative d'exécution afin d'éviter une exécution incontrôlée. Valeur par défaut : `160`.

### `agents.defaults.contextPruning`

Élague les **anciens résultats d'outils** du contexte en mémoire avant l'envoi au LLM. Ne modifie **pas** l'historique de session sur le disque. Désactivé par défaut ; définissez `mode: "cache-ttl"` pour l'activer.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (valeur par défaut) | cache-ttl
        ttl: "1h", // durée (ms/s/m/h), unité par défaut : minutes ; valeur par défaut : 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Contenu de l'ancien résultat d'outil effacé]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportement du mode cache-ttl">

- `mode: "cache-ttl"` active les passes d'élagage.
- `ttl` détermine la fréquence à laquelle l'élagage peut être réexécuté (après le dernier accès au cache). Valeur par défaut : `5m`.
- L'élagage tronque d'abord partiellement les résultats d'outils surdimensionnés, puis efface entièrement les résultats d'outils plus anciens si nécessaire.
- `softTrimRatio` et `hardClearRatio` acceptent des valeurs comprises entre `0.0` et `1.0` ; la validation de la configuration rejette les valeurs situées hors de cette plage.

La **troncature partielle** conserve le début et la fin, et insère `...` au milieu.

L'**effacement complet** remplace l'intégralité du résultat d'outil par le texte de remplacement.

Remarques :

- Les blocs d'images ne sont jamais tronqués ni effacés.
- Les rapports sont fondés sur les caractères (de manière approximative), et non sur un nombre exact de jetons.
- S'il existe moins de `keepLastAssistants` messages d'assistant, l'élagage est ignoré.

</Accordion>

Voir [Élagage des sessions](/fr/concepts/session-pruning) pour plus de détails sur le comportement.

### Diffusion par blocs

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (valeur par défaut) | natural | custom (utilise minMs/maxMs)
    },
  },
}
```

- Les canaux autres que Telegram nécessitent un paramètre `*.streaming.block.enabled: true` explicite pour activer les réponses par blocs. QQ Bot fait exception : il ne possède aucune clé `streaming.block` et diffuse les réponses par blocs, sauf si `channels.qqbot.streaming.mode` vaut `"off"`.
- Substitutions propres aux canaux : `channels.<channel>.streaming.block.coalesce` (ainsi que les variantes par compte). Discord, Google Chat, Mattermost, MS Teams, Signal et Slack utilisent par défaut `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference` : limite de bloc privilégiée (`"paragraph" | "newline" | "sentence"`).
- `humanDelay` : pause aléatoire entre les réponses par blocs. Valeur par défaut : `off`. `natural` = 800-2500ms. `custom` utilise `minMs`/`maxMs` (revient à la plage naturelle pour toute limite non définie). Substitution par agent : `agents.list[].humanDelay`.

Voir [Diffusion en continu](/fr/concepts/streaming) pour plus de détails sur le comportement et le découpage en blocs.

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
- Valeur par défaut de `typingIntervalSeconds` : `6`.
- Substitutions par session : `session.typingMode`, `session.typingIntervalSeconds`.

Voir [Indicateurs de saisie](/fr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Mise en bac à sable facultative pour l'agent intégré. Voir [Mise en bac à sable](/fr/gateway/sandboxing) pour le guide complet.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (par défaut) | non-main | all
        backend: "docker", // docker (par défaut) | ssh | openshell
        scope: "agent", // session | agent (par défaut) | shared
        workspaceAccess: "none", // none (par défaut) | ro | rw
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
          gpus: "all",
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
          // Les SecretRefs et le contenu en ligne sont également pris en charge :
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

Les valeurs par défaut présentées ci-dessus (image `off`/`docker`/`agent`/`none`/`bookworm-slim`/réseau `none`/etc.) sont les véritables valeurs par défaut d’OpenClaw, et non de simples valeurs d’illustration.

<Accordion title="Détails du bac à sable">

**Backend :**

- `docker` : environnement d’exécution Docker local (par défaut)
- `ssh` : environnement d’exécution distant générique reposant sur SSH
- `openshell` : environnement d’exécution OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres à l’environnement d’exécution sont déplacés vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail de chaque portée (par défaut : `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenu en ligne ou SecretRefs qu’OpenClaw matérialise dans des fichiers temporaires lors de l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : options de stratégie des clés d’hôte OpenSSH (toutes deux définies par défaut sur `true`)

**Ordre de priorité de l’authentification SSH :**

- `identityData` prévaut sur `identityFile`
- `certificateData` prévaut sur `certificateFile`
- `knownHostsData` prévaut sur `knownHostsFile`
- Les valeurs `*Data` reposant sur des SecretRefs sont résolues à partir de l’instantané actif de l’environnement d’exécution des secrets avant le démarrage de la session du bac à sable

**Comportement du backend SSH :**

- initialise une fois l’espace de travail distant après sa création ou sa recréation
- conserve ensuite l’espace de travail SSH distant comme référence canonique
- achemine `exec`, les outils de fichiers et les chemins des médias via SSH
- ne synchronise pas automatiquement les modifications distantes vers l’hôte
- ne prend pas en charge les conteneurs de navigateur du bac à sable

**Accès à l’espace de travail :**

- `none` : espace de travail du bac à sable propre à chaque portée sous `~/.openclaw/sandboxes` (par défaut)
- `ro` : espace de travail du bac à sable dans `/workspace`, espace de travail de l’agent monté en lecture seule dans `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture dans `/workspace`

**Portée :**

- `session` : un conteneur et un espace de travail par session
- `agent` : un conteneur et un espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (aucune isolation entre les sessions)

**Configuration du plugin OpenShell :**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (par défaut) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // facultatif
          gatewayEndpoint: "https://lab.example", // facultatif
          policy: "strict", // identifiant facultatif de la stratégie OpenShell
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

- `mirror` : initialise l’espace distant à partir de l’espace local avant l’exécution, puis le resynchronise après l’exécution ; l’espace de travail local reste la référence canonique
- `remote` : initialise une fois l’espace distant lors de la création du bac à sable, puis conserve l’espace de travail distant comme référence canonique

En mode `remote`, les modifications locales apportées sur l’hôte en dehors d’OpenClaw ne sont pas automatiquement synchronisées dans le bac à sable après l’étape d’initialisation.
Le transport s’effectue par SSH vers le bac à sable OpenShell, mais le plugin gère le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite un accès réseau sortant, une racine accessible en écriture et l’utilisateur root.

**Les conteneurs utilisent `network: "none"` par défaut** — définissez cette valeur sur `"bridge"` (ou sur un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut, sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (mesure de dernier recours).
Les tours du serveur d’application Codex dans un bac à sable OpenClaw actif utilisent ce même paramètre de sortie pour l’accès réseau natif de leur mode code.

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` au sein de l’espace de travail actif.

**`docker.binds`** monte des répertoires supplémentaires de l’hôte ; les montages globaux et ceux propres à chaque agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`, valeur par défaut : `false`) : Chromium + CDP dans un conteneur. L’URL noVNC est injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès d’observation noVNC utilise par défaut l’authentification VNC et OpenClaw génère une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur de l’hôte.
- `network` utilise par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez cette valeur sur `bridge` uniquement si vous souhaitez explicitement une connectivité bridge globale. `"host"` est également bloqué ici.
- `cdpSourceRange` restreint facultativement l’accès entrant CDP à la périphérie du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires supplémentaires de l’hôte uniquement dans le conteneur du navigateur en bac à sable. Lorsqu’il est défini (y compris sur `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
- Chromium, dans le conteneur du navigateur en bac à sable, est toujours lancé avec `--no-sandbox --disable-setuid-sandbox` (les conteneurs ne disposent pas des primitives du noyau requises par le propre bac à sable de Chrome) ; aucune option de configuration ne permet de modifier ce comportement.
- Les valeurs de lancement par défaut sont définies dans `scripts/sandbox-browser-entrypoint.sh` et adaptées aux hôtes de conteneurs :
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` et `--disable-software-rasterizer` sont
    activés par défaut et peuvent être désactivés avec
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l’utilisation de WebGL/3D l’exige.
  - `--disable-extensions` (activé par défaut) ; `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    réactive les extensions si votre flux de travail en dépend.
  - `--renderer-process-limit=2` par défaut ; modifiez cette valeur avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - `--headless=new` uniquement lorsque `headless` est activé.
  - Les valeurs par défaut correspondent à la configuration de référence de l’image du conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

La mise en bac à sable du navigateur et `sandbox.docker.binds` sont uniquement disponibles avec Docker.

Construisez les images (depuis une extraction du code source) :

```bash
scripts/sandbox-setup.sh           # image principale du bac à sable
scripts/sandbox-browser-setup.sh   # image facultative du navigateur
```

Pour les installations npm sans extraction du code source, consultez [Mise en bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

### `agents.list` (remplacements propres à chaque agent)

Utilisez `agents.list[].tts` pour attribuer à un agent son propre fournisseur TTS, sa propre voix, son propre modèle,
son propre style ou son propre mode TTS automatique. Le bloc de l’agent est fusionné en profondeur avec la configuration globale
`messages.tts`, afin que les identifiants partagés puissent rester centralisés tandis que chaque
agent ne remplace que les champs de voix ou de fournisseur dont il a besoin. Le remplacement de l’agent actif
s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et
à l’outil d’agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
pour obtenir des exemples de fournisseurs et connaître l’ordre de priorité.

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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // remplacement du niveau de réflexion par agent
        reasoningDefault: "on", // remplacement de la visibilité du raisonnement par agent
        fastModeDefault: false, // remplacement du mode rapide par agent
        params: { cacheRetention: "none" }, // remplace les paramètres defaults.models correspondants par clé
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
            mode: "persistent", // persistent | oneshot
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
- `default` : lorsque plusieurs sont définis, le premier l’emporte (un avertissement est consigné). Si aucun n’est défini, la première entrée de la liste est utilisée par défaut.
- `model` : la forme chaîne définit un modèle principal strict par agent, sans modèle de secours ; la forme objet `{ primary }` est également stricte, sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour autoriser cet agent à recourir au modèle de secours, ou `{ primary, fallbacks: [] }` pour rendre explicite le comportement strict. Les tâches Cron qui remplacent uniquement `primary` héritent toujours des modèles de secours par défaut, sauf si vous définissez `fallbacks: []`.
- `utilityModel` : remplacement facultatif par agent pour les courtes tâches internes, telles que la génération des titres de session et de fil. Utilise à défaut `agents.defaults.utilityModel`, puis le petit modèle par défaut déclaré par le fournisseur principal, puis le modèle principal de cet agent. Une chaîne vide désactive le routage utilitaire pour cet agent.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée du modèle sélectionné dans `agents.defaults.models`. Utilisez-les pour des remplacements propres à l’agent, tels que `cacheRetention`, `temperature` ou `maxTokens`, sans dupliquer l’intégralité du catalogue de modèles.
- `tts` : remplacements facultatifs de la synthèse vocale par agent. Le bloc est fusionné en profondeur par-dessus `messages.tts` ; conservez donc les identifiants d’authentification partagés du fournisseur et la stratégie de secours dans `messages.tts`, et ne définissez ici que les valeurs propres à la persona, telles que le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d’autorisation facultative des Skills par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsque celui-ci est défini ; une liste explicite remplace les valeurs par défaut au lieu de les fusionner, et `[]` signifie qu’aucun Skills n’est disponible.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil du fournisseur/modèle sélectionné détermine les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique gérée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité par défaut facultative du raisonnement par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement du raisonnement par message ou par session n’est défini.
- `fastModeDefault` : valeur par défaut facultative du mode rapide par agent (`"auto" | true | false`). S’applique lorsqu’aucun remplacement du mode rapide par message ou par session n’est défini.
- `models` : remplacements facultatifs du catalogue de modèles/de l’environnement d’exécution par agent, indexés par les identifiants `provider/model` complets. Utilisez `models["provider/model"].agentRuntime` pour les exceptions d’environnement d’exécution propres à l’agent.
- `runtime` : descripteur facultatif de l’environnement d’exécution par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- Les fichiers image `identity.avatar` locaux relatifs à l’espace de travail sont limités à 2 MB. Les URL `http(s)` et les URI `data:` ne sont pas soumises à la limite locale de taille des fichiers.
- `identity` déduit les valeurs par défaut : `ackReaction` à partir de `emoji`, `mentionPatterns` à partir de `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des identifiants d’agents configurés pour les cibles `sessions_spawn.agentId` explicites (`["*"]` = toute cible configurée ; valeur par défaut : le même agent uniquement). Incluez l’identifiant du demandeur lorsque les appels `agentId` se ciblant eux-mêmes doivent être autorisés. Les entrées obsolètes dont la configuration d’agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer, ou ajoutez une entrée `agents.list[]` minimale si cette cible doit rester instanciable tout en héritant des valeurs par défaut.
- Protection de l’héritage du bac à sable : si la session du demandeur est placée dans un bac à sable, `sessions_spawn` rejette les cibles qui s’exécuteraient sans bac à sable.
- `subagents.requireAgentId` : lorsque la valeur est true, bloque les appels `sessions_spawn` qui omettent `agentId` (impose la sélection explicite d’un profil ; valeur par défaut : false).
- `subagents.maxConcurrent` : nombre maximal d’exécutions simultanées d’agents enfants pour l’ensemble de l’exécution des sous-agents. Valeur par défaut : `8`.
- `subagents.maxChildrenPerAgent` : nombre maximal d’enfants actifs qu’une même session d’agent peut instancier. Valeur par défaut : `5`.
- `subagents.maxSpawnDepth` : profondeur maximale d’imbrication pour l’instanciation de sous-agents (`1`-`5`). Valeur par défaut : `1` (aucune imbrication).
- `subagents.archiveAfterMinutes` : délai avant l’archivage de l’état d’un sous-agent terminé. Valeur par défaut : `60`.

---

## Routage multi-agent

Exécutez plusieurs agents isolés au sein d’un même Gateway. Consultez [Multi-Agent](/fr/concepts/multi-agent).

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

### Champs de correspondance des liaisons

- `type` (facultatif) : `route` pour le routage normal (un type absent utilise route par défaut), `acp` pour les liaisons persistantes de conversations ACP.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; propre au canal)
- `acp` (facultatif ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans pair/guilde/équipe)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw effectue la résolution selon l’identité exacte de la conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre des niveaux de liaison de routage ci-dessus.

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

<Accordion title="Outils et espace de travail en lecture seule">

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

Consultez [Bac à sable et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour plus de détails sur la priorité.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (par défaut) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // durée ou false
      maxDiskBytes: "500mb", // plafond strict facultatif
      highWaterBytes: "400mb", // cible de nettoyage facultative
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // retrait automatique de la sélection après une inactivité par défaut, en heures (`0` désactive)
      maxAgeHours: 0, // âge maximal strict par défaut, en heures (`0` désactive)
    },
    mainKey: "main", // ancien (l’environnement d’exécution utilise toujours "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Détails des champs de session">

- **`scope`** : stratégie de regroupement des sessions de base pour les contextes de discussion de groupe.
  - `per-sender` (par défaut) : chaque expéditeur dispose d'une session isolée au sein d'un contexte de canal.
  - `global` : tous les participants d'un contexte de canal partagent une session unique (à utiliser uniquement lorsqu'un contexte partagé est souhaité).
- **`dmScope`** : mode de regroupement des messages privés.
  - `main` : tous les messages privés partagent la session principale.
  - `per-peer` : isolation par identifiant d'expéditeur sur tous les canaux.
  - `per-channel-peer` : isolation par canal et expéditeur (recommandé pour les boîtes de réception multiutilisateurs).
  - `per-account-channel-peer` : isolation par compte, canal et expéditeur (recommandé pour les configurations multicomptes).
- **`identityLinks`** : associe les identifiants canoniques à des pairs préfixés par le fournisseur afin de partager les sessions entre les canaux. Les commandes d'ancrage telles que `/dock_discord` utilisent la même association pour faire basculer la route de réponse de la session active vers un autre pair de canal lié ; consultez [Ancrage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique principale de réinitialisation. `daily` effectue la réinitialisation à l'heure locale `atHour` ; `idle` l'effectue après `idleMinutes`. Lorsque les deux sont configurés, la première échéance atteinte l'emporte. La fraîcheur de la réinitialisation quotidienne repose sur le champ `sessionStartedAt` de la ligne de session ; celle de la réinitialisation après inactivité repose sur `lastInteractionAt`. Les écritures d'événements en arrière-plan ou système, telles que les Heartbeats, les réveils Cron, les notifications d'exécution et la comptabilité du Gateway, peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas la fraîcheur des sessions quotidiennes ou inactives.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L'ancien `dm` est accepté comme alias de `direct`.
- **`resetByChannel`** : remplacements de réinitialisation par canal, indexés par identifiant de fournisseur/canal. Lorsque le canal de la session possède une entrée correspondante, celle-ci l'emporte entièrement sur `resetByType`/`reset` pour cette session. À utiliser uniquement lorsqu'un canal nécessite un comportement de réinitialisation différent de la politique définie au niveau du type.
- **`mainKey`** : champ hérité. L'environnement d'exécution utilise toujours `"main"` pour le compartiment principal des discussions directes.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents lors des échanges d'agent à agent (entier, plage : `0`-`20`, valeur par défaut : `5`). `0` désactive l'enchaînement en ping-pong.
- **`sendPolicy`** : correspondance selon `channel`, `chatType` (`direct|group|channel`, avec l'ancien alias `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l'emporte.
- **`maintenance`** : contrôles de nettoyage et de conservation du magasin de sessions.
  - `mode` : `enforce` applique le nettoyage et constitue la valeur par défaut ; `warn` émet uniquement des avertissements.
  - `pruneAfter` : seuil d'âge des entrées obsolètes (valeur par défaut : `30d`).
  - `maxEntries` : nombre maximal d'entrées de session SQLite (valeur par défaut : `500`). Les écritures de l'environnement d'exécution effectuent le nettoyage par lots avec une petite marge au-dessus du seuil pour les limites adaptées à la production ; `openclaw sessions cleanup --enforce` applique immédiatement la limite.
  - Les sessions de sondage d'exécution de modèle à courte durée de vie du Gateway utilisent une conservation fixe de `24h`, mais le nettoyage dépend de la pression : il ne supprime les lignes obsolètes de sondage strict d'exécution de modèle que lorsque la maintenance des entrées de session ou la pression liée à la limite est atteinte. Seules les clés de sondage explicites strictes correspondant à `agent:*:explicit:model-run-<uuid>` sont admissibles ; les sessions normales directes, de groupe, de fil, Cron, de hook, Heartbeat, ACP et de sous-agent n'héritent pas de cette conservation de 24 h. Lorsqu'il est exécuté, le nettoyage des exécutions de modèle précède le nettoyage plus général des entrées obsolètes selon `pruneAfter` et l'application de la limite `maxEntries`.
  - L'ancien `rotateBytes` est rejeté par le schéma actuel ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : conservation basée sur l'âge des archives de transcriptions réinitialisées ou supprimées. Par défaut, les archives sont conservées jusqu'à leur éviction en raison du budget disque ; définissez une durée pour activer leur suppression selon le temps écoulé, ou `false` pour la désactiver explicitement.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, des avertissements sont consignés ; en mode `enforce`, les artefacts et sessions les plus anciens sont supprimés en premier.
  - `highWaterBytes` : cible facultative après le nettoyage lié au budget. La valeur par défaut est `80%` de `maxDiskBytes`.
- **`writeLock`** : contrôles du verrouillage en écriture des transcriptions de session. À ajuster uniquement lorsque des opérations légitimes de préparation de transcription, de nettoyage, de Compaction ou de mise en miroir sont en concurrence plus longtemps que ne le prévoient les politiques par défaut.
  - `acquireTimeoutMs` : nombre de millisecondes d'attente lors de l'acquisition d'un verrou avant de signaler que la session est occupée. Valeur par défaut : `60000` ; remplacement par la variable d'environnement `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs` : nombre de millisecondes après lequel un verrou existant est considéré comme obsolète et récupéré. Valeur par défaut : `1800000` ; remplacement par la variable d'environnement `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs` : durée maximale, en millisecondes, pendant laquelle un verrou détenu dans le processus peut le rester avant que le mécanisme de surveillance ne le libère. Valeur par défaut : `300000` ; remplacement par la variable d'environnement `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`** : valeurs globales par défaut des fonctionnalités de session liées aux fils.
  - `enabled` : interrupteur principal par défaut (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : désactivation automatique par défaut de la focalisation après inactivité, en heures (`0` la désactive ; les fournisseurs peuvent la remplacer)
  - `maxAgeHours` : âge maximal absolu par défaut, en heures (`0` le désactive ; les fournisseurs peuvent le remplacer)
  - `spawnSessions` : contrôle par défaut de la création de sessions de travail liées à un fil à partir de `sessions_spawn` et des créations de fils ACP. La valeur par défaut est `true` lorsque les liaisons de fils sont activées ; les fournisseurs et les comptes peuvent la remplacer.
  - `defaultSpawnContext` : contexte natif de sous-agent par défaut pour les créations liées à un fil (`"fork"` ou `"isolated"`). La valeur par défaut est `"fork"`.

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (par défaut) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (par défaut)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 désactive
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

Résolution (le plus spécifique l'emporte) : compte → canal → global. `""` désactive et interrompt la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables du modèle :**

| Variable          | Description            | Exemple                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nom court du modèle       | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur          | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel | `high`, `low`, `off`        |
| `{identity.name}` | Nom de l'identité de l'agent    | (identique à `"auto"`)          |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d'accusé de réception

- Utilise par défaut `identity.emoji` de l'agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l'identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all` ou `off`/`none` (désactive entièrement les réactions d'accusé de réception).
- `removeAckAfterReply` : supprime l'accusé de réception après la réponse sur les canaux prenant en charge les réactions, tels que Slack, Discord, Signal, Telegram, WhatsApp et iMessage.
- `messages.statusReactions.enabled` : active les réactions d'état du cycle de vie sur Slack, Discord, Signal, Telegram et WhatsApp.
  Sur Discord, l'absence de valeur maintient les réactions d'état activées lorsque les réactions d'accusé de réception sont actives.
  Sur Slack, Signal, Telegram et WhatsApp, définissez-le explicitement sur `true` pour activer les réactions d'état du cycle de vie.
  Par défaut, Slack utilise son état natif de fil d'assistant et des messages de chargement alternés pour indiquer la progression, tout en conservant la réaction d'accusé de réception configurée.
- `messages.statusReactions.emojis` : remplace les clés d'émoji du cycle de vie :
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` et `stallHard`.
  Telegram n'autorise qu'un ensemble fixe de réactions ; les émojis configurés non pris en charge sont donc remplacés
  par la variante d'état compatible la plus proche pour cette discussion.

### File d'attente

- `mode` : stratégie de mise en file d'attente des messages entrants reçus pendant l'exécution active d'une session. Valeur par défaut : `"steer"`.
  - `steer` : injecte la nouvelle invite dans l'exécution active.
  - `followup` : exécute la nouvelle invite après la fin de l'exécution active.
  - `collect` : regroupe les messages compatibles et les exécute ensemble ultérieurement.
  - `interrupt` : interrompt l'exécution active avant de lancer l'invite la plus récente.
- `debounceMs` : délai avant l'envoi d'un message mis en file d'attente ou redirigé. Valeur par défaut : `500`.
- `cap` : nombre maximal de messages en file d'attente avant l'application de la politique d'abandon. Valeur par défaut : `20`.
- `drop` : stratégie lorsque la limite est dépassée. `"summarize"` (par défaut) supprime les entrées les plus anciennes tout en conservant des résumés compacts ; `"old"` supprime les plus anciennes sans résumé ; `"new"` rejette l'élément le plus récent.
- `byChannel` : remplacements de `mode` par canal, indexés par identifiant de fournisseur.
- `debounceMsByChannel` : remplacements de `debounceMs` par canal, indexés par identifiant de fournisseur.

### Temporisation des messages entrants

Regroupe les messages textuels envoyés rapidement par un même expéditeur en un seul tour d'agent. Les contenus multimédias et pièces jointes déclenchent immédiatement l'envoi. Les commandes de contrôle contournent la temporisation. Valeur par défaut de `debounceMs` : `2000`.

### Autres clés de messages

- `messages.messagePrefix` : texte de préfixe ajouté aux messages utilisateur entrants avant qu'ils n'atteignent l'environnement d'exécution de l'agent. À utiliser avec parcimonie pour les marqueurs de contexte du canal.
- `messages.visibleReplies` : contrôle les réponses sources visibles dans les conversations directes, de groupe et de canal (`"message_tool"` nécessite `message(action=send)` pour produire une sortie visible ; `"automatic"` publie les réponses normales comme auparavant).
- `messages.usageTemplate` / `messages.responseUsage` : modèle personnalisé de pied de page `/usage` et mode d'utilisation par défaut pour chaque réponse (`off | tokens | full`, ainsi que l'ancien alias `on` de `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit` : déclencheurs de mention dans les messages de groupe et dimensionnement de la fenêtre d'historique.
- `messages.suppressToolErrors` : lorsque défini sur `true`, masque les avertissements d'erreur de l'outil `⚠️` affichés à l'utilisateur (l'agent voit toujours les erreurs dans le contexte et peut réessayer). Valeur par défaut : `false`.

### TTS (synthèse vocale)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (par défaut) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` contrôle le mode TTS automatique par défaut : `off`, `always`, `inbound` ou `tagged`. `/tts on|off` peut remplacer les préférences locales, et `/tts status` affiche l’état effectif.
- `summaryModel` remplace `agents.defaults.model.primary` pour le résumé automatique.
- `modelOverrides` est activé par défaut (`enabled !== false`) ; `modelOverrides.allowProvider` doit être activé explicitement.
- Les clés API utilisent à défaut `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs de synthèse vocale intégrés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque plugin de fournisseur TTS que vous souhaitez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS d’OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison autre qu’OpenAI, OpenClaw le traite comme un serveur TTS compatible avec OpenAI et assouplit la validation du modèle et de la voix.

---

## Conversation

Valeurs par défaut du mode Conversation (macOS/iOS/Android et interface de contrôle du navigateur).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Parlez chaleureusement et répondez brièvement.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs du mode Conversation sont configurés.
- Les anciennes clés plates du mode Conversation (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sont uniquement destinées à la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistante dans `talk.providers.<provider>`.
- Les identifiants de voix utilisent à défaut `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` (comportement du client Conversation sous macOS).
- `providers.*.apiKey` accepte des chaînes en texte brut ou des objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé API du mode Conversation n’est configurée.
- `providers.*.voiceAliases` permet aux directives du mode Conversation d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local de macOS. En cas d’omission, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX sous macOS passe par l’assistant `openclaw-mlx-tts` intégré lorsqu’il est présent, ou par un exécutable dans `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `consultThinkingLevel` contrôle le niveau de réflexion de l’exécution complète de l’agent OpenClaw à l’origine des appels `openclaw_agent_consult` en temps réel du mode Conversation de l’interface de contrôle. Laissez ce paramètre non défini pour préserver le comportement normal de la session et du modèle.
- `consultFastMode` définit un remplacement ponctuel du mode rapide pour les consultations en temps réel du mode Conversation de l’interface de contrôle, sans modifier le réglage normal du mode rapide de la session.
- `speechLocale` définit l’identifiant de paramètres régionaux BCP 47 utilisé par la reconnaissance vocale du mode Conversation sous iOS/macOS. Laissez ce paramètre non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle la durée pendant laquelle le mode Conversation attend après le silence de l’utilisateur avant d’envoyer la transcription. Une valeur non définie conserve la fenêtre de pause par défaut de la plateforme (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` ajoute des instructions système destinées au fournisseur à l’invite en temps réel intégrée d’OpenClaw, afin de permettre la configuration du style vocal sans perdre les directives `openclaw_agent_consult` par défaut.
- `realtime.vadThreshold` définit le seuil d’activité vocale du fournisseur, de `0` (le plus sensible) à `1` (le moins sensible). Une valeur non définie conserve la valeur par défaut du fournisseur.
- `realtime.silenceDurationMs` définit la fenêtre de silence exprimée par un nombre entier positif avant que le fournisseur ne valide un tour utilisateur en temps réel. Une valeur non définie conserve la valeur par défaut du fournisseur.
- `realtime.prefixPaddingMs` définit la quantité d’audio, exprimée par un nombre entier non négatif, conservée avant le début de la parole détectée. Une valeur non définie conserve la valeur par défaut du fournisseur.
- `realtime.reasoningEffort` définit le niveau de raisonnement propre au fournisseur pour les sessions en temps réel. Une valeur non définie conserve la valeur par défaut du fournisseur.
- `realtime.consultRouting` : `"provider-direct"` (par défaut) préserve les réponses directes du fournisseur lorsque le fournisseur en temps réel produit une transcription utilisateur finale sans `openclaw_agent_consult`. `"force-agent-consult"` achemine plutôt la requête finalisée via OpenClaw.

---

## Pages associées

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
