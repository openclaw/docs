---
read_when:
    - Vuoi job pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire job in background)
title: Cron
x-i18n:
    generated_at: "2026-04-23T08:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
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
percorso è stato risolto dalla sessione principale/corrente oppure se verrà
bloccato in modo fail-closed.

Nota: i job isolati di `cron add` usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere
l'output interno. `--deliver` resta disponibile come alias deprecato di `--announce`.

Nota: la consegna alla chat per Cron isolato è condivisa. `--announce` è la consegna di fallback
del runner per la risposta finale; `--no-deliver` disabilita quel fallback ma
non rimuove lo strumento `message` dell'agente quando è disponibile un percorso chat.

Nota: i job one-shot (`--at`) vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.

Nota: `--session` supporta `main`, `isolated`, `current` e `session:<id>`.
Usa `current` per collegarti alla sessione attiva al momento della creazione, oppure `session:<id>` per
una chiave di sessione persistente esplicita.

Nota: per i job CLI one-shot, i datetime `--at` senza offset vengono trattati come UTC a meno che tu non passi anche
`--tz <iana>`, che interpreta quell'ora locale nel fuso orario specificato.

Nota: i job ricorrenti ora usano un backoff di retry esponenziale dopo errori consecutivi (30s → 1m → 5m → 15m → 60m), quindi tornano alla pianificazione normale dopo la successiva esecuzione riuscita.

Nota: `openclaw cron run` ora restituisce il controllo non appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

Nota: `openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il
vecchio comportamento "esegui solo se dovuto".

Nota: le esecuzioni Cron isolate sopprimono le risposte obsolete contenenti solo conferma. Se il
primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione subagent discendente
è responsabile della risposta finale, Cron ripropone una volta il prompt per ottenere il risultato reale prima della consegna.

Nota: se un'esecuzione isolata di Cron restituisce solo il token silenzioso (`NO_REPLY` /
`no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback,
quindi non viene pubblicato nulla nella chat.

Nota: `cron add|edit --model ...` usa per il job quel modello consentito selezionato.
Se il modello non è consentito, Cron avvisa e usa invece il fallback alla selezione
del modello del job agente/predefinito. Le catene di fallback configurate continuano ad applicarsi, ma una semplice
sovrascrittura del modello senza un elenco di fallback esplicito per job non aggiunge più il primario
dell'agente come destinazione di retry extra nascosta.

Nota: la precedenza del modello per Cron isolato è prima l'override Gmail-hook, poi `--model` per job,
poi qualsiasi override del modello di sessione Cron memorizzato, quindi la normale selezione
agente/predefinita.

Nota: la modalità rapida di Cron isolato segue la selezione del modello live risolta. La configurazione del
modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode`
di sessione memorizzato ha comunque la precedenza sulla configurazione.

Nota: se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il
provider/modello cambiato (e l'override del profilo auth cambiato, se presente) prima di
ritentare. Il loop di retry esterno è limitato a 2 retry di cambio dopo il tentativo iniziale,
poi interrompe invece di continuare all'infinito.

Nota: le notifiche di errore usano prima `delivery.failureDestination`, poi
`cron.failureDestination` globale e infine usano come fallback il target principale
di annuncio del job quando non è configurata alcuna destinazione esplicita per gli errori.

Nota: retention/pruning è controllato nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni isolate delle esecuzioni completate.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` riducono `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota di aggiornamento: se hai job Cron più vecchi, precedenti all'attuale formato di consegna/archiviazione, esegui
`openclaw doctor --fix`. Doctor ora normalizza i campi legacy di Cron (`jobId`, `schedule.cron`,
campi di consegna di primo livello inclusi i legacy `threadId`, alias di consegna `provider` del payload) e migra i semplici
job di fallback webhook `notify: true` verso una consegna webhook esplicita quando `cron.webhook` è
configurato.

## Modifiche comuni

Aggiorna le impostazioni di consegna senza modificare il messaggio:

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

Annuncia su un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
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

`--light-context` si applica solo ai job di turni agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di iniettare l'intero set bootstrap del workspace.

Nota sulla proprietà della consegna:

- La consegna alla chat per Cron isolato è condivisa. L'agente può inviare direttamente con lo
  strumento `message` quando è disponibile un percorso chat.
- `announce` esegue la consegna di fallback della risposta finale solo quando l'agente non ha inviato
  direttamente al target risolto. `webhook` pubblica il payload completato a un URL.
  `none` disabilita la consegna di fallback del runner.

## Comandi amministrativi comuni

Esecuzione manuale:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con il target Cron previsto,
il target risolto, gli invii dello strumento message, l'uso del fallback e lo stato di consegna.

Riassegnazione di agente/sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Modifiche di consegna:

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
- Se non imposti alcuna destinazione per gli errori e il job già annuncia su un
  canale, le notifiche di errore riutilizzano lo stesso target di annuncio.
