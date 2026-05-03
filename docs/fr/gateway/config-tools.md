---
read_when:
    - Configuration de la politique `tools.*`, des listes d’autorisation ou des fonctionnalités expérimentales
    - Enregistrement de fournisseurs personnalisés ou remplacement des URL de base
    - Configurer des points de terminaison auto-hébergés compatibles avec OpenAI
sidebarTitle: Tools and custom providers
summary: Configuration des outils (politique, bascules expérimentales, outils adossés à un fournisseur) et configuration de fournisseur personnalisé/URL de base
title: Configuration — outils et fournisseurs personnalisés
x-i18n:
    generated_at: "2026-05-03T21:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75a39342f40e9c329a7c61855e805ec43532cbdb89fbe801acc26830fd63b4da
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` clés de configuration et configuration de fournisseur personnalisé / URL de base. Pour les agents, les canaux et les autres clés de configuration de premier niveau, consultez la [référence de configuration](/fr/gateway/configuration-reference).

## Outils

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant `tools.allow`/`tools.deny` :

<Note>
L’intégration locale définit par défaut les nouvelles configurations locales sur `tools.profile: "coding"` lorsque ce champ n’est pas défini (les profils explicites existants sont conservés).
</Note>

| Profil      | Inclut                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` uniquement                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                     |
| `full`      | Aucune restriction (identique à non défini)                                                                                   |

### Groupes d’outils

| Groupe             | Outils                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Tous les outils intégrés (exclut les plugins de fournisseur)                                                            |

### `tools.allow` / `tools.deny`

Politique globale d’autorisation/refus des outils (le refus l’emporte). Insensible à la casse, prend en charge les caractères génériques `*`. Appliquée même lorsque le bac à sable Docker est désactivé.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` et `apply_patch` sont des identifiants d’outils distincts. `allow: ["write"]` active aussi `apply_patch` pour les modèles compatibles, mais `deny: ["write"]` ne refuse pas `apply_patch`. Pour bloquer toute mutation de fichiers, refusez `group:fs` ou listez explicitement chaque outil de mutation :

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Restreint davantage les outils pour des fournisseurs ou modèles spécifiques. Ordre : profil de base → profil de fournisseur → autorisation/refus.

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

### `tools.elevated`

Contrôle l’accès `exec` élevé en dehors du bac à sable :

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
- `/elevated on|off|ask|full` stocke l’état par session ; les directives intégrées s’appliquent à un seul message.
- `exec` élevé contourne le bac à sable et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible `exec` est `node`).

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
  Seuil de répétition plus élevé pour bloquer les boucles critiques.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Seuil d’arrêt strict pour toute exécution sans progression.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avertir en cas d’appels répétés avec le même outil et les mêmes arguments.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avertir/bloquer pour les outils d’interrogation connus (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avertir/bloquer pour les motifs de paires alternées sans progression.
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
        directSend: false, // opt-in: send finished async video directly to the channel
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
  <Accordion title="Media model entry fields">
    **Entrée fournisseur** (`type: "provider"` ou omis) :

    - `provider` : identifiant du fournisseur d’API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model` : remplacement de l’identifiant du modèle
    - `profile` / `preferredProfile` : sélection du profil `auth-profiles.json`

    **Entrée CLI** (`type: "cli"`) :

    - `command` : exécutable à lancer
    - `args` : arguments modélisés (prend en charge `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc. ; `openclaw doctor --fix` migre les espaces réservés obsolètes `{input}` vers `{{MediaPath}}`)

    **Champs communs :**

    - `capabilities` : liste facultative (`image`, `audio`, `video`). Valeurs par défaut : `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language` : remplacements propres à l’entrée.
    - `tools.media.image.timeoutSeconds` et les entrées `timeoutSeconds` correspondantes du modèle d’image s’appliquent aussi lorsque l’agent appelle l’outil `image` explicite.
    - Les échecs basculent vers l’entrée suivante.

    L’authentification du fournisseur suit l’ordre standard : `auth-profiles.json` → variables d’environnement → `models.providers.*.apiKey`.

    **Champs d’achèvement asynchrone :**

    - `asyncCompletion.directSend` : lorsque la valeur est `true`, les tâches média asynchrones terminées qui prennent en charge la livraison directe de l’achèvement essaient d’abord une livraison directe au canal. Valeur par défaut : `false` (chemin de réveil de session demandeuse/livraison par modèle). Aujourd’hui, cela s’applique à `video_generate` asynchrone ; les achèvements `music_generate` asynchrones restent médiés par la session demandeuse même lorsque cette option est activée.

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

Contrôle les sessions pouvant être ciblées par les outils de session (`sessions_list`, `sessions_history`, `sessions_send`).

Valeur par défaut : `tree` (session actuelle + sessions qu’elle a lancées, comme les sous-agents).

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
    - `self` : uniquement la clé de session actuelle.
    - `tree` : session actuelle + sessions lancées par la session actuelle (sous-agents).
    - `agent` : toute session appartenant à l’identifiant de l’agent actuel (peut inclure d’autres utilisateurs si vous exécutez des sessions par expéditeur sous le même identifiant d’agent).
    - `all` : toute session. Le ciblage entre agents exige toujours `tools.agentToAgent`.
    - Restriction du bac à sable : lorsque la session actuelle est placée dans un bac à sable et que `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilité est forcée à `tree` même si `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Contrôle la prise en charge des pièces jointes en ligne pour `sessions_spawn`.

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
  <Accordion title="Notes sur les pièces jointes">
    - Les pièces jointes ne sont prises en charge que pour `runtime: "subagent"`. Le runtime ACP les refuse.
    - Les fichiers sont matérialisés dans l’espace de travail enfant sous `.openclaw/attachments/<uuid>/` avec un `.manifest.json`.
    - Le contenu des pièces jointes est automatiquement expurgé de la persistance de la transcription.
    - Les entrées Base64 sont validées avec des contrôles stricts de l’alphabet et du remplissage, ainsi qu’une protection de taille avant décodage.
    - Les autorisations de fichier sont `0700` pour les répertoires et `0600` pour les fichiers.
    - Le nettoyage suit la politique `cleanup` : `delete` supprime toujours les pièces jointes ; `keep` ne les conserve que lorsque `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicateurs d’outils intégrés expérimentaux. Désactivés par défaut, sauf si une règle d’activation automatique stricte agentique GPT-5 s’applique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool` : active l’outil structuré `update_plan` pour le suivi des travaux non triviaux en plusieurs étapes.
- Par défaut : `false`, sauf si `agents.defaults.embeddedPi.executionContract` (ou une substitution par agent) est défini sur `"strict-agentic"` pour une exécution OpenAI ou OpenAI Codex de la famille GPT-5. Définissez `true` pour forcer l’activation de l’outil hors de ce périmètre, ou `false` pour le garder désactivé même pour les exécutions GPT-5 strictement agentiques.
- Lorsqu’il est activé, l’invite système ajoute aussi des conseils d’utilisation afin que le modèle ne l’utilise que pour des travaux substantiels et conserve au plus une étape `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model` : modèle par défaut pour les sous-agents créés. Si omis, les sous-agents héritent du modèle de l’appelant.
- `allowAgents` : liste d’autorisation par défaut des identifiants d’agents cibles pour `sessions_spawn` lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents` (`["*"]` = n’importe lequel ; valeur par défaut : uniquement le même agent).
- `runTimeoutSeconds` : délai d’expiration par défaut (secondes) pour `sessions_spawn` lorsque l’appel de l’outil omet `runTimeoutSeconds`. `0` signifie aucun délai d’expiration.
- Politique d’outil par sous-agent : `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Fournisseurs personnalisés et URL de base

OpenClaw utilise le catalogue de modèles intégré. Ajoutez des fournisseurs personnalisés via `models.providers` dans la configuration ou `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
    - Utilisez `authHeader: true` + `headers` pour les besoins d’authentification personnalisée.
    - Remplacez la racine de configuration de l’agent avec `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, un alias hérité de variable d’environnement).
    - Priorité de fusion pour les ID de fournisseurs correspondants :
      - Les valeurs `baseUrl` non vides de `models.json` de l’agent l’emportent.
      - Les valeurs `apiKey` non vides de l’agent l’emportent uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
      - Les valeurs `apiKey` du fournisseur géré par SecretRef sont actualisées depuis les marqueurs sources (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de conserver les secrets résolus.
      - Les valeurs d’en-tête du fournisseur géré par SecretRef sont actualisées depuis les marqueurs sources (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
      - Les `apiKey`/`baseUrl` d’agent vides ou manquants se replient sur `models.providers` dans la configuration.
      - Les `contextWindow`/`maxTokens` de modèle correspondants utilisent la valeur la plus élevée entre la configuration explicite et les valeurs implicites du catalogue.
      - Le `contextTokens` de modèle correspondant préserve un plafond d’exécution explicite lorsqu’il est présent ; utilisez-le pour limiter le contexte effectif sans changer les métadonnées natives du modèle.
      - Utilisez `models.mode: "replace"` lorsque vous voulez que la configuration réécrive entièrement `models.json`.
      - La persistance des marqueurs fait autorité côté source : les marqueurs sont écrits depuis l’instantané de configuration source actif (avant résolution), et non depuis les valeurs de secrets d’exécution résolues.

  </Accordion>
</AccordionGroup>

### Détails des champs de fournisseur

<AccordionGroup>
  <Accordion title="Catalogue de premier niveau">
    - `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
    - `models.providers` : carte de fournisseurs personnalisés indexée par identifiant de fournisseur.
      - Modifications sûres : utilisez `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` pour les mises à jour additives. `config set` refuse les remplacements destructifs sauf si vous passez `--replace`.

  </Accordion>
  <Accordion title="Connexion et authentification du fournisseur">
    - `models.providers.*.api` : adaptateur de requête (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc). Pour les backends `/v1/chat/completions` auto-hébergés tels que MLX, vLLM, SGLang et la plupart des serveurs locaux compatibles OpenAI, utilisez `openai-completions`. Un fournisseur personnalisé avec `baseUrl` mais sans `api` utilise par défaut `openai-completions` ; définissez `openai-responses` uniquement lorsque le backend prend en charge `/v1/responses`.
    - `models.providers.*.apiKey` : identifiant d’accès du fournisseur (préférez SecretRef/la substitution d’environnement).
    - `models.providers.*.auth` : stratégie d’authentification (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow` : fenêtre de contexte native par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextWindow`.
    - `models.providers.*.contextTokens` : plafond de contexte d’exécution effectif par défaut pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `contextTokens`.
    - `models.providers.*.maxTokens` : plafond par défaut de jetons de sortie pour les modèles de ce fournisseur lorsque l’entrée du modèle ne définit pas `maxTokens`.
    - `models.providers.*.timeoutSeconds` : délai d’expiration HTTP facultatif par fournisseur pour les requêtes de modèle, en secondes, incluant la connexion, les en-têtes, le corps et la gestion de l’abandon total de la requête.
    - `models.providers.*.injectNumCtxForOpenAICompat` : pour Ollama + `openai-completions`, injecte `options.num_ctx` dans les requêtes (par défaut : `true`).
    - `models.providers.*.authHeader` : force le transport des identifiants dans l’en-tête `Authorization` lorsque nécessaire.
    - `models.providers.*.baseUrl` : URL de base de l’API amont.
    - `models.providers.*.headers` : en-têtes statiques supplémentaires pour le routage proxy/locataire.

  </Accordion>
  <Accordion title="Substitutions du transport de requête">
    `models.providers.*.request` : substitutions de transport pour les requêtes HTTP de fournisseur de modèles.

    - `request.headers` : en-têtes supplémentaires (fusionnés avec les valeurs par défaut du fournisseur). Les valeurs acceptent SecretRef.
    - `request.auth` : substitution de stratégie d’authentification. Modes : `"provider-default"` (utiliser l’authentification intégrée du fournisseur), `"authorization-bearer"` (avec `token`), `"header"` (avec `headerName`, `value`, `prefix` facultatif).
    - `request.proxy` : substitution de proxy HTTP. Modes : `"env-proxy"` (utiliser les variables d’environnement `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (avec `url`). Les deux modes acceptent un sous-objet `tls` facultatif.
    - `request.tls` : substitution TLS pour les connexions directes. Champs : `ca`, `cert`, `key`, `passphrase` (tous acceptent SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork` : lorsque `true`, autorise HTTPS vers `baseUrl` lorsque le DNS se résout vers des plages privées, CGNAT ou similaires, via la protection de récupération HTTP du fournisseur (adhésion explicite de l’opérateur pour les points de terminaison compatibles OpenAI auto-hébergés de confiance). Les URL de flux de fournisseur de modèles en local loopback telles que `localhost`, `127.0.0.1` et `[::1]` sont autorisées automatiquement sauf si cette option est explicitement définie sur `false` ; les hôtes LAN, tailnet et DNS privés nécessitent toujours une adhésion explicite. WebSocket utilise le même `request` pour les en-têtes/TLS, mais pas cette barrière SSRF de récupération. Valeur par défaut : `false`.

  </Accordion>
  <Accordion title="Entrées du catalogue de modèles">
    - `models.providers.*.models` : entrées explicites du catalogue de modèles du fournisseur.
    - `models.providers.*.models.*.input` : modalités d’entrée du modèle. Utilisez `["text"]` pour les modèles texte uniquement et `["text", "image"]` pour les modèles natifs image/vision. Les pièces jointes image ne sont injectées dans les tours d’agent que lorsque le modèle sélectionné est marqué comme compatible image.
    - `models.providers.*.models.*.contextWindow` : métadonnées de fenêtre de contexte native du modèle. Cela remplace le `contextWindow` au niveau du fournisseur pour ce modèle.
    - `models.providers.*.models.*.contextTokens` : plafond de contexte d’exécution facultatif. Cela remplace le `contextTokens` au niveau du fournisseur ; utilisez-le lorsque vous voulez un budget de contexte effectif inférieur au `contextWindow` natif du modèle ; `openclaw models list` affiche les deux valeurs lorsqu’elles diffèrent.
    - `models.providers.*.models.*.compat.supportsDeveloperRole` : indication de compatibilité facultative. Pour `api: "openai-completions"` avec un `baseUrl` non natif non vide (hôte autre que `api.openai.com`), OpenClaw force cette valeur à `false` à l’exécution. Un `baseUrl` vide/omis conserve le comportement OpenAI par défaut.
    - `models.providers.*.models.*.compat.requiresStringContent` : indication de compatibilité facultative pour les points de terminaison de chat compatibles OpenAI qui n’acceptent que des chaînes. Lorsque `true`, OpenClaw aplatit les tableaux `messages[].content` de texte pur en chaînes simples avant d’envoyer la requête.

  </Accordion>
  <Accordion title="Découverte Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery` : racine des paramètres d’auto-découverte Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled` : active/désactive la découverte implicite.
    - `plugins.entries.amazon-bedrock.config.discovery.region` : région AWS pour la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter` : filtre facultatif d’identifiant de fournisseur pour la découverte ciblée.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval` : intervalle d’interrogation pour l’actualisation de la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow` : fenêtre de contexte de repli pour les modèles découverts.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens` : nombre maximal de jetons de sortie de repli pour les modèles découverts.

  </Accordion>
</AccordionGroup>

L’intégration interactive des fournisseurs personnalisés infère l’entrée image pour les ID de modèles de vision courants tels que GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V et GLM-4V, et ignore la question supplémentaire pour les familles connues comme texte uniquement. Les ID de modèles inconnus demandent toujours la prise en charge des images. L’intégration non interactive utilise la même inférence ; passez `--custom-image-input` pour forcer les métadonnées compatibles image ou `--custom-text-input` pour forcer les métadonnées texte uniquement.

### Exemples de fournisseurs

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Le Plugin fournisseur `cerebras` inclus peut configurer cela via `openclaw onboard --auth-choice cerebras-api-key`. Utilisez une configuration de fournisseur explicite uniquement lorsque vous remplacez les valeurs par défaut.

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

    Utilisez `cerebras/zai-glm-4.7` pour Cerebras ; `zai/glm-4.7` pour Z.AI en direct.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Compatible avec Anthropic, fournisseur intégré. Raccourci : `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    Consultez [Modèles locaux](/fr/gateway/local-models). TL;DR : exécutez un grand modèle local via l’API Responses de LM Studio sur du matériel performant ; gardez les modèles hébergés fusionnés comme solution de repli.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Définissez `MINIMAX_API_KEY`. Raccourcis : `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. Le catalogue de modèles utilise uniquement M2.7 par défaut. Sur le chemin de streaming compatible avec Anthropic, OpenClaw désactive la réflexion MiniMax par défaut, sauf si vous définissez explicitement `thinking` vous-même. `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

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

    Les points de terminaison natifs de Moonshot annoncent la compatibilité avec l’utilisation en streaming sur le transport partagé `openai-completions`, et OpenClaw l’active selon les capacités du point de terminaison plutôt que seulement selon l’identifiant du fournisseur intégré.

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
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    Définissez `ZAI_API_KEY`. `z.ai/*` et `z-ai/*` sont des alias acceptés. Raccourci : `openclaw onboard --auth-choice zai-api-key`.

    - Point de terminaison général : `https://api.z.ai/api/paas/v4`
    - Point de terminaison de codage (par défaut) : `https://api.z.ai/api/coding/paas/v4`
    - Pour le point de terminaison général, définissez un fournisseur personnalisé avec le remplacement de l’URL de base.

  </Accordion>
</AccordionGroup>

---

## Connexe

- [Configuration — agents](/fr/gateway/config-agents)
- [Configuration — canaux](/fr/gateway/config-channels)
- [Référence de configuration](/fr/gateway/configuration-reference) — autres clés de premier niveau
- [Outils et plugins](/fr/tools)
