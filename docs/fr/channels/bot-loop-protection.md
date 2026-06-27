---
read_when:
    - Configurer les messages de canal rédigés par un bot
    - Réglage de la protection contre les boucles de bot à bot
sidebarTitle: Bot loop protection
summary: Protection contre les boucles entre bots par défaut et remplacements par canal
title: Protection contre les boucles de bot
x-i18n:
    generated_at: "2026-06-27T17:09:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Protection contre les boucles de bots

OpenClaw peut accepter des messages écrits par d’autres bots sur les canaux qui prennent en charge `allowBots`.
Lorsque ce chemin est activé, la protection contre les boucles par paire empêche deux identités de bots de
se répondre indéfiniment.

La garde est appliquée par l’exécuteur central des réponses entrantes. Chaque canal compatible
convertit son propre événement entrant en faits génériques : compte ou portée, id de conversation,
id du bot expéditeur et id du bot destinataire. Le cœur suit ensuite la paire de participants dans les deux
sens, applique un budget à fenêtre glissante, puis supprime la paire pendant une
période de refroidissement après le dépassement du budget.

## Valeurs par défaut

La protection contre les boucles par paire est active lorsqu’un canal permet aux messages rédigés par des bots d’atteindre
l’acheminement. Les valeurs par défaut intégrées sont :

- `maxEventsPerWindow: 20` - une paire de bots peut échanger 20 événements dans la fenêtre
- `windowSeconds: 60` - longueur de la fenêtre glissante
- `cooldownSeconds: 60` - durée de suppression après que la paire dépasse le budget

La garde n’affecte pas les messages normaux rédigés par des humains, les déploiements à bot unique,
le filtrage des messages de soi-même, ni les réponses ponctuelles de bots qui restent sous le budget.

## Configurer les valeurs par défaut partagées

Définissez `channels.defaults.botLoopProtection` une seule fois pour donner à chaque canal compatible
la même base. Les remplacements au niveau du canal et du compte peuvent toujours ajuster des
surfaces individuelles.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Définissez `enabled: false` uniquement lorsque la politique de votre canal autorise intentionnellement
les conversations de bot à bot sans suppression automatique.

## Remplacer par canal ou par compte

Les canaux compatibles superposent leur propre configuration à la valeur par défaut partagée. La priorité est :

- `channels.<channel>.<room-or-space>.botLoopProtection`, lorsque le canal prend en charge les remplacements par conversation
- `channels.<channel>.accounts.<account>.botLoopProtection`, lorsque le canal prend en charge les comptes
- `channels.<channel>.botLoopProtection`, lorsque le canal prend en charge les valeurs par défaut de niveau supérieur
- `channels.defaults.botLoopProtection`
- valeurs par défaut intégrées

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## Prise en charge des canaux

- Discord : faits `author.bot` natifs, indexés par compte Discord, canal et paire de bots.
- Slack : faits `bot_id` natifs pour les messages acceptés rédigés par des bots, indexés par compte Slack, canal et paire de bots.
- Matrix : comptes de bots Matrix configurés, indexés par compte Matrix, salle et paire de bots configurée.
- Google Chat : faits `sender.type=BOT` natifs pour les messages acceptés rédigés par des bots, indexés par compte, espace et paire de bots.

Les canaux qui n’exposent pas une identité fiable de bot entrant continuent d’utiliser leurs
filtres normaux de messages de soi-même et de politique d’accès. Ils ne doivent pas adhérer à cette
garde tant qu’ils ne peuvent pas identifier les deux participants de la paire de bots.

Consultez [l’environnement d’exécution SDK](/fr/plugins/sdk-runtime#reusable-runtime-utilities) pour les détails
d’implémentation des Plugins.
