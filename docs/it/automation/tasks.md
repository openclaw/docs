---
read_when:
    - Ispezione delle attività in secondo piano in corso o completate di recente
    - Debug degli errori di consegna per le esecuzioni distaccate degli agenti
    - Comprendere come le esecuzioni in background sono correlate a sessioni, Cron e Heartbeat
sidebarTitle: Background tasks
summary: Monitoraggio delle attività in background per esecuzioni ACP, subagenti, processi Cron isolati e operazioni CLI
title: Attività in background
x-i18n:
    generated_at: "2026-05-12T00:56:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31cbf09df48bab0686a1350f91aefffffef899c86704bb97b68320fc47e78021
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Cerchi la pianificazione? Consulta [Automazione](/it/automation) per scegliere il meccanismo giusto. Questa pagina è il registro delle attività per il lavoro in background, non lo scheduler.
</Note>

Le attività in background tengono traccia del lavoro eseguito **fuori dalla sessione principale di conversazione**: esecuzioni ACP, avvii di subagent, esecuzioni isolate di processi cron e operazioni avviate dalla CLI.

Le attività **non** sostituiscono sessioni, processi cron o Heartbeat: sono il **registro delle attività** che registra quale lavoro scollegato è stato svolto, quando e se è riuscito.

<Note>
Non ogni esecuzione dell'agente crea un'attività. I turni Heartbeat e la normale chat interattiva non lo fanno. Tutte le esecuzioni cron, gli avvii ACP, gli avvii di subagent e i comandi agente della CLI lo fanno.
</Note>

## TL;DR

- Le attività sono **record**, non scheduler: cron e Heartbeat decidono _quando_ il lavoro viene eseguito, le attività tracciano _cosa è successo_.
- ACP, subagent, tutti i processi cron e le operazioni CLI creano attività. I turni Heartbeat no.
- Ogni attività passa attraverso `queued → running → terminal` (succeeded, failed, timed_out, cancelled o lost).
- Le attività cron restano attive finché il runtime cron possiede ancora il processo; se lo
  stato del runtime in memoria non è più presente, la manutenzione delle attività controlla prima la cronologia persistente delle esecuzioni cron
  prima di contrassegnare un'attività come lost.
- Il completamento è push-driven: il lavoro scollegato può notificare direttamente o riattivare la
  sessione/Heartbeat richiedente quando termina, quindi i cicli di polling dello stato
  di solito hanno la forma sbagliata.
- Le esecuzioni cron isolate e i completamenti dei subagent provano, con il massimo impegno, a pulire le schede del browser/i processi tracciati per la loro sessione figlia prima della contabilità finale di pulizia.
- La consegna cron isolata sopprime le risposte intermedie obsolete del genitore mentre il lavoro dei subagent discendenti è ancora in fase di svuotamento, e preferisce l'output finale del discendente quando arriva prima della consegna.
- Le notifiche di completamento vengono consegnate direttamente a un canale o accodate per il prossimo Heartbeat.
- `openclaw tasks list` mostra tutte le attività; `openclaw tasks audit` evidenzia i problemi.
- I record terminali vengono conservati per 7 giorni, poi eliminati automaticamente.

## Avvio rapido

<Tabs>
  <Tab title="Elenca e filtra">
    ```bash
    # List all tasks (newest first)
    openclaw tasks list

    # Filter by runtime or status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Ispeziona">
    ```bash
    # Show details for a specific task (by ID, run ID, or session key)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Annulla e notifica">
    ```bash
    # Cancel a running task (kills the child session)
    openclaw tasks cancel <lookup>

    # Change notification policy for a task
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Audit e manutenzione">
    ```bash
    # Run a health audit
    openclaw tasks audit

    # Preview or apply maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Flusso attività">
    ```bash
    # Inspect TaskFlow state
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## Cosa crea un'attività

| Origine                | Tipo di runtime | Quando viene creato un record attività                  | Criterio di notifica predefinito |
| ---------------------- | --------------- | ------------------------------------------------------- | -------------------------------- |
| Esecuzioni ACP in background | `acp`        | Avvio di una sessione figlia ACP                        | `done_only`                      |
| Orchestrazione subagent | `subagent`     | Avvio di un subagent tramite `sessions_spawn`           | `done_only`                      |
| Processi cron (tutti i tipi) | `cron`       | Ogni esecuzione cron (sessione principale e isolata)    | `silent`                         |
| Operazioni CLI         | `cli`           | Comandi `openclaw agent` che passano attraverso il Gateway | `silent`                      |
| Processi multimediali agente | `cli`       | Esecuzioni `music_generate`/`video_generate` basate su sessione | `silent`                 |

<AccordionGroup>
  <Accordion title="Impostazioni predefinite di notifica per cron e media">
    Le attività cron della sessione principale usano il criterio di notifica `silent` per impostazione predefinita: creano record per il tracciamento ma non generano notifiche. Anche le attività cron isolate usano `silent` per impostazione predefinita, ma sono più visibili perché vengono eseguite nella propria sessione.

    Anche le esecuzioni `music_generate` e `video_generate` basate su sessione usano il criterio di notifica `silent`. Creano comunque record attività, ma il completamento viene restituito alla sessione agente originale come riattivazione interna, così l'agente può scrivere il messaggio di follow-up e allegare autonomamente il media completato. I completamenti di gruppo/canale seguono il normale criterio di risposta visibile, quindi l'agente usa lo strumento messaggi quando la consegna sorgente lo richiede. Se l'agente di completamento non riesce a produrre prove di consegna tramite strumento messaggi in una route solo-strumenti, OpenClaw invia il fallback di completamento direttamente al canale originale invece di lasciare il media privato.

  </Accordion>
  <Accordion title="Guardrail per video_generate concorrente">
    Mentre un'attività `video_generate` basata su sessione è ancora attiva, lo strumento funge anche da guardrail: chiamate `video_generate` ripetute nella stessa sessione restituiscono lo stato dell'attività attiva invece di avviare una seconda generazione concorrente. Usa `action: "status"` quando vuoi una ricerca esplicita di avanzamento/stato dal lato agente.
  </Accordion>
  <Accordion title="Cosa non crea attività">
    - Turni Heartbeat: sessione principale; vedi [Heartbeat](/it/gateway/heartbeat)
    - Normali turni di chat interattiva
    - Risposte dirette `/command`

  </Accordion>
</AccordionGroup>

## Ciclo di vita delle attività

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
| `queued`    | Creato, in attesa dell'avvio dell'agente                                  |
| `running`   | Il turno agente è in esecuzione attiva                                    |
| `succeeded` | Completato correttamente                                                  |
| `failed`    | Completato con un errore                                                  |
| `timed_out` | Ha superato il timeout configurato                                        |
| `cancelled` | Arrestato dall'operatore tramite `openclaw tasks cancel`                  |
| `lost`      | Il runtime ha perso lo stato di supporto autorevole dopo un periodo di tolleranza di 5 minuti |

Le transizioni avvengono automaticamente: quando l'esecuzione dell'agente associata termina, lo stato dell'attività viene aggiornato di conseguenza.

Il completamento dell'esecuzione dell'agente è autorevole per i record attività attivi. Un'esecuzione scollegata riuscita viene finalizzata come `succeeded`, gli errori ordinari di esecuzione come `failed` e gli esiti di timeout o interruzione come `timed_out`. Se un operatore ha già annullato l'attività, o il runtime ha già registrato uno stato terminale più forte come `failed`, `timed_out` o `lost`, un segnale di successo successivo non declassa quello stato terminale.

`lost` è consapevole del runtime:

- Attività ACP: i metadati della sessione figlia ACP di supporto sono scomparsi.
- Attività subagent: la sessione figlia di supporto è scomparsa dallo store dell'agente di destinazione.
- Attività cron: il runtime cron non traccia più il processo come attivo e la cronologia persistente
  delle esecuzioni cron non mostra un risultato terminale per quella esecuzione. L'audit CLI
  offline non considera autorevole il proprio stato cron in-process vuoto.
- Attività CLI: le attività con un ID esecuzione/ID sorgente usano il contesto di esecuzione live, quindi
  righe persistenti di sessione figlia o sessione chat non le mantengono attive dopo la scomparsa
  dell'esecuzione posseduta dal Gateway. Le attività CLI legacy senza identità di esecuzione ripiegano ancora
  sulla sessione figlia. Anche le esecuzioni `openclaw agent` basate su Gateway vengono finalizzate
  dal loro risultato di esecuzione, quindi le esecuzioni completate non restano attive finché lo sweeper
  le contrassegna come `lost`.

## Consegna e notifiche

Quando un'attività raggiunge uno stato terminale, OpenClaw ti notifica. Ci sono due percorsi di consegna:

**Consegna diretta**: se l'attività ha una destinazione di canale (il `requesterOrigin`), il messaggio di completamento va direttamente a quel canale (Telegram, Discord, Slack, ecc.). I completamenti delle attività di gruppo e canale vengono invece instradati attraverso la sessione richiedente, così l'agente genitore può scrivere la risposta visibile. Per i completamenti dei subagent, OpenClaw conserva anche l'instradamento associato di thread/argomento quando disponibile e può completare un `to` / account mancante dalla route memorizzata della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) prima di rinunciare alla consegna diretta.

**Consegna accodata alla sessione**: se la consegna diretta fallisce o non è impostata alcuna origine, l'aggiornamento viene accodato come evento di sistema nella sessione del richiedente e compare al prossimo Heartbeat.

<Tip>
Il completamento dell'attività attiva una riattivazione Heartbeat immediata, così vedi rapidamente il risultato: non devi aspettare il prossimo tick Heartbeat pianificato.
</Tip>

Questo significa che il flusso di lavoro usuale è basato su push: avvia una volta il lavoro scollegato, poi lascia che il runtime ti riattivi o notifichi al completamento. Esegui il polling dello stato dell'attività solo quando ti servono debug, intervento o un audit esplicito.

### Criteri di notifica

Controlla quanto vuoi ricevere per ogni attività:

| Criterio              | Cosa viene consegnato                                                |
| --------------------- | -------------------------------------------------------------------- |
| `done_only` (predefinito) | Solo stato terminale (succeeded, failed, ecc.) - **questo è il valore predefinito** |
| `state_changes`       | Ogni transizione di stato e aggiornamento di avanzamento             |
| `silent`              | Nulla                                                                |

Modifica il criterio mentre un'attività è in esecuzione:

```bash
openclaw tasks notify <lookup> state_changes
```

## Riferimento CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Colonne di output: ID attività, Tipo, Stato, Consegna, ID esecuzione, Sessione figlia, Riepilogo.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    Il token di ricerca accetta un ID attività, ID esecuzione o chiave sessione. Mostra il record completo, inclusi tempistiche, stato di consegna, errore e riepilogo terminale.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Per attività ACP e subagent, questo termina la sessione figlia. Per attività tracciate dalla CLI, l'annullamento viene registrato nel registro delle attività (non esiste un handle runtime figlio separato). Lo stato passa a `cancelled` e viene inviata una notifica di consegna quando applicabile.

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--json]
    ```

    Evidenzia problemi operativi. I risultati compaiono anche in `openclaw status` quando vengono rilevati problemi.

    | Riscontro                 | Gravità    | Attivazione                                                                                                |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | In coda da più di 10 minuti                                                                                 |
    | `stale_running`           | error      | In esecuzione da più di 30 minuti                                                                           |
    | `lost`                    | warn/error | La proprietà dell'attività supportata dal runtime è scomparsa; le attività perse mantenute avvisano fino a `cleanupAfter`, poi diventano errori |
    | `delivery_failed`         | warn       | La consegna non è riuscita e la policy di notifica non è `silent`                                            |
    | `missing_cleanup`         | warn       | Attività terminale senza timestamp di pulizia                                                               |
    | `inconsistent_timestamps` | warn       | Violazione della timeline (ad esempio terminata prima dell'avvio)                                           |

  </Accordion>
  <Accordion title="manutenzione attività">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Usa questo comando per visualizzare in anteprima o applicare riconciliazione, marcatura della pulizia e potatura per attività, stato di Task Flow e righe obsolete del registro delle sessioni di esecuzione cron.

    La riconciliazione è consapevole del runtime:

    - Le attività ACP/subagent controllano la sessione figlia di supporto.
    - Le attività subagent la cui sessione figlia ha una tombstone di recupero da riavvio vengono contrassegnate come perse invece di essere trattate come sessioni di supporto recuperabili.
    - Le attività Cron controllano se il runtime cron possiede ancora il job, quindi recuperano lo stato terminale dai log persistiti delle esecuzioni cron/dallo stato del job prima di ricadere su `lost`. Solo il processo Gateway è autorevole per il set in memoria dei job cron attivi; l'audit CLI offline usa la cronologia durevole ma non contrassegna un'attività cron come persa solo perché quel Set locale è vuoto.
    - Le attività CLI con identità di esecuzione controllano il contesto dell'esecuzione live proprietaria, non solo le righe di sessione figlia o sessione chat.

    Anche la pulizia del completamento è consapevole del runtime:

    - Il completamento del subagent chiude al meglio le schede del browser/i processi tracciati per la sessione figlia prima che la pulizia dell'annuncio continui.
    - Il completamento cron isolato chiude al meglio le schede del browser/i processi tracciati per la sessione cron prima che l'esecuzione venga smantellata completamente.
    - La consegna cron isolata attende, quando necessario, il follow-up del subagent discendente e sopprime il testo di conferma del genitore obsoleto invece di annunciarlo.
    - La consegna del completamento del subagent preferisce l'ultimo testo visibile dell'assistente; se è vuoto, ricade sull'ultimo testo sanificato di tool/toolResult, e le esecuzioni con chiamate tool terminate solo per timeout possono essere ridotte a un breve riepilogo di progresso parziale. Le esecuzioni terminali non riuscite annunciano lo stato di errore senza riprodurre il testo della risposta acquisita.
    - Gli errori di pulizia non mascherano l'esito reale dell'attività.

    Quando applica la manutenzione, OpenClaw rimuove anche le righe obsolete del registro sessioni `cron:<jobId>:run:<uuid>` più vecchie di 7 giorni, preservando le righe per i job cron attualmente in esecuzione e lasciando invariate le righe di sessione non cron.

  </Accordion>
  <Accordion title="elenco | mostra | annulla flow attività">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Usa questi comandi quando il Task Flow orchestrante è ciò che ti interessa, invece di un singolo record di attività in background.

  </Accordion>
</AccordionGroup>

## Bacheca attività chat (`/tasks`)

Usa `/tasks` in qualsiasi sessione chat per vedere le attività in background collegate a quella sessione. La bacheca mostra le attività attive e completate di recente con runtime, stato, tempi e dettagli di avanzamento o errore.

Quando la sessione corrente non ha attività collegate visibili, `/tasks` ripiega sui conteggi delle attività locali dell'agente, così ottieni comunque una panoramica senza esporre dettagli di altre sessioni.

Per il registro operatore completo, usa la CLI: `openclaw tasks list`.

## Integrazione dello stato (pressione delle attività)

`openclaw status` include un riepilogo immediato delle attività:

```
Tasks: 3 queued · 2 running · 1 issues
```

Il riepilogo riporta:

- **active** - conteggio di `queued` + `running`
- **failures** - conteggio di `failed` + `timed_out` + `lost`
- **byRuntime** - suddivisione per `acp`, `subagent`, `cron`, `cli`

Sia `/status` sia il tool `session_status` usano uno snapshot delle attività consapevole della pulizia: le attività attive sono preferite, le righe completate obsolete sono nascoste e gli errori recenti emergono solo quando non rimane lavoro attivo. Questo mantiene la scheda di stato concentrata su ciò che conta in questo momento.

## Archiviazione e manutenzione

### Dove vivono le attività

I record delle attività persistono in SQLite in:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

Il registro viene caricato in memoria all'avvio del gateway e sincronizza le scritture su SQLite per garantire la durabilità tra i riavvii.
Il Gateway mantiene limitato il log write-ahead di SQLite usando la soglia predefinita
di autocheckpoint di SQLite più checkpoint periodici e di arresto `TRUNCATE`.

### Manutenzione automatica

Uno sweeper viene eseguito ogni **60 secondi** e gestisce quattro aspetti:

<Steps>
  <Step title="Riconciliazione">
    Controlla se le attività attive hanno ancora un supporto runtime autorevole. Le attività ACP/subagent usano lo stato della sessione figlia, le attività cron usano la proprietà dei job attivi e le attività CLI con identità di esecuzione usano il contesto dell'esecuzione proprietaria. Se quello stato di supporto scompare per più di 5 minuti, l'attività viene contrassegnata come `lost`.
  </Step>
  <Step title="Riparazione sessione ACP">
    Chiude le sessioni ACP one-shot terminali o orfane possedute dal genitore, e chiude le sessioni ACP persistenti terminali obsolete o orfane solo quando non rimane alcun binding di conversazione attivo.
  </Step>
  <Step title="Marcatura della pulizia">
    Imposta un timestamp `cleanupAfter` sulle attività terminali (endedAt + 7 giorni). Durante la conservazione, le attività perse appaiono ancora nell'audit come avvisi; dopo la scadenza di `cleanupAfter` o quando mancano i metadati di pulizia, sono errori.
  </Step>
  <Step title="Potatura">
    Elimina i record oltre la loro data `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Conservazione:** i record delle attività terminali vengono mantenuti per **7 giorni**, poi potati automaticamente. Nessuna configurazione necessaria.
</Note>

## Come le attività si relazionano ad altri sistemi

<AccordionGroup>
  <Accordion title="Attività e Task Flow">
    [Task Flow](/it/automation/taskflow) è il livello di orchestrazione dei flussi sopra le attività in background. Un singolo flusso può coordinare più attività durante il suo ciclo di vita usando modalità di sincronizzazione gestite o rispecchiate. Usa `openclaw tasks` per ispezionare i singoli record di attività e `openclaw tasks flow` per ispezionare il flusso orchestrante.

    Vedi [Task Flow](/it/automation/taskflow) per i dettagli.

  </Accordion>
  <Accordion title="Attività e cron">
    Una **definizione** di job cron vive in `~/.openclaw/cron/jobs.json`; lo stato di esecuzione runtime vive accanto a essa in `~/.openclaw/cron/jobs-state.json`. **Ogni** esecuzione cron crea un record di attività, sia per sessione principale sia isolata. Le attività cron della sessione principale usano per impostazione predefinita la policy di notifica `silent`, così vengono tracciate senza generare notifiche.

    Vedi [Cron Jobs](/it/automation/cron-jobs).

  </Accordion>
  <Accordion title="Attività e Heartbeat">
    Le esecuzioni Heartbeat sono turni di sessione principale: non creano record di attività. Quando un'attività viene completata, può attivare un risveglio heartbeat così vedi subito il risultato.

    Vedi [Heartbeat](/it/gateway/heartbeat).

  </Accordion>
  <Accordion title="Attività e sessioni">
    Un'attività può fare riferimento a una `childSessionKey` (dove il lavoro viene eseguito) e a una `requesterSessionKey` (chi l'ha avviata). Le sessioni sono contesto di conversazione; le attività sono tracciamento dell'attività sopra quel contesto.
  </Accordion>
  <Accordion title="Attività ed esecuzioni agente">
    Il `runId` di un'attività collega l'esecuzione dell'agente che svolge il lavoro. Gli eventi del ciclo di vita dell'agente (avvio, fine, errore) aggiornano automaticamente lo stato dell'attività: non devi gestire manualmente il ciclo di vita.
  </Accordion>
</AccordionGroup>

## Correlati

- [Automazione](/it/automation) - tutti i meccanismi di automazione in sintesi
- [CLI: Attività](/it/cli/tasks) - riferimento dei comandi CLI
- [Heartbeat](/it/gateway/heartbeat) - turni periodici di sessione principale
- [Attività pianificate](/it/automation/cron-jobs) - pianificazione del lavoro in background
- [Task Flow](/it/automation/taskflow) - orchestrazione dei flussi sopra le attività
