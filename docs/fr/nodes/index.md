---
read_when:
    - Association de nœuds iOS/watchOS/Android à un Gateway
    - Utilisation du canevas/de la caméra du Node pour le contexte de l’agent
    - Ajout de nouvelles commandes de Node ou de fonctions d’assistance pour la CLI
summary: 'Nodes : appairage, capacités, autorisations et utilitaires CLI pour canvas/caméra/écran/appareil/notifications/système'
title: Nœuds
x-i18n:
    generated_at: "2026-07-12T15:35:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

Un **nœud** est un appareil compagnon (macOS/iOS/watchOS/Android/sans interface graphique) qui se connecte au Gateway avec `role: "node"` et expose une surface de commandes (par exemple `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. La plupart des nœuds utilisent le WebSocket du Gateway sur le port de l’opérateur. Le nœud Apple Watch direct facultatif utilise une interrogation HTTPS signée sur ce même port, car watchOS bloque la mise en réseau générique de bas niveau pour les applications ordinaires. Détails du protocole : [Protocole du Gateway](/fr/gateway/protocol).

Transport hérité : [Protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ; uniquement historique pour les nœuds actuels).

macOS peut également fonctionner en **mode nœud** : l’application de la barre des menus se connecte au serveur WS du Gateway et expose ses commandes locales de canevas et de caméra en tant que nœud (ainsi, `openclaw nodes …` fonctionne avec ce Mac). En mode Gateway distant, l’automatisation du navigateur est gérée par l’hôte de nœud CLI (`openclaw node run` ou le service de nœud installé), et non par le nœud de l’application native.

Les nœuds sont des **périphériques**, pas des gateways : ils n’exécutent pas le service Gateway, et les messages des canaux (Telegram, WhatsApp, etc.) arrivent sur le Gateway, pas sur les nœuds.

Guide de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage et état

Les nœuds utilisent l’**appairage d’appareils**. Un nœud présente une identité d’appareil signée lors de la connexion ; le Gateway crée une demande d’appairage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’interface utilisateur). La configuration Apple Watch directe utilise un code de configuration à courte durée de vie, réservé aux nœuds et généré par un administrateur, afin d’approuver sa surface de commandes fixe à faible risque ; toute extension ultérieure des capacités nécessite toujours une approbation normale.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Les demandes d’appairage en attente expirent 5 minutes après la dernière nouvelle tentative de l’appareil — un appareil qui continue à se reconnecter maintient sa demande en attente unique (et son `requestId`) active au lieu de générer une nouvelle invite toutes les quelques minutes ; consultez [Appairage des nœuds](/fr/gateway/pairing) pour connaître le cycle de vie complet de demande et d’approbation. Si un nœud réessaie avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé — les clients reçoivent un événement `device.pair.resolved` pour la demande remplacée, et vous devez réexécuter `openclaw devices list` avant de l’approuver.

- `nodes status` marque un nœud comme **appairé** lorsque son rôle d’appairage d’appareil inclut `node`.
- Un Mac natif connecté disposant de l’autorisation d’accessibilité peut signaler une activité
  d’entrée physique regroupée. Le Gateway marque le Mac éligible le plus récent comme
  `active`, fournit à l’agent une indication stable d’identifiant de nœud et y achemine les alertes
  de connexion des nœuds avant un repli différé. Consultez
  [Présence de l’ordinateur actif](/fr/nodes/presence) pour la configuration, la confidentialité, les délais et
  le dépannage.
- L’enregistrement d’appairage de l’appareil constitue le contrat durable des rôles approuvés. La rotation des jetons reste dans les limites de ce contrat ; elle ne peut pas conférer à un nœud appairé un rôle que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d’appairage de nœuds distinct, géré par le Gateway, qui suit la surface de commandes et de capacités approuvée du nœud entre les reconnexions. Il ne contrôle **pas** l’authentification du transport — c’est l’appairage de l’appareil qui s’en charge.
- `openclaw nodes remove --node <id|name|ip>` supprime un appairage de nœud. Pour un nœud associé à un appareil, cette commande révoque le rôle `node` de l’appareil dans le magasin des appareils appairés et déconnecte les sessions de cet appareil ayant le rôle de nœud : un appareil à rôles multiples conserve sa ligne et perd uniquement le rôle `node`, tandis que la ligne d’un appareil réservé aux nœuds est supprimée. Elle efface également toute entrée correspondante du magasin d’appairage de nœuds distinct. `operator.pairing` peut supprimer les lignes de nœuds non-opérateurs sur d’autres appareils ; un appelant utilisant un jeton d’appareil qui révoque son propre rôle de nœud sur un appareil à rôles multiples a en outre besoin de `operator.admin`.
- La portée d’approbation suit les commandes déclarées dans la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de nœud sans exécution : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Décalage de versions et ordre de mise à niveau

Le WebSocket du Gateway accepte les clients de nœud authentifiés dans une fenêtre de protocole N-1.
Le Gateway v4 actuel accepte donc les nœuds v3 lorsque la connexion déclare
à la fois `role: "node"` et `client.mode: "node"`. Les sessions opérateur et d’interface utilisateur doivent
toujours utiliser le protocole actuel.

Pour les mises à niveau progressives d’un parc, mettez d’abord à niveau le Gateway, puis chaque nœud.
Un nœud N-1 reste visible et administrable pendant sa mise à niveau ; le Gateway
journalise `legacy node protocol accepted` avec une recommandation de mise à niveau. L’appairage,
l’authentification des appareils, les listes d’autorisation de commandes et les approbations d’exécution continuent de s’appliquer.
Les capacités et commandes appartenant à des Plugins restent masquées jusqu’à ce que le nœud soit mis à niveau vers
le protocole actuel. Les nœuds antérieurs à N-1 nécessitent une mise à niveau hors bande avant
de se reconnecter.

Le transport HTTPS direct de watchOS nécessite la version actuelle du protocole ; mettez à jour
l’application de la montre avec le Gateway avant d’activer le mode direct.

## Hôte de nœud distant (system.run)

Utilisez un **hôte de nœud** lorsque votre Gateway s’exécute sur une machine et que vous souhaitez exécuter des commandes sur une autre. Le modèle communique toujours avec le **Gateway** ; le Gateway transmet les appels `exec` à l’**hôte de nœud** lorsque `host=node` est sélectionné.

| Rôle               | Responsabilité                                                                   |
| ------------------ | -------------------------------------------------------------------------------- |
| Hôte du Gateway    | Reçoit les messages, exécute le modèle et achemine les appels d’outils.           |
| Hôte de nœud       | Exécute `system.run`/`system.which` sur la machine du nœud.                       |
| Approbations       | Appliquées sur l’hôte de nœud via `~/.openclaw/exec-approvals.json`.              |

Remarque sur les approbations :

- Les exécutions de nœud soumises à approbation sont liées au contexte exact de la demande. Le chemin d’exécution prépare un `systemRunPlan` canonique avant l’approbation ; une fois celle-ci accordée, le Gateway transmet ce plan enregistré, et non les champs de commande, de répertoire de travail ou de session modifiés ultérieurement par l’appelant, puis valide à nouveau le répertoire de travail avant l’exécution.
- Pour les exécutions directes de fichiers par un shell ou un environnement d’exécution, OpenClaw lie également, dans la mesure du possible, un opérande de fichier local concret et refuse l’exécution si ce fichier change avant celle-ci.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur ou d’environnement d’exécution, l’exécution soumise à approbation est refusée au lieu de prétendre couvrir intégralement l’environnement d’exécution. Utilisez un bac à sable, des hôtes distincts ou une liste d’autorisation fiable explicite/un workflow complet pour une sémantique d’interpréteur plus étendue.

### Démarrer un hôte de nœud (premier plan)

Sur la machine du nœud :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` accepte également `--context-path` (chemin de contexte WS du Gateway), `--tls`, `--tls-fingerprint <sha256>` et `--node-id` (remplace l’identifiant d’instance du client hérité ; cela ne réinitialise pas l’appairage).

### Gateway distant via un tunnel SSH (liaison de bouclage)

Si le Gateway est lié à l’interface de bouclage (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes de nœud distants ne peuvent pas s’y connecter directement. Créez un tunnel SSH et dirigez l’hôte de nœud vers l’extrémité locale du tunnel.

Exemple (hôte de nœud -> hôte du Gateway) :

```bash
# Terminal A (laisser en cours d’exécution) : transférer le port local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B : exporter le jeton du gateway et se connecter via le tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l’authentification par jeton ou mot de passe.
- Les variables d’environnement sont privilégiées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuration de repli est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte de nœud ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont admissibles selon les règles de priorité distante.
- Si des SecretRefs locales actives `gateway.auth.*` sont configurées mais non résolues, l’authentification de l’hôte de nœud échoue de manière fermée.
- La résolution de l’authentification de l’hôte de nœud ne prend en compte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte de nœud (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` accepte également `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (identifiant d’instance du client hérité uniquement), `--runtime <node|bun>` (valeur par défaut : node) et `--force` pour réinstaller. `node status`, `node stop` et `node uninstall` sont également disponibles.

### Appairer et nommer

Sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le nœud réessaie avec des détails d’authentification modifiés, réexécutez `openclaw devices list` et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` avec `openclaw node run` / `openclaw node install` (conservé dans `~/.openclaw/node.json` sur le nœud, avec l’identifiant d’instance du client et les métadonnées de connexion au Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté Gateway).

### Serveurs MCP hébergés par un nœud

Configurez les serveurs MCP dans `openclaw.json` sur la machine du nœud, et non sur le
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

L’hôte de nœud sans interface graphique démarre ces serveurs, répertorie leurs outils et publie
les descripteurs après la connexion. Les appels d’outils reviennent à ce nœud via
`mcp.tools.call.v1` ; le Gateway n’a pas besoin d’une configuration MCP correspondante ni d’un
Plugin JS. Les serveurs MCP OAuth ne sont pas pris en charge par ce chemin v1 hébergé par le nœud.

Les hôtes de nœud actuels déclarent la famille de commandes intégrée `mcp.tools.call.v1` lors de
leur appairage initial, même lorsqu’aucun serveur MCP n’est configuré. Un nœud appairé avec une
ancienne version d’OpenClaw peut demander une mise à niveau ponctuelle de la surface de commandes après la
mise à jour de l’hôte de nœud. L’ajout, la suppression ou le filtrage de serveurs par la suite ne
nécessite pas de nouvel appairage, car la famille de commandes approuvée reste inchangée. Redémarrez
`openclaw node run` ou `openclaw node restart` pour appliquer les modifications de la configuration MCP du nœud ;
l’hôte de nœud ne surveille pas cette configuration.

Les opérateurs du Gateway peuvent ignorer tous les outils visibles par l’agent publiés par les nœuds appairés,
y compris les outils MCP hébergés par un nœud, avec
`gateway.nodes.pluginTools.enabled: false`. Les refus de commandes exactes tels que
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` bloquent également l’exécution.

### Skills hébergées par un nœud

Installez les Skills dans le répertoire actif des Skills d’OpenClaw sur la machine du nœud,
`~/.openclaw/skills` par défaut. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` et
`OPENCLAW_CONFIG_PATH` déplacent ce profil actif. `OPENCLAW_STATE_DIR` est
prioritaire pour les Skills ; sinon, `skills/` se trouve à côté du chemin affiché par
`openclaw config file`. L’hôte de nœud sans interface graphique publie les fichiers `SKILL.md` valides
après sa connexion, et le Gateway les ajoute aux instantanés de Skills de l’agent uniquement tant que
ce nœud reste connecté. Le nom de chaque répertoire de Skill doit correspondre au champ de frontmatter `name`
afin que le localisateur abstrait du nœud corresponde à une seule entrée sans ajouter
un autre champ de protocole.

L’appairage initial avec le rôle de nœud approuve la publication des Skills. L’ajout, la suppression ou
la modification des Skills ne nécessite pas de nouvel appairage ni de modification de la configuration du Gateway.
Redémarrez `openclaw node run` ou `openclaw node restart` après avoir modifié
les fichiers de Skills du nœud ; l’hôte de nœud ne surveille pas le répertoire des Skills.

Les entrées de Skills hébergées sur un Node identifient leur Node et indiquent leur
emplacement d’exécution. Les fichiers de Skills, les chemins relatifs référencés
et les binaires restent sur ce Node. L’agent lit l’emplacement
`node://.../SKILL.md` annoncé avec l’outil `read` normal. `file_fetch` accepte
les chemins absolus du Node approuvés par l’opérateur, et non les localisateurs
de Skills du Node ; les environnements d’exécution dépourvus de l’outil de
lecture normal peuvent à la place exécuter `cat SKILL.md` via
`exec host=node node=<node-id>`, avec le répertoire
`node://.../skills/<name>` annoncé comme `workdir`. Les fichiers et binaires
référencés utilisent la même cible d’exécution et le même répertoire de travail.
L’hôte du Node résout ce localisateur par rapport à son répertoire d’état
OpenClaw actif ; les chemins relatifs sont donc résolus sur le Node plutôt que
sur la machine du Gateway. Le Node de publication doit avoir approuvé
`system.run`, et la politique d’exécution de l’agent doit autoriser
`host=node` ; sinon, le Skill reste exclu de l’instantané de cet agent.

Définissez `nodeHost.skills.enabled: false` sur le Node pour arrêter la
publication. Les opérateurs du Gateway peuvent ignorer les Skills de tous les
Nodes associés avec `gateway.nodes.skills.enabled: false`.

### État de l’identité sans interface graphique

Le Node sans interface graphique conserve trois fichiers d’état distincts :

- `~/.openclaw/node.json` : l’identifiant hérité de l’instance cliente (stocké sous `nodeId`), le nom d’affichage et les métadonnées de connexion au Gateway.
- `~/.openclaw/identity/device.json` : la paire de clés signée de l’appareil et l’identifiant cryptographique dérivé de l’appareil.
- `~/.openclaw/identity/device-auth.json` : les jetons d’authentification des appareils associés, indexés par identifiant cryptographique d’appareil et par rôle.

Pour un Node signé, le Gateway utilise l’identifiant cryptographique de
l’appareil pour l’association et le routage du Node. L’identifiant de l’instance
cliente n’est qu’une métadonnée de connexion. Modifier `--node-id` ou supprimer
uniquement `node.json` ne réinitialise donc pas l’association. Consultez
[État de l’identité et de l’association](/fr/cli/node#identity-and-pairing-state)
pour connaître la procédure prise en charge de révocation et de nouvelle
association, ainsi que les notes de mise à niveau.

### Ajouter les commandes à la liste d’autorisation

Les approbations d’exécution sont **propres à chaque hôte de Node**. Ajoutez les
entrées à la liste d’autorisation depuis le Gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations sont stockées sur l’hôte du Node dans
`~/.openclaw/exec-approvals.json`.

### Cibler le Node avec exec

Configurez les valeurs par défaut (configuration du Gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou pour chaque session :

```text
/exec host=node security=allowlist node=<id-or-name>
```

Une fois cette configuration effectuée, tout appel à `exec` avec `host=node`
s’exécute sur l’hôte du Node (sous réserve de la liste d’autorisation et des
approbations du Node).

`host=auto` ne sélectionne pas implicitement le Node de lui-même, mais une
demande explicite `host=node` par appel est autorisée depuis `auto`. Si vous
souhaitez que l’exécution sur le Node soit la valeur par défaut de la session,
définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Voir aussi :

- [CLI de l’hôte du Node](/fr/cli/node)
- [Outil Exec](/fr/tools/exec)
- [Approbations d’exécution](/fr/tools/exec-approvals)

### Inférence locale de modèles

Un Node de bureau ou de serveur peut exposer des modèles compatibles avec le
chat depuis un serveur Ollama exécuté sur ce Node. Les agents utilisent l’outil
`node_inference` du Plugin Ollama pour découvrir les modèles installés et
exécuter à distance une invite de taille limitée ; le Gateway n’a pas besoin
d’un accès réseau direct à Ollama. Consultez
[Inférence Ollama locale au Node](/fr/providers/ollama#node-local-inference) pour
la configuration, le filtrage des modèles et les commandes de vérification
directe.

### Sessions et transcriptions Codex

Le Plugin officiel `codex` peut exposer les sessions Codex non archivées sur un
hôte de Node sans interface graphique ou un Node macOS natif. L’enregistrement
du catalogue ne dépend plus de `supervision.enabled` ; cette option contrôle les
outils de supervision accessibles à l’agent. Le Plugin doit néanmoins rester
actif sur les deux ordinateurs, et le paramètre du Node reste un consentement
local : l’activation sur le seul Gateway ne permet pas de lire l’état Codex
d’un autre ordinateur.

Le Node annonce les commandes versionnées en lecture seule
`codex.appServer.threads.list.v1` et
`codex.appServer.thread.turns.list.v1`. Approuvez la mise à niveau de
l’association du Node lorsque ces commandes apparaissent pour la première fois.
Le Gateway les invoque via la politique de Node normale du Plugin et isole les
échecs par hôte.

Les lignes des Nodes associés apparaissent dans un groupe **Codex** dans la barre
latérale normale des sessions. La sélection d’une ligne ouvre le volet Chat
normal et lit sa transcription persistante au moyen d’appels
`thread/turns/list` limités et paginés par curseur, avec une projection complète
des éléments. Le transport d’invocation du Node fonctionne uniquement en
requête/réponse et ne peut pas transporter les tours en streaming, les
événements en direct ni les approbations nécessaires pour poursuivre un fil
natif via le harnais Codex. **Continuer** et **Archiver** ne sont donc pas
disponibles pour les lignes distantes. Sur l’ordinateur du Gateway, les lignes
stockées et inactives peuvent démarrer une branche Chat distincte verrouillée
sur le modèle. L’une ou l’autre ne peut être archivée qu’après confirmation par
l’opérateur qu’aucun autre client Codex ne l’utilise ; l’activité en direct
d’une ligne stockée reste inconnue. Les lignes actives ne peuvent être ni
ramifiées ni archivées.

Consultez [Superviser les sessions Codex](/plugins/codex-supervision) pour la
configuration, la pagination, la poursuite locale et la limite de sécurité des
métadonnées.

### Sessions et transcriptions Claude

Le Plugin `anthropic` fourni découvre les sessions Claude CLI et Claude Desktop
non archivées sur le Gateway et les Nodes associés. Contrairement à la
supervision Codex, cela ne nécessite aucune activation distincte : un Node
d’application macOS distant annonce `anthropic.claude.sessions.list.v1` et
`anthropic.claude.sessions.read.v1` lorsque le Plugin Anthropic est activé et
que `~/.claude/projects/` existe. Approuvez la mise à niveau de l’association du
Node lorsque ces commandes apparaissent pour la première fois.

Le catalogue combine les enregistrements valides de l’index des projets Claude
CLI avec un préfixe de métadonnées limité provenant des fichiers JSONL `sdk-cli`
actuels. Les métadonnées locales de Claude Desktop fournissent les titres
Desktop et l’état d’archivage. Les métadonnées Desktop prévalent lorsque les
deux sources font référence au même identifiant de session Claude Code ; les
transcriptions présentes uniquement dans la CLI restent visibles, car la CLI
ne possède aucun indicateur d’archivage. La lecture des transcriptions utilise
des curseurs opaques de décalage en octets et des lectures de fichiers
rétrogrades limitées ; ainsi, la sélection d’une session volumineuse ou le
chargement d’une page plus ancienne ne lit pas l’intégralité de l’historique
JSONL dans une seule réponse du Gateway.

Les deux commandes du Node sont en lecture seule. Elles exposent les métadonnées
du catalogue et le contenu des transcriptions uniquement par l’intermédiaire des
méthodes génériques `sessions.catalog.list` et `sessions.catalog.read`, à une
connexion d’opérateur authentifiée disposant de `operator.write`. Les lignes des
Nodes associés restent en lecture seule. Une ligne Claude CLI locale au Gateway
peut être adoptée depuis l’éditeur Chat normal : OpenClaw importe l’historique
visible limité, reprend avec `--fork-session` au premier tour et laisse la
transcription source intacte. Les lignes Claude Desktop restent en lecture
seule.

Consultez [Anthropic : sessions Claude sur plusieurs ordinateurs](/fr/providers/anthropic#claude-sessions-across-computers)
pour le comportement de l’interface Control UI et les sources de stockage.

## Invocation de commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloque `system.run` et `system.run.prepare` ; ces commandes ne
s’exécutent que par l’intermédiaire de l’outil `exec` avec `host=node` (voir
ci-dessus). Des assistants de plus haut niveau existent pour les workflows
courants consistant à « fournir à l’agent une pièce jointe MEDIA » (canvas,
caméra, écran, emplacement, ci-dessous).

## Politique des commandes

Les commandes du Node doivent franchir deux contrôles avant de pouvoir être
invoquées :

1. Le Node doit déclarer la commande dans ses métadonnées de connexion authentifiées (`connect.commands`).
2. La liste d’autorisation du Gateway, dérivée de la plateforme et des approbations, doit inclure la commande déclarée.

Listes d’autorisation par défaut selon la plateforme (avant les valeurs par
défaut des Plugins et les substitutions `allowCommands`/`denyCommands`) :

| Plateforme | Commandes autorisées par défaut                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (les commandes de l’hôte du Node telles que `system.run` sont soumises à approbation, voir ci-dessous)                                                                                                                                                                                                                                  |

Ces lignes décrivent la limite supérieure de la politique du Gateway, et non
les commandes implémentées par chaque application de Node. Une commande n’est
utilisable que si le Node connecté la déclare également. En particulier,
l’application macOS actuelle ne déclare pas les familles d’appareils et de
données personnelles répertoriées dans la ligne de politique macOS.

Les commandes `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`,
`canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) constituent une valeur par
défaut du Plugin sur iOS, Android, macOS, Windows et les plateformes inconnues
(mais pas Linux) ; elles sont toutes limitées au premier plan sur iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` sont
autorisées par défaut pour tout Node qui annonce la capacité `talk` ou déclare
des commandes `talk.*`, indépendamment de l’étiquette de plateforme.

Les commandes de l’hôte de bureau (`system.run`, `system.run.prepare`,
`system.which`, `browser.proxy`, `mcp.tools.call.v1` et `screen.snapshot` sur
macOS/Windows) ne font pas partie du tableau statique des valeurs par défaut des
plateformes ci-dessus. Elles deviennent disponibles lorsque l’opérateur
approuve une demande d’association qui les déclare ; l’ensemble des commandes
approuvées du Node les conserve ensuite lors des reconnexions.

Les commandes dangereuses ou fortement liées à la confidentialité nécessitent
toujours une activation explicite avec `gateway.nodes.allowCommands`, même si
un Node les déclare : `camera.snap`, `camera.clip`, `screen.record`,
`computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`,
`sms.search`. `gateway.nodes.denyCommands` prévaut toujours sur les valeurs par
défaut et les entrées supplémentaires de la liste d’autorisation. Consultez
[Utilisation de l’ordinateur](/nodes/computer-use) pour connaître les contrôles
supplémentaires liés à macOS, à la politique des outils et à l’armement autour
des entrées de bureau.

Les commandes de Node détenues par des Plugins peuvent ajouter une stratégie d’invocation de Node au Gateway. Cette stratégie s’exécute après la vérification de la liste d’autorisation et avant le transfert vers le Node, afin que les appels `node.invoke` bruts, les assistants CLI et les outils d’agent dédiés partagent la même frontière d’autorisation du Plugin. Les commandes de Node dangereuses des Plugins nécessitent toujours une activation explicite via `gateway.nodes.allowCommands`.

Après qu’un Node a modifié sa liste de commandes déclarée, rejetez l’ancien appairage de l’appareil et approuvez la nouvelle demande afin que le Gateway enregistre l’instantané mis à jour des commandes.

## Configuration (`openclaw.json`)

Les paramètres relatifs aux Nodes se trouvent sous `gateway.nodes` et `tools.exec` :

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
      // Faire confiance aux outils de Plugin visibles par l’agent et publiés par les Nodes appairés (par défaut : true).
      pluginTools: {
        enabled: true,
      },
      // Activer les commandes de Node dangereuses ou très intrusives pour la vie privée (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloquer les noms de commande exacts même si les valeurs par défaut ou allowCommands les incluent.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Hôte d’exécution par défaut : "node" achemine tous les appels d’exécution vers un Node appairé.
      host: "node",
      // Mode de sécurité pour l’exécution sur un Node : autoriser uniquement les commandes approuvées ou figurant dans la liste d’autorisation.
      security: "allowlist",
      // Épingler l’exécution à un Node précis (identifiant ou nom). Omettre pour autoriser n’importe quel Node.
      node: "build-node",
    },
  },
}
```

Utilisez les noms exacts des commandes de Node. `denyCommands` retire une commande même si une valeur par défaut de la plateforme ou une entrée de `allowCommands` l’autoriserait autrement. Par défaut, les Nodes appairés peuvent publier des descripteurs d’outils de Plugin visibles par l’agent, mais la commande de chaque descripteur doit toujours faire partie de la surface de commandes approuvée du Node. Définissez `gateway.nodes.pluginTools.enabled: false` pour ignorer tous ces descripteurs. Consultez la [référence de configuration du Gateway](/fr/gateway/configuration-reference#gateway) pour en savoir plus sur les champs d’appairage des Nodes et de stratégie de commandes du Gateway.

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

- Les Nodes mobiles utilisent une page A2UI intégrée détenue par l’application pour un rendu prenant en charge les actions.
- Seul le JSONL A2UI v0.8 est pris en charge (v0.9/createSurface est rejeté).
- iOS et Android affichent les pages de canevas distantes du Gateway, mais les actions des boutons A2UI ne sont transmises que depuis la page A2UI intégrée détenue par l’application. Sur ces clients mobiles, les pages A2UI HTTP/HTTPS hébergées par le Gateway servent uniquement au rendu.
- macOS peut transmettre des actions depuis la page A2UI exacte du Gateway, limitée aux capacités et sélectionnée par l’application. Les autres pages HTTP/HTTPS servent uniquement au rendu.

## Photos et vidéos (caméra du Node)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # par défaut : les deux orientations (2 lignes MEDIA)
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
- Les Nodes limitent la durée des clips afin de conserver une taille raisonnable pour la charge utile base64 (consultez [Capture avec la caméra](/fr/nodes/camera) pour connaître les limites exactes de chaque plateforme). L’outil d’agent `nodes` limite en outre la valeur `durationMs` demandée à 300000 (5 minutes) avant de transférer l’appel ; le Node applique lui-même la limite la plus stricte.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque cela est possible ; les autorisations refusées entraînent une erreur `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (Nodes)

Les Nodes pris en charge exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Remarques :

- La disponibilité de `screen.record` dépend de la plateforme du Node.
- L’outil d’agent `nodes` limite la valeur `durationMs` demandée à 300000 (5 minutes) ; le Node peut appliquer une limite plus stricte afin de limiter la taille de la charge utile renvoyée.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
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
- « Toujours » nécessite une autorisation du système ; la récupération en arrière-plan s’effectue au mieux.
- La réponse comprend la latitude/longitude, la précision (en mètres) et l’horodatage.
- Structure complète des paramètres et de la réponse, ainsi que codes d’erreur : [Commande de localisation](/fr/nodes/location-command).

## SMS (Nodes Android)

Les Nodes Android peuvent exposer `sms.send` et `sms.search` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie. Ces deux commandes sont dangereuses par défaut : l’opérateur du Gateway doit également les ajouter à `gateway.nodes.allowCommands` avant qu’elles puissent être invoquées (consultez [Stratégie de commandes](#command-policy)).

Pour activer explicitement la recherche de SMS en lecture seule dans `openclaw.json` :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Ajoutez `sms.send` séparément uniquement si le Node doit également pouvoir envoyer des messages. L’autorisation Android et l’autorisation des commandes du Gateway sont indépendantes ; accorder l’autorisation sur le téléphone ne modifie pas la stratégie du Gateway.

Invocation de bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Bonjour depuis OpenClaw"}'
```

Remarques :

- `sms.search` peut être déclarée avant l’octroi de `READ_SMS` afin qu’une invocation puisse renvoyer un diagnostic d’autorisation ; la lecture des messages nécessite toujours cette autorisation Android.
- Les appareils uniquement Wi-Fi sans téléphonie n’annonceront pas `sms.send`.
- Une erreur `requires explicit gateway.nodes.allowCommands opt-in` signifie que le téléphone a déclaré la commande, mais que l’opérateur du Gateway ne l’a pas autorisée.

## Commandes relatives à l’appareil et aux données personnelles

Les Nodes iOS et Android annoncent par défaut plusieurs commandes de données en lecture seule (consultez le tableau [Stratégie de commandes](#command-policy)) ; Android expose en outre une famille plus étendue, contrôlée par ses propres paramètres dans l’application.

Familles disponibles :

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — Android uniquement ; `device.apps` nécessite l’activation du partage des applications installées dans les paramètres Android et renvoie par défaut les applications visibles dans le lanceur.
- `notifications.list`, `notifications.actions` — Android uniquement.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (lecture seule par défaut) ; `contacts.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (lecture seule par défaut) ; `calendar.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (lecture seule par défaut) ; `reminders.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `callLog.search` — Android uniquement.
- `motion.activity`, `motion.pedometer` — iOS, Android ; disponibilité conditionnée par les capacités des capteurs disponibles.

Exemples d’invocation :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Commandes système (hôte du Node / Node Mac)

Le Node macOS expose `system.run`, `system.which`, `system.notify` et `system.execApprovals.get/set`. L’hôte de Node sans interface graphique expose `system.run.prepare`, `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway prêt"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Remarques :

- `system.run` renvoie stdout/stderr/le code de sortie dans la charge utile.
- L’exécution de l’interpréteur de commandes passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste l’interface RPC directe pour les commandes Node explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent disponibles uniquement sur le chemin d’exécution.
- Le chemin d’exécution prépare un `systemRunPlan` canonique avant l’approbation. Une fois l’approbation accordée, le Gateway transmet ce plan enregistré, et non les champs de commande/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état de l’autorisation des notifications dans l’application macOS ; prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les métadonnées `platform` / `deviceFamily` de Node non reconnues utilisent par défaut une liste d’autorisation prudente qui exclut `system.run` et `system.which`. Si vous avez volontairement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes d’interpréteur de commandes (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes de répartition connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes plutôt que ceux des enveloppes. Si le désencapsulation n’est pas sûr, aucune entrée de liste d’autorisation n’est automatiquement conservée.
- Sur les hôtes Node Windows en mode liste d’autorisation, les exécutions d’enveloppes d’interpréteur de commandes via `cmd.exe /c` nécessitent une approbation (une entrée dans la liste d’autorisation ne suffit pas à autoriser automatiquement la forme avec enveloppe).
- Les hôtes Node ignorent les remplacements de `PATH` dans `--env` et suppriment un vaste ensemble maintenu de variables de démarrage d’interpréteurs et de shells (par exemple `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) avant d’exécuter une commande. Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service hôte Node (ou installez les outils dans des emplacements standard) au lieu de transmettre `PATH` via `--env`.
- En mode Node sur macOS, `system.run` est soumis aux approbations d’exécution dans l’application macOS (Settings → Exec approvals). Les modes demande/liste d’autorisation/complet se comportent comme sur l’hôte Node sans interface ; les demandes refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte Node sans interface, `system.run` est soumis aux approbations d’exécution (`~/.openclaw/exec-approvals.json`) ; sur macOS en particulier, consultez ci-dessous les variables d’environnement de routage de l’hôte d’exécution sous [Hôte Node sans interface](#headless-node-host-cross-platform).

## Liaison du nœud d’exécution

Lorsque plusieurs nœuds sont disponibles, vous pouvez associer exec à un nœud spécifique. Cela définit le nœud par défaut pour `exec host=node` (et peut être remplacé pour chaque agent).

Valeur globale par défaut :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Désactivez ce paramètre pour autoriser n’importe quel Node :

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Carte des autorisations

Les nœuds peuvent inclure une table `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par exemple `screenRecording`, `accessibility`, `location`) avec des valeurs booléennes (`true` = accordée).

## Hôte de nœud sans interface graphique (multiplateforme)

OpenClaw peut exécuter un **hôte de nœud sans interface graphique** (sans interface utilisateur) qui se connecte au WebSocket du Gateway et expose `system.run` / `system.which`. Cela est utile sous Linux/Windows ou pour exécuter un nœud minimal aux côtés d’un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- L’appairage reste requis (le Gateway affichera une invite d’appairage de l’appareil).
- Les métadonnées de l’instance cliente, l’identité signée de l’appareil et l’authentification d’appairage utilisent des fichiers distincts ; consultez [État de l’identité sans interface graphique](#headless-identity-state).
- Les approbations d’exécution sont appliquées localement via `~/.openclaw/exec-approvals.json` (consultez [Approbations d’exécution](/fr/tools/exec-approvals)).
- Sous macOS, l’hôte de nœud sans interface graphique exécute `system.run` localement par défaut. Définissez `OPENCLAW_NODE_EXEC_HOST=app` pour acheminer `system.run` via l’hôte d’exécution de l’application compagnon ; ajoutez `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte de l’application et échouer de manière sécurisée s’il n’est pas disponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WebSocket du Gateway utilise TLS.

## Mode nœud Mac

- L’application macOS de la barre des menus se connecte au serveur WebSocket du Gateway en tant que nœud (afin que `openclaw nodes …` fonctionne avec ce Mac).
- En mode distant, l’application ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
