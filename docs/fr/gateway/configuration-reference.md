---
read_when:
    - Vous avez besoin de la sémantique exacte des champs de configuration ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de gateway ou d'outil
summary: Référence de configuration de la Gateway pour les clés OpenClaw principales, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-04-26T11:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Référence de configuration principale pour `~/.openclaw/openclaw.json`. Pour une vue orientée tâches, voir [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d'OpenClaw et renvoie vers d'autres pages lorsqu'un sous-système a sa propre référence plus détaillée. Les catalogues de commandes propres aux canaux et Plugins ainsi que les réglages avancés de mémoire / QMD se trouvent sur leurs propres pages plutôt que sur celle-ci.

Source de vérité du code :

- `openclaw config schema` affiche le schéma JSON actif utilisé pour la validation et l'interface de contrôle, avec fusion des métadonnées des Plugins / canaux inclus lorsqu'elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma à portée de chemin pour les outils d'exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hash de référence des docs de configuration par rapport à la surface de schéma actuelle

Chemin de recherche de l'agent : utilisez l'action d'outil `gateway`
`config.schema.lookup` pour obtenir une documentation et des contraintes exactes
au niveau des champs avant modification. Utilisez
[Configuration](/fr/gateway/configuration) pour les conseils orientés tâches et cette page
pour la cartographie plus large des champs, les valeurs par défaut et les liens vers les références des sous-systèmes.

Références détaillées dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration Dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées + incluses
- pages des canaux / Plugins propriétaires pour les surfaces de commande spécifiques à chaque canal

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs — OpenClaw utilise des valeurs par défaut sûres lorsqu'ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée — voir
[Configuration — canaux](/fr/gateway/config-channels) pour `channels.*`,
y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et d'autres
canaux inclus (authentification, contrôle d'accès, multi-comptes, filtrage par mention).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée — voir
[Configuration — agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, thinking, Heartbeat, mémoire, médias, Skills, sandbox)
- `multiAgent.*` (routage multi-agent et liaisons)
- `session.*` (cycle de vie de session, Compaction, élagage)
- `messages.*` (livraison des messages, TTS, rendu Markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale` : identifiant de langue BCP 47 facultatif pour la reconnaissance vocale Talk sur iOS/macOS
  - `talk.silenceTimeoutMs` : lorsqu'il n'est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d'envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)

## Outils et fournisseurs personnalisés

La politique des outils, les bascules expérimentales, la configuration des outils adossés à un fournisseur et la configuration des fournisseurs personnalisés / `baseUrl` ont été déplacées vers une page dédiée — voir
[Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## MCP

Les définitions de serveur MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont
consommées par Pi embarqué et d'autres adaptateurs d'exécution. Les commandes `openclaw mcp list`,
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les runtimes qui
  exposent des outils MCP configurés.
- `mcp.sessionIdleTtlMs` : TTL d'inactivité pour les runtimes MCP inclus à portée de session.
  Les exécutions embarquées à usage unique demandent un nettoyage en fin d'exécution ; ce TTL est le filet de sécurité pour
  les sessions longue durée et les futurs appelants.
- Les modifications sous `mcp.*` s'appliquent à chaud en supprimant les runtimes MCP de session mis en cache.
  La prochaine découverte / utilisation d'outil les recrée à partir de la nouvelle configuration, de sorte que les entrées
  `mcp.servers` supprimées sont nettoyées immédiatement au lieu d'attendre
  le TTL d'inactivité.

Voir [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et
[Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement d'exécution.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled` : liste d'autorisation facultative pour les Skills inclus uniquement (les Skills gérés / d'espace de travail ne sont pas affectés).
- `load.extraDirs` : racines supplémentaires de Skills partagés (priorité la plus faible).
- `install.preferBrew` : lorsque cette valeur est vraie, préfère les installateurs Homebrew lorsque `brew` est
  disponible avant de se replier sur d'autres types d'installateurs.
- `install.nodeManager` : préférence d'installateur Node pour les spécifications `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` désactive un Skill même s'il est inclus / installé.
- `entries.<skillKey>.apiKey` : raccourci pratique pour les Skills déclarant une variable d'environnement principale (chaîne en clair ou objet SecretRef).

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
- La découverte accepte les Plugins OpenClaw natifs ainsi que les bundles compatibles Codex et Claude, y compris les bundles Claude sans manifeste avec disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage de la gateway.**
- `allow` : liste d'autorisation facultative (seuls les plugins listés sont chargés). `deny` est prioritaire.
- `plugins.entries.<id>.apiKey` : champ pratique de clé API au niveau du plugin (lorsqu'il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : map de variables d'environnement à portée du plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs de mutation du prompt provenant de l'ancien `before_agent_start`, tout en conservant les anciens `modelOverride` et `providerOverride`. S'applique aux hooks de plugins natifs et aux répertoires de hooks fournis par bundle pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les plugins non inclus de confiance peuvent lire le contenu brut des conversations depuis des hooks typés tels que `llm_input`, `llm_output`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : faire explicitement confiance à ce plugin pour demander des surcharges `provider` et `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d'autorisation facultative des cibles canoniques `provider/model` pour les surcharges de sous-agent approuvées. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n'importe quel modèle.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma de Plugin OpenClaw natif lorsqu'il est disponible).
- Les paramètres de compte / d'exécution des Plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du Plugin propriétaire, et non par un registre central d'options OpenClaw.
- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur de récupération Web Firecrawl.
  - `apiKey` : clé API Firecrawl (accepte SecretRef). Se replie sur `plugins.entries.firecrawl.config.webSearch.apiKey`, l'ancien `tools.web.fetch.firecrawl.apiKey` ou la variable d'environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l'API Firecrawl (par défaut : `https://api.firecrawl.dev`).
  - `onlyMainContent` : extraire uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d'expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche Web Grok).
  - `enabled` : activer le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres Dreaming de la mémoire. Voir [Dreaming](/fr/concepts/dreaming) pour les phases et seuils.
  - `enabled` : interrupteur maître Dreaming (par défaut `false`).
  - `frequency` : cadence Cron pour chaque balayage complet Dreaming (par défaut `"0 3 * * *"`).
  - la politique de phase et les seuils sont des détails d'implémentation (pas des clés de configuration destinées aux utilisateurs).
- La configuration complète de la mémoire se trouve dans [Référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les Plugins bundle Claude activés peuvent aussi contribuer avec des valeurs par défaut Pi embarquées depuis `settings.json` ; OpenClaw les applique comme paramètres d'agent nettoyés, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisissez l'id du Plugin mémoire actif, ou `"none"` pour désactiver les plugins mémoire.
- `plugins.slots.contextEngine` : choisissez l'id du Plugin moteur de contexte actif ; la valeur par défaut est `"legacy"` sauf si vous installez et sélectionnez un autre moteur.

Voir [Plugins](/fr/tools/plugin).

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
- `tabCleanup` récupère les onglets suivis de l'agent principal après un temps d'inactivité ou lorsqu'une
  session dépasse son plafond. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuellement.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu'il n'est pas défini, de sorte que la navigation du navigateur reste stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur réseau privé.
- En mode strict, les endpoints de profil CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage du réseau privé pendant les vérifications d'accessibilité / découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme ancien alias.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour des exceptions explicites.
- Les profils distants sont en mode rattachement uniquement (`start` / `stop` / `reset` désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu'OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s'appliquent à l'accessibilité CDP distante et
  `attachOnly` ainsi qu'aux requêtes d'ouverture d'onglet. Les profils loopback gérés
  conservent les valeurs par défaut CDP locales.
- Si un service CDP géré de manière externe est accessible via loopback, définissez
  `attachOnly: true` pour ce profil ; sinon OpenClaw traite le port loopback comme un
  profil de navigateur local géré et peut signaler des erreurs locales de propriété de port.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent se rattacher sur
  l'hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un
  profil de navigateur spécifique basé sur Chromium, tel que Brave ou Edge.
- Les profils `existing-session` conservent les limites actuelles de route Chrome MCP :
  actions pilotées par instantané / ref au lieu du ciblage par sélecteur CSS, hooks de téléversement à un seul fichier,
  aucune surcharge de délai d'expiration de dialogue, pas de `wait --load networkidle`, et aucune
  action `responsebody`, export PDF, interception de téléchargement ou action par lot.
- Les profils `openclaw` locaux gérés attribuent automatiquement `cdpPort` et `cdpUrl` ; définissez
  `cdpUrl` explicitement uniquement pour CDP distant.
- Les profils locaux gérés peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils locaux gérés utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP Chrome CDP
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour la
  disponibilité WebSocket CDP après lancement. Augmentez-les sur les hôtes plus lents où Chrome
  démarre correctement mais où les vérifications de disponibilité entrent en concurrence avec le démarrage.
  Les deux valeurs doivent être des entiers positifs jusqu'à `120000` ms ; les valeurs de configuration invalides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s'il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour le répertoire personnel de votre OS avant le lancement de Chromium.
  Le `userDataDir` par profil sur les profils `existing-session` est aussi développé avec le tilde.
- Service de contrôle : loopback uniquement (port dérivé de `gateway.port`, par défaut `18791`).
- `extraArgs` ajoute des drapeaux de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, dimensionnement de fenêtre ou drapeaux de débogage).

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

- `seamColor` : couleur d'accentuation pour le chrome de l'UI de l'application native (teinte de bulle du mode Talk, etc.).
- `assistant` : surcharge d'identité de l'UI de contrôle. Se replie sur l'identité de l'agent actif.

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

- `mode` : `local` (exécuter la gateway) ou `remote` (se connecter à une gateway distante). La gateway refuse de démarrer sauf si `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement) ou `custom`.
- **Anciens alias de bind** : utilisez les valeurs de mode bind dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), et non les alias d'hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Remarque Docker** : le bind `loopback` par défaut écoute sur `127.0.0.1` dans le conteneur. Avec le réseau bridge Docker (`-p 18789:18789`), le trafic arrive sur `eth0`, donc la gateway est injoignable. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les binds non loopback nécessitent l'authentification de la gateway. En pratique, cela signifie un jeton / mot de passe partagé ou un proxy inverse conscient de l'identité avec `gateway.auth.mode: "trusted-proxy"`. L'assistant d'onboarding génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRef), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d'installation / réparation de service échouent lorsque les deux sont configurés et que le mode n'est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour des configurations loopback locales de confiance ; ce mode n'est volontairement pas proposé par les invites d'onboarding.
- `gateway.auth.mode: "trusted-proxy"` : délègue l'authentification à un proxy inverse conscient de l'identité et fait confiance aux en-têtes d'identité provenant de `gateway.trustedProxies` (voir [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth)). Ce mode attend une source proxy **non loopback** ; les proxies inverses loopback sur le même hôte ne satisfont pas l'authentification trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque `true`, les en-têtes d'identité Tailscale Serve peuvent satisfaire l'authentification de l'UI de contrôle / WebSocket (vérifiée via `tailscale whois`). Les endpoints API HTTP n'utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent à la place le mode d'authentification HTTP normal de la gateway. Ce flux sans jeton suppose que l'hôte de la gateway est de confiance. La valeur par défaut est `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif des échecs d'authentification. S'applique par IP client et par portée d'authentification (secret partagé et jeton d'appareil sont suivis séparément). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone de l'UI de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l'écriture de l'échec. Des tentatives incorrectes concurrentes du même client peuvent donc déclencher le limiteur à la deuxième requête au lieu que les deux passent comme simples non-correspondances.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous souhaitez intentionnellement limiter aussi le trafic localhost (pour des configurations de test ou des déploiements proxy stricts).
- Les tentatives d'authentification WS d'origine navigateur sont toujours limitées avec l'exemption loopback désactivée (défense en profondeur contre la force brute localhost basée sur navigateur).
- Sur loopback, ces verrouillages d'origine navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne verrouillent pas automatiquement
  une origine différente.
- `tailscale.mode` : `serve` (tailnet uniquement, bind loopback) ou `funnel` (public, nécessite l'authentification).
- `controlUi.allowedOrigins` : liste d'autorisation explicite des origines navigateur pour les connexions WebSocket à la Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active le repli d'origine basé sur l'en-tête Host pour les déploiements qui s'appuient intentionnellement sur une politique d'origine basée sur l'en-tête Host.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : surcharge de dernier recours côté client via
  variable d'environnement du processus, qui autorise `ws://` en clair vers des IP
  de réseau privé de confiance ; par défaut, le texte en clair reste limité à loopback. Il n'existe pas d'équivalent
  dans `openclaw.json`, et la configuration réseau privé du navigateur telle que
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` n'affecte pas les clients
  WebSocket de la Gateway.
- `gateway.remote.token` / `.password` sont des champs d'identifiants client distants. Ils ne configurent pas à eux seuls l'authentification de la gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé par les builds iOS officiels / TestFlight après qu'ils ont publié des enregistrements adossés au relais vers la gateway. Cette URL doit correspondre à l'URL de relais compilée dans le build iOS.
- `gateway.push.apns.relay.timeoutMs` : délai d'expiration d'envoi gateway-vers-relais en millisecondes. La valeur par défaut est `10000`.
- Les enregistrements adossés au relais sont délégués à une identité de gateway spécifique. L'app iOS associée récupère `gateway.identity.get`, inclut cette identité dans l'enregistrement du relais, et transmet à la gateway une autorisation d'envoi à portée d'enregistrement. Une autre gateway ne peut pas réutiliser cet enregistrement stocké.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : surcharges temporaires par variable d'environnement pour la configuration du relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur de santé des canaux en minutes. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé. Par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète en minutes. Gardez-le supérieur ou égal à `gateway.channelHealthCheckMinutes`. Par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages du moniteur de santé par canal / compte sur une heure glissante. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : opt-out par canal pour les redémarrages du moniteur de santé tout en gardant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : surcharge par compte pour les canaux multi-comptes. Lorsqu'elle est définie, elle est prioritaire sur la surcharge au niveau du canal.
- Les chemins d'appel de gateway locale peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n'est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun repli distant ne masque cela).
- `trustedProxies` : IP des proxies inverses qui terminent TLS ou injectent des en-têtes client transférés. Ne listez que les proxies que vous contrôlez. Les entrées loopback restent valides pour des configurations de proxy sur le même hôte / détection locale (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback admissibles à `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque `true`, la gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut `false` pour un comportement en mode fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d'autorisation facultative CIDR/IP pour approuver automatiquement l'association initiale d'appareil nœud sans portées demandées. Cette fonctionnalité est désactivée lorsqu'elle n'est pas définie. Cela n'approuve pas automatiquement l'association opérateur / navigateur / UI de contrôle / WebChat, et cela n'approuve pas automatiquement les mises à niveau de rôle, de portée, de métadonnées ou de clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : mise en forme globale d'autorisation / refus pour les commandes de nœud déclarées après l'association et l'évaluation de la liste d'autorisation.
- `gateway.tools.deny` : noms d'outils supplémentaires bloqués pour HTTP `POST /tools/invoke` (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d'outils de la liste de refus HTTP par défaut.

</Accordion>

### Endpoints compatibles OpenAI

- Chat Completions : désactivé par défaut. Activez avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses : `gateway.http.endpoints.responses.enabled`.
- Renforcement des entrées URL Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d'autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération d'URL.
- En-tête facultatif de renforcement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instance

Exécutez plusieurs gateways sur un même hôte avec des ports et répertoires d'état uniques :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Drapeaux pratiques : `--dev` (utilise `~/.openclaw-dev` + port `19001`), `--profile <name>` (utilise `~/.openclaw-<name>`).

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

- `enabled` : active la terminaison TLS au niveau du listener de la gateway (HTTPS/WSS) (par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire locale certificat / clé auto-signée lorsque des fichiers explicites ne sont pas configurés ; pour usage local / développement uniquement.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez les permissions restreintes.
- `caPath` : chemin facultatif vers le bundle d'autorités de certification pour la vérification client ou des chaînes de confiance personnalisées.

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

- `mode` : contrôle la façon dont les modifications de configuration sont appliquées à l'exécution.
  - `"off"` : ignore les modifications en direct ; les changements nécessitent un redémarrage explicite.
  - `"restart"` : redémarre toujours le processus gateway lors d'un changement de configuration.
  - `"hot"` : applique les changements dans le processus sans redémarrage.
  - `"hybrid"` (par défaut) : essaie d'abord le rechargement à chaud ; se replie sur un redémarrage si nécessaire.
- `debounceMs` : fenêtre d'anti-rebond en ms avant l'application des modifications de configuration (entier non négatif).
- `deferralTimeoutMs` : durée maximale facultative en ms à attendre pour les opérations en cours avant de forcer un redémarrage. Omettez-la ou définissez `0` pour attendre indéfiniment et enregistrer des avertissements périodiques indiquant que des opérations sont toujours en attente.

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
Les jetons de hook dans la chaîne de requête sont rejetés.

Remarques sur la validation et la sécurité :

- `hooks.enabled=true` nécessite un `hooks.token` non vide.
- `hooks.token` doit être **distinct** de `gateway.auth.token` ; la réutilisation du jeton Gateway est rejetée.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié tel que `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, contraignez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si un mapping ou un preset utilise un `sessionKey` templatisé, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés statiques de mapping ne nécessitent pas cette activation.

**Endpoints :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` depuis la charge utile de la requête est accepté uniquement lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de mapping rendues par modèle sont traitées comme fournies de l'extérieur et nécessitent aussi `hooks.allowRequestSessionKey=true`.

<Accordion title="Détails du mapping">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles tels que `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS renvoyant une action de hook.
  - `transform.module` doit être un chemin relatif et rester dans `hooks.transformsDir` (les chemins absolus et la traversée sont rejetés).
- `agentId` route vers un agent spécifique ; les ids inconnus se replient sur la valeur par défaut.
- `allowedAgentIds` : restreint le routage explicite (`*` ou omis = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d'agent hook sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de mapping pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d'autorisation facultative de préfixes pour les valeurs explicites `sessionKey` (requête + mapping), par ex. `["hook:"]`. Elle devient obligatoire lorsqu'un mapping ou preset utilise un `sessionKey` templatisé.
- `deliver: true` envoie la réponse finale à un canal ; `channel` vaut par défaut `last`.
- `model` surcharge le LLM pour cette exécution de hook (doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le preset Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez ce routage par message, définissez `hooks.allowRequestSessionKey: true` et contraignez `hooks.allowedSessionKeyPrefixes` pour qu'ils correspondent à l'espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le preset par un `sessionKey` statique au lieu de la valeur par défaut templatisée.

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

- La Gateway démarre automatiquement `gog gmail watch serve` au démarrage lorsqu'il est configuré. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour le désactiver.
- N'exécutez pas un `gog gmail watch serve` séparé en parallèle de la Gateway.

---

## Hôte Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sert HTML/CSS/JS et A2UI modifiables par l'agent via HTTP sous le port Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : gardez `gateway.bind: "loopback"` (par défaut).
- Binds non loopback : les routes canvas nécessitent l'authentification Gateway (token/password/trusted-proxy), comme les autres surfaces HTTP Gateway.
- Les WebViews Node n'envoient généralement pas d'en-têtes d'authentification ; une fois qu'un nœud est associé et connecté, la Gateway annonce des URL de capacité à portée de nœud pour l'accès à canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du nœud et expirent rapidement. Le repli basé sur l'IP n'est pas utilisé.
- Injecte un client de live reload dans le HTML servi.
- Crée automatiquement un `index.html` de démarrage lorsqu'il est vide.
- Sert aussi A2UI à `/__openclaw__/a2ui/`.
- Les modifications nécessitent un redémarrage de la gateway.
- Désactivez le live reload pour les gros répertoires ou les erreurs `EMFILE`.

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
- Le nom d'hôte vaut par défaut `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte inter-réseaux, associez-la à un serveur DNS (CoreDNS recommandé) + DNS fractionné Tailscale.

Configuration : `openclaw dns setup --apply`.

---

## Environnement

### `env` (variables d'environnement inline)

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

- Les variables d'environnement inline ne sont appliquées que s'il manque la clé dans l'environnement du processus.
- Fichiers `.env` : `.env` du répertoire courant + `~/.openclaw/.env` (aucun ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis le profil de votre shell de connexion.
- Voir [Environnement](/fr/help/environment) pour l'ordre de priorité complet.

### Substitution de variables d'environnement

Référencez des variables d'environnement dans n'importe quelle chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`.
- Les variables manquantes / vides provoquent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour obtenir un littéral `${VAR}`.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secret sont additives : les valeurs en clair continuent de fonctionner.

### `SecretRef`

Utilisez une seule forme d'objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- motif `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- motif `id` pour `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- motif `id` pour `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- les `id` avec `source: "exec"` ne doivent pas contenir de segments de chemin `/` égaux à `.` ou `..` (par exemple `a/../b` est rejeté)

### Surface d'identifiants prise en charge

- Matrice canonique : [Surface d'identifiants SecretRef](/fr/reference/secretref-credential-surface)
- `secrets apply` cible les chemins d'identifiants pris en charge dans `openclaw.json`.
- Les références `auth-profiles.json` sont incluses dans la résolution à l'exécution et la couverture d'audit.

### Configuration des fournisseurs de secret

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
- Les chemins des fournisseurs file et exec échouent en mode fermé lorsque la vérification ACL Windows n'est pas disponible. Définissez `allowInsecurePath: true` uniquement pour des chemins de confiance qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande symlink sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins symlink tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification des répertoires de confiance s'applique au chemin cible résolu.
- L'environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables nécessaires avec `passEnv`.
- Les références de secret sont résolues au moment de l'activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement cet instantané.
- Le filtrage de surface active s'applique pendant l'activation : les références non résolues sur des surfaces activées font échouer le démarrage / rechargement, tandis que les surfaces inactives sont ignorées avec diagnostics.

---

## Stockage d'authentification

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
- `auth-profiles.json` prend en charge des références au niveau des valeurs (`keyRef` pour `api_key`, `tokenRef` pour `token`) pour les modes d'identifiants statiques.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d'authentification adossés à SecretRef.
- Les identifiants statiques à l'exécution proviennent d'instantanés résolus en mémoire ; les anciennes entrées statiques `auth.json` sont nettoyées lorsqu'elles sont découvertes.
- Importations OAuth héritées depuis `~/.openclaw/credentials/oauth.json`.
- Voir [OAuth](/fr/concepts/oauth).
- Comportement d'exécution des secrets et outils `audit/configure/apply` : [Gestion des secrets](/fr/gateway/secrets).

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

- `billingBackoffHours` : backoff de base en heures lorsqu'un profil échoue en raison de véritables
  erreurs de facturation / crédit insuffisant (par défaut : `5`). Un texte explicite de facturation peut
  toujours arriver ici même sur des réponses `401` / `403`, mais les
  correspondances de texte spécifiques au fournisseur restent limitées au fournisseur
  qui les possède (par exemple OpenRouter
  `Key limit exceeded`). Les messages réessayables HTTP `402` de fenêtre d'utilisation ou
  de limite de dépenses d'organisation / d'espace de travail restent dans le chemin `rate_limit`
  à la place.
- `billingBackoffHoursByProvider` : surcharges facultatives par fournisseur pour les heures de backoff de facturation.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du backoff de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : backoff de base en minutes pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du backoff `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de backoff (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profil d'authentification chez le même fournisseur pour les erreurs de surcharge avant de passer au repli de modèle (par défaut : `1`). Des formes de fournisseur occupé telles que `ModelNotReadyException` arrivent ici.
- `overloadedBackoffMs` : délai fixe avant nouvelle tentative d'une rotation fournisseur / profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profil d'authentification chez le même fournisseur pour les erreurs de limitation de débit avant de passer au repli de modèle (par défaut : `1`). Ce compartiment de limitation de débit inclut des textes façonnés par le fournisseur tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

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
- `maxFileBytes` : taille maximale du fichier journal actif en octets avant rotation (entier positif ; par défaut : `104857600` = 100 Mo). OpenClaw conserve jusqu'à cinq archives numérotées à côté du fichier actif.

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

- `enabled` : interrupteur maître pour la sortie d'instrumentation (par défaut : `true`).
- `flags` : tableau de chaînes de drapeaux activant une sortie de journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d'âge en ms pour émettre des avertissements de session bloquée pendant qu'une session reste à l'état de traitement.
- `otel.enabled` : active le pipeline d'export OpenTelemetry (par défaut : `false`). Pour la configuration complète, le catalogue des signaux et le modèle de confidentialité, voir [Export OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l'export OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : endpoints OTLP facultatifs spécifiques à chaque signal. Lorsqu'ils sont définis, ils remplacent `otel.endpoint` pour ce signal uniquement.
- `otel.protocol` : `"http/protobuf"` (par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d'export OTel.
- `otel.serviceName` : nom du service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : activer l'export des traces, métriques ou journaux.
- `otel.sampleRate` : taux d'échantillonnage des traces `0`–`1`.
- `otel.flushIntervalMs` : intervalle périodique de vidage de télémétrie en ms.
- `otel.captureContent` : capture opt-in de contenu brut pour les attributs de span OTEL. Désactivée par défaut. Le booléen `true` capture le contenu des messages / outils non système ; la forme objet permet d'activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` et `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : bascule d'environnement pour les derniers attributs expérimentaux du fournisseur de spans GenAI. Par défaut, les spans conservent l'ancien attribut `gen_ai.system` pour compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : bascule d'environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage / arrêt du SDK possédé par le Plugin tout en gardant les listeners de diagnostic actifs.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` et `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` : variables d'environnement d'endpoint spécifiques au signal utilisées lorsque la clé de configuration correspondante n'est pas définie.
- `cacheTrace.enabled` : journaliser des instantanés de trace de cache pour les exécutions embarquées (par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie pour le JSONL de trace de cache (par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôlent ce qui est inclus dans la sortie de trace de cache (tous par défaut à `true`).

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

- `channel` : canal de publication pour les installations npm / git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart` : vérifier les mises à jour npm au démarrage de la gateway (par défaut : `true`).
- `auto.enabled` : activer la mise à jour automatique en arrière-plan pour les installations de package (par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant application automatique sur le canal stable (par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire d'étalement du déploiement sur le canal stable en heures (par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence d'exécution des vérifications sur le canal bêta en heures (par défaut : `1` ; max : `24`).

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

- `enabled` : garde-fou global de fonctionnalité ACP (par défaut : `true` ; définissez `false` pour masquer les affordances de dispatch et de lancement ACP).
- `dispatch.enabled` : garde-fou indépendant pour le dispatch des tours de session ACP (par défaut : `true`). Définissez `false` pour garder les commandes ACP disponibles tout en bloquant l'exécution.
- `backend` : id par défaut du backend runtime ACP (doit correspondre à un Plugin runtime ACP enregistré).
  Si `plugins.allow` est défini, incluez l'id du Plugin backend (par exemple `acpx`) sinon le Plugin par défaut inclus ne sera pas chargé.
- `defaultAgent` : id de l'agent cible ACP de repli lorsque les lancements ne spécifient pas de cible explicite.
- `allowedAgents` : liste d'autorisation des ids d'agents autorisés pour les sessions runtime ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage après inactivité en ms pour le texte diffusé.
- `stream.maxChunkChars` : taille maximale d'un segment avant division de la projection de bloc diffusé.
- `stream.repeatSuppression` : supprime les lignes d'état / d'outil répétées par tour (par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse de manière incrémentale ; `"final_only"` met en mémoire tampon jusqu'aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après les événements d'outil cachés (par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie d'assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes projetées d'état / mise à jour ACP.
- `stream.tagVisibility` : enregistrement de noms de tags vers des surcharges booléennes de visibilité pour les événements diffusés.
- `runtime.ttlMinutes` : TTL d'inactivité en minutes pour les workers de session ACP avant éligibilité au nettoyage.
- `runtime.installCommand` : commande d'installation facultative à exécuter lors de l'amorçage d'un environnement runtime ACP.

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
  - `"random"` (par défaut) : slogans tournants drôles / saisonniers.
  - `"default"` : slogan neutre fixe (`All your chats, one OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre / la version de la bannière restent affichés).
- Pour masquer toute la bannière (et pas seulement les slogans), définissez la variable d'environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Métadonnées écrites par les flux de configuration guidée CLI (`onboard`, `configure`, `doctor`) :

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

Voir les champs d'identité `agents.list` sous [Valeurs par défaut des agents](/fr/gateway/config-agents#agent-defaults).

---

## Bridge (ancien, supprimé)

Les builds actuels n'incluent plus le bridge TCP. Les nœuds se connectent via le WebSocket Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu'elles ne sont pas supprimées ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration d'ancien bridge (référence historique)">

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

- `sessionRetention` : durée de conservation des sessions terminées d'exécution cron isolée avant élagage depuis `sessions.json`. Contrôle aussi le nettoyage des transcriptions cron supprimées archivées. Par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : taille max par fichier de journal d'exécution (`cron/runs/<jobId>.jsonl`) avant élagage. Par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes conservées lorsque l'élagage du journal d'exécution est déclenché. Par défaut : `2000`.
- `webhookToken` : jeton bearer utilisé pour la livraison POST Webhook cron (`delivery.mode = "webhook"`), si omis aucun en-tête d'authentification n'est envoyé.
- `webhook` : ancienne URL Webhook de repli obsolète (http/https) utilisée uniquement pour les tâches stockées qui ont encore `notify: true`.

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

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches à exécution unique sur erreurs transitoires (par défaut : `3` ; plage : `0`–`10`).
- `backoffMs` : tableau de délais de backoff en ms pour chaque tentative de nouvelle exécution (par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d'erreurs qui déclenchent des nouvelles tentatives — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

S'applique uniquement aux tâches cron à exécution unique. Les tâches récurrentes utilisent une gestion des échecs distincte.

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

- `enabled` : activer les alertes d'échec pour les tâches cron (par défaut : `false`).
- `after` : nombre d'échecs consécutifs avant déclenchement d'une alerte (entier positif, min : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre alertes répétées pour une même tâche (entier non négatif).
- `mode` : mode de livraison — `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : id de compte ou de canal facultatif pour cadrer la livraison des alertes.

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

- Destination par défaut pour les notifications d'échec cron sur l'ensemble des tâches.
- `mode` : `"announce"` ou `"webhook"` ; vaut par défaut `"announce"` lorsque suffisamment de données de cible existent.
- `channel` : surcharge du canal pour la livraison `announce`. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible explicite `announce` ou URL Webhook. Requis pour le mode Webhook.
- `accountId` : surcharge facultative du compte pour la livraison.
- `delivery.failureDestination` par tâche remplace cette valeur par défaut globale.
- Lorsqu'aucune destination d'échec globale ni par tâche n'est définie, les tâches qui livrent déjà via `announce` se replient sur cette cible principale `announce` en cas d'échec.
- `delivery.failureDestination` n'est pris en charge que pour les tâches `sessionTarget="isolated"` sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions cron isolées sont suivies comme [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle pour les médias

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans enveloppes d'historique / expéditeur) |
| `{{BodyStripped}}` | Corps avec les mentions de groupe supprimées      |
| `{{From}}`         | Identifiant de l'expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | Id du message du canal                            |
| `{{SessionId}}`    | UUID de la session actuelle                       |
| `{{IsNewSession}}` | `"true"` lorsqu'une nouvelle session est créée    |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite média résolue pour les entrées CLI         |
| `{{MaxChars}}`     | Nombre maximal de caractères résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (best effort)                     |
| `{{GroupMembers}}` | Aperçu des membres du groupe (best effort)        |
| `{{SenderName}}`   | Nom d'affichage de l'expéditeur (best effort)     |
| `{{SenderE164}}`   | Numéro de téléphone de l'expéditeur (best effort) |
| `{{Provider}}`     | Indice de fournisseur (whatsapp, telegram, discord, etc.) |

---

## Includes de configuration (`$include`)

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

- Fichier unique : remplace l'objet conteneur.
- Tableau de fichiers : fusion profonde dans l'ordre (les derniers remplacent les précédents).
- Clés sœurs : fusionnées après les includes (remplacent les valeurs incluses).
- Includes imbriqués : jusqu'à 10 niveaux de profondeur.
- Chemins : résolus relativement au fichier incluant, mais doivent rester à l'intérieur du répertoire de configuration de niveau supérieur (`dirname` de `openclaw.json`). Les formes absolues / `../` sont autorisées uniquement si elles se résolvent toujours à l'intérieur de cette limite.
- Les écritures gérées par OpenClaw qui modifient uniquement une seule section de niveau supérieur adossée à un include mono-fichier écrivent directement dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les includes racine, les tableaux d'include et les includes avec surcharges sœurs sont en lecture seule pour les écritures gérées par OpenClaw ; ces écritures échouent en mode fermé au lieu d'aplatir la configuration.
- Erreurs : messages clairs pour fichiers manquants, erreurs d'analyse et includes circulaires.

---

_Liens associés : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Liens associés

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
