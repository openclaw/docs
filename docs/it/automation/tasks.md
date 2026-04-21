---
read_when:
    - Ispezione del lavoro in background in corso o completato di recente
    - Debug degli errori di consegna per le esecuzioni di agenti scollegate
    - Capire come le esecuzioni in background sono correlate a sessioni, Cron e Heartbeat
summary: Tracciamento delle attività in background per le esecuzioni ACP, i sottoagenti, i processi Cron isolati e le operazioni CLI
title: Attività in background
x-i18n:
    generated_at: "2026-04-21T08:21:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5511b1c421bdf505fc7d34f09e453ac44e85213fcb0f082078fa957aa91fe7
    source_path: automation/tasks.md
    workflow: 15
---

# Attività in background

> **Cerchi la pianificazione?** Consulta [Automation & Tasks](/it/automation) per scegliere il meccanismo giusto. Questa pagina tratta il **tracciamento** del lavoro in background, non la sua pianificazione.

Le attività in background tracciano il lavoro che viene eseguito **al di fuori della sessione principale di conversazione**:
esecuzioni ACP, avvii di sottoagenti, esecuzioni di processi Cron isolati e operazioni avviate dalla CLI.

Le attività **non** sostituiscono sessioni, processi Cron o Heartbeat — sono il **registro delle attività** che annota quale lavoro scollegato è avvenuto, quando e se è andato a buon fine.

<Note>
Non ogni esecuzione di agente crea un'attività. I turni Heartbeat e la normale chat interattiva non lo fanno. Tutte le esecuzioni Cron, gli avvii ACP, gli avvii di sottoagenti e i comandi agente della CLI invece lo fanno.
</Note>

## In breve

- Le attività sono **record**, non pianificatori — Cron e Heartbeat decidono _quando_ il lavoro viene eseguito, le attività tracciano _cosa è successo_.
- ACP, sottoagenti, tutti i processi Cron e le operazioni CLI creano attività. I turni Heartbeat no.
- Ogni attività passa attraverso `queued → running → terminal` (`succeeded`, `failed`, `timed_out`, `cancelled` oppure `lost`).
- Le attività Cron restano attive finché il runtime Cron possiede ancora il processo; le attività CLI supportate dalla chat restano attive solo finché il loro contesto di esecuzione proprietario è ancora attivo.
- Il completamento è guidato da push: il lavoro scollegato può notificare direttamente o riattivare la sessione/Heartbeat del richiedente quando termina, quindi i cicli di polling dello stato di solito non sono l'approccio corretto.
- Le esecuzioni Cron isolate e i completamenti dei sottoagenti eseguono al meglio la pulizia di schede/processi browser tracciati per la loro sessione figlia prima della registrazione finale della pulizia.
- La consegna Cron isolata sopprime le risposte intermedie obsolete del padre mentre il lavoro dei sottoagenti discendenti è ancora in fase di drenaggio, e preferisce l'output finale del discendente quando arriva prima della consegna.
- Le notifiche di completamento vengono consegnate direttamente a un canale o accodate per il prossimo Heartbeat.
- `openclaw tasks list` mostra tutte le attività; `openclaw tasks audit` evidenzia i problemi.
- I record terminali vengono conservati per 7 giorni, poi vengono eliminati automaticamente.

## Avvio rapido

```bash
# Elenca tutte le attività (prima le più recenti)
openclaw tasks list

# Filtra per runtime o stato
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Mostra i dettagli di un'attività specifica (per ID, run ID o chiave sessione)
openclaw tasks show <lookup>

# Annulla un'attività in esecuzione (termina la sessione figlia)
openclaw tasks cancel <lookup>

# Cambia la policy di notifica per un'attività
openclaw tasks notify <lookup> state_changes

# Esegue un audit di integrità
openclaw tasks audit

# Anteprima o applicazione della manutenzione
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Ispeziona lo stato di TaskFlow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Cosa crea un'attività

| Fonte                  | Tipo di runtime | Quando viene creato un record attività                 | Policy di notifica predefinita |
| ---------------------- | --------------- | ------------------------------------------------------ | ------------------------------ |
| Esecuzioni ACP in background | `acp`      | Avvio di una sessione figlia ACP                       | `done_only`                    |
| Orchestrazione di sottoagenti | `subagent` | Avvio di un sottoagente tramite `sessions_spawn`     | `done_only`                    |
| Processi Cron (tutti i tipi) | `cron`     | Ogni esecuzione Cron (sessione principale e isolata)   | `silent`                       |
| Operazioni CLI         | `cli`           | Comandi `openclaw agent` eseguiti tramite Gateway      | `silent`                       |
| Processi media dell'agente | `cli`       | Esecuzioni `video_generate` supportate da sessione     | `silent`                       |

Le attività Cron della sessione principale usano per impostazione predefinita la policy di notifica `silent` — creano record per il tracciamento ma non generano notifiche. Anche le attività Cron isolate usano `silent` per impostazione predefinita, ma sono più visibili perché vengono eseguite nella propria sessione.

Anche le esecuzioni `video_generate` supportate da sessione usano la policy di notifica `silent`. Creano comunque record attività, ma il completamento viene restituito alla sessione agente originale come riattivazione interna, così l'agente può scrivere il messaggio di follow-up e allegare da sé il video completato. Se abiliti `tools.media.asyncCompletion.directSend`, i completamenti asincroni di `music_generate` e `video_generate` tentano prima la consegna diretta al canale, per poi ripiegare sul percorso di riattivazione della sessione richiedente.

Mentre un'attività `video_generate` supportata da sessione è ancora attiva, lo strumento funge anche da guardrail: chiamate ripetute a `video_generate` nella stessa sessione restituiscono lo stato dell'attività attiva invece di avviare una seconda generazione concorrente. Usa `action: "status"` quando vuoi una ricerca esplicita di avanzamento/stato dal lato dell'agente.

**Cosa non crea attività:**

- Turni Heartbeat — sessione principale; consulta [Heartbeat](/it/gateway/heartbeat)
- Normali turni di chat interattiva
- Risposte dirette a `/command`

## Ciclo di vita dell'attività

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Stato       | Cosa significa                                                            |
| ----------- | ------------------------------------------------------------------------- |
| `queued`    | Creata, in attesa che l'agente inizi                                      |
| `running`   | Il turno dell'agente è attualmente in esecuzione                          |
| `succeeded` | Completata con successo                                                   |
| `failed`    | Completata con un errore                                                  |
| `timed_out` | Ha superato il timeout configurato                                        |
| `cancelled` | Arrestata dall'operatore tramite `openclaw tasks cancel`                  |
| `lost`      | Il runtime ha perso lo stato autorevole di supporto dopo un periodo di grazia di 5 minuti |

Le transizioni avvengono automaticamente — quando l'esecuzione dell'agente associata termina, lo stato dell'attività si aggiorna di conseguenza.

`lost` dipende dal runtime:

- Attività ACP: i metadati della sessione figlia ACP di supporto sono scomparsi.
- Attività di sottoagente: la sessione figlia di supporto è scomparsa dall'archivio agente di destinazione.
- Attività Cron: il runtime Cron non traccia più il processo come attivo.
- Attività CLI: le attività isolate della sessione figlia usano la sessione figlia; le attività CLI supportate dalla chat usano invece il contesto di esecuzione live, quindi righe persistenti di sessione canale/gruppo/diretta non le mantengono attive.

## Consegna e notifiche

Quando un'attività raggiunge uno stato terminale, OpenClaw ti notifica. Esistono due percorsi di consegna:

**Consegna diretta** — se l'attività ha una destinazione di canale (il `requesterOrigin`), il messaggio di completamento va direttamente a quel canale (Telegram, Discord, Slack, ecc.). Per i completamenti dei sottoagenti, OpenClaw conserva anche il routing di thread/topic associato quando disponibile e può colmare un `to` / account mancante dal percorso memorizzato della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) prima di rinunciare alla consegna diretta.

**Consegna accodata alla sessione** — se la consegna diretta fallisce o non è impostata alcuna origine, l'aggiornamento viene accodato come evento di sistema nella sessione del richiedente e affiora al prossimo Heartbeat.

<Tip>
Il completamento di un'attività attiva un risveglio immediato di Heartbeat così puoi vedere rapidamente il risultato — non devi attendere il prossimo tick Heartbeat pianificato.
</Tip>

Questo significa che il flusso di lavoro abituale è basato su push: avvia il lavoro scollegato una sola volta, poi lascia che il runtime ti riattivi o notifichi al completamento. Interroga lo stato dell'attività solo quando hai bisogno di debug, intervento o un audit esplicito.

### Policy di notifica

Controlla quanto vuoi sapere di ogni attività:

| Policy                | Cosa viene consegnato                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| `done_only` (predefinita) | Solo lo stato terminale (`succeeded`, `failed`, ecc.) — **questa è l'impostazione predefinita** |
| `state_changes`       | Ogni transizione di stato e aggiornamento di avanzamento                  |
| `silent`              | Nulla                                                                     |

Cambia la policy mentre un'attività è in esecuzione:

```bash
openclaw tasks notify <lookup> state_changes
```

## Riferimento CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Colonne dell'output: ID attività, tipo, stato, consegna, Run ID, sessione figlia, riepilogo.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

Il token di ricerca accetta un ID attività, un run ID o una chiave sessione. Mostra il record completo, inclusi tempi, stato della consegna, errore e riepilogo terminale.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

Per le attività ACP e dei sottoagenti, questo termina la sessione figlia. Per le attività tracciate dalla CLI, l'annullamento viene registrato nel registro delle attività (non esiste un handle di runtime figlio separato). Lo stato passa a `cancelled` e, quando applicabile, viene inviata una notifica di consegna.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Evidenzia i problemi operativi. I risultati compaiono anche in `openclaw status` quando vengono rilevati problemi.

| Risultato                 | Gravità | Trigger                                               |
| ------------------------- | ------- | ----------------------------------------------------- |
| `stale_queued`            | warn    | In coda da più di 10 minuti                           |
| `stale_running`           | error   | In esecuzione da più di 30 minuti                     |
| `lost`                    | error   | La proprietà dell'attività supportata dal runtime è scomparsa |
| `delivery_failed`         | warn    | La consegna è fallita e la policy di notifica non è `silent` |
| `missing_cleanup`         | warn    | Attività terminale senza timestamp di pulizia         |
| `inconsistent_timestamps` | warn    | Violazione della timeline (ad esempio, terminata prima di iniziare) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Usa questo comando per visualizzare in anteprima o applicare riconciliazione, marcatura della pulizia e rimozione per attività e stato di TaskFlow.

La riconciliazione dipende dal runtime:

- Le attività ACP/sottoagente controllano la propria sessione figlia di supporto.
- Le attività Cron controllano se il runtime Cron possiede ancora il processo.
- Le attività CLI supportate dalla chat controllano il contesto di esecuzione live proprietario, non solo la riga della sessione chat.

Anche la pulizia al completamento dipende dal runtime:

- Il completamento del sottoagente chiude al meglio schede/processi browser tracciati per la sessione figlia prima che prosegua la pulizia dell'annuncio.
- Il completamento Cron isolato chiude al meglio schede/processi browser tracciati per la sessione Cron prima che l'esecuzione venga completamente smantellata.
- La consegna Cron isolata attende, quando necessario, il follow-up dei sottoagenti discendenti e sopprime il testo di conferma obsoleto del padre invece di annunciarlo.
- La consegna di completamento del sottoagente preferisce l'ultimo testo visibile dell'assistente; se è vuoto, ripiega sull'ultimo testo sanitizzato di tool/toolResult, e le esecuzioni con sole chiamate di tool terminate per timeout possono ridursi a un breve riepilogo di avanzamento parziale.
- I fallimenti della pulizia non mascherano il reale esito dell'attività.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Usa questi comandi quando ciò che ti interessa è il TaskFlow di orchestrazione anziché un singolo record di attività in background.

## Bacheca attività chat (`/tasks`)

Usa `/tasks` in qualsiasi sessione chat per vedere le attività in background collegate a quella sessione. La bacheca mostra
attività attive e completate di recente con runtime, stato, tempi e dettagli di avanzamento o errore.

Quando la sessione corrente non ha attività collegate visibili, `/tasks` ripiega sui conteggi attività locali dell'agente
così hai comunque una panoramica senza esporre dettagli di altre sessioni.

Per il registro operativo completo, usa la CLI: `openclaw tasks list`.

## Integrazione dello stato (pressione delle attività)

`openclaw status` include un riepilogo delle attività visibile a colpo d'occhio:

```
Tasks: 3 queued · 2 running · 1 issues
```

Il riepilogo riporta:

- **active** — conteggio di `queued` + `running`
- **failures** — conteggio di `failed` + `timed_out` + `lost`
- **byRuntime** — suddivisione per `acp`, `subagent`, `cron`, `cli`

Sia `/status` sia lo strumento `session_status` usano un'istantanea delle attività consapevole della pulizia: le attività attive hanno la priorità, le righe completate obsolete vengono nascoste e i fallimenti recenti emergono solo quando non rimane alcun lavoro attivo. Questo mantiene la scheda di stato focalizzata su ciò che conta in questo momento.

## Archiviazione e manutenzione

### Dove risiedono le attività

I record delle attività vengono conservati in SQLite in:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

Il registro viene caricato in memoria all'avvio di Gateway e sincronizza le scritture su SQLite per garantire la persistenza attraverso i riavvii.

### Manutenzione automatica

Uno sweeper viene eseguito ogni **60 secondi** e gestisce tre aspetti:

1. **Riconciliazione** — controlla se le attività attive hanno ancora un supporto runtime autorevole. Le attività ACP/sottoagente usano lo stato della sessione figlia, le attività Cron usano la proprietà del processo attivo e le attività CLI supportate dalla chat usano il contesto di esecuzione proprietario. Se quello stato di supporto manca per più di 5 minuti, l'attività viene contrassegnata come `lost`.
2. **Marcatura della pulizia** — imposta un timestamp `cleanupAfter` sulle attività terminali (`endedAt + 7 days`).
3. **Rimozione** — elimina i record che hanno superato la data `cleanupAfter`.

**Conservazione**: i record delle attività terminali vengono mantenuti per **7 giorni**, poi vengono rimossi automaticamente. Nessuna configurazione necessaria.

## Come le attività si collegano ad altri sistemi

### Attività e Task Flow

[Task Flow](/it/automation/taskflow) è il livello di orchestrazione dei flussi sopra le attività in background. Un singolo flusso può coordinare più attività nel corso del suo ciclo di vita usando modalità di sincronizzazione gestite o mirror. Usa `openclaw tasks` per ispezionare i singoli record attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

Consulta [Task Flow](/it/automation/taskflow) per i dettagli.

### Attività e Cron

Una **definizione** di processo Cron si trova in `~/.openclaw/cron/jobs.json`; lo stato di esecuzione runtime si trova accanto in `~/.openclaw/cron/jobs-state.json`. **Ogni** esecuzione Cron crea un record attività — sia nella sessione principale sia in quella isolata. Le attività Cron della sessione principale usano per impostazione predefinita la policy di notifica `silent`, così vengono tracciate senza generare notifiche.

Consulta [Cron Jobs](/it/automation/cron-jobs).

### Attività e Heartbeat

Le esecuzioni Heartbeat sono turni della sessione principale — non creano record attività. Quando un'attività si completa, può attivare un risveglio Heartbeat così puoi vedere rapidamente il risultato.

Consulta [Heartbeat](/it/gateway/heartbeat).

### Attività e sessioni

Un'attività può fare riferimento a una `childSessionKey` (dove viene eseguito il lavoro) e a una `requesterSessionKey` (chi l'ha avviata). Le sessioni sono il contesto della conversazione; le attività sono il tracciamento delle attività sopra di esso.

### Attività ed esecuzioni dell'agente

Il `runId` di un'attività punta all'esecuzione dell'agente che svolge il lavoro. Gli eventi del ciclo di vita dell'agente (avvio, fine, errore) aggiornano automaticamente lo stato dell'attività — non è necessario gestire manualmente il ciclo di vita.

## Correlati

- [Automation & Tasks](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Task Flow](/it/automation/taskflow) — orchestrazione dei flussi sopra le attività
- [Scheduled Tasks](/it/automation/cron-jobs) — pianificazione del lavoro in background
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [CLI: Tasks](/cli/index#tasks) — riferimento dei comandi CLI
