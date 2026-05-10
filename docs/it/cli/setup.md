---
read_when:
    - Stai eseguendo la configurazione al primo avvio senza l'onboarding completo della CLI
    - Si desidera impostare il percorso predefinito dell'area di lavoro
    - Ti servono tutti i flag e il modo in cui setup decide tra la modalità baseline e la modalità wizard
summary: Riferimento CLI per `openclaw setup` (inizializza la configurazione e lo spazio di lavoro, esegue facoltativamente la procedura di avvio iniziale)
title: Configurazione
x-i18n:
    generated_at: "2026-05-10T19:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inizializza la configurazione di base e il workspace dell'agente. Con qualsiasi opzione di configurazione iniziale presente, esegue anche la procedura guidata.

<Note>
`openclaw setup` è destinato alle installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw rifiuta le scritture di setup perché il file di configurazione è gestito da Nix. Usa la [Guida rapida nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale o la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

## Opzioni

| Opzione                    | Descrizione                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Directory del workspace dell'agente (predefinita `~/.openclaw/workspace`; salvata come `agents.defaults.workspace`). |
| `--wizard`                 | Esegue la configurazione iniziale interattiva.                                                                 |
| `--non-interactive`        | Esegue la configurazione iniziale senza prompt.                                                                |
| `--mode <mode>`            | Modalità di configurazione iniziale: `local` o `remote`.                                                       |
| `--import-from <provider>` | Provider di migrazione da eseguire durante la configurazione iniziale.                                         |
| `--import-source <path>`   | Home dell'agente sorgente per `--import-from`.                                                                 |
| `--import-secrets`         | Importa i segreti supportati durante la migrazione della configurazione iniziale.                              |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                              |
| `--remote-token <token>`   | Token del Gateway remoto (facoltativo).                                                                        |

### Avvio automatico della procedura guidata

`openclaw setup` esegue la procedura guidata quando una di queste opzioni è esplicitamente presente, anche senza `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Note

- Il semplice `openclaw setup` inizializza configurazione e workspace senza eseguire il flusso completo di configurazione iniziale.
- Dopo il setup semplice, esegui `openclaw onboard` per il percorso guidato completo, `openclaw configure` per modifiche mirate oppure `openclaw channels add` per aggiungere account di canale.
- Se viene rilevato lo stato di Hermes, la configurazione iniziale interattiva può proporre automaticamente la migrazione. La configurazione iniziale con importazione richiede un setup nuovo; usa [Migra](/it/cli/migrate) per piani di simulazione, backup e modalità di sovrascrittura al di fuori della configurazione iniziale.

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione iniziale (CLI)](/it/start/wizard)
- [Primi passi](/it/start/getting-started)
- [Panoramica dell'installazione](/it/install)
