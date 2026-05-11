---
read_when:
    - Vous avez besoin de la sémantique exacte de la configuration au niveau des champs ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration du Gateway pour les clés principales d’OpenClaw, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-05-11T20:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Référence de configuration principale pour `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâche, consultez [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d’OpenClaw et renvoie vers d’autres pages lorsqu’un sous-système dispose de sa propre référence détaillée. Les catalogues de commandes appartenant aux canaux et aux plugins, ainsi que les réglages avancés de mémoire/QMD, se trouvent sur leurs propres pages plutôt que sur celle-ci.

Source de vérité du code :

- `openclaw config schema` affiche le schéma JSON actif utilisé pour la validation et Control UI, avec les métadonnées intégrées/plugin/canal fusionnées lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma limité à un chemin pour les outils d’exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hachage de référence de la documentation de configuration par rapport à la surface de schéma actuelle

Chemin de recherche de l’agent : utilisez l’action d’outil `gateway` `config.schema.lookup` pour obtenir
la documentation et les contraintes exactes au niveau des champs avant toute modification. Utilisez
[Configuration](/fr/gateway/configuration) pour les conseils orientés tâche et cette page
pour la carte plus large des champs, les valeurs par défaut et les liens vers les références des sous-systèmes.

Références détaillées dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées et groupées
- les pages propriétaires des canaux/plugins pour les surfaces de commandes spécifiques aux canaux

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs - OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée - consultez
[Configuration - canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres
canaux groupés (authentification, contrôle d’accès, comptes multiples, filtrage des mentions).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée - consultez
[Configuration - agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, raisonnement, Heartbeat, mémoire, médias, Skills, bac à sable)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie de session, Compaction, élagage)
- `messages.*` (livraison des messages, TTS, rendu markdown)
- `talk.*` (mode Talk)
  - `talk.consultThinkingLevel` : remplacement du niveau de raisonnement pour l’exécution complète de l’agent OpenClaw derrière les consultations en temps réel de Control UI Talk
  - `talk.consultFastMode` : remplacement ponctuel du mode rapide pour les consultations en temps réel de Control UI Talk
  - `talk.speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur iOS/macOS
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)

## Outils et fournisseurs personnalisés

La politique d’outils, les bascules expérimentales, la configuration d’outils adossés aux fournisseurs et la
configuration des fournisseurs personnalisés / URL de base ont été déplacées vers une page dédiée - consultez
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Modèles

Les définitions de fournisseurs, les listes d’autorisation de modèles et la configuration des fournisseurs personnalisés se trouvent dans
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
  la `command` absolue si nécessaire, attend que le service soit prêt, puis envoie la requête de modèle.
  Consultez [Services de modèles locaux](/fr/gateway/local-model-services).
- `models.pricing.enabled` : contrôle l’amorçage de tarification en arrière-plan qui
  démarre après que les sidecars et les canaux atteignent le chemin prêt du Gateway. Lorsque la valeur est `false`,
  le Gateway ignore les récupérations de catalogues de prix OpenRouter et LiteLLM ; les valeurs
  `models.providers.*.models[].cost` configurées continuent de fonctionner pour les estimations de coûts locales.

## MCP

Les définitions de serveurs MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
consommées par Pi intégré et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au serveur
cible pendant les modifications de configuration.

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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers` : définitions de serveurs MCP stdio ou distants nommés pour les environnements d’exécution qui
  exposent les outils MCP configurés.
  Les entrées distantes utilisent `transport: "streamable-http"` ou `transport: "sse"` ;
  `type: "http"` est un alias natif CLI que `openclaw mcp set` et
  `openclaw doctor --fix` normalisent dans le champ canonique `transport`.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les environnements d’exécution MCP groupés à portée de session.
  Les exécutions intégrées ponctuelles demandent un nettoyage en fin d’exécution ; ce TTL est le filet de sécurité pour
  les sessions longues et les futurs appelants.
- Les changements sous `mcp.*` s’appliquent à chaud en supprimant les environnements d’exécution MCP de session mis en cache.
  La prochaine découverte/utilisation d’outil les recrée depuis la nouvelle configuration, donc les entrées
  `mcp.servers` supprimées sont récoltées immédiatement au lieu d’attendre le TTL d’inactivité.

Consultez [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement d’exécution.

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

- `allowBundled` : liste d’autorisation facultative pour les Skills groupées uniquement (les Skills gérées/de l’espace de travail ne sont pas affectées).
- `load.extraDirs` : racines de Skills partagées supplémentaires (priorité la plus basse).
- `load.allowSymlinkTargets` : racines cibles réelles approuvées vers lesquelles les liens symboliques de Skills peuvent
  pointer lorsque le lien se trouve hors de sa racine source configurée.
- `install.preferBrew` : lorsque la valeur est true, préfère les installateurs Homebrew quand `brew` est
  disponible avant de revenir aux autres types d’installateurs.
- `install.nodeManager` : préférence d’installateur Node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives` : autorise les clients Gateway `operator.admin` approuvés
  à installer des archives zip privées préparées via `skills.upload.*`
  (valeur par défaut : false). Cela active uniquement le chemin des archives téléversées ; les installations ClawHub
  normales ne l’exigent pas.
- `entries.<skillKey>.enabled: false` désactive une Skill même si elle est groupée/installée.
- `entries.<skillKey>.apiKey` : commodité pour les Skills déclarant une variable d’environnement principale (chaîne en clair ou objet SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Chargé depuis `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- La découverte accepte les plugins OpenClaw natifs ainsi que les bundles Codex compatibles et les bundles Claude, y compris les bundles Claude sans manifeste avec disposition par défaut.
- **Les changements de configuration nécessitent un redémarrage du Gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins listés se chargent). `deny` l’emporte.
- `bundledDiscovery` : vaut par défaut `"allowlist"` pour les nouvelles configurations, de sorte qu’un
  `plugins.allow` non vide limite également les plugins fournisseurs groupés, y compris les fournisseurs d’exécution
  de recherche web. Doctor écrit `"compat"` pour les configurations de listes d’autorisation héritées migrées
  afin de préserver le comportement existant des fournisseurs groupés jusqu’à votre adhésion explicite.
- `plugins.entries.<id>.apiKey` : champ de commodité pour clé API au niveau du plugin (lorsqu’il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : carte de variables d’environnement limitée au plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque la valeur est `false`, le cœur bloque `before_prompt_build` et ignore les champs modifiant le prompt issus de l’ancien `before_agent_start`, tout en préservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugins natifs et aux répertoires de hooks fournis par des bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque la valeur est `true`, les plugins non groupés approuvés peuvent lire le contenu brut des conversations depuis des hooks typés tels que `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : fait explicitement confiance à ce plugin pour demander des remplacements `provider` et `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements de sous-agents approuvés. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowModelOverride` : fait explicitement confiance à ce plugin pour demander des remplacements de modèle pour `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements de complétion LLM par plugin approuvés. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.llm.allowAgentIdOverride` : fait explicitement confiance à ce plugin pour exécuter `api.runtime.llm.complete` avec un identifiant d’agent non défini par défaut.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma de plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte/d’exécution des plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du plugin propriétaire, et non par un registre central d’options OpenClaw.

### Configuration du plugin de harnais Codex

Le plugin `codex` groupé possède les paramètres natifs du harnais de serveur d’application Codex sous
`plugins.entries.codex.config`. Consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference) pour la surface de configuration complète
et [Harnais Codex](/fr/plugins/codex-harness) pour le modèle d’exécution.

`codexPlugins` s’applique uniquement aux sessions qui sélectionnent le harnais Codex natif.
Il n’active pas les plugins Codex pour Pi, les exécutions normales du fournisseur OpenAI, les liaisons de conversation
ACP ni tout harnais non-Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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
  plugins/applications Codex pour le harnais Codex. Par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions` :
  politique par défaut des actions destructrices pour les sollicitations d’applications Plugin migrées.
  Par défaut : `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled` : active une
  entrée Plugin migrée lorsque `codexPlugins.enabled` global vaut aussi true.
  Par défaut : `true` pour les entrées explicites.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName` :
  identité stable de la place de marché. La V1 prend uniquement en charge `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName` : identité stable
  du Plugin Codex issue de la migration, par exemple `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions` :
  remplacement de la politique d’actions destructrices par Plugin. En cas d’omission, la valeur globale
  `allow_destructive_actions` est utilisée.

`codexPlugins.enabled` est la directive d’activation globale. Les entrées Plugin explicites
écrites par la migration constituent l’ensemble durable d’installation et d’éligibilité à la réparation.
`plugins["*"]` n’est pas pris en charge, il n’existe pas de commutateur `install`, et les valeurs locales
`marketplacePath` ne sont intentionnellement pas des champs de configuration, car elles sont
spécifiques à l’hôte.

Les vérifications de disponibilité `app/list` sont mises en cache pendant une heure et actualisées
de façon asynchrone lorsqu’elles sont obsolètes. La configuration d’application des fils Codex est calculée lors de l’établissement
de la session du harnais Codex, pas à chaque tour ; utilisez `/new`, `/reset` ou un redémarrage du gateway
après modification de la configuration native des plugins.

- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur web-fetch Firecrawl.
  - `apiKey` : clé API Firecrawl (accepte SecretRef). Se rabat sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancien `tools.web.fetch.firecrawl.apiKey` ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev` ; les remplacements auto-hébergés doivent cibler des points de terminaison privés/internes).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres de xAI X Search (recherche web Grok).
  - `enabled` : active le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de dreaming de la mémoire. Consultez [Dreaming](/fr/concepts/dreaming) pour les phases et les seuils.
  - `enabled` : commutateur principal du dreaming (par défaut `false`).
  - `frequency` : cadence Cron pour chaque balayage complet du dreaming (`"0 3 * * *"` par défaut).
  - `model` : remplacement facultatif du modèle de sous-agent Dream Diary. Nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true` ; associez-le à `allowedModels` pour restreindre les cibles. Les erreurs d’indisponibilité du modèle sont retentées une fois avec le modèle par défaut de la session ; les échecs de confiance ou de liste d’autorisation ne se rabattent pas silencieusement.
  - La politique et les seuils de phase sont des détails d’implémentation (pas des clés de configuration destinées à l’utilisateur).
- La configuration complète de la mémoire se trouve dans [Référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les plugins du bundle Claude activés peuvent aussi fournir des valeurs par défaut Pi intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, pas comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisir l’id du Plugin de mémoire actif, ou `"none"` pour désactiver les plugins de mémoire.
- `plugins.slots.contextEngine` : choisir l’id du Plugin de moteur de contexte actif ; vaut `"legacy"` par défaut, sauf si vous installez et sélectionnez un autre moteur.

Voir [Plugins](/fr/tools/plugin).

---

## Engagements

`commitments` contrôle la mémoire de suivi inférée : OpenClaw peut détecter les points de suivi dans les tours de conversation et les transmettre via des exécutions Heartbeat.

- `commitments.enabled` : active l’extraction LLM masquée, le stockage et la transmission par Heartbeat des engagements de suivi inférés. Par défaut : `false`.
- `commitments.maxPerDay` : nombre maximal d’engagements de suivi inférés transmis par session d’agent sur une journée glissante. Par défaut : `3`.

Voir [Engagements inférés](/fr/concepts/commitments).

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
  session dépasse sa limite. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuels.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, donc la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur le réseau privé.
- En mode strict, les points de terminaison de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage du réseau privé lors des vérifications d’accessibilité/découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour les exceptions explicites.
- Les profils distants sont en attachement seul (démarrage/arrêt/réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent à l’accessibilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglets. Les profils local loopback gérés
  conservent les valeurs par défaut CDP locales.
- Si un service CDP géré extérieurement est accessible via loopback, définissez
  `attachOnly: true` pour ce profil ; sinon OpenClaw traite le port loopback comme un
  profil de navigateur géré localement et peut signaler des erreurs de propriété du port local.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent se connecter sur
  l’hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil de navigateur
  spécifique basé sur Chromium, comme Brave ou Edge.
- Les profils `existing-session` conservent les limites actuelles de routage Chrome MCP :
  actions pilotées par snapshot/référence au lieu du ciblage par sélecteur CSS, hooks de téléversement
  d’un seul fichier, aucun remplacement de délai d’expiration de boîte de dialogue, pas de `wait --load networkidle`, et pas
  de `responsebody`, d’export PDF, d’interception de téléchargement ni d’actions par lot.
- Les profils `openclaw` gérés localement attribuent automatiquement `cdpPort` et `cdpUrl` ; définissez
  `cdpUrl` explicitement uniquement pour CDP distant.
- Les profils gérés localement peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global de ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils gérés localement utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP CDP de Chrome
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour la disponibilité websocket CDP
  après lancement. Augmentez-les sur les hôtes plus lents où Chrome
  démarre correctement mais où les vérifications de disponibilité entrent en concurrence avec le démarrage. Les deux valeurs doivent être
  des entiers positifs jusqu’à `120000` ms ; les valeurs de configuration invalides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour le répertoire personnel de votre OS avant le lancement de Chromium.
  Le `userDataDir` par profil sur les profils `existing-session` bénéficie aussi de l’expansion du tilde.
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

- `seamColor` : couleur d’accent pour le chrome de l’UI de l’application native (teinte de bulle Talk Mode, etc.).
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
      url: "ws://gateway.tailnet:18789",
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
      // Remove tools from the default HTTP deny list
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

- `mode` : `local` (exécute le Gateway) ou `remote` (se connecte au Gateway distant). Le Gateway refuse de démarrer sauf si la valeur est `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement), ou `custom`.
- **Alias bind hérités** : utilisez les valeurs de mode bind dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), pas les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Note Docker** : le bind `loopback` par défaut écoute sur `127.0.0.1` à l’intérieur du conteneur. Avec la mise en réseau en pont Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, le Gateway est donc inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les binds hors loopback nécessitent l’authentification du Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’onboarding génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (SecretRefs inclus), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour les configurations locales local loopback de confiance ; ce mode n’est volontairement pas proposé par les invites d’onboarding.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification navigateur/utilisateur à un proxy inverse tenant compte de l’identité et fait confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)). Ce mode attend par défaut une source de proxy **hors loopback** ; les proxys inverses loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicite. Les appelants internes sur le même hôte peuvent utiliser `gateway.auth.password` comme repli direct local ; `gateway.auth.token` reste mutuellement exclusif avec le mode trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque la valeur est `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de l’interface utilisateur de contrôle/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison de l’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent plutôt le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est fiable. La valeur par défaut est `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur optionnel des échecs d’authentification. S’applique par IP client et par portée d’authentification (secret partagé et jeton d’appareil sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone de l’interface utilisateur de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives incorrectes concurrentes depuis le même client peuvent donc déclencher le limiteur dès la deuxième requête au lieu de passer toutes deux comme de simples incompatibilités.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous voulez intentionnellement limiter aussi le trafic localhost (pour des configurations de test ou des déploiements de proxy stricts).
- Les tentatives d’authentification WS d’origine navigateur sont toujours limitées, avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost depuis un navigateur).
- Sur loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne verrouillent pas automatiquement
  une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, bind loopback) ou `funnel` (public, nécessite une authentification).
- `tailscale.preserveFunnel` : lorsque la valeur est `true` et que `tailscale.mode = "serve"`, OpenClaw
  vérifie `tailscale funnel status` avant de réappliquer Serve au démarrage et l’ignore
  si une route Funnel configurée extérieurement couvre déjà le port du Gateway.
  Valeur par défaut : `false`.
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines navigateur pour les connexions WebSocket au Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines hors loopback.
- `controlUi.chatMessageMaxWidth` : largeur maximale optionnelle pour les messages de chat groupés de l’interface utilisateur de contrôle. Accepte des valeurs de largeur CSS contraintes comme `960px`, `82%`, `min(1280px, 82%)` et `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active le repli d’origine par en-tête Host pour les déploiements qui s’appuient intentionnellement sur une stratégie d’origine basée sur l’en-tête Host.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : dérogation d’urgence côté client par environnement de processus
  qui autorise `ws://` en clair vers des IP de réseau privé
  de confiance ; la valeur par défaut reste limitée à loopback pour le texte clair. Il n’existe pas d’équivalent
  `openclaw.json`, et la configuration de réseau privé du navigateur telle que
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` n’affecte pas les clients WebSocket
  du Gateway.
- `gateway.remote.token` / `.password` sont des champs d’identifiants de client distant. Ils ne configurent pas à eux seuls l’authentification du Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé par les builds iOS officielles/TestFlight après publication de leurs enregistrements adossés au relais vers le Gateway. Cette URL doit correspondre à l’URL du relais compilée dans la build iOS.
- `gateway.push.apns.relay.timeoutMs` : délai d’envoi Gateway-vers-relais en millisecondes. Valeur par défaut : `10000`.
- Les enregistrements adossés au relais sont délégués à une identité de Gateway spécifique. L’application iOS appairée récupère `gateway.identity.get`, inclut cette identité dans l’enregistrement du relais et transmet au Gateway une autorisation d’envoi à portée d’enregistrement. Un autre Gateway ne peut pas réutiliser cet enregistrement stocké.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : remplacements d’environnement temporaires pour la configuration du relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire de développement uniquement pour les URL de relais HTTP loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.handshakeTimeoutMs` : délai d’expiration de la poignée de main WebSocket pré-authentification du Gateway en millisecondes. Valeur par défaut : `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` a priorité lorsqu’il est défini. Augmentez cette valeur sur les hôtes chargés ou peu puissants où les clients locaux peuvent se connecter alors que la phase de préchauffage du démarrage est encore en cours de stabilisation.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur d’état des canaux en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état. Valeur par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète en minutes. Conservez-le supérieur ou égal à `gateway.channelHealthCheckMinutes`. Valeur par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur d’état par canal/compte sur une heure glissante. Valeur par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation par canal des redémarrages du moniteur d’état tout en gardant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement par compte pour les canaux multicomptes. Lorsqu’il est défini, il a priorité sur le remplacement au niveau du canal.
- Les chemins d’appel de Gateway local peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun masquage par repli distant).
- `trustedProxies` : IP des proxys inverses qui terminent TLS ou injectent des en-têtes de client transféré. N’indiquez que les proxys que vous contrôlez. Les entrées loopback restent valides pour les configurations de proxy/détection locale sur le même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback éligibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque la valeur est `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut `false` pour un comportement en échec fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation CIDR/IP optionnelle pour approuver automatiquement le premier appairage d’appareil de nœud sans portées demandées. Elle est désactivée lorsqu’elle n’est pas définie. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/interface utilisateur de contrôle/WebChat, et n’approuve pas automatiquement les mises à niveau de rôle, portée, métadonnées ou clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : façonnage global autoriser/refuser pour les commandes de nœud déclarées après l’appairage et l’évaluation de la liste d’autorisation de plateforme. Utilisez `allowCommands` pour accepter des commandes de nœud dangereuses comme `camera.snap`, `camera.clip` et `screen.record` ; `denyCommands` retire une commande même si une valeur par défaut de plateforme ou une autorisation explicite l’inclurait autrement. Après qu’un nœud a modifié sa liste de commandes déclarées, rejetez puis réapprouvez l’appairage de cet appareil afin que le Gateway stocke l’instantané de commandes mis à jour.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour HTTP `POST /tools/invoke` (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut.

</Accordion>

### Points de terminaison compatibles OpenAI

- Chat Completions : désactivé par défaut. Activez avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API : `gateway.http.endpoints.responses.enabled`.
- Durcissement des entrées URL Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération d’URL.
- En-tête optionnel de durcissement de la réponse :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instance

Exécutez plusieurs Gateways sur un seul hôte avec des ports et répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicateurs pratiques : `--dev` (utilise `~/.openclaw-dev` + port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

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
- `autoGenerate` : génère automatiquement une paire certificat/clé locale auto-signée lorsque des fichiers explicites ne sont pas configurés ; pour une utilisation locale/dev uniquement.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez les permissions restreintes.
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

- `mode` : contrôle la manière dont les modifications de configuration sont appliquées à l’exécution.
  - `"off"` : ignore les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : redémarre toujours le processus du Gateway lors d’un changement de configuration.
  - `"hot"` : applique les changements dans le processus, sans redémarrage.
  - `"hybrid"` (par défaut) : tente d’abord le rechargement à chaud ; bascule vers un redémarrage si nécessaire.
- `debounceMs` : fenêtre de debounce en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs` : temps maximal optionnel en ms à attendre pour les opérations en cours avant de forcer un redémarrage ou un rechargement à chaud de canal. Omettez-le pour utiliser l’attente bornée par défaut (`300000`) ; définissez `0` pour attendre indéfiniment et journaliser périodiquement des avertissements indiquant que des opérations sont toujours en attente.

---

## Hooks

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
Les jetons de point d'accroche dans la chaîne de requête sont rejetés.

Notes de validation et de sécurité :

- `hooks.enabled=true` nécessite un `hooks.token` non vide.
- `hooks.token` doit être **distinct** de `gateway.auth.token` ; la réutilisation du jeton du Gateway est rejetée.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié comme `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mappage ou un préréglage utilise une `sessionKey` avec modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés de mappage statiques ne nécessitent pas cette activation explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - La `sessionKey` issue de la charge utile de la requête n'est acceptée que lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs de `sessionKey` de mappage rendues depuis un modèle sont traitées comme fournies de l'extérieur et nécessitent aussi `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mappage">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de point d'accroche.
  - `transform.module` doit être un chemin relatif et reste dans `hooks.transformsDir` (les chemins absolus et les traversées sont rejetés).
  - Gardez `hooks.transformsDir` sous `~/.openclaw/hooks/transforms` ; les répertoires de Skills de l'espace de travail sont rejetés. Si `openclaw doctor` signale ce chemin comme invalide, déplacez le module de transformation dans le répertoire des transformations de hooks ou supprimez `hooks.transformsDir`.
- `agentId` achemine vers un agent spécifique ; les ID inconnus reviennent à la valeur par défaut.
- `allowedAgentIds` : limite le routage explicite (`*` ou omis = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d'agent de point d'accroche sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de mappage pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d'autorisation facultative de préfixes pour les valeurs explicites de `sessionKey` (requête + mappage), par ex. `["hook:"]`. Elle devient obligatoire quand un mappage ou un préréglage utilise une `sessionKey` avec modèle.
- `deliver: true` envoie la réponse finale à un canal ; `channel` vaut par défaut `last`.
- `model` remplace le LLM pour cette exécution de point d'accroche (doit être autorisé si un catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le préréglage Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` pour correspondre à l'espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le préréglage par une `sessionKey` statique au lieu de la valeur par défaut avec modèle.

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

- Gateway lance automatiquement `gog gmail watch serve` au démarrage quand il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N'exécutez pas un `gog gmail watch serve` séparé parallèlement au Gateway.

---

## Hôte de Plugin Canvas

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

- Sert du HTML/CSS/JS modifiable par l'agent et A2UI via HTTP sous le port du Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (par défaut).
- Liaisons non loopback : les routes canvas nécessitent l'authentification Gateway (jeton/mot de passe/proxy de confiance), comme les autres surfaces HTTP Gateway.
- Les WebViews Node n'envoient généralement pas d'en-têtes d'authentification ; après l'appairage et la connexion d'un nœud, le Gateway annonce des URL de capacité limitées au nœud pour l'accès canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du nœud et expirent rapidement. Aucun repli basé sur l'IP n'est utilisé.
- Injecte le client de rechargement en direct dans le HTML servi.
- Crée automatiquement un `index.html` de départ lorsqu'il est vide.
- Sert aussi A2UI sur `/__openclaw__/a2ui/`.
- Les modifications nécessitent un redémarrage du Gateway.
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

- `minimal` (par défaut lorsque le Plugin `bonjour` inclus est activé) : omettre `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclure `cliPath` + `sshPort` ; la diffusion multicast LAN exige toujours que le Plugin `bonjour` inclus soit activé.
- `off` : supprimer la diffusion multicast LAN sans modifier l'activation du Plugin.
- Le Plugin `bonjour` inclus démarre automatiquement sur les hôtes macOS et est activable sur demande sur les déploiements Gateway Linux, Windows et conteneurisés.
- Le nom d'hôte utilise par défaut le nom d'hôte du système lorsqu'il s'agit d'une étiquette DNS valide, avec repli sur `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte interréseau, associez-la à un serveur DNS (CoreDNS recommandé) + DNS fractionné Tailscale.

Configuration : `openclaw dns setup --apply`.

---

## Environnement

### `env` (variables d’environnement en ligne)

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

- Les variables d’environnement en ligne ne sont appliquées que si l’environnement du processus ne contient pas la clé.
- Fichiers `.env` : `.env` du CWD + `~/.openclaw/.env` (aucun ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil de votre shell de connexion.
- Consultez [Environnement](/fr/help/environment) pour la priorité complète.

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
- Les variables manquantes ou vides déclenchent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secrets sont additives : les valeurs en texte brut fonctionnent toujours.

### `SecretRef`

Utilisez une forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- Motif de `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- Motif de l’`id` de `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- `id` de `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- Motif de l’`id` de `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Les `id` de `source: "exec"` ne doivent pas contenir de segments de chemin délimités par des barres obliques `.` ou `..` (par exemple `a/../b` est rejeté)

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

Remarques :

- Le fournisseur `file` prend en charge `mode: "json"` et `mode: "singleValue"` (`id` doit être `"value"` en mode singleValue).
- Les chemins des fournisseurs `file` et `exec` échouent en mode fermé lorsque la vérification des ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour les chemins fiables qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande par lien symbolique sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins par lien symbolique tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification des répertoires fiables s’applique au chemin cible résolu.
- L’environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secrets sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage de surface active s’applique pendant l’activation : les références non résolues sur les surfaces activées font échouer le démarrage ou le rechargement, tandis que les surfaces inactives sont ignorées avec des diagnostics.

---

## Stockage d’authentification

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Les profils par agent sont stockés dans `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` prend en charge les références au niveau des valeurs (`keyRef` pour `api_key`, `tokenRef` pour `token`) pour les modes d’identifiants statiques.
- Les anciennes cartes plates `auth-profiles.json` comme `{ "provider": { "apiKey": "..." } }` ne sont pas un format d’exécution ; `openclaw doctor --fix` les réécrit en profils de clés API canoniques `provider:default` avec une sauvegarde `.legacy-flat.*.bak`.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification adossés à SecretRef.
- Les identifiants statiques d’exécution proviennent d’instantanés résolus en mémoire ; les anciennes entrées statiques `auth.json` sont nettoyées lorsqu’elles sont découvertes.
- Les importations OAuth héritées proviennent de `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours` : délai d’attente de base en heures lorsqu’un profil échoue en raison de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Le texte explicite relatif à la facturation peut toujours arriver ici, même sur des réponses `401`/`403`, mais les correspondances de texte propres aux fournisseurs restent limitées au fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Les messages réessayables HTTP `402` de fenêtre d’utilisation ou de limite de dépense d’organisation/espace de travail restent plutôt dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur pour les heures de délai d’attente de facturation.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du délai d’attente de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : délai d’attente de base en minutes pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du délai d’attente `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de délai d’attente (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de surcharge avant de basculer vers le modèle de repli (par défaut : `1`). Les formes de fournisseur occupé comme `ModelNotReadyException` arrivent ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profils d’authentification chez le même fournisseur pour les erreurs de limite de débit avant de basculer vers le modèle de repli (par défaut : `1`). Ce compartiment de limite de débit inclut les textes en forme de fournisseur comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

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
- `redactSensitive` / `redactPatterns` : masquage au mieux pour la sortie console, les journaux de fichier, les enregistrements de journaux OTLP et le texte persistant de transcript de session. `redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcript ; les surfaces de sécurité UI/outil/diagnostic masquent toujours les secrets avant émission.

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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
- `flags` : tableau de chaînes de drapeaux activant une sortie de journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’âge sans progression en ms pour classer les sessions de traitement de longue durée comme `session.long_running`, `session.stalled` ou `session.stuck`. Les réponses, outils, statuts, blocs et progressions ACP réinitialisent le minuteur ; les diagnostics `session.stuck` répétés appliquent un délai d’attente tant qu’ils restent inchangés.
- `stuckSessionAbortMs` : seuil d’âge sans progression en ms avant que le travail actif bloqué admissible puisse être vidangé par abandon pour récupération. Lorsqu’il n’est pas défini, OpenClaw utilise la fenêtre d’exécution intégrée étendue plus sûre d’au moins 10 minutes et 5x `stuckSessionWarnMs`.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (par défaut : `false`). Pour la configuration complète, le catalogue de signaux et le modèle de confidentialité, consultez [export OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : points de terminaison OTLP facultatifs propres aux signaux. Lorsqu’ils sont définis, ils remplacent `otel.endpoint` pour ce signal uniquement.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom de service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : active l’export de traces, de métriques ou de journaux.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`-`1`.
- `otel.flushIntervalMs` : intervalle de vidage périodique de la télémétrie en ms.
- `otel.captureContent` : capture de contenu brut opt-in pour les attributs d’étendue OTEL. Désactivé par défaut. Le booléen `true` capture le contenu de messages/outils non système ; la forme objet vous permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` et `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : interrupteur d’environnement pour les derniers attributs expérimentaux de fournisseur d’étendue GenAI. Par défaut, les étendues conservent l’attribut hérité `gen_ai.system` pour la compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : interrupteur d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK appartenant au Plugin tout en gardant les écouteurs de diagnostic actifs.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` et `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` : variables d’environnement de point de terminaison propres aux signaux utilisées lorsque la clé de configuration correspondante n’est pas définie.
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
- `auto.stableJitterHours` : fenêtre supplémentaire de répartition du déploiement sur le canal stable en heures (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence d’exécution des vérifications du canal bêta en heures (par défaut : `1` ; max : `24`).

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
- `backend` : identifiant de backend d’exécution ACP par défaut (doit correspondre à un Plugin d’exécution ACP enregistré).
  Installez d’abord le Plugin de backend et, si `plugins.allow` est défini, incluez l’identifiant du Plugin de backend (par exemple `acpx`) sinon le backend ACP ne se chargera pas.
- `defaultAgent` : identifiant d’agent cible ACP de repli lorsque les lancements ne spécifient pas de cible explicite.
- `allowedAgents` : liste d’autorisation d’identifiants d’agents permis pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage d’inactivité en ms pour le texte diffusé en streaming.
- `stream.maxChunkChars` : taille maximale de segment avant division de la projection de bloc diffusé en streaming.
- `stream.repeatSuppression` : supprime les lignes de statut/outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse progressivement ; `"final_only"` met en mémoire tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après des événements d’outil masqués (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie de l’assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes de statut/mise à jour ACP projetées.
- `stream.tagVisibility` : enregistrement des noms de balises vers des remplacements booléens de visibilité pour les événements diffusés en streaming.
- `runtime.ttlMinutes` : TTL d’inactivité en minutes pour les workers de session ACP avant nettoyage admissible.
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

- `cli.banner.taglineMode` contrôle le style du slogan de bannière :
  - `"random"` (par défaut) : slogans tournants humoristiques/saisonniers.
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

Voir les champs d’identité `agents.list` sous [valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Bridge (hérité, supprimé)

Les builds actuels n’incluent plus le bridge TCP. Les Nodes se connectent via le WebSocket du Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue jusqu’à leur suppression ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration bridge héritée (référence historique)">

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention` : durée de conservation des sessions d’exécution cron isolées terminées avant leur élagage dans `sessions.json`. Contrôle également le nettoyage des transcriptions cron supprimées archivées. Valeur par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : taille maximale par fichier journal d’exécution (`cron/runs/<jobId>.jsonl`) avant élagage. Valeur par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes conservées lorsque l’élagage du journal d’exécution est déclenché. Valeur par défaut : `2000`.
- `webhookToken` : jeton bearer utilisé pour la livraison POST du Webhook cron (`delivery.mode = "webhook"`). S’il est omis, aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL Webhook de secours héritée obsolète (http/https), utilisée uniquement pour les tâches enregistrées qui ont encore `notify: true`.

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

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches ponctuelles en cas d’erreurs transitoires (valeur par défaut : `3` ; plage : `0`-`10`).
- `backoffMs` : tableau des délais d’attente en ms pour chaque nouvelle tentative (valeur par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d’erreurs qui déclenchent de nouvelles tentatives - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

S’applique uniquement aux tâches Cron ponctuelles. Les tâches récurrentes utilisent une gestion des échecs distincte.

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

- `enabled` : activer les alertes d’échec pour les tâches Cron (valeur par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant le déclenchement d’une alerte (entier positif, min. : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre deux alertes répétées pour la même tâche (entier non négatif).
- `includeSkipped` : compter les exécutions ignorées consécutives dans le seuil d’alerte (valeur par défaut : `false`). Les exécutions ignorées sont suivies séparément et n’affectent pas l’attente progressive des erreurs d’exécution.
- `mode` : mode de livraison - `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : compte ou identifiant de canal facultatif pour limiter la portée de la livraison des alertes.

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

- Destination par défaut des notifications d’échec Cron pour toutes les tâches.
- `mode` : `"announce"` ou `"webhook"` ; utilise par défaut `"announce"` lorsque les données de cible sont suffisantes.
- `channel` : remplacement du canal pour la livraison announce. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible announce explicite ou URL Webhook. Obligatoire pour le mode Webhook.
- `accountId` : remplacement facultatif du compte pour la livraison.
- `delivery.failureDestination` défini par tâche remplace cette valeur par défaut globale.
- Lorsque ni la destination d’échec globale ni celle définie par tâche n’est configurée, les tâches qui livrent déjà via `announce` se replient sur cette cible announce principale en cas d’échec.
- `delivery.failureDestination` est uniquement pris en charge pour les tâches `sessionTarget="isolated"`, sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions cron isolées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle de média

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans enveloppes d’historique/d’expéditeur) |
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
| `{{Prompt}}`       | Invite média résolue pour les entrées CLI         |
| `{{MaxChars}}`     | Nombre maximal de caractères de sortie résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (dans la mesure du possible)      |
| `{{GroupMembers}}` | Aperçu des membres du groupe (dans la mesure du possible) |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (dans la mesure du possible) |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (dans la mesure du possible) |
| `{{Provider}}`     | Indice de fournisseur (whatsapp, telegram, discord, etc.) |

---

## Inclusions de configuration (`$include`)

Scinder la configuration en plusieurs fichiers :

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
- Tableau de fichiers : fusion profonde dans l’ordre (les fichiers ultérieurs remplacent les précédents).
- Clés voisines : fusionnées après les inclusions (remplacent les valeurs incluses).
- Inclusions imbriquées : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus relativement au fichier incluant, mais doivent rester dans le répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues/`../` ne sont autorisées que lorsqu’elles se résolvent toujours à l’intérieur de cette limite.
- Les écritures appartenant à OpenClaw qui modifient uniquement une section de niveau supérieur adossée à une inclusion de fichier unique écrivent dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les inclusions racine, les tableaux d’inclusions et les inclusions avec remplacements voisins sont en lecture seule pour les écritures appartenant à OpenClaw ; ces écritures échouent de manière fermée au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse et les inclusions circulaires.

---

_Associé : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Associé

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
