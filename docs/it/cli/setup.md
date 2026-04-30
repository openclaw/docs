---
read_when:
    - Stai eseguendo la configurazione al primo avvio senza l’onboarding completo della CLI
    - Vuoi impostare il percorso predefinito dell'area di lavoro
summary: Riferimento CLI per `openclaw setup` (inizializza configurazione + area di lavoro)
title: Configurazione
x-i18n:
    generated_at: "2026-04-30T08:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inizializza `~/.openclaw/openclaw.json` e l'area di lavoro dell'agente.

Correlato:

- Introduzione: [Introduzione](/it/start/getting-started)
- Configurazione iniziale CLI: [Configurazione iniziale (CLI)](/it/start/wizard)

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opzioni

- `--workspace <dir>`: directory dell'area di lavoro dell'agente (archiviata come `agents.defaults.workspace`)
- `--wizard`: esegui la configurazione iniziale
- `--non-interactive`: esegui la configurazione iniziale senza prompt
- `--mode <local|remote>`: modalità di configurazione iniziale
- `--import-from <provider>`: fornitore di migrazione da eseguire durante la configurazione iniziale
- `--import-source <path>`: home dell'agente di origine per `--import-from`
- `--import-secrets`: importa i segreti supportati durante la migrazione della configurazione iniziale
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Per eseguire la configurazione iniziale tramite setup:

```bash
openclaw setup --wizard
```

Note:

- Il semplice `openclaw setup` inizializza configurazione e area di lavoro senza il flusso completo di configurazione iniziale.
- La configurazione iniziale viene eseguita automaticamente quando sono presenti flag di configurazione iniziale (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se viene rilevato uno stato di Hermes, la configurazione iniziale interattiva può proporre automaticamente la migrazione. La configurazione iniziale con importazione richiede una configurazione nuova; usa [Migra](/it/cli/migrate) per piani di simulazione, backup e modalità di sovrascrittura fuori dalla configurazione iniziale.

## Correlato

- [Riferimento CLI](/it/cli)
- [Panoramica dell'installazione](/it/install)
