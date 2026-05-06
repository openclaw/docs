---
read_when:
    - Vous effectuez la configuration au premier lancement sans l’intégration complète via la CLI
    - Vous voulez définir le chemin par défaut de l’espace de travail
summary: Référence CLI pour `openclaw setup` (initialiser la configuration + l’espace de travail)
title: Configuration
x-i18n:
    generated_at: "2026-05-06T17:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialisez `~/.openclaw/openclaw.json` et l’espace de travail de l’agent.

<Note>
`openclaw setup` est destiné aux installations à configuration modifiable. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Les agents doivent utiliser le [démarrage rapide nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre paquet Nix.
</Note>

Connexe :

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

- `--workspace <dir>` : répertoire d’espace de travail de l’agent (stocké sous `agents.defaults.workspace`)
- `--wizard` : exécuter l’intégration
- `--non-interactive` : exécuter l’intégration sans invites
- `--mode <local|remote>` : mode d’intégration
- `--import-from <provider>` : fournisseur de migration à exécuter pendant l’intégration
- `--import-source <path>` : répertoire personnel source de l’agent pour `--import-from`
- `--import-secrets` : importer les secrets pris en charge pendant la migration d’intégration
- `--remote-url <url>` : URL WebSocket du Gateway distant
- `--remote-token <token>` : jeton du Gateway distant

Pour exécuter l’intégration via la configuration :

```bash
openclaw setup --wizard
```

Notes :

- `openclaw setup` simple initialise la configuration et l’espace de travail sans le flux d’intégration complet.
- Après une configuration simple, exécutez `openclaw configure` pour choisir les modèles, les canaux, le Gateway, les plugins, les skills ou les contrôles d’intégrité.
- L’intégration s’exécute automatiquement lorsque des indicateurs d’intégration sont présents (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si un état Hermes est détecté, l’intégration interactive peut proposer automatiquement une migration. L’intégration d’importation nécessite une configuration fraîche ; utilisez [Migrer](/fr/cli/migrate) pour les plans en simulation, les sauvegardes et le mode d’écrasement en dehors de l’intégration.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de l’installation](/fr/install)
