---
read_when:
    - Stai eseguendo la configurazione iniziale senza l'onboarding completo della CLI
    - Vuoi impostare il percorso predefinito dello spazio di lavoro
summary: Riferimento CLI per `openclaw setup` (inizializzare configurazione + spazio di lavoro)
title: Configurazione
x-i18n:
    generated_at: "2026-04-24T08:35:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inizializza `~/.openclaw/openclaw.json` e lo spazio di lavoro dell'agente.

Correlati:

- Per iniziare: [Per iniziare](/it/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/it/start/wizard)

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opzioni

- `--workspace <dir>`: directory dello spazio di lavoro dell'agente (memorizzata come `agents.defaults.workspace`)
- `--wizard`: esegui l'onboarding
- `--non-interactive`: esegui l'onboarding senza prompt
- `--mode <local|remote>`: modalità onboarding
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Per eseguire l'onboarding tramite setup:

```bash
openclaw setup --wizard
```

Note:

- Il comando semplice `openclaw setup` inizializza configurazione + spazio di lavoro senza il flusso completo di onboarding.
- L'onboarding viene eseguito automaticamente quando è presente uno qualsiasi dei flag di onboarding (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dell'installazione](/it/install)
