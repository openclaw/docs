---
read_when:
    - Vous voulez qu’OpenClaw mémorise les relances naturelles
    - Vous souhaitez comprendre en quoi les prises de contact déduites diffèrent des rappels
    - Vous souhaitez examiner ou écarter les engagements de suivi
sidebarTitle: Commitments
summary: Mémoire de suivi déduite pour les prises de contact qui ne sont pas des rappels exacts
title: Engagements déduits
x-i18n:
    generated_at: "2026-07-12T15:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Les engagements sont des mémoires de suivi à court terme. Lorsqu’ils sont activés, OpenClaw peut
détecter qu’une conversation a créé une occasion de reprendre contact ultérieurement et s’en souvenir
pour y revenir plus tard.

Exemples :

- Vous mentionnez un entretien demain. OpenClaw peut prendre de vos nouvelles après celui-ci.
- Vous dites être épuisé. OpenClaw peut vous demander plus tard si vous avez dormi.
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

Équivalent dans `openclaw.json` :

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` limite le nombre de suivis déduits pouvant être transmis
par session d’agent sur une période glissante d’un jour. La valeur par défaut est `3`.

## Fonctionnement

Après une réponse de l’agent, OpenClaw peut exécuter en arrière-plan une passe d’extraction masquée dans un
contexte distinct, avec les outils désactivés. Cette passe recherche uniquement les engagements de suivi déduits. Elle
n’écrit rien dans la conversation visible et ne demande pas à l’agent principal
de raisonner sur l’extraction.

Lorsqu’il trouve un candidat avec un niveau de confiance élevé, OpenClaw stocke un engagement comprenant :

- l’identifiant de l’agent
- la clé de session
- le canal d’origine et la cible de transmission
- une fenêtre d’échéance
- une brève suggestion de reprise de contact
- des métadonnées non impératives permettant à Heartbeat de décider s’il doit l’envoyer

La transmission s’effectue par l’intermédiaire de Heartbeat. Lorsqu’un engagement arrive à échéance, Heartbeat
l’ajoute au tour Heartbeat correspondant au même périmètre d’agent et de canal.
Le prompt avertit explicitement que les métadonnées de l’engagement ne sont pas fiables et demande
au modèle de ne pas suivre les instructions qu’elles contiennent ni d’utiliser des outils à cause d’elles. Le
modèle peut envoyer un message naturel de reprise de contact ou répondre `HEARTBEAT_OK` pour l’ignorer.
Si Heartbeat est configuré avec `target: "none"`, les engagements arrivés à échéance restent
internes et n’entraînent aucun message externe. Les prompts de transmission des engagements ne
reproduisent pas le texte de la conversation d’origine, mais uniquement la suggestion de reprise de contact et les
métadonnées, et les tours Heartbeat consacrés aux engagements arrivés à échéance s’exécutent sans les outils OpenClaw.

OpenClaw ne transmet jamais un engagement déduit immédiatement après l’avoir enregistré.
L’échéance est repoussée à au moins un intervalle Heartbeat après la création de l’engagement,
afin que le suivi ne puisse pas faire écho au même instant où il a été
déduit.

## Périmètre

Les engagements sont limités au contexte exact de l’agent et du canal dans lequel ils ont été
créés. Un suivi déduit lors d’une conversation avec un agent dans Discord n’est pas
transmis par un autre agent, un autre canal ou une session sans rapport.

Ce périmètre fait partie intégrante de la fonctionnalité. Les reprises de contact naturelles doivent donner l’impression que la même
conversation se poursuit, et non qu’il s’agit d’un système global de rappels.

## Engagements et rappels

| Besoin                                          | Utiliser                                 |
| ----------------------------------------------- | ---------------------------------------- |
| « Rappelez-moi à 15 h »                         | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Envoyez-moi un message dans 20 minutes »      | [Tâches planifiées](/fr/automation/cron-jobs) |
| « Exécutez ce rapport chaque jour ouvré »       | [Tâches planifiées](/fr/automation/cron-jobs) |
| « J’ai un entretien demain »                    | Engagements                              |
| « Je n’ai pas dormi de la nuit »                | Engagements                              |
| « Relancez-moi si je ne réponds pas à cette discussion ouverte » | Engagements                 |

Les demandes explicites de l’utilisateur relèvent déjà du planificateur. Les engagements concernent uniquement
les suivis déduits : les situations où l’utilisateur n’a pas demandé de rappel,
mais où la conversation a clairement créé une occasion utile de reprendre contact ultérieurement.

## Gérer les engagements

Utilisez la CLI pour consulter et supprimer les engagements stockés :

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Consultez [`openclaw commitments`](/fr/cli/commitments) pour la référence complète de la commande.

## Confidentialité et coût

L’extraction des engagements utilise une passe de LLM ; son activation ajoute donc une utilisation du modèle
en arrière-plan après les tours admissibles. Cette passe est masquée dans la
conversation visible par l’utilisateur, mais elle peut lire l’échange récent nécessaire pour déterminer si un
suivi existe.

Les engagements stockés constituent un état local d’OpenClaw. Il s’agit d’une mémoire opérationnelle, et non
d’une mémoire à long terme. Désactivez la fonctionnalité avec :

```bash
openclaw config set commitments.enabled false
```

## Dépannage

Si les suivis attendus n’apparaissent pas :

- Vérifiez que `commitments.enabled` vaut `true`.
- Consultez `openclaw commitments --all` pour rechercher des enregistrements en attente, ignorés, reportés ou expirés.
- Assurez-vous que Heartbeat est actif pour l’agent.
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
