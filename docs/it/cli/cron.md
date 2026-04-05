---
read_when:
    - Vuoi processi pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire processi in background)
title: cron
x-i18n:
    generated_at: "2026-04-05T13:47:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gestisci i processi cron per lo scheduler del Gateway.

Correlati:

- Processi cron: [Processi cron](/it/automation/cron-jobs)

Suggerimento: esegui `openclaw cron --help` per la superficie completa dei comandi.

Nota: i processi isolati `cron add` usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere
l'output interno. `--deliver` resta come alias deprecato di `--announce`.

Nota: le esecuzioni isolate gestite da cron si aspettano un riepilogo in testo semplice e il runner gestisce
il percorso finale di invio. `--no-deliver` mantiene l'esecuzione interna; non restituisce
la consegna allo strumento di messaggistica dell'agente.

Nota: i processi one-shot (`--at`) vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per conservarli.

Nota: `--session` supporta `main`, `isolated`, `current` e `session:<id>`.
Usa `current` per associarti alla sessione attiva al momento della creazione, oppure `session:<id>` per
una chiave di sessione persistente esplicita.

Nota: per i processi CLI one-shot, i valori data/ora `--at` senza offset vengono trattati come UTC a meno che tu non passi anche
`--tz <iana>`, che interpreta quell'ora locale nel fuso orario indicato.

Nota: i processi ricorrenti ora usano un backoff di retry esponenziale dopo errori consecutivi (30s → 1m → 5m → 15m → 60m), poi tornano alla pianificazione normale dopo la successiva esecuzione riuscita.

Nota: `openclaw cron run` ora restituisce il risultato non appena l'esecuzione manuale viene accodata. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

Nota: `openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il
vecchio comportamento "esegui solo se è il momento".

Nota: i turni cron isolati sopprimono le risposte obsolete di solo acknowledgment. Se il
primo risultato è soltanto un aggiornamento di stato intermedio e nessuna esecuzione discendente di subagent è
responsabile della risposta finale, cron ripropone una volta per ottenere il risultato reale prima della consegna.

Nota: se un'esecuzione cron isolata restituisce solo il token silenzioso (`NO_REPLY` /
`no_reply`), cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo accodato di fallback,
quindi non viene pubblicato nulla nella chat.

Nota: `cron add|edit --model ...` usa per quel processo il modello consentito selezionato.
Se il modello non è consentito, cron avvisa e torna invece alla selezione del modello
dell'agente/processo predefinito. Le catene di fallback configurate continuano ad applicarsi, ma un semplice
override del modello senza un elenco esplicito di fallback per processo non aggiunge più il modello primario
dell'agente come destinazione di retry extra nascosta.

Nota: la precedenza del modello cron isolato è: prima l'override dell'hook Gmail, poi `--model` per processo,
poi qualunque override del modello di sessione cron memorizzato, poi la normale
selezione agente/predefinita.

Nota: la modalità veloce cron isolata segue la selezione del modello live risolta. La config del
modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode`
di sessione memorizzato ha comunque la precedenza sulla config.

Nota: se un'esecuzione isolata genera `LiveSessionModelSwitchError`, cron rende persistenti
provider/modello cambiati (e l'override del profilo auth cambiato, se presente) prima di
ritentare. Il ciclo di retry esterno è limitato a 2 retry di switch dopo il tentativo iniziale,
poi si interrompe invece di continuare all'infinito.

Nota: le notifiche di errore usano prima `delivery.failureDestination`, poi
`cron.failureDestination` globale, e infine ricadono sulla destinazione primaria
di annuncio del processo quando non è configurata alcuna destinazione di errore esplicita.

Nota: retention/potatura sono controllate nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni isolate delle esecuzioni completate.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` potano `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota di aggiornamento: se hai processi cron più vecchi rispetto all'attuale formato di consegna/archiviazione, esegui
`openclaw doctor --fix`. Doctor ora normalizza i campi cron legacy (`jobId`, `schedule.cron`,
campi di consegna di primo livello incluso `threadId` legacy, alias di consegna `provider` del payload) e migra i semplici
processi di fallback webhook `notify: true` a una consegna webhook esplicita quando `cron.webhook` è
configurato.

## Modifiche comuni

Aggiorna le impostazioni di consegna senza cambiare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un processo isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita un contesto bootstrap leggero per un processo isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia su un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un processo isolato con contesto bootstrap leggero:

```bash
openclaw cron add \
  --name "Brief mattutino leggero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Riassumi gli aggiornamenti notturni." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi isolati di turno-agente. Per le esecuzioni cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di iniettare l'intero set bootstrap del workspace.

Nota sulla gestione della consegna:

- I processi isolati gestiti da cron instradano sempre la consegna finale visibile
  all'utente tramite il runner cron (`announce`, `webhook` o `none` solo interno).
- Se l'attività menziona l'invio di un messaggio a un destinatario esterno, l'agente dovrebbe
  descrivere la destinazione prevista nel suo risultato invece di provare a inviarlo
  direttamente.

## Comandi amministrativi comuni

Esecuzione manuale:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Reindirizzamento agente/sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Modifiche alla consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sulla consegna degli errori:

- `delivery.failureDestination` è supportato per i processi isolati.
- I processi della sessione principale possono usare `delivery.failureDestination` solo quando la
  modalità di consegna primaria è `webhook`.
- Se non imposti alcuna destinazione di errore e il processo annuncia già su un
  canale, le notifiche di errore riutilizzano la stessa destinazione di annuncio.
