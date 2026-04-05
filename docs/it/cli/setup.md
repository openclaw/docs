---
read_when:
    - Stai eseguendo la configurazione iniziale senza l'onboarding CLI completo
    - Vuoi impostare il percorso predefinito del workspace
summary: Riferimento CLI per `openclaw setup` (inizializza config + workspace)
title: setup
x-i18n:
    generated_at: "2026-04-05T13:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inizializza `~/.openclaw/openclaw.json` e il workspace dell'agente.

Correlati:

- Per iniziare: [Getting started](/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/start/wizard)

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opzioni

- `--workspace <dir>`: directory del workspace dell'agente (memorizzata come `agents.defaults.workspace`)
- `--wizard`: esegue l'onboarding
- `--non-interactive`: esegue l'onboarding senza prompt
- `--mode <local|remote>`: modalità onboarding
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Per eseguire l'onboarding tramite setup:

```bash
openclaw setup --wizard
```

Note:

- Il semplice `openclaw setup` inizializza config + workspace senza il flusso completo di onboarding.
- L'onboarding viene eseguito automaticamente quando è presente uno qualsiasi dei flag di onboarding (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
