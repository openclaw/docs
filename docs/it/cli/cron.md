---
read_when:
    - Vuoi attività pianificate e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire attività in secondo piano)
title: Cron
x-i18n:
    generated_at: "2026-04-30T08:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i job Cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per l'intera superficie dei comandi. Consulta [job Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una nuova trascrizione e un id sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` vincola a una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Routing di canali e gruppi, criterio di invio/coda, elevazione, origine e associazione runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o autenticazione selezionati dall'utente possono propagarsi tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la rotta di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la rotta è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

<Note>
I job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` rimane come alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat Cron isolata è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una rotta chat.
- `announce` esegue la consegna di fallback della sola risposta finale quando l'agente non ha inviato direttamente al target risolto.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita la consegna di fallback del runner.

`--announce` è la consegna di fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una rotta chat.

I promemoria creati da una chat attiva preservano il target di consegna chat live per la consegna announce di fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider sensibili alle maiuscole/minuscole, come gli ID stanza Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` sul job.
2. `cron.failureDestination` globale.
3. Il target announce principale del job (quando non è impostata alcuna destinazione di errore esplicita).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna principale è `webhook`. I job isolati la accettano in tutte le modalità.
</Note>

Nota: le esecuzioni Cron isolate trattano gli errori dell'agente a livello di esecuzione come errori del job anche quando
non viene prodotto alcun payload di risposta, quindi gli errori di modello/provider incrementano comunque i contatori
di errore e attivano le notifiche di errore.

## Pianificazione

### Job una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset sono trattate come UTC, a meno che tu non passi anche `--tz <iana>`, che interpreta l'ora di calendario nel fuso orario specificato.

<Note>
I job una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per preservarli.
</Note>

### Job ricorrenti

I job ricorrenti usano un backoff di nuovo tentativo esponenziale dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate sono tracciate separatamente dagli errori di esecuzione. Non influiscono sul backoff di nuovo tentativo, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere gli avvisi di errore nelle notifiche ripetute di esecuzione saltata.

Per i job isolati che puntano a un provider di modello configurato localmente, Cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider Loopback, private-network e `.local` `api: "ollama"` vengono sondati su `/api/tags`; i provider locali compatibili con OpenAI, come vLLM, SGLang e LM Studio, vengono sondati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e riprovata in una pianificazione successiva; gli endpoint non funzionanti corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti job martellino lo stesso server locale.

Nota: le definizioni dei job Cron risiedono in `jobs.json`, mentre lo stato runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture di sola formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` restituisce non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` esegue forzatamente per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se in scadenza".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job.

<Warning>
Se il modello non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di convalida esplicito invece di ripiegare sull'agente del job o sulla selezione del modello predefinito.
</Warning>

Cron `--model` è un **primario del job**, non un override `/model` della sessione chat. Ciò significa:

- I fallback dei modelli configurati continuano ad applicarsi quando il modello selezionato per il job fallisce.
- Il payload per job `fallbacks` sostituisce l'elenco dei fallback configurati quando presente.
- Un elenco di fallback per job vuoto (`fallbacks: []` nel payload/API del job) rende l'esecuzione Cron rigorosa.
- Quando un job ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito, così il primario dell'agente non viene aggiunto come target di nuovo tentativo nascosto.

### Precedenza dei modelli Cron isolati

Cron isolato risolve il modello attivo in questo ordine:

1. Override Gmail-hook.
2. `--model` per job.
3. Override del modello della sessione Cron memorizzato (quando l'utente ne ha selezionato uno).
4. Agente o selezione del modello predefinito.

### Modalità veloce

La modalità veloce di Cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` della sessione memorizzata prevale comunque sulla configurazione.

### Nuovi tentativi di cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il provider e il modello cambiati (e l'override del profilo di autenticazione cambiato quando presente) per l'esecuzione attiva prima di riprovare. Il ciclo esterno di nuovo tentativo è limitato a due nuovi tentativi di cambio dopo il tentativo iniziale, poi si interrompe invece di andare in loop per sempre.

## Output di esecuzione e rifiuti

### Soppressione delle conferme obsolete

I turni Cron isolati sopprimono le risposte obsolete di sola conferma. Se il primo risultato è solo un aggiornamento di stato provvisorio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, Cron ripropone una volta la richiesta per ottenere il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla nella chat.

### Rifiuti strutturati

Le esecuzioni Cron isolate preferiscono i metadati strutturati di rifiuto dell'esecuzione dall'esecuzione incorporata, poi ripiegano sui marcatori di rifiuto noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto dell'associazione di approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del rifiuto invece di riportare un comando bloccato come `ok`.

## Conservazione

Conservazione e pruning sono controllati nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione dei job più vecchi

<Note>
Se hai job Cron precedenti al formato corrente di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi Cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello incluso il legacy `threadId`, alias di consegna `provider` del payload) e migra i job di fallback webhook semplici `notify: true` alla consegna webhook esplicita quando `cron.webhook` è configurato.
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

Abilita il contesto bootstrap leggero per un job isolato:

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

Crea un job isolato con contesto bootstrap leggero:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai job di turno agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di iniettare l'intero set bootstrap dell'area di lavoro.

## Comandi amministrativi comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci `cron runs` includono diagnostica di consegna con il target Cron previsto, il target risolto, gli invii dello strumento message, l'uso del fallback e lo stato consegnato.

Riassegnazione di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

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
