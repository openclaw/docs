---
read_when:
    - Esegui openclaw senza alcun comando e vuoi capire Crestodian
    - Hai bisogno di un modo sicuro senza configurazione per ispezionare o riparare OpenClaw
    - Stai progettando o abilitando la modalità di recupero per i canali di messaggistica
summary: Riferimento CLI e modello di sicurezza per Crestodian, lo strumento di supporto per l'impostazione iniziale e la riparazione, sicuro anche senza configurazione
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T08:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian è l'assistente locale di OpenClaw per configurazione iniziale, riparazione e configurazione. È
progettato per restare raggiungibile quando il normale percorso dell'agente è interrotto.

Eseguire `openclaw` senza comando avvia Crestodian in un terminale interattivo.
Eseguire `openclaw crestodian` avvia esplicitamente lo stesso assistente.

## Cosa mostra Crestodian

All'avvio, Crestodian interattivo apre la stessa shell TUI usata da
`openclaw tui`, con un backend chat di Crestodian. Il registro della chat inizia con un breve
saluto:

- quando avviare Crestodian
- il percorso del modello o del pianificatore deterministico che Crestodian sta effettivamente usando
- validità della configurazione e agente predefinito
- raggiungibilità del Gateway dal primo probe di avvio
- la prossima azione di debug che Crestodian può eseguire

Non scarica segreti né carica comandi CLI dei plugin solo per avviarsi. La TUI
fornisce comunque la normale intestazione, il registro chat, la riga di stato, il piè di pagina, il completamento automatico
e i controlli dell'editor.

Usa `status` per l'inventario dettagliato con percorso di configurazione, percorsi di documentazione/sorgente,
probe CLI locali, presenza di chiavi API, agenti, modello e dettagli del Gateway.

Crestodian usa la stessa individuazione dei riferimenti OpenClaw degli agenti normali. In un checkout Git,
punta a `docs/` locali e all'albero sorgente locale. In un'installazione da pacchetto npm,
usa la documentazione inclusa nel pacchetto e collega a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con indicazioni esplicite
a rivedere il sorgente quando la documentazione non basta.

## Esempi

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Dentro la TUI di Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Avvio sicuro

Il percorso di avvio di Crestodian è deliberatamente piccolo. Può essere eseguito quando:

- `openclaw.json` è assente
- `openclaw.json` non è valido
- il Gateway è inattivo
- la registrazione dei comandi dei plugin non è disponibile
- nessun agente è ancora stato configurato

`openclaw --help` e `openclaw --version` usano ancora i normali percorsi rapidi.
`openclaw` non interattivo esce con un breve messaggio invece di stampare l'help radice,
perché il prodotto senza comando è Crestodian.

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione in modo ad hoc.

Le operazioni di sola lettura possono essere eseguite subito:

- mostrare la panoramica
- elencare gli agenti
- elencare i plugin installati
- cercare plugin ClawHub
- mostrare lo stato di modello/backend
- eseguire controlli di stato o integrità
- controllare la raggiungibilità del Gateway
- eseguire doctor senza correzioni interattive
- validare la configurazione
- mostrare il percorso del registro di audit

Le operazioni persistenti richiedono approvazione conversazionale in modalità interattiva, a meno che
tu non passi `--yes` per un comando diretto:

- scrivere la configurazione
- eseguire `config set`
- impostare valori SecretRef supportati tramite `config set-ref`
- eseguire il bootstrap di setup/onboarding
- cambiare il modello predefinito
- avviare, arrestare o riavviare il Gateway
- creare agenti
- installare plugin da ClawHub o npm
- disinstallare plugin
- eseguire riparazioni doctor che riscrivono configurazione o stato

Le scritture applicate sono registrate in:

```text
~/.openclaw/audit/crestodian.jsonl
```

L'individuazione non viene sottoposta ad audit. Vengono registrate solo le operazioni e le scritture applicate.

`openclaw onboard --modern` avvia Crestodian come anteprima dell'onboarding moderno.
`openclaw onboard` semplice esegue ancora l'onboarding classico.

## Bootstrap di setup

`setup` è il bootstrap di onboarding chat-first. Scrive solo tramite operazioni di
configurazione tipizzate e chiede prima approvazione.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando non è configurato alcun modello, setup seleziona il primo backend utilizzabile in questo
ordine e ti comunica cosa ha scelto:

- modello esplicito esistente, se già configurato
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se non ne è disponibile nessuno, setup scrive comunque il workspace predefinito e lascia il
modello non impostato. Installa o accedi a Codex/Claude Code, oppure esponi
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, quindi esegui di nuovo setup.

## Pianificatore assistito da modello

Crestodian si avvia sempre in modalità deterministica. Per comandi imprecisi che il
parser deterministico non comprende, Crestodian locale può eseguire un singolo turno limitato del
pianificatore tramite i normali percorsi runtime di OpenClaw. Usa prima il
modello OpenClaw configurato. Se nessun modello configurato è ancora utilizzabile, può ricorrere
a runtime locali già presenti sulla macchina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Harness Codex app-server: `openai/gpt-5.5` con `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Il pianificatore assistito da modello non può mutare direttamente la configurazione. Deve tradurre la
richiesta in uno dei comandi tipizzati di Crestodian, quindi si applicano le normali regole di
approvazione e audit. Crestodian stampa il modello usato e il comando interpretato
prima di eseguire qualsiasi cosa. I turni del pianificatore di fallback senza configurazione sono
temporanei, con strumenti disabilitati dove il runtime lo supporta, e usano un
workspace/sessione temporaneo.

La modalità di recupero tramite canale di messaggistica non usa il pianificatore assistito da modello. Il recupero
remoto resta deterministico, così un normale percorso dell'agente rotto o compromesso non può
essere usato come editor di configurazione.

## Passare a un agente

Usa un selettore in linguaggio naturale per lasciare Crestodian e aprire la TUI normale:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono ancora direttamente la TUI
normale dell'agente. Non avviano Crestodian.

Dopo il passaggio alla TUI normale, usa `/crestodian` per tornare a Crestodian.
Puoi includere una richiesta successiva:

```text
/crestodian
/crestodian restart gateway
```

I passaggi di agente dentro la TUI lasciano un riferimento che indica che `/crestodian` è disponibile.

## Modalità di recupero tramite messaggi

La modalità di recupero tramite messaggi è l'entrypoint del canale di messaggistica per Crestodian. Serve per
il caso in cui il tuo agente normale sia morto, ma un canale affidabile come WhatsApp
riceva ancora comandi.

Comando di testo supportato:

- `/crestodian <request>`

Flusso operatore:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

La creazione di agenti può anche essere accodata dal prompt locale o dalla modalità di recupero:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

La modalità di recupero remoto è una superficie di amministrazione. Deve essere trattata come riparazione
remota della configurazione, non come chat normale.

Contratto di sicurezza per il recupero remoto:

- Disabilitato quando il sandboxing è attivo. Se un agente/sessione è in sandbox,
  Crestodian deve rifiutare il recupero remoto e spiegare che è richiesta una
  riparazione CLI locale.
- Lo stato effettivo predefinito è `auto`: consentire il recupero remoto solo in operazione YOLO
  fidata, dove il runtime ha già autorità locale senza sandbox.
- Richiedere un'identità proprietario esplicita. Il recupero non deve accettare regole mittente
  con caratteri jolly, policy di gruppo aperte, webhook non autenticati o canali anonimi.
- Solo DM del proprietario per impostazione predefinita. Il recupero in gruppo/canale richiede opt-in esplicito.
- Ricerca ed elenco dei plugin sono di sola lettura. L'installazione dei plugin è solo locale per impostazione predefinita
  perché scarica codice eseguibile. La disinstallazione dei plugin può essere consentita come
  operazione di riparazione approvata quando la policy di recupero permette scritture persistenti.
- Il recupero remoto non può aprire la TUI locale né passare a una sessione agente
  interattiva. Usa `openclaw` locale per il passaggio all'agente.
- Le scritture persistenti richiedono comunque approvazione, anche in modalità di recupero.
- Sottoporre ad audit ogni operazione di recupero applicata. Il recupero tramite canale di messaggistica registra metadati di canale,
  account, mittente e indirizzo sorgente. Le operazioni che mutano la configurazione registrano anche
  gli hash della configurazione prima e dopo.
- Non fare mai eco dei segreti. L'ispezione SecretRef deve segnalare la disponibilità, non
  i valori.
- Se il Gateway è attivo, preferire operazioni tipizzate del Gateway. Se il Gateway è
  morto, usare solo la superficie minima di riparazione locale che non dipende dal
  normale loop dell'agente.

Forma della configurazione:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` deve accettare:

- `"auto"`: predefinito. Consenti solo quando il runtime effettivo è YOLO e
  il sandboxing è disattivato.
- `false`: non consentire mai il recupero tramite canale di messaggistica.
- `true`: consenti esplicitamente il recupero quando i controlli su proprietario/canale passano. Questo
  non deve comunque aggirare il rifiuto per sandboxing.

La postura YOLO `"auto"` predefinita è:

- la modalità sandbox si risolve in `off`
- `tools.exec.security` si risolve in `full`
- `tools.exec.ask` si risolve in `off`

Il recupero remoto è coperto dalla lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Il fallback del pianificatore locale senza configurazione è coperto da:

```bash
pnpm test:docker:crestodian-planner
```

Uno smoke opt-in della superficie di comando del canale live controlla `/crestodian status` più un
roundtrip di approvazione persistente tramite l'handler di recupero:

```bash
pnpm test:live:crestodian-rescue-channel
```

Il setup fresco senza configurazione tramite Crestodian è coperto da:

```bash
pnpm test:docker:crestodian-first-run
```

Quella lane parte con una directory di stato vuota, instrada `openclaw` nudo a Crestodian,
imposta il modello predefinito, crea un agente aggiuntivo, configura Discord tramite
un'abilitazione plugin più SecretRef del token, valida la configurazione e controlla il registro di audit.
QA Lab ha anche uno scenario basato sul repo per lo stesso flusso Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
