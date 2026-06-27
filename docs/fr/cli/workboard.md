---
read_when:
    - Vous souhaitez inspecter ou créer des cartes Workboard depuis le terminal
    - Vous voulez déclencher des exécutions de workers Workboard depuis la CLI
    - Vous déboguez le comportement de la CLI Workboard ou des commandes slash
summary: Référence CLI pour les cartes `openclaw workboard`, la répartition et les exécutions des workers
title: CLI du tableau de travail
x-i18n:
    generated_at: "2026-06-27T17:22:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` est l’interface de terminal du
[Plugin Workboard](/fr/plugins/workboard) inclus. Elle permet à un opérateur de lister les cartes, de créer une
carte, d’inspecter une carte et de demander au Gateway en cours d’exécution de distribuer le travail prêt vers
des exécutions de workers sous-agents.

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

La commande lit et écrit dans la même base de données SQLite détenue par le Plugin que celle utilisée par le
tableau de bord et les outils d’agent Workboard. Les identifiants de carte peuvent être transmis sous forme d’identifiant complet ou de
préfixe non ambigu lorsqu’une commande accepte un identifiant de carte.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

La sortie texte est compacte :

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Les colonnes sont le préfixe d’identifiant, le statut, la priorité, l’identifiant du tableau, l’identifiant d’agent facultatif et le titre.

Indicateurs :

| Indicateur           | Objectif                                      |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limiter les résultats à un espace de noms de tableau |
| `--status <status>`  | Limiter les résultats à un statut Workboard   |
| `--include-archived` | Inclure les cartes archivées dans la sortie texte compacte |
| `--json`             | Afficher la liste complète des cartes en JSON exploitable par machine |

La sortie texte compacte masque les cartes archivées par défaut afin que la CLI corresponde à la
commande `/workboard list`. Passez `--include-archived` pour les afficher. La sortie JSON
conserve la liste complète des cartes, y compris les cartes archivées, pour les automatisations existantes.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Indicateurs :

| Indicateur              | Objectif                                  |
| ----------------------- | ---------------------------------------- |
| `--notes <text>`        | Notes initiales de la carte              |
| `--status <status>`     | Statut initial, par défaut `todo`        |
| `--priority <priority>` | Priorité, par défaut `normal`            |
| `--agent <id>`          | Assigner la carte à un agent ou à un identifiant de propriétaire |
| `--board <id>`          | Stocker la carte dans un espace de noms de tableau |
| `--labels <items>`      | Libellés séparés par des virgules        |
| `--json`                | Afficher la carte créée en JSON exploitable par machine |

`create` écrit directement dans l’état SQLite de Workboard. La carte est immédiatement
visible dans l’onglet Workboard de l’interface de contrôle et pour les outils Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La sortie texte affiche la ligne compacte de la carte et les notes. La sortie JSON renvoie l’enregistrement complet de la
carte, y compris les métadonnées d’exécution, les tentatives, les commentaires, les liens, les preuves,
les artefacts, les journaux de worker, l’état du protocole, les diagnostics et les métadonnées d’automatisation.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` appelle d’abord la méthode RPC du Gateway en cours d’exécution
`workboard.cards.dispatch`. Ce chemin utilise le même runtime de sous-agent que l’action de
distribution du tableau de bord, de sorte que les cartes prêtes deviennent des exécutions de workers suivies comme tâches avec
des clés de session liées. Les cartes avec un agent assigné utilisent des clés de session de sous-agent
portées par l’agent ; les cartes non assignées conservent une clé de sous-agent sans portée afin que l’agent par défaut
configuré du Gateway soit préservé.

La boucle de distribution :

1. Passe les enfants dont les dépendances sont prêtes à `ready`.
2. Bloque les revendications expirées ou les exécutions de workers arrivées à expiration.
3. Enregistre les métadonnées de distribution sur les cartes prêtes.
4. Sélectionne un petit lot de cartes prêtes non revendiquées.
5. Revendique chaque carte sélectionnée pour le répartiteur ou l’agent assigné.
6. Démarre une exécution de worker sous-agent avec un contexte de carte borné et le jeton de revendication
   de la carte.
7. Stocke l’identifiant d’exécution du worker, la clé de session, le lien de tâche lorsque le registre des tâches du Gateway
   le signale, le statut d’exécution et le journal du worker sur la carte.

La sélection est volontairement conservatrice. Une distribution démarre au plus trois
workers par défaut, ignore les cartes archivées ou déjà revendiquées, et ne démarre qu’une seule
carte par propriétaire ou agent lors d’un même passage. Les cartes déjà détenues par un travail actif en cours d’exécution
ou en revue sont laissées pour une distribution ultérieure.

Si le démarrage du worker échoue après qu’une carte a été revendiquée, Workboard bloque cette carte,
efface la revendication et enregistre l’échec dans les métadonnées d’exécution de la carte et du journal de worker.
Cela rend les démarrages échoués visibles au lieu de renvoyer silencieusement la
carte dans la file d’attente.

Si aucune cible Gateway explicite n’est fournie et que le Gateway local est indisponible
ou n’expose pas encore la méthode de distribution Workboard, la CLI bascule vers une
distribution uniquement basée sur les données contre l’état Workboard local. La distribution uniquement basée sur les données peut tout de même
promouvoir les dépendances, nettoyer les revendications obsolètes et bloquer les exécutions arrivées à expiration, mais elle ne
démarre pas de workers. Les échecs d’authentification, d’autorisation, de validation et les échecs pour une
cible explicite `--url` ou `--token` sont signalés directement.

La sortie texte indique les démarrages de workers :

```text
dispatch complete: started=2 failures=0
```

La sortie de bascule est explicite :

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

La sortie JSON inclut le résultat de la distribution. La distribution appuyée par le Gateway peut inclure
`started` et `startFailures` ; la bascule uniquement basée sur les données inclut
`gatewayUnavailable: true`. Les jetons de revendication sont expurgés de la sortie JSON des cartes.

Dans le tableau de bord, le même résultat de distribution est affiché sous forme de bref résumé afin qu’un
opérateur puisse voir combien de cartes ont démarré, été promues, bloquées, récupérées ou
échoué sans ouvrir les détails des cartes.

## Parité des commandes slash

Les canaux compatibles avec les commandes peuvent utiliser la commande slash correspondante :

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

La distribution par commande slash utilise également le runtime de sous-agent du Gateway, elle suit donc le
même comportement de revendication, de démarrage de worker et d’échec que le chemin Gateway du tableau de bord et de la CLI.

`/workboard list` et `/workboard show` sont des commandes de lecture pour les expéditeurs de commandes autorisés.
`/workboard create` et `/workboard dispatch` modifient l’état du tableau et
exigent le statut de propriétaire sur les surfaces de discussion ou un client Gateway avec `operator.write`
ou `operator.admin`.

## Autorisations

Le chemin de distribution de la CLI appelle la RPC du Gateway avec les portées `operator.read` et
`operator.write`. Un jeton Gateway en lecture seule peut inspecter les données Workboard
via des méthodes de lecture, mais il ne peut pas créer de cartes ni distribuer de workers.

Les commandes locales `list`, `create` et `show` opèrent sur le répertoire d’état OpenClaw local
utilisé par le profil courant. Utilisez `--dev` ou `--profile <name>` sur la
commande `openclaw` de premier niveau lorsque vous avez besoin d’une autre racine d’état.

## Dépannage

### Aucune carte n’apparaît

Confirmez que le Plugin est activé pour le même profil et la même racine d’état :

```bash
openclaw plugins inspect workboard --runtime --json
```

Si le tableau de bord affiche des cartes mais pas la CLI, vérifiez que les deux commandes utilisent
le même paramètre `--dev` ou `--profile`.

### La distribution indique uniquement des données

Démarrez ou redémarrez le Gateway :

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Réessayez ensuite `openclaw workboard dispatch`. La bascule uniquement basée sur les données est utile pour le nettoyage de l’état
local, mais les exécutions de workers nécessitent un Gateway actif.

### La distribution ne démarre rien

Vérifiez qu’il existe au moins une carte `ready` sans revendication active :

```bash
openclaw workboard list --status ready
```

Les cartes peuvent également être ignorées lorsque le même propriétaire a déjà du travail en cours d’exécution ou en revue.
Déplacez le travail terminé vers `done`, libérez les revendications obsolètes via les outils Workboard,
ou relancez la distribution après la fin du worker actif.

## Connexe

- [Plugin Workboard](/fr/plugins/workboard)
- [Référence CLI](/fr/cli)
- [Commandes slash](/fr/tools/slash-commands)
- [Interface de contrôle](/fr/web/control-ui)
