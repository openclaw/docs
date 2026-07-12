---
read_when:
    - Utiliser /steer ou /tell lorsqu’un agent est déjà en cours d’exécution
    - Comparaison de /steer avec les modes /queue
    - Décider s’il faut orienter l’exécution en cours ou une session ACP
sidebarTitle: Steer
summary: Piloter une exécution active sans changer le mode de file d’attente
title: Orienter
x-i18n:
    generated_at: "2026-07-12T03:13:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` essaie d’abord d’envoyer des instructions à une exécution déjà active. Cette commande est destinée aux moments où vous souhaitez « ajuster cette exécution pendant qu’elle est encore en cours ». Si le runtime actuel ne peut pas accepter d’instructions, OpenClaw envoie le message comme une invite normale au lieu de l’ignorer.

## Session actuelle

Utilisez la commande `/steer` de premier niveau pour cibler l’exécution active de la session actuelle :

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportement :

- Cible uniquement l’exécution active de la session actuelle.
- Fonctionne indépendamment du mode `/queue` de la session.
- Démarre un tour normal avec le même message lorsque la session est inactive ou que l’exécution active ne peut pas accepter d’instructions.
- Utilise le mécanisme d’orientation du runtime actif, afin que le modèle reçoive les instructions à la prochaine limite prise en charge par le runtime.

## Orientation et file d’attente

`/queue steer` permet aux messages entrants normaux de tenter d’orienter l’exécution active lorsqu’ils arrivent pendant qu’une exécution est en cours. `/steer <message>` est une commande explicite qui tente d’injecter le message de cette commande dans l’exécution active à la prochaine limite prise en charge par le runtime, quel que soit le paramètre `/queue` enregistré. Lorsque cette injection n’est pas disponible, le préfixe de commande est supprimé et `<message>` est traité comme une invite normale.

Utilisation :

- `/steer <message>` lorsque vous souhaitez guider immédiatement l’exécution active.
- `/queue steer` lorsque vous souhaitez que les futurs messages normaux orientent par défaut les exécutions actives.
- `/queue collect` ou `/queue followup` lorsque les futurs messages normaux doivent attendre un tour ultérieur au lieu d’orienter l’exécution active.
- `/queue interrupt` lorsque le message le plus récent doit remplacer l’exécution active au lieu de l’orienter.

Pour les modes de file d’attente et les limites d’orientation, consultez [File d’attente des commandes](/fr/concepts/queue) et [File d’attente d’orientation](/fr/concepts/queue-steering).

## Sous-agents

La commande `/steer` de premier niveau cible l’exécution active de la session actuelle. Les sous-agents rendent compte à leur session parente ou demandeuse ; `/subagents` sert uniquement à assurer la visibilité.

## Sessions ACP

Utilisez `/acp steer` lorsque la cible est une session de harnais ACP :

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consultez [Agents ACP](/fr/tools/acp-agents) pour la sélection des sessions ACP et le comportement du runtime.

## Pages associées

- [Commandes à barre oblique](/fr/tools/slash-commands)
- [File d’attente des commandes](/fr/concepts/queue)
- [File d’attente d’orientation](/fr/concepts/queue-steering)
- [Sous-agents](/fr/tools/subagents)
