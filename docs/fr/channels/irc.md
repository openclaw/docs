---
read_when:
    - Vous voulez connecter OpenClaw à des canaux IRC ou à des messages privés
    - Vous configurez des listes d’autorisation IRC, une stratégie de groupe ou un contrôle des mentions
summary: Configuration du Plugin IRC, contrôles d’accès et dépannage
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Utilisez IRC lorsque vous voulez OpenClaw dans des canaux classiques (`#room`) et des messages directs.
IRC est fourni comme Plugin groupé, mais il se configure dans la configuration principale sous `channels.irc`.

## Démarrage rapide

1. Activez la configuration IRC dans `~/.openclaw/openclaw.json`.
2. Définissez au moins :

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Préférez un serveur IRC privé pour la coordination des bots. Si vous utilisez intentionnellement un réseau IRC public, les choix courants incluent Libera.Chat, OFTC et Snoonet. Évitez les canaux publics prévisibles pour le trafic de canal de communication secondaire de bot ou d’essaim.

3. Démarrez/redémarrez le Gateway :

```bash
openclaw gateway run
```

## Paramètres de sécurité par défaut

- IRC utilise des sockets TCP/TLS brutes en dehors du routage par proxy de transfert géré par l’opérateur OpenClaw. Dans les déploiements qui exigent que tout le trafic sortant passe par ce proxy de transfert, définissez `channels.irc.enabled=false` sauf si le trafic sortant IRC direct est explicitement approuvé.
- `channels.irc.dmPolicy` vaut par défaut `"pairing"`.
- `channels.irc.groupPolicy` vaut par défaut `"allowlist"`.
- Avec `groupPolicy="allowlist"`, définissez `channels.irc.groups` pour définir les canaux autorisés.
- Utilisez TLS (`channels.irc.tls=true`) sauf si vous acceptez intentionnellement un transport en texte clair.

## Contrôle d’accès

Il existe deux « portes » séparées pour les canaux IRC :

1. **Accès au canal** (`groupPolicy` + `groups`) : si le bot accepte ou non les messages d’un canal.
2. **Accès de l’expéditeur** (`groupAllowFrom` / `groups["#channel"].allowFrom` par canal) : qui est autorisé à déclencher le bot dans ce canal.

Clés de configuration :

- Liste d’autorisation des MD (accès des expéditeurs de MD) : `channels.irc.allowFrom`
- Liste d’autorisation des expéditeurs de groupe (accès des expéditeurs du canal) : `channels.irc.groupAllowFrom`
- Contrôles par canal (règles de canal + expéditeur + mention) : `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` autorise les canaux non configurés (**toujours soumis aux mentions par défaut**)

Les entrées de liste d’autorisation doivent utiliser des identités d’expéditeur stables (`nick!user@host`).
La correspondance par simple pseudo est mutable et n’est activée que lorsque `channels.irc.dangerouslyAllowNameMatching: true`.

### Piège courant : `allowFrom` sert aux MD, pas aux canaux

Si vous voyez des journaux comme :

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…cela signifie que l’expéditeur n’était pas autorisé pour les messages de **groupe/canal**. Corrigez cela soit en :

- définissant `channels.irc.groupAllowFrom` (global pour tous les canaux), soit en
- définissant des listes d’autorisation d’expéditeurs par canal : `channels.irc.groups["#channel"].allowFrom`

Exemple (autoriser n’importe qui dans `#tuirc-dev` à parler au bot) :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Déclenchement des réponses (mentions)

Même si un canal est autorisé (via `groupPolicy` + `groups`) et que l’expéditeur est autorisé, OpenClaw applique par défaut une **porte par mention** dans les contextes de groupe.

Cela signifie que vous pouvez voir des journaux comme `drop channel … (missing-mention)`, sauf si le message inclut un motif de mention qui correspond au bot.

Pour que le bot réponde dans un canal IRC **sans nécessiter de mention**, désactivez la porte par mention pour ce canal :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ou, pour autoriser **tous** les canaux IRC (sans liste d’autorisation par canal) tout en répondant sans mentions :

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Note de sécurité (recommandée pour les canaux publics)

Si vous autorisez `allowFrom: ["*"]` dans un canal public, n’importe qui peut envoyer une invite au bot.
Pour réduire le risque, restreignez les outils pour ce canal.

### Mêmes outils pour tout le monde dans le canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Outils différents par expéditeur (le propriétaire obtient plus de pouvoir)

Utilisez `toolsBySender` pour appliquer une politique plus stricte à `"*"` et une politique plus souple à votre pseudo :

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notes :

- Les clés `toolsBySender` doivent utiliser `id:` pour les valeurs d’identité d’expéditeur IRC :
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` pour une correspondance plus forte.
- Les clés héritées sans préfixe sont toujours acceptées et correspondent uniquement comme `id:`.
- La première politique d’expéditeur correspondante l’emporte ; `"*"` est le repli générique.

Pour en savoir plus sur l’accès de groupe par rapport à la porte par mention (et sur leur interaction), consultez : [/channels/groups](/fr/channels/groups).

## NickServ

Pour vous identifier auprès de NickServ après la connexion :

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Inscription ponctuelle facultative à la connexion :

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Désactivez `register` une fois le pseudo enregistré afin d’éviter les tentatives REGISTER répétées.

## Variables d’environnement

Le compte par défaut prend en charge :

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (séparé par des virgules)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` ne peut pas être défini depuis un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Dépannage

- Si le bot se connecte mais ne répond jamais dans les canaux, vérifiez `channels.irc.groups` **et** si la porte par mention supprime les messages (`missing-mention`). Si vous voulez qu’il réponde sans mentions, définissez `requireMention:false` pour le canal.
- Si la connexion échoue, vérifiez la disponibilité du pseudo et le mot de passe du serveur.
- Si TLS échoue sur un réseau personnalisé, vérifiez l’hôte/le port et la configuration du certificat.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par MD et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et porte par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
