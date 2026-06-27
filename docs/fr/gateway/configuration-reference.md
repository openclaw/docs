---
read_when:
    - Vous avez besoin d’une sémantique de configuration ou de valeurs par défaut exactes au niveau des champs
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration du Gateway pour les clés OpenClaw principales, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-06-27T17:29:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Référence de configuration principale pour `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâches, consultez [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d’OpenClaw et renvoie vers d’autres pages lorsqu’un sous-système dispose de sa propre référence plus détaillée. Les catalogues de commandes détenus par les canaux et les Plugins, ainsi que les réglages avancés de mémoire/QMD, résident sur leurs propres pages plutôt que sur celle-ci.

Vérité du code :

- `openclaw config schema` affiche le JSON Schema actif utilisé pour la validation et la Control UI, avec les métadonnées groupées/Plugin/canal fusionnées lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma limité à un chemin pour les outils d’exploration
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hash de référence de la documentation de configuration par rapport à la surface de schéma actuelle

Chemin de recherche agent : utilisez l’action d’outil `gateway` `config.schema.lookup` pour
obtenir la documentation et les contraintes exactes au niveau des champs avant toute modification. Utilisez
[Configuration](/fr/gateway/configuration) pour les conseils orientés tâches et cette page
pour la carte plus large des champs, les valeurs par défaut et les liens vers les références de sous-systèmes.

Références approfondies dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées + groupées
- pages propriétaires des canaux/Plugins pour les surfaces de commandes propres aux canaux

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs - OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée - consultez
[Configuration - canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres
canaux groupés (authentification, contrôle d’accès, comptes multiples, contrôle des mentions).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée - consultez
[Configuration - agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, réflexion, heartbeat, mémoire, médias, skills, sandbox)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie de session, compaction, élagage)
- `messages.*` (livraison des messages, TTS, rendu markdown)
- `talk.*` (mode Talk)
  - `talk.consultThinkingLevel` : surcharge du niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les consultations en temps réel Control UI Talk
  - `talk.consultFastMode` : surcharge ponctuelle du mode rapide pour les consultations en temps réel Control UI Talk
  - `talk.speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur iOS/macOS
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)
  - `talk.realtime.consultRouting` : repli de relais Gateway pour les transcriptions Talk temps réel finalisées qui ignorent `openclaw_agent_consult`

## Outils et fournisseurs personnalisés

La politique d’outils, les bascules expérimentales, la configuration d’outils adossés à des fournisseurs, ainsi que la configuration des fournisseurs personnalisés / URL de base ont été déplacées vers une page dédiée - consultez
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Modèles

Les définitions de fournisseurs, les listes d’autorisation de modèles et la configuration de fournisseurs personnalisés se trouvent dans
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls).
La racine `models` possède également le comportement global du catalogue de modèles.

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
  la `command` absolue si nécessaire, attend que le service soit prêt, puis envoie la requête au modèle.
  Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- `models.pricing.enabled` : contrôle l’amorçage de tarification en arrière-plan qui
  démarre après que les sidecars et les canaux atteignent le chemin prêt du Gateway. Quand `false`,
  le Gateway ignore les récupérations des catalogues de tarification OpenRouter et LiteLLM ; les valeurs
  `models.providers.*.models[].cost` configurées continuent de fonctionner pour les estimations de coût locales.

## MCP

Les définitions de serveurs MCP gérées par OpenClaw résident sous `mcp.servers` et sont
consommées par OpenClaw intégré et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au serveur cible
pendant les modifications de configuration.

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
  tout en l’excluant de la découverte MCP OpenClaw intégrée et de la projection d’outils.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs` : délai d’expiration des requêtes MCP
  par serveur en secondes ou millisecondes.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs` : délai d’expiration de connexion
  par serveur en secondes ou millisecondes.
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
  ressources ou prompts génèrent également des noms d’outils utilitaires (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), et ces noms utilisent le
  même filtre.
- `mcp.servers.<name>.codex` : contrôles facultatifs de projection du serveur d’application Codex.
  Ce bloc est une métadonnée OpenClaw uniquement pour les threads de serveur d’application Codex ; il n’affecte pas
  les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs d’exécution.
  `codex.agents` non vide limite le serveur aux identifiants d’agents OpenClaw listés.
  Les listes d’agents vides, blanches ou à portée invalide sont rejetées par la validation de configuration
  et omises par le chemin de projection runtime au lieu de devenir globales.
  `codex.defaultToolsApprovalMode` émet le
  `default_tools_approval_mode` natif de Codex pour ce serveur. OpenClaw supprime le bloc `codex`
  avant de transmettre la configuration native `mcp_servers` à Codex. Omettez le bloc pour
  garder le serveur projeté pour chaque agent de serveur d’application Codex avec le comportement
  d’approbation MCP par défaut de Codex.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les runtimes MCP groupés limités à la session.
  Les exécutions intégrées ponctuelles demandent un nettoyage en fin d’exécution ; ce TTL est le filet de sécurité pour
  les sessions longues et les futurs appelants.
- Les changements sous `mcp.*` s’appliquent à chaud en disposant les runtimes MCP de session mis en cache.
  La découverte/utilisation d’outil suivante les recrée à partir de la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont récupérées immédiatement au lieu d’attendre le TTL d’inactivité.
- La découverte runtime respecte également les notifications de changement de liste d’outils MCP en supprimant
  le catalogue mis en cache pour cette session. Les serveurs qui annoncent des ressources ou
  des prompts obtiennent des outils utilitaires pour lister/lire les ressources et lister/récupérer
  les prompts. Les échecs répétés d’appels d’outils mettent brièvement en pause le serveur concerné avant
  qu’un autre appel ne soit tenté.

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

- `allowBundled` : liste d’autorisation facultative uniquement pour les skills groupés (skills gérés/espace de travail non affectés).
- `load.extraDirs` : racines de skills partagées supplémentaires (priorité la plus basse).
- `load.allowSymlinkTargets` : racines cibles réelles de confiance dans lesquelles les symlinks de skills peuvent
  se résoudre lorsque le lien réside hors de sa racine source configurée.
- `workshop.allowSymlinkTargetWrites` : autorise Skill Workshop apply à écrire
  à travers des cibles de symlink déjà approuvées (par défaut : false).
- `install.preferBrew` : lorsque true, préfère les installateurs Homebrew lorsque `brew` est
  disponible avant de revenir à d’autres types d’installateurs.
- `install.nodeManager` : préférence d’installateur Node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives` : autorise les clients Gateway `operator.admin` de confiance
  à installer des archives zip privées mises en place via `skills.upload.*`
  (par défaut : false). Cela active uniquement le chemin d’archive téléversée ; les installations ClawHub
  normales ne l’exigent pas.
- `entries.<skillKey>.enabled: false` désactive une skill même si elle est groupée/installée.
- `entries.<skillKey>.apiKey` : commodité pour les skills déclarant une variable d’environnement principale (chaîne en clair ou objet SecretRef).

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

- Chargés depuis des répertoires de package ou de bundle sous `~/.openclaw/extensions` et `<workspace>/.openclaw/extensions`, ainsi que depuis les fichiers ou répertoires listés dans `plugins.load.paths`.
- Placez les fichiers de plugin autonomes dans `plugins.load.paths` ; les racines d’extension découvertes automatiquement ignorent les fichiers `.js`, `.mjs` et `.ts` de premier niveau afin que les scripts d’aide dans ces racines ne bloquent pas le démarrage.
- La découverte accepte les plugins OpenClaw natifs ainsi que les bundles Codex et Claude compatibles, y compris les bundles Claude sans manifeste à disposition par défaut.
- **Les changements de configuration nécessitent un redémarrage du Gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins listés se chargent). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ pratique de clé d’API au niveau du plugin (lorsqu’il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : map de variables d’environnement propre au plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le noyau bloque `before_prompt_build` et ignore les champs qui modifient les prompts depuis l’ancien `before_agent_start`, tout en conservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugins natifs et aux répertoires de hooks fournis par des bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les plugins de confiance non groupés peuvent lire le contenu brut de la conversation depuis des hooks typés tels que `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : faire explicitement confiance à ce plugin pour demander des substitutions de `provider` et de `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les substitutions de sous-agents de confiance. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowModelOverride` : faire explicitement confiance à ce plugin pour demander des substitutions de modèle pour `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les substitutions d’achèvement LLM de plugin de confiance. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowAgentIdOverride` : faire explicitement confiance à ce plugin pour exécuter `api.runtime.llm.complete` avec un identifiant d’agent autre que celui par défaut.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma du plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte et d’exécution des plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du plugin propriétaire, et non par un registre central d’options OpenClaw.

### Configuration du plugin de harnais Codex

Le plugin `codex` groupé possède les paramètres natifs de harnais de serveur d’application Codex sous
`plugins.entries.codex.config`. Consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference) pour toute la surface de configuration
et le [harnais Codex](/fr/plugins/codex-harness) pour le modèle d’exécution.

`codexPlugins` s’applique uniquement aux sessions qui sélectionnent le harnais Codex natif.
Il n’active pas les plugins Codex pour les exécutions de fournisseur OpenClaw, les liaisons de conversation ACP
ni aucun harnais non Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled` : active la prise en charge native des
  plugins/applications Codex pour le harnais Codex. Valeur par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions` :
  politique par défaut pour les actions destructrices des sollicitations d’applications de plugin migrées.
  Utilisez `true` pour accepter les schémas d’approbation Codex sûrs sans demander de confirmation, `false`
  pour les refuser, `"auto"` pour acheminer les approbations requises par Codex via les approbations de plugin OpenClaw,
  ou `"always"` pour demander chaque action d’écriture/destructrice de plugin
  sans approbation durable. Le mode `"always"` efface les substitutions durables d’approbation Codex
  par outil pour l’application concernée avant de démarrer le fil.
  Valeur par défaut : `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled` : active une
  entrée de plugin migrée lorsque `codexPlugins.enabled` global vaut également true.
  Valeur par défaut : `true` pour les entrées explicites.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName` :
  identité stable de marketplace. V1 prend uniquement en charge `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName` : identité stable
  du plugin Codex issue de la migration, par exemple `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions` :
  substitution par plugin de la politique d’actions destructrices. En cas d’omission, la valeur globale
  `allow_destructive_actions` est utilisée. La valeur par plugin accepte les mêmes politiques
  `true`, `false`, `"auto"` ou `"always"`.

`codexPlugins.enabled` est la directive d’activation globale. Les entrées de plugin explicites
écrites par la migration constituent l’ensemble durable d’installation et d’éligibilité à la réparation.
`plugins["*"]` n’est pas pris en charge, il n’existe pas de commutateur `install`, et les valeurs locales
`marketplacePath` ne sont intentionnellement pas des champs de configuration, car elles sont
propres à l’hôte.

Les contrôles de disponibilité `app/list` sont mis en cache pendant une heure et actualisés
de manière asynchrone lorsqu’ils sont périmés. La configuration des applications de fil Codex est calculée lors de l’établissement de la session du harnais Codex,
et non à chaque tour ; utilisez `/new`, `/reset` ou un redémarrage du Gateway
après avoir modifié la configuration native du plugin.

- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération web Firecrawl.
  - `apiKey` : clé d’API Firecrawl facultative pour des limites plus élevées (accepte SecretRef). Se rabat sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancien `tools.web.fetch.firecrawl.apiKey` ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (valeur par défaut : `https://api.firecrawl.dev` ; les substitutions auto-hébergées doivent cibler des points de terminaison privés/internes).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (valeur par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (valeur par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration des requêtes de scraping en secondes (valeur par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres de xAI X Search (recherche web Grok).
  - `enabled` : active le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (p. ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de dreaming de mémoire. Consultez [Dreaming](/fr/concepts/dreaming) pour les phases et les seuils.
  - `enabled` : commutateur principal de dreaming (par défaut `false`).
  - `frequency` : cadence cron pour chaque balayage complet de dreaming (`"0 3 * * *"` par défaut).
  - `model` : substitution facultative du modèle de sous-agent Dream Diary. Nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true` ; associez-la à `allowedModels` pour restreindre les cibles. Les erreurs de modèle indisponible réessaient une fois avec le modèle par défaut de la session ; les échecs de confiance ou de liste d’autorisation ne se rabattent pas silencieusement.
  - la politique de phases et les seuils sont des détails d’implémentation (pas des clés de configuration destinées aux utilisateurs).
- La configuration complète de la mémoire se trouve dans la [référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les plugins de bundle Claude activés peuvent également fournir des valeurs par défaut OpenClaw intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs de configuration OpenClaw bruts.
- `plugins.slots.memory` : choisir l’identifiant du plugin de mémoire actif, ou `"none"` pour désactiver les plugins de mémoire.
- `plugins.slots.contextEngine` : choisir l’identifiant du plugin de moteur de contexte actif ; la valeur par défaut est `"legacy"` sauf si vous installez et sélectionnez un autre moteur.

Consultez [Plugins](/fr/tools/plugin).

---

## Engagements

`commitments` contrôle la mémoire de suivi inférée : OpenClaw peut détecter les points de suivi depuis les tours de conversation et les livrer via des exécutions Heartbeat.

- `commitments.enabled` : active l’extraction LLM masquée, le stockage et la livraison Heartbeat pour les engagements de suivi inférés. Valeur par défaut : `false`.
- `commitments.maxPerDay` : nombre maximal d’engagements de suivi inférés livrés par session d’agent sur une journée glissante. Valeur par défaut : `3`.

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
- `tabCleanup` récupère les onglets d’agent principal suivis après une période d’inactivité ou lorsqu’une
  session dépasse son plafond. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuels.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, donc la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur réseau privé.
- En mode strict, les points de terminaison de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage des réseaux privés pendant les vérifications d’accessibilité/découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour les exceptions explicites.
- Les profils distants sont uniquement en attachement (démarrage/arrêt/réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent aux requêtes d’accessibilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglets. Les profils local loopback
  gérés conservent les valeurs CDP locales par défaut.
- Si un service CDP géré en externe est accessible via la boucle locale, définissez
  `attachOnly: true` pour ce profil ; sinon OpenClaw traite le port de boucle locale comme un
  profil de navigateur local géré et peut signaler des erreurs de propriété de port local.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent s’attacher sur
  l’hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil de navigateur
  basé sur Chromium spécifique, comme Brave ou Edge.
- Les profils `existing-session` peuvent définir `cdpUrl` lorsque Chrome s’exécute déjà
  derrière un point de terminaison de découverte HTTP(S) DevTools ou un point de terminaison WS(S) direct. Dans ce
  mode, OpenClaw transmet le point de terminaison à Chrome MCP au lieu d’utiliser la connexion automatique ;
  `userDataDir` est ignoré pour les arguments de lancement de Chrome MCP.
- Les profils `existing-session` conservent les limites actuelles de route Chrome MCP :
  actions pilotées par instantané/référence au lieu du ciblage par sélecteur CSS, hooks de téléversement
  d’un seul fichier, aucune surcharge de délai d’expiration des boîtes de dialogue, pas de `wait --load networkidle`, et pas de
  `responsebody`, d’export PDF, d’interception de téléchargement ni d’actions par lot.
- Les profils `openclaw` locaux gérés attribuent automatiquement `cdpPort` et `cdpUrl` ; définissez
  `cdpUrl` explicitement uniquement pour les profils CDP distants ou l’attachement à un point de terminaison
  existant-session.
- Les profils locaux gérés peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils locaux gérés utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP Chrome CDP
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour la
  disponibilité WebSocket CDP après lancement. Augmentez-les sur les hôtes plus lents où Chrome
  démarre correctement mais où les vérifications de disponibilité entrent en concurrence avec le démarrage. Les deux valeurs doivent être
  des entiers positifs jusqu’à `120000` ms ; les valeurs de configuration invalides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour le répertoire personnel de votre OS avant le lancement de Chromium.
  Le `userDataDir` par profil des profils `existing-session` est également développé depuis le tilde.
- Service de contrôle : boucle locale uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, la taille de fenêtre ou des indicateurs de débogage).

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

- `seamColor` : couleur d’accentuation pour le chrome de l’UI de l’application native (teinte de la bulle du mode Conversation, etc.).
- `assistant` : remplacement de l’identité de l’UI de contrôle. Se rabat sur l’identité de l’agent actif.

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

<Accordion title="Gateway field details">

- `mode` : `local` (exécuter Gateway) ou `remote` (se connecter au Gateway distant). Gateway refuse de démarrer sauf si la valeur est `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement) ou `custom`.
- **Alias de liaison hérités** : utilisez les valeurs de mode de liaison dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), pas les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Note Docker** : la liaison `loopback` par défaut écoute sur `127.0.0.1` à l’intérieur du conteneur. Avec le réseau bridge de Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc le Gateway est inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les liaisons non-loopback nécessitent une authentification Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’intégration génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRefs), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour des configurations local loopback fiables ; ce mode n’est volontairement pas proposé par les invites d’intégration.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification navigateur/utilisateur à un proxy inverse sensible à l’identité et fait confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)). Ce mode attend par défaut une source de proxy **non-loopback** ; les proxys inverses loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicite. Les appelants internes sur le même hôte peuvent utiliser `gateway.auth.password` comme solution de repli directe locale ; `gateway.auth.token` reste mutuellement exclusif avec le mode trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque la valeur est `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de l’interface utilisateur de contrôle/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison de l’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est fiable. Valeur par défaut : `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d’authentification. S’applique par adresse IP cliente et par périmètre d’authentification (shared-secret et device-token sont suivis séparément). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone de l’interface utilisateur de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives incorrectes concurrentes provenant du même client peuvent donc déclencher le limiteur dès la deuxième requête au lieu de toutes passer en concurrence comme de simples non-correspondances.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous voulez intentionnellement limiter aussi le trafic localhost (pour des configurations de test ou des déploiements proxy stricts).
- Les tentatives d’authentification WS provenant d’une origine de navigateur sont toujours bridées avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost depuis un navigateur).
- Sur loopback, ces verrouillages provenant d’une origine de navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne verrouillent pas automatiquement
  une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, liaison loopback) ou `funnel` (public, nécessite une authentification).
- `tailscale.serviceName` : nom de service Tailscale facultatif pour le mode Serve, par exemple
  `svc:openclaw`. Lorsqu’il est défini, OpenClaw le transmet à `tailscale serve
--service` afin que l’interface utilisateur de contrôle puisse être exposée via un Service nommé plutôt
  que via le nom d’hôte de l’appareil. La valeur doit utiliser le format de nom de Service Tailscale `svc:<dns-label>` ;
  le démarrage signale l’URL de Service dérivée.
- `tailscale.preserveFunnel` : lorsque la valeur est `true` et que `tailscale.mode = "serve"`, OpenClaw
  vérifie `tailscale funnel status` avant de réappliquer Serve au démarrage et l’ignore
  si une route Funnel configurée en externe couvre déjà le port du Gateway.
  Valeur par défaut : `false`.
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines de navigateur pour les connexions WebSocket au Gateway. Requise pour les origines de navigateur publiques non-loopback. Les chargements d’interface utilisateur LAN/Tailnet privés de même origine depuis des hôtes loopback, RFC1918/link-local, `.local`, `.ts.net` ou Tailscale CGNAT sont acceptés sans activer la solution de repli par en-tête Host.
- `controlUi.chatMessageMaxWidth` : largeur maximale facultative pour les messages de chat groupés de l’interface utilisateur de contrôle. Accepte des valeurs de largeur CSS contraintes comme `960px`, `82%`, `min(1280px, 82%)` et `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active la solution de repli d’origine par en-tête Host pour les déploiements qui s’appuient intentionnellement sur une politique d’origine fondée sur l’en-tête Host.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `wss://` pour les hôtes publics ; le texte clair `ws://` n’est accepté que pour les hôtes loopback, LAN, link-local, `.local`, `.ts.net` et Tailscale CGNAT.
- `remote.remotePort` : port du Gateway sur l’hôte SSH distant. Valeur par défaut : `18789` ; utilisez-le lorsque le port du tunnel local diffère du port du Gateway distant.
- `gateway.remote.token` / `.password` sont des champs d’identifiants du client distant. Ils ne configurent pas à eux seuls l’authentification Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé après que les builds iOS adossés au relais publient les inscriptions auprès du Gateway. Les builds publics App Store/TestFlight utilisent le relais OpenClaw hébergé. Les URL de relais personnalisées doivent correspondre à un chemin de build/déploiement iOS volontairement séparé dont l’URL de relais pointe vers ce relais.
- `gateway.push.apns.relay.timeoutMs` : délai d’expiration d’envoi du Gateway vers le relais, en millisecondes. Valeur par défaut : `10000`.
- Les inscriptions adossées au relais sont déléguées à une identité Gateway spécifique. L’application iOS associée récupère `gateway.identity.get`, inclut cette identité dans l’inscription au relais et transmet au Gateway une autorisation d’envoi limitée à cette inscription. Un autre Gateway ne peut pas réutiliser cette inscription stockée.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : surcharges d’environnement temporaires pour la configuration du relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.handshakeTimeoutMs` : délai d’expiration de la poignée de main WebSocket Gateway avant authentification, en millisecondes. Par défaut : `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` est prioritaire lorsqu’il est défini. Augmentez cette valeur sur les hôtes chargés ou peu puissants où les clients locaux peuvent se connecter pendant que la montée en température du démarrage est encore en cours.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur d’état des canaux, en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état. Par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète, en minutes. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur d’état par canal/compte sur une heure glissante. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation par canal des redémarrages du moniteur d’état tout en conservant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement par compte pour les canaux multicomptes. Lorsqu’il est défini, il est prioritaire sur le remplacement au niveau du canal.
- Les chemins d’appel du Gateway local peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est configuré explicitement via SecretRef et non résolu, la résolution échoue de manière fermée (aucune solution de repli distante ne masque l’échec).
- `trustedProxies` : adresses IP des proxys inverses qui terminent TLS ou injectent des en-têtes de client transféré. Ne listez que les proxys que vous contrôlez. Les entrées loopback restent valides pour les configurations de proxy/détection locale sur le même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback éligibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque la valeur est `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut : `false` pour un comportement d’échec fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation CIDR/IP facultative pour approuver automatiquement le premier appairage d’appareil nœud sans périmètres demandés. Elle est désactivée lorsqu’elle n’est pas définie. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/interface utilisateur de contrôle/WebChat, ni les mises à niveau de rôle, de périmètre, de métadonnées ou de clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : façonnage global d’autorisation/refus pour les commandes de nœud déclarées après l’appairage et l’évaluation de la liste d’autorisation de la plateforme. Utilisez `allowCommands` pour activer des commandes de nœud dangereuses comme `camera.snap`, `camera.clip` et `screen.record` ; `denyCommands` retire une commande même si une valeur par défaut de plateforme ou une autorisation explicite l’inclurait autrement. Après qu’un nœud a modifié sa liste de commandes déclarées, rejetez puis réapprouvez l’appairage de cet appareil afin que le Gateway stocke l’instantané de commandes mis à jour.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour `POST /tools/invoke` HTTP (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut pour
  les appelants owner/admin. Cela ne transforme pas les appelants porteurs d’identité `operator.write`
  en accès owner/admin ; `cron`, `gateway` et `nodes` restent
  indisponibles pour les appelants non-owner même lorsqu’ils sont sur liste d’autorisation.

</Accordion>

### Points de terminaison compatibles avec OpenAI

- RPC HTTP d’administration : désactivé par défaut en tant que Plugin `admin-http-rpc`. Activez le Plugin pour enregistrer `POST /api/v1/admin/rpc`. Voir [RPC HTTP d’administration](/fr/plugins/admin-http-rpc).
- Complétions de chat : désactivées par défaut. Activez avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses : `gateway.http.endpoints.responses.enabled`.
- Durcissement des entrées URL Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération d’URL.
- En-tête facultatif de durcissement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instance

Exécutez plusieurs Gateways sur un seul hôte avec des ports et des répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicateurs pratiques : `--dev` (utilise `~/.openclaw-dev` + le port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

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

- `enabled` : active la terminaison TLS au niveau de l’écouteur du Gateway (HTTPS/WSS) (par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire certificat/clé locale auto-signée lorsque des fichiers explicites ne sont pas configurés ; réservé à une utilisation locale/dev.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez les permissions restreintes.
- `caPath` : chemin facultatif du bundle CA pour la vérification client ou les chaînes de confiance personnalisées.

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

- `mode`: contrôle la manière dont les modifications de configuration sont appliquées à l’exécution.
  - `"off"`: ignore les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"`: redémarre toujours le processus Gateway lors d’un changement de configuration.
  - `"hot"`: applique les changements dans le processus sans redémarrage.
  - `"hybrid"` (par défaut): essaie d’abord le rechargement à chaud ; revient au redémarrage si nécessaire.
- `debounceMs`: fenêtre d’anti-rebond en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs`: durée maximale optionnelle en ms à attendre pour les opérations en cours avant de forcer un redémarrage ou un rechargement à chaud du canal. Omettez-la pour utiliser l’attente bornée par défaut (`300000`) ; définissez `0` pour attendre indéfiniment et consigner périodiquement les avertissements indiquant que des opérations sont toujours en attente.

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
- `hooks.token` doit être distinct de l’authentification active par secret partagé du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) ; le démarrage consigne un avertissement de sécurité non fatal lorsqu’il détecte une réutilisation.
- `openclaw security audit` signale la réutilisation de l’authentification point d’accroche/Gateway comme un constat critique, y compris l’authentification par mot de passe Gateway fournie uniquement au moment de l’audit (`--auth password --password <password>`). Exécutez `openclaw doctor --fix` pour faire tourner un `hooks.token` réutilisé et persistant, puis mettez à jour les expéditeurs externes de points d’accroche pour utiliser le nouveau jeton de point d’accroche.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié comme `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, contraignez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mapping ou un préréglage utilise un `sessionKey` basé sur un modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés de mapping statiques ne nécessitent pas cette option explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - Le `sessionKey` provenant de la charge utile de requête n’est accepté que lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de mapping rendues depuis un modèle sont traitées comme fournies de l’extérieur et nécessitent également `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mapping">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de point d’accroche.
  - `transform.module` doit être un chemin relatif et rester dans `hooks.transformsDir` (les chemins absolus et la traversée sont rejetés).
  - Gardez `hooks.transformsDir` sous `~/.openclaw/hooks/transforms` ; les répertoires de Skills de l’espace de travail sont rejetés. Si `openclaw doctor` signale ce chemin comme invalide, déplacez le module de transformation dans le répertoire de transformations des points d’accroche ou supprimez `hooks.transformsDir`.
- `agentId` route vers un agent spécifique ; les ID inconnus reviennent à l’agent par défaut.
- `allowedAgentIds`: restreint le routage effectif des agents, y compris le chemin de l’agent par défaut lorsque `agentId` est omis (`*` ou omis = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey`: clé de session fixe optionnelle pour les exécutions d’agent par point d’accroche sans `sessionKey` explicite.
- `allowRequestSessionKey`: autorise les appelants de `/hooks/agent` et les clés de session de mapping pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes`: liste d’autorisation optionnelle de préfixes pour les valeurs `sessionKey` explicites (requête + mapping), par ex. `["hook:"]`. Elle devient obligatoire lorsqu’un mapping ou un préréglage utilise un `sessionKey` basé sur un modèle.
- `deliver: true` envoie la réponse finale vers un canal ; `channel` vaut `last` par défaut.
- `model` remplace le LLM pour cette exécution de point d’accroche (doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le préréglage Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et contraignez `hooks.allowedSessionKeyPrefixes` pour correspondre à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le préréglage par un `sessionKey` statique au lieu du modèle par défaut.

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

- Sert du HTML/CSS/JS modifiable par l’agent et A2UI via HTTP sous le port du Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (par défaut).
- Liaisons non loopback : les routes canvas nécessitent l’authentification Gateway (jeton/mot de passe/proxy approuvé), comme les autres surfaces HTTP du Gateway.
- Les WebViews Node n’envoient généralement pas d’en-têtes d’authentification ; après l’appairage et la connexion d’un Node, le Gateway annonce des URL de capacité propres au Node pour l’accès canvas/A2UI.
- Les URL de capacité sont liées à la session WS du Node actif et expirent rapidement. Le repli basé sur l’IP n’est pas utilisé.
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

- `minimal` (par défaut lorsque le Plugin `bonjour` groupé est activé) : omet `cliPath` + `sshPort` des enregistrements TXT.
- `full`: inclut `cliPath` + `sshPort` ; l’annonce multicast LAN nécessite toujours que le Plugin `bonjour` groupé soit activé.
- `off`: supprime l’annonce multicast LAN sans modifier l’activation du Plugin.
- Le Plugin `bonjour` groupé démarre automatiquement sur les hôtes macOS et est optionnel sur Linux, Windows et les déploiements Gateway conteneurisés.
- Le nom d’hôte utilise par défaut le nom d’hôte système lorsqu’il s’agit d’un libellé DNS valide, avec repli sur `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

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

- Les variables d’environnement inline ne sont appliquées que si la variable d’environnement du processus ne contient pas la clé.
- Fichiers `.env` : `.env` du CWD + `~/.openclaw/.env` (aucun des deux ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis votre profil de shell de connexion.
- Consultez [Environnement](/fr/help/environment) pour la préséance complète.

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
- Les variables manquantes/vides déclenchent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour obtenir un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secrets sont additives : les valeurs en texte brut fonctionnent toujours.

### `SecretRef`

Utilisez une seule forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- Motif de `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- Motif d’id `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- Motif d’id `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (prend en charge les sélecteurs de style AWS `secret#json_key`)
- Les ids `source: "exec"` ne doivent pas contenir de segments de chemin délimités par des barres obliques `.` ou `..` (par exemple `a/../b` est rejeté)

### Surface d’identifiants prise en charge

- Matrice canonique : [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins d’identifiants `openclaw.json` pris en charge.
- Les références `auth-profiles.json` sont incluses dans la résolution à l’exécution et la couverture d’audit.

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
- Les chemins des fournisseurs file et exec échouent de manière fermée lorsque la vérification ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour les chemins de confiance qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` exige un chemin absolu pour `command` et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande qui sont des liens symboliques sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins de liens symboliques tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification du répertoire de confiance s’applique au chemin cible résolu.
- L’environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secrets sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage des surfaces actives s’applique pendant l’activation : les références non résolues sur les surfaces activées font échouer le démarrage/rechargement, tandis que les surfaces inactives sont ignorées avec des diagnostics.

---

## Stockage d’authentification

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
- Les anciens mappages plats `auth-profiles.json`, comme `{ "provider": { "apiKey": "..." } }`, ne sont pas un format d’exécution ; `openclaw doctor --fix` les réécrit en profils de clé API canoniques `provider:default` avec une sauvegarde `.legacy-flat.*.bak`.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification adossés à SecretRef.
- Les identifiants d’exécution statiques proviennent d’instantanés résolus en mémoire ; les anciennes entrées statiques `auth.json` sont nettoyées lorsqu’elles sont détectées.
- Les anciens OAuth sont importés depuis `~/.openclaw/credentials/oauth.json`.
- Consultez [OAuth](/fr/concepts/oauth).
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

- `billingBackoffHours` : délai d’attente de base, en heures, lorsqu’un profil échoue à cause de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Un texte de facturation explicite peut quand même arriver ici, même sur des réponses `401`/`403`, mais les correspondances de texte propres aux fournisseurs restent limitées au fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Les messages HTTP `402` réessayables de fenêtre d’utilisation ou de limite de dépenses d’organisation/espace de travail restent plutôt dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur pour les heures de délai d’attente de facturation.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du délai d’attente de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : délai d’attente de base, en minutes, pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du délai d’attente `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de délai d’attente (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profils d’authentification du même fournisseur pour les erreurs de surcharge avant de basculer vers le modèle de secours (par défaut : `1`). Les formes de fournisseur occupé comme `ModelNotReadyException` arrivent ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profils d’authentification du même fournisseur pour les erreurs de limite de débit avant de basculer vers le modèle de secours (par défaut : `1`). Ce compartiment de limite de débit inclut les textes propres aux fournisseurs comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

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
- `consoleLevel` passe à `debug` avec `--verbose`.
- `maxFileBytes` : taille maximale du fichier journal actif en octets avant rotation (entier positif ; par défaut : `104857600` = 100 Mo). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif.
- `redactSensitive` / `redactPatterns` : masquage au mieux pour la sortie console, les journaux de fichiers, les enregistrements de journaux OTLP et le texte de transcription de session persisté. `redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcriptions ; les surfaces de sécurité de l’interface, des outils et des diagnostics masquent toujours les secrets avant émission.

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
- `stuckSessionWarnMs` : seuil d’âge sans progression, en ms, pour classer les sessions de traitement longues comme `session.long_running`, `session.stalled` ou `session.stuck`. Les réponses, outils, statuts, blocs et la progression ACP réinitialisent le minuteur ; les diagnostics `session.stuck` répétés appliquent un délai d’attente tant qu’ils sont inchangés.
- `stuckSessionAbortMs` : seuil d’âge sans progression, en ms, avant qu’un travail actif bloqué admissible puisse être interrompu et drainé pour récupération. S’il n’est pas défini, OpenClaw utilise la fenêtre d’exécution intégrée étendue plus sûre d’au moins 5 minutes et 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot` : capture un instantané de stabilité expurgé avant OOM lorsque la pression mémoire atteint `critical` (par défaut : `false`). Définissez sur `true` pour ajouter l’analyse/écriture du fichier de paquet de stabilité tout en conservant les événements normaux de pression mémoire.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (par défaut : `false`). Pour la configuration complète, le catalogue de signaux et le modèle de confidentialité, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : points de terminaison OTLP facultatifs propres aux signaux. Lorsqu’ils sont définis, ils remplacent `otel.endpoint` uniquement pour ce signal.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom du service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : active l’export de traces, métriques ou journaux.
- `otel.logsExporter` : destination d’export des journaux : `"otlp"` (par défaut), `"stdout"` pour un objet JSON par ligne stdout, ou `"both"`.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`-`1`.
- `otel.flushIntervalMs` : intervalle de vidage périodique de la télémétrie, en ms.
- `otel.captureContent` : capture facultative du contenu brut pour les attributs d’étendue OTEL. Désactivé par défaut. Le booléen `true` capture le contenu non système des messages/outils ; la forme objet permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` et `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : interrupteur d’environnement pour la dernière forme expérimentale d’étendue d’inférence GenAI, y compris les noms d’étendue `{gen_ai.operation.name} {gen_ai.request.model}`, le type d’étendue `CLIENT` et `gen_ai.provider.name` au lieu de l’ancien `gen_ai.system`. Par défaut, les étendues conservent `openclaw.model.call` et `gen_ai.system` pour la compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : interrupteur d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK appartenant au Plugin tout en gardant les écouteurs de diagnostic actifs.
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
- `auto.enabled` : active la mise à jour automatique en arrière-plan pour les installations de paquets (par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant l’application automatique sur le canal stable (par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire de répartition du déploiement sur le canal stable, en heures (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence d’exécution des vérifications du canal bêta, en heures (par défaut : `1` ; max : `24`).

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

- `enabled` : garde-fou global de la fonctionnalité ACP (par défaut : `true` ; définissez `false` pour masquer la distribution ACP et les affordances de lancement).
- `dispatch.enabled` : garde-fou indépendant pour la distribution des tours de session ACP (par défaut : `true`). Définissez `false` pour garder les commandes ACP disponibles tout en bloquant l’exécution.
- `backend` : identifiant du backend d’exécution ACP par défaut (doit correspondre à un Plugin d’exécution ACP enregistré).
  Installez d’abord le Plugin backend, et si `plugins.allow` est défini, incluez l’identifiant du Plugin backend (par exemple `acpx`) ou le backend ACP ne se chargera pas.
- `defaultAgent` : identifiant d’agent ACP cible de secours lorsque les lancements ne spécifient pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agents permis pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage en cas d’inactivité, en ms, pour le texte diffusé.
- `stream.maxChunkChars` : taille maximale de fragment avant découpage de la projection de bloc diffusé.
- `stream.repeatSuppression` : supprime les lignes de statut/outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse progressivement ; `"final_only"` met en mémoire tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après les événements d’outil masqués (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes de statut/mise à jour ACP projetées.
- `stream.tagVisibility` : enregistrement des noms de balises vers des remplacements booléens de visibilité pour les événements diffusés.
- `runtime.ttlMinutes` : TTL d’inactivité, en minutes, pour les travailleurs de session ACP avant nettoyage admissible.
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
  - `"random"` (par défaut) : slogans humoristiques/saisonniers en rotation.
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
  },
}
```

---

## Identité

Consultez les champs d’identité `agents.list` sous [Valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Pont (hérité, supprimé)

Les versions actuelles n’incluent plus le pont TCP. Les nœuds se connectent via le WebSocket du Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu’elles ne sont pas supprimées ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration héritée du pont (référence historique)">

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

- `sessionRetention` : durée de conservation des sessions d’exécution cron isolées terminées avant leur suppression de `sessions.json`. Contrôle également le nettoyage des transcriptions cron supprimées archivées. Par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : accepté pour compatibilité avec les anciens journaux d’exécution cron basés sur des fichiers. Par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes de l’historique d’exécution SQLite conservées par tâche. Par défaut : `2000`.
- `webhookToken` : jeton porteur utilisé pour la livraison POST du Webhook Cron (`delivery.mode = "webhook"`). S’il est omis, aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL Webhook de repli héritée et obsolète (http/https) utilisée par `openclaw doctor --fix` pour migrer les tâches stockées qui ont encore `notify: true` ; la livraison à l’exécution utilise `delivery.mode="webhook"` par tâche avec `delivery.to`, ou `delivery.completionDestination` lors de la préservation de la livraison d’annonce.

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

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches cron lors d’erreurs transitoires (par défaut : `3` ; plage : `0`-`10`).
- `backoffMs` : tableau des délais d’attente en ms pour chaque nouvelle tentative (par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d’erreurs qui déclenchent des nouvelles tentatives - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

Les tâches ponctuelles restent activées jusqu’à épuisement des tentatives, puis sont désactivées tout en conservant l’état d’erreur final. Les tâches récurrentes utilisent la même politique de nouvelle tentative transitoire pour s’exécuter à nouveau après l’attente avant leur prochain créneau planifié ; les erreurs permanentes ou l’épuisement des nouvelles tentatives transitoires reviennent au planning récurrent normal avec attente après erreur.

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

- `enabled` : active les alertes d’échec pour les tâches cron (par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant le déclenchement d’une alerte (entier positif, min. : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre alertes répétées pour la même tâche (entier non négatif).
- `includeSkipped` : compte les exécutions ignorées consécutives dans le seuil d’alerte (par défaut : `false`). Les exécutions ignorées sont suivies séparément et n’affectent pas l’attente après erreur d’exécution.
- `mode` : mode de livraison - `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : compte ou identifiant de canal facultatif pour limiter la livraison de l’alerte.

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

- Destination par défaut pour les notifications d’échec cron sur toutes les tâches.
- `mode` : `"announce"` ou `"webhook"` ; utilise `"announce"` par défaut lorsque les données de cible sont suffisantes.
- `channel` : remplacement du canal pour la livraison d’annonce. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible d’annonce explicite ou URL Webhook. Requis pour le mode Webhook.
- `accountId` : remplacement facultatif du compte pour la livraison.
- Le paramètre `delivery.failureDestination` par tâche remplace cette valeur globale par défaut.
- Lorsqu’aucune destination d’échec globale ni par tâche n’est définie, les tâches qui livrent déjà via `announce` se rabattent sur cette cible d’annonce principale en cas d’échec.
- `delivery.failureDestination` est pris en charge uniquement pour les tâches `sessionTarget="isolated"`, sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions cron isolées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle multimédia

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans enveloppes d’historique/expéditeur) |
| `{{BodyStripped}}` | Corps avec les mentions de groupe supprimées      |
| `{{From}}`         | Identifiant de l’expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | Identifiant du message de canal                   |
| `{{SessionId}}`    | UUID de la session actuelle                       |
| `{{IsNewSession}}` | `"true"` lorsqu’une nouvelle session est créée    |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite multimédia résolue pour les entrées CLI    |
| `{{MaxChars}}`     | Nombre maximal de caractères de sortie résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (dans la mesure du possible)      |
| `{{GroupMembers}}` | Aperçu des membres du groupe (dans la mesure du possible) |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (dans la mesure du possible) |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (dans la mesure du possible) |
| `{{Provider}}`     | Indication de fournisseur (whatsapp, telegram, discord, etc.) |

---

## Inclusions de configuration (`$include`)

Diviser la configuration en plusieurs fichiers :

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

- Fichier unique : remplace l’objet contenant.
- Tableau de fichiers : fusion profonde dans l’ordre (les valeurs ultérieures remplacent les précédentes).
- Clés sœurs : fusionnées après les inclusions (remplacent les valeurs incluses).
- Inclusions imbriquées : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus par rapport au fichier qui inclut, mais doivent rester dans le répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues/`../` sont autorisées uniquement lorsqu’elles se résolvent encore dans cette limite. Les chemins ne doivent pas contenir d’octets nuls et doivent être strictement inférieurs à 4096 caractères avant et après résolution.
- Les écritures détenues par OpenClaw qui ne modifient qu’une seule section de niveau supérieur appuyée par une inclusion à fichier unique écrivent dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les inclusions racine, les tableaux d’inclusions et les inclusions avec remplacements par clés sœurs sont en lecture seule pour les écritures détenues par OpenClaw ; ces écritures échouent de manière fermée au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse, les inclusions circulaires, le format de chemin invalide et la longueur excessive.

---

_Connexe : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Connexe

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
