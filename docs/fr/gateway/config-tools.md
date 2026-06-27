---
read_when:
    - Configuration de la politique `tools.*`, des listes d’autorisation ou des fonctionnalités expérimentales
    - Enregistrement de fournisseurs personnalisés ou remplacement des URL de base
    - Configuration de points de terminaison auto-hébergés compatibles avec OpenAI
sidebarTitle: Tools and custom providers
summary: Configuration des outils (politique, options expérimentales, outils adossés à des fournisseurs) et configuration d’un fournisseur personnalisé/URL de base
title: Configuration — outils et fournisseurs personnalisés
x-i18n:
    generated_at: "2026-06-27T17:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

Clés de configuration `tools.*` et configuration de fournisseur personnalisé / URL de base. Pour les agents, les canaux et les autres clés de configuration de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Outils

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant `tools.allow`/`tools.deny` :

<Note>
L’onboarding local définit par défaut les nouvelles configurations locales sur `tools.profile: "coding"` lorsqu’il n’est pas défini (les profils explicites existants sont conservés).
</Note>

| Profil      | Inclut                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | `session_status` uniquement                                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `full`      | Aucune restriction (identique à non défini)                                                                                                      |

### Groupes d’outils

| Groupe             | Outils                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Tous les outils intégrés (exclut les Plugins fournisseurs)                                                              |
| `group:plugins`    | Outils détenus par les Plugins chargés, y compris les serveurs MCP configurés exposés via `bundle-mcp`                  |

### Outils MCP et Plugin dans la politique d’outils du bac à sable

Les serveurs MCP configurés sont exposés comme outils détenus par un Plugin sous l’identifiant de Plugin `bundle-mcp`. Les profils d’outils normaux peuvent les autoriser, mais `tools.sandbox.tools` constitue une barrière supplémentaire pour les sessions en bac à sable. Si le mode bac à sable est `"all"` ou `"non-main"`, incluez l’une de ces entrées dans la liste d’autorisation des outils du bac à sable lorsque les outils MCP/Plugin doivent être visibles :

- `bundle-mcp` pour les serveurs MCP gérés par OpenClaw depuis `mcp.servers`
- l’identifiant de Plugin pour un Plugin natif spécifique
- `group:plugins` pour tous les outils détenus par des Plugins chargés
- les noms exacts des outils de serveur MCP ou des globs de serveur comme `outlook__send_mail` ou `outlook__*` lorsque vous ne voulez qu’un seul serveur

Les globs de serveur utilisent le préfixe de serveur MCP compatible avec le fournisseur, pas nécessairement la clé brute `mcp.servers`. Les caractères non `[\A-Za-z0-9_-]` deviennent `-`, les noms qui ne commencent pas par une lettre reçoivent un préfixe `mcp-`, et les préfixes longs ou dupliqués peuvent être tronqués ou suffixés ; par exemple, `mcp.servers["Outlook Graph"]` utilise un glob comme `outlook-graph__*`.

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

Sans cette entrée de couche bac à sable, le serveur MCP peut toujours se charger correctement tandis que ses outils sont filtrés avant la requête au fournisseur. Utilisez `openclaw doctor` pour détecter cette forme pour les serveurs gérés par OpenClaw dans `mcp.servers`. Les serveurs MCP chargés depuis des manifestes de Plugins intégrés ou depuis `.mcp.json` de Claude utilisent la même barrière de bac à sable, mais ce diagnostic n’énumère pas encore ces sources ; utilisez les mêmes entrées de liste d’autorisation si leurs outils disparaissent lors des tours en bac à sable.

### `tools.codeMode`

`tools.codeMode` active la surface générique de mode code d’OpenClaw. Lorsqu’elle est activée
pour une exécution avec outils, le modèle ne voit que `exec` et `wait` ; les outils OpenClaw
normaux passent derrière le pont de catalogue `tools.*` dans le bac à sable, et les outils MCP sont
disponibles via l’espace de noms `MCP` généré.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Le raccourci est également accepté :

```json5
{
  tools: { codeMode: true },
}
```

Les déclarations MCP sont exposées via la surface de fichiers d’API virtuelle en lecture seule en
mode code. Le code invité peut appeler `API.list("mcp")` et
`API.read("mcp/<server>.d.ts")` pour inspecter les signatures de style TypeScript avant
d’appeler `MCP.<server>.<tool>()`. Consultez le [mode code](/fr/reference/code-mode) pour le
contrat d’exécution, les limites et les étapes de débogage.

### `tools.allow` / `tools.deny`

Politique globale d’autorisation/refus des outils (le refus l’emporte). Insensible à la casse, prend en charge les jokers `*`. S’applique même lorsque le bac à sable Docker est désactivé.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` et `apply_patch` sont des identifiants d’outils distincts. `allow: ["write"]` active également `apply_patch` pour les modèles compatibles, mais `deny: ["write"]` ne refuse pas `apply_patch`. Pour bloquer toute mutation de fichiers, refusez `group:fs` ou listez explicitement chaque outil de mutation :

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Restreint davantage les outils pour des fournisseurs ou modèles spécifiques. Ordre : profil de base → profil fournisseur → autorisation/refus.

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

Restreint les outils pour une identité de demandeur spécifique. Il s’agit d’une défense en profondeur en plus du contrôle d’accès du canal ; les valeurs d’expéditeur doivent provenir de l’adaptateur de canal, pas du texte du message.

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

Les clés utilisent des préfixes explicites : `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ou `"*"`. Les identifiants de canaux sont les identifiants canoniques d’OpenClaw ; les alias comme `teams` se normalisent en `msteams`. Les anciennes clés sans préfixe sont acceptées comme `id:` uniquement. L’ordre de correspondance est canal+id, id, e164, username, name, puis joker.

La configuration par agent `agents.list[].tools.toolsBySender` remplace la correspondance globale de l’expéditeur lorsqu’elle correspond, même avec une politique vide `{}`.

### `tools.elevated`

Contrôle l’accès exec élevé hors du bac à sable :

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

- La substitution par agent (`agents.list[].tools.elevated`) ne peut que restreindre davantage.
- `/elevated on|off|ask|full` stocke l’état par session ; les directives en ligne s’appliquent à un seul message.
- `exec` élevé contourne le bac à sable et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Les vérifications de sécurité des boucles d’outils sont **désactivées par défaut**. Définissez `enabled: true` pour activer la détection. Les paramètres peuvent être définis globalement dans `tools.loopDetection` et remplacés par agent dans `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Historique maximal des appels d’outils conservé pour l’analyse des boucles.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Seuil de motif répété sans progression pour les avertissements.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Seuil répété plus élevé pour bloquer les boucles critiques.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Seuil d’arrêt strict pour toute exécution sans progression.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avertir en cas d’appels répétés au même outil avec les mêmes arguments.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avertir/bloquer sur les outils de scrutation connus (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avertir/bloquer sur les motifs de paires alternées sans progression.
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Configure la compréhension des médias entrants (image/audio/vidéo) :

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // obsolète : les achèvements restent médiés par l’agent
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

<AccordionGroup>
  <Accordion title="Champs d’entrée du modèle de média">
    **Entrée de fournisseur** (`type: "provider"` ou omis) :

    - `provider` : identifiant du fournisseur d’API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model` : remplacement de l’identifiant du modèle
    - `profile` / `preferredProfile` : sélection du profil `auth-profiles.json`

    **Entrée CLI** (`type: "cli"`) :

    - `command` : exécutable à lancer
    - `args` : arguments basés sur un modèle (prend en charge `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc. ; `openclaw doctor --fix` migre les espaces réservés obsolètes `{input}` vers `{{MediaPath}}`)

    **Champs communs :**

    - `capabilities` : liste facultative (`image`, `audio`, `video`). Valeurs par défaut : `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language` : remplacements par entrée.
    - Les entrées `tools.media.image.timeoutSeconds` et `timeoutSeconds` du modèle d’image correspondant s’appliquent également lorsque l’agent appelle l’outil explicite `image`. Pour la compréhension d’images, ce délai d’expiration s’applique à la requête elle-même et n’est pas réduit par le travail de préparation antérieur.
    - Les échecs basculent vers l’entrée suivante.

    L’authentification du fournisseur suit l’ordre standard : `auth-profiles.json` → variables d’environnement → `models.providers.*.apiKey`.

    **Champs d’achèvement asynchrone :**

    - `asyncCompletion.directSend` : indicateur de compatibilité obsolète. Les tâches média asynchrones terminées restent médiées par la session demandeuse afin que l’agent reçoive le résultat, décide comment informer l’utilisateur et utilise l’outil de message lorsque la livraison source l’exige.

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

Contrôle quelles sessions peuvent être ciblées par les outils de session (`sessions_list`, `sessions_history`, `sessions_send`).

Par défaut : `tree` (session actuelle + sessions qu’elle a créées, comme les sous-agents).

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
  <Accordion title="Portées de visibilité">
    - `self` : uniquement la clé de session actuelle.
    - `tree` : session actuelle + sessions créées par la session actuelle (sous-agents).
    - `agent` : toute session appartenant à l’identifiant de l’agent actuel (peut inclure d’autres utilisateurs si vous exécutez des sessions par expéditeur sous le même identifiant d’agent).
    - `all` : toute session. Le ciblage entre agents nécessite toujours `tools.agentToAgent`.
    - Limitation du bac à sable : lorsque la session actuelle est en bac à sable et que `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilité est forcée à `tree` même si `tools.sessions.visibility="all"`.
    - Lorsque la valeur n’est pas `all`, `sessions_list` inclut un champ compact `visibility`
      décrivant le mode effectif et un avertissement indiquant que certaines sessions peuvent être
      omises hors de la portée actuelle.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Contrôle la prise en charge des pièces jointes en ligne pour `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in : définissez sur true pour autoriser les pièces jointes de fichiers en ligne
        maxTotalBytes: 5242880, // 5 Mo au total sur tous les fichiers
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 Mo par fichier
        retainOnSessionKeep: false, // conserver les pièces jointes lorsque cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notes sur les pièces jointes">
    - Les pièces jointes nécessitent `enabled: true`.
    - Les pièces jointes de sous-agent sont matérialisées dans l’espace de travail enfant à `.openclaw/attachments/<uuid>/` avec un `.manifest.json`.
    - Les pièces jointes ACP concernent uniquement les images et sont transférées en ligne au runtime ACP après validation des mêmes limites de nombre de fichiers, d’octets par fichier et d’octets totaux.
    - Le contenu des pièces jointes est automatiquement expurgé de la persistance des transcriptions.
    - Les entrées Base64 sont validées avec des contrôles stricts d’alphabet/de remplissage et une garde de taille avant décodage.
    - Les autorisations des fichiers de pièces jointes de sous-agent sont `0700` pour les répertoires et `0600` pour les fichiers.
    - Le nettoyage du sous-agent suit la stratégie `cleanup` : `delete` supprime toujours les pièces jointes ; `keep` les conserve uniquement lorsque `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicateurs d’outils intégrés expérimentaux. Désactivés par défaut sauf si une règle d’activation automatique GPT-5 strictement agentique s’applique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // activer l’élément expérimental update_plan
    },
  },
}
```

- `planTool` : active l’outil structuré `update_plan` pour le suivi des travaux multi-étapes non triviaux.
- Par défaut : `false` sauf si `agents.defaults.embeddedAgent.executionContract` (ou un remplacement par agent) est défini sur `"strict-agentic"` pour une exécution de la famille GPT-5 OpenAI ou OpenAI Codex. Définissez `true` pour forcer l’activation de l’outil hors de cette portée, ou `false` pour le garder désactivé même pour les exécutions GPT-5 strictement agentiques.
- Lorsqu’il est activé, l’invite système ajoute également des consignes d’utilisation afin que le modèle ne l’utilise que pour des travaux substantiels et conserve au plus une étape `in_progress`.

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

- `model` : modèle par défaut pour les sous-agents créés. S’il est omis, les sous-agents héritent du modèle de l’appelant.
- `allowAgents` : liste d’autorisation par défaut des identifiants d’agents cibles configurés pour `sessions_spawn` lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents` (`["*"]` = toute cible configurée ; par défaut : le même agent uniquement). Les entrées obsolètes dont la configuration d’agent a été supprimée sont rejetées par `sessions_spawn` et omises de `agents_list` ; exécutez `openclaw doctor --fix` pour les nettoyer.
- `runTimeoutSeconds` : délai d’expiration par défaut (secondes) pour `sessions_spawn`. `0` signifie aucun délai d’expiration.
- `announceTimeoutMs` : délai d’expiration par appel (millisecondes) pour les tentatives de livraison d’annonce `agent` du Gateway. Par défaut : `120000`. Les nouvelles tentatives transitoires peuvent rendre l’attente totale de l’annonce plus longue qu’un délai d’expiration configuré.
- Stratégie d’outils par sous-agent : `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Fournisseurs personnalisés et URL de base

Les Plugins de fournisseur publient leurs propres lignes de catalogue de modèles. Ajoutez des fournisseurs personnalisés via `models.providers` dans la configuration ou `~/.openclaw/agents/<agentId>/agent/models.json`.

La configuration d’un `baseUrl` de fournisseur personnalisé/local est également la décision de confiance réseau étroite pour les requêtes HTTP de modèle : OpenClaw autorise cette origine exacte `scheme://host:port` via le chemin de récupération protégé, sans ajouter d’option de configuration séparée ni faire confiance à d’autres origines privées.

```json5
{
  models: {
    mode: "merge", // merge (par défaut) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
    - Priorité de fusion pour les identifiants de fournisseur correspondants :
      - Les valeurs `baseUrl` non vides du fichier `models.json` de l’agent l’emportent.
      - Les valeurs `apiKey` non vides de l’agent l’emportent uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
      - Les valeurs `apiKey` de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de persister les secrets résolus.
      - Les valeurs d’en-tête de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
      - Les valeurs `apiKey`/`baseUrl` d’agent vides ou manquantes reviennent à `models.providers` dans la configuration.
      - Les modèles correspondants `contextWindow`/`maxTokens` utilisent la valeur la plus élevée entre la configuration explicite et les valeurs implicites du catalogue.
      - Les modèles correspondants `contextTokens` préservent une limite runtime explicite lorsqu’elle est présente ; utilisez-la pour limiter le contexte effectif sans modifier les métadonnées natives du modèle.
      - Les catalogues des Plugins de fournisseur sont stockés sous forme de fragments de catalogue générés et détenus par le Plugin dans l’état du Plugin de l’agent.
      - Utilisez `models.mode: "replace"` lorsque vous souhaitez que la configuration réécrive entièrement `models.json` et les fragments de catalogue de Plugins actifs.
      - La persistance des marqueurs fait autorité côté source : les marqueurs sont écrits depuis l’instantané actif de la configuration source (avant résolution), et non depuis les valeurs de secrets runtime résolues.

  </Accordion>
</AccordionGroup>

### Détails des champs de fournisseur

<AccordionGroup>
  <Accordion title="Catalogue de niveau supérieur">
    - `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
    - `models.providers` : carte de fournisseurs personnalisés indexée par identifiant de fournisseur.
      - Modifications sûres : utilisez `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` pour les mises à jour additives. `config set` refuse les remplacements destructifs sauf si vous passez `--replace`.

  </Accordion>
  <Accordion title="Connexion au fournisseur et authentification">
    - `models.providers.*.api` : adaptateur de requête (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.). Pour les backends `/v1/chat/completions` auto-hébergés tels que MLX, vLLM, SGLang et la plupart des serveurs locaux compatibles OpenAI, utilisez `openai-completions`. Un fournisseur personnalisé avec `baseUrl` mais sans `api` utilise par défaut `openai-completions` ; définissez `openai-responses` uniquement lorsque le backend prend en charge `/v1/responses`.
    - `models.providers.*.apiKey` : identifiant du fournisseur (préférez la substitution SecretRef/env).
    - `models.providers.*.auth` : stratégie d’authentification (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow` : fenêtre de contexte native par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextWindow`.
    - `models.providers.*.contextTokens` : plafond de contexte d’exécution effectif par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextTokens`.
    - `models.providers.*.maxTokens` : plafond de jetons de sortie par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `maxTokens`.
    - `models.providers.*.timeoutSeconds` : délai d’expiration HTTP facultatif par fournisseur pour les requêtes de modèle, en secondes, incluant la connexion, les en-têtes, le corps et la gestion de l’abandon total de la requête.
    - `models.providers.*.injectNumCtxForOpenAICompat` : pour Ollama + `openai-completions`, injecte `options.num_ctx` dans les requêtes (par défaut : `true`).
    - `models.providers.*.authHeader` : force le transport des identifiants dans l’en-tête `Authorization` lorsque nécessaire.
    - `models.providers.*.baseUrl` : URL de base de l’API amont.
    - `models.providers.*.headers` : en-têtes statiques supplémentaires pour le routage proxy/locataire.

  </Accordion>
  <Accordion title="Remplacements du transport de requête">
    `models.providers.*.request` : remplacements du transport pour les requêtes HTTP du fournisseur de modèles.

    - `request.headers` : en-têtes supplémentaires (fusionnés avec les valeurs par défaut du fournisseur). Les valeurs acceptent SecretRef.
    - `request.auth` : remplacement de la stratégie d’authentification. Modes : `"provider-default"` (utilise l’authentification intégrée du fournisseur), `"authorization-bearer"` (avec `token`), `"header"` (avec `headerName`, `value`, `prefix` facultatif).
    - `request.proxy` : remplacement du proxy HTTP. Modes : `"env-proxy"` (utilise les variables d’environnement `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (avec `url`). Les deux modes acceptent un sous-objet `tls` facultatif.
    - `request.tls` : remplacement TLS pour les connexions directes. Champs : `ca`, `cert`, `key`, `passphrase` (tous acceptent SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork` : lorsque `true`, autorise les requêtes HTTP du fournisseur de modèles vers des plages privées, CGNAT ou similaires à travers la protection de récupération HTTP du fournisseur. Les URL de base de fournisseurs personnalisés/locaux font déjà confiance à l’origine exacte configurée, sauf les origines metadata/link-local, qui restent bloquées sans opt-in explicite. Définissez cette valeur sur `false` pour désactiver la confiance accordée à l’origine exacte. WebSocket utilise le même `request` pour les en-têtes/TLS, mais pas cette barrière SSRF de récupération. Valeur par défaut : `false`.

  </Accordion>
  <Accordion title="Entrées du catalogue de modèles">
    - `models.providers.*.models` : entrées explicites du catalogue de modèles du fournisseur.
    - `models.providers.*.models.*.input` : modalités d’entrée du modèle. Utilisez `["text"]` pour les modèles texte uniquement et `["text", "image"]` pour les modèles natifs image/vision. Les pièces jointes image ne sont injectées dans les tours d’agent que lorsque le modèle sélectionné est marqué comme compatible image.
    - `models.providers.*.models.*.contextWindow` : métadonnées de fenêtre de contexte native du modèle. Cela remplace le `contextWindow` au niveau du fournisseur pour ce modèle.
    - `models.providers.*.models.*.contextTokens` : plafond de contexte d’exécution facultatif. Cela remplace le `contextTokens` au niveau du fournisseur ; utilisez-le lorsque vous voulez un budget de contexte effectif plus petit que le `contextWindow` natif du modèle ; `openclaw models list` affiche les deux valeurs lorsqu’elles diffèrent.
    - `models.providers.*.models.*.compat.supportsDeveloperRole` : indice de compatibilité facultatif. Pour `api: "openai-completions"` avec un `baseUrl` non natif non vide (hôte différent de `api.openai.com`), OpenClaw force cette valeur à `false` à l’exécution. Un `baseUrl` vide/omis conserve le comportement OpenAI par défaut.
    - `models.providers.*.models.*.compat.requiresStringContent` : indice de compatibilité facultatif pour les points de terminaison de chat compatibles OpenAI acceptant uniquement des chaînes. Lorsque `true`, OpenClaw aplatit les tableaux `messages[].content` de texte pur en chaînes simples avant d’envoyer la requête.
    - `models.providers.*.models.*.compat.strictMessageKeys` : indice de compatibilité facultatif pour les points de terminaison de chat compatibles OpenAI stricts. Lorsque `true`, OpenClaw réduit les objets de message Chat Completions sortants à `role` et `content` avant d’envoyer la requête.
    - `models.providers.*.models.*.compat.thinkingFormat` : indice facultatif de charge utile de raisonnement. Utilisez `"together"` pour `reasoning.enabled` de style Together, `"qwen"` pour `enable_thinking` au niveau supérieur, ou `"qwen-chat-template"` pour `chat_template_kwargs.enable_thinking` sur les serveurs compatibles OpenAI de la famille Qwen qui prennent en charge les kwargs de modèle de chat au niveau de la requête, tels que vLLM. Les modèles Qwen vLLM configurés exposent des choix binaires `/think` (`off`, `on`) pour ces formats.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages` : indice de compatibilité facultatif pour les backends Chat Completions de style DeepSeek qui exigent que les messages assistant précédents conservent `reasoning_content` lors de la relecture. Lorsque `true`, OpenClaw préserve ce champ sur les messages assistant sortants. Utilisez cela lors du raccordement d’un proxy personnalisé compatible DeepSeek qui rejette les requêtes après suppression du raisonnement. Valeur par défaut : `false`.

  </Accordion>
  <Accordion title="Découverte Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery` : racine des paramètres d’auto-découverte Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled` : active/désactive la découverte implicite.
    - `plugins.entries.amazon-bedrock.config.discovery.region` : région AWS pour la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter` : filtre facultatif d’id de fournisseur pour une découverte ciblée.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval` : intervalle d’interrogation pour l’actualisation de la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow` : fenêtre de contexte de repli pour les modèles découverts.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens` : nombre maximal de jetons de sortie de repli pour les modèles découverts.

  </Accordion>
</AccordionGroup>

L’intégration interactive d’un fournisseur personnalisé infère l’entrée image pour les ID de modèles de vision courants tels que GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V et GLM-4V, et ignore la question supplémentaire pour les familles connues comme texte uniquement. Les ID de modèles inconnus demandent toujours la prise en charge des images. L’intégration non interactive utilise la même inférence ; passez `--custom-image-input` pour forcer des métadonnées compatibles image ou `--custom-text-input` pour forcer des métadonnées texte uniquement.

### Exemples de fournisseurs

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Le Plugin de fournisseur externe officiel `cerebras` peut configurer cela via `openclaw onboard --auth-choice cerebras-api-key`. Utilisez une configuration explicite du fournisseur uniquement lorsque vous remplacez les valeurs par défaut.

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

    Utilisez `cerebras/zai-glm-4.7` pour Cerebras ; `zai/glm-4.7` pour Z.AI direct.

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

    Compatible Anthropic, fournisseur intégré. Raccourci : `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modèles locaux (LM Studio)">
    Consultez [Modèles locaux](/fr/gateway/local-models). TL;DR : exécutez un grand modèle local via l’API Responses de LM Studio sur du matériel sérieux ; conservez les modèles hébergés fusionnés comme repli.
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

    Définissez `MINIMAX_API_KEY`. Raccourcis : `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. Le catalogue de modèles utilise M3 par défaut et inclut aussi les variantes M2.7. Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut le raisonnement MiniMax M2.x, sauf si vous définissez explicitement `thinking` vous-même ; MiniMax-M3 (et M3.x) reste par défaut sur le chemin de raisonnement omis/adaptatif du fournisseur. `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

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

    Pour le point de terminaison Chine : `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Les points de terminaison natifs Moonshot annoncent la compatibilité d’utilisation en streaming sur le transport partagé `openai-completions`, et OpenClaw l’active selon les capacités du point de terminaison plutôt que selon le seul id de fournisseur intégré.

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
  <Accordion title="Synthetic (compatible Anthropic)">
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

    Définissez `ZAI_API_KEY`. Les références de modèle utilisent l’ID de fournisseur canonique `zai/*`. Raccourci : `openclaw onboard --auth-choice zai-api-key`.

    - Point de terminaison général : `https://api.z.ai/api/paas/v4`
    - Point de terminaison de codage (par défaut) : `https://api.z.ai/api/coding/paas/v4`
    - Pour le point de terminaison général, définissez un fournisseur personnalisé avec la substitution de l’URL de base.

  </Accordion>
</AccordionGroup>

---

## Associé

- [Configuration — agents](/fr/gateway/config-agents)
- [Configuration — channels](/fr/gateway/config-channels)
- [Référence de configuration](/fr/gateway/configuration-reference) — autres clés de niveau supérieur
- [Outils et plugins](/fr/tools)
