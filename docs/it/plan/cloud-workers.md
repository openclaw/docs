---
read_when:
    - Progettazione o implementazione del provisioning dei worker cloud, della modalità worker o del passaggio di sessione
    - Modifica di environments.*, del protocollo worker, dell'acquisizione delle trascrizioni o delle RPC del proxy di inferenza
    - Revisione del livello di sicurezza dell'esecuzione remota degli agenti
summary: Esegui le sessioni dell'agente su macchine effimere raggiungibili tramite SSH, con inferenza tramite proxy del Gateway e streaming in tempo reale nella barra laterale.
title: Piano dei worker cloud
x-i18n:
    generated_at: "2026-07-12T07:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Stato

Proposta, revisione 3. Non implementata. Direzione concordata nel 2026-07; la revisione 2 ha incorporato i risultati della revisione avversariale (protocollo dedicato per i worker, macchine a stati per posizionamento/ambiente, sincronizzazione in ingresso consapevole di git, passaggio unidirezionale nella v1, formulazione della sicurezza in termini di uscita controllata). La revisione 3 definisce il modello di proprietà della sincronizzazione (il worker crea i commit, il Gateway li adotta e li pubblica), aggiunge una modalità di sincronizzazione semplice senza git, corregge l'esecuzione del worker affinché sia completa all'interno della macchina isolata, sposta i criteri di accesso a Internet alla fase di provisioning e ripristina l'invio dell'agente alla milestone 3.

## Problema

Le sessioni degli agenti OpenClaw eseguono il proprio ciclo, gli strumenti e l'inferenza all'interno del processo del Gateway su una sola macchina. La capacità di calcolo è limitata da tale macchina, le attività lunghe la occupano e il lavoro in parallelo ne contende le risorse. I prodotti ospitati (agenti cloud di Cursor, Claude Code sul web, Codex cloud) risolvono il problema con sandbox cloud effimere per ogni attività, ma richiedono l'infrastruttura e la fiducia nel fornitore.

Gli operatori che possiedono già macchine inutilizzate (o possono noleggiarle a basso costo) non hanno modo di richiedere: esegui questa sessione su quella macchina, mostrala nella mia barra laterale come qualsiasi altra sessione ed elimina la macchina al termine.

## Obiettivi

- Eseguire una sessione completa dell'agente (ciclo + strumenti) su una macchina remota effimera ("worker cloud"), mentre la sessione appare e viene trasmessa nella UI di controllo esattamente come una sessione locale.
- Nessuna credenziale permanente sul worker (nessuna autenticazione del provider né token del servizio di hosting del codice) e nessuna uscita diretta sulla rete; la macchina richiede soltanto un servizio sshd raggiungibile.
- Eseguire provisioning, sincronizzazione, avvio, raccolta e distruzione in modo completamente automatico e con provider intercambiabili (primo provider: CLI di leasing in stile Crabbox).
- Inviare dal Gateway a un worker il lavoro in esecuzione al confine tra due turni senza perdere la trascrizione, l'identità della sessione o, quando i byte della richiesta restano equivalenti, l'affinità con la cache del provider; recuperare in sicurezza i risultati.
- Consentire sia agli utenti (tramite UI) sia agli agenti (tramite strumento) di inviare il lavoro a un worker cloud.
- Supportare sessioni della durata di più giorni; la durata è definita dai criteri, non da un limite codificato.

## Non obiettivi (v1)

- Nessun ambiente di esecuzione esterno per la programmazione (Claude Code, Codex CLI) sui worker. Le sessioni dei worker eseguono soltanto il runner incorporato di OpenClaw. Il supporto per tali ambienti è un'opzione esplicita prevista per la v2, poiché eseguono autonomamente l'inferenza con credenziali proprie.
- Nessuna diramazione in tentativi paralleli o selezione del migliore tra N.
- Nessuna dipendenza da VPN/tailnet. Il trasporto avviene esclusivamente tramite SSH.
- Nessun nuovo runtime di sandbox. La macchina del worker costituisce il confine di isolamento; in futuro sarà possibile aggiungere livelli di sandboxing del sistema operativo all'interno della macchina.
- Nessuna migrazione simmetrica in tempo reale nella v1: l'invio avviene da locale → worker; il ritorno da worker → locale richiede una sessione arrestata e il completamento della riconciliazione dello spazio di lavoro. Il passaggio bidirezionale in tempo reale potrà essere costruito in seguito sullo stesso meccanismo di barriera.
- Nessuno stato laterale JSON sul Gateway; lo stato dell'ambiente, del posizionamento, del cursore e delle autorizzazioni risiede in SQLite.

## Soluzioni precedenti (cosa replichiamo e cosa invertiamo)

- Agenti cloud di Cursor: il ciclo dell'agente viene eseguito nel loro cloud; la VM è una destinazione per l'esecuzione degli strumenti; l'archivio della conversazione è di sola aggiunta e viene trasmesso a tutti i client; un'istantanea successiva all'installazione consente un avvio rapido; i worker autogestiti sono processi che effettuano soltanto connessioni in uscita. Replichiamo il modello in cui "la fonte autorevole della conversazione rimane nell'orchestratore" e il modello di trasmissione; invertiamo il posizionamento del ciclo (vedere la decisione seguente).
- Codex cloud: runtime in due fasi — fase di configurazione con accesso alla rete, seguita da una fase offline dell'agente senza segreti; cache dello stato del container per velocizzare le attività successive. Replichiamo la separazione delle fasi come impostazione per l'uscita sulla rete e l'idea della cache per le immagini preconfigurate della v2.
- Claude Code sul web: una VM per sessione; proxy git che isola le credenziali (i token reali non entrano mai nella sandbox e il push è limitato al ramo della sessione); istantanea del filesystem dopo la configurazione; passaggio tramite teletrasporto = ramo pubblicato + cronologia riprodotta. Replichiamo l'isolamento delle credenziali e il modello del passaggio, ma la sincronizzazione in uscita usa rsync dal Gateway, così funzionano anche gli alberi di lavoro con modifiche non salvate in commit e nessun token del servizio di hosting del codice si trova nei pressi della macchina.
- Agente di programmazione Copilot: uscita negata per impostazione predefinita con un elenco di registri di pacchetti consentiti. La nostra impostazione predefinita durante il funzionamento stabile è più restrittiva (nessuna uscita diretta) perché l'inferenza e la ricerca web arrivano attraverso il tunnel SSH; consultare tuttavia la sezione Sicurezza per capire perché si tratta di "uscita controllata", non di "uscita zero".

## Decisione architetturale: ciclo sul worker, inferenza tramite il Gateway

Sono stati considerati tre posizionamenti:

1. Il ciclo rimane sul Gateway e il worker esegue gli strumenti (modello Cursor). È il dominio di errore più sicuro (trascrizione, inferenza, approvazioni e ripristino dopo il riavvio rimangono tutti in locale) e costituisce la prima milestone preferita dai revisori. È stato scartato come architettura del prodotto: gli strumenti non di esecuzione di OpenClaw sono operazioni in-process sul filesystem, pertanto ogni lettura, modifica o ricerca nei file richiederebbe un'andata e ritorno sulla rete oppure un'ampia ristrutturazione della superficie degli strumenti in RPC generiche sullo spazio di lavoro; il comportamento del runtime è caratterizzato da numerose interazioni ed è vincolato dalla latenza. Ne riutilizziamo il principio dove è già implementato (delega dell'esecuzione ai Node), ma non realizziamo il livello di remotizzazione degli strumenti.
2. Sia il ciclo sia l'inferenza vengono eseguiti sul worker. È il dominio di errore più semplice, ma le credenziali del modello (inclusi i profili OAuth) devono essere trasferite alle macchine temporanee, il Gateway perde il controllo su criteri, instradamento e audit e la migrazione cambia l'identità che effettua le chiamate al provider, invalidandone le cache.
3. Ciclo + strumenti sul worker, con chiamate al modello inoltrate tramite proxy dal Gateway. Opzione scelta. Un'andata e ritorno per ogni turno del modello anziché per ogni chiamata a uno strumento; gli strumenti vengono eseguiti accanto al codice; il Gateway rimane l'unico proprietario dei profili di autenticazione, dell'instradamento dei provider e dei criteri; il worker non conserva segreti.

Il costo dell'opzione 3 è la dipendenza sincrona dal Gateway durante ogni turno del modello, pertanto le relative regole di durabilità fanno parte della decisione e non costituiscono un'aggiunta successiva:

- La perdita del Gateway durante un turno causa il fallimento della chiamata attiva al provider. Il turno viene contrassegnato come non riuscito e riprovato come nuovo turno dopo la riconnessione; non viene eseguita alcuna riproduzione trasparente di uno stream del provider in corso (rischio di doppia fatturazione o doppia chiamata agli strumenti).
- Ogni operazione worker↔Gateway include un'identità durevole (vedere Protocollo del worker), affinché le riconnessioni riprendano l'operazione o recuperino i risultati finali memorizzati nella cache anziché lasciarla sospesa.
- Il Gateway è un componente con capacità gestita: i limiti dei worker simultanei, il controllo del flusso e la riduzione del carico rientrano nell'ambito della v1 (vedere Capacità).

Poiché il Gateway memorizza sia la trascrizione sia l'origine di tutto il traffico verso i provider, la sessione è indipendente dalla posizione: lo spostamento del ciclo tra Gateway e worker non modifica nulla sul lato del provider né nel percorso dei dati della UI. Questo rende economici l'invio e il recupero.

## Componenti

### 1. Macchina a stati dell'ambiente + contratto del provider

`environments.*` nel protocollo del Gateway è attualmente una proiezione del solo stato. Il nucleo durevole è costituito da un record dell'ambiente e da una macchina a stati di proprietà di SQLite, progettati prima delle forme RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Il provisioning è resistente agli arresti anomali: la riga dell'intento viene salvata prima della chiamata al provider, con un ID operazione deterministico, affinché un riavvio del Gateway possa adottare un leasing in corso anziché eseguire un doppio provisioning o lasciare orfana una macchina a pagamento.
- La riconciliazione dopo il riavvio e un processo di pulizia degli elementi orfani (`inspect` del provider rispetto ai record locali) sono requisiti della v1, non misure di irrobustimento.

Contratto del provider (implementato tramite Plugin; nessun nome di provider o criterio nel nucleo):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → host/porta/utente SSH/materiale della chiave
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adozione/salute/pulizia degli elementi orfani
  renew?(leaseId: string): Promise<void>; // sessioni di lunga durata rispetto ai TTL del provider
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotente, restituisce solo dopo la prova dello smantellamento
};
```

RPC: `environments.create`, `environments.destroy`, `environments.list/status` estesi (provider, ID leasing, stato, età, tempo di inattività, sessioni collegate). Primi provider: un wrapper per CLI di leasing con struttura in stile Crabbox (percorso di prodotto) e un provider di host SSH statici contrassegnato come destinato esclusivamente allo sviluppo; un worker su un host condiviso può leggere dati dell'host non correlati, pertanto gli host statici sono riservati allo sviluppo della funzionalità e non costituiscono l'impostazione predefinita.

### 2. Bootstrap del worker: installazione di OpenClaw sulla macchina

Nessun artefatto specifico per il worker e nessuna dipendenza dalla disponibilità di npm:

- Installazione canonica per tutte le modalità: un bundle del worker prodotto dal Gateway e identificato dall'hash del contenuto (l'output della build del Gateway compresso in un tarball), inviato tramite SSH e installato sulla macchina. Per costruzione, questo copre le build di sviluppo e i commit non ancora pubblicati.
- `npm i -g openclaw@<exact gateway version>` è un'ottimizzazione quando il Gateway esegue una versione pubblicata; mai `latest`.
- Il bootstrap è idempotente; un leasing preconfigurato con un hash del bundle corrispondente salta l'installazione. Le macchine non preparate potrebbero richiedere una fase della toolchain con accesso alla rete (runtime Node), che fa parte della fase di configurazione e viene chiusa successivamente.
- L'handshake verifica l'hash della build del worker, l'insieme delle funzionalità del protocollo e la compatibilità del runtime. Le verifiche esistenti della versione e del protocollo del Gateway non sono sufficienti a tale scopo (i Node collegati tramite tunnel SSH sono esentati dal rifiuto per mancata corrispondenza esatta della versione), pertanto l'ammissione del worker esegue una verifica autonoma della corrispondenza esatta della build.

La modalità worker (`openclaw worker`) è un punto di ingresso, non una biforcazione: gestione della connessione più runner dell'agente incorporato, con persistenza della sessione e chiamate al modello supportate dalle RPC del Gateway. Non deve avviare le superfici del Gateway: nessun canale, nessun avvio automatico dei Plugin oltre all'insieme degli strumenti della sessione, directory di stato temporanea, nessun profilo di autenticazione locale.

### 3. Trasporto: tutto tramite SSH

Il Gateway gestisce la connettività; il worker non richiede altro che sshd:

- Il Gateway apre una connessione SSH al worker (credenziali ottenute dal leasing del provider, chiave host vincolata all'output del provisioning; nessun `StrictHostKeyChecking=no`) e stabilisce un tunnel inverso che inoltra un socket locale del worker all'endpoint WS del Gateway.
- Il traffico di controllo/modello e il trasferimento dello spazio di lavoro utilizzano connessioni SSH separate con lo stesso materiale di attendibilità vincolato, affinché rsync non blocchi in testa alla coda gli stream dei token.
- Il ciclo di vita del tunnel (keepalive, riconnessione con backoff) è gestito dal runtime dell'ambiente sul Gateway. Un'interruzione momentanea del tunnel è invisibile a livello della sessione: lo stato durevole del protocollo (descritto di seguito) consente al worker di ricollegarsi e riprendere.

### 4. Protocollo del worker (dedicato; distinto dal protocollo dei Node)

La revisione avversariale delle attuali interfacce dei Node ha escluso il semplice riutilizzo: le invocazioni in sospeso dei Node sono promesse locali al processo che vengono perse con la connessione, le chiavi di idempotenza dei Node vengono analizzate ma non deduplicate e, fattore decisivo, un Node connesso può emettere normali eventi dei Node (incluse richieste di esecuzione dell'agente), pertanto "tipo di Node + limite delle capacità" non costituisce un confine di sicurezza in ingresso. I worker ricevono quindi un ruolo `worker` autenticato con un elenco chiuso e versionato di RPC/eventi consentiti; le connessioni dei worker non possono raggiungere alcun gestore degli eventi dei Node preesistente.

Identità e credenziali: il provisioning genera una credenziale di breve durata per il worker, vincolata all'ID dell'ambiente, alla chiave del worker, all'hash del bundle, all'unica sessione consentita, all'insieme delle RPC consentite e a una scadenza. L'associazione verificata tramite SSH continua ad applicarsi (abbiamo effettuato il provisioning della macchina e possediamo la chiave), ma l'autorizzazione deriva dalla credenziale generata, non dalla superficie dichiarata del Node.

Semantica durevole delle operazioni (struttura derivata dal runtime ACP esistente e dal relativo registro degli eventi: handle stabili, serializzazione per sessione, riproduzione durevole di `(session, seq)`):

- Ogni operazione è circoscritta da `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Le epoche di proprietà isolano i worker obsoleti: un worker sostitutivo incrementa l'epoca; i risultati tardivi dell'epoca precedente vengono rifiutati in modo deterministico.
- Consegna almeno una volta con cursori ACK persistenti e risultati finali memorizzati nella cache di SQLite; la deduplicazione è deterministica. Nessuna garanzia di esecuzione esattamente una volta.
- Frame espliciti per annullamento, chiusura, ripresa e risultati finali; controllo del flusso degli stream basato su crediti/finestre.
- La negoziazione delle funzionalità del protocollo è indipendente dalla versione generale del protocollo dei Node.

### 5. RPC del backend della sessione

Due contratti distinti: il codebase attuale separa le mutazioni persistenti della trascrizione (gestite dal session manager, albero JSONL con stato padre/foglia) dagli eventi attivi locali al processo (delta di streaming, ciclo di vita degli strumenti, approvazioni) e il protocollo del worker deve preservare questa separazione:

- Commit persistenti della trascrizione: il worker invia batch semantici di aggiunte con `runEpoch` + compare-and-swap sulla foglia di base; il session manager del Gateway genera gli ID delle voci e gli ID padre. Il worker non può mai fornire righe di trascrizione attendibili, ID delle voci, ID padre o ID di sessioni esterne.
- Eventi attivi riproducibili: un'unione tipizzata di eventi con numeri di sequenza del worker, ACK del Gateway, conservazione limitata e isolamento degli eventi tardivi, che alimenta il fan-out esistente degli eventi dell'agente affinché la vista della chat, le righe degli strumenti e la logica di stato/non letti si comportino in modo identico alle sessioni locali.

Proxy di inferenza: riutilizzare il vocabolario degli eventi del client di streaming del proxy runtime esistente (`src/agents/runtime/proxy.ts`), ma spostare il confine di attendibilità. Il worker invia soltanto l'identità di sessione/esecuzione, un riferimento a un modello approvato, il contesto e opzioni di generazione vincolate; il Gateway risolve provider, endpoint, autenticazione, intestazioni, instradamento e criteri di costo dal proprio catalogo. Un oggetto modello fornito dal worker (ad esempio un `baseUrl` controllato da un attaccante) viene rifiutato. Si applicano limiti alle dimensioni delle richieste, annullamento, audit e riproduzione del risultato terminale. Gli strumenti residenti nel Gateway (websearch) vengono eseguiti sul Gateway e restituiscono i risultati tramite lo stesso canale.

### 6. Sincronizzazione dell'area di lavoro

L'ancora di sincronizzazione è un'area di lavoro locale al Gateway con proprietà esclusiva del posizionamento: per le aree di lavoro git, un worktree gestito dedicato (i metadati esistenti del worktree gestito — ramo, base, proprietà dello snapshot — ne costituiscono il fondamento); per le aree di lavoro non git, una directory di destinazione di proprietà del Gateway. Mai il checkout attivo dell'utente. La proprietà esclusiva mentre la sessione è posizionata in remoto rende la sincronizzazione in entrata priva di conflitti per costruzione.

Separazione delle responsabilità: commit e pubblicazione:

- L'agente lato worker crea normalmente i commit nella propria copia (`git commit` è un'operazione locale che non richiede credenziali; l'identità dell'autore viene proiettata dalla configurazione del Gateway). Questi commit sono oggetti inerti finché il Gateway non li acquisisce.
- Il Gateway esegue tutto ciò che richiede attendibilità: verifica che i commit in entrata si basino sulla base registrata, avanzamento fast-forward del worktree locale, push, creazione della PR e firma o nuova firma facoltativa, il tutto con credenziali locali al Gateway. Il worker non possiede mai credenziali git o della piattaforma di hosting e non accede mai a un remoto.

Due modalità di sincronizzazione, selezionate in base al fatto che l'area di lavoro sia o meno un repository git:

- Modalità git. In uscita: sincronizzare con rsync il worktree (inclusi i file non sottoposti a commit e i file non tracciati idonei; inclusioni/esclusioni in stile crabbox, rispettando `.worktreeinclude`) tramite l'identità SSH del tunnel, registrandolo come manifest di base immutabile (hash dei contenuti + commit di base). In entrata: i nuovi commit ritornano come bundle git o riferimento temporaneo rispetto alla base registrata; gli artefatti non tracciati ritornano tramite un manifest esplicito con controlli su dimensioni, tipo e contenimento dei collegamenti simbolici. L'acquisizione verifica l'ascendenza della base e si arresta in caso di divergenza: nulla sovrascrive silenziosamente alcun lato. Eliminazioni, rinominazioni, sottomoduli e fughe tramite collegamenti simbolici sono gestiti dalle regole del manifest, non da euristiche rsync.
- Modalità semplice (senza git, ad esempio quando si crea da zero un progetto sul box). L'uscita usa lo stesso rsync + manifest di base. L'entrata è un mirroring basato sulle differenze del manifest verso la directory di destinazione di proprietà del Gateway, con propagazione delle eliminazioni. È sicura per lo stesso motivo della modalità git: la proprietà esclusiva garantisce che non esistano modifiche locali simultanee con cui entrare in conflitto; il manifest di base rileva comunque deviazioni locali impreviste e si arresta anziché sovrascrivere.

I checkpoint proteggono le sessioni che durano giorni dalla perdita del lease: checkpoint periodici in entrata (commit sul ramo della sessione in modalità git, snapshot del manifest in modalità semplice); la cadenza è definita dai criteri del profilo (per impostazione predefinita, in base ai turni).

### 7. Macchina a stati del posizionamento, sessioni e interfaccia utente

Il posizionamento del runtime è una macchina a stati di proprietà di SQLite associata alla sessione, non una coppia di campi di riga scollegati:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Mantiene in modo persistente l'ID dell'ambiente, la generazione della transizione, l'epoca del proprietario attivo, il manifest di base dell'area di lavoro, l'hash del bundle del worker e gli ultimi cursori ACK. L'ammissione del turno acquisisce atomicamente il posizionamento prima che uno dei due loop avvii un turno, così un messaggio locale ammesso rispetto a uno snapshot obsoleto non può mai entrare in competizione con un turno del worker: in ogni momento, esattamente un loop è proprietario della sessione.

Interfaccia utente:

- Una sessione worker è una normale riga di sessione con metadati di posizionamento. Risiede nell'archivio normale, viene elencata tramite `sessions.list` e trasmessa in streaming tramite le sottoscrizioni esistenti: la barra laterale e la chat non richiedono un nuovo percorso dati, ma soltanto una presentazione diversa, con un badge del worker e lo stato di posizionamento/ambiente (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Esperienza di creazione: la barra di destinazione della sessione (riprogettazione della barra laterale delle sessioni) aggiunge una destinazione worker cloud accanto a Gateway e Node. Richiede un profilo provider configurato; la funzionalità resta invisibile finché non viene configurata.
- Invio dell'agente: uno strumento di sessione consente a un agente di affidare il lavoro a un worker cloud come farebbe una persona (sottosessione supportata da worker, in stile sottoagente). Viene distribuito nella stessa fase dell'invio da parte di una persona ed è subordinato alla stessa configurazione provider facoltativa. La ricorsione è limitata strutturalmente (nella v1, le sessioni worker non possono a loro volta inviare worker); il controllo della spesa avviene tramite contabilizzazione/audit per ambiente, non tramite meccanismi di quota.

## Invio e passaggio di controllo

La v1 è deliberatamente asimmetrica:

- Locale → worker (invio): superare la barriera di migrazione descritta di seguito, predisporre o riutilizzare un worker, sincronizzare, cambiare il posizionamento; il turno successivo viene eseguito in remoto.
- Worker → locale (ritorno): arrestare la sessione (svuotare il worker secondo la stessa barriera), completare la riconciliazione in entrata, cambiare il posizionamento a locale. Non è una migrazione in tempo reale.
- Passaggio di controllo simmetrico in tempo reale (spostamento di una sessione attivamente in esecuzione in entrambe le direzioni senza arrestarla): riutilizza la stessa barriera e lo stesso meccanismo di riconciliazione e viene distribuito dopo che i test di iniezione degli errori hanno convalidato la barriera.

Barriera di migrazione (il solo «confine del turno» non è sufficiente: approvazioni, processi in background e unioni della trascrizione dopo il rilascio del lock possono oltrepassarlo):

1. Interrompere l'ammissione di nuovi turni (acquisizione del posizionamento).
2. Annullare o svuotare le esecuzioni attive.
3. Revocare le approvazioni di esecuzione e le autorizzazioni di esecuzione in sospeso.
4. Svuotare le scritture laterali della trascrizione e gli ACK degli eventi attivi.
5. Terminare i processi figli del worker.
6. Isolare il vecchio proprietario facendo avanzare l'epoca del proprietario.
7. Riconciliare l'area di lavoro (in entrata, con gestione dei conflitti).
8. Attivare il nuovo proprietario.

Affinità della cache: poiché le richieste al provider hanno origine dal Gateway in entrambi i posizionamenti, l'affinità della cache viene preservata quando la richiesta serializzata al provider rimane equivalente: stesso ordine degli strumenti, stesse istruzioni di sistema, stessi wrapper del provider e stessi metadati della cache (che restano lato Gateway). È una proprietà verificabile, non un'ipotesi: i test di equivalenza byte per byte tra posizionamento locale e worker per ogni trasporto provider supportato fanno parte della fase che introduce il loop del worker.

## Modello di sicurezza

In termini precisi: il worker non dispone di accesso diretto in uscita alla rete né di credenziali permanenti del provider o della piattaforma di hosting. Non è «privo di traffico in uscita»: l'inferenza e gli strumenti eseguiti dal Gateway sono canali di uscita controllati (un worker sottoposto a prompt injection può comunque inserire byte dell'area di lavoro nel contesto del modello o nelle query di websearch). Di conseguenza:

- Contabilizzazione dell'uscita controllata: audit per ambiente e contabilizzazione visibile all'operatore sul proxy di inferenza e sugli strumenti del Gateway. I limiti di frequenza/byte esistono come controllo di flusso del protocollo (capacità), non come meccanismo di quota di spesa.
- L'ingresso dal worker al Gateway è limitato alla lista consentita chiusa del protocollo del worker; le scritture della trascrizione sono vincolate strutturalmente (ID generati dal Gateway, una singola sessione associata).
- L'esecuzione sul worker dispone di autorizzazioni complete all'interno del box. Il box è eliminabile e privo di credenziali, quindi l'approvazione per comando aggiunge attrito senza proteggere nulla; il confine sorvegliato è costituito dalla riconciliazione in entrata e dall'audit. L'esecuzione non attraversa mai il percorso di approvazione del Node del Gateway.
- I criteri Internet sono una decisione del provider al momento del provisioning: il profilo dell'ambiente decide durante la creazione del box (firewall/gruppo di sicurezza/rete senza uscita), facoltativamente con una fase di configurazione con accesso alla rete che il provider chiude prima della fase dell'agente. Il core non implementa un interruttore di rete durante il runtime.
- Igiene del box al momento del provisioning: endpoint dei metadati cloud bloccato o verificato come assente, nessun profilo dell'istanza, nessun agente SSH ereditato, nessun socket Docker, ambiente/home puliti. Le chiavi host SSH vengono fissate dall'output del provisioning.
- Le approvazioni e i criteri per tutto ciò che avviene lato Gateway (push, PR, chiamate al provider) continuano a essere eseguiti sul Gateway.

Raggio d'impatto di una sessione worker compromessa: la copia sincronizzata dell'area di lavoro più ciò che consentono i canali proxy sottoposti ad audit, senza credenziali, senza rete diretta e senza superfici del Gateway oltre la lista consentita.

## Capacità

Il Gateway inoltra ogni prompt e flusso di token per N worker, quindi la v1 definisce un modello di capacità anziché scoprirlo in produzione: limiti di worker simultanei per Gateway, finestre di credito per flusso (la coda attuale del flusso di eventi è illimitata e il limite del buffer del socket del Node forza la chiusura per i consumatori lenti; entrambe le soluzioni sono inadatte senza modifiche), spooling su disco limitato per i picchi e riduzione del carico con stati di contropressione visibili nell'interfaccia utente. Il trasferimento dell'area di lavoro rimane sul proprio canale SSH.

## Ciclo di vita

- L'arresto automatico per inattività e il TTL sono criteri del profilo provider, non costanti fisse. Le impostazioni predefinite sono generose e prevedono un keep-alive esplicito; il lavoro che dura giorni è un caso d'uso di prima classe (il provider espone `renew` per i backend basati su lease); una sessione con un turno in corso o attività recente non viene mai recuperata.
- In caso di arresto o recupero del worker: il posizionamento passa a `reclaimed`, la riga della sessione rimane e il messaggio successivo predispone un nuovo worker ed esegue nuovamente la sincronizzazione dall'ultimo checkpoint. La conversazione non viene mai persa (archivio lato Gateway); le modifiche all'area di lavoro successive all'ultimo checkpoint vengono perse e l'interfaccia utente lo segnala.
- Riutilizzo dei lease ancora attivi fin dal primo giorno (per i provider che lo supportano); lo snapshot dell'immagine dopo il bootstrap è il percorso di avvio rapido della v2.

## Superficie di configurazione

Minima e facoltativa: un blocco del profilo provider (ID del provider, credenziali/riferimento CLI, regole di sincronizzazione, criteri di durata, budget, fase di configurazione facoltativa) più la selezione del posizionamento per sessione. Nessuna nuova variabile d'ambiente. Le installazioni non configurate non mostrano nulla.

## Fasi

L'implementazione viene integrata tramite PR piccole e indipendenti; ciascuna fase seguente è una serie di PR, non una singola modifica.

1. Fondamenta: macchina a stati dell'ambiente + contratto del provider + provider con struttura crabbox (SSH statico come infrastruttura di sviluppo), bootstrap del bundle del worker + handshake di ammissione, tunnel SSH + fissaggio della chiave host, snapshot del worktree gestito + sincronizzazione in uscita (modalità git + semplice). Pulizia degli orfani + riacquisizione dopo il riavvio.
2. Protocollo del worker + loop del worker: ruolo worker autenticato, operazioni persistenti/epoche/cursori ACK, contratti di commit della trascrizione + eventi attivi, proxy di inferenza con modelli risolti dal Gateway, controllo del flusso. Un provider, solo invio umano di nuove sessioni, nessun passaggio di controllo. I test di iniezione degli errori (partizione del tunnel, riavvio del Gateway, arresto del worker) costituiscono il criterio di completamento.
3. Invio + ritorno + invio dell'agente: barriera di migrazione, macchina a stati del posizionamento collegata alla barra di destinazione dell'interfaccia utente, riconciliazione in entrata + checkpoint, audit per ambiente, limiti di capacità, strumento di invio dell'agente (le sessioni worker non possono attivare ricorsione). Test di equivalenza byte per byte della cache dei prompt.
4. Passaggio di controllo simmetrico in tempo reale, dopo la verifica tramite iniezione degli errori della fase 3.

In seguito: infrastrutture ACP sui worker come opzione per ambiente con inserimento delle credenziali; avvio rapido tramite snapshot/immagine pre-riscaldata; fan-out (N lease, stesso prompt); sandboxing del sistema operativo nel box; acquisizione più completa degli artefatti tramite lo schema degli artefatti.

## Domande aperte

- Disponibilità di Plugin/Skills sui worker: le Skills incluse nel repository vengono sincronizzate gratuitamente con il workspace; per le Skills/i Plugin dell'agente configurati nel Gateway è necessaria una decisione esplicita di sincronizzazione o esclusione (in entrambi i casi, il manifesto dello strumento/Plugin fa parte dell'handshake di ammissione).
- Frequenza predefinita dei checkpoint: basata sui turni oppure sul tempo per le sessioni molto conversazionali.
- Modalità di interazione tra i profili di ambiente e l'instradamento multi-agente (profili predefiniti per agente oppure sola selezione per sessione).
