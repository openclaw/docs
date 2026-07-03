---
read_when:
    - Appairage de nœuds iOS/Android à une passerelle
    - Utilisation du canevas/de la caméra du nœud pour le contexte de l’agent
    - Ajout de nouvelles commandes Node ou d’utilitaires CLI
summary: 'Nœuds : appairage, capacités, autorisations et assistants CLI pour canvas/camera/screen/device/notifications/system'
title: Nœuds
x-i18n:
    generated_at: "2026-07-03T09:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Un **nœud** est un appareil compagnon (macOS/iOS/Android/sans interface) qui se connecte au **WebSocket** du Gateway (même port que les opérateurs) avec `role: "node"` et expose une surface de commandes (par ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [protocole du Gateway](/fr/gateway/protocol).

Transport hérité : [protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ;
historique uniquement pour les nœuds actuels).

macOS peut aussi fonctionner en **mode nœud** : l'application de barre de menus se connecte au serveur WS du Gateway et expose ses commandes locales de canvas/caméra comme un nœud (ainsi
`openclaw nodes …` fonctionne avec ce Mac). En mode Gateway distant, l'automatisation du navigateur est gérée par l'hôte de nœud CLI (`openclaw node run` ou le service de nœud installé), et non par le nœud de l'application native.

Notes :

- Les nœuds sont des **périphériques**, pas des gateways. Ils n'exécutent pas le service Gateway.
- Les messages Telegram/WhatsApp/etc. arrivent sur le **gateway**, pas sur les nœuds.
- Runbook de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage + statut

**Les nœuds WS utilisent l'appairage d'appareil.** Les nœuds présentent une identité d'appareil pendant `connect` ; le Gateway crée une demande d'appairage d'appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l'UI).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un nœud réessaie avec des détails d'authentification modifiés (rôle/périmètres/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez
`openclaw devices list` avant d'approuver.

Notes :

- `nodes status` marque un nœud comme **appairé** lorsque son rôle d'appairage d'appareil inclut `node`.
- L'enregistrement d'appairage d'appareil est le contrat durable de rôle approuvé. La rotation des jetons reste dans ce contrat ; elle ne peut pas promouvoir un nœud appairé vers un rôle différent que l'approbation d'appairage n'a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d'appairage de nœuds distinct, détenu par le Gateway ; il ne contrôle **pas** la poignée de main WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` supprime un appairage de nœud. Pour un nœud adossé à un appareil, cela révoque le rôle `node` de l'appareil dans `devices/paired.json` et déconnecte les sessions de rôle nœud de cet appareil — un appareil à rôles mixtes conserve sa ligne et perd seulement le rôle `node`, tandis qu'une ligne d'appareil uniquement nœud est supprimée. Cela efface aussi toute entrée correspondante du magasin d'appairage de nœuds distinct détenu par le Gateway. `operator.pairing` peut supprimer des lignes de nœud non opérateur ; un appelant par jeton d'appareil qui révoque son propre rôle de nœud sur un appareil à rôles mixtes a en plus besoin de `operator.admin`.
- La portée d'approbation suit les commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de nœud non exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte de nœud distant (system.run)

Utilisez un **hôte de nœud** lorsque votre Gateway s'exécute sur une machine et que vous voulez exécuter des commandes sur une autre. Le modèle parle toujours au **gateway** ; le gateway transmet les appels `exec` à l'**hôte de nœud** lorsque `host=node` est sélectionné.

### Ce qui s'exécute où

- **Hôte Gateway** : reçoit les messages, exécute le modèle, route les appels d'outils.
- **Hôte de nœud** : exécute `system.run`/`system.which` sur la machine du nœud.
- **Approbations** : appliquées sur l'hôte de nœud via `~/.openclaw/exec-approvals.json`.

Note d'approbation :

- Les exécutions de nœud adossées à une approbation lient le contexte exact de la demande.
- Pour les exécutions directes de fichiers shell/runtime, OpenClaw tente aussi de lier un opérande de fichier local concret et refuse l'exécution si ce fichier change avant l'exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d'interpréteur/runtime, l'exécution adossée à une approbation est refusée au lieu de prétendre couvrir entièrement le runtime. Utilisez le sandboxing, des hôtes séparés, ou une liste d'autorisation/un workflow complet explicitement approuvé pour des sémantiques d'interpréteur plus larges.

### Démarrer un hôte de nœud (premier plan)

Sur la machine du nœud :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway distant via tunnel SSH (liaison loopback)

Si le Gateway se lie au loopback (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes de nœud distants ne peuvent pas se connecter directement. Créez un tunnel SSH et pointez l'hôte de nœud vers l'extrémité locale du tunnel.

Exemple (hôte de nœud -> hôte gateway) :

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notes :

- `openclaw node run` prend en charge l'authentification par jeton ou par mot de passe.
- Les variables d'environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Le repli de configuration est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l'hôte de nœud ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont admissibles selon les règles de précédence distante.
- Si des SecretRefs locales actives `gateway.auth.*` sont configurées mais non résolues, l'authentification de l'hôte de nœud échoue fermée.
- La résolution d'authentification de l'hôte de nœud n'honore que les variables d'environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte de nœud (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Appairer + nommer

Sur l'hôte gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le nœud réessaie avec des détails d'authentification modifiés, réexécutez `openclaw devices list`
et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persiste dans `~/.openclaw/node.json` sur le nœud).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (surcharge côté gateway).

### Autoriser les commandes

Les approbations exec sont **par hôte de nœud**. Ajoutez des entrées de liste d'autorisation depuis le gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations résident sur l'hôte de nœud dans `~/.openclaw/exec-approvals.json`.

### Pointer exec vers le nœud

Configurer les valeurs par défaut (configuration du gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois configuré, tout appel `exec` avec `host=node` s'exécute sur l'hôte de nœud (sous réserve de la liste d'autorisation/des approbations du nœud).

`host=auto` ne choisira pas implicitement le nœud de lui-même, mais une demande explicite par appel `host=node` est autorisée depuis `auto`. Si vous voulez que l'exécution sur nœud soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Connexe :

- [CLI de l'hôte de nœud](/fr/cli/node)
- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

### Inférence de modèle locale

Un nœud de bureau ou serveur peut exposer des modèles capables de chat depuis un serveur Ollama exécuté sur ce nœud. Les agents utilisent l'outil `node_inference` du Plugin Ollama pour découvrir les modèles installés et exécuter une invite bornée à distance ; le Gateway n'a pas besoin d'accès réseau direct à Ollama. Consultez [Inférence locale au nœud Ollama](/fr/providers/ollama#node-local-inference)
pour la configuration, le filtrage des modèles et les commandes de vérification directe.

## Invocation de commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Des assistants de plus haut niveau existent pour les workflows courants « donner à l'agent une pièce jointe MEDIA ».

## Politique de commandes

Les commandes de nœud doivent passer deux contrôles avant de pouvoir être invoquées :

1. Le nœud doit déclarer la commande dans sa liste WebSocket `connect.commands`.
2. La politique de plateforme du gateway doit autoriser la commande déclarée.

Les nœuds compagnons Windows et macOS autorisent par défaut les commandes déclarées sûres telles que
`canvas.*`, `camera.list`, `location.get` et `screen.snapshot`.
Les nœuds de confiance qui annoncent la capacité `talk` ou déclarent des commandes `talk.*`
autorisent aussi par défaut les commandes push-to-talk déclarées (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), indépendamment du libellé de plateforme.
Les commandes dangereuses ou fortement sensibles à la confidentialité, telles que `camera.snap`, `camera.clip` et
`screen.record`, nécessitent toujours une acceptation explicite avec
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` l'emporte toujours sur
les valeurs par défaut et les entrées de liste d'autorisation supplémentaires.

Les commandes de nœud détenues par un Plugin peuvent ajouter une politique Gateway node-invoke. Cette politique s'exécute après la vérification de la liste d'autorisation et avant le transfert au nœud, de sorte que `node.invoke` brut, les assistants CLI et les outils d'agent dédiés partagent la même frontière d'autorisation de Plugin. Les commandes de nœud de Plugin dangereuses nécessitent toujours une acceptation explicite `gateway.nodes.allowCommands`.

Après qu'un nœud a modifié sa liste de commandes déclarées, rejetez l'ancien appairage d'appareil et approuvez la nouvelle demande afin que le gateway stocke l'instantané de commandes mis à jour.

## Configuration (`openclaw.json`)

Les paramètres liés aux nœuds se trouvent sous `gateway.nodes` et `tools.exec` :

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Utilisez les noms exacts des commandes de nœud. `denyCommands` supprime une commande même lorsqu'une valeur par défaut de plateforme ou une entrée `allowCommands` l'autoriserait autrement. Consultez la [référence de configuration du Gateway](/fr/gateway/configuration-reference#gateway-field-details)
pour les détails des champs d'appairage de nœuds gateway et de politique de commandes.

Surcharge du nœud exec par agent :

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Captures d'écran (instantanés canvas)

Si le nœud affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Assistant CLI (écrit dans un fichier temporaire et affiche le chemin enregistré) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Contrôles du canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notes :

- `canvas present` accepte des URL ou des chemins de fichiers locaux (`--target`), ainsi que `--x/--y/--width/--height` facultatifs pour le positionnement.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notes :

- Les Nodes mobiles utilisent une page A2UI intégrée appartenant à l’application pour le rendu avec actions.
- Seul le JSONL A2UI v0.8 est pris en charge (v0.9/createSurface est rejeté).
- iOS et Android affichent les pages Gateway Canvas distantes, mais les actions des boutons A2UI ne sont envoyées que depuis la page A2UI intégrée appartenant à l’application. Les pages A2UI HTTP/HTTPS hébergées par le Gateway sont en lecture seule sur ces clients mobiles.

## Photos + vidéos (caméra du Node)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clips vidéo (`mp4`) :

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notes :

- Le Node doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée du clip est plafonnée (actuellement `<= 60s`) afin d’éviter des charges utiles base64 trop volumineuses.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque c’est possible ; les autorisations refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (Nodes)

Les Nodes pris en charge exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notes :

- La disponibilité de `screen.record` dépend de la plateforme du Node.
- Les enregistrements d’écran sont plafonnés à `<= 60s`.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs écrans sont disponibles.

## Localisation (Nodes)

Les Nodes exposent `location.get` lorsque la localisation est activée dans les paramètres.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notes :

- La localisation est **désactivée par défaut**.
- « Always » nécessite l’autorisation système ; la récupération en arrière-plan est au mieux.
- La réponse inclut la latitude/longitude, la précision (mètres) et l’horodatage.

## SMS (Nodes Android)

Les Nodes Android peuvent exposer `sms.send` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie.

Appel de bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notes :

- La demande d’autorisation doit être acceptée sur l’appareil Android avant que la capacité ne soit annoncée.
- Les appareils uniquement Wi-Fi sans téléphonie n’annonceront pas `sms.send`.

## Commandes d’appareil Android + données personnelles

Les Nodes Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

Familles disponibles :

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` lorsque le partage des applications installées est activé dans les paramètres Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemples d’appels :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notes :

- `device.apps` est optionnel et renvoie par défaut les applications visibles dans le lanceur.
- Les commandes de mouvement sont limitées par les capteurs disponibles.

## Commandes système (hôte du Node / Node Mac)

Le Node macOS expose `system.run`, `system.notify` et `system.execApprovals.get/set`.
L’hôte de Node sans interface expose `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notes :

- `system.run` renvoie stdout/stderr/le code de sortie dans la charge utile.
- L’exécution du shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes explicites du Node.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent uniquement sur le chemin exec.
- Le chemin exec prépare un `systemRunPlan` canonique avant approbation. Une fois une
  approbation accordée, le Gateway transmet ce plan stocké, et non les champs
  command/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état des autorisations de notification dans l’application macOS.
- Les métadonnées `platform` / `deviceFamily` de Node non reconnues utilisent une liste d’autorisation par défaut prudente qui exclut `system.run` et `system.which`. Si vous avez intentionnellement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes d’envoi connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes au lieu des chemins des enveloppes. Si le désencapsulage n’est pas sûr, aucune entrée de liste d’autorisation n’est persistée automatiquement.
- Sur les hôtes de Node Windows en mode liste d’autorisation, les exécutions d’enveloppe shell via `cmd.exe /c` nécessitent une approbation (l’entrée de liste d’autorisation seule n’autorise pas automatiquement la forme avec enveloppe).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes de Node ignorent les remplacements `PATH` et retirent les clés de démarrage/shell dangereuses (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service de l’hôte de Node (ou installez les outils dans des emplacements standard) au lieu de transmettre `PATH` via `--env`.
- En mode Node macOS, `system.run` est contrôlé par les approbations exec dans l’application macOS (Paramètres → Approbations exec).
  Les modes demander/liste d’autorisation/complet se comportent comme pour l’hôte de Node sans interface ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de Node sans interface, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison exec du Node

Lorsque plusieurs Nodes sont disponibles, vous pouvez lier exec à un Node spécifique.
Cela définit le Node par défaut pour `exec host=node` (et peut être remplacé par agent).

Par défaut global :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Annuler pour autoriser n’importe quel Node :

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Carte des autorisations

Les Nodes peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par exemple `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordée).

## Hôte de Node sans interface (multiplateforme)

OpenClaw peut exécuter un **hôte de Node sans interface** (sans UI) qui se connecte au WebSocket du Gateway
et expose `system.run` / `system.which`. C’est utile sous Linux/Windows
ou pour exécuter un Node minimal aux côtés d’un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notes :

- L’appairage reste requis (le Gateway affichera une invite d’appairage de l’appareil).
- L’hôte de Node stocke son identifiant de Node, son jeton, son nom d’affichage et les informations de connexion au Gateway dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Approbations exec](/fr/tools/exec-approvals)).
- Sur macOS, l’hôte de Node sans interface exécute `system.run` localement par défaut. Définissez
  `OPENCLAW_NODE_EXEC_HOST=app` pour router `system.run` via l’hôte exec de l’application compagnon ; ajoutez
  `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte de l’application et échouer de manière fermée s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS du Gateway utilise TLS.

## Mode Node Mac

- L’application de barre de menus macOS se connecte au serveur WS du Gateway en tant que Node (ainsi `openclaw nodes …` fonctionne avec ce Mac).
- En mode distant, l’application ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
