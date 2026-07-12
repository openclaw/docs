---
read_when:
    - Vuoi attività pianificate e risvegli
    - Stai eseguendo il debug dell'esecuzione e dei log di Cron
summary: Riferimento della CLI per `openclaw cron` (pianificare ed eseguire processi in background)
title: Cron
x-i18n:
    generated_at: "2026-07-12T06:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i processi cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per visualizzare l'intera superficie dei comandi. Consulta [Processi Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

<Note>
Tutte le modifiche cron (`add`/`create`, `update`/`edit`, `remove`, `run`) richiedono `operator.admin`. Le esecuzioni con payload di comando vengono eseguite direttamente nel processo del Gateway, non come chiamata allo strumento `tools.exec` di un agente; `tools.exec.*` e le approvazioni di esecuzione continuano a regolare gli strumenti di esecuzione visibili al modello.
</Note>

## Creare rapidamente i processi

`openclaw cron create` è un alias di `openclaw cron add`. Per i nuovi processi, inserisci prima la pianificazione e poi il prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` quando il processo deve inviare tramite POST il payload completato anziché recapitarlo a una destinazione chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` per processi deterministici in stile shell che vengono eseguiti all'interno del Cron di OpenClaw senza avviare un'esecuzione isolata dell'agente o del modello:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` memorizza `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` per un'esecuzione argv esatta. I processi di comando acquisiscono stdout/stderr, registrano la normale cronologia Cron e instradano l'output tramite le stesse modalità di recapito `announce`, `webhook` o `none` dei processi isolati. Un comando che stampa soltanto `NO_REPLY` viene soppresso.

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un nuovo ID di sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` si vincola a una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto ambientale della conversazione. L'instradamento di canali e gruppi, la politica di invio/accodamento, l'elevazione, l'origine e l'associazione del runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e le sostituzioni esplicite del modello o dell'autenticazione selezionate dall'utente possono essere mantenute tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Recapito

`openclaw cron list` e `openclaw cron show <job-id>` mostrano un'anteprima dell'itinerario di recapito risolto. Per `channel: "last"`, l'anteprima indica se l'itinerario è stato risolto dalla sessione principale o corrente, oppure se verrà interrotto in modo sicuro.

Le destinazioni con prefisso del provider possono disambiguare i canali di annuncio non risolti. Ad esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o impostato su `last`. Solo i prefissi pubblicizzati dal Plugin caricato fungono da selettori del provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a tale canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` rimangono sintassi di destinazione di proprietà del canale.

<Note>
Per impostazione predefinita, i processi isolati creati con `cron add` usano il recapito `--announce`. Usa `--no-deliver` per mantenere interno l'output. `--deliver` rimane un alias deprecato di `--announce`.
</Note>

### Titolarità del recapito

Il recapito via chat dei processi Cron isolati è condiviso tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile un itinerario chat.
- Il recapito di ripiego `announce` invia la risposta finale soltanto quando l'agente non l'ha inviata direttamente alla destinazione risolta.
- `webhook` invia tramite POST il payload completato a un URL.
- `none` disabilita il recapito di ripiego del runner.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` per impostare il recapito tramite Webhook. Non combinare `--webhook` con opzioni di recapito via chat come `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` può annullare singoli campi di instradamento del recapito con `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (ciascuno viene rifiutato se combinato con la corrispondente opzione di impostazione). A differenza di `--no-deliver`, che disabilita soltanto il recapito di ripiego del runner, queste opzioni rimuovono il campo memorizzato, così il processo risolve nuovamente quella parte dell'itinerario dai valori predefiniti.

`--announce` è il recapito di ripiego del runner per la risposta finale. `--no-deliver` disabilita tale ripiego, ma non rimuove lo strumento `message` dell'agente quando è disponibile un itinerario chat.

I promemoria creati da una chat attiva conservano la destinazione di recapito della chat corrente per il recapito di ripiego tramite annuncio. Le chiavi di sessione interne possono essere in minuscolo; non usarle come fonte autorevole per gli ID dei provider che distinguono tra maiuscole e minuscole, come gli ID delle stanze Matrix.

### Recapito degli errori

Le notifiche di errore vengono risolte nel seguente ordine:

1. `delivery.failureDestination` nel processo.
2. `cron.failureDestination` globale.
3. La destinazione di annuncio principale del processo (quando nessuna delle precedenti viene risolta in una destinazione concreta).

<Note>
I processi della sessione principale possono usare `delivery.failureDestination` soltanto quando la modalità di recapito principale è `webhook`. I processi isolati la accettano in tutte le modalità.
</Note>

Le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del processo anche quando non viene prodotto alcun payload di risposta, quindi gli errori del modello o del provider incrementano comunque i contatori degli errori e attivano le notifiche di errore.

I processi Cron di comando non avviano un turno isolato dell'agente. Un codice di uscita pari a zero registra `ok`; un'uscita diversa da zero, un segnale, un timeout o un timeout per assenza di output registrano `error` e possono attivare lo stesso percorso di notifica degli errori.

Se un'esecuzione isolata va in timeout prima della prima richiesta al modello, `openclaw cron show` e `openclaw cron runs` includono un errore specifico della fase, come `setup timed out before runner start`, oppure un messaggio di blocco che indica l'ultima fase di avvio nota (ad esempio `context-engine`). Per i provider basati sulla CLI, il watchdog precedente al modello rimane attivo finché non inizia il turno della CLI esterna, quindi i blocchi nella ricerca della sessione, negli hook, nell'autenticazione, nel prompt e nella configurazione della CLI vengono segnalati come errori Cron precedenti al modello.

## Pianificazione

### Processi a esecuzione singola

`--at <datetime>` pianifica un'esecuzione singola. Le date e gli orari privi di offset vengono interpretati come UTC, a meno che non si passi anche `--tz <iana>`, che interpreta l'ora locale nel fuso orario specificato.

<Note>
Per impostazione predefinita, i processi a esecuzione singola vengono eliminati dopo il completamento riuscito. Usa `--keep-after-run` per conservarli.
</Note>

### Processi ricorrenti

Dopo errori consecutivi, i processi ricorrenti usano un backoff esponenziale per i nuovi tentativi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna alla normalità dopo l'esecuzione riuscita successiva.

Le esecuzioni saltate vengono monitorate separatamente dagli errori di esecuzione. Non influiscono sul backoff dei nuovi tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere nelle notifiche di errore gli avvisi ripetuti relativi alle esecuzioni saltate.

Per i processi isolati che usano un provider di modelli locale configurato (URL di base su local loopback, una rete privata o `.local`), Cron esegue un controllo preliminare leggero del provider prima di avviare il turno dell'agente: i provider `api: "ollama"` vengono verificati su `/api/tags`; gli altri provider locali compatibili con OpenAI (`api: "openai-completions"`, ad esempio vLLM, SGLang, LM Studio) vengono verificati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e ritentata in una pianificazione successiva; il risultato della verifica di raggiungibilità viene memorizzato nella cache per ciascun endpoint per 5 minuti, in modo che molti processi diretti allo stesso server locale non lo sovraccarichino con verifiche ripetute.

I processi Cron, lo stato del runtime in sospeso e la cronologia delle esecuzioni risiedono nel database di stato SQLite condiviso. I file legacy `jobs.json`, `<name>-state.json` e `runs/*.jsonl` vengono importati una sola volta e rinominati con il suffisso `.migrated`. Dopo l'importazione, modifica le pianificazioni con `openclaw cron add|edit|remove` invece di modificare i file JSON.

### Esecuzioni manuali

Per impostazione predefinita, `openclaw cron run <job-id>` forza l'esecuzione e restituisce il controllo non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa il valore `runId` restituito per esaminare successivamente il risultato:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Aggiungi `--wait` quando uno script deve rimanere bloccato finché quella specifica esecuzione accodata non registra uno stato terminale:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI chiama comunque prima `cron.run`, quindi interroga periodicamente `cron.runs` per il valore `runId` restituito. Il comando termina con codice `0` soltanto quando l'esecuzione si conclude con stato `ok`. Termina con un codice diverso da zero quando l'esecuzione si conclude con `error` o `skipped`, quando la risposta del Gateway non include un `runId` oppure quando scade `--wait-timeout` (valore predefinito `10m`, con interrogazioni ogni `2s` per impostazione predefinita). `--poll-interval` deve essere maggiore di zero.

<Note>
Usa `--due` quando vuoi che il comando manuale venga eseguito soltanto se il processo è attualmente in scadenza. Se `--due --wait` non accoda un'esecuzione, il comando restituisce la normale risposta di mancata esecuzione invece di avviare l'interrogazione periodica.
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il processo. `cron add|edit --fallbacks <list>` imposta i modelli di ripiego specifici del processo, ad esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passa `--fallbacks ""` per un'esecuzione rigorosa senza modelli di ripiego. `cron edit <job-id> --clear-fallbacks` rimuove la sostituzione dei modelli di ripiego specifica del processo. `cron edit <job-id> --clear-model` rimuove la sostituzione del modello specifica del processo, affinché il processo segua la normale precedenza di selezione del modello Cron (una sostituzione memorizzata nella sessione Cron, se presente, altrimenti il modello dell'agente o quello predefinito); non può essere combinato con `--model`. `cron add|edit --thinking <level>` imposta una sostituzione del livello di ragionamento specifica del processo; `cron edit <job-id> --clear-thinking` la rimuove, affinché il processo segua la normale precedenza del livello di ragionamento Cron, e non può essere combinato con `--thinking`.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron interrompe l'esecuzione con un errore di convalida esplicito anziché ricorrere alla selezione del modello dell'agente del processo o del modello predefinito.
</Warning>

Il valore Cron `--model` è un **modello principale del processo**, non una sostituzione `/model` della sessione chat. Ciò significa che:

- I modelli di ripiego configurati continuano ad applicarsi quando il modello del processo selezionato non riesce.
- Il valore `fallbacks` del payload specifico del processo sostituisce l'elenco configurato dei modelli di ripiego, quando presente.
- Un elenco vuoto di modelli di ripiego specifico del processo (`--fallbacks ""` o `fallbacks: []` nel payload o nell'API del processo) rende rigorosa l'esecuzione Cron.
- Quando un processo include `--model` ma non è configurato alcun elenco di modelli di ripiego, OpenClaw passa una sostituzione vuota esplicita dei modelli di ripiego, affinché il modello principale dell'agente non venga aggiunto come destinazione nascosta per un nuovo tentativo.
- I controlli preliminari dei provider locali esaminano i modelli di ripiego configurati prima di contrassegnare un'esecuzione Cron come `skipped`.

`openclaw doctor` segnala i processi per i quali è già impostato `payload.model`, inclusi i conteggi degli spazi dei nomi dei provider e le mancate corrispondenze con `agents.defaults.model`. Usa questo controllo quando il comportamento relativo ad autenticazione, provider o fatturazione appare diverso tra la chat in tempo reale e i processi pianificati.

### Precedenza dei modelli Cron isolati

Cron isolato risolve il modello attivo nel seguente ordine:

1. Sostituzione dell'hook Gmail.
2. `--model` specifico del processo.
3. Sostituzione del modello memorizzata nella sessione Cron (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o del modello predefinito.

### Modalità rapida

La modalità rapida di Cron isolato segue la selezione risolta del modello in tempo reale. La configurazione del modello `params.fastMode` viene applicata per impostazione predefinita, ma una sostituzione `fastMode` memorizzata nella sessione ha comunque la precedenza sulla configurazione. Quando la modalità risolta è `auto`, la soglia usa il valore `params.fastAutoOnSeconds` del modello selezionato, con un valore predefinito di 60 secondi.

### Nuovi tentativi dopo il cambio di modello in tempo reale

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, prima del nuovo tentativo Cron rende persistenti il provider e il modello selezionati (nonché la sostituzione del profilo di autenticazione selezionato, se presente) per l'esecuzione attiva. Il ciclo esterno dei nuovi tentativi è limitato a due tentativi di cambio dopo quello iniziale, quindi si interrompe anziché continuare all'infinito.

## Output e rifiuti delle esecuzioni

### Soppressione delle conferme obsolete

I turni Cron isolati sopprimono le risposte obsolete costituite soltanto da una conferma. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di un subagente discendente è responsabile della risposta finale, Cron invia nuovamente il prompt una sola volta per ottenere il risultato effettivo prima del recapito.

### Soppressione dei token silenziosi

Se un'esecuzione cron isolata restituisce soltanto il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia l'invio diretto in uscita sia il percorso di fallback del riepilogo accodato, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni cron isolate usano i metadati strutturati di rifiuto dell'esecuzione provenienti dall'esecuzione incorporata (errori irreversibili dello strumento di esecuzione con codice `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) come segnale di rifiuto autorevole. Riconoscono inoltre i wrapper `UNAVAILABLE` dell'host Node che racchiudono un errore strutturato annidato con uno di questi codici.

Cron non classifica come rifiuti il testo dell'output finale o le frasi di rifiuto simili a richieste di approvazione, a meno che l'esecuzione incorporata non fornisca anche metadati strutturati di rifiuto; pertanto, il normale testo dell'assistente non viene considerato un comando bloccato.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto anziché segnalare un comando bloccato come `ok`.

## Conservazione

La conservazione e l'eliminazione sono controllate nella configurazione:

- `cron.sessionRetention` (valore predefinito `24h` oppure `false` per disabilitarla) elimina le sessioni completate delle esecuzioni isolate.
- `cron.runLog.keepLines` (valore predefinito `2000`) elimina, per ciascun processo, le righe conservate della cronologia delle esecuzioni in SQLite. `cron.runLog.maxBytes` (valore predefinito `2000000`) continua a essere accettato per compatibilità con i precedenti log delle esecuzioni basati su file; l'eliminazione in SQLite si basa sul numero di righe.

## Migrazione dei processi precedenti

<Note>
Se disponi di processi Cron creati prima dell'attuale formato di invio e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron precedenti (`jobId`, `schedule.cron`, i campi di invio di primo livello incluso il precedente `threadId`, gli alias di invio `provider` del payload) e migra i processi di fallback Webhook con `notify: true` da `cron.webhook` all'invio Webhook esplicito. I processi che inviano già annunci a una chat mantengono tale invio e ricevono una destinazione Webhook per il completamento. Quando `cron.webhook` non è impostato, l'indicatore inerte di primo livello `notify` viene rimosso dai processi senza una destinazione di migrazione (l'invio esistente viene conservato senza modifiche), quindi `doctor --fix` non continua più a mostrare avvisi relativi a questi processi.
</Note>

## Modifiche comuni

Aggiorna le impostazioni di invio senza modificare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita l'invio per un processo isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita un contesto di bootstrap leggero per un processo isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Invia un annuncio a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Invia un annuncio a un argomento del forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crea un processo isolato con un contesto di bootstrap leggero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` si applica soltanto ai processi isolati dei turni dell'agente. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap anziché inserire l'intero insieme di bootstrap dell'area di lavoro.

Crea un processo di comando con argv, cwd, env, stdin e limiti di output esatti:

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

Per impostazione predefinita, `openclaw cron list` mostra tutti i processi corrispondenti. Passa `--agent <id>` per mostrare soltanto i processi il cui ID agente effettivo normalizzato corrisponde; i processi senza un ID agente archiviato vengono attribuiti all'agente predefinito configurato.

`openclaw cron get <job-id>` restituisce direttamente il JSON archiviato del processo. Usa `cron show <job-id>` quando desideri la vista leggibile con l'anteprima del percorso di invio.

`cron list --json` e `cron show <job-id> --json` includono un campo di primo livello `status` per ciascun processo, calcolato a partire da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Lo stato JSON rimane canonico e privo di decorazioni, in modo che gli strumenti esterni possano leggere lo stato del processo senza doverlo ricalcolare; l'output leggibile può decorare gli stati `error` ripetuti con il numero di errori.

Le voci di `cron runs` includono la diagnostica dell'invio con la destinazione Cron prevista, la destinazione risolta, gli invii dello strumento di messaggistica, l'uso del fallback e lo stato di consegna.

Riassegnazione dell'agente e della sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` mostra un avviso quando `--agent` viene omesso per i processi dei turni dell'agente e usa come fallback l'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per assegnare un agente specifico.

Modifiche all'invio:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
