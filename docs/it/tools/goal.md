---
doc-schema-version: 1
read_when:
    - Vuoi che OpenClaw mantenga visibile un obiettivo durante una sessione lunga
    - Devi mettere in pausa, riprendere, bloccare, completare o cancellare un obiettivo della sessione
    - Vuoi comprendere gli strumenti get_goal, create_goal e update_goal
    - Vuoi vedere come gli obiettivi appaiono nella TUI
summary: 'Obiettivi di sessione: obiettivi durevoli per sessione, controlli /goal, strumenti di obiettivo del modello, budget di token e stato TUI'
title: Obiettivo
x-i18n:
    generated_at: "2026-06-27T18:21:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Obiettivo

Un **obiettivo** è un risultato durevole associato alla sessione OpenClaw corrente.
Offre all'agente e all'operatore una destinazione condivisa per lavori di lunga durata,
senza trasformarla in un'attività in background, un promemoria, un cron job o
un ordine permanente.

Gli obiettivi sono stato di sessione. Si spostano con la chiave di sessione, sopravvivono ai
riavvii del processo, compaiono in `/goal`, sono disponibili al modello tramite gli strumenti
per gli obiettivi e appaiono nel piè di pagina della TUI quando la sessione attiva ne ha uno.

## Avvio rapido

Imposta un obiettivo:

```text
/goal start get CI green for PR 87469 and push the fix
```

Controllalo:

```text
/goal
```

Mettilo in pausa quando il lavoro è intenzionalmente in attesa:

```text
/goal pause waiting for CI
```

Riprendilo:

```text
/goal resume
```

Contrassegnalo come completato:

```text
/goal complete pushed and verified
```

Cancellalo:

```text
/goal clear
```

## A cosa servono gli obiettivi

Usa un obiettivo quando una sessione ha un risultato concreto che deve rimanere visibile
per molti turni:

- Chiusura di una PR: correggere, verificare, eseguire autoreview, fare push e aprire o aggiornare la PR.
- Esecuzione di debug: riprodurre il bug, identificare la superficie proprietaria, applicare la patch e dimostrare
  la correzione.
- Passaggio sulla documentazione: leggere la documentazione pertinente, scrivere la nuova pagina, collegarla
  internamente e verificare la build della documentazione.
- Attività di manutenzione: ispezionare lo stato corrente, apportare modifiche limitate, eseguire i controlli
  appropriati e riferire cosa è cambiato.

Un obiettivo non è una coda di attività. Usa [Flusso di attività](/it/automation/taskflow),
[attività](/it/automation/tasks), [cron job](/it/automation/cron-jobs) o
[ordini permanenti](/it/automation/standing-orders) quando il lavoro deve essere eseguito separatamente,
ripetersi secondo una pianificazione, distribuirsi in sotto-lavori gestiti o persistere come criterio.

## Riferimento comandi

`/goal` senza argomenti stampa il riepilogo dell'obiettivo corrente:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Comandi:

- `/goal` o `/goal status` mostra l'obiettivo corrente.
- `/goal start <objective>` crea un nuovo obiettivo per la sessione corrente.
- `/goal set <objective>` e `/goal create <objective>` sono alias di
  `start`.
- `/goal pause [note]` mette in pausa un obiettivo attivo.
- `/goal resume [note]` riprende un obiettivo in pausa, bloccato, limitato dall'uso o
  limitato dal budget.
- `/goal complete [note]` contrassegna l'obiettivo come raggiunto.
- `/goal done [note]` è un alias di `complete`.
- `/goal block [note]` contrassegna l'obiettivo come bloccato.
- `/goal blocked [note]` è un alias di `block`.
- `/goal clear` rimuove l'obiettivo dalla sessione.

Può esistere un solo obiettivo alla volta in una sessione. Avviare un secondo obiettivo non riesce
finché quello corrente non viene cancellato.

## Stati

Gli obiettivi usano un piccolo insieme di stati:

- `active`: la sessione sta perseguendo l'obiettivo.
- `paused`: l'operatore ha messo in pausa l'obiettivo; `/goal resume` lo rende di nuovo attivo.
- `blocked`: l'agente o l'operatore ha segnalato un blocco reale; `/goal resume`
  lo rende di nuovo attivo quando sono disponibili nuove informazioni o un nuovo stato.
- `budget_limited`: il budget di token configurato è stato raggiunto; `/goal resume`
  riavvia il perseguimento dallo stesso obiettivo.
- `usage_limited`: riservato agli stati di arresto per limite d'uso; `/goal resume`
  riavvia il perseguimento quando consentito.
- `complete`: l'obiettivo è stato raggiunto. Gli obiettivi completati sono terminali; usa
  `/goal clear` prima di avviare un altro obiettivo.

`/new` e `/reset` cancellano l'obiettivo della sessione corrente perché avviano intenzionalmente
un nuovo contesto di sessione.

## Budget di token

Gli obiettivi possono avere un budget di token positivo opzionale. Il budget viene memorizzato con
l'obiettivo e misurato dal conteggio fresco dei token della sessione al momento della creazione. Se la
sessione corrente ha solo un utilizzo dei token obsoleto o sconosciuto quando l'obiettivo viene avviato,
OpenClaw attende il successivo snapshot fresco dei token della sessione e lo usa come
baseline, in modo che i token spesi prima dell'esistenza dell'obiettivo non vengano addebitati all'obiettivo.

Quando l'utilizzo dei token raggiunge il budget, l'obiettivo passa a `budget_limited`. Questo
non elimina l'obiettivo né cancella il risultato. Indica all'operatore e all'
agente che l'obiettivo non viene più perseguito attivamente finché non viene ripreso o
cancellato.

I budget di token sono una protezione per l'obiettivo di sessione, non un limite di fatturazione. La quota del provider,
la rendicontazione dei costi e il comportamento della finestra di contesto continuano a usare i normali
controlli di utilizzo e modello di OpenClaw.

## Strumenti del modello

OpenClaw espone tre strumenti di base per gli obiettivi agli harness degli agenti:

- `get_goal`: leggere l'obiettivo della sessione corrente, inclusi stato, risultato, utilizzo dei token
  e budget di token.
- `create_goal`: creare un obiettivo solo quando le istruzioni dell'utente, del sistema o dello sviluppatore
  ne richiedono esplicitamente uno. Non riesce se la sessione ha già un
  obiettivo.
- `update_goal`: contrassegnare l'obiettivo come `complete` o `blocked`.

Il modello non può mettere in pausa, riprendere, cancellare o sostituire silenziosamente un obiettivo. Questi sono
controlli dell'operatore/sessione tramite `/goal` e i comandi di reset. Questo impedisce all'
agente di spostare silenziosamente il bersaglio, preservando al contempo un percorso pulito perché l'
agente segnali il raggiungimento o un blocco reale.

Lo strumento `update_goal` dovrebbe contrassegnare un obiettivo come `complete` solo quando il risultato è
effettivamente raggiunto. Dovrebbe contrassegnare un obiettivo come `blocked` solo quando la stessa condizione
di blocco si è ripetuta e l'agente non può fare progressi significativi senza
nuovo input dell'utente o una modifica dello stato esterno.

## TUI

La TUI mantiene visibile l'obiettivo della sessione attiva nel piè di pagina accanto ad
agente, sessione, modello, controlli di esecuzione e conteggi dei token.

Esempi di piè di pagina:

- `Pursuing goal (12k/50k)` per un obiettivo attivo con un budget di token.
- `Goal paused (/goal resume)` per un obiettivo in pausa.
- `Goal blocked (/goal resume)` per un obiettivo bloccato.
- `Goal hit usage limits (/goal resume)` per un obiettivo limitato dall'uso.
- `Goal unmet (50k/50k)` per un obiettivo limitato dal budget.
- `Goal achieved (42k)` per un obiettivo completato.

Il piè di pagina è intenzionalmente compatto. Usa `/goal` per il risultato completo, la nota,
il budget di token e i comandi disponibili.

## Comportamento dei canali

Il comando `/goal` funziona nelle sessioni OpenClaw con capacità di comando, incluse la
TUI e le superfici di chat che consentono comandi testuali. Lo stato dell'obiettivo è associato alla
chiave di sessione, non al trasporto. Se due superfici usano la stessa sessione, vedono
lo stesso obiettivo.

Lo stato dell'obiettivo non è una direttiva di consegna. Non forza le risposte attraverso un
canale, non modifica il comportamento della coda, non approva strumenti e non pianifica lavoro.

## Risoluzione dei problemi

`Goal error: goal already exists` significa che la sessione ha già un obiettivo. Usa
`/goal` per ispezionarlo, `/goal complete` se è terminato, oppure `/goal clear` prima
di avviare un risultato diverso.

`Goal error: goal not found` significa che la sessione non ha ancora un obiettivo. Avviane uno con
`/goal start <objective>`.

`Goal error: goal is already complete` significa che l'obiettivo è terminale. Cancellalo
prima di avviare o riprendere un altro risultato.

Se l'utilizzo dei token appare come `0` o obsoleto, la sessione attiva potrebbe non avere ancora uno
snapshot fresco dei token. L'utilizzo si aggiorna man mano che OpenClaw registra l'utilizzo della sessione e
i totali derivati dalla trascrizione.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [TUI](/it/web/tui)
- [Strumento di sessione](/it/concepts/session-tool)
- [Compaction](/it/concepts/compaction)
- [Flusso di attività](/it/automation/taskflow)
- [Ordini permanenti](/it/automation/standing-orders)
