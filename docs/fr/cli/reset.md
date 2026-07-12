---
read_when:
    - Vous souhaitez effacer l’état local tout en conservant la CLI installée
    - Vous souhaitez simuler ce qui serait supprimé
summary: Référence de la CLI pour `openclaw reset` (réinitialiser l’état/la configuration locale)
title: Réinitialiser
x-i18n:
    generated_at: "2026-07-12T02:32:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Réinitialise la configuration et l’état locaux (la CLI reste installée).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Options

- `--scope <scope>` : `config`, `config+creds+sessions` ou `full`
- `--yes` : ignore les demandes de confirmation
- `--non-interactive` : désactive les invites ; nécessite `--scope` et `--yes`
- `--dry-run` : affiche les actions sans supprimer de fichiers

## Portées

| Portée                  | Supprime                                                                                                                  | Arrête d’abord le Gateway |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `config`                | uniquement le fichier de configuration                                                                                    | non                       |
| `config+creds+sessions` | le fichier de configuration, le répertoire OAuth/des identifiants et les répertoires de sessions propres à chaque agent   | oui                       |
| `full`                  | le répertoire d’état (y compris la configuration et les identifiants s’ils s’y trouvent), les espaces de travail et leurs attestations | oui                       |

`config+creds+sessions` et `full` arrêtent un service Gateway géré en cours d’exécution avant de supprimer l’état.

## Remarques

- Exécutez d’abord `openclaw backup create` afin de créer un instantané restaurable avant de supprimer l’état local.
- Sans `--scope`, `openclaw reset` demande interactivement la portée à supprimer.
- `--non-interactive` n’est valide que si `--scope` et `--yes` sont tous deux définis.
- Une fois l’opération terminée, `config+creds+sessions` et `full` affichent `Next: openclaw onboard --install-daemon`.

## Voir aussi

- [Référence de la CLI](/fr/cli)
