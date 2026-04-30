---
read_when:
    - Vuoi attività pianificate e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire job in background)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i processi Cron per il pianificatore del Gateway.

<Tip>
Esegui `openclaw cron --help` per la superficie completa del comando. Vedi [Processi Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si collega alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un id sessione per ogni esecuzione.
    - `current` si collega alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto ambientale della conversazione. Routing di canale e gruppo, criterio di invio/coda, elevazione, origine e associazione runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano un'anteprima della route di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

<Note>
I processi `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` rimane un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna in chat dei Cron isolati è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route di chat.
- `announce` consegna come fallback solo la risposta finale quando l'agente non ha inviato direttamente al target risolto.
- `webhook` pubblica il payload completato su un URL.
- `none` disabilita la consegna di fallback del runner.

`--announce` è la consegna di fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route di chat.

I promemoria creati da una chat attiva conservano il target di consegna della chat live per la consegna di fallback tramite announce. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider con distinzione tra maiuscole e minuscole, come gli ID delle stanze Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel processo.
2. `cron.failureDestination` globale.
3. Il target announce principale del processo (quando non è impostata alcuna destinazione di errore esplicita).

<Note>
I processi della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna principale è `webhook`. I processi isolati lo accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del processo anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori degli errori
e attivano le notifiche di errore.

## Pianificazione

### Processi una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset vengono trattate come UTC, a meno che tu non passi anche `--tz <iana>`, che interpreta l'orario civile nel fuso orario specificato.

<Note>
I processi una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Processi ricorrenti

I processi ricorrenti usano un backoff esponenziale dei tentativi dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate vengono tracciate separatamente dagli errori di esecuzione. Non influenzano il backoff dei tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere negli avvisi di errore le notifiche ripetute per esecuzioni saltate.

Per i processi isolati che puntano a un provider di modelli locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider local loopback, su rete privata e `.local` con `api: "ollama"` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI, come vLLM, SGLang e LM Studio, vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e ritentata in una pianificazione successiva; gli endpoint non attivi corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti processi sovraccarichino lo stesso server locale.

Nota: le definizioni dei processi Cron si trovano in `jobs.json`, mentre lo stato runtime in sospeso si trova in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture solo di formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` ritorna non appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se dovuto".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il processo.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ripiegare sull'agente del processo o sulla selezione del modello predefinita.
</Warning>

Cron `--model` è una **primaria del processo**, non un override `/model` della sessione di chat. Questo significa:

- I fallback dei modelli configurati continuano ad applicarsi quando il modello selezionato per il processo fallisce.
- Il payload per processo `fallbacks` sostituisce l'elenco di fallback configurato quando è presente.
- Un elenco di fallback per processo vuoto (`fallbacks: []` nel payload/API del processo) rende rigorosa l'esecuzione Cron.
- Quando un processo ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito affinché la primaria dell'agente non venga aggiunta come target di nuovo tentativo nascosto.

### Precedenza dei modelli per Cron isolato

Cron isolato risolve il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per processo.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione dell'agente o del modello predefinito.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` della sessione memorizzato prevale comunque sulla configurazione.

### Nuovi tentativi dopo cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato, quando presente) per l'esecuzione attiva prima di riprovare. Il ciclo esterno di retry è limitato a due retry di cambio dopo il tentativo iniziale, poi si interrompe invece di entrare in un ciclo infinito.

## Output di esecuzione e rifiuti

### Soppressione degli acknowledgement obsoleti

I turni Cron isolati sopprimono le risposte obsolete di solo acknowledgement. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripropone una volta la richiesta per ottenere il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo in coda di fallback, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di rifiuto dell'esecuzione dall'esecuzione incorporata, quindi ripiegano su marker di rifiuto noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto legate all'approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto invece di segnalare un comando bloccato come `ok`.

## Conservazione

La conservazione e la potatura sono controllate nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione dei processi meno recenti

<Note>
Se hai processi Cron precedenti all'attuale formato di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello inclusi `threadId` legacy, alias di consegna `provider` del payload) e migra i semplici processi di fallback webhook con `notify: true` alla consegna webhook esplicita quando `cron.webhook` è configurato.
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

Annunciare a un topic di forum Telegram:

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

`--light-context` si applica solo ai processi con turno dell'agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap dell'area di lavoro.

## Comandi di amministrazione comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con il target Cron previsto, il target risolto, gli invii tramite strumento message, l'uso del fallback e lo stato consegnato.

Ridirezionamento di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` viene omesso nei processi con turno dell'agente e ripiega sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Ritocchi alla consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
