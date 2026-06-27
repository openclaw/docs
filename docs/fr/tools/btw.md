---
read_when:
    - Vous voulez poser rapidement une question annexe sur la session en cours
    - Vous implémentez ou déboguez le comportement BTW entre les clients
summary: Questions secondaires éphémères avec /btw
title: Au fait, questions annexes
x-i18n:
    generated_at: "2026-06-27T18:16:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` vous permet de poser une brève question annexe sur la **session actuelle** sans
transformer cette question en historique de conversation normal. `/side` est un alias.

Son comportement s’inspire du `/btw` de Claude Code, mais il est adapté au Gateway
et à l’architecture multicanal d’OpenClaw.

## Ce qu’il fait

Lorsque vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. capture un instantané du contexte de session actuel,
2. exécute une question annexe éphémère séparée,
3. répond uniquement à la question annexe,
4. laisse l’exécution principale inchangée,
5. n’écrit **pas** la question ni la réponse BTW dans l’historique de session,
6. émet la réponse comme **résultat annexe en direct** plutôt que comme message d’assistant normal.

Le modèle mental important est le suivant :

- même contexte de session
- question annexe séparée à usage unique
- même transport de harnais natif lorsque la session utilise un harnais natif
- aucune pollution du contexte futur
- aucune persistance de transcription

Pour les sessions avec le harnais Codex, BTW reste dans Codex en dupliquant le
fil app-server actif sous forme de fil annexe éphémère. Cela préserve le
comportement OAuth de Codex et le comportement de fil natif, tout en isolant la
réponse annexe de la transcription parente. Comme avec `/side` de Codex, le fil
annexe conserve les autorisations Codex actuelles et la surface d’outils native,
avec des garde-fous qui indiquent au modèle de ne pas traiter le travail hérité
du fil parent comme des instructions actives.

Pour les alias d’exécution CLI, BTW utilise le backend CLI propriétaire en mode
question annexe au lieu de revenir à un appel fournisseur direct. OpenClaw injecte
un contexte de conversation assaini dans une nouvelle invocation CLI à usage
unique, désactive le groupement d’outils MCP OpenClaw et l’état de session CLI
réutilisable pour cette invocation, et laisse le backend ajouter les indicateurs
CLI natifs no-resume ou no-tools qu’il prend en charge. Les runtimes directs non
CLI conservent le chemin direct à usage unique.

## Ce qu’il ne fait pas

`/btw` ne fait **pas** les actions suivantes :

- créer une nouvelle session durable,
- continuer la tâche principale inachevée,
- écrire les données de question/réponse BTW dans l’historique de transcription,
- apparaître dans `chat.history`,
- survivre à un rechargement.

Il est volontairement **éphémère**.

## Fonctionnement du contexte

BTW utilise la session actuelle comme **contexte d’arrière-plan uniquement**.

Si l’exécution principale est actuellement active, OpenClaw capture un instantané
de l’état actuel des messages et inclut l’invite principale en cours comme
contexte d’arrière-plan, tout en indiquant explicitement au modèle :

- répondre uniquement à la question annexe,
- ne pas reprendre ni terminer la tâche principale inachevée,
- ne pas orienter la conversation parente.

Cela maintient BTW isolé de l’exécution principale tout en lui permettant de
comprendre le sujet de la session.

## Modèle de livraison

BTW n’est **pas** livré comme un message de transcription d’assistant normal.

Au niveau du protocole Gateway :

- la discussion normale avec l’assistant utilise l’événement `chat`
- BTW utilise l’événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin d’événement
`chat` normal, les clients le traiteraient comme de l’historique de conversation
ordinaire.

Comme BTW utilise un événement en direct séparé et n’est pas rejoué depuis
`chat.history`, il disparaît après un rechargement.

## Comportement des surfaces

### TUI

Dans le TUI, BTW est rendu en ligne dans la vue de session actuelle, mais il
reste éphémère :

- visiblement distinct d’une réponse d’assistant normale
- pouvant être ignoré avec `Enter` ou `Esc`
- non rejoué au rechargement

### Canaux externes

Sur les canaux comme Telegram, WhatsApp et Discord, BTW est livré comme une
réponse ponctuelle clairement libellée, car ces surfaces n’ont pas de concept
local de superposition éphémère.

La réponse est tout de même traitée comme un résultat annexe, et non comme de
l’historique de session normal.

### Interface de contrôle / web

Le Gateway émet correctement BTW comme `chat.side_result`, et BTW n’est pas inclus
dans `chat.history`, donc le contrat de persistance est déjà correct pour le web.

L’interface Control UI actuelle a encore besoin d’un consommateur dédié de
`chat.side_result` pour afficher BTW en direct dans le navigateur. Tant que cette
prise en charge côté client n’est pas disponible, BTW est une fonctionnalité au
niveau du Gateway avec un comportement complet dans le TUI et les canaux externes,
mais pas encore une expérience navigateur complète.

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

N’utilisez pas `/btw` si vous voulez que la réponse fasse partie du futur contexte
de travail de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu
d’utiliser BTW.

## Associé

<CardGroup cols={2}>
  <Card title="Slash commands" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue de commandes natives et directives de discussion.
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
