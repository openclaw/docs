---
read_when:
    - Vous souhaitez un tableau de travail de type Kanban dans l’interface de contrôle
    - Vous activez ou désactivez le plugin Workboard inclus.
    - Vous souhaitez suivre le travail planifié des agents sans gestionnaire de projet externe
summary: Tableau de suivi facultatif pour les cartes gérées par les agents et le transfert de session
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-16T13:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Le plugin Workboard ajoute un tableau facultatif de style Kanban à la
[Control UI](/fr/web/control-ui) : des cartes de travail dimensionnées pour les agents, l’affectation aux agents
et un lien vers la tâche, l’exécution et la session du tableau de bord de la carte.

Workboard est volontairement minimaliste : il suit le travail opérationnel local d’un
Gateway OpenClaw. Il ne remplace pas GitHub Issues, Linear, Jira ni
d’autres systèmes de gestion de projet d’équipe.

## L’activer

Workboard est inclus, mais désactivé par défaut :

1. Ouvrez **Plugins** dans la Control UI, ou utilisez `/settings/plugins` par rapport au
   chemin de base configuré de la Control UI. Par exemple, un chemin de base `/openclaw`
   utilise `/openclaw/settings/plugins`.
2. Recherchez **Workboard** et choisissez **Enable**. Comme Workboard est inclus avec
   OpenClaw, aucune action **Install** n’est nécessaire.
3. Si l’interface indique qu’un redémarrage est requis, redémarrez le Gateway.

L’onglet Workboard apparaît dans la navigation du tableau de bord après le chargement de l’environnement d’exécution du plugin.
Lorsqu’il est désactivé, l’onglet reste masqué dans la navigation. L’ouverture directe de la
route `/workboard` lorsque le plugin est désactivé ou bloqué par
`plugins.allow`/`plugins.deny` affiche un état indiquant que le plugin est indisponible au lieu des données
des cartes.

Le flux de travail CLI équivalent est le suivant :

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuration

Workboard ne possède aucune configuration propre au plugin. Activez-le ou désactivez-le avec l’entrée
de plugin standard :

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Champs des cartes

| Champ       | Valeurs                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | chaînes de forme libre                                                                                        |
| `agentId`   | agent affecté facultatif                                                                                      |
| références liées | tâche, exécution, session ou URL source facultative                                                           |
| `execution` | métadonnées facultatives pour une exécution Codex/Claude démarrée depuis la carte (moteur, mode, modèle, session, identifiant d’exécution, état) |

Les cartes contiennent également des métadonnées compactes sur les tentatives, les commentaires, les liens, les preuves,
les artefacts, les paramètres d’automatisation, les pièces jointes, les journaux des workers, l’état du protocole
des workers, les revendications, les diagnostics, les notifications, l’identifiant du modèle, l’état d’archivage et
la détection des sessions obsolètes, ainsi qu’une liste des événements récents (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Ces métadonnées permettent à un
opérateur de voir comment une carte s’est déplacée dans le tableau sans ouvrir la session
liée ; il s’agit d’un contexte opérationnel local, et non d’un remplacement des transcriptions
de session ou de l’historique des tickets GitHub.

Le plugin et la Control UI utilisent un contrat de carte Workboard unique. Les actualisations du tableau de bord
préservent donc la provenance et l’autorité de l’espace de travail, l’état des revendications, les actions de diagnostic
et les numéros de séquence des notifications, au lieu de projeter une copie plus petite
de la carte destinée uniquement à l’interface. Les types de diagnostics, les niveaux de gravité des diagnostics et
les types de notifications inconnus sont ignorés jusqu’à ce que les deux surfaces les prennent en charge ; ils ne sont jamais
réécrits sous la forme d’un autre état valide.

Le tableau de bord ouvert se met à jour à partir des invalidations `plugin.workboard.changed`. Chaque
événement ne contient qu’une époque et une révision du stockage ; l’interface relit ensuite les cartes canoniques
au moyen du RPC `operator.read` normal. Plusieurs révisions sont regroupées en
une seule relecture ultérieure. Workboard diffère cette lecture lorsqu’une carte est en cours de déplacement,
de modification ou d’écriture, puis la reprend une fois l’interaction locale terminée. Une
reconnexion déclenche toujours un rechargement canonique. Il n’existe aucune interrogation régulière de toutes les cartes,
et **Refresh** reste disponible comme mécanisme de récupération manuelle.

Lorsque plusieurs tableaux existent, la barre d’outils comprend un filtre **Board** reposant
sur les métadonnées persistantes des tableaux plutôt que sur les seules cartes actuellement visibles. Les tableaux vides
et archivés restent donc sélectionnables. Les cartes sans identifiant de tableau explicite
appartiennent au tableau canonique `default`. Le tableau sélectionné est stocké
dans le paramètre de requête `?board=`, de sorte que l’URL Workboard filtrée peut être ajoutée aux favoris
ou partagée ; le choix de **All boards** supprime le paramètre.

Les cartes sont stockées dans l’état Gateway propre au plugin et sont déplacées avec le reste de
l’état OpenClaw de ce Gateway (voir [Stockage](#storage)).

## Démarrer un travail depuis une carte

Les cartes non liées peuvent démarrer directement un travail :

- **Run Codex** / **Run Claude** démarre une exécution d’agent suivie comme tâche avec un
  moteur explicite, envoie l’invite de la carte et marque la carte `running`. Les exécutions Codex
  utilisent `openai/gpt-5.6-sol` ; les exécutions Claude utilisent `anthropic/claude-sonnet-4-6`.
- **Open Codex** / **Open Claude** crée une session liée dans le tableau de bord sans
  envoyer l’invite de la carte ni déplacer celle-ci, pour un travail manuel qui reste
  rattaché au tableau.

Les démarrages autonomes utilisent le chemin d’exécution d’agent suivie comme tâche du Gateway (agent
et modèle par défaut, sauf si Codex/Claude est choisi explicitement) ; Workboard lie ensuite
la tâche résultante, l’identifiant d’exécution et la clé de session à la carte. Chaque
exécution liée enregistre également un résumé de tentative (moteur, mode, modèle, identifiant d’exécution,
horodatages, état, nombre cumulatif d’échecs) afin que les échecs répétés restent visibles.

Le tableau de bord actualise l’état des tâches à partir du registre des tâches du Gateway, en associant
les tâches aux cartes par identifiant de tâche, identifiant d’exécution ou clé de session liée. Une tâche en file d’attente ou en cours
maintient le cycle de vie de la carte actif ; une tâche terminée, échouée, arrivée à expiration ou
annulée déplace la carte vers `review` ou `blocked` selon la même règle de synchronisation
que les sessions liées (voir [Synchronisation du cycle de vie des sessions](#session-lifecycle-sync)).

## Outils des agents

| Outil                                                                                                                                             | Objectif                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Répertorier des cartes compactes avec l'état de revendication/diagnostic ; filtre de tableau facultatif.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Renvoyer une carte avec un contexte d'agent borné (notes, tentatives, commentaires, liens, preuves, artefacts, résultats parents, travail récent de l'agent assigné, diagnostics actifs).                               |
| `workboard_create`                                                                                                                               | Créer une carte avec des parents, un locataire, des Skills, un tableau, des métadonnées d'espace de travail, une clé d'idempotence, une limite d'exécution et un budget de nouvelles tentatives facultatifs.                                                             |
| `workboard_link`                                                                                                                                 | Lier un parent à une carte enfant. Les enfants restent `todo` jusqu'à ce que chaque parent atteigne `done`, puis la promotion par répartition les fait passer à `ready`.                                                     |
| `workboard_claim`                                                                                                                                | Revendiquer une carte pour l'agent appelant ; fait passer `backlog`/`todo`/`ready` à `running`.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Actualiser le Heartbeat de la revendication pendant une exécution prolongée.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Libérer la revendication après l'achèvement, la mise en pause ou le transfert ; peut faire passer la carte à un nouvel état.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Outils structurés de cycle de vie pour les résumés finaux, les preuves, les artefacts et les manifestes des cartes créées (qui doivent référencer des cartes reliées à la carte achevée), ou pour les motifs de blocage.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Stocker de petites pièces jointes de carte dans l'état SQLite du Plugin, les indexer sur la carte et les exposer dans le contexte de l'agent.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Enregistrer les lignes de journal de l'agent et bloquer une carte lorsqu'un agent automatisé s'arrête sans appeler `workboard_complete`/`workboard_block`.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gérer les métadonnées persistantes du tableau (nom d'affichage, description, état d'archivage, espace de travail par défaut).                                                                                            |
| `workboard_runs`                                                                                                                                 | Renvoyer l'historique persistant des tentatives d'exécution d'une carte.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Transformer une carte sommaire de triage/liste de tâches en une carte `todo` clarifiée ; enregistre le résumé de la spécification sur la carte.                                                                                      |
| `workboard_decompose`                                                                                                                            | Décomposer une carte d'orchestration parente en cartes enfants liées, qui héritent des métadonnées de tableau/locataire ; peut achever la carte parente avec un manifeste des cartes créées.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gérer les abonnements aux notifications. La lecture des événements permet une relecture sûre ; `advance` déplace le curseur durable afin que les appelants reprennent sans perdre ni lire deux fois les événements de cartes achevées/échouées/obsolètes. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Inspecter les espaces de noms des tableaux et les statistiques des files d'attente.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Récupérer ou transférer les travaux bloqués.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Ajouter des notes de transfert ou joindre des références de preuves/artefacts.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Faire repasser le travail bloqué à `todo`.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Faire passer une carte à un autre état ; les cartes revendiquées exigent la portée de revendication d'agent de l'appelant.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Déclencher la promotion des dépendances ou le nettoyage des revendications obsolètes sans lancer d'agents ; le lancement des agents utilise la répartition par Gateway ou par commande à barre oblique.                                                        |

Les cartes revendiquées refusent les mutations effectuées par les outils d'agent provenant d'autres agents, sauf si l'appelant
détient le jeton de revendication renvoyé par `workboard_claim`. Chaque carte renvoyée par un
outil d'agent ou un appel RPC du Gateway masque `metadata.claim.token` sous la forme `[redacted]`
(le jeton lui-même n'est renvoyé qu'une seule fois, au niveau supérieur, uniquement par `workboard_claim`),
afin que les opérateurs du tableau de bord et les autres agents puissent inspecter l'état de la revendication sans jamais
voir de jeton utilisable. La récupération passe par
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, qui ne nécessitent pas
le jeton.

## Répartition

La répartition est locale au Gateway : elle ne lance pas de processus arbitraires du système d'exploitation. Les sessions
normales de sous-agents OpenClaw restent responsables de l'exécution. Une passe de répartition :

1. Promeut les cartes dont les dépendances sont prêtes.
2. Enregistre les métadonnées de répartition sur les cartes prêtes.
3. Bloque les revendications expirées ou les exécutions ayant dépassé le délai imparti.
4. Marque les cartes de triage configurées dans le tableau comme candidates à l'orchestration.
5. Revendique un petit lot de cartes prêtes et démarre les exécutions des agents via
   l'environnement d'exécution des sous-agents du Gateway.

Les agents reçoivent un contexte de carte borné ainsi que le jeton de revendication nécessaire pour envoyer un Heartbeat,
achever ou bloquer la carte au moyen des outils Workboard.

Les chemins d'espace de travail respectent les autorisations existantes de l'appelant sur le système de fichiers. Les clients du Gateway
avec `operator.write` peuvent utiliser les espaces de travail configurés des agents ;
les clients `operator.admin` peuvent utiliser d'autres extractions de l'hôte. Les outils d'agent en bac à sable utilisent
l'accès à l'espace de travail de leur bac à sable, tandis que les outils sans bac à sable limités à l'espace de travail utilisent leur
racine d'espace de travail configurée. Workboard enregistre cette autorisation lorsqu'un espace de travail est
assigné et la recoupe à nouveau avec l'autorisation actuelle de l'appelant lors de la répartition,
afin qu'une carte persistante ne puisse pas élargir l'accès d'un appelant ultérieur. Les anciennes cartes ayant un
espace de travail hôte explicite, mais aucune autorisation enregistrée, doivent avoir cet espace de travail
réenregistré avant une répartition sur l'ensemble de l'hôte ; les cartes sans chemin d'hôte adoptent
l'autorisation de l'appelant actuel lors de leur première répartition.

La répartition liée à un espace de travail n'accepte un répertoire ou une extraction Git que si la
racine de son dépôt correspond exactement à l'espace de travail de l'agent cible. Une demande d'arbre de travail
est limitée à ce répertoire et conservée comme espace de travail de type répertoire, afin que
l'hôte ne matérialise pas l'extraction et n'exécute pas le code de configuration du dépôt. L'
agent cible doit utiliser un bac à sable Docker accessible en écriture et non partagé pour cet
espace de travail précis, sans exécution avec privilèges élevés, sans substitutions persistantes d'exécution sur l'hôte/Node, ni
outils Plugin et MCP non classés. Workboard énumère ses outils enregistrés
au lieu de faire confiance à un préfixe `workboard_*`, et la répartition refuse un conteneur Docker
actif dont le hachage de montage/configuration en cours est obsolète. La répartition signale la
politique cible incompatible au lieu de démarrer un agent moins confiné.
La répartition sur l'ensemble de l'hôte peut cibler d'autres extractions locales et conserve la configuration normale
des arbres de travail gérés.

L'autorisation de l'espace de travail ne crée pas un second modèle d'autorisation pour le cycle de vie des cartes.
Les appelants autorisés à modifier les cartes Workboard peuvent les faire passer manuellement par les mêmes
états sur toutes les surfaces ; l'accès en lecture seule à l'espace de travail empêche uniquement la
répartition d'agents nécessitant des droits d'écriture.

### Sélection des agents

Chaque passe démarre **au maximum 3 agents par défaut**. Les cartes prêtes sont classées par
priorité, puis par position, puis par date de création. Une passe ne démarre qu'une seule carte par
propriétaire/agent et ignore les propriétaires qui ont déjà un travail en cours d'exécution ou en révision sur le
tableau. Les cartes archivées, les cartes ayant une revendication active et les cartes qui ne sont pas à l'état `ready`
ne sont jamais sélectionnées pour démarrer des agents (elles peuvent néanmoins être affectées par la
partie données de la répartition : nettoyage des revendications obsolètes, promotion des dépendances, nettoyage
des dépassements de délai).

Les clés de session sont déterministes pour chaque tableau/carte, de sorte que les répartitions répétées sont redirigées
vers la même file d'agent au lieu de créer des sessions sans lien :

- Cartes assignées : `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Cartes non assignées : `subagent:workboard-<boardId>-<cardId>` (le Gateway résout
  l'agent configuré par défaut)

Si un agent ne peut pas être démarré après la revendication d'une carte, Workboard bloque la
carte, efface la revendication, enregistre l'échec du démarrage de l'exécution et ajoute une ligne au
journal de l'agent, visible dans le tableau de bord, le JSON de la CLI, les outils d'agent et les
diagnostics de la carte.

### Points d'entrée

- Action de répartition depuis le tableau de bord
- `openclaw workboard dispatch`
- `/workboard dispatch` sur un canal prenant en charge les commandes

Les trois utilisent l’environnement d’exécution de sous-agent du Gateway lorsque le Gateway est disponible. La
CLI dispose d’une solution de repli pour l’opérateur : si l’appel au Gateway échoue avec une
erreur de connexion ou d’indisponibilité (ou une erreur `unknown method` pour les anciens
Gateways), qu’aucune cible explicite `--url`/`--token` ne s’applique et qu’aucun Gateway distant
(`OPENCLAW_GATEWAY_URL` ou `gateway.mode: remote`) n’est configuré, la CLI exécute une
répartition limitée aux données sur l’état SQLite local : elle peut promouvoir les dépendances,
nettoyer les revendications obsolètes et bloquer les exécutions ayant expiré, mais ne peut pas démarrer de processus de travail. Les échecs
d’authentification, d’autorisation et de validation provenant d’un Gateway accessible ne sont pas considérés
comme des indisponibilités ; ils sont signalés comme des erreurs de commande, de même que tout échec du Gateway
lorsqu’une cible explicite `--url`/`--token` a été indiquée.

Les métadonnées du tableau peuvent définir `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` et `orchestratorProfile`. OpenClaw enregistre cette intention et
l’expose dans le contexte du processus de travail ; la spécification et la décomposition effectives passent toujours
par les outils Workboard habituels.

## CLI et commande slash

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La sortie texte de `list` masque les cartes archivées par défaut (`--include-archived`
remplace ce comportement) ; `--json` inclut toujours les cartes archivées, conformément au contrat de carte complète
utilisé par les scripts existants. `show` et `move` acceptent un préfixe d’identifiant
non ambigu. `list`, `create`, `show` et `move` lisent et écrivent toujours directement
l’état local du plugin. Seul `dispatch` appelle le Gateway en cours d’exécution, avec la solution de repli
décrite ci-dessus.

Consultez [CLI Workboard](/fr/cli/workboard) pour connaître tous les indicateurs, la sortie JSON, le comportement de repli
du Gateway, la gestion des préfixes d’identifiant, les règles de sélection de la répartition et
le dépannage.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` et `/workboard dispatch` reproduisent
la CLI. La liste et l’affichage sont des opérations de lecture accessibles à tout expéditeur de commande autorisé.
La création, le déplacement et la répartition nécessitent le statut de propriétaire sur les interfaces de discussion, ou un client
Gateway disposant de `operator.write`/`operator.admin`. Les déplacements manuels effectués par l’opérateur utilisent le
même comportement de remplacement des revendications que le glisser-déposer du tableau de bord. Leur accès à l’arborescence de travail
respecte toujours la même limite d’espace de travail décrite ci-dessus.

## Synchronisation du cycle de vie des sessions

Les cartes peuvent être associées à une session existante du tableau de bord, ou à une session créée lorsque vous
démarrez le travail depuis la carte. Les cartes associées affichent directement le cycle de vie de la session :
en cours d’exécution, obsolète, associée et inactive, terminée, en échec ou manquante. Vous pouvez également capturer une
session existante depuis l’onglet Sessions avec **Ajouter à Workboard** ; la carte
est associée à cette session, utilise le libellé de la session ou l’invite utilisateur récente comme titre,
et initialise les notes à partir de l’invite utilisateur récente et de la dernière réponse de l’assistant
lorsqu’elles sont disponibles.

Si la session associée devient introuvable, la carte reste associée pour conserver le contexte et
propose toujours des commandes de démarrage permettant de recommencer dans une nouvelle session. Si une session
associée active cesse de signaler une activité récente, Workboard marque la carte
`stale` et stocke cet état dans les métadonnées jusqu’à ce que le cycle de vie l’efface.

Lorsqu’une carte se trouve dans un état de travail actif, Workboard suit la session associée :

| État de la session associée           | Statut de la carte |
| ------------------------------------- | ------------------ |
| active                                | `running`   |
| terminée                              | `review`    |
| en échec, arrêtée, expirée ou annulée | `blocked`   |

**Les états de révision manuelle prévalent.** Le déplacement d’une carte vers `review`, `blocked` ou `done`
arrête la synchronisation automatique de cette carte jusqu’à ce que vous la replaciez dans `todo` ou `running`.

Le démarrage d’une carte utilise les sessions normales du Gateway ; Workboard stocke uniquement les
métadonnées et les associations de la carte. La transcription de la conversation, la sélection du modèle et le
cycle de vie de l’exécution restent gérés par le système de sessions habituel. Utilisez **Arrêter** sur une carte
associée active pour interrompre l’exécution en cours : Workboard marque cette carte `blocked` afin
qu’elle reste visible pour le suivi.

Les nouvelles cartes peuvent démarrer à partir de modèles Workboard (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`). Les modèles préremplissent le titre, les notes, les libellés et la priorité ;
l’identifiant du modèle est stocké dans les métadonnées de la carte.

## Flux de travail du tableau de bord

1. Ouvrez l’onglet Workboard dans l’interface de contrôle.
2. Créez une carte avec un titre, des notes, une priorité, des libellés, un agent facultatif et
   une session associée facultative, ou ouvrez Sessions et choisissez **Ajouter à Workboard**
   pour une session existante.
3. Faites glisser la carte d’une colonne à l’autre, ou placez le focus sur son contrôle compact de statut et utilisez
   le menu ou ArrowLeft/ArrowRight. Pendant le déplacement, la carte source s’estompe et
   les colonnes de destination disponibles sont entourées d’un contour.
4. Démarrez le travail depuis la carte pour créer ou réutiliser une session du tableau de bord.
5. Ouvrez la session associée depuis la carte pendant que l’agent travaille.
6. Laissez la synchronisation du cycle de vie déplacer le travail en cours vers `review`/`blocked`, puis déplacez manuellement
   la carte vers `done` après acceptation.

## Diagnostics

Les diagnostics sont calculés à partir des métadonnées locales des cartes. Les contrôles intégrés signalent :

| Type                        | Condition                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Carte `todo`/`backlog`/`ready` attribuée et non mise à jour depuis plus de 1 heure.             |
| `running_without_heartbeat` | Carte `running` sans Heartbeat de revendication ni mise à jour d’exécution depuis plus de 20 minutes. |
| `blocked_too_long`          | Carte `blocked` non mise à jour depuis plus de 24 heures.                                   |
| `repeated_failures`         | Le nombre d’échecs suivis de la carte atteint 2 ou plus.                                |
| `missing_proof`             | Carte `done` sans preuve, artefact ni pièce jointe.                          |
| `orphaned_session`          | Carte `running` avec un `sessionKey`, mais sans métadonnées `execution`.                |

## Autorisations

Les méthodes RPC du Gateway se trouvent sous `workboard.*` :

| Portée            | Méthodes                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, liste/récupération des pièces jointes, lecture des événements de notification, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, création/mise à jour/déplacement/suppression/commentaire/association/linkDependency/preuve/artefact, ajout/suppression de pièces jointes, journal du processus de travail, violation de protocole, revendication/Heartbeat/libération/promotion/réattribution/récupération/achèvement/blocage/déblocage, `cards.dispatch`, `cards.bulk`, archivage, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, abonnement/suppression/avancement des notifications |

Aucune méthode RPC ne nécessite `operator.admin`. Les navigateurs connectés avec un accès
opérateur en lecture seule peuvent consulter le tableau, mais ne peuvent pas modifier les cartes. Une portée d’administration
élargit les chemins d’hôte Workboard acceptés ; elle ne modifie pas les méthodes disponibles.

## Stockage

Workboard stocke les données durables dans une base de données relationnelle SQLite appartenant au plugin
sous le répertoire d’état d’OpenClaw : les tableaux, cartes, libellés, événements de cycle de vie,
tentatives d’exécution, commentaires, liens de dépendance, preuves, références d’artefacts,
métadonnées et objets binaires des pièces jointes, diagnostics, notifications, journaux des processus de travail,
état du protocole et abonnements se trouvent tous dans les tables Workboard (et non dans
des entrées clé-valeur du plugin). Une exportation de carte conserve le récit du tableau
sans incorporer le contenu binaire des pièces jointes.

Les installations qui utilisaient Workboard dans la version `.28` peuvent exécuter
`openclaw doctor --fix` pour migrer les espaces de noms historiques de l’état du plugin livré
(`workboard.cards`, `workboard.boards`, `workboard.notify` et, s’il est présent,
`workboard.attachments`) vers la base de données relationnelle.

## Dépannage

**L’onglet indique que Workboard n’est pas disponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` est configuré, ajoutez-y `workboard`. Si `plugins.deny`
contient `workboard`, supprimez-le avant d’activer le plugin.

**Les cartes ne sont pas enregistrées**

Vérifiez que la connexion du navigateur dispose de l’accès `operator.write`. Les sessions d’opérateur
en lecture seule peuvent répertorier les cartes, mais ne peuvent ni les créer, ni les modifier, ni les déplacer, ni les supprimer.

**Le démarrage d’une carte n’ouvre pas la session attendue**

Vérifiez l’identifiant d’agent de la carte et la session associée, puis ouvrez Sessions ou Chat pour
examiner l’état réel de l’exécution.

**La répartition ne démarre pas de processus de travail**

Vérifiez qu’il existe au moins une carte `ready` sans revendication active :

```bash
openclaw workboard list --status ready
```

Si la CLI signale une répartition limitée aux données, démarrez ou redémarrez le Gateway et
réessayez : la répartition limitée aux données met à jour l’état local du tableau, mais ne peut pas démarrer
les exécutions des processus de travail des sous-agents. Des cartes peuvent également être ignorées lorsqu’une autre carte du
même propriétaire ou agent est déjà en cours d’exécution ou en attente de révision ; terminez,
bloquez ou libérez ce travail actif avant d’en répartir davantage pour le même
propriétaire.

## Voir aussi

- [Interface de contrôle](/fr/web/control-ui)
- [CLI Workboard](/fr/cli/workboard)
- [Plugins](/fr/tools/plugin)
- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Sessions](/fr/concepts/session)
