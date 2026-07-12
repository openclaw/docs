---
read_when:
    - Vous souhaitez activer la complétion de commandes pour zsh/bash/fish/PowerShell
    - Vous devez mettre en cache les scripts de complétion dans l’état d’OpenClaw
summary: Référence de la CLI pour `openclaw completion` (générer/installer des scripts de complétion du shell)
title: Achèvement
x-i18n:
    generated_at: "2026-07-12T15:13:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Générez des scripts de complétion pour le shell, mettez-les en cache dans l’état d’OpenClaw et installez-les éventuellement dans votre profil de shell.

## Utilisation

```bash
openclaw completion                          # afficher le script zsh sur la sortie standard
openclaw completion --shell fish             # afficher le script fish
openclaw completion --write-state            # mettre en cache les scripts de tous les shells
openclaw completion --write-state --install  # mettre en cache, puis installer en une seule étape
openclaw completion --shell bash --write-state
```

## Options

- `-s, --shell <shell>` : shell cible (`zsh`, `bash`, `powershell`, `fish` ; valeur par défaut : `zsh`)
- `-i, --install` : installer la complétion en ajoutant à votre profil de shell une ligne qui charge le script mis en cache
- `--write-state` : écrire le ou les scripts de complétion dans `$OPENCLAW_STATE_DIR/completions` (par défaut `~/.openclaw/completions`) sans les afficher sur la sortie standard ; avec `--shell`, écrit uniquement celui de ce shell, sinon ceux des quatre shells
- `-y, --yes` : ignorer les demandes de confirmation d’installation (mode non interactif)

## Processus d’installation

`--install` configure votre profil pour utiliser le script mis en cache ; le cache doit donc exister au préalable. S’il est absent, la commande échoue et vous indique d’exécuter `openclaw completion --write-state`. Combinez `--write-state --install` pour effectuer les deux opérations en une seule étape. Sans `--shell`, `--install` détecte le shell à partir de `$SHELL` (avec zsh comme solution de repli).

L’installation écrit un petit bloc `# OpenClaw Completion` dans votre profil de shell et remplace les anciennes lignes lentes `source <(openclaw completion ...)` par la ligne qui charge le script mis en cache :

| Shell      | Profil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (utilise `~/.bash_profile` comme solution de repli si `~/.bashrc` est absent)                                                                                                  |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (sous Windows : `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, ou `Documents/WindowsPowerShell/...` pour Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Remarques

- Sans `--install` ni `--write-state`, la commande affiche le script sur la sortie standard.
- La génération de la complétion charge immédiatement l’intégralité de l’arborescence des commandes, y compris les commandes CLI des plugins, afin d’inclure les sous-commandes imbriquées.
- `openclaw update` actualise automatiquement le cache de complétion après une mise à jour réussie ; `openclaw doctor` peut réparer les configurations de complétion manquantes ou obsolètes.

## Voir aussi

- [Référence de la CLI](/fr/cli)
