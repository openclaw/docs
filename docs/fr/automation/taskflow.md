---
read_when:
    - Vous souhaitez comprendre comment TaskFlow s’articule avec les tâches en arrière-plan
    - Vous rencontrez Flux de tâches ou `openclaw tasks flow` dans les notes de publication ou la documentation
    - Vous voulez inspecter ou gérer l’état persistant du flux
summary: Couche d’orchestration des flux Task Flow au-dessus des tâches en arrière-plan
title: Flux de tâches
x-i18n:
    generated_at: "2026-04-30T07:11:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow est la couche d’orchestration de flux située au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Il gère des flux durables en plusieurs étapes avec leur propre état, leur suivi de révision et leur sémantique de synchronisation, tandis que les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser Task Flow

Utilisez Task Flow lorsque le travail s’étend sur plusieurs étapes séquentielles ou ramifiées et que vous avez besoin d’un suivi durable de la progression à travers les redémarrages du Gateway. Pour les opérations uniques en arrière-plan, une simple [tâche](/fr/automation/tasks) suffit.

| Scénario                              | Utilisation                  |
| ------------------------------------- | ---------------------------- |
| Tâche unique en arrière-plan          | Tâche simple                 |
| Pipeline en plusieurs étapes (A puis B puis C) | Task Flow (géré)  |
| Observer des tâches créées en externe | Task Flow (miroir)           |
| Rappel ponctuel                       | Tâche Cron                   |

## Modèle de workflow planifié fiable

Pour les workflows récurrents tels que les synthèses de veille de marché, traitez la planification, l’orchestration et les contrôles de fiabilité comme des couches séparées :

1. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour le déclenchement temporel.
2. Utilisez une session cron persistante lorsque le workflow doit s’appuyer sur le contexte précédent.
3. Utilisez [Lobster](/fr/tools/lobster) pour les étapes déterministes, les points d’approbation et les jetons de reprise.
4. Utilisez Task Flow pour suivre l’exécution en plusieurs étapes à travers les tâches enfants, les attentes, les nouvelles tentatives et les redémarrages du Gateway.

Exemple de structure cron :

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

Utilisez `session:<id>` au lieu de `isolated` lorsque le workflow récurrent a besoin d’un historique délibéré, de résumés d’exécutions précédentes ou d’un contexte permanent. Utilisez `isolated` lorsque chaque exécution doit repartir de zéro et que tout l’état requis est explicite dans le workflow.

Dans le workflow, placez les contrôles de fiabilité avant l’étape de résumé par le LLM :

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

Contrôles de prévol recommandés :

- Disponibilité du navigateur et choix du profil, par exemple `openclaw` pour l’état géré ou `user` lorsqu’une session Chrome connectée est requise. Voir [Navigateur](/fr/tools/browser).
- Identifiants d’API et quota pour chaque source.
- Accessibilité réseau des endpoints requis.
- Outils requis activés pour l’agent, tels que `lobster`, `browser` et `llm-task`.
- Destination d’échec configurée pour cron afin que les échecs de prévol soient visibles. Voir [tâches planifiées](/fr/automation/cron-jobs#delivery-and-output).

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

Faites en sorte que le workflow rejette ou marque comme obsolètes les éléments avant le résumé. L’étape LLM ne doit recevoir que du JSON structuré et doit être invitée à préserver `sourceUrl`, `retrievedAt` et `asOf` dans sa sortie. Utilisez [LLM Task](/fr/tools/llm-task) lorsque vous avez besoin d’une étape de modèle validée par schéma dans le workflow.

Pour les workflows réutilisables d’équipe ou de communauté, empaquetez la CLI, les fichiers `.lobster` et toute note de configuration sous forme de skill ou de plugin, puis publiez-les via [ClawHub](/fr/tools/clawhub). Conservez les garde-fous propres au workflow dans ce package, sauf si l’API du plugin ne fournit pas une capacité générique nécessaire.

## Modes de synchronisation

### Mode géré

Task Flow possède le cycle de vie de bout en bout. Il crée les tâches comme étapes du flux, les mène à terme et fait avancer automatiquement l’état du flux.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le remet. Task Flow crée chaque étape comme une tâche en arrière-plan, attend son achèvement, puis passe à l’étape suivante.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode miroir

Task Flow observe les tâches créées en externe et maintient l’état du flux synchronisé sans prendre possession de la création des tâches. C’est utile lorsque les tâches proviennent de tâches cron, de commandes CLI ou d’autres sources, et que vous souhaitez une vue unifiée de leur progression sous forme de flux.

Exemple : trois tâches cron indépendantes qui forment ensemble une routine « opérations du matin ». Un flux miroir suit leur progression collective sans contrôler quand ni comment elles s’exécutent.

## État durable et suivi de révision

Chaque flux conserve son propre état et suit les révisions afin que la progression survive aux redémarrages du Gateway. Le suivi de révision permet la détection de conflits lorsque plusieurs sources tentent de faire avancer simultanément le même flux.
Le registre des flux utilise SQLite avec une maintenance bornée du journal d’écriture anticipée, y compris
des points de contrôle périodiques et à l’arrêt, afin que les gateways de longue durée ne conservent pas
de fichiers compagnons `registry.sqlite-wal` non bornés.

## Comportement d’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux. Les tâches actives dans le flux sont annulées et aucune nouvelle étape n’est démarrée. L’intention d’annulation persiste à travers les redémarrages, de sorte qu’un flux annulé reste annulé même si le Gateway redémarre avant que toutes les tâches enfants se soient terminées.

## Commandes CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `openclaw tasks flow list`        | Affiche les flux suivis avec leur état et leur mode de synchronisation |
| `openclaw tasks flow show <id>`   | Inspecte un flux par identifiant de flux ou clé de recherche |
| `openclaw tasks flow cancel <id>` | Annule un flux en cours d’exécution et ses tâches actives |

## Relation entre les flux et les tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de sa durée de vie. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuels et `openclaw tasks flow` pour inspecter le flux d’orchestration.

## Connexe

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre de travail détaché que les flux coordonnent
- [CLI : tâches](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées qui peuvent alimenter des flux
