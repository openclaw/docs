---
read_when:
    - Stai eseguendo la configurazione iniziale con la procedura guidata di onboarding della CLI
    - Vuoi impostare il percorso predefinito dell'area di lavoro
    - Ti serve il flag di configurazione solo baseline per gli script
summary: Riferimento della CLI per `openclaw setup` (alias per la configurazione iniziale, con configurazione di base disponibile tramite flag)
title: Configurazione
x-i18n:
    generated_at: "2026-07-12T06:55:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` esegue lo stesso flusso guidato di configurazione iniziale di `openclaw onboard`:
prima verifica e salva in modo persistente l'inferenza, quindi avvia Crestodian per configurare
lo spazio di lavoro, il Gateway, i canali, le Skills e lo stato di integrità. Usa `--baseline` quando
devi soltanto inizializzare le cartelle di configurazione e dello spazio di lavoro senza la procedura guidata.

In modalità guidata, `--workspace <dir>` è lo spazio di lavoro proposto a Crestodian;
viene salvato in modo persistente solo dopo l'approvazione della proposta. Le configurazioni di base, classica e
non interattiva salvano in modo persistente lo spazio di lavoro specificato tramite il rispettivo flusso normale.

`setup` accetta le stesse opzioni di configurazione iniziale di `openclaw onboard`, incluse
quelle per l'autenticazione (`--auth-choice`, `--token`, opzioni per le chiavi dei provider), il Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), il ripristino (`--reset`, `--reset-scope`), il flusso
(`--flow quickstart|advanced|manual|import`) e le opzioni per ignorare passaggi
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulta [Configurazione iniziale](/it/cli/onboard) e
[Automazione della CLI](/it/start/wizard-cli-automation) per l'elenco completo delle opzioni e
gli esempi non interattivi. `openclaw onboard --modern` è l'alias di compatibilità
per l'assistente Crestodian subordinato alla verifica dell'inferenza e non ha un equivalente in `setup`.

<Note>
`openclaw setup` è destinato alle installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw rifiuta le scritture della configurazione perché il file di configurazione è gestito da Nix. Usa la [Guida rapida di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale o la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

## Opzioni

| Opzione                    | Descrizione                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Proposta dello spazio di lavoro in modalità guidata; salvata direttamente dalla configurazione di base, classica e non interattiva. |
| `--baseline`               | Crea le cartelle di base per configurazione, spazio di lavoro e sessioni senza la configurazione iniziale.        |
| `--wizard`                 | Accettata per compatibilità; la configurazione esegue quella iniziale per impostazione predefinita.               |
| `--non-interactive`        | Esegue la configurazione iniziale senza richieste interattive.                                                    |
| `--accept-risk`            | Conferma la consapevolezza del rischio di accesso dell'agente all'intero sistema; obbligatoria con `--non-interactive`. |
| `--mode <mode>`            | Modalità di configurazione iniziale: `local` o `remote`.                                                          |
| `--flow <flow>`            | Flusso di configurazione iniziale: `quickstart`, `advanced`, `manual` o `import`.                                 |
| `--reset`                  | Reimposta configurazione, credenziali e sessioni prima della configurazione iniziale (lo spazio di lavoro solo con `--reset-scope full`). |
| `--reset-scope <scope>`    | Ambito del ripristino: `config`, `config+creds+sessions` o `full`.                                                |
| `--import-from <provider>` | Provider di migrazione da eseguire durante la configurazione iniziale.                                            |
| `--import-source <path>`   | Directory principale dell'agente sorgente per `--import-from`.                                                   |
| `--import-secrets`         | Importa i segreti supportati durante la migrazione della configurazione iniziale.                                 |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                                 |
| `--remote-token <token>`   | Token del Gateway remoto (facoltativo).                                                                           |
| `--json`                   | Restituisce un riepilogo JSON.                                                                                    |

`--classic` e `--non-interactive` si escludono a vicenda: la modalità classica apre la
procedura guidata interattiva, mentre la configurazione non interattiva usa il percorso di automazione.

### Modalità di base

`openclaw setup --baseline` conserva il precedente comportamento limitato alla configurazione di base:
crea le directory di configurazione, dello spazio di lavoro e delle sessioni, quindi termina senza
eseguire la configurazione iniziale.

## Esempi

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Note

- Dopo la configurazione di base, esegui `openclaw setup` o `openclaw onboard` per completare l'intero percorso guidato, `openclaw configure` per modifiche mirate oppure `openclaw channels add` per aggiungere account dei canali.
- Se viene rilevato lo stato di Hermes, la configurazione iniziale interattiva può proporre automaticamente la migrazione. La configurazione iniziale mediante importazione richiede una nuova configurazione; usa [Migrazione](/it/cli/migrate) per piani di simulazione, backup e modalità di sovrascrittura al di fuori della configurazione iniziale.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Configurazione iniziale](/it/cli/onboard)
- [Configurazione iniziale (CLI)](/it/start/wizard)
- [Introduzione](/it/start/getting-started)
- [Panoramica dell'installazione](/it/install)
