---
read_when:
    - Vous voulez ajouter/supprimer des comptes de canaux (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vous voulez vérifier l’état du canal ou suivre les journaux du canal
summary: Référence CLI pour `openclaw channels` (comptes, statut, connexion/déconnexion, journaux)
title: Canaux
x-i18n:
    generated_at: "2026-05-11T20:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gérez les comptes de canaux de chat et leur état d’exécution sur le Gateway.

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

`channels list` affiche uniquement les canaux de chat : les comptes configurés par défaut, avec les balises d’état `installed`, `configured` et `enabled` par compte. Passez `--all` pour afficher aussi les canaux inclus qui n’ont pas encore de compte configuré et les canaux du catalogue installables qui ne sont pas encore présents sur disque. Les fournisseurs d’authentification (OAuth + clés API) et les instantanés d’utilisation/quota des fournisseurs de modèles ne sont plus affichés ici ; utilisez `openclaw models auth list` pour les profils d’authentification des fournisseurs et `openclaw status` ou `openclaw models list` pour l’utilisation.

## État / capacités / résolution / journaux

- `channels status` : `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin actif : sur un Gateway accessible, il exécute des vérifications
`probeAccount` et, éventuellement, `auditAccount` par compte ; la sortie peut donc inclure l’état du transport
ainsi que des résultats de sonde tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le Gateway est inaccessible, `channels status` revient à des résumés fondés uniquement sur la configuration
au lieu d’une sortie de sonde active.

N’utilisez pas `openclaw sessions`, `sessions.list` du Gateway ni l’outil agent
`sessions_list` comme signal d’état de santé des sockets de canal. Ces surfaces signalent
des lignes de conversation stockées, pas l’état d’exécution du fournisseur. Après le redémarrage
d’un fournisseur Discord, un compte connecté mais silencieux peut être sain alors qu’aucune ligne
de session Discord n’apparaît avant le prochain événement de conversation entrant ou sortant.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les options propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).
</Tip>

`channels remove` agit uniquement sur les Plugins de canal installés/configurés. Utilisez d’abord `channels add` pour les canaux du catalogue installables.
Pour les Plugins de canal adossés à l’exécution, `channels remove` demande aussi au Gateway en cours d’exécution d’arrêter le compte sélectionné avant de mettre à jour la configuration ; désactiver ou supprimer un compte ne laisse donc pas l’ancien écouteur actif jusqu’au redémarrage.

Les surfaces d’ajout non interactives courantes incluent :

- canaux avec jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- champs Nostr : `--private-key`, `--relay-urls`
- champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification adossée à l’environnement du compte par défaut lorsqu’elle est prise en charge

Si un Plugin de canal doit être installé pendant une commande d’ajout pilotée par options, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation de Plugin.

Lorsque vous exécutez `openclaw channels add` sans options, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné
- des noms d’affichage facultatifs pour ces comptes
- `Route these channel accounts to agents now?`

Si vous confirmez la liaison immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage propres au compte.

Vous pouvez aussi gérer les mêmes règles de routage plus tard avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de niveau supérieur à compte unique, OpenClaw promeut les valeurs de niveau supérieur propres au compte dans la carte des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux inclus peuvent préserver à la place un compte promu correspondant déjà existant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion préserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes propres au canal uniquement (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement de liaisons en mode non interactif.
- La configuration interactive peut éventuellement ajouter des liaisons propres au compte.

Si votre configuration était déjà dans un état mixte (comptes nommés présents et valeurs de compte unique de niveau supérieur encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs propres au compte dans le compte promu choisi pour ce canal. La plupart des canaux promeuvent vers `accounts.default` ; Matrix peut préserver à la place une cible nommée/par défaut existante.

## Connexion et déconnexion (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--verbose`.
- `channels login` et `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.
- `channels logout` privilégie le chemin du Gateway actif lorsqu’il est accessible, de sorte que la déconnexion arrête tout écouteur actif avant d’effacer l’état d’authentification du canal. Si un Gateway local n’est pas accessible, elle revient au nettoyage local de l’authentification.
- Exécutez `channels login` depuis un terminal sur l’hôte du Gateway. L’agent `exec` bloque ce flux de connexion interactif ; les outils de connexion natifs du canal côté agent, tels que `whatsapp_login`, doivent être utilisés depuis le chat lorsqu’ils sont disponibles.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde large.
- Utilisez `openclaw doctor` pour des corrections guidées.
- `openclaw channels list` n’affiche plus les instantanés d’utilisation/quota des fournisseurs de modèles. Pour ceux-ci, utilisez `openclaw status` (vue d’ensemble) ou `openclaw models list` (par fournisseur).
- `openclaw channels status` revient à des résumés fondés uniquement sur la configuration lorsque le Gateway est inaccessible. Si l’identifiant d’un canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, le compte est signalé comme configuré avec des notes dégradées au lieu d’être indiqué comme non configuré.

## Sonde de capacités

Récupérez les indications de capacités du fournisseur (intentions/portées lorsqu’elles sont disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notes :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (extensions comprises).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et s’applique uniquement à Discord. Pour les canaux vocaux Discord, la vérification des autorisations signale les droits manquants `ViewChannel`, `Connect`, `Speak`, `SendMessages` et `ReadMessageHistory`.
- Les sondes sont propres au fournisseur : intentions Discord + autorisations de canal facultatives ; portées bot + utilisateur Slack ; indicateurs de bot Telegram + Webhook ; version du démon Signal ; jeton d’application Microsoft Teams + rôles/portées Graph (annotés lorsque connus). Les canaux sans sondes signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résolvez les noms de canaux/utilisateurs en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notes :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande retourne des résultats non résolus dégradés avec des notes au lieu d’interrompre toute l’exécution.
- `channels resolve` n’installe pas les Plugins de canal. Utilisez `channels add --channel <name>` avant de résoudre des noms pour un canal du catalogue installable.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
