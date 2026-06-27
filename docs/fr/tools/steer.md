---
read_when:
    - Utiliser /steer ou /tell alors qu’un agent est déjà en cours d’exécution
    - Comparaison des modes /steer et /queue
    - Décider s’il faut orienter l’exécution en cours ou une session ACP
sidebarTitle: Steer
summary: Piloter une exécution active sans changer le mode de file d’attente
title: Orienter
x-i18n:
    generated_at: "2026-06-27T18:21:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` essaie d’abord d’envoyer des consignes à une exécution déjà active. Il sert aux moments où vous voulez
« ajuster cette exécution pendant qu’elle travaille encore ». Si le runtime actuel
ne peut pas accepter le pilotage, OpenClaw envoie plutôt le message comme une invite normale
au lieu de l’abandonner.

## Session actuelle

Utilisez `/steer` au niveau supérieur pour cibler l’exécution active de la session actuelle :

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportement :

- Cible uniquement l’exécution active de la session actuelle.
- Fonctionne indépendamment du mode `/queue` de la session.
- Démarre un tour normal avec le même message lorsque la session est inactive ou que
  l’exécution active ne peut pas accepter le pilotage.
- Utilise le chemin de pilotage du runtime actif, de sorte que le modèle voit les consignes à
  la prochaine frontière de runtime prise en charge.

## Pilotage ou file d’attente

`/queue steer` fait en sorte que les messages entrants normaux essaient de piloter l’exécution active lorsqu’ils
arrivent pendant qu’une exécution est active. `/steer <message>` est une commande explicite
qui essaie d’injecter le message de cette commande dans l’exécution active à la prochaine
frontière de runtime prise en charge, quel que soit le paramètre `/queue` enregistré. Lorsque
cette injection n’est pas disponible, le préfixe de commande est supprimé et `<message>`
continue comme une invite normale.

Utilisation :

- `/steer <message>` lorsque vous voulez guider l’exécution active immédiatement.
- `/queue steer` lorsque vous voulez que les futurs messages normaux pilotent les exécutions actives par
  défaut.
- `/queue collect` ou `/queue followup` lorsque les futurs messages normaux doivent attendre
  un tour ultérieur au lieu de piloter l’exécution active.
- `/queue interrupt` lorsque le message le plus récent doit remplacer l’exécution active
  au lieu de la piloter.

Pour les modes de file d’attente et les frontières de pilotage, consultez [File d’attente de commandes](/fr/concepts/queue) et
[File d’attente de pilotage](/fr/concepts/queue-steering).

## Sous-agents

`/steer` au niveau supérieur cible l’exécution active de la session actuelle. Les sous-agents rendent compte
à leur session parente/demandeuse ; `/subagents` sert uniquement à la visibilité.

## Sessions ACP

Utilisez `/acp steer` lorsque la cible est une session de harnais ACP :

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consultez [Agents ACP](/fr/tools/acp-agents) pour la sélection des sessions ACP et le comportement
du runtime.

## Connexe

- [Commandes slash](/fr/tools/slash-commands)
- [File d’attente de commandes](/fr/concepts/queue)
- [File d’attente de pilotage](/fr/concepts/queue-steering)
- [Sous-agents](/fr/tools/subagents)
