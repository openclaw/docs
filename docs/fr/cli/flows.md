---
read_when:
    - Vous rencontrez `openclaw flows` dans d’anciennes documentations ou notes de version
    - Vous souhaitez une référence rapide pour inspecter TaskFlow
summary: 'Redirection : les commandes de flux se trouvent sous `openclaw tasks flow`'
title: Flux (redirection)
x-i18n:
    generated_at: "2026-07-12T15:07:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Il n’existe aucune commande de niveau supérieur `openclaw flows`. L’inspection durable des TaskFlows s’effectue sous `openclaw tasks flow`.

## Sous-commandes

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Sous-commande | Description                         | Arguments / options                                                                                  |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `list`        | Répertorie les TaskFlows suivis.    | Sortie lisible par machine avec `--json` ; filtre `--status <name>` (voir les valeurs d’état ci-dessous). |
| `show`        | Affiche un TaskFlow.                | Identifiant de flux ou clé de propriétaire `<lookup>` ; sortie lisible par machine avec `--json`.   |
| `cancel`      | Annule un TaskFlow en cours.        | Identifiant de flux ou clé de propriétaire `<lookup>`.                                               |

`<lookup>` accepte soit un identifiant de flux (renvoyé par `list` / `show`), soit la clé de propriétaire du flux (l’identifiant stable utilisé par le sous-système propriétaire pour suivre le flux).

### Valeurs du filtre d’état

`--status` pour `list` accepte l’une des valeurs suivantes : `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Exemples

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Pour les concepts et la création de TaskFlow, consultez [TaskFlow](/fr/automation/taskflow). Pour la commande parente `tasks`, consultez la [référence de la CLI tasks](/fr/cli/tasks).

## Connexe

- [Référence de la CLI](/fr/cli)
- [Automatisation](/fr/automation)
- [TaskFlow](/fr/automation/taskflow)
