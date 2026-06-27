---
read_when:
    - Association des nœuds iOS/Android à un Gateway
    - Utiliser le canevas/la caméra Node pour le contexte de l’agent
    - Ajouter de nouvelles commandes de nœud ou des assistants CLI
summary: 'Nœuds : appairage, capacités, autorisations et assistants CLI pour canvas/caméra/écran/appareil/notifications/système'
title: Nœuds
x-i18n:
    generated_at: "2026-06-27T17:41:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Un **Node** est un appareil compagnon (macOS/iOS/Android/headless) qui se connecte au **WebSocket** du Gateway (même port que les opérateurs) avec `role: "node"` et expose une surface de commandes (par exemple `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [protocole Gateway](/fr/gateway/protocol).

Transport hérité : [protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ;
historique uniquement pour les Nodes actuels).

macOS peut aussi fonctionner en **mode Node** : l’app de la barre de menus se connecte au serveur WS du Gateway et expose ses commandes locales de canevas/caméra comme un Node (ainsi `openclaw nodes …` fonctionne avec ce Mac). En mode Gateway distant, l’automatisation du navigateur est gérée par l’hôte Node CLI (`openclaw node run` ou le service Node installé), pas par le Node de l’app native.

Remarques :

- Les Nodes sont des **périphériques**, pas des gateways. Ils n’exécutent pas le service Gateway.
- Les messages Telegram/WhatsApp/etc. arrivent sur le **Gateway**, pas sur les Nodes.
- Runbook de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage + état

**Les Nodes WS utilisent l’appairage des appareils.** Les Nodes présentent une identité d’appareil pendant `connect` ; le Gateway crée une demande d’appairage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’UI).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un Node réessaie avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez `openclaw devices list` avant d’approuver.

Remarques :

- `nodes status` marque un Node comme **appairé** lorsque son rôle d’appairage d’appareil inclut `node`.
- L’enregistrement d’appairage d’appareil est le contrat durable des rôles approuvés. La rotation des tokens reste dans ce contrat ; elle ne peut pas promouvoir un Node appairé vers un rôle différent que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d’appairage de Nodes distinct, détenu par le Gateway ; il ne contrôle **pas** la poignée de main WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` supprime un appairage de Node. Pour un Node adossé à un appareil, cela révoque le rôle `node` de l’appareil dans `devices/paired.json` et déconnecte les sessions de rôle Node de cet appareil — un appareil à rôles mixtes conserve sa ligne et perd seulement le rôle `node`, tandis qu’une ligne d’appareil uniquement Node est supprimée. Cela efface aussi toute entrée correspondante du magasin d’appairage de Nodes distinct détenu par le Gateway. `operator.pairing` peut supprimer des lignes Node non opérateur ; un appelant par token d’appareil qui révoque son propre rôle Node sur un appareil à rôles mixtes a en plus besoin de `operator.admin`.
- La portée d’approbation suit les commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes Node non exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte Node distant (system.run)

Utilisez un **hôte Node** lorsque votre Gateway fonctionne sur une machine et que vous voulez exécuter les commandes sur une autre. Le modèle parle toujours au **Gateway** ; le Gateway transfère les appels `exec` à l’**hôte Node** lorsque `host=node` est sélectionné.

### Ce qui s’exécute où

- **Hôte Gateway** : reçoit les messages, exécute le modèle, route les appels d’outils.
- **Hôte Node** : exécute `system.run`/`system.which` sur la machine Node.
- **Approbations** : appliquées sur l’hôte Node via `~/.openclaw/exec-approvals.json`.

Remarque sur les approbations :

- Les exécutions Node adossées à une approbation lient le contexte exact de la demande.
- Pour les exécutions directes de fichiers shell/runtime, OpenClaw tente aussi de lier un opérande de fichier local concret et refuse l’exécution si ce fichier change avant l’exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime, l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir entièrement le runtime. Utilisez le sandboxing, des hôtes séparés ou une allowlist/un workflow complet explicitement fiable pour une sémantique d’interpréteur plus large.

### Démarrer un hôte Node (premier plan)

Sur la machine Node :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway distant via tunnel SSH (liaison local loopback)

Si le Gateway se lie au loopback (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes Node distants ne peuvent pas se connecter directement. Créez un tunnel SSH et pointez l’hôte Node vers l’extrémité locale du tunnel.

Exemple (hôte Node -> hôte Gateway) :

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l’authentification par token ou par mot de passe.
- Les variables d’environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Le repli de configuration est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont admissibles selon les règles de précédence distantes.
- Si des SecretRefs `gateway.auth.*` locales actives sont configurées mais non résolues, l’authentification de l’hôte Node échoue fermée.
- La résolution d’authentification de l’hôte Node honore uniquement les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte Node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Appairer + nommer

Sur l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le Node réessaie avec des détails d’authentification modifiés, relancez `openclaw devices list` et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persiste dans `~/.openclaw/node.json` sur le Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté Gateway).

### Ajouter les commandes à l’allowlist

Les approbations d’exec sont **par hôte Node**. Ajoutez des entrées d’allowlist depuis le Gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations résident sur l’hôte Node à `~/.openclaw/exec-approvals.json`.

### Pointer exec vers le Node

Configurer les valeurs par défaut (configuration Gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois défini, tout appel `exec` avec `host=node` s’exécute sur l’hôte Node (sous réserve de l’allowlist/des approbations du Node).

`host=auto` ne choisira pas implicitement le Node de lui-même, mais une demande explicite par appel `host=node` est autorisée depuis `auto`. Si vous voulez que l’exec Node soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Voir aussi :

- [CLI de l’hôte Node](/fr/cli/node)
- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

## Invoquer des commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Des assistants de plus haut niveau existent pour les workflows courants « donner à l’agent une pièce jointe MEDIA ».

## Politique de commandes

Les commandes Node doivent franchir deux contrôles avant de pouvoir être invoquées :

1. Le Node doit déclarer la commande dans sa liste WebSocket `connect.commands`.
2. La politique de plateforme du Gateway doit autoriser la commande déclarée.

Les Nodes compagnons Windows et macOS autorisent par défaut des commandes déclarées sûres comme `canvas.*`, `camera.list`, `location.get` et `screen.snapshot`. Les Nodes de confiance qui annoncent la capacité `talk` ou déclarent des commandes `talk.*` autorisent aussi par défaut les commandes push-to-talk déclarées (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), indépendamment du libellé de plateforme. Les commandes dangereuses ou fortement liées à la confidentialité comme `camera.snap`, `camera.clip` et `screen.record` nécessitent toujours une adhésion explicite avec `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` prévaut toujours sur les valeurs par défaut et les entrées d’allowlist supplémentaires.

Les commandes Node détenues par un Plugin peuvent ajouter une politique Gateway node-invoke. Cette politique s’exécute après le contrôle d’allowlist et avant le transfert au Node, de sorte que `node.invoke` brut, les assistants CLI et les outils d’agent dédiés partagent la même frontière d’autorisation du Plugin. Les commandes Node dangereuses de Plugin nécessitent toujours une adhésion explicite via `gateway.nodes.allowCommands`.

Après qu’un Node a modifié sa liste de commandes déclarées, rejetez l’ancien appairage d’appareil et approuvez la nouvelle demande afin que le Gateway stocke l’instantané de commandes mis à jour.

## Configuration (`openclaw.json`)

Les paramètres liés aux Nodes se trouvent sous `gateway.nodes` et `tools.exec` :

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

Utilisez les noms exacts des commandes Node. `denyCommands` supprime une commande même lorsqu’une valeur par défaut de plateforme ou une entrée `allowCommands` l’autoriserait autrement. Consultez la [référence de configuration Gateway](/fr/gateway/configuration-reference#gateway-field-details) pour les détails des champs d’appairage de Nodes Gateway et de politique de commandes.

Remplacement du Node d’exec par agent :

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

## Captures d’écran (instantanés de canevas)

Si le Node affiche le canevas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Assistant CLI (écrit dans un fichier temporaire et affiche le chemin enregistré) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Contrôles du canevas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Remarques :

- `canvas present` accepte les URL ou chemins de fichiers locaux (`--target`), plus `--x/--y/--width/--height` facultatifs pour le positionnement.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (canevas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Remarques :

- Les Nodes mobiles utilisent une page A2UI intégrée détenue par l’app pour un rendu capable d’actions.
- Seul A2UI v0.8 JSONL est pris en charge (v0.9/createSurface est rejeté).
- iOS et Android affichent les pages Gateway Canvas distantes, mais les actions de boutons A2UI sont distribuées uniquement depuis la page A2UI intégrée détenue par l’app. Les pages A2UI HTTP/HTTPS hébergées par le Gateway sont en lecture seule sur ces clients mobiles.

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

- Le nœud doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée du clip est limitée (actuellement `<= 60s`) afin d’éviter des charges utiles base64 trop volumineuses.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque c’est possible ; les autorisations refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (nœuds)

Les nœuds pris en charge exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notes :

- La disponibilité de `screen.record` dépend de la plateforme du nœud.
- Les enregistrements d’écran sont limités à `<= 60s`.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs écrans sont disponibles.

## Localisation (nœuds)

Les nœuds exposent `location.get` lorsque la localisation est activée dans les paramètres.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notes :

- La localisation est **désactivée par défaut**.
- « Toujours » nécessite une autorisation système ; la récupération en arrière-plan est fournie au mieux.
- La réponse inclut lat/lon, la précision (en mètres) et l’horodatage.

## SMS (nœuds Android)

Les nœuds Android peuvent exposer `sms.send` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie.

Appel de bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notes :

- L’invite d’autorisation doit être acceptée sur l’appareil Android avant que la capacité soit annoncée.
- Les appareils uniquement Wi-Fi sans téléphonie n’annonceront pas `sms.send`.

## Commandes d’appareil Android + données personnelles

Les nœuds Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

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
- Les commandes de mouvement sont limitées par capacité selon les capteurs disponibles.

## Commandes système (hôte de nœud / nœud Mac)

Le nœud macOS expose `system.run`, `system.notify` et `system.execApprovals.get/set`.
L’hôte de nœud sans interface expose `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notes :

- `system.run` renvoie stdout/stderr/code de sortie dans la charge utile.
- L’exécution shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes de nœud explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent uniquement sur le chemin exec.
- Le chemin exec prépare un `systemRunPlan` canonique avant approbation. Une fois une
  approbation accordée, le Gateway transmet ce plan stocké, et non des champs
  command/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état de l’autorisation de notification dans l’app macOS.
- Les métadonnées `platform` / `deviceFamily` de nœud non reconnues utilisent une liste d’autorisation par défaut prudente qui exclut `system.run` et `system.which`. Si vous avez intentionnellement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions toujours autorisées en mode liste d’autorisation, les enveloppes de distribution connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes au lieu des chemins des enveloppes. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est conservée automatiquement.
- Sur les hôtes de nœud Windows en mode liste d’autorisation, les exécutions d’enveloppe shell via `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation seule n’autorise pas automatiquement la forme avec enveloppe).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes de nœud ignorent les remplacements de `PATH` et retirent les clés dangereuses de démarrage/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service hôte de nœud (ou installez les outils dans des emplacements standard) au lieu de passer `PATH` via `--env`.
- En mode nœud macOS, `system.run` est contrôlé par les approbations exec dans l’app macOS (Paramètres → Approbations exec).
  Ask/allowlist/full se comportent de la même manière que l’hôte de nœud sans interface ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de nœud sans interface, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison de nœud exec

Lorsque plusieurs nœuds sont disponibles, vous pouvez lier exec à un nœud spécifique.
Cela définit le nœud par défaut pour `exec host=node` (et peut être remplacé par agent).

Valeur par défaut globale :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Annuler pour autoriser n’importe quel nœud :

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Carte des autorisations

Les nœuds peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par ex. `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordée).

## Hôte de nœud sans interface (multiplateforme)

OpenClaw peut exécuter un **hôte de nœud sans interface** (sans UI) qui se connecte au WebSocket
du Gateway et expose `system.run` / `system.which`. C’est utile sur Linux/Windows
ou pour exécuter un nœud minimal à côté d’un serveur.

Le démarrer :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notes :

- L’appairage reste requis (le Gateway affichera une invite d’appairage d’appareil).
- L’hôte de nœud stocke son identifiant de nœud, son jeton, son nom d’affichage et les informations de connexion au Gateway dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Approbations exec](/fr/tools/exec-approvals)).
- Sur macOS, l’hôte de nœud sans interface exécute `system.run` localement par défaut. Définissez
  `OPENCLAW_NODE_EXEC_HOST=app` pour acheminer `system.run` via l’hôte exec de l’app compagnon ; ajoutez
  `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte d’app et échouer de manière fermée s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS du Gateway utilise TLS.

## Mode nœud Mac

- L’app de barre de menus macOS se connecte au serveur WS du Gateway en tant que nœud (donc `openclaw nodes …` fonctionne avec ce Mac).
- En mode distant, l’app ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
