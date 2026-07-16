---
read_when:
    - Si desidera chattare con OpenClaw per la configurazione o la riparazione
    - Si sta eseguendo la configurazione iniziale con la procedura guidata di onboarding
    - Si desidera impostare il percorso predefinito dell'area di lavoro
    - È necessario il flag di configurazione solo baseline per gli script
summary: Riferimento CLI per `openclaw setup` (chat con l'agente di sistema con fallback all'onboarding)
title: Configurazione
x-i18n:
    generated_at: "2026-07-16T14:16:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` è il punto di ingresso dell'agente di sistema. In un sistema configurato, il semplice
`openclaw setup` apre una chat interattiva di OpenClaw. In un sistema nuovo,
passa all'onboarding guidato. Usare `-m`/`--message` per una singola richiesta oppure
`--baseline` per inizializzare le cartelle di configurazione/area di lavoro senza la procedura guidata.

Ordine di instradamento:

1. Qualsiasi opzione di onboarding (`--wizard`, `--baseline`, area di lavoro, reimpostazione,
   modalità non interattiva, flusso, modalità, Gateway, demone, salto, importazione, remoto oppure opzioni di
   autenticazione) esegue l'onboarding esattamente come `openclaw onboard`.
2. `-m`/`--message` oppure `--yes` esegue l'agente di sistema.
3. Senza opzioni di instradamento, un sistema interattivo configurato apre OpenClaw. Un
   sistema nuovo esegue l'onboarding. In un sistema configurato, `--json` stampa la
   panoramica del sistema anche senza TTY; un'opzione di onboarding mantiene il
   riepilogo JSON dell'onboarding.

In modalità guidata, `--workspace <dir>` è l'area di lavoro proposta a OpenClaw;
viene salvata solo dopo l'approvazione della proposta. Le configurazioni di base, classica e
non interattiva salvano l'area di lavoro fornita attraverso il rispettivo flusso normale.

Il rilevamento guidato dell'inferenza viene eseguito sull'host del Gateway su macOS o Linux. La CLI
e l'app macOS chiamano lo stesso rilevatore gestito dal Gateway, che verifica i
modelli configurati, gli accessi CLI supportati, le variabili di ambiente delle chiavi API e i
modelli Ollama o LM Studio già installati. I modelli locali non vengono mai scaricati durante questo
passaggio automatico; il candidato selezionato deve rispondere a un completamento reale prima che la
configurazione del provider e del modello venga salvata.

`setup` accetta gli stessi flag di onboarding di `openclaw onboard`, inclusi quelli di
autenticazione (`--auth-choice`, `--token`, flag delle chiavi del provider), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), reimpostazione (`--reset`, `--reset-scope`), flusso
(`--flow quickstart|advanced|manual|import`) e i flag di salto
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consultare [Onboarding](/it/cli/onboard) e
[Automazione della CLI](/it/start/wizard-cli-automation) per il riferimento completo dei flag e gli
esempi non interattivi. `openclaw onboard --modern` rimane una voce di
compatibilità per lo stesso assistente OpenClaw subordinato al rilevamento dell'inferenza.

<Note>
`openclaw setup` è destinato alle installazioni con configurazione modificabile. In modalità Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw rifiuta le scritture di configurazione perché il file di configurazione è gestito da Nix. Usare la [Guida rapida di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ufficiale oppure la configurazione sorgente equivalente per un altro pacchetto Nix.
</Note>

## Opzioni

| Flag                       | Descrizione                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Esegue una singola richiesta OpenClaw.                                                                             |
| `--yes`                    | Approva le scritture persistenti della configurazione per una richiesta `--message`.                                         |
| `--workspace <dir>`        | Proposta dell'area di lavoro in modalità guidata; salvata direttamente dalla configurazione di base, classica e non interattiva. |
| `--baseline`               | Crea le cartelle di configurazione di base, area di lavoro e sessione senza onboarding.                                  |
| `--wizard`                 | Forza l'onboarding interattivo.                                                                         |
| `--non-interactive`        | Esegue l'onboarding senza richieste.                                                                       |
| `--accept-risk`            | Conferma il rischio di accesso dell'agente all'intero sistema; obbligatorio con `--non-interactive`.                         |
| `--mode <mode>`            | Modalità di onboarding: `local` oppure `remote`.                                                                 |
| `--flow <flow>`            | Flusso di onboarding: `quickstart`, `advanced`, `manual` oppure `import`.                                        |
| `--reset`                  | Reimposta configurazione + credenziali + sessioni prima dell'onboarding (area di lavoro solo con `--reset-scope full`).   |
| `--reset-scope <scope>`    | Ambito della reimpostazione: `config`, `config+creds+sessions` oppure `full`.                                            |
| `--import-from <provider>` | Provider di migrazione da eseguire durante l'onboarding.                                                          |
| `--import-source <path>`   | Directory principale dell'agente sorgente per `--import-from`.                                                                |
| `--import-secrets`         | Importa i segreti supportati durante la migrazione dell'onboarding.                                                 |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                         |
| `--remote-token <token>`   | Token del Gateway remoto (facoltativo).                                                                      |
| `--json`                   | Sistema configurato: panoramica di OpenClaw. Percorso di onboarding: riepilogo dell'onboarding.                           |

`--classic` e `--non-interactive` si escludono a vicenda: la modalità classica apre la
procedura guidata con richieste, mentre la configurazione non interattiva usa il percorso di automazione.

### Modalità di base

`openclaw setup --baseline` mantiene il precedente comportamento limitato alla configurazione di base:
crea le directory di configurazione, dell'area di lavoro e delle sessioni, quindi termina senza
eseguire l'onboarding.

## Esempi

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Note

- Dopo la configurazione di base, eseguire `openclaw onboard` per il percorso guidato completo, `openclaw configure` per modifiche mirate oppure `openclaw channels add` per aggiungere account di canale.
- Se viene rilevato lo stato di Hermes, l'onboarding interattivo può proporre automaticamente la migrazione. L'onboarding di importazione richiede una nuova configurazione; usare [Migrazione](/it/cli/migrate) per piani di simulazione, backup e modalità di sovrascrittura al di fuori dell'onboarding.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Onboarding](/it/cli/onboard)
- [Onboarding (CLI)](/it/start/wizard)
- [Guida introduttiva](/it/start/getting-started)
- [Panoramica dell'installazione](/it/install)
