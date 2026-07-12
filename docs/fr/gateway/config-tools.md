---
read_when:
    - Configuration de la politique `tools.*`, des listes d’autorisation ou des fonctionnalités expérimentales
    - Enregistrement de fournisseurs personnalisés ou remplacement des URL de base
    - Configuration de points de terminaison auto-hébergés compatibles avec OpenAI
sidebarTitle: Tools and custom providers
summary: Configuration des outils (politique, options expérimentales, outils adossés à des fournisseurs) et configuration personnalisée du fournisseur/de l’URL de base
title: Configuration — outils et fournisseurs personnalisés
x-i18n:
    generated_at: "2026-07-12T02:49:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Clés de configuration `tools.*` et configuration personnalisée du fournisseur/de l’URL de base. Pour les agents, les canaux et les autres clés de configuration de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Outils

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant `tools.allow`/`tools.deny` :

<Note>
L’intégration locale définit par défaut `tools.profile: "coding"` dans les nouvelles configurations locales lorsque cette valeur n’est pas définie (les profils explicites existants sont conservés).
</Note>

| Profil      | Inclut                                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` uniquement                                                                                                                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Aucune restriction (identique à une valeur non définie)                                                                                                                                                                      |

`coding` et `messaging` autorisent aussi implicitement `bundle-mcp` (les serveurs MCP configurés).

### Groupes d’outils

| Groupe             | Outils                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Tous les outils intégrés ci-dessus sauf `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (exclut les outils des plugins)                  |
| `group:plugins`    | Outils appartenant aux plugins chargés, y compris les serveurs MCP configurés exposés par l’intermédiaire de `bundle-mcp`                              |

`spawn_task` permet à un agent de programmation de proposer un travail de suivi confirmé sans le démarrer. L’interface de contrôle affiche le titre et le résumé sous forme de pastille actionnable ; une TUI reposant sur le Gateway affiche une invite interactive équivalente. L’acceptation de l’une ou l’autre crée une nouvelle session dans un arbre de travail géré et y envoie l’invite complète tandis que le tour actuel se poursuit. `dismiss_task` retire une suggestion encore en attente à l’aide du `task_id` éphémère renvoyé par `spawn_task`.

Les outils ne sont proposés que lorsque l’interface de l’opérateur à l’origine de l’action peut recevoir et traiter les événements de suggestion de tâche du Gateway. Les sessions de canal et les sessions TUI locales/intégrées ne les reçoivent pas ; les transports de canal nécessitent une action de tâche typée et portable avant de pouvoir exposer ce flux en toute sécurité. Les suggestions sont locales au processus et disparaissent lorsque le Gateway redémarre. Les deux outils restent dans le profil `coding` et dans `group:sessions`, de sorte que la stratégie habituelle `tools.allow` et `tools.deny` les configure automatiquement lorsque l’interface les prend en charge.

### Outils MCP et de plugins dans la stratégie des outils du bac à sable

Les serveurs MCP configurés sont exposés comme des outils appartenant au plugin sous l’identifiant de plugin `bundle-mcp`. Les profils d’outils normaux peuvent les autoriser, mais `tools.sandbox.tools` constitue une barrière supplémentaire pour les sessions en bac à sable. Si le mode du bac à sable est `"all"` ou `"non-main"`, incluez l’une de ces entrées dans la liste d’autorisation des outils du bac à sable lorsque les outils MCP/de plugins doivent être visibles :

- `bundle-mcp` pour les serveurs MCP gérés par OpenClaw à partir de `mcp.servers`
- l’identifiant du plugin pour un plugin natif spécifique
- `group:plugins` pour tous les outils appartenant aux plugins chargés
- les noms exacts des outils du serveur MCP ou des motifs glob de serveur tels que `outlook__send_mail` ou `outlook__*` lorsque vous ne souhaitez qu’un seul serveur

Les motifs glob de serveur utilisent le préfixe de serveur MCP sûr pour le fournisseur, pas nécessairement la clé brute `mcp.servers`. Les caractères autres que `[A-Za-z0-9_-]` deviennent `-`, les noms qui ne commencent pas par une lettre reçoivent le préfixe `mcp-`, et les préfixes longs ou en double peuvent être tronqués ou recevoir un suffixe ; par exemple, `mcp.servers["Outlook Graph"]` utilise un motif glob tel que `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Sans cette entrée au niveau du bac à sable, le serveur MCP peut toujours être chargé correctement, tandis que ses outils sont filtrés avant la requête au fournisseur. Utilisez `openclaw doctor` pour détecter cette configuration pour les serveurs gérés par OpenClaw dans `mcp.servers`. Les serveurs MCP chargés à partir des manifestes de plugins intégrés ou du fichier Claude `.mcp.json` utilisent la même barrière du bac à sable, mais ce diagnostic ne recense pas encore ces sources ; utilisez les mêmes entrées de liste d’autorisation si leurs outils disparaissent lors des tours en bac à sable.

### `tools.codeMode`

`tools.codeMode` active l’interface générique du mode code d’OpenClaw. Lorsqu’il est activé
pour une exécution avec des outils, les outils OpenClaw habituels sont placés derrière la passerelle de catalogue `tools.*`
dans le bac à sable, et les outils MCP sont disponibles via l’espace de noms `MCP`
généré. Le modèle voit normalement `exec` et `wait` ; les outils tels que `computer`,
dont les résultats structurés ne peuvent pas traverser la passerelle limitée au JSON, restent directs.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

La forme abrégée est également acceptée :

```json5
{
  tools: { codeMode: true },
}
```

Les déclarations MCP sont exposées par l’intermédiaire de l’interface de fichiers de l’API virtuelle en lecture seule en
mode code. Le code invité peut appeler `API.list("mcp")` et
`API.read("mcp/<server>.d.ts")` pour examiner les signatures de style TypeScript avant
d’appeler `MCP.<server>.<tool>()`. Consultez le [mode code](/fr/reference/code-mode) pour connaître le
contrat d’exécution, les limites et les étapes de débogage.

### `tools.allow` / `tools.deny`

Politique globale d’autorisation/interdiction des outils (l’interdiction prévaut). Insensible à la casse et compatible avec les caractères génériques `*`. Elle s’applique même lorsque le bac à sable Docker est désactivé.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` et `apply_patch` sont des identifiants d’outil distincts. `allow: ["write"]` active également `apply_patch` pour les modèles compatibles, mais `deny: ["write"]` n’interdit pas `apply_patch`. Pour bloquer toute modification de fichiers, interdisez `group:fs` ou répertoriez explicitement chaque outil de modification :

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` et `alsoAllow` ne peuvent pas être définis simultanément dans la même portée (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — la validation de la configuration le refuse. Fusionnez les entrées de `alsoAllow` dans `allow`, ou supprimez `allow` et utilisez plutôt `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Restreint davantage les outils pour des fournisseurs ou modèles spécifiques. Ordre : profil de base → profil du fournisseur → autorisation/interdiction.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Restreint les outils pour une identité de demandeur spécifique. Il s’agit d’une mesure de défense en profondeur qui complète le contrôle d’accès au canal ; les valeurs d’expéditeur doivent provenir de l’adaptateur du canal, et non du texte du message.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Les clés utilisent des préfixes explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ou `"*"`. Les identifiants de canal sont les identifiants canoniques d’OpenClaw ; les alias tels que `teams` sont normalisés en `msteams`. Les anciennes clés sans préfixe sont acceptées uniquement comme `id:`. L’ordre de correspondance est canal+identifiant, identifiant, e164, nom d’utilisateur, nom, puis caractère générique.

La configuration par agent `agents.list[].tools.toolsBySender` remplace la correspondance globale de l’expéditeur lorsqu’elle correspond, même avec une politique vide `{}`.

### `tools.elevated`

Contrôle l’accès élevé à l’exécution en dehors du bac à sable :

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Le remplacement par agent (`agents.list[].tools.elevated`) ne peut qu’ajouter des restrictions.
- `/elevated on|off|ask|full` enregistre l’état pour chaque session ; les directives intégrées ne s’appliquent qu’à un seul message.
- Une exécution `exec` élevée contourne le bac à sable et utilise le chemin de sortie configuré (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Les valeurs affichées sont les valeurs par défaut, à l’exception de `applyPatch.allowModels` (vide ou non défini par défaut, ce qui signifie que tout modèle compatible peut utiliser `apply_patch`). `approvalRunningNoticeMs` émet une notification d’exécution lorsqu’une commande `exec` soumise à approbation s’exécute longtemps ; `0` la désactive.

### `tools.loopDetection`

Les contrôles de sécurité contre les boucles d’outils sont **désactivés par défaut**. Définissez `enabled: true` pour activer la détection. Les paramètres peuvent être définis globalement dans `tools.loopDetection` et remplacés pour chaque agent dans `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Taille maximale de l’historique des appels d’outils conservé pour l’analyse des boucles.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Seuil de répétition d’un schéma sans progression déclenchant des avertissements.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Bloque les appels répétés au même nom d’outil indisponible ou inconnu après ce nombre d’échecs.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Seuil de répétition supérieur pour bloquer les boucles critiques.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Seuil d’arrêt définitif pour toute exécution sans progression.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avertit en cas d’appels répétés avec le même outil et les mêmes arguments.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avertit ou bloque en cas d’utilisation d’outils d’interrogation connus (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avertit ou bloque en cas de schémas alternés par paires sans progression.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Nombre de tentatives pendant lesquelles la protection reste active après une Compaction automatique ; elle interrompt l’exécution si l’agent répète la même combinaison (outil, arguments, résultat) dans cette fenêtre.
</ParamField>

<Warning>
Si `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, la validation échoue.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

Les valeurs indiquées sont les valeurs par défaut, sauf pour `provider` et `userAgent`. `maxResponseBytes` est limité à une valeur comprise entre 32000 et 10000000 ; `maxChars` est limité à `maxCharsCap` (augmentez `maxCharsCap` pour autoriser des réponses plus volumineuses).

### `tools.media`

Configure la compréhension des médias entrants (image, audio et vidéo) :

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (valeur par défaut : `2`), `audio.maxBytes` (valeur par défaut : 20 Mo) et `video.maxBytes` (valeur par défaut : 50 Mo) sont affichés avec leurs valeurs par défaut ; la valeur par défaut de `image.maxBytes` est de 10 Mo. Délais d’expiration par défaut des requêtes pour chaque capacité : `60` s pour les images et l’audio, `120` s pour la vidéo.

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Entrée de fournisseur** (`type: "provider"` ou omis) :

    - `provider` : identifiant du fournisseur d’API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model` : remplacement de l’identifiant du modèle
    - `profile` / `preferredProfile` : sélection du profil dans `auth-profiles.json`

    **Entrée CLI** (`type: "cli"`) :

    - `command` : exécutable à lancer
    - `args` : arguments fondés sur un modèle (prend en charge `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc. ; `openclaw doctor --fix` migre les espaces réservés obsolètes `{input}` vers `{{MediaPath}}`)

    **Champs communs :**

    - `capabilities` : liste facultative (`image`, `audio`, `video`). Chaque Plugin de fournisseur déclare son propre ensemble de capacités par défaut ; par exemple, le fournisseur `openai` intégré utilise par défaut l’image et l’audio, `anthropic`/`minimax` l’image, `google` l’image, l’audio et la vidéo, et `groq` l’audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language` : remplacements propres à chaque entrée.
    - `tools.media.image.timeoutSeconds` et les entrées `timeoutSeconds` correspondantes du modèle d’image s’appliquent également lorsque l’agent appelle explicitement l’outil `image`. Pour la compréhension des images, ce délai d’expiration s’applique à la requête elle-même et n’est pas réduit par le travail de préparation effectué auparavant.
    - En cas d’échec, l’entrée suivante est utilisée.

    L’authentification du fournisseur suit l’ordre standard : `auth-profiles.json` → variables d’environnement → `models.providers.*.apiKey`.

    **Champs de finalisation asynchrone :**

    - `asyncCompletion.directSend` : indicateur de compatibilité obsolète. Les tâches multimédias asynchrones terminées restent traitées par l’intermédiaire de la session du demandeur afin que l’agent reçoive le résultat, décide comment le communiquer à l’utilisateur et utilise l’outil de messagerie lorsque la remise à la source l’exige.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Détermine les sessions qui peuvent être ciblées par les outils de session (`sessions_list`, `sessions_history`, `sessions_send`).

Valeur par défaut : `tree` (session actuelle et sessions qu’elle a créées, notamment les sous-agents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self` : uniquement la clé de la session actuelle.
    - `tree` : session actuelle et sessions créées par celle-ci (sous-agents).
    - `agent` : toute session appartenant à l’identifiant de l’agent actuel (cela peut inclure d’autres utilisateurs si vous exécutez des sessions par expéditeur sous le même identifiant d’agent).
    - `all` : toute session. Le ciblage entre agents nécessite toujours `tools.agentToAgent`.
    - Limitation du bac à sable : lorsque la session actuelle est exécutée dans un bac à sable et que `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (valeur par défaut), la visibilité est forcée à `tree`, même si `tools.sessions.visibility="all"`.
    - Lorsque la valeur n’est pas `all`, `sessions_list` inclut un champ `visibility` compact
      décrivant le mode effectif ainsi qu’un avertissement indiquant que certaines sessions peuvent être
      omises si elles se trouvent hors de la portée actuelle.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Contrôle la prise en charge des pièces jointes intégrées pour `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - Les pièces jointes nécessitent `enabled: true`.
    - Les pièces jointes des sous-agents sont matérialisées dans l’espace de travail enfant sous `.openclaw/attachments/<uuid>/`, avec un fichier `.manifest.json`.
    - Les pièces jointes ACP sont limitées aux images et transmises directement à l’environnement d’exécution ACP après validation des mêmes limites concernant le nombre de fichiers, la taille de chaque fichier et la taille totale.
    - Le contenu des pièces jointes est automatiquement expurgé lors de la conservation de la transcription.
    - Les entrées Base64 sont validées par des contrôles stricts de l’alphabet et du remplissage, ainsi que par une vérification de taille avant décodage.
    - Les autorisations des fichiers joints des sous-agents sont `0700` pour les répertoires et `0600` pour les fichiers.
    - Le nettoyage des sous-agents suit la stratégie `cleanup` : `delete` supprime toujours les pièces jointes ; `keep` ne les conserve que lorsque `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicateurs expérimentaux des outils intégrés. Désactivés par défaut, sauf si une règle d’activation automatique pour GPT-5 en mode agentique strict s’applique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool` : active l’outil structuré `update_plan` pour suivre les travaux non triviaux comportant plusieurs étapes.
- Valeur par défaut : `false`, sauf si `agents.defaults.embeddedAgent.executionContract` (ou un remplacement propre à l’agent) est défini sur `"strict-agentic"` pour une exécution du fournisseur `openai` utilisant un identifiant de modèle de la famille GPT-5 (cela couvre également les exécutions d’OpenAI Codex CLI, puisque l’authentification et le routage des modèles de Codex relèvent du fournisseur `openai`). Définissez la valeur sur `true` pour forcer l’activation de l’outil hors de cette portée, ou sur `false` pour le maintenir désactivé même lors des exécutions GPT-5 en mode agentique strict.
- Lorsqu’il est activé, l’invite système ajoute également des consignes d’utilisation afin que le modèle ne l’emploie que pour des travaux substantiels et ne conserve au maximum qu’une seule étape `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model` : modèle par défaut des sous-agents créés. S’il est omis, les sous-agents héritent du modèle de l’appelant.
- `allowAgents` : liste d’autorisation par défaut des identifiants d’agents cibles configurés pour `sessions_spawn` lorsque l’agent demandeur ne définit pas sa propre valeur `subagents.allowAgents` (`["*"]` = toute cible configurée ; valeur par défaut : uniquement le même agent). Les entrées obsolètes dont la configuration d’agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer.
- `maxConcurrent` : nombre maximal d’exécutions simultanées de sous-agents. Valeur par défaut : `8`.
- `runTimeoutSeconds` : délai d’expiration, en secondes, de `sessions_spawn` lorsque l’appelant ne fournit pas son propre remplacement. Valeur par défaut : `0` (aucun délai d’expiration) ; la valeur `900` indiquée ci-dessus est une valeur d’activation facultative courante, et non la valeur par défaut intégrée.
- `announceTimeoutMs` : délai d’expiration par appel, en millisecondes, des tentatives de remise des annonces `agent` du Gateway. Valeur par défaut : `120000`. Les nouvelles tentatives transitoires peuvent prolonger l’attente totale de l’annonce au-delà d’un seul délai d’expiration configuré.
- `archiveAfterMinutes` : nombre de minutes après la fin d’une session de sous-agent avant son archivage automatique. Valeur par défaut : `60` ; `0` désactive l’archivage automatique.
- Stratégie d’outils par sous-agent : `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Fournisseurs personnalisés et URL de base

Les Plugins de fournisseurs publient leurs propres lignes de catalogue de modèles. Ajoutez des fournisseurs personnalisés au moyen de `models.providers` dans la configuration ou de `~/.openclaw/agents/<agentId>/agent/models.json`.

La configuration du `baseUrl` d’un fournisseur personnalisé ou local constitue également la décision restreinte de confiance réseau pour les requêtes HTTP des modèles : OpenClaw autorise cette origine `scheme://host:port` exacte par l’intermédiaire du chemin de récupération protégé, sans ajouter d’option de configuration distincte ni accorder sa confiance à d’autres origines privées.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Authentification et priorité de fusion">
    - Utilisez `authHeader: true` + `headers` pour les besoins d’authentification personnalisés.
    - Remplacez la racine de configuration de l’agent avec `OPENCLAW_AGENT_DIR`.
    - Priorité de fusion pour les identifiants de fournisseurs correspondants :
      - Les valeurs `baseUrl` non vides du fichier `models.json` de l’agent sont prioritaires.
      - Les valeurs `apiKey` non vides de l’agent sont prioritaires uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
      - Les valeurs `apiKey` des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs de source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références de fichier/exécution) au lieu de conserver les secrets résolus.
      - Les valeurs d’en-tête des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs de source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références de fichier/exécution).
      - Si les valeurs `apiKey`/`baseUrl` de l’agent sont vides ou absentes, celles de `models.providers` dans la configuration sont utilisées.
      - Pour les valeurs `contextWindow`/`maxTokens` d’un modèle correspondant : la valeur explicite de la configuration est prioritaire lorsqu’elle est présente et valide (un nombre fini positif) ; sinon, la valeur implicite/générée du catalogue est utilisée.
      - La valeur `contextTokens` d’un modèle correspondant suit la même règle donnant la priorité à la valeur explicite, puis à la valeur implicite ; utilisez-la pour limiter le contexte effectif sans modifier les métadonnées natives du modèle.
      - Les catalogues des Plugins de fournisseurs sont stockés sous forme de fragments de catalogue générés et détenus par le Plugin dans l’état des Plugins de l’agent.
      - Utilisez `models.mode: "replace"` lorsque vous souhaitez que la configuration réécrive entièrement `models.json` et ignore la fusion des fragments de catalogue détenus par les Plugins.
      - La persistance des marqueurs fait autorité sur la source : les marqueurs sont écrits depuis l’instantané actif de la configuration source (avant résolution), et non depuis les valeurs de secrets résolues à l’exécution.

  </Accordion>
</AccordionGroup>

### Détails des champs de fournisseur

<AccordionGroup>
  <Accordion title="Catalogue de premier niveau">
    - `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
    - `models.providers` : table personnalisée de fournisseurs indexée par identifiant de fournisseur.
      - Modifications sûres : utilisez `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` pour les mises à jour additives. `config set` refuse les remplacements destructifs, sauf si vous transmettez `--replace`.

  </Accordion>
  <Accordion title="Connexion au fournisseur et authentification">
    - `models.providers.*.api` : adaptateur de requête (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Pour les services auto-hébergés `/v1/chat/completions` tels que MLX, vLLM, SGLang et la plupart des serveurs locaux compatibles avec OpenAI, utilisez `openai-completions`. Un fournisseur personnalisé avec `baseUrl`, mais sans `api`, utilise par défaut `openai-completions` ; définissez `openai-responses` uniquement lorsque le service prend en charge `/v1/responses`.
    - `models.providers.*.apiKey` : identifiant d’accès du fournisseur (préférez SecretRef ou la substitution de variable d’environnement).
    - `models.providers.*.auth` : stratégie d’authentification (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow` : fenêtre de contexte native par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextWindow`.
    - `models.providers.*.contextTokens` : limite effective de contexte à l’exécution par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextTokens`.
    - `models.providers.*.maxTokens` : limite par défaut du nombre de jetons en sortie pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `maxTokens`.
    - `models.providers.*.timeoutSeconds` : délai d’expiration HTTP facultatif, en secondes et propre à chaque fournisseur, pour les requêtes de modèle, incluant la connexion, les en-têtes, le corps et la gestion de l’abandon total de la requête.
    - `models.providers.*.injectNumCtxForOpenAICompat` : pour Ollama + `openai-completions`, injecte `options.num_ctx` dans les requêtes (valeur par défaut : `true`).
    - `models.providers.*.authHeader` : force, lorsque cela est requis, le transport de l’identifiant d’accès dans l’en-tête `Authorization`.
    - `models.providers.*.baseUrl` : URL de base de l’API en amont.
    - `models.providers.*.headers` : en-têtes statiques supplémentaires pour le routage par proxy ou locataire.

  </Accordion>
  <Accordion title="Remplacements du transport des requêtes">
    `models.providers.*.request` : remplacements du transport pour les requêtes HTTP adressées aux fournisseurs de modèles.

    - `request.headers` : en-têtes supplémentaires (fusionnés avec les valeurs par défaut du fournisseur). Les valeurs acceptent SecretRef.
    - `request.auth` : remplacement de la stratégie d’authentification. Modes : `"provider-default"` (utilise l’authentification intégrée du fournisseur), `"authorization-bearer"` (avec `token`), `"header"` (avec `headerName`, `value` et, facultativement, `prefix`).
    - `request.proxy` : remplacement du proxy HTTP. Modes : `"env-proxy"` (utilise les variables d’environnement `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (avec `url`). Les deux modes acceptent un sous-objet `tls` facultatif.
    - `request.tls` : remplacement de TLS pour les connexions directes. Champs : `ca`, `cert`, `key`, `passphrase` (tous acceptent SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork` : lorsque la valeur est `true`, autorise les requêtes HTTP adressées aux fournisseurs de modèles vers des plages privées, CGNAT ou similaires via la protection de récupération HTTP du fournisseur. Les URL de base des fournisseurs personnalisés/locaux font déjà confiance à l’origine exacte configurée, à l’exception des origines de métadonnées ou locales au lien, qui restent bloquées sans autorisation explicite. Définissez cette valeur sur `false` pour désactiver la confiance accordée à l’origine exacte. WebSocket utilise le même objet `request` pour les en-têtes/TLS, mais pas cette protection SSRF de récupération. Valeur par défaut : `false`.

  </Accordion>
  <Accordion title="Entrées du catalogue de modèles">
    - `models.providers.*.models` : entrées explicites du catalogue de modèles du fournisseur.
    - `models.providers.*.models.*.input` : modalités d’entrée du modèle. Utilisez `["text"]` pour les modèles uniquement textuels et `["text", "image"]` pour les modèles prenant nativement en charge les images/la vision. Les pièces jointes contenant des images ne sont injectées dans les tours de l’agent que lorsque le modèle sélectionné est indiqué comme prenant en charge les images.
    - `models.providers.*.models.*.contextWindow` : métadonnées de la fenêtre de contexte native du modèle. Cette valeur remplace `contextWindow` au niveau du fournisseur pour ce modèle.
    - `models.providers.*.models.*.contextTokens` : limite facultative du contexte à l’exécution. Cette valeur remplace `contextTokens` au niveau du fournisseur ; utilisez-la lorsque vous souhaitez un budget de contexte effectif inférieur à la valeur `contextWindow` native du modèle ; `openclaw models list` affiche les deux valeurs lorsqu’elles diffèrent.
    - `models.providers.*.models.*.compat.supportsDeveloperRole` : indication de compatibilité facultative. Pour `api: "openai-completions"` avec une valeur `baseUrl` non vide et non native (hôte différent de `api.openai.com`), OpenClaw force cette valeur à `false` lors de l’exécution. Une valeur `baseUrl` vide ou omise conserve le comportement par défaut d’OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent` : indication de compatibilité facultative pour les points de terminaison de conversation compatibles avec OpenAI qui n’acceptent que des chaînes. Lorsque la valeur est `true`, OpenClaw convertit les tableaux `messages[].content` exclusivement textuels en chaînes simples avant l’envoi de la requête.
    - `models.providers.*.models.*.compat.strictMessageKeys` : indication de compatibilité facultative pour les points de terminaison de conversation stricts compatibles avec OpenAI. Lorsque la valeur est `true`, OpenClaw réduit les objets de message Chat Completions sortants à `role` et `content` avant l’envoi de la requête.
    - `models.providers.*.models.*.compat.thinkingFormat` : indication facultative sur la charge utile de réflexion. Utilisez `"together"` pour `reasoning.enabled` au format Together, `"qwen"` pour `enable_thinking` au premier niveau ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les serveurs compatibles avec OpenAI de la famille Qwen qui prennent en charge les arguments nommés de modèle de conversation au niveau de la requête, tels que vLLM. Les modèles Qwen vLLM configurés proposent des choix binaires `/think` (`off`, `on`) pour ces formats.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages` : indication de compatibilité facultative pour les services Chat Completions au format DeepSeek qui exigent que les messages antérieurs de l’assistant conservent `reasoning_content` lors de la relecture. Lorsque la valeur est `true`, OpenClaw conserve ce champ dans les messages sortants de l’assistant. Utilisez cette option lors de la connexion d’un proxy personnalisé compatible avec DeepSeek qui rejette les requêtes après suppression du raisonnement. Valeur par défaut : `false`.

  </Accordion>
  <Accordion title="Découverte d’Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery` : racine des paramètres de découverte automatique de Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled` : active ou désactive la découverte implicite.
    - `plugins.entries.amazon-bedrock.config.discovery.region` : région AWS pour la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter` : filtre facultatif par identifiant de fournisseur pour une découverte ciblée.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval` : intervalle d’interrogation pour l’actualisation de la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow` : fenêtre de contexte de secours pour les modèles découverts.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens` : nombre maximal de jetons en sortie de secours pour les modèles découverts.

  </Accordion>
</AccordionGroup>

La configuration interactive d’un fournisseur personnalisé déduit la prise en charge des images pour les motifs d’identifiants connus de modèles de vision, notamment GPT-4o/GPT-4.1/GPT-5+, les familles de raisonnement `o1`/`o3`/`o4`, Claude, Gemini, tout identifiant se terminant par `-vl` (Qwen-VL et modèles similaires), ainsi que les familles nommées telles que LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V et GLM-4V ; elle ignore la question supplémentaire pour les familles connues comme uniquement textuelles (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama et les identifiants Qwen seuls, sans suffixe vl/vision). Pour les identifiants de modèles inconnus, une question sur la prise en charge des images est toujours posée. La configuration non interactive utilise la même déduction ; transmettez `--custom-image-input` pour forcer les métadonnées indiquant la prise en charge des images, ou `--custom-text-input` pour forcer les métadonnées indiquant une entrée uniquement textuelle.

### Exemples de fournisseurs

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Le Plugin de fournisseur externe officiel `cerebras` peut effectuer cette configuration via `openclaw onboard --auth-choice cerebras-api-key`. Utilisez une configuration explicite du fournisseur uniquement pour remplacer les valeurs par défaut.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Utilisez `cerebras/zai-glm-4.7` pour Cerebras ; `zai/glm-4.7` pour un accès direct à Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Fournisseur intégré compatible avec Anthropic. Raccourci : `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modèles locaux (LM Studio)">
    Consultez [Modèles locaux](/fr/gateway/local-models). En bref : exécutez un grand modèle local via l’API Responses de LM Studio sur une machine puissante ; conservez les modèles hébergés fusionnés comme solution de repli.
  </Accordion>
  <Accordion title="MiniMax M3 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Définissez `MINIMAX_API_KEY`. Raccourcis : `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. Le catalogue de modèles utilise M3 par défaut et comprend également les variantes M2.7. Sur le chemin de diffusion en continu compatible avec Anthropic, OpenClaw désactive par défaut le raisonnement de MiniMax M2.x, sauf si vous définissez explicitement `thinking` vous-même ; MiniMax-M3 (et M3.x) conserve par défaut le mode de raisonnement omis/adaptatif du fournisseur. `/fast on` ou `params.fastMode: true` remplace `MiniMax-M2.7` par `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Pour le point de terminaison chinois : `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Les points de terminaison Moonshot natifs annoncent la compatibilité de l’utilisation en diffusion continue sur le transport partagé `openai-completions`, et OpenClaw active cette fonctionnalité selon les capacités du point de terminaison plutôt qu’en fonction du seul identifiant de fournisseur intégré.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Définissez `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Utilisez les références `opencode/...` pour le catalogue Zen ou les références `opencode-go/...` pour le catalogue Go. Raccourci : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (compatible avec Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    L’URL de base doit omettre `/v1` (le client Anthropic l’ajoute). Raccourci : `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Définissez `ZAI_API_KEY`. Les références de modèles utilisent l’identifiant de fournisseur canonique `zai/*`. Raccourci : `openclaw onboard --auth-choice zai-api-key`.

    - Point de terminaison général : `https://api.z.ai/api/paas/v4`
    - Point de terminaison de programmation : `https://api.z.ai/api/coding/paas/v4`
    - Le choix d’authentification `zai-api-key` par défaut teste votre clé et détecte automatiquement le point de terminaison auquel elle appartient (en affichant une invite, avec Global comme valeur par défaut, si la détection n’est pas concluante). Des choix d’authentification dédiés à CN et Coding-Plan sont également disponibles pour une sélection explicite.
    - Pour le point de terminaison général, définissez un fournisseur personnalisé en remplaçant l’URL de base.

  </Accordion>
</AccordionGroup>

---

## Contenu connexe

- [Configuration — agents](/fr/gateway/config-agents)
- [Configuration — canaux](/fr/gateway/config-channels)
- [Référence de configuration](/fr/gateway/configuration-reference) — autres clés de niveau supérieur
- [Outils et plugins](/fr/tools)
