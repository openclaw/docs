---
read_when:
    - Vous voulez ajouter/supprimer des comptes de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Vous voulez vérifier l’état d’un canal ou suivre les journaux d’un canal
summary: Référence CLI pour `openclaw channels` (comptes, état, connexion/déconnexion, journaux)
title: Canaux
x-i18n:
    generated_at: "2026-04-30T07:17:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gérer les comptes de canaux de chat et leur état d’exécution sur le Gateway.

Docs associées :

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

`channels status --probe` est le chemin en direct : sur un gateway joignable, il exécute les vérifications `probeAccount` et, éventuellement, `auditAccount` pour chaque compte, si bien que la sortie peut inclure l’état du transport ainsi que les résultats de sonde comme `works`, `probe failed`, `audit ok` ou `audit failed`. Si le gateway est injoignable, `channels status` revient à des résumés fondés uniquement sur la configuration au lieu d’une sortie de sonde en direct.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` affiche les options propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).
</Tip>

Les surfaces d’ajout non interactives courantes incluent :

- canaux à jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- Champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Champs Nostr : `--private-key`, `--relay-urls`
- Champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification du compte par défaut adossée à l’environnement, lorsqu’elle est prise en charge

Si un Plugin de canal doit être installé pendant une commande d’ajout pilotée par options, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation de Plugin.

Lorsque vous exécutez `openclaw channels add` sans options, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné
- les noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez la liaison immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage propres au compte.

Vous pouvez aussi gérer les mêmes règles de routage plus tard avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de premier niveau à compte unique, OpenClaw promeut les valeurs de premier niveau propres au compte dans la carte des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux fournis peuvent conserver à la place un compte promu correspondant existant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion conserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes propres au canal uniquement (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut éventuellement ajouter des liaisons propres au compte.

Si votre configuration était déjà dans un état mixte (comptes nommés présents et valeurs de premier niveau à compte unique encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs propres au compte dans le compte promu choisi pour ce canal. La plupart des canaux promeuvent vers `accounts.default` ; Matrix peut plutôt conserver une cible nommée/par défaut existante.

## Connexion et déconnexion (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` prend en charge `--verbose`.
- `channels login` et `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.
- Exécutez `channels login` depuis un terminal sur l’hôte du gateway. La commande `exec` de l’agent bloque ce flux de connexion interactif ; les outils de connexion natifs au canal pour agent, comme `whatsapp_login`, doivent être utilisés depuis le chat lorsqu’ils sont disponibles.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde large.
- Utilisez `openclaw doctor` pour des corrections guidées.
- `openclaw channels list` affiche `Claude: HTTP 403 ... user:profile` → l’instantané d’utilisation nécessite le scope `user:profile`. Utilisez `--no-usage`, fournissez une clé de session claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) ou réauthentifiez-vous via le CLI Claude.
- `openclaw channels status` revient à des résumés fondés uniquement sur la configuration lorsque le gateway est injoignable. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des notes dégradées au lieu de l’afficher comme non configuré.

## Sonde des capacités

Récupérer les indications de capacités du fournisseur (intents/scopes lorsqu’ils sont disponibles), ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notes :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (y compris les extensions).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant numérique brut de canal et ne s’applique qu’à Discord.
- Les sondes sont propres au fournisseur : intents Discord + permissions facultatives du canal ; scopes de bot + utilisateur Slack ; options de bot Telegram + Webhook ; version du démon Signal ; jeton d’application Microsoft Teams + rôles/scopes Graph (annotés lorsqu’ils sont connus). Les canaux sans sondes signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résoudre les noms de canaux/utilisateurs en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notes :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats non résolus dégradés avec des notes au lieu d’interrompre toute l’exécution.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
