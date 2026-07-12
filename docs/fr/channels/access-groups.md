---
read_when:
    - Configuration de la même liste d’autorisation sur plusieurs canaux de messagerie
    - Partage des règles d’accès des expéditeurs pour les messages privés et les groupes
    - Examen du contrôle d’accès aux canaux de messagerie
summary: Listes réutilisables d’expéditeurs autorisés pour les canaux de messagerie
title: Groupes d’accès
x-i18n:
    generated_at: "2026-07-12T02:22:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Les groupes d’accès sont des listes nommées d’expéditeurs que vous définissez une seule fois sous `accessGroups` et référencez depuis les listes d’autorisation des canaux avec `accessGroup:<name>`.

Utilisez-les lorsque les mêmes personnes doivent être autorisées sur plusieurs canaux de messagerie, ou lorsqu’un même ensemble de confiance doit s’appliquer à la fois aux messages privés et à l’autorisation des expéditeurs dans les groupes.

Un groupe n’accorde rien par lui-même. Il n’a d’effet que lorsqu’un champ de liste d’autorisation le référence.

## Groupes statiques d’expéditeurs de messages

Les groupes statiques d’expéditeurs utilisent `type: "message.senders"`. `members` est indexé par identifiant de canal de messagerie, avec en plus `"*"` pour les entrées communes à tous les canaux :

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

| Clé                        | Signification                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `"*"`                      | Entrées communes vérifiées pour chaque canal de messagerie qui référence le groupe.                    |
| `discord`, `telegram`, ... | Entrées vérifiées uniquement lors de la mise en correspondance avec la liste d’autorisation du canal. |

Les entrées sont mises en correspondance selon les règles `allowFrom` normales du canal de destination. OpenClaw ne convertit pas les identifiants d’expéditeur entre les canaux : si Alice possède un identifiant Telegram et un identifiant Discord, indiquez les deux identifiants sous les clés de canal correspondantes.

## Référencer des groupes depuis les listes d’autorisation

Référencez un groupe avec `accessGroup:<name>` partout où le chemin du canal de messagerie prend en charge les listes d’autorisation d’expéditeurs.

Exemple de liste d’autorisation pour les messages privés :

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

Exemple de liste d’autorisation des expéditeurs dans les groupes :

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Vous pouvez combiner des groupes et des entrées directes :

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

## Chemins de canaux de messagerie pris en charge

Les groupes d’accès fonctionnent dans les chemins d’autorisation partagés des canaux de messagerie :

- les listes d’autorisation d’expéditeurs de messages privés, telles que `channels.<channel>.allowFrom`
- les listes d’autorisation d’expéditeurs dans les groupes, telles que `channels.<channel>.groupAllowFrom`
- les listes d’autorisation d’expéditeurs propres à chaque salon qui utilisent les mêmes règles de mise en correspondance des expéditeurs (par exemple, `groups.<space>.users` de Google Chat)
- les chemins d’autorisation des commandes qui réutilisent les listes d’autorisation d’expéditeurs des canaux de messagerie

La prise en charge d’un canal dépend de son raccordement aux utilitaires partagés d’autorisation des expéditeurs d’OpenClaw. La prise en charge intégrée actuelle comprend ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo et Zalo Personal. Les groupes statiques `message.senders` sont indépendants des canaux ; les nouveaux canaux de messagerie peuvent donc les prendre en charge en utilisant les utilitaires d’entrée partagés du SDK de Plugin plutôt qu’une expansion personnalisée des listes d’autorisation.

## Audiences de canaux Discord

Discord prend également en charge un type dynamique de groupe d’accès :

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

`discord.channelAudience` signifie « autoriser les expéditeurs de messages privés Discord qui peuvent actuellement voir ce canal de serveur ». OpenClaw résout l’expéditeur via Discord au moment de l’autorisation et applique les règles d’autorisation Discord `ViewChannel`. `membership` est facultatif et sa valeur par défaut est `canViewChannel`.

Utilisez cette option lorsqu’un canal Discord constitue déjà la source de référence pour une équipe, comme `#maintainers` ou `#on-call`.

Exigences et comportement en cas d’échec :

- Le bot doit avoir accès au serveur et au canal.
- Le bot doit disposer de l’option **Server Members Intent** dans Discord Developer Portal.
- Le groupe d’accès refuse l’accès par défaut lorsque Discord renvoie `Missing Access`, lorsque l’expéditeur ne peut pas être identifié comme membre du serveur ou lorsque le canal appartient à un autre serveur.

Autres exemples propres à Discord : [Contrôle d’accès Discord](/fr/channels/discord#access-control-and-routing)

## Diagnostics des Plugins

Les auteurs de Plugins peuvent inspecter l’état structuré des groupes d’accès sans le reconvertir en liste d’autorisation plate :

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Le résultat indique les groupes référencés, correspondants, manquants, non pris en charge et en échec. Utilisez-le pour les diagnostics ou les tests de conformité. Utilisez `expandAllowFromWithAccessGroups(...)` uniquement pour les chemins de compatibilité qui attendent encore un tableau `allowFrom` plat.

## Remarques de sécurité

- Les groupes d’accès sont des alias de listes d’autorisation, et non des rôles. Ils ne créent pas de propriétaires, n’approuvent pas les demandes d’association et n’accordent pas, à eux seuls, d’autorisations sur les outils.
- `dmPolicy: "open"` exige toujours `"*"` dans la liste d’autorisation effective des messages privés. Référencer un groupe d’accès n’équivaut pas à un accès public.
- Les noms de groupes manquants entraînent un refus par défaut. Si `allowFrom` contient `accessGroup:operators` et que `accessGroups.operators` est absent, cette entrée n’autorise personne.
- Conservez des identifiants de canal stables. Préférez les identifiants numériques ou d’utilisateur aux noms d’affichage lorsque le canal prend en charge les deux.

## Résolution des problèmes

Si un expéditeur devrait correspondre, mais reste bloqué :

1. Vérifiez que le champ de liste d’autorisation contient la référence exacte `accessGroup:<name>`.
2. Vérifiez que `accessGroups.<name>.type` est correct.
3. Vérifiez que l’identifiant de l’expéditeur figure sous la clé de canal correspondante ou sous `"*"`.
4. Vérifiez que l’entrée utilise la syntaxe normale des listes d’autorisation de ce canal.
5. Pour les audiences de canaux Discord, vérifiez que le bot peut voir le canal du serveur et que l’option Server Members Intent est activée.

Exécutez `openclaw doctor` après avoir modifié la configuration du contrôle d’accès. Cette commande détecte de nombreuses combinaisons non valides de listes d’autorisation et de stratégies avant l’exécution.
