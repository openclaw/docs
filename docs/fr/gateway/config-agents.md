---
read_when:
    - Réglage des valeurs par défaut des agents (modèles, raisonnement, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage et des liaisons multi-agent
    - Ajustement du comportement de session, de distribution des messages et du mode conversation
summary: Valeurs par défaut de l’agent, routage multi-agent, session, messages et configuration talk
title: Configuration — agents
x-i18n:
    generated_at: "2026-04-30T07:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61f2d33ae1d3f4ce07636ae4584b9e344fd14e8e08a2612bb1f39ed71c99c25a
    source_path: gateway/config-agents.md
    workflow: 16
---

Clés de configuration propres aux agents sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, outils, runtime Gateway et autres
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

Racine de dépôt facultative affichée dans la ligne Runtime du prompt système. Si elle n’est pas définie, OpenClaw la détecte automatiquement en remontant depuis le workspace.

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

- Omettez `agents.defaults.skills` pour des Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’autoriser aucune Skills.
- Une liste `agents.list[].skills` non vide est l’ensemble final pour cet agent ; elle
  n’est pas fusionnée avec les valeurs par défaut.

### `agents.defaults.skipBootstrap`

Désactive la création automatique des fichiers de bootstrap du workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Contrôle quand les fichiers de bootstrap du workspace sont injectés dans le prompt système. Par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse assistant terminée) ignorent la réinjection du bootstrap du workspace, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive le bootstrap du workspace et l’injection de fichiers de contexte à chaque tour. À utiliser uniquement pour les agents qui maîtrisent entièrement le cycle de vie de leur prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte, ou workflows spécialisés sans bootstrap). Les tours Heartbeat et de récupération après Compaction ignorent aussi l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier de bootstrap du workspace avant troncature. Par défaut : `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Nombre total maximal de caractères injectés pour l’ensemble des fichiers de bootstrap du workspace. Par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle le texte d’avertissement visible par l’agent lorsque le contexte de bootstrap est tronqué.
Par défaut : `"once"`.

- `"off"` : n’injecte jamais de texte d’avertissement dans le prompt système.
- `"once"` : injecte l’avertissement une fois par signature de troncature unique (recommandé).
- `"always"` : injecte l’avertissement à chaque exécution lorsqu’une troncature existe.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw possède plusieurs budgets de prompt/contexte à volume élevé, et ils sont
intentionnellement répartis par sous-système au lieu de tous passer par un seul
réglage générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection normale du bootstrap du workspace.
- `agents.defaults.startupContext.*` :
  préambule ponctuel d’exécution du modèle au reset/démarrage, incluant les fichiers
  `memory/*.md` quotidiens récents. Les commandes de chat nues `/new` et `/reset` sont
  acquittées sans invoquer le modèle.
- `skills.limits.*` :
  la liste compacte des Skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits runtime bornés et blocs injectés appartenant au runtime.
- `memory.qmd.limits.*` :
  extrait de recherche mémoire indexée et dimensionnement de l’injection.

Utilisez le remplacement correspondant par agent uniquement lorsqu’un agent a besoin d’un budget différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le préambule de démarrage de premier tour injecté lors des exécutions du modèle au reset/démarrage.
Les commandes de chat nues `/new` et `/reset` acquittent le reset sans invoquer
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
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars` : plafond par défaut de l’extrait `memory_get` avant l’ajout
  des métadonnées de troncature et de l’avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut de `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond de résultat d’outil en direct utilisé pour les résultats persistés et
  la récupération après dépassement.
- `postCompactionMaxChars` : plafond d’extrait AGENTS.md utilisé pendant l’injection
  de rafraîchissement après Compaction.

#### `agents.list[].contextLimits`

Remplacement par agent pour les réglages `contextLimits` partagés. Les champs omis héritent
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

Plafond global pour la liste compacte des Skills injectée dans le prompt système. Cela
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

Taille maximale en pixels du côté le plus long de l’image dans les blocs image de transcript/outil avant les appels fournisseur.
Par défaut : `1200`.

Des valeurs plus faibles réduisent généralement l’utilisation de tokens de vision et la taille de la charge utile des requêtes pour les exécutions avec beaucoup de captures d’écran.
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
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - Également utilisé comme routage de secours lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
  - Privilégiez les références explicites `provider/model`. Les identifiants nus sont acceptés par compatibilité ; si un identifiant nu correspond de manière unique à une entrée configurée compatible avec les images dans `models.providers.*.models`, OpenClaw le qualifie avec ce fournisseur. Les correspondances configurées ambiguës exigent un préfixe de fournisseur explicite.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et par toute future surface d’outil/plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images native Gemini, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour la sortie PNG/WebP OpenAI à arrière-plan transparent.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification du fournisseur correspondant (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - S’il est omis, `image_generate` peut quand même déduire une valeur par défaut de fournisseur appuyée par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération de musique et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - S’il est omis, `music_generate` peut quand même déduire une valeur par défaut de fournisseur appuyée par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - S’il est omis, `video_generate` peut quand même déduire une valeur par défaut de fournisseur appuyée par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des identifiants de fournisseur.
  - Si vous sélectionnez directement un fournisseur/modèle, configurez aussi l’authentification/la clé d’API du fournisseur correspondant.
  - Le fournisseur de génération vidéo Qwen inclus prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes et les options de niveau fournisseur `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage de modèle.
  - S’il est omis, l’outil PDF se rabat sur `imageModel`, puis sur le modèle résolu de session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas transmis au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages par défaut prises en compte par le mode de secours d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau détaillé par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `reasoningDefault` : visibilité du raisonnement par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` par agent remplace cette valeur par défaut. Les valeurs de raisonnement par défaut configurées ne sont appliquées que pour les propriétaires, les expéditeurs autorisés ou les contextes Gateway d’administrateur opérateur lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par ex. `openai/gpt-5.5` pour l’accès par clé d’API ou `openai-codex/gpt-5.5` pour Codex OAuth). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant exact de modèle, et seulement ensuite se rabat sur le fournisseur par défaut configuré (comportement de compatibilité obsolète, donc privilégiez `provider/model` explicite). Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se rabat sur le premier fournisseur/modèle configuré au lieu d’afficher une valeur par défaut obsolète de fournisseur supprimé.
- `models` : le catalogue de modèles configuré et la liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au fournisseur, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation, sauf si vous passez `--replace`.
  - Les flux de configuration/d’intégration à portée fournisseur fusionnent les modèles de fournisseur sélectionnés dans cette carte et préservent les fournisseurs sans lien déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour arrêter l’injection de `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres globaux par défaut de fournisseur appliqués à tous les modèles. Définis dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Priorité de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (identifiant d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour plus de détails.
- `params.extra_body`/`params.extraBody` : JSON de transmission avancée fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. S’il entre en collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de completions non natives retirent quand même ensuite le champ OpenAI seul `store`.
- `params.chat_template_kwargs` : arguments de modèle de chat compatibles vLLM/OpenAI fusionnés dans les corps de requête de premier niveau `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec la réflexion désactivée, le plugin vLLM inclus envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; les `chat_template_kwargs` explicites remplacent les valeurs par défaut générées, et `extra_body.chat_template_kwargs` conserve la priorité finale. Pour les contrôles de réflexion Qwen vLLM, définissez `params.qwenThinkingFormat` sur `"chat-template"` ou `"top-level"` dans cette entrée de modèle.
- `compat.supportedReasoningEfforts` : liste d’efforts de raisonnement compatibles OpenAI par modèle. Incluez `"xhigh"` pour les points de terminaison personnalisés qui l’acceptent réellement ; OpenClaw expose alors `/think xhigh` dans les menus de commandes, les lignes de session Gateway, la validation des correctifs de session, la validation CLI d’agent et la validation `llm-task` pour ce fournisseur/modèle configuré. Utilisez `compat.reasoningEffortMap` lorsque le backend attend une valeur propre au fournisseur pour un niveau canonique.
- `params.preserveThinking` : option d’adhésion Z.AI uniquement pour la réflexion préservée. Lorsqu’elle est activée et que la réflexion est active, OpenClaw envoie `thinking.clear_thinking: false` et rejoue le `reasoning_content` précédent ; voir [Réflexion Z.AI et réflexion préservée](/fr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime` : politique par défaut de bas niveau pour le runtime d’agent. Un identifiant omis utilise par défaut OpenClaw Pi. Utilisez `id: "pi"` pour forcer le harnais PI intégré, `id: "auto"` pour laisser les harnais de plugin enregistrés réclamer les modèles pris en charge, un identifiant de harnais enregistré tel que `id: "codex"`, ou un alias de backend CLI pris en charge tel que `id: "claude-cli"`. Définissez `fallback: "none"` pour désactiver le secours automatique vers PI. Les runtimes de plugin explicites tels que `codex` échouent de manière fermée par défaut, sauf si vous définissez `fallback: "pi"` dans la même portée de remplacement. Gardez les références de modèle canoniques sous la forme `provider/model` ; sélectionnez Codex, Claude CLI, Gemini CLI et les autres backends d’exécution via la configuration du runtime plutôt que via les anciens préfixes de fournisseur de runtime. Voir [Runtimes d’agent](/fr/concepts/agent-runtimes) pour comprendre la différence avec la sélection fournisseur/modèle.
- Les rédacteurs de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de secours) enregistrent la forme d’objet canonique et préservent les listes de secours existantes lorsque c’est possible.
- `maxConcurrent` : nombre maximal d’exécutions d’agent parallèles entre les sessions (chaque session reste sérialisée). Par défaut : 4.

### `agents.defaults.agentRuntime`

`agentRuntime` contrôle quel exécuteur de bas niveau exécute les tours d’agent. La plupart
des déploiements devraient conserver le runtime OpenClaw Pi par défaut. Utilisez-le lorsqu’un
plugin de confiance fournit un harnais natif, comme le harnais de serveur d’application Codex inclus,
ou lorsque vous voulez un backend CLI pris en charge comme Claude CLI. Pour le modèle mental,
voir [Runtimes d’agent](/fr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id` : `"auto"`, `"pi"`, un identifiant de harnais de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex inclus enregistre `codex` ; le plugin Anthropic inclus fournit le backend CLI `claude-cli`.
- `fallback` : `"pi"` ou `"none"`. Dans `id: "auto"`, le secours omis utilise par défaut `"pi"` afin que les anciennes configurations puissent continuer à utiliser PI lorsqu’aucun harnais de plugin ne réclame une exécution. En mode runtime de plugin explicite, comme `id: "codex"`, le secours omis utilise par défaut `"none"` afin qu’un harnais manquant échoue au lieu d’utiliser silencieusement PI. Les remplacements de runtime n’héritent pas du secours d’une portée plus large ; définissez `fallback: "pi"` à côté du runtime explicite lorsque vous voulez intentionnellement ce secours de compatibilité. Les échecs du harnais de plugin sélectionné sont toujours affichés directement.
- Remplacements d’environnement : `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` remplace `id` ; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` remplace le secours pour ce processus.
- Pour les déploiements Codex uniquement, définissez `model: "openai/gpt-5.5"` et `agentRuntime.id: "codex"`. Vous pouvez aussi définir explicitement `agentRuntime.fallback: "none"` pour plus de lisibilité ; c’est la valeur par défaut pour les runtimes de plugin explicites.
- Pour les déploiements Claude CLI, privilégiez `model: "anthropic/claude-opus-4-7"` avec `agentRuntime.id: "claude-cli"`. Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore par compatibilité, mais les nouvelles configurations devraient garder la sélection fournisseur/modèle canonique et placer le backend d’exécution dans `agentRuntime.id`.
- Les anciennes clés de politique de runtime sont réécrites en `agentRuntime` par `openclaw doctor --fix`.
- Le choix du harnais est épinglé par identifiant de session après la première exécution intégrée. Les changements de configuration/d’environnement affectent les sessions nouvelles ou réinitialisées, pas une transcription existante. Les anciennes sessions avec un historique de transcription mais sans épingle enregistrée sont traitées comme épinglées à PI. `/status` indique le runtime effectif, par exemple `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Cela contrôle uniquement l’exécution des tours d’agent textuels. La génération de médias, la vision, les PDF, la musique, la vidéo et le TTS utilisent toujours leurs paramètres fournisseur/modèle.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`)

| Alias               | Modèle                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` ou `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode de réflexion, sauf si vous définissez `--thinking off` ou si vous définissez vous-même `agents.defaults.models["zai/<model>"].params.thinking`.
Les modèles Z.AI activent `tool_stream` par défaut pour la diffusion des appels d’outils. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
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

- Les backends CLI privilégient le texte ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- Le relais des images est pris en charge lorsque `imageArg` accepte des chemins de fichiers.

### `agents.defaults.systemPromptOverride`

Remplace l’intégralité du prompt système assemblé par OpenClaw par une chaîne fixe. Définissez-le au niveau par défaut (`agents.defaults.systemPromptOverride`) ou par agent (`agents.list[].systemPromptOverride`). Les valeurs propres à un agent sont prioritaires ; une valeur vide ou composée uniquement d’espaces est ignorée. Utile pour des expériences contrôlées sur les prompts.

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

Superpositions de prompt indépendantes du fournisseur, appliquées par famille de modèles. Les identifiants de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé entre les fournisseurs ; `personality` contrôle uniquement la couche de style d’interaction convivial.

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

- `"friendly"` (par défaut) et `"on"` activent la couche de style d’interaction convivial.
- `"off"` désactive uniquement la couche conviviale ; le contrat de comportement GPT-5 balisé reste activé.
- L’ancien `plugins.entries.openai.config.personality` est toujours lu lorsque ce paramètre partagé n’est pas défini.

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

- `every` : chaîne de durée (ms/s/m/h). Valeur par défaut : `30m` (authentification par clé API) ou `1h` (authentification OAuth). Définissez `0m` pour désactiver.
- `includeSystemPromptSection` : lorsqu’il vaut false, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte d’amorçage. Valeur par défaut : `true`.
- `suppressToolErrorWarnings` : lorsqu’il vaut true, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : temps maximal en secondes autorisé pour un tour d’agent Heartbeat avant son abandon. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds`.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsqu’il vaut true, les exécutions Heartbeat utilisent un contexte d’amorçage léger et ne conservent que `HEARTBEAT.md` parmi les fichiers d’amorçage de l’espace de travail.
- `isolatedSession` : lorsqu’il vaut true, chaque Heartbeat s’exécute dans une nouvelle session sans historique de conversation antérieur. Même modèle d’isolation que le cron `sessionTarget: "isolated"`. Réduit le coût en jetons par Heartbeat d’environ 100K à environ 2-5K jetons.
- `skipWhenBusy` : lorsqu’il vaut true, les exécutions Heartbeat sont différées sur des voies occupées supplémentaires : travail de sous-agent ou de commande imbriquée. Les voies Cron différent toujours les Heartbeats, même sans cet indicateur.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent définit `heartbeat`, **seuls ces agents** exécutent des Heartbeats.
- Les Heartbeats exécutent des tours d’agent complets — des intervalles plus courts consomment davantage de jetons.

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

- `mode` : `default` ou `safeguard` (résumé par fragments pour les historiques longs). Voir [Compaction](/fr/concepts/compaction).
- `provider` : identifiant d’un Plugin de fournisseur de compaction enregistré. Lorsqu’il est défini, la méthode `summarize()` du fournisseur est appelée à la place du résumé LLM intégré. Bascule vers le mécanisme intégré en cas d’échec. Définir un fournisseur force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une opération de compaction unique avant qu’OpenClaw ne l’abandonne. Valeur par défaut : `900`.
- `keepRecentTokens` : budget de point de coupure Pi pour conserver textuellement la fin la plus récente de la transcription. La commande manuelle `/compact` respecte ce paramètre lorsqu’il est explicitement défini ; sinon, la compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` ajoute en préfixe les consignes intégrées de conservation des identifiants opaques pendant le résumé de compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : contrôles de nouvelle tentative en cas de sortie mal formée pour les résumés de sauvegarde. Activé par défaut en mode safeguard ; définissez `enabled: false` pour ignorer l’audit.
- `postCompactionSections` : noms facultatifs de sections H2/H3 AGENTS.md à réinjecter après la compaction. Valeur par défaut : `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsque ce paramètre n’est pas défini ou est explicitement défini sur cette paire par défaut, les anciens titres `Every Session`/`Safety` sont également acceptés comme repli hérité.
- `model` : remplacement facultatif `provider/model-id` uniquement pour le résumé de compaction. Utilisez-le lorsque la session principale doit conserver un modèle, mais que les résumés de compaction doivent s’exécuter sur un autre ; lorsqu’il n’est pas défini, la compaction utilise le modèle principal de la session.
- `maxActiveTranscriptBytes` : seuil facultatif en octets (`number` ou chaînes comme `"20mb"`) qui déclenche une compaction locale normale avant une exécution lorsque le JSONL actif dépasse le seuil. Nécessite `truncateAfterCompaction` afin qu’une compaction réussie puisse faire pivoter vers une transcription successeure plus petite. Désactivé lorsqu’il n’est pas défini ou vaut `0`.
- `notifyUser` : lorsqu’il vaut `true`, envoie de brèves notifications à l’utilisateur au début et à la fin de la compaction (par exemple, « Compactage du contexte... » et « Compaction terminée »). Désactivé par défaut afin de garder la compaction silencieuse.
- `memoryFlush` : tour agentique silencieux avant la compaction automatique pour stocker les mémoires durables. Définissez `model` sur un fournisseur/modèle exact tel que `ollama/qwen3:8b` lorsque ce tour de maintenance doit rester sur un modèle local ; le remplacement n’hérite pas de la chaîne de repli de la session active. Ignoré lorsque l’espace de travail est en lecture seule.

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

<Accordion title="comportement du mode cache-ttl">

- `mode: "cache-ttl"` active les passes d’élagage.
- `ttl` contrôle la fréquence à laquelle l’élagage peut s’exécuter de nouveau (après le dernier accès au cache).
- L’élagage tronque d’abord de façon souple les résultats d’outils surdimensionnés, puis efface complètement les anciens résultats d’outils si nécessaire.

**Troncature souple** conserve le début et la fin, et insère `...` au milieu.

**Effacement complet** remplace l’intégralité du résultat d’outil par l’espace réservé.

Notes :

- Les blocs d’images ne sont jamais tronqués ni effacés.
- Les ratios sont basés sur les caractères (approximatifs), et non sur des nombres exacts de jetons.
- Si moins de `keepLastAssistants` messages assistant existent, l’élagage est ignoré.

</Accordion>

Voir [Session Pruning](/fr/concepts/session-pruning) pour les détails de comportement.

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

- Les canaux autres que Telegram nécessitent un `*.blockStreaming: true` explicite pour activer les réponses par blocs.
- Remplacements par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par blocs. `natural` = 800–2500 ms. Remplacement par agent : `agents.list[].humanDelay`.

Voir [Streaming](/fr/concepts/streaming) pour les détails de comportement et de découpage.

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

Voir [Indicateurs de saisie](/fr/concepts/typing-indicators).

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

<Accordion title="Sandbox details">

**Backend :**

- `docker` : environnement d’exécution Docker local (par défaut)
- `ssh` : environnement d’exécution distant générique adossé à SSH
- `openshell` : environnement d’exécution OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres propres à l’environnement d’exécution passent dans
`plugins.entries.openshell.config`.

**Configuration du Backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus intégrés ou SecretRefs qu’OpenClaw matérialise en fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : réglages de politique de clé d’hôte OpenSSH

**Priorité de l’authentification SSH :**

- `identityData` l’emporte sur `identityFile`
- `certificateData` l’emporte sur `certificateFile`
- `knownHostsData` l’emporte sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues depuis l’instantané actif de l’environnement d’exécution des secrets avant le démarrage de la session de bac à sable

**Comportement du Backend SSH :**

- initialise l’espace de travail distant une seule fois après la création ou la recréation
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

- `mirror` : initialiser le distant depuis le local avant l’exécution, synchroniser en retour après l’exécution ; l’espace de travail local reste canonique
- `remote` : initialiser le distant une seule fois lors de la création du bac à sable, puis conserver l’espace de travail distant comme référence canonique

En mode `remote`, les modifications locales à l’hôte effectuées en dehors d’OpenClaw ne sont pas synchronisées automatiquement dans le bac à sable après l’étape d’initialisation.
Le transport se fait en SSH vers le bac à sable OpenShell, mais le Plugin possède le cycle de vie du bac à sable et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite une sortie réseau, une racine inscriptible et un utilisateur root.

**Par défaut, les conteneurs utilisent `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut, sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (option de dernier recours).

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôtes supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur en bac à sable** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. URL noVNC injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise l’authentification VNC par défaut, et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions en bac à sable de cibler le navigateur de l’hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement lorsque vous souhaitez explicitement une connectivité bridge globale.
- `cdpSourceRange` restreint facultativement l’entrée CDP à la limite du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur de navigateur en bac à sable. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur de navigateur.
- Les valeurs de lancement par défaut sont définies dans `scripts/sandbox-browser-entrypoint.sh` et optimisées pour les hôtes de conteneurs :
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ; définissez `0` pour utiliser la limite de processus
    par défaut de Chromium.
  - plus `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l’image de conteneur ; utilisez une image de navigateur personnalisée avec un
    point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

La mise en bac à sable du navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images :

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (remplacements par agent)

Utilisez `agents.list[].tts` pour attribuer à un agent son propre fournisseur TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc de l’agent fusionne en profondeur avec
`messages.tts` global, afin que les identifiants partagés puissent rester au même endroit tandis que les agents
individuels ne remplacent que les champs de voix ou de fournisseur dont ils ont besoin. Le remplacement de l’agent actif
s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et
à l’outil d’agent `tts`. Consultez [Synthèse vocale](/fr/tools/tts#per-agent-voice-overrides)
pour des exemples de fournisseurs et la priorité.

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
        agentRuntime: { id: "auto", fallback: "pi" },
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

- `id` : ID d’agent stable (obligatoire).
- `default` : lorsque plusieurs sont définis, le premier l’emporte (avertissement journalisé). Si aucun n’est défini, la première entrée de la liste est la valeur par défaut.
- `model` : la forme chaîne définit un modèle principal strict par agent, sans repli de modèle ; la forme objet `{ primary }` est également stricte, sauf si vous ajoutez `fallbacks`. Utilisez `{ primary, fallbacks: [...] }` pour activer le repli pour cet agent, ou `{ primary, fallbacks: [] }` pour rendre le comportement strict explicite. Les tâches Cron qui remplacent seulement `primary` héritent toujours des replis par défaut, sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent, fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour les remplacements propres à un agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts` : remplacements facultatifs de synthèse vocale par agent. Le bloc est fusionné en profondeur par-dessus `messages.tts`, donc conservez les identifiants de fournisseur partagés et la politique de repli dans `messages.tts`, et définissez ici uniquement les valeurs propres au personnage, comme le fournisseur, la voix, le modèle, le style ou le mode automatique.
- `skills` : liste d’autorisation facultative de Skills par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsque défini ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucune Skills.
- `thinkingDefault` : niveau de réflexion par défaut facultatif par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucun remplacement par message ou par session n’est défini. Le profil fournisseur/modèle sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve la réflexion dynamique gérée par le fournisseur (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité du raisonnement par défaut facultative par agent (`on | off | stream`). Remplace `agents.defaults.reasoningDefault` pour cet agent lorsqu’aucun remplacement de raisonnement par message ou par session n’est défini.
- `fastModeDefault` : valeur par défaut facultative par agent pour le mode rapide (`true | false`). S’applique lorsqu’aucun remplacement du mode rapide par message ou par session n’est défini.
- `agentRuntime` : remplacement facultatif par agent de la politique d’exécution de bas niveau. Utilisez `{ id: "codex" }` pour rendre un agent exclusivement Codex, tandis que les autres agents conservent le repli PI par défaut en mode `auto`.
- `runtime` : descripteur d’exécution facultatif par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive les valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation d’ID d’agents pour les cibles explicites `sessions_spawn.agentId` (`["*"]` = n’importe lequel ; par défaut : le même agent uniquement). Incluez l’ID du demandeur lorsque les appels `agentId` qui se ciblent eux-mêmes doivent être autorisés.
- Garde d’héritage du sandbox : si la session du demandeur est isolée en sandbox, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `subagents.requireAgentId` : lorsque vrai, bloque les appels `sessions_spawn` qui omettent `agentId` (force la sélection explicite d’un profil ; par défaut : faux).

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

### Champs de correspondance des liaisons

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
4. `match.accountId` (exact, sans pair/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité de conversation exacte (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre des niveaux de liaison de route ci-dessus.

### Profils d’accès par agent

<Accordion title="Accès complet (sans sandbox)">

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

Voir [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour les détails de précédence.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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
  - `global` : tous les participants d’un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est prévu).
- **`dmScope`** : façon dont les messages privés sont regroupés.
  - `main` : tous les messages privés partagent la session principale.
  - `per-peer` : isole par ID d’expéditeur entre les canaux.
  - `per-channel-peer` : isole par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isole par compte + canal + expéditeur (recommandé pour le multi-compte).
- **`identityLinks`** : associe des ID canoniques à des pairs préfixés par fournisseur pour le partage de session entre canaux. Les commandes Dock comme `/dock_discord` utilisent la même map pour basculer la route de réponse de la session active vers un autre pair de canal lié ; voir [Ancrage de canal](/fr/concepts/channel-docking).
- **`reset`** : politique de réinitialisation principale. `daily` réinitialise à l’heure locale `atHour` ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, celui qui expire en premier l’emporte. La fraîcheur de réinitialisation quotidienne utilise le `sessionStartedAt` de la ligne de session ; la fraîcheur de réinitialisation d’inactivité utilise `lastInteractionAt`. Les écritures d’arrière-plan/d’événements système comme Heartbeat, les réveils Cron, les notifications d’exécution et la comptabilité du Gateway peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas les sessions quotidiennes/inactives à jour.
- **`resetByType`** : remplacements par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`parentForkMaxTokens`** : nombre maximal de `totalTokens` de la session parente autorisé lors de la création d’une session de fil dérivée (par défaut `100000`).
  - Si le `totalTokens` parent est supérieur à cette valeur, OpenClaw démarre une nouvelle session de fil au lieu d’hériter de l’historique de transcription parent.
  - Définissez `0` pour désactiver cette garde et toujours autoriser la dérivation depuis le parent.
- **`mainKey`** : champ hérité. L’exécution utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse entre agents pendant les échanges agent à agent (entier, plage : `0`–`5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec l’alias hérité `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage et de rétention du magasin de sessions.
  - `mode` : `warn` émet uniquement des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`). L’exécution écrit le nettoyage par lots avec un petit tampon de haut niveau pour les plafonds de taille production ; `openclaw sessions cleanup --enforce` applique le plafond immédiatement.
  - `rotateBytes` : obsolète et ignoré ; `openclaw doctor --fix` le supprime des anciennes configurations.
  - `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>`. Vaut par défaut `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif du répertoire de sessions. En mode `warn`, il journalise des avertissements ; en mode `enforce`, il supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage budgétaire. Vaut par défaut `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs par défaut globales pour les fonctionnalités de session liée à un fil.
  - `enabled` : commutateur par défaut principal (les fournisseurs peuvent le remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : auto-désactivation par défaut en cas d’inactivité, en heures (`0` désactive ; les fournisseurs peuvent remplacer)
  - `maxAgeHours` : âge maximal dur par défaut, en heures (`0` désactive ; les fournisseurs peuvent remplacer)

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

| Variable          | Description                    | Exemple                     |
| ----------------- | ------------------------------ | --------------------------- |
| `{model}`         | Nom court du modèle            | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du fournisseur             | `anthropic`                 |
| `{thinkingLevel}` | Niveau de réflexion actuel     | `high`, `low`, `off`        |
| `{identity.name}` | Nom d’identité de l’agent      | (identique à `"auto"`)      |

Les variables ne sont pas sensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Par défaut, utilise `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Remplacements par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → solution de repli de l’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé de réception après la réponse sur les canaux compatibles avec les réactions, comme Slack, Discord, Telegram, WhatsApp et BlueBubbles.
- `messages.statusReactions.enabled` : active les réactions de statut du cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, une valeur non définie conserve les réactions de statut activées lorsque les réactions d’accusé de réception sont actives.
  Sur Telegram, définissez-la explicitement sur `true` pour activer les réactions de statut du cycle de vie.

### Antirebond entrant

Regroupe les messages textuels rapides du même expéditeur en un seul tour d’agent. Les médias/pièces jointes sont transmis immédiatement. Les commandes de contrôle contournent l’antirebond.

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
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut `false` par défaut (activation explicite).
- Les clés d’API se rabattent sur `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les fournisseurs de synthèse vocale intégrés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque Plugin fournisseur TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien identifiant de fournisseur `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison TTS d’OpenAI. L’ordre de résolution est la configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
- Lorsque `providers.openai.baseUrl` pointe vers un point de terminaison non OpenAI, OpenClaw le traite comme un serveur TTS compatible OpenAI et assouplit la validation du modèle et de la voix.

---

## Conversation vocale

Valeurs par défaut du mode Conversation vocale (macOS/iOS/Android).

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
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs fournisseurs de Conversation vocale sont configurés.
- Les anciennes clés plates de Conversation vocale (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existent uniquement pour la compatibilité et sont migrées automatiquement vers `talk.providers.<provider>`.
- Les identifiants de voix se rabattent sur `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte les chaînes en clair ou les objets SecretRef.
- Le repli `ELEVENLABS_API_KEY` s’applique uniquement lorsqu’aucune clé d’API de Conversation vocale n’est configurée.
- `providers.*.voiceAliases` permet aux directives de Conversation vocale d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local de macOS. S’il est omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX de macOS passe par l’assistant `openclaw-mlx-tts` intégré lorsqu’il est présent, ou par un exécutable sur `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `speechLocale` définit l’identifiant de locale BCP 47 utilisé par la reconnaissance vocale de Conversation vocale sur iOS/macOS. Laissez-le non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle la durée pendant laquelle le mode Conversation vocale attend après le silence de l’utilisateur avant d’envoyer la transcription. S’il n’est pas défini, la fenêtre de pause par défaut de la plateforme est conservée (`700 ms sur macOS et Android, 900 ms sur iOS`).

---

## Associés

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et configuration rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
