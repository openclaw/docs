---
read_when:
    - Stai eseguendo la configurazione al primo avvio senza l'onboarding completo della CLI
    - Vuoi impostare il percorso predefinito dello spazio di lavoro
summary: Riferimento CLI per `openclaw setup` (inizializza config + workspace)
title: Configurazione
x-i18n:
    generated_at: "2026-05-06T17:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inizializza `~/.openclaw/openclaw.json` e lo spazio di lavoro dell'agente.

<Note>
`openclaw setup` è per installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rifiuta le scritture di setup perché il file di configurazione è gestito da Nix. Gli agenti devono usare l'[Avvio rapido di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale oppure la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

Correlati:

- Per iniziare: [Per iniziare](/it/start/getting-started)
- Onboarding CLI: [Onboarding (CLI)](/it/start/wizard)

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opzioni

- `--workspace <dir>`: directory dello spazio di lavoro dell'agente (memorizzata come `agents.defaults.workspace`)
- `--wizard`: esegui l'onboarding
- `--non-interactive`: esegui l'onboarding senza prompt
- `--mode <local|remote>`: modalità di onboarding
- `--import-from <provider>`: provider di migrazione da eseguire durante l'onboarding
- `--import-source <path>`: home dell'agente sorgente per `--import-from`
- `--import-secrets`: importa i segreti supportati durante la migrazione di onboarding
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Per eseguire l'onboarding tramite setup:

```bash
openclaw setup --wizard
```

Note:

- `openclaw setup` semplice inizializza configurazione + spazio di lavoro senza il flusso completo di onboarding.
- Dopo il setup semplice, esegui `openclaw configure` per scegliere modelli, canali, Gateway, Plugin, Skills o controlli di integrità.
- L'onboarding viene eseguito automaticamente quando sono presenti flag di onboarding (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se viene rilevato uno stato Hermes, l'onboarding interattivo può offrire automaticamente la migrazione. L'onboarding di importazione richiede un setup nuovo; usa [Migra](/it/cli/migrate) per piani di dry-run, backup e modalità di sovrascrittura al di fuori dell'onboarding.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dell'installazione](/it/install)
