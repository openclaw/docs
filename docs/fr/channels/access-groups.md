---
read_when:
    - Configurer la même liste d’autorisation sur plusieurs canaux de messagerie
    - Règles d’accès au partage des expéditeurs de messages directs et de groupes
    - Examen du contrôle d’accès au canal de messagerie
summary: Listes d’autorisation d’expéditeurs réutilisables pour les canaux de messagerie
title: Groupes d’accès
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Les groupes d’accès sont des listes nommées d’expéditeurs que vous définissez une seule fois et référencez depuis les listes d’autorisation des canaux avec `accessGroup:<name>`.

Utilisez-les lorsque les mêmes personnes doivent être autorisées sur plusieurs canaux de messages, ou lorsqu’un même ensemble de confiance doit s’appliquer à la fois à l’autorisation des expéditeurs en MP et en groupe.

Les groupes d’accès n’accordent pas l’accès par eux-mêmes. Un groupe n’a d’effet que lorsqu’un champ de liste d’autorisation le référence.

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

Les entrées sont comparées avec les règles `allowFrom` normales du canal de destination. OpenClaw ne traduit pas les identifiants d’expéditeur entre les canaux. Si Alice a un identifiant Telegram et un identifiant Discord, indiquez les deux identifiants sous les clés appropriées.

## Référencer des groupes depuis les listes d’autorisation

Référencez un groupe avec `accessGroup:<name>` partout où le chemin du canal de messages prend en charge les listes d’autorisation d’expéditeurs.

Exemple de liste d’autorisation de MP :

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

Vous pouvez mélanger des groupes et des entrées directes :

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

Les groupes d’accès sont disponibles dans les chemins d’autorisation partagés des canaux de messages, notamment :

- les listes d’autorisation d’expéditeurs de MP comme `channels.<channel>.allowFrom`
- les listes d’autorisation d’expéditeurs de groupe comme `channels.<channel>.groupAllowFrom`
- les listes d’autorisation d’expéditeurs par salon propres à un canal qui utilisent les mêmes règles de correspondance d’expéditeur
- les chemins d’autorisation de commandes qui réutilisent les listes d’autorisation d’expéditeurs de canaux de messages

La prise en charge d’un canal dépend du fait que ce canal soit raccordé aux helpers partagés d’autorisation d’expéditeur OpenClaw. La prise en charge groupée actuelle inclut Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo et Zalo Personal. Les groupes statiques `message.senders` sont conçus pour être indépendants du canal ; les nouveaux canaux de messages devraient donc les prendre en charge en utilisant les helpers partagés du SDK de Plugin au lieu d’une expansion personnalisée des listes d’autorisation.

## Diagnostics de Plugin

Les auteurs de Plugin peuvent inspecter l’état structuré des groupes d’accès sans le réexpandre en une liste d’autorisation plate :

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Le résultat signale les groupes référencés, correspondants, manquants, non pris en charge et en échec. Utilisez cela lorsque vous avez besoin de diagnostics ou de tests de conformité. Utilisez `expandAllowFromWithAccessGroups(...)` uniquement pour les chemins de compatibilité qui attendent encore un tableau `allowFrom` plat.

## Audiences de canaux Discord

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

`discord.channelAudience` signifie « autoriser les expéditeurs de MP Discord qui peuvent actuellement voir ce canal de guilde ». OpenClaw résout l’expéditeur via Discord au moment de l’autorisation et applique les règles de permission Discord `ViewChannel`.

Utilisez cela lorsqu’un canal Discord est déjà la source de vérité d’une équipe, comme `#maintainers` ou `#on-call`.

Exigences et comportement en cas d’échec :

- Le bot doit avoir accès à la guilde et au canal.
- Le bot a besoin de l’**Server Members Intent** du Discord Developer Portal.
- Le groupe d’accès échoue fermé lorsque Discord renvoie `Missing Access`, que l’expéditeur ne peut pas être résolu comme membre de la guilde, ou que le canal appartient à une autre guilde.

Autres exemples propres à Discord : [Contrôle d’accès Discord](/fr/channels/discord#access-control-and-routing)

## Notes de sécurité

- Les groupes d’accès sont des alias de liste d’autorisation, pas des rôles. Ils ne créent pas de propriétaires, n’approuvent pas les demandes d’appairage et n’accordent pas de permissions d’outils par eux-mêmes.
- `dmPolicy: "open"` exige toujours `"*"` dans la liste d’autorisation de MP effective. Référencer un groupe d’accès n’est pas équivalent à un accès public.
- Les noms de groupe manquants échouent fermés. Si `allowFrom` contient `accessGroup:operators` et que `accessGroups.operators` est absent, cette entrée n’autorise personne.
- Gardez les identifiants de canal stables. Préférez les identifiants numériques ou d’utilisateur aux noms d’affichage lorsque le canal prend en charge les deux.

## Dépannage

Si un expéditeur devrait correspondre mais est bloqué :

1. Vérifiez que le champ de liste d’autorisation contient la référence exacte `accessGroup:<name>`.
2. Vérifiez que `accessGroups.<name>.type` est correct.
3. Vérifiez que l’identifiant de l’expéditeur est listé sous la clé de canal correspondante, ou sous `"*"`.
4. Vérifiez que l’entrée utilise la syntaxe normale de liste d’autorisation de ce canal.
5. Pour les audiences de canaux Discord, vérifiez que le bot peut voir le canal de guilde et que Server Members Intent est activé.

Exécutez `openclaw doctor` après avoir modifié la configuration du contrôle d’accès. Il détecte de nombreuses combinaisons invalides de listes d’autorisation et de politiques avant l’exécution.
