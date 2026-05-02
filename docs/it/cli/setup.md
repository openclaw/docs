---
read_when:
    - Stai eseguendo la configurazione al primo avvio senza la procedura guidata completa della CLI
    - Vuoi impostare il percorso predefinito dell'area di lavoro
summary: Riferimento CLI per `openclaw setup` (inizializza configurazione + area di lavoro)
title: Configurazione
x-i18n:
    generated_at: "2026-05-02T20:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inizializza `~/.openclaw/openclaw.json` e l'area di lavoro dell'agente.

Correlati:

- Primi passi: [Primi passi](/it/start/getting-started)
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

- `--workspace <dir>`: directory dell'area di lavoro dell'agente (memorizzata come `agents.defaults.workspace`)
- `--wizard`: esegue la configurazione iniziale
- `--non-interactive`: esegue la configurazione iniziale senza prompt
- `--mode <local|remote>`: modalità di configurazione iniziale
- `--import-from <provider>`: provider di migrazione da eseguire durante la configurazione iniziale
- `--import-source <path>`: home dell'agente sorgente per `--import-from`
- `--import-secrets`: importa i segreti supportati durante la migrazione della configurazione iniziale
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Per eseguire la configurazione iniziale tramite setup:

```bash
openclaw setup --wizard
```

Note:

- Il semplice `openclaw setup` inizializza configurazione + area di lavoro senza il flusso completo di configurazione iniziale.
- Dopo il setup semplice, esegui `openclaw configure` per scegliere modelli, canali, Gateway, plugin, Skills o controlli di integrità.
- La configurazione iniziale viene eseguita automaticamente quando è presente qualsiasi flag di configurazione iniziale (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se viene rilevato lo stato di Hermes, la configurazione iniziale interattiva può offrire automaticamente la migrazione. La configurazione iniziale di importazione richiede un setup nuovo; usa [Migra](/it/cli/migrate) per piani di simulazione, backup e modalità di sovrascrittura al di fuori della configurazione iniziale.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dell'installazione](/it/install)
