---
read_when:
    - Vous avez besoin de la sémantique exacte de la configuration au niveau des champs ou des valeurs par défaut
    - Vous validez des blocs de configuration de canal, de modèle, de Gateway ou d’outil
summary: Référence de configuration du Gateway pour les clés principales d’OpenClaw, les valeurs par défaut et les liens vers les références dédiées des sous-systèmes
title: Référence de configuration
x-i18n:
    generated_at: "2026-04-30T07:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Référence de configuration principale pour `~/.openclaw/openclaw.json`. Pour une vue d’ensemble orientée tâche, consultez [Configuration](/fr/gateway/configuration).

Couvre les principales surfaces de configuration d’OpenClaw et renvoie vers d’autres pages lorsqu’un sous-système dispose de sa propre référence plus détaillée. Les catalogues de commandes appartenant aux canaux et aux plugins, ainsi que les réglages mémoire/QMD approfondis, se trouvent sur leurs propres pages plutôt qu’ici.

Vérité du code :

- `openclaw config schema` affiche le JSON Schema actif utilisé pour la validation et la Control UI, avec les métadonnées intégrées des plugins/canaux fusionnées lorsqu’elles sont disponibles
- `config.schema.lookup` renvoie un nœud de schéma limité à un chemin pour les outils d’exploration détaillée
- `pnpm config:docs:check` / `pnpm config:docs:gen` valident le hachage de référence de la documentation de configuration par rapport à la surface de schéma actuelle

Chemin de recherche d’agent : utilisez l’action d’outil `gateway` `config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs avant les modifications. Utilisez [Configuration](/fr/gateway/configuration) pour des conseils orientés tâche et cette page pour la carte plus large des champs, les valeurs par défaut et les liens vers les références des sous-systèmes.

Références détaillées dédiées :

- [Référence de configuration de la mémoire](/fr/reference/memory-config) pour `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` et la configuration de dreaming sous `plugins.entries.memory-core.config.dreaming`
- [Commandes slash](/fr/tools/slash-commands) pour le catalogue actuel des commandes intégrées + groupées
- pages des canaux/plugins propriétaires pour les surfaces de commandes propres aux canaux

Le format de configuration est **JSON5** (commentaires + virgules finales autorisés). Tous les champs sont facultatifs — OpenClaw utilise des valeurs par défaut sûres lorsqu’ils sont omis.

---

## Canaux

Les clés de configuration par canal ont été déplacées vers une page dédiée — consultez [Configuration — canaux](/fr/gateway/config-channels) pour `channels.*`, y compris Slack, Discord, Telegram, WhatsApp, Matrix, iMessage et les autres canaux groupés (authentification, contrôle d’accès, comptes multiples, filtrage des mentions).

## Valeurs par défaut des agents, multi-agent, sessions et messages

Déplacé vers une page dédiée — consultez [Configuration — agents](/fr/gateway/config-agents) pour :

- `agents.defaults.*` (espace de travail, modèle, réflexion, heartbeat, mémoire, médias, skills, sandbox)
- `multiAgent.*` (routage multi-agent et liaisons)
- `session.*` (cycle de vie des sessions, compaction, élagage)
- `messages.*` (distribution des messages, TTS, rendu Markdown)
- `talk.*` (mode Talk)
  - `talk.speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur iOS/macOS
  - `talk.silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant l’envoi de la transcription (`700 ms on macOS and Android, 900 ms on iOS`)

## Outils et fournisseurs personnalisés

La politique d’outils, les options expérimentales, la configuration d’outils adossée aux fournisseurs et la configuration de fournisseur / URL de base personnalisée ont été déplacées vers une page dédiée — consultez [Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Modèles

Les définitions de fournisseurs, les listes d’autorisation de modèles et la configuration de fournisseurs personnalisés se trouvent dans [Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls). La racine `models` possède également le comportement global du catalogue de modèles.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode` : comportement du catalogue de fournisseurs (`merge` ou `replace`).
- `models.providers` : carte des fournisseurs personnalisés indexée par identifiant de fournisseur.
- `models.pricing.enabled` : contrôle l’amorçage de tarification en arrière-plan. Lorsqu’il vaut `false`, le démarrage du Gateway ignore les récupérations des catalogues de tarification OpenRouter et LiteLLM ; les valeurs configurées dans `models.providers.*.models[].cost` continuent de fonctionner pour les estimations de coût locales.

## MCP

Les définitions de serveurs MCP gérées par OpenClaw se trouvent sous `mcp.servers` et sont consommées par Pi intégré et d’autres adaptateurs d’exécution. Les commandes `openclaw mcp list`, `show`, `set` et `unset` gèrent ce bloc sans se connecter au serveur cible pendant les modifications de configuration.

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

- `mcp.servers` : définitions nommées de serveurs MCP stdio ou distants pour les environnements d’exécution qui exposent les outils MCP configurés. Les entrées distantes utilisent `transport: "streamable-http"` ou `transport: "sse"` ; `type: "http"` est un alias natif de la CLI que `openclaw mcp set` et `openclaw doctor --fix` normalisent vers le champ canonique `transport`.
- `mcp.sessionIdleTtlMs` : TTL d’inactivité pour les environnements d’exécution MCP groupés limités à une session. Les exécutions intégrées ponctuelles demandent un nettoyage en fin d’exécution ; ce TTL sert de filet de sécurité pour les sessions de longue durée et les futurs appelants.
- Les modifications sous `mcp.*` s’appliquent à chaud en disposant les environnements d’exécution MCP de session mis en cache. La prochaine découverte/utilisation d’outil les recrée à partir de la nouvelle configuration, de sorte que les entrées `mcp.servers` supprimées sont récoltées immédiatement au lieu d’attendre le TTL d’inactivité.

Consultez [MCP](/fr/cli/mcp#openclaw-as-an-mcp-client-registry) et [Backends CLI](/fr/gateway/cli-backends#bundle-mcp-overlays) pour le comportement d’exécution.

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

- `allowBundled` : liste d’autorisation facultative pour les Skills groupés uniquement (les Skills gérés/de l’espace de travail ne sont pas affectés).
- `load.extraDirs` : racines de Skills partagées supplémentaires (priorité la plus basse).
- `install.preferBrew` : lorsque vrai, privilégie les installateurs Homebrew lorsque `brew` est disponible avant de revenir aux autres types d’installateurs.
- `install.nodeManager` : préférence d’installateur node pour les spécifications `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` désactive une Skill même si elle est groupée/installée.
- `entries.<skillKey>.apiKey` : commodité pour les Skills déclarant une variable d’environnement principale (chaîne en clair ou objet SecretRef).

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
- La découverte accepte les plugins OpenClaw natifs ainsi que les bundles Codex compatibles et les bundles Claude, y compris les bundles Claude sans manifeste utilisant la disposition par défaut.
- **Les modifications de configuration nécessitent un redémarrage du gateway.**
- `allow` : liste d’autorisation facultative (seuls les plugins listés sont chargés). `deny` l’emporte.
- `plugins.entries.<id>.apiKey` : champ de commodité pour clé d’API au niveau du plugin (lorsqu’il est pris en charge par le plugin).
- `plugins.entries.<id>.env` : carte de variables d’environnement limitée au plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection` : lorsque `false`, le cœur bloque `before_prompt_build` et ignore les champs modifiant le prompt issus de l’ancien `before_agent_start`, tout en préservant les anciens `modelOverride` et `providerOverride`. S’applique aux hooks de plugins natifs et aux répertoires de hooks fournis par des bundles pris en charge.
- `plugins.entries.<id>.hooks.allowConversationAccess` : lorsque `true`, les plugins non groupés de confiance peuvent lire le contenu brut de conversation depuis des hooks typés tels que `llm_input`, `llm_output`, `before_agent_finalize` et `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride` : fait explicitement confiance à ce plugin pour demander des remplacements `provider` et `model` par exécution pour les exécutions de sous-agents en arrière-plan.
- `plugins.entries.<id>.subagent.allowedModels` : liste d’autorisation facultative de cibles canoniques `provider/model` pour les remplacements de sous-agent de confiance. Utilisez `"*"` uniquement lorsque vous voulez intentionnellement autoriser n’importe quel modèle.
- `plugins.entries.<id>.config` : objet de configuration défini par le plugin (validé par le schéma de plugin OpenClaw natif lorsqu’il est disponible).
- Les paramètres de compte/d’exécution des plugins de canal se trouvent sous `channels.<id>` et doivent être décrits par les métadonnées `channelConfigs` du manifeste du plugin propriétaire, et non par un registre central d’options OpenClaw.
- `plugins.entries.firecrawl.config.webFetch` : paramètres du fournisseur web-fetch Firecrawl.
  - `apiKey` : clé d’API Firecrawl (accepte SecretRef). Revient à `plugins.entries.firecrawl.config.webSearch.apiKey`, à l’ancien `tools.web.fetch.firecrawl.apiKey` ou à la variable d’environnement `FIRECRAWL_API_KEY`.
  - `baseUrl` : URL de base de l’API Firecrawl (par défaut : `https://api.firecrawl.dev`).
  - `onlyMainContent` : extrait uniquement le contenu principal des pages (par défaut : `true`).
  - `maxAgeMs` : âge maximal du cache en millisecondes (par défaut : `172800000` / 2 jours).
  - `timeoutSeconds` : délai d’expiration de la requête de scraping en secondes (par défaut : `60`).
- `plugins.entries.xai.config.xSearch` : paramètres xAI X Search (recherche web Grok).
  - `enabled` : active le fournisseur X Search.
  - `model` : modèle Grok à utiliser pour la recherche (par ex. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming` : paramètres de dreaming mémoire. Consultez [Dreaming](/fr/concepts/dreaming) pour les phases et les seuils.
  - `enabled` : interrupteur principal du dreaming (par défaut `false`).
  - `frequency` : cadence cron de chaque balayage complet de dreaming (`"0 3 * * *"` par défaut).
  - `model` : remplacement facultatif du modèle de sous-agent Dream Diary. Nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true` ; à associer avec `allowedModels` pour restreindre les cibles. Les erreurs de modèle indisponible réessaient une fois avec le modèle par défaut de la session ; les échecs de confiance ou de liste d’autorisation ne basculent pas silencieusement.
  - la politique de phase et les seuils sont des détails d’implémentation (pas des clés de configuration exposées à l’utilisateur).
- La configuration complète de la mémoire se trouve dans [Référence de configuration de la mémoire](/fr/reference/memory-config) :
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Les plugins de bundle Claude activés peuvent également fournir des valeurs par défaut Pi intégrées depuis `settings.json` ; OpenClaw les applique comme paramètres d’agent assainis, et non comme correctifs bruts de configuration OpenClaw.
- `plugins.slots.memory` : choisissez l’identifiant du plugin de mémoire actif, ou `"none"` pour désactiver les plugins de mémoire.
- `plugins.slots.contextEngine` : choisissez l’identifiant du plugin de moteur de contexte actif ; vaut par défaut `"legacy"` sauf si vous installez et sélectionnez un autre moteur.

Consultez [Plugins](/fr/tools/plugin).

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
- `tabCleanup` récupère les onglets suivis de l’agent principal après une période d’inactivité ou lorsqu’une
  session dépasse son plafond. Définissez `idleMinutes: 0` ou `maxTabsPerSession: 0` pour
  désactiver ces modes de nettoyage individuellement.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé lorsqu’il n’est pas défini ; la navigation du navigateur reste donc stricte par défaut.
- Définissez `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` uniquement lorsque vous faites intentionnellement confiance à la navigation du navigateur sur le réseau privé.
- En mode strict, les points de terminaison de profils CDP distants (`profiles.*.cdpUrl`) sont soumis au même blocage des réseaux privés lors des vérifications d’accessibilité/de découverte.
- `ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.
- En mode strict, utilisez `ssrfPolicy.hostnameAllowlist` et `ssrfPolicy.allowedHostnames` pour les exceptions explicites.
- Les profils distants sont en attachement uniquement (démarrage/arrêt/réinitialisation désactivés).
- `profiles.*.cdpUrl` accepte `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version` ; utilisez WS(S)
  lorsque votre fournisseur vous donne une URL WebSocket DevTools directe.
- `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs` s’appliquent à l’accessibilité CDP distante et
  `attachOnly`, ainsi qu’aux requêtes d’ouverture d’onglet. Les profils local loopback
  gérés conservent les valeurs CDP locales par défaut.
- Si un service CDP géré en externe est accessible via local loopback, définissez
  `attachOnly: true` pour ce profil ; sinon, OpenClaw traite le port local loopback comme un
  profil de navigateur local géré et peut signaler des erreurs de propriété du port local.
- Les profils `existing-session` utilisent Chrome MCP au lieu de CDP et peuvent s’attacher sur
  l’hôte sélectionné ou via un nœud de navigateur connecté.
- Les profils `existing-session` peuvent définir `userDataDir` pour cibler un profil de navigateur
  basé sur Chromium spécifique, tel que Brave ou Edge.
- Les profils `existing-session` conservent les limites actuelles de routage Chrome MCP :
  actions pilotées par snapshot/référence au lieu d’un ciblage par sélecteur CSS, hooks d’envoi
  d’un seul fichier, aucune substitution de délai d’expiration des dialogues, pas de
  `wait --load networkidle`, ni de `responsebody`, d’export PDF, d’interception des téléchargements ou d’actions par lot.
- Les profils locaux gérés `openclaw` attribuent automatiquement `cdpPort` et `cdpUrl` ; ne
  définissez explicitement `cdpUrl` que pour le CDP distant.
- Les profils locaux gérés peuvent définir `executablePath` pour remplacer le
  `browser.executablePath` global pour ce profil. Utilisez cela pour exécuter un profil dans
  Chrome et un autre dans Brave.
- Les profils locaux gérés utilisent `browser.localLaunchTimeoutMs` pour la découverte HTTP CDP de Chrome
  après le démarrage du processus et `browser.localCdpReadyTimeoutMs` pour la disponibilité du
  websocket CDP après lancement. Augmentez-les sur les hôtes plus lents où Chrome
  démarre correctement mais où les vérifications de disponibilité se produisent trop tôt. Les deux valeurs doivent être
  des entiers positifs jusqu’à `120000` ms ; les valeurs de configuration non valides sont rejetées.
- Ordre de détection automatique : navigateur par défaut s’il est basé sur Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` et `browser.profiles.<name>.executablePath` acceptent tous deux
  `~` et `~/...` pour le répertoire personnel de votre système d’exploitation avant le lancement de Chromium.
  Le `userDataDir` par profil des profils `existing-session` est également développé depuis le tilde.
- Service de contrôle : local loopback uniquement (port dérivé de `gateway.port`, `18791` par défaut).
- `extraArgs` ajoute des indicateurs de lancement supplémentaires au démarrage local de Chromium (par exemple
  `--disable-gpu`, le dimensionnement de fenêtre ou des indicateurs de débogage).

---

## Interface utilisateur

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

- `seamColor` : couleur d’accentuation du chrome de l’interface utilisateur de l’application native (teinte de bulle du mode Conversation, etc.).
- `assistant` : remplacement de l’identité de l’interface utilisateur de contrôle. Se rabat sur l’identité de l’agent actif.

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

<Accordion title="Détails des champs du Gateway">

- `mode` : `local` (exécuter le Gateway) ou `remote` (se connecter à un Gateway distant). Le Gateway refuse de démarrer sauf si la valeur est `local`.
- `port` : port multiplexé unique pour WS + HTTP. Priorité : `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind` : `auto`, `loopback` (par défaut), `lan` (`0.0.0.0`), `tailnet` (IP Tailscale uniquement) ou `custom`.
- **Alias de liaison hérités** : utilisez les valeurs de mode de liaison dans `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), pas les alias d’hôte (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Note Docker** : la liaison `loopback` par défaut écoute sur `127.0.0.1` dans le conteneur. Avec le réseau Docker en mode bridge (`-p 18789:18789`), le trafic arrive sur `eth0`, donc le Gateway est inaccessible. Utilisez `--network host`, ou définissez `bind: "lan"` (ou `bind: "custom"` avec `customBindHost: "0.0.0.0"`) pour écouter sur toutes les interfaces.
- **Authentification** : requise par défaut. Les liaisons non-loopback exigent l’authentification du Gateway. En pratique, cela signifie un jeton/mot de passe partagé ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`. L’assistant d’intégration génère un jeton par défaut.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris via SecretRefs), définissez explicitement `gateway.auth.mode` sur `token` ou `password`. Les flux de démarrage et d’installation/réparation de service échouent lorsque les deux sont configurés et que le mode n’est pas défini.
- `gateway.auth.mode: "none"` : mode explicite sans authentification. À utiliser uniquement pour les configurations local loopback fiables ; il n’est volontairement pas proposé par les invites d’intégration.
- `gateway.auth.mode: "trusted-proxy"` : déléguez l’authentification navigateur/utilisateur à un proxy inverse sensible à l’identité et faites confiance aux en-têtes d’identité provenant de `gateway.trustedProxies` (voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)). Ce mode attend par défaut une source de proxy **non-loopback** ; les proxys inverses loopback sur le même hôte exigent `gateway.auth.trustedProxy.allowLoopback = true` explicite. Les appelants internes sur le même hôte peuvent utiliser `gateway.auth.password` comme solution de repli locale directe ; `gateway.auth.token` reste mutuellement exclusif avec le mode trusted-proxy.
- `gateway.auth.allowTailscale` : lorsque la valeur est `true`, les en-têtes d’identité Tailscale Serve peuvent satisfaire l’authentification de l’interface de contrôle/WebSocket (vérifiée via `tailscale whois`). Les points de terminaison d’API HTTP n’utilisent **pas** cette authentification par en-tête Tailscale ; ils suivent plutôt le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est fiable. Valeur par défaut : `true` lorsque `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit` : limiteur facultatif d’échecs d’authentification. S’applique par IP cliente et par périmètre d’authentification (shared-secret et device-token sont suivis indépendamment). Les tentatives bloquées renvoient `429` + `Retry-After`.
  - Sur le chemin asynchrone de l’interface de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, clientIp}` sont sérialisées avant l’écriture de l’échec. Des tentatives incorrectes simultanées depuis le même client peuvent donc déclencher le limiteur dès la deuxième requête au lieu de passer toutes deux comme de simples non-correspondances.
  - `gateway.auth.rateLimit.exemptLoopback` vaut `true` par défaut ; définissez `false` lorsque vous souhaitez intentionnellement limiter aussi le trafic localhost (pour les configurations de test ou les déploiements proxy stricts).
- Les tentatives d’authentification WS depuis une origine navigateur sont toujours limitées avec l’exemption loopback désactivée (défense en profondeur contre la force brute localhost depuis un navigateur).
- Sur loopback, ces verrouillages d’origine navigateur sont isolés par valeur `Origin`
  normalisée, de sorte que des échecs répétés depuis une origine localhost ne
  verrouillent pas automatiquement une autre origine.
- `tailscale.mode` : `serve` (tailnet uniquement, liaison loopback) ou `funnel` (public, exige une authentification).
- `controlUi.allowedOrigins` : liste d’autorisation explicite d’origines navigateur pour les connexions WebSocket du Gateway. Requise lorsque des clients navigateur sont attendus depuis des origines non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback` : mode dangereux qui active la solution de repli d’origine par en-tête Host pour les déploiements qui s’appuient intentionnellement sur une politique d’origine basée sur l’en-tête Host.
- `remote.transport` : `ssh` (par défaut) ou `direct` (ws/wss). Pour `direct`, `remote.url` doit être `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` : contournement d’urgence côté client via l’environnement de processus
  qui autorise `ws://` en clair vers des IPs de réseau privé fiables ; la valeur
  par défaut reste limitée au loopback pour le texte en clair. Il n’existe pas
  d’équivalent `openclaw.json`, et la configuration réseau privé du navigateur
  comme `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` n’affecte pas les
  clients WebSocket du Gateway.
- `gateway.remote.token` / `.password` sont des champs d’identifiants de client distant. Ils ne configurent pas à eux seuls l’authentification du Gateway.
- `gateway.push.apns.relay.baseUrl` : URL HTTPS de base du relais APNs externe utilisé par les builds iOS officiels/TestFlight après publication d’inscriptions adossées au relais auprès du Gateway. Cette URL doit correspondre à l’URL de relais compilée dans le build iOS.
- `gateway.push.apns.relay.timeoutMs` : délai d’expiration d’envoi du Gateway vers le relais, en millisecondes. Valeur par défaut : `10000`.
- Les inscriptions adossées au relais sont déléguées à une identité de Gateway spécifique. L’app iOS appairée récupère `gateway.identity.get`, inclut cette identité dans l’inscription au relais et transfère au Gateway une autorisation d’envoi limitée à cette inscription. Un autre Gateway ne peut pas réutiliser cette inscription stockée.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS` : substitutions d’environnement temporaires pour la configuration de relais ci-dessus.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` : échappatoire réservée au développement pour les URL de relais HTTP loopback. Les URL de relais de production doivent rester en HTTPS.
- `gateway.handshakeTimeoutMs` : délai d’expiration de la négociation WebSocket du Gateway avant authentification, en millisecondes. Valeur par défaut : `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` prend le dessus lorsqu’il est défini. Augmentez cette valeur sur les hôtes chargés ou peu puissants où les clients locaux peuvent se connecter pendant que le préchauffage du démarrage est encore en cours de stabilisation.
- `gateway.channelHealthCheckMinutes` : intervalle du moniteur de santé des canaux, en minutes. Définissez `0` pour désactiver globalement les redémarrages par moniteur de santé. Valeur par défaut : `5`.
- `gateway.channelStaleEventThresholdMinutes` : seuil de socket obsolète, en minutes. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`. Valeur par défaut : `30`.
- `gateway.channelMaxRestartsPerHour` : nombre maximal de redémarrages par moniteur de santé par canal/compte sur une heure glissante. Valeur par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactivation par canal des redémarrages par moniteur de santé tout en gardant le moniteur global activé.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : substitution par compte pour les canaux multi-comptes. Lorsqu’elle est définie, elle prend le pas sur la substitution au niveau du canal.
- Les chemins d’appel du Gateway local peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue de manière fermée (sans masquage par solution de repli distante).
- `trustedProxies` : IPs de proxys inverses qui terminent TLS ou injectent des en-têtes de client transféré. Ne listez que des proxys que vous contrôlez. Les entrées loopback restent valides pour les configurations proxy/détection locale sur le même hôte (par exemple Tailscale Serve ou un proxy inverse local), mais elles ne rendent **pas** les requêtes loopback admissibles pour `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback` : lorsque la valeur est `true`, le Gateway accepte `X-Real-IP` si `X-Forwarded-For` est absent. Valeur par défaut : `false`, pour un comportement d’échec fermé.
- `gateway.nodes.pairing.autoApproveCidrs` : liste d’autorisation CIDR/IP facultative pour approuver automatiquement le premier appairage de périphérique Node sans périmètres demandés. Elle est désactivée lorsqu’elle n’est pas définie. Cela n’approuve pas automatiquement l’appairage opérateur/navigateur/interface de contrôle/WebChat, ni les mises à niveau de rôle, périmètre, métadonnées ou clé publique.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands` : modelage global autoriser/refuser pour les commandes Node déclarées après l’appairage et l’évaluation de la liste d’autorisation de plateforme. Utilisez `allowCommands` pour accepter des commandes Node dangereuses comme `camera.snap`, `camera.clip` et `screen.record` ; `denyCommands` retire une commande même si une valeur par défaut de plateforme ou une autorisation explicite l’inclurait autrement. Après qu’un Node modifie sa liste de commandes déclarées, rejetez puis réapprouvez l’appairage de ce périphérique afin que le Gateway stocke l’instantané de commandes mis à jour.
- `gateway.tools.deny` : noms d’outils supplémentaires bloqués pour HTTP `POST /tools/invoke` (étend la liste de refus par défaut).
- `gateway.tools.allow` : retire des noms d’outils de la liste de refus HTTP par défaut.

</Accordion>

### Points de terminaison compatibles OpenAI

- Chat Completions : désactivé par défaut. Activez avec `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API : `gateway.http.endpoints.responses.enabled`.
- Durcissement des entrées URL de Responses :
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Les listes d’autorisation vides sont traitées comme non définies ; utilisez `gateway.http.endpoints.responses.files.allowUrl=false`
    et/ou `gateway.http.endpoints.responses.images.allowUrl=false` pour désactiver la récupération d’URL.
- En-tête facultatif de durcissement des réponses :
  - `gateway.http.securityHeaders.strictTransportSecurity` (à définir uniquement pour les origines HTTPS que vous contrôlez ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation multi-instance

Exécutez plusieurs Gateways sur un même hôte avec des ports et des répertoires d’état uniques :

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

- `enabled` : active la terminaison TLS sur l’écouteur du Gateway (HTTPS/WSS) (valeur par défaut : `false`).
- `autoGenerate` : génère automatiquement une paire certificat/clé auto-signée locale lorsque des fichiers explicites ne sont pas configurés ; pour une utilisation locale/dev uniquement.
- `certPath` : chemin du système de fichiers vers le fichier de certificat TLS.
- `keyPath` : chemin du système de fichiers vers le fichier de clé privée TLS ; gardez des permissions restreintes.
- `caPath` : chemin facultatif du bundle d’AC pour la vérification client ou les chaînes de confiance personnalisées.

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
  - `"off"` : ignore les modifications en direct ; les changements exigent un redémarrage explicite.
  - `"restart"` : redémarre toujours le processus Gateway lors d’un changement de configuration.
  - `"hot"` : applique les changements dans le processus sans redémarrage.
  - `"hybrid"` (par défaut) : tente d’abord le rechargement à chaud ; revient au redémarrage si nécessaire.
- `debounceMs` : fenêtre d’anti-rebond en ms avant l’application des changements de configuration (entier non négatif).
- `deferralTimeoutMs` : durée maximale facultative en ms à attendre pour les opérations en cours avant de forcer un redémarrage. Omettez-la pour utiliser l’attente bornée par défaut (`300000`) ; définissez `0` pour attendre indéfiniment et journaliser périodiquement les avertissements encore en attente.

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
- `hooks.token` doit être **distinct** de `gateway.auth.token` ; la réutilisation du jeton du Gateway est refusée.
- `hooks.path` ne peut pas être `/` ; utilisez un sous-chemin dédié comme `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, limitez `hooks.allowedSessionKeyPrefixes` (par exemple `["hook:"]`).
- Si une correspondance ou un préréglage utilise un `sessionKey` basé sur un modèle, définissez `hooks.allowedSessionKeyPrefixes` et `hooks.allowRequestSessionKey=true`. Les clés de correspondance statiques ne nécessitent pas cette activation explicite.

**Points de terminaison :**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` depuis la charge utile de la requête n’est accepté que lorsque `hooks.allowRequestSessionKey=true` (par défaut : `false`).
- `POST /hooks/<name>` → résolu via `hooks.mappings`
  - Les valeurs `sessionKey` de correspondance rendues par modèle sont traitées comme fournies depuis l’extérieur et nécessitent aussi `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` correspond au sous-chemin après `/hooks` (par ex. `/hooks/gmail` → `gmail`).
- `match.source` correspond à un champ de charge utile pour les chemins génériques.
- Les modèles comme `{{messages[0].subject}}` lisent depuis la charge utile.
- `transform` peut pointer vers un module JS/TS qui renvoie une action de hook.
  - `transform.module` doit être un chemin relatif et reste dans `hooks.transformsDir` (les chemins absolus et les traversées sont refusés).
- `agentId` achemine vers un agent spécifique ; les identifiants inconnus reviennent à la valeur par défaut.
- `allowedAgentIds` : limite l’acheminement explicite (`*` ou omis = tout autoriser, `[]` = tout refuser).
- `defaultSessionKey` : clé de session fixe facultative pour les exécutions d’agent par hook sans `sessionKey` explicite.
- `allowRequestSessionKey` : autorise les appelants de `/hooks/agent` et les clés de session de correspondance pilotées par modèle à définir `sessionKey` (par défaut : `false`).
- `allowedSessionKeyPrefixes` : liste d’autorisation facultative de préfixes pour les valeurs `sessionKey` explicites (requête + correspondance), par ex. `["hook:"]`. Elle devient obligatoire lorsqu’une correspondance ou un préréglage utilise un `sessionKey` basé sur un modèle.
- `deliver: true` envoie la réponse finale à un canal ; `channel` utilise `last` par défaut.
- `model` remplace le LLM pour cette exécution de hook (il doit être autorisé si le catalogue de modèles est défini).

</Accordion>

### Intégration Gmail

- Le préréglage Gmail intégré utilise `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si vous conservez cet acheminement par message, définissez `hooks.allowRequestSessionKey: true` et limitez `hooks.allowedSessionKeyPrefixes` pour correspondre à l’espace de noms Gmail, par exemple `["hook:", "hook:gmail:"]`.
- Si vous avez besoin de `hooks.allowRequestSessionKey: false`, remplacez le préréglage par un `sessionKey` statique au lieu de la valeur par défaut basée sur un modèle.

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

- Sert le HTML/CSS/JS modifiable par l’agent et A2UI via HTTP sous le port du Gateway :
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Local uniquement : conservez `gateway.bind: "loopback"` (par défaut).
- Liaisons non-loopback : les routes canvas nécessitent l’authentification Gateway (jeton/mot de passe/proxy de confiance), comme les autres surfaces HTTP du Gateway.
- Les WebViews Node n’envoient généralement pas d’en-têtes d’authentification ; après qu’un nœud est appairé et connecté, le Gateway annonce des URL de capacité limitées au nœud pour l’accès canvas/A2UI.
- Les URL de capacité sont liées à la session WS active du nœud et expirent rapidement. Le repli basé sur l’IP n’est pas utilisé.
- Injecte le client de rechargement en direct dans le HTML servi.
- Crée automatiquement un `index.html` de démarrage lorsqu’il est vide.
- Sert également A2UI à `/__openclaw__/a2ui/`.
- Les modifications nécessitent un redémarrage du gateway.
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

- `minimal` (par défaut) : omet `cliPath` + `sshPort` des enregistrements TXT.
- `full` : inclut `cliPath` + `sshPort`.
- Le nom d’hôte utilise par défaut le nom d’hôte système lorsqu’il s’agit d’une étiquette DNS valide, avec repli sur `openclaw`. Remplacez-le avec `OPENCLAW_MDNS_HOSTNAME`.

### Zone étendue (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Écrit une zone DNS-SD unicast sous `~/.openclaw/dns/`. Pour la découverte interréseau, associez-la à un serveur DNS (CoreDNS recommandé) + Tailscale split DNS.

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

- Les variables d’environnement intégrées ne sont appliquées que si l’environnement du processus ne contient pas la clé.
- Fichiers `.env` : `.env` du CWD + `~/.openclaw/.env` (aucun des deux ne remplace les variables existantes).
- `shellEnv` : importe les clés attendues manquantes depuis votre profil de shell de connexion.
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
- Les variables manquantes/vides provoquent une erreur au chargement de la configuration.
- Échappez avec `$${VAR}` pour obtenir un `${VAR}` littéral.
- Fonctionne avec `$include`.

---

## Secrets

Les références de secret sont additives : les valeurs en texte brut fonctionnent toujours.

### `SecretRef`

Utilisez une forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validation :

- Motif `provider` : `^[a-z][a-z0-9_-]{0,63}$`
- Motif d’id `source: "env"` : `^[A-Z][A-Z0-9_]{0,127}$`
- Id `source: "file"` : pointeur JSON absolu (par exemple `"/providers/openai/apiKey"`)
- Motif d’id `source: "exec"` : `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
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
- Les chemins des fournisseurs file et exec échouent en mode fermé lorsque la vérification des ACL Windows n’est pas disponible. Définissez `allowInsecurePath: true` uniquement pour des chemins fiables qui ne peuvent pas être vérifiés.
- Le fournisseur `exec` nécessite un chemin `command` absolu et utilise des charges utiles de protocole sur stdin/stdout.
- Par défaut, les chemins de commande de lien symbolique sont rejetés. Définissez `allowSymlinkCommand: true` pour autoriser les chemins de lien symbolique tout en validant le chemin cible résolu.
- Si `trustedDirs` est configuré, la vérification du répertoire fiable s’applique au chemin cible résolu.
- L’environnement enfant `exec` est minimal par défaut ; transmettez explicitement les variables requises avec `passEnv`.
- Les références de secret sont résolues au moment de l’activation dans un instantané en mémoire, puis les chemins de requête lisent uniquement l’instantané.
- Le filtrage de surface active s’applique pendant l’activation : les références non résolues sur les surfaces activées font échouer le démarrage/rechargement, tandis que les surfaces inactives sont ignorées avec des diagnostics.

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
- Les mappages plats hérités `auth-profiles.json` tels que `{ "provider": { "apiKey": "..." } }` ne sont pas un format d’exécution ; `openclaw doctor --fix` les réécrit en profils de clés API canoniques `provider:default` avec une sauvegarde `.legacy-flat.*.bak`.
- Les profils en mode OAuth (`auth.profiles.<id>.mode = "oauth"`) ne prennent pas en charge les identifiants de profil d’authentification adossés à SecretRef.
- Les identifiants statiques d’exécution proviennent d’instantanés résolus en mémoire ; les entrées statiques héritées `auth.json` sont nettoyées lorsqu’elles sont découvertes.
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

- `billingBackoffHours` : délai de base en heures lorsqu’un profil échoue à cause de véritables erreurs de facturation/crédit insuffisant (par défaut : `5`). Le texte de facturation explicite peut toujours arriver ici même sur des réponses `401`/`403`, mais les correspondances de texte propres au fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Les messages HTTP `402` réessayables de fenêtre d’utilisation ou de limite de dépenses d’organisation/espace de travail restent plutôt dans le chemin `rate_limit`.
- `billingBackoffHoursByProvider` : remplacements facultatifs par fournisseur pour les heures de délai de facturation.
- `billingMaxHours` : plafond en heures pour la croissance exponentielle du délai de facturation (par défaut : `24`).
- `authPermanentBackoffMinutes` : délai de base en minutes pour les échecs `auth_permanent` à forte confiance (par défaut : `10`).
- `authPermanentMaxMinutes` : plafond en minutes pour la croissance du délai `auth_permanent` (par défaut : `60`).
- `failureWindowHours` : fenêtre glissante en heures utilisée pour les compteurs de délai (par défaut : `24`).
- `overloadedProfileRotations` : nombre maximal de rotations de profils d’authentification du même fournisseur pour les erreurs de surcharge avant de basculer vers le modèle de secours (par défaut : `1`). Les formes de fournisseur occupé telles que `ModelNotReadyException` arrivent ici.
- `overloadedBackoffMs` : délai fixe avant de réessayer une rotation de fournisseur/profil surchargé (par défaut : `0`).
- `rateLimitedProfileRotations` : nombre maximal de rotations de profils d’authentification du même fournisseur pour les erreurs de limite de débit avant de basculer vers le modèle de secours (par défaut : `1`). Ce compartiment de limite de débit inclut du texte de forme fournisseur tel que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` et `resource exhausted`.

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
- Définissez `logging.file` pour obtenir un chemin stable.
- `consoleLevel` passe à `debug` avec `--verbose`.
- `maxFileBytes` : taille maximale du fichier journal actif en octets avant rotation (entier positif ; valeur par défaut : `104857600` = 100 Mo). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif.
- `redactSensitive` / `redactPatterns` : masquage au mieux pour la sortie console, les journaux fichier, les enregistrements de journal OTLP et le texte persistant des transcriptions de session. `redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcriptions ; les surfaces de sécurité UI/outils/diagnostic masquent toujours les secrets avant émission.

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

- `enabled` : commutateur principal pour la sortie d’instrumentation (valeur par défaut : `true`).
- `flags` : tableau de chaînes d’indicateurs activant une sortie de journal ciblée (prend en charge les jokers comme `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs` : seuil d’âge en ms pour émettre des avertissements de session bloquée lorsqu’une session reste en état de traitement.
- `otel.enabled` : active le pipeline d’export OpenTelemetry (valeur par défaut : `false`). Pour la configuration complète, le catalogue des signaux et le modèle de confidentialité, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).
- `otel.endpoint` : URL du collecteur pour l’export OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint` : points de terminaison OTLP facultatifs propres à chaque signal. Lorsqu’ils sont définis, ils remplacent `otel.endpoint` pour ce signal uniquement.
- `otel.protocol` : `"http/protobuf"` (valeur par défaut) ou `"grpc"`.
- `otel.headers` : en-têtes de métadonnées HTTP/gRPC supplémentaires envoyés avec les requêtes d’export OTel.
- `otel.serviceName` : nom de service pour les attributs de ressource.
- `otel.traces` / `otel.metrics` / `otel.logs` : active l’export des traces, métriques ou journaux.
- `otel.sampleRate` : taux d’échantillonnage des traces `0`–`1`.
- `otel.flushIntervalMs` : intervalle de vidage périodique de la télémétrie en ms.
- `otel.captureContent` : capture facultative du contenu brut pour les attributs d’étendue OTEL. Désactivé par défaut. Le booléen `true` capture le contenu non système des messages/outils ; la forme objet permet d’activer explicitement `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` et `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` : commutateur d’environnement pour les derniers attributs expérimentaux de fournisseur d’étendue GenAI. Par défaut, les étendues conservent l’attribut hérité `gen_ai.system` pour la compatibilité ; les métriques GenAI utilisent des attributs sémantiques bornés.
- `OPENCLAW_OTEL_PRELOADED=1` : commutateur d’environnement pour les hôtes qui ont déjà enregistré un SDK OpenTelemetry global. OpenClaw ignore alors le démarrage/l’arrêt du SDK détenu par le Plugin tout en gardant les écouteurs de diagnostic actifs.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` et `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` : variables d’environnement de point de terminaison propres à chaque signal, utilisées lorsque la clé de configuration correspondante n’est pas définie.
- `cacheTrace.enabled` : journalise les instantanés de trace de cache pour les exécutions intégrées (valeur par défaut : `false`).
- `cacheTrace.filePath` : chemin de sortie pour le JSONL de trace de cache (valeur par défaut : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem` : contrôle ce qui est inclus dans la sortie de trace de cache (valeur par défaut pour tous : `true`).

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
- `checkOnStart` : vérifie les mises à jour npm au démarrage du Gateway (valeur par défaut : `true`).
- `auto.enabled` : active la mise à jour automatique en arrière-plan pour les installations de paquets (valeur par défaut : `false`).
- `auto.stableDelayHours` : délai minimal en heures avant l’application automatique sur le canal stable (valeur par défaut : `6` ; max : `168`).
- `auto.stableJitterHours` : fenêtre supplémentaire d’étalement du déploiement sur le canal stable, en heures (valeur par défaut : `12` ; max : `168`).
- `auto.betaCheckIntervalHours` : fréquence d’exécution des vérifications du canal bêta, en heures (valeur par défaut : `1` ; max : `24`).

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

- `enabled` : garde fonctionnelle globale ACP (valeur par défaut : `true` ; définissez `false` pour masquer les options d’envoi et de lancement ACP).
- `dispatch.enabled` : garde indépendante pour l’envoi des tours de session ACP (valeur par défaut : `true`). Définissez `false` pour conserver les commandes ACP disponibles tout en bloquant l’exécution.
- `backend` : identifiant du backend d’exécution ACP par défaut (doit correspondre à un Plugin d’exécution ACP enregistré).
  Si `plugins.allow` est défini, incluez l’identifiant du Plugin backend (par exemple `acpx`), sinon le Plugin par défaut fourni ne sera pas chargé.
- `defaultAgent` : identifiant de l’agent cible ACP de repli lorsque les lancements ne précisent pas de cible explicite.
- `allowedAgents` : liste d’autorisation des identifiants d’agents permis pour les sessions d’exécution ACP ; vide signifie aucune restriction supplémentaire.
- `maxConcurrentSessions` : nombre maximal de sessions ACP actives simultanément.
- `stream.coalesceIdleMs` : fenêtre de vidage en cas d’inactivité, en ms, pour le texte diffusé.
- `stream.maxChunkChars` : taille maximale d’un fragment avant découpage de la projection de bloc diffusé.
- `stream.repeatSuppression` : supprime les lignes de statut/outil répétées par tour (valeur par défaut : `true`).
- `stream.deliveryMode` : `"live"` diffuse progressivement ; `"final_only"` met en mémoire tampon jusqu’aux événements terminaux du tour.
- `stream.hiddenBoundarySeparator` : séparateur avant le texte visible après des événements d’outil masqués (valeur par défaut : `"paragraph"`).
- `stream.maxOutputChars` : nombre maximal de caractères de sortie assistant projetés par tour ACP.
- `stream.maxSessionUpdateChars` : nombre maximal de caractères pour les lignes de statut/mise à jour ACP projetées.
- `stream.tagVisibility` : enregistrement des noms de balises vers des remplacements booléens de visibilité pour les événements diffusés.
- `runtime.ttlMinutes` : TTL d’inactivité en minutes pour les workers de session ACP avant qu’ils puissent être nettoyés.
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

- `cli.banner.taglineMode` contrôle le style de slogan de la bannière :
  - `"random"` (valeur par défaut) : slogans humoristiques/saisonniers tournants.
  - `"default"` : slogan neutre fixe (`All your chats, one OpenClaw.`).
  - `"off"` : aucun texte de slogan (le titre/la version de la bannière restent affichés).
- Pour masquer toute la bannière (pas seulement les slogans), définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

---

## Assistant

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

Les builds actuels n’incluent plus le pont TCP. Les nœuds se connectent via le WebSocket du Gateway. Les clés `bridge.*` ne font plus partie du schéma de configuration (la validation échoue tant qu’elles ne sont pas supprimées ; `openclaw doctor --fix` peut retirer les clés inconnues).

<Accordion title="Configuration du pont hérité (référence historique)">

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

- `sessionRetention` : durée de conservation des sessions d’exécution Cron isolées terminées avant suppression de `sessions.json`. Contrôle également le nettoyage des transcriptions Cron supprimées archivées. Valeur par défaut : `24h` ; définissez `false` pour désactiver.
- `runLog.maxBytes` : taille maximale par fichier journal d’exécution (`cron/runs/<jobId>.jsonl`) avant élagage. Valeur par défaut : `2_000_000` octets.
- `runLog.keepLines` : lignes les plus récentes conservées lorsque l’élagage du journal d’exécution est déclenché. Valeur par défaut : `2000`.
- `webhookToken` : jeton porteur utilisé pour la livraison POST du Webhook Cron (`delivery.mode = "webhook"`), si omis aucun en-tête d’authentification n’est envoyé.
- `webhook` : URL de Webhook de repli héritée obsolète (http/https), utilisée uniquement pour les tâches stockées qui ont encore `notify: true`.

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

- `maxAttempts` : nombre maximal de nouvelles tentatives pour les tâches ponctuelles en cas d’erreurs transitoires (valeur par défaut : `3` ; plage : `0`–`10`).
- `backoffMs` : tableau des délais d’attente en ms pour chaque nouvelle tentative (valeur par défaut : `[30000, 60000, 300000]` ; 1 à 10 entrées).
- `retryOn` : types d’erreurs qui déclenchent de nouvelles tentatives — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettez pour réessayer tous les types transitoires.

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

- `enabled` : active les alertes d’échec pour les tâches Cron (valeur par défaut : `false`).
- `after` : échecs consécutifs avant le déclenchement d’une alerte (entier positif, min : `1`).
- `cooldownMs` : nombre minimal de millisecondes entre alertes répétées pour la même tâche (entier non négatif).
- `includeSkipped` : compte les exécutions consécutives ignorées dans le seuil d’alerte (valeur par défaut : `false`). Les exécutions ignorées sont suivies séparément et n’affectent pas l’attente exponentielle des erreurs d’exécution.
- `mode` : mode de livraison — `"announce"` envoie via un message de canal ; `"webhook"` publie vers le Webhook configuré.
- `accountId` : identifiant de compte ou de canal facultatif pour limiter la portée de la livraison de l’alerte.

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
- `mode` : `"announce"` ou `"webhook"` ; vaut `"announce"` par défaut lorsque les données de cible suffisantes existent.
- `channel` : remplacement du canal pour la livraison via annonce. `"last"` réutilise le dernier canal de livraison connu.
- `to` : cible d’annonce explicite ou URL de Webhook. Requis pour le mode Webhook.
- `accountId` : remplacement facultatif du compte pour la livraison.
- Le `delivery.failureDestination` propre à chaque tâche remplace cette valeur globale par défaut.
- Lorsque ni la destination d’échec globale ni celle propre à la tâche n’est définie, les tâches qui livrent déjà via `announce` se rabattent sur cette cible d’annonce principale en cas d’échec.
- `delivery.failureDestination` n’est pris en charge que pour les tâches `sessionTarget="isolated"`, sauf si le `delivery.mode` principal de la tâche est `"webhook"`.

Voir [Tâches Cron](/fr/automation/cron-jobs). Les exécutions Cron isolées sont suivies comme des [tâches en arrière-plan](/fr/automation/tasks).

---

## Variables de modèle multimédia

Espaces réservés de modèle développés dans `tools.media.models[].args` :

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corps complet du message entrant                  |
| `{{RawBody}}`      | Corps brut (sans historique ni enveloppes d’expéditeur) |
| `{{BodyStripped}}` | Corps sans les mentions de groupe                 |
| `{{From}}`         | Identifiant de l’expéditeur                       |
| `{{To}}`           | Identifiant de destination                        |
| `{{MessageSid}}`   | ID du message du canal                            |
| `{{SessionId}}`    | UUID de la session actuelle                       |
| `{{IsNewSession}}` | `"true"` lorsqu’une nouvelle session est créée    |
| `{{MediaUrl}}`     | Pseudo-URL du média entrant                       |
| `{{MediaPath}}`    | Chemin local du média                             |
| `{{MediaType}}`    | Type de média (image/audio/document/…)            |
| `{{Transcript}}`   | Transcription audio                               |
| `{{Prompt}}`       | Invite multimédia résolue pour les entrées CLI    |
| `{{MaxChars}}`     | Nombre maximal de caractères de sortie résolu pour les entrées CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Sujet du groupe (au mieux)                        |
| `{{GroupMembers}}` | Aperçu des membres du groupe (au mieux)           |
| `{{SenderName}}`   | Nom d’affichage de l’expéditeur (au mieux)        |
| `{{SenderE164}}`   | Numéro de téléphone de l’expéditeur (au mieux)    |
| `{{Provider}}`     | Indice de fournisseur (WhatsApp, Telegram, Discord, etc.) |

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

- Fichier unique : remplace l’objet contenant.
- Tableau de fichiers : fusion profonde dans l’ordre (les suivants remplacent les précédents).
- Clés sœurs : fusionnées après les inclusions (remplacent les valeurs incluses).
- Inclusions imbriquées : jusqu’à 10 niveaux de profondeur.
- Chemins : résolus relativement au fichier qui inclut, mais doivent rester dans le répertoire de configuration de plus haut niveau (`dirname` de `openclaw.json`). Les formes absolues/`../` ne sont autorisées que lorsqu’elles se résolvent toujours à l’intérieur de cette limite.
- Les écritures appartenant à OpenClaw qui ne modifient qu’une seule section de plus haut niveau adossée à une inclusion de fichier unique écrivent directement dans ce fichier inclus. Par exemple, `plugins install` met à jour `plugins: { $include: "./plugins.json5" }` dans `plugins.json5` et laisse `openclaw.json` intact.
- Les inclusions racine, les tableaux d’inclusions et les inclusions avec remplacements par clés sœurs sont en lecture seule pour les écritures appartenant à OpenClaw ; ces écritures échouent fermement au lieu d’aplatir la configuration.
- Erreurs : messages clairs pour les fichiers manquants, les erreurs d’analyse et les inclusions circulaires.

---

_Associé : [Configuration](/fr/gateway/configuration) · [Exemples de configuration](/fr/gateway/configuration-examples) · [Doctor](/fr/gateway/doctor)_

## Associé

- [Configuration](/fr/gateway/configuration)
- [Exemples de configuration](/fr/gateway/configuration-examples)
