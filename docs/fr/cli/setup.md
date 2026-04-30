---
read_when:
    - Vous effectuez la configuration au premier lancement sans le parcours d’intégration CLI complet
    - Vous souhaitez définir le chemin par défaut de l’espace de travail
summary: Référence CLI pour `openclaw setup` (initialiser la configuration + l’espace de travail)
title: Configuration
x-i18n:
    generated_at: "2026-04-30T07:20:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisez `~/.openclaw/openclaw.json` et l’espace de travail de l’agent.

Associé :

- Premiers pas : [Premiers pas](/fr/start/getting-started)
- Intégration CLI : [Intégration (CLI)](/fr/start/wizard)

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
- `--wizard` : exécuter l’intégration
- `--non-interactive` : exécuter l’intégration sans invites
- `--mode <local|remote>` : mode d’intégration
- `--import-from <provider>` : fournisseur de migration à exécuter pendant l’intégration
- `--import-source <path>` : répertoire personnel de l’agent source pour `--import-from`
- `--import-secrets` : importer les secrets pris en charge pendant la migration d’intégration
- `--remote-url <url>` : URL WebSocket du Gateway distant
- `--remote-token <token>` : jeton du Gateway distant

Pour exécuter l’intégration via la configuration :

```bash
openclaw setup --wizard
```

Notes :

- `openclaw setup` simple initialise la configuration et l’espace de travail sans le flux d’intégration complet.
- L’intégration s’exécute automatiquement lorsque des options d’intégration sont présentes (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si l’état Hermes est détecté, l’intégration interactive peut proposer automatiquement une migration. L’intégration d’import nécessite une configuration neuve ; utilisez [Migrer](/fr/cli/migrate) pour les plans d’exécution d’essai, les sauvegardes et le mode d’écrasement hors intégration.

## Associé

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de l’installation](/fr/install)
