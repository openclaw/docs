---
read_when:
    - Vuoi job pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione e dei log di Cron
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire job in background)
title: Cron
x-i18n:
    generated_at: "2026-04-24T08:33:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gestisci i job Cron per lo scheduler del Gateway.

Correlati:

- Job Cron: [Job Cron](/it/automation/cron-jobs)

Suggerimento: esegui `openclaw cron --help` per la superficie completa dei comandi.

Nota: `openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima il
percorso di consegna risolto. Per `channel: "last"`, l'anteprima mostra se il
percorso è stato risolto dalla sessione principale/corrente o se fallirà in modalità fail-closed.

Nota: i job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere
l'output interno. `--deliver` resta un alias deprecato di `--announce`.

Nota: la consegna chat Cron isolata è condivisa. `--announce` è la consegna fallback del
runner per la risposta finale; `--no-deliver` disabilita quel fallback ma non
rimuove lo strumento `message` dell'agente quando è disponibile un percorso chat.

Nota: i job one-shot (`--at`) vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per mantenerli.

Nota: `--session` supporta `main`, `isolated`, `current` e `session:<id>`.
Usa `current` per collegarti alla sessione attiva al momento della creazione, oppure `session:<id>` per
una chiave di sessione persistente esplicita.

Nota: per i job CLI one-shot, i datetime `--at` senza offset sono trattati come UTC a meno che non passi anche
`--tz <iana>`, che interpreta quell'ora locale nel fuso orario specificato.

Nota: i job ricorrenti ora usano un backoff esponenziale dei retry dopo errori consecutivi (30s → 1m → 5m → 15m → 60m), poi tornano alla pianificazione normale dopo la successiva esecuzione riuscita.

Nota: `openclaw cron run` ora ritorna non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

Nota: `openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il
vecchio comportamento "esegui solo se dovuto".

Nota: i turni Cron isolati sopprimono le risposte obsolete di solo ack. Se il
primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione discendente di sottoagente è
responsabile della risposta finale, Cron riformula una volta la richiesta per ottenere il risultato reale prima della consegna.

Nota: se un'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` /
`no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso fallback
di riepilogo in coda, quindi non viene pubblicato nulla nella chat.

Nota: `cron add|edit --model ...` usa quel modello consentito selezionato per il job.
Se il modello non è consentito, Cron avvisa e usa come fallback la selezione del
modello dell'agente/predefinito per il job. Le catene di fallback configurate continuano ad applicarsi, ma una semplice
sovrascrittura del modello senza una lista di fallback esplicita per job non aggiunge più il modello primario
dell'agente come destinazione di retry extra nascosta.

Nota: la precedenza del modello Cron isolato è prima l'override Gmail-hook, poi `--model`
per job, poi un eventuale override del modello della sessione Cron memorizzata, poi la normale
selezione agente/predefinita.

Nota: la modalità rapida Cron isolata segue la selezione del modello live risolta. La configurazione del modello
`params.fastMode` si applica per impostazione predefinita, ma un override `fastMode`
della sessione memorizzata continua ad avere priorità sulla configurazione.

Nota: se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il
provider/modello cambiato (e l'override del profilo auth cambiato, quando presente) prima di
riprovare. Il ciclo di retry esterno è limitato a 2 retry di cambio dopo il tentativo iniziale, poi termina invece di continuare all'infinito.

Nota: le notifiche di errore usano prima `delivery.failureDestination`, poi
`cron.failureDestination` globale e infine usano come fallback la destinazione announce primaria del job
quando non è configurata alcuna destinazione di errore esplicita.

Nota: la conservazione/potatura è controllata nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni completate delle esecuzioni isolate.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota di aggiornamento: se hai job Cron più vecchi del formato attuale di consegna/store, esegui
`openclaw doctor --fix`. Ora Doctor normalizza i campi legacy di Cron (`jobId`, `schedule.cron`,
campi di consegna di livello superiore inclusi `threadId` legacy, alias di consegna `provider` nel payload) e migra i semplici
job fallback Webhook `notify: true` verso una consegna Webhook esplicita quando `cron.webhook` è
configurato.

## Modifiche comuni

Aggiorna le impostazioni di consegna senza cambiare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un job isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita un contesto bootstrap leggero per un job isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia a un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un job isolato con contesto bootstrap leggero:

```bash
openclaw cron add \
  --name "Brief mattutino leggero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Riassumi gli aggiornamenti della notte." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai job di turno agente isolato. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di inserire l'intero set bootstrap dello spazio di lavoro.

Nota sulla proprietà della consegna:

- La consegna chat Cron isolata è condivisa. L'agente può inviare direttamente con lo
  strumento `message` quando è disponibile un percorso chat.
- `announce` consegna in fallback la risposta finale solo quando l'agente non ha inviato
  direttamente alla destinazione risolta. `webhook` pubblica il payload completato a un URL.
  `none` disabilita la consegna fallback del runner.

## Comandi amministrativi comuni

Esecuzione manuale:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con la destinazione Cron prevista,
la destinazione risolta, gli invii dello strumento message, l'uso del fallback e lo stato di consegna.

Retargeting agente/sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ritocchi della consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sulla consegna degli errori:

- `delivery.failureDestination` è supportato per i job isolati.
- I job della sessione principale possono usare `delivery.failureDestination` solo quando la
  modalità di consegna primaria è `webhook`.
- Se non imposti alcuna destinazione di errore e il job già annuncia a un
  canale, le notifiche di errore riusano la stessa destinazione announce.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
