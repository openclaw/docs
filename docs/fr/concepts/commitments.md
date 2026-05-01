---
read_when:
    - Vous voulez qu’OpenClaw retienne les suivis naturels
    - Vous voulez comprendre en quoi les points de suivi déduits diffèrent des rappels
    - Vous souhaitez examiner ou écarter les engagements de suivi
sidebarTitle: Commitments
summary: Mémoire de suivi inférée pour les points de suivi qui ne sont pas des rappels exacts
title: Engagements déduits
x-i18n:
    generated_at: "2026-05-01T07:14:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Les engagements sont des souvenirs de suivi de courte durée. Lorsqu’ils sont activés, OpenClaw peut
remarquer qu’une conversation a créé une occasion de reprise de contact future et s’en souvenir
pour la faire remonter plus tard.

Exemples :

- Vous mentionnez un entretien demain. OpenClaw peut reprendre contact ensuite.
- Vous dites que vous êtes épuisé. OpenClaw peut demander plus tard si vous avez dormi.
- L’agent dit qu’il fera un suivi après un changement. OpenClaw peut suivre
  cette boucle ouverte.

Les engagements ne sont pas des faits durables comme `MEMORY.md`, et ce ne sont pas des
rappels exacts. Ils se situent entre la mémoire et l’automatisation : OpenClaw mémorise une
obligation liée à la conversation, puis Heartbeat la transmet quand elle arrive à échéance.

## Activer les engagements

Les engagements sont désactivés par défaut. Activez-les dans la configuration :

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Équivalent `openclaw.json` :

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limite le nombre de suivis déduits qui peuvent être transmis
par session d’agent sur une journée glissante. La valeur par défaut est `3`.

## Fonctionnement

Après une réponse d’agent, OpenClaw peut exécuter en arrière-plan une passe d’extraction masquée dans un
contexte séparé. Cette passe recherche uniquement les engagements de suivi déduits. Elle
n’écrit pas dans la conversation visible et ne demande pas à l’agent principal
de raisonner sur l’extraction.

Lorsqu’elle trouve un candidat avec un niveau de confiance élevé, OpenClaw stocke un engagement avec :

- l’identifiant de l’agent
- la clé de session
- le canal d’origine et la cible de livraison
- une fenêtre d’échéance
- une courte suggestion de reprise de contact
- des métadonnées non instructionnelles permettant à Heartbeat de décider s’il faut l’envoyer

La livraison se fait via Heartbeat. Lorsqu’un engagement arrive à échéance, Heartbeat
ajoute l’engagement au tour Heartbeat pour le même périmètre d’agent et de canal.
Le modèle peut envoyer une reprise de contact naturelle ou répondre `HEARTBEAT_OK` pour l’écarter.
Si Heartbeat est configuré avec `target: "none"`, les engagements échus restent
internes et n’envoient pas de reprises de contact externes. Les invites de livraison d’engagements ne
rejouent pas le texte de la conversation d’origine, et les tours Heartbeat d’engagements échus s’exécutent
sans outils OpenClaw.

OpenClaw ne livre jamais un engagement déduit immédiatement après l’avoir écrit.
L’échéance est bornée à au moins un intervalle Heartbeat après la création de l’engagement,
afin que le suivi ne puisse pas faire écho au même moment où il a été
déduit.

## Périmètre

Les engagements sont limités au contexte exact d’agent et de canal dans lequel ils ont été
créés. Un suivi déduit pendant une conversation avec un agent dans Discord n’est pas
livré par un autre agent, un autre canal ou une session sans rapport.

Ce périmètre fait partie de la fonctionnalité. Les reprises de contact naturelles doivent donner l’impression que la même
conversation se poursuit, et non celle d’un système de rappels global.

## Engagements et rappels

| Besoin                                          | Utiliser                                 |
| ----------------------------------------------- | ---------------------------------------- |
| « Rappelle-moi à 15 h »                         | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Préviens-moi dans 20 minutes »                | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Exécute ce rapport chaque jour de semaine »   | [Tâches planifiées](/fr/automation/cron-jobs) |
| « J’ai un entretien demain »                    | Engagements                              |
| « Je suis resté éveillé toute la nuit »         | Engagements                              |
| « Fais un suivi si je ne réponds pas à ce fil ouvert » | Engagements                              |

Les demandes utilisateur exactes relèvent déjà du chemin du planificateur. Les engagements servent uniquement
aux suivis déduits : les moments où l’utilisateur n’a pas demandé de rappel,
mais où la conversation a clairement créé une reprise de contact future utile.

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

L’extraction des engagements utilise une passe LLM ; son activation ajoute donc une utilisation du modèle en arrière-plan
après les tours éligibles. La passe est masquée de la conversation visible par l’utilisateur,
mais elle peut lire l’échange récent nécessaire pour décider si un
suivi existe.

Les engagements stockés sont un état local d’OpenClaw. Ils constituent une mémoire opérationnelle, pas
une mémoire à long terme. Désactivez la fonctionnalité avec :

```bash
openclaw config set commitments.enabled false
```

## Dépannage

Si les suivis attendus n’apparaissent pas :

- Confirmez que `commitments.enabled` vaut `true`.
- Vérifiez `openclaw commitments --all` pour les enregistrements en attente, écartés, mis en attente ou expirés.
- Assurez-vous que Heartbeat fonctionne pour l’agent.
- Vérifiez si `commitments.maxPerDay` a déjà été atteint pour cette
  session d’agent.
- Rappelez-vous que les rappels exacts sont ignorés par l’extraction des engagements et doivent
  apparaître sous [tâches planifiées](/fr/automation/cron-jobs) à la place.

## Connexe

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Active Memory](/fr/concepts/active-memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [`openclaw commitments`](/fr/cli/commitments)
- [Référence de configuration](/fr/gateway/configuration-reference#commitments)
