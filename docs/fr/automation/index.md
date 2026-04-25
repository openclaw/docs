---
read_when:
    - Décider comment automatiser le travail avec OpenClaw
    - Choisir entre Heartbeat, Cron, les hooks et les ordres permanents
    - Trouver le bon point d’entrée d’automatisation
summary: 'Vue d’ensemble des mécanismes d’automatisation : tâches, Cron, hooks, ordres permanents et TaskFlow'
title: Automatisation et tâches
x-i18n:
    generated_at: "2026-04-25T13:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54524eb5d1fcb2b2e3e51117339be1949d980afaef1f6ae71fcfd764049f3f47
    source_path: automation/index.md
    workflow: 15
---

OpenClaw exécute du travail en arrière-plan via des tâches, des tâches planifiées, des hooks d’événement et des instructions permanentes. Cette page vous aide à choisir le bon mécanisme et à comprendre comment ils s’articulent.

## Guide de décision rapide

```mermaid
flowchart TD
    START([De quoi avez-vous besoin ?]) --> Q1{Planifier du travail ?}
    START --> Q2{Suivre du travail détaché ?}
    START --> Q3{Orchestrer des flux en plusieurs étapes ?}
    START --> Q4{Réagir à des événements du cycle de vie ?}
    START --> Q5{Donner des instructions persistantes à l’agent ?}

    Q1 -->|Oui| Q1a{Moment exact ou flexible ?}
    Q1a -->|Exact| CRON["Tâches planifiées (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Oui| TASKS[Tâches en arrière-plan]
    Q3 -->|Oui| FLOW[TaskFlow]
    Q4 -->|Oui| HOOKS[Hooks]
    Q5 -->|Oui| SO[Ordres permanents]
```

| Cas d’usage                            | Recommandation         | Pourquoi                                        |
| -------------------------------------- | ---------------------- | ------------------------------------------------ |
| Envoyer un rapport quotidien à 9 h précises | Tâches planifiées (Cron) | Moment exact, exécution isolée                  |
| Me rappeler dans 20 minutes            | Tâches planifiées (Cron) | Exécution unique avec un timing précis (`--at`) |
| Exécuter une analyse approfondie chaque semaine | Tâches planifiées (Cron) | Tâche autonome, peut utiliser un modèle différent |
| Vérifier la boîte de réception toutes les 30 min | Heartbeat              | Regroupe avec d’autres vérifications, sensible au contexte |
| Surveiller le calendrier pour les événements à venir | Heartbeat              | Adapté naturellement à une veille périodique    |
| Inspecter le statut d’un sous-agent ou d’une exécution ACP | Tâches en arrière-plan | Le registre des tâches suit tout le travail détaché |
| Auditer ce qui a été exécuté et quand  | Tâches en arrière-plan | `openclaw tasks list` et `openclaw tasks audit` |
| Recherche en plusieurs étapes puis résumé | TaskFlow              | Orchestration durable avec suivi des révisions  |
| Exécuter un script lors de la réinitialisation de la session | Hooks                  | Piloté par les événements, se déclenche sur les événements du cycle de vie |
| Exécuter du code à chaque appel d’outil | Hooks de Plugin        | Les hooks en processus peuvent intercepter les appels d’outil |
| Toujours vérifier la conformité avant de répondre | Ordres permanents      | Injectés automatiquement dans chaque session    |

### Tâches planifiées (Cron) vs Heartbeat

| Dimension       | Tâches planifiées (Cron)            | Heartbeat                            |
| --------------- | ----------------------------------- | ------------------------------------ |
| Timing          | Exact (expressions cron, exécution unique) | Approximatif (toutes les 30 min par défaut) |
| Contexte de session | Nouveau (isolé) ou partagé      | Contexte complet de la session principale |
| Enregistrements de tâche | Toujours créés            | Jamais créés                         |
| Livraison       | Canal, Webhook ou silencieuse       | Inline dans la session principale    |
| Idéal pour      | Rapports, rappels, tâches en arrière-plan | Vérifications de boîte de réception, calendrier, notifications |

Utilisez les tâches planifiées (Cron) lorsque vous avez besoin d’un timing précis ou d’une exécution isolée. Utilisez Heartbeat lorsque le travail bénéficie du contexte complet de la session et qu’un timing approximatif suffit.

## Concepts de base

### Tâches planifiées (cron)

Cron est le planificateur intégré du Gateway pour un timing précis. Il persiste les tâches, réveille l’agent au bon moment et peut transmettre le résultat à un canal de discussion ou à un endpoint Webhook. Il prend en charge les rappels à exécution unique, les expressions récurrentes et les déclencheurs Webhook entrants.

Voir [Tâches planifiées](/fr/automation/cron-jobs).

### Tâches

Le registre des tâches en arrière-plan suit tout le travail détaché : exécutions ACP, lancements de sous-agents, exécutions cron isolées et opérations CLI. Les tâches sont des enregistrements, pas des planificateurs. Utilisez `openclaw tasks list` et `openclaw tasks audit` pour les inspecter.

Voir [Tâches en arrière-plan](/fr/automation/tasks).

### Task Flow

TaskFlow est le substrat d’orchestration de flux au-dessus des tâches en arrière-plan. Il gère des flux durables en plusieurs étapes avec des modes de synchronisation gérés et mis en miroir, le suivi des révisions et `openclaw tasks flow list|show|cancel` pour l’inspection.

Voir [TaskFlow](/fr/automation/taskflow).

### Ordres permanents

Les ordres permanents accordent à l’agent une autorité opérationnelle permanente pour des programmes définis. Ils résident dans des fichiers d’espace de travail (généralement `AGENTS.md`) et sont injectés dans chaque session. Combinez-les avec cron pour une application basée sur le temps.

Voir [Ordres permanents](/fr/automation/standing-orders).

### Hooks

Les hooks internes sont des scripts pilotés par des événements, déclenchés par les événements du cycle de vie de l’agent
(`/new`, `/reset`, `/stop`), la Compaction de session, le démarrage du gateway et le flux
des messages. Ils sont découverts automatiquement à partir de répertoires et peuvent être gérés
avec `openclaw hooks`. Pour l’interception en processus des appels d’outil, utilisez
[les hooks de Plugin](/fr/plugins/hooks).

Voir [Hooks](/fr/automation/hooks).

### Heartbeat

Heartbeat est un tour périodique de la session principale (toutes les 30 minutes par défaut). Il regroupe plusieurs vérifications (boîte de réception, calendrier, notifications) en un seul tour de l’agent avec le contexte complet de la session. Les tours Heartbeat ne créent pas d’enregistrements de tâche. Utilisez `HEARTBEAT.md` pour une petite checklist, ou un bloc `tasks:` lorsque vous voulez des vérifications périodiques à échéance uniquement dans heartbeat lui-même. Les fichiers heartbeat vides sont ignorés avec `empty-heartbeat-file` ; le mode tâche à échéance uniquement est ignoré avec `no-tasks-due`.

Voir [Heartbeat](/fr/gateway/heartbeat).

## Comment ils fonctionnent ensemble

- **Cron** gère les planifications précises (rapports quotidiens, revues hebdomadaires) et les rappels à exécution unique. Toutes les exécutions cron créent des enregistrements de tâche.
- **Heartbeat** gère la surveillance de routine (boîte de réception, calendrier, notifications) dans un seul tour regroupé toutes les 30 minutes.
- **Hooks** réagissent à des événements spécifiques (réinitialisations de session, Compaction, flux de messages) avec des scripts personnalisés. Les hooks de Plugin couvrent les appels d’outil.
- **Ordres permanents** donnent à l’agent un contexte persistant et des limites d’autorité.
- **TaskFlow** coordonne les flux en plusieurs étapes au-dessus des tâches individuelles.
- **Tâches** suivent automatiquement tout le travail détaché afin que vous puissiez l’inspecter et l’auditer.

## Connexes

- [Tâches planifiées](/fr/automation/cron-jobs) — planification précise et rappels à exécution unique
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour tout le travail détaché
- [TaskFlow](/fr/automation/taskflow) — orchestration durable de flux en plusieurs étapes
- [Hooks](/fr/automation/hooks) — scripts de cycle de vie pilotés par des événements
- [Hooks de Plugin](/fr/plugins/hooks) — hooks en processus pour les outils, prompts, messages et le cycle de vie
- [Ordres permanents](/fr/automation/standing-orders) — instructions persistantes pour l’agent
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les clés de configuration
