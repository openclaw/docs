---
read_when:
    - Association de Nodes iOS/watchOS/Android à un Gateway
    - Utilisation du canevas/de la caméra du Node pour le contexte de l’agent
    - Ajout de nouvelles commandes de nœud ou de fonctions d’assistance de la CLI
summary: 'Nodes : appairage, fonctionnalités, autorisations et outils CLI pour canvas/caméra/écran/appareil/notifications/système'
title: Nœuds
x-i18n:
    generated_at: "2026-07-12T21:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3a13a2b879bef2356a7b28fe207842d64061ba5333f14a1435cc65ae6da85f1
    source_path: nodes/index.md
    workflow: 16
---

Un **Node** est un appareil compagnon (macOS/iOS/watchOS/Android/sans interface graphique) qui se connecte au Gateway avec `role: "node"` et expose une surface de commandes (par exemple `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. La plupart des Nodes utilisent le WebSocket du Gateway sur le port de l’opérateur. Le Node Apple Watch direct facultatif utilise une interrogation HTTPS signée sur ce même port, car watchOS bloque la mise en réseau générique de bas niveau pour les applications ordinaires. Détails du protocole : [Protocole du Gateway](/fr/gateway/protocol).

Transport hérité : [Protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ; uniquement historique pour les Nodes actuels).

macOS peut également fonctionner en **mode Node** : l’application de la barre des menus se connecte au serveur
WS du Gateway en tant que Node (ainsi, `openclaw nodes …` fonctionne avec ce Mac). L’application
ajoute des commandes natives de Canvas, de caméra, d’écran, de notifications et de contrôle de l’ordinateur
à la même surface de commandes de l’hôte Node que celle utilisée par `openclaw node run`. Ne démarrez pas un
deuxième Node CLI sur ce Mac ; l’application exécute en interne le runtime d’hôte Node CLI correspondant
et reste l’unique connexion au Gateway ainsi que l’unique identité de Node.

Les Nodes sont des **périphériques**, et non des gateways : ils n’exécutent pas le service Gateway, et les messages des canaux (Telegram, WhatsApp, etc.) arrivent sur le Gateway, pas sur les Nodes.

Guide de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage et état

Les Nodes utilisent l’**appairage d’appareils**. Lors de la connexion, un Node présente une identité d’appareil signée ; le Gateway crée une demande d’appairage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’interface utilisateur). La configuration directe de l’Apple Watch utilise un code de configuration à courte durée de vie, généré par un administrateur et réservé aux Nodes, afin d’approuver sa surface de commandes fixe et à faible risque ; toute extension ultérieure des capacités nécessite toujours une approbation normale.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Les demandes d’appairage en attente expirent 5 minutes après la dernière nouvelle tentative de l’appareil : un appareil qui continue à se reconnecter maintient sa demande en attente unique (et son `requestId`) active au lieu de générer une nouvelle invite toutes les quelques minutes ; consultez [Appairage des Nodes](/fr/gateway/pairing) pour le cycle complet de demande et d’approbation. Si un Node réessaie avec des informations d’authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé ; les clients reçoivent un événement `device.pair.resolved` pour la demande remplacée, et vous devez réexécuter `openclaw devices list` avant de l’approuver.

- `nodes status` marque un Node comme **appairé** lorsque son rôle d’appairage d’appareil inclut `node`.
- Un Mac natif connecté disposant de l’autorisation d’accessibilité peut signaler une activité
  d’entrée physique regroupée. Le Gateway marque le Mac admissible dont l’activité est la plus récente comme
  `active`, fournit à l’agent une indication stable d’identifiant de Node et y achemine les
  alertes de connexion des Nodes avant un recours différé. Consultez
  [Présence de l’ordinateur actif](/fr/nodes/presence) pour la configuration, la confidentialité, la temporisation et
  le dépannage.
- L’enregistrement d’appairage d’appareil constitue le contrat durable des rôles approuvés. La rotation des tokens reste dans ce contrat ; elle ne peut pas attribuer à un Node appairé un rôle que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d’appairage des Nodes distinct, géré par le Gateway, qui suit la surface de commandes et de capacités approuvée du Node au fil des reconnexions. Il ne contrôle **pas** l’authentification du transport : c’est l’appairage d’appareils qui s’en charge.
- `openclaw nodes remove --node <id|name|ip>` supprime un appairage de Node. Pour un Node associé à un appareil, cette commande révoque le rôle `node` de l’appareil dans le magasin des appareils appairés et déconnecte les sessions de rôle Node de cet appareil : un appareil à rôles multiples conserve sa ligne et perd uniquement le rôle `node`, tandis que la ligne d’un appareil réservé aux Nodes est supprimée. Elle efface également toute entrée correspondante du magasin distinct d’appairage des Nodes. `operator.pairing` peut supprimer des lignes de Nodes non-opérateurs sur d’autres appareils ; un appelant utilisant un token d’appareil qui révoque son propre rôle Node sur un appareil à rôles multiples a également besoin de `operator.admin`.
- La portée d’approbation suit les commandes déclarées dans la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de Node sans exécution : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Décalage de version et ordre de mise à niveau

Le WebSocket du Gateway accepte les clients Node authentifiés dans une fenêtre de protocole N-1.
Le Gateway v4 actuel accepte donc les Nodes v3 lorsque la connexion déclare
à la fois `role: "node"` et `client.mode: "node"`. Les sessions d’opérateur et d’interface utilisateur doivent
toujours utiliser le protocole actuel.

Pour les mises à niveau progressives d’un parc, mettez d’abord à niveau le Gateway, puis chaque Node.
Un Node N-1 reste visible et administrable pendant sa mise à niveau ; le Gateway
journalise `legacy node protocol accepted` avec une recommandation de mise à niveau. L’appairage,
l’authentification des appareils, les listes d’autorisation de commandes et les approbations d’exécution restent applicables.
Les capacités et commandes détenues par les Plugins restent masquées jusqu’à ce que le Node passe au
protocole actuel. Les Nodes antérieurs à N-1 nécessitent une mise à niveau hors bande avant
de se reconnecter.

Le transport HTTPS direct de watchOS nécessite la version actuelle du protocole ; mettez à jour
l’application de la montre en même temps que le Gateway avant d’activer le mode direct.

## Hôte Node distant (system.run)

Utilisez un **hôte Node** lorsque votre Gateway s’exécute sur une machine et que vous souhaitez exécuter des commandes sur une autre. Le modèle communique toujours avec le **Gateway** ; le Gateway transmet les appels `exec` à l’**hôte Node** lorsque `host=node` est sélectionné.

| Rôle            | Responsabilité                                                         |
| --------------- | ---------------------------------------------------------------------- |
| Hôte du Gateway | Reçoit les messages, exécute le modèle et achemine les appels d’outils. |
| Hôte Node       | Exécute `system.run`/`system.which` sur la machine du Node.            |
| Approbations    | Appliquées sur l’hôte Node via `~/.openclaw/exec-approvals.json`.      |

Remarque concernant l’approbation :

- Les exécutions de Node soumises à approbation sont liées au contexte exact de la demande. Le chemin d’exécution prépare un `systemRunPlan` canonique avant l’approbation ; une fois celle-ci accordée, le Gateway transmet ce plan enregistré, et non d’éventuels champs de commande, de répertoire de travail ou de session modifiés ultérieurement par l’appelant, puis revalide le répertoire de travail avant l’exécution.
- Pour les exécutions directes de fichiers par un shell ou un runtime, OpenClaw lie également, dans la mesure du possible, un opérande de fichier local concret et refuse l’exécution si ce fichier change avant celle-ci.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur ou de runtime, l’exécution soumise à approbation est refusée au lieu de prétendre couvrir entièrement le runtime. Utilisez un bac à sable, des hôtes distincts ou une liste d’autorisation fiable explicite/un workflow complet pour une sémantique d’interpréteur plus étendue.

### Démarrer un hôte Node (premier plan)

Sur la machine du Node :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` accepte également `--context-path` (chemin de contexte WS du Gateway), `--tls`, `--tls-fingerprint <sha256>` et `--node-id` (remplace l’identifiant d’instance client hérité ; cela ne réinitialise pas l’appairage).

### Gateway distant via un tunnel SSH (liaison à l’interface de bouclage)

Si le Gateway est lié à l’interface de bouclage (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes Node distants ne peuvent pas se connecter directement. Créez un tunnel SSH et dirigez l’hôte Node vers l’extrémité locale du tunnel.

Exemple (hôte Node -> hôte du Gateway) :

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l’authentification par token ou mot de passe.
- Les variables d’environnement sont à privilégier : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuration de secours est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node ignore volontairement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont admissibles conformément aux règles de priorité à distance.
- Si des SecretRefs `gateway.auth.*` locales actives sont configurées mais non résolues, l’authentification de l’hôte Node échoue de manière fermée.
- La résolution de l’authentification de l’hôte Node ne prend en compte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte Node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` accepte également `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (identifiant d’instance client hérité uniquement), `--runtime <node|bun>` (valeur par défaut : node) et `--force` pour effectuer une réinstallation. `node status`, `node stop` et `node uninstall` sont également disponibles.

### Appairer et nommer

Sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le Node réessaie avec des informations d’authentification modifiées, réexécutez `openclaw devices list` et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` avec `openclaw node run` / `openclaw node install` (conservé dans `~/.openclaw/node.json` sur le Node, avec l’identifiant d’instance client et les métadonnées de connexion au Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté Gateway).

### Serveurs MCP hébergés par un Node

Configurez les serveurs MCP dans `openclaw.json` sur la machine du Node, et non sur le
Gateway :

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

L’hôte Node sans interface graphique démarre ces serveurs, répertorie leurs outils et publie
les descripteurs après la connexion. Les appels d’outils reviennent à ce Node via
`mcp.tools.call.v1` ; le Gateway n’a pas besoin d’une configuration MCP correspondante ni d’un
Plugin JS. Les serveurs MCP OAuth ne sont pas pris en charge par ce chemin v1 hébergé sur le Node.

Les hôtes Node actuels déclarent la famille de commandes intégrée `mcp.tools.call.v1` lors
de leur appairage initial, même si aucun serveur MCP n’est configuré. Un Node appairé avec une
ancienne version d’OpenClaw peut demander une mise à niveau ponctuelle de la surface de commandes après
la mise à jour de l’hôte Node. L’ajout, la suppression ou le filtrage de serveurs par la suite ne
nécessite pas de nouvel appairage, car la famille de commandes approuvée reste inchangée. Redémarrez
`openclaw node run` ou `openclaw node restart` pour appliquer les modifications de configuration MCP du Node ;
l’hôte Node ne surveille pas cette configuration.

Les opérateurs du Gateway peuvent ignorer tous les outils visibles par les agents et publiés par les Nodes appairés,
y compris les outils MCP hébergés par les Nodes, avec
`gateway.nodes.pluginTools.enabled: false`. Les interdictions de commandes exactes telles que
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` bloquent également l’exécution.

### Skills hébergés par un Node

Installez les Skills dans le répertoire de Skills OpenClaw actif de la machine du Node,
`~/.openclaw/skills` par défaut. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` et
`OPENCLAW_CONFIG_PATH` déplacent ce profil actif. `OPENCLAW_STATE_DIR` est
prioritaire pour les Skills ; sinon, `skills/` se trouve à côté du chemin affiché par
`openclaw config file`. L’hôte Node sans interface graphique publie les fichiers `SKILL.md` valides
après sa connexion, et le Gateway les ajoute aux instantanés des Skills de l’agent uniquement tant
que ce Node reste connecté. Le nom de chaque répertoire de Skill doit correspondre au champ de frontmatter `name`
afin que le localisateur abstrait du Node corresponde à une seule entrée sans ajouter
un autre champ de protocole.

L’appairage initial avec le rôle Node approuve la publication des Skills. L’ajout, la suppression ou
la modification des Skills ne nécessite aucun autre appairage ni changement de configuration du Gateway.
Redémarrez `openclaw node run` ou `openclaw node restart` après avoir modifié
les fichiers de Skills du Node ; l’hôte Node ne surveille pas le répertoire des Skills.

Les entrées de Skills hébergées sur un Node identifient leur Node et indiquent leur
emplacement d’exécution. Les fichiers de Skills, les chemins relatifs référencés et
les fichiers binaires restent sur ce Node. L’agent lit l’emplacement
`node://.../SKILL.md` annoncé avec l’outil `read` normal. `file_fetch` accepte les
chemins de Node absolus approuvés par l’opérateur, et non les localisateurs de
Skills du Node ; les environnements d’exécution ne disposant pas de l’outil de
lecture normal peuvent à la place exécuter `cat SKILL.md` via
`exec host=node node=<node-id>`, avec le répertoire
`node://.../skills/<name>` annoncé comme `workdir`. Les fichiers et fichiers
binaires référencés utilisent la même cible d’exécution et le même répertoire de
travail. L’hôte Node résout ce localisateur par rapport à son répertoire d’état
OpenClaw actif, de sorte que les chemins relatifs sont résolus sur le Node plutôt
que sur la machine du Gateway. Le Node de publication doit avoir approuvé
`system.run`, et la politique d’exécution de l’agent doit autoriser `host=node` ;
sinon, le Skill reste exclu de l’instantané de cet agent.

Définissez `nodeHost.skills.enabled: false` sur le Node pour arrêter la
publication. Les opérateurs du Gateway peuvent ignorer les Skills de tous les
Nodes appairés avec `gateway.nodes.skills.enabled: false`.

### État de l’identité sans interface graphique

Le Node sans interface graphique conserve trois fichiers d’état distincts :

- `~/.openclaw/node.json` : l’identifiant d’instance client hérité (stocké sous `nodeId`), le nom d’affichage et les métadonnées de connexion au Gateway.
- `~/.openclaw/identity/device.json` : la paire de clés signée de l’appareil et l’identifiant cryptographique dérivé de l’appareil.
- `~/.openclaw/identity/device-auth.json` : les jetons d’authentification des appareils appairés, indexés par identifiant cryptographique de l’appareil et par rôle.

Pour un Node signé, le Gateway utilise l’identifiant cryptographique de
l’appareil pour l’appairage et le routage du Node. L’identifiant d’instance
client n’est qu’une métadonnée de connexion. La modification de `--node-id` ou
la suppression du seul fichier `node.json` ne réinitialise donc pas l’appairage.
Consultez [État de l’identité et de l’appairage](/fr/cli/node#identity-and-pairing-state)
pour connaître la procédure prise en charge de révocation et de nouvel appairage,
ainsi que les notes de mise à niveau.

### Ajouter les commandes à la liste d’autorisation

Les approbations d’exécution sont propres à **chaque hôte Node**. Ajoutez des
entrées à la liste d’autorisation depuis le Gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations sont stockées sur l’hôte Node dans
`~/.openclaw/exec-approvals.json`.

### Diriger l’exécution vers le Node

Configurer les valeurs par défaut (configuration du Gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou pour chaque session :

```text
/exec host=node security=allowlist node=<id-or-name>
```

Une fois cette configuration définie, tout appel à `exec` avec `host=node` s’exécute sur l’hôte Node (sous réserve de la liste d’autorisation et des approbations du Node).

`host=auto` ne choisit pas implicitement le Node de lui-même, mais une demande explicite `host=node` pour un appel donné est autorisée depuis `auto`. Si vous souhaitez que l’exécution sur le Node soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Voir aussi :

- [CLI de l’hôte Node](/fr/cli/node)
- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)

### Inférence locale de modèles

Un Node de bureau ou de serveur peut exposer des modèles capables de converser depuis un serveur Ollama s’exécutant sur ce Node. Les agents utilisent l’outil `node_inference` du Plugin Ollama pour découvrir les modèles installés et exécuter à distance une invite délimitée ; le Gateway n’a pas besoin d’un accès réseau direct à Ollama. Consultez [Inférence Ollama locale au Node](/fr/providers/ollama#node-local-inference) pour la configuration, le filtrage des modèles et les commandes de vérification directe.

### Sessions et transcriptions Codex

Le plugin officiel `codex` peut exposer les sessions Codex non archivées sur un
hôte Node sans interface graphique ou un Node macOS natif. L’inscription au catalogue ne dépend plus
de `supervision.enabled` ; cette option contrôle les outils de supervision accessibles à l’agent.
Le plugin doit toujours être actif sur les deux ordinateurs, et le paramètre du Node reste
un consentement local : activer uniquement le Gateway ne permet pas de lire l’état Codex
d’un autre ordinateur.

Le Node annonce les commandes versionnées en lecture seule
`codex.appServer.threads.list.v1` et
`codex.appServer.thread.turns.list.v1`. Approuvez la mise à niveau de l’appairage du Node
lorsque ces commandes apparaissent pour la première fois. Le Gateway les invoque via la
politique normale des Nodes du plugin et isole les échecs par hôte.

Les lignes des Nodes appairés apparaissent sous la forme d’un groupe **Codex** dans la barre latérale
habituelle des sessions. La sélection d’une ligne ouvre le volet de discussion habituel et lit sa transcription
persistante au moyen d’appels
`thread/turns/list` limités et paginés par curseur, avec projection complète des éléments. Le transport d’invocation du Node fonctionne uniquement en requête/réponse et ne peut pas
acheminer les tours diffusés en continu, les événements en direct ou les approbations nécessaires pour poursuivre un
thread natif via le harnais Codex. **Continuer** et **Archiver** ne sont
donc pas disponibles pour les lignes distantes. Sur l’ordinateur du Gateway, les lignes stockées et inactives
peuvent démarrer une branche de discussion distincte verrouillée sur un modèle. Chacune ne peut être archivée
qu’après confirmation par l’opérateur qu’aucun autre client Codex ne l’utilise ; l’activité en direct
d’une ligne stockée reste inconnue. Les lignes actives ne peuvent ni créer de branche ni être archivées.

Consultez [Superviser les sessions Codex](/fr/plugins/codex-supervision) pour la configuration,
la pagination, la poursuite locale et la limite de sécurité des métadonnées.

### Sessions et transcriptions Claude

Le plugin `anthropic` intégré détecte les sessions Claude CLI et Claude
Desktop non archivées sur le Gateway et les Nodes appairés. Contrairement à la supervision Codex,
aucune activation distincte n’est nécessaire : un Node distant de l’application macOS annonce
`anthropic.claude.sessions.list.v1` et `anthropic.claude.sessions.read.v1`
lorsque le plugin Anthropic est activé et que `~/.claude/projects/` existe. Approuvez
la mise à niveau de l’appairage du Node lorsque ces commandes apparaissent pour la première fois.

Le catalogue combine les enregistrements valides de l’index des projets Claude CLI avec un préfixe
de métadonnées limité provenant des fichiers JSONL `sdk-cli` actuels. Les métadonnées locales de Claude Desktop
fournissent les titres Desktop et l’état d’archivage. Les métadonnées Desktop prévalent lorsque
les deux sources font référence au même identifiant de session Claude Code ; les transcriptions
exclusives à la CLI restent visibles, car la CLI ne possède aucun indicateur d’archivage. La lecture des transcriptions utilise des curseurs opaques
de décalage en octets et des lectures de fichier rétrogrades limitées ; ainsi, sélectionner une grande
session ou charger une page plus ancienne ne lit pas l’intégralité de l’historique JSONL dans une seule
réponse du Gateway.

Les deux commandes du Node sont en lecture seule. Elles exposent les métadonnées du catalogue et le contenu
des transcriptions uniquement via les méthodes génériques `sessions.catalog.list` et
`sessions.catalog.read`, à une connexion d’opérateur authentifiée disposant de
`operator.write`. Les lignes des Nodes appairés restent en consultation seule. Une ligne Claude CLI
locale au Gateway peut être adoptée depuis le compositeur de discussion habituel : OpenClaw importe un historique
visible limité, reprend avec `--fork-session` au premier tour et laisse la
transcription source intacte. Les lignes Claude Desktop restent en consultation seule.

Consultez [Anthropic : sessions Claude sur plusieurs ordinateurs](/fr/providers/anthropic#claude-sessions-across-computers)
pour le comportement de l’interface de contrôle et les sources de stockage.

## Invocation de commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloque `system.run` et `system.run.prepare` ; ces commandes s’exécutent uniquement via l’outil `exec` avec `host=node` (voir ci-dessus). Des assistants de plus haut niveau existent pour les workflows courants « fournir à l’agent une pièce jointe MEDIA » (canevas, caméra, écran, localisation, ci-dessous).

## Politique des commandes

Les commandes du Node doivent franchir deux contrôles avant de pouvoir être invoquées :

1. Le Node doit déclarer la commande dans ses métadonnées de connexion authentifiées (`connect.commands`).
2. La liste d’autorisation du Gateway, dérivée de la plateforme et des approbations, doit inclure la commande déclarée.

Listes d’autorisation par défaut selon la plateforme (avant les valeurs par défaut du plugin et les remplacements `allowCommands`/`denyCommands`) :

| Plateforme | Commandes autorisées par défaut                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (les commandes de l’hôte Node telles que `system.run` sont soumises à approbation, voir ci-dessous)                                                                                                                                                                                                                                  |

Ces lignes décrivent la limite supérieure de la politique du Gateway, et non les commandes implémentées par chaque application de Node. Une commande n’est utilisable que lorsque le Node connecté la déclare également. En particulier, l’application macOS actuelle ne déclare pas les familles relatives à l’appareil et aux données personnelles répertoriées dans la ligne de politique macOS.

Les commandes `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) constituent une valeur par défaut du plugin sur iOS, Android, macOS, Windows et les plateformes inconnues (mais pas Linux) ; elles sont toutes limitées au premier plan sur iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` sont autorisées par défaut pour tout Node qui annonce la capacité `talk` ou déclare des commandes `talk.*`, indépendamment de l’étiquette de plateforme.

Les commandes de l’hôte de bureau (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` et `screen.snapshot` sur macOS/Windows) ne font pas partie du tableau statique des valeurs par défaut par plateforme ci-dessus. Elles deviennent disponibles lorsque l’opérateur approuve une demande d’appairage qui les déclare ; l’ensemble de commandes approuvé du Node les conserve ensuite lors des reconnexions.

Les commandes dangereuses ou fortement liées à la confidentialité nécessitent toujours une activation explicite avec `gateway.nodes.allowCommands`, même si un Node les déclare : `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` prévaut toujours sur les valeurs par défaut et les entrées supplémentaires de la liste d’autorisation. Consultez [Utilisation de l’ordinateur](/fr/nodes/computer-use) pour les contrôles supplémentaires liés à macOS, à la politique des outils et à l’armement des entrées de bureau.

Les commandes de Node appartenant à un Plugin peuvent ajouter une politique d’invocation de Node au Gateway. Cette politique s’exécute après la vérification de la liste d’autorisation et avant le transfert vers le Node, de sorte que `node.invoke`, les assistants CLI et les outils d’agent dédiés partagent la même limite d’autorisation du Plugin. Les commandes de Node dangereuses d’un Plugin nécessitent toujours une activation explicite dans `gateway.nodes.allowCommands`.

Lorsqu’un Node modifie sa liste de commandes déclarée, rejetez l’ancien appairage de l’appareil et approuvez la nouvelle demande afin que le Gateway stocke l’instantané mis à jour des commandes.

## Configuration (`openclaw.json`)

Les paramètres liés aux Nodes se trouvent sous `gateway.nodes` et `tools.exec` :

```json5
{
  gateway: {
    nodes: {
      // Approuver automatiquement le premier appairage d’un Node depuis des réseaux de confiance (liste CIDR).
      // Désactivé si non défini. S’applique uniquement aux premières demandes role:node
      // sans portée demandée ; n’approuve pas automatiquement les mises à niveau.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Approbation automatique vérifiée par SSH (par défaut : activée). Approuve le premier
        // appairage du Node si la clé d’appareil relue via SSH correspond exactement.
        sshVerify: true,
      },
      // Faire confiance aux outils de Plugin visibles par l’agent publiés par les Nodes appairés (par défaut : true).
      pluginTools: {
        enabled: true,
      },
      // Activer les commandes de Node dangereuses ou fortement intrusives pour la vie privée (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloquer les noms de commandes exacts même si les valeurs par défaut ou allowCommands les incluent.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Hôte exec par défaut : "node" achemine tous les appels exec vers un Node appairé.
      host: "node",
      // Mode de sécurité pour l’exécution sur un Node : autoriser uniquement les commandes approuvées ou figurant sur la liste d’autorisation.
      security: "allowlist",
      // Associer exec à un Node précis (identifiant ou nom). Omettre pour autoriser n’importe quel Node.
      node: "build-node",
    },
  },
}
```

Utilisez les noms exacts des commandes de Node. `denyCommands` supprime une commande même lorsqu’une valeur par défaut de la plateforme ou une entrée de `allowCommands` l’autoriserait autrement. Les Nodes appairés peuvent publier par défaut des descripteurs d’outils de Plugin visibles par l’agent, mais la commande de chaque descripteur doit toujours faire partie de la surface de commandes approuvée du Node. Définissez `gateway.nodes.pluginTools.enabled: false` pour ignorer tous ces descripteurs. Consultez la [référence de configuration du Gateway](/fr/gateway/configuration-reference#gateway) pour plus de détails sur les champs d’appairage des Nodes et de politique de commandes du Gateway.

Remplacement du Node d’exécution par agent :

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

## Captures d’écran (instantanés du canevas)

Si le Node affiche le canevas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Assistant CLI (écrit dans un fichier temporaire et affiche le chemin enregistré) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Commandes du canevas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Remarques :

- `canvas present` accepte des URL ou des chemins de fichiers locaux (`--target`), ainsi que les options facultatives `--x/--y/--width/--height` pour le positionnement.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (canevas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Bonjour"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Remarques :

- Les Nodes mobiles utilisent une page A2UI intégrée appartenant à l’application pour un rendu prenant en charge les actions.
- Seul le JSONL A2UI v0.8 est pris en charge (v0.9/createSurface est rejeté).
- iOS et Android affichent les pages de canevas distantes du Gateway, mais les actions des boutons A2UI ne sont distribuées que depuis la page A2UI intégrée appartenant à l’application. Les pages A2UI HTTP/HTTPS hébergées par le Gateway sont uniquement destinées au rendu sur ces clients mobiles.
- macOS peut distribuer des actions depuis la page A2UI exacte du Gateway, limitée par les capacités et sélectionnée par l’application. Les autres pages HTTP/HTTPS restent uniquement destinées au rendu.

## Photos et vidéos (caméra du Node)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # par défaut : les deux objectifs (2 lignes MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clips vidéo (`mp4`) :

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Remarques :

- Le Node doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- Les Nodes limitent la durée des clips afin que la charge utile base64 reste gérable (consultez [Capture avec la caméra](/fr/nodes/camera) pour connaître les limites exactes de chaque plateforme). L’outil d’agent `nodes` limite également la valeur `durationMs` demandée à 300000 (5 minutes) avant de transférer l’appel ; le Node lui-même applique la limite la plus stricte.
- Android demande les autorisations `CAMERA`/`RECORD_AUDIO` lorsque cela est possible ; si elles sont refusées, l’opération échoue avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (Nodes)

Les Nodes compatibles exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Remarques :

- La disponibilité de `screen.record` dépend de la plateforme du Node.
- L’outil d’agent `nodes` limite la valeur `durationMs` demandée à 300000 (5 minutes) ; le Node peut appliquer une limite plus stricte pour restreindre la charge utile renvoyée.
- `--no-audio` désactive la capture du microphone sur les plateformes compatibles.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs sont disponibles (0 = principal).

## Localisation (Nodes)

Les Nodes exposent `location.get` lorsque la localisation est activée dans les paramètres.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Remarques :

- La localisation est **désactivée par défaut**.
- « Always » nécessite une autorisation système ; la récupération en arrière-plan est effectuée au mieux.
- La réponse comprend la latitude/longitude, la précision (en mètres) et l’horodatage.
- Structure complète des paramètres et de la réponse, ainsi que les codes d’erreur : [Commande de localisation](/fr/nodes/location-command).

## SMS (Nodes Android)

Les Nodes Android peuvent exposer `sms.send` et `sms.search` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie. Les deux commandes sont dangereuses par défaut : l’opérateur du Gateway doit également les ajouter à `gateway.nodes.allowCommands` avant qu’elles puissent être invoquées (consultez [Politique de commandes](#command-policy)).

Pour la recherche de SMS en lecture seule, activez-la explicitement dans `openclaw.json` :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Ajoutez `sms.send` séparément uniquement si le Node doit également pouvoir envoyer des messages. L’autorisation Android et l’autorisation de commande du Gateway sont indépendantes ; accorder l’autorisation sur le téléphone ne modifie pas la politique du Gateway.

Invocation de bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Bonjour depuis OpenClaw"}'
```

Remarques :

- `sms.search` peut être déclaré avant que `READ_SMS` soit accordé afin qu’une invocation puisse renvoyer un diagnostic d’autorisation ; la lecture des messages nécessite toujours cette autorisation Android.
- Les appareils uniquement Wi-Fi dépourvus de téléphonie n’annoncent pas `sms.send`.
- Une erreur `requires explicit gateway.nodes.allowCommands opt-in` signifie que le téléphone a déclaré la commande, mais que l’opérateur du Gateway ne l’a pas autorisée.

## Commandes relatives à l’appareil et aux données personnelles

Les Nodes iOS et Android annoncent par défaut plusieurs commandes de données en lecture seule (consultez le tableau [Politique de commandes](#command-policy)) ; Android expose en outre une famille plus étendue régie par ses propres paramètres intégrés à l’application.

Familles disponibles :

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — Android uniquement ; `device.apps` nécessite l’activation du partage des applications installées dans Android Settings et renvoie par défaut les applications visibles dans le lanceur.
- `notifications.list`, `notifications.actions` — Android uniquement.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (lecture seule par défaut) ; `contacts.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (lecture seule par défaut) ; `calendar.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (lecture seule par défaut) ; `reminders.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `callLog.search` — Android uniquement.
- `motion.activity`, `motion.pedometer` — iOS, Android ; soumis aux capacités des capteurs disponibles.

Exemples d’invocation :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Commandes système (hôte du Node / Node Mac)

Le Node macOS expose `system.run`, `system.which`, `system.notify` et `system.execApprovals.get/set`. L’hôte de Node sans interface expose `system.run.prepare`, `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway prêt"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Remarques :

- `system.run` renvoie stdout/stderr/le code de sortie dans la charge utile.
- L’exécution du shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste l’interface RPC directe pour les commandes Node explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent disponibles uniquement sur le chemin d’exécution.
- Le chemin d’exécution prépare un `systemRunPlan` canonique avant l’approbation. Une fois l’approbation accordée, le Gateway transmet ce plan enregistré, et non les champs de commande/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état des autorisations de notification dans l’application macOS ; prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les métadonnées Node `platform` / `deviceFamily` non reconnues utilisent par défaut une liste d’autorisation prudente qui exclut `system.run` et `system.which`. Si vous avez délibérément besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes de shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes de répartition connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes plutôt que ceux des enveloppes. Si le désenveloppement ne peut pas être effectué en toute sécurité, aucune entrée de liste d’autorisation n’est conservée automatiquement.
- Sur les hôtes Node Windows en mode liste d’autorisation, les exécutions via une enveloppe de shell utilisant `cmd.exe /c` nécessitent une approbation (une entrée dans la liste d’autorisation ne suffit pas à autoriser automatiquement la forme avec enveloppe).
- Les hôtes Node ignorent les substitutions de `PATH` dans `--env` et suppriment un vaste ensemble maintenu de variables de démarrage d’interpréteur/de shell (par exemple `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) avant d’exécuter une commande. Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service de l’hôte Node (ou installez les outils dans des emplacements standard) au lieu de transmettre `PATH` via `--env`.
- En mode Node sur macOS, `system.run` est soumis aux approbations d’exécution dans l’application macOS (Settings → Exec approvals). Les modes demande/liste d’autorisation/complet se comportent comme sur l’hôte Node sans interface ; les demandes refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte Node sans interface, `system.run` est soumis aux approbations d’exécution (`~/.openclaw/exec-approvals.json`) ; sur macOS en particulier, consultez les variables d’environnement de routage de l’hôte d’exécution sous [Hôte Node sans interface](#headless-node-host-cross-platform) ci-dessous.

## Liaison du nœud d’exécution

Lorsque plusieurs Node sont disponibles, vous pouvez lier l’exécution à un Node spécifique. Cela définit le Node par défaut pour `exec host=node` (et peut être remplacé pour chaque agent).

Valeur globale par défaut :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Supprimez le paramètre pour autoriser n’importe quel Node :

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Carte des autorisations

Les Nodes peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par exemple `screenRecording`, `accessibility`, `location`) avec des valeurs booléennes (`true` = accordée).

## Hôte de Node sans interface (multiplateforme)

OpenClaw peut exécuter un **hôte de Node sans interface** (sans interface utilisateur) qui se connecte au WebSocket du Gateway et expose `system.run` / `system.which`. Cela est utile sous Linux/Windows ou pour exécuter un Node minimal parallèlement à un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- L’appairage reste obligatoire (le Gateway affichera une invite d’appairage d’appareil).
- Les métadonnées de l’instance cliente, l’identité signée de l’appareil et l’authentification d’appairage utilisent des fichiers distincts ; consultez [État de l’identité sans interface](#headless-identity-state).
- Les approbations d’exécution sont appliquées localement via `~/.openclaw/exec-approvals.json` (consultez [Approbations d’exécution](/fr/tools/exec-approvals)).
- Sous macOS, l’hôte de Node sans interface exécute `system.run` localement par défaut. Définissez `OPENCLAW_NODE_EXEC_HOST=app` pour acheminer `system.run` via l’hôte d’exécution de l’application compagnon ; ajoutez `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte de l’application et appliquer un échec sécurisé s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WebSocket du Gateway utilise TLS.

## Mode Node sur Mac

- L’application de barre des menus macOS se connecte au serveur WebSocket du Gateway en tant que Node (ainsi, `openclaw nodes …` fonctionne avec ce Mac).
- En mode distant, l’application ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
