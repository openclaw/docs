---
read_when:
    - Ajouter une automatisation du navigateur contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémenter les paramètres + le cycle de vie du navigateur dans l’application macOS
summary: Service de contrôle du navigateur intégré + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-23T07:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Navigateur (géré par openclaw)

OpenClaw peut exécuter un **profil dédié Chrome/Brave/Edge/Chromium** contrôlé par l’agent.
Il est isolé de votre navigateur personnel et géré via un petit service local de
contrôle à l’intérieur de la Gateway (loopback uniquement).

Vue débutant :

- Considérez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir** dans une voie sûre.
- Le profil intégré `user` s’attache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur séparé nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Des actions d’agent (cliquer/saisir/glisser/sélectionner), instantanés, captures d’écran, PDF.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur principal au quotidien. C’est une surface sûre et isolée pour
l’automatisation et la vérification par agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez la
Gateway.

Si `openclaw browser` est entièrement absent, ou si l’agent indique que l’outil browser
n’est pas disponible, allez directement à [Commande ou outil browser manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle par Plugin

L’outil `browser` par défaut est maintenant un Plugin intégré livré activé par
défaut. Cela signifie que vous pouvez le désactiver ou le remplacer sans supprimer le reste du
système de plugins d’OpenClaw :

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Désactivez le Plugin intégré avant d’installer un autre Plugin qui fournit le
même nom d’outil `browser`. L’expérience navigateur par défaut nécessite les deux :

- `plugins.entries.browser.enabled` non désactivé
- `browser.enabled=true`

Si vous désactivez seulement le Plugin, la CLI navigateur intégrée (`openclaw browser`),
la méthode gateway (`browser.request`), l’outil d’agent, et le service de contrôle navigateur par défaut
disparaissent tous ensemble. Votre configuration `browser.*` reste intacte pour qu’un
Plugin de remplacement puisse la réutiliser.

Le Plugin navigateur intégré possède maintenant aussi l’implémentation runtime du navigateur.
Le core ne conserve que des assistants partagés du SDK Plugin ainsi que des réexportations de compatibilité pour
les anciens chemins d’import internes. En pratique, supprimer ou remplacer le package du Plugin navigateur
supprime l’ensemble des fonctionnalités navigateur au lieu de laisser derrière lui un second runtime détenu par le core.

Les changements de configuration du navigateur nécessitent toujours un redémarrage de la Gateway afin que le Plugin intégré
puisse réenregistrer son service navigateur avec les nouveaux paramètres.

## Commande ou outil browser manquant

Si `openclaw browser` devient soudainement une commande inconnue après une mise à niveau, ou
si l’agent signale que l’outil browser est manquant, la cause la plus fréquente est une
liste restrictive `plugins.allow` qui n’inclut pas `browser`.

Exemple de configuration cassée :

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrigez cela en ajoutant `browser` à la liste d’autorisation des plugins :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Remarques importantes :

- `browser.enabled=true` ne suffit pas à lui seul lorsque `plugins.allow` est défini.
- `plugins.entries.browser.enabled=true` ne suffit pas non plus à lui seul lorsque `plugins.allow` est défini.
- `tools.alsoAllow: ["browser"]` ne charge **pas** le Plugin navigateur intégré. Cela ne fait qu’ajuster la politique d’outil une fois le Plugin déjà chargé.
- Si vous n’avez pas besoin d’une liste d’autorisation restrictive de plugins, supprimer `plugins.allow` rétablit aussi le comportement par défaut du navigateur intégré.

Symptômes typiques :

- `openclaw browser` est une commande inconnue.
- `browser.request` est manquant.
- L’agent signale que l’outil browser n’est pas disponible ou manquant.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil d’attache Chrome MCP intégré pour votre **vraie session Chrome connectée**.

Pour les appels d’outil navigateur de l’agent :

- Par défaut : utiliser le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions connectées existantes comptent et que l’utilisateur
  est devant l’ordinateur pour cliquer/approuver toute invite d’attache.
- `profile` est le remplacement explicite lorsque vous voulez un mode navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // par défaut : true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activez uniquement pour un accès intentionnel à un réseau privé de confiance
      // allowPrivateNetwork: true, // alias hérité
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // remplacement hérité mono-profil
    remoteCdpTimeoutMs: 1500, // délai d’expiration HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’expiration de handshake WebSocket CDP distant (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Remarques :

- Le service de contrôle du navigateur se lie à loopback sur un port dérivé de `gateway.port`
  (par défaut : `18791`, soit gateway + 2).
- Si vous remplacez le port Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  les ports navigateur dérivés se décalent pour rester dans la même « famille ».
- `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications de disponibilité CDP distantes (hors loopback).
- `remoteCdpHandshakeTimeoutMs` s’applique aux vérifications de disponibilité WebSocket CDP distantes.
- La navigation navigateur / ouverture d’onglet est protégée contre le SSRF avant la navigation et revérifiée au mieux sur l’URL finale `http(s)` après navigation.
- En mode SSRF strict, la découverte/les sondes d’endpoint CDP distant (`cdpUrl`, y compris les recherches `/json/version`) sont aussi vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut. Définissez-le sur `true` uniquement lorsque vous faites intentionnellement confiance à l’accès navigateur sur réseau privé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité pour compatibilité.
- `attachOnly: true` signifie « ne jamais lancer de navigateur local ; seulement s’attacher s’il est déjà en cours d’exécution ».
- `color` + `color` par profil colorent l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (navigateur autonome géré par OpenClaw). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur par défaut du système s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- Les profils locaux `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` — ne les définissez que pour un CDP distant.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne
  définissez pas `cdpUrl` pour ce pilote.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session
  doit s’attacher à un profil utilisateur Chromium non par défaut tel que Brave ou Edge.

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
l’auto-détection :

Exemple CLI :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Contrôle local vs distant

- **Contrôle local (par défaut) :** la Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte Node) :** exécutez un hôte Node sur la machine qui possède le navigateur ; la Gateway proxifie les actions navigateur vers celui-ci.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous attacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement d’arrêt diffère selon le mode de profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distants : `openclaw browser stop` ferme la session de
  contrôle active et libère les remplacements d’émulation Playwright/CDP (viewport,
  schéma de couleurs, locale, fuseau horaire, mode hors ligne, et état similaire), même
  si aucun processus navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex. `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux endpoints `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour
les jetons plutôt que de les committer dans les fichiers de configuration.

## Proxy navigateur Node (zéro configuration par défaut)

Si vous exécutez un **hôte Node** sur la machine qui possède votre navigateur, OpenClaw peut
acheminer automatiquement les appels d’outil navigateur vers ce nœud sans configuration navigateur supplémentaire.
C’est le chemin par défaut pour les gateways distantes.

Remarques :

- L’hôte Node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du nœud (identique au mode local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent joignables via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils sur liste d’autorisation peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface proxy.
- Désactivez si vous n’en voulez pas :
  - Sur le nœud : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais
pour un profil de navigateur distant l’option la plus simple est l’URL WebSocket directe
issue de la documentation de connexion de Browserless.

Exemple :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Remarques :

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai jeton Browserless.
- Choisissez l’endpoint de région correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous donne une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un endpoint **WebSocket direct** plutôt
que la découverte CDP HTTP standard (`/json/version`). OpenClaw accepte trois formes d’URL
CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  se connecte. Pas de repli WebSocket.
- **Endpoints WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via un handshake WebSocket et ignore
  entièrement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw tente d’abord la
  découverte HTTP `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  revient à un handshake WebSocket direct à la racine nue. Cela couvre
  à la fois les ports de débogage distant de type Chrome et les fournisseurs WebSocket-only.

Un simple `ws://host:port` / `wss://host:port` sans chemin `/devtools/...`
pointant vers une instance locale de Chrome est pris en charge via le repli
découverte-d’abord — Chrome n’accepte les upgrades WebSocket que sur le chemin spécifique par navigateur
ou par cible renvoyé par `/json/version`, donc un simple handshake à la racine nue
échouerait à lui seul.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud permettant d’exécuter
des navigateurs headless avec résolution de CAPTCHA intégrée, mode furtif, et proxys résidentiels.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Remarques :

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé API**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session navigateur à la connexion WebSocket, donc
  aucune étape de création manuelle de session n’est nécessaire.
- L’offre gratuite autorise une session concurrente et une heure de navigateur par mois.
  Voir la [tarification](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Voir la [documentation Browserbase](https://docs.browserbase.com) pour la
  référence API complète, les guides SDK, et des exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité à loopback ; l’accès passe par l’authentification de la Gateway ou l’appairage de nœud.
- L’API HTTP autonome du navigateur en loopback utilise **uniquement une authentification par secret partagé** :
  authentification bearer par jeton gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le
  mot de passe gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome du navigateur en loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` est
  déjà `password`, `none`, ou `trusted-proxy`.
- Conservez la Gateway et tous les hôtes Node sur un réseau privé (Tailscale) ; évitez l’exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez des variables d’environnement ou un gestionnaire de secrets.

Conseils pour le CDP distant :

- Préférez des endpoints chiffrés (HTTPS ou WSS) et, si possible, des jetons de courte durée.
- Évitez d’intégrer directement des jetons longue durée dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance dédiée de navigateur basé sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via l’auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour l’attache existing-session via Chrome MCP.
- Les profils existing-session sont opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont attribués depuis **18800–18899** par défaut.
- La suppression d’un profil déplace son répertoire de données local vers la Corbeille.

Tous les endpoints de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Existing-session via Chrome DevTools MCP

OpenClaw peut aussi s’attacher à un profil de navigateur Chromium déjà en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous voulez un
nom, une couleur, ou un répertoire de données de navigateur différent.

Comportement par défaut :

- Le profil intégré `user` utilise l’auto-connexion Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium, ou un profil Chrome non par défaut :

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Puis, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage distant.
2. Activez le débogage distant.
3. Gardez le navigateur en cours d’exécution et approuvez l’invite de connexion quand OpenClaw s’attache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test de fumée d’attache live :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble le succès :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets déjà ouverts de votre navigateur
- `snapshot` renvoie des refs depuis l’onglet live sélectionné

Ce qu’il faut vérifier si l’attache ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage distant est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement d’attache et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration navigateur basée sur extension et vérifie que
  Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas
  activer le débogage distant côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, passez ce nom de profil explicite.
- Ne choisissez ce mode que lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  d’attache.
- la Gateway ou l’hôte Node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw` car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce pilote ; il s’attache uniquement à une
  session existante.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, OpenClaw le transmet pour cibler explicitement ce
  répertoire de données utilisateur Chromium.
- Les captures d’écran existing-session prennent en charge les captures de page et les captures d’élément `--ref` depuis les snapshots, mais pas les sélecteurs CSS `--element`.
- Les captures d’écran de page existing-session fonctionnent sans Playwright via Chrome MCP.
  Les captures d’élément basées sur ref (`--ref`) y fonctionnent aussi, mais `--full-page`
  ne peut pas être combiné avec `--ref` ou `--element`.
- Les actions existing-session restent plus limitées que le chemin du navigateur
  géré :
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, et `select` nécessitent
    des refs de snapshot plutôt que des sélecteurs CSS
  - `click` ne prend en charge que le bouton gauche (pas de remplacement de bouton ni de modificateurs)
  - `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`
  - `press` ne prend pas en charge `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, et `evaluate` ne
    prennent pas en charge les remplacements de délai par appel
  - `select` ne prend actuellement en charge qu’une seule valeur
- Existing-session `wait --url` prend en charge les motifs exacts, sous-chaîne, et glob
  comme les autres pilotes de navigateur. `wait --load networkidle` n’est pas encore pris en charge.
- Les hooks de téléversement existing-session nécessitent `ref` ou `inputRef`, prennent en charge un seul fichier
  à la fois, et ne prennent pas en charge le ciblage CSS `element`.
- Les hooks de dialogue existing-session ne prennent pas en charge les remplacements de délai.
- Certaines fonctionnalités nécessitent encore le chemin du navigateur géré, notamment les
  actions par lot, l’export PDF, l’interception de téléchargement, et `responsebody`.
- Existing-session peut s’attacher sur l’hôte sélectionné ou via un nœud navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun nœud navigateur n’est connecté, utilisez
  plutôt le CDP distant ou un hôte Node.

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les workflows de développement.
- **Contrôle déterministe des onglets** : ciblez les onglets par `targetId`, pas par « dernier onglet ».

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez remplacer cela avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les intégrations locales uniquement, la Gateway expose une petite API HTTP en loopback :

- Status/start/stop : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les endpoints acceptent `?profile=<name>`.

Si une authentification gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API autonome du navigateur en loopback ne consomme **pas** les en-têtes d’identité trusted-proxy ou
  Tailscale Serve.
- Si `gateway.auth.mode` est `none` ou `trusted-proxy`, ces routes de navigateur en loopback
  n’héritent pas de ces modes porteurs d’identité ; gardez-les strictement en loopback.

### Contrat d’erreur `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau route et
les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est manquant ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : `targetId` au niveau supérieur ou par lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils existing-session.

Les autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/AI snapshot/role snapshot, captures d’écran d’éléments,
PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces endpoints renvoient une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- Snapshots ARIA
- Captures d’écran de page pour le navigateur géré `openclaw` lorsqu’un WebSocket
  CDP par onglet est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran basées sur `--ref` pour existing-session depuis la sortie de snapshot

Ce qui nécessite encore Playwright :

- `navigate`
- `act`
- AI snapshots / role snapshots
- Captures d’écran d’élément par sélecteur CSS (`--element`)
- Export PDF complet du navigateur

Les captures d’écran d’éléments rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, réparez les dépendances d’exécution
du Plugin navigateur intégré afin que `playwright-core` soit installé, puis redémarrez la gateway. Pour
les installations packagées, exécutez `openclaw doctor --fix`. Pour Docker, installez aussi les binaires
du navigateur Chromium comme indiqué ci-dessous.

#### Installation Docker de Playwright

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de remplacement npm).
Utilisez plutôt la CLI intégrée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements de navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est persistant via
`OPENCLAW_HOME_VOLUME` ou un montage bind. Voir [Docker](/fr/install/docker).

## Fonctionnement (interne)

Flux de haut niveau :

- Un petit **serveur de contrôle** accepte des requêtes HTTP.
- Il se connecte aux navigateurs basés sur Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Pour les actions avancées (cliquer/saisir/snapshot/PDF), il utilise **Playwright** au-dessus
  de CDP.
- Lorsque Playwright est absent, seules les opérations sans Playwright sont disponibles.

Cette conception maintient l’agent sur une interface stable et déterministe tout en vous permettant
de changer de navigateurs/profils locaux ou distants.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique.
Toutes les commandes acceptent aussi `--json` pour une sortie lisible par machine (charges utiles stables).

Bases :

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspection :

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Remarque sur le cycle de vie :

- Pour les profils attach-only et CDP distants, `openclaw browser stop` reste la
  bonne commande de nettoyage après les tests. Elle ferme la session de contrôle active et
  efface les remplacements temporaires d’émulation au lieu de tuer le navigateur
  sous-jacent.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Actions :

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

État :

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Remarques :

- `upload` et `dialog` sont des appels **d’armement** ; exécutez-les avant le click/press
  qui déclenche le sélecteur/le dialogue.
- Les chemins de sortie de téléchargement et de trace sont limités aux racines temporaires OpenClaw :
  - traces : `/tmp/openclaw` (repli : `${os.tmpdir()}/openclaw`)
  - téléchargements : `/tmp/openclaw/downloads` (repli : `${os.tmpdir()}/openclaw/downloads`)
- Les chemins de téléversement sont limités à une racine temporaire de téléversements OpenClaw :
  - téléversements : `/tmp/openclaw/uploads` (repli : `${os.tmpdir()}/openclaw/uploads`)
- `upload` peut aussi définir directement les entrées de fichier via `--input-ref` ou `--element`.
- `snapshot` :
  - `--format ai` (par défaut lorsque Playwright est installé) : renvoie un snapshot AI avec des refs numériques (`aria-ref="<n>"`).
  - `--format aria` : renvoie l’arbre d’accessibilité (pas de refs ; inspection uniquement).
  - `--efficient` (ou `--mode efficient`) : preset compact de role snapshot (interactive + compact + depth + maxChars plus faible).
  - Valeur par défaut de configuration (outil/CLI uniquement) : définissez `browser.snapshotDefaults.mode: "efficient"` pour utiliser des snapshots efficaces lorsque l’appelant ne passe pas de mode (voir [Configuration Gateway](/fr/gateway/configuration-reference#browser)).
  - Les options de role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forcent un snapshot basé sur les rôles avec des refs comme `ref=e12`.
  - `--frame "<iframe selector>"` limite les role snapshots à un iframe (s’associe à des role refs comme `e12`).
  - `--interactive` produit une liste plate et facile à sélectionner des éléments interactifs (meilleur choix pour piloter des actions).
  - `--labels` ajoute une capture d’écran limitée au viewport avec des labels de refs superposés (affiche `MEDIA:<path>`).
- `click`/`type`/etc nécessitent une `ref` issue de `snapshot` (soit numérique `12`, soit role ref `e12`).
  Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions.

## Snapshots et refs

OpenClaw prend en charge deux styles de « snapshot » :

- **AI snapshot (refs numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un snapshot texte incluant des refs numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la ref est résolue via `aria-ref` de Playwright.

- **Role snapshot (role refs comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la ref est résolue via `getByRole(...)` (plus `nth()` en cas de doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran du viewport avec les labels `e12` superposés.

Comportement des refs :

- Les refs ne sont **pas stables entre navigations** ; si quelque chose échoue, relancez `snapshot` et utilisez une ref fraîche.
- Si le role snapshot a été pris avec `--frame`, les role refs sont limitées à cet iframe jusqu’au prochain role snapshot.

## Surpuissances de wait

Vous pouvez attendre plus que le simple temps/texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces options peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflows de débogage

Lorsqu’une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les role refs en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné aux scripts et à l’outillage structuré.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les role snapshots en JSON incluent `refs` plus un petit bloc `stats` (lignes/caractères/refs/interactif) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Réglages d’état et d’environnement

Ils sont utiles pour les workflows « faire se comporter le site comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Storage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / locale : `set timezone ...`, `set locale ...`
- Appareil / viewport :
  - `set device "iPhone 14"` (presets d’appareils Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. Une injection de prompt peut
  vous y orienter. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les remarques anti-bot (X/Twitter, etc.), voir [Connexion navigateur + publication X/Twitter](/fr/tools/browser-login).
- Gardez la Gateway/l’hôte Node privés (loopback ou tailnet-only).
- Les endpoints CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple de mode strict (bloquer par défaut les destinations privées/internes) :

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // autorisation exacte facultative
    },
  },
}
```

## Dépannage

Pour les problèmes spécifiques Linux (notamment snap Chromium), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations hôte partagé WSL2 Gateway + Chrome Windows, voir
[Dépannage WSL2 + Windows + Chrome distant CDP](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Ce sont des classes d’échec différentes et elles pointent vers des chemins de code différents.

- **Échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, snapshot, ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau alors que `start` et `tabs` fonctionnent toujours

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment interpréter les résultats :

- Si `start` échoue avec `not reachable after start`, commencez par dépanner la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle reste malsain. Traitez cela comme un problème de disponibilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est actif et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs`, et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants de comportement :

- La configuration du navigateur utilise par défaut un objet de politique SSRF fail-closed même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local loopback `openclaw`, les vérifications d’état CDP ignorent volontairement l’application de la disponibilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat réussi de `start` ou `tabs` ne signifie pas qu’une cible ultérieure `open` ou `navigate` est autorisée.

Conseils de sécurité :

- **N’assouplissez pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites telles que `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement de confiance où l’accès navigateur au réseau privé est requis et a été examiné.

Exemple : navigation bloquée, plan de contrôle sain

- `start` réussit
- `tabs` réussit
- `open http://internal.example` échoue

Cela signifie généralement que le démarrage du navigateur fonctionne et que la cible de navigation nécessite un examen de politique.

Exemple : démarrage bloqué avant que la navigation n’importe

- `start` échoue avec `not reachable after start`
- `tabs` échoue aussi ou ne peut pas s’exécuter

Cela pointe vers le lancement du navigateur ou la disponibilité CDP, et non vers un problème de liste d’autorisation d’URL de page.

## Outils d’agent + fonctionnement du contrôle

L’agent obtient **un seul outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les ID `ref` du snapshot pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture les pixels (page complète ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome, ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner où se trouve le navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un nœud compatible navigateur est connecté, l’outil peut être automatiquement routé vers lui, sauf si vous fixez `target="host"` ou `target="node"`.

Cela garde l’agent déterministe et évite les sélecteurs fragiles.

## Lié

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans les environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques et durcissement du contrôle du navigateur
