---
read_when:
    - Vous souhaitez effacer l’état local tout en conservant la CLI installée
    - Vous souhaitez un aperçu à blanc de ce qui serait supprimé
summary: Référence CLI pour `openclaw reset` (réinitialiser l’état/la configuration locale)
title: Réinitialiser
x-i18n:
    generated_at: "2026-04-24T07:05:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

Réinitialiser la configuration/l’état local (conserve la CLI installée).

Options :

- `--scope <scope>` : `config`, `config+creds+sessions` ou `full`
- `--yes` : ignorer les invites de confirmation
- `--non-interactive` : désactiver les invites ; nécessite `--scope` et `--yes`
- `--dry-run` : afficher les actions sans supprimer de fichiers

Exemples :

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Remarques :

- Exécutez d’abord `openclaw backup create` si vous souhaitez un snapshot restaurable avant de supprimer l’état local.
- Si vous omettez `--scope`, `openclaw reset` utilise une invite interactive pour choisir ce qu’il faut supprimer.
- `--non-interactive` n’est valide que lorsque `--scope` et `--yes` sont tous deux définis.

## Associé

- [Référence CLI](/fr/cli)
