---
read_when:
    - Vuoi attività pianificate e risvegli
    - Stai diagnosticando l'esecuzione di Cron e i registri
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire job in background)
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestisci i job cron per lo scheduler del Gateway.

<Tip>
Esegui `openclaw cron --help` per la superficie completa dei comandi. Consulta [Job Cron](/it/automation/cron-jobs) per la guida concettuale.
</Tip>

## Sessioni

`--session` accetta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Chiavi di sessione">
    - `main` si associa alla sessione principale dell'agente.
    - `isolated` crea una trascrizione nuova e un id sessione per ogni esecuzione.
    - `current` si associa alla sessione attiva al momento della creazione.
    - `session:<id>` fissa una chiave di sessione persistente esplicita.

  </Accordion>
  <Accordion title="Semantica delle sessioni isolate">
    Le esecuzioni isolate reimpostano il contesto di conversazione ambientale. Instradamento di canale e gruppo, criterio di invio/accodamento, elevazione, origine e binding runtime ACP vengono reimpostati per la nuova esecuzione. Le preferenze sicure e gli override espliciti di modello o auth selezionati dall'utente possono essere trasferiti tra le esecuzioni.
  </Accordion>
</AccordionGroup>

## Consegna

`openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale o corrente, oppure se fallirà in modo chiuso.

I target con prefisso provider possono disambiguare i canali di annuncio non risolti. Per esempio, `to: "telegram:123"` seleziona Telegram quando `delivery.channel` è omesso o `last`. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso deve corrispondere a quel canale; `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato. I prefissi di servizio come `imessage:` e `sms:` restano sintassi di target di proprietà del canale.

<Note>
I job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` resta un alias deprecato di `--announce`.
</Note>

### Proprietà della consegna

La consegna chat cron isolata è condivisa tra l'agente e il runner:

- L'agente può inviare direttamente usando lo strumento `message` quando è disponibile una route chat.
- `announce` consegna in fallback la risposta finale solo quando l'agente non ha inviato direttamente al target risolto.
- `webhook` pubblica il payload completato a un URL.
- `none` disabilita la consegna fallback del runner.

`--announce` è la consegna fallback del runner per la risposta finale. `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

I promemoria creati da una chat attiva conservano il target di consegna della chat live per la consegna announce di fallback. Le chiavi di sessione interne possono essere minuscole; non usarle come fonte di verità per ID provider con distinzione tra maiuscole e minuscole, come gli ID stanza Matrix.

### Consegna degli errori

Le notifiche di errore vengono risolte in questo ordine:

1. `delivery.failureDestination` nel job.
2. `cron.failureDestination` globale.
3. Il target announce primario del job (quando non è impostata alcuna destinazione di errore esplicita).

<Note>
I job della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna primaria è `webhook`. I job isolati lo accettano in tutte le modalità.
</Note>

Nota: le esecuzioni cron isolate trattano i fallimenti dell'agente a livello di esecuzione come errori del job anche quando
non viene prodotto alcun payload di risposta, quindi i fallimenti di modello/provider incrementano comunque i contatori di errore
e attivano le notifiche di errore.

Se un'esecuzione isolata va in timeout prima della prima richiesta al modello, `openclaw cron show`
e `openclaw cron runs` includono un errore specifico della fase, come
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Per i provider supportati da CLI, il watchdog pre-modello resta attivo finché il turno della CLI esterna
non inizia, quindi blocchi di lookup sessione, hook, auth, prompt e configurazione CLI vengono
segnalati come fallimenti cron pre-modello.

## Pianificazione

### Job una tantum

`--at <datetime>` pianifica un'esecuzione una tantum. Le date e ore senza offset sono trattate come UTC a meno che non passi anche `--tz <iana>`, che interpreta l'ora di calendario nel fuso orario specificato.

<Note>
I job una tantum vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.
</Note>

### Job ricorrenti

I job ricorrenti usano backoff esponenziale dei retry dopo errori consecutivi: 30s, 1m, 5m, 15m, 60m. La pianificazione torna normale dopo la successiva esecuzione riuscita.

Le esecuzioni saltate sono tracciate separatamente dagli errori di esecuzione. Non influiscono sul backoff dei retry, ma `openclaw cron edit <job-id> --failure-alert-include-skipped` può includere negli avvisi di errore notifiche ripetute per le esecuzioni saltate.

Per i job isolati che hanno come target un provider di modello locale configurato, cron esegue un preflight leggero del provider prima di avviare il turno dell'agente. I provider `api: "ollama"` su Loopback, rete privata e `.local` vengono verificati su `/api/tags`; i provider locali compatibili con OpenAI come vLLM, SGLang e LM Studio vengono verificati su `/models`. Se l'endpoint non è raggiungibile, l'esecuzione viene registrata come `skipped` e ritentata in una pianificazione successiva; gli endpoint non attivi corrispondenti vengono memorizzati nella cache per 5 minuti per evitare che molti job martellino lo stesso server locale.

Nota: le definizioni dei job cron risiedono in `jobs.json`, mentre lo stato runtime in sospeso risiede in `jobs-state.json`. Se `jobs.json` viene modificato esternamente, il Gateway ricarica le pianificazioni modificate e cancella gli slot in sospeso obsoleti; le riscritture solo di formattazione non cancellano lo slot in sospeso.

### Esecuzioni manuali

`openclaw cron run` ritorna non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

<Note>
`openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il comportamento precedente "esegui solo se scaduto".
</Note>

## Modelli

`cron add|edit --model <ref>` seleziona un modello consentito per il job.

<Warning>
Se il modello non è consentito o non può essere risolto, cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ripiegare sulla selezione del modello dell'agente del job o del modello predefinito.
</Warning>

Cron `--model` è un **primario del job**, non un override `/model` della sessione chat. Questo significa:

- I fallback di modello configurati si applicano comunque quando il modello del job selezionato fallisce.
- Il payload per job `fallbacks` sostituisce l'elenco di fallback configurato quando è presente.
- Un elenco di fallback per job vuoto (`fallbacks: []` nel payload/API del job) rende l'esecuzione cron rigorosa.
- Quando un job ha `--model` ma non è configurato alcun elenco di fallback, OpenClaw passa un override di fallback vuoto esplicito, così il primario dell'agente non viene aggiunto come target di retry nascosto.

### Precedenza dei modelli cron isolati

Cron isolato risolve il modello attivo in questo ordine:

1. Override hook Gmail.
2. `--model` per job.
3. Override del modello della sessione cron memorizzato (quando l'utente ne ha selezionato uno).
4. Selezione del modello dell'agente o predefinito.

### Modalità veloce

La modalità veloce di cron isolato segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override di sessione memorizzato `fastMode` prevale comunque sulla configurazione.

### Retry di cambio modello live

Se un'esecuzione isolata genera `LiveSessionModelSwitchError`, cron persiste il provider e il modello cambiati (e l'override del profilo auth cambiato quando presente) per l'esecuzione attiva prima di ritentare. Il ciclo di retry esterno è limitato a due retry di cambio dopo il tentativo iniziale, poi interrompe invece di ciclare per sempre.

## Output dell'esecuzione e dinieghi

### Soppressione degli acknowledgement obsoleti

I turni cron isolati sopprimono le risposte obsolete composte solo da acknowledgement. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione di subagente discendente è responsabile della risposta finale, cron richiede di nuovo una volta il risultato reale prima della consegna.

### Soppressione dei token silenziosi

Se un'esecuzione cron isolata restituisce solo il token silenzioso (`NO_REPLY` o `no_reply`), cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla nella chat.

### Dinieghi strutturati

Le esecuzioni cron isolate preferiscono i metadati di diniego dell'esecuzione strutturati dall'esecuzione incorporata, poi ripiegano su marcatori di diniego noti nell'output finale, come `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frasi di rifiuto del binding di approvazione.

`cron list` e la cronologia delle esecuzioni mostrano il motivo del diniego invece di riportare un comando bloccato come `ok`.

## Conservazione

Conservazione e pruning sono controllati nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni di esecuzione isolate completate.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` eliminano `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrazione di job più vecchi

<Note>
Se hai job cron precedenti al formato corrente di consegna e archiviazione, esegui `openclaw doctor --fix`. Doctor normalizza i campi cron legacy (`jobId`, `schedule.cron`, campi di consegna di primo livello inclusi `threadId` legacy, alias di consegna `provider` del payload) e migra i job webhook fallback semplici `notify: true` a una consegna webhook esplicita quando `cron.webhook` è configurato.
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

Annuncia a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annuncia a un topic forum Telegram:

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

`--light-context` si applica solo ai job con turno agente isolato. Per le esecuzioni cron, la modalità leggera mantiene vuoto il contesto di bootstrap invece di iniettare l'intero set di bootstrap del workspace.

## Comandi admin comuni

Esecuzione manuale e ispezione:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` mostra per impostazione predefinita tutti i job corrispondenti. Passa `--agent <id>` per mostrare solo i job il cui id agente normalizzato effettivo corrisponde; i job senza un id agente memorizzato contano come l'agente predefinito configurato.

`openclaw cron get <job-id>` restituisce direttamente il JSON del job memorizzato. Usa `cron show <job-id>` quando vuoi la vista leggibile con anteprima della route di consegna.

`cron list --json` e `cron show <job-id> --json` includono un campo `status` di primo livello su ogni job, calcolato da `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valori: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Questo rispecchia la colonna di stato leggibile, così gli strumenti esterni possono leggere lo stato del job senza ricalcolarlo.

Le voci di `cron runs` includono diagnostica di consegna con il target cron previsto, il target risolto, gli invii dello strumento message, l'uso del fallback e lo stato consegnato.

Ritargeting di agente e sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avvisa quando `--agent` è omesso nei job con turno agente e ripiega sull'agente predefinito (`main`). Passa `--agent <id>` al momento della creazione per fissare un agente specifico.

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
