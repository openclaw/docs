---
read_when:
    - Vous gérez des Node appairés (caméras, écran, canevas)
    - Vous devez approuver les requêtes ou invoquer des commandes de Node
summary: Référence de la CLI pour `openclaw nodes` (état, appairage, invocation, caméra/canevas/écran/localisation/notification)
title: Nodes
x-i18n:
    generated_at: "2026-07-12T15:12:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gérez les Nodes appairés (appareils) et invoquez leurs capacités.

Voir aussi : [Présentation des Nodes](/fr/nodes) - [Présence active de l’ordinateur](/nodes/presence) - [Nodes de caméra](/fr/nodes/camera) - [Nodes d’image](/fr/nodes/images)

Options communes à toutes les sous-commandes : `--url <url>`, `--token <token>`, `--timeout <ms>` (valeur par défaut : `10000`), `--json`.

## État

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` et `list` acceptent tous deux `--connected` (uniquement les Nodes connectés) et `--last-connected <duration>` (par exemple `24h`, `7d` ; uniquement les Nodes qui se sont connectés pendant cette durée). `list` affiche les Nodes en attente et appairés dans des tableaux distincts, les lignes appairées indiquant l’ancienneté de la connexion la plus récente (Last Connect) ; `status` affiche un tableau fusionné avec, pour chaque Node, ses capacités, sa version et les détails de la dernière saisie. Un Node macOS connecté ne signale la dernière saisie que lorsque l’autorisation Accessibilité est accordée, et la ligne la plus récente porte la mention `active` ; consultez [Présence active de l’ordinateur](/nodes/presence). `describe` affiche les capacités, les autorisations, l’activité et les commandes d’invocation effectives ou en attente d’un Node.

## Appairage

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Ces commandes gèrent le stockage `node.pair.*` détenu par le Gateway, distinct de l’appairage des appareils (`openclaw devices approve`) qui contrôle la négociation WS `connect` du Node. Consultez [Nodes](/fr/nodes) pour comprendre leur relation.

- `remove` révoque l’entrée de rôle appairé du Node. Pour un Node associé à un appareil, cette commande révoque le rôle `node` dans le stockage d’appairage des appareils et déconnecte ses sessions dotées du rôle Node : un appareil à rôles multiples conserve sa ligne et perd uniquement le rôle `node`, tandis que la ligne d’un appareil ayant uniquement le rôle Node est supprimée. Elle efface également tout enregistrement d’appairage de Node hérité correspondant détenu par le Gateway.
- `pending` nécessite uniquement la portée `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` peut ignorer l’étape d’attente pour l’appairage initial d’un appareil avec `role: node` explicitement approuvé. Désactivé par défaut ; n’approuve pas les élévations de rôle.
- `gateway.nodes.pairing.sshVerify` (activé par défaut) approuve automatiquement l’appairage initial d’un appareil avec `role: node` lorsque le Gateway peut vérifier la clé de l’appareil par SSH auprès de l’hôte du Node ; la première surface de capacités est approuvée lors de la même étape. Consultez [Appairage d’un Node](/fr/gateway/pairing#ssh-verified-device-auto-approval-default).
- Les portées requises par `approve` dépendent des commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de Node sans exécution : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`
- Portée de `remove` : `operator.pairing` permet de supprimer les lignes de Node non-opérateur ; un appelant utilisant un jeton d’appareil qui révoque son propre rôle Node sur un appareil à rôles multiples doit en outre disposer de `operator.admin`.

## Invocation

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Options :

- `--command <command>` (obligatoire) : par exemple `canvas.eval`.
- `--params <json>` : chaîne représentant un objet JSON (valeur par défaut : `{}`).
- `--invoke-timeout <ms>` : délai d’expiration de l’invocation du Node (valeur par défaut : `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.

`system.run` et `system.run.prepare` sont bloqués ici ; utilisez plutôt l’outil `exec` avec `host=node` pour exécuter des commandes shell. `system.which` est autorisé via `invoke`.

## Notification, push, localisation et écran

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` envoie une notification locale sur un Node qui déclare `system.notify`, notamment les Nodes macOS, iOS, Android et watchOS directs. La distribution directe sur watchOS exige qu’OpenClaw soit actif. Nécessite `--title` ou `--body`. Options : `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (valeur par défaut : `system`), `--invoke-timeout <ms>` (valeur par défaut : `15000`).
- `push` envoie une notification push de test APNs à un Node iOS. Options : `--title <text>` (valeur par défaut : `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` pour remplacer l’environnement APNs détecté.
- `location get` récupère la position actuelle du Node. Options : `--max-age <ms>` (réutiliser une position mise en cache), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (valeur par défaut : `10000`), `--invoke-timeout <ms>` (valeur par défaut : `20000`).
- `screen record` capture un court extrait et affiche le chemin d’enregistrement (ou produit du JSON avec `--json`). Options : `--screen <index>` (valeur par défaut : `0`), `--duration <ms|10s>` (valeur par défaut : `10000`), `--fps <fps>` (valeur par défaut : `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (valeur par défaut : `120000`).

Les commandes Camera et Canvas disposent de leur propre documentation : [Nodes de caméra](/fr/nodes/camera), [Canvas](/fr/platforms/mac/canvas). Canvas est implémenté par le Plugin Canvas expérimental intégré ; le cœur conserve `openclaw nodes canvas` comme point de montage de compatibilité.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
