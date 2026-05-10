---
read_when:
    - Vous voulez comprendre comment Task Flow s’articule avec les tâches d’arrière-plan
    - Vous rencontrez Task Flow ou le flux de tâches openclaw dans les notes de publication ou la documentation
    - Vous souhaitez inspecter ou gérer l’état persistant du flux
summary: Couche d’orchestration de flux Task Flow au-dessus des tâches en arrière-plan
title: Flux de tâches
x-i18n:
    generated_at: "2026-05-10T19:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow est le substrat d’orchestration de flux qui se situe au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Il gère des flux durables en plusieurs étapes avec leur propre état, leur suivi des révisions et leur sémantique de synchronisation, tandis que les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser Task Flow

Utilisez Task Flow lorsque le travail couvre plusieurs étapes séquentielles ou ramifiées et que vous avez besoin d’un suivi durable de la progression entre les redémarrages du Gateway. Pour des opérations uniques en arrière-plan, une simple [tâche](/fr/automation/tasks) suffit.

| Scénario                              | Utilisation             |
| ------------------------------------- | ----------------------- |
| Tâche unique en arrière-plan          | Tâche simple            |
| Pipeline en plusieurs étapes (A puis B puis C) | Task Flow (géré) |
| Observer des tâches créées en externe | Task Flow (miroir)      |
| Rappel ponctuel                       | Tâche Cron              |

## Modèle fiable de workflow planifié

Pour les workflows récurrents tels que les briefings de veille de marché, traitez la planification, l’orchestration et les vérifications de fiabilité comme des couches séparées :

1. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour le déclenchement temporel.
2. Utilisez une session Cron persistante lorsque le workflow doit s’appuyer sur le contexte antérieur.
3. Utilisez [Lobster](/fr/tools/lobster) pour les étapes déterministes, les portes d’approbation et les jetons de reprise.
4. Utilisez Task Flow pour suivre l’exécution en plusieurs étapes à travers les tâches enfants, les attentes, les nouvelles tentatives et les redémarrages du Gateway.

Forme d’exemple de Cron :

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

Utilisez `session:<id>` au lieu de `isolated` lorsque le workflow récurrent nécessite un historique délibéré, des résumés d’exécutions précédentes ou un contexte permanent. Utilisez `isolated` lorsque chaque exécution doit repartir de zéro et que tout l’état requis est explicite dans le workflow.

Dans le workflow, placez les vérifications de fiabilité avant l’étape de résumé par LLM :

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

- Disponibilité du navigateur et choix du profil, par exemple `openclaw` pour l’état géré ou `user` lorsqu’une session Chrome connectée est requise. Consultez [Browser](/fr/tools/browser).
- Identifiants API et quota pour chaque source.
- Accessibilité réseau des points de terminaison requis.
- Outils requis activés pour l’agent, tels que `lobster`, `browser` et `llm-task`.
- Destination d’échec configurée pour Cron afin que les échecs de prévol soient visibles. Consultez les [tâches planifiées](/fr/automation/cron-jobs#delivery-and-output).

Champs recommandés de provenance des données pour chaque élément collecté :

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faites en sorte que le workflow rejette ou marque comme obsolètes les éléments avant la synthèse. L’étape LLM ne doit recevoir que du JSON structuré et doit être invitée à préserver `sourceUrl`, `retrievedAt` et `asOf` dans sa sortie. Utilisez [LLM Task](/fr/tools/llm-task) lorsque vous avez besoin d’une étape de modèle validée par schéma dans le workflow.

Pour des workflows réutilisables par une équipe ou une communauté, empaquetez la CLI, les fichiers `.lobster` et les éventuelles notes de configuration sous forme de skill ou de plugin, puis publiez-les via [ClawHub](/clawhub). Conservez les garde-fous propres au workflow dans ce paquet, sauf si l’API du plugin ne fournit pas une capacité générique nécessaire.

## Modes de synchronisation

### Mode géré

Task Flow possède le cycle de vie de bout en bout. Il crée les tâches comme étapes du flux, les mène jusqu’à leur achèvement et fait avancer automatiquement l’état du flux.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le livre. Task Flow crée chaque étape comme tâche en arrière-plan, attend son achèvement, puis passe à l’étape suivante.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode miroir

Task Flow observe les tâches créées en externe et maintient l’état du flux synchronisé sans prendre en charge la création des tâches. C’est utile lorsque les tâches proviennent de tâches Cron, de commandes CLI ou d’autres sources, et que vous souhaitez une vue unifiée de leur progression sous forme de flux.

Exemple : trois tâches Cron indépendantes qui forment ensemble une routine « opérations du matin ». Un flux miroir suit leur progression collective sans contrôler quand ni comment elles s’exécutent.

## État durable et suivi des révisions

Chaque flux conserve son propre état et suit les révisions afin que la progression survive aux redémarrages du Gateway. Le suivi des révisions permet de détecter les conflits lorsque plusieurs sources tentent de faire avancer le même flux simultanément.
Le registre des flux utilise SQLite avec une maintenance bornée du journal d’écriture anticipée, y compris
des points de contrôle périodiques et à l’arrêt, afin que les gateways longue durée ne conservent pas
des fichiers compagnons `registry.sqlite-wal` non bornés.

## Comportement d’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux. Les tâches actives dans le flux sont annulées, et aucune nouvelle étape n’est démarrée. L’intention d’annulation persiste après les redémarrages, donc un flux annulé reste annulé même si le Gateway redémarre avant que toutes les tâches enfants soient terminées.

## Commandes CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                               |
| --------------------------------- | --------------------------------------------------------- |
| `openclaw tasks flow list`        | Affiche les flux suivis avec leur statut et mode de synchronisation |
| `openclaw tasks flow show <id>`   | Inspecte un flux par id de flux ou clé de recherche       |
| `openclaw tasks flow cancel <id>` | Annule un flux en cours d’exécution et ses tâches actives |

## Relation entre les flux et les tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de sa durée de vie. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuels et `openclaw tasks flow` pour inspecter le flux d’orchestration.

## Associés

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre de travail détaché que les flux coordonnent
- [CLI : tâches](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées pouvant alimenter des flux
