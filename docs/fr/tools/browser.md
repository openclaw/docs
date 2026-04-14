---
read_when:
    - Ajout de l’automatisation du navigateur contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres du navigateur + du cycle de vie dans l’app macOS
summary: Service de contrôle de navigateur intégré + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-14T13:04:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# Navigateur (géré par openclaw)

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle.
Il est isolé de votre navigateur personnel et géré via un petit
service de contrôle local à l’intérieur du Gateway (loopback uniquement).

Vue débutant :

- Voyez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne **modifie pas** le profil de votre navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un environnement sûr.
- Le profil intégré `user` se rattache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions de l’agent (cliquer/saisir/faire glisser/sélectionner), instantanés, captures d’écran, PDF.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur quotidien. C’est une surface sûre et isolée pour
l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la config (voir ci-dessous) et redémarrez le
Gateway.

Si `openclaw browser` est totalement absent, ou si l’agent indique que l’outil de navigateur
est indisponible, allez à [Commande ou outil navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

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
même nom d’outil `browser`. L’expérience de navigateur par défaut nécessite les deux éléments suivants :

- `plugins.entries.browser.enabled` non désactivé
- `browser.enabled=true`

Si vous désactivez uniquement le Plugin, la CLI de navigateur intégrée (`openclaw browser`),
la méthode gateway (`browser.request`), l’outil agent et le service de contrôle de navigateur par défaut
disparaissent tous ensemble. Votre config `browser.*` reste intacte pour qu’un
Plugin de remplacement puisse la réutiliser.

Le Plugin de navigateur intégré possède maintenant aussi l’implémentation d’exécution du navigateur.
Le cœur ne conserve que les assistants partagés du Plugin SDK ainsi que des réexportations de compatibilité pour
les anciens chemins d’import internes. En pratique, supprimer ou remplacer le package du Plugin navigateur
supprime l’ensemble des fonctionnalités du navigateur au lieu de laisser derrière lui une seconde
implémentation d’exécution gérée par le cœur.

Les changements de configuration du navigateur nécessitent toujours un redémarrage du Gateway afin que le Plugin intégré
puisse réenregistrer son service de navigateur avec les nouveaux paramètres.

## Commande ou outil navigateur manquant

Si `openclaw browser` devient soudainement une commande inconnue après une mise à niveau, ou
si l’agent signale que l’outil navigateur est manquant, la cause la plus fréquente est une liste
`plugins.allow` restrictive qui n’inclut pas `browser`.

Exemple de configuration défaillante :

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrigez-la en ajoutant `browser` à la liste d’autorisation des plugins :

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
- `tools.alsoAllow: ["browser"]` ne charge **pas** le Plugin navigateur intégré. Cela ajuste seulement la politique des outils une fois le Plugin déjà chargé.
- Si vous n’avez pas besoin d’une liste d’autorisation de plugins restrictive, supprimer `plugins.allow` rétablit également le comportement par défaut du navigateur intégré.

Symptômes typiques :

- `openclaw browser` est une commande inconnue.
- `browser.request` est absent.
- L’agent signale que l’outil navigateur est indisponible ou manquant.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de rattachement Chrome MCP à votre **vraie session Chrome connectée**.

Pour les appels d’outil navigateur de l’agent :

- Par défaut : utiliser le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque des sessions déjà connectées importent et que l’utilisateur
  est devant l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est la surcharge explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // défaut : true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activez uniquement pour un accès réseau privé de confiance
      // allowPrivateNetwork: true, // alias historique
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // surcharge historique à profil unique
    remoteCdpTimeoutMs: 1500, // délai d’expiration HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’expiration de la poignée de main WebSocket CDP distante (ms)
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

- Le service de contrôle du navigateur se lie au loopback sur un port dérivé de `gateway.port`
  (par défaut : `18791`, soit gateway + 2).
- Si vous surchargez le port du Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  les ports du navigateur dérivés se décalent pour rester dans la même « famille ».
- `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité CDP distantes (hors loopback).
- `remoteCdpHandshakeTimeoutMs` s’applique aux vérifications d’accessibilité WebSocket CDP distantes.
- La navigation/ouverture d’onglet du navigateur est protégée contre la SSRF avant la navigation et revérifiée au mieux sur l’URL finale `http(s)` après navigation.
- En mode SSRF strict, la découverte/les sondes de points de terminaison CDP distants (`cdpUrl`, y compris les recherches `/json/version`) sont également vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut. Définissez-le sur `true` uniquement lorsque vous faites intentionnellement confiance à l’accès navigateur au réseau privé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias historique pour compatibilité.
- `attachOnly: true` signifie « ne jamais lancer un navigateur local ; se rattacher uniquement s’il est déjà en cours d’exécution ».
- `color` + `color` par profil teintent l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (navigateur autonome géré par OpenClaw). Utilisez `defaultProfile: "user"` pour opter pour le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- Les profils `openclaw` locaux assignent automatiquement `cdpPort`/`cdpUrl` — définissez-les uniquement pour le CDP distant.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne
  définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session
  doit se rattacher à un profil utilisateur Chromium non par défaut comme Brave ou Edge.

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour surcharger
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

- **Contrôle local (par défaut) :** le Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; le Gateway y relaie les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement à l’arrêt diffère selon le mode du profil :

- profils gérés locaux : `openclaw browser stop` arrête le processus de navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distants : `openclaw browser stop` ferme la session de contrôle
  active et libère les surcharges d’émulation Playwright/CDP (viewport,
  schéma de couleurs, langue, fuseau horaire, mode hors ligne et état similaire), même
  si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex., `https://provider.example?token=<token>`)
- Auth HTTP Basic (par ex., `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
jetons plutôt que de les valider dans des fichiers de configuration.

## Proxy navigateur node (par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
acheminer automatiquement les appels d’outil navigateur vers ce node sans configuration de navigateur supplémentaire.
C’est le chemin par défaut pour les gateways distants.

Remarques :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre config `browser.profiles` du node (identique au mode local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement historique/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une limite de moindre privilège : seuls les profils autorisés peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface du proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser les deux formes, mais
pour un profil de navigateur distant, l’option la plus simple est l’URL WebSocket directe
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
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw prend en charge les deux :

- **Points de terminaison HTTP(S)** — OpenClaw appelle `/json/version` pour découvrir l’URL WebSocket du débogueur, puis s’y connecte.
- **Points de terminaison WebSocket** (`ws://` / `wss://`) — OpenClaw se connecte directement, en ignorant `/json/version`. Utilisez cette option pour des services comme
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com), ou tout fournisseur qui vous fournit une
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud permettant d’exécuter
des navigateurs headless avec résolution CAPTCHA intégrée, mode furtif et proxys
résidentiels.

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

- [Inscrivez-vous](https://www.browserbase.com/sign-up) puis copiez votre **API Key**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc
  aucune étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois.
  Consultez les [tarifs](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API
  complète, les guides SDK et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité au loopback ; l’accès passe par l’authentification du Gateway ou l’appairage du node.
- L’API HTTP autonome du navigateur en loopback utilise **uniquement une authentification par secret partagé** :
  auth bearer par jeton gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le
  mot de passe gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` ne
  **n’authentifient pas** cette API autonome du navigateur en loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la config.
- OpenClaw ne **génère pas automatiquement** ce jeton lorsque `gateway.auth.mode` vaut déjà
  `password`, `none`, ou `trusted-proxy`.
- Conservez le Gateway et tous les hôtes node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez des variables d’environnement ou un gestionnaire de secrets.

Conseils CDP distants :

- Préférez des points de terminaison chiffrés (HTTPS ou WSS) et des jetons de courte durée lorsque c’est possible.
- Évitez d’intégrer directement des jetons de longue durée dans les fichiers de configuration.

## Profils (multi-navigateur)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance de navigateur dédiée basée sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via connexion automatique Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il est absent.
- Le profil `user` est intégré pour le rattachement existing-session Chrome MCP.
- Les profils existing-session sont optionnels au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués dans la plage **18800–18899** par défaut.
- Supprimer un profil déplace son répertoire local de données vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Existing-session via Chrome DevTools MCP

OpenClaw peut également se rattacher à un profil de navigateur basé sur Chromium déjà en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous souhaitez un
nom, une couleur ou un répertoire de données de navigateur différent.

Comportement par défaut :

- Le profil intégré `user` utilise la connexion automatique Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium ou un profil Chrome non par défaut :

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

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Laissez le navigateur en cours d’exécution et approuvez l’invite de connexion quand OpenClaw se rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test rapide de rattachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble un succès :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste vos onglets de navigateur déjà ouverts
- `snapshot` renvoie des refs depuis l’onglet actif sélectionné

Que vérifier si le rattachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement au rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration de navigateur basée sur une extension et vérifie que
  Chrome est installé localement pour les profils de connexion automatique par défaut, mais il ne peut
  pas activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, passez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  de rattachement.
- le Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Cette voie présente plus de risques que le profil isolé `openclaw` parce qu’elle peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il se rattache uniquement à une
  session existante.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, OpenClaw le transmet pour cibler explicitement ce
  répertoire de données utilisateur Chromium.
- Les captures d’écran existing-session prennent en charge les captures de page et les captures d’élément `--ref`
  issues de la sortie de snapshot, mais pas les sélecteurs CSS `--element`.
- Les captures d’écran de page existing-session fonctionnent sans Playwright via Chrome MCP.
  Les captures d’élément par ref (`--ref`) y fonctionnent aussi, mais `--full-page`
  ne peut pas être combiné avec `--ref` ou `--element`.
- Les actions existing-session restent plus limitées que le chemin du navigateur
  géré :
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, et `select` exigent
    des refs de snapshot plutôt que des sélecteurs CSS
  - `click` est limité au bouton gauche (pas de surcharge du bouton ni de modificateurs)
  - `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`
  - `press` ne prend pas en charge `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, et `evaluate` ne
    prennent pas en charge les surcharges de délai d’expiration par appel
  - `select` ne prend actuellement en charge qu’une seule valeur
- Existing-session `wait --url` prend en charge les motifs exacts, par sous-chaîne et glob
  comme les autres drivers de navigateur. `wait --load networkidle` n’est pas encore pris en charge.
- Les hooks de téléversement existing-session exigent `ref` ou `inputRef`, prennent en charge un seul fichier à la fois et ne prennent pas en charge le ciblage CSS `element`.
- Les hooks de boîte de dialogue existing-session ne prennent pas en charge les surcharges de délai d’expiration.
- Certaines fonctionnalités nécessitent encore le chemin du navigateur géré, notamment les
  actions par lot, l’export PDF, l’interception des téléchargements et `responsebody`.
- Existing-session est local à l’hôte. Si Chrome se trouve sur une autre machine ou dans un
  autre espace de noms réseau, utilisez plutôt le CDP distant ou un hôte node.

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les workflows de développement.
- **Contrôle déterministe des onglets** : ciblez les onglets par `targetId`, pas par « dernier onglet ».

## Sélection du navigateur

Lors du lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez surcharger cela avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP en loopback :

- Statut/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les points de terminaison acceptent `?profile=<name>`.

Si une authentification gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API autonome du navigateur en loopback ne consomme **pas** les en-têtes d’identité trusted-proxy ni Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes de navigateur en loopback
  n’héritent pas de ces modes porteurs d’identité ; conservez-les en loopback uniquement.

### Contrat d’erreur `/act`

`POST /act` utilise une réponse d’erreur structurée pour les échecs de validation au niveau de la route et
de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est absent ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la config.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : `targetId` de niveau supérieur ou en lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils existing-session.

D’autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/snapshot IA/snapshot de rôle, captures d’écran d’élément,
PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- Snapshots ARIA
- Captures d’écran de page pour le navigateur `openclaw` géré lorsqu’un WebSocket
  CDP par onglet est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran existing-session basées sur ref (`--ref`) à partir de la sortie de snapshot

Ce qui nécessite toujours Playwright :

- `navigate`
- `act`
- Snapshots IA / snapshots de rôle
- Captures d’écran d’élément par sélecteur CSS (`--element`)
- Export PDF complet du navigateur

Les captures d’écran d’élément rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, installez le package complet
Playwright (pas `playwright-core`) et redémarrez la gateway, ou réinstallez
OpenClaw avec la prise en charge du navigateur.

#### Installation de Playwright dans Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de surcharge npm).
Utilisez plutôt la CLI intégrée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements du navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est conservé via
`OPENCLAW_HOME_VOLUME` ou un montage bind. Voir [Docker](/fr/install/docker).

## Fonctionnement (interne)

Flux de haut niveau :

- Un petit **serveur de contrôle** accepte les requêtes HTTP.
- Il se connecte aux navigateurs basés sur Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Pour les actions avancées (clic/saisie/snapshot/PDF), il utilise **Playwright** par-dessus
  CDP.
- Lorsque Playwright est absent, seules les opérations ne dépendant pas de Playwright sont disponibles.

Cette conception maintient l’agent sur une interface stable et déterministe tout en vous permettant
de changer de navigateurs et de profils locaux/distants.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique.
Toutes les commandes acceptent également `--json` pour une sortie lisible par machine (charges utiles stables).

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
  efface les surcharges d’émulation temporaires au lieu de tuer le navigateur
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

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la pression
  qui déclenche le sélecteur/la boîte de dialogue.
- Les chemins de sortie de téléchargement et de trace sont limités aux racines temporaires d’OpenClaw :
  - traces : `/tmp/openclaw` (repli : `${os.tmpdir()}/openclaw`)
  - téléchargements : `/tmp/openclaw/downloads` (repli : `${os.tmpdir()}/openclaw/downloads`)
- Les chemins d’upload sont limités à une racine temporaire d’uploads OpenClaw :
  - uploads : `/tmp/openclaw/uploads` (repli : `${os.tmpdir()}/openclaw/uploads`)
- `upload` peut aussi définir directement des entrées de fichier via `--input-ref` ou `--element`.
- `snapshot` :
  - `--format ai` (par défaut quand Playwright est installé) : renvoie un snapshot IA avec des refs numériques (`aria-ref="<n>"`).
  - `--format aria` : renvoie l’arbre d’accessibilité (sans refs ; inspection uniquement).
  - `--efficient` (ou `--mode efficient`) : préréglage de snapshot de rôle compact (interactive + compact + depth + maxChars réduit).
  - Valeur par défaut de config (outil/CLI uniquement) : définissez `browser.snapshotDefaults.mode: "efficient"` pour utiliser des snapshots efficaces lorsque l’appelant ne passe pas de mode (voir [Configuration de la Gateway](/fr/gateway/configuration-reference#browser)).
  - Les options de snapshot de rôle (`--interactive`, `--compact`, `--depth`, `--selector`) forcent un snapshot basé sur les rôles avec des refs comme `ref=e12`.
  - `--frame "<iframe selector>"` limite les snapshots de rôle à une iframe (s’associe à des refs de rôle comme `e12`).
  - `--interactive` produit une liste plate et facile à sélectionner des éléments interactifs (idéal pour piloter des actions).
  - `--labels` ajoute une capture d’écran du viewport avec des étiquettes de ref superposées (affiche `MEDIA:<path>`).
- `click`/`type`/etc nécessitent une `ref` provenant de `snapshot` (soit la forme numérique `12`, soit la ref de rôle `e12`).
  Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions.

## Snapshots et refs

OpenClaw prend en charge deux styles de « snapshot » :

- **Snapshot IA (refs numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un snapshot texte qui inclut des refs numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la ref est résolue via `aria-ref` de Playwright.

- **Snapshot de rôle (refs de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la ref est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran du viewport avec les étiquettes `e12` superposées.

Comportement des refs :

- Les refs ne sont **pas stables d’une navigation à l’autre** ; si quelque chose échoue, relancez `snapshot` et utilisez une nouvelle ref.
- Si le snapshot de rôle a été pris avec `--frame`, les refs de rôle sont limitées à cette iframe jusqu’au prochain snapshot de rôle.

## Attentes renforcées

Vous pouvez attendre plus que du simple temps/texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces conditions peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflows de débogage

Quand une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les refs de rôle en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné aux scripts et aux outils structurés.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les snapshots de rôle en JSON incluent `refs` ainsi qu’un petit bloc `stats` (lines/chars/refs/interactive) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Réglages d’état et d’environnement

Ils sont utiles pour les workflows « faire se comporter le site comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Storage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Auth HTTP Basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / langue : `set timezone ...`, `set locale ...`
- Appareil / viewport :
  - `set device "iPhone 14"` (préréglages d’appareil Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. L’injection de prompt peut orienter
  cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les notes anti-bot (X/Twitter, etc.), voir [Connexion au navigateur + publication sur X/Twitter](/fr/tools/browser-login).
- Gardez la Gateway/l’hôte node privés (loopback ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple en mode strict (bloquer par défaut les destinations privées/internes) :

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

Pour les problèmes spécifiques à Linux (notamment Chromium snap), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations WSL2 Gateway + Chrome Windows hôte séparé, voir
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Il s’agit de deux classes d’échec différentes, et elles pointent vers des chemins de code différents.

- **Échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, snapshot ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau alors que `start` et `tabs` fonctionnent toujours

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment interpréter les résultats :

- Si `start` échoue avec `not reachable after start`, dépannez d’abord la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle reste malsain. Traitez cela comme un problème d’accessibilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est opérationnel et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants du comportement :

- La configuration du navigateur utilise par défaut un objet de politique SSRF en échec fermé même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local `openclaw` en loopback, les vérifications d’état CDP ignorent intentionnellement l’application de l’accessibilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat `start` ou `tabs` réussi ne signifie pas qu’une cible ultérieure de `open` ou `navigate` est autorisée.

Consignes de sécurité :

- N’assouplissez **pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites comme `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement approuvés où l’accès du navigateur au réseau privé est nécessaire et vérifié.

Exemple : navigation bloquée, plan de contrôle sain

- `start` réussit
- `tabs` réussit
- `open http://internal.example` échoue

Cela signifie généralement que le démarrage du navigateur fonctionne correctement et que la cible de navigation nécessite un examen de politique.

Exemple : démarrage bloqué avant que la navigation n’importe

- `start` échoue avec `not reachable after start`
- `tabs` échoue aussi ou ne peut pas s’exécuter

Cela pointe vers un lancement du navigateur ou une accessibilité CDP, pas vers un problème de liste d’autorisation d’URL de page.

## Outils agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (IA ou ARIA).
- `browser act` utilise les ID `ref` du snapshot pour cliquer/saisir/faire glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome, ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions en sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions en sandbox utilisent par défaut `sandbox`, les sessions hors sandbox utilisent par défaut `host`.
  - Si un node capable de navigateur est connecté, l’outil peut y être routé automatiquement sauf si vous forcez `target="host"` ou `target="node"`.

Cela maintient le comportement de l’agent déterministe et évite les sélecteurs fragiles.

## Voir aussi

- [Vue d’ensemble des outils](/fr/tools) — tous les outils agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans les environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques et renforcement du contrôle du navigateur
