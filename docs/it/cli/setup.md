---
read_when:
    - Stai eseguendo la configurazione iniziale senza l'onboarding completo della CLI
    - Vuoi impostare il percorso predefinito dell'area di lavoro
    - Ti servono tutti i flag e sapere come la configurazione decide tra modalità di base e modalità guidata
summary: Riferimento CLI per `openclaw setup` (inizializza la configurazione e l'area di lavoro, esegue facoltativamente l'onboarding)
title: Configurazione
x-i18n:
    generated_at: "2026-06-27T17:22:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inizializza la configurazione di base e lo spazio di lavoro dell’agente. Con qualsiasi flag di onboarding presente, esegue anche la procedura guidata.

<Note>
`openclaw setup` è per installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw rifiuta le scritture di setup perché il file di configurazione è gestito da Nix. Usa la [Guida rapida nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale o la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

## Opzioni

| Flag                       | Descrizione                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Directory dello spazio di lavoro dell’agente (predefinita `~/.openclaw/workspace`; memorizzata come `agents.defaults.workspace`). |
| `--wizard`                 | Esegui l’onboarding interattivo.                                                                         |
| `--non-interactive`        | Esegui l’onboarding senza prompt.                                                                     |
| `--accept-risk`            | Riconosci il rischio di accesso dell’agente all’intero sistema; richiesto con `--non-interactive`.                       |
| `--mode <mode>`            | Modalità di onboarding: `local` o `remote`.                                                               |
| `--import-from <provider>` | Provider di migrazione da eseguire durante l’onboarding.                                                        |
| `--import-source <path>`   | Home dell’agente sorgente per `--import-from`.                                                              |
| `--import-secrets`         | Importa i segreti supportati durante la migrazione di onboarding.                                               |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                       |
| `--remote-token <token>`   | Token del Gateway remoto (facoltativo).                                                                    |

### Attivazione automatica della procedura guidata

`openclaw setup` esegue la procedura guidata quando uno qualsiasi di questi flag è esplicitamente presente, anche senza `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Esempi

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Note

- Il semplice `openclaw setup` inizializza la configurazione e lo spazio di lavoro senza eseguire il flusso completo di onboarding.
- Dopo il setup semplice, esegui `openclaw onboard` per il percorso guidato completo, `openclaw configure` per modifiche mirate, oppure `openclaw channels add` per aggiungere account di canale.
- Se viene rilevato lo stato di Hermes, l’onboarding interattivo può offrire automaticamente la migrazione. L’onboarding di importazione richiede un setup nuovo; usa [Migra](/it/cli/migrate) per piani di prova, backup e modalità di sovrascrittura fuori dall’onboarding.

## Correlati

- [Riferimento CLI](/it/cli)
- [Onboarding (CLI)](/it/start/wizard)
- [Primi passi](/it/start/getting-started)
- [Panoramica dell’installazione](/it/install)
