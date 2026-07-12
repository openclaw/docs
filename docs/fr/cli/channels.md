---
read_when:
    - Vous souhaitez ajouter ou supprimer des comptes de canaux (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp, etc.)
    - Vous souhaitez vérifier l’état du canal ou suivre en continu les journaux du canal
summary: Référence de la CLI pour `openclaw channels` (comptes, état, fonctionnalités, résolution, journaux, connexion/déconnexion)
title: Canaux
x-i18n:
    generated_at: "2026-07-12T02:41:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gérez les comptes de canaux de discussion et leur état d’exécution sur le Gateway.

Documentation associée :

- Guides des canaux : [Canaux](/fr/channels)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)

## Commandes courantes

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` affiche uniquement les canaux de discussion : par défaut, les comptes configurés, avec les indicateurs d’état `installed`, `configured` et `enabled` pour chaque compte (`--json` pour une sortie exploitable par une machine). Utilisez `--all` pour afficher également les canaux intégrés qui ne disposent pas encore de compte configuré et les canaux du catalogue installables qui ne sont pas encore présents sur le disque. L’authentification des fournisseurs et l’utilisation des modèles sont gérées ailleurs : `openclaw models auth list` pour les profils d’authentification des fournisseurs, `openclaw status` ou `openclaw models list` pour l’utilisation et les quotas.

## État / capacités / résolution / journaux

- `channels status` : `--channel <name>`, `--probe`, `--timeout <ms>` (valeur par défaut : `10000`), `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (nécessite `--channel`), `--target <dest>` (nécessite `--channel`), `--timeout <ms>` (valeur par défaut : `10000`, plafonnée à `30000`), `--json`
- `channels resolve <entries...>` : `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valeur par défaut : `auto`), `--json`
- `channels logs` : `--channel <name|all>` (valeur par défaut : `all`), `--lines <n>` (valeur par défaut : `200`), `--json`

`channels status --probe` utilise le chemin d’exécution en direct : sur un Gateway accessible, il exécute pour chaque compte les vérifications `probeAccount` et, facultativement, `auditAccount`. La sortie peut donc inclure l’état du transport ainsi que des résultats de vérification tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le Gateway est inaccessible, `channels status` se rabat sur des résumés fondés uniquement sur la configuration au lieu d’afficher les résultats des vérifications en direct.

N’utilisez pas `openclaw sessions`, `sessions.list` du Gateway ni l’outil d’agent `sessions_list` comme indicateur d’état des connexions de canal. Ces interfaces indiquent les lignes de conversation enregistrées, et non l’état d’exécution du fournisseur. Après le redémarrage d’un fournisseur Discord, un compte connecté mais inactif peut être opérationnel sans qu’aucune ligne de session Discord n’apparaisse avant le prochain événement de conversation entrant ou sortant.

## Ajout / suppression de comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les options propres à chaque canal (jeton, clé privée, jeton d’application, chemins de signal-cli, etc.).
</Tip>

`channels remove` agit uniquement sur les plugins de canal installés ou configurés. Pour les canaux installables du catalogue, utilisez d’abord `channels add`. Sans `--delete`, la commande propose de désactiver le compte et conserve sa configuration ; `--delete` supprime les entrées de configuration sans demander de confirmation.
Pour les plugins de canal adossés à un environnement d’exécution, `channels remove` demande également au Gateway en cours d’exécution d’arrêter le compte sélectionné avant de mettre à jour la configuration. Ainsi, la désactivation ou la suppression d’un compte ne laisse pas l’ancien processus d’écoute actif jusqu’au redémarrage.

Options d’ajout non interactif communes aux canaux : `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` et `--use-env` (authentification fournie par l’environnement, uniquement pour le compte par défaut, lorsque cette option est prise en charge). Les options propres aux canaux comprennent :

| Canal       | Options                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Si un plugin de canal doit être installé lors d’une commande d’ajout pilotée par des options, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation du plugin.

Lorsque vous exécutez `openclaw channels add` sans option, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné ;
- des noms d’affichage facultatifs pour ces comptes ;
- `Route these channel accounts to agents now?`

Si vous confirmez l’association immédiate, l’assistant demande quel agent doit prendre en charge chaque compte de canal configuré et écrit des liaisons de routage propres à chaque compte.

Vous pouvez également gérer ultérieurement ces mêmes règles de routage avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte autre que celui par défaut à un canal qui utilise encore des paramètres de premier niveau pour un seul compte, OpenClaw transfère ces valeurs de premier niveau vers la table des comptes du canal avant d’écrire le nouveau compte. Le transfert réutilise un compte nommé existant lorsque le canal en possède exactement un, ou lorsque `defaultAccount` en désigne un ; sinon, les valeurs sont placées dans `channels.<channel>.accounts.default`.

Le comportement du routage reste cohérent :

- Les liaisons existantes propres au canal uniquement (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut facultativement ajouter des liaisons propres aux comptes.

Si votre configuration était déjà dans un état mixte (présence de comptes nommés et de valeurs de premier niveau pour un seul compte), exécutez `openclaw doctor --fix` afin de déplacer les valeurs propres au compte vers le compte transféré choisi pour ce canal.

## Connexion et déconnexion (interactives)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--account <id>` et `--verbose` ; `channels logout` prend en charge `--account <id>`.
- `channels login` et `logout` peuvent déduire le canal lorsqu’un seul canal configuré prend en charge cette action ; s’il y en a plusieurs, utilisez `--channel`.
- `channels logout` privilégie le chemin du Gateway en direct lorsqu’il est accessible, afin que la déconnexion arrête tout processus d’écoute actif avant d’effacer l’état d’authentification du canal. Si aucun Gateway local n’est accessible, la commande se rabat sur le nettoyage local de l’authentification ; avec `gateway.mode: "remote"`, l’erreur du Gateway provoque l’échec de la commande.
- Après une connexion réussie, la CLI demande à un Gateway local accessible de démarrer le compte ; en mode distant, elle enregistre l’authentification localement et indique que l’environnement d’exécution distant n’a pas été redémarré.
- Exécutez `channels login` depuis un terminal sur l’hôte du Gateway. La commande `exec` de l’agent bloque ce processus de connexion interactif ; lorsqu’ils sont disponibles, les outils de connexion d’agent propres au canal, tels que `whatsapp_login`, doivent être utilisés depuis la discussion.

## Résolution des problèmes

- Exécutez `openclaw status --deep` pour effectuer une vérification étendue.
- Utilisez `openclaw doctor` pour bénéficier de corrections guidées.
- `openclaw channels status` se rabat sur des résumés fondés uniquement sur la configuration lorsque le Gateway est inaccessible. Si les identifiants d’un canal pris en charge sont configurés au moyen de SecretRef mais indisponibles dans le chemin d’exécution actuel de la commande, celle-ci indique que le compte est configuré, avec des remarques signalant un fonctionnement dégradé, plutôt que de l’afficher comme non configuré.

## Vérification des capacités

Récupérez les indications de capacités du fournisseur (intentions et portées lorsqu’elles sont disponibles), ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour répertorier tous les canaux, y compris ceux fournis par des plugins.
- `--account` n’est valable qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et s’applique uniquement à Discord. Pour les canaux vocaux Discord, la vérification des autorisations signale l’absence de `ViewChannel`, `Connect`, `Speak`, `SendMessages` et `ReadMessageHistory`.
- Les vérifications sont propres aux fournisseurs : identité du bot Discord et intentions, ainsi que les autorisations facultatives du canal ; bot Slack et portées utilisateur ; options du bot Telegram et Webhook ; version du démon Signal ; jeton d’application Microsoft Teams et rôles ou portées Graph, annotés lorsqu’ils sont connus. Les canaux sans vérification indiquent `Probe: unavailable`.

## Résolution des noms en identifiants

Résolvez les noms de canaux ou d’utilisateurs en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour imposer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées portent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré au moyen de SecretRef mais que ces identifiants sont indisponibles dans le chemin d’exécution actuel de la commande, celle-ci renvoie des résultats non résolus dégradés accompagnés de remarques, au lieu d’interrompre toute l’exécution.
- `channels resolve` n’installe pas les plugins de canal. Utilisez `channels add --channel <name>` avant de résoudre les noms d’un canal installable du catalogue.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
