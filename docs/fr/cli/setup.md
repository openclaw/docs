---
read_when:
    - Vous effectuez la configuration de première exécution sans l’intégration complète de la CLI
    - Vous souhaitez définir le chemin de l’espace de travail par défaut
    - Il vous faut toutes les options et savoir comment la configuration choisit entre le mode de référence et le mode assistant
summary: Référence CLI pour `openclaw setup` (initialiser la configuration ainsi que l’espace de travail, exécuter éventuellement le processus d’intégration)
title: Configuration
x-i18n:
    generated_at: "2026-05-11T20:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisez la configuration de base et l’espace de travail de l’agent. Lorsqu’un indicateur d’onboarding est présent, exécute également l’assistant.

<Note>
`openclaw setup` est destiné aux installations de configuration modifiables. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Utilisez le [démarrage rapide nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre paquet Nix.
</Note>

## Options

| Indicateur                | Description                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`       | Répertoire d’espace de travail de l’agent (par défaut `~/.openclaw/workspace`; stocké dans `agents.defaults.workspace`). |
| `--wizard`                | Exécuter l’onboarding interactif.                                                                                 |
| `--non-interactive`       | Exécuter l’onboarding sans invites.                                                                               |
| `--mode <mode>`           | Mode d’onboarding : `local` ou `remote`.                                                                          |
| `--import-from <provider>` | Fournisseur de migration à exécuter pendant l’onboarding.                                                        |
| `--import-source <path>`  | Répertoire d’origine de l’agent source pour `--import-from`.                                                      |
| `--import-secrets`        | Importer les secrets pris en charge pendant la migration d’onboarding.                                            |
| `--remote-url <url>`      | URL WebSocket du Gateway distant.                                                                                 |
| `--remote-token <token>`  | Jeton du Gateway distant (facultatif).                                                                            |

### Déclenchement automatique de l’assistant

`openclaw setup` exécute l’assistant lorsque l’un de ces indicateurs est explicitement présent, même sans `--wizard` :

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Exemples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notes

- `openclaw setup` simple initialise la configuration et l’espace de travail sans exécuter le flux d’onboarding complet.
- Après une configuration simple, exécutez `openclaw onboard` pour le parcours guidé complet, `openclaw configure` pour des changements ciblés, ou `openclaw channels add` pour ajouter des comptes de canaux.
- Si un état Hermes est détecté, l’onboarding interactif peut proposer automatiquement la migration. L’onboarding d’importation nécessite une configuration fraîche ; utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai à blanc, les sauvegardes et le mode d’écrasement en dehors de l’onboarding.

## Connexe

- [Référence CLI](/fr/cli)
- [Onboarding (CLI)](/fr/start/wizard)
- [Bien démarrer](/fr/start/getting-started)
- [Vue d’ensemble de l’installation](/fr/install)
