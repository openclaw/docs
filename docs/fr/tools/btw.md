---
read_when:
    - Vous souhaitez poser une brève question annexe au sujet de la session en cours
    - Vous implémentez ou déboguez le comportement BTW sur plusieurs clients
summary: Questions secondaires éphémères avec /btw
title: Au fait, questions secondaires
x-i18n:
    generated_at: "2026-05-06T07:40:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` vous permet de poser rapidement une question annexe sur la **session actuelle** sans
transformer cette question en historique de conversation normal. `/side` est un alias.

Il s’inspire du comportement `/btw` de Claude Code, mais il est adapté au Gateway et à
l’architecture multicanal d’OpenClaw.

## Ce qu’il fait

Lorsque vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. capture le contexte actuel de la session,
2. exécute un appel de modèle **sans outil** séparé,
3. répond uniquement à la question annexe,
4. laisse l’exécution principale intacte,
5. n’écrit **pas** la question ni la réponse BTW dans l’historique de session,
6. émet la réponse comme **résultat annexe en direct** plutôt que comme message d’assistant normal.

Le modèle mental important est le suivant :

- même contexte de session
- requête annexe ponctuelle séparée
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

BTW utilise la session actuelle comme **contexte d’arrière-plan uniquement**.

Si l’exécution principale est actuellement active, OpenClaw capture l’état actuel des messages
et inclut l’invite principale en cours comme contexte d’arrière-plan, tout en
indiquant explicitement au modèle :

- répondre uniquement à la question annexe,
- ne pas reprendre ni terminer la tâche principale inachevée,
- ne pas émettre d’appels d’outil ni de pseudo-appels d’outil.

Cela maintient BTW isolé de l’exécution principale tout en lui permettant de savoir de quoi
traite la session.

## Modèle de livraison

BTW n’est **pas** livré comme un message normal d’assistant dans la transcription.

Au niveau du protocole Gateway :

- le chat d’assistant normal utilise l’événement `chat`
- BTW utilise l’événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin d’événement `chat` normal,
les clients le traiteraient comme de l’historique de conversation ordinaire.

Comme BTW utilise un événement en direct séparé et n’est pas rejoué depuis
`chat.history`, il disparaît après rechargement.

## Comportement de surface

### TUI

Dans TUI, BTW est rendu en ligne dans la vue de session actuelle, mais il reste
éphémère :

- visiblement distinct d’une réponse d’assistant normale
- masquable avec `Enter` ou `Esc`
- non rejoué au rechargement

### Canaux externes

Sur les canaux comme Telegram, WhatsApp et Discord, BTW est livré sous forme de
réponse ponctuelle clairement libellée, car ces surfaces n’ont pas de concept
local de superposition éphémère.

La réponse est toujours traitée comme un résultat annexe, et non comme l’historique normal de session.

### Control UI / web

Le Gateway émet correctement BTW sous forme de `chat.side_result`, et BTW n’est pas inclus
dans `chat.history`, donc le contrat de persistance est déjà correct pour le web.

Le Control UI actuel a encore besoin d’un consommateur `chat.side_result` dédié pour
rendre BTW en direct dans le navigateur. Tant que cette prise en charge côté client n’est pas disponible, BTW est une
fonctionnalité au niveau du Gateway avec un comportement complet dans TUI et les canaux externes, mais pas encore
une expérience utilisateur navigateur complète.

## Quand utiliser BTW

Utilisez `/btw` lorsque vous voulez :

- une clarification rapide sur le travail en cours,
- une réponse factuelle annexe pendant qu’une longue exécution est encore en cours,
- une réponse temporaire qui ne doit pas faire partie du contexte futur de la session.

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
futur contexte de travail de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu d’utiliser BTW.

## Liens associés

<CardGroup cols={2}>
  <Card title="Slash commands" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue de commandes natives et directives de chat.
  </Card>
  <Card title="Thinking levels" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour l’appel de modèle de question annexe.
  </Card>
  <Card title="Session" href="/fr/concepts/session" icon="comments">
    Clés de session, historique et sémantique de persistance.
  </Card>
  <Card title="Steer command" href="/fr/tools/steer" icon="arrow-right">
    Injecter un message de pilotage dans l’exécution active sans y mettre fin.
  </Card>
</CardGroup>
