---
read_when:
    - Vous voulez un tableau de travail de style Kanban dans l’interface utilisateur de contrôle
    - Vous activez ou désactivez le plugin Workboard intégré
    - Vous souhaitez suivre le travail d’agent planifié sans outil externe de gestion de projet
summary: Tableau de travail optionnel du tableau de bord pour les cartes détenues par l’agent et le transfert de session
title: Plugin Workboard
x-i18n:
    generated_at: "2026-06-27T18:02:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Le Plugin Workboard ajoute un tableau optionnel de style Kanban à la
[Control UI](/fr/web/control-ui). Utilisez-le pour collecter des cartes de travail
dimensionnées pour les agents, les attribuer à des agents et suivre la tâche en
arrière-plan liée, l’exécution et la session de tableau de bord depuis une seule
carte.

Workboard est volontairement réduit. Il suit le travail opérationnel local pour
un Gateway OpenClaw ; il ne remplace pas GitHub Issues, Linear, Jira ni d’autres
systèmes de gestion de projet d’équipe.

## État par défaut

Workboard est un Plugin groupé et il est désactivé par défaut, sauf si vous
l’activez dans la configuration des Plugins.

Activez-le avec :

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Puis ouvrez le tableau de bord :

```bash
openclaw dashboard
```

L’onglet Workboard apparaît dans la navigation du tableau de bord. Si l’onglet
est visible mais que le Plugin est désactivé ou bloqué par `plugins.allow` /
`plugins.deny`, la vue affiche un état de Plugin indisponible au lieu des
données de cartes locales.

## Ce que contiennent les cartes

Chaque carte stocke :

- un titre et des notes
- un statut : `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` ou `done`
- une priorité : `low`, `normal`, `high` ou `urgent`
- des libellés
- un identifiant d’agent optionnel
- une tâche, une exécution, une session ou une URL source liée optionnelle
- des métadonnées d’exécution optionnelles pour une exécution Codex ou Claude
  démarrée depuis la carte
- des métadonnées compactes pour les tentatives, commentaires, liens, preuves,
  artefacts, automatisation, pièces jointes, journaux de workers, état de
  protocole de worker, revendications, diagnostics, notifications, modèles,
  état d’archive et détection de session périmée
- des événements récents de carte, comme des changements de création,
  déplacement, liaison, revendication, Heartbeat, tentative, preuve, artefact,
  diagnostic, notification, répartition, archive, obsolescence ou mise à jour
  par l’agent

Les cartes sont stockées dans l’état Gateway du Plugin. Elles sont locales au
répertoire d’état du Gateway et se déplacent avec le reste de l’état OpenClaw de
ce Gateway.

Workboard conserve des métadonnées compactes par carte afin que les opérateurs
puissent voir comment une carte a circulé dans le tableau sans ouvrir la session
liée. Les événements, résumés de tentatives, extraits de preuve, liens associés,
commentaires, marqueurs d’archive et marqueurs de session périmée sont
volontairement des métadonnées locales ; ils ne remplacent pas les transcriptions
de session ni l’historique des issues GitHub.

## Exécutions de cartes et tâches

Les cartes non liées peuvent démarrer un travail depuis la carte. Les démarrages
autonomes utilisent le chemin d’exécution d’agent suivi par tâche du Gateway,
puis Workboard relie la tâche obtenue, l’identifiant d’exécution et la clé de
session à la carte. Le démarrage utilise l’agent et le modèle par défaut
configurés du Gateway. Les actions Codex et Claude sont des choix de modèle
explicites optionnels :

- Run Codex ou Run Claude démarre une exécution d’agent adossée à une tâche,
  envoie le prompt de la carte et marque la carte `running`.
- Open Codex ou Open Claude crée une session de tableau de bord liée sans
  envoyer le prompt de la carte ni déplacer la carte, afin que vous puissiez
  travailler manuellement tout en la gardant attachée au tableau.

Les métadonnées d’exécution stockent sur la carte le moteur sélectionné, le
mode, la référence de modèle, la clé de session, l’identifiant d’exécution,
l’identifiant de tâche lorsqu’il est disponible et l’état de cycle de vie. Les
exécutions Codex utilisent `openai/gpt-5.5` ; les exécutions Claude utilisent
`anthropic/claude-sonnet-4-6`.

Chaque exécution liée enregistre aussi un résumé de tentative dans le même
enregistrement de carte. Le résumé de tentative conserve le moteur, le mode, le
modèle, l’identifiant d’exécution, les horodatages, le statut et le nombre
glissant d’échecs afin que les échecs répétés restent visibles sur le tableau.

Le tableau de bord actualise le statut des tâches depuis le registre des tâches
du Gateway et associe les tâches aux cartes par identifiant de tâche,
identifiant d’exécution ou clé de session liée. Si une tâche est en file
d’attente ou en cours d’exécution, le cycle de vie de la carte affiche l’état
actif de la tâche. Si la tâche se termine, échoue, expire ou est annulée, le
cycle de vie de la carte évolue vers le statut de revue ou de blocage avec la
même synchronisation de cycle de vie que les sessions liées.

## Coordination des agents

Workboard expose également des outils d’agent optionnels pour les workflows
tenant compte du tableau :

- `workboard_list` liste des cartes compactes avec l’état de revendication et
  de diagnostic, avec un filtre de tableau optionnel.
- `workboard_read` renvoie une carte ainsi qu’un contexte de worker borné
  construit à partir des notes, tentatives, commentaires, liens, preuves,
  artefacts, résultats parents, travaux récents de l’assigné et diagnostics
  actifs.
- `workboard_create` crée une carte avec parents, tenant, Skills, tableau,
  métadonnées d’espace de travail, clé d’idempotence, limite d’exécution et
  budget de relance optionnels.
- `workboard_link` lie une carte parente à une carte enfant. Les enfants restent
  dans `todo` jusqu’à ce que chaque parent atteigne `done` ; la promotion par
  répartition les déplace alors vers `ready`.
- `workboard_claim` revendique une carte pour l’agent appelant et déplace les
  cartes en backlog, todo ou prêtes vers `running`.
- `workboard_heartbeat` actualise le Heartbeat de revendication pendant les
  exécutions plus longues.
- `workboard_release` libère la revendication après achèvement, pause ou
  transfert et peut déplacer la carte vers un statut suivant.
- `workboard_complete` et `workboard_block` sont des outils structurés de cycle
  de vie pour les résumés finaux, preuves, artefacts, manifestes de cartes
  créées et raisons de blocage. Les manifestes de cartes créées doivent
  référencer des cartes liées à la carte terminée, ce qui exclut les enfants
  fantômes des résumés.
- `workboard_attachment_add`, `workboard_attachment_read` et
  `workboard_attachment_delete` stockent de petites pièces jointes de carte dans
  l’état SQLite du Plugin, les indexent sur la carte et les exposent dans le
  contexte du worker.
- `workboard_worker_log` et `workboard_protocol_violation` enregistrent les
  lignes de journal de worker et bloquent les cartes lorsqu’un worker automatisé
  s’arrête sans appeler `workboard_complete` ou `workboard_block`.
- `workboard_board_create`, `workboard_board_archive` et
  `workboard_board_delete` gèrent les métadonnées persistées de tableau, comme
  le nom d’affichage, la description, l’état d’archive et l’espace de travail
  par défaut.
- `workboard_runs` renvoie l’historique persistant des tentatives d’exécution
  stocké sur une carte.
- `workboard_specify` transforme une carte approximative de triage ou de
  backlog en carte `todo` clarifiée et enregistre le résumé de spécification sur
  la carte.
- `workboard_decompose` répartit une carte parente d’orchestration en enfants
  liés, hérite des métadonnées de tableau et de tenant, et peut terminer le
  parent avec un manifeste de cartes créées.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` et
  `workboard_notify_unsubscribe` gèrent les abonnements aux notifications dans
  l’état du Plugin. Les lectures d’événements peuvent être relues sans risque ;
  l’outil d’avancement déplace le curseur durable afin que les appelants puissent
  reprendre sans perdre ni lire deux fois les événements de cartes terminées,
  échouées ou périmées.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` et `workboard_dispatch` permettent à un
  agent d’inspecter les espaces de noms de tableau, de voir les statistiques de
  file, de récupérer le travail bloqué, d’ajouter des notes de transfert,
  d’attacher des références de preuve ou d’artefact, de remettre le travail
  bloqué dans `todo` et de déclencher la promotion des dépendances ou le
  nettoyage des revendications périmées.

Les cartes revendiquées rejettent les mutations par outils d’agent venant
d’autres agents, sauf si l’appelant possède le jeton de revendication renvoyé
par `workboard_claim`. Les opérateurs du tableau de bord utilisent toujours la
surface RPC Gateway normale et peuvent récupérer ou réassigner des cartes.

Workboard stocke les données durables de tableau dans une base de données
SQLite relationnelle appartenant au Plugin, sous le répertoire d’état OpenClaw.
Les tableaux, cartes, libellés, événements de cycle de vie, tentatives
d’exécution, commentaires, liens de dépendance, preuves, références d’artefacts,
métadonnées et blobs de pièces jointes, diagnostics, notifications, journaux de
workers, état de protocole et abonnements sont persistés dans les tables
Workboard au lieu d’entrées clé-valeur de Plugin. Une exportation de carte
préserve toujours le récit du tableau sans incorporer le contenu blob des pièces
jointes.

Les installations qui utilisaient Workboard dans la version `.28` peuvent
exécuter `openclaw doctor --fix` pour migrer les espaces de noms hérités
d’état de Plugin livrés (`workboard.cards`, `workboard.boards` et
`workboard.notify`) vers la base de données relationnelle. Si un espace de noms
hérité `workboard.attachments` est présent, doctor migre aussi ces blobs de
pièces jointes.

Les diagnostics Workboard sont calculés à partir des métadonnées locales des
cartes. Les vérifications intégrées signalent les cartes assignées qui attendent
trop longtemps, les cartes en cours sans Heartbeat récent, les cartes bloquées
nécessitant une attention, les échecs répétés, les cartes terminées sans preuve
et les cartes en cours qui ne disposent que d’un lien de session lâche.

La répartition est volontairement locale au Gateway. Elle ne lance pas de
processus arbitraires du système d’exploitation ; les sessions de sous-agent
OpenClaw normales restent responsables de l’exécution. L’action de répartition
promeut les cartes dont les dépendances sont prêtes, enregistre les métadonnées
de répartition sur les cartes prêtes, bloque les revendications expirées ou les
exécutions expirées, marque les cartes de triage configurées par le tableau
comme candidates à l’orchestration, puis revendique un petit lot de cartes
prêtes et démarre des exécutions de workers via le runtime de sous-agent du
Gateway. Les cartes assignées utilisent des clés de session de worker
`agent:<id>:subagent:workboard-*` ; les cartes non assignées utilisent des clés
non limitées `subagent:workboard-*` afin que le Gateway résolve toujours l’agent
par défaut configuré. Les workers reçoivent un contexte de carte borné ainsi que
le jeton de revendication dont ils ont besoin pour envoyer un Heartbeat, terminer
ou bloquer la carte via les outils Workboard.

### Sélection des workers de répartition

Chaque passage de répartition démarre au plus trois workers par défaut. Les
cartes prêtes sont ordonnées par priorité, position et heure de création, puis
filtrées pour éviter la duplication de propriété active. Une répartition ne
démarre qu’une seule carte pour un propriétaire ou un agent donné dans le même
passage, et elle ignore les propriétaires qui ont déjà du travail en cours ou en
revue sur le tableau.

Les cartes archivées, les cartes avec revendications actives et les cartes sans
statut `ready` ne sont pas sélectionnées pour les démarrages de workers. Elles
peuvent tout de même être affectées par le côté données de la répartition
lorsque le nettoyage des revendications périmées, la promotion de dépendances ou
le nettoyage des expirations s’applique.

### Prompt et cycle de vie du worker

Le prompt du worker inclut le titre de la carte, des notes et un contexte
bornés, le tableau assigné et le protocole de worker Workboard. Il inclut aussi
le propriétaire et le jeton de revendication afin que le worker puisse appeler
`workboard_heartbeat`, `workboard_complete` ou `workboard_block` sans qu’un
autre acteur prenne possession de la carte.

Lorsqu’un worker démarre correctement, Workboard stocke sur la carte la clé de
session, l’identifiant d’exécution, le moteur, le mode, le libellé du modèle, le
statut et le journal du worker. La clé de session est déterministe pour le
tableau et la carte, ce qui fait que les répartitions répétées reviennent vers
la même voie de worker au lieu de créer des sessions sans rapport.

Si un worker ne peut pas être démarré après qu’une carte a été revendiquée,
Workboard bloque la carte, efface la revendication, enregistre l’échec de
démarrage d’exécution et ajoute une ligne de journal de worker. Cet échec est
visible dans le tableau de bord, le JSON de la CLI, les outils d’agent et les
diagnostics de carte.

### Points d’entrée de répartition

Les démarrages de workers pour cartes prêtes peuvent se produire depuis :

- l’action de répartition du tableau de bord
- `openclaw workboard dispatch`
- `/workboard dispatch` sur un canal capable de commandes

Les trois points d’entrée utilisent le runtime de sous-agent du Gateway lorsque
le Gateway est disponible. La CLI dispose d’un repli opérateur supplémentaire :
si le Gateway est hors ligne ou n’expose pas la méthode de répartition Workboard
et qu’aucune cible explicite `--url` ou `--token` n’a été fournie, elle exécute
une répartition uniquement sur les données contre l’état SQLite local. Ce repli
peut promouvoir des dépendances, nettoyer les revendications périmées et bloquer
les exécutions expirées, mais il ne peut pas démarrer de workers.

Les métadonnées de tableau peuvent inclure des paramètres d’orchestration comme
`autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee` et
`orchestratorProfile`. OpenClaw enregistre l’intention d’orchestration et
l’expose dans le contexte du worker ; la spécification et la décomposition
réelles se produisent toujours via les outils Workboard normaux.

## CLI et commande slash

Le Plugin enregistre une commande CLI racine :

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` appelle le Gateway en cours d’exécution afin que les démarrages de workers utilisent le même runtime de sous-agent que le tableau de bord. Si le Gateway est indisponible, il revient à une répartition limitée aux données afin que la promotion des dépendances, le nettoyage des revendications obsolètes et le blocage par délai d’expiration puissent toujours s’exécuter. Les échecs d’authentification, d’autorisation et de validation apparaissent toujours comme des erreurs de commande, tout comme les échecs pour les cibles explicites `--url` ou `--token`.

La commande slash `/workboard` prend en charge le même parcours compact pour l’opérateur :
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` et
`/workboard dispatch`. List et show sont des opérations de lecture pour les expéditeurs de commandes autorisés. Create et dispatch nécessitent le statut de propriétaire sur les surfaces de chat ou un client Gateway avec `operator.write` ou `operator.admin`.

Consultez [CLI Workboard](/fr/cli/workboard) pour les options de commande, la sortie JSON, le comportement de repli du Gateway, la gestion non ambiguë des préfixes d’identifiants, les règles de sélection de répartition et le dépannage.

## Synchronisation du cycle de vie des sessions

Les cartes peuvent être liées à des sessions de tableau de bord existantes ou à la session créée lorsque vous démarrez le travail depuis une carte. Les cartes liées affichent le cycle de vie de la session en ligne :
en cours d’exécution, obsolète, liée inactive, terminée, échouée ou manquante.

Si la session liée est manquante, la carte reste liée pour le contexte et propose toujours des contrôles de démarrage afin que vous puissiez relancer le travail dans une nouvelle session de tableau de bord. Si une session liée active cesse de signaler une activité récente, Workboard marque la carte comme obsolète et stocke ce marqueur dans les métadonnées de la carte jusqu’à ce que le cycle de vie l’efface.

Vous pouvez aussi capturer une session de tableau de bord existante depuis l’onglet Sessions avec Add to Workboard. La carte est liée à cette session, utilise le libellé de la session ou la requête utilisateur récente comme titre, et initialise les notes à partir de la requête utilisateur récente ainsi que de la dernière réponse de l’assistant lorsque l’historique de chat est disponible.

Workboard suit la session liée tant que la carte est encore dans un état de travail actif :

- session liée active -> `running`
- session liée terminée -> `review`
- session liée échouée, tuée, expirée ou abandonnée -> `blocked`

Les états de revue manuels prévalent. Si vous déplacez une carte vers `review`, `blocked` ou `done`, Workboard cesse de déplacer automatiquement cette carte jusqu’à ce que vous la replaciez dans `todo` ou `running`.

## Flux de travail du tableau de bord

1. Ouvrez l’onglet Workboard dans la Control UI.
2. Créez une carte avec un titre, des notes, une priorité, des libellés, un agent facultatif et une session liée facultative.
3. Ou ouvrez Sessions et choisissez Add to Workboard pour une session existante.
4. Faites glisser la carte entre les colonnes ou placez le focus sur le contrôle de statut compact de la carte et utilisez son menu ou ArrowLeft/ArrowRight.
5. Démarrez le travail depuis la carte pour créer ou réutiliser une session de tableau de bord.
6. Ouvrez la session liée depuis la carte pendant que l’agent travaille.
7. Laissez la synchronisation du cycle de vie déplacer le travail en cours vers review ou blocked, puis déplacez manuellement la carte vers done une fois acceptée.

Démarrer une carte utilise les sessions Gateway normales. Le Plugin Workboard ne stocke que les métadonnées et les liens des cartes ; la transcription de la conversation, la sélection du modèle et le cycle de vie de l’exécution restent gérés par le système de sessions habituel.

Utilisez Stop sur une carte liée active pour interrompre l’exécution de la session active. Workboard marque cette carte comme `blocked` afin qu’elle reste visible pour le suivi.

Les nouvelles cartes peuvent partir de modèles Workboard pour des corrections de bugs, de la documentation, des versions, des revues de PR ou du travail sur des plugins. Les modèles préremplissent le titre, les notes, les libellés et la priorité, et l’identifiant du modèle sélectionné est stocké dans les métadonnées de la carte.

## Autorisations

Le plugin enregistre des méthodes RPC Gateway sous l’espace de noms `workboard.*` :

- `workboard.cards.list` nécessite `operator.read`
- `workboard.cards.export` nécessite `operator.read`
- `workboard.cards.diagnostics` nécessite `operator.read`
- `workboard.cards.diagnostics.refresh` nécessite `operator.write`
- les lectures de liste/récupération de pièces jointes et d’événements de notification nécessitent `operator.read`
- l’avancement du curseur de notification nécessite `operator.write`
- les méthodes create, update, move, delete, comment, link, dependency link, proof, artifact,
  attachment add/delete, worker log, protocol violation, claim, heartbeat,
  release, complete, block, unblock, dispatch, bulk et archive nécessitent
  `operator.write`

Les navigateurs connectés avec un accès opérateur en lecture seule peuvent inspecter le tableau, mais ne peuvent pas modifier les cartes.

## Configuration

Workboard n’a aujourd’hui aucune configuration spécifique au plugin. Activez-le ou désactivez-le avec l’entrée de plugin standard :

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

Désactivez-le à nouveau avec :

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Dépannage

### L’onglet indique que Workboard est indisponible

Vérifiez la politique du plugin :

```bash
openclaw plugins inspect workboard --runtime --json
```

Si `plugins.allow` est configuré, ajoutez `workboard` à cette liste d’autorisation. Si
`plugins.deny` contient `workboard`, retirez-le avant d’activer le plugin.

### Les cartes ne s’enregistrent pas

Confirmez que la connexion du navigateur dispose de l’accès `operator.write`. Les sessions opérateur en lecture seule peuvent lister les cartes, mais ne peuvent pas les créer, les modifier, les déplacer ni les supprimer.

### Le démarrage d’une carte n’ouvre pas la session attendue

Workboard crée des liens vers des sessions de tableau de bord normales. Vérifiez l’identifiant d’agent de la carte et la session liée, puis ouvrez la vue Sessions ou Chat pour inspecter l’état réel de l’exécution.

### Dispatch ne démarre pas de worker

Confirmez qu’il existe au moins une carte `ready` sans revendication active :

```bash
openclaw workboard list --status ready
```

Si la CLI signale une répartition limitée aux données, démarrez ou redémarrez le Gateway et réessayez. La répartition limitée aux données met à jour l’état du tableau local, mais ne peut pas démarrer d’exécutions de workers sous-agents.

Les cartes peuvent aussi être ignorées lorsqu’une autre carte pour le même propriétaire ou agent est déjà en cours d’exécution ou en attente de revue. Terminez, bloquez ou libérez ce travail actif avant de répartir davantage de travail pour le même propriétaire.

## Connexe

- [Control UI](/fr/web/control-ui)
- [CLI Workboard](/fr/cli/workboard)
- [Plugins](/fr/tools/plugin)
- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Sessions](/fr/concepts/session)
