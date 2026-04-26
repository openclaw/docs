---
read_when:
    - Configurer la politique, les listes d’autorisation ou les fonctionnalités expérimentales de `tools.*`
    - Enregistrer des fournisseurs personnalisés ou remplacer des URL de base
    - Configurer des points de terminaison auto-hébergés compatibles OpenAI
sidebarTitle: Tools and custom providers
summary: Configuration des outils (politique, bascules expérimentales, outils soutenus par le fournisseur) et configuration personnalisée du fournisseur/de l’URL de base
title: Configuration — outils et fournisseurs personnalisés
x-i18n:
    generated_at: "2026-04-26T11:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

Clés de configuration `tools.*` et configuration des fournisseurs personnalisés / URL de base. Pour les agents, canaux et autres clés de configuration de niveau supérieur, voir [Référence de configuration](/fr/gateway/configuration-reference).

## Outils

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant `tools.allow`/`tools.deny` :

<Note>
L’intégration guidée locale définit par défaut les nouvelles configurations locales sur `tools.profile: "coding"` lorsqu’il n’est pas défini (les profils explicites existants sont conservés).
</Note>

| Profil      | Inclut                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | `session_status` uniquement                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Aucune restriction (identique à non défini)                                                                                    |

### Groupes d’outils

| Groupe             | Outils                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                         |
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
| `group:openclaw`   | Tous les outils intégrés (exclut les Plugins de fournisseur)                                                            |

### `tools.allow` / `tools.deny`

Politique globale d’autorisation/refus des outils (le refus l’emporte). Insensible à la casse, prend en charge les jokers `*`. S’applique même lorsque le sandbox Docker est désactivé.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restreint davantage les outils pour des fournisseurs ou modèles spécifiques. Ordre : profil de base → profil du fournisseur → autorisation/refus.

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

Contrôle l’accès `exec` élevé en dehors du sandbox :

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

- Le remplacement par agent (`agents.list[].tools.elevated`) ne peut que restreindre davantage.
- `/elevated on|off|ask|full` stocke l’état par session ; les directives en ligne s’appliquent à un seul message.
- `exec` élevé contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible `exec` est `node`).

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

Les vérifications de sécurité contre les boucles d’outils sont **désactivées par défaut**. Définissez `enabled: true` pour activer la détection. Les paramètres peuvent être définis globalement dans `tools.loopDetection` et remplacés par agent dans `agents.list[].tools.loopDetection`.

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
  Historique maximal des appels d’outils conservé pour l’analyse de boucle.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Seuil de motif répétitif sans progression pour les avertissements.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Seuil répétitif plus élevé pour bloquer les boucles critiques.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Seuil d’arrêt forcé pour toute exécution sans progression.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avertir en cas d’appels répétés du même outil/avec les mêmes arguments.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avertir/bloquer sur les outils de sondage connus (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avertir/bloquer sur les motifs alternés par paires sans progression.
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
        apiKey: "brave_api_key", // ou env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // facultatif ; omettez pour la détection automatique
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
        directSend: false, // activation explicite : envoyer directement au canal la musique/vidéo async terminée
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
  <Accordion title="Champs d’entrée des modèles média">
    **Entrée fournisseur** (`type: "provider"` ou omis) :

    - `provider` : id du fournisseur d’API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model` : remplacement de l’id de modèle
    - `profile` / `preferredProfile` : sélection de profil dans `auth-profiles.json`

    **Entrée CLI** (`type: "cli"`) :

    - `command` : exécutable à lancer
    - `args` : arguments templatisés (prend en charge `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

    **Champs communs :**

    - `capabilities` : liste facultative (`image`, `audio`, `video`). Par défaut : `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language` : remplacements par entrée.
    - En cas d’échec, bascule sur l’entrée suivante.

    L’authentification fournisseur suit l’ordre standard : `auth-profiles.json` → variables d’environnement → `models.providers.*.apiKey`.

    **Champs de fin asynchrone :**

    - `asyncCompletion.directSend` : lorsque `true`, les tâches async terminées `music_generate` et `video_generate` tentent d’abord une livraison directe au canal. Par défaut : `false` (ancien chemin de réveil de session du demandeur/livraison par modèle).

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

Par défaut : `tree` (session actuelle + sessions engendrées par elle, comme les subagents).

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
    - `tree` : session actuelle + sessions engendrées par la session actuelle (subagents).
    - `agent` : toute session appartenant à l’id d’agent actuel (peut inclure d’autres utilisateurs si vous exécutez des sessions par expéditeur sous le même id d’agent).
    - `all` : toute session. Le ciblage inter-agents nécessite toujours `tools.agentToAgent`.
    - Limitation du sandbox : lorsque la session actuelle est sandboxée et que `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilité est forcée à `tree` même si `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Contrôle la prise en charge des pièces jointes en ligne pour `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // activation explicite : définir à true pour autoriser les pièces jointes de fichiers en ligne
        maxTotalBytes: 5242880, // 5 Mo au total pour tous les fichiers
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
    - Les pièces jointes ne sont prises en charge que pour `runtime: "subagent"`. Le runtime ACP les rejette.
    - Les fichiers sont matérialisés dans l’espace de travail enfant sous `.openclaw/attachments/<uuid>/` avec un `.manifest.json`.
    - Le contenu des pièces jointes est automatiquement expurgé de la persistance de transcript.
    - Les entrées Base64 sont validées avec des vérifications strictes de l’alphabet/du padding et une garde de taille avant décodage.
    - Les permissions de fichiers sont `0700` pour les répertoires et `0600` pour les fichiers.
    - Le nettoyage suit la politique `cleanup` : `delete` supprime toujours les pièces jointes ; `keep` ne les conserve que lorsque `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Drapeaux expérimentaux des outils intégrés. Désactivés par défaut, sauf si une règle d’activation automatique stricte-agentique GPT-5 s’applique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // activer update_plan expérimental
    },
  },
}
```

- `planTool` : active l’outil structuré `update_plan` pour le suivi des travaux non triviaux à plusieurs étapes.
- Par défaut : `false` sauf si `agents.defaults.embeddedPi.executionContract` (ou un remplacement par agent) est défini sur `"strict-agentic"` pour une exécution OpenAI ou OpenAI Codex de la famille GPT-5. Définissez `true` pour forcer l’activation de l’outil hors de ce périmètre, ou `false` pour le garder désactivé même pour les exécutions GPT-5 strict-agentic.
- Lorsqu’il est activé, le prompt système ajoute aussi des consignes d’utilisation afin que le modèle ne l’utilise que pour des travaux substantiels et ne garde au plus qu’une seule étape `in_progress`.

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

- `model` : modèle par défaut pour les sous-agents engendrés. S’il est omis, les sous-agents héritent du modèle de l’appelant.
- `allowAgents` : liste d’autorisation par défaut des ids d’agent cibles pour `sessions_spawn` lorsque l’agent demandeur ne définit pas son propre `subagents.allowAgents` (`["*"]` = n’importe lequel ; par défaut : même agent uniquement).
- `runTimeoutSeconds` : délai d’attente par défaut (secondes) pour `sessions_spawn` lorsque l’appel d’outil omet `runTimeoutSeconds`. `0` signifie aucun délai d’attente.
- Politique d’outils par sous-agent : `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Fournisseurs personnalisés et URL de base

OpenClaw utilise le catalogue de modèles intégré. Ajoutez des fournisseurs personnalisés via `models.providers` dans la configuration ou `~/.openclaw/agents/<agentId>/agent/models.json`.

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
    - Utilisez `authHeader: true` + `headers` pour des besoins d’authentification personnalisés.
    - Remplacez la racine de configuration de l’agent avec `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, alias de variable d’environnement hérité).
    - Priorité de fusion pour les ids de fournisseur correspondants :
      - Les valeurs `baseUrl` non vides de l’agent dans `models.json` l’emportent.
      - Les valeurs `apiKey` non vides de l’agent ne l’emportent que lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel config/profil d’authentification.
      - Les valeurs `apiKey` de fournisseur gérées par SecretRef sont rafraîchies depuis les marqueurs source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références file/exec) au lieu de persister les secrets résolus.
      - Les valeurs d’en-tête de fournisseur gérées par SecretRef sont rafraîchies depuis les marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références file/exec).
      - Les `apiKey`/`baseUrl` d’agent vides ou absents reviennent à `models.providers` dans la configuration.
      - Les `contextWindow`/`maxTokens` de modèles correspondants utilisent la valeur la plus élevée entre la configuration explicite et les valeurs implicites du catalogue.
      - Les `contextTokens` de modèles correspondants préservent un plafond d’exécution explicite lorsqu’il est présent ; utilisez-le pour limiter le contexte effectif sans modifier les métadonnées natives du modèle.
      - Utilisez `models.mode: "replace"` lorsque vous voulez que la configuration réécrive complètement `models.json`.
      - La persistance des marqueurs fait autorité depuis la source : les marqueurs sont écrits à partir de l’instantané actif de configuration source (pré-résolution), et non à partir des valeurs secrètes résolues à l’exécution.
  </Accordion>
</AccordionGroup>

### Détails des champs fournisseur

<AccordionGroup>
  <Accordion title="Catalogue de niveau supérieur">
    - `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
    - `models.providers` : table de fournisseurs personnalisés indexée par id de fournisseur.
      - Modifications sûres : utilisez `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` pour des mises à jour additives. `config set` refuse les remplacements destructifs sauf si vous passez `--replace`.
  </Accordion>
  <Accordion title="Connexion et authentification du fournisseur">
    - `models.providers.*.api` : adaptateur de requête (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc).
    - `models.providers.*.apiKey` : identifiant du fournisseur (préférez SecretRef/substitution d’environnement).
    - `models.providers.*.auth` : stratégie d’authentification (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat` : pour Ollama + `openai-completions`, injecter `options.num_ctx` dans les requêtes (par défaut : `true`).
    - `models.providers.*.authHeader` : forcer le transport de l’identifiant dans l’en-tête `Authorization` lorsque nécessaire.
    - `models.providers.*.baseUrl` : URL de base de l’API amont.
    - `models.providers.*.headers` : en-têtes statiques supplémentaires pour le routage proxy/tenant.
  </Accordion>
  <Accordion title="Remplacements du transport de requête">
    `models.providers.*.request` : remplacements de transport pour les requêtes HTTP du fournisseur de modèles.

    - `request.headers` : en-têtes supplémentaires (fusionnés avec les valeurs par défaut du fournisseur). Les valeurs acceptent SecretRef.
    - `request.auth` : remplacement de stratégie d’authentification. Modes : `"provider-default"` (utiliser l’authentification intégrée du fournisseur), `"authorization-bearer"` (avec `token`), `"header"` (avec `headerName`, `value`, `prefix` facultatif).
    - `request.proxy` : remplacement du proxy HTTP. Modes : `"env-proxy"` (utiliser les variables d’environnement `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (avec `url`). Les deux modes acceptent un sous-objet `tls` facultatif.
    - `request.tls` : remplacement TLS pour les connexions directes. Champs : `ca`, `cert`, `key`, `passphrase` (tous acceptent SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork` : lorsque `true`, autoriser HTTPS vers `baseUrl` lorsque le DNS se résout vers des plages privées, CGNAT ou similaires, via la garde de récupération HTTP du fournisseur (activation explicite opérateur pour des points de terminaison auto-hébergés compatibles OpenAI de confiance). WebSocket utilise le même `request` pour les en-têtes/TLS, mais pas cette garde SSRF de récupération. Par défaut `false`.

  </Accordion>
  <Accordion title="Entrées du catalogue de modèles">
    - `models.providers.*.models` : entrées explicites du catalogue de modèles du fournisseur.
    - `models.providers.*.models.*.contextWindow` : métadonnées de fenêtre de contexte native du modèle.
    - `models.providers.*.models.*.contextTokens` : plafond de contexte d’exécution facultatif. Utilisez-le lorsque vous souhaitez un budget de contexte effectif plus petit que le `contextWindow` natif du modèle ; `openclaw models list` affiche les deux valeurs lorsqu’elles diffèrent.
    - `models.providers.*.models.*.compat.supportsDeveloperRole` : indice de compatibilité facultatif. Pour `api: "openai-completions"` avec un `baseUrl` non vide et non natif (hôte différent de `api.openai.com`), OpenClaw force cette valeur à `false` à l’exécution. Un `baseUrl` vide/omis conserve le comportement OpenAI par défaut.
    - `models.providers.*.models.*.compat.requiresStringContent` : indice de compatibilité facultatif pour les points de terminaison de chat compatibles OpenAI n’acceptant que des chaînes. Lorsque `true`, OpenClaw aplatit les tableaux `messages[].content` purement textuels en chaînes simples avant d’envoyer la requête.
  </Accordion>
  <Accordion title="Découverte Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery` : racine des paramètres d’auto-découverte Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled` : activer/désactiver la découverte implicite.
    - `plugins.entries.amazon-bedrock.config.discovery.region` : région AWS pour la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter` : filtre facultatif d’id de fournisseur pour une découverte ciblée.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval` : intervalle de sondage pour le rafraîchissement de la découverte.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow` : fenêtre de contexte de secours pour les modèles découverts.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens` : nombre maximal de tokens de sortie de secours pour les modèles découverts.
  </Accordion>
</AccordionGroup>

### Exemples de fournisseurs

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Compatible Anthropic, fournisseur intégré. Raccourci : `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modèles locaux (LM Studio)">
    Voir [Modèles locaux](/fr/gateway/local-models). En bref : exécutez un grand modèle local via l’API LM Studio Responses sur du matériel sérieux ; conservez les modèles hébergés fusionnés pour le repli.
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

    Définissez `MINIMAX_API_KEY`. Raccourcis : `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. Le catalogue de modèles utilise par défaut uniquement M2.7. Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut le thinking MiniMax sauf si vous définissez explicitement `thinking` vous-même. `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

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

    Les points de terminaison Moonshot natifs annoncent la compatibilité d’usage du streaming sur le transport partagé `openai-completions`, et OpenClaw s’appuie sur les capacités du point de terminaison plutôt que sur le seul id de fournisseur intégré.

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

    Définissez `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Utilisez des références `opencode/...` pour le catalogue Zen ou `opencode-go/...` pour le catalogue Go. Raccourci : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

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

    L’URL de base ne doit pas inclure `/v1` (le client Anthropic l’ajoute). Raccourci : `openclaw onboard --auth-choice synthetic-api-key`.

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

    Définissez `ZAI_API_KEY`. `z.ai/*` et `z-ai/*` sont acceptés comme alias. Raccourci : `openclaw onboard --auth-choice zai-api-key`.

    - Point de terminaison général : `https://api.z.ai/api/paas/v4`
    - Point de terminaison coding (par défaut) : `https://api.z.ai/api/coding/paas/v4`
    - Pour le point de terminaison général, définissez un fournisseur personnalisé avec le remplacement d’URL de base.

  </Accordion>
</AccordionGroup>

---

## Associé

- [Configuration — agents](/fr/gateway/config-agents)
- [Configuration — canaux](/fr/gateway/config-channels)
- [Référence de configuration](/fr/gateway/configuration-reference) — autres clés de niveau supérieur
- [Outils et Plugins](/fr/tools)
