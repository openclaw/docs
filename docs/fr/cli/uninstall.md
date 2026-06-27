---
read_when:
    - Vous voulez supprimer le service Gateway et/ou l’état local
    - Vous voulez d’abord une répétition générale
summary: Référence CLI pour `openclaw uninstall` (supprimer le service Gateway + les données locales)
title: Désinstaller
x-i18n:
    generated_at: "2026-06-27T17:22:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Désinstaller le service Gateway + les données locales (la CLI reste).

Options :

- `--service` : supprimer le service Gateway
- `--state` : supprimer l’état et la configuration
- `--workspace` : supprimer les répertoires d’espace de travail
- `--app` : supprimer l’application macOS
- `--all` : supprimer le service, l’état, l’espace de travail et l’application
- `--yes` : ignorer les invites de confirmation
- `--non-interactive` : désactiver les invites ; nécessite `--yes`
- `--dry-run` : afficher les actions sans supprimer de fichiers

Exemples :

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Notes :

- Exécutez d’abord `openclaw backup create` si vous souhaitez un instantané restaurable avant de supprimer l’état ou les espaces de travail.
- `--state` préserve les répertoires d’espace de travail configurés, sauf si `--workspace` est également sélectionné.
- `--all` est un raccourci pour supprimer ensemble le service, l’état, l’espace de travail et l’application.
- `--non-interactive` nécessite `--yes`.

## Associé

- [Référence CLI](/fr/cli)
- [Désinstallation](/fr/install/uninstall)
