---
read_when:
    - Vous voulez poser une question annexe rapide sur la session en cours
    - Vous mettez en œuvre ou déboguez le comportement BTW sur l’ensemble des clients
summary: Questions annexes éphémères avec /btw
title: Au fait, questions annexes
x-i18n:
    generated_at: "2026-05-11T20:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` vous permet de poser rapidement une question annexe sur la **session actuelle** sans
transformer cette question en historique de conversation normal. `/side` est un alias.

Son comportement est inspiré de `/btw` dans Claude Code, mais adapté au Gateway
d’OpenClaw et à son architecture multicanal.

## Ce qu’il fait

Quand vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. prend un instantané du contexte de session actuel,
2. exécute une requête annexe éphémère séparée,
3. répond uniquement à la question annexe,
4. laisse l’exécution principale inchangée,
5. n’écrit **pas** la question BTW ni sa réponse dans l’historique de session,
6. émet la réponse comme **résultat annexe en direct** plutôt que comme message assistant normal.

Le modèle mental important est le suivant :

- même contexte de session
- requête annexe séparée et ponctuelle
- même transport natif du harnais lorsque la session utilise un harnais natif
- aucune pollution du contexte futur
- aucune persistance dans la transcription

Pour les sessions du harnais Codex, BTW reste dans Codex en dupliquant le fil
actif du serveur d’application sous forme de fil annexe éphémère. Cela conserve
intacts l’OAuth Codex et le comportement natif des fils, tout en isolant la
réponse annexe de la transcription parente. Comme `/side` dans Codex, le fil annexe
conserve les autorisations Codex actuelles et la surface d’outils native, avec
des garde-fous indiquant au modèle de ne pas traiter le travail hérité du fil
parent comme des instructions actives. Les environnements d’exécution non-Codex
conservent l’ancien chemin ponctuel direct.

## Ce qu’il ne fait pas

`/btw` ne fait **pas** ce qui suit :

- créer une nouvelle session durable,
- poursuivre la tâche principale inachevée,
- écrire les données de question/réponse BTW dans l’historique de transcription,
- apparaître dans `chat.history`,
- survivre à un rechargement.

Il est intentionnellement **éphémère**.

## Fonctionnement du contexte

BTW utilise la session actuelle comme **contexte d’arrière-plan uniquement**.

Si l’exécution principale est actuellement active, OpenClaw prend un instantané
de l’état actuel des messages et inclut l’invite principale en cours comme
contexte d’arrière-plan, tout en indiquant explicitement au modèle :

- répondre uniquement à la question annexe,
- ne pas reprendre ni terminer la tâche principale inachevée,
- ne pas orienter la conversation parente.

Cela maintient BTW isolé de l’exécution principale tout en lui permettant de
comprendre le sujet de la session.

## Modèle de livraison

BTW n’est **pas** livré comme un message assistant normal dans la transcription.

Au niveau du protocole Gateway :

- le chat assistant normal utilise l’événement `chat`
- BTW utilise l’événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin d’événement
`chat` normal, les clients le traiteraient comme un historique de conversation
ordinaire.

Comme BTW utilise un événement en direct séparé et n’est pas rejoué depuis
`chat.history`, il disparaît après un rechargement.

## Comportement en surface

### TUI

Dans la TUI, BTW est rendu en ligne dans la vue de session actuelle, mais il
reste éphémère :

- visiblement distinct d’une réponse assistant normale
- supprimable avec `Enter` ou `Esc`
- non rejoué au rechargement

### Canaux externes

Sur des canaux comme Telegram, WhatsApp et Discord, BTW est livré comme une
réponse ponctuelle clairement libellée, car ces surfaces ne disposent pas d’un
concept local de superposition éphémère.

La réponse est tout de même traitée comme un résultat annexe, et non comme un
historique de session normal.

### Interface de contrôle / web

Le Gateway émet correctement BTW sous forme de `chat.side_result`, et BTW n’est
pas inclus dans `chat.history`; le contrat de persistance est donc déjà correct
pour le web.

L’interface de contrôle actuelle a encore besoin d’un consommateur dédié de
`chat.side_result` pour afficher BTW en direct dans le navigateur. Tant que cette
prise en charge côté client n’est pas livrée, BTW est une fonctionnalité au
niveau du Gateway avec un comportement complet dans la TUI et les canaux
externes, mais pas encore une expérience utilisateur navigateur complète.

## Quand utiliser BTW

Utilisez `/btw` lorsque vous voulez :

- une clarification rapide sur le travail actuel,
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

N’utilisez pas `/btw` lorsque vous voulez que la réponse fasse partie du futur
contexte de travail de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu
d’utiliser BTW.

## Associé

<CardGroup cols={2}>
  <Card title="Slash commands" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue de commandes natives et directives de chat.
  </Card>
  <Card title="Thinking levels" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour l’appel au modèle de question annexe.
  </Card>
  <Card title="Session" href="/fr/concepts/session" icon="comments">
    Clés de session, historique et sémantique de persistance.
  </Card>
  <Card title="Steer command" href="/fr/tools/steer" icon="arrow-right">
    Injecter un message d’orientation dans l’exécution active sans y mettre fin.
  </Card>
</CardGroup>
