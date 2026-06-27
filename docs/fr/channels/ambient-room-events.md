---
read_when:
    - Configuration des salons de groupe ou de canal toujours actifs
    - Vous voulez que l’agent surveille les échanges dans le salon sans publier automatiquement le texte final
    - Débogage de la saisie et de l’utilisation des jetons sans message visible dans le salon
sidebarTitle: Ambient room events
summary: Laisser les salons de groupe pris en charge fournir un contexte discret, sauf si l’agent envoie avec l’outil de message.
title: Événements ambiants de la pièce
x-i18n:
    generated_at: "2026-06-27T17:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Les événements ambiants de salon permettent à OpenClaw de traiter les conversations de groupe ou de canal non mentionnées comme un contexte discret. L’agent peut mettre à jour la mémoire et l’état de session, mais le salon reste silencieux sauf si l’agent appelle explicitement l’outil `message`.

Pour les discussions de groupe toujours actives, c’est le mode recommandé : combinez `messages.groupChat.unmentionedInbound: "room_event"` avec `messages.groupChat.visibleReplies: "message_tool"`. Utilisez-le lorsque l’agent doit écouter, décider quand une réponse est utile et éviter l’ancien modèle de prompt consistant à répondre `NO_REPLY`.

Pris en charge aujourd’hui : les canaux de guildes Discord, les canaux et canaux privés Slack, les MP Slack à plusieurs personnes, ainsi que les groupes ou supergroupes Telegram. Les autres canaux de groupe conservent leur comportement de groupe existant, sauf si leur page de canal indique qu’ils prennent en charge les événements ambiants de salon.

## Configuration recommandée

Définissez le comportement global des discussions de groupe :

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Configurez ensuite le salon lui-même comme toujours actif en désactivant l’obligation de mention pour ce salon. Le canal doit toujours être autorisé par son `groupPolicy` normal, sa liste d’autorisation de salons et sa liste d’autorisation d’expéditeurs.

Après l’enregistrement de la configuration, le Gateway recharge à chaud les paramètres `messages`. Redémarrez uniquement lorsque la surveillance des fichiers ou le rechargement de la configuration est désactivé.

## Ce qui change

Avec `messages.groupChat.unmentionedInbound: "room_event"` :

- les messages de groupe ou de canal autorisés non mentionnés deviennent des événements de salon discrets
- les messages mentionnés restent des requêtes utilisateur
- les commandes texte et les commandes natives restent des requêtes utilisateur
- les requêtes d’abandon ou d’arrêt restent des requêtes utilisateur
- les messages directs restent des requêtes utilisateur

Les événements de salon utilisent une livraison visible stricte. Le texte final de l’assistant est privé. L’agent doit appeler `message(action=send)` pour publier dans le salon.

## Exemple Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Utilisez une configuration Discord par canal lorsqu’un seul canal doit être ambiant :

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Exemple Slack

Les listes d’autorisation de canaux Slack utilisent d’abord les ID. Utilisez des ID de canal comme `C12345678`, et non `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Exemple Telegram

Pour les groupes Telegram, le bot doit pouvoir voir les messages de groupe normaux. Si `requireMention: false`, désactivez le mode de confidentialité BotFather ou utilisez une autre configuration Telegram qui transmet tout le trafic de groupe au bot.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Les ID de groupe Telegram sont généralement des nombres négatifs comme `-1001234567890`. Lisez `chat.id` depuis `openclaw logs --follow`, transférez un message de groupe à un bot d’aide pour les ID ou inspectez `getUpdates` de l’API Bot.

## Politique propre à l’agent

Utilisez une surcharge d’agent lorsque plusieurs agents partagent le même salon, mais qu’un seul doit traiter les conversations non mentionnées comme contexte ambiant :

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

La valeur `agents.list[].groupChat.unmentionedInbound` propre à l’agent remplace `messages.groupChat.unmentionedInbound` pour cet agent.

## Modes de réponse visible

`messages.groupChat.visibleReplies` vaut par défaut `"automatic"` pour les requêtes utilisateur normales de groupe ou de canal. Conservez cette valeur par défaut lorsque vous voulez que le texte final de l’assistant soit publié visiblement sans nécessiter d’appel explicite à l’outil de messagerie.

Pour les salons ambiants toujours actifs, `messages.groupChat.visibleReplies: "message_tool"` reste recommandé, en particulier avec les modèles de dernière génération fiables avec les outils, comme GPT 5.5. Cela permet à l’agent de décider quand parler en appelant l’outil de messagerie. Si le modèle renvoie un texte final sans appeler l’outil, OpenClaw garde ce texte final privé et journalise les métadonnées de livraison supprimée.

Les événements de salon restent stricts même lorsque les autres requêtes de groupe utilisent des réponses automatiques. Les événements ambiants de salon non mentionnés nécessitent toujours `message(action=send)` pour une sortie visible.

## Historique

`messages.groupChat.historyLimit` contrôle la valeur globale par défaut de l’historique de groupe. Les canaux peuvent la remplacer avec `channels.<channel>.historyLimit`, et certains canaux prennent également en charge des limites d’historique par compte.

Définissez `historyLimit: 0` pour désactiver le contexte d’historique de groupe.

Les canaux d’événements de salon pris en charge conservent les messages ambiants récents du salon comme contexte. Discord conserve l’historique des événements de salon jusqu’à ce qu’un envoi Discord visible réussisse, afin que le contexte discret ne soit pas perdu avant la livraison par l’outil de messagerie.

## Dépannage

Si le salon affiche une saisie en cours ou une utilisation de tokens, mais aucun message visible :

1. Confirmez que le salon est autorisé par la liste d’autorisation du canal et la liste d’autorisation des expéditeurs.
2. Confirmez que `requireMention: false` est défini au niveau de salon attendu.
3. Vérifiez si `messages.groupChat.unmentionedInbound` ou la surcharge de l’agent vaut `"room_event"`.
4. Inspectez les journaux pour rechercher des métadonnées de charge utile finale supprimée ou `didSendViaMessagingTool: false`.
5. Pour les requêtes de groupe normales, conservez ou restaurez `messages.groupChat.visibleReplies: "automatic"` si vous voulez que les réponses finales soient publiées automatiquement. Pour les salons ambiants utilisant `message_tool`, utilisez un modèle/runtime qui appelle les outils de manière fiable.

Si les salons ambiants Telegram ne se déclenchent pas du tout, vérifiez le mode de confidentialité BotFather et assurez-vous que le Gateway reçoit les messages de groupe normaux.

Si les salons ambiants Slack ne se déclenchent pas, vérifiez que la clé du canal est l’ID de canal Slack et que l’application possède le scope `channels:history` ou `groups:history` requis pour ce type de salon.

## Liens associés

- [Groupes](/fr/channels/groups)
- [Discord](/fr/channels/discord)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Référence de configuration des canaux](/fr/gateway/config-channels)
