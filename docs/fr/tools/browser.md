---
read_when:
    - Ajouter l’automatisation du navigateur contrôlée par l’agent
    - Déboguer pourquoi openclaw interfère avec votre propre Chrome
    - Implémentation des paramètres du navigateur et du cycle de vie dans l’app macOS
summary: Service de contrôle de navigateur intégré + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** contrôlé par l’agent.
Il est isolé de votre navigateur personnel et géré via un petit service de
contrôle local dans le Gateway (loopback uniquement).

Vue débutant :

- Considérez-le comme un **navigateur séparé, réservé à l’agent**.
- Le profil `openclaw` ne touche **pas** à votre profil de navigateur personnel.
- L’agent peut **ouvrir des onglets, lire des pages, cliquer et saisir du texte** dans un couloir sécurisé.
- Le profil `user` intégré se connecte à votre vraie session Chrome déjà authentifiée via Chrome MCP.

## Ce que vous obtenez

- Un profil de navigateur séparé nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (lister/ouvrir/mettre au premier plan/fermer).
- Des actions d’agent (cliquer/saisir/glisser/sélectionner), des instantanés, captures d’écran et PDF.
- Une Skill `browser-automation` intégrée qui enseigne aux agents la boucle de
  récupération pour instantané, onglet stable, référence obsolète et blocage manuel lorsque le
  Plugin de navigateur est activé.
- Une prise en charge multiprofil facultative (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** votre navigateur quotidien. C’est une surface sûre et isolée pour
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

Si vous obtenez « Browser disabled », activez-le dans la configuration (voir ci-dessous) et redémarrez le
Gateway.

Si `openclaw browser` est entièrement absent, ou si l’agent indique que l’outil de navigateur
est indisponible, passez à [Commande ou outil de navigateur manquant](/fr/tools/browser#missing-browser-command-or-tool).

## Contrôle du Plugin

L’outil `browser` par défaut est un Plugin intégré. Désactivez-le pour le remplacer par un autre Plugin qui enregistre le même nom d’outil `browser` :

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. Désactiver uniquement le Plugin supprime le CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil d’agent et le service de contrôle comme une seule unité ; votre configuration `browser.*` reste intacte pour un remplacement.

Les changements de configuration du navigateur nécessitent un redémarrage du Gateway afin que le Plugin puisse réenregistrer son service.

## Conseils pour les agents

Remarque sur le profil d’outils : `tools.profile: "coding"` inclut `web_search` et
`web_fetch`, mais il n’inclut pas l’outil `browser` complet. Si l’agent ou un
sous-agent lancé doit utiliser l’automatisation du navigateur, ajoutez browser à l’étape du profil :

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Pour un agent unique, utilisez `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` seul ne suffit pas, car la politique de sous-agent
est appliquée après le filtrage de profil.

Le Plugin de navigateur fournit deux niveaux de conseils pour les agents :

- La description de l’outil `browser` porte le contrat compact toujours actif : choisir
  le bon profil, conserver les références sur le même onglet, utiliser `tabId`/les libellés pour cibler les onglets,
  et charger la Skill de navigateur pour les travaux en plusieurs étapes.
- La Skill `browser-automation` intégrée porte la boucle d’exploitation plus longue :
  vérifier d’abord l’état/les onglets, étiqueter les onglets de tâche, prendre un instantané avant d’agir, reprendre un instantané
  après les changements d’interface, récupérer une fois les références obsolètes, et signaler les blocages de connexion/2FA/captcha ou
  caméra/microphone comme action manuelle au lieu de deviner.

Les Skills intégrées aux Plugins sont listées dans les Skills disponibles de l’agent lorsque le
Plugin est activé. Les instructions complètes de la Skill sont chargées à la demande, de sorte que les tours
courants ne paient pas le coût complet en jetons.

## Commande ou outil de navigateur manquant

Si `openclaw browser` est inconnu après une mise à niveau, si `browser.request` est absent, ou si l’agent signale que l’outil de navigateur est indisponible, la cause habituelle est une liste `plugins.allow` qui omet `browser` et l’absence de bloc de configuration racine `browser`. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloc racine `browser` explicite, par exemple `browser.enabled=true` ou `browser.profiles.<name>`, active le Plugin de navigateur intégré même avec un `plugins.allow` restrictif, comme le comportement de configuration des canaux. `plugins.entries.browser.enabled=true` et `tools.alsoAllow: ["browser"]` ne remplacent pas à eux seuls l’appartenance à la liste d’autorisation. Supprimer entièrement `plugins.allow` restaure également la valeur par défaut.

## Profils : `openclaw` contre `user`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil intégré de connexion Chrome MCP pour votre **vraie session Chrome authentifiée**.

Pour les appels d’outil de navigateur par agent :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="user"` lorsque les sessions déjà connectées comptent et que l’utilisateur
  est devant l’ordinateur pour cliquer/approuver toute invite de connexion.
- `profile` est le remplacement explicite lorsque vous voulez un mode de navigateur spécifique.

Définissez `browser.defaultProfile: "openclaw"` si vous voulez le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

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

### Vision de capture d’écran (prise en charge des modèles texte uniquement)

Lorsque le modèle principal est texte uniquement (sans prise en charge vision/multimodale), les captures d’écran du navigateur
renvoient des blocs d’image que le modèle ne peut pas lire. Les captures d’écran du navigateur
réutilisent la configuration existante de compréhension d’image ; ainsi, un modèle d’image
configuré pour la compréhension des médias peut décrire les captures d’écran sous forme de texte sans aucun
paramètre de modèle spécifique au navigateur.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Fonctionnement :**

1. L’agent appelle `browser screenshot` → l’image est capturée sur disque comme d’habitude.
2. L’outil de navigateur demande au runtime existant de compréhension d’image s’il
   peut décrire la capture d’écran à l’aide des modèles média image configurés, des modèles média
   partagés, des valeurs par défaut de modèle d’image ou d’un fournisseur d’image adossé à l’authentification.
3. Le modèle de vision renvoie une description textuelle, qui est enveloppée avec
   `wrapExternalContent` (protection contre l’injection de prompt) et renvoyée à l’agent
   sous forme de bloc de texte au lieu d’un bloc d’image.
4. Si la compréhension d’image est indisponible, ignorée ou échoue, le navigateur revient
   au renvoi du bloc d’image d’origine.

Utilisez les champs existants `tools.media.image` / `tools.media.models` pour les
solutions de repli de modèles, délais d’expiration, limites d’octets, profils et paramètres de requête fournisseur.

Si le modèle principal actif prend déjà en charge la vision et qu’aucun modèle explicite de
compréhension d’image n’est configuré, OpenClaw conserve le résultat d’image normal afin que le
modèle principal puisse lire directement la capture d’écran.

<AccordionGroup>

<Accordion title="Ports et accessibilité">

- Le service de contrôle se lie au loopback sur un port dérivé de `gateway.port` (par défaut `18791` = gateway + 2). Remplacer `gateway.port` ou `OPENCLAW_GATEWAY_PORT` décale les ports dérivés dans la même famille.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` ; définissez-les uniquement pour
  les profils CDP distants ou la connexion à un point de terminaison de session existante. `cdpUrl` utilise par défaut
  le port CDP local géré lorsqu’il n’est pas défini.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité HTTP CDP distantes et `attachOnly`
  ainsi qu’aux requêtes HTTP d’ouverture d’onglet ; `remoteCdpHandshakeTimeoutMs` s’applique à
  leurs poignées de main WebSocket CDP.
- `localLaunchTimeoutMs` est le budget pour qu’un processus Chrome géré lancé localement
  expose son point de terminaison HTTP CDP. `localCdpReadyTimeoutMs` est le
  budget de suivi pour la disponibilité websocket CDP après la découverte du processus.
  Augmentez-les sur Raspberry Pi, VPS bas de gamme ou matériel plus ancien où Chromium
  démarre lentement. Les valeurs doivent être des entiers positifs jusqu’à `120000` ms ; les valeurs de
  configuration invalides sont rejetées.
- Les échecs répétés de lancement/disponibilité de Chrome géré sont mis en circuit ouvert par
  profil. Après plusieurs échecs consécutifs, OpenClaw suspend brièvement les nouvelles tentatives
  de lancement au lieu de démarrer Chromium à chaque appel d’outil de navigateur. Corrigez
  le problème de démarrage, désactivez le navigateur s’il n’est pas nécessaire, ou redémarrez le
  Gateway après réparation.
- `actionTimeoutMs` est le budget par défaut pour les requêtes `act` du navigateur lorsque l’appelant ne transmet pas `timeoutMs`. Le transport client ajoute une petite fenêtre de marge afin que les attentes longues puissent se terminer au lieu d’expirer à la frontière HTTP.
- `tabCleanup` est un nettoyage au mieux des onglets ouverts par les sessions de navigateur de l’agent principal. Le nettoyage du cycle de vie des sous-agents, de Cron et d’ACP ferme toujours leurs onglets explicitement suivis en fin de session ; les sessions principales gardent les onglets actifs réutilisables, puis ferment en arrière-plan les onglets suivis inactifs ou excédentaires.

</Accordion>

<Accordion title="Politique SSRF">

- La navigation du navigateur et l’ouverture d’onglets sont protégées contre la SSRF avant la navigation et revérifiées au mieux sur l’URL `http(s)` finale ensuite.
- En mode SSRF strict, la découverte des points de terminaison CDP distants et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- Les variables d’environnement `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et `NO_PROXY` du Gateway/fournisseur ne proxifient pas automatiquement le navigateur géré par OpenClaw. Chrome géré se lance directement par défaut, afin que les paramètres de proxy du fournisseur n’affaiblissent pas les vérifications SSRF du navigateur.
- Les sondes de disponibilité CDP locales gérées par OpenClaw et les connexions WebSocket DevTools contournent le proxy réseau géré pour le point de terminaison local loopback exact lancé, afin que `openclaw browser start` fonctionne toujours lorsqu’un proxy opérateur bloque la sortie local loopback.
- Pour proxifier le navigateur géré lui-même, passez des indicateurs de proxy Chrome explicites via `browser.extraArgs`, tels que `--proxy-server=...` ou `--proxy-pac-url=...`. Le mode SSRF strict bloque le routage explicite du proxy du navigateur, sauf si l’accès du navigateur au réseau privé est intentionnellement activé.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; activez-le uniquement lorsque l’accès du navigateur au réseau privé est intentionnellement approuvé.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge comme alias hérité.

</Accordion>

<Accordion title="Comportement du profil">

- `attachOnly: true` signifie ne jamais lancer de navigateur local ; s’attacher uniquement si un navigateur est déjà en cours d’exécution.
- `headless` peut être défini globalement ou par profil local géré. Les valeurs par profil remplacent `browser.headless`, ce qui permet à un profil lancé localement de rester en mode headless tandis qu’un autre reste visible.
- `POST /start?headless=true` et `openclaw browser start --headless` demandent un
  lancement headless ponctuel pour les profils locaux gérés, sans réécrire
  `browser.headless` ni la configuration du profil. Les profils de session existante, attach-only et
  CDP distants rejettent le remplacement, car OpenClaw ne lance pas ces
  processus de navigateur.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils locaux gérés
  passent automatiquement en mode headless par défaut lorsque ni l’environnement ni la configuration de profil/globale
  ne choisissent explicitement le mode avec interface. `openclaw browser status --json`
  signale `headlessSource` comme `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` force les lancements locaux gérés en mode headless pour le
  processus courant. `OPENCLAW_BROWSER_HEADLESS=0` force le mode avec interface pour les démarrages
  ordinaires et renvoie une erreur exploitable sur les hôtes Linux sans serveur d’affichage ;
  une demande explicite `start --headless` reste prioritaire pour ce lancement unique.
- `executablePath` peut être défini globalement ou par profil local géré. Les valeurs par profil remplacent `browser.executablePath`, ce qui permet à différents profils gérés de lancer différents navigateurs basés sur Chromium. Les deux formes acceptent `~` pour le répertoire personnel de votre OS.
- `color` (au niveau supérieur et par profil) teinte l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (autonome géré). Utilisez `defaultProfile: "user"` pour opter pour le navigateur utilisateur connecté.
- Ordre de détection automatique : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu de CDP brut. Il peut s’attacher via la connexion automatique Chrome MCP, ou via `cdpUrl` lorsque vous disposez déjà d’un point de terminaison DevTools pour le navigateur en cours d’exécution.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil de session existante doit s’attacher à un profil utilisateur Chromium non par défaut (Brave, Edge, etc.). Ce chemin accepte également `~` pour le répertoire personnel de votre OS.

</Accordion>

</AccordionGroup>

## Utiliser Brave ou un autre navigateur basé sur Chromium

Si votre navigateur **système par défaut** est basé sur Chromium (Chrome/Brave/Edge/etc),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
la détection automatique. Les valeurs `executablePath` au niveau supérieur et par profil acceptent `~`
pour le répertoire personnel de votre OS :

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou définissez-le dans la configuration, par plateforme :

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
lance. Les profils `existing-session` s’attachent plutôt à un navigateur déjà en cours d’exécution,
et les profils CDP distants utilisent le navigateur derrière `cdpUrl`.

## Contrôle local ou distant

- **Contrôle local (par défaut) :** le Gateway démarre le service de contrôle local loopback et peut lancer un navigateur local.
- **Contrôle distant (hôte node) :** exécutez un hôte node sur la machine qui possède le navigateur ; le Gateway lui proxifie les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous attacher à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.
- Pour les services CDP gérés en externe sur local loopback (par exemple Browserless dans
  Docker publié sur `127.0.0.1`), définissez également `attachOnly: true`. Le CDP local loopback
  sans `attachOnly` est traité comme un profil de navigateur local géré par OpenClaw.
- `headless` n’affecte que les profils locaux gérés qu’OpenClaw lance. Il ne redémarre ni ne modifie les navigateurs de session existante ou CDP distants.
- `executablePath` suit la même règle de profil local géré. Le modifier sur un
  profil local géré en cours d’exécution marque ce profil pour redémarrage/réconciliation, afin que le
  prochain lancement utilise le nouveau binaire.

Le comportement d’arrêt diffère selon le mode de profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus de navigateur que
  OpenClaw a lancé
- profils attach-only et CDP distants : `openclaw browser stop` ferme la session de
  contrôle active et libère les remplacements d’émulation Playwright/CDP (fenêtre d’affichage,
  jeu de couleurs, locale, fuseau horaire, mode hors ligne et état similaire), même
  si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure une authentification :

- Jetons de requête (p. ex., `https://provider.example?token=<token>`)
- Authentification HTTP Basic (p. ex., `https://user:pass@provider.example`)

OpenClaw préserve l’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
jetons plutôt que de les valider dans des fichiers de configuration.

## Proxy du navigateur node (par défaut sans configuration)

Si vous exécutez un **hôte node** sur la machine qui possède votre navigateur, OpenClaw peut
router automatiquement les appels d’outils de navigateur vers ce node sans configuration de navigateur supplémentaire.
C’est le chemin par défaut pour les gateways distants.

Remarques :

- L’hôte node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la configuration `browser.profiles` propre au node (identique au local).
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour le comportement hérité/par défaut : tous les profils configurés restent joignables via le proxy, y compris les routes de création/suppression de profils.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une frontière de moindre privilège : seuls les profils dans la liste d’autorisation peuvent être ciblés, et les routes persistantes de création/suppression de profils sont bloquées sur la surface proxy.
- Désactivez-le si vous n’en voulez pas :
  - Sur le node : `nodeHost.browserProxy.enabled=false`
  - Sur le gateway : `gateway.nodes.browser.mode="off"`

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
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (consultez leur documentation).
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

L’adresse dans `browser.profiles.browserless.cdpUrl` doit être joignable depuis le
processus OpenClaw. Browserless doit aussi annoncer un point de terminaison joignable correspondant ;
définissez `EXTERNAL` de Browserless sur cette même base WebSocket publique pour OpenClaw, par exemple
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou une adresse réseau Docker privée
stable. Si `/json/version` renvoie `webSocketDebuggerUrl` pointant vers
une adresse qu’OpenClaw ne peut pas joindre, le HTTP CDP peut sembler sain alors que l’attachement
WebSocket échoue tout de même.

Ne laissez pas `attachOnly` non défini pour un profil Browserless local loopback. Sans
`attachOnly`, OpenClaw traite le port local loopback comme un profil de navigateur local géré
et peut signaler que le port est utilisé mais n’appartient pas à OpenClaw.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison **WebSocket direct** plutôt que
la découverte CDP standard basée sur HTTP (`/json/version`). OpenClaw accepte trois
formes d’URL CDP et choisit automatiquement la bonne stratégie de connexion :

- **Découverte HTTP(S)** - `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l’URL du débogueur WebSocket, puis
  se connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** - `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` avec un chemin `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement via une poignée de main WebSocket et ignore
  entièrement `/json/version`.
- **Racines WebSocket nues** - `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (p. ex. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw essaie d’abord la découverte HTTP
  `/json/version` (en normalisant le schéma en `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, il est utilisé, sinon OpenClaw
  se replie sur une poignée de main WebSocket directe à la racine nue. Si le point de terminaison
  WebSocket annoncé rejette la poignée de main CDP mais que la racine nue configurée
  l’accepte, OpenClaw se replie également sur cette racine. Cela permet à une racine nue `ws://`
  pointant vers un Chrome local de se connecter quand même, puisque Chrome n’accepte les mises à niveau WebSocket
  que sur le chemin spécifique par cible issu de `/json/version`, tandis que les fournisseurs hébergés
  peuvent toujours utiliser leur point de terminaison WebSocket racine lorsque leur point de terminaison de découverte
  annonce une URL de courte durée qui n’est pas adaptée au CDP Playwright.

`openclaw browser doctor` utilise la même logique découverte d’abord, repli WebSocket
que l’attachement à l’exécution, de sorte qu’une URL racine nue qui se connecte avec succès n’est pas
signalée comme inaccessible par les diagnostics.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud pour exécuter
des navigateurs headless avec résolution de CAPTCHA intégrée, mode furtif et proxies résidentiels.

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

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **clé d’API**
  depuis le [tableau de bord de présentation](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre vraie clé d’API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la connexion WebSocket ; aucune
  étape de création manuelle de session n’est donc nécessaire.
- L’offre gratuite autorise une session simultanée et une heure de navigateur par mois.
  Consultez les [tarifs](https://www.browserbase.com/pricing) pour connaître les limites des offres payantes.
- Consultez la [documentation Browserbase](https://docs.browserbase.com) pour la référence complète de l’API,
  les guides SDK et les exemples d’intégration.

### Notte

[Notte](https://www.notte.cc) est une plateforme cloud pour exécuter des
navigateurs headless avec furtivité intégrée, proxys résidentiels et Gateway
WebSocket natif CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Remarques :

- [Inscrivez-vous](https://console.notte.cc) et copiez votre **clé d’API** depuis la
  page des paramètres de la console.
- Remplacez `<NOTTE_API_KEY>` par votre vraie clé d’API Notte.
- Notte crée automatiquement une session de navigateur lors de la connexion WebSocket ; aucune étape
  de création manuelle de session n’est donc nécessaire. La session est détruite lorsque la
  connexion WebSocket est interrompue.
- L’offre gratuite autorise cinq sessions simultanées et 100 heures de navigateur
  à vie. Consultez les [tarifs](https://www.notte.cc/#pricing) pour connaître les limites des offres payantes.
- Consultez la [documentation Notte](https://docs.notte.cc) pour la référence complète de l’API, les guides SDK
  et les exemples d’intégration.

## Sécurité

Idées clés :

- Le contrôle du navigateur est réservé au local loopback ; l’accès passe par l’authentification du Gateway ou l’association de nœuds.
- L’API HTTP autonome de navigateur local loopback utilise **uniquement l’authentification par secret partagé** :
  authentification bearer par jeton Gateway, `x-openclaw-password`, ou authentification HTTP Basic avec le
  mot de passe Gateway configuré.
- Les en-têtes d’identité Tailscale Serve et `gateway.auth.mode: "trusted-proxy"` n’authentifient
  **pas** cette API autonome de navigateur local loopback.
- Si le contrôle du navigateur est activé et qu’aucune authentification par secret partagé n’est configurée, OpenClaw
  génère un jeton Gateway uniquement valable à l’exécution pour ce démarrage. Configurez
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou
  `OPENCLAW_GATEWAY_PASSWORD` explicitement si les clients ont besoin d’un secret stable entre les
  redémarrages.
- OpenClaw ne génère **pas** automatiquement ce jeton lorsque `gateway.auth.mode` vaut déjà
  `password`, `none` ou `trusted-proxy`.
- Gardez le Gateway et tous les hôtes de nœud sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL/jetons CDP distants comme des secrets ; privilégiez les variables d’environnement ou un gestionnaire de secrets.

Conseils pour CDP distant :

- Privilégiez les points de terminaison chiffrés (HTTPS ou WSS) et les jetons à courte durée de vie quand c’est possible.
- Évitez d’intégrer des jetons à longue durée de vie directement dans les fichiers de configuration.

## Profils (multi-navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par openclaw** : une instance de navigateur dédiée basée sur Chromium avec son propre répertoire de données utilisateur + port CDP
- **distant** : une URL CDP explicite (navigateur basé sur Chromium exécuté ailleurs)
- **session existante** : votre profil Chrome existant via la connexion automatique Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s’il manque.
- Le profil `user` est intégré pour l’attachement à une session existante avec Chrome MCP.
- Les profils de session existante sont optionnels au-delà de `user` ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont alloués par défaut dans la plage **18800-18899**.
- La suppression d’un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut aussi s’attacher à un profil de navigateur basé sur Chromium en cours d’exécution via le
serveur officiel Chrome DevTools MCP. Cela réutilise les onglets et l’état de connexion
déjà ouverts dans ce profil de navigateur.

Références officielles de contexte et de configuration :

- [Chrome for Developers : utiliser Chrome DevTools MCP avec votre session de navigateur](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré :

- `user`

Facultatif : créez votre propre profil personnalisé de session existante si vous voulez un
nom, une couleur ou un répertoire de données de navigateur différent.

Comportement par défaut :

- Le profil intégré `user` utilise la connexion automatique Chrome MCP, qui cible le
  profil Google Chrome local par défaut.

Utilisez `userDataDir` pour Brave, Edge, Chromium ou un profil Chrome non défini par défaut.
`~` s’étend vers le répertoire personnel de votre système d’exploitation :

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

1. Ouvrez la page d’inspection de ce navigateur pour le débogage distant.
2. Activez le débogage distant.
3. Gardez le navigateur en cours d’exécution et approuvez l’invite de connexion lorsque OpenClaw s’attache.

Pages d’inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test rapide d’attachement en direct :

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Résultat attendu en cas de réussite :

- `status` affiche `driver: existing-session`
- `status` affiche `transport: chrome-mcp`
- `status` affiche `running: true`
- `tabs` liste vos onglets de navigateur déjà ouverts
- `snapshot` renvoie des références depuis l’onglet actif sélectionné

Points à vérifier si l’attachement ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage distant est activé dans la page d’inspection de ce navigateur
- le navigateur a affiché l’invite de consentement à l’attachement et vous l’avez acceptée
- si Chrome a été démarré avec un `--remote-debugging-port` explicite, définissez
  `browser.profiles.<name>.cdpUrl` sur ce point de terminaison DevTools au lieu de vous appuyer
  sur la connexion automatique Chrome MCP
- `openclaw doctor` migre l’ancienne configuration de navigateur basée sur extension et vérifie que
  Chrome est installé localement pour les profils de connexion automatique par défaut, mais il ne peut pas
  activer le débogage distant côté navigateur à votre place

Utilisation par agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état connecté du navigateur de l’utilisateur.
- Si vous utilisez un profil personnalisé de session existante, transmettez ce nom de profil explicite.
- Choisissez ce mode uniquement lorsque l’utilisateur est devant l’ordinateur pour approuver l’invite
  d’attachement.
- le Gateway ou l’hôte de nœud peut lancer `npx chrome-devtools-mcp@latest --autoConnect`

Remarques :

- Ce chemin est plus risqué que le profil `openclaw` isolé, car il peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce driver ; il s’y attache seulement.
- OpenClaw utilise ici le flux officiel Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` est défini, il est transmis pour cibler ce répertoire de données utilisateur.
- Une session existante peut s’attacher sur l’hôte sélectionné ou via un
  nœud de navigateur connecté. Si Chrome se trouve ailleurs et qu’aucun nœud de navigateur n’est connecté, utilisez
  CDP distant ou un hôte de nœud à la place.

### Lancement Chrome MCP personnalisé

Remplacez le serveur Chrome DevTools MCP lancé pour chaque profil lorsque le flux par défaut
`npx chrome-devtools-mcp@latest` n’est pas celui que vous voulez (hôtes hors ligne,
versions épinglées, binaires intégrés au dépôt) :

| Champ        | Ce qu’il fait                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Exécutable à lancer à la place de `npx`. Résolu tel quel ; les chemins absolus sont respectés.                            |
| `mcpArgs`    | Tableau d’arguments transmis tel quel à `mcpCommand`. Remplace les arguments par défaut `chrome-devtools-mcp@latest --autoConnect`. |

Lorsque `cdpUrl` est défini sur un profil de session existante, OpenClaw ignore
`--autoConnect` et transmet automatiquement le point de terminaison à Chrome MCP :

- `http(s)://...` → `--browserUrl <url>` (point de terminaison de découverte HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direct).

Les indicateurs de point de terminaison et `userDataDir` ne peuvent pas être combinés : lorsque `cdpUrl` est défini,
`userDataDir` est ignoré pour le lancement Chrome MCP, puisque Chrome MCP s’attache au
navigateur en cours d’exécution derrière le point de terminaison plutôt que d’ouvrir un répertoire
de profil.

<Accordion title="Limitations de la fonctionnalité de session existante">

Comparés au profil `openclaw` géré, les drivers de session existante sont plus contraints :

- **Captures d’écran** - les captures de page et les captures d’élément avec `--ref` fonctionnent ; les sélecteurs CSS `--element` ne fonctionnent pas. `--full-page` ne peut pas être combiné avec `--ref` ou `--element`. Playwright n’est pas requis pour les captures d’écran de page ou d’élément basées sur une référence.
- **Actions** - `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des références de snapshot (pas de sélecteurs CSS). `click-coords` clique sur des coordonnées visibles de la fenêtre d’affichage et ne nécessite pas de référence de snapshot. `click` utilise uniquement le bouton gauche. `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` et `evaluate` ne prennent pas en charge les délais d’expiration par appel. `select` accepte une seule valeur.
- **Attente / téléversement / boîte de dialogue** - `wait --url` prend en charge les motifs exacts, par sous-chaîne et glob ; `wait --load networkidle` n’est pas pris en charge sur les profils de session existante (il fonctionne sur les profils gérés et CDP bruts/distants). Les hooks de téléversement nécessitent `ref` ou `inputRef`, un fichier à la fois, pas d’`element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les remplacements de délai d’expiration ni `dialogId`.
- **Visibilité des boîtes de dialogue** - Les réponses d’action du navigateur géré incluent `blockedByDialog` et `browserState.dialogs.pending` lorsqu’une action ouvre une boîte de dialogue modale ; les snapshots incluent aussi l’état des boîtes de dialogue en attente. Répondez avec `browser dialog --accept/--dismiss --dialog-id <id>` pendant qu’une boîte de dialogue est en attente. Les boîtes de dialogue gérées en dehors d’OpenClaw apparaissent sous `browserState.dialogs.recent`.
- **Fonctionnalités réservées au mode géré** - les actions par lot, l’export PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` pour prévenir les collisions avec les workflows de développement.
- **Contrôle déterministe des onglets** : `tabs` renvoie d’abord `suggestedTargetId`, puis
  des handles `tabId` stables tels que `t1`, des libellés facultatifs et le `targetId` brut.
  Les agents doivent réutiliser `suggestedTargetId` ; les identifiants bruts restent disponibles pour le
  débogage et la compatibilité.

## Sélection du navigateur

Lors du lancement local, OpenClaw choisit le premier disponible :

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Vous pouvez remplacer ce choix avec `browser.executablePath`.

Plateformes :

- macOS : vérifie `/Applications` et `~/Applications`.
- Linux : vérifie les emplacements courants de Chrome/Brave/Edge/Chromium sous `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` et
  `/usr/lib/chromium-browser`, ainsi que Chromium géré par Playwright sous
  `PLAYWRIGHT_BROWSERS_PATH` ou `~/.cache/ms-playwright`.
- Windows : vérifie les emplacements d’installation courants.

## API de contrôle (facultative)

Pour les scripts et le débogage, le Gateway expose une petite **API HTTP de contrôle
réservée au local loopback**, ainsi qu’une CLI `openclaw browser` correspondante (snapshots, références, power-ups
d’attente, sortie JSON, workflows de débogage). Consultez
[l’API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Dépannage

Pour les problèmes propres à Linux (en particulier snap Chromium), consultez
[Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations WSL2 Gateway + Windows Chrome avec hôtes séparés, consultez
[Dépannage WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec de démarrage CDP ou blocage SSRF de navigation

Ce sont des classes d’échecs différentes, qui renvoient à des chemins de code différents.

- **Échec de démarrage ou de préparation CDP** signifie qu’OpenClaw ne peut pas confirmer que le plan de contrôle du navigateur est sain.
- **Blocage SSRF de navigation** signifie que le plan de contrôle du navigateur est sain, mais qu’une cible de navigation de page est rejetée par la politique.

Exemples courants :

- Échec de démarrage ou de préparation CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` lorsqu’un
    service CDP externe en local loopback est configuré sans `attachOnly: true`
- Blocage SSRF de navigation :
  - Les flux `open`, `navigate`, d’instantané ou d’ouverture d’onglet échouent avec une erreur de politique navigateur/réseau tandis que `start` et `tabs` fonctionnent encore

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Comment lire les résultats :

- Si `start` échoue avec `not reachable after start`, dépannez d’abord la préparation CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle est toujours malsain. Traitez cela comme un problème d’accessibilité CDP, pas comme un problème de navigation de page.
- Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est actif et l’échec se situe dans la politique de navigation ou dans la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré est sain.

Détails importants du comportement :

- La configuration du navigateur utilise par défaut un objet de politique SSRF à fermeture sécurisée, même lorsque vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré `openclaw` en local loopback, les contrôles de santé CDP ignorent intentionnellement l’application de l’accessibilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de navigation est séparée. Un résultat `start` ou `tabs` réussi ne signifie pas qu’une cible `open` ou `navigate` ultérieure est autorisée.

Conseils de sécurité :

- Ne relâchez **pas** la politique SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte étroites comme `hostnameAllowlist` ou `allowedHostnames` plutôt qu’un large accès au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements volontairement fiables où l’accès navigateur au réseau privé est requis et examiné.

## Outils d’agent + fonctionnement du contrôle

L’agent reçoit **un outil** pour l’automatisation du navigateur :

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondance :

- `browser snapshot` renvoie une arborescence d’interface utilisateur stable (IA ou ARIA).
- `browser act` utilise les ID `ref` de l’instantané pour cliquer/saisir/glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière, élément ou références étiquetées).
- `browser doctor` vérifie la préparation du Gateway, du Plugin, du profil, du navigateur et des onglets.
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner où réside le navigateur.
  - Dans les sessions en bac à sable, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions en bac à sable utilisent `sandbox` par défaut, les sessions hors bac à sable utilisent `host` par défaut.
  - Si un nœud compatible avec le navigateur est connecté, l’outil peut y router automatiquement, sauf si vous fixez `target="host"` ou `target="node"`.

Cela garde l’agent déterministe et évite les sélecteurs fragiles.

## Liens connexes

- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
- [Bac à sable](/fr/gateway/sandboxing) - contrôle du navigateur dans les environnements en bac à sable
- [Sécurité](/fr/gateway/security) - risques et renforcement du contrôle du navigateur
