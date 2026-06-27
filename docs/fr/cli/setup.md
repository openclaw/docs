---
read_when:
    - Vous effectuez la configuration initiale sans l’onboarding CLI complet
    - Vous souhaitez définir le chemin de l’espace de travail par défaut
    - Vous devez connaître chaque option et la manière dont la configuration choisit entre le mode de base et le mode assistant
summary: Référence CLI pour `openclaw setup` (initialiser la configuration ainsi que l’espace de travail, exécuter éventuellement l’intégration)
title: Configuration
x-i18n:
    generated_at: "2026-06-27T17:21:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialise la configuration de base et l’espace de travail de l’agent. Si un indicateur d’onboarding est présent, exécute aussi l’assistant.

<Note>
`openclaw setup` est destiné aux installations avec configuration mutable. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Utilisez le [démarrage rapide nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre package Nix.
</Note>

## Options

| Indicateur                 | Description                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Répertoire d’espace de travail de l’agent (par défaut `~/.openclaw/workspace` ; stocké comme `agents.defaults.workspace`). |
| `--wizard`                 | Exécute l’onboarding interactif.                                                                                 |
| `--non-interactive`        | Exécute l’onboarding sans invites.                                                                               |
| `--accept-risk`            | Reconnaît le risque d’accès de l’agent à tout le système ; requis avec `--non-interactive`.                      |
| `--mode <mode>`            | Mode d’onboarding : `local` ou `remote`.                                                                         |
| `--import-from <provider>` | Fournisseur de migration à exécuter pendant l’onboarding.                                                        |
| `--import-source <path>`   | Dossier personnel de l’agent source pour `--import-from`.                                                        |
| `--import-secrets`         | Importe les secrets pris en charge pendant la migration d’onboarding.                                            |
| `--remote-url <url>`       | URL WebSocket du Gateway distant.                                                                                |
| `--remote-token <token>`   | Jeton du Gateway distant (facultatif).                                                                           |

### Déclenchement automatique de l’assistant

`openclaw setup` exécute l’assistant lorsque l’un de ces indicateurs est explicitement présent, même sans `--wizard` :

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Exemples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Remarques

- `openclaw setup` seul initialise la configuration et l’espace de travail sans exécuter le flux d’onboarding complet.
- Après une configuration simple, exécutez `openclaw onboard` pour le parcours guidé complet, `openclaw configure` pour des changements ciblés, ou `openclaw channels add` pour ajouter des comptes de canaux.
- Si un état Hermes est détecté, l’onboarding interactif peut proposer automatiquement une migration. L’onboarding d’importation nécessite une configuration neuve ; utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai, les sauvegardes et le mode d’écrasement hors onboarding.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Onboarding (CLI)](/fr/start/wizard)
- [Bien démarrer](/fr/start/getting-started)
- [Vue d’ensemble de l’installation](/fr/install)
