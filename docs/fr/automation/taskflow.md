---
read_when:
    - Vous voulez comprendre comment TaskFlow est lié aux tâches en arrière-plan
    - Vous rencontrez le flux de tâches ou le flux de tâches openclaw dans les notes de version ou la documentation
    - Vous voulez inspecter ou gérer l’état durable du flux
summary: Couche d’orchestration des flux Task Flow au-dessus des tâches en arrière-plan
title: flux de tâches
x-i18n:
    generated_at: "2026-04-23T06:58:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Flux de tâches

Le flux de tâches est la couche d’orchestration des flux qui se situe au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Il gère des flux durables à plusieurs étapes avec leur propre état, le suivi des révisions et des mécanismes de synchronisation, tandis que les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser le flux de tâches

Utilisez le flux de tâches lorsque le travail couvre plusieurs étapes séquentielles ou à embranchements et que vous avez besoin d’un suivi durable de la progression après les redémarrages de la Gateway. Pour les opérations simples en arrière-plan, une simple [tâche](/fr/automation/tasks) suffit.

| Scénario                              | Utilisation           |
| ------------------------------------- | --------------------- |
| Tâche en arrière-plan unique          | Tâche simple          |
| Pipeline à plusieurs étapes (A puis B puis C) | Flux de tâches (géré) |
| Observer des tâches créées en externe | Flux de tâches (reflété) |
| Rappel ponctuel                       | Tâche Cron            |

## Modes de synchronisation

### Mode géré

Le flux de tâches gère le cycle de vie de bout en bout. Il crée des tâches comme étapes du flux, les mène jusqu’à leur achèvement et fait progresser automatiquement l’état du flux.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le livre. Le flux de tâches crée chaque étape comme tâche en arrière-plan, attend son achèvement, puis passe à l’étape suivante.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode reflété

Le flux de tâches observe les tâches créées en externe et maintient l’état du flux synchronisé sans prendre en charge la création des tâches. Cela est utile lorsque les tâches proviennent de tâches Cron, de commandes CLI ou d’autres sources, et que vous souhaitez une vue unifiée de leur progression sous forme de flux.

Exemple : trois tâches Cron indépendantes qui forment ensemble une routine « opérations du matin ». Un flux reflété suit leur progression collective sans contrôler quand ni comment elles s’exécutent.

## État durable et suivi des révisions

Chaque flux conserve son propre état et suit les révisions afin que la progression survive aux redémarrages de la Gateway. Le suivi des révisions permet de détecter les conflits lorsque plusieurs sources tentent de faire progresser le même flux simultanément.

## Comportement d’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux. Les tâches actives dans le flux sont annulées, et aucune nouvelle étape n’est lancée. L’intention d’annulation persiste après les redémarrages ; ainsi, un flux annulé reste annulé même si la Gateway redémarre avant que toutes les tâches enfants ne soient terminées.

## Commandes CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| `openclaw tasks flow list`        | Affiche les flux suivis avec leur statut et leur mode de synchronisation |
| `openclaw tasks flow show <id>`   | Inspecte un flux par identifiant de flux ou clé de recherche |
| `openclaw tasks flow cancel <id>` | Annule un flux en cours d’exécution et ses tâches actives |

## Comment les flux sont liés aux tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de sa durée de vie. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuels et `openclaw tasks flow` pour inspecter le flux d’orchestration.

## Voir aussi

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre de travail détaché que les flux coordonnent
- [CLI: tasks](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées pouvant alimenter des flux
