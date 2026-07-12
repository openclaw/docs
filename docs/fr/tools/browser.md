---
read_when:
    - Ajout de l’automatisation du navigateur contrôlée par l’agent
    - Déterminer pourquoi OpenClaw interfère avec votre propre Chrome
    - Implémentation des réglages et du cycle de vie du navigateur dans l’app macOS
summary: Service intégré de contrôle du navigateur + commandes d’action
title: Navigateur (géré par OpenClaw)
x-i18n:
    generated_at: "2026-07-12T15:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw peut exécuter un **profil Chrome/Brave/Edge/Chromium dédié** contrôlé par l’agent. Il fonctionne par l’intermédiaire d’un petit service de contrôle local au sein du Gateway (boucle locale uniquement) et reste isolé de votre navigateur personnel.

- Considérez-le comme un **navigateur distinct réservé à l’agent**. Le profil `openclaw` n’interagit jamais avec le profil de votre navigateur personnel.
- L’agent ouvre des onglets, lit des pages, clique et saisit du texte dans cet environnement isolé.
- Le profil `user` intégré se connecte plutôt à votre session Chrome réelle déjà authentifiée, via Chrome DevTools MCP.

## Fonctionnalités disponibles

- Un profil de navigateur distinct nommé **openclaw** (accent orange par défaut).
- Un contrôle déterministe des onglets (répertorier/ouvrir/activer/fermer).
- Des actions d’agent (cliquer/saisir/faire glisser/sélectionner), des instantanés, des captures d’écran et des PDF.
- Les profils reposant sur Playwright enregistrent les accès directs aux pièces jointes dans le répertoire de téléchargements géré et renvoient les métadonnées `{ url, suggestedFilename, path }` après validation de la politique sur l’URL finale.
- Les actions d’agent reposant sur Playwright renvoient un tableau `downloads` contenant les mêmes métadonnées gérées lorsque l’action lance immédiatement un ou plusieurs téléchargements.
- Une Skills `browser-automation` intégrée qui apprend aux agents la boucle de récupération relative aux instantanés, aux onglets stables, aux références obsolètes et aux blocages nécessitant une intervention manuelle lorsque le Plugin de navigateur est activé.
- Une prise en charge facultative de plusieurs profils (`openclaw`, `work`, `remote`, ...).

Ce navigateur n’est **pas** destiné à votre usage quotidien. Il fournit un environnement sûr et isolé pour l’automatisation et la vérification par les agents.

Sous macOS, vous pouvez copier explicitement les cookies d’un profil système de la famille Chrome vers un profil géré distinct. Le navigateur géré continue d’utiliser son propre répertoire de données utilisateur ; seuls les cookies sélectionnés sont copiés, tandis que le stockage local et IndexedDB restent dans le profil d’origine. Consultez [Profils](#profiles-multi-browser) ou la [référence de la CLI `openclaw browser`](/fr/cli/browser) pour connaître les commandes d’importation et leurs limitations.

## Démarrage rapide

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

« Navigateur désactivé » signifie que le Plugin ou `browser.enabled` est désactivé ; consultez
[Configuration](#configuration) et [Contrôle du Plugin](#plugin-control).

Si `openclaw browser` est totalement absent ou si l’agent indique que l’outil de navigateur
n’est pas disponible, passez directement à [Commande ou outil de navigateur manquant](#missing-browser-command-or-tool).

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

Les valeurs par défaut nécessitent à la fois `plugins.entries.browser.enabled` **et** `browser.enabled=true`. La désactivation du seul Plugin supprime simultanément la CLI `openclaw browser`, la méthode Gateway `browser.request`, l’outil d’agent et le service de contrôle ; votre configuration `browser.*` reste intacte pour un remplacement.

Les modifications de la configuration du navigateur nécessitent un redémarrage du Gateway afin que le Plugin puisse réenregistrer son service.

## Instructions pour l’agent

Remarque sur le profil d’outils : `tools.profile: "coding"` inclut `web_search` et
`web_fetch`, mais pas l’outil `browser` complet. Pour permettre à l’agent ou à un
sous-agent créé d’utiliser l’automatisation du navigateur, ajoutez le navigateur à l’étape
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
`tools.subagents.tools.allow: ["browser"]` seul ne suffit pas, car la politique des sous-agents
est appliquée après le filtrage du profil.

Le Plugin de navigateur fournit deux niveaux d’instructions aux agents :

- La description de l’outil `browser` contient le contrat compact toujours actif : choisir
  le bon profil, conserver les références dans le même onglet, utiliser `tabId`/les libellés pour cibler
  les onglets et charger la Skills du navigateur pour les tâches en plusieurs étapes.
- La Skills `browser-automation` intégrée contient la boucle opérationnelle plus détaillée :
  vérifier d’abord l’état/les onglets, attribuer des libellés aux onglets de la tâche, prendre un instantané avant toute action, reprendre un instantané
  après les modifications de l’interface, récupérer une fois les références obsolètes et signaler la connexion/la 2FA/le captcha ou
  les blocages liés à la caméra/au microphone comme des actions manuelles plutôt que de faire des suppositions.

Les Skills intégrées au Plugin figurent parmi les Skills disponibles de l’agent lorsque le
Plugin est activé. Les instructions complètes de la Skills sont chargées à la demande, afin que les interactions
courantes n’entraînent pas le coût total en jetons.

## Commande ou outil de navigateur manquant

Si `openclaw browser` est inconnu après une mise à niveau, si `browser.request` est absent ou si l’agent signale que l’outil de navigateur n’est pas disponible, la cause habituelle est une liste `plugins.allow` qui omet `browser` alors qu’aucun bloc de configuration racine `browser` n’existe. Ajoutez-le :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloc racine `browser` explicite (toute clé sous `browser`, telle que
`browser.enabled=true` ou `browser.profiles.<name>`) active le Plugin de navigateur intégré
même avec une liste `plugins.allow` restrictive, conformément au comportement de la
configuration des canaux intégrés. `plugins.entries.browser.enabled=true` et
`tools.alsoAllow: ["browser"]` ne remplacent pas à eux seuls l’appartenance à la liste
d’autorisation. La suppression complète de `plugins.allow` rétablit également le comportement par défaut.

## Profils : `openclaw`, `user`, `chrome`

- `openclaw` : navigateur géré et isolé (aucune extension requise).
- `user` : profil de connexion Chrome DevTools MCP intégré pour votre session **Chrome réelle
  déjà authentifiée**. Chrome affiche une invite bloquante « Allow remote debugging? »
  lors de la première connexion d’OpenClaw ; une personne doit donc être présente devant l’ordinateur.
- `chrome` : profil intégré de l’[extension Chrome](/tools/chrome-extension) pour
  votre session **Chrome réelle déjà authentifiée**. Il fonctionne depuis un téléphone sans personne devant
  l’ordinateur, car il pilote les onglets via l’extension de navigateur OpenClaw au lieu
  du port de débogage distant ; l’invite « Allow remote debugging? » ne s’affiche donc pas.

Pour les appels de l’agent à l’outil de navigateur :

- Par défaut : utilisez le navigateur isolé `openclaw`.
- Préférez `profile="chrome"` (extension) lorsque les sessions déjà authentifiées sont importantes
  et que l’utilisateur est **éloigné de l’ordinateur** (Telegram, WhatsApp, etc.).
- Préférez `profile="user"` (Chrome MCP) lorsque les sessions déjà authentifiées sont importantes
  et que l’utilisateur est **devant l’ordinateur** pour approuver l’invite de connexion.
- `profile` constitue le remplacement explicite lorsque vous souhaitez un mode de navigateur précis.

Définissez `browser.defaultProfile: "openclaw"` si vous souhaitez utiliser le mode géré par défaut.

## Configuration

Les paramètres du navigateur se trouvent dans `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // valeur par défaut : true
    evaluateEnabled: true, // valeur par défaut : true ; false désactive act:evaluate (JS arbitraire)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // à activer uniquement pour un accès fiable au réseau privé
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // remplacement hérité pour un profil unique
    remoteCdpTimeoutMs: 1500, // délai d’expiration HTTP CDP distant (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // délai d’expiration de la négociation WebSocket CDP distante (ms)
    localLaunchTimeoutMs: 15000, // délai d’expiration de la détection locale de Chrome géré (ms)
    localCdpReadyTimeoutMs: 8000, // délai d’attente de disponibilité CDP locale après le lancement du navigateur géré (ms)
    actionTimeoutMs: 60000, // délai d’expiration par défaut des actions du navigateur (ms)
    tabCleanup: {
      enabled: true, // valeur par défaut : true
      idleMinutes: 120, // définissez 0 pour désactiver le nettoyage des onglets inactifs
      maxTabsPerSession: 8, // définissez 0 pour désactiver la limite par session
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // mode d’instantané par défaut lorsque l’appelant n’en indique aucun
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

`browser.snapshotDefaults.mode: "efficient"` modifie le mode d’extraction `snapshot`
par défaut lorsqu’un appelant ne transmet pas explicitement `snapshotFormat` ou
`mode` ; consultez l’[API de contrôle du navigateur](/fr/tools/browser-control) pour connaître les options
d’instantané propres à chaque appel.

### Vision des captures d’écran (prise en charge des modèles textuels uniquement)

Lorsque le modèle principal est uniquement textuel (sans prise en charge de la vision ou multimodale), les
captures d’écran du navigateur renvoient des blocs d’image que le modèle ne peut pas lire. Les captures d’écran du navigateur
réutilisent la configuration existante de compréhension des images ; un modèle d’image
configuré pour la compréhension des médias peut donc décrire les captures d’écran sous forme de texte sans
paramètres de modèle propres au navigateur.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Ajoutez des candidats de secours ; le premier succès est retenu
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Les modèles de médias partagés fonctionnent également lorsqu’ils sont marqués comme prenant en charge les images.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Les valeurs par défaut existantes du modèle d’image sont également respectées.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Fonctionnement :**

1. L’agent appelle `browser screenshot` et une image est enregistrée sur le disque comme d’habitude.
2. L’outil de navigateur demande au moteur existant de compréhension des images s’il
   peut décrire la capture d’écran à l’aide des modèles d’image multimédia configurés, des modèles multimédias
   partagés, des valeurs par défaut du modèle d’image ou d’un fournisseur d’images disposant d’une authentification.
3. Le modèle de vision renvoie une description textuelle, qui est encapsulée avec
   `wrapExternalContent` (protection contre l’injection d’invite) et renvoyée à l’agent
   sous forme de bloc de texte plutôt que de bloc d’image.
4. Si la compréhension des images n’est pas disponible, est ignorée ou échoue, le navigateur
   renvoie à la place le bloc d’image d’origine.

Les blocs d’image de capture d’écran sont des résultats d’outil privés : l’agent peut les examiner,
mais OpenClaw ne les joint pas automatiquement aux réponses envoyées sur les canaux. Pour partager une
capture d’écran, demandez à l’agent de l’envoyer explicitement avec l’outil de messagerie.

Utilisez les champs existants `tools.media.image` / `tools.media.models` pour les modèles
de secours, les délais d’expiration, les limites d’octets, les profils et les paramètres de requête du fournisseur.

Si le modèle principal actif prend déjà en charge la vision et qu’aucun modèle explicite de
compréhension des images n’est configuré, OpenClaw conserve le résultat d’image normal afin que le
modèle principal puisse lire directement la capture d’écran.

<AccordionGroup>

<Accordion title="Ports et accessibilité">

- Le service de contrôle se lie à l’interface de bouclage sur un port dérivé de `gateway.port` (`18791` par défaut = Gateway + 2). `OPENCLAW_GATEWAY_PORT` est prioritaire sur `gateway.port` ; l’un comme l’autre décale les ports dérivés de la même famille.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` à partir d’une plage commençant 9 ports au-dessus du port de contrôle (`18800`-`18899` par défaut) ; ne les définissez que pour
  les profils CDP distants ou la connexion au point de terminaison d’une session existante. Lorsque `cdpUrl` n’est pas défini, sa valeur par défaut est
  le port CDP local géré.
- `remoteCdpTimeoutMs` s’applique aux vérifications d’accessibilité HTTP CDP distantes et `attachOnly`,
  ainsi qu’aux requêtes HTTP d’ouverture d’onglets ; `remoteCdpHandshakeTimeoutMs` s’applique à
  leurs négociations WebSocket CDP. L’énumération persistante des onglets Playwright distants
  utilise la plus grande des deux valeurs comme délai maximal d’exécution.
- `localLaunchTimeoutMs` est le délai alloué à un processus Chrome géré lancé localement
  pour exposer son point de terminaison HTTP CDP. `localCdpReadyTimeoutMs` est le
  délai supplémentaire alloué à la disponibilité du WebSocket CDP après la détection du processus.
  Augmentez ces valeurs sur Raspberry Pi, les VPS d’entrée de gamme ou le matériel ancien où Chromium
  démarre lentement. Les valeurs doivent être des entiers positifs ne dépassant pas `120000` ms ; les
  valeurs de configuration non valides sont rejetées.
- Les échecs répétés de lancement ou de disponibilité de Chrome géré déclenchent un coupe-circuit par
  profil. Après plusieurs échecs consécutifs, OpenClaw suspend brièvement les nouvelles tentatives de
  lancement au lieu de démarrer Chromium à chaque appel d’outil de navigateur. Corrigez
  le problème de démarrage, désactivez le navigateur s’il n’est pas nécessaire ou redémarrez le
  Gateway après la correction.
- `actionTimeoutMs` est le délai alloué par défaut aux requêtes `act` du navigateur lorsque l’appelant ne transmet pas `timeoutMs`. Le transport client ajoute une petite marge afin que les attentes longues puissent se terminer au lieu d’expirer à la frontière HTTP.
- `tabCleanup` effectue, au mieux, le nettoyage des onglets ouverts par les sessions de navigateur de l’agent principal. Le nettoyage du cycle de vie des sous-agents, de Cron et d’ACP continue de fermer leurs onglets explicitement suivis à la fin de la session ; les sessions principales conservent les onglets actifs pour les réutiliser, puis ferment en arrière-plan les onglets suivis inactifs ou excédentaires.

</Accordion>

<Accordion title="Politique SSRF">

- Les requêtes de navigation du navigateur et d’ouverture d’onglets font l’objet d’une vérification préalable. Pendant l’action et la période de grâce limitée qui la suit, les interactions Playwright protégées (clic, clic par coordonnées, survol, glisser-déposer, défilement, sélection, pression, saisie, remplissage de formulaire et évaluation) interceptent les chargements de documents de premier niveau et de sous-cadres refusés par la politique avant l’envoi des octets de la requête HTTP, puis revérifient au mieux l’URL `http(s)` finale.
- Avant chaque nouveau lancement de Chrome géré par OpenClaw, OpenClaw désactive au mieux la prédiction réseau, supprimant la préconnexion spéculative observée de Chromium pour ces chargements refusés. Il s’agit d’une défense en profondeur, et non d’une frontière de politique : un navigateur réutilisé après un redémarrage du service de contrôle et d’autres backends de navigateur peuvent ne pas bénéficier de ce renforcement. Le routage Playwright ne constitue toujours pas un pare-feu réseau et n’intercepte pas les étapes de redirection, la première requête d’une fenêtre contextuelle, le trafic des Service Workers, le code de page exécuté après la fenêtre de protection limitée ni tous les chemins d’arrière-plan ou de sous-ressources. Une isolation complète du trafic sortant nécessite une isolation du côté du propriétaire ou un proxy appliquant la politique.
- En mode SSRF strict, la découverte des points de terminaison CDP distants et les sondes `/json/version` (`cdpUrl`) sont également vérifiées.
- Les variables d’environnement `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et `NO_PROXY` du Gateway ou du fournisseur ne font pas automatiquement transiter le navigateur géré par OpenClaw par un proxy. Par défaut, Chrome géré se lance avec une connexion directe afin que les paramètres de proxy du fournisseur n’affaiblissent pas les vérifications SSRF du navigateur.
- Les sondes locales de disponibilité CDP gérées par OpenClaw et les connexions WebSocket DevTools contournent le proxy réseau géré pour le point de terminaison de bouclage exact qui a été lancé, afin que `openclaw browser start` continue de fonctionner lorsqu’un proxy d’opérateur bloque le trafic sortant vers l’interface de bouclage.
- Pour faire transiter le navigateur géré lui-même par un proxy, transmettez des options de proxy Chrome explicites via `browser.extraArgs`, telles que `--proxy-server=...` ou `--proxy-pac-url=...`. Le mode SSRF strict bloque le routage explicite du navigateur par proxy, sauf si l’accès du navigateur au réseau privé est intentionnellement activé.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` est désactivé par défaut ; ne l’activez que lorsque l’accès du navigateur au réseau privé est explicitement considéré comme fiable.
- `browser.ssrfPolicy.allowPrivateNetwork` reste pris en charge en tant qu’alias hérité.

</Accordion>

<Accordion title="Comportement des profils">

- `attachOnly: true` signifie qu’aucun navigateur local ne doit jamais être lancé ; la connexion n’a lieu que si un navigateur est déjà en cours d’exécution.
- `headless` peut être défini globalement ou pour chaque profil local géré. Les valeurs propres au profil remplacent `browser.headless`, de sorte qu’un profil lancé localement peut rester sans interface graphique tandis qu’un autre reste visible.
- `POST /start?headless=true` et `openclaw browser start --headless` demandent un
  lancement ponctuel sans interface graphique pour les profils locaux gérés, sans réécrire
  `browser.headless` ni la configuration du profil. Les profils de session existante, en
  connexion uniquement et CDP distants refusent ce remplacement, car OpenClaw ne lance pas
  ces processus de navigateur.
- Sur les hôtes Linux dépourvus de `DISPLAY` ou de `WAYLAND_DISPLAY`, les profils locaux gérés
  utilisent automatiquement le mode sans interface graphique par défaut lorsque ni l’environnement ni la
  configuration du profil ou la configuration globale ne choisissent explicitement le mode avec interface graphique. Utilisez la forme non ambiguë au niveau du navigateur
  `openclaw browser --json status` ; la forme avec option finale `openclaw browser status --json`
  fonctionne également, car `status` ne définit pas sa propre option `--json`. La commande indique
  `headlessSource` avec l’une des valeurs `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` force les lancements locaux gérés en mode sans interface graphique pour le
  processus actuel. `OPENCLAW_BROWSER_HEADLESS=0` force le mode avec interface graphique pour les démarrages
  ordinaires et renvoie une erreur exploitable sur les hôtes Linux sans serveur d’affichage ;
  une requête explicite `start --headless` reste prioritaire pour ce lancement unique.
- La route de contrôle du navigateur et le client programmatique conservent le champ `error`
  lisible par un humain de l’erreur d’absence d’affichage et exposent la raison stable
  `no_display_for_headed_profile`. Son champ `details` contient uniquement `profile`,
  `requestedHeadless`, `headlessSource` et `displayPresent`, afin que les clients API puissent
  choisir la correction appropriée sans comparer le texte du message.
- Pour un profil local géré en cours d’exécution, les commandes d’état et de diagnostic interrogent le
  point de terminaison CDP au niveau du navigateur de Chrome pour obtenir le moteur de rendu, le backend, le périphérique ou pilote, l’état des
  fonctionnalités, les contournements propres aux pilotes et les capacités d’accélération vidéo. Le résultat est
  mis en cache pour ce processus de navigateur et exposé intégralement par
  `openclaw browser --json status`. Un appel passif d’état ne lance pas Chrome.
  Les navigateurs de session existante, d’extension, CDP distants et en bac à sable restent distincts
  et ne sont pas inspectés par ce chemin d’hôte géré.
- Chrome géré sans interface graphique utilise toujours la valeur par défaut prudente `--disable-gpu`.
  Les diagnostics n’activent pas l’accélération, n’ajoutent pas de paramètre global d’accélération
  et n’accordent pas au navigateur en bac à sable l’accès aux périphériques.
- `executablePath` peut être défini globalement ou pour chaque profil local géré. Les valeurs propres au profil remplacent `browser.executablePath`, de sorte que différents profils gérés peuvent lancer différents navigateurs basés sur Chromium. Les deux formes acceptent `~` pour le répertoire personnel de votre système d’exploitation.
- `color` (au niveau supérieur et pour chaque profil) teinte l’interface du navigateur afin que vous puissiez voir quel profil est actif.
- Le profil par défaut est `openclaw` (autonome géré). Utilisez `defaultProfile: "user"` pour choisir le navigateur de l’utilisateur connecté.
- Ordre de détection automatique : navigateur système par défaut s’il est basé sur Chromium ; sinon Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` utilise Chrome DevTools MCP au lieu de CDP brut. Il peut se connecter via la connexion automatique de Chrome MCP, ou via `cdpUrl` si vous disposez déjà d’un point de terminaison DevTools pour le navigateur en cours d’exécution.
- `driver: "extension"` pilote votre Chrome connecté via l’[extension Chrome OpenClaw](/tools/chrome-extension). Le relais possède son point de terminaison de bouclage ; ces profils n’acceptent donc pas `cdpUrl`. Il s’agit du seul mode de navigateur connecté qui fonctionne sans personne devant l’ordinateur.
- Définissez `browser.profiles.<name>.userDataDir` lorsqu’un profil de session existante doit se connecter à un profil utilisateur Chromium autre que celui par défaut (Brave, Edge, etc.). Ce chemin accepte également `~` pour le répertoire personnel de votre système d’exploitation.

</Accordion>

</AccordionGroup>

## Utiliser Brave ou un autre navigateur basé sur Chromium

Si votre navigateur **système par défaut** est basé sur Chromium (Chrome/Brave/Edge/etc.),
OpenClaw l’utilise automatiquement. Définissez `browser.executablePath` pour remplacer
la détection automatique. Les valeurs `executablePath` au niveau supérieur et propres aux profils acceptent `~`
pour le répertoire personnel de votre système d’exploitation :

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

La valeur `executablePath` propre à un profil n’affecte que les profils locaux gérés qu’OpenClaw
lance. Les profils `existing-session` se connectent plutôt à un navigateur déjà en cours d’exécution,
et les profils CDP distants utilisent le navigateur situé derrière `cdpUrl`.

## Contrôle local et distant

- **Contrôle local (par défaut) :** le Gateway démarre le service de contrôle sur l’interface de bouclage et peut lancer un navigateur local.
- **Contrôle distant (hôte Node) :** exécutez un hôte Node sur la machine disposant du navigateur ; le Gateway lui transmet les actions du navigateur.
- **CDP distant :** définissez `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) pour
  vous connecter à un navigateur distant basé sur Chromium. Dans ce cas, OpenClaw ne lancera pas de navigateur local.
- Pour les services CDP gérés en externe sur l’interface de bouclage (par exemple Browserless dans
  Docker publié sur `127.0.0.1`), définissez également `attachOnly: true`. Un CDP sur l’interface de bouclage
  sans `attachOnly` est traité comme un profil de navigateur local géré par OpenClaw.
- `headless` n’affecte que les profils locaux gérés qu’OpenClaw lance. Il ne redémarre ni ne modifie les navigateurs de session existante ou CDP distants.
- `executablePath` suit la même règle applicable aux profils locaux gérés. Sa modification sur un
  profil local géré en cours d’exécution marque ce profil pour redémarrage ou réconciliation, afin que le
  lancement suivant utilise le nouveau binaire.

Le comportement d’arrêt varie selon le mode du profil :

- profils locaux gérés : `openclaw browser stop` arrête le processus de navigateur
  lancé par OpenClaw
- profils en connexion uniquement et CDP distants : `openclaw browser stop` ferme la session de
  contrôle active et libère les remplacements d’émulation Playwright/CDP (fenêtre d’affichage,
  palette de couleurs, paramètres régionaux, fuseau horaire, mode hors ligne et états similaires), même
  si aucun processus de navigateur n’a été lancé par OpenClaw

Les URL CDP distantes peuvent inclure des informations d’authentification :

- Jetons de requête (par exemple, `https://provider.example?token=<token>`)
- Authentification HTTP Basic (par exemple, `https://user:pass@provider.example`)

OpenClaw conserve les informations d’authentification lors des appels aux points de terminaison `/json/*` et lors de la connexion
au WebSocket CDP. Préférez les variables d’environnement ou les gestionnaires de secrets pour les
jetons plutôt que de les enregistrer dans des fichiers de configuration.

## Proxy de navigateur Node (configuration automatique par défaut)

Si vous exécutez un **hôte Node** sur la machine disposant de votre navigateur, OpenClaw peut
acheminer automatiquement les appels de l’outil de navigateur vers ce Node sans configuration supplémentaire du navigateur.
Il s’agit du chemin par défaut pour les gateways distants.

Remarques :

- L'hôte du Node expose son serveur local de contrôle du navigateur via une **commande proxy**.
- Les profils proviennent de la configuration `browser.profiles` propre au Node (comme en local).
- La commande proxy n'autorise jamais les modifications persistantes des profils (`create-profile`, `delete-profile`, `reset-profile`), quelle que soit la valeur de `allowProfiles` ; effectuez ces modifications directement sur le Node.
- `nodeHost.browserProxy.allowProfiles` est facultatif. Laissez-le vide pour conserver le comportement historique/par défaut : tous les profils configurés restent accessibles via le proxy.
- Si vous définissez `nodeHost.browserProxy.allowProfiles`, OpenClaw le traite comme une limite de moindre privilège restreignant les noms de profils que le proxy peut cibler.
- Désactivez cette fonctionnalité si vous n'en voulez pas :
  - Sur le Node : `nodeHost.browserProxy.enabled=false`
  - Sur le Gateway : `gateway.nodes.browser.mode="off"` (accepte également `"auto"` pour sélectionner un seul Node de navigateur connecté, ou `"manual"` pour exiger un paramètre de Node explicite)

## Browserless (CDP distant hébergé)

[Browserless](https://browserless.io) est un service Chromium hébergé qui expose
des URL de connexion CDP via HTTPS et WebSocket. OpenClaw peut utiliser les deux
formes, mais, pour un profil de navigateur distant, l'option la plus simple est
l'URL WebSocket directe indiquée dans la documentation de connexion de Browserless.

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
- Choisissez le point de terminaison régional correspondant à votre compte Browserless (consultez leur documentation).
- Si Browserless vous fournit une URL de base HTTPS, vous pouvez soit la convertir
  en `wss://` pour une connexion CDP directe, soit conserver l'URL HTTPS et laisser
  OpenClaw découvrir `/json/version`.

### Browserless dans Docker sur le même hôte

Lorsque Browserless est auto-hébergé dans Docker et qu'OpenClaw s'exécute sur
l'hôte, traitez Browserless comme un service CDP géré de manière externe :

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

L'adresse définie dans `browser.profiles.browserless.cdpUrl` doit être accessible
depuis le processus OpenClaw. Browserless doit également annoncer un point de
terminaison correspondant et accessible ; définissez `EXTERNAL` de Browserless
sur la même base WebSocket accessible par OpenClaw, par exemple
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou une adresse privée stable du
réseau Docker. Si `/json/version` renvoie un `webSocketDebuggerUrl` pointant vers
une adresse inaccessible à OpenClaw, le CDP HTTP peut sembler opérationnel alors
que la connexion WebSocket échoue tout de même.

Ne laissez pas `attachOnly` non défini pour un profil Browserless sur l'adresse
de bouclage. Sans `attachOnly`, OpenClaw traite le port de bouclage comme un
profil de navigateur local géré et peut signaler que le port est utilisé, mais
qu'il n'appartient pas à OpenClaw.

## Fournisseurs CDP WebSocket directs

Certains services de navigateur hébergés exposent un point de terminaison
**WebSocket direct** plutôt que la découverte CDP standard basée sur HTTP
(`/json/version`). OpenClaw accepte trois formes d'URL CDP et sélectionne
automatiquement la stratégie de connexion appropriée :

- **Découverte HTTP(S)** - `http://host[:port]` ou `https://host[:port]`.
  OpenClaw appelle `/json/version` pour découvrir l'URL WebSocket du débogueur,
  puis s'y connecte. Aucun repli WebSocket.
- **Points de terminaison WebSocket directs** - `ws://host[:port]/devtools/<kind>/<id>`
  ou `wss://...` avec un chemin
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se connecte directement au moyen d'une négociation WebSocket et ignore
  entièrement `/json/version`.
- **Racines WebSocket nues** - `ws://host[:port]` ou `wss://host[:port]` sans
  chemin `/devtools/...` (par exemple [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw tente d'abord la
  découverte HTTP `/json/version` (en normalisant le schéma vers `http`/`https`) ;
  si la découverte renvoie un `webSocketDebuggerUrl`, celui-ci est utilisé.
  Sinon, OpenClaw se replie sur une négociation WebSocket directe à la racine
  nue. Si le point de terminaison WebSocket annoncé refuse la négociation CDP,
  mais que la racine nue configurée l'accepte, OpenClaw se replie également sur
  cette racine. Ainsi, une adresse `ws://` nue pointant vers un Chrome local peut
  toujours se connecter, puisque Chrome n'accepte les mises à niveau WebSocket
  que sur le chemin spécifique à la cible fourni par `/json/version`, tandis que
  les fournisseurs hébergés peuvent toujours utiliser leur point de terminaison
  WebSocket racine lorsque leur point de terminaison de découverte annonce une
  URL à courte durée de vie qui ne convient pas au CDP de Playwright.

`openclaw browser doctor` utilise la même logique privilégiant la découverte,
puis le repli WebSocket, que la connexion à l'exécution. Ainsi, une URL de racine
nue qui se connecte correctement n'est pas signalée comme inaccessible par les
diagnostics.

### Browserbase

[Browserbase](https://www.browserbase.com) est une plateforme cloud permettant
d'exécuter des navigateurs sans interface graphique, avec résolution intégrée
des CAPTCHA, mode furtif et proxys résidentiels.

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

- [Inscrivez-vous](https://www.browserbase.com/sign-up) et copiez votre **API Key**
  depuis le [tableau de bord Overview](https://www.browserbase.com/overview).
- Remplacez `<BROWSERBASE_API_KEY>` par votre véritable clé d'API Browserbase.
- Browserbase crée automatiquement une session de navigateur lors de la
  connexion WebSocket ; aucune étape de création manuelle de session n'est donc
  nécessaire.
- Consultez les [tarifs](https://www.browserbase.com/pricing) pour connaître les limites actuelles de l'offre gratuite et les formules payantes.
- Consultez la [documentation de Browserbase](https://docs.browserbase.com) pour
  obtenir la référence complète de l'API, les guides des SDK et des exemples
  d'intégration.

### Notte

[Notte](https://www.notte.cc) est une plateforme cloud permettant d'exécuter
des navigateurs sans interface graphique, avec furtivité intégrée, proxys
résidentiels et Gateway WebSocket natif pour CDP.

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

- [Inscrivez-vous](https://console.notte.cc) et copiez votre **API Key** depuis
  la page des paramètres de la console.
- Remplacez `<NOTTE_API_KEY>` par votre véritable clé d'API Notte.
- Notte crée automatiquement une session de navigateur lors de la connexion
  WebSocket ; aucune étape de création manuelle de session n'est donc nécessaire.
  La session est détruite lorsque le WebSocket se déconnecte.
- Consultez les [tarifs](https://www.notte.cc/#pricing) pour connaître les limites actuelles de l'offre gratuite et les formules payantes.
- Consultez la [documentation de Notte](https://docs.notte.cc) pour obtenir la
  référence complète de l'API, les guides des SDK et des exemples d'intégration.

## Sécurité

Principes clés :

- Le contrôle du navigateur est limité à l'adresse de bouclage ; l'accès passe par l'authentification du Gateway ou l'association du Node.
- L'API HTTP autonome du navigateur sur l'adresse de bouclage utilise
  **uniquement une authentification par secret partagé** : authentification
  Bearer par jeton du Gateway, `x-openclaw-password` ou authentification HTTP
  Basic avec le mot de passe configuré du Gateway.
- Les en-têtes d'identité de Tailscale Serve et `gateway.auth.mode: "trusted-proxy"`
  **n'authentifient pas** cette API autonome du navigateur sur l'adresse de
  bouclage.
- Si le contrôle du navigateur est activé et qu'aucune authentification par
  secret partagé n'est configurée, OpenClaw génère automatiquement et conserve
  un identifiant de contrôle du navigateur au démarrage : un jeton lorsque
  `gateway.auth.mode` vaut `none`, ou un mot de passe lorsqu'il vaut
  `trusted-proxy` (conservé via `gateway.auth.password` afin que les clients de
  bouclage hors processus puissent le résoudre). La génération automatique est
  ignorée lorsqu'un identifiant de type chaîne explicite est déjà configuré pour
  ce mode, ou lorsque `gateway.auth.mode` vaut `password`.
- Configurez explicitement `gateway.auth.token`, `gateway.auth.password`,
  `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` si vous souhaitez
  utiliser un secret stable que vous contrôlez plutôt que celui généré.

Conseils pour le CDP distant :

- Privilégiez les points de terminaison chiffrés (HTTPS ou WSS) et, si possible, les jetons à courte durée de vie.
- Évitez d'intégrer directement des jetons à longue durée de vie dans les fichiers de configuration.
- Maintenez le Gateway et tous les hôtes de Node sur un réseau privé (Tailscale) ; évitez toute exposition publique.
- Traitez les URL et jetons CDP distants comme des secrets ; privilégiez les variables d'environnement ou un gestionnaire de secrets.

## Profils (plusieurs navigateurs)

OpenClaw prend en charge plusieurs profils nommés (configurations de routage). Les profils peuvent être :

- **gérés par OpenClaw** : une instance dédiée de navigateur basé sur Chromium avec son propre répertoire de données utilisateur et son propre port CDP
- **distants** : une URL CDP explicite (navigateur basé sur Chromium s'exécutant ailleurs)
- **session existante** : votre profil Chrome existant via la connexion automatique de Chrome DevTools MCP

Valeurs par défaut :

- Le profil `openclaw` est créé automatiquement s'il est absent.
- Le profil `user` est intégré pour la connexion à une session existante via Chrome MCP.
- Les profils de session existante autres que `user` nécessitent une activation explicite ; créez-les avec `--driver existing-session`.
- Les ports CDP locaux sont attribués dans la plage **18800-18899** par défaut.
- La suppression d'un profil déplace son répertoire de données local vers la corbeille.

Tous les points de terminaison de contrôle acceptent `?profile=<name>` ; la CLI utilise `--browser-profile`.

## Session existante via Chrome DevTools MCP

OpenClaw peut également se connecter à un profil de navigateur basé sur Chromium
en cours d'exécution au moyen du serveur officiel Chrome DevTools MCP. Cela
réutilise les onglets et l'état de connexion déjà ouverts dans ce profil de
navigateur.

Références officielles de présentation et de configuration :

- [Chrome for Developers : utiliser Chrome DevTools MCP avec votre session de navigateur](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil intégré : `user`. Créez votre propre profil personnalisé de session
existante si vous souhaitez utiliser un nom, une couleur ou un répertoire de
données de navigateur différent.

Par défaut, le profil intégré `user` utilise la connexion automatique de Chrome
MCP, qui cible le profil Google Chrome local par défaut. Utilisez `userDataDir`
pour Brave, Edge, Chromium ou un profil Chrome autre que celui par défaut. `~`
est développé en votre répertoire personnel du système d'exploitation :

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

1. Ouvrez la page d'inspection de ce navigateur pour le débogage distant.
2. Activez le débogage distant.
3. Laissez le navigateur en cours d'exécution et approuvez la demande de connexion lorsqu'OpenClaw s'y connecte.

Pages d'inspection courantes :

- Chrome : `chrome://inspect/#remote-debugging`
- Brave : `brave://inspect/#remote-debugging`
- Edge : `edge://inspect/#remote-debugging`

Test rapide de connexion en direct :

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
- `tabs` répertorie les onglets de navigateur déjà ouverts
- `snapshot` renvoie les références de l'onglet actif sélectionné

Points à vérifier si la connexion ne fonctionne pas :

- le navigateur cible basé sur Chromium est en version `144+`
- le débogage distant est activé sur la page d'inspection de ce navigateur
- le navigateur a affiché la demande de consentement à la connexion et vous l'avez acceptée
- si Chrome a été démarré avec un `--remote-debugging-port` explicite, définissez
  `browser.profiles.<name>.cdpUrl` sur ce point de terminaison DevTools au lieu
  de vous appuyer sur la connexion automatique de Chrome MCP
- `openclaw doctor` migre l'ancienne configuration de navigateur basée sur une
  extension et vérifie que Chrome est installé localement pour les profils de
  connexion automatique par défaut, mais il ne peut pas activer le débogage
  distant côté navigateur à votre place

Utilisation par l'agent :

- Utilisez `profile="user"` lorsque vous avez besoin de l’état de connexion du navigateur de l’utilisateur.
- Si vous utilisez un profil personnalisé de session existante, transmettez explicitement le nom de ce profil.
- Ne choisissez ce mode que lorsque l’utilisateur se trouve devant l’ordinateur pour approuver
  l’invite de connexion.
- L’hôte du Gateway ou du Node peut lancer `npx chrome-devtools-mcp@latest --autoConnect`.

Remarques :

- Cette méthode présente davantage de risques que le profil isolé `openclaw`, car elle peut
  agir dans votre session de navigateur connectée.
- OpenClaw ne lance pas le navigateur pour ce pilote ; il s’y connecte uniquement.
- OpenClaw utilise ici le flux officiel `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` est défini, il est transmis afin de cibler ce répertoire de données utilisateur.
- Une session existante peut être connectée sur l’hôte sélectionné ou par l’intermédiaire d’un
  Node de navigateur connecté. Si Chrome s’exécute ailleurs et qu’aucun Node de navigateur n’est connecté, utilisez
  plutôt CDP distant ou un hôte Node.
- Les cibles Chrome MCP et les références d’instantané sont limitées à un seul sous-processus MCP. Après
  le redémarrage de ce processus, exécutez à nouveau `browser tabs`, sélectionnez explicitement une nouvelle
  cible avant toute opération propre à cette cible, puis prenez un nouvel instantané avant d’utiliser les références.
  Chaque référence n’est valide que pour sa cible et son instantané le plus récent. Les anciens alias ne sont pas
  transférés vers un onglet de remplacement, même lorsque son URL correspond.
- Chrome DevTools MCP achemine actuellement les outils de page à l’aide d’un identifiant de page numérique
  local au processus. Les handles limités au processus empêchent leur réutilisation après le remplacement d’un sous-processus, mais le
  remplacement d’un contexte de navigateur au sein du processus entre deux appels d’outil consécutifs peut encore
  rediriger une action. Un routage entièrement atomique nécessite la prise en charge en amont d’identifiants de cible
  stables par les outils de page.

### Lancement personnalisé de Chrome MCP

Remplacez le serveur Chrome DevTools MCP lancé pour chaque profil lorsque le flux par défaut
`npx chrome-devtools-mcp@latest` ne vous convient pas (hôtes hors ligne,
versions épinglées, binaires intégrés) :

| Champ        | Fonction                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Exécutable à lancer à la place de `npx`. Résolu tel quel ; les chemins absolus sont respectés.                              |
| `mcpArgs`    | Tableau d’arguments transmis tel quel à `mcpCommand`. Remplace les arguments par défaut `chrome-devtools-mcp@latest --autoConnect`. |

Lorsque `cdpUrl` est défini dans un profil de session existante, OpenClaw ignore
`--autoConnect` et transmet automatiquement le point de terminaison à Chrome MCP :

- `http(s)://...` → `--browserUrl <url>` (point de terminaison HTTP de découverte DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direct).

Les indicateurs de point de terminaison et `userDataDir` ne peuvent pas être combinés : lorsque `cdpUrl` est défini,
`userDataDir` est ignoré lors du lancement de Chrome MCP, car Chrome MCP se connecte au
navigateur en cours d’exécution derrière le point de terminaison au lieu d’ouvrir un répertoire
de profil.

<Accordion title="Limitations de la fonctionnalité de session existante">

Par rapport au profil `openclaw` géré, les pilotes de session existante sont plus limités :

- **Captures d’écran** - les captures de page et les captures d’éléments avec `--ref` fonctionnent ; ce n’est pas le cas des sélecteurs CSS `--element`. Playwright n’est pas requis pour les captures d’écran de page ou d’éléments fondées sur des références. (`--full-page` ne peut être combiné avec `--ref` ou `--element` dans aucun profil, pas seulement dans les sessions existantes.)
- **Actions** - `click`, `type`, `hover`, `scrollIntoView`, `drag` et `select` nécessitent des références d’instantané (aucun sélecteur CSS). `click-coords` clique sur les coordonnées visibles de la fenêtre d’affichage et ne nécessite pas de référence d’instantané. `click` utilise uniquement le bouton gauche (aucune substitution de bouton ni touche de modification). `type` ne prend pas en charge `slowly=true` ; utilisez `fill` ou `press`. `press` ne prend pas en charge `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` et `fill` ne prennent pas en charge la substitution de `timeoutMs` pour chaque appel ; `evaluate` la prend en charge. `select` accepte une seule valeur. `batch` n’est pas pris en charge ; envoyez les actions individuellement.
- **Attente / téléversement / boîte de dialogue** - `wait --url` prend en charge les motifs exacts, les sous-chaînes et les motifs glob (comme pour les profils gérés) ; `wait --load networkidle` n’est pas pris en charge dans les profils de session existante (il fonctionne dans les profils gérés et CDP brut/distant). Les hooks de téléversement nécessitent `ref` ou `inputRef`, un seul fichier à la fois, sans `element` CSS. Les hooks de boîte de dialogue ne prennent pas en charge les substitutions de délai d’expiration ni `dialogId`.
- **Visibilité des boîtes de dialogue** - les réponses aux actions du navigateur géré incluent `blockedByDialog` et `browserState.dialogs.pending` lorsqu’une action ouvre une boîte de dialogue modale ; les instantanés incluent également l’état des boîtes de dialogue en attente. Répondez avec `browser dialog --accept/--dismiss --dialog-id <id>` tant qu’une boîte de dialogue est en attente. Les boîtes de dialogue traitées en dehors d’OpenClaw apparaissent sous `browserState.dialogs.recent`.
- **Fonctionnalités réservées au mode géré** - l’exportation PDF, l’interception des téléchargements et `responsebody` nécessitent toujours le chemin de navigateur géré.

</Accordion>

## Garanties d’isolation

- **Répertoire de données utilisateur dédié** : ne touche jamais à votre profil de navigateur personnel.
- **Ports dédiés** : évite `9222` afin d’empêcher les conflits avec les workflows de développement.
- **Contrôle déterministe des onglets** : `tabs` renvoie d’abord `suggestedTargetId`, puis
  des handles `tabId` stables tels que `t1`, des libellés facultatifs et le `targetId` brut.
  Les agents doivent réutiliser `suggestedTargetId` ; les identifiants bruts restent disponibles pour
  le débogage et la compatibilité.

## Sélection du navigateur

Lors d’un lancement local, OpenClaw choisit le premier navigateur disponible :

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
accessible uniquement en boucle locale**, ainsi qu’une CLI `openclaw browser` correspondante (instantanés, références, fonctions
d’attente avancées, sortie JSON, workflows de débogage). Consultez
[API de contrôle du navigateur](/fr/tools/browser-control) pour la référence complète.

## Résolution des problèmes

Pour les problèmes propres à Linux (en particulier Chromium installé via snap), consultez
[Résolution des problèmes du navigateur](/fr/tools/browser-linux-troubleshooting).

Pour les configurations où le Gateway WSL2 et Chrome sous Windows s’exécutent sur des hôtes distincts, consultez
[Résolution des problèmes de WSL2 + Windows + CDP Chrome distant](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Échec du démarrage de CDP ou blocage SSRF de la navigation

Il s’agit de catégories d’échecs différentes, qui correspondent à des chemins de code différents.

- **Un échec de démarrage ou de disponibilité de CDP** signifie qu’OpenClaw ne peut pas confirmer le bon fonctionnement du plan de contrôle du navigateur.
- **Un blocage SSRF de la navigation** signifie que le plan de contrôle du navigateur fonctionne correctement, mais que la cible d’une navigation de page est rejetée par la stratégie.

Exemples courants :

- Échec de démarrage ou de disponibilité de CDP :
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` lorsqu’un
    service CDP externe en boucle locale est configuré sans `attachOnly: true`
- Blocage SSRF de la navigation :
  - les flux `open`, `navigate`, de création d’instantané ou d’ouverture d’onglet échouent avec une erreur de stratégie du navigateur ou du réseau, tandis que `start` et `tabs` continuent de fonctionner

Utilisez cette séquence minimale pour distinguer les deux :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Interprétation des résultats :

- Si `start` échoue avec `not reachable after start`, commencez par résoudre le problème de disponibilité de CDP.
- Si `start` réussit mais que `tabs` échoue, le plan de contrôle ne fonctionne toujours pas correctement. Traitez cela comme un problème d’accessibilité de CDP, et non comme un problème de navigation de page.
- Si `start` et `tabs` réussissent, mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur fonctionne et l’échec se situe dans la stratégie de navigation ou sur la page cible.
- Si `start`, `tabs` et `open` réussissent tous, le chemin de contrôle de base du navigateur géré fonctionne correctement.

Détails importants du comportement :

- La configuration du navigateur utilise par défaut un objet de stratégie SSRF fermé par défaut, même si vous ne configurez pas `browser.ssrfPolicy`.
- Pour le profil géré local `openclaw` en boucle locale, les contrôles d’intégrité CDP ignorent intentionnellement l’application des règles d’accessibilité SSRF du navigateur pour le propre plan de contrôle local d’OpenClaw.
- La protection de la navigation est distincte. La réussite de `start` ou de `tabs` ne signifie pas qu’une cible ultérieure de `open` ou `navigate` est autorisée.

Recommandations de sécurité :

- N’assouplissez **pas** la stratégie SSRF du navigateur par défaut.
- Préférez des exceptions d’hôte restreintes, telles que `hostnameAllowlist` ou `allowedHostnames`, à un accès étendu au réseau privé.
- Utilisez `dangerouslyAllowPrivateNetwork: true` uniquement dans des environnements volontairement approuvés où l’accès du navigateur au réseau privé est requis et a été examiné.

## Outils de l’agent et fonctionnement du contrôle

L’agent dispose d’**un seul outil** pour automatiser le navigateur :

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondances :

- `browser snapshot` renvoie une arborescence d’interface stable (IA ou ARIA).
- `browser act` utilise les identifiants `ref` de l’instantané pour cliquer/saisir/faire glisser/sélectionner.
- `browser screenshot` capture les pixels (page entière, élément ou références étiquetées).
- `browser doctor` vérifie la disponibilité du Gateway, du Plugin, du profil, du navigateur et des onglets.
- `browser` accepte :
  - `profile` pour choisir un profil de navigateur nommé (openclaw, chrome ou CDP distant).
  - `target` (`sandbox` | `host` | `node`) pour sélectionner l’emplacement du navigateur.
  - Dans les sessions en bac à sable, `target: "host"` nécessite `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si `target` est omis : les sessions en bac à sable utilisent `sandbox` par défaut, tandis que les autres sessions utilisent `host`.
  - Si un Node compatible avec le navigateur est connecté, l’outil peut automatiquement acheminer les opérations vers celui-ci, sauf si vous fixez `target="host"` ou `target="node"`.

Cela garantit le comportement déterministe de l’agent et évite les sélecteurs fragiles.

## Ressources connexes

- [Vue d’ensemble des outils](/fr/tools) - tous les outils disponibles pour l’agent
- [Mise en bac à sable](/fr/gateway/sandboxing) - contrôle du navigateur dans les environnements en bac à sable
- [Sécurité](/fr/gateway/security) - risques liés au contrôle du navigateur et renforcement de la sécurité
