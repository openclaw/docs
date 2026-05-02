---
read_when:
    - Vous effectuez la configuration au premier lancement sans le parcours d’intégration complet de la CLI
    - Vous souhaitez définir le chemin de l’espace de travail par défaut
summary: Référence CLI pour `openclaw setup` (initialiser la configuration + l’espace de travail)
title: Configuration
x-i18n:
    generated_at: "2026-05-02T20:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialise `~/.openclaw/openclaw.json` et l’espace de travail de l’agent.

Connexe :

- Bien démarrer : [Bien démarrer](/fr/start/getting-started)
- Onboarding CLI : [Onboarding (CLI)](/fr/start/wizard)

## Exemples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Options

- `--workspace <dir>` : répertoire de l’espace de travail de l’agent (stocké sous `agents.defaults.workspace`)
- `--wizard` : exécuter l’onboarding
- `--non-interactive` : exécuter l’onboarding sans invites
- `--mode <local|remote>` : mode d’onboarding
- `--import-from <provider>` : fournisseur de migration à exécuter pendant l’onboarding
- `--import-source <path>` : répertoire personnel de l’agent source pour `--import-from`
- `--import-secrets` : importer les secrets pris en charge pendant la migration d’onboarding
- `--remote-url <url>` : URL WebSocket du Gateway distant
- `--remote-token <token>` : jeton du Gateway distant

Pour exécuter l’onboarding via setup :

```bash
openclaw setup --wizard
```

Remarques :

- `openclaw setup` seul initialise la configuration et l’espace de travail sans le flux d’onboarding complet.
- Après une configuration simple, exécutez `openclaw configure` pour choisir les modèles, les canaux, le Gateway, les plugins, les Skills ou les contrôles de santé.
- L’onboarding s’exécute automatiquement lorsque des indicateurs d’onboarding sont présents (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si un état Hermes est détecté, l’onboarding interactif peut proposer automatiquement la migration. L’onboarding d’importation nécessite une nouvelle configuration ; utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai, les sauvegardes et le mode d’écrasement en dehors de l’onboarding.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de l’installation](/fr/install)
