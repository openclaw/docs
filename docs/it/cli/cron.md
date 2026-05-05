---
read_when:
    - Vuoi attività pianificate e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (programmare ed eseguire attività in secondo piano)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
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
    - `isolated` crea una nuova trascrizione e un id sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` si fissa a una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Routing di canali e gruppi, criteri di invio/accodamento, elevazione, origine e associazione del runtime ACP vengono reimpostati per la nuova esecuzione. Preferenze sicure e override espliciti di modello o autenticazione selezionati dall'utente possono essere mantenuti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano un'anteprima della rotta di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la rotta è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

I target con prefisso del provider possono disambiguare i canali di annuncio non risolti. Ad esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o `last`. Solo i prefissi pubblicizzati dal plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. Prefissi di servizio come `imessage:` e `sms:` restano sintassi di target di proprietà del canale.

<Note>
I job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna delle chat Cron isolate è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una rotta chat.
- `announce` consegna il fallback della risposta finale solo quando l'agente non ha inviato direttamente al target risolto.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita la consegna di fallback del runner.

`--announce` è la consegna di fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback, ma non rimuove lo strumento `message` dell'agente quando è disponibile una rotta chat.

I promemoria creati da una chat attiva conservano il target di consegna della chat live per la consegna di annuncio di fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider sensibili alle maiuscole/minuscole, come gli ID stanza Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel job.
2. `cron.failureDestination` globale.
3. Il target di annuncio primario del job (quando non è impostata alcuna destinazione di errore esplicita).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna primaria è `webhook`. I job isolati lo accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del job anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i
contatori di errore e attivano le notifiche di errore.

## Pianificazione

### Job una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset sono trattate come UTC, a meno che non passi anche `--tz <iana>`, che interpreta l'ora di calendario nel fuso orario specificato.

<Note>
I job una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Job ricorrenti

I job ricorrenti usano un backoff esponenziale dei tentativi dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate vengono tracciate separatamente dagli errori di esecuzione. Non influiscono sul backoff dei tentativi, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere nelle segnalazioni di errore notifiche ripetute per esecuzioni saltate.

Per i job isolati che puntano a un provider di modello locale configurato, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su local loopback, rete privata e `.local` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI come vLLM, SGLang e LM Studio vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e ritentata in una pianificazione successiva; gli endpoint non disponibili corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti job martellino lo stesso server locale.

Nota: le definizioni dei job Cron risiedono in `jobs.json`, mentre lo stato runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture di sola formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` restituisce il risultato non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente, cioè "esegui solo se dovuto".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ripiegare sull'agente del job o sulla selezione del modello predefinita.
</Warning>

`--model` di Cron è un **primario del job**, non un override `/model` della sessione chat. Questo significa che:

- I fallback dei modelli configurati si applicano ancora quando il modello del job selezionato fallisce.
- Il payload `fallbacks` per job sostituisce l'elenco di fallback configurato quando presente.
- Un elenco di fallback per job vuoto (`fallbacks: []` nel payload/API del job) rende l'esecuzione Cron rigorosa.
- Quando un job ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito, così il primario dell'agente non viene aggiunto come target di nuovo tentativo nascosto.

### Precedenza del modello Cron isolato

Cron isolato risolve il modello attivo in questo ordine:

1. Override dell'hook Gmail.
2. `--model` per job.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinita.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` della sessione memorizzata prevale comunque sulla configurazione.

### Nuovi tentativi dopo cambio di modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron conserva il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato quando presente) per l'esecuzione attiva prima di ritentare. Il ciclo di tentativi esterno è limitato a due tentativi di cambio dopo il tentativo iniziale, poi interrompe invece di ciclare all'infinito.

## Output dell'esecuzione e dinieghi

### Soppressione dei riconoscimenti obsoleti

I turni Cron isolati sopprimono le risposte obsolete composte solo da riconoscimento. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione di sottoagente discendente è responsabile della risposta finale, Cron richiede una sola volta il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla nella chat.

### Dinieghi strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di diniego dell'esecuzione dall'esecuzione incorporata, poi ripiegano su marcatori di diniego noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto legate all'approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del diniego invece di segnalare un comando bloccato come `ok`.

## Conservazione

Conservazione e pruning sono controllati nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione di job precedenti

<Note>
Se hai job Cron creati prima del formato corrente di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello incluso `threadId` legacy, alias di consegna `provider` nel payload) e migra i job webhook di fallback semplici con `notify: true` a consegna webhook esplicita quando `cron.webhook` è configurato.
</Note>

## Modifiche comuni

Aggiorna le impostazioni di consegna senza cambiare il messaggio:

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

Annuncia a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annuncia a un argomento forum Telegram:

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

`--light-context` si applica solo ai job con turno dell'agente isolato. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap del workspace.

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

`openclaw cron list` mostra per impostazione predefinita tutti i job corrispondenti. Passa `--agent <id>` per mostrare solo i job il cui id agente normalizzato effettivo corrisponde; i job senza un id agente memorizzato contano come l'agente predefinito configurato.

Le voci di `cron runs` includono diagnostica di consegna con il target Cron previsto, il target risolto, gli invii dello strumento message, l'uso del fallback e lo stato consegnato.

Reindirizzamento di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` è omesso nei job con turno dell'agente e ripiega sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

Ritocchi di consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
