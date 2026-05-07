---
read_when:
    - Vuoi processi pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianifica ed esegue attività in background)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i job Cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per l'intera superficie dei comandi. Consulta [Job Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un nuovo ID sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica della sessione isolata">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Instradamento di canale e gruppo, criterio di invio/coda, elevazione, origine e associazione del runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Recapito

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di recapito risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

I destinatari con prefisso di provider possono disambiguare canali di annuncio non risolti. Per esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o `last`. Solo i prefissi dichiarati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` restano sintassi di destinazione di proprietà del canale.

<Note>
I job `cron add` isolati usano per impostazione predefinita il recapito `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta come alias deprecato di `--announce`.
</Note>

### Proprietà del recapito

Il recapito chat Cron isolato è condiviso tra l'agente e l'esecutore:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` recapita in fallback la risposta finale solo quando l'agente non ha inviato direttamente al destinatario risolto.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita il recapito di fallback dell'esecutore.

`--announce` è il recapito di fallback dell'esecutore per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva preservano il destinatario di recapito della chat live per il recapito di annuncio di fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider sensibili alle maiuscole, come gli ID delle stanze Matrix.

### Recapito degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel job.
2. `cron.failureDestination` globale.
3. Il destinatario di annuncio principale del job (quando non è impostata una destinazione di errore esplicita).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di recapito primaria è `webhook`. I job isolati lo accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del job anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori
degli errori e attivano le notifiche di errore.

## Pianificazione

### Job una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date/ore senza offset vengono trattate come UTC a meno che non passi anche `--tz <iana>`, che interpreta l'ora locale nel fuso orario indicato.

<Note>
I job una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Job ricorrenti

I job ricorrenti usano un backoff esponenziale dei retry dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate vengono tracciate separatamente dagli errori di esecuzione. Non influiscono sul backoff dei retry, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere gli avvisi di errore nelle notifiche ripetute per esecuzioni saltate.

Per i job isolati che puntano a un provider di modelli locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su loopback, rete privata e `.local` vengono verificati su `/api/tags`; i provider locali compatibili con OpenAI, come vLLM, SGLang e LM Studio, vengono verificati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; gli endpoint non attivi corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti job martellino lo stesso server locale.

Nota: le definizioni dei job Cron risiedono in `jobs.json`, mentre lo stato runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture solo di formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` restituisce non appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se in scadenza".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ricorrere alla selezione del modello dell'agente del job o del modello predefinito.
</Warning>

Cron `--model` è un **primario del job**, non un override `/model` della sessione chat. Questo significa:

- I fallback del modello configurati continuano ad applicarsi quando il modello del job selezionato fallisce.
- `fallbacks` nel payload per job sostituisce l'elenco di fallback configurato quando presente.
- Un elenco di fallback per job vuoto (`fallbacks: []` nel payload/API del job) rende rigorosa l'esecuzione Cron.
- Quando un job ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito così il primario dell'agente non viene aggiunto come destinatario di retry nascosto.

### Precedenza del modello Cron isolato

Cron isolato risolve il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per job.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinito.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` della sessione memorizzata ha comunque la precedenza sulla configurazione.

### Retry per cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato quando presente) per l'esecuzione attiva prima di riprovare. Il ciclo di retry esterno è limitato a due retry di cambio dopo il tentativo iniziale, poi si interrompe invece di ciclare all'infinito.

## Output di esecuzione e dinieghi

### Soppressione degli acknowledgment obsoleti

I turni Cron isolati sopprimono le risposte obsolete composte solo da acknowledgment. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron richiede una volta di nuovo il risultato reale prima del recapito.

### Soppressione del token silenzioso

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia il recapito diretto in uscita sia il percorso di riepilogo in coda di fallback, quindi nulla viene pubblicato di nuovo in chat.

### Dinieghi strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di diniego dell'esecuzione dall'esecuzione incorporata, poi ripiegano su marcatori di diniego noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto legate all'associazione di approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del diniego invece di riportare un comando bloccato come `ok`.

## Conservazione

La conservazione e la potatura sono controllate nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione dei job meno recenti

<Note>
Se hai job Cron precedenti al formato di recapito e archiviazione corrente, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di recapito di primo livello inclusi `threadId` legacy, alias di recapito `provider` del payload) e migra i job di fallback webhook semplici `notify: true` al recapito webhook esplicito quando `cron.webhook` è configurato.

Doctor rimuove anche i sentinella Cron persistiti `payload.model` come `"default"`, `"null"`, stringhe vuote e JSON `null`. Il runtime Cron tratta comunque qualsiasi stringa `payload.model` non vuota come override esplicito del modello e la valida rispetto a `agents.defaults.models`; ometti la chiave del modello quando un job deve usare la selezione del modello dell'agente/predefinito.
</Note>

## Modifiche comuni

Aggiorna le impostazioni di recapito senza cambiare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita il recapito per un job isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita il contesto di bootstrap leggero per un job isolato:

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

Crea un job isolato con contesto di bootstrap leggero:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai job di turno agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap dell'area di lavoro.

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

`openclaw cron list` mostra per impostazione predefinita tutti i job corrispondenti. Passa `--agent <id>` per mostrare solo i job il cui ID agente normalizzato effettivo corrisponde; i job senza un ID agente memorizzato contano come l'agente predefinito configurato.

Le voci di `cron runs` includono diagnostica di recapito con il destinatario Cron previsto, il destinatario risolto, gli invii tramite strumento message, l'uso del fallback e lo stato di recapito.

Ridefinizione del target di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` è omesso nei job di turno agente e ripiega sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Ritocchi al recapito:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
