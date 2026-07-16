---
read_when:
    - Vous souhaitez consulter ou créer des cartes Workboard depuis le terminal
    - Vous souhaitez lancer des exécutions de workers Workboard depuis la CLI
    - Vous déboguez le comportement de la CLI Workboard ou des commandes slash
summary: Référence de la CLI pour les cartes `openclaw workboard`, la répartition et les exécutions des workers
title: CLI Workboard
x-i18n:
    generated_at: "2026-07-16T13:07:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` est l'interface de terminal du [Plugin Workboard](/fr/plugins/workboard) intégré. Elle permet à un opérateur de répertorier les cartes, d'en créer une, d'en inspecter une et de demander au Gateway en cours d'exécution d'affecter le travail prêt à des exécutions de sous-agents workers.

Activez le Plugin avant d'utiliser la commande :

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Utilisation

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

La commande lit et écrit dans la même base de données SQLite appartenant au Plugin que celle utilisée par le tableau de bord et les outils d'agent Workboard. Les identifiants de carte sont des UUID ; les commandes qui acceptent un identifiant de carte acceptent également un préfixe d'identifiant non ambigu (la sortie texte compacte affiche les 8 premiers caractères).

Valeurs `status` valides : `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valeurs `priority` valides : `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

La sortie texte est compacte :

```text
7f4a2c10  ready     high    default agent-a  Corriger le Heartbeat obsolète du worker
```

Les colonnes correspondent au préfixe d'identifiant, au statut, à la priorité, à l'identifiant du tableau, à l'identifiant d'agent facultatif et au titre.

| Indicateur                 | Objectif                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limiter les résultats à un espace de noms de tableau          |
| `--status <status>`  | Limiter les résultats à un statut Workboard         |
| `--include-archived` | Inclure les cartes archivées dans la sortie texte compacte |
| `--json`             | Afficher la liste complète des cartes au format JSON exploitable par une machine      |

Par défaut, la sortie texte compacte masque les cartes archivées afin que la CLI corresponde à `/workboard list`. Transmettez `--include-archived` pour les afficher. La sortie JSON conserve toujours la liste complète des cartes, y compris les cartes archivées, pour les automatisations existantes.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Indicateur                    | Objectif                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Notes initiales de la carte                      |
| `--status <status>`     | Statut initial, `todo` par défaut          |
| `--priority <priority>` | Priorité, `normal` par défaut              |
| `--agent <id>`          | Affecter la carte à un agent ou à un identifiant de propriétaire |
| `--board <id>`          | Stocker la carte dans un espace de noms de tableau     |
| `--labels <items>`      | Étiquettes séparées par des virgules                  |
| `--json`                | Afficher la carte créée au format JSON exploitable par une machine  |

`create` écrit directement dans l'état SQLite de Workboard. La carte est immédiatement visible dans l'onglet Workboard de l'interface de contrôle et dans les outils Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La sortie texte affiche la ligne compacte de la carte et les notes. La sortie JSON renvoie l'enregistrement complet de la carte, notamment les métadonnées d'exécution, les tentatives, les commentaires, les liens, les preuves, les artefacts, les journaux du worker, l'état du protocole, les diagnostics et les métadonnées d'automatisation.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` modifie le statut de la carte en utilisant le même chemin d'opérateur manuel que lorsque vous faites glisser une carte dans le tableau de bord. Il accepte un identifiant de carte complet ou un préfixe non ambigu. Les blocages actifs liés aux dépendances et à la planification continuent de s'appliquer. Les opérateurs peuvent déplacer une carte revendiquée sans le jeton de revendication de son agent ; les jetons de revendication restent limités aux mutations effectuées par les outils d'agent et sont masqués dans la sortie JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` appelle d'abord la méthode RPC `workboard.cards.dispatch` du Gateway en cours d'exécution, qui utilise le même environnement d'exécution de sous-agent que l'action d'affectation du tableau de bord. Ainsi, les cartes prêtes deviennent des exécutions de workers suivies comme des tâches avec des clés de session associées. `--max-starts` utilise la méthode additive `workboard.cards.dispatchWithOptions` afin qu'un Gateway plus ancien rejette l'option avant de démarrer le moindre worker ; après une mise à niveau, redémarrez le Gateway avant d'utiliser l'indicateur. Les cartes affectées à un agent utilisent des clés de session de sous-agent limitées à cet agent ; les cartes non affectées conservent une clé de sous-agent sans portée afin de préserver l'agent par défaut configuré du Gateway.

La boucle d'affectation :

1. Fait passer les enfants dont les dépendances sont satisfaites à `ready`.
2. Bloque les revendications expirées ou les exécutions de workers arrivées à expiration.
3. Enregistre les métadonnées d'affectation sur les cartes prêtes.
4. Sélectionne un petit lot de cartes prêtes non revendiquées.
5. Revendique chaque carte sélectionnée pour le répartiteur ou l'agent affecté.
6. Démarre une exécution de worker sous-agent avec un contexte de carte limité et le jeton de revendication de la carte.
7. Stocke sur la carte l'identifiant de l'exécution du worker, la clé de session, le lien avec la tâche lorsque le registre des tâches du Gateway le signale, le statut d'exécution et le journal du worker.

La sélection est prudente : par défaut, une affectation démarre au maximum trois workers, ignore les cartes archivées ou déjà revendiquées et ne démarre qu'une seule carte par propriétaire ou agent au cours d'un même passage. Les cartes déjà détenues par un travail actif en cours d'exécution ou en révision sont laissées pour une affectation ultérieure. Transmettez `--max-starts <count>` avec un entier positif pour modifier la limite par passage ; la règle d'une seule carte par propriétaire continue de s'appliquer, de sorte que le nombre effectif de démarrages peut être inférieur.

Si le démarrage du worker échoue après la revendication d'une carte, Workboard bloque cette carte, efface la revendication et enregistre l'échec dans les métadonnées d'exécution et de journal du worker de la carte. Les échecs de démarrage restent ainsi visibles au lieu que la carte soit silencieusement remise dans la file d'attente.

Si aucune cible Gateway explicite n'est fournie et que le Gateway local est indisponible ou n'expose pas encore la méthode d'affectation de Workboard, la CLI se rabat sur une affectation limitée aux données appliquée à l'état Workboard local. L'affectation limitée aux données peut toujours faire progresser les dépendances, nettoyer les revendications obsolètes et bloquer les exécutions arrivées à expiration, mais elle ne démarre aucun worker. Les échecs d'authentification, d'autorisation et de validation, ainsi que les échecs concernant une cible `--url` ou `--token` explicite, sont signalés directement au lieu de déclencher le mécanisme de repli.

La sortie texte indique les démarrages de workers :

```text
affectation terminée : démarrés=2 échecs=0
```

La sortie de repli est explicite :

```text
Gateway indisponible ; affectation des données uniquement : promues=1 bloquées=0
```

La sortie JSON inclut le résultat de l'affectation. L'affectation reposant sur le Gateway peut inclure `started` et `startFailures` ; le repli limité aux données inclut `gatewayUnavailable: true`. Les jetons de revendication sont masqués dans la sortie JSON des cartes.

Dans le tableau de bord, le même résultat d'affectation est présenté sous forme d'un bref résumé afin qu'un opérateur puisse voir combien de cartes ont été démarrées, promues, bloquées, récupérées ou ont échoué sans ouvrir les détails des cartes.

## Parité des commandes slash

Les canaux prenant en charge les commandes peuvent utiliser la commande slash correspondante :

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Corriger le Heartbeat obsolète du worker
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

L'affectation par commande slash utilise également l'environnement d'exécution de sous-agent du Gateway. Elle suit donc le même comportement de revendication, de démarrage de worker et d'échec que le chemin Gateway du tableau de bord et de la CLI.

`/workboard list` et `/workboard show` sont des commandes de lecture destinées aux expéditeurs de commandes autorisés. `/workboard create`, `/workboard move` et `/workboard dispatch` modifient l'état du tableau et nécessitent le statut de propriétaire sur les interfaces de discussion ou un client Gateway disposant de `operator.write` ou `operator.admin`.

## Autorisations

Le chemin d'affectation de la CLI demande normalement les portées Gateway `operator.write` et `operator.read`. Les cartes liées à un espace de travail s'exécutent directement dans l'espace de travail exact d'un agent configuré ; une demande de worktree est limitée à ce répertoire au lieu de permettre à l'hôte de matérialiser du code contrôlé par le dépôt. Le worker sélectionné doit disposer d'un accès en écriture non partagé au bac à sable Docker pour cet espace de travail exact, d'un hachage de conteneur actif correspondant aux montages et à la politique demandés, et d'aucune possibilité d'échapper à l'hôte. Transmettez `--admin` pour demander explicitement `operator.admin`, autoriser un autre checkout sur l'hôte et utiliser la configuration normale du worktree géré ; la connexion échoue si cette portée n'est pas approuvée pour le client. Un jeton Gateway en lecture seule peut inspecter les données Workboard au moyen des méthodes de lecture, mais il ne peut ni créer de cartes ni affecter des workers. Les limites de l'espace de travail ne modifient pas autrement le déplacement manuel des cartes pour les appelants disposant de l'autorisation de mutation Workboard.

Les commandes locales `list`, `create`, `show` et `move` agissent sur le répertoire d'état OpenClaw local utilisé par le profil actuel. Utilisez `--dev` ou `--profile <name>` sur la commande `openclaw` de premier niveau lorsqu'une autre racine d'état est nécessaire.

## Résolution des problèmes

### Aucune carte ne s'affiche

Vérifiez que le Plugin est activé pour le même profil et la même racine d'état :

```bash
openclaw plugins inspect workboard --runtime --json
```

Si le tableau de bord affiche des cartes, mais pas la CLI, vérifiez que les deux commandes utilisent le même paramètre `--dev` ou `--profile`.

### L'affectation indique qu'elle est limitée aux données

Démarrez ou redémarrez le Gateway :

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Réessayez ensuite `openclaw workboard dispatch`. Le mécanisme de repli limité aux données est utile pour nettoyer l'état local, mais les exécutions de workers nécessitent un Gateway actif.

### L'affectation ne démarre rien

Vérifiez qu'il existe au moins une carte `ready` sans revendication active :

```bash
openclaw workboard list --status ready
```

Des cartes peuvent également être ignorées lorsque le même propriétaire possède déjà un travail en cours d'exécution ou en révision. Déplacez le travail terminé vers `done`, libérez les revendications obsolètes au moyen des outils Workboard ou relancez l'affectation une fois le worker actif terminé.

## Contenu associé

- [Plugin Workboard](/fr/plugins/workboard)
- [Référence de la CLI](/fr/cli)
- [Commandes slash](/fr/tools/slash-commands)
- [Interface de contrôle](/fr/web/control-ui)
