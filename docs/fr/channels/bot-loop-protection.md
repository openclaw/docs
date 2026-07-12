---
read_when:
    - Configuration des messages de canal rédigés par des bots
    - Réglage de la protection contre les boucles entre bots
sidebarTitle: Bot loop protection
summary: Valeurs par défaut de la protection contre les boucles entre bots et remplacements par canal
title: Protection contre les boucles de bots
x-i18n:
    generated_at: "2026-07-12T15:02:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw peut accepter les messages écrits par d’autres bots sur les canaux qui prennent en charge `allowBots`. Lorsque ce chemin est activé, la protection contre les boucles entre paires empêche deux identités de bot de se répondre indéfiniment.

La protection est appliquée par l’exécuteur principal des réponses entrantes. Chaque canal compatible convertit son événement entrant en informations génériques : compte ou portée, identifiant de conversation, identifiant du bot émetteur et identifiant du bot destinataire. Le cœur suit la paire de participants dans les deux sens (A vers B et B vers A comptent comme la même paire), applique un quota sur une fenêtre glissante et bloque la paire pendant une période de temporisation lorsque le quota est dépassé.

## Valeurs par défaut

La protection contre les boucles entre paires est active dès qu’un canal permet aux messages rédigés par des bots d’atteindre la distribution. Valeurs intégrées par défaut :

| Clé                  | Valeur par défaut | Signification                                                   |
| -------------------- | ----------------- | --------------------------------------------------------------- |
| `enabled`            | `true`            | Protection active pour les canaux qui la prennent en charge.    |
| `maxEventsPerWindow` | `20`              | Événements qu’une paire de bots peut échanger dans la fenêtre.  |
| `windowSeconds`      | `60`              | Durée de la fenêtre glissante.                                  |
| `cooldownSeconds`    | `60`              | Durée du blocage après que la paire a dépassé le quota.         |

La protection n’affecte pas les messages rédigés par des humains, les déploiements à bot unique, le filtrage des messages émis par le bot lui-même ni les réponses de bots qui restent sous le quota.

## Configurer les valeurs partagées par défaut

Définissez `channels.defaults.botLoopProtection` une seule fois pour attribuer la même configuration de référence à tous les canaux compatibles. Les remplacements propres à un canal, un compte ou une salle peuvent toujours ajuster les différentes surfaces.

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

Définissez `enabled: false` uniquement lorsque la politique de votre canal autorise intentionnellement les conversations entre bots sans blocage automatique.

## Remplacer les valeurs par canal, compte ou salle

Les canaux compatibles superposent leur propre configuration aux valeurs partagées par défaut, clé par clé. Ordre de priorité, du plus spécifique au moins spécifique :

1. `channels.<channel>.<room-or-space>.botLoopProtection`, lorsque le canal prend en charge les remplacements par conversation
2. `channels.<channel>.accounts.<account>.botLoopProtection`, lorsque le canal prend en charge les comptes
3. `channels.<channel>.botLoopProtection`, lorsque le canal prend en charge les valeurs par défaut de niveau supérieur
4. `channels.defaults.botLoopProtection`
5. valeurs intégrées par défaut

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
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Prise en charge par les canaux

- Discord : informations natives `author.bot`, indexées par compte Discord, canal et paire de bots.
- Google Chat : informations natives `sender.type=BOT` pour les messages acceptés rédigés par des bots, indexées par compte, espace et paire de bots.
- Matrix : comptes de bots Matrix configurés, indexés par compte Matrix, salle et paire de bots configurée.
- Slack : informations natives `bot_id` pour les messages acceptés rédigés par des bots, indexées par compte Slack, canal et paire de bots.

Les canaux qui ne fournissent pas une identité fiable du bot entrant continuent d’utiliser leurs filtres habituels de messages émis par le bot lui-même et de politique d’accès. Ils ne doivent pas activer cette protection tant qu’ils ne peuvent pas identifier les deux participants de la paire de bots.

Consultez [l’environnement d’exécution du SDK](/fr/plugins/sdk-runtime#reusable-runtime-utilities) pour plus de détails sur l’implémentation des plugins.
