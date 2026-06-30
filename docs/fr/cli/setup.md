---
read_when:
    - Vous effectuez la configuration initiale avec l’assistant d’intégration de la CLI
    - Vous souhaitez définir le chemin de l’espace de travail par défaut
    - Vous avez besoin de l’indicateur de configuration baseline-only pour les scripts
summary: Référence CLI pour `openclaw setup` (alias pour l’intégration, avec la configuration de base disponible via une option)
title: Configuration
x-i18n:
    generated_at: "2026-06-30T22:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Exécutez le parcours d’intégration CLI complet. `openclaw setup` est un alias de `openclaw onboard` ; utilisez `--baseline` lorsque vous devez seulement initialiser les dossiers de configuration/de l’espace de travail sans l’assistant.

<Note>
`openclaw setup` est destiné aux installations avec configuration modifiable. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Utilisez le [démarrage rapide nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre package Nix.
</Note>

## Options

| Indicateur                 | Description                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Répertoire de l’espace de travail de l’agent (par défaut `~/.openclaw/workspace` ; stocké comme `agents.defaults.workspace`). |
| `--baseline`               | Crée les dossiers de configuration, d’espace de travail et de session de base sans intégration.     |
| `--wizard`                 | Accepté pour compatibilité ; la configuration lance l’intégration par défaut.                       |
| `--non-interactive`        | Exécute l’intégration sans invites.                                                                 |
| `--accept-risk`            | Reconnaît le risque d’accès de l’agent à l’ensemble du système ; requis avec `--non-interactive`.   |
| `--mode <mode>`            | Mode d’intégration : `local` ou `remote`.                                                           |
| `--import-from <provider>` | Fournisseur de migration à exécuter pendant l’intégration.                                          |
| `--import-source <path>`   | Répertoire personnel de l’agent source pour `--import-from`.                                        |
| `--import-secrets`         | Importe les secrets pris en charge pendant la migration d’intégration.                              |
| `--remote-url <url>`       | URL WebSocket du Gateway distant.                                                                   |
| `--remote-token <token>`   | Jeton du Gateway distant (facultatif).                                                              |

### Mode baseline

`openclaw setup --baseline` conserve l’ancien comportement limité à la base : il crée les répertoires de configuration, d’espace de travail et de session, puis quitte sans lancer l’intégration.

## Exemples

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notes

- `openclaw setup` simple exécute le même parcours guidé que `openclaw onboard`.
- Après la configuration de base, exécutez `openclaw setup` ou `openclaw onboard` pour le parcours guidé complet, `openclaw configure` pour des changements ciblés, ou `openclaw channels add` pour ajouter des comptes de canaux.
- Si un état Hermes est détecté, l’intégration interactive peut proposer automatiquement la migration. L’intégration avec importation nécessite une configuration fraîche ; utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai, les sauvegardes et le mode d’écrasement hors intégration.

## Connexe

- [Référence CLI](/fr/cli)
- [Intégration (CLI)](/fr/start/wizard)
- [Bien démarrer](/fr/start/getting-started)
- [Vue d’ensemble de l’installation](/fr/install)
