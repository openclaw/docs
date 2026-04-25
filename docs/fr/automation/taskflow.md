---
read_when:
    - Vous voulez comprendre comment le flux de tâches se rapporte aux tâches en arrière-plan
    - Vous rencontrez le flux de tâches Task Flow ou le flux de tâches OpenClaw dans les notes de version ou la documentation
    - Vous voulez inspecter ou gérer l’état durable du flux
summary: couche d’orchestration des flux Task Flow au-dessus des tâches en arrière-plan
title: Flux de tâches
x-i18n:
    generated_at: "2026-04-25T13:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

Le flux de tâches est la couche d’orchestration des flux qui se situe au-dessus des [tâches en arrière-plan](/fr/automation/tasks). Il gère des flux durables à plusieurs étapes avec leur propre état, le suivi des révisions et la sémantique de synchronisation, tandis que les tâches individuelles restent l’unité de travail détaché.

## Quand utiliser le flux de tâches

Utilisez le flux de tâches lorsque le travail couvre plusieurs étapes séquentielles ou conditionnelles et que vous avez besoin d’un suivi durable de la progression entre les redémarrages de la Gateway. Pour les opérations uniques en arrière-plan, une simple [tâche](/fr/automation/tasks) suffit.

| Scénario                             | Utilisation          |
| ------------------------------------ | -------------------- |
| Tâche en arrière-plan unique         | Tâche simple         |
| Pipeline à plusieurs étapes (A puis B puis C) | Flux de tâches (géré) |
| Observer des tâches créées en externe | Flux de tâches (mis en miroir) |
| Rappel ponctuel                      | Tâche Cron           |

## Modèle fiable de workflow planifié

Pour les workflows récurrents tels que les briefings de veille de marché, traitez la planification, l’orchestration et les vérifications de fiabilité comme des couches distinctes :

1. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour la temporalité.
2. Utilisez une session Cron persistante lorsque le workflow doit s’appuyer sur le contexte précédent.
3. Utilisez [Lobster](/fr/tools/lobster) pour des étapes déterministes, des points d’approbation et des jetons de reprise.
4. Utilisez le flux de tâches pour suivre l’exécution à plusieurs étapes à travers les tâches enfants, les attentes, les nouvelles tentatives et les redémarrages de la Gateway.

Exemple de structure Cron :

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

Utilisez `session:<id>` au lieu de `isolated` lorsque le workflow récurrent a besoin d’un historique délibéré, de résumés d’exécutions précédentes ou d’un contexte permanent. Utilisez `isolated` lorsque chaque exécution doit démarrer à neuf et que tout l’état requis est explicite dans le workflow.

À l’intérieur du workflow, placez les vérifications de fiabilité avant l’étape de résumé par LLM :

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

Vérifications de préflight recommandées :

- Disponibilité du navigateur et choix du profil, par exemple `openclaw` pour l’état géré ou `user` lorsqu’une session Chrome connectée est requise. Voir [Browser](/fr/tools/browser).
- Identifiants d’API et quota pour chaque source.
- Accessibilité réseau pour les points de terminaison requis.
- Outils requis activés pour l’agent, tels que `lobster`, `browser` et `llm-task`.
- Destination d’échec configurée pour Cron afin que les échecs de préflight soient visibles. Voir [tâches planifiées](/fr/automation/cron-jobs#delivery-and-output).

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

Faites en sorte que le workflow rejette ou marque comme obsolètes les éléments avant la synthèse. L’étape LLM ne doit recevoir que du JSON structuré et il faut lui demander de préserver `sourceUrl`, `retrievedAt` et `asOf` dans sa sortie. Utilisez [LLM Task](/fr/tools/llm-task) lorsque vous avez besoin d’une étape de modèle validée par schéma à l’intérieur du workflow.

Pour les workflows réutilisables d’équipe ou de communauté, empaquetez le CLI, les fichiers `.lobster` et toutes les notes de configuration sous forme de skill ou de Plugin, puis publiez-les via [ClawHub](/fr/tools/clawhub). Conservez dans ce paquet les garde-fous spécifiques au workflow, sauf si l’API du Plugin ne dispose pas d’une capacité générique nécessaire.

## Modes de synchronisation

### Mode géré

Le flux de tâches possède le cycle de vie de bout en bout. Il crée les tâches comme étapes du flux, les mène à leur terme et fait progresser automatiquement l’état du flux.

Exemple : un flux de rapport hebdomadaire qui (1) collecte les données, (2) génère le rapport et (3) le livre. Le flux de tâches crée chaque étape comme tâche en arrière-plan, attend son achèvement, puis passe à l’étape suivante.

```
Flux : weekly-report
  Étape 1 : gather-data     → tâche créée → réussite
  Étape 2 : generate-report → tâche créée → réussite
  Étape 3 : deliver         → tâche créée → en cours
```

### Mode mis en miroir

Le flux de tâches observe les tâches créées en externe et maintient l’état du flux synchronisé sans prendre en charge la création des tâches. Cela est utile lorsque les tâches proviennent de tâches Cron, de commandes CLI ou d’autres sources et que vous souhaitez une vue unifiée de leur progression sous forme de flux.

Exemple : trois tâches Cron indépendantes qui forment ensemble une routine « opérations du matin ». Un flux mis en miroir suit leur progression collective sans contrôler ni le moment ni la manière dont elles s’exécutent.

## État durable et suivi des révisions

Chaque flux conserve son propre état et suit les révisions afin que la progression survive aux redémarrages de la Gateway. Le suivi des révisions permet la détection des conflits lorsque plusieurs sources tentent de faire progresser simultanément le même flux.

## Comportement d’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux. Les tâches actives au sein du flux sont annulées, et aucune nouvelle étape n’est démarrée. L’intention d’annulation persiste entre les redémarrages, de sorte qu’un flux annulé reste annulé même si la Gateway redémarre avant que toutes les tâches enfants ne soient terminées.

## Commandes CLI

```bash
# Lister les flux actifs et récents
openclaw tasks flow list

# Afficher les détails d’un flux spécifique
openclaw tasks flow show <lookup>

# Annuler un flux en cours et ses tâches actives
openclaw tasks flow cancel <lookup>
```

| Commande                          | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `openclaw tasks flow list`        | Affiche les flux suivis avec le statut et le mode de synchronisation |
| `openclaw tasks flow show <id>`   | Inspecter un flux par identifiant de flux ou clé de recherche |
| `openclaw tasks flow cancel <id>` | Annuler un flux en cours et ses tâches actives     |

## Comment les flux se rapportent aux tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un seul flux peut piloter plusieurs tâches en arrière-plan au cours de sa durée de vie. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuels et `openclaw tasks flow` pour inspecter le flux d’orchestration.

## Lié

- [Tâches en arrière-plan](/fr/automation/tasks) — le registre de travail détaché que les flux coordonnent
- [CLI: tasks](/fr/cli/tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — tâches planifiées susceptibles d’alimenter des flux
