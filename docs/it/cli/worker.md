---
read_when:
    - Gestione o debug dei worker cloud avviati dal Gateway
    - Verifica dell'ammissione dei worker, dell'assegnazione delle sessioni o dell'isolamento locale degli strumenti
summary: Riferimento interno per gli operatori del runtime worker cloud con restrizioni
title: Worker
x-i18n:
    generated_at: "2026-07-16T14:17:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` è il punto di ingresso con runtime limitato che un orchestratore
di worker cloud avvia all'interno di un ambiente worker predisposto. Non è un
comando generico per la registrazione manuale dei worker.

Il Gateway installa il bundle OpenClaw corrispondente e apre il tunnel SSH inverso
con chiave host vincolata. Il launcher del worker avvia questo comando con
un'assegnazione predisposta. Il comando si connette tramite il socket locale
inoltrato dal tunnel e viene ammesso con il ruolo dedicato `worker`.

## Contratto di avvio

Il comando legge dallo standard input esattamente un envelope di avvio JSON di
dimensioni limitate. L'envelope contiene la posizione del socket locale, la
credenziale del worker generata, l'identità del bundle e del protocollo, l'epoca
del proprietario e l'unica sessione e iterazione assegnate. La credenziale non
viene mai accettata tramite argomenti della riga di comando e questa pagina
intenzionalmente non fornisce esempi di credenziali o envelope redatti manualmente.

L'ammissione non riesce in modo sicuro se l'envelope non è valido, la credenziale
viene rifiutata, le funzionalità del bundle o del protocollo non corrispondono
oppure la sessione e l'epoca del proprietario non sono più correnti. Gli operatori
devono avviare i worker tramite l'orchestratore di worker cloud anziché richiamare
direttamente questo punto di ingresso.

## Confine del runtime

Il processo esegue il normale ciclo dell'agente incorporato con un backend limitato:

- Gli strumenti di programmazione `read`, `write`, `edit`, `apply_patch`, `exec` e `process`
  vengono eseguiti localmente nell'area di lavoro del worker.
- Le chiamate al modello usano il proxy di inferenza del Gateway. Non viene
  caricato alcun profilo locale di autenticazione del modello.
- Le scritture della trascrizione usano l'RPC di commit della trascrizione del Gateway.
- Gli aggiornamenti dello streaming e del ciclo di vita degli strumenti usano l'RPC degli eventi in tempo reale del Gateway.
- Vengono accettate solo la sessione e l'iterazione assegnate.

La modalità worker non avvia canali, superfici HTTP del Gateway o l'avvio
automatico dei Plugin oltre il set di strumenti della sessione assegnata. Usa
una directory di stato temporanea e non dispone di credenziali permanenti per
provider o forge.

L'invio di sessioni da worker a worker non è esposto in questa modalità. Il
posizionamento e l'invio restano di proprietà del Gateway: un operatore può
inviare tramite il Gateway una sessione locale esistente con worktree gestito,
mentre un processo worker non può inviare se stesso o un altro worker.

L'assegnazione predisposta contiene il contesto della trascrizione, la foglia di
base accettata, la sequenza di commit e il cursore degli eventi in tempo reale.
Alla riconnessione del tunnel, il processo viene riammesso con la stessa
credenziale e la stessa epoca del proprietario, mantiene la base della
trascrizione accettata, riproduce la coda degli eventi in tempo reale non
confermati e si ricollega a un'iterazione di inferenza in corso con la stessa
identità. Il messaggio terminale di inferenza è autorevole se alcuni delta
trasmessi in streaming sono andati persi. Un'epoca del proprietario successiva
isola il processo e ne causa l'uscita pulita.

Il rifiuto della trascrizione `stale-base-leaf` arresta immediatamente
l'esecuzione corrente. La modalità worker non ritenta la sequenza rifiutata su
una foglia diversa, quindi non viene prodotto alcun commit duplicato; l'eventuale
coda in memoria non ancora sottoposta a commit di tale esecuzione viene persa.
Il riavvio compete al proprietario del posizionamento milestone-3, che deve
creare una nuova assegnazione dalla trascrizione autorevole e dal registro dei
commit del Gateway. Analogamente, il riavvio di un processo Gateway termina
un'iterazione di inferenza in sospeso con un errore del provider; solo la
riconnessione del tunnel o del WebSocket del worker può ricollegarsi a un flusso
di inferenza attivo nello stesso processo.

Consultare [Protocollo del Gateway](/it/gateway/protocol#worker-role-and-closed-protocol)
per la superficie RPC chiusa del worker e [Piano dei worker cloud](/it/plan/cloud-workers)
per l'architettura e il modello di sicurezza.
