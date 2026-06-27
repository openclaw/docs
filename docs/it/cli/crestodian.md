---
read_when:
    - Esegui openclaw senza alcun comando dopo la configurazione e vuoi comprendere Crestodian
    - Ti serve un modo sicuro senza configurazione per ispezionare o riparare OpenClaw
    - Stai progettando o abilitando la modalità di soccorso per i canali di messaggistica
summary: Riferimento CLI e modello di sicurezza per Crestodian, l'assistente di configurazione e riparazione sicuro senza configurazione
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian è l'assistente locale di OpenClaw per configurazione, riparazione e impostazione. È
progettato per rimanere raggiungibile quando il normale percorso dell'agente è interrotto.

L'esecuzione di `openclaw` senza comando avvia prima l'onboarding classico quando il
file di configurazione attivo manca o non contiene impostazioni definite dall'utente (vuoto o
solo metadati). Dopo che un file di configurazione contiene impostazioni definite dall'utente, l'esecuzione di `openclaw`
senza comando avvia Crestodian in un terminale interattivo. L'esecuzione di
`openclaw crestodian` avvia esplicitamente lo stesso assistente.

## Cosa mostra Crestodian

All'avvio, Crestodian interattivo apre la stessa shell TUI usata da
`openclaw tui`, con un backend di chat Crestodian. Il registro della chat inizia con un breve
saluto:

- quando avviare Crestodian
- il modello o il percorso del pianificatore deterministico che Crestodian sta effettivamente usando
- validità della configurazione e agente predefinito
- raggiungibilità del Gateway dal primo probe di avvio
- la prossima azione di debug che Crestodian può eseguire

Non scarica segreti né carica comandi CLI dei Plugin solo per avviarsi. La TUI
fornisce ancora la normale intestazione, il registro della chat, la riga di stato, il piè di pagina, il completamento automatico
e i controlli dell'editor.

Usa `status` per l'inventario dettagliato con percorso della configurazione, percorsi docs/sorgente,
probe CLI locali, presenza di chiavi API, agenti, modello e dettagli del Gateway.

Crestodian usa la stessa scoperta dei riferimenti OpenClaw degli agenti normali. In un checkout Git,
punta ai `docs/` locali e all'albero sorgente locale. In un'installazione del pacchetto npm, usa
la documentazione del pacchetto inclusa e collega a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con indicazioni esplicite
a consultare il sorgente quando la documentazione non basta.

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

Il percorso di avvio di Crestodian è deliberatamente ridotto. Può essere eseguito quando:

- `openclaw.json` manca
- `openclaw.json` non è valido
- il Gateway non è attivo
- la registrazione dei comandi dei Plugin non è disponibile
- nessun agente è ancora stato configurato

`openclaw --help` e `openclaw --version` usano ancora i normali percorsi rapidi.
`openclaw` semplice non interattivo esce con un breve messaggio invece di stampare
l'help radice. Su una nuova installazione, il messaggio indirizza all'onboarding non interattivo;
dopo la configurazione, indirizza ai comandi Crestodian one-shot.

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione ad hoc.

Le operazioni in sola lettura possono essere eseguite immediatamente:

- mostrare la panoramica
- elencare gli agenti
- elencare i Plugin installati
- cercare Plugin ClawHub
- mostrare lo stato di modello/backend
- eseguire controlli di stato o integrità
- verificare la raggiungibilità del Gateway
- eseguire doctor senza correzioni interattive
- validare la configurazione
- mostrare il percorso del registro di audit

Le operazioni persistenti richiedono approvazione conversazionale in modalità interattiva, a meno che
tu non passi `--yes` per un comando diretto:

- scrivere la configurazione
- eseguire `config set`
- impostare valori SecretRef supportati tramite `config set-ref`
- eseguire bootstrap di configurazione/onboarding
- cambiare il modello predefinito
- avviare, arrestare o riavviare il Gateway
- creare agenti
- installare Plugin da ClawHub o npm
- disinstallare Plugin
- eseguire riparazioni doctor che riscrivono configurazione o stato

Le scritture applicate sono registrate in:

```text
~/.openclaw/audit/crestodian.jsonl
```

La scoperta non è sottoposta ad audit. Vengono registrate solo le operazioni applicate e le scritture.

`openclaw onboard --modern` avvia Crestodian come anteprima dell'onboarding moderno.
`openclaw onboard` semplice esegue ancora l'onboarding classico.

## Bootstrap di configurazione

`setup` è il bootstrap di onboarding chat-first. Scrive solo tramite operazioni di
configurazione tipizzate e chiede prima l'approvazione.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando nessun modello è configurato, setup seleziona il primo backend utilizzabile in questo
ordine e indica cosa ha scelto:

- modello esplicito esistente, se già configurato
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- CLI Claude Code -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` tramite l'harness app-server Codex

Se nessuno è disponibile, setup scrive comunque il workspace predefinito e lascia il
modello non impostato. Installa o accedi a Codex/Claude Code, oppure esponi
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, poi esegui di nuovo setup.

## Pianificatore Assistito dal Modello

Crestodian si avvia sempre in modalità deterministica. Per comandi fuzzy che il
parser deterministico non comprende, Crestodian locale può effettuare un singolo turno di
pianificazione limitato tramite i normali percorsi runtime di OpenClaw. Usa prima il
modello OpenClaw configurato. Se nessun modello configurato è ancora utilizzabile, può
ripiegare su runtime locali già presenti sulla macchina:

- CLI Claude Code: `claude-cli/claude-opus-4-8`
- harness app-server Codex: `openai/gpt-5.5`

Il pianificatore assistito dal modello non può modificare direttamente la configurazione. Deve tradurre la
richiesta in uno dei comandi tipizzati di Crestodian, poi si applicano le normali regole di approvazione e
audit. Crestodian stampa il modello usato e il comando interpretato
prima di eseguire qualsiasi cosa. I turni del pianificatore fallback senza configurazione sono
temporanei, con strumenti disabilitati dove il runtime lo supporta, e usano un
workspace/sessione temporaneo.

La modalità di recupero del canale messaggi non usa il pianificatore assistito dal modello. Il recupero remoto
rimane deterministico così un percorso agente normale interrotto o compromesso non può
essere usato come editor di configurazione.

## Passare a un agente

Usa un selettore in linguaggio naturale per lasciare Crestodian e aprire la TUI normale:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono ancora direttamente la TUI
dell'agente normale. Non avviano Crestodian.

Dopo il passaggio alla TUI normale, usa `/crestodian` per tornare a Crestodian.
Puoi includere una richiesta di follow-up:

```text
/crestodian
/crestodian restart gateway
```

I passaggi tra agenti dentro la TUI lasciano un'indicazione che `/crestodian` è disponibile.

## Modalità di recupero messaggi

La modalità di recupero messaggi è l'entrypoint del canale messaggi per Crestodian. È pensata per
il caso in cui il tuo agente normale è inattivo, ma un canale attendibile come WhatsApp
riceve ancora comandi.

Comando di testo supportato:

- `/crestodian <request>`

Flusso operatore:

```text
Tu, in un DM proprietario attendibile: /crestodian status
OpenClaw: Modalità di recupero Crestodian. Gateway raggiungibile: no. Configurazione valida: no.
Tu: /crestodian restart gateway
OpenClaw: Piano: riavviare il Gateway. Rispondi /crestodian yes per applicare.
Tu: /crestodian yes
OpenClaw: Applicato. Voce di audit scritta.
```

La creazione di agenti può anche essere accodata dal prompt locale o dalla modalità di recupero:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

La modalità di recupero remoto è una superficie di amministrazione. Deve essere trattata come riparazione remota della configurazione,
non come chat normale.

Contratto di sicurezza per il recupero remoto:

- Disabilitato quando il sandboxing è attivo. Se un agente/sessione è in sandbox,
  Crestodian deve rifiutare il recupero remoto e spiegare che è richiesta la riparazione CLI locale.
- Lo stato effettivo predefinito è `auto`: consentire il recupero remoto solo in operazione YOLO attendibile,
  dove il runtime ha già autorità locale non sottoposta a sandbox.
- Richiedere un'identità proprietario esplicita. Il recupero non deve accettare regole mittente
  jolly, policy di gruppi aperti, Webhook non autenticati o canali anonimi.
- DM proprietario soltanto per impostazione predefinita. Il recupero in gruppi/canali richiede opt-in esplicito.
- La ricerca e l'elenco dei Plugin sono in sola lettura. L'installazione dei Plugin è solo locale per impostazione predefinita
  perché scarica codice eseguibile. La disinstallazione dei Plugin può essere consentita come
  operazione di riparazione approvata quando la policy di recupero permette scritture persistenti.
- Il recupero remoto non può aprire la TUI locale né passare a una sessione agente
  interattiva. Usa `openclaw` locale per il passaggio all'agente.
- Le scritture persistenti richiedono ancora approvazione, anche in modalità di recupero.
- Sottoporre ad audit ogni operazione di recupero applicata. Il recupero tramite canale messaggi registra metadati di canale,
  account, mittente e indirizzo sorgente. Le operazioni che modificano la configurazione registrano anche
  gli hash della configurazione prima e dopo.
- Non mostrare mai segreti. L'ispezione di SecretRef deve riportare la disponibilità, non
  i valori.
- Se il Gateway è attivo, preferire operazioni tipizzate del Gateway. Se il Gateway è
  inattivo, usare solo la superficie minima di riparazione locale che non dipende dal
  loop dell'agente normale.

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

- `"auto"`: predefinito. Consentire solo quando il runtime effettivo è YOLO e
  il sandboxing è disattivato.
- `false`: non consentire mai il recupero tramite canale messaggi.
- `true`: consentire esplicitamente il recupero quando i controlli proprietario/canale passano. Questo
  non deve comunque aggirare il rifiuto dovuto al sandboxing.

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

Uno smoke opt-in della superficie comandi del canale live controlla `/crestodian status` più un
roundtrip di approvazione persistente tramite l'handler di recupero:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configurazione senza config tramite comandi Crestodian espliciti è coperta da:

```bash
pnpm test:docker:crestodian-first-run
```

Quella lane parte con una directory di stato vuota, verifica l'entrypoint Crestodian di onboard moderno,
imposta il modello predefinito, crea un agente aggiuntivo, configura
Discord tramite un'abilitazione Plugin più token SecretRef, valida la configurazione e
controlla il registro di audit. QA Lab ha anche uno scenario basato sul repo per lo stesso flusso Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
