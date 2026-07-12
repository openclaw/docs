---
read_when:
    - Vous souhaitez poser une brève question complémentaire sur la session en cours
    - Vous implémentez ou déboguez le comportement BTW sur plusieurs clients
summary: Questions secondaires éphémères avec /btw
title: Questions annexes au passage
x-i18n:
    generated_at: "2026-07-12T15:52:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) pose une question annexe rapide sur la **session
actuelle** sans l’ajouter à l’historique de la conversation. Cette commande
s’inspire de `/btw` de Claude Code et est adaptée au Gateway et à
l’architecture multicanal d’OpenClaw.

```text
/btw qu’est-ce qui a changé ?
/side que signifie cette erreur ?
```

## Fonctionnement

1. Capture un instantané de la session actuelle comme contexte d’arrière-plan
   (y compris toute invite d’exécution principale en cours).
2. Exécute une requête annexe distincte et ponctuelle demandant au modèle de
   répondre uniquement à la question annexe, sans reprendre ni orienter la
   tâche principale.
3. Transmet la réponse comme résultat annexe en direct, et non comme message
   normal de l’assistant.
4. N’écrit jamais la question ni la réponse dans l’historique de la session ou
   dans `chat.history`.

L’exécution principale, si elle est active, reste intacte.

Pour les sessions du harnais Codex, BTW crée une bifurcation du thread actif
du serveur d’application Codex dans un thread enfant éphémère, au lieu
d’effectuer un appel distinct au fournisseur. Cela préserve OAuth de Codex
ainsi que le comportement natif des outils et des threads, et le thread
bifurqué conserve la politique d’approbation, le bac à sable et la surface
d’outils native actuels du thread parent. Le thread bifurqué reçoit une invite
de délimitation indiquant au modèle que tout ce qui la précède constitue un
contexte de référence hérité, et non des instructions actives, et que seuls
les messages qui suivent la délimitation sont actifs. `/btw` nécessite un
thread Codex existant ; envoyez d’abord un message normal.

Pour les alias d’environnement d’exécution CLI, BTW appelle le backend CLI
propriétaire en mode de question annexe ponctuelle : il injecte un contexte de
conversation assaini dans une nouvelle invocation de la CLI, avec le
regroupement d’outils et l’état de session réutilisable désactivés, puis ajoute
les éventuels indicateurs empêchant la reprise et l’utilisation d’outils que
le backend prend en charge. Les environnements d’exécution directs (hors CLI)
utilisent à la place un appel direct et ponctuel au fournisseur.

## Ce que cette commande ne fait pas

`/btw` ne crée pas de session durable, ne poursuit pas la tâche principale
inachevée, ne conserve pas les données de la question et de la réponse dans
l’historique de la transcription et ne survit pas à un rechargement.

## Modèle de transmission

La discussion normale avec l’assistant utilise l’événement `chat` du Gateway.
BTW utilise un événement `chat.side_result` distinct afin que les clients ne
puissent pas le confondre avec l’historique normal de la conversation. Comme
il n’est pas relu depuis `chat.history`, il disparaît après un rechargement.

## Comportement selon l’interface

| Interface         | Comportement                                                                                                                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Affiché directement dans le journal de discussion, visiblement distinct d’une réponse normale et pouvant être fermé avec `Enter` ou `Esc`.                                                                                                                                                         |
| Canaux externes   | Transmis sous la forme d’une réponse ponctuelle clairement identifiée (Telegram, WhatsApp et Discord ne disposent d’aucune superposition éphémère locale).                                                                                                                                          |
| Interface de contrôle / Web | Affiché sous la forme d’un panneau flottant « Discussion annexe » épinglé au thread. Les réponses s’accumulent sous forme de tours et un champ « Poser une question complémentaire » permet de poser la question annexe suivante. Fermer (`Esc` ou le X) conserve la conversation, qui se rouvre à la réponse suivante ; le bouton de corbeille la supprime et arrête toute exécution en attente. |

## Fenêtre contextuelle de sélection (interface de contrôle)

La sélection de texte dans un message de discussion de l’interface de contrôle
ouvre une petite fenêtre contextuelle comportant deux actions :

- **Plus de détails** envoie immédiatement une question `/btw` implicite
  demandant au modèle d’expliquer le texte sélectionné dans le contexte de la
  session actuelle. La réponse apparaît dans le panneau flottant de discussion
  annexe.
- **Demander dans la discussion annexe** préremplit le champ de saisie avec un
  brouillon `/btw` citant le texte sélectionné afin que vous puissiez saisir
  votre propre question à son sujet.

Les deux actions suivent la sémantique normale de `/btw` : la question et la
réponse ne sont pas ajoutées à l’historique de la session et l’exécution
principale reste intacte.

## Quand l’utiliser

Utilisez `/btw` pour obtenir rapidement une précision, une réponse factuelle
annexe pendant qu’une longue exécution est toujours en cours ou une réponse
temporaire qui ne doit pas intégrer le contexte futur de la session.

```text
/btw quel fichier sommes-nous en train de modifier ?
/btw résume la tâche actuelle en une phrase
/btw combien font 17 * 19 ?
```

Pour toute information que vous souhaitez intégrer au futur contexte de
travail de la session, posez plutôt votre question normalement dans la session
principale.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Commandes à barre oblique" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue des commandes natives et directives de discussion.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour l’appel au modèle chargé de la question annexe.
  </Card>
  <Card title="Session" href="/fr/concepts/session" icon="comments">
    Clés de session, historique et sémantique de persistance.
  </Card>
  <Card title="Commande d’orientation" href="/fr/tools/steer" icon="arrow-right">
    Injecter un message d’orientation dans l’exécution active sans y mettre fin.
  </Card>
</CardGroup>
