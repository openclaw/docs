---
doc-schema-version: 1
read_when:
    - Choisir comment automatiser le travail avec OpenClaw
    - Choisir entre Heartbeat, Cron, les engagements, les hooks et les ordres permanents
    - Recherche du point d’entrée d’automatisation approprié
summary: 'Présentation des mécanismes d’automatisation : tâches, Cron, hooks, ordres permanents et TaskFlow'
title: Automatisation
x-i18n:
    generated_at: "2026-07-12T02:35:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw exécute des travaux en arrière-plan au moyen de tâches, de travaux planifiés, d’engagements déduits,
de hooks d’événements et d’instructions permanentes. Utilisez cette page pour choisir le
mécanisme approprié.

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

| Cas d’utilisation                                      | Recommandation             | Pourquoi                                                     |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------ |
| Envoyer un rapport quotidien à 9 h précises            | Tâches planifiées (Cron)   | Horaire exact, exécution isolée                              |
| Me le rappeler dans 20 minutes                         | Tâches planifiées (Cron)   | Exécution unique à un horaire précis (`--at`)                |
| Exécuter une analyse approfondie chaque semaine        | Tâches planifiées (Cron)   | Tâche autonome pouvant utiliser un modèle différent          |
| Vérifier la boîte de réception toutes les 30 min       | Heartbeat                  | Regroupement avec d’autres vérifications, selon le contexte   |
| Surveiller les événements à venir dans le calendrier   | Heartbeat                  | Naturellement adapté à une surveillance périodique            |
| Reprendre contact après un entretien mentionné         | Engagements déduits        | Suivi semblable à un souvenir, sans demande de rappel précis  |
| Prendre doucement des nouvelles selon le contexte utilisateur | Engagements déduits | Limité au même agent et au même canal                         |
| Vérifier l’état d’un sous-agent ou d’une exécution ACP | Tâches en arrière-plan     | Le registre des tâches suit tous les travaux détachés         |
| Auditer les exécutions et leurs horaires               | Tâches en arrière-plan     | `openclaw tasks list` et `openclaw tasks audit`               |
| Effectuer une recherche en plusieurs étapes, puis la résumer | Flux de tâches        | Orchestration durable avec suivi des révisions                |
| Exécuter un script lors de la réinitialisation d’une session | Hooks                 | Piloté par les événements, déclenché par le cycle de vie      |
| Exécuter du code à chaque appel d’outil                | Hooks de Plugin            | Les hooks intégrés au processus peuvent intercepter les appels d’outils |
| Toujours vérifier la conformité avant de répondre      | Instructions permanentes   | Injectées automatiquement dans chaque session                 |

### Tâches planifiées (Cron) ou Heartbeat

| Dimension          | Tâches planifiées (Cron)                 | Heartbeat                                    |
| ------------------ | ---------------------------------------- | -------------------------------------------- |
| Horaire            | Exact (expressions cron, exécution unique) | Approximatif (toutes les 30 min par défaut) |
| Contexte de session | Nouveau (isolé) ou partagé              | Contexte complet de la session principale    |
| Enregistrements de tâches | Toujours créés                    | Jamais créés                                 |
| Distribution       | Canal, Webhook ou aucune                  | Intégrée à la session principale             |
| Idéal pour         | Rapports, rappels, travaux en arrière-plan | Vérifications de boîte de réception, calendrier, notifications |

Utilisez les tâches planifiées (Cron) lorsque vous avez besoin d’un horaire précis ou d’une exécution isolée. Utilisez Heartbeat lorsque le travail bénéficie du contexte complet de la session et qu’un horaire approximatif convient.

## Concepts fondamentaux

### Tâches planifiées (Cron)

Cron est le planificateur intégré du Gateway pour les horaires précis. Il conserve les travaux, réveille l’agent au moment approprié et peut transmettre le résultat à un canal de discussion ou à un point de terminaison Webhook. Il prend en charge les rappels uniques, les expressions récurrentes et les déclencheurs Webhook entrants.

Consultez [Tâches planifiées](/fr/automation/cron-jobs).

### Tâches

Le registre des tâches en arrière-plan suit tous les travaux détachés : exécutions ACP, créations de sous-agents, exécutions Cron isolées et opérations de la CLI. Les tâches sont des enregistrements, pas des planificateurs. Utilisez `openclaw tasks list` et `openclaw tasks audit` pour les consulter.

Consultez [Tâches en arrière-plan](/fr/automation/tasks).

### Engagements déduits

Les engagements sont des souvenirs de suivi facultatifs et de courte durée. OpenClaw les déduit
des conversations ordinaires, les limite au même agent et au même canal, puis
transmet les prises de nouvelles arrivées à échéance au moyen de Heartbeat. Les rappels précis
explicitement demandés par l’utilisateur relèvent toujours de Cron.

Consultez [Engagements déduits](/fr/concepts/commitments).

### Flux de tâches

Le flux de tâches constitue la couche d’orchestration des flux au-dessus des tâches en arrière-plan. Il gère des flux durables en plusieurs étapes avec des modes de synchronisation gérés et en miroir, le suivi des révisions et les commandes `openclaw tasks flow list|show|cancel` pour leur consultation.

Consultez [Flux de tâches](/fr/automation/taskflow).

### Instructions permanentes

Les instructions permanentes accordent à l’agent une autorité opérationnelle durable pour des programmes définis. Elles résident dans les fichiers de l’espace de travail, généralement `AGENTS.md`, et sont injectées dans chaque session. Associez-les à Cron pour une application à des horaires définis.

Consultez [Instructions permanentes](/fr/automation/standing-orders).

### Hooks

Les hooks internes sont des scripts pilotés par des événements et déclenchés par les événements du cycle de vie de l’agent
(`/new`, `/reset`, `/stop`), la Compaction de session, le démarrage du Gateway et le flux
de messages. Ils sont détectés dans les répertoires de hooks et gérés avec
`openclaw hooks`. Pour intercepter les appels d’outils au sein du processus, utilisez les
[hooks de Plugin](/fr/plugins/hooks).

Consultez [Hooks](/fr/automation/hooks).

### Heartbeat

Heartbeat est un tour périodique de la session principale, toutes les 30 minutes par défaut. Il regroupe plusieurs vérifications — boîte de réception, calendrier et notifications — dans un seul tour de l’agent avec le contexte complet de la session. Les tours Heartbeat ne créent pas d’enregistrements de tâches et ne prolongent pas la période de fraîcheur avant la réinitialisation quotidienne ou pour inactivité de la session. Utilisez `HEARTBEAT.md` pour une courte liste de contrôle, ou un bloc `tasks:` pour effectuer uniquement les vérifications périodiques arrivées à échéance dans Heartbeat lui-même. Les fichiers Heartbeat vides sont ignorés avec `empty-heartbeat-file` ; le mode de tâches limité aux échéances est ignoré avec `no-tasks-due`. Les Heartbeats sont différés lorsque des travaux Cron sont actifs ou en attente, et `heartbeat.skipWhenBusy` peut également différer un agent lorsque les sous-agents associés à la clé de session de ce même agent ou ses voies imbriquées sont occupés.

Consultez [Heartbeat](/fr/gateway/heartbeat).

## Fonctionnement conjoint

- **Cron** gère les horaires précis — rapports quotidiens, bilans hebdomadaires — et les rappels uniques. Toutes les exécutions Cron créent des enregistrements de tâches.
- **Heartbeat** gère la surveillance courante — boîte de réception, calendrier, notifications — en un seul tour groupé toutes les 30 minutes.
- **Les hooks** réagissent à des événements précis — réinitialisations de session, Compaction, flux de messages — au moyen de scripts personnalisés. Les hooks de Plugin couvrent les appels d’outils.
- **Les instructions permanentes** fournissent à l’agent un contexte durable et des limites d’autorité.
- **Le flux de tâches** coordonne les flux en plusieurs étapes au-dessus des tâches individuelles.
- **Les tâches** suivent automatiquement tous les travaux détachés afin que vous puissiez les consulter et les auditer.

## Pages connexes

- [Tâches planifiées](/fr/automation/cron-jobs) — planification précise et rappels uniques
- [Engagements déduits](/fr/concepts/commitments) — prises de nouvelles semblables à des souvenirs
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour tous les travaux détachés
- [Flux de tâches](/fr/automation/taskflow) — orchestration durable de flux en plusieurs étapes
- [Hooks](/fr/automation/hooks) — scripts de cycle de vie pilotés par les événements
- [Hooks de Plugin](/fr/plugins/hooks) — hooks intégrés au processus pour les outils, les prompts, les messages et le cycle de vie
- [Instructions permanentes](/fr/automation/standing-orders) — instructions persistantes de l’agent
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les clés de configuration
