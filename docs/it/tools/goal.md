---
doc-schema-version: 1
read_when:
    - Vuoi che OpenClaw mantenga visibile un obiettivo durante una lunga sessione
    - Devi sospendere, riprendere, bloccare, completare o cancellare l’obiettivo di una sessione
    - Vuoi comprendere gli strumenti get_goal, create_goal e update_goal
    - Vuoi vedere come vengono visualizzati gli obiettivi nella TUI
summary: 'Obiettivi della sessione: obiettivi persistenti per sessione, controlli /goal, strumenti del modello per gli obiettivi, budget di token e stato della TUI'
title: Obiettivo
x-i18n:
    generated_at: "2026-07-12T07:33:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Obiettivo

Un **obiettivo** è un risultato durevole associato alla sessione OpenClaw corrente.
Fornisce all'agente e all'operatore un traguardo condiviso per le attività di lunga durata,
senza trasformarlo in un'attività in background, un promemoria, un processo Cron o un
ordine permanente.

Gli obiettivi fanno parte dello stato della sessione: si spostano con la chiave di sessione,
persistono dopo il riavvio dei processi e vengono visualizzati in `/goal`, negli strumenti
per gli obiettivi esposti al modello e nel piè di pagina della TUI.

## Avvio rapido

```text
/goal start rendi verde la CI per la PR 87469 e invia la correzione
/goal
/goal edit rendi verde la CI per la PR 87469, invia la correzione e aggiorna la documentazione
/goal pause in attesa della CI
/goal resume
/goal complete inviato e verificato
/goal clear
```

`start` è facoltativo: anche `/goal rendi verde la CI per la PR 87469` crea un obiettivo,
poiché qualsiasi testo dopo `/goal` che non sia una parola d'azione nota viene interpretato
come un nuovo risultato da conseguire.

## A cosa servono gli obiettivi

Usa un obiettivo quando una sessione ha un risultato concreto che deve rimanere visibile
per molti turni:

- La conclusione di una PR: correggere, verificare, eseguire l'autorevisione, inviare e aprire o aggiornare la PR.
- Una sessione di debug: riprodurre il bug, identificare la superficie responsabile, applicare la correzione e
  dimostrarne il funzionamento.
- Una revisione della documentazione: leggere la documentazione pertinente, scrivere la nuova pagina, aggiungere i
  collegamenti incrociati e verificare la compilazione della documentazione.
- Un'attività di manutenzione: esaminare lo stato corrente, apportare modifiche circoscritte, eseguire i
  controlli appropriati e riferire cosa è cambiato.

Un obiettivo non è una coda di attività. Usa [TaskFlow](/it/automation/taskflow),
[attività](/it/automation/tasks), [processi Cron](/it/automation/cron-jobs) o
[ordini permanenti](/it/automation/standing-orders) quando il lavoro deve essere eseguito separatamente,
ripetersi secondo una pianificazione, suddividersi in sottoattività gestite o persistere come criterio.

## Riferimento dei comandi

`/goal` senza argomenti mostra il riepilogo dell'obiettivo corrente:

```text
Obiettivo
Stato: attivo
Risultato: rendi verde la CI per la PR 87469 e invia la correzione
Token utilizzati: 12k
Budget di token: 12k/50k

Comandi: /goal edit <obiettivo>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Effetto                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/goal` o `/goal status`                            | Mostra l'obiettivo corrente.                                                     |
| `/goal start <objective>`                           | Crea un nuovo obiettivo per la sessione corrente.                                |
| `/goal set <objective>`, `/goal create <objective>` | Alias di `start`.                                                                |
| `/goal <objective>`                                 | Crea anch'esso un nuovo obiettivo (qualsiasi testo che non sia una parola d'azione riconosciuta). |
| `/goal edit <objective>`                            | Riformula l'obiettivo corrente; lo stato e il conteggio dei token restano invariati. |
| `/goal pause [note]`                                | Sospende un obiettivo attivo.                                                    |
| `/goal resume [note]`                               | Riprende un obiettivo sospeso, bloccato o limitato dall'utilizzo o dal budget.    |
| `/goal complete [note]`                             | Contrassegna l'obiettivo come raggiunto.                                         |
| `/goal done [note]`                                 | Alias di `complete`.                                                             |
| `/goal block [note]`                                | Contrassegna l'obiettivo come bloccato.                                          |
| `/goal blocked [note]`                              | Alias di `block`.                                                                |
| `/goal clear`                                       | Rimuove l'obiettivo dalla sessione.                                              |

In una sessione può esistere un solo obiettivo alla volta. Il tentativo di avviarne un secondo non riesce
e restituisce `Goal error: goal already exists` finché quello corrente non viene cancellato.

`/goal start` non accetta un flag per il budget di token; il budget può essere impostato
solo tramite lo strumento `create_goal` esposto al modello.

## Stati

- `active`: la sessione sta perseguendo l'obiettivo.
- `paused`: l'operatore ha sospeso l'obiettivo; `/goal resume` lo rende nuovamente
  attivo.
- `blocked`: l'agente o l'operatore ha segnalato un impedimento reale; `/goal resume`
  lo rende nuovamente attivo quando sono disponibili nuove informazioni o un nuovo stato.
- `budget_limited`: è stato raggiunto il budget di token configurato; `/goal resume`
  riavvia il perseguimento dello stesso obiettivo con una nuova finestra di budget.
- `usage_limited`: riservato a un futuro stato di arresto dovuto ai limiti di utilizzo; `/goal
resume` riavvia il perseguimento nello stesso modo.
- `complete`: l'obiettivo è stato raggiunto. Gli obiettivi completati sono terminali; usa `/goal
clear` prima di avviare un altro obiettivo.

`/new` e `/reset` cancellano l'obiettivo della sessione corrente, poiché avviano
intenzionalmente un nuovo contesto di sessione.

## Budget di token

Gli obiettivi possono avere un budget di token positivo facoltativo, impostato tramite il
parametro `token_budget` dello strumento `create_goal`. Il budget viene misurato a partire dal
conteggio aggiornato dei token della sessione al momento della creazione dell'obiettivo. Se all'avvio
dell'obiettivo la sessione dispone soltanto di un'istantanea dei token obsoleta o sconosciuta, OpenClaw
attende l'istantanea aggiornata successiva e la usa come valore di riferimento, così i token consumati
prima della creazione dell'obiettivo non vengono conteggiati.

Quando l'utilizzo raggiunge il budget, l'obiettivo passa a `budget_limited`. Ciò non
elimina l'obiettivo né cancella il risultato da conseguire; indica all'operatore e
all'agente che l'obiettivo non viene più perseguito attivamente finché non viene ripreso o
cancellato. La ripresa avvia una nuova finestra di budget a partire dal conteggio aggiornato
dei token corrente.

I budget di token sono un limite di sicurezza per l'obiettivo della sessione, non un limite di fatturazione. La quota
del fornitore, la rendicontazione dei costi e il comportamento della finestra di contesto continuano a usare i normali
controlli di utilizzo e del modello di OpenClaw.

## Strumenti del modello

OpenClaw espone tre strumenti per gli obiettivi agli ambienti di esecuzione degli agenti:

| Strumento     | Scopo                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Legge l'obiettivo della sessione corrente: stato, risultato, utilizzo dei token e budget di token.                             |
| `create_goal` | Crea un obiettivo solo quando le istruzioni dell'utente o del sistema lo richiedono esplicitamente. Non riesce se la sessione ha già un obiettivo. |
| `update_goal` | Contrassegna l'obiettivo come `complete` o `blocked`.                                                                          |

Il modello non può sospendere, riprendere, cancellare o sostituire silenziosamente un obiettivo. Queste operazioni rimangono
controlli dell'operatore o della sessione tramite `/goal` e i comandi di reimpostazione, così l'agente
può segnalare il raggiungimento o un impedimento effettivo senza modificare silenziosamente il
traguardo.

`update_goal` deve contrassegnare un obiettivo come `complete` solo quando il risultato è stato
effettivamente raggiunto. Deve contrassegnare un obiettivo come `blocked` solo dopo che la stessa
condizione bloccante si è ripetuta per almeno tre turni consecutivi dell'obiettivo, non in caso di
difficoltà ordinarie o rifiniture mancanti.

## Contesto dell'obiettivo a ogni turno

Ogni turno utente/chat con un obiettivo attivo include questa riga di contesto con ruolo utente:

```text
Obiettivo attivo: <objective> — portalo avanti o aggiornane lo stato (get_goal/update_goal).
```

OpenClaw mantiene la riga compatta troncando gli obiettivi lunghi. Gli obiettivi sospesi,
bloccati, limitati dal budget, limitati dall'utilizzo e completati non vengono inseriti,
quindi un arresto disposto dall'operatore rimane in vigore finché l'obiettivo non viene ripreso.

## Interfaccia di controllo

L'interfaccia di controllo web mostra l'obiettivo come una pillola compatta sopra il compositore della chat:
un'icona di stato, l'etichetta di stato (ad esempio `Obiettivo in corso`), l'obiettivo troncato
e un timer dinamico del tempo trascorso.

La pillola contiene controlli in linea:

- **Matita** precompila il compositore con `/goal edit <objective>` affinché
  l'obiettivo possa essere riformulato e inviato.
- **Sospendi / riprendi** alterna tra `/goal pause` e `/goal resume` in base
  allo stato corrente.
- **Cestino** invia `/goal clear`.
- **Chevron** espande la pillola per mostrare l'obiettivo completo, l'ultima nota di stato,
  l'utilizzo dei token e il tempo trascorso.

I pulsanti di azione sono nascosti quando il compositore non può inviare messaggi, ad esempio
quando la connessione al Gateway è interrotta; il chevron di espansione continua a funzionare.

## TUI

Il piè di pagina della TUI mantiene visibile l'obiettivo della sessione attiva accanto ai campi relativi ad agente,
sessione e modello, prima degli indicatori di token e modalità.

Esempi del piè di pagina:

- `Obiettivo in corso (12k/50k)` per un obiettivo attivo con un budget di token.
- `Obiettivo sospeso (/goal resume)` per un obiettivo sospeso.
- `Obiettivo bloccato (/goal resume)` per un obiettivo bloccato.
- `Obiettivo soggetto ai limiti di utilizzo (/goal resume)` per un obiettivo limitato dall'utilizzo.
- `Obiettivo non raggiunto (50k/50k)` per un obiettivo limitato dal budget.
- `Obiettivo raggiunto (42k)` per un obiettivo completato.

Il piè di pagina è intenzionalmente compatto. Usa `/goal` per visualizzare l'obiettivo completo,
la nota, il budget di token e i comandi disponibili.

## Comportamento dei canali

`/goal` funziona nelle sessioni OpenClaw che supportano i comandi, incluse la TUI e
le superfici di chat che consentono comandi testuali. Lo stato dell'obiettivo è associato alla
chiave di sessione, non al trasporto, quindi due superfici che condividono una chiave di sessione vedono lo
stesso obiettivo.

Lo stato dell'obiettivo non è una direttiva di consegna: non forza le risposte attraverso un
canale, non modifica il comportamento della coda, non approva strumenti e non pianifica attività.

## Risoluzione dei problemi

| Messaggio                              | Significato                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La sessione ha già un obiettivo. Usa `/goal` per esaminarlo, `/goal complete` se è terminato oppure `/goal clear` prima di avviare un obiettivo diverso. |
| `Goal error: goal not found`           | La sessione non ha ancora un obiettivo. Avviane uno con `/goal start <objective>`.                                                            |
| `Goal error: goal is already complete` | L'obiettivo è terminale. Cancellalo prima di avviare o riprendere un altro obiettivo.                                                         |

Se l'utilizzo dei token mostra `0` o sembra obsoleto, la sessione attiva potrebbe non avere ancora
un'istantanea aggiornata dei token. L'utilizzo viene aggiornato mentre OpenClaw registra l'utilizzo della sessione
e i totali derivati dalla trascrizione.

## Argomenti correlati

- [Comandi slash](/it/tools/slash-commands)
- [TUI](/it/web/tui)
- [Strumento di sessione](/it/concepts/session-tool)
- [Compaction](/it/concepts/compaction)
- [TaskFlow](/it/automation/taskflow)
- [Ordini permanenti](/it/automation/standing-orders)
