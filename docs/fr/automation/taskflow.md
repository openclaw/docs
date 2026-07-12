---
read_when:
    - Vous souhaitez comprendre le lien entre Task Flow et les tâches en arrière-plan
    - Vous rencontrez TaskFlow ou le flux de tâches OpenClaw dans les notes de version ou la documentation
    - Vous souhaitez inspecter ou gérer l’état persistant du flux
summary: Couche d’orchestration Task Flow au-dessus des tâches en arrière-plan
title: Flux de tâches
x-i18n:
    generated_at: "2026-07-12T15:01:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Le flux de tâches est la couche d’orchestration située au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Un flux est un enregistrement durable d’un travail en plusieurs étapes, avec son propre statut, son état JSON, son compteur de révision et ses enregistrements de tâches associés. Les flux survivent aux redémarrages du Gateway ; les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser un flux de tâches

| Scénario                                           | Utilisation                                               |
| -------------------------------------------------- | --------------------------------------------------------- |
| Tâche unique en arrière-plan                       | Tâche simple                                              |
| Pipeline en plusieurs étapes piloté par un plugin  | Flux de tâches (géré)                                     |
| Lancement détaché d’un ACP ou d’un sous-agent      | Flux de tâches (miroir, créé automatiquement)             |
| Rappel ponctuel                                    | Tâche Cron                                                |

## Modes de synchronisation

### Mode géré

Un flux géré possède un contrôleur : du code de plugin qui crée le flux au moyen de l’API Task Flow de l’environnement d’exécution du plugin, avec un objectif et un identifiant de contrôleur obligatoire, puis le pilote explicitement.

- Chaque étape s’exécute comme une tâche en arrière-plan créée sous le flux ; la clé de propriétaire et l’origine du demandeur du flux sont transmises aux tâches enfants.
- Le contrôleur fait progresser le flux entre les états `running`, `waiting` et terminaux, et stocke un état d’étape JSON arbitraire dans l’enregistrement du flux.
- Chaque mutation transmet la révision attendue du flux. Une écriture obsolète est rejetée comme conflit de révision au lieu d’écraser un état plus récent.
- Dès qu’une annulation est demandée, les nouvelles tâches enfants sont refusées et le flux se termine avec l’état `cancelled` lorsqu’aucune tâche enfant ne reste active.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le transmet, avec une tâche en arrière-plan par étape :

```
Flux : weekly-report
  Étape 1 : gather-data     → tâche créée → succeeded
  Étape 2 : generate-report → tâche créée → succeeded
  Étape 3 : deliver         → tâche créée → running
```

### Mode miroir

OpenClaw crée automatiquement un flux miroir à une seule tâche lorsqu’une exécution détachée d’un ACP ou d’un sous-agent démarre (tâches limitées à la session avec achèvement livrable). L’enregistrement du flux reflète son unique tâche sous-jacente — statut, objectif et chronologie — afin que les lancements détachés disposent d’un identifiant de flux stable pour les interfaces de statut et de nouvelle tentative, sans contrôleur. Les flux miroirs affichent le mode de synchronisation `task_mirrored` dans la CLI.

## Statuts des flux

| Statut      | Signification                                                                 |
| ----------- | ----------------------------------------------------------------------------- |
| `queued`    | Créé, sans progression pour le moment                                         |
| `running`   | Le flux progresse activement                                                   |
| `waiting`   | Le flux géré est suspendu selon des métadonnées d’attente (minuteur, événement externe) |
| `blocked`   | Une étape s’est terminée sans résultat exploitable ; `blockedTaskId`/le résumé indique laquelle |
| `succeeded` | Terminé avec succès                                                           |
| `failed`    | Terminé avec une erreur                                                       |
| `cancelled` | Annulation demandée et toutes les tâches enfants sont terminées               |
| `lost`      | Le flux a perdu son état sous-jacent faisant autorité                         |

## État durable et suivi des révisions

Les enregistrements de flux sont conservés dans la base de données d’état SQLite partagée (`~/.openclaw/state/openclaw.sqlite`, table `flow_runs`) avec les enregistrements de tâches, afin que la progression survive aux redémarrages du Gateway. Chaque écriture incrémente la `revision` du flux ; les auteurs concurrents qui transmettent une révision attendue obsolète reçoivent un conflit et doivent relire l’état. La croissance du WAL est limitée par les points de contrôle automatiques de SQLite, complétés par des points de contrôle passifs périodiques et des points de contrôle avec troncature lors de l’arrêt. L’ancien fichier annexe `flows/registry.sqlite` des installations antérieures est importé par `openclaw doctor`.

## Comportement de l’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux, annule ses tâches enfants actives et refuse les nouvelles tâches enfants gérées. Lorsqu’aucune tâche enfant ne reste active, le flux se termine avec l’état `cancelled` — immédiatement, ou lors du balayage de maintenance si les tâches enfants mettent plus de temps à se terminer. L’intention est persistée, de sorte qu’un flux annulé reste annulé même si le Gateway redémarre avant la fin de toutes les tâches enfants.

## Commandes CLI

```bash
# Répertorier les flux actifs et récents
openclaw tasks flow list [--status <status>] [--json]

# Afficher les détails d’un flux précis
openclaw tasks flow show <lookup> [--json]

# Annuler un flux en cours d’exécution et ses tâches actives
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Flux suivis avec mode de synchronisation, statut, révision, contrôleur et nombre de tâches |
| `openclaw tasks flow show <id>`   | Examiner un flux par identifiant de flux ou clé de propriétaire, y compris les tâches associées |
| `openclaw tasks flow cancel <id>` | Annuler un flux en cours d’exécution et ses tâches actives              |

Les flux sont également couverts par `openclaw tasks audit` (détections de flux obsolètes ou défectueux) et `openclaw tasks maintenance` (finalise les annulations bloquées et élague les flux terminaux après 7 jours).

## Modèle fiable de workflow planifié

Pour les workflows récurrents tels que les synthèses de veille concurrentielle, traitez la planification, l’orchestration et les vérifications de fiabilité comme des couches distinctes :

1. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour le déclenchement temporel.
2. Utilisez une session Cron persistante lorsque le workflow doit s’appuyer sur le contexte antérieur.
3. Utilisez [Lobster](/fr/tools/lobster) pour les étapes déterministes, les points de validation et les jetons de reprise.
4. Utilisez un flux de tâches pour suivre l’exécution en plusieurs étapes entre les tâches enfants, les attentes, les nouvelles tentatives et les redémarrages du Gateway.

Exemple de structure Cron :

```bash
openclaw cron add \
  --name "Synthèse de veille concurrentielle" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Exécutez le workflow Lobster market-intel. Vérifiez la fraîcheur des sources avant de produire la synthèse." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Utilisez `--session session:<id>` au lieu de `isolated` lorsque le workflow récurrent nécessite délibérément un historique, les synthèses des exécutions précédentes ou un contexte permanent. Utilisez `isolated` lorsque chaque exécution doit repartir de zéro et que tout l’état requis est explicite dans le workflow.

Dans le workflow, placez les vérifications de fiabilité avant l’étape de synthèse du LLM :

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Vérifications préalables recommandées :

- Disponibilité du navigateur et choix du profil, par exemple `openclaw` pour un état géré ou `user` lorsqu’une session Chrome authentifiée est requise. Consultez [Navigateur](/fr/tools/browser).
- Identifiants d’API et quota pour chaque source.
- Accessibilité réseau des points de terminaison requis.
- Outils requis activés pour l’agent, tels que `lobster`, `browser` et `llm-task`.
- Destination d’échec configurée pour Cron afin que les échecs des vérifications préalables soient visibles. Consultez les [tâches planifiées](/fr/automation/cron-jobs#delivery-and-output).

Champs de provenance des données recommandés pour chaque élément collecté :

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Exemple de rapport",
  "content": "..."
}
```

Faites en sorte que le workflow rejette ou marque comme obsolètes les éléments avant la synthèse. L’étape LLM ne doit recevoir que du JSON structuré et doit être invitée à conserver `sourceUrl`, `retrievedAt` et `asOf` dans sa sortie. Utilisez [Tâche LLM](/fr/tools/llm-task) lorsque vous avez besoin d’une étape de modèle validée par un schéma dans le workflow.

Pour les workflows d’équipe ou communautaires réutilisables, regroupez la CLI, les fichiers `.lobster` et les éventuelles notes de configuration dans une compétence ou un plugin, puis publiez cet ensemble par l’intermédiaire de [ClawHub](/clawhub). Conservez les garde-fous propres au workflow dans ce package, sauf si l’API du plugin ne fournit pas une fonctionnalité générique nécessaire.

## Relation entre les flux et les tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de son cycle de vie. Utilisez `openclaw tasks` pour examiner les enregistrements de tâches individuels et `openclaw tasks flow` pour examiner le flux d’orchestration.

## Voir aussi

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre des travaux détachés coordonnés par les flux
- [CLI : tâches](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées pouvant alimenter des flux
