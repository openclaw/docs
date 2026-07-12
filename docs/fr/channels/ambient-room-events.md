---
read_when:
    - Configuration de salons de groupe ou de canal toujours actifs
    - Vous souhaitez que l’agent surveille les conversations du salon sans publier automatiquement de texte final
    - Débogage de la saisie et de l’utilisation des tokens sans message visible dans le salon
sidebarTitle: Ambient room events
summary: Permettre aux salons de groupe pris en charge de fournir un contexte discret, sauf si l’agent envoie un message à l’aide de l’outil de messagerie
title: Événements ambiants de pièce
x-i18n:
    generated_at: "2026-07-12T15:00:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Les événements ambiants de salon permettent à OpenClaw de traiter les conversations de groupe ou de canal qui ne le mentionnent pas comme un contexte discret. L’agent peut mettre à jour la mémoire et l’état de la session, mais le salon reste silencieux sauf si l’agent appelle explicitement l’outil `message`.

Pour les discussions de groupe toujours actives, combinez `messages.groupChat.unmentionedInbound: "room_event"` avec `messages.groupChat.visibleReplies: "message_tool"`. L’agent écoute, décide quand une réponse est utile et n’a jamais besoin de l’ancien modèle de prompt consistant à répondre `NO_REPLY`.

Pris en charge actuellement : les canaux de serveur Discord, les canaux et canaux privés Slack, les messages privés Slack à plusieurs participants, ainsi que les groupes ou supergroupes Telegram. Les autres canaux de groupe conservent leur comportement existant, sauf si leur page indique qu’ils prennent en charge les événements ambiants de salon.

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

Ensuite, rendez le salon toujours actif en désactivant l’obligation de mention pour ce salon. Le salon doit toujours respecter sa `groupPolicy` habituelle, la liste d’autorisation du salon et celle des expéditeurs.

Après l’enregistrement de la configuration, le Gateway applique à chaud les paramètres `messages`. Redémarrez uniquement lorsque la surveillance des fichiers ou le rechargement de la configuration est désactivé (`gateway.reload.mode: "off"`).

## Ce qui change

Avec `messages.groupChat.unmentionedInbound: "room_event"` :

- les messages autorisés de groupe ou de canal sans mention deviennent des événements de salon discrets
- les messages avec mention restent des requêtes utilisateur
- les commandes de contrôle textuelles et les commandes natives restent des requêtes utilisateur
- les demandes d’abandon ou d’arrêt restent des requêtes utilisateur
- les messages privés restent des requêtes utilisateur

Les événements de salon utilisent un mode strict pour l’envoi visible. Le texte final de l’assistant reste privé. L’agent doit appeler `message(action=send)` pour publier dans le salon.

Les indicateurs de saisie et les réactions d’état du cycle de vie restent désactivés pour les événements de salon. La seule exception explicite d’accusé de réception est `messages.ackReactionScope: "all"`, qui envoie la réaction d’accusé de réception configurée ; utilisez une portée plus restreinte ou `"off"` lorsque le salon doit rester entièrement silencieux.

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

Utilisez une configuration Discord propre à chaque canal lorsqu’un seul canal doit être ambiant. Avec `groupPolicy: "allowlist"`, l’ajout du canal à la liste l’autorise (`enabled: false` désactive une entrée) :

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

Les listes d’autorisation de canaux Slack utilisent les identifiants en priorité. Utilisez des identifiants de canal tels que `C12345678`, et non `#channel-name`. L’ajout du canal sous `channels.slack.channels` l’autorise (`enabled: false` désactive une entrée) :

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Exemple Telegram

Pour les groupes Telegram, le bot doit pouvoir voir les messages de groupe ordinaires. Si `requireMention: false`, désactivez le mode de confidentialité de BotFather ou utilisez une autre configuration Telegram qui transmet l’ensemble du trafic du groupe au bot.

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

Les identifiants de groupe Telegram sont généralement des nombres négatifs tels que `-1001234567890`. Lisez `chat.id` dans `openclaw logs --follow`, transférez un message de groupe à un bot auxiliaire d’identification ou examinez `getUpdates` de l’API Bot.

## Politique propre à un agent

Utilisez une substitution propre à l’agent lorsque plusieurs agents partagent le même salon, mais qu’un seul doit traiter les conversations sans mention comme du contexte ambiant :

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

La valeur par défaut de `messages.groupChat.visibleReplies` est `"automatic"` pour les requêtes utilisateur ordinaires de groupe ou de canal. Conservez cette valeur par défaut lorsque le texte final de l’assistant doit être publié visiblement sans appel explicite à l’outil de messagerie.

Pour les salons ambiants toujours actifs, `messages.groupChat.visibleReplies: "message_tool"` reste recommandé, en particulier avec les modèles de dernière génération utilisant les outils de manière fiable, tels que GPT-5.6 Sol. Ce paramètre permet à l’agent de décider quand intervenir en appelant l’outil de messagerie. Si le modèle renvoie du texte final sans appeler l’outil, OpenClaw conserve ce texte final en privé et journalise les métadonnées de suppression de l’envoi.

Les événements de salon restent soumis au mode strict même lorsque les autres requêtes de groupe utilisent des réponses automatiques. Les événements ambiants de salon sans mention nécessitent toujours `message(action=send)` pour produire une sortie visible.

## Historique

`messages.groupChat.historyLimit` définit la valeur globale par défaut de l’historique des groupes (50 lorsqu’elle n’est pas définie ; elle doit être un entier positif). Les canaux peuvent la remplacer avec `channels.<channel>.historyLimit`, et certains canaux prennent également en charge des limites d’historique propres à chaque compte. Définissez `historyLimit: 0` au niveau du canal pour désactiver le contexte de l’historique des groupes pour ce canal.

Les canaux prenant en charge les événements de salon conservent les messages ambiants récents du salon comme contexte. Telegram conserve une fenêtre glissante toujours active propre à chaque groupe, limitée par `historyLimit` ; les tours de requête utilisateur sélectionnent les entrées postérieures à la dernière réponse enregistrée du bot, tandis que les tours d’événement de salon reçoivent l’intégralité de la fenêtre récente afin que le modèle puisse voir ses propres publications récentes. La clé de mode Telegram retirée `includeGroupHistoryContext` est supprimée par `openclaw doctor --fix`.

## Dépannage

Si le salon affiche une saisie ou une utilisation de jetons, mais aucun message visible :

1. Vérifiez que le salon est autorisé par la liste d’autorisation du canal et celle des expéditeurs.
2. Vérifiez que `requireMention: false` est défini au niveau de salon attendu.
3. Vérifiez si `messages.groupChat.unmentionedInbound` ou la substitution de l’agent vaut `"room_event"`.
4. Examinez les journaux pour rechercher les métadonnées de charge utile finale supprimée ou `didSendViaMessagingTool: false`.
5. Pour les requêtes de groupe ordinaires, conservez ou rétablissez `messages.groupChat.visibleReplies: "automatic"` si vous souhaitez que les réponses finales soient publiées automatiquement. Pour les salons ambiants utilisant `message_tool`, utilisez un modèle ou un environnement d’exécution qui appelle les outils de manière fiable.

Si les salons ambiants Telegram ne se déclenchent pas du tout, vérifiez le mode de confidentialité de BotFather et assurez-vous que le Gateway reçoit les messages de groupe ordinaires.

Si les salons ambiants Slack ne se déclenchent pas, vérifiez que la clé du canal correspond à l’identifiant de canal Slack et que l’application dispose de la portée d’historique adaptée au type de salon : `channels:history` (public), `groups:history` (privé) ou `mpim:history` (messages privés à plusieurs participants).

## Voir aussi

- [Groupes](/fr/channels/groups)
- [Discord](/fr/channels/discord)
- [Slack](/fr/channels/slack)
- [Telegram](/fr/channels/telegram)
- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Référence de configuration des canaux](/fr/gateway/config-channels)
