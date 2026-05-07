---
read_when:
    - Vous voulez ajouter/supprimer des comptes de canaux (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vous souhaitez vérifier l’état du canal ou suivre les journaux du canal en continu
summary: Référence CLI pour `openclaw channels` (comptes, statut, connexion/déconnexion, journaux)
title: Canaux
x-i18n:
    generated_at: "2026-05-07T13:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
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
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` affiche uniquement les canaux de discussion : les comptes configurés par défaut, avec les balises d’état `installed`, `configured` et `enabled` par compte. Passez `--all` pour afficher aussi les canaux groupés qui n’ont pas encore de compte configuré et les canaux du catalogue installables qui ne sont pas encore présents sur le disque. Les fournisseurs d’authentification (OAuth + clés d’API) et les instantanés d’utilisation/quota des fournisseurs de modèles ne sont plus affichés ici ; utilisez `openclaw models auth list` pour les profils d’authentification des fournisseurs et `openclaw status` ou `openclaw models list` pour l’utilisation.

## État / capacités / résolution / journaux

- `channels status` : `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin en direct : sur un gateway joignable, il exécute les vérifications
`probeAccount` par compte et, éventuellement, `auditAccount`, de sorte que la sortie peut inclure l’état
du transport ainsi que des résultats de sonde comme `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le gateway est injoignable, `channels status` revient à des résumés fondés uniquement sur la configuration
au lieu d’une sortie de sonde en direct.

N’utilisez pas `openclaw sessions`, `sessions.list` du Gateway ni l’outil
`sessions_list` de l’agent comme signal de santé des sockets de canal. Ces surfaces rapportent
des lignes de conversation stockées, pas l’état d’exécution du fournisseur. Après un redémarrage du fournisseur Discord,
un compte connecté mais silencieux peut être sain alors qu’aucune ligne de session Discord
n’apparaît avant le prochain événement de conversation entrant ou sortant.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les options propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).
</Tip>

`channels remove` fonctionne uniquement sur les Plugins de canaux installés/configurés. Utilisez d’abord `channels add` pour les canaux de catalogue installables.
Pour les Plugins de canaux adossés à l’exécution, `channels remove` demande aussi au Gateway en cours d’exécution d’arrêter le compte sélectionné avant de mettre à jour la configuration, afin que la désactivation ou la suppression d’un compte ne laisse pas l’ancien écouteur actif jusqu’au redémarrage.

Les surfaces d’ajout non interactives courantes comprennent :

- canaux avec jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- champs Nostr : `--private-key`, `--relay-urls`
- champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification adossée à l’environnement du compte par défaut, là où elle est prise en charge

Si un Plugin de canal doit être installé pendant une commande d’ajout pilotée par options, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation de Plugin.

Lorsque vous exécutez `openclaw channels add` sans options, l’assistant interactif peut demander :

- les identifiants de compte par canal sélectionné
- les noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez la liaison immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage limitées au compte.

Vous pouvez également gérer les mêmes règles de routage ultérieurement avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de premier niveau à compte unique, OpenClaw promeut les valeurs de premier niveau limitées au compte dans la carte des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux groupés peuvent plutôt préserver un compte promu correspondant existant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion préserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut éventuellement ajouter des liaisons limitées au compte.

Si votre configuration était déjà dans un état mixte (comptes nommés présents et valeurs de premier niveau à compte unique encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs limitées au compte dans le compte promu choisi pour ce canal. La plupart des canaux promeuvent dans `accounts.default` ; Matrix peut plutôt préserver une cible nommée/par défaut existante.

## Connexion et déconnexion (interactives)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--verbose`.
- `channels login` et `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.
- `channels logout` privilégie le chemin Gateway en direct lorsqu’il est joignable, afin que la déconnexion arrête tout écouteur actif avant d’effacer l’état d’authentification du canal. Si un Gateway local n’est pas joignable, il revient au nettoyage d’authentification local.
- Exécutez `channels login` depuis un terminal sur l’hôte du gateway. L’agent `exec` bloque ce flux de connexion interactif ; les outils de connexion natifs au canal côté agent, comme `whatsapp_login`, doivent être utilisés depuis le chat lorsqu’ils sont disponibles.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde étendue.
- Utilisez `openclaw doctor` pour des correctifs guidés.
- `openclaw channels list` n’affiche plus les instantanés d’utilisation/quota des fournisseurs de modèles. Pour ceux-ci, utilisez `openclaw status` (vue d’ensemble) ou `openclaw models list` (par fournisseur).
- `openclaw channels status` revient à des résumés fondés uniquement sur la configuration lorsque le gateway est injoignable. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des notes dégradées au lieu de l’afficher comme non configuré.

## Sonde des capacités

Récupérez les indications de capacités du fournisseur (intents/scopes lorsque disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (extensions comprises).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et ne s’applique qu’à Discord. Pour les canaux vocaux Discord, la vérification des autorisations signale l’absence de `ViewChannel`, `Connect`, `Speak`, `SendMessages` et `ReadMessageHistory`.
- Les sondes sont propres à chaque fournisseur : intents Discord + autorisations de canal facultatives ; bot Slack + scopes utilisateur ; indicateurs de bot Telegram + Webhook ; version du démon Signal ; jeton d’application Microsoft Teams + rôles/scopes Graph (annotés lorsqu’ils sont connus). Les canaux sans sondes signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résolvez les noms de canaux/utilisateurs en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats non résolus dégradés avec des notes au lieu d’interrompre toute l’exécution.
- `channels resolve` n’installe pas de Plugins de canaux. Utilisez `channels add --channel <name>` avant de résoudre des noms pour un canal de catalogue installable.

## Associé

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
