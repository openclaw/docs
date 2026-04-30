---
read_when:
    - Esegui openclaw senza specificare un comando e vuoi capire Crestodian
    - È necessario un modo sicuro anche senza configurazione per ispezionare o riparare OpenClaw
    - Stai progettando o abilitando la modalità di recupero del canale di messaggi
summary: Riferimento CLI e modello di sicurezza per Crestodian, lo strumento di configurazione e riparazione sicuro per l’uso senza configurazione
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T08:42:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian è l'helper locale di OpenClaw per configurazione iniziale, riparazione e configurazione. È
progettato per restare raggiungibile quando il normale percorso dell'agente è interrotto.

Eseguire `openclaw` senza comando avvia Crestodian in un terminale interattivo.
Eseguire `openclaw crestodian` avvia esplicitamente lo stesso helper.

## Cosa mostra Crestodian

All'avvio, Crestodian interattivo apre la stessa shell TUI usata da
`openclaw tui`, con un backend chat Crestodian. Il registro della chat inizia con un breve
saluto:

- quando avviare Crestodian
- il modello o il percorso del pianificatore deterministico che Crestodian sta effettivamente usando
- validità della configurazione e agente predefinito
- raggiungibilità del Gateway dal primo probe di avvio
- la prossima azione di debug che Crestodian può eseguire

Non scarica segreti né carica comandi CLI dei plugin solo per avviarsi. La TUI
fornisce comunque la normale intestazione, il registro chat, la riga di stato, il piè di pagina, il completamento automatico
e i controlli dell'editor.

Usa `status` per l'inventario dettagliato con percorso della configurazione, percorsi di documentazione/sorgente,
probe CLI locali, presenza di chiavi API, agenti, modello e dettagli del Gateway.

Crestodian usa lo stesso rilevamento dei riferimenti OpenClaw degli agenti normali. In un checkout Git,
punta a `docs/` locale e all'albero sorgente locale. In un'installazione da pacchetto npm, usa
la documentazione inclusa nel pacchetto e collega a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con indicazioni esplicite
di rivedere il sorgente quando la documentazione non è sufficiente.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Avvio sicuro

Il percorso di avvio di Crestodian è volutamente ridotto. Può funzionare quando:

- `openclaw.json` manca
- `openclaw.json` non è valido
- il Gateway non è attivo
- la registrazione dei comandi dei plugin non è disponibile
- non è ancora stato configurato alcun agente

`openclaw --help` e `openclaw --version` usano comunque i normali percorsi rapidi.
`openclaw` non interattivo esce con un breve messaggio invece di stampare l'help radice,
perché il prodotto senza comando è Crestodian.

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione ad hoc.

Le operazioni in sola lettura possono essere eseguite subito:

- mostrare panoramica
- elencare agenti
- mostrare stato di modello/backend
- eseguire controlli di stato o salute
- verificare la raggiungibilità del Gateway
- eseguire doctor senza correzioni interattive
- validare configurazione
- mostrare il percorso del registro di audit

Le operazioni persistenti richiedono approvazione conversazionale in modalità interattiva, a meno che
tu non passi `--yes` per un comando diretto:

- scrivere configurazione
- eseguire `config set`
- impostare valori SecretRef supportati tramite `config set-ref`
- eseguire bootstrap di configurazione iniziale/onboarding
- cambiare il modello predefinito
- avviare, arrestare o riavviare il Gateway
- creare agenti
- eseguire riparazioni doctor che riscrivono configurazione o stato

Le scritture applicate sono registrate in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Il rilevamento non viene sottoposto ad audit. Vengono registrate solo le operazioni applicate e le scritture.

`openclaw onboard --modern` avvia Crestodian come anteprima dell'onboarding moderno.
`openclaw onboard` semplice esegue ancora l'onboarding classico.

## Bootstrap della configurazione iniziale

`setup` è il bootstrap di onboarding chat-first. Scrive solo tramite operazioni
di configurazione tipizzate e chiede prima l'approvazione.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando nessun modello è configurato, setup seleziona il primo backend utilizzabile in questo
ordine e ti comunica cosa ha scelto:

- modello esplicito esistente, se già configurato
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se nessuno è disponibile, setup scrive comunque lo workspace predefinito e lascia il
modello non impostato. Installa Codex/Claude Code o accedi, oppure esponi
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, poi esegui di nuovo setup.

## Pianificatore assistito dal modello

Crestodian parte sempre in modalità deterministica. Per comandi approssimativi che il
parser deterministico non comprende, Crestodian locale può effettuare un solo turno
limitato del pianificatore tramite i normali percorsi runtime di OpenClaw. Usa prima il
modello OpenClaw configurato. Se nessun modello configurato è ancora utilizzabile, può
ripiegare sui runtime locali già presenti sulla macchina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server Codex: `openai/gpt-5.5` con `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Il pianificatore assistito dal modello non può modificare direttamente la configurazione. Deve tradurre la
richiesta in uno dei comandi tipizzati di Crestodian, poi si applicano le normali regole di
approvazione e audit. Crestodian stampa il modello usato e il comando interpretato
prima di eseguire qualsiasi cosa. I turni del pianificatore fallback senza configurazione sono
temporanei, con strumenti disabilitati dove il runtime lo supporta, e usano uno
workspace/sessione temporaneo.

La modalità di recupero da canale di messaggistica non usa il pianificatore assistito dal modello. Il recupero
remoto resta deterministico, così un percorso normale dell'agente interrotto o compromesso non può
essere usato come editor di configurazione.

## Passare a un agente

Usa un selettore in linguaggio naturale per uscire da Crestodian e aprire la normale TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono comunque direttamente la normale
TUI dell'agente. Non avviano Crestodian.

Dopo il passaggio alla normale TUI, usa `/crestodian` per tornare a Crestodian.
Puoi includere una richiesta di follow-up:

```text
/crestodian
/crestodian restart gateway
```

I passaggi tra agenti dentro la TUI lasciano un'indicazione che `/crestodian` è disponibile.

## Modalità di recupero da messaggi

La modalità di recupero da messaggi è l'entrypoint del canale di messaggistica per Crestodian. È pensata per
il caso in cui il tuo agente normale è morto, ma un canale fidato come WhatsApp
riceve ancora comandi.

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
remota della configurazione, non come una chat normale.

Contratto di sicurezza per il recupero remoto:

- Disabilitata quando il sandboxing è attivo. Se un agente/sessione è in sandbox,
  Crestodian deve rifiutare il recupero remoto e spiegare che è necessaria
  una riparazione tramite CLI locale.
- Lo stato effettivo predefinito è `auto`: consentire il recupero remoto solo in operazioni YOLO
  fidate, dove il runtime ha già autorità locale senza sandbox.
- Richiedere un'identità proprietario esplicita. Il recupero non deve accettare regole sender
  wildcard, criteri di gruppo aperti, webhook non autenticati o canali anonimi.
- DM del proprietario per impostazione predefinita. Il recupero da gruppo/canale richiede opt-in esplicito.
- Il recupero remoto non può aprire la TUI locale né passare a una sessione
  agente interattiva. Usa `openclaw` locale per il passaggio all'agente.
- Le scritture persistenti richiedono comunque approvazione, anche in modalità recupero.
- Sottoporre ad audit ogni operazione di recupero applicata. Il recupero da canale di messaggistica registra metadati
  di canale, account, sender e indirizzo sorgente. Le operazioni che modificano la configurazione registrano anche
  gli hash della configurazione prima e dopo.
- Non mostrare mai segreti. L'ispezione SecretRef dovrebbe indicare la disponibilità, non
  i valori.
- Se il Gateway è vivo, preferire le operazioni tipizzate del Gateway. Se il Gateway è
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

`enabled` dovrebbe accettare:

- `"auto"`: predefinito. Consentire solo quando il runtime effettivo è YOLO e
  il sandboxing è disattivato.
- `false`: non consentire mai il recupero da canale di messaggistica.
- `true`: consentire esplicitamente il recupero quando i controlli su proprietario/canale passano. Questo
  comunque non deve aggirare il rifiuto per sandboxing.

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

Uno smoke opt-in della superficie comandi del canale live verifica `/crestodian status` più un
roundtrip di approvazione persistente tramite l'handler di recupero:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configurazione iniziale fresca senza configurazione tramite Crestodian è coperta da:

```bash
pnpm test:docker:crestodian-first-run
```

Quella lane parte con una directory di stato vuota, instrada `openclaw` semplice a Crestodian,
imposta il modello predefinito, crea un agente aggiuntivo, configura Discord tramite
l'abilitazione di un plugin più SecretRef del token, valida la configurazione e controlla il registro di audit.
QA Lab ha anche uno scenario basato su repo per lo stesso flusso Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
