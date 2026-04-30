---
read_when:
    - Choisir comment automatiser le travail avec OpenClaw
    - Choisir entre Heartbeat, Cron, engagements, points d’accroche et consignes permanentes
    - Trouver le bon point d’entrée d’automatisation
summary: 'Vue d’ensemble des mécanismes d’automatisation : tâches, Cron, hooks, consignes permanentes et Task Flow'
title: Automatisation et tâches
x-i18n:
    generated_at: "2026-04-30T07:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw exécute le travail en arrière-plan via des tâches, des travaux planifiés, des
engagements inférés, des hooks d'événement et des instructions permanentes. Cette page vous aide à choisir
le bon mécanisme et à comprendre comment ils s'articulent.

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

| Cas d'utilisation                                     | Recommandé                 | Pourquoi                                             |
| ----------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Envoyer un rapport quotidien à 9 h précises           | Tâches planifiées (Cron)   | Horaire exact, exécution isolée                      |
| Me le rappeler dans 20 minutes                        | Tâches planifiées (Cron)   | Exécution unique avec horaire précis (`--at`)        |
| Exécuter une analyse approfondie hebdomadaire         | Tâches planifiées (Cron)   | Tâche autonome, peut utiliser un modèle différent    |
| Vérifier la boîte de réception toutes les 30 min      | Heartbeat                  | Regroupé avec d'autres vérifications, conscient du contexte |
| Surveiller le calendrier pour les événements à venir  | Heartbeat                  | Adapté naturellement à la vigilance périodique       |
| Reprendre contact après un entretien mentionné        | Engagements inférés        | Suivi de type mémoire, sans demande de rappel exact  |
| Vérification bienveillante après le contexte utilisateur | Engagements inférés     | Limité au même agent et au même canal                |
| Inspecter l'état d'un sous-agent ou d'une exécution ACP | Tâches en arrière-plan   | Le registre des tâches suit tout le travail détaché  |
| Auditer ce qui s'est exécuté et quand                 | Tâches en arrière-plan     | `openclaw tasks list` et `openclaw tasks audit`      |
| Recherche en plusieurs étapes puis synthèse           | Task Flow                  | Orchestration durable avec suivi des révisions       |
| Exécuter un script à la réinitialisation de session   | Hooks                      | Piloté par les événements, déclenché sur les événements de cycle de vie |
| Exécuter du code à chaque appel d'outil               | Hooks de Plugin            | Les hooks en processus peuvent intercepter les appels d'outils |
| Toujours vérifier la conformité avant de répondre     | Ordres permanents          | Injecté automatiquement dans chaque session          |

### Tâches planifiées (Cron) ou Heartbeat

| Dimension          | Tâches planifiées (Cron)             | Heartbeat                             |
| ------------------ | ------------------------------------ | ------------------------------------- |
| Horaire            | Exact (expressions cron, unique)     | Approximatif (par défaut toutes les 30 min) |
| Contexte de session | Nouveau (isolé) ou partagé          | Contexte complet de la session principale |
| Enregistrements de tâche | Toujours créés                 | Jamais créés                          |
| Livraison          | Canal, webhook ou silencieuse        | Intégrée à la session principale      |
| Idéal pour         | Rapports, rappels, travaux en arrière-plan | Vérifications de boîte de réception, calendrier, notifications |

Utilisez les tâches planifiées (Cron) lorsque vous avez besoin d'un horaire précis ou d'une exécution isolée. Utilisez Heartbeat lorsque le travail bénéficie du contexte complet de la session et qu'un horaire approximatif convient.

## Concepts fondamentaux

### Tâches planifiées (cron)

Cron est le planificateur intégré du Gateway pour les horaires précis. Il persiste les travaux, réveille l'agent au bon moment et peut livrer la sortie à un canal de discussion ou à un endpoint webhook. Il prend en charge les rappels uniques, les expressions récurrentes et les déclencheurs webhook entrants.

Voir [Tâches planifiées](/fr/automation/cron-jobs).

### Tâches

Le registre des tâches en arrière-plan suit tout le travail détaché : exécutions ACP, lancements de sous-agents, exécutions cron isolées et opérations CLI. Les tâches sont des enregistrements, pas des planificateurs. Utilisez `openclaw tasks list` et `openclaw tasks audit` pour les inspecter.

Voir [Tâches en arrière-plan](/fr/automation/tasks).

### Engagements inférés

Les engagements sont des mémoires de suivi optionnelles et de courte durée. OpenClaw les infère
à partir des conversations normales, les limite au même agent et au même canal, et
livre les vérifications arrivées à échéance via Heartbeat. Les rappels exacts demandés par l'utilisateur relèvent toujours de cron.

Voir [Engagements inférés](/fr/concepts/commitments).

### Task Flow

Task Flow est le substrat d'orchestration des flux au-dessus des tâches en arrière-plan. Il gère des flux durables en plusieurs étapes avec des modes de synchronisation gérés et miroirs, le suivi des révisions et `openclaw tasks flow list|show|cancel` pour l'inspection.

Voir [Task Flow](/fr/automation/taskflow).

### Ordres permanents

Les ordres permanents accordent à l'agent une autorité opérationnelle permanente pour des programmes définis. Ils résident dans les fichiers de l'espace de travail (généralement `AGENTS.md`) et sont injectés dans chaque session. Combinez-les avec cron pour l'application basée sur le temps.

Voir [Ordres permanents](/fr/automation/standing-orders).

### Hooks

Les hooks internes sont des scripts pilotés par les événements, déclenchés par les événements de cycle de vie de l'agent
(`/new`, `/reset`, `/stop`), la Compaction de session, le démarrage du Gateway et le flux
des messages. Ils sont automatiquement découverts à partir de répertoires et peuvent être gérés
avec `openclaw hooks`. Pour l'interception des appels d'outils en processus, utilisez les
[hooks de Plugin](/fr/plugins/hooks).

Voir [Hooks](/fr/automation/hooks).

### Heartbeat

Heartbeat est un tour périodique de la session principale (par défaut toutes les 30 minutes). Il regroupe plusieurs vérifications (boîte de réception, calendrier, notifications) dans un seul tour d'agent avec le contexte complet de la session. Les tours Heartbeat ne créent pas d'enregistrements de tâche et ne prolongent pas la fraîcheur de la réinitialisation de session quotidienne/inactive. Utilisez `HEARTBEAT.md` pour une petite liste de vérification, ou un bloc `tasks:` lorsque vous voulez des vérifications périodiques uniquement à échéance dans Heartbeat lui-même. Les fichiers Heartbeat vides sont ignorés avec `empty-heartbeat-file` ; le mode de tâche uniquement à échéance est ignoré avec `no-tasks-due`. Les Heartbeats sont différés lorsqu'un travail cron est actif ou en file d'attente, et `heartbeat.skipWhenBusy` peut également les différer lorsque des voies de sous-agent ou imbriquées sont occupées.

Voir [Heartbeat](/fr/gateway/heartbeat).

## Comment ils fonctionnent ensemble

- **Cron** gère les calendriers précis (rapports quotidiens, revues hebdomadaires) et les rappels uniques. Toutes les exécutions cron créent des enregistrements de tâche.
- **Heartbeat** gère la surveillance régulière (boîte de réception, calendrier, notifications) dans un tour groupé toutes les 30 minutes.
- **Hooks** réagissent à des événements spécifiques (réinitialisations de session, Compaction, flux de messages) avec des scripts personnalisés. Les hooks de Plugin couvrent les appels d'outils.
- **Ordres permanents** donnent à l'agent un contexte persistant et des limites d'autorité.
- **Task Flow** coordonne les flux en plusieurs étapes au-dessus des tâches individuelles.
- **Tâches** suit automatiquement tout le travail détaché afin que vous puissiez l'inspecter et l'auditer.

## Associé

- [Tâches planifiées](/fr/automation/cron-jobs) — planification précise et rappels uniques
- [Engagements inférés](/fr/concepts/commitments) — vérifications de suivi de type mémoire
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour tout le travail détaché
- [Task Flow](/fr/automation/taskflow) — orchestration durable de flux en plusieurs étapes
- [Hooks](/fr/automation/hooks) — scripts de cycle de vie pilotés par les événements
- [Hooks de Plugin](/fr/plugins/hooks) — hooks en processus pour les outils, les prompts, les messages et le cycle de vie
- [Ordres permanents](/fr/automation/standing-orders) — instructions persistantes de l'agent
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les clés de configuration
