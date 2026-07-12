---
read_when:
    - Vous souhaitez comprendre le lien entre Task Flow et les tâches en arrière-plan.
    - Vous rencontrez TaskFlow ou le flux de tâches OpenClaw dans les notes de version ou la documentation
    - Vous souhaitez inspecter ou gérer l’état persistant du flux
summary: Couche d’orchestration TaskFlow au-dessus des tâches en arrière-plan
title: Flux de tâches
x-i18n:
    generated_at: "2026-07-12T02:35:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Le flux de tâches constitue la couche d’orchestration située au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Un flux est un enregistrement durable d’un travail en plusieurs étapes, avec son propre état, son état JSON, son compteur de révisions et ses enregistrements de tâches associés. Les flux survivent aux redémarrages du Gateway ; les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser un flux de tâches

| Scénario                                      | Utilisation                                           |
| --------------------------------------------- | ----------------------------------------------------- |
| Tâche unique en arrière-plan                  | Tâche simple                                          |
| Pipeline en plusieurs étapes piloté par du code de plugin | Flux de tâches (géré)                       |
| Lancement détaché d’ACP ou de sous-agent      | Flux de tâches (répliqué, créé automatiquement)       |
| Rappel ponctuel                               | Tâche Cron                                            |

## Modes de synchronisation

### Mode géré

Un flux géré dispose d’un contrôleur : du code de plugin qui crée le flux par l’intermédiaire de l’API d’exécution de flux de tâches du plugin, avec un objectif et un identifiant de contrôleur obligatoire, puis le pilote explicitement.

- Chaque étape s’exécute comme une tâche en arrière-plan créée sous le flux ; la clé de propriétaire et l’origine du demandeur du flux sont transmises aux tâches enfants.
- Le contrôleur fait progresser le flux entre les états `running`, `waiting` et les états terminaux, et stocke un état d’étape JSON arbitraire dans l’enregistrement du flux.
- Chaque modification transmet la révision attendue du flux. Une écriture obsolète est rejetée comme conflit de révision au lieu d’écraser un état plus récent.
- Dès qu’une annulation est demandée, les nouvelles tâches enfants sont refusées et le flux se termine avec l’état `cancelled` lorsqu’aucune tâche enfant ne reste active.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le transmet, avec une tâche en arrière-plan par étape :

```
Flux : weekly-report
  Étape 1 : gather-data     → tâche créée → réussie
  Étape 2 : generate-report → tâche créée → réussie
  Étape 3 : deliver         → tâche créée → en cours
```

### Mode répliqué

OpenClaw crée automatiquement un flux répliqué à une seule tâche lorsqu’une exécution détachée d’ACP ou de sous-agent démarre (tâches limitées à la session avec achèvement livrable). L’enregistrement du flux réplique son unique tâche sous-jacente — état, objectif et chronologie — afin que les lancements détachés disposent d’un identifiant de flux stable pour les interfaces d’état et de nouvelle tentative, sans contrôleur. Les flux répliqués affichent le mode de synchronisation `task_mirrored` dans la CLI.

## États des flux

| État        | Signification                                                                      |
| ----------- | ---------------------------------------------------------------------------------- |
| `queued`    | Créé, mais pas encore en cours de progression                                      |
| `running`   | Le flux progresse activement                                                       |
| `waiting`   | Le flux géré est suspendu selon des métadonnées d’attente (minuteur, événement externe) |
| `blocked`   | Une étape s’est terminée sans résultat exploitable ; `blockedTaskId`/le résumé indique laquelle |
| `succeeded` | Terminé avec succès                                                                |
| `failed`    | Terminé avec une erreur                                                            |
| `cancelled` | Annulation demandée et toutes les tâches enfants sont terminées                    |
| `lost`      | Le flux a perdu son état sous-jacent faisant autorité                              |

## État durable et suivi des révisions

Les enregistrements de flux sont conservés dans la base de données d’état SQLite partagée (`~/.openclaw/state/openclaw.sqlite`, table `flow_runs`) avec les enregistrements de tâches, afin que la progression survive aux redémarrages du Gateway. Chaque écriture incrémente la `revision` du flux ; les auteurs concurrents qui transmettent une révision attendue obsolète rencontrent un conflit et doivent relire l’enregistrement. La croissance du WAL est limitée par les points de contrôle automatiques de SQLite, auxquels s’ajoutent des points de contrôle passifs périodiques et des points de contrôle avec troncation lors de l’arrêt. L’ancien fichier annexe `flows/registry.sqlite` des installations antérieures est importé par `openclaw doctor`.

## Comportement d’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux, annule ses tâches enfants actives et refuse les nouvelles tâches enfants gérées. Lorsqu’aucune tâche enfant ne reste active, le flux se termine avec l’état `cancelled` — immédiatement, ou par l’intermédiaire du balayage de maintenance si les tâches enfants mettent plus de temps à se terminer. L’intention est conservée, de sorte qu’un flux annulé reste annulé même si le Gateway redémarre avant la fin de toutes les tâches enfants.

## Commandes CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Flux suivis avec mode de synchronisation, état, révision, contrôleur et nombres de tâches |
| `openclaw tasks flow show <id>`   | Examiner un flux par identifiant de flux ou clé de propriétaire, y compris ses tâches associées |
| `openclaw tasks flow cancel <id>` | Annuler un flux en cours et ses tâches actives                                  |

Les flux sont également couverts par `openclaw tasks audit` (détection des flux obsolètes ou défectueux) et `openclaw tasks maintenance` (finalise les annulations bloquées et supprime les flux terminaux après 7 jours).

## Modèle fiable de workflow planifié

Pour les workflows récurrents tels que les synthèses de veille commerciale, traitez la planification, l’orchestration et les contrôles de fiabilité comme des couches distinctes :

1. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour la planification temporelle.
2. Utilisez une session Cron persistante lorsque le workflow doit s’appuyer sur le contexte antérieur.
3. Utilisez [Lobster](/fr/tools/lobster) pour les étapes déterministes, les points de validation et les jetons de reprise.
4. Utilisez un flux de tâches pour suivre l’exécution en plusieurs étapes à travers les tâches enfants, les attentes, les nouvelles tentatives et les redémarrages du Gateway.

Exemple de configuration Cron :

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Utilisez `--session session:<id>` plutôt que `isolated` lorsque le workflow récurrent nécessite délibérément un historique, les résumés des exécutions précédentes ou un contexte permanent. Utilisez `isolated` lorsque chaque exécution doit repartir de zéro et que tout l’état requis est explicitement défini dans le workflow.

Dans le workflow, placez les contrôles de fiabilité avant l’étape de synthèse par le LLM :

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

Contrôles préalables recommandés :

- Disponibilité du navigateur et choix du profil, par exemple `openclaw` pour un état géré ou `user` lorsqu’une session Chrome authentifiée est requise. Consultez [Navigateur](/fr/tools/browser).
- Identifiants d’API et quota pour chaque source.
- Accessibilité réseau des points de terminaison requis.
- Outils requis activés pour l’agent, tels que `lobster`, `browser` et `llm-task`.
- Destination d’échec configurée pour Cron afin que les échecs des contrôles préalables soient visibles. Consultez les [tâches planifiées](/fr/automation/cron-jobs#delivery-and-output).

Champs de provenance des données recommandés pour chaque élément collecté :

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faites en sorte que le workflow rejette ou marque comme obsolètes les éléments concernés avant la synthèse. L’étape du LLM doit recevoir uniquement du JSON structuré et doit être invitée à conserver `sourceUrl`, `retrievedAt` et `asOf` dans sa sortie. Utilisez [Tâche LLM](/fr/tools/llm-task) lorsqu’une étape de modèle validée par un schéma est nécessaire dans le workflow.

Pour les workflows réutilisables par une équipe ou une communauté, regroupez la CLI, les fichiers `.lobster` et les éventuelles notes de configuration sous forme de skill ou de plugin, puis publiez l’ensemble par l’intermédiaire de [ClawHub](/clawhub). Conservez les garde-fous propres au workflow dans ce paquet, sauf si l’API du plugin ne fournit pas une fonctionnalité générique nécessaire.

## Relation entre les flux et les tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de son cycle de vie. Utilisez `openclaw tasks` pour examiner les enregistrements de tâches individuels et `openclaw tasks flow` pour examiner le flux qui les orchestre.

## Ressources associées

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre du travail détaché coordonné par les flux
- [CLI : tâches](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées pouvant alimenter les flux
