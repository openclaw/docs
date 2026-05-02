---
read_when:
    - Vuoi processi pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire attività in background)
title: Cron
x-i18n:
    generated_at: "2026-05-02T08:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i processi Cron per il pianificatore del Gateway.

<Tip>
Esegui `openclaw cron --help` per la superficie completa dei comandi. Vedi [Processi Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

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
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Il routing di canale e gruppo, la policy di invio/coda, l'elevazione, l'origine e il binding del runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono propagarsi tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano un'anteprima della route di consegna risolta. Per `channel: "last"`, l'anteprima indica se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

I target con prefisso del provider possono disambiguare i canali di annuncio non risolti. Ad esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o è `last`. Solo i prefissi pubblicizzati dal plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` restano sintassi target di proprietà del canale.

<Note>
I processi `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat Cron isolata è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` consegna in fallback la risposta finale solo quando l'agente non ha inviato direttamente al target risolto.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita la consegna fallback del runner.

`--announce` è la consegna fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva conservano il target di consegna della chat live per la consegna di annuncio fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte autorevole per ID provider con distinzione tra maiuscole e minuscole, come gli ID delle stanze Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel processo.
2. `cron.failureDestination` globale.
3. Il target di annuncio principale del processo (quando non è impostata una destinazione di errore esplicita).

<Note>
I processi della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna principale è `webhook`. I processi isolati lo accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del processo anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori
degli errori e attivano le notifiche di errore.

## Pianificazione

### Processi una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset sono trattate come UTC, a meno che non passi anche `--tz <iana>`, che interpreta l'ora di calendario nel fuso orario indicato.

<Note>
I processi una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Processi ricorrenti

I processi ricorrenti usano un backoff esponenziale dei tentativi dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate sono tracciate separatamente dagli errori di esecuzione. Non influenzano il backoff dei tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere negli avvisi di errore le notifiche ripetute per esecuzioni saltate.

Per i processi isolati che puntano a un provider di modelli locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su local loopback, rete privata e `.local` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI, come vLLM, SGLang e LM Studio, vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; gli endpoint non funzionanti corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti processi sovraccarichino lo stesso server locale.

Nota: le definizioni dei processi Cron risiedono in `jobs.json`, mentre lo stato di runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture di sola formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` restituisce non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se dovuto".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il processo.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di convalida esplicito invece di ricorrere alla selezione del modello dell'agente del processo o a quella predefinita.
</Warning>

Cron `--model` è un **primario del processo**, non un override `/model` della sessione chat. Questo significa:

- I fallback dei modelli configurati si applicano comunque quando il modello del processo selezionato fallisce.
- Il payload per processo `fallbacks` sostituisce l'elenco di fallback configurato quando presente.
- Un elenco di fallback per processo vuoto (`fallbacks: []` nel payload/API del processo) rende l'esecuzione Cron rigorosa.
- Quando un processo ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito, così il primario dell'agente non viene aggiunto come target di nuovo tentativo nascosto.

### Precedenza dei modelli Cron isolati

Cron isolato risolve il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per processo.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinita.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override di sessione `fastMode` memorizzato prevale comunque sulla configurazione.

### Nuovi tentativi di cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron mantiene il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato, quando presente) per l'esecuzione attiva prima di riprovare. Il ciclo esterno di nuovi tentativi è limitato a due tentativi di cambio dopo il tentativo iniziale, poi si interrompe invece di proseguire all'infinito.

## Output dell'esecuzione e dinieghi

### Soppressione degli acknowledgement obsoleti

I turni Cron isolati sopprimono le risposte obsolete di solo acknowledgement. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripropone una volta la richiesta per ottenere il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato fallback, quindi non viene pubblicato nulla nella chat.

### Dinieghi strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di diniego dell'esecuzione dall'esecuzione incorporata, poi ricorrono a marcatori di diniego noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto legate all'approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del diniego invece di riportare un comando bloccato come `ok`.

## Conservazione

La conservazione e la potatura sono controllate nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni completate delle esecuzioni isolate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione di processi meno recenti

<Note>
Se hai processi Cron precedenti all'attuale formato di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello incluso il legacy `threadId`, alias di consegna `provider` del payload) e migra i semplici processi di fallback Webhook `notify: true` alla consegna Webhook esplicita quando `cron.webhook` è configurato.
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

Annunciare a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annunciare a un argomento di un forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Creare un processo isolato con contesto di bootstrap leggero:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi con turno agente isolato. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero insieme di bootstrap dell'area di lavoro.

## Comandi amministrativi comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con il target Cron previsto, il target risolto, gli invii tramite strumento messaggio, l'uso del fallback e lo stato consegnato.

Ridestinazione di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` è omesso nei processi con turno agente e ricorre all'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Regolazioni della consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
