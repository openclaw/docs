---
read_when:
    - Vous gérez des Nodes appairés (caméras, écran, canevas)
    - Vous devez approuver les requêtes ou invoquer des commandes Node
summary: Référence de la CLI pour `openclaw nodes` (état, appairage, invocation, caméra/canevas/écran/localisation/notification)
title: Nœuds
x-i18n:
    generated_at: "2026-07-16T13:05:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérez les Nodes appairés (appareils) et invoquez leurs capacités.

Voir aussi : [Présentation des Nodes](/fr/nodes) - [Présence active de l’ordinateur](/fr/nodes/presence) - [Nodes de caméra](/fr/nodes/camera) - [Nodes d’image](/fr/nodes/images)

Options communes à chaque sous-commande : `--url <url>`, `--token <token>`, `--timeout <ms>` (valeur par défaut : `10000`), `--json`.

## État

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` et `list` acceptent tous deux `--connected` (uniquement les Nodes connectés) et `--last-connected <duration>` (par exemple `24h`, `7d` ; uniquement les Nodes qui se sont connectés au cours de cette durée). `list` affiche les Nodes en attente et appairés dans des tableaux distincts, les lignes des Nodes appairés indiquant le temps écoulé depuis la connexion la plus récente (Last Connect) ; `status` affiche un tableau fusionné comprenant les capacités, la version et les détails de la dernière entrée de chaque Node. Un Node macOS connecté ne signale la dernière entrée que lorsque l’autorisation Accessibilité est accordée, et la ligne la plus récente est marquée `active` ; consultez [Présence active de l’ordinateur](/fr/nodes/presence). `describe` affiche les capacités, les autorisations, l’activité et les commandes d’invocation effectives ou en attente d’un Node.

## Appairage

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Ces commandes pilotent le stockage `node.pair.*` détenu par le Gateway, distinct de l’appairage des appareils (`openclaw devices approve`) qui contrôle la négociation `connect` du WS du Node. Consultez [Nodes](/fr/nodes) pour comprendre la relation entre les deux.

- `remove` révoque l’entrée de rôle appairé du Node. Pour un Node associé à un appareil, cette opération révoque le rôle `node` dans le stockage d’appairage des appareils et déconnecte ses sessions ayant le rôle Node : un appareil à rôles multiples conserve sa ligne et perd uniquement le rôle `node`, tandis que la ligne d’un appareil ayant uniquement le rôle Node est supprimée. Elle efface également tout enregistrement d’appairage de Node hérité correspondant détenu par le Gateway.
- `pending` nécessite uniquement la portée `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape de mise en attente pour l’appairage initial d’un appareil `role: node` explicitement approuvé. Désactivé par défaut ; n’approuve pas les élévations de rôle.
- `gateway.nodes.pairing.sshVerify` (activé par défaut) approuve automatiquement l’appairage initial d’un appareil `role: node` lorsque le Gateway peut vérifier la clé de l’appareil par SSH auprès de l’hôte du Node ; la première surface de capacités est approuvée au cours de la même étape. Consultez [Appairage des Nodes](/fr/gateway/pairing#ssh-verified-device-auto-approval-default).
- Les exigences de portée de `approve` dépendent des commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes ordinaires de Node : `operator.pairing` + `operator.write`
  - commandes sensibles réservées à l’administration (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` et `system.execApprovals.get/set`) : `operator.pairing` + `operator.admin`
- Portée de `remove` : `operator.pairing` peut supprimer les lignes de Nodes sans rôle d’opérateur ; l’appelant utilisant un jeton d’appareil qui révoque son propre rôle Node sur un appareil à rôles multiples a également besoin de `operator.admin`.

## Invocation

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Options :

- `--command <command>` (obligatoire) : par exemple `canvas.eval`.
- `--params <json>` : chaîne représentant un objet JSON (valeur par défaut : `{}`).
- `--invoke-timeout <ms>` : délai d’expiration de l’invocation du Node (valeur par défaut : `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.

`system.run` et `system.run.prepare` sont bloqués ici ; utilisez plutôt l’outil `exec` avec `host=node` pour exécuter des commandes shell. `system.which` est autorisé par l’intermédiaire de `invoke`.

## Notification, push, localisation et écran

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` envoie une notification locale sur un Node qui déclare `system.notify`, notamment les Nodes macOS, iOS, Android et watchOS directs. La remise directe sur watchOS exige qu’OpenClaw soit actif. Nécessite `--title` ou `--body`. Options : `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (valeur par défaut : `system`), `--invoke-timeout <ms>` (valeur par défaut : `15000`).
- `push` envoie une notification push de test APNs à un Node iOS. Options : `--title <text>` (valeur par défaut : `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` pour remplacer l’environnement APNs détecté.
- `location get` récupère la position actuelle du Node. Options : `--max-age <ms>` (réutiliser une position mise en cache), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (valeur par défaut : `10000`), `--invoke-timeout <ms>` (valeur par défaut : `20000`).
- `screen record` capture une courte séquence et affiche le chemin d’enregistrement (ou écrit du JSON avec `--json`). Options : `--screen <index>` (valeur par défaut : `0`), `--duration <ms|10s>` (valeur par défaut : `10000`), `--fps <fps>` (valeur par défaut : `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (valeur par défaut : `120000`).

Les commandes de caméra et de Canvas disposent de leur propre documentation : [Nodes de caméra](/fr/nodes/camera), [Canvas](/fr/platforms/mac/canvas). Canvas est implémenté par le Plugin Canvas expérimental fourni ; le cœur conserve `openclaw nodes canvas` comme point de montage de compatibilité.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
