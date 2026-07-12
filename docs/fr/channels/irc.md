---
read_when:
    - Vous souhaitez connecter OpenClaw à des canaux IRC ou à des messages privés
    - Vous configurez les listes d’autorisation IRC, la stratégie de groupe ou le filtrage des mentions
summary: Configuration du plugin IRC, contrôles d’accès et dépannage
title: IRC
x-i18n:
    generated_at: "2026-07-12T15:02:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Utilisez IRC lorsque vous souhaitez intégrer OpenClaw à des canaux classiques (`#room`) et à des messages directs.
Installez le plugin IRC officiel, puis configurez-le sous `channels.irc`.

## Démarrage rapide

1. Installez le plugin :

```bash
openclaw plugins install @openclaw/irc
```

2. Définissez au minimum l’hôte, le pseudonyme et les canaux à rejoindre dans `~/.openclaw/openclaw.json` :

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

3. Démarrez ou redémarrez le Gateway :

```bash
openclaw gateway run
```

Privilégiez un serveur IRC privé pour la coordination des bots. Si vous utilisez volontairement un réseau IRC public, les choix courants incluent Libera.Chat, OFTC et Snoonet. Évitez les canaux publics prévisibles pour le trafic de communication secondaire des bots ou des essaims.

## Paramètres de connexion

| Clé                           | Valeur par défaut              | Remarques                                                            |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `host`                        | aucune (obligatoire)           | Nom d’hôte du serveur IRC                                            |
| `port`                        | `6697` avec TLS, `6667` en clair | 1-65535                                                            |
| `tls`                         | `true`                         | Définissez `false` uniquement pour utiliser volontairement du texte en clair |
| `nick`                        | aucun (obligatoire)            | Pseudonyme du bot                                                    |
| `username`                    | pseudonyme, sinon `openclaw`   | Nom d’utilisateur IRC                                                |
| `realname`                    | `OpenClaw`                     | Champ de nom réel/GECOS                                              |
| `password` / `passwordFile`   | aucun                          | Mot de passe du serveur ; le fichier doit être un fichier ordinaire  |
| `channels`                    | aucun                          | Canaux à rejoindre (`["#openclaw"]`)                                 |
| `accounts` / `defaultAccount` | aucun                          | Configuration multicomptes ; les variables d’environnement ne renseignent que le compte par défaut |

## Paramètres de sécurité par défaut

- IRC utilise des sockets TCP/TLS brutes en dehors du routage par proxy direct géré par l’opérateur OpenClaw. Dans les déploiements qui exigent que tout le trafic sortant passe par ce proxy direct, définissez `channels.irc.enabled=false`, sauf si le trafic IRC direct est explicitement approuvé.
- `channels.irc.dmPolicy` vaut par défaut `"pairing"` : les expéditeurs inconnus de messages directs reçoivent un code d’association que vous approuvez avec `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` vaut par défaut `"allowlist"`.
- Avec `groupPolicy="allowlist"`, définissez `channels.irc.groups` pour indiquer les canaux autorisés.
- Utilisez TLS (`channels.irc.tls=true`), sauf si vous acceptez volontairement un transport en clair.

## Contrôle d’accès

Il existe deux « barrières » distinctes pour les canaux IRC :

1. **Accès au canal** (`groupPolicy` + `groups`) : détermine si le bot accepte les messages provenant d’un canal.
2. **Accès de l’expéditeur** (`groupAllowFrom` / `groups["#channel"].allowFrom` par canal) : détermine qui est autorisé à déclencher le bot dans ce canal.

Clés de configuration :

- Liste d’autorisation des messages directs (accès des expéditeurs de messages directs) : `channels.irc.allowFrom`
- Liste d’autorisation des expéditeurs de groupe (accès des expéditeurs du canal) : `channels.irc.groupAllowFrom`
- Contrôles par canal (règles relatives au canal, à l’expéditeur et aux mentions) : `channels.irc.groups["#channel"]` avec `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` et `systemPrompt`
- `channels.irc.groupPolicy="open"` autorise les canaux non configurés (**les mentions restent obligatoires par défaut**)

Les entrées de la liste d’autorisation doivent utiliser des identités d’expéditeur stables (`nick!user@host`).
La correspondance sur le seul pseudonyme est modifiable et n’est activée que lorsque `channels.irc.dangerouslyAllowNameMatching: true`.

### Piège courant : `allowFrom` concerne les messages directs, pas les canaux

Si vous voyez des journaux tels que :

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...cela signifie que l’expéditeur n’était pas autorisé pour les messages de **groupe/canal**. Corrigez ce problème de l’une des manières suivantes :

- définissez `channels.irc.groupAllowFrom` (globalement pour tous les canaux), ou
- définissez des listes d’autorisation des expéditeurs par canal : `channels.irc.groups["#channel"].allowFrom`

Exemple (autoriser toute personne présente dans `#openclaw` à parler au bot) :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Déclenchement des réponses (mentions)

Même si un canal est autorisé (via `groupPolicy` + `groups`) et que l’expéditeur est autorisé, OpenClaw exige par défaut une **mention** dans les contextes de groupe. Le bot est considéré comme mentionné lorsque le message contient le pseudonyme du bot connecté ou correspond aux modèles de mention que vous avez configurés.

Vous pouvez donc voir des journaux tels que `drop channel … (missing-mention)`, sauf si le message comprend un modèle de mention correspondant au bot.

Pour que le bot réponde dans un canal IRC **sans qu’une mention soit nécessaire**, désactivez l’obligation de mention pour ce canal :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ou, pour autoriser **tous** les canaux IRC (sans liste d’autorisation par canal) et répondre tout de même sans mention :

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

## Remarque de sécurité (recommandée pour les canaux publics)

Si vous autorisez `allowFrom: ["*"]` dans un canal public, n’importe qui peut envoyer une requête au bot.
Pour réduire les risques, limitez les outils pour ce canal.

### Mêmes outils pour tous les membres du canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
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

### Outils différents selon l’expéditeur (le propriétaire dispose de davantage de privilèges)

Utilisez `toolsBySender` pour appliquer une stratégie plus stricte à `"*"` et une stratégie plus permissive à votre pseudonyme :

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Remarques :

- Les clés `toolsBySender` doivent utiliser des préfixes explicites (`channel:`, `id:`, `e164:`, `username:`, `name:`). Pour IRC, utilisez `id:` avec la valeur d’identité de l’expéditeur : `id:alice` ou `id:alice!~alice@203.0.113.7` pour une correspondance plus stricte.
- Les anciennes clés sans préfixe sont toujours acceptées, correspondent uniquement à `id:` et génèrent un avertissement d’obsolescence.
- La première stratégie d’expéditeur correspondante l’emporte ; `"*"` est la solution de repli générique.

Pour en savoir plus sur l’accès aux groupes par rapport à l’obligation de mention, ainsi que sur leur interaction, consultez : [/channels/groups](/fr/channels/groups).

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

L’identification auprès de NickServ s’exécute par défaut dès qu’un mot de passe est défini (`enabled` ne doit être défini sur `false` que pour la désactiver). `service` vaut par défaut `NickServ` ; `passwordFile` constitue une alternative au `password` intégré.

Inscription unique facultative lors de la connexion (`register: true` nécessite `registerEmail`) :

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

Désactivez `register` une fois le pseudonyme enregistré afin d’éviter des tentatives REGISTER répétées.

## Variables d’environnement

Le compte par défaut prend en charge :

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (séparés par des virgules)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` ne peut pas être défini à partir d’un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Dépannage

- Si le bot se connecte mais ne répond jamais dans les canaux, vérifiez `channels.irc.groups` **et** si l’obligation de mention rejette les messages (`missing-mention`). Si vous souhaitez qu’il réponde sans interpellation, définissez `requireMention:false` pour le canal.
- Si la connexion échoue, vérifiez la disponibilité du pseudonyme et le mot de passe du serveur.
- Si TLS échoue sur un réseau personnalisé, vérifiez l’hôte, le port et la configuration du certificat.

## Pages connexes

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification des messages directs et processus d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et obligation de mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
