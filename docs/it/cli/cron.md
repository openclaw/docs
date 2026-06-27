---
read_when:
    - Vuoi job pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianifica ed esegui attività in secondo piano)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:19:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i job Cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per la superficie completa dei comandi. Vedi [Job Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Creare job rapidamente

`openclaw cron create` è un alias di `openclaw cron add`. Per i nuovi job, inserisci prima la pianificazione e poi il prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` quando il job deve inviare il payload completato tramite POST invece di consegnarlo a una destinazione chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` per job deterministici in stile shell che devono essere eseguiti all'interno di OpenClaw cron senza avviare un'esecuzione isolata di agente/modello:

<Note>
I job Cron di comando sono automazioni del Gateway create dall'amministratore. Crearli, modificarli,
rimuoverli o eseguirli manualmente richiede `operator.admin`; l'esecuzione pianificata
viene poi eseguita nel processo Gateway, non come chiamata allo strumento `tools.exec` di un agente.
`tools.exec.*` e le approvazioni di exec continuano a governare gli strumenti exec visibili al modello.
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

`--command <shell>` memorizza `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` per l'esecuzione argv esatta. I job di comando acquisiscono stdout/stderr, registrano la normale cronologia Cron e instradano l'output tramite le stesse modalità di consegna `announce`, `webhook` o `none` dei job isolati. Un comando che stampa solo `NO_REPLY` viene soppresso.

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una trascrizione e un ID sessione nuovi per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Routing di canale e gruppo, criteri di invio/coda, elevazione, origine e binding del runtime ACP vengono reimpostati per la nuova esecuzione. Preferenze sicure e override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà chiusa.

Le destinazioni con prefisso provider possono disambiguare i canali announce non risolti. Per esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o è `last`. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` rimangono sintassi di destinazione di proprietà del canale.

<Note>
I job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` rimane come alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat Cron isolata è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` consegna come fallback la risposta finale solo quando l'agente non ha inviato direttamente alla destinazione risolta.
- `webhook` invia il payload completato a un URL.
- `none` disabilita la consegna fallback del runner.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` per impostare la consegna Webhook. Non combinare `--webhook` con flag di consegna chat come `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` può rimuovere singoli campi di routing della consegna con `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (ciascuno viene rifiutato se combinato con il flag di impostazione corrispondente). A differenza di `--no-deliver`, che disabilita solo la consegna fallback del runner, questi rimuovono il campo memorizzato così che il job risolva di nuovo quella parte della route dai valori predefiniti.

`--announce` è la consegna fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva conservano la destinazione di consegna chat live per la consegna announce fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider con distinzione tra maiuscole e minuscole, come gli ID delle stanze Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` sul job.
2. `cron.failureDestination` globale.
3. La destinazione announce principale del job (quando non è impostata una destinazione di errore esplicita).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna principale è `webhook`. I job isolati la accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del job anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori
di errore e attivano le notifiche di errore.

I job Cron di comando non avviano un turno agente isolato. Un codice di uscita zero registra
`ok`; uscita diversa da zero, segnale, timeout o timeout senza output registra `error` e
può attivare lo stesso percorso di notifica degli errori.

Se un'esecuzione isolata va in timeout prima della prima richiesta al modello, `openclaw cron show`
e `openclaw cron runs` includono un errore specifico della fase, come
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Per i provider basati su CLI, il watchdog pre-modello resta attivo finché il turno CLI esterno
non inizia, quindi stalli di ricerca sessione, hook, autenticazione, prompt e configurazione CLI
vengono segnalati come errori Cron pre-modello.

## Pianificazione

### Job one-shot

`--at <datetime>` pianifica un'esecuzione one-shot. Le date e ore senza offset vengono trattate come UTC, a meno che tu non passi anche `--tz <iana>`, che interpreta l'ora di calendario nel fuso orario indicato.

<Note>
I job one-shot vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Job ricorrenti

I job ricorrenti usano backoff esponenziale dei retry dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate vengono tracciate separatamente dagli errori di esecuzione. Non influenzano il backoff dei retry, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può abilitare gli avvisi di errore alle notifiche ripetute per esecuzioni saltate.

Per i job isolati che puntano a un provider di modello locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su loopback, rete privata e `.local` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI come vLLM, SGLang e LM Studio vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e ritentata in una pianificazione successiva; gli endpoint non attivi corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti job martellino lo stesso server locale.

Nota: job Cron, stato runtime in sospeso e cronologia delle esecuzioni risiedono nel database di stato SQLite condiviso. I file legacy `jobs.json`, `jobs-state.json` e `runs/*.jsonl` vengono importati una volta e rinominati con suffisso `.migrated`. Dopo l'importazione, modifica le pianificazioni con `openclaw cron add|edit|remove` invece di modificare i file JSON.

### Esecuzioni manuali

`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita e ritorna non appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa il `runId` restituito per ispezionare il risultato successivo:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Aggiungi `--wait` quando uno script deve bloccarsi finché quella esatta esecuzione in coda non registra uno stato terminale:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI chiama comunque prima `cron.run`, poi interroga `cron.runs` per il `runId` restituito. Il comando termina con `0` solo quando l'esecuzione finisce con stato `ok`. Termina con codice diverso da zero quando l'esecuzione finisce con `error` o `skipped`, quando la risposta del Gateway non include un `runId`, o quando `--wait-timeout` scade. `--poll-interval` deve essere maggiore di zero.

<Note>
Usa `--due` quando vuoi che il comando manuale venga eseguito solo se il job è attualmente dovuto. Se `--due --wait` non mette in coda un'esecuzione, il comando restituisce la normale risposta senza esecuzione invece di effettuare polling.
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job. `cron add|edit --fallbacks <list>` imposta i modelli fallback per job, per esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passa `--fallbacks ""` per un'esecuzione rigorosa senza fallback. `cron edit <job-id> --clear-fallbacks` rimuove l'override fallback per job. `cron edit <job-id> --clear-model` rimuove l'override modello per job così che il job segua la normale precedenza di selezione modello Cron (un override cron-session memorizzato se presente, altrimenti il modello dell'agente/predefinito); non può essere combinato con `--model`.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fallisce l'esecuzione con un errore di validazione esplicito invece di ripiegare sull'agente del job o sulla selezione del modello predefinito.
</Warning>

`--model` di Cron è un **modello primario del job**, non un override `/model` della sessione chat. Ciò significa:

- I fallback di modello configurati si applicano comunque quando il modello del job selezionato fallisce.
- Il payload per job `fallbacks` sostituisce l'elenco fallback configurato quando presente.
- Un elenco fallback per job vuoto (`--fallbacks ""` o `fallbacks: []` nel payload/API del job) rende l'esecuzione Cron rigorosa.
- Quando un job ha `--model` ma non è configurato alcun elenco fallback, OpenClaw passa un override fallback vuoto esplicito così che il primario dell'agente non venga aggiunto come destinazione di retry nascosta.
- I controlli preflight dei provider locali attraversano i fallback configurati prima di marcare un'esecuzione Cron come `skipped`.

`openclaw doctor` segnala i job che hanno già `payload.model` impostato, inclusi i conteggi per namespace provider e le discrepanze rispetto a `agents.defaults.model`. Usa quel controllo quando il comportamento di autenticazione, provider o fatturazione appare diverso tra chat live e job pianificati.

### Precedenza del modello Cron isolato

Cron isolato risolve il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per job.
3. Override del modello cron-session memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello agente o predefinito.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override di sessione `fastMode` memorizzato prevale comunque sulla configurazione. Quando la modalità risolta è `auto`, la soglia usa il valore `params.fastAutoOnSeconds` del modello selezionato, con valore predefinito di 60 secondi.

### Retry dei cambi modello live

Se un'esecuzione isolata lancia `LiveSessionModelSwitchError`, Cron persiste il provider e il modello selezionati dal cambio (e l'override del profilo di autenticazione cambiato quando presente) per l'esecuzione attiva prima di ritentare. Il ciclo di retry esterno è limitato a due retry di cambio dopo il tentativo iniziale, poi interrompe invece di ciclare per sempre.

## Output dell'esecuzione e rifiuti

### Soppressione degli acknowledgement obsoleti

I turni Cron isolati sopprimono risposte obsolete contenenti solo acknowledgement. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripropone una volta il prompt per il risultato reale prima della consegna.

### Soppressione del token silenzioso

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso riepilogo fallback in coda, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni cron isolate usano i metadati strutturati di negazione dell'esecuzione provenienti dall'esecuzione incorporata come segnale di negazione autorevole. Rispettano anche i wrapper `UNAVAILABLE` dell'host del nodo quando il messaggio di errore strutturato annidato inizia con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`.

Cron non classifica la prosa dell'output finale o frasi di rifiuto simili ad approvazioni come negazioni, a meno che l'esecuzione incorporata non fornisca anche metadati di negazione strutturati, quindi il testo ordinario dell'assistente non viene trattato come un comando bloccato.

`cron list` e la cronologia delle esecuzioni mostrano il motivo della negazione invece di segnalare un comando bloccato come `ok`.

## Conservazione

Conservazione e pruning sono controllati nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.keepLines` elimina le righe conservate della cronologia delle esecuzioni SQLite per job. `cron.runLog.maxBytes` resta accettato per compatibilità con i vecchi log di esecuzione basati su file.

## Migrazione dei job meno recenti

<Note>
Se hai job cron precedenti all'attuale formato di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello incluso `threadId` legacy, alias di consegna del payload `provider`) e migra i job di fallback Webhook con `notify: true` da `cron.webhook` a una consegna Webhook esplicita. I job che annunciano già in una chat mantengono quella consegna e ricevono una destinazione Webhook di completamento. Quando `cron.webhook` non è impostato, il marcatore inerte di primo livello `notify` viene rimosso per i job senza destinazione di migrazione (la consegna esistente viene conservata invariata), quindi `doctor --fix` non continua più ad avvisare ripetutamente su di essi.
</Note>

## Modifiche comuni

Aggiorna le impostazioni di consegna senza modificare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un job isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita il contesto di bootstrap leggero per un job isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia in un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annuncia in un topic di forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crea un job isolato con contesto di bootstrap leggero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai job isolati di turno agente. Per le esecuzioni cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero insieme di bootstrap dell'area di lavoro.

Crea un job di comando con argv, cwd, env, stdin e limiti di output esatti:

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

`openclaw cron list` mostra tutti i job corrispondenti per impostazione predefinita. Passa `--agent <id>` per mostrare solo i job il cui id agente normalizzato effettivo corrisponde; i job senza un id agente memorizzato contano come agente predefinito configurato.

`openclaw cron get <job-id>` restituisce direttamente il JSON del job memorizzato. Usa `cron show <job-id>` quando vuoi la vista leggibile dall'uomo con anteprima della rotta di consegna.

`cron list --json` e `cron show <job-id> --json` includono un campo `status` di primo livello su ogni job, calcolato da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Questo rispecchia la colonna di stato leggibile dall'uomo, così gli strumenti esterni possono leggere lo stato del job senza ricalcolarlo.

Le voci di `cron runs` includono diagnostica di consegna con il target cron previsto, il target risolto, gli invii degli strumenti di messaggistica, l'uso del fallback e lo stato di consegna.

Riassegnazione di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` viene omesso nei job di turno agente e ripiega sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

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
