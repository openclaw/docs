---
read_when:
    - Vous voulez des autocomplétions shell pour zsh/bash/fish/PowerShell
    - Vous devez mettre en cache les scripts d’autocomplétion sous l’état OpenClaw
summary: Référence CLI pour `openclaw completion` (générer/installer des scripts d’autocomplétion du shell)
title: Autocomplétion
x-i18n:
    generated_at: "2026-04-24T07:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw completion`

Générez des scripts d’autocomplétion shell et, en option, installez-les dans votre profil shell.

## Utilisation

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Options

- `-s, --shell <shell>` : cible shell (`zsh`, `bash`, `powershell`, `fish` ; par défaut : `zsh`)
- `-i, --install` : installe l’autocomplétion en ajoutant une ligne source à votre profil shell
- `--write-state` : écrit le ou les scripts d’autocomplétion dans `$OPENCLAW_STATE_DIR/completions` sans les afficher sur stdout
- `-y, --yes` : ignore les invites de confirmation d’installation

## Remarques

- `--install` écrit un petit bloc « OpenClaw Completion » dans votre profil shell et le fait pointer vers le script mis en cache.
- Sans `--install` ni `--write-state`, la commande affiche le script sur stdout.
- La génération d’autocomplétion charge de manière anticipée les arborescences de commandes afin d’inclure les sous-commandes imbriquées.

## Liens associés

- [Référence CLI](/fr/cli)
