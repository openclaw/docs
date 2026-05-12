---
read_when:
    - Travailler avec les réactions dans n’importe quel canal
    - Comprendre en quoi les réactions emoji diffèrent selon les plateformes
summary: Sémantique de l’outil de réaction sur tous les canaux pris en charge
title: Réactions
x-i18n:
    generated_at: "2026-05-12T01:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

L’agent peut ajouter et supprimer des réactions emoji sur les messages à l’aide de l’outil `message`
avec l’action `react`. Le comportement des réactions varie selon le canal et le transport.

## Fonctionnement

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` est requis lors de l’ajout d’une réaction.
- Définissez `emoji` sur une chaîne vide (`""`) pour supprimer la ou les réactions du bot.
- Définissez `remove: true` pour supprimer un emoji spécifique (nécessite un `emoji` non vide).
- Sur les canaux qui prennent en charge les réactions de statut, `trackToolCalls: true` sur une
  réaction permet à l’environnement d’exécution d’utiliser ce message avec réaction pour les réactions
  de progression d’outil suivantes pendant le même tour.

## Comportement des canaux

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Un `emoji` vide supprime toutes les réactions du bot sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Google Chat">
    - Un `emoji` vide supprime les réactions de l’application sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Telegram">
    - Un `emoji` vide supprime les réactions du bot.
    - `remove: true` supprime également les réactions, mais nécessite toujours un `emoji` non vide pour la validation de l’outil.

  </Accordion>

  <Accordion title="WhatsApp">
    - Un `emoji` vide supprime la réaction du bot.
    - `remove: true` correspond en interne à un emoji vide (nécessite toujours `emoji` dans l’appel d’outil).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Nécessite un `emoji` non vide.
    - `remove: true` supprime cette réaction emoji spécifique.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Utilisez l’outil `feishu_reaction` avec les actions `add`, `remove` et `list`.
    - L’ajout/la suppression nécessite `emoji_type`; la suppression nécessite aussi `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Les notifications de réactions entrantes sont contrôlées par `channels.signal.reactionNotifications`: `"off"` les désactive, `"own"` (par défaut) émet des événements lorsque des utilisateurs réagissent aux messages du bot, et `"all"` émet des événements pour toutes les réactions.

  </Accordion>

  <Accordion title="iMessage">
    - Les réactions sortantes sont des tapbacks iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` et `question`).
    - Les notifications de tapback entrantes sont contrôlées par `channels.imessage.reactionNotifications`: `"off"` les désactive, `"own"` (par défaut) émet des événements lorsque des utilisateurs réagissent aux messages rédigés par le bot, et `"all"` émet des événements pour tous les tapbacks provenant d’expéditeurs autorisés.

  </Accordion>
</AccordionGroup>

## Niveau de réaction

La configuration `reactionLevel` propre à chaque canal contrôle l’ampleur de l’utilisation des réactions par l’agent. Les valeurs sont généralement `off`, `ack`, `minimal` ou `extensive`.

- [reactionLevel Telegram](/fr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel WhatsApp](/fr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Définissez `reactionLevel` sur les canaux individuels pour ajuster l’activité avec laquelle l’agent réagit aux messages sur chaque plateforme.

## Associés

- [Envoi par l’agent](/fr/tools/agent-send) — l’outil `message` qui inclut `react`
- [Canaux](/fr/channels) — configuration propre à chaque canal
