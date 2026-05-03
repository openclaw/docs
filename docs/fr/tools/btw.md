---
read_when:
    - Vous souhaitez poser une brève question annexe sur la session actuelle
    - Vous implémentez ou déboguez le comportement BTW sur l’ensemble des clients
summary: Questions secondaires éphémères avec /btw
title: Au fait, questions secondaires
x-i18n:
    generated_at: "2026-05-03T21:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` vous permet de poser une question annexe rapide sur la **session actuelle** sans
transformer cette question en historique de conversation normal. `/side` est un alias.

Son comportement s’inspire du `/btw` de Claude Code, mais il est adapté au
Gateway et à l’architecture multicanal d’OpenClaw.

## Ce qu’il fait

Lorsque vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. prend un instantané du contexte de session actuel,
2. lance un appel de modèle **sans outil** distinct,
3. répond uniquement à la question annexe,
4. laisse l’exécution principale intacte,
5. n’écrit **pas** la question ni la réponse BTW dans l’historique de session,
6. émet la réponse sous forme de **résultat annexe en direct** plutôt que comme un message d’assistant normal.

Le modèle mental important est le suivant :

- même contexte de session
- requête annexe ponctuelle distincte
- aucun appel d’outil
- aucune pollution du contexte futur
- aucune persistance dans la transcription

## Ce qu’il ne fait pas

`/btw` ne fait **pas** ce qui suit :

- créer une nouvelle session durable,
- continuer la tâche principale inachevée,
- exécuter des outils ou des boucles d’outils d’agent,
- écrire les données de question/réponse BTW dans l’historique de transcription,
- apparaître dans `chat.history`,
- survivre à un rechargement.

Il est intentionnellement **éphémère**.

## Fonctionnement du contexte

BTW utilise la session actuelle uniquement comme **contexte d’arrière-plan**.

Si l’exécution principale est actuellement active, OpenClaw prend un instantané
de l’état actuel des messages et inclut la consigne principale en cours comme
contexte d’arrière-plan, tout en indiquant explicitement au modèle :

- de répondre uniquement à la question annexe,
- de ne pas reprendre ni terminer la tâche principale inachevée,
- de ne pas émettre d’appels d’outils ni de pseudo-appels d’outils.

Cela maintient BTW isolé de l’exécution principale tout en lui permettant de
savoir de quoi traite la session.

## Modèle de livraison

BTW n’est **pas** livré comme un message normal de transcription d’assistant.

Au niveau du protocole Gateway :

- le chat d’assistant normal utilise l’événement `chat`
- BTW utilise l’événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin d’événement
`chat` normal, les clients le traiteraient comme un historique de conversation
régulier.

Comme BTW utilise un événement en direct distinct et n’est pas rejoué depuis
`chat.history`, il disparaît après un rechargement.

## Comportement selon la surface

### TUI

Dans le TUI, BTW est affiché en ligne dans la vue de session actuelle, mais il
reste éphémère :

- visiblement distinct d’une réponse normale de l’assistant
- peut être fermé avec `Enter` ou `Esc`
- n’est pas rejoué au rechargement

### Canaux externes

Sur des canaux comme Telegram, WhatsApp et Discord, BTW est livré sous forme de
réponse ponctuelle clairement libellée, car ces surfaces ne disposent pas d’un
concept local de superposition éphémère.

La réponse est toujours traitée comme un résultat annexe, et non comme un
historique de session normal.

### Control UI / Web

Le Gateway émet correctement BTW sous forme de `chat.side_result`, et BTW n’est
pas inclus dans `chat.history`, de sorte que le contrat de persistance est déjà
correct pour le Web.

La Control UI actuelle a encore besoin d’un consommateur dédié de
`chat.side_result` pour afficher BTW en direct dans le navigateur. Jusqu’à ce
que cette prise en charge côté client soit disponible, BTW est une fonctionnalité
au niveau du Gateway avec un comportement complet dans le TUI et les canaux
externes, mais pas encore une UX navigateur complète.

## Quand utiliser BTW

Utilisez `/btw` lorsque vous voulez :

- une clarification rapide sur le travail actuel,
- une réponse factuelle annexe pendant qu’une longue exécution est encore en cours,
- une réponse temporaire qui ne doit pas devenir une partie du contexte futur de la session.

Exemples :

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quand ne pas utiliser BTW

N’utilisez pas `/btw` lorsque vous voulez que la réponse fasse partie du
contexte de travail futur de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu
d’utiliser BTW.

## Liens connexes

- [Commandes slash](/fr/tools/slash-commands)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Session](/fr/concepts/session)
