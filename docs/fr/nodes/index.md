---
read_when:
    - Association des nœuds iOS/Android à un Gateway
    - Utiliser le canevas/la caméra du Node pour le contexte de l’agent
    - Ajout de nouvelles commandes Node ou d’utilitaires CLI
summary: 'Nodes : appairage, capacités, autorisations et utilitaires CLI pour canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-05-06T07:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Un **node** est un appareil compagnon (macOS/iOS/Android/sans interface) qui se connecte au **WebSocket** du Gateway (même port que les opérateurs) avec `role: "node"` et expose une surface de commandes (par exemple `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [protocole du Gateway](/fr/gateway/protocol).

Transport hérité : [protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL;
historique uniquement pour les nodes actuels).

macOS peut aussi fonctionner en **mode node** : l’app de barre de menus se connecte au serveur WS du Gateway et expose ses commandes locales de canevas/caméra comme un node (ainsi `openclaw nodes …` fonctionne avec ce Mac). En mode gateway distant, l’automatisation du navigateur est gérée par l’hôte node CLI (`openclaw node run` ou le service node installé), et non par le node de l’app native.

Notes :

- Les nodes sont des **périphériques**, pas des gateways. Ils n’exécutent pas le service Gateway.
- Les messages Telegram/WhatsApp/etc. arrivent sur le **gateway**, pas sur les nodes.
- Guide de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage + état

**Les nodes WS utilisent l’appairage d’appareil.** Les nodes présentent une identité d’appareil pendant `connect`; le Gateway crée une demande d’appairage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’UI).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un node réessaie avec des détails d’authentification modifiés (rôle/scopes/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez `openclaw devices list` avant d’approuver.

Notes :

- `nodes status` marque un node comme **appairé** lorsque son rôle d’appairage d’appareil inclut `node`.
- L’enregistrement d’appairage d’appareil est le contrat durable des rôles approuvés. La rotation des jetons reste dans ce contrat ; elle ne peut pas promouvoir un node appairé vers un rôle différent que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d’appairage de nodes distinct, détenu par le gateway ; il ne contrôle **pas** la négociation WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` supprime les entrées obsolètes de ce magasin d’appairage de nodes distinct détenu par le gateway.
- La portée d’approbation suit les commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes node non exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte node distant (system.run)

Utilisez un **hôte node** lorsque votre Gateway s’exécute sur une machine et que vous voulez exécuter les commandes sur une autre. Le modèle parle toujours au **gateway** ; le gateway transfère les appels `exec` à l’**hôte node** lorsque `host=node` est sélectionné.

### Ce qui s’exécute où

- **Hôte Gateway** : reçoit les messages, exécute le modèle, achemine les appels d’outils.
- **Hôte node** : exécute `system.run`/`system.which` sur la machine du node.
- **Approbations** : appliquées sur l’hôte node via `~/.openclaw/exec-approvals.json`.

Note d’approbation :

- Les exécutions de node adossées à une approbation lient le contexte exact de la demande.
- Pour les exécutions directes de fichiers shell/runtime, OpenClaw lie aussi au mieux un opérande de fichier local concret et refuse l’exécution si ce fichier change avant l’exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime, l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir tout le runtime. Utilisez le sandboxing, des hôtes séparés ou une allowlist/un workflow de confiance explicite pour des sémantiques d’interpréteur plus larges.

### Démarrer un hôte node (premier plan)

Sur la machine du node :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway distant via tunnel SSH (liaison loopback)

Si le Gateway se lie à loopback (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes node distants ne peuvent pas se connecter directement. Créez un tunnel SSH et pointez l’hôte node vers l’extrémité locale du tunnel.

Exemple (hôte node -> hôte gateway) :

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notes :

- `openclaw node run` prend en charge l’authentification par jeton ou par mot de passe.
- Les variables d’environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Le repli de configuration est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte node ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont éligibles selon les règles de précédence distante.
- Si des SecretRefs `gateway.auth.*` locales actives sont configurées mais non résolues, l’authentification de l’hôte node échoue fermée.
- La résolution d’authentification de l’hôte node n’honore que les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Appairer + nommer

Sur l’hôte gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le node réessaie avec des détails d’authentification modifiés, relancez `openclaw devices list` et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persiste dans `~/.openclaw/node.json` sur le node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté gateway).

### Autoriser les commandes

Les approbations exec sont **par hôte node**. Ajoutez des entrées d’allowlist depuis le gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations résident sur l’hôte node dans `~/.openclaw/exec-approvals.json`.

### Pointer exec vers le node

Configurez les valeurs par défaut (configuration du gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois défini, tout appel `exec` avec `host=node` s’exécute sur l’hôte node (sous réserve de l’allowlist/des approbations du node).

`host=auto` ne choisira pas implicitement le node de lui-même, mais une demande explicite par appel `host=node` est autorisée depuis `auto`. Si vous voulez que l’exec sur node soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Connexe :

- [CLI de l’hôte node](/fr/cli/node)
- [Outil exec](/fr/tools/exec)
- [Approbations exec](/fr/tools/exec-approvals)

## Appeler des commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Des assistants de plus haut niveau existent pour les workflows courants « donner à l’agent une pièce jointe MEDIA ».

## Politique des commandes

Les commandes de node doivent passer deux contrôles avant de pouvoir être appelées :

1. Le node doit déclarer la commande dans sa liste WebSocket `connect.commands`.
2. La politique de plateforme du gateway doit autoriser la commande déclarée.

Les nodes compagnons Windows et macOS autorisent par défaut des commandes déclarées sûres comme `canvas.*`, `camera.list`, `location.get` et `screen.snapshot`. Les nodes de confiance qui annoncent la capacité `talk` ou déclarent des commandes `talk.*` autorisent aussi par défaut les commandes push-to-talk déclarées (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), indépendamment de l’étiquette de plateforme. Les commandes dangereuses ou fortement liées à la confidentialité comme `camera.snap`, `camera.clip` et `screen.record` nécessitent toujours une adhésion explicite avec `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` l’emporte toujours sur les valeurs par défaut et les entrées d’allowlist supplémentaires.

Les commandes de node détenues par un Plugin peuvent ajouter une politique Gateway node-invoke. Cette politique s’exécute après le contrôle d’allowlist et avant le transfert au node, de sorte que `node.invoke` brut, les assistants CLI et les outils d’agent dédiés partagent la même limite d’autorisation du Plugin. Les commandes de node de Plugin dangereuses nécessitent toujours une adhésion explicite à `gateway.nodes.allowCommands`.

Après qu’un node a modifié sa liste de commandes déclarées, rejetez l’ancien appairage d’appareil et approuvez la nouvelle demande afin que le gateway stocke l’instantané de commandes mis à jour.

## Captures d’écran (instantanés de canevas)

Si le node affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Assistant CLI (écrit dans un fichier temporaire et affiche `MEDIA:<path>`) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Contrôles Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notes :

- `canvas present` accepte des URL ou des chemins de fichiers locaux (`--target`), plus `--x/--y/--width/--height` optionnels pour le positionnement.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notes :

- Seul A2UI v0.8 JSONL est pris en charge (v0.9/createSurface est rejeté).

## Photos + vidéos (caméra du node)

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

- Le node doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée du clip est bornée (actuellement `<= 60s`) afin d’éviter des payloads base64 surdimensionnés.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque possible ; les autorisations refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (nodes)

Les nodes pris en charge exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notes :

- La disponibilité de `screen.record` dépend de la plateforme du node.
- Les enregistrements d’écran sont bornés à `<= 60s`.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs écrans sont disponibles.

## Localisation (nodes)

Les nodes exposent `location.get` lorsque la localisation est activée dans les paramètres.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notes :

- La localisation est **désactivée par défaut**.
- « Toujours » nécessite une autorisation système ; la récupération en arrière-plan est faite au mieux.
- La réponse inclut latitude/longitude, précision (mètres) et horodatage.

## SMS (nodes Android)

Les nodes Android peuvent exposer `sms.send` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie.

Appel bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notes :

- L’invite d’autorisation doit être acceptée sur l’appareil Android avant que la capacité ne soit annoncée.
- Les appareils uniquement Wi-Fi sans téléphonie n’annonceront pas `sms.send`.

## Commandes d’appareil Android + données personnelles

Les nodes Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

Familles disponibles :

- `device.status`, `device.info`, `device.permissions`, `device.health`
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
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Remarques :

- Les commandes de mouvement sont contrôlées par les capacités des capteurs disponibles.

## Commandes système (hôte de nœud / nœud Mac)

Le nœud macOS expose `system.run`, `system.notify` et `system.execApprovals.get/set`.
L’hôte de nœud sans interface expose `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Remarques :

- `system.run` renvoie stdout/stderr/le code de sortie dans la charge utile.
- L’exécution shell passe maintenant par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes de nœud explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent uniquement sur le chemin exec.
- Le chemin exec prépare un `systemRunPlan` canonique avant l’approbation. Une fois une approbation accordée, le Gateway transmet ce plan stocké, et non les champs de commande/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état des autorisations de notification dans l’app macOS.
- Les métadonnées de nœud `platform` / `deviceFamily` non reconnues utilisent par défaut une liste d’autorisation prudente qui exclut `system.run` et `system.which`. Si vous avez intentionnellement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes de répartition connues (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes au lieu des chemins des enveloppes. Si le désenveloppement n’est pas sûr, aucune entrée de liste d’autorisation n’est conservée automatiquement.
- Sur les hôtes de nœud Windows en mode liste d’autorisation, les exécutions d’enveloppe shell via `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation seule n’autorise pas automatiquement la forme enveloppe).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes de nœud ignorent les remplacements de `PATH` et suppriment les clés dangereuses de démarrage/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si vous avez besoin d’entrées PATH supplémentaires, configurez plutôt l’environnement du service de l’hôte de nœud (ou installez les outils dans des emplacements standard) au lieu de transmettre `PATH` via `--env`.
- En mode nœud macOS, `system.run` est contrôlé par les approbations exec dans l’app macOS (Réglages → Approbations exec).
  Demander/liste d’autorisation/complet se comportent comme l’hôte de nœud sans interface ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de nœud sans interface, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison de nœud exec

Lorsque plusieurs nœuds sont disponibles, vous pouvez lier exec à un nœud précis.
Cela définit le nœud par défaut pour `exec host=node` (et peut être remplacé par agent).

Valeur globale par défaut :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Désactiver pour autoriser n’importe quel nœud :

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Carte des autorisations

Les nœuds peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par ex. `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordée).

## Hôte de nœud sans interface (multiplateforme)

OpenClaw peut exécuter un **hôte de nœud sans interface** (sans UI) qui se connecte au WebSocket du Gateway et expose `system.run` / `system.which`. C’est utile sur Linux/Windows ou pour exécuter un nœud minimal à côté d’un serveur.

Le démarrer :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- L’appairage reste requis (le Gateway affichera une invite d’appairage d’appareil).
- L’hôte de nœud stocke son identifiant de nœud, son jeton, son nom d’affichage et les informations de connexion au Gateway dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Approbations exec](/fr/tools/exec-approvals)).
- Sur macOS, l’hôte de nœud sans interface exécute `system.run` localement par défaut. Définissez `OPENCLAW_NODE_EXEC_HOST=app` pour acheminer `system.run` via l’hôte exec de l’app compagnon ; ajoutez `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte de l’app et échouer de manière fermée s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS du Gateway utilise TLS.

## Mode nœud Mac

- L’app de barre de menus macOS se connecte au serveur WS du Gateway comme un nœud (donc `openclaw nodes …` fonctionne avec ce Mac).
- En mode distant, l’app ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
