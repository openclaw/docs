---
read_when:
    - Modification du comportement ou des valeurs par défaut de l’indicateur de saisie
summary: Quand OpenClaw affiche les indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-07-12T15:24:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Des indicateurs de saisie sont envoyés au canal de discussion pendant l’exécution d’une tâche. Utilisez `agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds` pour contrôler **à quelle fréquence** elle est actualisée (cadence de maintien de connexion, 6 secondes par défaut).

## Valeurs par défaut

Lorsque `agents.defaults.typingMode` n’est **pas défini** :

- **Discussions directes** : la saisie commence immédiatement dès que la boucle du modèle démarre.
- **Discussions de groupe avec une mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie commence lorsque l’exécution autorisée présente une activité visible par l’utilisateur, comme une activité d’exécution du harnais ou du texte de message.
- **Exécutions Heartbeat** : la saisie commence au démarrage de l’exécution Heartbeat, si la cible Heartbeat déterminée est une discussion prenant en charge la saisie et que celle-ci n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` - aucun indicateur de saisie, en aucune circonstance.
- `instant` - commencer la saisie **dès que la boucle du modèle démarre**, même si l’exécution ne renvoie ensuite que le jeton de réponse silencieuse.
- `thinking` - commencer la saisie au **premier delta de raisonnement**, ou lors de l’exécution active du harnais après l’acceptation du tour.
- `message` - commencer la saisie à la **première activité de réponse visible par l’utilisateur**, comme une exécution active du harnais ou un delta de texte non silencieux. Les jetons de réponse silencieuse tels que `NO_REPLY` ne sont pas considérés comme une activité textuelle.

Ordre indiquant « à quel moment il se déclenche » : `never` -> `message`/`thinking` -> `instant`.

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

Remplacez le mode ou la cadence pour chaque session :

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Remarques

- Le mode `message` ne démarre pas avec les jetons de réponse silencieuse, mais une exécution active peut tout de même afficher l’indicateur de saisie avant que le moindre texte de l’assistant soit disponible.
- Le mode `thinking` réagit toujours au raisonnement diffusé en continu (`reasoningLevel: "stream"`) et peut également démarrer à partir d’une exécution active avant l’arrivée des deltas de raisonnement.
- La saisie Heartbeat est un signal d’activité pour la cible de livraison déterminée. Elle commence au démarrage de l’exécution Heartbeat au lieu de suivre la temporisation du flux `message` ou `thinking`. Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas d’indicateur de saisie lorsque la cible Heartbeat est `"none"`, lorsque la cible ne peut pas être déterminée, lorsque la livraison dans la discussion est désactivée pour le Heartbeat ou lorsque le canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence d’actualisation**, et non l’heure de début. Valeur par défaut : 6 secondes.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Présence" href="/fr/concepts/presence" icon="signal">
    Comment le Gateway suit les clients connectés pour la page Appareils de l’interface de contrôle et l’onglet Instances de macOS.
  </Card>
  <Card title="Diffusion en continu et segmentation" href="/fr/concepts/streaming" icon="bars-staggered">
    Comportement de la diffusion sortante, limites des segments et livraison propre à chaque canal.
  </Card>
</CardGroup>
