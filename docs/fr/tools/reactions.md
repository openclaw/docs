---
read_when:
    - Travailler sur les réactions dans n’importe quel canal
    - Comprendre comment les réactions par emoji diffèrent selon les plateformes
summary: Sémantique de l’outil de réaction sur tous les canaux pris en charge
title: Réactions
x-i18n:
    generated_at: "2026-04-30T07:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

L’agent peut ajouter et supprimer des réactions emoji sur les messages à l’aide de l’outil `message` avec l’action `react`. Le comportement des réactions varie selon le canal et le transport.

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

## Comportement par canal

<AccordionGroup>
  <Accordion title="Discord et Slack">
    - Un `emoji` vide supprime toutes les réactions du bot sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Google Chat">
    - Un `emoji` vide supprime les réactions de l’application sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Telegram">
    - Un `emoji` vide supprime les réactions du bot.
    - `remove: true` supprime aussi les réactions, mais nécessite toujours un `emoji` non vide pour la validation de l’outil.

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
    - Les notifications de réactions entrantes sont contrôlées par `channels.signal.reactionNotifications` : `"off"` les désactive, `"own"` (valeur par défaut) émet des événements lorsque des utilisateurs réagissent aux messages du bot, et `"all"` émet des événements pour toutes les réactions.

  </Accordion>
</AccordionGroup>

## Niveau de réaction

La configuration `reactionLevel` par canal contrôle l’étendue avec laquelle l’agent utilise les réactions. Les valeurs sont généralement `off`, `ack`, `minimal` ou `extensive`.

- [reactionLevel de Telegram](/fr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel de WhatsApp](/fr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Définissez `reactionLevel` sur des canaux individuels pour ajuster le niveau d’activité avec lequel l’agent réagit aux messages sur chaque plateforme.

## Voir aussi

- [Envoi par l’agent](/fr/tools/agent-send) — l’outil `message` qui inclut `react`
- [Canaux](/fr/channels) — configuration propre aux canaux
