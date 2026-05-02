---
read_when:
    - Configurer la même liste d’autorisation sur plusieurs canaux de messagerie
    - Règles d’accès des expéditeurs pour le partage des messages privés et de groupe
    - Examen du contrôle d’accès aux canaux de messagerie
summary: Listes d’expéditeurs autorisés réutilisables pour les canaux de messagerie
title: Groupes d’accès
x-i18n:
    generated_at: "2026-05-02T06:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Les groupes d’accès sont des listes d’expéditeurs nommées que vous définissez une fois et référencez depuis les listes d’autorisation de canal avec `accessGroup:<name>`.

Utilisez-les lorsque les mêmes personnes doivent être autorisées sur plusieurs canaux de messages, ou lorsqu’un même ensemble de confiance doit s’appliquer à la fois aux DM et à l’autorisation des expéditeurs de groupe.

Les groupes d’accès n’accordent pas d’accès par eux-mêmes. Un groupe n’a d’effet que lorsqu’un champ de liste d’autorisation le référence.

## Groupes statiques d’expéditeurs de messages

Les groupes statiques d’expéditeurs utilisent `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Les listes de membres sont indexées par identifiant de canal de messages :

| Clé        | Signification                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Entrées partagées vérifiées pour chaque canal de messages qui référence le groupe. |
| `discord`  | Entrées vérifiées uniquement pour la correspondance de liste d’autorisation Discord.                    |
| `telegram` | Entrées vérifiées uniquement pour la correspondance de liste d’autorisation Telegram.                   |
| `whatsapp` | Entrées vérifiées uniquement pour la correspondance de liste d’autorisation WhatsApp.                   |

Les entrées sont comparées avec les règles `allowFrom` normales du canal de destination. OpenClaw ne traduit pas les identifiants d’expéditeur entre les canaux. Si Alice a un identifiant Telegram et un identifiant Discord, listez les deux identifiants sous les clés appropriées.

## Référencer des groupes depuis les listes d’autorisation

Référencez un groupe avec `accessGroup:<name>` partout où le chemin du canal de messages prend en charge les listes d’autorisation d’expéditeurs.

Exemple de liste d’autorisation de DM :

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Exemple de liste d’autorisation d’expéditeurs de groupe :

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Vous pouvez mélanger groupes et entrées directes :

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Chemins de canaux de messages pris en charge

Les groupes d’accès sont disponibles dans les chemins partagés d’autorisation de canaux de messages, notamment :

- les listes d’autorisation d’expéditeurs de DM, telles que `channels.<channel>.allowFrom`
- les listes d’autorisation d’expéditeurs de groupe, telles que `channels.<channel>.groupAllowFrom`
- les listes d’autorisation d’expéditeurs par salon propres à un canal qui utilisent les mêmes règles de correspondance d’expéditeur
- les chemins d’autorisation de commandes qui réutilisent les listes d’autorisation d’expéditeurs de canaux de messages

La prise en charge par canal dépend du fait que ce canal soit raccordé aux helpers partagés d’autorisation d’expéditeur d’OpenClaw. La prise en charge intégrée actuelle inclut Discord, Google Chat, Nostr, WhatsApp, Zalo et Zalo Personal. Les groupes statiques `message.senders` sont conçus pour être indépendants des canaux, donc les nouveaux canaux de messages doivent les prendre en charge en utilisant les helpers partagés du Plugin SDK plutôt qu’une extension personnalisée des listes d’autorisation.

## Audiences de canal Discord

Discord prend aussi en charge un type dynamique de groupe d’accès :

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` signifie « autoriser les expéditeurs de DM Discord qui peuvent actuellement voir ce canal de serveur ». OpenClaw résout l’expéditeur via Discord au moment de l’autorisation et applique les règles de permission Discord `ViewChannel`.

Utilisez ceci lorsqu’un canal Discord est déjà la source de vérité pour une équipe, comme `#maintainers` ou `#on-call`.

Exigences et comportement en cas d’échec :

- Le bot a besoin d’un accès au serveur et au canal.
- Le bot a besoin du **Server Members Intent** dans le Portail développeur Discord.
- Le groupe d’accès échoue fermé lorsque Discord renvoie `Missing Access`, que l’expéditeur ne peut pas être résolu comme membre du serveur, ou que le canal appartient à un autre serveur.

Autres exemples propres à Discord : [Contrôle d’accès Discord](/fr/channels/discord#access-control-and-routing)

## Notes de sécurité

- Les groupes d’accès sont des alias de listes d’autorisation, pas des rôles. Ils ne créent pas de propriétaires, n’approuvent pas les demandes d’appairage et n’accordent pas de permissions d’outils par eux-mêmes.
- `dmPolicy: "open"` requiert toujours `"*"` dans la liste d’autorisation effective des DM. Référencer un groupe d’accès n’équivaut pas à un accès public.
- Les noms de groupes manquants échouent fermés. Si `allowFrom` contient `accessGroup:operators` et que `accessGroups.operators` est absent, cette entrée n’autorise personne.
- Gardez les identifiants de canal stables. Préférez les identifiants numériques ou utilisateur aux noms d’affichage lorsque le canal prend en charge les deux.

## Dépannage

Si un expéditeur devrait correspondre mais est bloqué :

1. Confirmez que le champ de liste d’autorisation contient la référence exacte `accessGroup:<name>`.
2. Confirmez que `accessGroups.<name>.type` est correct.
3. Confirmez que l’identifiant de l’expéditeur est listé sous la clé de canal correspondante, ou sous `"*"`.
4. Confirmez que l’entrée utilise la syntaxe normale de liste d’autorisation de ce canal.
5. Pour les audiences de canal Discord, confirmez que le bot peut voir le canal du serveur et que Server Members Intent est activé.

Exécutez `openclaw doctor` après avoir modifié la configuration de contrôle d’accès. Il détecte de nombreuses combinaisons invalides de listes d’autorisation et de stratégies avant l’exécution.
