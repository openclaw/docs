---
read_when:
    - Vous avez besoin de la sémantique exacte des champs de configuration ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration de la Gateway pour les clés cœur d’OpenClaw, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-04-25T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Référence de configuration cœur pour `~/.openclaw/openclaw.json`. Pour une vue orientée tâches, voir [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration OpenClaw et renvoie vers d’autres pages lorsqu’un sous-système dispose de sa propre référence plus détaillée. Les catalogues de commandes propres aux canaux et Plugins ainsi que les réglages détaillés de mémoire/QMD figurent sur leurs propres pages plutôt que sur celle-ci.

Source de vérité du code :

- `openclaw config schema` affiche le schéma JSON vivant utilisé pour la validation et Control UI, avec les métadonnées fusionnées des éléments intégrés/Plugins/canaux lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma à portée de chemin pour les outils d’exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hash de référence de la documentation de configuration par rapport à la surface actuelle du schéma

Références détaillées dédiées :

- [Référence de configuration mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, et la configuration de dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées + incluses
- pages des canaux/Plugins propriétaires pour les surfaces de commande spécifiques aux canaux

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs — OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée — voir
[Configuration — canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et d’autres
canaux inclus (authentification, contrôle d’accès, multi-compte, filtrage par mention).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée — voir
[Configuration — agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, réflexion, Heartbeat, mémoire, médias, Skills, sandbox)
- `multiAgent.*` (routage et liaisons multi-agent)
- `session.*` (cycle de vie de session, Compaction, élagage)
- `messages.*` (livraison des messages, TTS, rendu Markdown)
- `talk.*` (mode Talk)
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)

## Outils et fournisseurs personnalisés

La politique des outils, les bascules expérimentales, la configuration des outils adossés à un fournisseur et la configuration
des fournisseurs personnalisés / URL de base ont été déplacées vers une page dédiée — voir
[Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## MCP

Les définitions de serveur MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
consommées par Pi intégré et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`,
`show`, `set` et `unset` gèrent ce bloc sans se connecter au
serveur cible pendant les modifications de configuration.

```json5
{
  mcp: {
    // Facultatif. Par défaut : 600000 ms (10 minutes). Définissez 0 pour désactiver l’éviction sur inactivité.
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

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les runtimes qui
  exposent les outils MCP configurés.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les runtimes MCP inclus à portée de session.
  Les exécutions intégrées à usage unique demandent un nettoyage en fin d’exécution ; ce TTL sert de solution de secours pour
  les sessions longue durée et les futurs appelants.
- Les modifications sous `mcp.*` s’appliquent à chaud en supprimant les runtimes MCP de session mis en cache.
  La prochaine découverte/utilisation d’outil les recrée depuis la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont nettoyées immédiatement au lieu d’attendre le TTL d’inactivité.

Voir [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement à l’exécution.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en clair
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d’autorisation facultative pour les Skills inclus uniquement (les Skills gérées/de l’espace de travail ne sont pas affectées).
- `load.extraDirs` : racines de Skills partagées supplémentaires (priorité la plus faible).
- `install.preferBrew` : lorsque vrai, préfère les installateurs Homebrew lorsque `brew` est
  disponible avant de se rabattre sur d’autres types d’installateurs.
- `install.nodeManager` : préférence du gestionnaire Node pour les spécifications
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` désactive une skill même si elle est incluse/installée.
- `entries.<skillKey>.apiKey` : champ de commodité pour les Skills qui déclarent une variable env principale (chaîne en clair ou objet SecretRef).

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

- Chargés depuis `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- La découverte accepte les Plugins OpenClaw natifs ainsi que les bundles Codex et Claude compatibles, y compris les bundles Claude sans manifeste avec disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage de la Gateway.**
- `allow` : liste d’autorisation facultative (seuls les Plugins listés sont chargés). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ pratique au niveau du Plugin pour la clé d’API (lorsqu’il est pris en charge par le Plugin).
- `plugins.entries.<id>.env` : mappage de variables d’environnement à portée de Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs de mutation de prompt de l’ancien `before_agent_start`, tout en préservant `modelOverride` et `providerOverride` historiques. S’applique aux hooks de Plugin natifs et aux répertoires de hooks fournis par les bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les Plugins de confiance non inclus peuvent lire le contenu brut des conversations depuis des hooks typés tels que `llm_input`, `llm_output` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : faire explicitement confiance à ce Plugin pour demander des surcharges `provider` et `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les surcharges de sous-agents de confiance. Utilisez `"*"` uniquement lorsque vous voulez délibérément autoriser n’importe quel modèle.
- `plugins.entries.<id>.config` : objet de configuration défini par le Plugin (validé par le schéma de Plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte/exécution des Plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du Plugin propriétaire, et non par un registre central d’options OpenClaw.
- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération web Firecrawl.
  - `apiKey` : clé d’API Firecrawl (accepte SecretRef). Se rabat sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l’ancien `tools.web.fetch.firecrawl.apiKey`, ou la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev`).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche web Grok).
  - `enabled` : active le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de dreaming mémoire. Voir [Dreaming](/fr/concepts/dreaming) pour les phases et seuils.
  - `enabled` : commutateur principal de dreaming (par défaut `false`).
  - `frequency` : cadence Cron pour chaque balayage complet de dreaming (`"0 3 * * *"` par défaut).
  - la politique de phase et les seuils sont des détails d’implémentation (pas des clés de configuration destinées à l’utilisateur).
- La configuration mémoire complète figure dans [Référence de configuration mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les Plugins bundle Claude activés peuvent aussi contribuer des valeurs par défaut Pi intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisit l’id du Plugin mémoire actif, ou `"none"` pour désactiver les Plugins mémoire.
- `plugins.slots.contextEngine` : choisit l’id du Plugin moteur de contexte actif ; la valeur par défaut est `"legacy"` sauf si vous installez et sélectionnez un autre moteur.
- `plugins.installs` : métadonnées d’installation gérées par la CLI utilisées par `openclaw plugins update`.
  - Inclut `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Traitez `plugins.installs.*` comme un état géré ; préférez les commandes CLI aux modifications manuelles.

Voir [Plugins](/fr/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activez explicitement uniquement pour un accès réseau privé de confiance
      // allowPrivateNetwork: true, // alias historique
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
- `tabCleanup` récupère les onglets suivis de l’agent principal après une période d’inactivité ou lorsqu’une
  session dépasse son plafond. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver individuellement ces modes de nettoyage.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini, donc la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites délibérément confiance à la navigation privée sur le réseau par le navigateur.
- En mode strict, les points de terminaison de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage réseau privé pendant les vérifications d’accessibilité/découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias historique.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour des exceptions explicites.
- Les profils distants sont en attachement seul (start/stop/reset désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent s’attacher sur
  l’hôte sélectionné ou via un browser node connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil
  spécifique de navigateur basé sur Chromium, comme Brave ou Edge.
- Les profils `existing-session` conservent les limites actuelles de la route Chrome MCP :
  actions basées sur snapshot/réf au lieu d’un ciblage par sélecteur CSS, hooks de téléversement d’un seul fichier,
  pas de surcharge de délai d’expiration des boîtes de dialogue, pas de `wait --load networkidle`, et pas de
  `responsebody`, export PDF, interception de téléchargement ou actions par lot.
- Les profils locaux gérés `openclaw` attribuent automatiquement `cdpPort` et `cdpUrl` ; ne
  définissez explicitement `cdpUrl` que pour un CDP distant.
- Les profils locaux gérés peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils locaux gérés utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP CDP de Chrome
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour l’état prêt du websocket CDP
  après lancement. Augmentez-les sur les hôtes plus lents où Chrome démarre correctement
  mais où les vérifications d’état prêt entrent en concurrence avec le démarrage.
- Ordre d’auto-détection : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` accepte `~` pour le répertoire personnel de votre OS.
- Service de contrôle : loopback uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, taille de fenêtre ou indicateurs de débogage).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texte court, URL d’image ou URI de données
    },
  },
}
```

- `seamColor` : couleur d’accent pour le chrome UI de l’application native (teinte de la bulle du mode Talk, etc.).
- `assistant` : surcharge d’identité pour Control UI. Se rabat sur l’identité de l’agent actif.

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
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // pour mode=trusted-proxy ; voir /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangereux : autorise les URL d’intégration absolues externes http(s)
      // allowedOrigins: ["https://control.example.com"], // requis pour un Control UI hors loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // mode de repli d’origine Host header dangereux
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
    // Facultatif. Par défaut false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Facultatif. Par défaut non défini/désactivé.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Refus HTTP /tools/invoke supplémentaires
      deny: ["browser"],
      // Supprime des outils de la liste de refus HTTP par défaut
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

- `mode` : `local` (exécuter la gateway) ou `remote` (se connecter à une gateway distante). La Gateway refuse de démarrer sauf si `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement), ou `custom`.
- **Alias historiques de bind** : utilisez les valeurs de mode de liaison dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), et non les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Remarque Docker** : la liaison `loopback` par défaut écoute sur `127.0.0.1` à l’intérieur du conteneur. Avec le réseau bridge Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc la Gateway est inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Auth** : requise par défaut. Les liaisons hors loopback nécessitent une authentification Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’onboarding génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRef), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation du service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode sans authentification explicite. À utiliser uniquement pour des configurations loopback locales de confiance ; cette option n’est volontairement pas proposée par les invites d’onboarding.
- `gateway.auth.mode: "trusted-proxy"` : délègue l’authentification à un proxy inverse sensible à l’identité et fait confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification via proxy de confiance](/fr/gateway/trusted-proxy-auth)). Ce mode attend une source de proxy **hors loopback** ; les proxies inverses loopback sur le même hôte ne satisfont pas l’authentification `trusted-proxy`.
- `gateway.auth.allowTailscale` : lorsque `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification Control UI/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison d’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d’authentification HTTP normal de la Gateway. Ce flux sans jeton suppose que l’hôte Gateway est de confiance. Vaut par défaut `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d’authentification. S’applique par IP cliente et par portée d’authentification (secret partagé et jeton d’appareil sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone Tailscale Serve de Control UI, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives erronées concurrentes provenant du même client peuvent donc déclencher le limiteur sur la deuxième requête au lieu que les deux passent en concurrence comme de simples incompatibilités.
  - `gateway.auth.rateLimit.exemptLoopback` vaut par défaut `true` ; définissez `false` lorsque vous voulez intentionnellement limiter aussi le trafic localhost (pour des configurations de test ou des déploiements proxy stricts).
- Les tentatives d’authentification WS d’origine navigateur sont toujours limitées avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost via navigateur).
- Sur loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne
  verrouillent pas automatiquement une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, liaison loopback) ou `funnel` (public, nécessite une authentification).
- `controlUi.allowedOrigins` : liste d’autorisation explicite des origines navigateur pour les connexions WebSocket à la Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active le repli d’origine basé sur l’en-tête Host pour les déploiements qui s’appuient intentionnellement sur cette politique.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : dérogation break-glass côté environnement de processus client
  qui autorise `ws://` en clair vers des IP de réseau privé de confiance ; par défaut, le mode en clair
  reste limité au loopback. Il n’existe pas d’équivalent dans `openclaw.json`,
  et la configuration réseau privé du navigateur telle que
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` n’affecte pas les clients
  WebSocket de la Gateway.
- `gateway.remote.token` / `.password` sont des champs d’identifiants pour client distant. Ils ne configurent pas à eux seuls l’authentification de la Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé par les builds iOS officiels/TestFlight après qu’ils ont publié leurs enregistrements adossés au relais vers la Gateway. Cette URL doit correspondre à celle du relais compilée dans la build iOS.
- `gateway.push.apns.relay.timeoutMs` : délai d’expiration d’envoi gateway-vers-relais en millisecondes. Valeur par défaut : `10000`.
- Les enregistrements adossés au relais sont délégués à une identité Gateway spécifique. L’app iOS appairée appelle `gateway.identity.get`, inclut cette identité dans l’enregistrement du relais, et transmet à la Gateway une autorisation d’envoi à portée d’enregistrement. Une autre Gateway ne peut pas réutiliser cet enregistrement stocké.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : surcharges temporaires via env pour la configuration du relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP en loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur de santé des canaux en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé. Par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète en minutes. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur de santé par canal/compte sur une heure glissante. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation facultative par canal des redémarrages du moniteur de santé tout en conservant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : surcharge par compte pour les canaux multi-comptes. Lorsqu’elle est définie, elle est prioritaire sur la surcharge au niveau du canal.
- Les chemins d’appel de Gateway locale peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (sans repli distant masquant).
- `trustedProxies` : IP de proxies inverses qui terminent TLS ou injectent des en-têtes client transférés. Listez uniquement les proxies que vous contrôlez. Les entrées loopback restent valides pour les configurations de détection proxy local/même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback éligibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque `true`, la Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Par défaut `false` pour un comportement en échec fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation facultative CIDR/IP pour l’auto-approbation du premier appairage d’appareil Node sans portées demandées. Cette option est désactivée lorsqu’elle n’est pas définie. Cela n’auto-approuve pas l’appairage opérateur/navigateur/Control UI/WebChat, et n’auto-approuve pas non plus les mises à niveau de rôle, portée, métadonnées ou clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : mise en forme globale d’autorisation/refus pour les commandes Node déclarées après l’appairage et l’évaluation de la liste d’autorisation.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour HTTP `POST /tools/invoke` (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut.

</Accordion>

### Points de terminaison compatibles OpenAI

- Chat Completions : désactivé par défaut. Activez-le avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses : `gateway.http.endpoints.responses.enabled`.
- Renforcement des entrées URL de Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération par URL.
- En-tête facultatif de renforcement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification via proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instances

Exécutez plusieurs gateways sur un même hôte avec des ports et répertoires d’état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicateurs pratiques : `--dev` (utilise `~/.openclaw-dev` + port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

Voir [Plusieurs Gateways](/fr/gateway/multiple-gateways).

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

- `enabled` : active la terminaison TLS au niveau de l’écouteur Gateway (HTTPS/WSS) (par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire locale certificat/clé auto-signée lorsque des fichiers explicites ne sont pas configurés ; pour usage local/dev uniquement.
- `certPath` : chemin du système de fichiers vers le fichier certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier clé privée TLS ; gardez des permissions restrictives.
- `caPath` : chemin facultatif vers le bundle CA pour la vérification du client ou des chaînes de confiance personnalisées.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode` : contrôle comment les modifications de configuration sont appliquées à l’exécution.
  - `"off"` : ignore les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : redémarre toujours le processus Gateway lors d’un changement de configuration.
  - `"hot"` : applique les changements dans le processus sans redémarrer.
  - `"hybrid"` (par défaut) : essaie d’abord le rechargement à chaud ; revient au redémarrage si nécessaire.
- `debounceMs` : fenêtre d’anti-rebond en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs` : durée maximale facultative en ms à attendre les opérations en cours avant de forcer un redémarrage. Omettez-la ou définissez `0` pour attendre indéfiniment et journaliser périodiquement des avertissements indiquant que des opérations sont toujours en attente.

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

Auth : `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Les jetons de hook dans la chaîne de requête sont rejetés.

Remarques de validation et de sécurité :

- `hooks.enabled=true` nécessite un `hooks.token` non vide.
- `hooks.token` doit être **distinct** de `gateway.auth.token` ; la réutilisation du jeton Gateway est rejetée.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié tel que `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mapping ou un preset utilise un `sessionKey` avec modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés statiques de mapping ne nécessitent pas cette activation explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` depuis la charge utile de la requête n’est accepté que lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de mapping rendues via modèle sont traitées comme fournies en externe et nécessitent également `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mapping">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de la charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de hook.
  - `transform.module` doit être un chemin relatif et rester dans `hooks.transformsDir` (les chemins absolus et la traversée sont rejetés).
- `agentId` route vers un agent spécifique ; les identifiants inconnus se rabattent sur la valeur par défaut.
- `allowedAgentIds` : limite le routage explicite (`*` ou omission = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d’agent hook sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de mapping pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d’autorisation facultative de préfixes pour les valeurs explicites de `sessionKey` (requête + mapping), par ex. `["hook:"]`. Elle devient requise lorsqu’un mapping ou preset utilise un `sessionKey` avec modèle.
- `deliver: true` envoie la réponse finale vers un canal ; `channel` vaut `last` par défaut.
- `model` surcharge le LLM pour cette exécution de hook (doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le preset Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` pour qu’il corresponde à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le preset avec un `sessionKey` statique au lieu de la valeur par défaut avec modèle.

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

- La Gateway démarre automatiquement `gog gmail watch serve` au démarrage lorsqu’il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N’exécutez pas un `gog gmail watch serve` séparé en parallèle de la Gateway.

---

## Hôte Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // ou OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sert du HTML/CSS/JS modifiable par l’agent et A2UI via HTTP sous le port Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (par défaut).
- Liaisons hors loopback : les routes canvas nécessitent une authentification Gateway (jeton/mot de passe/trusted-proxy), comme les autres surfaces HTTP Gateway.
- Les WebViews Node n’envoient généralement pas d’en-têtes d’authentification ; après appairage et connexion d’un node, la Gateway annonce des URL de capacité à portée de node pour l’accès canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du node et expirent rapidement. Le repli basé sur l’IP n’est pas utilisé.
- Injecte un client de rechargement en direct dans le HTML servi.
- Crée automatiquement un `index.html` de démarrage lorsque le répertoire est vide.
- Sert également A2UI à `/__openclaw__/a2ui/`.
- Les modifications nécessitent un redémarrage de la Gateway.
- Désactivez le rechargement en direct pour les grands répertoires ou en cas d’erreurs `EMFILE`.

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

- `minimal` (par défaut) : omet `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclut `cliPath` + `sshPort`.
- Le nom d’hôte vaut `openclaw` par défaut. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte inter-réseaux, associez cela à un serveur DNS (CoreDNS recommandé) + split DNS Tailscale.

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

- Les variables d’environnement en ligne ne sont appliquées que si l’environnement du processus ne contient pas déjà la clé.
- Fichiers `.env` : `.env` du répertoire courant + `~/.openclaw/.env` (aucun des deux ne remplace des variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil de votre shell de connexion.
- Voir [Environnement](/fr/help/environment) pour la priorité complète.

### Substitution de variables d’environnement

Référencez des variables d’environnement dans toute chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`.
- Les variables manquantes/vides provoquent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour un littéral `${VAR}`.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secret sont additives : les valeurs en clair continuent de fonctionner.

### `SecretRef`

Utilisez une seule forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- motif `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- motif `id` pour `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- `id` pour `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- motif `id` pour `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- les `id` avec `source: "exec"` ne doivent pas contenir de segments de chemin `.` ou `..` séparés par slash (par exemple `a/../b` est rejeté)

### Surface de crédentials prise en charge

- Matrice canonique : [Surface de crédentials SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins de crédentials pris en charge dans `openclaw.json`.
- Les références `auth-profiles.json` sont incluses dans la résolution à l’exécution et dans la couverture d’audit.

### Configuration des fournisseurs de secrets

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // fournisseur env explicite facultatif
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

- Le fournisseur `file` prend en charge `mode: "json"` et `mode: "singleValue"` (`id` doit valoir `"value"` en mode singleValue).
- Les chemins des fournisseurs file et exec échouent en mode fermé lorsque la vérification ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour des chemins de confiance qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande symlink sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins symlink tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification de répertoire de confiance s’applique au chemin cible résolu.
- L’environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables nécessaires avec `passEnv`.
- Les références de secret sont résolues au moment de l’activation dans un snapshot en mémoire, puis les chemins de requête lisent uniquement ce snapshot.
- Le filtrage de surface active s’applique pendant l’activation : les références non résolues sur des surfaces activées font échouer le démarrage/rechargement, tandis que les surfaces inactives sont ignorées avec diagnostics.

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
- `auth-profiles.json` prend en charge des références au niveau de la valeur (`keyRef` pour `api_key`, `tokenRef` pour `token`) pour les modes de crédentials statiques.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge des crédentials de profil d’authentification adossés à SecretRef.
- Les crédentials statiques d’exécution proviennent de snapshots résolus en mémoire ; les anciennes entrées statiques `auth.json` sont nettoyées lorsqu’elles sont découvertes.
- Les imports OAuth historiques proviennent de `~/.openclaw/credentials/oauth.json`.
- Voir [OAuth](/fr/concepts/oauth).
- Comportement à l’exécution des secrets et outillage `audit/configure/apply` : [Gestion des secrets](/fr/gateway/secrets).

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

- `billingBackoffHours` : délai de recul de base en heures lorsqu’un profil échoue à cause de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Un texte de facturation explicite peut
  toujours arriver ici même sur des réponses `401`/`403`, mais les
  correspondances textuelles spécifiques à un fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter
  `Key limit exceeded`). Les messages réessayables `402` liés à la fenêtre d’usage ou
  aux limites de dépense d’organisation/espace de travail restent dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : surcharges facultatives par fournisseur pour le délai de recul de facturation en heures.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du délai de recul de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : délai de recul de base en minutes pour les échecs `auth_permanent` à haute confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du délai de recul `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de délai de recul (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profil d’authentification du même fournisseur pour les erreurs de surcharge avant de passer au repli sur le modèle (par défaut : `1`). Les formes de type fournisseur occupé comme `ModelNotReadyException` arrivent ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profil d’authentification du même fournisseur pour les erreurs de limitation de débit avant de passer au repli sur le modèle (par défaut : `1`). Ce compartiment de limitation de débit inclut des textes de type fournisseur comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, et `resource exhausted`.

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
- `maxFileBytes` : taille maximale du fichier journal en octets avant que les écritures ne soient supprimées (entier positif ; par défaut : `524288000` = 500 MB). Utilisez une rotation de journaux externe pour les déploiements de production.

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
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

- `enabled` : commutateur principal pour la sortie d’instrumentation (par défaut : `true`).
- `flags` : tableau de chaînes de drapeaux activant une sortie journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’âge en ms pour émettre des avertissements de session bloquée tant qu’une session reste à l’état de traitement.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (par défaut : `false`).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom de service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : activent l’export de traces, métriques ou journaux.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`–`1`.
- `otel.flushIntervalMs` : intervalle périodique de vidage de télémétrie en ms.
- `otel.captureContent` : capture explicite du contenu brut pour les attributs de span OTEL. Désactivée par défaut. Le booléen `true` capture le contenu des messages/outils non système ; la forme objet vous permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` et `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1` : commutateur d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK possédé par le Plugin tout en conservant actifs les écouteurs de diagnostic.
- `cacheTrace.enabled` : journalise des snapshots de trace de cache pour les exécutions intégrées (par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie pour le JSONL de trace de cache (par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôlent ce qui est inclus dans la sortie de trace de cache (tout vaut `true` par défaut).

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

- `channel` : canal de publication pour les installations npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart` : vérifie les mises à jour npm au démarrage de la Gateway (par défaut : `true`).
- `auto.enabled` : active les mises à jour automatiques en arrière-plan pour les installations de paquet (par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant application automatique sur le canal stable (par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire d’étalement du déploiement sur le canal stable, en heures (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence des vérifications sur le canal bêta, en heures (par défaut : `1` ; max : `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled` : garde-fou global de fonctionnalité ACP (par défaut : `false`).
- `dispatch.enabled` : garde-fou indépendant pour la distribution des tours de session ACP (par défaut : `true`). Définissez `false` pour garder les commandes ACP disponibles tout en bloquant l’exécution.
- `backend` : identifiant du backend d’exécution ACP par défaut (doit correspondre à un Plugin de runtime ACP enregistré).
- `defaultAgent` : identifiant d’agent ACP cible de repli lorsque les créations ne spécifient pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agent permis pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage sur inactivité en ms pour le texte streamé.
- `stream.maxChunkChars` : taille maximale d’un segment avant division de la projection de bloc streamée.
- `stream.repeatSuppression` : supprime les lignes de statut/outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse de manière incrémentale ; `"final_only"` met en tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après des événements d’outil cachés (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes projetées de statut/mise à jour ACP.
- `stream.tagVisibility` : enregistrement des noms de balises vers des surcharges booléennes de visibilité pour les événements streamés.
- `runtime.ttlMinutes` : TTL d’inactivité en minutes pour les workers de session ACP avant qu’un nettoyage soit possible.
- `runtime.installCommand` : commande facultative d’installation à exécuter lors de l’initialisation d’un environnement d’exécution ACP.

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
  - `"random"` (par défaut) : slogans tournants amusants/saisonniers.
  - `"default"` : slogan neutre fixe (`All your chats, one OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre/version de la bannière reste affiché).
- Pour masquer toute la bannière (et pas seulement les slogans), définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Assistant

Métadonnées écrites par les flux CLI de configuration guidée (`onboard`, `configure`, `doctor`) :

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

Voir les champs d’identité de `agents.list` sous [Valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Bridge (historique, supprimé)

Les builds actuelles n’incluent plus le bridge TCP. Les Nodes se connectent via le WebSocket Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu’elles ne sont pas supprimées ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration bridge historique (référence historique)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // repli obsolète pour les tâches stockées notify:true
    webhookToken: "replace-with-dedicated-token", // jeton bearer facultatif pour l’authentification Webhook sortante
    sessionRetention: "24h", // chaîne de durée ou false
    runLog: {
      maxBytes: "2mb", // par défaut 2_000_000 octets
      keepLines: 2000, // par défaut 2000
    },
  },
}
```

- `sessionRetention` : durée de conservation des sessions terminées d’exécution Cron isolée avant élagage depuis `sessions.json`. Contrôle aussi le nettoyage des transcriptions Cron archivées supprimées. Par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : taille maximale par fichier journal d’exécution (`cron/runs/<jobId>.jsonl`) avant élagage. Par défaut : `2_000_000` octets.
- `runLog.keepLines` : nombre de lignes les plus récentes conservées lorsque l’élagage du journal d’exécution est déclenché. Par défaut : `2000`.
- `webhookToken` : jeton bearer utilisé pour la livraison POST Webhook Cron (`delivery.mode = "webhook"`), si omis aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL Webhook historique obsolète (http/https) utilisée uniquement pour les tâches stockées qui ont encore `notify: true`.

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

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches ponctuelles sur des erreurs transitoires (par défaut : `3` ; plage : `0`–`10`).
- `backoffMs` : tableau de délais de recul en ms pour chaque tentative de nouvelle exécution (par défaut : `[30000, 60000, 300000]` ; 1–10 entrées).
- `retryOn` : types d’erreur qui déclenchent des nouvelles tentatives — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

S’applique uniquement aux tâches Cron ponctuelles. Les tâches récurrentes utilisent une gestion des échecs distincte.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled` : active les alertes d’échec pour les tâches Cron (par défaut : `false`).
- `after` : nombre d’échecs consécutifs avant qu’une alerte ne se déclenche (entier positif, min : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre alertes répétées pour la même tâche (entier non négatif).
- `mode` : mode de livraison — `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : identifiant facultatif de compte ou de canal pour limiter la livraison de l’alerte.

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

- Destination par défaut pour les notifications d’échec Cron sur l’ensemble des tâches.
- `mode` : `"announce"` ou `"webhook"` ; vaut par défaut `"announce"` lorsque suffisamment de données cibles existent.
- `channel` : surcharge de canal pour la livraison announce. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible explicite announce ou URL Webhook. Requis pour le mode Webhook.
- `accountId` : surcharge facultative de compte pour la livraison.
- `delivery.failureDestination` par tâche remplace cette valeur globale par défaut.
- Lorsqu’aucune destination d’échec globale ni par tâche n’est définie, les tâches qui livrent déjà via `announce` se rabattent sur cette cible announce primaire en cas d’échec.
- `delivery.failureDestination` n’est pris en charge que pour les tâches `sessionTarget="isolated"` sauf si le `delivery.mode` principal de la tâche vaut `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions Cron isolées sont suivies comme [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle de média

Placeholders de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans wrappers d’historique/expéditeur) |
| `{{BodyStripped}}` | Corps avec les mentions de groupe supprimées      |
| `{{From}}`         | Identifiant de l’expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | Identifiant du message de canal                   |
| `{{SessionId}}`    | UUID de la session en cours                       |
| `{{IsNewSession}}` | `"true"` lorsqu’une nouvelle session est créée    |
| `{{MediaUrl}}`     | pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite média résolue pour les entrées CLI         |
| `{{MaxChars}}`     | Nombre maximal de caractères résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (au mieux)                        |
| `{{GroupMembers}}` | Aperçu des membres du groupe (au mieux)           |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (au mieux)        |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (au mieux)    |
| `{{Provider}}`     | Indication du fournisseur (whatsapp, telegram, discord, etc.) |

---

## Includes de configuration (`$include`)

Scindez la configuration en plusieurs fichiers :

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
- Tableau de fichiers : fusion profonde dans l’ordre (les suivants remplacent les précédents).
- Clés sœurs : fusionnées après les includes (remplacent les valeurs incluses).
- Includes imbriqués : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus relativement au fichier incluant, mais doivent rester à l’intérieur du répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues/`../` ne sont autorisées que si elles se résolvent toujours à l’intérieur de cette limite.
- Les écritures gérées par OpenClaw qui ne modifient qu’une seule section de niveau supérieur adossée à un include fichier unique sont propagées dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les includes racine, les tableaux d’includes et les includes avec surcharges de clés sœurs sont en lecture seule pour les écritures gérées par OpenClaw ; ces écritures échouent en mode fermé au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse et les includes circulaires.

---

_Lié : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Lié

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
