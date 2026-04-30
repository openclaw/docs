---
read_when:
    - Vous voulez qu’OpenClaw mémorise les suivis naturels
    - Vous voulez comprendre en quoi les suivis inférés diffèrent des rappels
    - Vous souhaitez examiner ou écarter les engagements de suivi
sidebarTitle: Commitments
summary: Mémoire de suivi déduite pour les check-ins qui ne sont pas des rappels exacts
title: Engagements déduits
x-i18n:
    generated_at: "2026-04-30T07:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Les engagements sont des mémoires de suivi à courte durée de vie. Lorsqu’ils sont activés, OpenClaw peut
remarquer qu’une conversation a créé une occasion de prise de nouvelles future et se souvenir
de la ramener plus tard.

Exemples :

- Vous mentionnez un entretien demain. OpenClaw peut prendre de vos nouvelles ensuite.
- Vous dites que vous êtes épuisé. OpenClaw peut demander plus tard si vous avez dormi.
- L’agent dit qu’il fera un suivi après un changement. OpenClaw peut suivre
  cette boucle ouverte.

Les engagements ne sont pas des faits durables comme `MEMORY.md`, et ce ne sont pas des
rappels exacts. Ils se situent entre mémoire et automatisation : OpenClaw se souvient d’une
obligation liée à la conversation, puis Heartbeat la livre lorsqu’elle arrive à échéance.

## Activer les engagements

Les engagements sont désactivés par défaut. Activez-les dans la configuration :

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` équivalent :

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limite le nombre de suivis inférés pouvant être livrés
par session d’agent sur une journée glissante. La valeur par défaut est `3`.

## Fonctionnement

Après une réponse d’agent, OpenClaw peut exécuter en arrière-plan une passe d’extraction masquée dans un
contexte séparé. Cette passe recherche uniquement les engagements de suivi inférés. Elle
n’écrit pas dans la conversation visible et ne demande pas à l’agent principal
de raisonner sur l’extraction.

Lorsqu’il trouve un candidat avec une confiance élevée, OpenClaw stocke un engagement avec :

- l’id de l’agent
- la clé de session
- le canal d’origine et la cible de livraison
- une fenêtre d’échéance
- une courte suggestion de prise de nouvelles
- assez de contexte source pour que Heartbeat décide s’il faut l’envoyer

La livraison se fait via Heartbeat. Lorsqu’un engagement arrive à échéance, Heartbeat
ajoute l’engagement au tour Heartbeat pour le même agent et la même portée de canal.
Le modèle peut envoyer une prise de nouvelles naturelle ou répondre `HEARTBEAT_OK` pour l’ignorer.

OpenClaw ne livre jamais un engagement inféré immédiatement après l’avoir écrit.
L’heure d’échéance est bornée à au moins un intervalle Heartbeat après la création de l’engagement,
afin que le suivi ne puisse pas être renvoyé au même moment où il a été
inféré.

## Portée

Les engagements sont limités au contexte exact d’agent et de canal dans lequel ils ont été
créés. Un suivi inféré lors d’une conversation avec un agent dans Discord n’est pas
livré par un autre agent, un autre canal ou une session sans rapport.

Cette portée fait partie de la fonctionnalité. Les prises de nouvelles naturelles doivent donner l’impression que la même
conversation continue, et non celle d’un système de rappels global.

## Engagements et rappels

| Besoin                                            | Utiliser                                      |
| ----------------------------------------------- | ---------------------------------------- |
| « Rappelle-moi à 15 h »                             | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Envoie-moi un ping dans 20 minutes »                         | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Exécute ce rapport chaque jour ouvré »                 | [Tâches planifiées](/fr/automation/cron-jobs) |
| « J’ai un entretien demain »                  | Engagements                              |
| « Je suis resté éveillé toute la nuit »                            | Engagements                              |
| « Relance si je ne réponds pas à ce fil ouvert » | Engagements                              |

Les demandes utilisateur exactes relèvent déjà du chemin du planificateur. Les engagements servent uniquement
aux suivis inférés : les moments où l’utilisateur n’a pas demandé de rappel,
mais où la conversation a clairement créé une future prise de nouvelles utile.

## Gérer les engagements

Utilisez la CLI pour inspecter et effacer les engagements stockés :

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consultez [`openclaw commitments`](/fr/cli/commitments) pour la référence de la commande.

## Confidentialité et coût

L’extraction des engagements utilise une passe LLM ; son activation ajoute donc une utilisation de modèle en arrière-plan
après les tours éligibles. La passe est masquée dans la conversation visible
par l’utilisateur, mais elle peut lire l’échange récent nécessaire pour décider si un
suivi existe.

Les engagements stockés sont un état local d’OpenClaw. Ils constituent une mémoire opérationnelle, pas
une mémoire à long terme. Désactivez la fonctionnalité avec :

```bash
openclaw config set commitments.enabled false
```

## Dépannage

Si les suivis attendus n’apparaissent pas :

- Confirmez que `commitments.enabled` vaut `true`.
- Vérifiez `openclaw commitments --all` pour les enregistrements en attente, ignorés, reportés ou expirés.
- Assurez-vous que Heartbeat est en cours d’exécution pour l’agent.
- Vérifiez si `commitments.maxPerDay` a déjà été atteint pour cette
  session d’agent.
- N’oubliez pas que les rappels exacts sont ignorés par l’extraction des engagements et doivent
  apparaître sous [tâches planifiées](/fr/automation/cron-jobs) à la place.

## Associé

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Active Memory](/fr/concepts/active-memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [`openclaw commitments`](/fr/cli/commitments)
- [Référence de configuration](/fr/gateway/configuration-reference#commitments)
