---
read_when:
    - Modification du comportement ou des valeurs par défaut de l’indicateur de saisie
summary: Quand OpenClaw affiche les indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-06-27T17:27:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Des indicateurs de saisie sont envoyés au canal de discussion pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est actualisée.

## Valeurs par défaut

Quand `agents.defaults.typingMode` est **non défini**, OpenClaw conserve le comportement hérité :

- **Discussions directes** : la saisie commence immédiatement dès que la boucle du modèle démarre.
- **Discussions de groupe avec une mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie commence lorsque l’exécution admise a une
  activité visible par l’utilisateur, comme une activité d’exécution du harnais ou du texte de message.
- **Exécutions Heartbeat** : la saisie commence lorsque l’exécution Heartbeat démarre si la
  cible Heartbeat résolue est une discussion compatible avec la saisie et que la saisie n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` - aucun indicateur de saisie, jamais.
- `instant` - démarre la saisie **dès que la boucle du modèle commence**, même si l’exécution
  ne renvoie ensuite que le jeton de réponse silencieuse.
- `thinking` - démarre la saisie au **premier delta de raisonnement** ou lors d’une
  exécution active du harnais après l’acceptation du tour.
- `message` - démarre la saisie à la **première activité de réponse visible par l’utilisateur**, comme
  une exécution active du harnais ou un delta de texte non silencieux. Les jetons de réponse silencieuse comme
  `NO_REPLY` ne comptent pas comme activité textuelle.

Ordre de « déclenchement le plus précoce » :
`never` → `message`/`thinking` → `instant`

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

## Notes

- Le mode `message` ne démarre pas à partir de jetons de réponse silencieuse, mais une exécution active
  peut tout de même afficher la saisie avant qu’un texte d’assistant soit disponible.
- `thinking` réagit toujours au raisonnement diffusé (`reasoningLevel: "stream"`),
  et peut aussi démarrer à partir d’une exécution active avant l’arrivée des deltas de raisonnement.
- La saisie Heartbeat est un signal de disponibilité pour la cible de livraison résolue. Elle
  démarre au début de l’exécution Heartbeat au lieu de suivre la temporisation du flux `message` ou `thinking`.
  Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas la saisie lorsque `target: "none"`, lorsque la cible ne peut pas
  être résolue, lorsque la livraison par discussion est désactivée pour le Heartbeat, ou lorsque le
  canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence d’actualisation**, pas l’heure de début.
  La valeur par défaut est de 6 secondes.

## Associé

<CardGroup cols={2}>
  <Card title="Présence" href="/fr/concepts/presence" icon="signal">
    Comment le Gateway suit les clients connectés et les expose dans l’onglet Instances de macOS.
  </Card>
  <Card title="Streaming et segmentation" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement de streaming sortant, limites des segments et livraison propre à chaque canal.
  </Card>
</CardGroup>
