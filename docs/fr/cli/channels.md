---
read_when:
    - Vous souhaitez ajouter ou supprimer des comptes de canaux (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp, entre autres)
    - Vous souhaitez vérifier l’état du canal ou suivre ses journaux en temps réel
summary: Référence de la CLI pour `openclaw channels` (comptes, état, fonctionnalités, résolution, journaux, connexion/déconnexion)
title: Canaux
x-i18n:
    generated_at: "2026-07-12T15:13:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

`channels list` affiche uniquement les canaux de discussion : par défaut, les comptes configurés, avec les indicateurs d’état `installed`, `configured` et `enabled` pour chaque compte (`--json` pour une sortie exploitable par une machine). Utilisez `--all` pour afficher également les canaux intégrés qui n’ont pas encore de compte configuré ainsi que les canaux du catalogue installables qui ne sont pas encore présents sur le disque. L’authentification des fournisseurs et l’utilisation des modèles sont gérées ailleurs : `openclaw models auth list` pour les profils d’authentification des fournisseurs, `openclaw status` ou `openclaw models list` pour l’utilisation et les quotas.

## État / capacités / résolution / journaux

- `channels status` : `--channel <name>`, `--probe`, `--timeout <ms>` (valeur par défaut : `10000`), `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (nécessite `--channel`), `--target <dest>` (nécessite `--channel`), `--timeout <ms>` (valeur par défaut : `10000`, plafonnée à `30000`), `--json`
- `channels resolve <entries...>` : `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (valeur par défaut : `auto`), `--json`
- `channels logs` : `--channel <name|all>` (valeur par défaut : `all`), `--lines <n>` (valeur par défaut : `200`), `--json`

`channels status --probe` est le chemin de vérification en direct : sur un Gateway accessible, il exécute pour chaque compte les vérifications `probeAccount` et, éventuellement, `auditAccount`. La sortie peut donc inclure l’état du transport ainsi que des résultats de vérification tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le Gateway est inaccessible, `channels status` utilise à la place des résumés fondés uniquement sur la configuration, sans résultats de vérification en direct.

N’utilisez pas `openclaw sessions`, `sessions.list` du Gateway ni l’outil `sessions_list` de l’agent comme indicateur de l’état de la connexion d’un canal. Ces interfaces signalent les lignes de conversation stockées, et non l’état d’exécution du fournisseur. Après le redémarrage d’un fournisseur Discord, un compte connecté mais inactif peut être opérationnel alors qu’aucune ligne de session Discord n’apparaît avant le prochain événement de conversation entrant ou sortant.

## Ajout / suppression de comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les options propres à chaque canal (jeton, clé privée, jeton d’application, chemins de signal-cli, etc.).
</Tip>

`channels remove` fonctionne uniquement avec les plugins de canal installés ou configurés. Pour les canaux installables du catalogue, utilisez d’abord `channels add`. Sans `--delete`, la commande propose de désactiver le compte et conserve sa configuration ; `--delete` supprime les entrées de configuration sans demander de confirmation.
Pour les plugins de canal adossés à un environnement d’exécution, `channels remove` demande également au Gateway en cours d’exécution d’arrêter le compte sélectionné avant de mettre à jour la configuration. Ainsi, la désactivation ou la suppression d’un compte ne laisse pas l’ancien écouteur actif jusqu’au redémarrage.

Options d’ajout non interactif communes aux différents canaux : `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` et `--use-env` (authentification fondée sur l’environnement, uniquement pour le compte par défaut, lorsque cette option est prise en charge). Les options propres aux canaux comprennent :

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

Lorsque vous exécutez `openclaw channels add` sans options, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné
- des noms d’affichage facultatifs pour ces comptes
- `Route these channel accounts to agents now?`

Si vous confirmez l’association immédiate, l’assistant demande quel agent doit gérer chaque compte de canal configuré et écrit des associations de routage propres à chaque compte.

Vous pouvez également gérer ultérieurement les mêmes règles de routage avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte autre que celui par défaut à un canal qui utilise encore des paramètres de compte unique au niveau supérieur, OpenClaw transfère ces valeurs de niveau supérieur vers la table des comptes du canal avant d'écrire le nouveau compte. Ce transfert réutilise un compte nommé existant lorsque le canal en possède exactement un, ou lorsque `defaultAccount` en désigne un ; sinon, les valeurs sont placées dans `channels.<channel>.accounts.default`.

Le comportement du routage reste cohérent :

- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut éventuellement ajouter des liaisons limitées à un compte.

Si votre configuration était déjà dans un état mixte (présence de comptes nommés et valeurs de compte unique toujours définies au niveau supérieur), exécutez `openclaw doctor --fix` pour déplacer les valeurs propres au compte vers le compte transféré choisi pour ce canal.

## Connexion et déconnexion (interactives)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--account <id>` et `--verbose` ; `channels logout` prend en charge `--account <id>`.
- `channels login` et `logout` peuvent déduire le canal lorsqu'un seul canal configuré prend en charge cette action ; s'il y en a plusieurs, transmettez `--channel`.
- `channels logout` privilégie le chemin du Gateway actif lorsqu'il est joignable, afin que la déconnexion arrête tout écouteur actif avant d'effacer l'état d'authentification du canal. Si un Gateway local n'est pas joignable, la commande se rabat sur le nettoyage local de l'authentification ; avec `gateway.mode: "remote"`, l'erreur du Gateway fait au contraire échouer la commande.
- Après une connexion réussie, la CLI demande à un Gateway local joignable de démarrer le compte ; en mode distant, elle enregistre l'authentification localement et indique que l'environnement d'exécution distant n'a pas été redémarré.
- Exécutez `channels login` depuis un terminal sur l'hôte du Gateway. La commande `exec` de l'agent bloque ce flux de connexion interactif ; les outils de connexion d'agent natifs du canal, tels que `whatsapp_login`, doivent être utilisés depuis la messagerie lorsqu'ils sont disponibles.

## Résolution des problèmes

- Exécutez `openclaw status --deep` pour effectuer une vérification étendue.
- Utilisez `openclaw doctor` pour bénéficier de corrections guidées.
- `openclaw channels status` se rabat sur des résumés fondés uniquement sur la configuration lorsque le Gateway est inaccessible. Si les identifiants d'un canal pris en charge sont configurés via SecretRef, mais indisponibles dans le chemin d'exécution actuel de la commande, le compte est signalé comme configuré avec des remarques indiquant un fonctionnement dégradé, au lieu d'être affiché comme non configuré.

## Vérification des capacités

Récupérez les indications sur les capacités du fournisseur (intentions/portées lorsqu'elles sont disponibles), ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour répertorier tous les canaux (y compris ceux fournis par des plugins).
- `--account` n'est valide qu'avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et ne s'applique qu'à Discord. Pour les canaux vocaux Discord, la vérification des autorisations signale l'absence de `ViewChannel`, `Connect`, `Speak`, `SendMessages` et `ReadMessageHistory`.
- Les vérifications sont propres aux fournisseurs : identité du bot Discord + intentions, ainsi qu'autorisations facultatives du canal ; portées du bot et de l'utilisateur Slack ; indicateurs du bot Telegram + Webhook ; version du démon Signal ; jeton d'application Microsoft Teams + rôles/portées Graph (annotés lorsqu'ils sont connus). Les canaux sans vérification indiquent `Probe: unavailable`.

## Résolution des noms en identifiants

Résolvez les noms de canaux et d'utilisateurs en identifiants à l'aide de l'annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour imposer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées portent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef, mais que ces identifiants sont indisponibles dans le chemin d'exécution actuel de la commande, celle-ci renvoie des résultats non résolus en mode dégradé, accompagnés de remarques, au lieu d'interrompre toute l'exécution.
- `channels resolve` n'installe pas les plugins de canaux. Utilisez `channels add --channel <name>` avant de résoudre les noms d'un canal installable du catalogue.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Présentation des canaux](/fr/channels)
