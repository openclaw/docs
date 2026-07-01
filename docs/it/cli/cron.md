---
read_when:
    - Vuoi processi pianificati e risvegli
    - Stai eseguendo il debug dell'esecuzione cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianifica ed esegui processi in background)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:07:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i processi Cron per il pianificatore del Gateway.

<Tip>
Esegui `openclaw cron --help` per l'elenco completo dei comandi. Consulta [Processi Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Creare processi rapidamente

`openclaw cron create` è un alias di `openclaw cron add`. Per i nuovi processi, inserisci prima la pianificazione e poi il prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` quando il processo deve inviare con POST il payload completato invece di consegnarlo a una destinazione chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` per processi deterministici in stile shell che devono essere eseguiti dentro OpenClaw cron senza avviare un'esecuzione isolata di agente/modello:

<Note>
I processi Cron di comando sono automazioni del Gateway create dagli amministratori. Crearli, modificarli,
rimuoverli o eseguirli manualmente richiede `operator.admin`; l'esecuzione pianificata
viene poi eseguita nel processo Gateway, non come chiamata allo strumento `tools.exec` di un agente.
`tools.exec.*` e le approvazioni exec continuano a governare gli strumenti exec visibili al modello.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` memorizza `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` per un'esecuzione argv esatta. I processi di comando acquisiscono stdout/stderr, registrano la normale cronologia Cron e instradano l'output tramite le stesse modalità di consegna `announce`, `webhook` o `none` dei processi isolati. Un comando che stampa solo `NO_REPLY` viene soppresso.

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un nuovo id sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto della conversazione ambientale. Instradamento di canale e gruppo, criterio di invio/coda, elevazione, origine e associazione del runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di consegna risolta. Per `channel: "last"`, l'anteprima indica se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

Le destinazioni con prefisso del provider possono disambiguare i canali di annuncio non risolti. Per esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o è `last`. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` restano sintassi di destinazione di proprietà del canale.

<Note>
I processi `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat dei Cron isolati è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` consegna come fallback la risposta finale solo quando l'agente non ha inviato direttamente alla destinazione risolta.
- `webhook` invia con POST il payload completato a un URL.
- `none` disabilita la consegna fallback del runner.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` per impostare la consegna Webhook. Non combinare `--webhook` con flag di consegna chat come `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` può annullare singoli campi di instradamento della consegna con `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (ciascuno viene rifiutato se combinato con il flag di impostazione corrispondente). A differenza di `--no-deliver`, che disabilita solo la consegna fallback del runner, questi rimuovono il campo memorizzato così che il processo risolva di nuovo quella parte della route dai valori predefiniti.

`--announce` è la consegna fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva conservano la destinazione di consegna della chat live per la consegna announce fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider con distinzione tra maiuscole e minuscole, come gli ID stanza Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel processo.
2. `cron.failureDestination` globale.
3. La destinazione announce principale del processo (quando non è impostata una destinazione di errore esplicita).

<Note>
I processi della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna principale è `webhook`. I processi isolati la accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori a livello di esecuzione dell'agente come errori del processo anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i
contatori di errore e attivano le notifiche di errore.

I processi Cron di comando non avviano un turno agente isolato. Un codice di uscita zero registra
`ok`; uscita diversa da zero, segnale, timeout o timeout senza output registra `error` e
può attivare lo stesso percorso di notifica degli errori.

Se un'esecuzione isolata va in timeout prima della prima richiesta al modello, `openclaw cron show`
e `openclaw cron runs` includono un errore specifico della fase come
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Per i provider basati su CLI, il watchdog pre-modello resta attivo finché il turno della CLI esterna
non parte, quindi stalli di lookup della sessione, hook, autenticazione, prompt e setup CLI
vengono segnalati come errori Cron pre-modello.

## Pianificazione

### Processi una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le datetime senza offset sono trattate come UTC a meno che tu non passi anche `--tz <iana>`, che interpreta l'orario di calendario nel fuso orario indicato.

<Note>
I processi una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Processi ricorrenti

I processi ricorrenti usano backoff esponenziale dei nuovi tentativi dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate sono tracciate separatamente dagli errori di esecuzione. Non influenzano il backoff dei nuovi tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere le notifiche di errore in notifiche ripetute per esecuzioni saltate.

Per i processi isolati che puntano a un provider modello locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno agente. I provider `api: "ollama"` local loopback, di rete privata e `.local` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI come vLLM, SGLang e LM Studio vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; gli endpoint non funzionanti corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti processi sovraccarichino lo stesso server locale.

Nota: processi Cron, stato runtime in sospeso e cronologia delle esecuzioni vivono nel database di stato SQLite condiviso. I file legacy `jobs.json`, `jobs-state.json` e `runs/*.jsonl` vengono importati una volta e rinominati con un suffisso `.migrated`. Dopo l'importazione, modifica le pianificazioni con `openclaw cron add|edit|remove` invece di modificare i file JSON.

### Esecuzioni manuali

`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita e ritorna non appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa il `runId` restituito per ispezionare il risultato successivo:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Aggiungi `--wait` quando uno script deve bloccarsi finché quella precisa esecuzione in coda registra uno stato terminale:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI chiama comunque prima `cron.run`, poi interroga `cron.runs` per il `runId` restituito. Il comando esce con `0` solo quando l'esecuzione termina con stato `ok`. Esce con valore diverso da zero quando l'esecuzione termina con `error` o `skipped`, quando la risposta del Gateway non include un `runId` o quando `--wait-timeout` scade. `--poll-interval` deve essere maggiore di zero.

<Note>
Usa `--due` quando vuoi che il comando manuale venga eseguito solo se il processo è attualmente dovuto. Se `--due --wait` non mette in coda un'esecuzione, il comando restituisce la normale risposta senza esecuzione invece di effettuare il polling.
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il processo. `cron add|edit --fallbacks <list>` imposta modelli fallback per processo, per esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passa `--fallbacks ""` per un'esecuzione rigida senza fallback. `cron edit <job-id> --clear-fallbacks` rimuove l'override fallback per processo. `cron edit <job-id> --clear-model` rimuove l'override modello per processo così che il processo segua la normale precedenza di selezione del modello Cron (un override di sessione Cron memorizzato se presente, altrimenti il modello agente/predefinito); non può essere combinato con `--model`. `cron add|edit --thinking <level>` imposta un override thinking per processo; `cron edit <job-id> --clear-thinking` lo rimuove così che il processo segua la normale precedenza thinking di Cron, e non può essere combinato con `--thinking`.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di convalida esplicito invece di ripiegare sull'agente del processo o sulla selezione del modello predefinito.
</Warning>

Cron `--model` è un **primario del processo**, non un override `/model` della sessione chat. Questo significa:

- I fallback del modello configurati continuano ad applicarsi quando il modello del processo selezionato fallisce.
- Il payload per processo `fallbacks` sostituisce l'elenco fallback configurato quando presente.
- Un elenco fallback per processo vuoto (`--fallbacks ""` o `fallbacks: []` nel payload/API del processo) rende rigida l'esecuzione Cron.
- Quando un processo ha `--model` ma non è configurato alcun elenco fallback, OpenClaw passa un override fallback vuoto esplicito così che il primario dell'agente non venga aggiunto come destinazione nascosta di nuovo tentativo.
- I controlli preflight del provider locale percorrono i fallback configurati prima di contrassegnare un'esecuzione Cron come `skipped`.

`openclaw doctor` segnala i processi che hanno già `payload.model` impostato, inclusi conteggi per namespace provider e mancata corrispondenza con `agents.defaults.model`. Usa quel controllo quando autenticazione, provider o comportamento di fatturazione appaiono diversi tra chat live e processi pianificati.

### Precedenza del modello Cron isolato

Cron isolato risolve il modello attivo in questo ordine:

1. Override hook Gmail.
2. `--model` per processo.
3. Override modello di sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello agente o predefinito.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` di sessione memorizzato prevale comunque sulla configurazione. Quando la modalità risolta è `auto`, il limite usa il valore `params.fastAutoOnSeconds` del modello selezionato, con valore predefinito di 60 secondi.

### Nuovi tentativi per cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron mantiene il provider e il modello sostituiti (e l'override del profilo di autenticazione sostituito quando presente) per l'esecuzione attiva prima di ritentare. Il ciclo esterno di nuovi tentativi è limitato a due tentativi di cambio dopo il tentativo iniziale, poi interrompe invece di restare in ciclo per sempre.

## Output di esecuzione e rifiuti

### Soppressione dei riconoscimenti obsoleti

I turni Cron isolati sopprimono le risposte obsolete di solo riconoscimento. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripete il prompt una volta per ottenere il risultato reale prima della consegna.

### Soppressione silenziosa dei token

Se un'esecuzione cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo in coda di fallback, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni cron isolate usano i metadati strutturati di rifiuto dell'esecuzione provenienti dall'esecuzione incorporata come segnale di rifiuto autorevole. Rispettano anche i wrapper node-host `UNAVAILABLE` quando il messaggio di errore strutturato annidato inizia con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`.

Cron non classifica la prosa dell'output finale o le frasi di rifiuto simili ad approvazione come rifiuti, a meno che l'esecuzione incorporata non fornisca anche metadati strutturati di rifiuto, quindi il normale testo dell'assistente non viene trattato come un comando bloccato.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto invece di segnalare un comando bloccato come `ok`.

## Conservazione

Conservazione ed eliminazione sono controllate nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.keepLines` elimina le righe SQLite conservate della cronologia delle esecuzioni per processo. `cron.runLog.maxBytes` rimane accettato per compatibilità con i log di esecuzione meno recenti basati su file.

## Migrazione dei processi meno recenti

<Note>
Se hai processi cron precedenti al formato attuale di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello incluso il legacy `threadId`, alias di consegna `provider` del payload) e migra i processi di fallback Webhook `notify: true` da `cron.webhook` alla consegna Webhook esplicita. I processi che annunciano già a una chat mantengono quella consegna e ricevono una destinazione Webhook di completamento. Quando `cron.webhook` non è impostato, il marcatore inerte di primo livello `notify` viene rimosso per i processi senza destinazione di migrazione (la consegna esistente viene preservata invariata), quindi `doctor --fix` non continuerà più ad avvisare ripetutamente su di essi.
</Note>

## Modifiche comuni

Aggiorna le impostazioni di consegna senza modificare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un processo isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita il contesto di bootstrap leggero per un processo isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annuncia a un argomento del forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crea un processo isolato con contesto di bootstrap leggero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi isolati di turno agente. Per le esecuzioni cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap del workspace.

Crea un processo di comando con argv esatto, cwd, env, stdin e limiti di output:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Comandi amministrativi comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` mostra per impostazione predefinita tutti i processi corrispondenti. Passa `--agent <id>` per mostrare solo i processi il cui ID agente normalizzato effettivo corrisponde; i processi senza un ID agente archiviato vengono conteggiati come agente predefinito configurato.

`openclaw cron get <job-id>` restituisce direttamente il JSON del processo archiviato. Usa `cron show <job-id>` quando vuoi la vista leggibile dalle persone con anteprima della route di consegna.

`cron list --json` e `cron show <job-id> --json` includono un campo di primo livello `status` su ogni processo, calcolato da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Questo rispecchia la colonna di stato leggibile dalle persone, così gli strumenti esterni possono leggere lo stato del processo senza ricalcolarlo.

Le voci di `cron runs` includono diagnostica di consegna con il target cron previsto, il target risolto, gli invii dello strumento messaggi, l'uso del fallback e lo stato consegnato.

Retargeting di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` viene omesso nei processi di turno agente e ricade sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Ritocchi alla consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
