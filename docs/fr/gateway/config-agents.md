---
read_when:
    - Ajuster les valeurs par défaut de l’agent (modèles, Thinking, espace de travail, Heartbeat, médias, Skills)
    - Configuration du routage multi-agent et des bindings
    - Ajuster le comportement des sessions, de la livraison des messages et du mode talk
summary: Valeurs par défaut de l’agent, routage multi-agent, session, messages et configuration de talk
title: Configuration — agents
x-i18n:
    generated_at: "2026-04-26T11:28:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Clés de configuration limitées à l’agent sous `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` et `talk.*`. Pour les canaux, les outils, le runtime de la gateway et les autres
clés de niveau supérieur, voir [Référence de configuration](/fr/gateway/configuration-reference).

## Valeurs par défaut de l’agent

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

Liste d’autorisation par défaut facultative de Skills pour les agents qui ne définissent pas
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skills
    ],
  },
}
```

- Omettez `agents.defaults.skills` pour des Skills sans restriction par défaut.
- Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skills.
- Une liste non vide `agents.list[].skills` constitue l’ensemble final pour cet agent ; elle
  n’est pas fusionnée avec les valeurs par défaut.

### `agents.defaults.skipBootstrap`

Désactive la création automatique des fichiers bootstrap de l’espace de travail (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Contrôle quand les fichiers bootstrap de l’espace de travail sont injectés dans le prompt système. Par défaut : `"always"`.

- `"continuation-skip"` : les tours de continuation sûrs (après une réponse terminée de l’assistant) sautent la réinjection du bootstrap de l’espace de travail, ce qui réduit la taille du prompt. Les exécutions Heartbeat et les nouvelles tentatives après Compaction reconstruisent toujours le contexte.
- `"never"` : désactive l’injection du bootstrap de l’espace de travail et des fichiers de contexte à chaque tour. Utilisez ceci uniquement pour les agents qui gèrent entièrement leur cycle de vie de prompt (moteurs de contexte personnalisés, runtimes natifs qui construisent leur propre contexte, ou workflows spécialisés sans bootstrap). Les tours Heartbeat et de récupération après Compaction sautent aussi l’injection.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Nombre maximal de caractères par fichier bootstrap de l’espace de travail avant troncature. Par défaut : `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Nombre maximal total de caractères injectés sur l’ensemble des fichiers bootstrap de l’espace de travail. Par défaut : `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Contrôle le texte d’avertissement visible par l’agent lorsque le contexte bootstrap est tronqué.
Par défaut : `"once"`.

- `"off"` : n’injecte jamais d’avertissement dans le prompt système.
- `"once"` : injecte l’avertissement une fois par signature de troncature unique (recommandé).
- `"always"` : injecte l’avertissement à chaque exécution lorsqu’une troncature existe.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Carte de propriété des budgets de contexte

OpenClaw possède plusieurs budgets de prompt/contexte à fort volume, et ils sont
intentionnellement répartis par sous-système au lieu de tous passer par un seul
paramètre générique.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars` :
  injection bootstrap normale de l’espace de travail.
- `agents.defaults.startupContext.*` :
  prélude de démarrage ponctuel pour `/new` et `/reset`, y compris les fichiers
  récents `memory/*.md` du jour.
- `skills.limits.*` :
  la liste compacte de Skills injectée dans le prompt système.
- `agents.defaults.contextLimits.*` :
  extraits d’exécution bornés et blocs injectés appartenant au runtime.
- `memory.qmd.limits.*` :
  taille des extraits et de l’injection de recherche mémoire indexée.

Utilisez la surcharge par agent correspondante uniquement lorsqu’un agent a besoin d’un
budget différent :

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Contrôle le prélude de démarrage du premier tour injecté sur des exécutions `/new` et `/reset` simples.

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

- `memoryGetMaxChars` : plafond d’extrait par défaut pour `memory_get` avant ajout
  des métadonnées de troncature et d’un avis de continuation.
- `memoryGetDefaultLines` : fenêtre de lignes par défaut pour `memory_get` lorsque `lines` est
  omis.
- `toolResultMaxChars` : plafond de résultat d’outil en direct utilisé pour les résultats persistés et
  la récupération en cas de dépassement.
- `postCompactionMaxChars` : plafond d’extrait `AGENTS.md` utilisé pendant l’injection
  de rafraîchissement après Compaction.

#### `agents.list[].contextLimits`

Surcharge par agent pour les paramètres partagés `contextLimits`. Les champs omis héritent
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

Surcharge par agent pour le budget de prompt des Skills.

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

Taille maximale en pixels du côté le plus long d’une image dans les blocs image de transcription/outil avant les appels fournisseur.
Par défaut : `1200`.

Des valeurs plus faibles réduisent généralement l’utilisation de jetons vision et la taille des charges utiles pour les exécutions riches en captures d’écran.
Des valeurs plus élevées préservent davantage de détails visuels.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuseau horaire pour le contexte du prompt système (pas pour les horodatages des messages). Revient au fuseau horaire de l’hôte.

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
      agentRuntime: {
        id: "pi", // pi | auto | id de harnais enregistré, par ex. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - La forme objet définit le modèle principal ainsi qu’une liste ordonnée de modèles de bascule.
- `imageModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par le chemin de l’outil `image` comme configuration du modèle de vision.
  - Également utilisé comme routage de repli lorsque le modèle sélectionné/par défaut ne peut pas accepter d’entrée image.
- `imageGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération d’images et toute future surface d’outil/plugin qui génère des images.
  - Valeurs typiques : `google/gemini-3.1-flash-image-preview` pour la génération d’images Gemini native, `fal/fal-ai/flux/dev` pour fal, `openai/gpt-image-2` pour OpenAI Images, ou `openai/gpt-image-1.5` pour une sortie PNG/WebP OpenAI avec arrière-plan transparent.
  - Si vous sélectionnez directement un provider/model, configurez aussi l’authentification correspondante du provider (par exemple `GEMINI_API_KEY` ou `GOOGLE_API_KEY` pour `google/*`, `OPENAI_API_KEY` ou l’OAuth OpenAI Codex pour `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` pour `fal/*`).
  - Si omis, `image_generate` peut quand même déduire un provider par défaut adossé à une authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération d’images enregistrés restants dans l’ordre des ID de provider.
- `musicGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération musicale et l’outil intégré `music_generate`.
  - Valeurs typiques : `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Si omis, `music_generate` peut quand même déduire un provider par défaut adossé à une authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération musicale enregistrés restants dans l’ordre des ID de provider.
  - Si vous sélectionnez directement un provider/model, configurez aussi l’authentification/la clé API correspondante du provider.
- `videoGenerationModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par la capacité partagée de génération vidéo et l’outil intégré `video_generate`.
  - Valeurs typiques : `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Si omis, `video_generate` peut quand même déduire un provider par défaut adossé à une authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération vidéo enregistrés restants dans l’ordre des ID de provider.
  - Si vous sélectionnez directement un provider/model, configurez aussi l’authentification/la clé API correspondante du provider.
  - Le provider intégré de génération vidéo Qwen prend en charge jusqu’à 1 vidéo de sortie, 1 image d’entrée, 4 vidéos d’entrée, une durée de 10 secondes, ainsi que les options au niveau du provider `size`, `aspectRatio`, `resolution`, `audio` et `watermark`.
- `pdfModel` : accepte soit une chaîne (`"provider/model"`), soit un objet (`{ primary, fallbacks }`).
  - Utilisé par l’outil `pdf` pour le routage du modèle.
  - Si omis, l’outil PDF revient à `imageModel`, puis au modèle résolu de la session/par défaut.
- `pdfMaxBytesMb` : limite de taille PDF par défaut pour l’outil `pdf` lorsque `maxBytesMb` n’est pas fourni au moment de l’appel.
- `pdfMaxPages` : nombre maximal de pages par défaut pris en compte par le mode de repli d’extraction dans l’outil `pdf`.
- `verboseDefault` : niveau de verbosité par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"full"`. Par défaut : `"off"`.
- `elevatedDefault` : niveau de sortie élevée par défaut pour les agents. Valeurs : `"off"`, `"on"`, `"ask"`, `"full"`. Par défaut : `"on"`.
- `model.primary` : format `provider/model` (par exemple `openai/gpt-5.5` pour un accès par clé API ou `openai-codex/gpt-5.5` pour l’OAuth Codex). Si vous omettez le provider, OpenClaw essaie d’abord un alias, puis une correspondance unique de provider configuré pour cet ID de modèle exact, et revient seulement ensuite au provider par défaut configuré (comportement de compatibilité obsolète, donc préférez `provider/model` explicite). Si ce provider n’expose plus le modèle par défaut configuré, OpenClaw revient au premier provider/model configuré au lieu d’exposer un défaut obsolète vers un provider supprimé.
- `models` : le catalogue de modèles configuré et la liste d’autorisation pour `/model`. Chaque entrée peut inclure `alias` (raccourci) et `params` (spécifiques au provider, par exemple `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Modifications sûres : utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées. `config set` refuse les remplacements qui supprimeraient des entrées existantes de la liste d’autorisation sauf si vous passez `--replace`.
  - Les flux de configuration/onboarding limités au provider fusionnent les modèles sélectionnés du provider dans ce mapping et conservent les providers non liés déjà configurés.
  - Pour les modèles OpenAI Responses directs, la Compaction côté serveur est activée automatiquement. Utilisez `params.responsesServerCompaction: false` pour cesser d’injecter `context_management`, ou `params.responsesCompactThreshold` pour remplacer le seuil. Voir [Compaction côté serveur OpenAI](/fr/providers/openai#server-side-compaction-responses-api).
- `params` : paramètres globaux par défaut du provider appliqués à tous les modèles. Définis dans `agents.defaults.params` (par ex. `{ cacheRetention: "long" }`).
- Ordre de fusion de `params` (configuration) : `agents.defaults.params` (base globale) est remplacé par `agents.defaults.models["provider/model"].params` (par modèle), puis `agents.list[].params` (ID d’agent correspondant) remplace par clé. Voir [Mise en cache des prompts](/fr/reference/prompt-caching) pour les détails.
- `params.extra_body`/`params.extraBody` : JSON avancé transmis tel quel et fusionné dans les corps de requête `api: "openai-completions"` pour les proxys compatibles OpenAI. En cas de collision avec des clés de requête générées, le corps supplémentaire l’emporte ; les routes de complétions non natives retirent quand même ensuite le `store` spécifique à OpenAI.
- `params.chat_template_kwargs` : arguments de modèle de chat vLLM/OpenAI-compatibles fusionnés au niveau supérieur des corps de requête `api: "openai-completions"`. Pour `vllm/nemotron-3-*` avec Thinking désactivé, OpenClaw envoie automatiquement `enable_thinking: false` et `force_nonempty_content: true` ; des `chat_template_kwargs` explicites remplacent ces valeurs par défaut, et `extra_body.chat_template_kwargs` a toujours la priorité finale.
- `params.preserveThinking` : option Z.AI uniquement pour le Thinking préservé. Lorsqu’elle est activée et que Thinking est activé, OpenClaw envoie `thinking.clear_thinking: false` et rejoue `reasoning_content` antérieur ; voir [Thinking Z.AI et Thinking préservé](/fr/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime` : politique par défaut du runtime d’agent de bas niveau. Un `id` omis revient à Pi d’OpenClaw. Utilisez `id: "pi"` pour forcer le harnais PI intégré, `id: "auto"` pour laisser les harnais de plugin enregistrés revendiquer les modèles pris en charge, un ID de harnais enregistré comme `id: "codex"`, ou un alias de backend CLI pris en charge comme `id: "claude-cli"`. Définissez `fallback: "none"` pour désactiver le repli automatique vers Pi. Les runtimes de plugin explicites comme `codex` échouent par défaut de façon fermée sauf si vous définissez `fallback: "pi"` dans la même portée de surcharge. Gardez les références de modèle sous forme canonique `provider/model` ; sélectionnez Codex, Claude CLI, Gemini CLI et les autres backends d’exécution via la configuration du runtime au lieu des anciens préfixes de provider runtime. Voir [Runtimes d’agent](/fr/concepts/agent-runtimes) pour la différence avec la sélection provider/model.
- Les écrivains de configuration qui modifient ces champs (par exemple `/models set`, `/models set-image` et les commandes d’ajout/suppression de repli) enregistrent la forme objet canonique et préservent les listes de repli existantes lorsque c’est possible.
- `maxConcurrent` : nombre maximal d’exécutions d’agent parallèles entre les sessions (chaque session reste sérialisée). Par défaut : 4.

### `agents.defaults.agentRuntime`

`agentRuntime` contrôle quel exécuteur de bas niveau exécute les tours d’agent. La plupart
des déploiements doivent conserver le runtime Pi d’OpenClaw par défaut. Utilisez-le lorsqu’un
plugin de confiance fournit un harnais natif, tel que le harnais app-server Codex intégré,
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

- `id` : `"auto"`, `"pi"`, un ID de harnais de plugin enregistré, ou un alias de backend CLI pris en charge. Le plugin Codex intégré enregistre `codex` ; le plugin Anthropic intégré fournit le backend CLI `claude-cli`.
- `fallback` : `"pi"` ou `"none"`. En `id: "auto"`, un fallback omis vaut par défaut `"pi"` pour que les anciennes configurations puissent continuer à utiliser Pi lorsqu’aucun harnais de plugin ne revendique une exécution. En mode runtime de plugin explicite, tel que `id: "codex"`, un fallback omis vaut par défaut `"none"` pour qu’un harnais manquant échoue au lieu d’utiliser Pi silencieusement. Les surcharges de runtime n’héritent pas du fallback d’une portée plus large ; définissez `fallback: "pi"` avec le runtime explicite lorsque vous voulez intentionnellement ce fallback de compatibilité. Les échecs du harnais de plugin sélectionné sont toujours remontés directement.
- Surcharges d’environnement : `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` remplace `id` ; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` remplace le fallback pour ce processus.
- Pour des déploiements Codex uniquement, définissez `model: "openai/gpt-5.5"` et `agentRuntime.id: "codex"`. Vous pouvez également définir explicitement `agentRuntime.fallback: "none"` pour plus de lisibilité ; c’est la valeur par défaut pour les runtimes de plugin explicites.
- Pour des déploiements Claude CLI, préférez `model: "anthropic/claude-opus-4-7"` avec `agentRuntime.id: "claude-cli"`. Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore pour compatibilité, mais les nouvelles configurations doivent conserver une sélection provider/model canonique et placer le backend d’exécution dans `agentRuntime.id`.
- Les anciennes clés de politique de runtime sont réécrites vers `agentRuntime` par `openclaw doctor --fix`.
- Le choix du harnais est épinglé par ID de session après la première exécution intégrée. Les changements de configuration/d’environnement affectent les nouvelles sessions ou les sessions réinitialisées, pas une transcription existante. Les anciennes sessions avec historique de transcription mais sans épinglage enregistré sont traitées comme épinglées sur Pi. `/status` rapporte le runtime effectif, par exemple `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Cela contrôle uniquement l’exécution des tours d’agent texte. La génération de médias, la vision, les PDF, la musique, la vidéo et le TTS continuent d’utiliser leurs paramètres provider/model.

**Raccourcis d’alias intégrés** (s’appliquent uniquement lorsque le modèle est dans `agents.defaults.models`) :

| Alias               | Modèle                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Vos alias configurés ont toujours priorité sur les valeurs par défaut.

Les modèles Z.AI GLM-4.x activent automatiquement le mode Thinking sauf si vous définissez `--thinking off` ou si vous définissez vous-même `agents.defaults.models["zai/<model>"].params.thinking`.
Les modèles Z.AI activent `tool_stream` par défaut pour le streaming des appels d’outil. Définissez `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
Les modèles Anthropic Claude 4.6 utilisent par défaut un Thinking `adaptive` lorsqu’aucun niveau explicite de Thinking n’est défini.

### `agents.defaults.cliBackends`

Backends CLI facultatifs pour les exécutions de repli texte uniquement (sans appels d’outil). Utile comme sauvegarde lorsque les providers API échouent.

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
          // Ou utilisez systemPromptFileArg lorsque la CLI accepte un indicateur de fichier de prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Les backends CLI sont orientés texte ; les outils sont toujours désactivés.
- Les sessions sont prises en charge lorsque `sessionArg` est défini.
- Le passage direct d’images est pris en charge lorsque `imageArg` accepte des chemins de fichier.

### `agents.defaults.systemPromptOverride`

Remplace l’intégralité du prompt système assemblé par OpenClaw par une chaîne fixe. Se définit au niveau par défaut (`agents.defaults.systemPromptOverride`) ou par agent (`agents.list[].systemPromptOverride`). Les valeurs par agent ont priorité ; une valeur vide ou composée uniquement d’espaces est ignorée. Utile pour des expérimentations contrôlées sur les prompts.

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

Couches de prompt indépendantes du provider appliquées par famille de modèles. Les ID de modèles de la famille GPT-5 reçoivent le contrat de comportement partagé entre providers ; `personality` contrôle uniquement la couche de style d’interaction convivial.

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
- L’ancien paramètre `plugins.entries.openai.config.personality` est encore lu lorsque ce paramètre partagé n’est pas défini.

### `agents.defaults.heartbeat`

Exécutions périodiques Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m désactive
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // par défaut : true ; false omet la section Heartbeat du prompt système
        lightContext: false, // par défaut : false ; true ne conserve que HEARTBEAT.md parmi les fichiers bootstrap de l’espace de travail
        isolatedSession: false, // par défaut : false ; true exécute chaque Heartbeat dans une nouvelle session (sans historique de conversation)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (par défaut) | block
        target: "none", // par défaut : none | options : last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every` : chaîne de durée (ms/s/m/h). Par défaut : `30m` (authentification par clé API) ou `1h` (authentification OAuth). Définissez `0m` pour désactiver.
- `includeSystemPromptSection` : lorsque `false`, omet la section Heartbeat du prompt système et ignore l’injection de `HEARTBEAT.md` dans le contexte bootstrap. Par défaut : `true`.
- `suppressToolErrorWarnings` : lorsque `true`, supprime les charges utiles d’avertissement d’erreur d’outil pendant les exécutions Heartbeat.
- `timeoutSeconds` : temps maximal en secondes autorisé pour un tour d’agent Heartbeat avant son interruption. Laissez non défini pour utiliser `agents.defaults.timeoutSeconds`.
- `directPolicy` : politique de livraison directe/DM. `allow` (par défaut) autorise la livraison vers une cible directe. `block` supprime la livraison vers une cible directe et émet `reason=dm-blocked`.
- `lightContext` : lorsque `true`, les exécutions Heartbeat utilisent un contexte bootstrap léger et ne conservent que `HEARTBEAT.md` parmi les fichiers bootstrap de l’espace de travail.
- `isolatedSession` : lorsque `true`, chaque exécution Heartbeat se fait dans une nouvelle session sans historique de conversation antérieur. Même schéma d’isolation que Cron `sessionTarget: "isolated"`. Réduit le coût en jetons par Heartbeat d’environ 100 K à environ 2–5 K jetons.
- Par agent : définissez `agents.list[].heartbeat`. Lorsqu’un agent quelconque définit `heartbeat`, **seuls ces agents** exécutent des Heartbeat.
- Les Heartbeat exécutent des tours d’agent complets — des intervalles plus courts consomment davantage de jetons.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id d’un plugin provider de Compaction enregistré (facultatif)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // utilisé lorsque identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] désactive la réinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // surcharge facultative du modèle uniquement pour la Compaction
        notifyUser: true, // envoie de brèves notifications lorsque la Compaction commence et se termine (par défaut : false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode` : `default` ou `safeguard` (résumé segmenté pour les longs historiques). Voir [Compaction](/fr/concepts/compaction).
- `provider` : ID d’un plugin provider de Compaction enregistré. Lorsqu’il est défini, le `summarize()` du provider est appelé à la place du résumé LLM intégré. Revient au mécanisme intégré en cas d’échec. Définir un provider force `mode: "safeguard"`. Voir [Compaction](/fr/concepts/compaction).
- `timeoutSeconds` : nombre maximal de secondes autorisé pour une opération unique de Compaction avant interruption par OpenClaw. Par défaut : `900`.
- `keepRecentTokens` : budget de point de coupe Pi pour conserver tel quel le segment le plus récent de la transcription. Le `/compact` manuel respecte ce paramètre lorsqu’il est explicitement défini ; sinon la Compaction manuelle est un point de contrôle strict.
- `identifierPolicy` : `strict` (par défaut), `off` ou `custom`. `strict` ajoute en préambule des consignes intégrées de conservation des identifiants opaques pendant le résumé de Compaction.
- `identifierInstructions` : texte personnalisé facultatif de préservation des identifiants utilisé lorsque `identifierPolicy=custom`.
- `qualityGuard` : vérifications avec nouvelle tentative sur sortie mal formée pour les résumés safeguard. Activé par défaut en mode safeguard ; définissez `enabled: false` pour ignorer l’audit.
- `postCompactionSections` : noms facultatifs de sections H2/H3 de `AGENTS.md` à réinjecter après Compaction. Par défaut : `["Session Startup", "Red Lines"]` ; définissez `[]` pour désactiver la réinjection. Lorsqu’il est non défini ou explicitement défini à cette paire par défaut, les anciens en-têtes `Every Session`/`Safety` sont aussi acceptés en repli historique.
- `model` : surcharge facultative `provider/model-id` pour le résumé de Compaction uniquement. Utilisez cela lorsque la session principale doit conserver un modèle mais que les résumés de Compaction doivent être exécutés sur un autre ; lorsqu’il n’est pas défini, la Compaction utilise le modèle principal de la session.
- `notifyUser` : lorsque `true`, envoie de brèves notifications à l’utilisateur au début et à la fin de la Compaction (par exemple « Compacting context... » et « Compaction complete »). Désactivé par défaut pour garder la Compaction silencieuse.
- `memoryFlush` : tour agentique silencieux avant l’auto-Compaction afin de stocker les mémoires durables. Ignoré lorsque l’espace de travail est en lecture seule.

### `agents.defaults.contextPruning`

Élague les **anciens résultats d’outil** du contexte en mémoire avant envoi au LLM. Ne **modifie pas** l’historique de session sur disque.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durée (ms/s/m/h), unité par défaut : minutes
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
- `ttl` contrôle à quelle fréquence l’élagage peut de nouveau s’exécuter (après le dernier accès au cache).
- L’élagage effectue d’abord un découpage souple des résultats d’outil surdimensionnés, puis efface complètement les résultats d’outil plus anciens si nécessaire.

**Soft-trim** conserve le début + la fin et insère `...` au milieu.

**Hard-clear** remplace l’intégralité du résultat d’outil par le placeholder.

Remarques :

- Les blocs image ne sont jamais découpés/effacés.
- Les ratios sont basés sur les caractères (approximatifs), pas sur des comptages exacts de jetons.
- Si moins de `keepLastAssistants` messages assistant existent, l’élagage est ignoré.

</Accordion>

Voir [Élagage de session](/fr/concepts/session-pruning) pour les détails de comportement.

### Streaming par bloc

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (utiliser minMs/maxMs)
    },
  },
}
```

- Les canaux autres que Telegram nécessitent un `*.blockStreaming: true` explicite pour activer les réponses par bloc.
- Surcharges par canal : `channels.<channel>.blockStreamingCoalesce` (et variantes par compte). Signal/Slack/Discord/Google Chat utilisent par défaut `minChars: 1500`.
- `humanDelay` : pause aléatoire entre les réponses par bloc. `natural` = 800–2500 ms. Surcharge par agent : `agents.list[].humanDelay`.

Voir [Streaming](/fr/concepts/streaming) pour le comportement et les détails de segmentation.

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

- Valeurs par défaut : `instant` pour les messages directs/mentions, `message` pour les discussions de groupe sans mention.
- Surcharges par session : `session.typingMode`, `session.typingIntervalSeconds`.

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
          // SecretRefs / contenus en ligne également pris en charge :
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
- `ssh` : runtime distant générique basé sur SSH
- `openshell` : runtime OpenShell

Lorsque `backend: "openshell"` est sélectionné, les paramètres spécifiques au runtime sont déplacés vers
`plugins.entries.openshell.config`.

**Configuration du backend SSH :**

- `target` : cible SSH au format `user@host[:port]`
- `command` : commande du client SSH (par défaut : `ssh`)
- `workspaceRoot` : racine distante absolue utilisée pour les espaces de travail par portée
- `identityFile` / `certificateFile` / `knownHostsFile` : fichiers locaux existants transmis à OpenSSH
- `identityData` / `certificateData` / `knownHostsData` : contenus en ligne ou SecretRefs que OpenClaw matérialise en fichiers temporaires à l’exécution
- `strictHostKeyChecking` / `updateHostKeys` : paramètres de politique de clé d’hôte OpenSSH

**Priorité d’authentification SSH :**

- `identityData` a priorité sur `identityFile`
- `certificateData` a priorité sur `certificateFile`
- `knownHostsData` a priorité sur `knownHostsFile`
- Les valeurs `*Data` adossées à SecretRef sont résolues à partir de l’instantané actif du runtime de secrets avant le démarrage de la session sandbox

**Comportement du backend SSH :**

- initialise l’espace de travail distant une fois après création ou recréation
- conserve ensuite l’espace de travail SSH distant comme source canonique
- route `exec`, les outils de fichier et les chemins de médias via SSH
- ne synchronise pas automatiquement les modifications distantes vers l’hôte
- ne prend pas en charge les conteneurs de navigateur sandbox

**Accès à l’espace de travail :**

- `none` : espace de travail sandbox par portée sous `~/.openclaw/sandboxes`
- `ro` : espace de travail sandbox à `/workspace`, espace de travail de l’agent monté en lecture seule à `/agent`
- `rw` : espace de travail de l’agent monté en lecture/écriture à `/workspace`

**Portée :**

- `session` : conteneur + espace de travail par session
- `agent` : un conteneur + espace de travail par agent (par défaut)
- `shared` : conteneur et espace de travail partagés (sans isolation inter-session)

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
          policy: "strict", // id de politique OpenShell facultatif
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

- `mirror` : initialise le distant à partir du local avant `exec`, resynchronise après `exec` ; l’espace de travail local reste canonique
- `remote` : initialise le distant une fois lors de la création du sandbox, puis conserve l’espace de travail distant comme canonique

En mode `remote`, les modifications locales de l’hôte effectuées en dehors d’OpenClaw ne sont pas synchronisées automatiquement vers le sandbox après l’étape d’initialisation.
Le transport se fait par SSH dans le sandbox OpenShell, mais le plugin gère le cycle de vie du sandbox et la synchronisation miroir facultative.

**`setupCommand`** s’exécute une fois après la création du conteneur (via `sh -lc`). Nécessite un accès réseau sortant, une racine accessible en écriture et l’utilisateur root.

**Les conteneurs utilisent par défaut `network: "none"`** — définissez `"bridge"` (ou un réseau bridge personnalisé) si l’agent a besoin d’un accès sortant.
`"host"` est bloqué. `"container:<id>"` est bloqué par défaut sauf si vous définissez explicitement
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (dernier recours).

**Les pièces jointes entrantes** sont placées dans `media/inbound/*` dans l’espace de travail actif.

**`docker.binds`** monte des répertoires hôte supplémentaires ; les montages globaux et par agent sont fusionnés.

**Navigateur sandboxé** (`sandbox.browser.enabled`) : Chromium + CDP dans un conteneur. L’URL noVNC est injectée dans le prompt système. Ne nécessite pas `browser.enabled` dans `openclaw.json`.
L’accès observateur noVNC utilise par défaut l’authentification VNC et OpenClaw émet une URL à jeton de courte durée (au lieu d’exposer le mot de passe dans l’URL partagée).

- `allowHostControl: false` (par défaut) empêche les sessions sandboxées de cibler le navigateur de l’hôte.
- `network` vaut par défaut `openclaw-sandbox-browser` (réseau bridge dédié). Définissez `bridge` uniquement si vous voulez explicitement une connectivité bridge globale.
- `cdpSourceRange` limite facultativement l’entrée CDP à la périphérie du conteneur à une plage CIDR (par exemple `172.21.0.1/32`).
- `sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur de navigateur sandbox. Lorsqu’il est défini (y compris `[]`), il remplace `docker.binds` pour le conteneur du navigateur.
- Les valeurs par défaut de lancement sont définies dans `scripts/sandbox-browser-entrypoint.sh` et optimisées pour les hôtes conteneurisés :
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
  - ainsi que `--no-sandbox` lorsque `noSandbox` est activé.
  - Les valeurs par défaut constituent la base de l’image conteneur ; utilisez une image de navigateur personnalisée avec un point d’entrée personnalisé pour modifier les valeurs par défaut du conteneur.

</Accordion>

Le sandboxing de navigateur et `sandbox.docker.binds` sont réservés à Docker.

Construire les images :

```bash
scripts/sandbox-setup.sh           # image principale du sandbox
scripts/sandbox-browser-setup.sh   # image de navigateur facultative
```

### `agents.list` (surcharges par agent)

Utilisez `agents.list[].tts` pour donner à un agent son propre provider TTS, sa voix, son modèle,
son style ou son mode TTS automatique. Le bloc agent effectue une fusion profonde par-dessus
`messages.tts` global, afin que les identifiants partagés puissent rester à un seul endroit pendant que certains
agents remplacent uniquement les champs de voix ou de provider dont ils ont besoin. La surcharge
de l’agent actif s’applique aux réponses vocales automatiques, à `/tts audio`, à `/tts status` et
à l’outil d’agent `tts`. Voir [Text-to-speech](/fr/tools/tts#per-agent-voice-overrides)
pour des exemples de providers et l’ordre de priorité.

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
        thinkingDefault: "high", // surcharge du niveau de Thinking par agent
        reasoningDefault: "on", // surcharge de la visibilité du raisonnement par agent
        fastModeDefault: false, // surcharge du mode rapide par agent
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // remplace les clés correspondantes de defaults.models params
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // remplace agents.defaults.skills lorsqu’il est défini
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
- `default` : lorsque plusieurs sont définis, le premier l’emporte (un avertissement est journalisé). Si aucun n’est défini, la première entrée de la liste est la valeur par défaut.
- `model` : la forme chaîne remplace uniquement `primary` ; la forme objet `{ primary, fallbacks }` remplace les deux (`[]` désactive les fallbacks globaux). Les tâches Cron qui ne remplacent que `primary` héritent quand même des fallbacks par défaut, sauf si vous définissez `fallbacks: []`.
- `params` : paramètres de flux par agent fusionnés par-dessus l’entrée de modèle sélectionnée dans `agents.defaults.models`. Utilisez ceci pour des surcharges spécifiques à l’agent comme `cacheRetention`, `temperature` ou `maxTokens` sans dupliquer tout le catalogue de modèles.
- `tts` : surcharges facultatives text-to-speech par agent. Le bloc fusionne profondément par-dessus `messages.tts`, donc conservez les identifiants partagés du provider et la politique de fallback dans `messages.tts`, puis définissez ici uniquement les valeurs spécifiques à la persona, comme le provider, la voix, le modèle, le style ou le mode auto.
- `skills` : liste d’autorisation facultative de Skills par agent. Si elle est omise, l’agent hérite de `agents.defaults.skills` lorsqu’elle est définie ; une liste explicite remplace les valeurs par défaut au lieu de fusionner, et `[]` signifie aucun Skills.
- `thinkingDefault` : niveau par défaut facultatif de Thinking par agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Remplace `agents.defaults.thinkingDefault` pour cet agent lorsqu’aucune surcharge par message ou par session n’est définie. Le profil provider/model sélectionné contrôle les valeurs valides ; pour Google Gemini, `adaptive` conserve le Thinking dynamique appartenant au provider (`thinkingLevel` omis sur Gemini 3/3.1, `thinkingBudget: -1` sur Gemini 2.5).
- `reasoningDefault` : visibilité par défaut facultative du raisonnement par agent (`on | off | stream`). S’applique lorsqu’aucune surcharge de raisonnement par message ou par session n’est définie.
- `fastModeDefault` : valeur par défaut facultative du mode rapide par agent (`true | false`). S’applique lorsqu’aucune surcharge de mode rapide par message ou par session n’est définie.
- `agentRuntime` : surcharge facultative de la politique de runtime de bas niveau par agent. Utilisez `{ id: "codex" }` pour rendre un agent uniquement Codex pendant que les autres agents conservent le fallback PI par défaut en mode `auto`.
- `runtime` : descripteur facultatif de runtime par agent. Utilisez `type: "acp"` avec les valeurs par défaut `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) lorsque l’agent doit utiliser par défaut des sessions de harnais ACP.
- `identity.avatar` : chemin relatif à l’espace de travail, URL `http(s)` ou URI `data:`.
- `identity` dérive des valeurs par défaut : `ackReaction` depuis `emoji`, `mentionPatterns` depuis `name`/`emoji`.
- `subagents.allowAgents` : liste d’autorisation des ID d’agent pour `sessions_spawn` (`["*"]` = n’importe lequel ; par défaut : même agent uniquement).
- Garde d’héritage du sandbox : si la session demandeuse est sandboxée, `sessions_spawn` rejette les cibles qui s’exécuteraient sans sandbox.
- `subagents.requireAgentId` : lorsque `true`, bloque les appels `sessions_spawn` qui omettent `agentId` (force une sélection explicite de profil ; par défaut : `false`).

---

## Routage multi-agent

Exécutez plusieurs agents isolés dans une seule Gateway. Voir [Multi-Agent](/fr/concepts/multi-agent).

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

### Champs de correspondance des bindings

- `type` (facultatif) : `route` pour le routage normal (type manquant = route par défaut), `acp` pour les bindings persistants de conversation ACP.
- `match.channel` (obligatoire)
- `match.accountId` (facultatif ; `*` = n’importe quel compte ; omis = compte par défaut)
- `match.peer` (facultatif ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facultatif ; spécifique au canal)
- `acp` (facultatif ; uniquement pour les entrées `type: "acp"`) : `{ mode, label, cwd, backend }`

**Ordre de correspondance déterministe :**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact, sans pair/guild/team)
5. `match.accountId: "*"` (à l’échelle du canal)
6. Agent par défaut

Dans chaque niveau, la première entrée `bindings` correspondante l’emporte.

Pour les entrées `type: "acp"`, OpenClaw résout par identité exacte de conversation (`match.channel` + compte + `match.peer.id`) et n’utilise pas l’ordre de niveau de binding route ci-dessus.

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

<Accordion title="Outils + espace de travail en lecture seule">

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

Voir [Sandbox & outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour les détails de priorité.

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
    parentForkMaxTokens: 100000, // ignore le fork de fil parent au-dessus de ce nombre de jetons (0 désactive)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durée ou false
      maxDiskBytes: "500mb", // budget strict facultatif
      highWaterBytes: "400mb", // cible facultative de nettoyage
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus par défaut après inactivité en heures (`0` désactive)
      maxAgeHours: 0, // âge maximal strict par défaut en heures (`0` désactive)
    },
    mainKey: "main", // historique (le runtime utilise toujours "main")
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
  - `per-sender` (par défaut) : chaque expéditeur reçoit une session isolée dans un contexte de canal.
  - `global` : tous les participants dans un contexte de canal partagent une seule session (à utiliser uniquement lorsqu’un contexte partagé est voulu).
- **`dmScope`** : comment les messages privés sont regroupés.
  - `main` : tous les messages privés partagent la session principale.
  - `per-peer` : isolation par ID d’expéditeur sur tous les canaux.
  - `per-channel-peer` : isolation par canal + expéditeur (recommandé pour les boîtes de réception multi-utilisateurs).
  - `per-account-channel-peer` : isolation par compte + canal + expéditeur (recommandé pour le multi-compte).
- **`identityLinks`** : mappe des ID canoniques vers des pairs préfixés par provider pour le partage de session inter-canal.
- **`reset`** : politique principale de réinitialisation. `daily` réinitialise à `atHour` heure locale ; `idle` réinitialise après `idleMinutes`. Lorsque les deux sont configurés, le premier à expirer l’emporte. La fraîcheur de réinitialisation quotidienne utilise `sessionStartedAt` de la ligne de session ; la fraîcheur de réinitialisation sur inactivité utilise `lastInteractionAt`. Les écritures d’arrière-plan/événement système telles que Heartbeat, réveils Cron, notifications exec et comptabilité de Gateway peuvent mettre à jour `updatedAt`, mais elles ne maintiennent pas la fraîcheur des sessions quotidiennes/sur inactivité.
- **`resetByType`** : surcharges par type (`direct`, `group`, `thread`). L’ancien `dm` est accepté comme alias de `direct`.
- **`parentForkMaxTokens`** : nombre maximal de `totalTokens` de session parente autorisé lors de la création d’une session de fil forkée (par défaut `100000`).
  - Si le `totalTokens` parent est supérieur à cette valeur, OpenClaw démarre une nouvelle session de fil au lieu d’hériter de l’historique de transcription du parent.
  - Définissez `0` pour désactiver cette protection et toujours autoriser le fork parent.
- **`mainKey`** : champ historique. Le runtime utilise toujours `"main"` pour le compartiment principal de discussion directe.
- **`agentToAgent.maxPingPongTurns`** : nombre maximal de tours de réponse croisée entre agents lors d’échanges agent-à-agent (entier, plage : `0`–`5`). `0` désactive l’enchaînement ping-pong.
- **`sendPolicy`** : correspondance par `channel`, `chatType` (`direct|group|channel`, avec ancien alias `dm`), `keyPrefix` ou `rawKeyPrefix`. Le premier refus l’emporte.
- **`maintenance`** : contrôles de nettoyage + rétention du magasin de sessions.
  - `mode` : `warn` émet uniquement des avertissements ; `enforce` applique le nettoyage.
  - `pruneAfter` : seuil d’âge pour les entrées obsolètes (par défaut `30d`).
  - `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`).
  - `rotateBytes` : fait tourner `sessions.json` lorsqu’il dépasse cette taille (par défaut `10mb`).
  - `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>`. Par défaut à `pruneAfter` ; définissez `false` pour désactiver.
  - `maxDiskBytes` : budget disque facultatif pour le répertoire de sessions. En mode `warn`, journalise des avertissements ; en mode `enforce`, supprime d’abord les artefacts/sessions les plus anciens.
  - `highWaterBytes` : cible facultative après nettoyage du budget. Par défaut à `80%` de `maxDiskBytes`.
- **`threadBindings`** : valeurs globales par défaut pour les fonctionnalités de session liées à un fil.
  - `enabled` : interrupteur maître par défaut (les providers peuvent remplacer ; Discord utilise `channels.discord.threadBindings.enabled`)
  - `idleHours` : auto-unfocus par défaut après inactivité en heures (`0` désactive ; les providers peuvent remplacer)
  - `maxAgeHours` : âge maximal strict par défaut en heures (`0` désactive ; les providers peuvent remplacer)

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
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
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

Surcharges par canal/compte : `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Résolution (la plus spécifique l’emporte) : compte → canal → global. `""` désactive et arrête la cascade. `"auto"` dérive `[{identity.name}]`.

**Variables de modèle :**

| Variable          | Description            | Exemple                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nom court du modèle    | `claude-opus-4-6`           |
| `{modelFull}`     | Identifiant complet du modèle | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nom du provider        | `anthropic`                 |
| `{thinkingLevel}` | Niveau actuel de Thinking | `high`, `low`, `off`     |
| `{identity.name}` | Nom d’identité de l’agent | (identique à `"auto"`)   |

Les variables sont insensibles à la casse. `{think}` est un alias de `{thinkingLevel}`.

### Réaction d’accusé de réception

- Vaut par défaut `identity.emoji` de l’agent actif, sinon `"👀"`. Définissez `""` pour désactiver.
- Surcharges par canal : `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordre de résolution : compte → canal → `messages.ackReaction` → fallback d’identité.
- Portée : `group-mentions` (par défaut), `group-all`, `direct`, `all`.
- `removeAckAfterReply` : supprime l’accusé de réception après la réponse sur les canaux qui prennent en charge les réactions tels que Slack, Discord, Telegram, WhatsApp et BlueBubbles.
- `messages.statusReactions.enabled` : active les réactions d’état du cycle de vie sur Slack, Discord et Telegram.
  Sur Slack et Discord, non défini conserve les réactions d’état activées lorsque les réactions d’accusé de réception sont actives.
  Sur Telegram, définissez-le explicitement sur `true` pour activer les réactions d’état du cycle de vie.

### Anti-rebond entrant

Regroupe les messages texte rapides du même expéditeur en un seul tour d’agent. Les médias/pièces jointes déclenchent immédiatement l’envoi. Les commandes de contrôle contournent l’anti-rebond.

### TTS (text-to-speech)

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
- `summaryModel` remplace `agents.defaults.model.primary` pour l’auto-résumé.
- `modelOverrides` est activé par défaut ; `modelOverrides.allowProvider` vaut par défaut `false` (opt-in).
- Les clés API reviennent à `ELEVENLABS_API_KEY`/`XI_API_KEY` et `OPENAI_API_KEY`.
- Les providers de voix intégrés appartiennent aux plugins. Si `plugins.allow` est défini, incluez chaque plugin provider TTS que vous voulez utiliser, par exemple `microsoft` pour Edge TTS. L’ancien ID de provider `edge` est accepté comme alias de `microsoft`.
- `providers.openai.baseUrl` remplace le point de terminaison OpenAI TTS. L’ordre de résolution est : configuration, puis `OPENAI_TTS_BASE_URL`, puis `https://api.openai.com/v1`.
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
  },
}
```

- `talk.provider` doit correspondre à une clé dans `talk.providers` lorsque plusieurs providers Talk sont configurés.
- Les anciennes clés Talk plates (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sont uniquement conservées pour compatibilité et sont automatiquement migrées vers `talk.providers.<provider>`.
- Les ID de voix reviennent à `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` accepte des chaînes en texte brut ou des objets SecretRef.
- Le fallback `ELEVENLABS_API_KEY` ne s’applique que lorsqu’aucune clé API Talk n’est configurée.
- `providers.*.voiceAliases` permet aux directives Talk d’utiliser des noms conviviaux.
- `providers.mlx.modelId` sélectionne le dépôt Hugging Face utilisé par l’assistant MLX local macOS. Si omis, macOS utilise `mlx-community/Soprano-80M-bf16`.
- La lecture MLX sur macOS passe par l’assistant intégré `openclaw-mlx-tts` lorsqu’il est présent, ou par un exécutable sur `PATH` ; `OPENCLAW_MLX_TTS_BIN` remplace le chemin de l’assistant pour le développement.
- `speechLocale` définit l’ID de locale BCP 47 utilisé par la reconnaissance vocale Talk sur iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `silenceTimeoutMs` contrôle combien de temps le mode Talk attend après le silence de l’utilisateur avant d’envoyer la transcription. Non défini conserve la fenêtre de pause par défaut de la plateforme (`700 ms sur macOS et Android, 900 ms sur iOS`).

---

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les autres clés de configuration
- [Configuration](/fr/gateway/configuration) — tâches courantes et installation rapide
- [Exemples de configuration](/fr/gateway/configuration-examples)
