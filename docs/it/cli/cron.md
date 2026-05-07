---
read_when:
    - Vuoi attività pianificate e risvegli
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire job in background)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i processi Cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per la superficie completa dei comandi. Consulta [Processi Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una trascrizione nuova e un id di sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica della sessione isolata">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Routing di canali e gruppi, policy di invio/accodamento, elevazione, origine e associazione del runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

Le destinazioni con prefisso del provider possono disambiguare i canali di annuncio non risolti. Per esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o è `last`. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` restano sintassi di destinazione di proprietà del canale.

<Note>
I processi `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat dei Cron isolati è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` effettua la consegna di fallback della sola risposta finale quando l'agente non ha inviato direttamente alla destinazione risolta.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita la consegna di fallback del runner.

`--announce` è la consegna di fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva mantengono la destinazione di consegna della chat live per la consegna announce di fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider con distinzione tra maiuscole e minuscole, come gli ID stanza Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel processo.
2. `cron.failureDestination` globale.
3. La destinazione announce primaria del processo (quando non è impostata una destinazione di errore esplicita).

<Note>
I processi della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna primaria è `webhook`. I processi isolati la accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del processo anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori di errore
e attivano le notifiche di errore.

## Pianificazione

### Processi una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset vengono trattate come UTC, a meno che tu non passi anche `--tz <iana>`, che interpreta l'orario a parete nel fuso orario indicato.

<Note>
Per impostazione predefinita, i processi una tantum vengono eliminati dopo il successo. Usa `--keep-after-run` per conservarli.
</Note>

### Processi ricorrenti

I processi ricorrenti usano un backoff esponenziale dei tentativi dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna alla normalità dopo la successiva esecuzione riuscita.

Le esecuzioni saltate vengono tracciate separatamente dagli errori di esecuzione. Non influenzano il backoff dei tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere gli avvisi di errore nelle notifiche ripetute per le esecuzioni saltate.

Per i processi isolati che usano come destinazione un provider di modelli locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su loopback, rete privata e `.local` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI, come vLLM, SGLang e LM Studio, vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; gli endpoint inattivi corrispondenti vengono memorizzati in cache per 5 minuti per evitare che molti processi colpiscano lo stesso server locale.

Nota: le definizioni dei processi Cron risiedono in `jobs.json`, mentre lo stato runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture di sola formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` restituisce non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se dovuto".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il processo.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ricadere sulla selezione del modello dell'agente del processo o predefinito.
</Warning>

`--model` di Cron è un **primario del processo**, non un override `/model` della sessione chat. Questo significa:

- I fallback dei modelli configurati si applicano comunque quando il modello selezionato per il processo fallisce.
- Il payload per processo `fallbacks` sostituisce la lista di fallback configurata quando presente.
- Una lista di fallback per processo vuota (`fallbacks: []` nel payload/API del processo) rende l'esecuzione Cron rigorosa.
- Quando un processo ha `--model` ma non è configurata alcuna lista di fallback, OpenClaw passa un override di fallback vuoto esplicito, così il modello primario dell'agente non viene aggiunto come destinazione di nuovo tentativo nascosta.

### Precedenza dei modelli nei Cron isolati

I Cron isolati risolvono il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per processo.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinito.

### Modalità veloce

La modalità veloce dei Cron isolati segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` di sessione memorizzato ha comunque la precedenza sulla configurazione.

### Tentativi di cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato, quando presente) per l'esecuzione attiva prima di riprovare. Il ciclo di tentativi esterno è limitato a due tentativi di cambio dopo il tentativo iniziale, poi si interrompe invece di continuare all'infinito.

## Output dell'esecuzione e rifiuti

### Soppressione delle conferme obsolete

I turni Cron isolati sopprimono le risposte obsolete costituite solo da conferme. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripropone una volta la richiesta per ottenere il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla in chat.

### Rifiuti strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di rifiuto dell'esecuzione dall'esecuzione incorporata, poi ricadono su marcatori di rifiuto noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto legate all'approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto invece di riportare un comando bloccato come `ok`.

## Conservazione

Conservazione e pruning sono controllati nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione di processi precedenti

<Note>
Se hai processi Cron precedenti al formato attuale di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello inclusi `threadId` legacy, alias di consegna `provider` del payload) e migra i semplici processi di fallback Webhook `notify: true` alla consegna Webhook esplicita quando `cron.webhook` è configurato.
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

Annuncia a un argomento di forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crea un processo isolato con contesto di bootstrap leggero:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi di turno agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap del workspace.

## Comandi amministrativi comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` mostra per impostazione predefinita tutti i processi corrispondenti. Passa `--agent <id>` per mostrare solo i processi il cui id agente normalizzato effettivo corrisponde; i processi senza un id agente memorizzato contano come l'agente predefinito configurato.

`cron list --json` e `cron show <job-id> --json` includono un campo `status` di primo livello su ogni processo, calcolato da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Questo rispecchia la colonna di stato leggibile dalle persone, così gli strumenti esterni possono leggere lo stato del processo senza ricalcolarlo.

Le voci di `cron runs` includono diagnostica di consegna con la destinazione Cron prevista, la destinazione risolta, gli invii dello strumento messaggio, l'uso del fallback e lo stato consegnato.

Riassegnazione di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` è omesso nei processi di turno agente e ricade sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Ritocchi della consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
