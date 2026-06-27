---
read_when:
    - Travailler sur les réactions dans n’importe quel canal
    - Comprendre les différences des réactions emoji selon les plateformes
summary: Sémantique de l’outil de réaction sur tous les canaux pris en charge
title: Réactions
x-i18n:
    generated_at: "2026-06-27T18:20:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
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

- `emoji` est obligatoire lors de l’ajout d’une réaction.
- Définissez `emoji` sur une chaîne vide (`""`) pour supprimer la ou les réactions du bot.
- Définissez `remove: true` pour supprimer un emoji spécifique (nécessite un `emoji` non vide).
- Sur les canaux qui prennent en charge les réactions d’état, `trackToolCalls: true` sur une réaction permet au runtime d’utiliser ce message ayant reçu une réaction pour les réactions de progression d’outils suivantes pendant le même tour.

## Comportement par canal

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Un `emoji` vide supprime toutes les réactions du bot sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Google Chat">
    - Un `emoji` vide supprime les réactions de l’application sur le message.
    - `remove: true` supprime uniquement l’emoji spécifié.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Ajout de réactions uniquement : `emoji` est obligatoire et ne doit pas être vide.
    - La suppression de réactions n’est pas encore prise en charge ; les appels avec `remove: true` (ou un `emoji` vide) sont rejetés avec une erreur claire au lieu de ne rien faire silencieusement.
    - Nécessite que le bot Talk soit enregistré avec la fonctionnalité `reaction` (voir [documentation du canal Nextcloud Talk](/fr/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Un `emoji` vide supprime les réactions du bot.
    - `remove: true` supprime également les réactions, mais nécessite toujours un `emoji` non vide pour la validation de l’outil.

  </Accordion>

  <Accordion title="WhatsApp">
    - Un `emoji` vide supprime la réaction du bot.
    - `remove: true` correspond en interne à un emoji vide (nécessite toujours `emoji` dans l’appel d’outil).
    - WhatsApp dispose d’un seul emplacement de réaction de bot par message ; les mises à jour de réaction d’état remplacent cet emplacement au lieu d’empiler plusieurs emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Nécessite un `emoji` non vide.
    - `remove: true` supprime cette réaction emoji spécifique.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Utilisez l’outil `feishu_reaction` avec les actions `add`, `remove` et `list`.
    - L’ajout/la suppression nécessite `emoji_type` ; la suppression nécessite également `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Les notifications de réactions entrantes sont contrôlées par `channels.signal.reactionNotifications` : `"off"` les désactive, `"own"` (par défaut) émet des événements lorsque les utilisateurs réagissent aux messages du bot, et `"all"` émet des événements pour toutes les réactions.

  </Accordion>

  <Accordion title="iMessage">
    - Les réactions sortantes sont des tapbacks iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` et `question`).
    - Les notifications de tapbacks entrants sont contrôlées par `channels.imessage.reactionNotifications` : `"off"` les désactive, `"own"` (par défaut) émet des événements lorsque les utilisateurs réagissent aux messages rédigés par le bot, et `"all"` émet des événements pour tous les tapbacks provenant d’expéditeurs autorisés.

  </Accordion>
</AccordionGroup>

## Niveau de réaction

La configuration `reactionLevel` par canal contrôle l’étendue de l’utilisation des réactions par l’agent. Les valeurs sont généralement `off`, `ack`, `minimal` ou `extensive`.

- [Telegram reactionLevel](/fr/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/fr/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Définissez `reactionLevel` sur des canaux individuels pour ajuster l’activité des réactions de l’agent aux messages sur chaque plateforme.

## Associé

- [Agent Send](/fr/tools/agent-send) — l’outil `message` qui inclut `react`
- [Canaux](/fr/channels) — configuration propre à chaque canal
