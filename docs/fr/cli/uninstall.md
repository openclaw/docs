---
read_when:
    - Vous souhaitez supprimer le service Gateway et/ou l’état local
    - Vous souhaitez d’abord une exécution à blanc
summary: Référence de la CLI pour `openclaw uninstall` (supprimer le service Gateway et les données locales)
title: Désinstallation
x-i18n:
    generated_at: "2026-07-12T15:13:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Désinstallez le service Gateway et/ou les données locales. La CLI elle-même n’est pas
supprimée ; désinstallez-la séparément via npm/pnpm.

## Options

| Option              | Valeur par défaut | Description                                                        |
| ------------------- | ----------------- | ------------------------------------------------------------------ |
| `--service`         | `false`           | Supprime le service Gateway.                                       |
| `--state`           | `false`           | Supprime l’état et la configuration.                               |
| `--workspace`       | `false`           | Supprime les répertoires d’espace de travail.                      |
| `--app`             | `false`           | Supprime l’application macOS.                                      |
| `--all`             | `false`           | Raccourci pour `--service --state --workspace --app`.              |
| `--yes`             | `false`           | Ignore les invites de confirmation.                               |
| `--non-interactive` | `false`           | Désactive les invites ; nécessite `--yes`.                         |
| `--dry-run`         | `false`           | Affiche les actions prévues sans supprimer de fichiers.            |

Sans option de portée, une liste à sélection multiple interactive vous invite à choisir les composants
à supprimer (par défaut, le service, l’état et l’espace de travail sont présélectionnés).

## Exemples

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Remarques

- Exécutez d’abord `openclaw backup create` afin de créer un instantané restaurable avant de supprimer
  l’état ou les espaces de travail.
- `--state` conserve les répertoires d’espace de travail configurés, sauf si `--workspace` est
  également sélectionné.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Désinstallation](/fr/install/uninstall)
