---
read_when:
    - Appairer des Node iOS/Android à une Gateway
    - Utiliser canvas/camera de Node pour le contexte de l’agent
    - Ajouter de nouvelles commandes de Node ou aides CLI
summary: 'Node : appairage, capacités, permissions, et aides CLI pour canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-26T11:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Un **Node** est un appareil compagnon (macOS/iOS/Android/headless) qui se connecte à la Gateway **WebSocket** (même port que les opérateurs) avec `role: "node"` et expose une surface de commande (par ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [Protocole Gateway](/fr/gateway/protocol).

Transport hérité : [Protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ;
historique uniquement pour les Node actuels).

macOS peut aussi fonctionner en **mode Node** : l’app de barre de menus se connecte au
serveur WS de la Gateway et expose ses commandes locales canvas/camera comme un Node (ainsi
`openclaw nodes …` fonctionne sur ce Mac). En mode Gateway distante, l’automatisation
du navigateur est gérée par l’hôte CLI du Node (`openclaw node run` ou le
service Node installé), pas par le Node de l’app native.

Notes :

- Les Node sont des **périphériques**, pas des Gateway. Ils n’exécutent pas le service Gateway.
- Les messages Telegram/WhatsApp/etc. arrivent sur la **Gateway**, pas sur les Node.
- Guide opérationnel de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage + statut

**Les Node WS utilisent l’appairage d’appareil.** Les Node présentent une identité d’appareil lors de `connect` ; la Gateway
crée une demande d’appairage d’appareil pour `role: node`. Approuvez via la CLI des appareils (ou l’UI).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un Node réessaie avec des détails d’authentification modifiés (rôle/portées/clé publique), la
demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez
`openclaw devices list` avant d’approuver.

Notes :

- `nodes status` marque un Node comme **appairé** lorsque le rôle d’appairage d’appareil inclut `node`.
- L’enregistrement d’appairage d’appareil est le contrat durable de rôle approuvé. La rotation
  de token reste dans ce contrat ; elle ne peut pas faire évoluer un Node appairé vers un
  rôle différent que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/rename`) est un magasin séparé d’appairage de Node géré par la Gateway ;
  il ne contrôle **pas** la poignée de main WS `connect`.
- La portée d’approbation suit les commandes déclarées de la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes Node sans exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte Node distant (`system.run`)

Utilisez un **hôte Node** lorsque votre Gateway s’exécute sur une machine et que vous voulez que les commandes
s’exécutent sur une autre. Le modèle parle toujours à la **Gateway** ; la Gateway
transmet les appels `exec` à l’**hôte Node** lorsque `host=node` est sélectionné.

### Qu’est-ce qui s’exécute où

- **Hôte Gateway** : reçoit les messages, exécute le modèle, route les appels d’outils.
- **Hôte Node** : exécute `system.run`/`system.which` sur la machine du Node.
- **Approbations** : appliquées sur l’hôte Node via `~/.openclaw/exec-approvals.json`.

Note sur les approbations :

- Les exécutions de Node adossées à une approbation lient le contexte exact de la requête.
- Pour les exécutions directes de shell/fichier runtime, OpenClaw lie aussi au mieux un
  opérande de fichier local concret et refuse l’exécution si ce fichier change avant l’exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime,
  l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir complètement le runtime. Utilisez le sandboxing,
  des hôtes séparés, ou un workflow explicite d’autorisation de confiance/complet pour une sémantique d’interpréteur plus large.

### Démarrer un hôte Node (premier plan)

Sur la machine du Node :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway distante via tunnel SSH (liaison loopback)

Si la Gateway est liée au loopback (`gateway.bind=loopback`, valeur par défaut en mode local),
les hôtes Node distants ne peuvent pas se connecter directement. Créez un tunnel SSH et pointez
l’hôte Node vers l’extrémité locale du tunnel.

Exemple (hôte Node -> hôte Gateway) :

```bash
# Terminal A (à laisser tourner) : transfert du port local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B : exporter le token Gateway et se connecter via le tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notes :

- `openclaw node run` prend en charge l’authentification par token ou mot de passe.
- Les variables d’environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuration de repli est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont éligibles selon les règles de priorité distante.
- Si des SecretRef actifs `gateway.auth.*` sont configurés mais non résolus, l’authentification de l’hôte Node échoue en mode fermé.
- La résolution d’authentification de l’hôte Node ne prend en compte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

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

Si le Node réessaie avec des détails d’authentification modifiés, relancez `openclaw devices list`
et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persisté dans `~/.openclaw/node.json` sur le Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté Gateway).

### Autoriser les commandes

Les approbations `exec` sont **par hôte Node**. Ajoutez des entrées à la liste d’autorisation depuis la Gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations vivent sur l’hôte Node dans `~/.openclaw/exec-approvals.json`.

### Faire pointer exec vers le Node

Configurez les valeurs par défaut (configuration Gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois défini, tout appel `exec` avec `host=node` s’exécute sur l’hôte Node (sous réserve de la
liste d’autorisation/des approbations du Node).

`host=auto` ne choisira pas implicitement le Node de lui-même, mais une requête explicite `host=node` par appel est autorisée depuis `auto`. Si vous voulez que l’exécution sur Node soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Associé :

- [CLI de l’hôte Node](/fr/cli/node)
- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)

## Invoquer des commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Il existe des aides de plus haut niveau pour les workflows courants « donner à l’agent une pièce jointe MEDIA ».

## Captures d’écran (instantanés canvas)

Si le Node affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Aide CLI (écrit dans un fichier temporaire et affiche `MEDIA:<path>`) :

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

- `canvas present` accepte les URL ou chemins de fichiers locaux (`--target`), plus `--x/--y/--width/--height` facultatifs pour le positionnement.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notes :

- Seul A2UI v0.8 JSONL est pris en charge (v0.9/createSurface est rejeté).

## Photos + vidéos (caméra Node)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # par défaut : les deux orientations (2 lignes MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clips vidéo (`mp4`) :

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notes :

- Le Node doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée du clip est plafonnée (actuellement `<= 60s`) pour éviter des payloads base64 trop volumineux.
- Android demandera les permissions `CAMERA`/`RECORD_AUDIO` lorsque c’est possible ; les permissions refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (Node)

Les Node pris en charge exposent `screen.record` (`mp4`). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notes :

- La disponibilité de `screen.record` dépend de la plateforme du Node.
- Les enregistrements d’écran sont plafonnés à `<= 60s`.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs écrans sont disponibles.

## Localisation (Node)

Les Node exposent `location.get` lorsque Location est activé dans les réglages.

Aide CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notes :

- La localisation est **désactivée par défaut**.
- « Toujours » nécessite une permission système ; la récupération en arrière-plan est un best-effort.
- La réponse inclut lat/lon, la précision (mètres), et l’horodatage.

## SMS (Node Android)

Les Node Android peuvent exposer `sms.send` lorsque l’utilisateur accorde la permission **SMS** et que l’appareil prend en charge la téléphonie.

Invocation bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notes :

- L’invite de permission doit être acceptée sur l’appareil Android avant que la capacité ne soit annoncée.
- Les appareils Wi‑Fi uniquement sans téléphonie n’annonceront pas `sms.send`.

## Commandes Android appareil + données personnelles

Les Node Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

Familles disponibles :

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemples d’invocations :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notes :

- Les commandes motion sont contrôlées par capacité en fonction des capteurs disponibles.

## Commandes système (hôte Node / mac Node)

Le Node macOS expose `system.run`, `system.notify`, et `system.execApprovals.get/set`.
L’hôte Node headless expose `system.run`, `system.which`, et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notes :

- `system.run` renvoie stdout/stderr/code de sortie dans le payload.
- L’exécution shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes Node explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ils restent uniquement sur le chemin `exec`.
- Le chemin `exec` prépare un `systemRunPlan` canonique avant l’approbation. Une fois
  une approbation accordée, la Gateway transmet ce plan stocké, et non des champs de commande/cwd/session modifiés plus tard par l’appelant.
- `system.notify` respecte l’état des permissions de notification dans l’app macOS.
- Les métadonnées `platform` / `deviceFamily` de Node non reconnues utilisent une liste d’autorisation par défaut prudente qui exclut `system.run` et `system.which`. Si vous avez intentionnellement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout`, et `--needs-screen-recording`.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions always-allow en mode allowlist, les wrappers de dispatch connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins d’exécutable internes au lieu des chemins de wrapper. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est persistée automatiquement.
- Sur les hôtes Node Windows en mode allowlist, les exécutions de wrapper shell via `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation seule n’autorise pas automatiquement la forme wrapper).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes Node ignorent les remplacements `PATH` et suppriment les clés dangereuses de démarrage/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service d’hôte Node (ou installez les outils dans des emplacements standard) au lieu de passer `PATH` via `--env`.
- En mode Node macOS, `system.run` est contrôlé par les approbations exec dans l’app macOS (Settings → Exec approvals).
  Ask/allowlist/full se comportent de la même manière que sur l’hôte Node headless ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte Node headless, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison exec au Node

Lorsque plusieurs Node sont disponibles, vous pouvez lier exec à un Node spécifique.
Cela définit le Node par défaut pour `exec host=node` (et peut être remplacé par agent).

Valeur par défaut globale :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Supprimez-le pour autoriser n’importe quel Node :

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Carte des permissions

Les Node peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom de permission (par ex. `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordée).

## Hôte Node headless (cross-platform)

OpenClaw peut exécuter un **hôte Node headless** (sans UI) qui se connecte à la Gateway
WebSocket et expose `system.run` / `system.which`. Cela est utile sur Linux/Windows
ou pour exécuter un Node minimal à côté d’un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notes :

- L’appairage reste requis (la Gateway affichera une invite d’appairage d’appareil).
- L’hôte Node stocke son id de Node, son token, son nom d’affichage et les informations de connexion Gateway dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Approbations Exec](/fr/tools/exec-approvals)).
- Sur macOS, l’hôte Node headless exécute `system.run` localement par défaut. Définissez
  `OPENCLAW_NODE_EXEC_HOST=app` pour router `system.run` via l’hôte exec de l’app compagnon ; ajoutez
  `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte app et échouer en mode fermé s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS Gateway utilise TLS.

## Mode Node Mac

- L’app de barre de menus macOS se connecte au serveur WS Gateway en tant que Node (ainsi `openclaw nodes …` fonctionne sur ce Mac).
- En mode distant, l’app ouvre un tunnel SSH pour le port Gateway et se connecte à `localhost`.
