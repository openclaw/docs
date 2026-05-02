---
read_when:
    - Vous voulez ajouter/supprimer des comptes de canaux (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vous voulez vérifier l’état du canal ou suivre les journaux du canal en temps réel
summary: Référence CLI pour `openclaw channels` (comptes, état, connexion/déconnexion, journaux)
title: Canaux
x-i18n:
    generated_at: "2026-05-02T07:00:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
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
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## État / capacités / résolution / journaux

- `channels status` : `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin en direct : sur un Gateway joignable, il exécute des vérifications
`probeAccount` et, le cas échéant, `auditAccount` par compte, de sorte que la sortie peut inclure l’état
du transport ainsi que les résultats de sonde tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le Gateway est injoignable, `channels status` se rabat sur des résumés fondés uniquement sur la configuration
au lieu d’une sortie de sonde en direct.

N’utilisez pas `openclaw sessions`, Gateway `sessions.list` ni l’outil d’agent
`sessions_list` comme signal d’état de santé des sockets de canal. Ces surfaces signalent
les lignes de conversation stockées, pas l’état d’exécution du fournisseur. Après un redémarrage du fournisseur Discord,
un compte connecté mais silencieux peut être sain alors qu’aucune ligne de session Discord
n’apparaît avant le prochain événement de conversation entrant ou sortant.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les indicateurs propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).
</Tip>

`channels remove` agit uniquement sur les Plugins de canal installés/configurés. Utilisez d’abord `channels add` pour les canaux installables du catalogue.
Pour les Plugins de canal adossés à l’exécution, `channels remove` demande aussi au Gateway en cours d’exécution d’arrêter le compte sélectionné avant de mettre à jour la configuration, afin que la désactivation ou la suppression d’un compte ne laisse pas l’ancien écouteur actif jusqu’au redémarrage.

Les surfaces courantes d’ajout non interactif incluent :

- canaux à jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- Champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Champs Nostr : `--private-key`, `--relay-urls`
- Champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification du compte par défaut adossée à l’environnement lorsque c’est pris en charge

Si un Plugin de canal doit être installé pendant une commande d’ajout pilotée par indicateurs, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation du Plugin.

Lorsque vous exécutez `openclaw channels add` sans indicateurs, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné
- les noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez la liaison immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage limitées au compte.

Vous pouvez aussi gérer les mêmes règles de routage plus tard avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de premier niveau à compte unique, OpenClaw promeut les valeurs de premier niveau limitées au compte dans la carte des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux intégrés peuvent à la place conserver un compte promu correspondant existant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion conserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes limitées au canal uniquement (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut ajouter facultativement des liaisons limitées au compte.

Si votre configuration était déjà dans un état mixte (comptes nommés présents et valeurs de compte unique de premier niveau encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs limitées au compte dans le compte promu choisi pour ce canal. La plupart des canaux les promeuvent dans `accounts.default` ; Matrix peut à la place conserver une cible nommée/par défaut existante.

## Connexion et déconnexion (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--verbose`.
- `channels login` et `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.
- `channels logout` privilégie le chemin Gateway en direct lorsqu’il est joignable, afin que la déconnexion arrête tout écouteur actif avant d’effacer l’état d’authentification du canal. Si un Gateway local n’est pas joignable, il se rabat sur le nettoyage de l’authentification locale.
- Exécutez `channels login` depuis un terminal sur l’hôte du Gateway. L’agent `exec` bloque ce flux de connexion interactif ; les outils de connexion natifs au canal côté agent, comme `whatsapp_login`, doivent être utilisés depuis la discussion lorsqu’ils sont disponibles.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde large.
- Utilisez `openclaw doctor` pour des corrections guidées.
- `openclaw channels list` affiche `Claude: HTTP 403 ... user:profile` → l’instantané d’utilisation nécessite la portée `user:profile`. Utilisez `--no-usage`, ou fournissez une clé de session claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou réauthentifiez-vous via Claude CLI.
- `openclaw channels status` se rabat sur des résumés fondés uniquement sur la configuration lorsque le Gateway est injoignable. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des notes dégradées au lieu de l’afficher comme non configuré.

## Sonde des capacités

Récupérez les indications de capacités du fournisseur (intentions/portées lorsqu’elles sont disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (y compris les extensions).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et ne s’applique qu’à Discord.
- Les sondes sont propres au fournisseur : intentions Discord + permissions facultatives de canal ; portées de bot + utilisateur Slack ; indicateurs de bot Telegram + Webhook ; version du démon Signal ; jeton d’application Microsoft Teams + rôles/portées Graph (annotés lorsqu’ils sont connus). Les canaux sans sondes signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résolvez les noms de canal/utilisateur en identifiants à l’aide du répertoire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats non résolus dégradés avec des notes au lieu d’abandonner toute l’exécution.
- `channels resolve` n’installe pas les Plugins de canal. Utilisez `channels add --channel <name>` avant de résoudre les noms pour un canal installable du catalogue.

## Associé

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
