---
read_when:
    - Ajouter une automatisation de navigateur contrôlée par l’agent
    - Débogage des raisons pour lesquelles openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres et du cycle de vie du navigateur dans l’application macOS
summary: Service de contrôle de navigateur intégré + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle.
Il est isolé de votre navigateur personnel et géré via un petit service de
contrôle local à l’intérieur de la Gateway (loopback uniquement).

Vue débutant :

- Considérez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un cadre sûr.
- Le profil intégré `user` se rattache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions de l’agent (cliquer/saisir/faire glisser/sélectionner), instantanés, captures d’écran, PDF.
- Une skill `browser-automation` intégrée qui apprend aux agents la boucle de récupération snapshot,
  stable-tab, stale-ref et manual-blocker lorsque le plugin navigateur est activé.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur du quotidien. C’est une surface
sûre et isolée pour l’automatisation et la vérification par l’agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez la
Gateway.

Si `openclaw browser` est complètement absent, ou si l’agent indique que l’outil navigateur
n’est pas disponible, passez à [Commande ou outil navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est un plugin intégré. Désactivez-le pour le remplacer par un autre plugin qui enregistre le même nom d’outil `browser` :

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le plugin supprime en un seul bloc la CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les changements de configuration du navigateur nécessitent un redémarrage de la Gateway afin que le plugin puisse réenregistrer son service.

## Directives pour l’agent

Le plugin navigateur fournit deux niveaux de directives pour l’agent :

- La description de l’outil `browser` contient le contrat compact toujours actif : choisir
  le bon profil, conserver les références sur le même onglet, utiliser `tabId`/les étiquettes pour cibler les onglets, et charger la skill navigateur pour les tâches en plusieurs étapes.
- La skill intégrée `browser-automation` contient la boucle de fonctionnement plus longue :
  vérifier d’abord l’état/les onglets, étiqueter les onglets de tâche, prendre un instantané avant d’agir, reprendre un instantané
  après les changements UI, récupérer une fois les références périmées, et signaler les blocages de connexion/2FA/captcha ou
  caméra/microphone comme une action manuelle au lieu de deviner.

Les skills intégrées au plugin sont listées dans les skills disponibles de l’agent lorsque le
plugin est activé. Les instructions complètes de la skill sont chargées à la demande, afin que les tours courants ne paient pas le coût total en jetons.

## Commande ou outil navigateur manquant

Si `openclaw browser` est inconnu après une mise à niveau, si `browser.request` est absent, ou si l’agent signale que l’outil navigateur n’est pas disponible, la cause habituelle est une liste `plugins.allow` qui omet `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` et `tools.alsoAllow: ["browser"]` ne remplacent pas l’appartenance à la liste d’autorisation — la liste d’autorisation contrôle le chargement du plugin, et la politique d’outil ne s’exécute qu’après le chargement. Supprimer complètement `plugins.allow` rétablit également le comportement par défaut.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de rattachement Chrome MCP à votre **vraie session Chrome connectée**.

Pour les appels d’outil navigateur de l’agent :

- Par défaut : utiliser le navigateur isolé `openclaw`.
- Préférer `profile="user"` lorsque les sessions connectées existantes sont importantes et que l’utilisateur
  est à l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est la surcharge explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // défaut : true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activez uniquement pour un accès au réseau privé approuvé intentionnellement
      // allowPrivateNetwork: true, // alias hérité
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // surcharge héritée à profil unique
    remoteCdpTimeoutMs: 1500, // délai d’attente HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’attente de la poignée de main WebSocket CDP distante (ms)
    localLaunchTimeoutMs: 15000, // délai d’attente de découverte Chrome géré localement (ms)
    localCdpReadyTimeoutMs: 8000, // délai d’attente de disponibilité CDP locale après lancement (ms)
    actionTimeoutMs: 60000, // délai d’attente par défaut des actions navigateur (ms)
    tabCleanup: {
      enabled: true, // défaut : true
      idleMinutes: 120, // définissez 0 pour désactiver le nettoyage des onglets inactifs
      maxTabsPerSession: 8, // définissez 0 pour désactiver la limite par session
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

- Le service de contrôle se lie à loopback sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` ; définissez-les uniquement pour le CDP distant. `cdpUrl` prend par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications de joignabilité HTTP CDP distantes (hors loopback) ; `remoteCdpHandshakeTimeoutMs` s’applique aux poignées de main WebSocket CDP distantes.
- `localLaunchTimeoutMs` est le budget accordé à un processus Chrome géré lancé localement
  pour exposer son point de terminaison HTTP CDP. `localCdpReadyTimeoutMs` est le
  budget de suivi pour la disponibilité du websocket CDP après la découverte du processus.
  Augmentez-les sur Raspberry Pi, sur VPS d’entrée de gamme ou sur du matériel ancien où Chromium
  démarre lentement. Les valeurs sont plafonnées à 120000 ms.
- `actionTimeoutMs` est le budget par défaut pour les requêtes navigateur `act` lorsque l’appelant ne passe pas `timeoutMs`. Le transport client ajoute une petite marge afin que les longues attentes puissent se terminer au lieu d’expirer à la frontière HTTP.
- `tabCleanup` est un nettoyage en mode best-effort des onglets ouverts par les sessions navigateur de l’agent principal. Le nettoyage du cycle de vie des sous-agents, de Cron et d’ACP continue de fermer leurs onglets explicitement suivis en fin de session ; les sessions principales conservent les onglets actifs réutilisables, puis ferment en arrière-plan les onglets suivis inactifs ou excédentaires.

</Accordion>

<Accordion title="Politique SSRF">

- La navigation du navigateur et l’ouverture d’onglet sont protégées contre les SSRF avant la navigation, puis revérifiées au mieux sur l’URL finale `http(s)` ensuite.
- En mode SSRF strict, la découverte de point de terminaison CDP distant et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- Les variables d’environnement Gateway/fournisseur `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et `NO_PROXY` ne proxifient pas automatiquement le navigateur géré par OpenClaw. Chrome géré est lancé en direct par défaut afin que les paramètres proxy du fournisseur n’affaiblissent pas les vérifications SSRF du navigateur.
- Pour proxifier le navigateur géré lui-même, passez des drapeaux proxy Chrome explicites via `browser.extraArgs`, tels que `--proxy-server=...` ou `--proxy-pac-url=...`. Le mode SSRF strict bloque le routage proxy explicite du navigateur, sauf si l’accès navigateur au réseau privé est activé intentionnellement.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès navigateur au réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie ne jamais lancer un navigateur local ; se rattacher uniquement s’il est déjà en cours d’exécution.
- `headless` peut être défini globalement ou par profil géré localement. Les valeurs par profil remplacent `browser.headless`, de sorte qu’un profil lancé localement peut rester sans interface tandis qu’un autre reste visible.
- `POST /start?headless=true` et `openclaw browser start --headless` demandent un
  lancement ponctuel en mode headless pour les profils gérés localement, sans réécrire
  `browser.headless` ni la configuration du profil. Les profils existing-session, attach-only et
  CDP distants rejettent cette surcharge parce qu’OpenClaw ne lance pas ces
  processus de navigateur.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils gérés localement
  passent automatiquement en mode headless par défaut lorsque ni l’environnement ni la configuration
  du profil/globale ne choisissent explicitement le mode avec interface. `openclaw browser status --json`
  signale `headlessSource` comme `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` force les lancements gérés localement en mode headless pour le
  processus courant. `OPENCLAW_BROWSER_HEADLESS=0` force le mode avec interface pour les démarrages ordinaires
  et renvoie une erreur exploitable sur les hôtes Linux sans serveur d’affichage ;
  une requête explicite `start --headless` l’emporte toujours pour ce lancement unique.
- `executablePath` peut être défini globalement ou par profil géré localement. Les valeurs par profil remplacent `browser.executablePath`, de sorte que différents profils gérés peuvent lancer différents navigateurs basés sur Chromium.
- `color` (au niveau supérieur et par profil) teinte l’UI du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (géré et autonome). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session doit se rattacher à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
l’auto-détection. `~` se développe vers votre répertoire personnel système :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou définissez-le dans la configuration, selon la plateforme :

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

`executablePath` par profil n’affecte que les profils gérés localement que OpenClaw
lance. Les profils `existing-session` se rattachent à un navigateur déjà en cours d’exécution
à la place, et les profils CDP distants utilisent le navigateur derrière `cdpUrl`.

## Contrôle local vs distant

- **Contrôle local (par défaut) :** la Gateway démarre le service de contrôle loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; la Gateway y relaie les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.
- `headless` n’affecte que les profils gérés localement que OpenClaw lance. Il ne redémarre ni ne modifie les navigateurs existing-session ou CDP distants.
- `executablePath` suit la même règle des profils gérés localement. Le modifier sur un
  profil géré localement en cours d’exécution marque ce profil pour redémarrage/réconciliation afin que le
  prochain lancement utilise le nouveau binaire.

Le comportement à l’arrêt diffère selon le mode de profil :

- profils gérés localement : `openclaw browser stop` arrête le processus navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distants : `openclaw browser stop` ferme la session de
  contrôle active et libère les surcharges d’émulation Playwright/CDP (viewport,
  schéma de couleurs, locale, fuseau horaire, mode hors ligne et états similaires), même
  si aucun processus navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex., `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex., `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour
les jetons au lieu de les valider dans les fichiers de configuration.

## Proxy navigateur node (zéro configuration par défaut)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
acheminer automatiquement les appels d’outil navigateur vers ce node sans configuration navigateur supplémentaire.
C’est le chemin par défaut pour les Gateways distantes.

Remarques :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du node (comme en local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement historique/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils sur liste d’autorisation peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur la gateway : `gateway.nodes.browser.mode="off"`

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser l’une ou l’autre forme, mais
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

- Remplacez `<BROWSERLESS_API_KEY>` par votre véritable jeton Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois
formes d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  s’y connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via une poignée de main WebSocket et ignore
  complètement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw essaie d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  se replie vers une poignée de main WebSocket directe à la racine nue. Cela permet à
  un `ws://` nu pointant vers un Chrome local de toujours se connecter, puisque Chrome n’accepte
  les montées en niveau WebSocket que sur le chemin spécifique par cible provenant de
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter
des navigateurs headless avec résolution intégrée des CAPTCHA, mode furtif et proxys résidentiels.

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
- Remplacez `<BROWSERBASE_API_KEY>` par votre véritable clé API Browserbase.
- Browserbase crée automatiquement une session navigateur à la connexion WebSocket, donc
  aucune étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois.
  Voir la [tarification](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Voir la [documentation Browserbase](https://docs.browserbase.com) pour la
  référence API complète, les guides SDK et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est limité au loopback ; l’accès passe par l’authentification de la Gateway ou l’appairage node.
- L’API HTTP autonome du navigateur sur loopback utilise **uniquement une authentification par secret partagé** :
  jeton bearer de gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le
  mot de passe gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome du navigateur sur loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` est
  déjà `password`, `none` ou `trusted-proxy`.
- Conservez la Gateway et tout hôte node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez les variables d’environnement ou un gestionnaire de secrets.

Conseils CDP distants :

- Préférez les points de terminaison chiffrés (HTTPS ou WSS) et les jetons à courte durée de vie lorsque c’est possible.
- Évitez d’intégrer directement des jetons à longue durée de vie dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par OpenClaw** : une instance de navigateur basé sur Chromium dédiée avec son propre répertoire de données utilisateur + port CDP
- **distant** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via l’auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il est manquant.
- Le profil `user` est intégré pour le rattachement existing-session Chrome MCP.
- Les profils existing-session sont opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués à partir de **18800–18899** par défaut.
- La suppression d’un profil déplace son répertoire de données locales vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut également se rattacher à un profil de navigateur basé sur Chromium en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil existing-session personnalisé si vous voulez un
nom, une couleur ou un répertoire de données du navigateur différents.

Comportement par défaut :

- Le profil intégré `user` utilise l’auto-connexion Chrome MCP, qui cible le
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
3. Laissez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsque OpenClaw s’y rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test fumée de rattachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

À quoi ressemble une réussite :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste les onglets déjà ouverts de votre navigateur
- `snapshot` renvoie des références depuis l’onglet actif sélectionné

Ce qu’il faut vérifier si le rattachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement au rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration navigateur basée sur extension et vérifie que
  Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas
  activer le débogage à distance côté navigateur à votre place

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil existing-session personnalisé, passez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est à l’ordinateur pour approuver l’invite
  de rattachement.
- la Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw` parce qu’il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il s’y rattache uniquement.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, il est transmis pour cibler ce répertoire de données utilisateur.
- Existing-session peut se rattacher sur l’hôte sélectionné ou via un
  node navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun node navigateur n’est connecté, utilisez
  plutôt le CDP distant ou un hôte node.

### Lancement Chrome MCP personnalisé

Remplacez le serveur Chrome DevTools MCP lancé par profil lorsque le flux par défaut
`npx chrome-devtools-mcp@latest` n’est pas ce que vous voulez (hôtes hors ligne,
versions épinglées, binaires fournis) :

| Champ        | Ce qu’il fait                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Exécutable à lancer à la place de `npx`. Résolu tel quel ; les chemins absolus sont respectés.                           |
| `mcpArgs`    | Tableau d’arguments transmis tel quel à `mcpCommand`. Remplace les arguments par défaut `chrome-devtools-mcp@latest --autoConnect`. |

Lorsque `cdpUrl` est défini sur un profil existing-session, OpenClaw ignore
`--autoConnect` et transmet automatiquement le point de terminaison à Chrome MCP :

- `http(s)://...` → `--browserUrl <url>` (point de terminaison de découverte HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direct).

Les drapeaux de point de terminaison et `userDataDir` ne peuvent pas être combinés : lorsque `cdpUrl` est défini,
`userDataDir` est ignoré pour le lancement de Chrome MCP, puisque Chrome MCP se rattache
au navigateur en cours d’exécution derrière le point de terminaison au lieu d’ouvrir un
répertoire de profil.

<Accordion title="Limites des fonctionnalités existing-session">

Comparés au profil géré `openclaw`, les drivers existing-session sont plus contraints :

- **Captures d’écran** — les captures de page et les captures d’éléments `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas requis pour les captures d’écran de page ou d’éléments basées sur des refs.
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des refs d’instantané (pas de sélecteurs CSS). `click-coords` clique sur des coordonnées visibles du viewport et ne nécessite pas de ref d’instantané. `click` est limité au bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge de délais d’attente par appel. `select` accepte une seule valeur.
- **Attente / envoi / boîte de dialogue** — `wait --url` prend en charge les motifs exacts, sous-chaîne et glob ; `wait --load networkidle` n’est pas pris en charge. Les hooks d’envoi nécessitent `ref` ou `inputRef`, un fichier à la fois, sans `element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les surcharges de délai d’attente.
- **Fonctionnalités réservées au mode géré** — les actions par lot, l’export PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les flux de travail de développement.
- **Contrôle déterministe des onglets** : `tabs` renvoie d’abord `suggestedTargetId`, puis
  des handles `tabId` stables tels que `t1`, des étiquettes facultatives, et le `targetId` brut.
  Les agents doivent réutiliser `suggestedTargetId` ; les ids bruts restent disponibles pour le
  débogage et la compatibilité.

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
- Linux : vérifie les emplacements courants de Chrome/Brave/Edge/Chromium sous `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, et
  `/usr/lib/chromium-browser`.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour le scripting et le débogage, la Gateway expose une petite **API HTTP de contrôle limitée au loopback**
ainsi qu’une CLI `openclaw browser` correspondante (instantanés, refs, améliorations wait,
sortie JSON, flux de travail de débogage). Voir
[API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes spécifiques à Linux (en particulier Chromium snap), voir
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations à hôtes séparés WSL2 Gateway + Chrome Windows, voir
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
  - les flux `open`, `navigate`, snapshot ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau tandis que `start` et `tabs` continuent de fonctionner

Utilisez cette séquence minimale pour séparer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment lire les résultats :

- Si `start` échoue avec `not reachable after start`, dépannez d’abord la disponibilité CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours malsain. Traitez cela comme un problème de joignabilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est opérationnel et l’échec se situe dans la politique de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails de comportement importants :

- La configuration du navigateur utilise par défaut un objet de politique SSRF en échec fermé même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local loopback `openclaw`, les vérifications de santé CDP ignorent intentionnellement l’application de la joignabilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est séparée. Un résultat réussi de `start` ou `tabs` ne signifie pas qu’une cible `open` ou `navigate` ultérieure est autorisée.

Conseils de sécurité :

- **N’assouplissez pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites telles que `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un large accès au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement approuvés où l’accès navigateur au réseau privé est requis et revu.

## Outils agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du navigateur :

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre UI stable (AI ou ARIA).
- `browser act` utilise les ids `ref` de l’instantané pour cliquer/saisir/faire glisser/sélectionner.
- `browser screenshot` capture les pixels (page complète, élément ou refs étiquetées).
- `browser doctor` vérifie l’état de préparation de la Gateway, du plugin, du profil, du navigateur et des onglets.
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner où se trouve le navigateur.
  - Dans les sessions en bac à sable, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions en bac à sable utilisent par défaut `sandbox`, les sessions hors bac à sable utilisent par défaut `host`.
  - Si un node capable de gérer le navigateur est connecté, l’outil peut s’y acheminer automatiquement sauf si vous épinglez `target="host"` ou `target="node"`.

Cela garde l’agent déterministe et évite les sélecteurs fragiles.

## Liens connexes

- [Vue d’ensemble des outils](/fr/tools) — tous les outils agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du navigateur dans des environnements en bac à sable
- [Sécurité](/fr/gateway/security) — risques du contrôle du navigateur et renforcement
