---
read_when:
    - Association de nœuds iOS/watchOS/Android à un Gateway
    - Utilisation du canevas/de la caméra du Node pour le contexte de l’agent
    - Ajout de nouvelles commandes Node ou de nouveaux utilitaires CLI
summary: 'Nodes : appairage, capacités, autorisations et assistants CLI pour canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-07-16T13:23:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Un **nœud** est un appareil compagnon (macOS/iOS/watchOS/Android/sans interface graphique) qui se connecte au Gateway avec `role: "node"` et expose une surface de commandes (par ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. La plupart des nœuds utilisent le WebSocket du Gateway sur le port opérateur. Le nœud Apple Watch direct facultatif utilise une interrogation HTTPS signée sur ce même port, car watchOS bloque la mise en réseau générique de bas niveau pour les applications ordinaires. Détails du protocole : [Protocole du Gateway](/fr/gateway/protocol).

Transport hérité : [Protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ; uniquement historique pour les nœuds actuels).

macOS peut également s'exécuter en **mode nœud** : l'application de la barre des menus se connecte au serveur
WS du Gateway en tant que nœud (ainsi, `openclaw nodes …` fonctionne sur ce Mac). L'application
ajoute des commandes natives de Canvas, de caméra, d'écran, de notification et de contrôle de l'ordinateur
à la même surface de commandes de l'hôte de nœud que celle utilisée par `openclaw node run`. Ne démarrez pas un
second nœud CLI sur ce Mac ; l'application exécute le runtime d'hôte de nœud CLI correspondant comme
processus interne et reste l'unique connexion au Gateway et l'unique identité de nœud.

Les nœuds sont des **périphériques**, pas des gateways : ils n'exécutent pas le service Gateway, et les messages des canaux (Telegram, WhatsApp, etc.) arrivent sur le Gateway, pas sur les nœuds.

Guide de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Appairage et état

Les nœuds utilisent l'**appairage d'appareils**. Un nœud présente une identité d'appareil signée lors de la connexion ; le Gateway crée une demande d'appairage d'appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l'interface utilisateur). La configuration directe de l'Apple Watch utilise un code de configuration de courte durée, réservé aux nœuds et généré par un administrateur, afin d'approuver sa surface de commandes fixe à faible risque ; toute extension ultérieure des capacités nécessite toujours une approbation normale.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Les demandes d'appairage en attente expirent 5 minutes après la dernière tentative de l'appareil — un appareil qui continue de se reconnecter maintient sa demande en attente unique (et `requestId`) active au lieu de générer une nouvelle invite toutes les quelques minutes ; consultez [Appairage des nœuds](/fr/gateway/pairing) pour connaître le cycle complet de demande et d'approbation. Si un nœud réessaie avec des informations d'authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé — les clients reçoivent un événement `device.pair.resolved` pour la demande remplacée, et vous devez réexécuter `openclaw devices list` avant de l'approuver.

- `nodes status` marque un nœud comme **appairé** lorsque son rôle d'appairage d'appareil inclut `node`.
- Un Mac natif connecté disposant de l'autorisation Accessibilité peut signaler une activité
  d'entrée physique regroupée. Le Gateway désigne le Mac admissible le plus récemment actif comme
  `active`, fournit à l'agent une indication stable d'identifiant de nœud et y achemine les alertes de connexion
  des nœuds avant un basculement différé. Consultez
  [Présence de l'ordinateur actif](/fr/nodes/presence) pour la configuration, la confidentialité, les délais et
  le dépannage.
- L'enregistrement d'appairage de l'appareil constitue le contrat durable des rôles approuvés. La rotation des jetons reste dans le cadre de ce contrat ; elle ne peut pas attribuer à un nœud appairé un rôle que l'approbation d'appairage n'a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/remove/rename`) est un magasin d'appairage des nœuds distinct, détenu par le Gateway, qui suit la surface de commandes et de capacités approuvée du nœud au fil des reconnexions. Il ne contrôle **pas** l'authentification du transport — l'appairage des appareils s'en charge.
- `openclaw nodes remove --node <id|name|ip>` supprime l'appairage d'un nœud. Pour un nœud associé à un appareil, cette opération révoque le rôle `node` de l'appareil dans le magasin des appareils appairés et déconnecte les sessions de cet appareil dotées du rôle de nœud : un appareil à rôles multiples conserve sa ligne et perd uniquement le rôle `node`, tandis que la ligne d'un appareil exclusivement dédié au rôle de nœud est supprimée. Elle efface également toute entrée correspondante du magasin distinct d'appairage des nœuds. `operator.pairing` peut supprimer des lignes de nœuds non-opérateurs sur d'autres appareils ; un appelant utilisant un jeton d'appareil qui révoque son propre rôle de nœud sur un appareil à rôles multiples a en outre besoin de `operator.admin`.
- La portée de l'approbation suit les commandes déclarées dans la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de nœud autres que d'exécution : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Décalage de version et ordre de mise à niveau

Le WebSocket du Gateway accepte les clients nœuds authentifiés dans une fenêtre de protocole N-1.
Le Gateway v4 actuel accepte donc les nœuds v3 lorsque la connexion déclare
à la fois `role: "node"` et `client.mode: "node"`. Les sessions opérateur et d'interface utilisateur doivent
toujours utiliser le protocole actuel.

Pour les mises à niveau progressives d'un parc, mettez d'abord à niveau le Gateway, puis chaque nœud.
Un nœud N-1 reste visible et administrable pendant sa mise à niveau ; le Gateway
journalise `legacy node protocol accepted` avec une recommandation de mise à niveau. L'appairage,
l'authentification des appareils, les listes d'autorisation de commandes et les approbations d'exécution restent applicables.
Les capacités et commandes détenues par des Plugins restent masquées jusqu'à ce que le nœud soit mis à niveau vers
le protocole actuel. Les nœuds antérieurs à N-1 nécessitent une mise à niveau hors bande avant
de se reconnecter.

Le transport HTTPS direct de watchOS nécessite la version actuelle du protocole ; mettez à jour
l'application de la montre en même temps que le Gateway avant d'activer le mode direct.

## Hôte de nœud distant (system.run)

Utilisez un **hôte de nœud** lorsque votre Gateway s'exécute sur une machine et que vous souhaitez exécuter des commandes sur une autre. Le modèle communique toujours avec le **Gateway** ; le Gateway transmet les appels `exec` à l'**hôte de nœud** lorsque `host=node` est sélectionné.

| Rôle            | Responsabilité                                                        |
| --------------- | --------------------------------------------------------------------- |
| Hôte du Gateway | Reçoit les messages, exécute le modèle et achemine les appels d'outils. |
| Hôte de nœud    | Exécute `system.run`/`system.which` sur la machine du nœud. |
| Approbations    | Appliquées sur l'hôte de nœud via `~/.openclaw/exec-approvals.json`.                 |

Remarque sur l'approbation :

- Les exécutions de nœud soumises à approbation sont liées au contexte exact de la demande. Le chemin d'exécution prépare un `systemRunPlan` canonique avant l'approbation ; une fois celle-ci accordée, le Gateway transmet ce plan enregistré, et non des champs de commande/répertoire de travail/session modifiés ultérieurement par l'appelant, puis revalide le répertoire de travail avant l'exécution.
- Pour les exécutions directes de fichiers par un shell ou un runtime, OpenClaw lie également, au mieux de ses possibilités, un opérande de fichier local concret et refuse l'exécution si ce fichier change avant l'exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d'interpréteur ou de runtime, l'exécution soumise à approbation est refusée au lieu de prétendre couvrir l'intégralité du runtime. Utilisez un bac à sable, des hôtes distincts ou une liste d'autorisation explicite et fiable/un workflow complet pour une sémantique d'interpréteur plus étendue.

### Démarrer un hôte de nœud (premier plan)

Sur la machine du nœud :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` accepte également `--context-path` (chemin de contexte WS du Gateway), `--tls`, `--tls-fingerprint <sha256>` et `--node-id` (remplace l'identifiant d'instance client hérité ; cela ne réinitialise pas l'appairage).

### Gateway distant via un tunnel SSH (liaison en boucle locale)

Si le Gateway est lié à l'interface de boucle locale (`gateway.bind=loopback`, valeur par défaut en mode local), les hôtes de nœuds distants ne peuvent pas se connecter directement. Créez un tunnel SSH et dirigez l'hôte de nœud vers l'extrémité locale du tunnel.

Exemple (hôte de nœud -> hôte du Gateway) :

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l'authentification par jeton ou mot de passe.
- Les variables d'environnement sont privilégiées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- La configuration de secours est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l'hôte de nœud ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont admissibles selon les règles de priorité à distance.
- Si des SecretRefs `gateway.auth.*` locales actives sont configurées mais non résolues, l'authentification de l'hôte de nœud échoue de manière sécurisée.
- La résolution de l'authentification de l'hôte de nœud ne prend en compte que les variables d'environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte de nœud (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` accepte également `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (identifiant d'instance client hérité uniquement), `--runtime <node>` (valeur par défaut : node) et `--force` pour procéder à une réinstallation. `node status`, `node stop` et `node uninstall` sont également disponibles.

### Appairer et nommer

Sur l'hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le nœud réessaie avec des informations d'authentification modifiées, réexécutez `openclaw devices list` et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (conservé dans la ligne SQLite `node_host_config` partagée avec l'identifiant d'instance client et les métadonnées de connexion au Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement par le Gateway).

### Serveurs MCP hébergés par le nœud

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

L'hôte de nœud sans interface graphique démarre ces serveurs, répertorie leurs outils et publie
les descripteurs après la connexion. Les appels d'outils reviennent à ce nœud par
`mcp.tools.call.v1` ; le Gateway n'a pas besoin d'une configuration MCP correspondante ni d'un
Plugin JS. Les serveurs MCP OAuth ne sont pas pris en charge par ce chemin v1 hébergé par le nœud.

Les hôtes de nœuds actuels déclarent la famille de commandes intégrée `mcp.tools.call.v1` lors
de leur appairage initial, même si aucun serveur MCP n'est configuré. Un nœud appairé avec une
ancienne version d'OpenClaw peut demander une mise à niveau ponctuelle de la surface de commandes après la
mise à jour de l'hôte de nœud. L'ajout, la suppression ou le filtrage de serveurs par la suite ne
nécessite pas de nouvel appairage, car la famille de commandes approuvée reste inchangée. Redémarrez
`openclaw node run` ou `openclaw node restart` pour appliquer les modifications de la configuration MCP du nœud ;
l'hôte de nœud ne surveille pas cette configuration.

Les opérateurs du Gateway peuvent ignorer tous les outils visibles par l'agent publiés par les nœuds appairés,
y compris les outils MCP hébergés par les nœuds, avec
`gateway.nodes.pluginTools.enabled: false`. Les interdictions de commandes exactes telles que
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` bloquent également l'exécution.

### Skills hébergées par le nœud

Installez les Skills dans le répertoire de Skills OpenClaw actif de la machine du nœud,
`~/.openclaw/skills` par défaut. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` et
`OPENCLAW_CONFIG_PATH` déplacent ce profil actif. `OPENCLAW_STATE_DIR` est
prioritaire pour les Skills ; sinon, `skills/` se trouve à côté du chemin affiché par
`openclaw config file`. L'hôte de nœud sans interface graphique publie les fichiers `SKILL.md` valides
après sa connexion, et le Gateway les ajoute aux instantanés de Skills de l'agent uniquement tant que
ce nœud reste connecté. Le nom de chaque répertoire de Skill doit correspondre au champ de frontmatter `name`
afin que le localisateur abstrait du nœud corresponde à une seule entrée sans ajouter
un autre champ de protocole.

Le jumelage initial du rôle de Node approuve la publication des Skills. L’ajout, la suppression ou la
modification de Skills ne nécessite pas un nouveau jumelage ni une modification de la configuration du
Gateway. Redémarrez `openclaw node run` ou `openclaw node restart` après avoir modifié les
fichiers de Skills du Node ; l’hôte du Node ne surveille pas le répertoire des Skills.

Les entrées de Skills hébergées sur un Node identifient leur Node et indiquent leur emplacement
d’exécution. Les fichiers de Skills, les chemins relatifs référencés et les binaires restent sur ce
Node. L’agent lit l’emplacement `node://.../SKILL.md` annoncé avec l’outil
`read` normal. `file_fetch` accepte les chemins absolus du Node approuvés par l’opérateur,
et non les localisateurs de Skills du Node ; les environnements d’exécution dépourvus de l’outil de lecture normal peuvent à la place exécuter
`cat SKILL.md` via `exec host=node node=<node-id>` avec le répertoire
`node://.../skills/<name>` annoncé comme `workdir`. Les fichiers et binaires référencés
utilisent la même cible d’exécution et le même répertoire de travail. L’hôte du Node résout ce localisateur par rapport
à son répertoire d’état OpenClaw actif, de sorte que les chemins relatifs sont résolus sur le Node plutôt
que sur la machine du Gateway. Le Node de publication doit avoir approuvé `system.run`,
et la politique d’exécution de l’agent doit autoriser `host=node` ; sinon, le Skill reste
exclu de l’instantané de cet agent.

Définissez `nodeHost.skills.enabled: false` sur le Node pour arrêter la publication. Les opérateurs du Gateway
peuvent ignorer les Skills de tous les Nodes jumelés avec
`gateway.nodes.skills.enabled: false`.

### État de l’identité sans interface graphique

Le Node sans interface graphique conserve trois enregistrements d’état distincts :

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`) : l’identifiant de l’instance cliente, le nom d’affichage et les métadonnées de connexion au Gateway.
- `~/.openclaw/identity/device.json` : la paire de clés signée de l’appareil et l’identifiant cryptographique dérivé de l’appareil.
- `~/.openclaw/identity/device-auth.json` : les jetons d’authentification des appareils jumelés, indexés par identifiant cryptographique d’appareil et par rôle.

Pour un Node signé, le Gateway utilise l’identifiant cryptographique de l’appareil pour le jumelage et
le routage du Node. L’identifiant de l’instance cliente n’est qu’une métadonnée de connexion. La modification de
`--node-id` ou la migration d’un ancien `node.json` ne réinitialise donc pas le jumelage. Consultez
[État de l’identité et du jumelage](/fr/cli/node#identity-and-pairing-state) pour connaître la procédure
prise en charge de révocation et de nouveau jumelage, ainsi que les notes de mise à niveau.

### Ajouter les commandes à la liste d’autorisation

Les approbations d’exécution sont **propres à chaque hôte de Node**. Ajoutez les entrées à la liste d’autorisation depuis le Gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations sont stockées sur l’hôte du Node dans `~/.openclaw/exec-approvals.json`.

### Diriger l’exécution vers le Node

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

Une fois cette configuration définie, tout appel `exec` avec `host=node` s’exécute sur l’hôte du Node (sous réserve de la liste d’autorisation et des approbations du Node).

`host=auto` ne choisira pas implicitement le Node de lui-même, mais une requête explicite `host=node` par appel est autorisée depuis `auto`. Si vous souhaitez que l’exécution sur le Node soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Voir aussi :

- [CLI de l’hôte du Node](/fr/cli/node)
- [Outil d’exécution](/fr/tools/exec)
- [Approbations d’exécution](/fr/tools/exec-approvals)

### Inférence locale de modèles

Un Node de bureau ou de serveur peut exposer des modèles capables de discuter depuis un serveur Ollama exécuté sur ce Node. Les agents utilisent l’outil `node_inference` du Plugin Ollama pour découvrir les modèles installés et exécuter à distance une requête limitée ; le Gateway n’a pas besoin d’un accès réseau direct à Ollama. Consultez [Inférence Ollama locale au Node](/fr/providers/ollama#node-local-inference) pour la configuration, le filtrage des modèles et les commandes de vérification directe.

### Sessions et transcriptions Codex

Le Plugin officiel `codex` peut exposer les sessions Codex non archivées sur un
hôte de Node sans interface graphique ou un Node macOS natif. L’enregistrement du catalogue ne dépend plus
de `supervision.enabled` ; cette option contrôle les outils de supervision accessibles aux agents.
Définissez `sessionCatalog.enabled: false` dans la configuration du Plugin Codex pour désactiver les
commandes du catalogue de l’opérateur et du catalogue des Nodes jumelés sans désactiver le
fournisseur ni le harnais.
Le Plugin doit néanmoins être actif sur les deux ordinateurs, et le paramètre du Node reste
un consentement local : l’activation sur le seul Gateway ne permet pas de lire l’état Codex
d’un autre ordinateur.

Le Node annonce les commandes en lecture seule et versionnées
`codex.appServer.threads.list.v1` et
`codex.appServer.thread.turns.list.v1`. Un hôte de Node natif disposant de la
CLI Codex annonce également `codex.terminal.resume.v1`. Approuvez la mise à niveau du jumelage du Node
lorsque ces commandes apparaissent pour la première fois. Le Gateway les invoque via la
politique normale des Nodes du Plugin et isole les échecs par hôte.

Les lignes des Nodes jumelés apparaissent sous forme de groupe **Codex** dans la barre latérale normale des sessions.
Par défaut, la sélection d’une ligne ouvre le volet de discussion normal et lit sa transcription persistante
au moyen d’appels `thread/turns/list` limités et paginés par curseur, avec projection complète des éléments. Utilisez le menu de la ligne, l’en-tête de la visionneuse ou la préférence **Open Codex/Claude sessions in** pour démarrer `codex resume <thread-id>` dans le terminal de l’opérateur sur l’ordinateur propriétaire de la session. Le chemin de terminal du Node jumelé est un relais PTY sur liste d’autorisation appartenant au Plugin Codex, et non une exécution arbitraire de commandes sur le Node.

Le relais ne fournit pas l’intégralité des contrats de continuation du harnais OpenClaw et de propriété des archives. **Continue** et **Archive** sont donc indisponibles pour les lignes distantes. Sur l’ordinateur du Gateway, les lignes stockées et inactives
peuvent démarrer une branche de discussion distincte verrouillée sur le modèle. L’une ou l’autre ne peut être archivée qu’après
confirmation par l’opérateur qu’aucun autre client Codex ne l’utilise ; l’activité en direct
d’une ligne stockée reste inconnue. Les lignes actives ne peuvent ni créer de branche ni être archivées.

Consultez [Superviser les sessions Codex](/fr/plugins/codex-supervision) pour la configuration,
la pagination, la continuation locale et la frontière de sécurité des métadonnées.

### Sessions et transcriptions Claude

Le Plugin `anthropic` inclus découvre par défaut les sessions non archivées de la CLI Claude et de Claude
Desktop sur le Gateway et les Nodes jumelés. Définissez
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` pour désactiver les
commandes du catalogue de l’opérateur et du catalogue des Nodes jumelés sans désactiver les modèles
Anthropic ni le moteur de la CLI Claude.
Un Node distant de l’application macOS annonce
`anthropic.claude.sessions.list.v1` et `anthropic.claude.sessions.read.v1`
lorsque le Plugin Anthropic est activé et que `~/.claude/projects/` existe. Approuvez
la mise à niveau du jumelage du Node lorsque ces commandes apparaissent pour la première fois.

Un hôte de Node natif disposant de la CLI Claude annonce également
`anthropic.claude.terminal.resume.v1`. Les lignes CLI et Desktop admissibles peuvent ouvrir
`claude --resume <session-id>` dans le terminal de l’opérateur sur leur hôte propriétaire.
Il s’agit d’une prise de contrôle de la session native ; contrairement à l’adoption par OpenClaw, elle ne
duplique pas d’abord la session Claude.

Le catalogue combine les enregistrements valides de l’index des projets de la CLI Claude avec un préfixe
limité de métadonnées provenant des fichiers JSONL `sdk-cli` actuels. Les métadonnées locales de Claude Desktop
fournissent les titres Desktop et l’état d’archivage. Les métadonnées Desktop prévalent lorsque
les deux sources font référence au même identifiant de session Claude Code ; les transcriptions
propres à la CLI restent visibles, car la CLI ne possède pas d’indicateur d’archivage. La lecture des transcriptions utilise des
curseurs opaques de décalage en octets et des lectures arrière limitées des fichiers, de sorte que la sélection d’une grande
session ou le chargement d’une page plus ancienne ne lit pas l’intégralité de l’historique JSONL dans une seule
réponse du Gateway.

Les commandes de liste et de lecture sont en lecture seule. Elles exposent les métadonnées du catalogue et le contenu des transcriptions
uniquement via les méthodes génériques `sessions.catalog.list` et
`sessions.catalog.read` à une connexion d’opérateur authentifiée disposant de
`operator.write`. Une ligne de la CLI Claude locale au Gateway peut être adoptée depuis le compositeur de discussion
normal : OpenClaw importe un historique visible limité, reprend avec
`--fork-session` au premier tour et laisse la transcription source intacte.

Un hôte de Node sans interface graphique peut accepter le même flux de continuation :

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Le Node annonce `agent.cli.claude.run.v1` uniquement lorsque ce paramètre local au Node
est activé et que l’exécutable `claude` est résolu sur ce Node. Le Gateway ne peut pas
l’activer à distance. La commande passe également par la politique d’approbation d’exécution
existante du Node. Lorsque les trois commandes Claude sont annoncées et autorisées par
la politique de commandes des Nodes du Gateway, une ligne de la CLI Claude
sur ce Node peut être poursuivie : OpenClaw importe un historique limité, lie
la session adoptée au Node et au répertoire de travail indiqué par son catalogue, puis
y exécute chaque tour ponctuel `claude -p`. Le premier tour utilise toujours
`--fork-session`, ce qui préserve la transcription source.

Les tours exécutés sur le Node utilisent les valeurs par défaut de Claude sur ce Node. Dans la v1, ils ne reçoivent pas la
configuration MCP de bouclage du Gateway ni le Plugin de Skills du Gateway, ne peuvent pas être réinitialisés depuis une
transcription du Gateway et refusent les pièces jointes et les images. Les lignes Claude Desktop et
les Nodes qui n’annoncent pas la commande d’exécution restent en lecture seule. Le Node de l’application
macOS n’annonce pas encore cette commande ; ses lignes restent donc en lecture seule.

Consultez [Anthropic : sessions Claude sur plusieurs ordinateurs](/fr/providers/anthropic#claude-sessions-across-computers)
pour le comportement de l’interface de contrôle et les sources de stockage.

### Sessions OpenCode et Pi

Les Plugins OpenCode et ACPX inclus découvrent également des catalogues de sessions natives
en lecture seule sur le Gateway et les Nodes jumelés. Un Node annonce
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` lorsque la CLI `opencode`
est installée, et `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
lorsque le répertoire des sessions de Pi existe. Approuvez la mise à niveau du jumelage du Node lorsque de nouvelles
commandes apparaissent pour la première fois. Lorsque la CLI correspondante est également disponible, le Node ajoute
`opencode.terminal.resume.v1` ou `acpx.pi.terminal.resume.v1` ; le menu de ligne
et l’en-tête de la visionneuse existants peuvent alors rouvrir la session sélectionnée dans son
terminal propriétaire avec `opencode --session <id>` ou `pi --session <id>`.

OpenCode effectue la lecture via la surface JSON/d’exportation de sa CLI officielle. Pi lit son
stockage de sessions JSONL documenté, notamment les répertoires de sessions `settings.json`
de projet et globaux, ainsi que les remplacements `PI_CODING_AGENT_DIR` et
`PI_CODING_AGENT_SESSION_DIR`. Les deux catalogues sont activés par défaut ;
désactivez-les dans l’interface Web sous **Config > Plugins**.

La reprise dans le terminal utilise le répertoire de travail enregistré de la session et le même
relais PTY duplex sur liste d’autorisation que Codex et Claude. Elle n’expose pas
l’exécution arbitraire de commandes sur le Node.

### Téléversements de fichiers dans le terminal

L’interface de contrôle permet de faire glisser des fichiers dans un terminal ouvert d’un Node jumelé. L’hôte de Node natif annonce la commande `terminal.upload` réservée aux administrateurs ; approuvez la mise à niveau du jumelage lorsqu’elle apparaît pour la première fois. Chaque fichier est limité à 16 MiB, placé dans un répertoire temporaire privé sur ce Node, puis renvoyé au terminal sous forme de chemin protégé par des guillemets pour l’interpréteur de commandes, sans être exécuté.

L’insertion de chemins prend en charge PowerShell, `cmd.exe` et les interpréteurs POSIX reconnus (`sh`, Bash, Dash, Ash, Ksh, Zsh et Fish), notamment Git Bash sous Windows. Les autres remplacements d’interpréteur sont refusés, car leurs règles de mise entre guillemets ne peuvent pas être déduites de manière sûre ; exécutez l’hôte du Node dans WSL pour obtenir des chemins WSL natifs. Les chemins `cmd.exe` contenant `%` ou `!` sont également refusés, car cet interpréteur développe ces caractères même entre guillemets doubles.

## Invocation de commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloque `system.run` et `system.run.prepare` ; ces commandes ne s’exécutent que via l’outil `exec` avec `host=node` (voir ci-dessus). Des assistants de plus haut niveau existent pour les flux courants « fournir à l’agent une pièce jointe MEDIA » (canvas, caméra, écran, emplacement, ci-dessous).

Les commandes Node en streaming de longue durée utilisent des événements
`node.invoke.progress` additifs. Chaque événement contient l’ID d’invocation, un
numéro de séquence commençant à zéro et un fragment de texte UTF-8 de taille
limitée ; le Gateway ordonne les fragments avant de les transmettre à
l’appelant. La réponse `node.invoke.result` existante reste l’unique réponse
terminale. Les appelants en streaming peuvent définir un délai d’inactivité qui
débute au premier événement de progression et est réinitialisé après chaque
événement de progression ultérieur, tout en conservant le délai d’expiration
strict distinct de l’invocation pendant l’approbation et l’exécution. Un
résultat, un délai d’expiration strict, un délai d’inactivité ou la déconnexion
du Node supprime tout état de flux en attente. L’annulation par l’appelant émet
`node.invoke.cancel` ; l’hôte du Node met alors fin à l’arborescence de processus
correspondante. Les commandes de requête/réponse existantes restent inchangées.

## Politique des commandes

Les commandes Node doivent franchir deux contrôles avant de pouvoir être invoquées :

1. Le Node doit déclarer la commande dans ses métadonnées de connexion authentifiées (`connect.commands`).
2. La liste d’autorisation du Gateway, dérivée de la plateforme et de l’approbation, doit inclure la commande déclarée.

Listes d’autorisation par défaut selon la plateforme (avant les valeurs par défaut des Plugins et les remplacements `allowCommands`/`denyCommands`) :

| Plateforme | Commandes autorisées par défaut                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (les commandes d’hôte du Node telles que `system.run` sont soumises à approbation, voir ci-dessous)                                                                                                                                                                                            |

Ces lignes décrivent la limite supérieure de la politique du Gateway, et non les commandes implémentées par chaque application Node. Une commande n’est utilisable que si le Node connecté la déclare également. En particulier, l’application macOS actuelle ne déclare pas les familles relatives à l’appareil et aux données personnelles répertoriées dans la ligne de politique macOS.

Les commandes `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) constituent une valeur par défaut de Plugin sur iOS, Android, macOS, Windows, Linux et les plateformes inconnues. Les Nodes Linux ne les déclarent que lorsque le socket Canvas local de l’application de bureau est présent. Toutes les commandes Canvas sont limitées au premier plan sur iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` sont autorisées par défaut pour tout Node qui annonce la capacité `talk` ou déclare des commandes `talk.*`, indépendamment de l’étiquette de plateforme.

Les commandes d’hôte de bureau (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` et `screen.snapshot` sur macOS/Windows) ne font pas partie du tableau statique des valeurs par défaut de plateforme ci-dessus. Elles deviennent disponibles une fois que l’opérateur approuve une demande d’association qui les déclare, après quoi l’ensemble des commandes approuvées du Node les conserve lors des reconnexions.

Les commandes dangereuses ou présentant des enjeux importants de confidentialité nécessitent toujours une activation explicite avec `gateway.nodes.allowCommands`, même si un Node les déclare : `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` prévaut toujours sur les valeurs par défaut et les entrées supplémentaires de la liste d’autorisation. Consultez [les résumés HealthKit](/platforms/ios-healthkit) pour le contrôle de consentement sur iPhone et [l’utilisation de l’ordinateur](/fr/nodes/computer-use) pour les contrôles supplémentaires liés à macOS, à la politique des outils et à l’armement des entrées de bureau.

Les commandes Node appartenant à un Plugin peuvent ajouter une politique d’invocation de Node au Gateway. Cette politique s’exécute après le contrôle de la liste d’autorisation et avant la transmission au Node, de sorte que les appels `node.invoke` bruts, les utilitaires CLI et les outils dédiés de l’agent partagent la même limite d’autorisation du Plugin. Les commandes Node dangereuses d’un Plugin nécessitent toujours une activation explicite avec `gateway.nodes.allowCommands`.

Après qu’un Node a modifié sa liste de commandes déclarées, refusez l’ancienne association de l’appareil et approuvez la nouvelle demande afin que le Gateway enregistre l’instantané actualisé des commandes.

## Configuration (`openclaw.json`)

Les paramètres relatifs aux Nodes se trouvent sous `gateway.nodes` et `tools.exec` :

```json5
{
  gateway: {
    nodes: {
      // Approuver automatiquement la première association d’un Node depuis des réseaux de confiance (liste CIDR).
      // Désactivé lorsque non défini. S’applique uniquement aux premières demandes role:node
      // sans portée demandée ; n’approuve pas automatiquement les mises à niveau.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Approbation automatique vérifiée par SSH (valeur par défaut : activée). Approuve la première
        // association d’un Node en cas de correspondance exacte de la clé d’appareil relue via SSH.
        sshVerify: true,
      },
      // Faire confiance aux outils de Plugin visibles par l’agent et publiés par les Nodes associés (valeur par défaut : true).
      pluginTools: {
        enabled: true,
      },
      // Activer les commandes Node dangereuses ou présentant des enjeux importants de confidentialité (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloquer les noms de commandes exacts même si les valeurs par défaut ou allowCommands les incluent.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Hôte d’exécution par défaut : "node" achemine tous les appels d’exécution vers un Node associé.
      host: "node",
      // Mode de sécurité pour l’exécution sur un Node : autoriser uniquement les commandes approuvées/figurant dans la liste d’autorisation.
      security: "allowlist",
      // Affecter l’exécution à un Node précis (ID ou nom). Omettre pour autoriser n’importe quel Node.
      node: "build-node",
    },
  },
}
```

Utilisez les noms exacts des commandes Node. `denyCommands` supprime une commande même si une valeur par défaut de plateforme ou une entrée `allowCommands` l’autoriserait autrement. Par défaut, les Nodes associés peuvent publier des descripteurs d’outils de Plugin visibles par l’agent, mais la commande de chaque descripteur doit toujours appartenir à la surface de commandes approuvée du Node. Définissez `gateway.nodes.pluginTools.enabled: false` pour ignorer tous ces descripteurs. Consultez la [référence de configuration du Gateway](/fr/gateway/configuration-reference#gateway) pour plus de détails sur les champs d’association des Nodes et de politique des commandes du Gateway.

Remplacement du Node d’exécution pour chaque agent :

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

## Captures d’écran (instantanés Canvas)

Si le Node affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Utilitaire CLI (écrit dans un fichier temporaire et affiche le chemin enregistré) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Commandes du Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Remarques :

- `canvas present` accepte les URL ou les chemins de fichiers locaux (`--target`) sur les Nodes prenant en charge les chemins locaux, ainsi que le paramètre facultatif `--x/--y/--width/--height` pour le positionnement. Le Canvas Linux accepte les URL HTTP(S) ou son moteur de rendu A2UI intégré.
- `canvas eval` accepte du JS en ligne (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Remarques :

- Les Nodes mobiles et de bureau Linux utilisent une page A2UI intégrée appartenant à l’application pour le rendu prenant en charge les actions.
- Seul le format JSONL A2UI v0.8 est pris en charge (v0.9/createSurface est rejeté).
- iOS et Android affichent les pages Canvas distantes du Gateway, mais les actions des boutons A2UI ne sont distribuées que depuis la page A2UI intégrée appartenant à l’application. Les pages A2UI HTTP/HTTPS hébergées par le Gateway sont limitées au rendu sur ces clients mobiles.
- macOS peut distribuer des actions depuis la page A2UI exacte du Gateway, limitée à la capacité et sélectionnée par l’application. Les autres pages HTTP/HTTPS restent limitées au rendu.
- Linux ne distribue les actions que depuis la page A2UI intégrée. Les autres pages HTTP/HTTPS restent limitées au rendu, et un Node Linux sans interface graphique dépourvu de l’application de bureau n’annonce pas Canvas.

## Photos et vidéos (caméra du Node)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # valeur par défaut : les deux orientations (2 lignes MEDIA)
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
- Les Nodes limitent la durée des clips afin de préserver une taille gérable pour la charge utile base64 (consultez [la capture par caméra](/fr/nodes/camera) pour connaître les limites exactes de chaque plateforme). L’outil d’agent `nodes` limite en outre la valeur `durationMs` demandée à 300000 (5 minutes) avant de transmettre l’appel ; le Node lui-même applique la limite la plus stricte.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque cela est possible ; les autorisations refusées entraînent l’erreur `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (Nodes)

Les Nodes compatibles exposent `screen.record` (mp4). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Remarques :

- La disponibilité de `screen.record` dépend de la plateforme du nœud.
- L’outil d’agent `nodes` plafonne la valeur demandée pour `durationMs` à 300000 (5 minutes) ; le nœud peut imposer une limite plus stricte afin de borner la charge utile renvoyée.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsque plusieurs écrans sont disponibles (0 = écran principal).

## Localisation (nœuds)

Les nœuds exposent `location.get` lorsque la localisation est activée dans les paramètres.

Commande CLI auxiliaire :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Remarques :

- La localisation est **désactivée par défaut**.
- « Always » nécessite une autorisation système ; la récupération en arrière-plan est effectuée au mieux.
- La réponse comprend la latitude/longitude, la précision (en mètres) et l’horodatage.
- Structure complète des paramètres et de la réponse, ainsi que codes d’erreur : [commande de localisation](/fr/nodes/location-command).

## SMS (nœuds Android)

Les nœuds Android peuvent exposer `sms.send` et `sms.search` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie. Les deux commandes sont considérées comme dangereuses par défaut : l’opérateur du Gateway doit également les ajouter à `gateway.nodes.allowCommands` avant qu’elles puissent être invoquées (voir [Politique des commandes](#command-policy)).

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

Ajoutez `sms.send` séparément uniquement si le nœud doit également pouvoir envoyer des messages. L’autorisation Android et l’autorisation des commandes du Gateway sont indépendantes ; accorder l’autorisation sur le téléphone ne modifie pas la politique du Gateway.

Invocation de bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Remarques :

- `sms.search` peut être déclaré avant que `READ_SMS` soit accordé afin qu’une invocation puisse renvoyer un diagnostic d’autorisation ; la lecture des messages nécessite toujours cette autorisation Android.
- Les appareils exclusivement Wi-Fi sans téléphonie n’annonceront pas `sms.send`.
- Une erreur `requires explicit gateway.nodes.allowCommands opt-in` signifie que le téléphone a déclaré la commande, mais que l’opérateur du Gateway ne l’a pas autorisée.

## Commandes relatives à l’appareil et aux données personnelles

Les nœuds iOS et Android annoncent par défaut plusieurs commandes de données en lecture seule (voir le tableau de la [Politique des commandes](#command-policy)) ; Android expose en outre une famille plus étendue, soumise à ses propres paramètres intégrés à l’application.

Familles disponibles :

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — Android uniquement ; `device.apps` nécessite l’activation du partage des applications installées dans Android Settings et renvoie par défaut les applications visibles dans le lanceur.
- `notifications.list`, `notifications.actions` — Android uniquement.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (lecture seule par défaut) ; `contacts.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (lecture seule par défaut) ; `calendar.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (lecture seule par défaut) ; `reminders.add` est dangereuse et nécessite `gateway.nodes.allowCommands`.
- `callLog.search` — Android uniquement.
- `motion.activity`, `motion.pedometer` — iOS, Android ; soumises aux capacités des capteurs disponibles.

Exemples d’invocations :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Commandes système (hôte du nœud / nœud Mac)

Le nœud macOS expose `system.run`, `system.which`, `system.notify` et `system.execApprovals.get/set`. L’hôte de nœud sans interface expose `system.run.prepare`, `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Remarques :

- `system.run` renvoie la sortie standard, la sortie d’erreur et le code de sortie dans la charge utile.
- L’exécution de l’interpréteur de commandes passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste l’interface RPC directe pour les commandes de nœud explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ces éléments restent disponibles uniquement sur le chemin d’exécution.
- Le chemin d’exécution prépare un `systemRunPlan` canonique avant l’approbation. Une fois l’approbation accordée, le Gateway transmet ce plan enregistré, et non les champs de commande, de répertoire de travail ou de session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état de l’autorisation des notifications dans l’application macOS ; prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les métadonnées `platform` / `deviceFamily` de nœud non reconnues utilisent une liste d’autorisation prudente par défaut, qui exclut `system.run` et `system.which`. Si ces commandes sont intentionnellement nécessaires pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les enveloppes d’interpréteur de commandes (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` propres à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes de répartition connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) enregistrent les chemins des exécutables internes plutôt que ceux des enveloppes. Si le désencapsulation ne peut pas être effectuée en toute sécurité, aucune entrée de liste d’autorisation n’est enregistrée automatiquement.
- Sur les hôtes de nœud Windows en mode liste d’autorisation, les exécutions via l’enveloppe d’interpréteur `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation ne suffit pas à autoriser automatiquement la forme enveloppée).
- Les hôtes de nœud ignorent les substitutions de `PATH` dans `--env` et suppriment un vaste ensemble maintenu de variables de démarrage des interpréteurs et des shells (par exemple `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) avant d’exécuter une commande. Si des entrées PATH supplémentaires sont nécessaires, configurez l’environnement du service de l’hôte de nœud (ou installez les outils dans des emplacements standard) au lieu de transmettre `PATH` via `--env`.
- En mode nœud sous macOS, `system.run` est soumis aux approbations d’exécution dans l’application macOS (Settings → Exec approvals). Les modes demande/liste d’autorisation/complet se comportent comme sur l’hôte de nœud sans interface ; les demandes refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de nœud sans interface, `system.run` est soumis aux approbations d’exécution (`~/.openclaw/exec-approvals.json`) ; sous macOS en particulier, consultez ci-dessous les variables d’environnement de routage de l’hôte d’exécution dans [Hôte de nœud sans interface](#headless-node-host-cross-platform).

## Liaison du nœud d’exécution

Lorsque plusieurs nœuds sont disponibles, il est possible de lier l’exécution à un nœud précis. Cela définit le nœud par défaut pour `exec host=node` (avec possibilité de le remplacer pour chaque agent).

Valeur globale par défaut :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Supprimez la valeur pour autoriser n’importe quel nœud :

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Carte des autorisations

Les nœuds peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par exemple `screenRecording`, `accessibility`, `location`) avec des valeurs booléennes (`true` = accordée).

## Hôte de nœud sans interface (multiplateforme)

OpenClaw peut exécuter un **hôte de nœud sans interface** (sans interface utilisateur) qui se connecte au WebSocket du Gateway et expose `system.run` / `system.which`. Cela est utile sous Linux/Windows ou pour exécuter un nœud minimal aux côtés d’un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- L’appairage reste obligatoire (le Gateway affichera une demande d’appairage de l’appareil).
- Les métadonnées de l’instance cliente, l’identité signée de l’appareil et l’authentification d’appairage utilisent des fichiers distincts ; voir [État de l’identité sans interface](#headless-identity-state).
- Les approbations d’exécution sont appliquées localement via `~/.openclaw/exec-approvals.json` (voir [Approbations d’exécution](/fr/tools/exec-approvals)).
- Sous macOS, l’hôte de nœud sans interface exécute `system.run` localement par défaut. Définissez `OPENCLAW_NODE_EXEC_HOST=app` pour acheminer `system.run` via l’hôte d’exécution de l’application complémentaire ; ajoutez `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte de l’application et refuser l’exécution s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WebSocket du Gateway utilise TLS.

## Mode nœud Mac

- L’application de barre des menus macOS se connecte au serveur WebSocket du Gateway en tant que nœud (ainsi, `openclaw nodes …` fonctionne sur ce Mac).
- En mode distant, l’application ouvre un tunnel SSH pour le port du Gateway et se connecte à `localhost`.
