---
read_when:
    - Vous souhaitez qu’OpenClaw se souvienne des suites naturelles
    - Vous souhaitez comprendre en quoi les prises de contact déduites diffèrent des rappels
    - Vous souhaitez examiner ou abandonner les engagements de suivi
sidebarTitle: Commitments
summary: Mémoire de suivi déduite pour les prises de contact qui ne sont pas des rappels précis
title: Engagements implicites
x-i18n:
    generated_at: "2026-07-16T13:14:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Les engagements sont des souvenirs de suivi à courte durée de vie. Lorsqu’ils sont activés, OpenClaw peut
détecter qu’une conversation a créé une occasion de reprendre contact ultérieurement et s’en souvenir
pour y revenir plus tard.

Exemples :

- Vous mentionnez un entretien demain. OpenClaw peut reprendre contact après celui-ci.
- Vous dites que vous êtes épuisé. OpenClaw peut vous demander plus tard si vous avez dormi.
- L’agent indique qu’il effectuera un suivi après un changement. OpenClaw peut suivre
  cette boucle ouverte.

Les engagements ne sont pas des faits durables comme `MEMORY.md`, ni des
rappels précis. Ils se situent entre la mémoire et l’automatisation : OpenClaw mémorise une
obligation liée à la conversation, puis Heartbeat la transmet lorsqu’elle arrive à échéance.

## Activer les engagements

Les engagements sont désactivés par défaut (`commitments.enabled: false`). Activez-les dans la configuration :

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

`commitments.maxPerDay` limite le nombre de suivis déduits pouvant être transmis
par session d’agent sur une journée glissante. La valeur par défaut est `3`.

## Fonctionnement

Après une réponse de l’agent, OpenClaw peut exécuter en arrière-plan une passe d’extraction masquée dans un
contexte distinct, avec les outils désactivés. Cette passe recherche uniquement les engagements de suivi déduits. Elle
n’écrit rien dans la conversation visible et ne demande pas à l’agent principal
de raisonner sur l’extraction.

Lorsqu’il trouve un candidat avec un niveau de confiance élevé, OpenClaw stocke un engagement contenant :

- l’identifiant de l’agent
- la clé de session
- le canal d’origine et la cible de transmission
- une fenêtre d’échéance
- une courte suggestion de reprise de contact
- des métadonnées non instructives permettant à Heartbeat de décider s’il doit l’envoyer

La transmission s’effectue via Heartbeat. Lorsqu’un engagement arrive à échéance, Heartbeat
l’ajoute au tour Heartbeat correspondant au même agent et au même périmètre de canal.
Le prompt avertit explicitement que les métadonnées de l’engagement ne sont pas fiables et demande
au modèle de ne pas suivre les instructions qu’elles contiennent ni d’utiliser des outils à cause d’elles. Le
modèle peut envoyer un message naturel de reprise de contact ou répondre `HEARTBEAT_OK` pour l’ignorer.
Si Heartbeat est configuré avec `target: "none"`, les engagements arrivés à échéance restent
internes et aucun message de reprise de contact externe n’est envoyé. Les prompts de transmission des engagements ne
rejouent pas le texte de la conversation d’origine, mais uniquement la suggestion de reprise de contact et les
métadonnées, et les tours Heartbeat consacrés aux engagements arrivés à échéance s’exécutent sans les outils OpenClaw.

OpenClaw ne transmet jamais un engagement déduit immédiatement après son enregistrement.
L’échéance est repoussée à au moins un intervalle Heartbeat après la création de l’engagement,
afin que le suivi ne puisse pas être renvoyé au moment même où il a été
déduit.

## Périmètre

Les engagements sont limités au contexte exact de l’agent et du canal dans lequel ils ont été
créés. Un suivi déduit lors d’une conversation avec un agent dans Discord n’est pas
transmis par un autre agent, un autre canal ou une session sans rapport.

Ce périmètre fait partie intégrante de la fonctionnalité. Les reprises de contact naturelles doivent donner l’impression que la même
conversation se poursuit, et non celle d’un système global de rappels.

## Engagements et rappels

| Besoin                                                      | Utiliser                                      |
| ----------------------------------------------------------- | --------------------------------------------- |
| « Rappelez-moi à 15 h »                                     | [Tâches planifiées](/fr/automation/cron-jobs)    |
| « Envoyez-moi un message dans 20 minutes »                  | [Tâches planifiées](/fr/automation/cron-jobs)    |
| « Exécutez ce rapport chaque jour ouvrable »                | [Tâches planifiées](/fr/automation/cron-jobs)    |
| « J’ai un entretien demain »                                | Engagements                                   |
| « Je n’ai pas dormi de la nuit »                            | Engagements                                   |
| « Effectuez un suivi si je ne réponds pas à ce fil ouvert » | Engagements                                   |

Les demandes explicites des utilisateurs relèvent déjà du planificateur. Les engagements sont uniquement
destinés aux suivis déduits : les situations où l’utilisateur n’a pas demandé de rappel,
mais où la conversation a clairement créé une occasion utile de reprendre contact ultérieurement.

## Gérer les engagements

Utilisez la CLI pour consulter et effacer les engagements stockés :

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consultez [`openclaw commitments`](/fr/cli/commitments) pour obtenir la référence complète des commandes.

## Confidentialité et coût

L’extraction des engagements utilise une passe de LLM ; son activation ajoute donc une utilisation du modèle
en arrière-plan après les tours admissibles. Cette passe est masquée dans la
conversation visible par l’utilisateur, mais elle peut lire les échanges récents nécessaires pour déterminer si
un suivi existe.

Les engagements stockés constituent une mémoire opérationnelle locale d’OpenClaw dans la base de données d’état SQLite
partagée, et non une mémoire à long terme. Désactivez la fonctionnalité avec :

```bash
openclaw config set commitments.enabled false
```

## Résolution des problèmes

Si les suivis attendus n’apparaissent pas :

- Vérifiez que `commitments.enabled` est défini sur `true`.
- Consultez `openclaw commitments --all` pour rechercher des enregistrements en attente, ignorés, reportés ou expirés.
- Assurez-vous que Heartbeat est en cours d’exécution pour l’agent.
- Vérifiez si `commitments.maxPerDay` a déjà été atteint pour cette
  session d’agent.
- N’oubliez pas que les rappels explicites sont ignorés par l’extraction des engagements et doivent
  plutôt apparaître dans les [tâches planifiées](/fr/automation/cron-jobs).

## Voir aussi

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Active Memory](/fr/concepts/active-memory)
- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [`openclaw commitments`](/fr/cli/commitments)
- [Référence de configuration](/fr/gateway/configuration-reference#commitments)
