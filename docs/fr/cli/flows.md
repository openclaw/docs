---
read_when:
    - Vous rencontrez `openclaw flows` dans d’anciennes pages de documentation ou notes de publication
    - Vous voulez une référence rapide pour inspecter TaskFlow
summary: 'Redirection : les commandes flow se trouvent sous `openclaw tasks flow`'
title: Flux (redirection)
x-i18n:
    generated_at: "2026-05-11T20:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

Il n’existe pas de commande `openclaw flows` de premier niveau. L’inspection persistante de TaskFlow se trouve sous `openclaw tasks flow`.

## Sous-commandes

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Sous-commande | Description                     | Arguments / options                                                                                     |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `list`        | Répertorier les TaskFlows suivis. | Sortie lisible par machine `--json` ; filtre `--status <name>` (voir les valeurs d’état ci-dessous).    |
| `show`        | Afficher un TaskFlow.           | ID de flux ou clé de propriétaire `<lookup>` ; sortie lisible par machine `--json`.                     |
| `cancel`      | Annuler un TaskFlow en cours d’exécution. | ID de flux ou clé de propriétaire `<lookup>`.                                                           |

`<lookup>` accepte soit un ID de flux (renvoyé par `list` / `show`), soit la clé de propriétaire du flux (l’identifiant stable que le sous-système propriétaire utilise pour suivre le flux).

### Valeurs du filtre d’état

`--status` sur `list` accepte l’une des valeurs suivantes :

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Exemples

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Pour les concepts complets de TaskFlow et sa création, consultez [TaskFlow](/fr/automation/taskflow). Pour la commande parente `tasks`, consultez la [référence CLI de tasks](/fr/cli/tasks).

## Associés

- [Référence CLI](/fr/cli)
- [Automatisation](/fr/automation)
- [TaskFlow](/fr/automation/taskflow)
