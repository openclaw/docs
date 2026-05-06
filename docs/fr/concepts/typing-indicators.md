---
read_when:
    - Modifier le comportement ou les valeurs par défaut de l’indicateur de saisie
summary: Quand OpenClaw affiche des indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-05-06T07:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Les indicateurs de saisie sont envoyés au canal de discussion pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est actualisée.

## Valeurs par défaut

Quand `agents.defaults.typingMode` est **non défini**, OpenClaw conserve le comportement historique :

- **Discussions directes** : la saisie commence immédiatement une fois que la boucle du modèle démarre.
- **Discussions de groupe avec une mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie ne commence que lorsque le texte du message commence à être diffusé en streaming.
- **Exécutions Heartbeat** : la saisie commence lorsque l’exécution Heartbeat démarre si la
  cible Heartbeat résolue est une discussion compatible avec la saisie et que la saisie n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` - aucun indicateur de saisie, jamais.
- `instant` - commence la saisie **dès que la boucle du modèle démarre**, même si l’exécution
  renvoie ensuite uniquement le jeton de réponse silencieuse.
- `thinking` - commence la saisie au **premier delta de raisonnement** (nécessite
  `reasoningLevel: "stream"` pour l’exécution).
- `message` - commence la saisie au **premier delta de texte non silencieux** (ignore
  le jeton silencieux `NO_REPLY`).

Ordre du « déclenchement le plus tôt » :
`never` → `message` → `thinking` → `instant`

## Configuration

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Vous pouvez remplacer le mode ou la cadence par session :

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Notes

- Le mode `message` n’affiche pas la saisie pour les réponses uniquement silencieuses lorsque toute
  la charge utile est exactement le jeton silencieux (par exemple `NO_REPLY` / `no_reply`,
  avec une correspondance insensible à la casse).
- `thinking` ne se déclenche que si l’exécution diffuse le raisonnement en streaming (`reasoningLevel: "stream"`).
  Si le modèle n’émet pas de deltas de raisonnement, la saisie ne démarre pas.
- La saisie Heartbeat est un signal de disponibilité pour la cible de livraison résolue. Elle
  démarre au début de l’exécution Heartbeat au lieu de suivre le minutage du flux `message` ou `thinking`.
  Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas la saisie lorsque `target: "none"`, lorsque la cible ne peut pas
  être résolue, lorsque la livraison par discussion est désactivée pour le Heartbeat, ou lorsque le
  canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence d’actualisation**, pas l’heure de début.
  La valeur par défaut est de 6 secondes.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Presence" href="/fr/concepts/presence" icon="signal">
    Comment le Gateway suit les clients connectés et les expose dans l’onglet Instances de macOS.
  </Card>
  <Card title="Streaming and chunking" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement du streaming sortant, limites des blocs et livraison propre à chaque canal.
  </Card>
</CardGroup>
