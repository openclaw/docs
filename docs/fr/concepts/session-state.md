---
read_when:
    - Vous voulez que les agents détectent lorsque des humains ou d’autres agents modifient une session à leur insu
    - Vous déboguez les notifications de changement d’état, les curseurs de surveillance ou les modifications de `session_status changesSince`
    - Vous souhaitez comprendre comment les agents parents restent synchronisés avec les sessions enfants
sidebarTitle: Session state awareness
summary: 'Journal durable des signaux d’état de session : versions d’état, observateurs, notifications d’état obsolète et réconciliation'
title: Connaissance de l’état de la session
x-i18n:
    generated_at: "2026-07-16T13:09:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Lorsque plusieurs sessions travaillent sur le même problème — un gestionnaire déléguant à des enfants, un humain intervenant directement dans une session de travail, deux agents se coordonnant via [`sessions_send`](/fr/concepts/session-tool) — chaque session élabore des hypothèses sur les autres. Ces hypothèses deviennent obsolètes dès qu’un autre acteur intervient. La conscience de l’état des sessions est le mécanisme qui détecte l’intervention, en informe une fois la session concernée et lui permet de se mettre rapidement à jour avant d’agir.

Trois éléments fonctionnent ensemble :

1. Un **journal de signaux durable** enregistre certains changements d’état pour chaque session.
2. Les **observateurs** conservent des curseurs par cible et reçoivent une seule notification consolidée d’état obsolète.
3. La **réconciliation** récupère le delta exact via `session_status` avec `changesSince`.

## Le journal de signaux

OpenClaw ajoute un événement typé à la base de données d’état partagée (`session_state_events`) lorsqu’une session observée subit un changement significatif. Les événements contiennent des métadonnées et un résumé d’une ligne — jamais le contenu des messages.

| Type                   | Moment de l’enregistrement                               | Informe les observateurs |
| ---------------------- | -------------------------------------------------------- | ------------------------ |
| `human_direct_message` | Un humain envoie directement un tour à une session observée | Oui                   |
| `upstream_missing`     | La source en amont d’une session adoptée disparaît       | Oui                      |
| `goal_changed`         | L’état de l’objectif de la session est créé, mis à jour ou effacé | Oui             |
| `child_spawned`        | Une session enfant de sous-agent ou ACP est créée        | Non (initialise le curseur) |
| `run_completed`        | Une exécution enfant se termine correctement             | Non (journal uniquement) |
| `run_failed`           | Une exécution enfant échoue, expire ou est annulée       | Non (journal uniquement) |
| `compacted`            | L’historique de la session fait l’objet d’une Compaction | Non (journal uniquement) |
| `adopted`              | Une session du catalogue est adoptée dans OpenClaw       | Non (journal uniquement) |

Chaque événement désigne son acteur (`human`, `agent` ou `system`). Les exécutions enfants annulées ou ayant expiré sont enregistrées comme des échecs, avec le résultat précis (`cancelled`, `timeout` ou `error`) conservé dans la charge utile de l’événement.

La **version d’état** d’une session correspond simplement au numéro de séquence le plus élevé de son journal, suivi dans un en-tête durable propre à la session qui subsiste après l’élagage. Les lignes `sessions_list` incluent `stateVersion` lorsqu’une session a enregistré des changements ; `session_status` le signale toujours.

Les types réservés au journal servent à l’historique de réconciliation, pas aux notifications : la remise ordinaire des fins d’exécution enfant reste gérée par les [annonces des sous-agents](/fr/tools/subagents), et le journal de signaux ne la duplique jamais.

## Observateurs

Un observateur est une session qui conserve un curseur (`session_watch_cursors`) sur une cible. Les curseurs proviennent de deux sources :

- **Implicite (liens de création).** Lorsqu’une session crée un sous-agent ou un enfant ACP, le curseur du parent est automatiquement initialisé à la version de création de l’enfant. Les parents ne s’abonnent jamais manuellement.
- **Explicite (`sessions_send watch: true`).** Tout coordinateur peut observer une cible qu’il n’a pas créée : transmettez `watch: true` à `sessions_send` et, une fois l’envoi effectué avec succès, l’expéditeur est enregistré comme observateur de la session ayant réellement reçu le message. L’enregistrement commence à la version d’état actuelle de la cible — l’historique antérieur ne produit jamais de notifications. Le résultat de l’outil indique `watched: true|false` lorsque le paramètre a été défini.

L’identité de l’observateur doit être une clé de session qualifiée par l’agent. Sous `session.scope="global"`, la clé partagée `global` est ambiguë entre les agents ; ces sessions obtiennent donc le journal durable et `changesSince`, mais aucune notification proactive.

Les observations se nettoient automatiquement : les lignes de curseur expirent selon la durée de conservation du journal de signaux, sont supprimées lorsque la session observatrice est réinitialisée et sont effacées avec l’une ou l’autre session. La v1 ne comporte aucune commande permettant de cesser l’observation.

Les sessions observées adoptées depuis un catalogue de sessions sont vérifiées à intervalle fixe afin de détecter une activité humaine directe en amont. L’activité détectée rejoint le même journal de signaux et le même flux d’observation que les autres tours humains directs.

Si la source en amont d’une session adoptée est supprimée de manière externe, trois vérifications consécutives sans résultat (environ trois cycles de surveillance) produisent un signal `upstream_missing` unique pour ses observateurs et suppriment le lien en amont. La reprise de la session du catalogue crée à nouveau un lien.

## Notifications : une seule, pas plusieurs

Lorsqu’un événement pouvant déclencher une notification est enregistré et que le curseur d’un observateur est en retard, l’observateur reçoit une notification système lors de son prochain tour :

```
La session "agent:main:subagent:child" a changé (autre acteur). Effectuez la réconciliation avant d’agir : session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Les observateurs de la session principale sont également réveillés immédiatement par un réveil Heartbeat ; les observateurs de sous-agents imbriqués reçoivent la notification lors de leur prochain tour.

Le protocole est délibérément conçu pour éviter les notifications indésirables :

- **Une notification en attente par paire observateur/cible.** Le texte de la notification reste identique octet par octet tant qu’elle est en attente, et la file d’événements système le déduplique ; vingt changements rapides apportés à la même cible ne produisent donc qu’une seule ligne dans le prompt de l’observateur.
- **Point de référence figé.** Le curseur fige sa position notifiée lorsqu’une notification est mise en file d’attente. Les événements significatifs ultérieurs font uniquement progresser le point de référence des changements significatifs ; ils ne déclenchent pas de nouvelle notification.
- **Acquittement lors du retrait de la file, réouverture uniquement en cas de travail intercalé.** Lorsque le tour de l’observateur consomme la notification, le curseur avance. Si d’autres événements significatifs sont arrivés entre la mise en file et le retrait, une seule nouvelle notification est ouverte pour le reste.
- **Auto-suppression.** Un observateur n’est jamais informé des événements qu’il a lui-même provoqués.
- **Récupération après redémarrage.** Les notifications en attente résident dans une file en mémoire ; une analyse au démarrage les recrée à partir des curseurs durables après le redémarrage d’un Gateway.

## Réconciliation

La notification indique précisément à l’observateur ce qu’il doit faire. `session_status` avec `changesSince: <version>` renvoie les événements typés postérieurs à cette version (jusqu’à 200), sans faire avancer les curseurs :

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "message humaine via telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "objectif mis à jour" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` signifie que la version demandée est antérieure à l’historique conservé — actualisez l’intégralité de l’état de la session (`sessions_history`, `session_status`) au lieu de considérer la réponse comme un delta exact. Le signal d’interruption est exact : il provient d’un point de référence d’élagage propre à la session et n’est pas déduit par calcul sur les séquences.

## Stockage et limites

L’historique réside dans la base de données d’état partagée, avec des limites de 30 jours et 50 000 lignes ; les en-têtes propres aux sessions restent monotones après l’élagage. L’enregistrement s’effectue au mieux — l’échec d’un ajout est consigné et ne provoque jamais l’échec du tour d’origine — de sorte que `stateVersion` est un en-tête du journal de signaux, et non une version transactionnelle de capture des changements de données.

Limites actuelles :

- La remise des notifications suppose qu’un seul processus Gateway possède la base de données d’état partagée. Plusieurs Gateway partagent le journal durable et `changesSince`, mais la v1 ne transmet pas les notifications entre les processus.
- Les événements de Compaction couvrent les responsables de la Compaction du runtime intégré ; la Compaction effectuée uniquement par le harnais natif n’est pas entièrement journalisée.
- Les détails de la charge utile des résultats d’annulation sont actuellement produits par les exécutions enfants ACP ; les annulations de sous-agents natifs apparaissent comme des échecs génériques.
- La détection des auto-échos en amont compare le texte utilisateur normalisé. Un prompt externe correspondant à l’un des 10 messages utilisateur les plus récents du côté OpenClaw de la session est considéré comme un auto-écho.
- Une seule ligne JSONL locale de Claude dépassant la limite d’analyse de 1 MiB par intervalle bloque le curseur de cette session dans la v1 ; les octets non classés ne sont jamais ignorés.
- Les vérifications Claude sur un Node associé classent les 50 derniers éléments de transcription à chaque intervalle. Les rafales plus importantes peuvent sortir de la fenêtre d’analyse de la v1.
- Les lectures de l’historique Claude sur un Node associé ne fournissent aucun résultat définitif indiquant qu’un fil est introuvable ; les suppressions Claude distantes ne sont donc pas classées comme `upstream_missing` dans la v1.
- Les sessions du catalogue qui n’ont pas été adoptées restent en dehors de la couche de conscience dans la v1.
- Les sessions adoptées avant cette fonctionnalité ne comportent aucun lien en amont ; reprenez-les une fois depuis le catalogue pour démarrer la surveillance en amont.
- Les liens en amont supposent que chaque clé de session adoptée correspond à un seul agent propriétaire (l’adoption utilise l’agent par défaut du stockage). L’adoption par plusieurs agents du même fil externe n’est pas surveillée dans la v1.

## Voir aussi

- [Outils de session](/fr/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Sous-agents](/fr/tools/subagents) — liens de création et annonces de fin
- [Heartbeat](/fr/gateway/heartbeat) — fonctionnement du réveil des sessions principales par les notifications en file d’attente
- [Gestion des sessions](/fr/concepts/session) — clés de session, portées, cycle de vie
