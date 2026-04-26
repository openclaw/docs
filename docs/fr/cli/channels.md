---
read_when:
    - Vous souhaitez ajouter/supprimer des comptes de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Vous souhaitez vérifier l’état du canal ou suivre les journaux du canal
summary: Référence CLI pour `openclaw channels` (comptes, statut, connexion/déconnexion, journaux)
title: Canaux
x-i18n:
    generated_at: "2026-04-26T12:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gérez les comptes de canaux de chat et leur état d’exécution sur la Gateway.

Documentation associée :

- Guides des canaux : [Canaux](/fr/channels/index)
- Configuration de la Gateway : [Configuration](/fr/gateway/configuration)

## Commandes courantes

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Statut / capacités / résolution / journaux

- `channels status` : `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin en direct : sur une gateway accessible, il exécute les vérifications `probeAccount` et `auditAccount` facultatives pour chaque compte, de sorte que la sortie peut inclure l’état du transport ainsi que des résultats de sonde tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si la gateway est inaccessible, `channels status` revient à des résumés basés uniquement sur la configuration au lieu d’une sortie de sonde en direct.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Conseil : `openclaw channels add --help` affiche les indicateurs propres à chaque canal (token, clé privée, token d’application, chemins signal-cli, etc.).

Les surfaces d’ajout non interactif courantes incluent :

- canaux à bot-token : `--token`, `--bot-token`, `--app-token`, `--token-file`
- champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- champs Nostr : `--private-key`, `--relay-urls`
- champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification par variable d’environnement du compte par défaut lorsque c’est pris en charge

Si un plugin de canal doit être installé pendant une commande d’ajout pilotée par indicateurs, OpenClaw utilise la source d’installation par défaut du canal sans ouvrir l’invite interactive d’installation du plugin.

Lorsque vous exécutez `openclaw channels add` sans indicateurs, l’assistant interactif peut demander :

- les identifiants de compte pour chaque canal sélectionné
- des noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez l’association immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des associations de routage à l’échelle du compte.

Vous pouvez également gérer plus tard ces mêmes règles de routage avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de niveau supérieur à compte unique, OpenClaw promeut les valeurs de niveau supérieur à portée de compte dans la map des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux intégrés peuvent à la place conserver un compte promu existant correspondant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion conserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les associations existantes propres au canal (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement des associations en mode non interactif.
- La configuration interactive peut ajouter facultativement des associations à portée de compte.

Si votre configuration était déjà dans un état mixte (présence de comptes nommés et valeurs de niveau supérieur à compte unique encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs à portée de compte dans le compte promu choisi pour ce canal. La plupart des canaux promeuvent vers `accounts.default` ; Matrix peut conserver une cible nommée/par défaut existante à la place.

## Connexion / déconnexion (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Remarques :

- `channels login` prend en charge `--verbose`.
- `channels login` / `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde large.
- Utilisez `openclaw doctor` pour des corrections guidées.
- `openclaw channels list` affiche `Claude: HTTP 403 ... user:profile` → l’instantané d’utilisation a besoin de la portée `user:profile`. Utilisez `--no-usage`, ou fournissez une clé de session claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou réauthentifiez-vous via Claude CLI.
- `openclaw channels status` revient à des résumés basés uniquement sur la configuration lorsque la gateway est inaccessible. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des notes dégradées au lieu de l’afficher comme non configuré.

## Sonde de capacités

Récupérez des indications sur les capacités du fournisseur (intents/portées lorsque disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (y compris les extensions).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant de canal numérique brut et s’applique uniquement à Discord.
- Les sondes sont spécifiques au fournisseur : intents Discord + permissions de canal facultatives ; portées bot + utilisateur Slack ; indicateurs bot Telegram + webhook ; version du démon Signal ; token d’application Microsoft Teams + rôles/portées Graph (annotés lorsque connus). Les canaux sans sonde signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résolvez les noms de canaux/utilisateurs en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats non résolus dégradés avec des notes au lieu d’interrompre toute l’exécution.

## Associé

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
