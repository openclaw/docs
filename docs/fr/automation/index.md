---
doc-schema-version: 1
read_when:
    - Choisir comment automatiser le travail avec OpenClaw
    - Choisir entre Heartbeat, Cron, engagements, hooks et ordres permanents
    - Trouver le bon point d’entrée d’automatisation
summary: 'Présentation des mécanismes d’automatisation : tâches, Cron, hooks, ordres permanents et TaskFlow'
title: Automatisation
x-i18n:
    generated_at: "2026-05-13T02:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw exécute le travail en arrière-plan via des tâches, des tâches planifiées, des
engagements inférés, des hooks d’événement et des consignes permanentes. Cette page vous aide à choisir
le bon mécanisme et à comprendre comment ils s’articulent.

## Guide de décision rapide

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Cas d’utilisation                         | Recommandé              | Pourquoi                                          |
| ----------------------------------------- | ----------------------- | ------------------------------------------------- |
| Envoyer un rapport quotidien à 9 h précises | Tâches planifiées (Cron) | Horaire exact, exécution isolée                   |
| Me rappeler quelque chose dans 20 minutes | Tâches planifiées (Cron) | Exécution unique avec horaire précis (`--at`)     |
| Exécuter une analyse approfondie hebdomadaire | Tâches planifiées (Cron) | Tâche autonome, peut utiliser un modèle différent |
| Vérifier la boîte de réception toutes les 30 min | Heartbeat               | Regroupe avec d’autres vérifications, tient compte du contexte |
| Surveiller le calendrier pour les événements à venir | Heartbeat               | Adapté naturellement à la conscience périodique   |
| Faire un suivi après un entretien mentionné | Engagements inférés     | Suivi de type mémoire, sans demande de rappel exact |
| Vérification bienveillante après un contexte utilisateur | Engagements inférés     | Limité au même agent et au même canal             |
| Inspecter l’état d’un subagent ou d’une exécution ACP | Tâches en arrière-plan  | Le registre des tâches suit tout le travail détaché |
| Auditer ce qui s’est exécuté et quand     | Tâches en arrière-plan   | `openclaw tasks list` et `openclaw tasks audit`   |
| Recherche en plusieurs étapes puis résumé | Task Flow               | Orchestration durable avec suivi des révisions    |
| Exécuter un script lors de la réinitialisation de session | Hooks                   | Piloté par les événements, déclenché par les événements de cycle de vie |
| Exécuter du code à chaque appel d’outil   | Hooks de Plugin         | Les hooks en processus peuvent intercepter les appels d’outils |
| Toujours vérifier la conformité avant de répondre | Consignes permanentes   | Injectées automatiquement dans chaque session     |

### Tâches planifiées (Cron) ou Heartbeat

| Dimension        | Tâches planifiées (Cron)             | Heartbeat                              |
| ---------------- | ------------------------------------ | -------------------------------------- |
| Horaire          | Exact (expressions cron, exécution unique) | Approximatif (par défaut toutes les 30 min) |
| Contexte de session | Frais (isolé) ou partagé          | Contexte complet de la session principale |
| Enregistrements de tâche | Toujours créés              | Jamais créés                           |
| Livraison        | Canal, Webhook ou silencieuse        | Inline dans la session principale      |
| Idéal pour       | Rapports, rappels, tâches en arrière-plan | Vérifications de boîte de réception, calendrier, notifications |

Utilisez les tâches planifiées (Cron) lorsque vous avez besoin d’un horaire précis ou d’une exécution isolée. Utilisez Heartbeat lorsque le travail bénéficie du contexte complet de la session et qu’un horaire approximatif convient.

## Concepts fondamentaux

### Tâches planifiées (cron)

Cron est le planificateur intégré au Gateway pour les horaires précis. Il conserve les tâches, réveille l’agent au bon moment et peut livrer la sortie à un canal de discussion ou à un point de terminaison Webhook. Il prend en charge les rappels ponctuels, les expressions récurrentes et les déclencheurs Webhook entrants.

Voir [Tâches planifiées](/fr/automation/cron-jobs).

### Tâches

Le registre des tâches en arrière-plan suit tout le travail détaché : exécutions ACP, lancements de subagents, exécutions cron isolées et opérations CLI. Les tâches sont des enregistrements, pas des planificateurs. Utilisez `openclaw tasks list` et `openclaw tasks audit` pour les inspecter.

Voir [Tâches en arrière-plan](/fr/automation/tasks).

### Engagements inférés

Les engagements sont des mémoires de suivi optionnelles et de courte durée. OpenClaw les infère
à partir de conversations normales, les limite au même agent et au même canal, et
livre les vérifications dues via Heartbeat. Les rappels exacts demandés par l’utilisateur
relèvent toujours de cron.

Voir [Engagements inférés](/fr/concepts/commitments).

### Task Flow

Task Flow est la couche d’orchestration de flux au-dessus des tâches en arrière-plan. Il gère des flux durables en plusieurs étapes avec des modes de synchronisation gérés et miroirs, le suivi des révisions et `openclaw tasks flow list|show|cancel` pour l’inspection.

Voir [Task Flow](/fr/automation/taskflow).

### Consignes permanentes

Les consignes permanentes accordent à l’agent une autorité opérationnelle permanente pour des programmes définis. Elles résident dans les fichiers de l’espace de travail (généralement `AGENTS.md`) et sont injectées dans chaque session. Combinez-les avec cron pour une application basée sur le temps.

Voir [Consignes permanentes](/fr/automation/standing-orders).

### Hooks

Les hooks internes sont des scripts pilotés par les événements, déclenchés par les événements de cycle de vie de l’agent
(`/new`, `/reset`, `/stop`), la compaction de session, le démarrage du Gateway et le flux de
messages. Ils sont automatiquement découverts depuis des répertoires et peuvent être gérés
avec `openclaw hooks`. Pour l’interception en processus des appels d’outils, utilisez
les [hooks de Plugin](/fr/plugins/hooks).

Voir [Hooks](/fr/automation/hooks).

### Heartbeat

Heartbeat est un tour périodique de la session principale (par défaut toutes les 30 minutes). Il regroupe plusieurs vérifications (boîte de réception, calendrier, notifications) dans un seul tour d’agent avec le contexte complet de la session. Les tours Heartbeat ne créent pas d’enregistrements de tâche et ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactive de la session. Utilisez `HEARTBEAT.md` pour une petite liste de contrôle, ou un bloc `tasks:` lorsque vous voulez des vérifications périodiques dues uniquement dans Heartbeat lui-même. Les fichiers Heartbeat vides sont ignorés avec `empty-heartbeat-file` ; le mode de tâche due uniquement est ignoré avec `no-tasks-due`. Les Heartbeats sont différés lorsqu’un travail cron est actif ou en file d’attente, et `heartbeat.skipWhenBusy` peut également différer un agent lorsque le subagent ou les voies imbriquées à clé de session de ce même agent sont occupés.

Voir [Heartbeat](/fr/gateway/heartbeat).

## Comment ils fonctionnent ensemble

- **Cron** gère les planifications précises (rapports quotidiens, revues hebdomadaires) et les rappels ponctuels. Toutes les exécutions cron créent des enregistrements de tâche.
- **Heartbeat** gère la surveillance de routine (boîte de réception, calendrier, notifications) dans un seul tour groupé toutes les 30 minutes.
- **Hooks** réagissent à des événements précis (réinitialisations de session, Compaction, flux de messages) avec des scripts personnalisés. Les hooks de Plugin couvrent les appels d’outils.
- **Consignes permanentes** donnent à l’agent un contexte persistant et des limites d’autorité.
- **Task Flow** coordonne les flux en plusieurs étapes au-dessus des tâches individuelles.
- **Tâches** suit automatiquement tout le travail détaché afin que vous puissiez l’inspecter et l’auditer.

## Associés

- [Tâches planifiées](/fr/automation/cron-jobs) — planification précise et rappels ponctuels
- [Engagements inférés](/fr/concepts/commitments) — vérifications de suivi de type mémoire
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour tout le travail détaché
- [Task Flow](/fr/automation/taskflow) — orchestration durable de flux en plusieurs étapes
- [Hooks](/fr/automation/hooks) — scripts de cycle de vie pilotés par les événements
- [hooks de Plugin](/fr/plugins/hooks) — hooks en processus pour outils, prompts, messages et cycle de vie
- [Consignes permanentes](/fr/automation/standing-orders) — instructions persistantes de l’agent
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les clés de configuration
