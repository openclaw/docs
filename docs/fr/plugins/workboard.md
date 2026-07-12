---
read_when:
    - Vous souhaitez un tableau de travail de type Kanban dans l’interface de contrôle.
    - Vous activez ou désactivez le plugin Workboard intégré
    - Vous souhaitez suivre le travail planifié de l’agent sans gestionnaire de projet externe
summary: Tableau de suivi optionnel pour les cartes gérées par les agents et le transfert de session
title: Plugin Workboard
x-i18n:
    generated_at: "2026-07-12T03:12:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Le plugin Workboard ajoute un tableau facultatif de type Kanban à
[l’interface de contrôle](/fr/web/control-ui) : des cartes de travail dimensionnées pour les agents, leur attribution aux agents,
ainsi qu’un lien vers la tâche, l’exécution et la session du tableau de bord associées à la carte.

Workboard est volontairement simple : il suit le travail opérationnel local d’un
Gateway OpenClaw. Il ne remplace pas GitHub Issues, Linear, Jira ni
les autres systèmes de gestion de projet en équipe.

## L’activer

Workboard est fourni avec OpenClaw, mais désactivé par défaut :

1. Ouvrez **Plugins** dans l’interface de contrôle, ou utilisez `/settings/plugins` relativement au
   chemin de base configuré de l’interface de contrôle. Par exemple, avec `/openclaw`
   comme chemin de base, utilisez `/openclaw/settings/plugins`.
2. Recherchez **Workboard** et choisissez **Activer**. Comme Workboard est inclus avec
   OpenClaw, aucune action **Installer** n’est nécessaire.
3. Si l’interface indique qu’un redémarrage est requis, redémarrez le Gateway.

L’onglet Workboard apparaît dans la navigation du tableau de bord après le chargement de l’environnement d’exécution du plugin.
Lorsqu’il est désactivé, l’onglet reste masqué dans la navigation. Si vous ouvrez
directement la route `/workboard` alors que le plugin est désactivé ou bloqué par
`plugins.allow`/`plugins.deny`, un état indiquant que le plugin est indisponible s’affiche à la place des données
des cartes.

Le flux de travail CLI équivalent est le suivant :

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Configuration

Workboard ne possède aucune configuration propre au plugin. Activez-le ou désactivez-le au moyen de l’entrée
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

| Champ          | Valeurs                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `status`       | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                                  |
| `priority`     | `low`, `normal`, `high`, `urgent`                                                                                          |
| `labels`       | chaînes de forme libre                                                                                                     |
| `agentId`      | agent attribué facultatif                                                                                                  |
| références liées | tâche, exécution, session ou URL source facultative                                                                        |
| `execution`    | métadonnées facultatives d’une exécution Codex/Claude démarrée depuis la carte (moteur, mode, modèle, session, identifiant d’exécution, état) |

Les cartes contiennent également des métadonnées compactes sur les tentatives, commentaires, liens, preuves,
artefacts, paramètres d’automatisation, pièces jointes, journaux des workers, état du protocole
des workers, revendications, diagnostics, notifications, identifiant de modèle, état d’archivage et
détection des sessions obsolètes, ainsi qu’une liste des événements récents (`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`). Ces métadonnées permettent à un
opérateur de voir comment une carte a progressé sur le tableau sans ouvrir la
session liée ; elles constituent un contexte opérationnel local et ne remplacent pas les transcriptions
de session ni l’historique des issues GitHub.

Les cartes sont stockées dans l’état Gateway propre au plugin et sont déplacées avec le reste
de l’état OpenClaw de ce Gateway (voir [Stockage](#storage)).

## Démarrer un travail depuis une carte

Les cartes non liées peuvent démarrer directement un travail :

- **Exécuter Codex** / **Exécuter Claude** démarre une exécution d’agent suivie par une tâche avec un
  moteur explicite, envoie l’invite de la carte et marque la carte comme `running`. Les exécutions Codex
  utilisent `openai/gpt-5.6-sol` ; les exécutions Claude utilisent `anthropic/claude-sonnet-4-6`.
- **Ouvrir Codex** / **Ouvrir Claude** crée une session de tableau de bord liée sans
  envoyer l’invite de la carte ni déplacer celle-ci, pour un travail manuel qui reste
  attaché au tableau.

Les démarrages autonomes utilisent le chemin d’exécution d’agent suivi par une tâche du Gateway (agent
et modèle par défaut, sauf si Codex ou Claude est choisi explicitement) ; Workboard lie ensuite
la tâche obtenue, l’identifiant d’exécution et la clé de session à la carte. Chaque
exécution liée enregistre également un résumé de tentative (moteur, mode, modèle, identifiant d’exécution,
horodatages, état, nombre cumulatif d’échecs) afin que les échecs répétés restent visibles.

Le tableau de bord actualise l’état des tâches depuis le registre des tâches du Gateway, en faisant correspondre
les tâches aux cartes selon l’identifiant de tâche, l’identifiant d’exécution ou la clé de session liée. Une tâche en file d’attente ou en cours d’exécution
maintient le cycle de vie de la carte actif ; une tâche terminée, ayant échoué, ayant dépassé le délai imparti ou
annulée déplace la carte vers `review` ou `blocked` selon la même règle de synchronisation
que les sessions liées (voir [Synchronisation du cycle de vie des sessions](#session-lifecycle-sync)).

## Outils des agents

| Outil                                                                                                                                            | Objectif                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Répertorie des cartes compactes avec leur état de revendication/diagnostic ; filtre facultatif par tableau.                                                                                                           |
| `workboard_read`                                                                                                                                 | Renvoie une carte avec un contexte de travailleur limité (notes, tentatives, commentaires, liens, preuves, artefacts, résultats parents, travaux récents de la personne assignée, diagnostics actifs).                  |
| `workboard_create`                                                                                                                               | Crée une carte avec, facultativement, des parents, un locataire, des Skills, un tableau, des métadonnées d’espace de travail, une clé d’idempotence, une limite d’exécution et un budget de nouvelles tentatives.      |
| `workboard_link`                                                                                                                                 | Lie une carte parente à une carte enfant. Les enfants restent à l’état `todo` jusqu’à ce que tous les parents atteignent `done`, puis leur promotion par la répartition les fait passer à `ready`.                     |
| `workboard_claim`                                                                                                                                | Revendique une carte pour l’agent appelant ; fait passer `backlog`/`todo`/`ready` à `running`.                                                                                                                         |
| `workboard_heartbeat`                                                                                                                            | Actualise le Heartbeat de la revendication pendant une exécution prolongée.                                                                                                                                           |
| `workboard_release`                                                                                                                              | Libère la revendication après l’achèvement, la mise en pause ou le transfert ; peut faire passer la carte à un nouvel état.                                                                                            |
| `workboard_complete` / `workboard_block`                                                                                                         | Outils structurés de cycle de vie pour les résumés finaux, les preuves, les artefacts et les manifestes de cartes créées (qui doivent référencer des cartes reliées à la carte achevée), ou les motifs de blocage.     |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Stocke de petites pièces jointes de carte dans l’état SQLite du Plugin, les indexe sur la carte et les expose dans le contexte du travailleur.                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Enregistre les lignes du journal du travailleur et bloque une carte lorsqu’un travailleur automatisé s’arrête sans appeler `workboard_complete`/`workboard_block`.                                                     |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Gère les métadonnées persistantes du tableau (nom d’affichage, description, état d’archivage, espace de travail par défaut).                                                                                           |
| `workboard_runs`                                                                                                                                 | Renvoie l’historique persistant des tentatives d’exécution d’une carte.                                                                                                                                                |
| `workboard_specify`                                                                                                                              | Transforme une carte sommaire de triage/backlog en carte `todo` clarifiée ; enregistre le résumé de la spécification sur la carte.                                                                                     |
| `workboard_decompose`                                                                                                                            | Décompose une carte d’orchestration parente en enfants liés, qui héritent des métadonnées de tableau/locataire ; peut achever le parent avec un manifeste des cartes créées.                                           |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Gère les abonnements aux notifications. La lecture des événements permet une relecture sûre ; `advance` déplace le curseur durable afin que les appelants reprennent sans perdre ni relire les événements de cartes terminées, échouées ou obsolètes. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Examine les espaces de noms des tableaux et les statistiques des files d’attente.                                                                                                                                     |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Récupère ou transfère les travaux bloqués.                                                                                                                                                                             |
| `workboard_comment` / `workboard_proof`                                                                                                          | Ajoute des notes de transfert ou joint des références de preuves/artefacts.                                                                                                                                            |
| `workboard_unblock`                                                                                                                              | Replace les travaux bloqués à l’état `todo`.                                                                                                                                                                           |
| `workboard_dispatch`                                                                                                                             | Déclenche la promotion des dépendances ou le nettoyage des revendications obsolètes.                                                                                                                                   |

Les cartes revendiquées refusent les modifications effectuées par les outils d’agent d’autres agents, sauf si l’appelant
détient le jeton de revendication renvoyé par `workboard_claim`. Chaque carte renvoyée par un
outil d’agent ou un appel RPC du Gateway masque `metadata.claim.token` par `[redacted]`
(le jeton lui-même n’est renvoyé qu’une fois, au niveau supérieur, uniquement par `workboard_claim`),
afin que les opérateurs du tableau de bord et les autres agents puissent examiner l’état de la revendication sans jamais
voir un jeton utilisable. La récupération passe par
`workboard_promote`/`workboard_reassign`/`workboard_reclaim`, qui ne
nécessitent pas le jeton.

## Répartition

La répartition est locale au Gateway : elle ne lance pas de processus arbitraires du système d’exploitation. Les sessions
de sous-agents OpenClaw normales restent responsables de l’exécution. Un passage de répartition :

1. Fait passer les cartes dont les dépendances sont satisfaites à l’état prêt.
2. Enregistre les métadonnées de répartition sur les cartes prêtes.
3. Bloque les revendications expirées ou les exécutions ayant dépassé le délai.
4. Marque les cartes de triage configurées par le tableau comme candidates à l’orchestration.
5. Revendique un petit lot de cartes prêtes et démarre les exécutions des travailleurs via
   l’environnement d’exécution des sous-agents du Gateway.

Les travailleurs reçoivent un contexte de carte limité ainsi que le jeton de revendication nécessaire pour envoyer un Heartbeat,
achever ou bloquer la carte au moyen des outils Workboard.

### Sélection des travailleurs

Chaque passage démarre **au maximum 3 travailleurs par défaut**. Les cartes prêtes sont classées par
priorité, puis par position, puis par date de création. Un passage ne démarre qu’une carte par
propriétaire/agent et ignore les propriétaires qui ont déjà un travail en cours ou en révision sur le
tableau. Les cartes archivées, les cartes avec une revendication active et les cartes qui ne sont pas à l’état `ready`
ne sont jamais sélectionnées pour démarrer des travailleurs (elles peuvent néanmoins être affectées par la
partie données de la répartition : nettoyage des revendications obsolètes, promotion des dépendances, nettoyage des
dépassements de délai).

Les clés de session sont déterministes pour chaque tableau/carte, de sorte que les répartitions répétées soient
redirigées vers la même voie de travail au lieu de créer des sessions sans rapport :

- Cartes assignées : `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Cartes non assignées : `subagent:workboard-<boardId>-<cardId>` (le Gateway résout
  l’agent par défaut configuré)

Si un travailleur ne peut pas être démarré après la revendication d’une carte, Workboard bloque la
carte, efface la revendication, enregistre l’échec de démarrage de l’exécution et ajoute une ligne au
journal du travailleur, visible dans le tableau de bord, le JSON de la CLI, les outils d’agent et les
diagnostics de la carte.

### Points d’entrée

- Action de répartition du tableau de bord
- `openclaw workboard dispatch`
- `/workboard dispatch` sur un canal prenant en charge les commandes

Les trois utilisent l’environnement d’exécution des sous-agents du Gateway lorsque celui-ci est disponible. La
CLI dispose d’une solution de repli pour l’opérateur : si l’appel au Gateway échoue en raison d’une
erreur de connexion/indisponibilité (ou d’une erreur `unknown method` pour les anciens
Gateways), qu’aucune cible explicite `--url`/`--token` n’a été définie et qu’aucun Gateway distant
configuré (`OPENCLAW_GATEWAY_URL` ou `gateway.mode: remote`) ne s’applique, la CLI exécute
une répartition limitée aux données sur l’état SQLite local : elle peut promouvoir les dépendances,
nettoyer les revendications obsolètes et bloquer les exécutions ayant dépassé le délai, mais ne peut pas démarrer de travailleurs. Les échecs
d’authentification, d’autorisation et de validation provenant d’un Gateway accessible ne sont pas considérés
comme des indisponibilités ; ils sont signalés comme des erreurs de commande, tout comme tout échec du Gateway
lorsqu’une cible explicite `--url`/`--token` a été fournie.

Les métadonnées du tableau peuvent définir `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` et `orchestratorProfile`. OpenClaw enregistre cette intention et
l’expose dans le contexte du travailleur ; la spécification/décomposition effective s’effectue toujours
au moyen des outils Workboard normaux.

## CLI et commande oblique

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

La sortie texte de `list` masque les cartes archivées par défaut (`--include-archived`
annule ce comportement) ; `--json` inclut toujours les cartes archivées, conformément au contrat de carte complète
utilisé par les scripts existants. `show` accepte un préfixe d’identifiant non ambigu.
`list`, `create` et `show` lisent/écrivent toujours directement l’état local du Plugin.
Seul `dispatch` appelle le Gateway en cours d’exécution, avec la solution de repli décrite ci-dessus.

Consultez [CLI Workboard](/fr/cli/workboard) pour connaître tous les indicateurs, la sortie JSON, le comportement de
repli du Gateway, la gestion des préfixes d’identifiant, les règles de sélection de la répartition et le
dépannage.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`
et `/workboard dispatch` reproduisent le fonctionnement de la CLI. La liste et l’affichage sont des opérations de lecture
accessibles à tout expéditeur de commande autorisé. La création et la répartition nécessitent le statut de propriétaire sur
les interfaces de discussion, ou un client Gateway disposant de `operator.write`/`operator.admin`.

## Synchronisation du cycle de vie des sessions

Les cartes peuvent être liées à une session existante du tableau de bord, ou à une session créée lorsque vous commencez à travailler depuis la carte. Les cartes liées affichent directement le cycle de vie de la session : en cours d’exécution, obsolète, liée inactive, terminée, en échec ou manquante. Vous pouvez également récupérer une session existante depuis l’onglet Sessions avec **Ajouter au Workboard** ; la carte est liée à cette session, utilise comme titre le libellé de la session ou la récente invite utilisateur, et préremplit les notes à partir de cette invite et de la dernière réponse de l’assistant lorsqu’elles sont disponibles.

Si la session liée devient introuvable, la carte reste liée afin de conserver le contexte et propose toujours des commandes de démarrage permettant de relancer le travail dans une nouvelle session. Si une session liée active cesse de signaler une activité récente, Workboard marque la carte comme `stale` et conserve cette information dans les métadonnées jusqu’à ce que le cycle de vie l’efface.

Lorsqu’une carte est dans un état de travail actif, Workboard suit la session liée :

| État de la session liée                      | Statut de la carte |
| -------------------------------------------- | ------------------ |
| active                                       | `running`          |
| terminée                                     | `review`           |
| en échec, arrêtée, expirée ou abandonnée     | `blocked`          |

**Les états de révision manuels sont prioritaires.** Le déplacement d’une carte vers `review`, `blocked` ou `done` interrompt sa synchronisation automatique jusqu’à ce que vous la replaciez dans `todo` ou `running`.

Le démarrage d’une carte utilise des sessions Gateway normales ; Workboard stocke uniquement les métadonnées et les liens de la carte. La transcription de la conversation, la sélection du modèle et le cycle de vie de l’exécution restent gérés par le système de sessions habituel. Utilisez **Arrêter** sur une carte liée active pour abandonner l’exécution en cours ; Workboard marque alors cette carte comme `blocked` afin qu’elle reste visible pour le suivi.

Les nouvelles cartes peuvent être créées à partir de modèles Workboard (`bugfix`, `docs`, `release`, `pr_review`, `plugin`). Les modèles préremplissent le titre, les notes, les libellés et la priorité ; l’identifiant du modèle est stocké dans les métadonnées de la carte.

## Flux de travail du tableau de bord

1. Ouvrez l’onglet Workboard dans l’interface de contrôle.
2. Créez une carte avec un titre, des notes, une priorité, des libellés, éventuellement un agent et une session liée, ou ouvrez Sessions et choisissez **Ajouter au Workboard** pour une session existante.
3. Faites glisser la carte entre les colonnes, ou placez le focus sur son contrôle d’état compact et utilisez le menu ou ArrowLeft/ArrowRight.
4. Commencez le travail depuis la carte afin de créer ou de réutiliser une session du tableau de bord.
5. Ouvrez la session liée depuis la carte pendant que l’agent travaille.
6. Laissez la synchronisation du cycle de vie déplacer le travail en cours vers `review`/`blocked`, puis déplacez manuellement la carte vers `done` lorsqu’il est accepté.

## Diagnostics

Les diagnostics sont calculés à partir des métadonnées locales des cartes. Les vérifications intégrées signalent :

| Type                        | Condition                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `stranded_ready`            | Carte attribuée avec l’état `todo`/`backlog`/`ready`, non mise à jour depuis plus d’une heure.                     |
| `running_without_heartbeat` | Carte `running` sans Heartbeat de réservation ni mise à jour d’exécution depuis plus de 20 minutes.               |
| `blocked_too_long`          | Carte `blocked` non mise à jour depuis plus de 24 heures.                                                         |
| `repeated_failures`         | Le nombre d’échecs suivis de la carte atteint 2 ou plus.                                                          |
| `missing_proof`             | Carte `done` sans preuve, artefact ni pièce jointe.                                                               |
| `orphaned_session`          | Carte `running` avec une `sessionKey`, mais sans métadonnées `execution`.                                         |

## Autorisations

Les méthodes RPC du Gateway se trouvent sous `workboard.*` :

| Portée           | Méthodes                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, liste/récupération des pièces jointes, lecture des événements de notification, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                         |
| `operator.write` | `cards.diagnostics.refresh`, création/mise à jour/déplacement/suppression/commentaire/liaison/liaison de dépendance/preuve/artefact, ajout/suppression de pièces jointes, journal du worker, violation de protocole, réservation/Heartbeat/libération/promotion/réattribution/récupération/achèvement/blocage/déblocage, `cards.dispatch`, `cards.bulk`, archivage, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, abonnement/suppression/progression des notifications |

Aucune méthode RPC ne nécessite `operator.admin`. Les navigateurs connectés avec un accès opérateur en lecture seule peuvent consulter le tableau, mais ne peuvent pas modifier les cartes.

## Stockage

Workboard stocke les données durables dans une base de données relationnelle SQLite appartenant au Plugin, sous le répertoire d’état d’OpenClaw : tableaux, cartes, libellés, événements du cycle de vie, tentatives d’exécution, commentaires, liens de dépendance, preuves, références d’artefacts, métadonnées et données binaires des pièces jointes, diagnostics, notifications, journaux des workers, état du protocole et abonnements résident tous dans les tables de Workboard, et non dans des entrées clé-valeur du Plugin. L’exportation d’une carte préserve le récit du tableau sans incorporer le contenu binaire des pièces jointes.

Les installations ayant utilisé Workboard dans la version `.28` peuvent exécuter `openclaw doctor --fix` afin de migrer vers la base de données relationnelle les espaces de noms historiques de l’état du Plugin livrés avec cette version (`workboard.cards`, `workboard.boards`, `workboard.notify` et, le cas échéant, `workboard.attachments`).

## Dépannage

**L’onglet indique que Workboard est indisponible**

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` est configuré, ajoutez-y `workboard`. Si `plugins.deny` contient `workboard`, supprimez-le avant d’activer le Plugin.

**Les cartes ne sont pas enregistrées**

Vérifiez que la connexion du navigateur dispose de l’accès `operator.write`. Les sessions opérateur en lecture seule peuvent répertorier les cartes, mais ne peuvent pas les créer, les modifier, les déplacer ni les supprimer.

**Le démarrage d’une carte n’ouvre pas la session attendue**

Vérifiez l’identifiant de l’agent et la session liée de la carte, puis ouvrez Sessions ou Chat afin d’examiner l’état réel de l’exécution.

**La distribution ne démarre pas de worker**

Vérifiez qu’il existe au moins une carte `ready` sans réservation active :

```bash
openclaw workboard list --status ready
```

Si la CLI signale une distribution limitée aux données, démarrez ou redémarrez le Gateway, puis réessayez : une distribution limitée aux données met à jour l’état local du tableau, mais ne peut pas démarrer les exécutions des workers sous-agents. Des cartes peuvent également être ignorées lorsqu’une autre carte du même propriétaire ou agent est déjà en cours d’exécution ou en attente de révision ; terminez, bloquez ou libérez ce travail actif avant d’en distribuer davantage au même propriétaire.

## Voir aussi

- [Interface de contrôle](/fr/web/control-ui)
- [CLI Workboard](/fr/cli/workboard)
- [Plugins](/fr/tools/plugin)
- [Gérer les Plugins](/fr/plugins/manage-plugins)
- [Sessions](/fr/concepts/session)
