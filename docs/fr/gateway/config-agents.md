---
read_when:
    - Réglage des paramètres par défaut de l’agent (modèles, raisonnement, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage et des liaisons multi-agents
    - Ajuster le comportement des sessions, de la remise des messages et du mode conversation
summary: Paramètres par défaut des agents, routage multi-agent, sessions, messages et configuration de discussion
title: Configuration — agents
x-i18n:
    generated_at: "2026-05-07T13:16:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres à l’agent sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, l’exécution du Gateway et les autres
clés de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut des agents

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

- Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucun Skills.
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

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse d’assistant terminée) ignorent la réinjection de l’amorçage de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive l’amorçage de l’espace de travail et l’injection de fichiers de contexte à chaque tour. Utilisez cette option uniquement pour les agents qui possèdent entièrement le cycle de vie de leur prompt (moteurs de contexte personnalisés, environnements d’exécution natifs qui construisent leur propre contexte, ou workflows spécialisés sans amorçage). Les tours Heartbeat et de récupération après Compaction ignorent également l’injection.

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

Nombre total maximal de caractères injectés dans l’ensemble des fichiers d’amorçage de l’espace de travail. Par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle l’avis visible par l’agent dans le prompt système lorsque le contexte d’amorçage est tronqué.
Par défaut : `"once"`.

- `"off"` : n’injecte jamais de texte d’avis de troncature dans le prompt système.
- `"once"` : injecte un avis concis une seule fois par signature de troncature unique (recommandé).
- `"always"` : injecte un avis concis à chaque exécution lorsqu’une troncature existe.

Les décomptes bruts/injectés détaillés et les champs de réglage de configuration restent dans les diagnostics tels
que les rapports et journaux de contexte/statut ; le contexte utilisateur/exécution WebChat courant reçoit uniquement
l’avis concis de récupération.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Carte de propriété du budget de contexte

OpenClaw dispose de plusieurs budgets de prompt/contexte à volume élevé, et ils sont
intentionnellement répartis par sous-système au lieu de passer tous par un bouton
générique unique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale de l’amorçage de l’espace de travail.
- `agents.defaults.startupContext.*` :
  préambule ponctuel de réinitialisation/démarrage d’exécution de modèle, y compris les fichiers quotidiens récents
  `memory/*.md`. Les commandes de chat simples `/new` et `/reset` sont
  confirmées sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte de Skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits d’exécution bornés et blocs injectés appartenant à l’exécution.
- `memory.qmd.limits.*` :
  dimensionnement des extraits de recherche mémoire indexés et de l’injection.

Utilisez le remplacement correspondant par agent uniquement lorsqu’un agent a besoin d’un
budget différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage du premier tour injecté lors des exécutions de modèle de réinitialisation/démarrage.
Les commandes de chat simples `/new` et `/reset` confirment la réinitialisation sans invoquer
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

Valeurs par défaut partagées pour les surfaces de contexte d’exécution bornées.

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

- `memoryGetMaxChars` : plafond par défaut de l’extrait `memory_get` avant l’ajout des métadonnées de troncature
  et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond des résultats d’outil en direct utilisé pour les résultats persistés et
  la récupération après dépassement.
- `postCompactionMaxChars` : plafond d’extrait AGENTS.md utilisé lors de l’injection d’actualisation après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent pour les boutons partagés `contextLimits`. Les champs omis héritent
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

Plafond global pour la liste compacte de Skills injectée dans le prompt système. Cela
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

Remplacement par agent pour le budget de prompt des Skills.

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

Taille maximale en pixels du côté le plus long de l’image dans les blocs image de transcript/outil avant les appels au fournisseur.
Par défaut : `1200`.

Des valeurs plus basses réduisent généralement l’utilisation des jetons de vision et la taille de la charge utile des requêtes pour les exécutions riches en captures d’écran.
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
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - Utilisé par le chemin de l’outil `image` comme configuration de son modèle de vision.
  - Également utilisé comme routage de repli lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Préférez les références explicites `provider/model`. Les ID nus sont acceptés pour compatibilité ; si un ID nu correspond de manière unique à une entrée configurée compatible avec les images dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës exigent un préfixe de fournisseur explicite.
- `imageGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images Gemini native, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie PNG/WebP OpenAI avec arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification du fournisseur correspondante (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des ID de fournisseur.
- `musicGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Si omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l’ordre des ID de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé API du fournisseur correspondante.
- `videoGenerationModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Si omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des ID de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé API du fournisseur correspondante.
  - Le fournisseur de génération vidéo Qwen groupé prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel`: accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage du modèle.
  - Si omis, l’outil PDF se replie sur `imageModel`, puis sur le modèle de session/par défaut résolu.
- `pdfMaxBytesMb`: limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages`: nombre maximal de pages considéré par défaut par le mode de repli d’extraction dans l’outil `pdf`.
- `verboseDefault`: niveau verbeux par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `toolProgressDetail`: mode de détail pour les résumés d’outils `/verbose` et les lignes d’outils des brouillons de progression. Valeurs : `"explain"` (par défaut, libellés humains compacts) ou `"raw"` (ajoute la commande/le détail brut lorsque disponible). `agents.list[].toolProgressDetail` par agent remplace cette valeur par défaut.
- `reasoningDefault`: visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs de raisonnement par défaut configurées ne sont appliquées que pour les propriétaires, les expéditeurs autorisés ou les contextes Gateway administrateur-opérateur lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault`: niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary`: format `provider/model` (par ex. `openai/gpt-5.5` pour l’accès par clé API OpenAI ou Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ne se replie qu’ensuite sur le fournisseur par défaut configuré (comportement de compatibilité obsolète ; préférez donc `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se replie sur le premier fournisseur/modèle configuré au lieu de faire apparaître une valeur par défaut périmée de fournisseur supprimé.
- `models`: catalogue de modèles configuré et liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées de liste d’autorisation existantes, sauf si vous passez `--replace`.
  - Les flux de configuration/intégration limités à un fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette carte et préservent les fournisseurs non liés déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params`: paramètres globaux par défaut du fournisseur appliqués à tous les modèles. Définis dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Précédence de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (ID d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `params.extra_body`/`params.extraBody`: JSON de transmission avancée fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. En cas de collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de complétions non natives retirent toujours ensuite `store`, spécifique à OpenAI.
- `params.chat_template_kwargs`: arguments de modèle de chat compatibles vLLM/OpenAI fusionnés dans les corps de requête de niveau supérieur `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la réflexion désactivée, le plugin vLLM groupé envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` garde la priorité finale. Pour les contrôles de réflexion Qwen vLLM, définissez `params.qwenThinkingFormat` sur `"chat-template"` ou `"top-level"` dans cette entrée de modèle.
- `compat.supportedReasoningEfforts`: liste d’efforts de raisonnement compatibles OpenAI par modèle. Incluez `"xhigh"` pour les points de terminaison personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session Gateway, la validation des patchs de session, la validation de la CLI agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking`: opt-in propre à Z.AI pour la réflexion préservée. Lorsqu’il est activé et que la réflexion est activée, OpenClaw envoie `thinking.clear_thinking: false` et relit les `reasoning_content` précédents ; voir [Réflexion Z.AI et réflexion préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: politique par défaut de bas niveau d’exécution d’agent. Un ID omis vaut OpenClaw Pi par défaut. Utilisez `id: "pi"` pour forcer le harnais PI intégré, `id: "auto"` pour laisser les harnais de plugins enregistrés revendiquer les modèles pris en charge et utiliser PI lorsqu’aucun ne correspond, un ID de harnais enregistré comme `id: "codex"` pour exiger ce harnais, ou un alias de backend CLI pris en charge comme `id: "claude-cli"`. Les runtimes de plugins explicites échouent de manière fermée lorsque le harnais est indisponible ou échoue. Gardez les références de modèle canoniques sous la forme `provider/model` ; sélectionnez Codex, Claude CLI, Gemini CLI et d’autres backends d’exécution via la configuration de runtime plutôt qu’avec les anciens préfixes de fournisseur runtime. Voir [Runtimes d’agent](/fr/concepts/agent-runtimes) pour comprendre en quoi cela diffère de la sélection fournisseur/modèle.
- Les rédacteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de replis) enregistrent la forme objet canonique et préservent les listes de replis existantes lorsque possible.
- `maxConcurrent`: nombre maximal d’exécutions d’agents en parallèle entre sessions (chaque session reste sérialisée). Par défaut : 4.

### `agents.defaults.agentRuntime`

`agentRuntime` contrôle quel exécuteur de bas niveau exécute les tours d’agent. La plupart des
déploiements devraient conserver le runtime OpenClaw Pi par défaut. Utilisez-le lorsqu’un
plugin de confiance fournit un harnais natif, comme le harnais app-server Codex groupé,
ou lorsque vous voulez un backend CLI pris en charge comme Claude CLI. Pour le modèle
mental, voir [Runtimes d’agent](/fr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un ID de harnais de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex groupé enregistre `codex` ; le plugin Anthropic groupé fournit le backend CLI `claude-cli`.
- `id: "auto"` laisse les harnais de plugins enregistrés revendiquer les tours pris en charge et utilise PI lorsqu’aucun harnais ne correspond. Un runtime de plugin explicite comme `id: "codex"` exige ce harnais et échoue de manière fermée s’il est indisponible ou échoue.
- Remplacement par l’environnement : `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` remplace `id` pour ce processus.
- Les modèles d’agents OpenAI utilisent le harnais Codex par défaut ; `agentRuntime.id: "codex"` reste valide lorsque vous voulez le rendre explicite.
- Pour les déploiements Claude CLI, préférez `model: "anthropic/claude-opus-4-7"` avec `agentRuntime.id: "claude-cli"`. Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore pour compatibilité, mais les nouvelles configurations devraient garder la sélection fournisseur/modèle canonique et placer le backend d’exécution dans `agentRuntime.id`.
- Les anciennes clés de politique de runtime sont réécrites en `agentRuntime` par `openclaw doctor --fix`.
- Le choix du harnais est épinglé par ID de session après la première exécution intégrée. Les changements de configuration/d’environnement affectent les sessions nouvelles ou réinitialisées, pas une transcription existante. Les anciennes sessions OpenAI avec un historique de transcription mais sans épinglage enregistré utilisent Codex ; les épinglages PI OpenAI obsolètes peuvent être réparés avec `openclaw doctor --fix`. `/status` signale le runtime effectif, par exemple `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Cela contrôle uniquement l’exécution textuelle des tours d’agent. La génération de médias, la vision, les PDF, la musique, la vidéo et le TTS utilisent toujours leurs paramètres fournisseur/modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`) :

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

Vos alias configurés l’emportent toujours sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode réflexion, sauf si vous définissez `--thinking off` ou si vous définissez vous-même `agents.defaults.models["zai/<model>"].params.thinking`.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Les modèles Anthropic Claude 4.6 utilisent par défaut la réflexion `adaptive` quand aucun niveau de réflexion explicite n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de secours en texte seul (sans appels d’outils). Utiles comme solution de secours lorsque les fournisseurs d’API échouent.

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

- Les backends CLI privilégient le texte ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- La transmission directe d’images est prise en charge lorsque `imageArg` accepte les chemins de fichiers.

### `agents.defaults.systemPromptOverride`

Remplace l’intégralité du prompt système assemblé par OpenClaw par une chaîne fixe. Définissez-le au niveau par défaut (`agents.defaults.systemPromptOverride`) ou par agent (`agents.list[].systemPromptOverride`). Les valeurs par agent sont prioritaires ; une valeur vide ou composée uniquement d’espaces est ignorée. Utile pour des expériences de prompts contrôlées.

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

Superpositions de prompts indépendantes du fournisseur, appliquées par famille de modèles. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé entre fournisseurs ; `personality` contrôle uniquement la couche de style d’interaction conviviale.

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

- `every` : chaîne de durée (ms/s/m/h). Par défaut : `30m` (authentification par clé d’API) ou `1h` (authentification OAuth). Définissez sur `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque la valeur est false, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte d’amorçage. Par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque la valeur est true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions de Heartbeat.
- `timeoutSeconds` : temps maximal en secondes autorisé pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds`.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison à une cible directe. `block` supprime la livraison à une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque la valeur est true, les exécutions de Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsque la valeur est true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation précédent. Même schéma d’isolation que le Cron `sessionTarget: "isolated"`. Réduit le coût en tokens par Heartbeat d’environ 100 K à environ 2 à 5 K tokens.
- `skipWhenBusy` : lorsque la valeur est true, les exécutions de Heartbeat sont différées sur des voies occupées supplémentaires : travail de sous-agent ou de commande imbriquée. Les voies Cron différent toujours les Heartbeat, même sans ce drapeau.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeat.
- Les Heartbeat exécutent des tours d’agent complets — des intervalles plus courts consomment plus de tokens.

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

- `mode` : `default` ou `safeguard` (résumé par morceaux pour les longs historiques). Consultez [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un Plugin fournisseur de compaction enregistré. Lorsqu’il est défini, le `summarize()` du fournisseur est appelé au lieu du résumé LLM intégré. Repli vers l’intégration en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Consultez [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisées pour une seule opération de compaction avant qu’OpenClaw ne l’abandonne. Par défaut : `900`.
- `keepRecentTokens` : budget de point de coupure Pi pour conserver mot pour mot la fin la plus récente du transcript. Le `/compact` manuel respecte cette valeur lorsqu’elle est explicitement définie ; sinon la compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` préfixe les consignes intégrées de conservation des identifiants opaques pendant le résumé de compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative en cas de sortie mal formée pour les résumés de sauvegarde. Activé par défaut en mode sauvegarde ; définissez `enabled: false` pour ignorer l’audit.
- `midTurnPrecheck` : vérification facultative de pression de boucle d’outils Pi. Lorsque `enabled: true`, OpenClaw vérifie la pression du contexte après l’ajout des résultats d’outils et avant l’appel suivant au modèle. Si le contexte ne tient plus, il abandonne la tentative en cours avant de soumettre le prompt et réutilise le chemin de récupération de pré-vérification existant pour tronquer les résultats d’outils ou compacter puis réessayer. Fonctionne avec les modes de compaction `default` et `safeguard`. Par défaut : désactivé.
- `postCompactionSections` : noms facultatifs de sections H2/H3 d’AGENTS.md à réinjecter après la compaction. La valeur par défaut est `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsque la valeur n’est pas définie ou est explicitement définie sur cette paire par défaut, les anciens titres `Every Session`/`Safety` sont également acceptés comme repli hérité.
- `model` : remplacement facultatif `provider/model-id` uniquement pour le résumé de compaction. Utilisez-le lorsque la session principale doit conserver un modèle, mais que les résumés de compaction doivent s’exécuter sur un autre ; lorsqu’il n’est pas défini, la compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une compaction réussie puisse effectuer une rotation vers un transcript successeur plus petit. Désactivé lorsque non défini ou `0`.
- `notifyUser` : lorsque `true`, envoie de brèves notifications à l’utilisateur au début et à la fin de la compaction (par exemple, « Compactage du contexte... » et « Compaction terminée »). Désactivé par défaut pour que la compaction reste silencieuse.
- `memoryFlush` : tour agentique silencieux avant la compaction automatique pour stocker des souvenirs durables. Définissez `model` sur un fournisseur/modèle exact comme `ollama/qwen3:8b` lorsque ce tour d’entretien doit rester sur un modèle local ; le remplacement n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

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
- `ttl` contrôle la fréquence à laquelle l’élagage peut être relancé (après le dernier accès au cache).
- L’élagage commence par raccourcir en douceur les résultats d’outils surdimensionnés, puis efface plus fortement les anciens résultats d’outils si nécessaire.

**Raccourcissement doux** conserve le début + la fin et insère `...` au milieu.

**Effacement fort** remplace l’intégralité du résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’images ne sont jamais raccourcis/effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des décomptes exacts de tokens.
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
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500 ms. Remplacement par agent : `agents.list[].humanDelay`.

Consultez [Streaming](/fr/concepts/streaming) pour les détails du comportement et du découpage.

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
- Remplacements par session : `session.typingMode`, `session.typingIntervalSeconds`.

Consultez [Indicateurs de saisie](/fr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Mise en bac à sable facultative pour l’agent intégré. Consultez [Mise en bac à sable](/fr/gateway/sandboxing) pour le guide complet.

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

<Accordion title="Détails de la mise en bac à sable">

**Backend :**

- `docker` : environnement d’exécution Docker local (par défaut)
- `ssh` : environnement d’exécution distant générique basé sur SSH
- `openshell` : environnement d’exécution OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres à l’environnement d’exécution passent dans
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus en ligne ou SecretRefs qu’OpenClaw matérialise dans des fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : réglages de la politique de clés d’hôte OpenSSH

**Priorité d’authentification SSH :**

- `identityData` prévaut sur `identityFile`
- `certificateData` prévaut sur `certificateFile`
- `knownHostsData` prévaut sur `knownHostsFile`
- Les valeurs `*Data` basées sur SecretRef sont résolues depuis l’instantané actif de l’environnement d’exécution des secrets avant le démarrage de la session de bac à sable

**Comportement du backend SSH :**

- initialise une fois l’espace de travail distant après création ou recréation
- conserve ensuite l’espace de travail SSH distant comme référence canonique
- achemine `exec`, les outils de fichiers et les chemins de médias via SSH
- ne synchronise pas automatiquement les changements distants vers l’hôte
- ne prend pas en charge les conteneurs de navigateur en bac à sable

**Accès à l’espace de travail :**

- `none` : espace de travail de bac à sable par portée sous `~/.openclaw/sandboxes`
- `ro` : espace de travail de bac à sable dans `/workspace`, espace de travail de l’agent monté en lecture seule dans `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture dans `/workspace`

**Portée :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (aucune isolation entre sessions)

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

- `mirror` : initialise le distant depuis le local avant l’exécution, puis resynchronise après l’exécution ; l’espace de travail local reste canonique
- `remote` : initialise le distant une fois lorsque le bac à sable est créé, puis conserve l’espace de travail distant comme référence canonique

En mode `remote`, les modifications locales côté hôte effectuées hors d’OpenClaw ne sont pas synchronisées automatiquement dans le bac à sable après l’étape d’initialisation.
Le transport se fait en SSH vers le bac à sable OpenShell, mais le Plugin possède le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine inscriptible et un utilisateur root.

**Par défaut, les conteneurs utilisent `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut, sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (procédure d’urgence).

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise l’authentification VNC par défaut et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement lorsque vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` limite éventuellement l’entrée CDP au bord du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du navigateur en bac à sable. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
- Les paramètres de lancement par défaut sont définis dans `scripts/sandbox-browser-entrypoint.sh` et adaptés aux hôtes de conteneurs :
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
  - Les valeurs par défaut sont la base de l’image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

La mise en bac à sable du navigateur et `sandbox.docker.binds` sont propres à Docker.

Construire les images (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Pour les installations npm sans checkout source, consultez [Mise en bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

### `agents.list` (remplacements par agent)

Utilisez `agents.list[].tts` pour donner à un agent son propre fournisseur TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc de l’agent est fusionné en profondeur avec
`messages.tts`, ce qui permet de conserver les identifiants partagés à un seul endroit tandis que les agents
individuels ne remplacent que les champs de voix ou de fournisseur dont ils ont besoin. Le remplacement de l’agent actif
s’applique aux réponses parlées automatiques, à `/tts audio`, à `/tts status` et à
l’outil d’agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
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
        agentRuntime: { id: "auto" },
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

- `id`: identifiant d’agent stable (obligatoire).
- `default`: lorsque plusieurs sont définis, le premier l’emporte (avertissement journalisé). Si aucun n’est défini, la première entrée de la liste est la valeur par défaut.
- `model`: la forme chaîne définit un primaire strict par agent sans modèle de secours ; la forme objet `{ primary }` est également stricte sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour activer le secours pour cet agent, ou `{ primary, fallbacks: [] }` pour rendre le comportement strict explicite. Les tâches Cron qui remplacent seulement `primary` héritent toujours des modèles de secours par défaut sauf si vous définissez `fallbacks: []`.
- `params`: paramètres de flux par agent fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour des remplacements propres à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts`: remplacements optionnels de synthèse vocale par agent. Le bloc est fusionné en profondeur par-dessus `messages.tts`, donc conservez les identifiants du fournisseur partagés et la politique de secours dans `messages.tts`, et définissez ici uniquement les valeurs propres à la persona comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills`: liste d’autorisation optionnelle de compétences par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsqu’il est défini ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucune compétence.
- `thinkingDefault`: niveau de réflexion par défaut optionnel par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique gérée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault`: visibilité du raisonnement par défaut optionnelle par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `fastModeDefault`: valeur par défaut optionnelle par agent pour le mode rapide (`true | false`). S’applique lorsqu’aucun remplacement du mode rapide par message ou par session n’est défini.
- `agentRuntime`: remplacement optionnel de politique d’exécution bas niveau par agent. Utilisez `{ id: "codex" }` pour rendre un agent réservé à Codex tandis que les autres agents conservent le secours PI par défaut en mode `auto`.
- `runtime`: descripteur d’exécution optionnel par agent. Utilisez `type: "acp"` avec les valeurs par défaut de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar`: chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive les valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents`: liste d’autorisation d’identifiants d’agent pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = n’importe lequel ; valeur par défaut : même agent uniquement). Incluez l’identifiant du demandeur lorsque les appels `agentId` auto-ciblés doivent être autorisés.
- Garde d’héritage du bac à sable : si la session du demandeur est en bac à sable, `sessions_spawn` rejette les cibles qui s’exécuteraient hors bac à sable.
- `subagents.requireAgentId`: lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite du profil ; valeur par défaut : faux).

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

- `type` (optionnel) : `route` pour le routage normal (un type absent vaut route par défaut), `acp` pour les liaisons de conversation ACP persistantes.
- `match.channel` (obligatoire)
- `match.accountId` (optionnel ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (optionnel ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optionnel ; propre au canal)
- `acp` (optionnel ; uniquement pour `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans pair/guilde/équipe)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité de conversation exacte (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre des niveaux de liaison de route ci-dessus.

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

Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour connaître les détails de précédence.

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
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement quand un contexte partagé est souhaité).
- **`dmScope`** : manière dont les messages privés sont regroupés.
  - `main` : tous les messages privés partagent la session principale.
  - `per-peer` : isolation par identifiant d’expéditeur entre les canaux.
  - `per-channel-peer` : isolation par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isolation par compte + canal + expéditeur (recommandé pour les configurations multicomptes).
- **`identityLinks`** : associe des identifiants canoniques à des pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes de rattachement telles que `/dock_discord` utilisent la même association pour faire basculer la route de réponse de la session active vers un autre pair de canal lié ; consultez [Rattachement de canal](/fr/concepts/channel-docking).
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Quand les deux sont configurés, le premier délai expiré l’emporte. La fraîcheur de la réinitialisation quotidienne utilise le `sessionStartedAt` de la ligne de session ; la fraîcheur de la réinitialisation sur inactivité utilise `lastInteractionAt`. Les écritures en arrière-plan ou d’événements système, comme Heartbeat, les réveils Cron, les notifications exec et la tenue des registres Gateway, peuvent mettre à jour `updatedAt`, mais elles ne gardent pas les sessions quotidiennes/inactives fraîches.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`mainKey`** : champ hérité. L’exécution utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents pendant les échanges agent-à-agent (entier, plage : `0`–`5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’alias hérité `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : nettoyage du magasin de sessions et contrôles de rétention.
  - `mode` : `warn` émet uniquement des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (`30d` par défaut).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (`500` par défaut). L’exécution écrit le nettoyage par lot avec une petite marge haute pour les limites de taille de production ; `openclaw sessions cleanup --enforce` applique la limite immédiatement.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>`. Utilise `pruneAfter` par défaut ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire des sessions. En mode `warn`, il consigne des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage lié au budget. Vaut par défaut `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liées à un fil.
  - `enabled` : commutateur maître par défaut (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : désépinglage automatique par défaut après inactivité, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `maxAgeHours` : âge maximal absolu par défaut, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `spawnSessions` : garde par défaut pour la création de sessions de travail liées à un fil à partir de `sessions_spawn` et des créations de fil ACP. Vaut `true` par défaut quand les liaisons de fil sont activées ; les fournisseurs/comptes peuvent remplacer.
  - `defaultSpawnContext` : contexte de sous-agent natif par défaut pour les créations liées à un fil (`"fork"` ou `"isolated"`). Vaut par défaut `"fork"`.

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
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
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

| Variable          | Description                  | Exemple                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nom court du modèle          | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur           | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel   | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent    | (identique à `"auto"`)      |

Les variables sont insensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → repli sur l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé de réception après la réponse sur les canaux prenant en charge les réactions, comme Slack, Discord, Telegram, WhatsApp et BlueBubbles.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, une valeur non définie conserve les réactions d’état activées lorsque les réactions d’accusé de réception sont actives.
  Sur Telegram, définissez-la explicitement sur `true` pour activer les réactions d’état du cycle de vie.

### Débounce entrant

Regroupe les messages rapides contenant uniquement du texte envoyés par le même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent un envoi immédiat. Les commandes de contrôle contournent le débounce.

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

- `auto` contrôle le mode TTS automatique par défaut : `off`, `always`, `inbound` ou `tagged`. `/tts on|off` peut remplacer les préférences locales, et `/tts status` affiche l’état effectif.
- `summaryModel` remplace `agents.defaults.model.primary` pour le résumé automatique.
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut `false` par défaut (opt-in).
- Les clés d’API se replient sur `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs vocaux groupés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque Plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien id de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs Talk sont configurés.
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) servent uniquement à la compatibilité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée dans `talk.providers.<provider>`.
- Les ID de voix se replient sur `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte les chaînes en clair ou les objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé d’API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. S’il est omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX macOS passe par l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `speechLocale` définit l’id de locale BCP 47 utilisé par la reconnaissance vocale Talk iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle la durée pendant laquelle le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Une valeur non définie conserve la fenêtre de pause par défaut de la plateforme (`700 ms sur macOS et Android, 900 ms sur iOS`).

---

## Liens associés

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
