---
read_when:
    - Vous voulez que les agents détectent lorsqu’une personne ou un autre agent modifie une session à leur insu.
    - Vous déboguez les notifications de changement d’état, les curseurs de surveillance ou les modifications de `session_status` depuis
    - Vous souhaitez comprendre comment les agents parents restent synchronisés avec les sessions enfants
sidebarTitle: Session state awareness
summary: 'Journal durable des signaux d’état de session : versions d’état, observateurs, notifications d’état obsolète et réconciliation'
title: Connaissance de l’état de la session
x-i18n:
    generated_at: "2026-07-12T21:38:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06ec310fc482ce658eb37628ac33c4224349846d1ffd6e8edeac01bc84e56341
    source_path: concepts/session-state.md
    workflow: 16
---

Lorsque plusieurs sessions travaillent sur le même problème — un gestionnaire déléguant à des enfants, un humain intervenant directement dans une session de travail, deux agents se coordonnant via [`sessions_send`](/fr/concepts/session-tool) — chaque session élabore des hypothèses sur les autres. Ces hypothèses deviennent obsolètes dès qu’un autre acteur intervient. La connaissance de l’état des sessions est le mécanisme qui détecte l’intervention, avertit une seule fois la session concernée et lui fournit un moyen peu coûteux de se mettre à jour avant d’agir.

Trois éléments fonctionnent ensemble :

1. Un **journal de signaux durable** enregistre certaines modifications d’état pour chaque session.
2. Des **observateurs** conservent des curseurs propres à chaque cible et reçoivent une seule notification agrégée indiquant que l’état est obsolète.
3. La **réconciliation** récupère le delta exact via `session_status` avec `changesSince`.

## Le journal de signaux

OpenClaw ajoute un événement typé à la base de données d’état partagée (`session_state_events`) lorsqu’une session observée subit une modification significative. Les événements contiennent des métadonnées et un résumé sur une ligne — jamais le contenu des messages.

| Type                   | Enregistré lorsque                                                  | Avertit les observateurs |
| ---------------------- | ------------------------------------------------------------------- | ------------------------ |
| `human_direct_message` | Un humain envoie directement un tour à une session observée         | Oui                      |
| `goal_changed`         | L’état de l’objectif de la session est créé, mis à jour ou effacé   | Oui                      |
| `child_spawned`        | Une session enfant de sous-agent ou ACP est créée                   | Non (amorce le curseur)  |
| `run_completed`        | Une exécution enfant se termine avec succès                         | Non (journal uniquement) |
| `run_failed`           | Une exécution enfant échoue, expire ou est annulée                  | Non (journal uniquement) |
| `compacted`            | L’historique de la session fait l’objet d’une Compaction            | Non (journal uniquement) |

Chaque événement indique son acteur (`human`, `agent` ou `system`). Les exécutions enfants annulées et arrivées à expiration sont enregistrées comme des échecs, avec le résultat précis (`cancelled`, `timeout` ou `error`) conservé dans la charge utile de l’événement.

La **version d’état** d’une session correspond simplement au numéro de séquence le plus élevé de son journal, suivi dans une tête durable propre à la session qui subsiste après l’élagage. Les lignes de `sessions_list` incluent `stateVersion` lorsqu’une session a enregistré des modifications ; `session_status` l’indique toujours.

Les types réservés au journal servent à l’historique de réconciliation, et non aux notifications : la remise ordinaire des fins d’exécution enfant reste gérée par les [annonces des sous-agents](/fr/tools/subagents), et le journal de signaux ne la duplique jamais.

## Observateurs

Un observateur est une session qui conserve un curseur (`session_watch_cursors`) sur une cible. Les curseurs proviennent de deux sources :

- **Implicites (liens de création).** Lorsqu’une session crée un sous-agent ou un enfant ACP, le curseur du parent est automatiquement amorcé à la version de création de l’enfant. Les parents ne s’abonnent jamais manuellement.
- **Explicites (`sessions_send watch: true`).** Tout coordinateur peut observer une cible qu’il n’a pas créée : transmettez `watch: true` à `sessions_send` et, une fois l’envoi effectué avec succès, l’expéditeur est enregistré comme observateur de la session qui a réellement reçu le message. L’enregistrement commence à la version d’état actuelle de la cible — l’historique antérieur ne produit jamais de notifications. Le résultat de l’outil indique `watched: true|false` lorsque le paramètre a été défini.

L’identité de l’observateur doit être une clé de session qualifiée par l’agent. Avec `session.scope="global"`, la clé partagée `global` est ambiguë entre les agents ; ces sessions bénéficient donc du journal durable et de `changesSince`, mais d’aucune notification proactive.

Les observations se nettoient automatiquement : les lignes de curseur expirent avec la durée de conservation du journal de signaux, sont supprimées lorsque la session de l’observateur est réinitialisée et sont effacées avec l’une ou l’autre session. Il n’existe aucune commande de désabonnement dans la v1.

## Notifications : une seule, pas plusieurs

Lorsqu’un événement pouvant déclencher une notification survient et que le curseur d’un observateur est en retard, celui-ci reçoit une seule notification système lors de son prochain tour :

```
La session "agent:main:subagent:child" a changé (autre acteur). Effectuez une réconciliation avant d’agir : session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Les observateurs de la session principale sont également réveillés immédiatement par un réveil Heartbeat ; les observateurs de sous-agents imbriqués reçoivent la notification lors de leur prochain tour.

Le protocole est délibérément conçu pour éviter les notifications répétitives :

- **Une seule notification en attente par paire observateur/cible.** Le texte de la notification reste identique octet par octet tant qu’elle est en attente, et la file d’événements système le déduplique ; vingt modifications rapides de la même cible ne produisent donc toujours qu’une seule ligne dans le prompt de l’observateur.
- **Repère figé.** Le curseur fige sa position notifiée lorsqu’une notification est mise en file d’attente. Les événements significatifs ultérieurs ne font progresser que le repère significatif ; ils ne déclenchent pas de nouvelle notification.
- **Acquittement à la consommation, réouverture uniquement en cas de travail intercalé.** Lorsque le tour de l’observateur consomme la notification, le curseur avance. Si d’autres événements significatifs sont survenus entre la mise en file d’attente et la consommation, une seule nouvelle notification est ouverte pour les événements restants.
- **Auto-suppression.** Un observateur n’est jamais averti des événements qu’il a lui-même provoqués.
- **Récupération après redémarrage.** Les notifications en attente résident dans une file en mémoire ; une analyse au démarrage les recrée à partir des curseurs durables après le redémarrage d’un Gateway.

## Réconciliation

La notification indique précisément à l’observateur ce qu’il doit faire. `session_status` avec `changesSince: <version>` renvoie les événements typés postérieurs à cette version (jusqu’à 200), sans faire avancer aucun curseur :

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "message humain via telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "objectif mis à jour" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` signifie que la version demandée est antérieure à l’historique conservé — actualisez l’intégralité de l’état de la session (`sessions_history`, `session_status`) au lieu de considérer la réponse comme un delta exact. Le signalement de la lacune est exact : il provient d’un repère d’élagage propre à la session et n’est pas déduit par calcul sur les numéros de séquence.

## Stockage et limites

L’historique réside dans la base de données d’état partagée, avec une limite de 30 jours et 50,000 lignes ; les têtes propres aux sessions restent monotones après l’élagage. L’enregistrement s’effectue au mieux — l’échec d’un ajout est journalisé et ne fait jamais échouer le tour d’origine — de sorte que `stateVersion` est une tête du journal de signaux, et non une version transactionnelle de capture des modifications de données.

Limites actuelles :

- La remise des notifications suppose qu’un seul processus Gateway possède la base de données d’état partagée. Plusieurs Gateway partagent le journal durable et `changesSince`, mais la v1 ne transmet pas les notifications entre les processus.
- Les événements de Compaction couvrent les propriétaires de la Compaction de l’environnement d’exécution intégré ; la Compaction propre au harnais natif n’est pas entièrement journalisée.
- Les détails de charge utile des résultats annulés sont actuellement produits par les exécutions enfants ACP ; les annulations des sous-agents natifs apparaissent comme des échecs génériques.

## Ressources associées

- [Outils de session](/fr/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Sous-agents](/fr/tools/subagents) — liens de création et annonces de fin d’exécution
- [Heartbeat](/fr/gateway/heartbeat) — mécanisme par lequel les notifications en file d’attente réveillent les sessions principales
- [Gestion des sessions](/fr/concepts/session) — clés de session, portées et cycle de vie
