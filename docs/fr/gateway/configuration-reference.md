---
read_when:
    - Vous avez besoin de la sémantique exacte de configuration au niveau des champs ou des valeurs par défaut
    - Vous validez les blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration du Gateway pour les clés principales d’OpenClaw, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-07-03T23:31:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Référence de configuration principale pour `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâche, consultez [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d’OpenClaw et renvoie vers d’autres pages lorsqu’un sous-système dispose de sa propre référence plus approfondie. Les catalogues de commandes propres aux canaux et aux plugins, ainsi que les réglages avancés de mémoire/QMD, se trouvent sur leurs propres pages plutôt que sur celle-ci.

Source de vérité du code :

- `openclaw config schema` affiche le JSON Schema actif utilisé pour la validation et la Control UI, avec les métadonnées intégrées/plugin/canal fusionnées lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma limité à un chemin pour les outils d’exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hachage de référence de la documentation de configuration par rapport à la surface de schéma actuelle

Chemin de recherche de l’agent : utilisez l’action d’outil `gateway` `config.schema.lookup` pour
obtenir la documentation et les contraintes exactes au niveau des champs avant modification. Utilisez
[Configuration](/fr/gateway/configuration) pour les conseils orientés tâche et cette page
pour la carte générale des champs, les valeurs par défaut et les liens vers les références des sous-systèmes.

Références approfondies dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de Dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées et fournies
- pages des canaux/plugins propriétaires pour les surfaces de commandes propres aux canaux

Le format de configuration est **JSON5** (commentaires et virgules finales autorisés). Tous les champs sont facultatifs - OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée - consultez
[Configuration - canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres
canaux fournis (authentification, contrôle d’accès, comptes multiples, filtrage des mentions).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée - consultez
[Configuration - agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, raisonnement, Heartbeat, mémoire, médias, skills, bac à sable)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie des sessions, Compaction, élagage)
- `messages.*` (livraison des messages, TTS, rendu markdown)
- `talk.*` (mode Talk)
  - `talk.consultThinkingLevel` : remplacement du niveau de raisonnement pour l’exécution complète de l’agent OpenClaw derrière les consultations temps réel de Control UI Talk
  - `talk.consultFastMode` : remplacement ponctuel du mode rapide pour les consultations temps réel de Control UI Talk
  - `talk.speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur iOS/macOS
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting` : repli de relais Gateway pour les transcriptions Talk temps réel finalisées qui ignorent `openclaw_agent_consult`

## Outils et fournisseurs personnalisés

La politique des outils, les bascules expérimentales, la configuration des outils adossés à des fournisseurs et la configuration de
fournisseur / URL de base personnalisée ont été déplacées vers une page dédiée - consultez
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Modèles

Les définitions de fournisseurs, les listes d’autorisation de modèles et la configuration des fournisseurs personnalisés se trouvent dans
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls).
La racine `models` possède aussi le comportement global du catalogue de modèles.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
- `models.providers` : carte de fournisseurs personnalisés indexée par identifiant de fournisseur.
- `models.providers.*.localService` : gestionnaire de processus à la demande facultatif pour
  les serveurs de modèles locaux. OpenClaw sonde le point de terminaison de santé configuré, démarre
  la `command` absolue si nécessaire, attend que le service soit prêt, puis envoie la requête de modèle.
  Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- `models.pricing.enabled` : contrôle l’amorçage de tarification en arrière-plan qui
  démarre après que les sidecars et les canaux atteignent le chemin prêt du Gateway. Lorsque `false`,
  le Gateway ignore les récupérations de catalogues de tarification OpenRouter et LiteLLM ; les valeurs
  `models.providers.*.models[].cost` configurées continuent de fonctionner pour les estimations de coût locales.

## MCP

Les définitions de serveurs MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
consommées par OpenClaw embarqué et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au
serveur cible pendant les modifications de configuration.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les runtimes qui
  exposent les outils MCP configurés.
  Les entrées distantes utilisent `transport: "streamable-http"` ou `transport: "sse"` ;
  `type: "http"` est un alias natif CLI que `openclaw mcp set` et
  `openclaw doctor --fix` normalisent dans le champ canonique `transport`.
- `mcp.servers.<name>.enabled` : définissez `false` pour conserver une définition de serveur enregistrée
  tout en l’excluant de la découverte MCP OpenClaw embarquée et de la projection d’outils.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs` : délai d’expiration des requêtes MCP
  par serveur, en secondes ou en millisecondes.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs` : délai d’expiration de connexion
  par serveur, en secondes ou en millisecondes.
- `mcp.servers.<name>.supportsParallelToolCalls` : indication de concurrence facultative pour
  les adaptateurs qui peuvent choisir d’émettre ou non des appels d’outils MCP parallèles.
- `mcp.servers.<name>.auth` : définissez `"oauth"` pour les serveurs MCP HTTP qui nécessitent
  OAuth. Exécutez `openclaw mcp login <name>` pour stocker les jetons dans l’état OpenClaw.
- `mcp.servers.<name>.oauth` : remplacements facultatifs de portée OAuth, d’URL de redirection et d’URL
  de métadonnées client.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey` : contrôles TLS HTTP
  pour les points de terminaison privés et le TLS mutuel.
- `mcp.servers.<name>.toolFilter` : sélection d’outils facultative par serveur. `include`
  limite les outils MCP découverts aux noms correspondants ; `exclude` masque les noms
  correspondants. Les entrées sont des noms exacts d’outils MCP ou de simples globs `*`. Les serveurs avec
  ressources ou prompts génèrent aussi des noms d’outils utilitaires (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), et ces noms utilisent le
  même filtre.
- `mcp.servers.<name>.codex` : contrôles facultatifs de projection vers le serveur d’application Codex.
  Ce bloc est une métadonnée OpenClaw pour les threads de serveur d’application Codex uniquement ; il n’affecte pas
  les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs d’exécution.
  `codex.agents` non vide limite le serveur aux identifiants d’agents OpenClaw listés.
  Les listes d’agents limitées vides, blanches ou invalides sont rejetées par la validation de configuration
  et omises par le chemin de projection runtime au lieu de devenir globales.
  `codex.defaultToolsApprovalMode` émet le
  `default_tools_approval_mode` natif de Codex pour ce serveur. OpenClaw retire le bloc `codex`
  avant de transmettre la configuration native `mcp_servers` à Codex. Omettez le bloc pour
  conserver la projection du serveur pour chaque agent de serveur d’application Codex avec le
  comportement d’approbation MCP par défaut de Codex.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les runtimes MCP fournis limités à la session.
  Les exécutions embarquées ponctuelles demandent un nettoyage en fin d’exécution ; ce TTL est le filet de sécurité pour
  les sessions longue durée et les futurs appelants.
- Les changements sous `mcp.*` s’appliquent à chaud en supprimant les runtimes MCP de session mis en cache.
  La prochaine découverte/utilisation d’outil les recrée à partir de la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont éliminées immédiatement au lieu d’attendre le TTL d’inactivité.
- La découverte runtime respecte aussi les notifications de changement de liste d’outils MCP en supprimant
  le catalogue mis en cache pour cette session. Les serveurs qui annoncent des ressources ou des
  prompts obtiennent des outils utilitaires pour lister/lire les ressources et lister/récupérer
  les prompts. Les échecs répétés d’appel d’outil mettent brièvement en pause le serveur affecté avant
  qu’un autre appel soit tenté.

Consultez [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d’autorisation facultative pour les skills fournis uniquement (skills gérés/espace de travail non affectés).
- `load.extraDirs` : racines de skills partagées supplémentaires (priorité la plus basse).
- `load.allowSymlinkTargets` : racines de cibles réelles de confiance vers lesquelles les liens symboliques de skills peuvent
  se résoudre lorsque le lien se trouve hors de sa racine source configurée.
- `workshop.allowSymlinkTargetWrites` : autorise l’application de Skill Workshop à écrire
  via des cibles de liens symboliques déjà approuvées (par défaut : false).
- `install.preferBrew` : lorsque true, privilégie les installateurs Homebrew quand `brew` est
  disponible avant de se rabattre sur d’autres types d’installateurs.
- `install.nodeManager` : préférence d’installateur node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives` : autorise les clients Gateway `operator.admin` de confiance
  à installer des archives zip privées préparées via `skills.upload.*`
  (par défaut : false). Cela active uniquement le chemin des archives téléversées ; les installations ClawHub
  normales ne l’exigent pas.
- `entries.<skillKey>.enabled: false` désactive une skill même si elle est fournie/installée.
- `entries.<skillKey>.apiKey` : raccourci pour les skills déclarant une variable d’environnement principale (chaîne en clair ou objet SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Chargé depuis les répertoires de packages ou de bundles sous `~/.openclaw/extensions` et `<workspace>/.openclaw/extensions`, plus les fichiers ou répertoires listés dans `plugins.load.paths`.
- Placez les fichiers Plugin autonomes dans `plugins.load.paths`; les racines d’extension découvertes automatiquement ignorent les fichiers `.js`, `.mjs` et `.ts` de premier niveau afin que les scripts d’aide dans ces racines ne bloquent pas le démarrage.
- La découverte accepte les Plugins OpenClaw natifs ainsi que les bundles Codex et les bundles Claude compatibles, y compris les bundles Claude sans manifeste avec disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage du Gateway.**
- `allow` : liste d’autorisation facultative (seuls les Plugins listés sont chargés). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ pratique de clé API au niveau du Plugin (lorsque pris en charge par le Plugin).
- `plugins.entries.<id>.env` : mappage de variables d’environnement propre au Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs qui modifient le prompt depuis l’ancien `before_agent_start`, tout en préservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de Plugins natifs et aux répertoires de hooks fournis par des bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les Plugins non groupés approuvés peuvent lire le contenu brut de la conversation depuis des hooks typés tels que `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : faire explicitement confiance à ce Plugin pour demander des remplacements `provider` et `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements de sous-agent approuvés. Utilisez `"*"` uniquement si vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowModelOverride` : faire explicitement confiance à ce Plugin pour demander des remplacements de modèle pour `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements d’achèvement LLM de Plugin approuvés. Utilisez `"*"` uniquement si vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowAgentIdOverride` : faire explicitement confiance à ce Plugin pour exécuter `api.runtime.llm.complete` avec un identifiant d’agent autre que celui par défaut.
- `plugins.entries.<id>.config` : objet de configuration défini par le Plugin (validé par le schéma de Plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte et d’exécution des Plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du Plugin propriétaire, et non par un registre central d’options OpenClaw.

### Configuration du Plugin de harnais Codex

Le Plugin `codex` groupé possède les paramètres de harnais serveur d’application Codex natifs sous
`plugins.entries.codex.config`. Consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference) pour la surface de configuration complète
et le [harnais Codex](/fr/plugins/codex-harness) pour le modèle d’exécution.

`codexPlugins` s’applique uniquement aux sessions qui sélectionnent le harnais Codex natif.
Il n’active pas les Plugins Codex pour les exécutions de fournisseurs OpenClaw, les liaisons de conversation
ACP, ni aucun harnais non-Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled` : active la prise en charge native
  des Plugins/applications Codex pour le harnais Codex. Par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions` :
  politique par défaut des actions destructrices pour les sollicitations d’applications Plugin migrées.
  Utilisez `true` pour accepter les schémas d’approbation Codex sûrs sans demander de confirmation, `false`
  pour les refuser, `"auto"` pour acheminer les approbations requises par Codex via les approbations
  de Plugin OpenClaw, ou `"ask"` pour demander confirmation pour chaque écriture/action destructrice
  de Plugin sans approbation durable. Le mode `"ask"` efface les remplacements d’approbation Codex
  durables par outil pour l’application concernée et sélectionne le réviseur humain
  des approbations pour cette application avant le démarrage du fil Codex.
  Par défaut : `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled` : active une
  entrée de Plugin migrée lorsque `codexPlugins.enabled` global est également vrai.
  Par défaut : `true` pour les entrées explicites.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName` :
  identité stable de la place de marché. La V1 ne prend en charge que `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName` : identité stable
  du Plugin Codex issue de la migration, par exemple `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions` :
  remplacement des actions destructrices par Plugin. Lorsqu’elle est omise, la valeur globale
  `allow_destructive_actions` est utilisée. La valeur par Plugin accepte les mêmes politiques
  `true`, `false`, `"auto"` ou `"ask"`.

Chaque application Plugin admise qui utilise `"ask"` achemine les demandes d’approbation de cette application
vers le réviseur humain. Les autres applications et les approbations de fils hors application conservent
leur réviseur configuré, afin que les politiques de Plugins mixtes n’héritent pas du comportement `"ask"`.

`codexPlugins.enabled` est la directive d’activation globale. Les entrées de Plugin explicites
écrites par la migration constituent l’ensemble durable d’installation et d’éligibilité à la réparation.
`plugins["*"]` n’est pas pris en charge, il n’y a pas de commutateur `install`, et les valeurs locales
`marketplacePath` ne sont intentionnellement pas des champs de configuration, car elles sont propres à l’hôte.

Les vérifications de disponibilité `app/list` sont mises en cache pendant une heure et actualisées
de manière asynchrone lorsqu’elles sont obsolètes. La configuration d’application du fil Codex est calculée
lors de l’établissement de la session du harnais Codex, pas à chaque tour ; utilisez `/new`, `/reset` ou un
redémarrage du Gateway après avoir modifié la configuration du Plugin natif.

- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération web Firecrawl.
  - `apiKey` : clé API Firecrawl facultative pour des limites plus élevées (accepte SecretRef). Se replie sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancien `tools.web.fetch.firecrawl.apiKey` ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent cibler des points de terminaison privés/internes).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche web Grok).
  - `enabled` : activer le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par exemple `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de dreaming de la mémoire. Consultez [Dreaming](/fr/concepts/dreaming) pour les phases et seuils.
  - `enabled` : commutateur principal de dreaming (par défaut `false`).
  - `frequency` : cadence cron pour chaque balayage complet de dreaming (`"0 3 * * *"` par défaut).
  - `model` : remplacement facultatif du modèle de sous-agent Dream Diary. Nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true` ; associez-le à `allowedModels` pour restreindre les cibles. Les erreurs de modèle indisponible sont retentées une fois avec le modèle par défaut de la session ; les échecs de confiance ou de liste d’autorisation ne se replient pas silencieusement.
  - la politique de phase et les seuils sont des détails d’implémentation (pas des clés de configuration visibles par l’utilisateur).
- La configuration complète de la mémoire se trouve dans la [référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les Plugins de bundles Claude activés peuvent aussi fournir des valeurs par défaut OpenClaw intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisir l’identifiant du Plugin de mémoire actif, ou `"none"` pour désactiver les Plugins de mémoire.
- `plugins.slots.contextEngine` : choisir l’identifiant du Plugin de moteur de contexte actif ; vaut `"legacy"` par défaut sauf si vous installez et sélectionnez un autre moteur.

Consultez [Plugins](/fr/tools/plugin).

---

## Engagements

`commitments` contrôle la mémoire de suivi inférée : OpenClaw peut détecter les points de suivi depuis les tours de conversation et les transmettre via des exécutions Heartbeat.

- `commitments.enabled` : activer l’extraction LLM masquée, le stockage et la livraison Heartbeat pour les engagements de suivi inférés. Par défaut : `false`.
- `commitments.maxPerDay` : nombre maximal d’engagements de suivi inférés livrés par session d’agent sur une journée glissante. Par défaut : `3`.

Consultez [Engagements inférés](/fr/concepts/commitments).

---

## Navigateur

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` désactive `act:evaluate` et `wait --fn`.
- `tabCleanup` récupère les onglets d’agent principal suivis après un temps d’inactivité ou lorsqu’une
  session dépasse sa limite. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuels.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, donc la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur le réseau privé.
- En mode strict, les points de terminaison de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage du réseau privé pendant les vérifications d’accessibilité/de découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour les exceptions explicites.
- Les profils distants sont uniquement attachables (démarrage/arrêt/réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent à l’accessibilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglet. Les profils local loopback gérés
  conservent les valeurs CDP locales par défaut.
- Si un service CDP géré en externe est accessible via loopback, définissez
  `attachOnly: true` pour ce profil ; sinon OpenClaw traite le port loopback comme un
  profil de navigateur géré localement et peut signaler des erreurs de propriété du port local.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent s’attacher sur
  l’hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil de navigateur
  basé sur Chromium spécifique, comme Brave ou Edge.
- Les profils `existing-session` peuvent définir `cdpUrl` lorsque Chrome est déjà exécuté
  derrière un point de terminaison de découverte HTTP(S) DevTools ou un point de terminaison WS(S) direct. Dans ce
  mode, OpenClaw transmet le point de terminaison à Chrome MCP au lieu d’utiliser l’auto-connexion ;
  `userDataDir` est ignoré pour les arguments de lancement Chrome MCP.
- Les profils `existing-session` conservent les limites actuelles de route Chrome MCP :
  actions pilotées par instantané/réf au lieu du ciblage par sélecteur CSS, hooks d’envoi
  d’un seul fichier, aucune surcharge de délai d’expiration de boîte de dialogue, pas de `wait --load networkidle`, et pas de
  `responsebody`, d’export PDF, d’interception de téléchargement ni d’actions par lot.
- Les profils `openclaw` gérés localement attribuent automatiquement `cdpPort` et `cdpUrl` ; définissez
  `cdpUrl` explicitement uniquement pour les profils CDP distants ou l’attachement à un point de terminaison
  existing-session.
- Les profils gérés localement peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils gérés localement utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP CDP Chrome
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour la disponibilité
  websocket CDP après lancement. Augmentez-les sur les hôtes plus lents où Chrome
  démarre correctement mais où les vérifications de disponibilité concurrencent le démarrage. Les deux valeurs doivent être des
  entiers positifs jusqu’à `120000` ms ; les valeurs de configuration invalides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour le répertoire personnel de votre OS avant le lancement de Chromium.
  Le `userDataDir` par profil sur les profils `existing-session` est également développé avec le tilde.
- Service de contrôle : loopback uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, dimensionnement de fenêtre ou indicateurs de débogage).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor` : couleur d’accentuation pour le chrome de l’UI de l’application native (teinte de bulle du mode Conversation, etc.).
- `assistant` : remplacement de l’identité dans l’UI de contrôle. Revient à l’identité de l’agent actif.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Détails des champs Gateway">

- `mode` : `local` (exécuter le Gateway) ou `remote` (se connecter au Gateway distant). Le Gateway refuse de démarrer sauf si la valeur est `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement), ou `custom`.
- **Alias bind hérités** : utilisez les valeurs de mode bind dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), pas les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Note Docker** : le bind `loopback` par défaut écoute sur `127.0.0.1` à l’intérieur du conteneur. Avec la mise en réseau bridge Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc le Gateway est inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les binds non-loopback nécessitent l’authentification du Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’onboarding génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRefs), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour des configurations local loopback approuvées ; ce mode n’est volontairement pas proposé par les invites d’onboarding.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification navigateur/utilisateur à un proxy inverse tenant compte de l’identité et fait confiance aux en-têtes d’identité issus de `gateway.trustedProxies` (voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)). Ce mode attend par défaut une source de proxy **non-loopback** ; les proxys inverses loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicite. Les appelants internes sur le même hôte peuvent utiliser `gateway.auth.password` comme solution de repli directe locale ; `gateway.auth.token` reste mutuellement exclusif avec le mode trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque la valeur est `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification Control UI/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison de l’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est approuvé. Valeur par défaut : `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur optionnel des échecs d’authentification. S’applique par IP cliente et par portée d’authentification (shared-secret et device-token sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Les mauvaises tentatives concurrentes depuis le même client peuvent donc déclencher le limiteur dès la deuxième requête au lieu de passer toutes deux comme de simples non-correspondances.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous voulez intentionnellement limiter aussi le trafic localhost (pour des configurations de test ou des déploiements proxy stricts).
- Les tentatives d’authentification WS d’origine navigateur sont toujours limitées avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost basée sur le navigateur).
- Sur loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin`
  normalisée, afin que les échecs répétés depuis une origine localhost ne verrouillent
  pas automatiquement une origine différente.
- `tailscale.mode` : `serve` (tailnet uniquement, bind loopback) ou `funnel` (public, nécessite une authentification).
- `tailscale.serviceName` : nom de Service Tailscale optionnel pour le mode Serve, comme
  `svc:openclaw`. Lorsqu’il est défini, OpenClaw le transmet à `tailscale serve
--service` afin que la Control UI puisse être exposée via un Service nommé plutôt
  que via le nom d’hôte de l’appareil. La valeur doit utiliser le format de nom
  de Service Tailscale `svc:<dns-label>` ; le démarrage indique l’URL de Service dérivée.
- `tailscale.preserveFunnel` : lorsque la valeur est `true` et que `tailscale.mode = "serve"`, OpenClaw
  vérifie `tailscale funnel status` avant de réappliquer Serve au démarrage et l’ignore
  si une route Funnel configurée extérieurement couvre déjà le port du Gateway.
  Valeur par défaut : `false`.
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines navigateur pour les connexions WebSocket au Gateway. Requise pour les origines navigateur publiques non-loopback. Les chargements d’UI LAN/Tailnet privés de même origine depuis loopback, RFC1918/link-local, `.local`, `.ts.net` ou des hôtes Tailscale CGNAT sont acceptés sans activer la solution de repli par en-tête Host.
- `controlUi.chatMessageMaxWidth` : largeur maximale optionnelle pour les messages de chat groupés de la Control UI. Accepte des valeurs de largeur CSS contraintes comme `960px`, `82%`, `min(1280px, 82%)` et `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active la solution de repli par origine d’en-tête Host pour les déploiements qui s’appuient intentionnellement sur une politique d’origine basée sur l’en-tête Host.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `wss://` pour les hôtes publics ; le texte clair `ws://` n’est accepté que pour loopback, LAN, link-local, `.local`, `.ts.net` et les hôtes Tailscale CGNAT.
- `remote.remotePort` : port du Gateway sur l’hôte SSH distant. Valeur par défaut : `18789` ; utilisez-le lorsque le port du tunnel local diffère du port du Gateway distant.
- `remote.sshHostKeyPolicy` : politique de clé d’hôte du tunnel SSH macOS. `strict` est la valeur par défaut et nécessite une clé déjà approuvée. `openssh` est une adhésion explicite à la configuration OpenSSH effective pour les alias gérés ; vérifiez les paramètres SSH utilisateur et système correspondants avant de l’utiliser. L’app macOS et `configure-remote` réinitialisent cette politique à `strict` lors du changement de cible, sauf adhésion explicite à nouveau.
- `gateway.remote.token` / `.password` sont des champs d’identifiants client distant. Ils ne configurent pas à eux seuls l’authentification du Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base pour le relais APNs externe utilisé après que les builds iOS adossés au relais publient les enregistrements vers le Gateway. Les builds publics de l’App Store utilisent le relais OpenClaw hébergé. Les URL de relais personnalisées doivent correspondre à un chemin de build/déploiement iOS délibérément séparé dont l’URL de relais pointe vers ce relais.
- `gateway.push.apns.relay.timeoutMs` : délai d’envoi Gateway-vers-relais en millisecondes. Valeur par défaut : `10000`.
- Les enregistrements adossés au relais sont délégués à une identité Gateway spécifique. L’app iOS associée récupère `gateway.identity.get`, inclut cette identité dans l’enregistrement du relais et transmet au Gateway une autorisation d’envoi limitée à cet enregistrement. Un autre Gateway ne peut pas réutiliser cet enregistrement stocké.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : remplacements temporaires par variables d’environnement pour la configuration du relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.handshakeTimeoutMs` : délai d’expiration de la poignée de main WebSocket pré-authentification du Gateway, en millisecondes. Valeur par défaut : `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` est prioritaire lorsqu’il est défini. Augmentez cette valeur sur les hôtes chargés ou peu puissants où les clients locaux peuvent se connecter pendant que le préchauffage du démarrage se stabilise encore.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur de santé des canaux, en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé. Valeur par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète, en minutes. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Valeur par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur de santé par canal/compte sur une heure glissante. Valeur par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation par canal des redémarrages du moniteur de santé tout en conservant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement par compte pour les canaux multi-comptes. Lorsqu’il est défini, il est prioritaire sur le remplacement au niveau du canal.
- Les chemins d’appel du Gateway local peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue de façon fermée (aucun masquage par solution de repli distante).
- `trustedProxies` : IP de proxy inverse qui terminent TLS ou injectent des en-têtes client transférés. Ne listez que les proxys que vous contrôlez. Les entrées loopback restent valides pour les configurations de proxy/détection locale sur le même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback éligibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque la valeur est `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut : `false` pour un comportement fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation CIDR/IP optionnelle pour approuver automatiquement le premier appairage d’un appareil nœud sans portées demandées. Elle est désactivée lorsqu’elle n’est pas définie. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/Control UI/WebChat, ni les mises à niveau de rôle, de portée, de métadonnées ou de clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : mise en forme globale d’autorisation/refus pour les commandes de nœud déclarées après l’appairage et l’évaluation de la liste d’autorisation de plateforme. Utilisez `allowCommands` pour accepter explicitement des commandes de nœud dangereuses comme `camera.snap`, `camera.clip` et `screen.record` ; `denyCommands` retire une commande même si une valeur par défaut de plateforme ou une autorisation explicite l’inclurait autrement. Après qu’un nœud modifie sa liste de commandes déclarées, rejetez puis réapprouvez l’appairage de cet appareil afin que le Gateway stocke l’instantané de commandes mis à jour.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour `POST /tools/invoke` HTTP (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut pour
  les appelants owner/admin. Cela ne promeut pas les appelants porteurs d’identité `operator.write`
  en accès owner/admin ; `cron`, `gateway` et `nodes` restent
  indisponibles pour les appelants non-owner même lorsqu’ils sont autorisés.

</Accordion>

### Points de terminaison compatibles OpenAI

- RPC HTTP administrateur : désactivé par défaut en tant que Plugin `admin-http-rpc`. Activez le Plugin pour enregistrer `POST /api/v1/admin/rpc`. Voir [RPC HTTP administrateur](/fr/plugins/admin-http-rpc).
- Chat Completions : désactivé par défaut. Activez avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API : `gateway.http.endpoints.responses.enabled`.
- Durcissement des entrées URL Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération d’URL.
- En-tête optionnel de durcissement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instance

Exécutez plusieurs Gateways sur un même hôte avec des ports et des répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicateurs de commodité : `--dev` (utilise `~/.openclaw-dev` + le port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

Voir [Gateways multiples](/fr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled` : active la terminaison TLS sur l’écouteur du Gateway (HTTPS/WSS) (par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire certificat/clé locale auto-signée lorsque les fichiers explicites ne sont pas configurés ; uniquement pour une utilisation locale/dev.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez des permissions restreintes.
- `caPath` : chemin optionnel vers un bundle CA pour la vérification client ou les chaînes de confiance personnalisées.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode` : contrôle la façon dont les modifications de configuration sont appliquées à l’exécution.
  - `"off"` : ignorer les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : toujours redémarrer le processus Gateway lors d’un changement de configuration.
  - `"hot"` : appliquer les changements dans le processus, sans redémarrage.
  - `"hybrid"` (par défaut) : essayer d’abord le rechargement à chaud ; revenir à un redémarrage si nécessaire.
- `debounceMs` : fenêtre d’anti-rebond en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs` : durée maximale facultative en ms à attendre pour les opérations en cours avant de forcer un redémarrage ou un rechargement à chaud du canal. Omettez-la pour utiliser l’attente bornée par défaut (`300000`) ; définissez `0` pour attendre indéfiniment et journaliser périodiquement des avertissements indiquant que des opérations sont toujours en attente.

---

## Points d’accroche

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Authentification : `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Les jetons de point d’accroche dans la chaîne de requête sont rejetés.

Notes de validation et de sécurité :

- `hooks.enabled=true` nécessite un `hooks.token` non vide.
- `hooks.token` doit être distinct de l’authentification active par secret partagé du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) ; au démarrage, un avertissement de sécurité non fatal est journalisé lorsqu’une réutilisation est détectée.
- `openclaw security audit` signale la réutilisation d’authentification point d’accroche/Gateway comme un constat critique, y compris l’authentification par mot de passe du Gateway fournie uniquement au moment de l’audit (`--auth password --password <password>`). Exécutez `openclaw doctor --fix` pour faire tourner un `hooks.token` persistant réutilisé, puis mettez à jour les expéditeurs externes de points d’accroche afin qu’ils utilisent le nouveau jeton de point d’accroche.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié tel que `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mappage ou un préréglage utilise un `sessionKey` avec modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés de mappage statiques ne nécessitent pas cette adhésion explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - Le `sessionKey` provenant de la charge utile de la requête n’est accepté que lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de mappage rendues par modèle sont traitées comme fournies en externe et nécessitent également `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mappage">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de point d’accroche.
  - `transform.module` doit être un chemin relatif et reste dans `hooks.transformsDir` (les chemins absolus et les traversées sont rejetés).
  - Gardez `hooks.transformsDir` sous `~/.openclaw/hooks/transforms` ; les répertoires Skills de l’espace de travail sont rejetés. Si `openclaw doctor` signale ce chemin comme invalide, déplacez le module de transformation dans le répertoire des transformations de points d’accroche ou supprimez `hooks.transformsDir`.
- `agentId` route vers un agent spécifique ; les ID inconnus reviennent à l’agent par défaut.
- `allowedAgentIds` : restreint le routage effectif des agents, y compris le chemin de l’agent par défaut lorsque `agentId` est omis (`*` ou omission = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d’agent de point d’accroche sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de mappage pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d’autorisation facultative de préfixes pour les valeurs `sessionKey` explicites (requête + mappage), par ex. `["hook:"]`. Elle devient obligatoire lorsqu’un mappage ou un préréglage utilise un `sessionKey` avec modèle.
- `deliver: true` envoie la réponse finale à un canal ; `channel` vaut `last` par défaut.
- `model` remplace le LLM pour cette exécution de point d’accroche (doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le préréglage Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` pour correspondre à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le préréglage par un `sessionKey` statique au lieu de la valeur par défaut avec modèle.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway démarre automatiquement `gog gmail watch serve` au démarrage lorsqu’il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N’exécutez pas un `gog gmail watch serve` séparé en parallèle du Gateway.

---

## Hôte du Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Sert le HTML/CSS/JS modifiable par l’agent et A2UI via HTTP sous le port du Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (par défaut).
- Liaisons hors loopback : les routes canvas nécessitent l’authentification du Gateway (jeton/mot de passe/proxy approuvé), comme les autres surfaces HTTP du Gateway.
- Les WebViews Node n’envoient généralement pas d’en-têtes d’authentification ; une fois qu’un nœud est appairé et connecté, le Gateway annonce des URL de capacité limitées au nœud pour l’accès canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du nœud et expirent rapidement. Le repli basé sur l’IP n’est pas utilisé.
- Injecte le client de rechargement en direct dans le HTML servi.
- Crée automatiquement un `index.html` de démarrage lorsqu’il est vide.
- Sert également A2UI à `/__openclaw__/a2ui/`.
- Les changements nécessitent un redémarrage du Gateway.
- Désactivez le rechargement en direct pour les grands répertoires ou les erreurs `EMFILE`.

---

## Découverte

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (par défaut lorsque le Plugin `bonjour` groupé est activé) : omettre `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclure `cliPath` + `sshPort` ; l’annonce multicast LAN nécessite toujours l’activation du Plugin `bonjour` groupé.
- `off` : supprimer l’annonce multicast LAN sans changer l’activation du Plugin.
- Le Plugin `bonjour` groupé démarre automatiquement sur les hôtes macOS et est opt-in sur Linux, Windows et les déploiements Gateway conteneurisés.
- Le nom d’hôte vaut par défaut le nom d’hôte système lorsqu’il s’agit d’un libellé DNS valide, avec repli sur `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte entre réseaux, associez-la à un serveur DNS (CoreDNS recommandé) + DNS fractionné Tailscale.

Configuration : `openclaw dns setup --apply`.

---

## Environnement

### `env` (variables d’environnement inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Les variables d’environnement inline ne sont appliquées que si l’environnement du processus ne contient pas la clé.
- Fichiers `.env` : `.env` du CWD + `~/.openclaw/.env` (aucun ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil de votre shell de connexion.
- Consultez [Environnement](/fr/help/environment) pour la précédence complète.

### Substitution de variables d’environnement

Référencez des variables d’environnement dans n’importe quelle chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Seuls les noms en majuscules correspondent : `[A-Z_][A-Z0-9_]*`.
- Les variables manquantes/vides provoquent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secret sont additives : les valeurs en texte clair fonctionnent toujours.

### `SecretRef`

Utilisez une forme d’objet unique :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- motif de `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- motif de l’id `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- motif de l’id `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (prend en charge les sélecteurs de style AWS `secret#json_key`)
- les id `source: "exec"` ne doivent pas contenir de segments de chemin délimités par des barres obliques `.` ou `..` (par exemple `a/../b` est rejeté)

### Surface d’identifiants prise en charge

- Matrice canonique : [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins d’identifiants `openclaw.json` pris en charge.
- Les refs `auth-profiles.json` sont incluses dans la résolution à l’exécution et la couverture d’audit.

### Configuration des fournisseurs de secrets

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notes :

- Le fournisseur `file` prend en charge `mode: "json"` et `mode: "singleValue"` (`id` doit être `"value"` en mode singleValue).
- Les chemins des fournisseurs file et exec échouent de façon fermée lorsque la vérification des ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour les chemins approuvés qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande en lien symbolique sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins en lien symbolique tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification du répertoire approuvé s’applique au chemin cible résolu.
- L’environnement enfant de `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secret sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage des surfaces actives s’applique pendant l’activation : les refs non résolues sur les surfaces activées font échouer le démarrage/rechargement, tandis que les surfaces inactives sont ignorées avec des diagnostics.

---

## Stockage de l’authentification

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Les profils par agent sont stockés dans `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` prend en charge les références au niveau des valeurs (`keyRef` pour `api_key`, `tokenRef` pour `token`) pour les modes d’identifiants statiques.
- Les anciennes cartes plates `auth-profiles.json`, comme `{ "provider": { "apiKey": "..." } }`, ne sont pas un format d’exécution ; `openclaw doctor --fix` les réécrit en profils de clé API canoniques `provider:default` avec une sauvegarde `.legacy-flat.*.bak`.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification adossés à SecretRef.
- Les identifiants d’exécution statiques proviennent d’instantanés résolus en mémoire ; les anciennes entrées statiques `auth.json` sont supprimées lorsqu’elles sont découvertes.
- Les anciens imports OAuth proviennent de `~/.openclaw/credentials/oauth.json`.
- Voir [OAuth](/fr/concepts/oauth).
- Comportement d’exécution des secrets et outils `audit/configure/apply` : [Gestion des secrets](/fr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours` : délai de repli de base, en heures, lorsqu’un profil échoue à cause de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Un texte explicite lié à la facturation peut tout de même arriver ici même sur des réponses `401`/`403`, mais les correspondances textuelles propres à un fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Les messages HTTP `402` réessayables liés à une fenêtre d’utilisation ou à une limite de dépense d’organisation/espace de travail restent plutôt dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur pour les heures de repli liées à la facturation.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du repli lié à la facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : délai de repli de base, en minutes, pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du repli `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de repli (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de surcharge avant de basculer vers le repli de modèle (par défaut : `1`). Les formes indiquant un fournisseur occupé, comme `ModelNotReadyException`, arrivent ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de limite de débit avant de basculer vers le repli de modèle (par défaut : `1`). Ce compartiment de limite de débit inclut du texte structuré par fournisseur comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

---

## Journalisation

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Fichier journal par défaut : `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Définissez `logging.file` pour un chemin stable.
- `consoleLevel` passe à `debug` lorsque `--verbose` est utilisé.
- `maxFileBytes` : taille maximale du fichier journal actif en octets avant rotation (entier positif ; par défaut : `104857600` = 100 Mo). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif.
- `redactSensitive` / `redactPatterns` : masquage au mieux pour la sortie console, les fichiers journaux, les enregistrements de journaux OTLP et le texte de transcription de session persistant. `redactSensitive: "off"` désactive seulement cette politique générale de journaux/transcriptions ; les surfaces de sécurité de l’interface utilisateur, des outils et des diagnostics continuent de masquer les secrets avant émission.

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled` : interrupteur principal pour la sortie d’instrumentation (par défaut : `true`).
- `flags` : tableau de chaînes d’indicateurs activant une sortie de journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’âge sans progression, en ms, pour classer les sessions de traitement longues comme `session.long_running`, `session.stalled` ou `session.stuck`. Les réponses, outils, statuts, blocs et la progression ACP réinitialisent le minuteur ; les diagnostics `session.stuck` répétés ralentissent tant que rien ne change.
- `stuckSessionAbortMs` : seuil d’âge sans progression, en ms, avant qu’un travail actif bloqué éligible puisse être abandonné et drainé pour récupération. Lorsqu’il n’est pas défini, OpenClaw utilise la fenêtre d’exécution intégrée étendue plus sûre d’au moins 5 minutes et 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot` : capture un instantané de stabilité expurgé avant OOM lorsque la pression mémoire atteint `critical` (par défaut : `false`). Définissez sur `true` pour ajouter l’analyse/l’écriture du fichier de bundle de stabilité tout en conservant les événements normaux de pression mémoire.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (par défaut : `false`). Pour la configuration complète, le catalogue de signaux et le modèle de confidentialité, voir [Export OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : points de terminaison OTLP facultatifs propres à chaque signal. Lorsqu’ils sont définis, ils remplacent `otel.endpoint` uniquement pour ce signal.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom du service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : activent l’export des traces, métriques ou journaux.
- `otel.logsExporter` : récepteur d’export des journaux : `"otlp"` (par défaut), `"stdout"` pour un objet JSON par ligne stdout, ou `"both"`.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`-`1`.
- `otel.flushIntervalMs` : intervalle de vidage périodique de la télémétrie en ms.
- `otel.captureContent` : capture de contenu brut sur option explicite pour les attributs de spans OTEL. Désactivée par défaut. Le booléen `true` capture le contenu non système des messages/outils ; la forme objet permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` et `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : variable d’environnement activant la dernière forme expérimentale des spans d’inférence GenAI, notamment les noms de spans `{gen_ai.operation.name} {gen_ai.request.model}`, le genre de span `CLIENT` et `gen_ai.provider.name` au lieu de l’ancien `gen_ai.system`. Par défaut, les spans conservent `openclaw.model.call` et `gen_ai.system` pour la compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : variable d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK possédé par le Plugin tout en gardant les écouteurs de diagnostic actifs.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` et `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` : variables d’environnement de point de terminaison propres aux signaux, utilisées lorsque la clé de configuration correspondante n’est pas définie.
- `cacheTrace.enabled` : journalise les instantanés de trace de cache pour les exécutions intégrées (par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie pour le JSONL de trace de cache (par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôlent ce qui est inclus dans la sortie de trace de cache (tous par défaut : `true`).

---

## Mise à jour

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel` : canal de publication pour les installations npm/git - `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart` : vérifie les mises à jour npm au démarrage du Gateway (par défaut : `true`).
- `auto.enabled` : active la mise à jour automatique en arrière-plan pour les installations de paquet (par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant l’application automatique sur le canal stable (par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire, en heures, pour répartir le déploiement sur le canal stable (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence, en heures, des vérifications sur le canal bêta (par défaut : `1` ; max : `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled` : garde globale de fonctionnalité ACP (par défaut : `true` ; définissez `false` pour masquer les possibilités de répartition et de lancement ACP).
- `dispatch.enabled` : garde indépendante pour la répartition des tours de session ACP (par défaut : `true`). Définissez `false` pour garder les commandes ACP disponibles tout en bloquant l’exécution.
- `backend` : identifiant du backend d’exécution ACP par défaut (doit correspondre à un Plugin d’exécution ACP enregistré).
  Installez d’abord le Plugin backend et, si `plugins.allow` est défini, incluez l’identifiant du Plugin backend (par exemple `acpx`), sinon le backend ACP ne se chargera pas.
- `defaultAgent` : identifiant d’agent cible ACP de repli lorsque les lancements ne spécifient pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agents permis pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage d’inactivité en ms pour le texte diffusé en continu.
- `stream.maxChunkChars` : taille maximale de fragment avant de scinder la projection de bloc diffusée en continu.
- `stream.repeatSuppression` : supprime les lignes de statut/outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse progressivement ; `"final_only"` met en mémoire tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après des événements d’outil masqués (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie de l’assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes de statut/mise à jour ACP projetées.
- `stream.tagVisibility` : enregistrement des noms de tags vers des remplacements booléens de visibilité pour les événements diffusés en continu.
- `runtime.ttlMinutes` : TTL d’inactivité en minutes pour les workers de session ACP avant nettoyage éligible.
- `runtime.installCommand` : commande d’installation facultative à exécuter lors de l’amorçage d’un environnement d’exécution ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` contrôle le style du slogan de la bannière :
  - `"random"` (par défaut) : slogans amusants/saisonniers tournants.
  - `"default"` : slogan neutre fixe (`All your chats, one OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre/la version de la bannière restent affichés).
- Pour masquer toute la bannière (pas seulement les slogans), définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Assistant de configuration

Métadonnées écrites par les flux de configuration guidée de la CLI (`onboard`, `configure`, `doctor`) :

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identité

Consultez les champs d’identité `agents.list` sous [Valeurs par défaut de l’agent](/fr/gateway/config-agents#agent-defaults).

---

## Pont (hérité, supprimé)

Les versions actuelles n’incluent plus le pont TCP. Les Nodes se connectent via le WebSocket du Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu’elles ne sont pas supprimées ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration de pont héritée (référence historique)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention` : durée pendant laquelle conserver les sessions d’exécution Cron isolées terminées avant leur élagage depuis `sessions.json`. Contrôle aussi le nettoyage des transcriptions Cron supprimées archivées. Par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : accepté pour compatibilité avec les anciens journaux d’exécution Cron basés sur des fichiers. Par défaut : `2_000_000` octets.
- `runLog.keepLines` : dernières lignes d’historique d’exécution SQLite conservées par tâche. Par défaut : `2000`.
- `webhookToken` : jeton bearer utilisé pour la livraison POST du Webhook Cron (`delivery.mode = "webhook"`), si omis aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL Webhook de repli héritée dépréciée (http/https) utilisée par `openclaw doctor --fix` pour migrer les tâches stockées qui ont encore `notify: true` ; la livraison à l’exécution utilise `delivery.mode="webhook"` par tâche plus `delivery.to`, ou `delivery.completionDestination` lors de la préservation de la livraison d’annonce.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches Cron en cas d’erreurs transitoires (par défaut : `3` ; plage : `0`-`10`).
- `backoffMs` : tableau des délais de backoff en ms pour chaque tentative de réessai (par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d’erreurs qui déclenchent des réessais - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

Les tâches ponctuelles restent activées jusqu’à épuisement des tentatives de réessai, puis se désactivent en conservant l’état d’erreur final. Les tâches récurrentes utilisent la même politique de réessai transitoire pour s’exécuter à nouveau après le backoff avant leur prochain créneau planifié ; les erreurs permanentes ou les réessais transitoires épuisés reviennent au planning récurrent normal avec backoff d’erreur.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled` : active les alertes d’échec pour les tâches Cron (par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant le déclenchement d’une alerte (entier positif, min : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre les alertes répétées pour la même tâche (entier non négatif).
- `includeSkipped` : compte les exécutions ignorées consécutives dans le seuil d’alerte (par défaut : `false`). Les exécutions ignorées sont suivies séparément et n’affectent pas le backoff des erreurs d’exécution.
- `mode` : mode de livraison - `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : identifiant de compte ou de canal facultatif pour limiter la portée de la livraison d’alerte.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destination par défaut pour les notifications d’échec Cron sur toutes les tâches.
- `mode` : `"announce"` ou `"webhook"` ; vaut par défaut `"announce"` lorsque suffisamment de données de cible existent.
- `channel` : remplacement du canal pour la livraison d’annonce. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible d’annonce explicite ou URL Webhook. Requis pour le mode Webhook.
- `accountId` : remplacement facultatif du compte pour la livraison.
- `delivery.failureDestination` par tâche remplace cette valeur globale par défaut.
- Quand aucune destination d’échec globale ni par tâche n’est définie, les tâches qui livrent déjà via `announce` reviennent à cette cible d’annonce principale en cas d’échec.
- `delivery.failureDestination` n’est pris en charge que pour les tâches `sessionTarget="isolated"`, sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions Cron isolées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle de médias

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans encapsulations d’historique/expéditeur) |
| `{{BodyStripped}}` | Corps sans les mentions de groupe                 |
| `{{From}}`         | Identifiant de l’expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | Identifiant du message du canal                   |
| `{{SessionId}}`    | UUID de la session actuelle                       |
| `{{IsNewSession}}` | `"true"` quand une nouvelle session est créée     |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite média résolue pour les entrées CLI         |
| `{{MaxChars}}`     | Nombre maximal de caractères de sortie résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (au mieux)                        |
| `{{GroupMembers}}` | Aperçu des membres du groupe (au mieux)           |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (au mieux)        |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (au mieux)    |
| `{{Provider}}`     | Indice de fournisseur (whatsapp, telegram, discord, etc.) |

---

## Inclusions de configuration (`$include`)

Divisez la configuration en plusieurs fichiers :

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportement de fusion :**

- Fichier unique : remplace l’objet conteneur.
- Tableau de fichiers : fusion profonde dans l’ordre (les plus récents remplacent les précédents).
- Clés sœurs : fusionnées après les inclusions (remplacent les valeurs incluses).
- Inclusions imbriquées : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus relativement au fichier incluant, mais doivent rester dans le répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues/`../` ne sont autorisées que lorsqu’elles se résolvent toujours dans cette limite. Les chemins ne doivent pas contenir d’octets nuls et doivent faire strictement moins de 4096 caractères avant et après résolution.
- Les écritures appartenant à OpenClaw qui ne modifient qu’une section de niveau supérieur sauvegardée par une inclusion de fichier unique écrivent directement dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les inclusions racine, les tableaux d’inclusions et les inclusions avec remplacements par clés sœurs sont en lecture seule pour les écritures appartenant à OpenClaw ; ces écritures échouent en mode fermé au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, erreurs d’analyse, inclusions circulaires, format de chemin invalide et longueur excessive.

---

_Associé : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Associé

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
