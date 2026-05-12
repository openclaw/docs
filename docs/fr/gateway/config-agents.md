---
read_when:
    - Ajuster les paramètres par défaut des agents (modèles, réflexion, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage multi-agent et des liaisons
    - Ajustement du comportement des sessions, de la livraison des messages et du mode conversation
summary: Valeurs par défaut de l’agent, routage multi-agent, session, messages et configuration de conversation
title: Configuration — agents
x-i18n:
    generated_at: "2026-05-12T12:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, le runtime du Gateway et les autres
clés de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Paramètres par défaut des agents

### `agents.defaults.workspace`

Par défaut : `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Racine de dépôt facultative affichée dans la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis l’espace de travail.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Liste d’autorisation de skills par défaut facultative pour les agents qui ne définissent pas
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

- Omettez `agents.defaults.skills` pour des skills non restreintes par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune skill.
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

Ignore la création de certains fichiers facultatifs de l’espace de travail tout en continuant à écrire les fichiers d’amorçage requis. Valeurs valides : `SOUL.md`, `USER.md`, `HEARTBEAT.md` et `IDENTITY.md`.

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

Contrôle quand les fichiers d’amorçage de l’espace de travail sont injectés dans le prompt système. Par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse assistant terminée) ignorent la réinjection de l’amorçage de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive l’amorçage de l’espace de travail et l’injection de fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui maîtrisent entièrement le cycle de vie de leur prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte, ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier d’amorçage de l’espace de travail avant troncature. Par défaut : `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Nombre total maximal de caractères injectés sur l’ensemble des fichiers d’amorçage de l’espace de travail. Par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle l’avis visible par l’agent dans le prompt système lorsque le contexte d’amorçage est tronqué.
Par défaut : `"once"`.

- `"off"` : n’injecte jamais de texte d’avis de troncature dans le prompt système.
- `"once"` : injecte un avis concis une fois par signature de troncature unique (recommandé).
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe.

Les décomptes détaillés bruts/injectés et les champs de réglage de configuration restent dans les diagnostics tels
que les rapports de contexte/statut et les journaux ; le contexte utilisateur/runtime courant de WebChat ne
reçoit que l’avis concis de récupération.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw dispose de plusieurs budgets de prompt/contexte à volume élevé, et ils sont
intentionnellement séparés par sous-système au lieu de passer tous par un bouton de réglage
générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale de l’amorçage de l’espace de travail.
- `agents.defaults.startupContext.*` :
  préambule ponctuel de lancement de modèle lors d’une réinitialisation/d’un démarrage, incluant les fichiers
  `memory/*.md` quotidiens récents. Les commandes de discussion seules `/new` et `/reset` sont
  acquittées sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte de skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits de runtime bornés et blocs injectés détenus par le runtime.
- `memory.qmd.limits.*` :
  dimensionnement des extraits de recherche mémoire indexée et de l’injection.

Utilisez le remplacement par agent correspondant uniquement lorsqu’un agent a besoin d’un budget
différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage du premier tour injecté lors des lancements de modèle de réinitialisation/démarrage.
Les commandes de discussion seules `/new` et `/reset` acquittent la réinitialisation sans invoquer
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

Valeurs par défaut partagées pour les surfaces de contexte de runtime bornées.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars` : plafond par défaut des extraits `memory_get` avant l’ajout
  des métadonnées de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond de résultat d’outil en direct utilisé pour les résultats persistés et
  la récupération en cas de dépassement.
- `postCompactionMaxChars` : plafond d’extrait AGENTS.md utilisé lors de l’injection
  d’actualisation après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent des boutons de réglage partagés `contextLimits`. Les champs omis héritent
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
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

Remplacement par agent du budget de prompt des skills.

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

Taille maximale en pixels du côté le plus long d’une image dans les blocs image de transcript/outil avant les appels aux fournisseurs.
Par défaut : `1200`.

Des valeurs plus faibles réduisent généralement l’usage de tokens de vision et la taille de la charge utile des requêtes pour les exécutions riches en captures d’écran.
Des valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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

Format horaire dans le prompt système. Par défaut : `auto` (préférence du système d’exploitation).

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

- `model`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - La forme chaîne définit uniquement le modèle principal.
  - La forme objet définit le modèle principal ainsi que des modèles de basculement ordonnés.
- `imageModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin d’outil `image` comme configuration de son modèle de vision.
  - Également utilisé comme routage de secours lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Préférez les références explicites `provider/model`. Les identifiants nus sont acceptés pour compatibilité ; si un identifiant nu correspond de manière unique à une entrée configurée compatible image dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës exigent un préfixe de fournisseur explicite.
- `imageGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/Plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images native Gemini, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie OpenAI PNG/WebP avec arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification fournisseur correspondante (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - S’il est omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur.
- `musicGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération de musique et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - S’il est omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
- `videoGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - S’il est omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à une authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
  - Le fournisseur intégré de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage de modèle.
  - S’il est omis, l’outil PDF se rabat sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb`: limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages`: nombre maximal de pages par défaut prises en compte par le mode de secours d’extraction dans l’outil `pdf`.
- `verboseDefault`: niveau verbeux par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `toolProgressDetail`: mode de détail pour les résumés d’outils `/verbose` et les lignes d’outils de brouillon de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande/le détail brut lorsque disponible). `agents.list[].toolProgressDetail` par agent remplace cette valeur par défaut.
- `reasoningDefault`: visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs de raisonnement par défaut configurées ne sont appliquées que pour les propriétaires, les expéditeurs autorisés ou les contextes Gateway d’administrateur opérateur lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault`: niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary`: format `provider/model` (par exemple `openai/gpt-5.5` pour un accès OpenAI par clé d’API ou Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite se rabat sur le fournisseur par défaut configuré (comportement de compatibilité obsolète ; préférez donc un `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se rabat sur le premier fournisseur/modèle configuré au lieu de signaler une valeur par défaut obsolète d’un fournisseur supprimé.
- `models`: le catalogue de modèles configuré et la liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Utilisez des entrées `provider/*` telles que `"openai-codex/*": {}` ou `"vllm/*": {}` pour afficher tous les modèles découverts pour les fournisseurs sélectionnés sans répertorier manuellement chaque identifiant de modèle.
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation, sauf si vous transmettez `--replace`.
  - Les flux de configuration/intégration limités au fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette carte et préservent les fournisseurs sans rapport déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params`: paramètres fournisseur globaux par défaut appliqués à tous les modèles. Définis à `agents.defaults.params` (par exemple `{ cacheRetention: "long" }`).
- Précédence de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `params.extra_body`/`params.extraBody`: JSON avancé transmis tel quel et fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. S’il entre en conflit avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de complétions non natives retirent toujours ensuite le champ OpenAI uniquement `store`.
- `params.chat_template_kwargs`: arguments de modèle de chat vLLM/compatibles OpenAI fusionnés dans les corps de requête de premier niveau `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la réflexion désactivée, le Plugin vLLM intégré envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` garde la priorité finale. Pour les contrôles de réflexion Qwen vLLM, définissez `params.qwenThinkingFormat` sur `"chat-template"` ou `"top-level"` dans cette entrée de modèle.
- `compat.thinkingFormat`: style de charge utile de réflexion compatible OpenAI. Utilisez `"qwen"` pour `enable_thinking` de premier niveau façon Qwen, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les backends de la famille Qwen qui prennent en charge les kwargs de modèle de chat au niveau de la requête, comme vLLM. OpenClaw mappe la réflexion désactivée sur `false` et la réflexion activée sur `true`.
- `compat.supportedReasoningEfforts`: liste par modèle des niveaux d’effort de raisonnement compatibles OpenAI. Incluez `"xhigh"` pour les points de terminaison personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session Gateway, la validation des correctifs de session, la validation CLI d’agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking`: option d’adhésion propre à Z.AI pour la réflexion préservée. Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue le `reasoning_content` antérieur ; voir [Réflexion Z.AI et réflexion préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `localService`: gestionnaire de processus optionnel au niveau fournisseur pour les serveurs de modèles locaux/auto-hébergés. Lorsque le modèle sélectionné appartient à ce fournisseur, OpenClaw sonde `healthUrl` (ou `baseUrl + "/models"`), démarre `command` avec `args` si le point de terminaison est indisponible, attend jusqu’à `readyTimeoutMs`, puis envoie la requête de modèle. `command` doit être un chemin absolu. `idleStopMs: 0` maintient le processus actif jusqu’à la sortie d’OpenClaw ; une valeur positive arrête le processus lancé par OpenClaw après autant de millisecondes d’inactivité. Voir [Services de modèles locaux](/fr/gateway/local-model-services).
- La stratégie d’exécution appartient aux fournisseurs ou aux modèles, pas à `agents.defaults`. Utilisez `models.providers.<provider>.agentRuntime` pour les règles applicables à tout un fournisseur, ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` pour les règles propres à un modèle. Les modèles d’agent OpenAI sur le fournisseur OpenAI officiel sélectionnent Codex par défaut.
- Les rédacteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de secours) enregistrent la forme objet canonique et préservent les listes de secours existantes lorsque possible.
- `maxConcurrent`: nombre maximal d’exécutions d’agents parallèles entre sessions (chaque session reste sérialisée). Par défaut : 4.

### Stratégie d’exécution

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
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un identifiant de harnais Plugin enregistré, ou un alias de backend CLI pris en charge. Le Plugin Codex intégré enregistre `codex` ; le Plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `id: "auto"` laisse les harnais Plugin enregistrés revendiquer les tours pris en charge et utilise PI lorsqu’aucun harnais ne correspond. Une exécution Plugin explicite comme `id: "codex"` exige ce harnais et échoue de manière fermée s’il est indisponible ou échoue.
- Les clés d’exécution d’agent entier sont héritées. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, les épingles d’exécution de session et `OPENCLAW_AGENT_RUNTIME` sont ignorés par la sélection d’exécution. Exécutez `openclaw doctor --fix` pour supprimer les valeurs obsolètes.
- Les modèles d’agent OpenAI utilisent le harnais Codex par défaut ; `agentRuntime.id: "codex"` au niveau fournisseur/modèle reste valide lorsque vous voulez le rendre explicite.
- Pour les déploiements Claude CLI, préférez `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"` au périmètre du modèle. Les références de modèle héritées `claude-cli/claude-opus-4-7` fonctionnent toujours pour compatibilité, mais la nouvelle configuration doit conserver une sélection fournisseur/modèle canonique et placer le backend d’exécution dans la stratégie d’exécution fournisseur/modèle.
- Cela contrôle uniquement l’exécution des tours d’agent texte. La génération multimédia, la vision, les PDF, la musique, la vidéo et la synthèse vocale utilisent toujours leurs paramètres fournisseur/modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle se trouve dans `agents.defaults.models`) :

| Alias               | Modèle                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Vos alias configurés prévalent toujours sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode de réflexion, sauf si vous définissez `--thinking off` ou `agents.defaults.models["zai/<model>"].params.thinking` vous-même.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Les modèles Anthropic Claude 4.6 utilisent par défaut la réflexion `adaptive` lorsqu’aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de repli en texte seul (sans appels d’outils). Utiles comme solution de secours lorsque les fournisseurs d’API échouent.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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

- Les backends CLI sont axés sur le texte ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- La transmission d’images est prise en charge lorsque `imageArg` accepte les chemins de fichiers.
- `reseedFromRawTranscriptWhenUncompacted: true` permet à un backend de récupérer des sessions invalidées sûres
  à partir d’une fin bornée de transcription OpenClaw brute avant que le
  premier résumé de Compaction n’existe. Les modifications de profil d’authentification ou d’époque d’identifiants
  ne réamorcent toutefois jamais à partir du brut.

### `agents.defaults.systemPromptOverride`

Remplace toute l’invite système assemblée par OpenClaw par une chaîne fixe. Définissez-la au niveau par défaut (`agents.defaults.systemPromptOverride`) ou par agent (`agents.list[].systemPromptOverride`). Les valeurs par agent sont prioritaires ; une valeur vide ou contenant uniquement des espaces est ignorée. Utile pour les expériences d’invite contrôlées.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Superpositions d’invite indépendantes du fournisseur, appliquées par famille de modèles. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé entre les fournisseurs ; `personality` ne contrôle que la couche de style d’interaction conviviale.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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
- `includeSystemPromptSection` : lorsque la valeur est false, omet la section Heartbeat de l’invite système et ignore l’injection de `HEARTBEAT.md` dans le contexte d’amorçage. Par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque la valeur est true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions de Heartbeat.
- `timeoutSeconds` : durée maximale en secondes autorisée pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds`.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque la valeur est true, les exécutions de Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsque la valeur est true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Même schéma d’isolation que Cron `sessionTarget: "isolated"`. Réduit le coût en jetons par Heartbeat d’environ 100 000 à environ 2 000 à 5 000 jetons.
- `skipWhenBusy` : lorsque la valeur est true, les exécutions de Heartbeat sont différées sur des voies occupées supplémentaires : travail de sous-agent ou commande imbriquée. Les voies Cron diffèrent toujours les Heartbeats, même sans cet indicateur.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- Les Heartbeats exécutent des tours d’agent complets : des intervalles plus courts consomment plus de jetons.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
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

- `mode` : `default` ou `safeguard` (résumé par fragments pour les longs historiques). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un Plugin fournisseur de Compaction enregistré. Lorsqu’il est défini, le `summarize()` du fournisseur est appelé à la place du résumé LLM intégré. Se rabat sur l’intégration en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisées pour une seule opération de Compaction avant qu’OpenClaw ne l’abandonne. Par défaut : `900`.
- `keepRecentTokens` : budget de point de coupure Pi pour conserver textuellement la fin la plus récente de la transcription. Le `/compact` manuel respecte cette valeur lorsqu’elle est explicitement définie ; sinon, la Compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` préfixe les indications intégrées de conservation des identifiants opaques pendant le résumé de Compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés de sauvegarde. Activé par défaut en mode sauvegarde ; définissez `enabled: false` pour ignorer l’audit.
- `midTurnPrecheck` : vérification facultative de la pression de boucle d’outils Pi. Lorsque `enabled: true`, OpenClaw vérifie la pression du contexte après l’ajout des résultats d’outils et avant l’appel de modèle suivant. Si le contexte ne tient plus, il abandonne la tentative en cours avant de soumettre l’invite et réutilise le chemin de récupération de prévérification existant pour tronquer les résultats d’outils ou compacter puis réessayer. Fonctionne avec les modes de Compaction `default` et `safeguard`. Par défaut : désactivé.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d’AGENTS.md à réinjecter après la Compaction. Par défaut : `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsqu’elle n’est pas définie ou explicitement définie sur cette paire par défaut, les anciens titres `Every Session`/`Safety` sont aussi acceptés comme solution de repli héritée.
- `model` : substitution facultative `provider/model-id` uniquement pour le résumé de Compaction. Utilisez-la lorsque la session principale doit conserver un modèle, mais que les résumés de Compaction doivent s’exécuter sur un autre ; lorsqu’elle n’est pas définie, la Compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une Compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une Compaction réussie puisse basculer vers une transcription successeur plus petite. Désactivé lorsque non défini ou `0`.
- `notifyUser` : lorsque `true`, envoie de brefs avis à l’utilisateur lorsque la Compaction commence et lorsqu’elle se termine (par exemple, « Compactage du contexte... » et « Compaction terminée »). Désactivé par défaut pour garder la Compaction silencieuse.
- `memoryFlush` : tour agentique silencieux avant la Compaction automatique pour stocker les souvenirs durables. Définissez `model` sur un fournisseur/modèle exact tel que `ollama/qwen3:8b` lorsque ce tour de maintenance doit rester sur un modèle local ; la substitution n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.runRetries`

Limites d’itérations de nouvelle tentative de la boucle d’exécution externe pour le runner Pi intégré, afin d’éviter les boucles d’exécution infinies pendant la récupération après échec. Notez que ce paramètre ne s’applique actuellement qu’au runtime d’agent intégré, et non aux runtimes ACP ou CLI.

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

- `base` : nombre de base d’itérations de nouvelle tentative d’exécution pour la boucle d’exécution externe. Par défaut : `24`.
- `perProfile` : itérations supplémentaires de nouvelle tentative d’exécution accordées par profil de repli candidat. Par défaut : `8`.
- `min` : limite absolue minimale des itérations de nouvelle tentative d’exécution. Par défaut : `32`.
- `max` : limite absolue maximale des itérations de nouvelle tentative d’exécution pour éviter une exécution hors de contrôle. Par défaut : `160`.

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
- L’élagage réduit d’abord les résultats d’outils surdimensionnés, puis efface complètement les anciens résultats d’outils si nécessaire.

**Réduction partielle** conserve le début + la fin et insère `...` au milieu.

**Effacement complet** remplace l’intégralité du résultat d’outil par le texte de remplacement.

Remarques :

- Les blocs d’images ne sont jamais réduits ni effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des nombres exacts de tokens.
- S’il existe moins de `keepLastAssistants` messages d’assistant, l’élagage est ignoré.

</Accordion>

Consultez [Élagage de session](/fr/concepts/session-pruning) pour les détails du comportement.

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
- Remplacements par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800 à 2500 ms. Remplacement par agent : `agents.list[].humanDelay`.

Consultez [Streaming](/fr/concepts/streaming) pour les détails de comportement et de découpage.

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
- Remplacements par session : `session.typingMode`, `session.typingIntervalSeconds`.

Consultez [Indicateurs de saisie](/fr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facultatif pour l’agent intégré. Consultez [Sandboxing](/fr/gateway/sandboxing) pour le guide complet.

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

Lorsque `backend: "openshell"` est sélectionné, les paramètres spécifiques au runtime passent dans
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les workspaces par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus intégrés ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : réglages de politique de clés d’hôte OpenSSH

**Priorité de l’authentification SSH :**

- `identityData` prévaut sur `identityFile`
- `certificateData` prévaut sur `certificateFile`
- `knownHostsData` prévaut sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues depuis l’instantané actif du runtime de secrets avant le démarrage de la session de sandbox

**Comportement du backend SSH :**

- amorce le workspace distant une fois après la création ou la recréation
- conserve ensuite le workspace SSH distant comme source canonique
- achemine `exec`, les outils de fichiers et les chemins média via SSH
- ne synchronise pas automatiquement les changements distants vers l’hôte
- ne prend pas en charge les conteneurs de navigateur sandboxés

**Accès au workspace :**

- `none` : workspace de sandbox par portée sous `~/.openclaw/sandboxes`
- `ro` : workspace de sandbox à `/workspace`, workspace de l’agent monté en lecture seule à `/agent`
- `rw` : workspace de l’agent monté en lecture/écriture à `/workspace`

**Portée :**

- `session` : conteneur + workspace par session
- `agent` : un conteneur + workspace par agent (par défaut)
- `shared` : conteneur et workspace partagés (sans isolation entre sessions)

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

- `mirror` : amorce le distant depuis le local avant exec, synchronise en retour après exec ; le workspace local reste canonique
- `remote` : amorce le distant une fois lorsque la sandbox est créée, puis conserve le workspace distant comme canonique

En mode `remote`, les modifications locales à l’hôte effectuées en dehors d’OpenClaw ne sont pas synchronisées automatiquement dans la sandbox après l’étape d’amorçage.
Le transport utilise SSH vers la sandbox OpenShell, mais le Plugin possède le cycle de vie de la sandbox et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine inscriptible et un utilisateur root.

**Les conteneurs utilisent par défaut `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (mesure d’urgence).

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` dans le workspace actif.

**`docker.binds`** monte des répertoires hôtes supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur sandboxé** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise l’authentification VNC par défaut et OpenClaw émet une URL à token de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions sandboxées de cibler le navigateur hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement lorsque vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` limite facultativement l’entrée CDP à la périphérie du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur de navigateur de sandbox. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur de navigateur.
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si l’utilisation de WebGL/3D l’exige.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` réactive les extensions si votre workflow
    en dépend.
  - `--renderer-process-limit=2` peut être modifié avec
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la
    limite de processus par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l’image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le sandboxing du navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Pour les installations npm sans checkout source, consultez [Sandboxing § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` intégrées.

### `agents.list` (remplacements par agent)

Utilisez `agents.list[].tts` pour attribuer à un agent son propre fournisseur TTS, sa voix, son modèle, son style ou son mode TTS automatique. Le bloc de l’agent fusionne en profondeur par-dessus le bloc global `messages.tts`, ce qui permet de conserver les identifiants partagés à un seul endroit tandis que les agents individuels ne remplacent que les champs de voix ou de fournisseur dont ils ont besoin. Le remplacement de l’agent actif s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et à l’outil d’agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides) pour des exemples de fournisseurs et l’ordre de précédence.

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default` : lorsque plusieurs sont définis, le premier l’emporte (avertissement journalisé). Si aucun n’est défini, la première entrée de la liste est celle par défaut.
- `model` : la forme chaîne définit un modèle primaire strict par agent sans modèle de secours ; la forme objet `{ primary }` est également stricte sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour inscrire cet agent au mécanisme de secours, ou `{ primary, fallbacks: [] }` pour rendre explicite le comportement strict. Les tâches Cron qui remplacent seulement `primary` héritent toujours des modèles de secours par défaut, sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée du modèle sélectionné dans `agents.defaults.models`. Utilisez cela pour des remplacements propres à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts` : remplacements facultatifs de synthèse vocale par agent. Le bloc fusionne en profondeur par-dessus `messages.tts` ; conservez donc les identifiants de fournisseur partagés et la stratégie de secours dans `messages.tts`, et définissez ici uniquement les valeurs propres au persona, comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d’autorisation facultative de Skills par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsque celui-ci est défini ; une liste explicite remplace les valeurs par défaut au lieu de les fusionner, et `[]` signifie aucune Skills.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil du fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique gérée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`true | false`). S’applique lorsqu’aucun remplacement de mode rapide par message ou par session n’est défini.
- `models` : remplacements facultatifs du catalogue de modèles/runtime par agent, indexés par des identifiants complets `provider/model`. Utilisez `models["provider/model"].agentRuntime` pour les exceptions de runtime par agent.
- `runtime` : descripteur de runtime facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive des valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des identifiants d’agents pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = n’importe lequel ; valeur par défaut : même agent uniquement). Incluez l’identifiant du demandeur lorsque les appels `agentId` ciblant l’agent lui-même doivent être autorisés.
- Garde d’héritage du bac à sable : si la session du demandeur est en bac à sable, `sessions_spawn` rejette les cibles qui s’exécuteraient hors bac à sable.
- `subagents.requireAgentId` : lorsque la valeur est vraie, bloque les appels `sessions_spawn` qui omettent `agentId` (impose une sélection explicite du profil ; valeur par défaut : false).

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

### Champs de correspondance des liaisons

- `type` (facultatif) : `route` pour le routage normal (un type absent vaut route par défaut), `acp` pour les liaisons de conversations ACP persistantes.
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

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre des niveaux de liaison de route ci-dessus.

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

Consultez [Bac à sable et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour les détails de précédence.

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
      mode: "warn", // warn | enforce
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

- **`scope`** : stratégie de regroupement de session de base pour les contextes de discussion de groupe.
  - `per-sender` (par défaut) : chaque expéditeur obtient une session isolée dans un contexte de canal.
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est voulu).
- **`dmScope`** : façon dont les messages directs sont regroupés.
  - `main` : tous les messages directs partagent la session principale.
  - `per-peer` : isole par identifiant d’expéditeur entre les canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour le multi-compte).
- **`identityLinks`** : associe les identifiants canoniques aux pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes Dock comme `/dock_discord` utilisent la même association pour basculer la route de réponse de la session active vers un autre pair de canal lié ; consultez [l’ancrage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, le premier à expirer l’emporte. La fraîcheur de la réinitialisation quotidienne utilise le `sessionStartedAt` de la ligne de session ; la fraîcheur de la réinitialisation sur inactivité utilise `lastInteractionAt`. Les écritures d’arrière-plan/événement système comme le Heartbeat, les réveils Cron, les notifications d’exécution et la comptabilité du Gateway peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas les sessions quotidiennes/sur inactivité fraîches.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`mainKey`** : champ hérité. À l’exécution, `"main"` est toujours utilisé pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse réciproque entre agents pendant les échanges agent à agent (entier, plage : `0`-`20`, par défaut : `5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’ancien alias `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage + rétention du magasin de sessions.
  - `mode` : `warn` émet uniquement des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`). À l’exécution, le nettoyage est écrit par lots avec une petite marge haute pour les plafonds de taille production ; `openclaw sessions cleanup --enforce` applique le plafond immédiatement.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>`. Par défaut, utilise `pruneAfter` ; définissez sur `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il journalise des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut, `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liées aux fils.
  - `enabled` : interrupteur principal par défaut (les fournisseurs peuvent remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : désactivation automatique par défaut après inactivité, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `maxAgeHours` : âge maximal dur par défaut, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `spawnSessions` : garde par défaut pour créer des sessions de travail liées aux fils depuis `sessions_spawn` et les créations de fils ACP. Par défaut à `true` lorsque les liaisons de fils sont activées ; les fournisseurs/comptes peuvent remplacer.
  - `defaultSpawnContext` : contexte de sous-agent natif par défaut pour les créations liées aux fils (`"fork"` ou `"isolated"`). Par défaut à `"fork"`.

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (ancien un-à-la-fois) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
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

Résolution (le plus spécifique l’emporte) : compte → canal → global. `""` désactive et arrête la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables de modèle :**

| Variable          | Description              | Exemple                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nom court du modèle      | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur       | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent | (identique à `"auto"`)      |

Les variables ne tiennent pas compte de la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé après la réponse sur les canaux prenant en charge les réactions, comme Slack, Discord, Telegram, WhatsApp et iMessage.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, une valeur non définie maintient les réactions d’état activées lorsque les réactions d’accusé sont actives.
  Sur Telegram, définissez explicitement sur `true` pour activer les réactions d’état du cycle de vie.

### Temporisation d’entrée

Regroupe les messages texte seuls envoyés rapidement par le même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent l’envoi immédiatement. Les commandes de contrôle contournent la temporisation.

### TTS (synthèse vocale)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
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
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
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
- Les fournisseurs vocaux inclus appartiennent aux Plugins. Si `plugins.allow` est défini, incluez chaque Plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison OpenAI TTS. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation du modèle/de la voix.

---

## Talk

Valeurs par défaut du mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
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
          voice: "cedar",
        },
      },
      instructions: "Parlez chaleureusement et gardez des réponses brèves.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs Talk sont configurés.
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existent uniquement pour la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée dans `talk.providers.<provider>`.
- Les identifiants de voix se replient sur `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte les chaînes en clair ou les objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé d’API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. Si omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX macOS passe par l’assistant inclus `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `consultThinkingLevel` contrôle le niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels Control UI Talk realtime `openclaw_agent_consult`. Laissez non défini pour préserver le comportement normal de session/modèle.
- `consultFastMode` définit un remplacement fast-mode ponctuel pour les consultations Control UI Talk realtime sans modifier le réglage fast-mode normal de la session.
- `speechLocale` définit l’identifiant de locale BCP 47 utilisé par la reconnaissance vocale Talk iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle la durée pendant laquelle le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Une valeur non définie conserve la fenêtre de pause par défaut de la plateforme (`700 ms sur macOS et Android, 900 ms sur iOS`).
- `realtime.instructions` ajoute des instructions système destinées au fournisseur au prompt realtime intégré d’OpenClaw, afin que le style vocal puisse être configuré sans perdre les consignes par défaut de `openclaw_agent_consult`.

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
