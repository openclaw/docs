---
read_when:
    - Stai eseguendo la configurazione iniziale con la procedura guidata di onboarding della CLI
    - Vuoi impostare il percorso predefinito dello spazio di lavoro
    - Ti serve il flag di configurazione solo baseline per gli script
summary: Riferimento CLI per `openclaw setup` (alias per l'onboarding, con configurazione di base disponibile tramite flag)
title: Configurazione
x-i18n:
    generated_at: "2026-06-30T22:21:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Esegue il flusso completo di onboarding della CLI. `openclaw setup` è un alias di `openclaw onboard`; usa `--baseline` quando devi solo inizializzare le cartelle di configurazione/workspace senza la procedura guidata.

<Note>
`openclaw setup` è destinato alle installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw rifiuta le scritture di setup perché il file di configurazione è gestito da Nix. Usa la [Guida rapida nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale o la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

## Opzioni

| Flag                       | Descrizione                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Directory workspace dell'agente (predefinita `~/.openclaw/workspace`; archiviata come `agents.defaults.workspace`). |
| `--baseline`               | Crea le cartelle di configurazione/workspace/sessione di base senza onboarding.                          |
| `--wizard`                 | Accettato per compatibilità; il setup esegue l'onboarding per impostazione predefinita.                  |
| `--non-interactive`        | Esegue l'onboarding senza prompt.                                                                        |
| `--accept-risk`            | Conferma il rischio di accesso dell'agente all'intero sistema; richiesto con `--non-interactive`.        |
| `--mode <mode>`            | Modalità di onboarding: `local` o `remote`.                                                              |
| `--import-from <provider>` | Provider di migrazione da eseguire durante l'onboarding.                                                 |
| `--import-source <path>`   | Home dell'agente sorgente per `--import-from`.                                                           |
| `--import-secrets`         | Importa i segreti supportati durante la migrazione di onboarding.                                        |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                        |
| `--remote-token <token>`   | Token del Gateway remoto (opzionale).                                                                    |

### Modalità baseline

`openclaw setup --baseline` conserva il comportamento precedente limitato alla baseline: crea le directory di configurazione, workspace e sessione, quindi esce senza eseguire l'onboarding.

## Esempi

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Note

- Il semplice `openclaw setup` esegue lo stesso percorso guidato di `openclaw onboard`.
- Dopo il setup baseline, esegui `openclaw setup` o `openclaw onboard` per il percorso guidato completo, `openclaw configure` per modifiche mirate oppure `openclaw channels add` per aggiungere account di canale.
- Se viene rilevato lo stato di Hermes, l'onboarding interattivo può proporre automaticamente la migrazione. L'onboarding di importazione richiede un setup nuovo; usa [Migrazione](/it/cli/migrate) per piani dry-run, backup e modalità di sovrascrittura al di fuori dell'onboarding.

## Correlati

- [Riferimento CLI](/it/cli)
- [Onboarding (CLI)](/it/start/wizard)
- [Guida introduttiva](/it/start/getting-started)
- [Panoramica dell'installazione](/it/install)
