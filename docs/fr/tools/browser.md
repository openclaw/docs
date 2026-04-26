---
read_when:
    - Ajout de l’automatisation du Browser contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres et du cycle de vie du Browser dans l’app macOS
summary: Service intégré de contrôle du Browser + commandes d’action
title: Browser (géré par OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:39:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** que l’agent contrôle.
Il est isolé de votre navigateur personnel et est géré via un petit service de
contrôle local à l’intérieur de la Gateway (loopback local uniquement).

Vue débutant :

- Considérez-le comme un **navigateur distinct, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un cadre sûr.
- Le profil intégré `user` se rattache à votre vraie session Chrome connectée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Contrôle déterministe des onglets (lister/ouvrir/focaliser/fermer).
- Actions de l’agent (cliquer/saisir/glisser/sélectionner), instantanés, captures d’écran, PDF.
- Une skill `browser-automation` groupée qui apprend aux agents la boucle de récupération snapshot,
  stable-tab, stale-ref et manual-blocker lorsque le plugin browser est activé.
- Prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur principal au quotidien. C’est une surface isolée et sûre pour
l’automatisation et la vérification par agent.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez la
Gateway.

Si `openclaw browser` est totalement absent, ou si l’agent indique que l’outil browser
n’est pas disponible, allez directement à [Commande ou outil browser manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est un plugin groupé. Désactivez-le pour le remplacer par un autre plugin qui enregistre le même nom d’outil `browser` :

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le plugin supprime en une seule fois la CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil d’agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les modifications de configuration du browser nécessitent un redémarrage de la Gateway pour que le plugin puisse réenregistrer son service.

## Conseils pour l’agent

Note sur le profil d’outils : `tools.profile: "coding"` inclut `web_search` et
`web_fetch`, mais n’inclut pas l’outil `browser` complet. Si l’agent ou un
sous-agent lancé doit utiliser l’automatisation du browser, ajoutez browser au niveau
du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Pour un seul agent, utilisez `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` seul ne suffit pas, car la stratégie des sous-agents
est appliquée après le filtrage du profil.

Le plugin browser fournit deux niveaux de consignes pour l’agent :

- La description de l’outil `browser` contient le contrat compact toujours actif : choisir
  le bon profil, conserver les références sur le même onglet, utiliser `tabId`/les étiquettes pour cibler les onglets, et charger la skill browser pour les tâches en plusieurs étapes.
- La skill groupée `browser-automation` contient la boucle opératoire plus longue :
  vérifier d’abord l’état/les onglets, étiqueter les onglets de tâche, prendre un snapshot avant d’agir, reprendre un snapshot
  après les changements d’interface, récupérer une fois les références périmées, et signaler les blocages de connexion/2FA/captcha ou
  de caméra/microphone comme une action manuelle au lieu de deviner.

Les Skills groupées avec le plugin sont listées dans les skills disponibles de l’agent lorsque le
plugin est activé. Les instructions complètes de la skill sont chargées à la demande, de sorte que les tours habituels ne paient pas le coût complet en tokens.

## Commande ou outil browser manquant

Si `openclaw browser` est inconnu après une mise à niveau, si `browser.request` est absent, ou si l’agent signale que l’outil browser n’est pas disponible, la cause habituelle est une liste `plugins.allow` qui omet `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` et `tools.alsoAllow: ["browser"]` ne remplacent pas l’appartenance à l’allowlist — l’allowlist contrôle le chargement des plugins, et la stratégie d’outils n’est appliquée qu’après le chargement. Supprimer entièrement `plugins.allow` rétablit également la valeur par défaut.

## Profils : `openclaw` vs `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de rattachement Chrome MCP pour votre **vraie session Chrome connectée**.

Pour les appels de l’outil browser par l’agent :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions déjà connectées sont importantes et que l’utilisateur
  est devant l’ordinateur pour cliquer/approuver toute invite de rattachement.
- `profile` est le remplacement explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du browser se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- Le service de contrôle se lie au loopback local sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` ; définissez-les uniquement pour un CDP distant. `cdpUrl` utilise par défaut le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité HTTP CDP distantes et `attachOnly`
  ainsi qu’aux requêtes HTTP d’ouverture d’onglets ; `remoteCdpHandshakeTimeoutMs` s’applique à
  leurs handshakes WebSocket CDP.
- `localLaunchTimeoutMs` correspond au budget accordé à un processus Chrome géré lancé localement
  pour exposer son point de terminaison HTTP CDP. `localCdpReadyTimeoutMs` est le
  budget de suivi pour la préparation websocket CDP après la découverte du processus.
  Augmentez ces valeurs sur Raspberry Pi, VPS d’entrée de gamme ou matériel plus ancien où Chromium
  démarre lentement. Les valeurs doivent être des entiers positifs jusqu’à `120000` ms ; les valeurs de configuration invalides
  sont rejetées.
- `actionTimeoutMs` est le budget par défaut des requêtes browser `act` lorsque l’appelant ne transmet pas `timeoutMs`. Le transport client ajoute une petite marge afin que les longues attentes puissent se terminer au lieu d’expirer à la frontière HTTP.
- `tabCleanup` est un nettoyage au mieux pour les onglets ouverts par les sessions browser de l’agent principal. Le nettoyage du cycle de vie des sous-agents, de Cron et d’ACP continue de fermer leurs onglets explicitement suivis à la fin de la session ; les sessions principales conservent les onglets actifs réutilisables, puis ferment en arrière-plan les onglets suivis inactifs ou excédentaires.

</Accordion>

<Accordion title="Stratégie SSRF">

- La navigation browser et l’ouverture d’onglet sont protégées contre les SSRF avant la navigation, puis revérifiées au mieux sur l’URL finale `http(s)` après coup.
- En mode SSRF strict, la découverte des points de terminaison CDP distants et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- Les variables d’environnement Gateway/fournisseur `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et `NO_PROXY` ne proxifient pas automatiquement le browser géré par OpenClaw. Chrome géré est lancé en direct par défaut, afin que les paramètres de proxy du fournisseur n’affaiblissent pas les vérifications SSRF du browser.
- Pour proxifier le browser géré lui-même, transmettez des flags proxy Chrome explicites via `browser.extraArgs`, comme `--proxy-server=...` ou `--proxy-pac-url=...`. Le mode SSRF strict bloque le routage proxy explicite du browser, sauf si l’accès browser au réseau privé est activé intentionnellement.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès browser au réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie ne jamais lancer de navigateur local ; seulement s’y rattacher si un navigateur est déjà en cours d’exécution.
- `headless` peut être défini globalement ou par profil local géré. Les valeurs par profil remplacent `browser.headless`, de sorte qu’un profil lancé localement peut rester headless tandis qu’un autre reste visible.
- `POST /start?headless=true` et `openclaw browser start --headless` demandent un
  lancement headless ponctuel pour les profils locaux gérés, sans réécrire
  `browser.headless` ou la configuration du profil. Les profils existing-session, attach-only et
  CDP distants rejettent ce remplacement, car OpenClaw ne lance pas ces
  processus de navigateur.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils locaux gérés
  passent par défaut en mode headless automatiquement lorsque ni l’environnement ni la configuration du profil/global
  ne choisissent explicitement le mode avec interface. `openclaw browser status --json`
  rapporte `headlessSource` comme `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` force les lancements locaux gérés en mode headless pour le
  processus en cours. `OPENCLAW_BROWSER_HEADLESS=0` force le mode avec interface pour les
  démarrages ordinaires et renvoie une erreur exploitable sur les hôtes Linux sans serveur d’affichage ;
  une requête explicite `start --headless` l’emporte toujours pour ce lancement unique.
- `executablePath` peut être défini globalement ou par profil local géré. Les valeurs par profil remplacent `browser.executablePath`, de sorte que différents profils gérés peuvent lancer différents navigateurs basés sur Chromium. Les deux formes acceptent `~` pour votre répertoire personnel système.
- `color` (niveau supérieur et par profil) teinte l’interface du navigateur pour que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (instance gérée autonome). Utilisez `defaultProfile: "user"` pour choisir le navigateur utilisateur connecté.
- Ordre d’auto-détection : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu du CDP brut. Ne définissez pas `cdpUrl` pour ce driver.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil existing-session doit se rattacher à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.). Ce chemin accepte également `~` pour votre répertoire personnel système.

</Accordion>

</AccordionGroup>

## Utiliser Brave (ou un autre navigateur basé sur Chromium)

Si votre navigateur **par défaut du système** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
l’auto-détection. Les valeurs `executablePath` de niveau supérieur et par profil acceptent `~`
pour votre répertoire personnel système :

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

`executablePath` par profil n’affecte que les profils locaux gérés qu’OpenClaw
lance. Les profils `existing-session` se rattachent à la place à un navigateur
déjà en cours d’exécution, et les profils CDP distants utilisent le navigateur derrière `cdpUrl`.

## Contrôle local vs distant

- **Contrôle local (par défaut) :** la Gateway démarre le service de contrôle en loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui dispose du navigateur ; la Gateway lui transmet les actions du browser.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous rattacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.
- Pour les services CDP gérés en externe sur le loopback (par exemple Browserless dans
  Docker publié sur `127.0.0.1`), définissez également `attachOnly: true`. Un CDP loopback
  sans `attachOnly` est traité comme un profil de navigateur local géré par OpenClaw.
- `headless` n’affecte que les profils locaux gérés qu’OpenClaw lance. Il ne redémarre ni ne modifie les navigateurs `existing-session` ou CDP distants.
- `executablePath` suit la même règle de profil local géré. Le modifier sur un
  profil local géré en cours d’exécution marque ce profil pour redémarrage/réconciliation afin que le
  prochain lancement utilise le nouveau binaire.

Le comportement à l’arrêt diffère selon le mode de profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus du navigateur qu’OpenClaw a lancé
- profils `attach-only` et CDP distants : `openclaw browser stop` ferme la
  session de contrôle active et libère les remplacements d’émulation Playwright/CDP (viewport,
  schéma de couleurs, langue, fuseau horaire, mode hors ligne et état similaire), même
  si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (par ex. `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par ex. `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
jetons plutôt que de les commiter dans les fichiers de configuration.

## Proxy browser node (valeur par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui dispose de votre navigateur, OpenClaw peut
acheminer automatiquement les appels à l’outil browser vers ce node sans configuration browser supplémentaire.
C’est le chemin par défaut pour les Gateways distantes.

Remarques :

- L’hôte node expose son serveur local de contrôle du browser via une **commande proxy**.
- Les profils proviennent de la propre configuration `browser.profiles` du node (comme en local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent accessibles via le proxy, y compris les routes de création/suppression de profil.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils présents dans l’allowlist peuvent être ciblés, et les routes persistantes de création/suppression de profil sont bloquées sur la surface proxy.
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

- Remplacez `<BROWSERLESS_API_KEY>` par votre vrai jeton Browserless.
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (voir leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir en
  `wss://` pour une connexion CDP directe, soit conserver l’URL HTTPS et laisser OpenClaw
  découvrir `/json/version`.

### Browserless Docker sur le même hôte

Lorsque Browserless est auto-hébergé dans Docker et qu’OpenClaw s’exécute sur l’hôte, traitez
Browserless comme un service CDP géré en externe :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

L’adresse dans `browser.profiles.browserless.cdpUrl` doit être accessible depuis le
processus OpenClaw. Browserless doit aussi annoncer un point de terminaison accessible correspondant ;
définissez `EXTERNAL` dans Browserless sur cette même base WebSocket accessible à OpenClaw, telle que
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou une adresse Docker privée stable.
Si `/json/version` renvoie un `webSocketDebuggerUrl` pointant vers
une adresse qu’OpenClaw ne peut pas atteindre, le HTTP CDP peut sembler sain tandis que le rattachement WebSocket
échoue malgré tout.

Ne laissez pas `attachOnly` non défini pour un profil Browserless en loopback. Sans
`attachOnly`, OpenClaw traite le port loopback comme un profil de navigateur local géré
et peut signaler que le port est utilisé mais n’est pas détenu par OpenClaw.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois
formes d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  se connecte. Pas de repli WebSocket.
- **Points de terminaison WebSocket directs** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via un handshake WebSocket et ignore
  complètement `/json/version`.
- **Racines WebSocket nues** — `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw essaie d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, celui-ci est utilisé, sinon OpenClaw
  revient à un handshake WebSocket direct à la racine nue. Si le point de terminaison WebSocket annoncé
  rejette le handshake CDP mais que la racine nue configurée
  l’accepte, OpenClaw revient également à cette racine. Cela permet à un `ws://` nu
  pointé vers un Chrome local de toujours se connecter, puisque Chrome n’accepte les
  mises à niveau WebSocket que sur le chemin spécifique par cible fourni par `/json/version`, tandis que les fournisseurs
  hébergés peuvent toujours utiliser leur point de terminaison WebSocket racine lorsque leur point de découverte
  annonce une URL de courte durée qui n’est pas adaptée au CDP Playwright.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter des
navigateurs headless avec résolution intégrée de CAPTCHA, mode furtif et proxies
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

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé API**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket, donc
  aucune étape manuelle de création de session n’est nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois.
  Consultez la [tarification](https://www.browserbase.com/pricing) pour les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la
  référence API complète, les guides SDK et des exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du browser est limité au loopback ; l’accès passe par l’authentification de la Gateway ou l’appairage du node.
- L’API HTTP browser autonome en loopback utilise **uniquement une authentification par secret partagé** :
  auth bearer par jeton de gateway, `x-openclaw-password`, ou HTTP Basic avec le
  mot de passe de gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API browser autonome en loopback.
- Si le contrôle du browser est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère automatiquement `gateway.auth.token` au démarrage et le persiste dans la configuration.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` vaut déjà
  `password`, `none` ou `trusted-proxy`.
- Conservez la Gateway et tout hôte node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; préférez les variables d’environnement ou un gestionnaire de secrets.

Conseils pour le CDP distant :

- Préférez les points de terminaison chiffrés (HTTPS ou WSS) et les jetons de courte durée lorsque c’est possible.
- Évitez d’intégrer directement des jetons longue durée dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par OpenClaw** : une instance de navigateur basée sur Chromium dédiée avec son propre répertoire de données utilisateur + port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via auto-connexion Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour le rattachement `existing-session` Chrome MCP.
- Les profils `existing-session` sont opt-in au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués dans **18800–18899** par défaut.
- Supprimer un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut aussi se rattacher à un profil de navigateur déjà en cours d’exécution basé sur Chromium via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et d’installation :

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil `existing-session` personnalisé si vous souhaitez un
nom, une couleur ou un répertoire de données du navigateur différents.

Comportement par défaut :

- Le profil intégré `user` utilise l’auto-connexion Chrome MCP, qui cible le
  profil local Google Chrome par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium ou un profil Chrome non par défaut.
`~` est développé en votre répertoire personnel système :

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

Ensuite, dans le navigateur correspondant :

1. Ouvrez la page d’inspection de ce navigateur pour le débogage à distance.
2. Activez le débogage à distance.
3. Laissez le navigateur en cours d’exécution et approuvez l’invite de connexion quand OpenClaw s’y rattache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test de fumée de rattachement en direct :

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
- `snapshot` renvoie des refs depuis l’onglet actif sélectionné

Points à vérifier si le rattachement ne fonctionne pas :

- le navigateur ciblé basé sur Chromium est en version `144+`
- le débogage à distance est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de rattachement et vous l’avez acceptée
- `openclaw doctor` migre l’ancienne configuration browser basée sur extension et vérifie que
  Chrome est installé localement pour les profils d’auto-connexion par défaut, mais il ne peut pas
  activer pour vous le débogage à distance côté navigateur

Utilisation par l’agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état du navigateur connecté de l’utilisateur.
- Si vous utilisez un profil `existing-session` personnalisé, transmettez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  de rattachement.
- la Gateway ou l’hôte node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil isolé `openclaw`, car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il s’y rattache seulement.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, il est transmis pour cibler ce répertoire de données utilisateur.
- `existing-session` peut se rattacher sur l’hôte sélectionné ou via un
  node browser connecté. Si Chrome se trouve ailleurs et qu’aucun node browser n’est connecté, utilisez
  plutôt le CDP distant ou un hôte node.

### Lancement Chrome MCP personnalisé

Remplacez le serveur Chrome DevTools MCP lancé par profil lorsque le flux par défaut
`npx chrome-devtools-mcp@latest` ne vous convient pas (hôtes hors ligne,
versions épinglées, binaires fournis) :

| Champ        | Ce qu’il fait                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Exécutable à lancer à la place de `npx`. Résolu tel quel ; les chemins absolus sont respectés.                          |
| `mcpArgs`    | Tableau d’arguments transmis tel quel à `mcpCommand`. Remplace les arguments par défaut `chrome-devtools-mcp@latest --autoConnect`. |

Lorsque `cdpUrl` est défini sur un profil `existing-session`, OpenClaw ignore
`--autoConnect` et transmet automatiquement le point de terminaison à Chrome MCP :

- `http(s)://...` → `--browserUrl <url>` (point de terminaison de découverte HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direct).

Les indicateurs de point de terminaison et `userDataDir` ne peuvent pas être combinés : lorsque `cdpUrl` est défini,
`userDataDir` est ignoré pour le lancement de Chrome MCP, puisque Chrome MCP se rattache
au navigateur en cours d’exécution derrière le point de terminaison au lieu d’ouvrir un
répertoire de profil.

<Accordion title="Limites des fonctionnalités existing-session">

Par rapport au profil géré `openclaw`, les drivers `existing-session` sont plus contraints :

- **Captures d’écran** — les captures de page et les captures d’élément `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas requis pour les captures d’écran de page ou d’élément basées sur ref.
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des refs de snapshot (pas de sélecteurs CSS). `click-coords` clique sur des coordonnées visibles de viewport et ne nécessite pas de ref de snapshot. `click` prend uniquement en charge le bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge les délais d’expiration par appel. `select` accepte une seule valeur.
- **Attente / upload / boîte de dialogue** — `wait --url` prend en charge les motifs exacts, sous-chaîne et glob ; `wait --load networkidle` n’est pas pris en charge. Les hooks d’upload nécessitent `ref` ou `inputRef`, un fichier à la fois, sans `element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les remplacements de délai d’expiration.
- **Fonctionnalités réservées au mode géré** — les actions par lot, l’export PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin du navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les workflows de développement.
- **Contrôle déterministe des onglets** : `tabs` renvoie d’abord `suggestedTargetId`, puis
  des poignées `tabId` stables telles que `t1`, des étiquettes facultatives et le `targetId` brut.
  Les agents devraient réutiliser `suggestedTargetId` ; les identifiants bruts restent disponibles pour
  le débogage et la compatibilité.

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
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` et
  `/usr/lib/chromium-browser`.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultatif)

Pour les scripts et le débogage, la Gateway expose une petite **API HTTP de contrôle
limitée au loopback** ainsi qu’une CLI `openclaw browser` correspondante (snapshots, refs, attentes
renforcées, sortie JSON, workflows de débogage). Consultez
[API de contrôle du browser](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes spécifiques à Linux (en particulier snap Chromium), consultez
[Dépannage du browser](/fr/tools/browser-linux-troubleshooting).

Pour les configurations à hôtes séparés WSL2 Gateway + Chrome Windows, consultez
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP vs blocage SSRF de navigation

Il s’agit de classes d’échec différentes et elles pointent vers des chemins de code différents.

- **Échec de démarrage ou de préparation CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du browser est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du browser est sain, mais qu’une cible de navigation de page est rejetée par la stratégie.

Exemples courants :

- Échec de démarrage ou de préparation CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` lorsqu’un
    service CDP externe en loopback est configuré sans `attachOnly: true`
- Blocage SSRF de navigation :
  - les flux `open`, `navigate`, snapshot ou d’ouverture d’onglet échouent avec une erreur de stratégie browser/réseau alors que `start` et `tabs` fonctionnent toujours

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment lire les résultats :

- Si `start` échoue avec `not reachable after start`, commencez par dépanner la préparation CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours non sain. Traitez cela comme un problème d’accessibilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du browser fonctionne et l’échec se situe dans la stratégie de navigation ou la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants de comportement :

- La configuration browser utilise par défaut un objet de stratégie SSRF en échec fermé même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local en loopback `openclaw`, les vérifications d’état CDP ignorent intentionnellement l’application de l’accessibilité SSRF browser pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est distincte. Un résultat réussi pour `start` ou `tabs` ne signifie pas qu’une cible ultérieure de `open` ou `navigate` est autorisée.

Conseils de sécurité :

- **N’assouplissez pas** la stratégie SSRF du browser par défaut.
- Préférez des exceptions d’hôte étroites comme `hostnameAllowlist` ou `allowedHostnames` à un accès large au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements intentionnellement approuvés où l’accès browser au réseau privé est requis et revu.

## Outils agent + fonctionnement du contrôle

L’agent reçoit **un seul outil** pour l’automatisation du browser :

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie un arbre d’interface stable (AI ou ARIA).
- `browser act` utilise les identifiants `ref` du snapshot pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière, élément ou refs étiquetées).
- `browser doctor` vérifie la Gateway, le plugin, le profil, le navigateur et l’état de préparation des onglets.
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner où se trouve le navigateur.
  - Dans les sessions sandboxées, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions sandboxées utilisent par défaut `sandbox`, les sessions non sandboxées utilisent par défaut `host`.
  - Si un node compatible browser est connecté, l’outil peut s’y acheminer automatiquement sauf si vous épinglez `target="host"` ou `target="node"`.

Cela permet de garder l’agent déterministe et d’éviter les sélecteurs fragiles.

## Lié

- [Vue d’ensemble des outils](/fr/tools) — tous les outils agent disponibles
- [Sandboxing](/fr/gateway/sandboxing) — contrôle du browser dans les environnements sandboxés
- [Sécurité](/fr/gateway/security) — risques et durcissement du contrôle du browser
