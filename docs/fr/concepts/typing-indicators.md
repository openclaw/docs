---
read_when:
    - Modification du comportement ou des paramètres par défaut de l’indicateur de saisie
summary: Quand OpenClaw affiche les indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-05-11T20:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Les indicateurs de saisie sont envoyés au canal de discussion pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est actualisée.

## Valeurs par défaut

Quand `agents.defaults.typingMode` est **non défini**, OpenClaw conserve le comportement hérité :

- **Discussions directes** : la saisie commence immédiatement une fois que la boucle du modèle démarre.
- **Discussions de groupe avec une mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie ne commence que lorsque le texte du message commence à être diffusé en streaming.
- **Exécutions Heartbeat** : la saisie commence lorsque l’exécution Heartbeat démarre si la
  cible Heartbeat résolue est une discussion compatible avec la saisie et que la saisie n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` - aucun indicateur de saisie, jamais.
- `instant` - commence à saisir **dès que la boucle du modèle démarre**, même si l’exécution
  renvoie ensuite uniquement le jeton de réponse silencieuse.
- `thinking` - commence à saisir au **premier delta de raisonnement** (nécessite
  `reasoningLevel: "stream"` pour l’exécution).
- `message` - commence à saisir au **premier delta de texte non silencieux** (ignore
  le jeton silencieux `NO_REPLY`).

Ordre de « précocité de déclenchement » :
`never` → `message` → `thinking` → `instant`

## Configuration

Définissez la valeur par défaut au niveau de l’agent :

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Remplacez le mode ou la cadence par session :

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Remarques

- Le mode `message` n’affichera pas la saisie pour les réponses uniquement silencieuses lorsque toute
  la charge utile est le jeton silencieux exact (par exemple `NO_REPLY` / `no_reply`,
  correspondant sans tenir compte de la casse).
- `thinking` ne se déclenche que si l’exécution diffuse le raisonnement en streaming (`reasoningLevel: "stream"`).
  Si le modèle n’émet pas de deltas de raisonnement, la saisie ne commencera pas.
- La saisie Heartbeat est un signal de vivacité pour la cible de livraison résolue. Elle
  commence au démarrage de l’exécution Heartbeat au lieu de suivre le calendrier du flux `message` ou `thinking`.
  Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas la saisie lorsque `target: "none"`, lorsque la cible ne peut
  pas être résolue, lorsque la livraison de discussion est désactivée pour le Heartbeat, ou lorsque le
  canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence d’actualisation**, pas l’heure de début.
  La valeur par défaut est de 6 secondes.

## Liens associés

<CardGroup cols={2}>
  <Card title="Presence" href="/fr/concepts/presence" icon="signal">
    Comment le Gateway suit les clients connectés et les expose dans l’onglet Instances de macOS.
  </Card>
  <Card title="Streaming and chunking" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement du streaming sortant, limites des fragments et livraison propre à chaque canal.
  </Card>
</CardGroup>
