---
read_when:
    - Utilisation des réactions dans n’importe quel canal
    - Comprendre les différences entre les réactions emoji selon les plateformes
summary: Sémantique de l’outil de réaction sur tous les canaux pris en charge
title: Réactions
x-i18n:
    generated_at: "2026-07-12T16:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

L’agent ajoute et supprime des réactions emoji à l’aide de l’action `react`
de l’outil `message`. Le comportement varie selon le canal.

## Fonctionnement

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` est requis pour ajouter une réaction.
- Définissez `emoji` sur une chaîne vide (`""`) pour supprimer la ou les réactions du bot sur
  les canaux qui le permettent.
- Définissez `remove: true` pour supprimer un emoji précis (nécessite une valeur
  `emoji` non vide).
- Sur les canaux prenant en charge les réactions de statut, `trackToolCalls: true` sur une réaction permet
  à l’environnement d’exécution de réutiliser le message concerné pour les réactions ultérieures indiquant la progression des outils
  pendant le même tour.

## Comportement selon le canal

<AccordionGroup>
  <Accordion title="Discord et Slack">
    - Une valeur `emoji` vide supprime toutes les réactions du bot sur le message.
    - `remove: true` supprime uniquement l’emoji indiqué.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Ajout de réactions uniquement : `emoji` est requis et doit être non vide.
    - La suppression des réactions n’est pas encore reliée à un appel de suppression ; `remove: true` est rejeté avec une erreur explicite au lieu de ne rien faire silencieusement.
    - Nécessite que le bot Talk soit enregistré avec la fonctionnalité `reaction` (consultez la [documentation du canal Nextcloud Talk](/fr/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Une valeur `emoji` vide supprime les réactions du bot.
    - `remove: true` supprime également les réactions, mais nécessite toujours une valeur `emoji` non vide pour la validation de l’outil.

  </Accordion>

  <Accordion title="WhatsApp">
    - Une valeur `emoji` vide supprime la réaction du bot.
    - `remove: true` est converti en emoji vide en interne (mais nécessite toujours `emoji` dans l’appel de l’outil).
    - WhatsApp dispose d’un seul emplacement de réaction du bot par message ; l’envoi d’une nouvelle réaction remplace la précédente au lieu d’empiler plusieurs emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Nécessite une valeur `emoji` non vide pour l’ajout comme pour la suppression.
    - `remove: true` supprime cette réaction emoji précise.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Utilise la même action `react` que les autres canaux (ajout, suppression et liste via les identifiants de réaction aux messages), et non un outil distinct.
    - L’ajout nécessite une valeur `emoji` non vide (convertie en `emoji_type` Feishu, par exemple `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` nécessite une valeur `emoji` non vide et supprime la propre réaction du bot correspondant à ce type d’emoji.
    - Une valeur `emoji` vide avec `clearAll: true` supprime toutes les réactions du bot sur le message.

  </Accordion>

  <Accordion title="Signal">
    - Les notifications de réactions entrantes sont contrôlées par `channels.signal.reactionNotifications` : `"off"` les désactive, `"own"` (valeur par défaut) émet des événements lorsque des utilisateurs réagissent aux messages du bot, `"all"` émet des événements pour toutes les réactions et `"allowlist"` émet des événements uniquement pour les expéditeurs figurant dans `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Les réactions sortantes sont des réactions rapides iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` et `question`) ; `emoji` doit correspondre à l’un de ces types pour ajouter une réaction.
    - `remove: true` sans type de réaction rapide reconnu supprime tous les types de réactions rapides ; avec un type reconnu, il supprime uniquement celui-ci.

  </Accordion>
</AccordionGroup>

## Niveau de réaction

Le paramètre `reactionLevel` propre à chaque canal limite la fréquence à laquelle l’agent envoie ses propres
réactions. Valeurs : `off`, `ack`, `minimal` ou `extensive`.

- [Notifications de réactions Telegram](/fr/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (valeur par défaut : `minimal`)
- [Niveau de réaction WhatsApp](/fr/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (valeur par défaut : `minimal`)
- [Réactions Signal](/fr/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (valeur par défaut : `minimal`)

## Voir aussi

- [Envoi par l’agent](/fr/tools/agent-send) - l’outil `message` qui inclut `react`
- [Canaux](/fr/channels) - configuration propre à chaque canal
