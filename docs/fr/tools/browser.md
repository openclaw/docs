---
read_when:
    - Ajout de l’automatisation du navigateur contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres et du cycle de vie du navigateur dans l’app macOS
summary: Service intégré de contrôle du navigateur + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-24T08:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** contrôlé par l’agent.
Il est isolé de votre navigateur personnel et géré via un petit service de
contrôle local à l’intérieur du Gateway (loopback local uniquement).

Vue débutant :

- Considérez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un cadre sûr.
- Le profil intégré `user` se connecte à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Des actions d’agent (cliquer/saisir/faire glisser/sélectionner), des instantanés, des captures d’écran, des PDF.
- Une prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur principal au quotidien. C’est une surface sûre et isolée pour l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) puis redémarrez le Gateway.

Si `openclaw browser` est totalement absent, ou si l’agent indique que l’outil navigateur n’est pas disponible, consultez [Commande ou outil navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est un Plugin intégré. Désactivez-le pour le remplacer par un autre Plugin qui enregistre le même nom d’outil `browser` :

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le Plugin supprime en une seule unité la CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil d’agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les modifications de configuration du navigateur nécessitent un redémarrage du Gateway afin que le Plugin puisse réenregistrer son service.

## Commande ou outil navigateur manquant

Si `openclaw browser` est inconnu après une mise à niveau, si `browser.request` est absent ou si l’agent indique que l’outil navigateur n’est pas disponible, la cause habituelle est une liste `plugins.allow` qui omet `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` et `tools.alsoAllow: ["browser"]` ne remplacent pas l’appartenance à la liste d’autorisation — cette liste contrôle le chargement des Plugins, et la politique d’outils ne s’exécute qu’après le chargement. Supprimer complètement `plugins.allow` rétablit également le comportement par défaut.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de connexion Chrome MCP à votre **vraie session Chrome connectée**.

Pour les appels d’outil navigateur de l’agent :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque des sessions déjà connectées comptent et que l’utilisateur est à l’ordinateur pour cliquer/approuver toute invite de connexion.
- `profile` est la surcharge explicite lorsque vous voulez un mode navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // défaut : true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activer uniquement pour un accès intentionnel à un réseau privé de confiance
      // allowPrivateNetwork: true, // alias hérité
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // surcharge héritée à profil unique
    remoteCdpTimeoutMs: 1500, // délai d’attente HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’attente de poignée de main WebSocket CDP distante (ms)
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

<AccordionGroup>

<Accordion title="Ports et accessibilité">

- Le service de contrôle se lie au loopback sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` ; définissez-les uniquement pour le CDP distant. `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité HTTP CDP distantes (hors loopback) ; `remoteCdpHandshakeTimeoutMs` s’applique aux poignées de main WebSocket CDP distantes.

</Accordion>

<Accordion title="Politique SSRF">

- La navigation du navigateur et l’ouverture d’onglets sont protégées contre les SSRF avant la navigation et revérifiées au mieux sur l’URL `http(s)` finale ensuite.
- En mode SSRF strict, la découverte du point de terminaison CDP distant et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès au navigateur sur un réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie ne jamais lancer de navigateur local ; se connecter uniquement si un navigateur est déjà en cours d’exécution.
- `color` (au niveau supérieur et par profil) teinte l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (autonome géré). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre de détection automatique : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce pilote.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session doit se connecter à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc.),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
la détection automatique :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Ou définissez-le dans la configuration, selon la plateforme :

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Contrôle local vs distant

- **Contrôle local (par défaut) :** le Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte Node) :** exécutez un hôte Node sur la machine qui possède le navigateur ; le Gateway transmet les actions du navigateur à cet hôte.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour vous connecter à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.

Le comportement d’arrêt diffère selon le mode de profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus navigateur lancé par OpenClaw
- profils en connexion uniquement et profils CDP distants : `openclaw browser stop` ferme la session de contrôle active et libère les surcharges d’émulation Playwright/CDP (viewport, schéma de couleurs, langue, fuseau horaire, mode hors ligne et états similaires), même si aucun processus navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex. `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw conserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion au WebSocket CDP. Préférez des variables d’environnement ou des gestionnaires de secrets pour les jetons plutôt que de les valider dans des fichiers de configuration.

## Proxy de navigateur Node (par défaut sans configuration)

Si vous exécutez un **hôte Node** sur la machine qui possède votre navigateur, OpenClaw peut automatiquement
acheminer les appels d’outil navigateur vers ce Node sans configuration supplémentaire du navigateur.
C’est le chemin par défaut pour les Gateways distants.

Remarques :

- L’hôte Node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du Node (identique au mode local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profils.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une limite de moindre privilège : seuls les profils autorisés peuvent être ciblés, et les routes de création/suppression de profils persistants sont bloquées sur la surface du proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le Node : `nodeHost.browserProxy.enabled=false`
  - Sur le gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais
pour un profil de navigateur distant, l’option la plus simple est l’URL WebSocket directe
de la documentation de connexion de Browserless.

Exemple :

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

Remarques :

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai jeton Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois
formes d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  se connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via une poignée de main WebSocket et ignore
  complètement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw tente d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  revient à une poignée de main WebSocket directe à la racine nue. Cela permet à une
  URL nue `ws://` pointant vers un Chrome local de se connecter, puisque Chrome n’accepte
  les mises à niveau WebSocket que sur le chemin spécifique par cible provenant de
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter des navigateurs headless avec résolution CAPTCHA intégrée, mode furtif et proxys résidentiels.

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

Remarques :

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé API**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc aucune étape manuelle de création de session n’est nécessaire.
- Le niveau gratuit autorise une session concurrente et une heure de navigateur par mois.
  Consultez les [tarifs](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence API complète,
  les guides SDK et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité au loopback ; l’accès passe par l’authentification du Gateway ou l’appairage de Node.
- L’API HTTP autonome du navigateur sur loopback utilise **uniquement une authentification par secret partagé** :
  authentification bearer par jeton Gateway, `x-openclaw-password` ou authentification HTTP Basic avec le
  mot de passe Gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome du navigateur sur loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` est
  déjà `password`, `none` ou `trusted-proxy`.
- Conservez le Gateway et tous les hôtes Node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez des variables d’environnement ou un gestionnaire de secrets.

Conseils pour le CDP distant :

- Préférez les points de terminaison chiffrés (HTTPS ou WSS) et les jetons à courte durée de vie lorsque c’est possible.
- Évitez d’intégrer directement des jetons longue durée dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance dédiée de navigateur basé sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via l’auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il est absent.
- Le profil `user` est intégré pour la connexion existing-session Chrome MCP.
- Les profils existing-session sont facultatifs au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont attribués à partir de **18800–18899** par défaut.
- La suppression d’un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Existing-session via Chrome DevTools MCP

OpenClaw peut également se connecter à un profil de navigateur basé sur Chromium en cours d’exécution via le serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous voulez un
nom, une couleur ou un répertoire de données de navigateur différents.

Comportement par défaut :

- Le profil intégré `user` utilise l’auto-connexion Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium ou un profil Chrome non par défaut :

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

Ensuite, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Gardez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsque OpenClaw se connecte.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test rapide de connexion en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble une réussite :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets déjà ouverts dans votre navigateur
- `snapshot` renvoie des refs depuis l’onglet actif sélectionné

Ce qu’il faut vérifier si la connexion ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement à la connexion et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration de navigateur basée sur une extension et vérifie que
  Chrome est installé localement pour les profils par défaut à auto-connexion, mais il ne peut pas
  activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, passez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est à l’ordinateur pour approuver l’invite de connexion.
- le Gateway ou l’hôte Node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin présente plus de risques que le profil isolé `openclaw` car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce pilote ; il se contente de s’y connecter.
- OpenClaw utilise ici le flux officiel `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` est défini, il est transmis pour cibler ce répertoire de données utilisateur.
- Existing-session peut se connecter sur l’hôte sélectionné ou via un
  Node navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun Node navigateur n’est connecté, utilisez
  plutôt un CDP distant ou un hôte Node.

<Accordion title="Limites de la fonctionnalité existing-session">

Comparés au profil géré `openclaw`, les pilotes existing-session sont plus contraints :

- **Captures d’écran** — les captures de page et les captures d’élément `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas nécessaire pour les captures d’écran de page ou d’élément basées sur une ref.
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des refs d’instantané (pas de sélecteurs CSS). `click` ne prend en charge que le bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge les délais d’attente par appel. `select` accepte une seule valeur.
- **Attente / téléversement / boîte de dialogue** — `wait --url` prend en charge les motifs exacts, par sous-chaîne et glob ; `wait --load networkidle` n’est pas pris en charge. Les hooks de téléversement nécessitent `ref` ou `inputRef`, un fichier à la fois, sans `element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les surcharges de délai d’attente.
- **Fonctionnalités réservées au mode géré** — les actions par lot, l’export PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les flux de développement.
- **Contrôle déterministe des onglets** : cible les onglets par `targetId`, pas par « dernier onglet ».

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez remplacer cela avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : recherche `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultatif)

Pour les scripts et le débogage, le Gateway expose une petite **API HTTP de contrôle
limitée au loopback** ainsi qu’une CLI `openclaw browser` correspondante (instantanés, refs, améliorations de `wait`,
sortie JSON, flux de débogage). Consultez
[API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes spécifiques à Linux (en particulier snap Chromium), consultez
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations à hôte scindé WSL2 Gateway + Chrome Windows, consultez
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Ce sont deux classes d’échec différentes et elles pointent vers des chemins de code différents.

- **Un échec de démarrage ou de disponibilité CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Un blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de disponibilité CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, d’instantané ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau alors que `start` et `tabs` fonctionnent toujours

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment interpréter les résultats :

- Si `start` échoue avec `not reachable after start`, commencez par dépanner la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours défaillant. Considérez cela comme un problème d’accessibilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échouent, le plan de contrôle du navigateur fonctionne et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails de comportement importants :

- La configuration du navigateur utilise par défaut un objet de politique SSRF en échec fermé même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local `openclaw` sur loopback, les vérifications d’état CDP ignorent intentionnellement l’application de l’accessibilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat réussi pour `start` ou `tabs` ne signifie pas qu’une cible ultérieure `open` ou `navigate` est autorisée.

Consignes de sécurité :

- N’assouplissez **pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites telles que `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements explicitement approuvés où l’accès du navigateur au réseau privé est requis et a été examiné.

## Outils d’agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du navigateur :

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les identifiants `ref` de l’instantané pour cliquer/saisir/faire glisser/sélectionner.
- `browser screenshot` capture les pixels (page complète ou élément).
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un Node compatible navigateur est connecté, l’outil peut automatiquement lui acheminer les appels sauf si vous fixez `target="host"` ou `target="node"`.

Cela permet de garder l’agent déterministe et d’éviter les sélecteurs fragiles.

## Liés

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans des environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques et renforcement du contrôle du navigateur
