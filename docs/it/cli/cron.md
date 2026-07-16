---
read_when:
    - Si desiderano processi pianificati e riattivazioni
    - Si stanno eseguendo il debug dell'esecuzione e dei log di Cron
summary: Riferimento CLI per `openclaw cron` (pianificazione ed esecuzione di processi in background)
title: Cron
x-i18n:
    generated_at: "2026-07-16T14:06:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestire i job cron per lo scheduler del Gateway.

<Tip>
Eseguire `openclaw cron --help` per visualizzare l'intera gamma di comandi. Consultare [Job cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

<Note>
Tutte le modifiche cron (`add`/`create`, `update`/`edit`, `remove`, `run`) richiedono `operator.admin`. Le esecuzioni con payload di comando vengono effettuate direttamente nel processo del Gateway, non come chiamata allo strumento `tools.exec` di un agente; `tools.exec.*` e le approvazioni per l'esecuzione continuano a disciplinare gli strumenti di esecuzione visibili al modello.
</Note>

## Creare rapidamente i job

`openclaw cron create` è un alias di `openclaw cron add`. Per i nuovi job, indicare prima la pianificazione e poi il prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Riepiloga gli aggiornamenti della notte." \
  --name "Riepilogo mattutino" \
  --agent ops
```

Usare `--webhook <url>` quando il job deve inviare tramite POST il payload completato anziché recapitarlo a una destinazione di chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Riepiloga in formato JSON i deployment di oggi." \
  --name "Riepilogo dei deployment" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usare `--command` per job deterministici in stile shell eseguiti all'interno di Cron di OpenClaw senza avviare un'esecuzione isolata di agente/modello:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Verifica della profondità della coda" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` memorizza `argv: ["sh", "-lc", <shell>]`. Usare `--command-argv '["node","scripts/report.mjs"]'` per l'esecuzione argv esatta. I job di comando acquisiscono stdout/stderr, registrano la normale cronologia di Cron e instradano l'output tramite le stesse modalità di recapito `announce`, `webhook` o `none` dei job isolati. Un comando che stampa solo `NO_REPLY` viene ignorato.

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un nuovo ID di sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` si associa in modo permanente a una chiave di sessione esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto ambientale della conversazione. L'instradamento di canale e gruppo, i criteri di invio/accodamento, l'elevazione, l'origine e l'associazione al runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e le sostituzioni di modello o autenticazione selezionate esplicitamente dall'utente possono essere mantenute tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Recapito

`openclaw cron list` e `openclaw cron show <job-id>` mostrano un'anteprima del percorso di recapito risolto. Per `channel: "last"`, l'anteprima indica se il percorso è stato risolto dalla sessione principale o corrente oppure se verrà interrotto in modo sicuro.

Le destinazioni con prefisso del provider possono eliminare l'ambiguità dei canali di annuncio non risolti. Ad esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o è `last`. Solo i prefissi dichiarati dal Plugin caricato fungono da selettori del provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a tale canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` rimangono una sintassi di destinazione di proprietà del canale.

<Note>
I job `cron add` isolati usano per impostazione predefinita il recapito `--announce`. Usare `--no-deliver` per mantenere interno l'output. `--deliver` rimane disponibile come alias deprecato di `--announce`.
</Note>

### Titolarità del recapito

Il recapito in chat dei job cron isolati è condiviso tra l'agente e il runner:

- L'agente può inviare direttamente tramite lo strumento `message` quando è disponibile un percorso di chat.
- `announce` recapita come fallback la risposta finale solo quando l'agente non ha inviato direttamente alla destinazione risolta.
- `webhook` invia tramite POST il payload completato a un URL.
- `none` disabilita il recapito di fallback del runner.

Usare `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` per impostare il recapito tramite Webhook. Non combinare `--webhook` con flag di recapito in chat come `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` può annullare l'impostazione di singoli campi di instradamento del recapito con `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (ciascuno viene rifiutato se combinato con il flag di impostazione corrispondente). A differenza di `--no-deliver`, che disabilita soltanto il recapito di fallback del runner, questi rimuovono il campo memorizzato affinché il job risolva nuovamente quella parte del percorso dai valori predefiniti.

`--announce` è il recapito di fallback del runner per la risposta finale. `--no-deliver` disabilita tale fallback, ma non rimuove lo strumento `message` dell'agente quando è disponibile un percorso di chat.

I promemoria creati da una chat attiva conservano la destinazione di recapito della chat in tempo reale per il recapito degli annunci di fallback. Le chiavi di sessione interne possono essere in minuscolo; non usarle come fonte attendibile per gli ID dei provider che distinguono tra maiuscole e minuscole, come gli ID delle stanze Matrix.

### Recapito degli errori

Le notifiche di errore vengono risolte nel seguente ordine:

1. `delivery.failureDestination` nel job.
2. `cron.failureDestination` globale.
3. La destinazione principale degli annunci del job (quando nessuna delle precedenti viene risolta in una destinazione concreta).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di recapito principale è `webhook`. I job isolati lo accettano in tutte le modalità.
</Note>

Le esecuzioni cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del job anche quando non viene prodotto alcun payload di risposta; pertanto, gli errori del modello/provider incrementano comunque i contatori degli errori e attivano le relative notifiche.

I job cron di comando non avviano un turno isolato dell'agente. Un codice di uscita pari a zero registra `ok`; un'uscita diversa da zero, un segnale, un timeout o un timeout per assenza di output registra `error` e può attivare lo stesso percorso di notifica degli errori.

Se un'esecuzione isolata raggiunge il timeout prima della prima richiesta al modello, `openclaw cron show` e `openclaw cron runs` includono un errore specifico della fase, come `setup timed out before runner start`, oppure un messaggio di blocco che indica l'ultima fase di avvio nota (ad esempio `context-engine`). Per i provider basati sulla CLI, il watchdog precedente al modello rimane attivo fino all'avvio del turno della CLI esterna; pertanto, i blocchi nella ricerca della sessione, negli hook, nell'autenticazione, nel prompt e nella configurazione della CLI vengono segnalati come errori cron precedenti al modello.

## Pianificazione

### Job singoli

`--at <datetime>` pianifica un'esecuzione singola. Le date e gli orari senza offset vengono considerati UTC, a meno che non venga passato anche `--tz <iana>`, che interpreta l'ora locale nel fuso orario specificato.

<Note>
Per impostazione predefinita, i job singoli vengono eliminati dopo l'esito positivo. Usare `--keep-after-run` per conservarli.
</Note>

### Job ricorrenti

Dopo errori consecutivi, i job ricorrenti usano un backoff esponenziale dei nuovi tentativi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna alla normalità dopo l'esecuzione successiva completata correttamente.

Le esecuzioni ignorate vengono registrate separatamente dagli errori di esecuzione. Non influiscono sul backoff dei nuovi tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere nelle notifiche di errore avvisi ripetuti sulle esecuzioni ignorate.

Per i job isolati destinati a un provider di modelli locale configurato (URL di base su loopback, una rete privata o `.local`), Cron esegue una verifica preliminare leggera del provider prima di avviare il turno dell'agente: i provider `api: "ollama"` vengono verificati all'indirizzo `/api/tags`; gli altri provider locali compatibili con OpenAI (`api: "openai-completions"`, ad esempio vLLM, SGLang, LM Studio) vengono verificati all'indirizzo `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; il risultato della verifica di raggiungibilità viene memorizzato nella cache per endpoint per 5 minuti, affinché molti job diretti allo stesso server locale non lo sovraccarichino con verifiche ripetute.

I job cron, lo stato del runtime in sospeso e la cronologia delle esecuzioni risiedono nel database di stato SQLite condiviso. I file legacy `jobs.json`, `<name>-state.json` e `runs/*.jsonl` vengono importati una volta e rinominati con un suffisso `.migrated`. Dopo l'importazione, modificare le pianificazioni con `openclaw cron add|edit|remove` anziché modificare i file JSON.

### Esecuzioni manuali

`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita e restituisce il risultato non appena l'esecuzione manuale viene accodata. Le risposte positive includono `{ ok: true, enqueued: true, runId }`. Usare il valore `runId` restituito per controllare successivamente il risultato:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Aggiungere `--wait` quando uno script deve rimanere bloccato finché quella specifica esecuzione accodata non registra uno stato terminale:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI chiama comunque prima `cron.run`, quindi interroga periodicamente `cron.runs` per il valore `runId` restituito. Il comando termina con `0` solo quando l'esecuzione si conclude con lo stato `ok`. Termina con un valore diverso da zero quando l'esecuzione si conclude con `error` o `skipped`, quando la risposta del Gateway non include un valore `runId` oppure quando scade `--wait-timeout` (valore predefinito `10m`, con interrogazione ogni `2s` per impostazione predefinita). `--poll-interval` deve essere maggiore di zero.

<Note>
Usare `--due` quando si desidera che il comando manuale venga eseguito solo se il job è attualmente in scadenza. Se `--due --wait` non accoda un'esecuzione, il comando restituisce la normale risposta di mancata esecuzione anziché avviare l'interrogazione periodica.
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job. `cron add|edit --fallbacks <list>` imposta i modelli di fallback per il singolo job, ad esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passare `--fallbacks ""` per un'esecuzione rigorosa senza fallback. `cron edit <job-id> --clear-fallbacks` rimuove la sostituzione dei fallback per il singolo job. `cron edit <job-id> --clear-model` rimuove la sostituzione del modello per il singolo job, affinché il job segua la normale precedenza di selezione del modello di Cron (una sostituzione memorizzata nella sessione cron, se presente, altrimenti il modello dell'agente/predefinito); non può essere combinato con `--model`. `cron add|edit --thinking <level>` imposta una sostituzione del ragionamento per il singolo job; `cron edit <job-id> --clear-thinking` la rimuove, affinché il job segua la normale precedenza del ragionamento di Cron, e non può essere combinato con `--thinking`.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron considera l'esecuzione non riuscita con un errore di convalida esplicito anziché utilizzare come fallback l'agente del job o la selezione del modello predefinito.
</Warning>

Il valore `--model` di Cron è il **modello principale del job**, non una sostituzione `/model` della sessione di chat. Ciò significa che:

- I fallback del modello configurati continuano ad applicarsi quando il modello selezionato per il job non riesce.
- Il valore `fallbacks` nel payload del singolo job sostituisce l'elenco di fallback configurato, se presente.
- Un elenco di fallback vuoto per il singolo job (`--fallbacks ""` o `fallbacks: []` nel payload/API del job) rende rigorosa l'esecuzione cron.
- Quando un job contiene `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa una sostituzione esplicita con un elenco di fallback vuoto, affinché il modello principale dell'agente non venga aggiunto come destinazione nascosta per un nuovo tentativo.
- Le verifiche preliminari del provider locale esaminano i fallback configurati prima di contrassegnare un'esecuzione cron come `skipped`.

`openclaw doctor` segnala i job che hanno già impostato `payload.model`, inclusi i conteggi per namespace del provider e le discrepanze rispetto a `agents.defaults.model`. Usare questa verifica quando il comportamento di autenticazione, provider o fatturazione appare diverso tra la chat in tempo reale e i job pianificati.

### Precedenza del modello per Cron isolato

Cron isolato risolve il modello attivo nel seguente ordine:

1. Sostituzione dell'hook Gmail.
2. `--model` per il singolo job.
3. Sostituzione del modello memorizzata nella sessione cron (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinito.

### Modalità rapida

La modalità rapida Cron isolata segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override memorizzato della sessione `fastMode` continua ad avere la precedenza sulla configurazione. Quando la modalità risolta è `auto`, il limite usa il valore `params.fastAutoOnSeconds` del modello selezionato, con un valore predefinito di 60 secondi.

### Nuovi tentativi dopo il cambio del modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron rende persistenti il provider e il modello selezionati con il cambio (nonché l'override del profilo di autenticazione selezionato con il cambio, se presente) per l'esecuzione attiva prima di riprovare. Il ciclo esterno di nuovi tentativi è limitato a due tentativi di cambio dopo quello iniziale, quindi si interrompe anziché continuare all'infinito.

## Output delle esecuzioni e rifiuti

### Soppressione delle conferme obsolete

I turni Cron isolati sopprimono le risposte obsolete contenenti soltanto una conferma. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di un subagente discendente è responsabile della risposta finale, Cron invia nuovamente una richiesta una sola volta per ottenere il risultato effettivo prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce soltanto il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di fallback del riepilogo in coda, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni Cron isolate usano come segnale autorevole di rifiuto i metadati strutturati relativi al rifiuto dell'esecuzione provenienti dall'esecuzione incorporata (errori irreversibili dello strumento di esecuzione con codice `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`). Rispettano anche i wrapper `UNAVAILABLE` dell'host Node attorno a un errore strutturato annidato contenente uno di questi codici.

Cron non classifica come rifiuti la prosa dell'output finale o le frasi di rifiuto simili a richieste di approvazione, a meno che l'esecuzione incorporata non fornisca anche metadati strutturati relativi al rifiuto, quindi il normale testo dell'assistente non viene interpretato come un comando bloccato.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto anziché segnalare un comando bloccato come `ok`.

## Conservazione

Comportamento di conservazione:

- `cron.sessionRetention` (valore predefinito `24h`, oppure `false` per disabilitare) elimina le sessioni delle esecuzioni isolate completate.
- La cronologia delle esecuzioni conserva le 2000 righe terminali più recenti per ogni processo Cron. Le righe perse mantengono la finestra standard di 24 ore per la pulizia delle attività perse.

## Migrazione dei processi meno recenti

<Note>
Se sono presenti processi Cron precedenti al formato attuale di consegna e archiviazione, eseguire `openclaw doctor --fix`. Doctor normalizza i campi Cron precedenti (`jobId`, `schedule.cron`, i campi di consegna di primo livello incluso il precedente `threadId`, gli alias di consegna del payload `provider`) e migra i processi di fallback Webhook `notify: true` da `cron.webhook` alla consegna Webhook esplicita. I processi che già inviano annunci a una chat mantengono tale consegna e ricevono una destinazione Webhook per il completamento. Quando `cron.webhook` non è impostato, l'indicatore inattivo di primo livello `notify` viene rimosso dai processi senza una destinazione di migrazione (la consegna esistente viene conservata senza modifiche), quindi `doctor --fix` non continua più a mostrare avvisi in merito.
</Note>

## Modifiche comuni

Aggiornare le impostazioni di consegna senza modificare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilitare la consegna per un processo isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilitare il contesto di bootstrap leggero per un processo isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Inviare l'annuncio a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Inviare l'annuncio a un argomento del forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Creare un processo isolato con un contesto di bootstrap leggero:

```bash
openclaw cron create "0 7 * * *" \
  "Riepiloga gli aggiornamenti notturni." \
  --name "Riepilogo mattutino leggero" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi con turni dell'agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap anziché inserire il set completo di bootstrap dell'area di lavoro.

Creare un processo di comando con valori esatti per argv, cwd, env, stdin e limiti di output:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Esportazione della posizione" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Comandi di amministrazione comuni

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

`openclaw cron list` mostra per impostazione predefinita tutti i processi corrispondenti. Passare `--agent <id>` per mostrare solo i processi il cui ID agente normalizzato effettivo corrisponde; i processi senza un ID agente memorizzato vengono considerati appartenenti all'agente predefinito configurato.

`openclaw cron get <job-id>` restituisce direttamente il JSON memorizzato del processo. Usare `cron show <job-id>` per ottenere la visualizzazione leggibile con un'anteprima del percorso di consegna.

`cron list --json` e `cron show <job-id> --json` includono un campo di primo livello `status` per ogni processo, calcolato da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Lo stato JSON rimane canonico e privo di decorazioni, affinché gli strumenti esterni possano leggere lo stato del processo senza doverlo ricalcolare; l'output leggibile può decorare gli stati `error` ripetuti con un conteggio degli errori.

Le voci `cron runs` includono dati diagnostici sulla consegna con la destinazione Cron prevista, la destinazione risolta, gli invii tramite lo strumento di messaggistica, l'uso del fallback e lo stato della consegna.

Riassegnazione dell'agente e della sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` mostra un avviso quando `--agent` viene omesso nei processi con turni dell'agente e usa come fallback l'agente predefinito (`main`). Passare `--agent <id>` al momento della creazione per associare un agente specifico.

Modifiche alla consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
