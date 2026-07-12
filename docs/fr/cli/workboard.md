---
read_when:
    - Vous souhaitez consulter ou créer des cartes Workboard depuis le terminal
    - Vous souhaitez lancer des exécutions de workers Workboard depuis la CLI
    - Vous déboguez le comportement de la CLI Workboard ou des commandes slash
summary: Référence de la CLI pour les cartes `openclaw workboard`, la répartition et les exécutions de workers
title: CLI Workboard
x-i18n:
    generated_at: "2026-07-12T15:11:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` est l’interface de terminal du [Plugin Workboard](/fr/plugins/workboard) intégré. Elle permet à un opérateur de répertorier les cartes, d’en créer une, d’en inspecter une et de demander au Gateway en cours d’exécution d’affecter les travaux prêts à des exécutions de sous-agents workers.

Activez le Plugin avant d’utiliser la commande :

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Utilisation

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

La commande lit et écrit dans la même base de données SQLite appartenant au Plugin que celle utilisée par le tableau de bord et les outils d’agent Workboard. Les identifiants de carte sont des UUID ; les commandes qui acceptent un identifiant de carte acceptent également un préfixe d’identifiant non ambigu (la sortie texte compacte affiche les 8 premiers caractères).

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

Les colonnes correspondent au préfixe de l’identifiant, au statut, à la priorité, à l’identifiant du tableau, à l’identifiant facultatif de l’agent et au titre.

| Option                 | Objectif                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| `--board <id>`         | Limiter les résultats à un espace de noms de tableau                        |
| `--status <status>`    | Limiter les résultats à un statut Workboard                                 |
| `--include-archived`   | Inclure les cartes archivées dans la sortie texte compacte                  |
| `--json`               | Afficher la liste complète des cartes au format JSON exploitable par machine |

La sortie texte compacte masque les cartes archivées par défaut afin que la CLI corresponde à `/workboard list`. Transmettez `--include-archived` pour les afficher. La sortie JSON conserve toujours la liste complète des cartes, y compris les cartes archivées, pour les automatisations existantes.

## `create`

```bash
openclaw workboard create "Corriger le Heartbeat obsolète du worker" --priority high --labels bug,workboard
openclaw workboard create "Rédiger la documentation de Workboard" --status ready --agent docs-agent --board docs --notes "Présenter la CLI, la commande à barre oblique, l’affectation et l’état SQLite."
```

| Option                    | Objectif                                              |
| ------------------------- | ----------------------------------------------------- |
| `--notes <text>`          | Notes initiales de la carte                           |
| `--status <status>`       | Statut initial, `todo` par défaut                     |
| `--priority <priority>`   | Priorité, `normal` par défaut                         |
| `--agent <id>`            | Attribuer la carte à un identifiant d’agent ou de responsable |
| `--board <id>`            | Stocker la carte dans un espace de noms de tableau    |
| `--labels <items>`        | Étiquettes séparées par des virgules                  |
| `--json`                  | Afficher la carte créée au format JSON exploitable par machine |

`create` écrit directement dans l’état SQLite de Workboard. La carte est immédiatement visible dans l’onglet Workboard de l’interface de contrôle et par les outils Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La sortie texte affiche la ligne compacte de la carte et ses notes. La sortie JSON renvoie l’enregistrement complet de la carte, notamment les métadonnées d’exécution, les tentatives, les commentaires, les liens, les preuves, les artefacts, les journaux du worker, l’état du protocole, les diagnostics et les métadonnées d’automatisation.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` appelle d’abord la méthode RPC `workboard.cards.dispatch` du Gateway en cours d’exécution, qui utilise le même environnement d’exécution de sous-agent que l’action d’affectation du tableau de bord. Ainsi, les cartes prêtes deviennent des exécutions de workers suivies en tant que tâches, avec des clés de session associées. Les cartes attribuées à un agent utilisent des clés de session de sous-agent limitées à cet agent ; les cartes non attribuées conservent une clé de sous-agent non limitée afin de préserver l’agent par défaut configuré du Gateway.

La boucle d’affectation :

1. Fait passer les cartes enfants dont les dépendances sont prêtes à l’état `ready`.
2. Bloque les attributions expirées ou les exécutions de workers arrivées à expiration.
3. Enregistre les métadonnées d’affectation sur les cartes prêtes.
4. Sélectionne un petit lot de cartes prêtes non attribuées.
5. Attribue chaque carte sélectionnée au répartiteur ou à l’agent désigné.
6. Démarre une exécution de worker sous-agent avec un contexte de carte limité et le jeton d’attribution de la carte.
7. Stocke sur la carte l’identifiant de l’exécution du worker, la clé de session, le lien vers la tâche lorsque le registre de tâches du Gateway le signale, le statut d’exécution et le journal du worker.

La sélection est prudente : une affectation démarre au maximum trois workers par défaut, ignore les cartes archivées ou déjà attribuées et ne démarre qu’une seule carte par responsable ou agent au cours d’un même passage. Les cartes déjà détenues par des travaux actifs en cours d’exécution ou de révision sont laissées pour une affectation ultérieure.

Si le démarrage du worker échoue après l’attribution d’une carte, Workboard bloque cette carte, efface l’attribution et enregistre l’échec dans les métadonnées d’exécution et de journal du worker de la carte, afin de rendre les échecs de démarrage visibles au lieu de remettre silencieusement la carte dans la file d’attente.

Si aucune cible Gateway explicite n’est indiquée et que le Gateway local est indisponible ou n’expose pas encore la méthode d’affectation Workboard, la CLI se rabat sur une affectation limitée aux données dans l’état Workboard local. Cette affectation peut toujours faire progresser les dépendances, nettoyer les attributions obsolètes et bloquer les exécutions arrivées à expiration, mais elle ne démarre aucun worker. Les échecs d’authentification, d’autorisation et de validation, ainsi que les échecs concernant une cible `--url` ou `--token` explicite, sont signalés directement au lieu de déclencher le mécanisme de repli.

La sortie texte indique les démarrages de workers :

```text
dispatch complete: started=2 failures=0
```

La sortie de repli est explicite :

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

La sortie JSON inclut le résultat de la répartition. La répartition reposant sur le Gateway peut inclure `started` et `startFailures` ; le repli limité aux données inclut `gatewayUnavailable: true`. Les jetons de revendication sont masqués dans la sortie JSON des cartes.

Dans le tableau de bord, le même résultat de répartition est présenté sous forme de bref récapitulatif afin qu’un opérateur puisse voir combien de cartes ont été démarrées, promues, bloquées, récupérées ou ont échoué sans ouvrir leurs détails.

## Parité des commandes slash

Les canaux prenant en charge les commandes peuvent utiliser la commande slash correspondante :

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Corriger le Heartbeat obsolète du worker
/workboard dispatch
```

La répartition par commande slash utilise également l’environnement d’exécution de sous-agent du Gateway ; elle suit donc le même comportement de revendication, de démarrage des workers et d’échec que le tableau de bord et le chemin du Gateway dans la CLI.

`/workboard list` et `/workboard show` sont des commandes de lecture destinées aux expéditeurs de commandes autorisés. `/workboard create` et `/workboard dispatch` modifient l’état du tableau et nécessitent le statut de propriétaire sur les interfaces de discussion ou un client Gateway disposant de `operator.write` ou `operator.admin`.

## Autorisations

Le chemin de répartition de la CLI appelle le RPC du Gateway avec les portées `operator.read` et `operator.write`. Un jeton Gateway en lecture seule peut consulter les données de Workboard au moyen des méthodes de lecture, mais il ne peut ni créer de cartes ni répartir des workers.

Les commandes locales `list`, `create` et `show` agissent sur le répertoire d’état OpenClaw local utilisé par le profil actuel. Utilisez `--dev` ou `--profile <name>` avec la commande `openclaw` de premier niveau lorsque vous avez besoin d’une autre racine d’état.

## Résolution des problèmes

### Aucune carte n’apparaît

Vérifiez que le Plugin est activé pour le même profil et la même racine d’état :

```bash
openclaw plugins inspect workboard --runtime --json
```

Si le tableau de bord affiche des cartes, mais pas la CLI, vérifiez que les deux commandes utilisent le même paramètre `--dev` ou `--profile`.

### La répartition indique un mode limité aux données

Démarrez ou redémarrez le Gateway :

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Réessayez ensuite `openclaw workboard dispatch`. Le repli limité aux données est utile pour nettoyer l’état local, mais les exécutions de workers nécessitent un Gateway actif.

### La répartition ne démarre rien

Vérifiez qu’il existe au moins une carte `ready` sans revendication active :

```bash
openclaw workboard list --status ready
```

Des cartes peuvent également être ignorées lorsque le même propriétaire a déjà une tâche en cours d’exécution ou de révision. Déplacez les tâches terminées vers `done`, libérez les revendications obsolètes à l’aide des outils Workboard ou relancez la répartition une fois que le worker actif a terminé.

## Voir aussi

- [Plugin Workboard](/fr/plugins/workboard)
- [Référence de la CLI](/fr/cli)
- [Commandes slash](/fr/tools/slash-commands)
- [Interface de contrôle](/fr/web/control-ui)
