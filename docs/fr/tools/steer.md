---
read_when:
    - Utiliser /steer ou /tell pendant qu’un agent est déjà en cours d’exécution
    - Comparaison de /steer avec /queue steer
    - Décider s’il faut piloter l’exécution actuelle, un sous-agent ou une session ACP
sidebarTitle: Steer
summary: Piloter une exécution active sans modifier le mode de file d’attente
title: Orienter
x-i18n:
    generated_at: "2026-05-04T02:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` envoie des consignes à une exécution déjà active. Il sert aux moments où il faut « ajuster cette exécution pendant qu’elle travaille encore », pas à démarrer un nouveau tour.

## Session actuelle

Utilisez `/steer` au niveau supérieur pour cibler l’exécution active de la session actuelle :

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportement :

- Cible uniquement l’exécution active de la session actuelle.
- Fonctionne indépendamment du mode `/queue` de la session.
- Ne démarre pas de nouvelle exécution lorsque la session est inactive.
- Répond avec un avertissement lorsqu’il n’y a aucune exécution active à orienter.
- Utilise le chemin d’orientation du runtime actif, afin que le modèle voie les consignes à la prochaine limite de runtime prise en charge.

## Orientation et file d’attente

`/queue steer` modifie le comportement des messages entrants normaux lorsqu’ils arrivent pendant qu’une exécution est active. `/steer <message>` est une commande explicite qui tente d’injecter le message de cette commande dans l’exécution active à la prochaine limite de runtime prise en charge, indépendamment du réglage `/queue` enregistré.

Utilisation :

- `/steer <message>` lorsque vous voulez guider l’exécution active immédiatement.
- `/queue steer` lorsque vous voulez que les futurs messages normaux orientent les exécutions actives par défaut.
- `/queue collect` ou `/queue followup` lorsque les nouveaux messages doivent attendre un tour ultérieur au lieu d’orienter l’exécution active.

Pour les modes de file d’attente et le comportement de repli, consultez [File d’attente des commandes](/fr/concepts/queue) et [File d’attente d’orientation](/fr/concepts/queue-steering).

## Sous-agents

Utilisez `/subagents steer` lorsque la cible est une exécution enfant :

```text
/subagents steer 2 focus only on the API surface
```

`/steer` au niveau supérieur ne sélectionne pas de sous-agent par id ou par index de liste. Il cible toujours l’exécution active de la session actuelle. Consultez [Sous-agents](/fr/tools/subagents) pour les ids, libellés et commandes de contrôle des sous-agents.

## Sessions ACP

Utilisez `/acp steer` lorsque la cible est une session de harnais ACP :

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consultez [Agents ACP](/fr/tools/acp-agents) pour la sélection des sessions ACP et le comportement du runtime.

## Associés

- [Commandes slash](/fr/tools/slash-commands)
- [File d’attente des commandes](/fr/concepts/queue)
- [File d’attente d’orientation](/fr/concepts/queue-steering)
- [Sous-agents](/fr/tools/subagents)
