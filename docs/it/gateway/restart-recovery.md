---
read_when:
    - Si vuole sapere se il riavvio del Gateway comporta la perdita del lavoro dell'agente in corso.
    - L'esecuzione di un agente è stata interrotta da un riavvio, un arresto anomalo o un ricaricamento della configurazione
    - Si sta eseguendo il debug del ripristino automatico della sessione dopo il riavvio del Gateway
summary: 'Cosa sopravvive a un riavvio o a un arresto anomalo del Gateway: i turni dell’agente interrotti riprendono automaticamente, i sottoagenti e le attività in background vengono recuperati, le consegne in coda vengono elaborate'
title: Ripristino dopo il riavvio
x-i18n:
    generated_at: "2026-07-16T14:26:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Il riavvio del Gateway non comporta la perdita dello stato degli agenti. Conversazioni, trascrizioni,
processi pianificati, record delle attività in background e messaggi in uscita in coda risiedono tutti
su disco; inoltre, il lavoro interrotto durante un turno viene rilevato e ripreso
automaticamente dopo il riavvio del Gateway. Non è richiesto alcun intervento manuale
e non vi è nulla da configurare: il ripristino è sempre attivo.

Questa pagina descrive cosa persiste dopo un riavvio, come viene rilevato il lavoro interrotto
e come avviene la ripresa automatica.

## Cosa persiste dopo un riavvio

| Stato                         | Archiviazione                                     | Comportamento dopo il riavvio                                                 |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Cronologia delle conversazioni          | Database SQLite per agente                   | Inalterata; le sessioni proseguono dalla trascrizione archiviata                 |
| Turno interrotto della sessione principale | Riga della sessione e trascrizione SQLite per agente | Ripreso o riconciliato automaticamente pochi secondi dopo l'avvio         |
| Esecuzioni dei sottoagenti                 | SQLite (database dello stato condiviso)              | Registro ripristinato all'avvio; esecuzioni interrotte riprese                     |
| Attività in background              | SQLite (database dello stato condiviso)              | Riconciliate all'avvio; esecuzioni orfane recuperate o contrassegnate come perse              |
| Consegne in uscita in coda    | Coda di consegna SQLite                       | Elaborate dopo il riavvio; viene ritentata la consegna delle risposte non consegnate                  |
| Processi pianificati (cron)         | Archivio Cron SQLite                           | Le pianificazioni persistono; lo scheduler viene riattivato all'avvio                        |
| Continuazione dopo il riavvio          | Sentinella di riavvio SQLite                     | Continuazione singola inviata alla sessione che ha richiesto il riavvio |

## I riavvii controllati attendono prima il completamento

Un riavvio richiesto (`openclaw gateway restart`, una modifica alla configurazione che richiede
un riavvio o un aggiornamento del Gateway) non termina immediatamente il lavoro in corso. Il
Gateway smette di accettare nuovo lavoro, quindi attende il completamento dei turni attivi degli agenti e
delle attività in background, fino al limite di attesa (5 minuti per impostazione predefinita). La maggior parte
dei riavvii, pertanto, non interrompe alcun lavoro.

Viene interrotto solo il lavoro che non può terminare entro il limite di attesa (o qualsiasi esecuzione interrotta
da un riavvio forzato o da un arresto anomalo) e, prima che ciò avvenga, ogni
sessione interessata viene contrassegnata per il ripristino.

## Come viene rilevato il lavoro interrotto

Tre meccanismi complementari contrassegnano le sessioni il cui turno non è terminato:

- **All'ammissione del turno:** per un normale turno di testo in una sessione principale esistente,
  il Gateway aggiunge il messaggio dell'utente, contrassegna la sessione come in esecuzione e registra
  la relativa attestazione di consegna per il ripristino in un'unica transazione SQLite prima dell'esecuzione del modello o
  dell'hook `before_agent_reply`. Control UI esegue questa operazione prima di restituire la conferma
  `started`; l'invio al canale la esegue quando il turno preparato
  adotta l'esecuzione dell'agente.
  Comandi, allegati, sostituzioni per turno, consegne in sospeso, precedenti indicazioni di interruzione,
  sessioni gestite dai Plugin e turni con hook di esecuzione mantengono i propri
  percorsi di ammissione specializzati.
  Se è installato un hook `before_agent_reply`, l'ammissione ne registra anche la fase.
  Il ripristino non ripete mai un hook interrotto durante una chiamata. Al termine di un hook non gestito,
  il relativo punto di controllo ne registra il risultato, ma il ripristino continua a bloccarsi
  mentre tale hook rimane attivo: un punto di controllo non può dimostrare che dopo il riavvio siano stati caricati
  lo stesso codice e la stessa configurazione del Plugin. I risultati di testo gestiti e
  quelli silenziosi vengono registrati separatamente nei punti di controllo per una risoluzione deterministica.
  Le attestazioni di ripristino persistenti scritte da versioni precedenti non contengono alcun indicatore
  della provenienza, pertanto durante un aggiornamento sono sottoposte allo stesso controllo bloccante degli hook.
- **All'arresto:** durante l'attesa del riavvio, ogni sessione con un'esecuzione attiva
  viene contrassegnata con un indicatore di ripristino nell'archivio delle sessioni prima che l'esecuzione venga
  interrotta.
- **All'avvio:** il Gateway esamina gli archivi delle sessioni alla ricerca di quelle che risultano ancora
  in esecuzione ma non hanno un proprietario attivo nel nuovo processo. Questo consente di rilevare
  arresti anomali e terminazioni forzate per cui non è stato eseguito alcun codice di arresto. Contemporaneamente
  vengono eliminati i file obsoleti di blocco delle trascrizioni.

## Ripresa automatica

Pochi secondi dopo l'avvio, il Gateway invia nuovamente ogni sessione contrassegnata
con un messaggio di sistema sintetico che informa l'agente che il turno precedente è stato
interrotto da un riavvio e che deve continuare dalla trascrizione esistente. Se una
risposta finale era già stata prodotta ma non consegnata, il relativo testo viene incluso
affinché l'agente possa consegnarlo anziché ripetere il lavoro. Il ripristino esegue fino
a 3 tentativi con backoff esponenziale. Ogni tentativo riutilizza un unico identificatore
di invio persistente, pertanto un errore ambiguo di connessione non può avviare due volte lo stesso ripristino.
I turni di Control UI completati e non riprendibili conservano inoltre indicatori persistenti di idempotenza
con durata limitata, consentendo a una coda di uscita che si riconnette di ritirarli senza
rieseguire la richiesta.

Le risposte inviate esclusivamente mediante lo strumento di messaggistica utilizzano una seconda correlazione persistente. Prima che un invio
terminale nella stessa conversazione raggiunga il canale, il Gateway registra un intento di consegna
non risolto per la sessione e il turno di origine esatti. Un successo confermato dal provider
lo risolve in una ricevuta persistente di avvenuta consegna; un errore confermato lo elimina.
Il ripristino completa una ricevuta di avvenuta consegna senza rieseguire gli strumenti. Se un arresto anomalo
lascia indeterminato l'esito del provider, il ripristino si blocca anziché ripetere
un effetto esterno.

La risposta consegnata viene inoltre replicata nella trascrizione con l'ID del messaggio
di origine. Le repliche terminali utilizzano una chiave di ricevuta distinta, pertanto un invio di avanzamento con
la stessa chiave di idempotenza del provider non può mascherare l'indicatore terminale. Gli invii di avanzamento
e le ricevute dei turni precedenti non possono completare il turno corrente. Solo
le attestazioni persistenti di ingresso dal canale possono ripristinare l'autorità sulle azioni dei messaggi. Un'esecuzione
ripresa mantiene la modalità di consegna originale e la correlazione di origine, incluse
l'identità del richiedente ed eventuali restrizioni allo stesso canale o thread, pertanto la stessa ricevuta
rimane autorevole anche se si verifica un altro riavvio durante il ripristino. Un turno
eseguito esclusivamente mediante lo strumento di messaggistica senza un'autorità sul canale ricostruibile viene bloccato
e riceve l'avviso di reinvio una tantum.

Prima della ripresa, il Gateway verifica che sia sicuro continuare dalla parte finale
della trascrizione. In caso contrario, ad esempio se il turno è terminato con un'approvazione
in sospeso obsoleta, la sessione non viene rieseguita indiscriminatamente; l'agente pubblica invece un breve
avviso che invita l'utente a inviare nuovamente l'ultima richiesta. Per WebChat, tale avviso viene
scritto direttamente nella cronologia della sessione affinché rimanga visibile dopo la riconnessione.

OpenClaw può inoltre ricostruire il lavoro interrotto in sola lettura di [Code Mode](/it/reference/code-mode).
Code Mode contrassegna queste esecuzioni come sicure rispetto al riavvio e rifiuta gli strumenti
del catalogo o gli spazi dei nomi dei Plugin che producono effetti collaterali prima della loro esecuzione. Se un riavvio si verifica sul
controllo `wait`, il nuovo Gateway ricostruisce il turno dalla relativa trascrizione
e impone che l'esecuzione ricostruita rimanga sicura rispetto al riavvio anche se il
modello omette o cancella tale flag. L'host limita l'intero turno ricostruito
agli strumenti principali in sola lettura sottoposti a verifica e agli strumenti dei Plugin esplicitamente sicuri per la ripetizione,
anche quando Code Mode viene disabilitata dopo il riavvio. Il lavoro con effetti collaterali
rimane protetto dall'avviso di reinvio, evitando così il rischio di una scrittura duplicata.

### Sottoagenti

Le esecuzioni dei sottoagenti vengono salvate nel database SQLite dello stato condiviso, pertanto il
registro dei sottoagenti persiste tra i processi. All'avvio il registro viene ripristinato e
le sessioni interrotte dei sottoagenti vengono riprese con il contesto originale dell'attività.
Si applicano due meccanismi di sicurezza:

- Le esecuzioni interrotte più di 2 ore prima vengono finalizzate anziché riprese, affinché
  un Gateway rimasto inattivo durante la notte non riattivi lavoro obsoleto.
- Una sessione che non riesce ripetutamente a ripristinarsi viene contrassegnata definitivamente come bloccata, affinché
  il ripristino non possa ripetersi all'infinito.

### Attività in background

Il [registro delle attività in background](/it/automation/tasks) è basato su SQLite e
viene riconciliato all'avvio e a intervalli periodici: vengono recuperati i risultati persistenti registrati dalle
esecuzioni completate, mentre le esecuzioni il cui processo proprietario è scomparso vengono
contrassegnate come perse dopo un periodo di tolleranza, anziché rimanere sospese per sempre.

### Riavvii richiesti dall'agente

Quando è l'agente stesso ad attivare un riavvio, ad esempio applicando una modifica alla configurazione, aggiornando
il Gateway o tramite una richiesta esplicita di riavvio, viene scritta una sentinella di riavvio in
SQLite prima della chiusura del processo. Dopo l'avvio, il Gateway pubblica l'esito nella
chat di origine e invia un turno di continuazione singolo, affinché
l'agente riprenda esattamente dal punto in cui si era interrotto, sullo stesso canale e thread.

## Meccanismi di sicurezza e osservabilità

- **Interruttore dei cicli di arresto anomalo:** 3 avvii non controllati entro 5 minuti attivano un interruttore che
  impedisce l'avvio automatico dei servizi secondari all'avvio successivo, affinché un Gateway soggetto
  ad arresti anomali non amplifichi il problema. Il funzionamento viene ripristinato una volta trascorso l'intervallo degli avvii non controllati.
- **Metriche:** l'attività di ripristino viene esportata tramite
  [Prometheus](/it/gateway/prometheus) come `openclaw_session_recovery_total` e
  `openclaw_session_recovery_age_seconds`.
- **Log:** le decisioni di ripristino vengono registrate nei sottosistemi
  `main-session-restart-recovery` e `subagent-interrupted-resume`.

## Cosa non viene ripreso

- Le sessioni escluse dal ripristino della sessione principale perché sono già gestite
  da un altro proprietario: sessioni dei sottoagenti (ripristino dei sottoagenti), sessioni Cron (lo
  scheduler le riesegue secondo la pianificazione) e sessioni gestite da ACP (la ripresa è gestita dall'IDE
  o dal client connesso).
- Le sessioni dalla cui parte finale della trascrizione non è possibile continuare in sicurezza ricevono
  l'avviso di reinvio descritto in precedenza anziché essere rieseguite senza notifica.
- Il lavoro che non è mai stato ammesso: i messaggi ricevuti durante l'intervallo di attesa vengono
  rifiutati con un errore esplicito di riavvio, anziché essere accodati senza notifica in un
  processo in fase di arresto.
