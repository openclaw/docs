---
read_when:
    - Si sta creando un nuovo plugin per un canale di messaggistica
    - Si desidera connettere OpenClaw a una piattaforma di messaggistica
    - È necessario comprendere l'interfaccia dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida dettagliata alla creazione di un plugin per canale di messaggistica per OpenClaw
title: Creazione di plugin per canali
x-i18n:
    generated_at: "2026-07-16T14:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida crea un plugin di canale che collega OpenClaw a una piattaforma di
messaggistica: sicurezza dei messaggi diretti, associazione, threading delle risposte e messaggistica in uscita.

<Info>
  Prima esperienza con i plugin OpenClaw? Consultare prima [Guida introduttiva](/it/plugins/building-plugins)
  per la struttura del pacchetto e la configurazione del manifest.
</Info>

## Responsabilità del plugin

I plugin di canale non implementano strumenti per inviare, modificare o aggiungere reazioni; il core fornisce uno
strumento `message` condiviso. Il plugin gestisce:

- **Configurazione** - risoluzione degli account e procedura guidata di configurazione
- **Sicurezza** - criteri per i messaggi diretti ed elenchi di elementi consentiti
- **Associazione** - flusso di approvazione dei messaggi diretti
- **Grammatica delle sessioni** - modalità con cui gli ID di conversazione specifici del provider vengono associati alle chat
  di base, agli ID dei thread e ai fallback dei genitori
- **Uscita** - invio di testo, contenuti multimediali e sondaggi alla piattaforma
- **Threading** - modalità di organizzazione delle risposte in thread
- **Digitazione Heartbeat** - segnali facoltativi di digitazione/occupato per le destinazioni di recapito
  Heartbeat

Il core gestisce lo strumento condiviso per i messaggi, il collegamento dei prompt, la struttura esterna della chiave di sessione,
la contabilità generica `:thread:` e l'invio.

## Adattatore dei messaggi

Esporre un adattatore `message` con `defineChannelMessageAdapter` da
`openclaw/plugin-sdk/channel-outbound`. Dichiarare solo le funzionalità durevoli di invio finale
effettivamente supportate dal trasporto nativo, corredate da un test del contratto
che dimostri l'effetto collaterale nativo e la ricevuta restituita. Indirizzare gli invii di testo/contenuti multimediali
alle stesse funzioni di trasporto utilizzate dall'adattatore `outbound` precedente. Per
il contratto API completo, la matrice delle funzionalità, le regole delle ricevute, la finalizzazione
dell'anteprima in tempo reale, i criteri di conferma della ricezione, i test e la tabella di migrazione, consultare
[API di uscita dei canali](/it/plugins/sdk-channel-outbound).

Se l'adattatore `outbound` esistente dispone già dei metodi di invio e dei
metadati delle funzionalità corretti, derivare l'adattatore `message` con
`createChannelMessageAdapterFromOutbound(...)` anziché scrivere manualmente un altro
ponte. Gli invii dell'adattatore restituiscono valori `MessageReceipt`. Per gli ID precedenti, derivarli
con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)` anziché mantenere campi `messageIds`
paralleli.

Dichiarare con precisione le funzionalità in tempo reale e di finalizzazione: il core le utilizza per stabilire
le operazioni disponibili per un canale e qualsiasi divergenza tra il comportamento dichiarato e quello effettivo causa
il fallimento di un test del contratto:

| Superficie                            | Valori                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

I canali che finalizzano sul posto un'anteprima della bozza devono instradare la logica di runtime
tramite `defineFinalizableLivePreviewAdapter(...)` insieme a
`deliverWithFinalizableLivePreviewAdapter(...)` e mantenere le funzionalità
dichiarate coperte dai test `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
e `verifyChannelMessageLiveFinalizerProofs(...)`, affinché il comportamento nativo di anteprima,
avanzamento, modifica, fallback/conservazione, pulizia e ricevuta non possa divergere
senza essere rilevato.

I ricevitori in ingresso che posticipano le conferme della piattaforma devono dichiarare
`message.receive.defaultAckPolicy` e `supportedAckPolicies` anziché nascondere
la tempistica delle conferme nello stato locale del monitor. Coprire ogni criterio dichiarato con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Gli helper precedenti per le risposte, come `dispatchInboundReplyWithBase` e
`recordInboundSessionAndDispatchReply`, rimangono disponibili per i dispatcher di compatibilità.
Non utilizzarli per il nuovo codice dei canali; iniziare invece con l'adattatore `message`,
le ricevute e gli helper del ciclo di vita di ricezione/invio su
`openclaw/plugin-sdk/channel-outbound`.

### Ingresso dei messaggi in entrata (sperimentale)

I canali che migrano l'autorizzazione in ingresso possono utilizzare il sottopercorso sperimentale
`openclaw/plugin-sdk/channel-ingress-runtime` dai percorsi di ricezione del runtime.
Accetta dati della piattaforma, elenchi non elaborati di elementi consentiti, descrittori delle route, dati dei comandi
e configurazione dei gruppi di accesso, quindi restituisce proiezioni relative a mittente/route/comando/attivazione
insieme al grafo di ingresso ordinato, mentre la ricerca sulla piattaforma e gli effetti
collaterali rimangono nel plugin. Mantenere la normalizzazione dell'identità del plugin nel
descrittore passato al risolutore; non serializzare i valori di corrispondenza non elaborati dallo
stato o dalla decisione risolti. Consultare
[API di ingresso dei canali](/it/plugins/sdk-channel-ingress) per la progettazione dell'API,
il confine delle responsabilità e le aspettative dei test.

### Indicatori di digitazione

Se il canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esporre
`heartbeat.sendTyping(...)` nel plugin di canale. Il core lo chiama con la
destinazione di recapito Heartbeat risolta prima dell'avvio dell'esecuzione del modello Heartbeat e
utilizza il ciclo di vita condiviso di mantenimento e pulizia dell'indicatore di digitazione. Aggiungere
`heartbeat.clearTyping(...)` quando la piattaforma richiede un segnale esplicito di arresto.

### Parametri delle sorgenti multimediali

Se il canale aggiunge parametri allo strumento per i messaggi che contengono sorgenti multimediali, esporre
i nomi di tali parametri tramite `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Il core utilizza questo elenco esplicito per la normalizzazione dei percorsi sandbox e i criteri
di accesso ai contenuti multimediali in uscita, così i plugin non richiedono casi speciali nel core condiviso per
parametri specifici del provider relativi ad avatar, allegati o immagini di copertina.

Preferire una mappa basata sulle azioni, come `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
affinché le azioni non correlate non ereditino gli argomenti multimediali di un'altra azione. Un array semplice
continua a funzionare per i parametri condivisi intenzionalmente tra tutte le azioni esposte.

I canali che devono esporre un URL pubblico temporaneo per il recupero di contenuti multimediali
da parte della piattaforma possono utilizzare `createHostedOutboundMediaStore(...)` da
`openclaw/plugin-sdk/outbound-media` con gli archivi di stato del plugin. Mantenere l'analisi
delle route della piattaforma e l'applicazione dei token nel plugin di canale; l'helper condiviso
gestisce soltanto il caricamento dei contenuti multimediali, i metadati di scadenza, le righe dei frammenti e la pulizia.

### Definizione della struttura del payload nativo

Se il canale richiede una struttura specifica del provider per `message(action="send")`,
preferire `actions.prepareSendPayload(...)`. Inserire schede native, blocchi, incorporamenti o
altri dati durevoli in `payload.channelData.<channel>` e lasciare che il core esegua l'invio
tramite l'adattatore di uscita/messaggi. Utilizzare `actions.handleAction(...)` per l'invio
solo come fallback di compatibilità per i payload che non possono essere serializzati e
ritentati.

### Grammatica delle conversazioni di sessione

Se la piattaforma memorizza un ambito aggiuntivo negli ID delle conversazioni, mantenerne l'analisi
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per associare `rawId` all'ID della conversazione di base, all'ID
facoltativo del thread, a `baseConversationId` esplicito e a qualsiasi
`parentConversationCandidates`. Quando si restituiscono `parentConversationCandidates`,
ordinarli dal genitore più specifico alla conversazione più ampia/di base.

`messaging.resolveParentConversationCandidates(...)` è un fallback di compatibilità
deprecato per i plugin che necessitano soltanto di fallback dei genitori oltre
all'ID generico/non elaborato. Se esistono entrambi gli hook, il core utilizza prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` soltanto quando l'hook canonico
li omette.

I plugin inclusi che richiedono la stessa analisi prima dell'avvio del registro dei canali
possono esporre un file `session-key-api.ts` di primo livello con un'esportazione
`resolveSessionConversation(...)` corrispondente (consultare i plugin Feishu e Telegram).
Il core utilizza questa superficie sicura per il bootstrap soltanto quando il registro dei plugin
di runtime non è ancora disponibile.

Utilizzare `openclaw/plugin-sdk/channel-route` quando il codice del plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la relativa route genitore o creare una
chiave di deduplicazione stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli ID numerici dei thread nello stesso modo del core, quindi è preferibile rispetto a confronti
`String(threadId)` ad hoc. I plugin con una grammatica delle destinazioni specifica del provider
devono esporre `messaging.resolveOutboundSessionRoute(...)`, affinché il core ottenga
identità di sessione e thread native del provider senza shim del parser.

### Supporto dell'associazione delle conversazioni con ambito account

Impostare `conversationBindings.supportsCurrentConversationBinding` quando il canale
supporta associazioni generiche della conversazione corrente. `createChatChannelPlugin(...)`
imposta questa funzionalità statica su `true` per impostazione predefinita.

Se il supporto varia in base all'account configurato, implementare anche
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Il core valuta questo hook sincrono soltanto dopo l'abilitazione della funzionalità statica.
La restituzione di `false` rende non disponibili per tale account le operazioni generiche
di funzionalità, associazione, ricerca, elenco, aggiornamento e rimozione dell'associazione della conversazione corrente.
L'omissione dell'hook applica la funzionalità statica a ogni account.

Determinare la risposta dalla configurazione dell'account o dallo stato di runtime già caricati. Questo
hook controlla soltanto le associazioni generiche della conversazione corrente; non sostituisce
le regole di associazione configurate o l'instradamento delle sessioni gestito dal plugin. I test del contratto
devono coprire almeno un account supportato e uno non supportato tramite il
contratto `ChannelPlugin["conversationBindings"]` esportato da
`openclaw/plugin-sdk/channel-core`.

## Approvazioni e funzionalità dei canali

La maggior parte dei plugin di canale non richiede codice specifico per le approvazioni. Il core gestisce
`/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e il recapito di fallback generico.
`ChannelPlugin.approvals` è stato rimosso; inserire invece i dati relativi a recapito/elementi nativi/rendering/autenticazione
delle approvazioni in un unico oggetto `approvalCapability`. `plugin.auth` riguarda soltanto accesso/disconnessione:
il core non legge più gli hook di autenticazione delle approvazioni da tale oggetto.

Utilizzare `approvalCapability.delivery` soltanto per l'instradamento nativo delle approvazioni o la soppressione
del fallback e `approvalCapability.render` soltanto quando un canale necessita realmente di
payload di approvazione personalizzati anziché del renderer condiviso.

### Autenticazione delle approvazioni

- `approvalCapability.authorizeActorAction` e
  `approvalCapability.getActionAvailabilityState` costituiscono l'interfaccia canonica
  per l'autenticazione delle approvazioni.
- Utilizzare `getActionAvailabilityState` per la disponibilità dell'autenticazione delle approvazioni nella stessa chat.
  Mantenere gli approvatori configurati disponibili per `/approve` anche quando il recapito nativo
  è disabilitato; utilizzare invece lo stato nativo della superficie di avvio per le indicazioni relative
  a recapito/configurazione.
- Se il canale espone approvazioni native dell'esecuzione, utilizzare
  `approvalCapability.getExecInitiatingSurfaceState` per lo stato
  della superficie di avvio/client nativo quando differisce dall'autenticazione delle approvazioni nella stessa chat.
  Il core utilizza tale hook specifico per l'esecuzione per distinguere `enabled` da
  `disabled`, determinare se il canale di avvio supporta approvazioni native dell'esecuzione
  e includere il canale nelle indicazioni di fallback per il client nativo.
  `createApproverRestrictedNativeApprovalCapability(...)` lo imposta per
  il caso comune.
- Se un canale può dedurre identità stabili, simili a quelle del proprietario, per i messaggi diretti dalla configurazione esistente,
  utilizzare `createResolvedApproverActionAuthAdapter` da
  `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat
  senza aggiungere logica specifica per le approvazioni nel core.
- Se l'autenticazione personalizzata delle approvazioni consente intenzionalmente soltanto il fallback nella stessa chat, restituire
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` da
  `openclaw/plugin-sdk/approval-auth-runtime`; in caso contrario, il core considera il
  risultato come autorizzazione esplicita dell'approvatore.
- Se un callback nativo gestito dal canale risolve direttamente le approvazioni, utilizzare
  `isImplicitSameChatApprovalAuthorization(...)` prima della risoluzione, affinché il
  fallback implicito passi comunque attraverso la normale autorizzazione dell'attore del canale.

### Ciclo di vita del payload e indicazioni di configurazione

- Utilizzare `outbound.shouldSuppressLocalPayloadPrompt` o
  `outbound.beforeDeliverPayload` per il comportamento specifico del canale relativo al ciclo di vita del payload,
  ad esempio per nascondere richieste di approvazione locali duplicate o inviare indicatori di digitazione
  prima del recapito.
- Utilizzare `approvalCapability.describeExecApprovalSetup` quando il canale vuole
  che la risposta del percorso disabilitato illustri le opzioni di configurazione esatte necessarie per abilitare
  le approvazioni native dell'esecuzione. L'hook riceve `{ channel, channelLabel, accountId }`;
  i canali con account denominati devono visualizzare percorsi con ambito account, come
  `channels.<channel>.accounts.<id>.execApprovals.*`, anziché valori predefiniti
  di primo livello.
- Utilizzare `approvalCapability.describePluginApprovalSetup` quando le indicazioni sugli errori di approvazione
  del plugin possono essere mostrate in sicurezza per gli errori di approvazione del plugin dovuti all'assenza di una route
  o al timeout. `createApproverRestrictedNativeApprovalCapability(...)` non
  lo deduce da `describeExecApprovalSetup`; passare esplicitamente lo stesso helper
  soltanto quando le approvazioni del plugin e dell'esecuzione utilizzano realmente la stessa configurazione nativa.

### Recapito nativo delle approvazioni

Se un canale necessita del recapito nativo delle approvazioni, mantenere il codice del canale incentrato sulla
normalizzazione della destinazione e sui dati di trasporto/presentazione. Utilizzare
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` e
`createApproverRestrictedNativeApprovalCapability` da
`openclaw/plugin-sdk/approval-runtime`. Inserire i dati specifici del canale dietro
`approvalCapability.nativeRuntime`, preferibilmente tramite
`createChannelApprovalNativeRuntimeAdapter(...)` o
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, affinché il core possa assemblare il
gestore e occuparsi del filtraggio delle richieste, dell'instradamento, della deduplicazione, della scadenza, della sottoscrizione
al Gateway e delle notifiche di instradamento altrove.

`nativeRuntime` è suddiviso in alcune interfacce più piccole:

- `availability` - se l'account è configurato e se una richiesta
  deve essere gestita
- `presentation` - mappa il modello di vista condiviso per le approvazioni in
  payload nativi in attesa/risolti/scaduti o azioni finali
- `transport` - prepara le destinazioni e invia/aggiorna/elimina i messaggi
  nativi di approvazione
- `interactions` - hook facoltativi di associazione/dissociazione/rimozione delle azioni per pulsanti
  o reazioni native, più un hook `cancelDelivered` facoltativo. Implementare
  `cancelDelivered` quando `deliverPending` registra uno stato in-process o persistente
  (come un archivio delle destinazioni delle reazioni), affinché tale stato possa essere rilasciato se
  l'arresto di un gestore annulla la consegna prima dell'esecuzione di `bindPending`, oppure quando
  `bindPending` non restituisce alcun handle
- `observe` - hook facoltativi per la diagnostica della consegna

Altri helper per le approvazioni:

- Usare `createNativeApprovalChannelRouteGates` da
  `openclaw/plugin-sdk/approval-native-runtime` quando un canale supporta sia
  la consegna nativa all'origine della sessione sia destinazioni esplicite per l'inoltro delle approvazioni. L'helper
  centralizza la selezione della configurazione delle approvazioni, la gestione di `mode`, i filtri
  di agente/sessione, l'associazione dell'account, la corrispondenza della destinazione della sessione e quella
  dell'elenco delle destinazioni, mentre i chiamanti continuano a gestire l'id del canale, la modalità
  di inoltro predefinita, la ricerca dell'account, la verifica dell'abilitazione del trasporto,
  la normalizzazione delle destinazioni e la risoluzione della destinazione
  dell'origine del turno. Non usarlo per creare impostazioni predefinite dei criteri del canale
  gestite dal core; passare esplicitamente la modalità predefinita documentata del canale.
- `createChannelNativeOriginTargetResolver` usa per impostazione predefinita il matcher condiviso delle route
  di canale per le destinazioni `{ to, accountId, threadId }`. Passare
  `targetsMatch` solo quando un canale presenta regole di equivalenza specifiche del provider,
  come la corrispondenza del prefisso del timestamp di Slack. Passare `normalizeTargetForMatch` quando
  il canale deve rendere canonici gli id del provider prima dell'esecuzione del matcher
  di route predefinito o di un callback `targetsMatch` personalizzato, conservando al contempo la
  destinazione originale per la consegna. Usare `normalizeTarget` solo quando deve essere resa canonica
  la destinazione di consegna risolta stessa.
- Se il canale necessita di oggetti gestiti dal runtime, come un client, un token, un'app
  Bolt o un ricevitore Webhook, registrarli tramite
  `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto di runtime
  consente al core di inizializzare gestori basati sulle funzionalità a partire dallo stato
  di avvio del canale, senza aggiungere codice collante wrapper specifico per le approvazioni.
- Ricorrere a `createChannelApprovalHandler` o
  `createChannelNativeApprovalRuntime` di livello inferiore solo quando il punto di integrazione basato sulle funzionalità
  non è ancora abbastanza espressivo.
- I canali di approvazione nativi devono instradare sia `accountId` sia `approvalKind`
  attraverso questi helper. `accountId` mantiene i criteri di approvazione per più account
  limitati all'account bot corretto, mentre `approvalKind` rende disponibile al canale
  il comportamento delle approvazioni exec rispetto a quelle dei Plugin, senza rami codificati rigidamente nel
  core.
- Il core gestisce anche gli avvisi di reinstradamento delle approvazioni. I Plugin dei canali non devono inviare
  autonomamente messaggi successivi del tipo "l'approvazione è stata inviata nei DM / in un altro canale" da
  `createChannelNativeApprovalRuntime`; devono invece esporre un instradamento accurato dell'origine e
  dei DM dell'approvatore tramite gli helper condivisi delle funzionalità di approvazione e lasciare che il
  core aggreghi le consegne effettive prima di pubblicare qualsiasi avviso nella
  chat di origine.
- Conservare integralmente il tipo di id dell'approvazione consegnata. I client nativi non devono
  dedurre o riscrivere l'instradamento delle approvazioni exec rispetto a quelle dei Plugin in base allo stato
  locale del canale.
- Passare tale `approvalKind` esplicito a `resolveApprovalOverGateway`. Questa operazione usa
  il servizio canonico `approval.resolve` e restituisce il vincitore registrato quando
  un'altra superficie risponde per prima. Il precedente input esplicito `resolveMethod`
  rimane disponibile per i controlli basati sui comandi; le nuove azioni native non devono usarlo né
  dedurre il tipo da un ID.
- Tipi di approvazione diversi possono esporre intenzionalmente superfici native
  diverse. Esempi integrati attuali: Matrix mantiene lo stesso instradamento nativo
  verso DM/canali e la stessa UX delle reazioni per le approvazioni exec e dei Plugin, consentendo comunque
  all'autenticazione di variare in base al tipo di approvazione; Slack mantiene disponibile l'instradamento nativo delle approvazioni
  sia per gli id exec sia per quelli dei Plugin.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come
  wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder delle funzionalità
  ed esporre `approvalCapability` nel Plugin.

### Sottopercorsi più specifici del runtime delle approvazioni

Per gli entrypoint di canale ad alta frequenza, preferire questi sottopercorsi più specifici al barrel più ampio
`approval-runtime` quando serve una sola parte di tale famiglia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Analogamente, preferire `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` rispetto a superfici omnicomprensive più ampie quando
non servono tutte.

### Sottopercorsi di configurazione

- `openclaw/plugin-sdk/setup-runtime` comprende gli helper di configurazione sicuri per il runtime:
  `createSetupTranslator`, gli adattatori per le patch di configurazione sicuri durante l'importazione
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), l'output delle note di ricerca,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  delegati dei proxy di configurazione.
- `openclaw/plugin-sdk/channel-setup` comprende i builder di configurazione
  per l'installazione facoltativa e alcune primitive sicure per la configurazione: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` e `splitSetupEntries`.
- Usare il punto di integrazione più ampio `openclaw/plugin-sdk/setup` solo quando servono anche
  gli helper condivisi più pesanti per configurazione/setup, come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Se il canale deve soltanto indicare "installare prima questo Plugin" nelle superfici
di configurazione, preferire `createOptionalChannelSetupSurface(...)`. L'adattatore/la procedura guidata
generati adottano un comportamento fail-closed durante le scritture della configurazione e la finalizzazione e riutilizzano
lo stesso messaggio di installazione obbligatoria nella convalida, nella finalizzazione e nel testo
del link alla documentazione.

Se il canale supporta configurazione o autenticazione basate su variabili d'ambiente e i flussi generici
di avvio/configurazione devono conoscere i nomi di tali variabili prima del caricamento del runtime, dichiararli nel
manifest del Plugin con `channelEnvVars`. Mantenere `envVars` del runtime del canale o le costanti
locali solo per il testo destinato agli operatori.

Se il canale può comparire in `status`, `channels list`, `channels status` o
nelle scansioni SecretRef prima dell'avvio del runtime del Plugin, aggiungere `openclaw.setupEntry` in
`package.json`. Tale entrypoint deve poter essere importato in sicurezza nei percorsi di comando
di sola lettura e deve restituire i metadati del canale, l'adattatore di configurazione
sicuro per il setup, l'adattatore di stato e i metadati delle destinazioni dei segreti del canale necessari per tali
riepiloghi. Non avviare client, listener o runtime di trasporto dall'entrypoint
di configurazione.

Mantenere specifico anche il percorso di importazione dell'entrypoint principale del canale. Il rilevamento può valutare
l'entrypoint e il modulo del Plugin del canale per registrare le funzionalità senza
attivare il canale. File come `channel-plugin-api.ts` devono esportare
l'oggetto Plugin del canale senza importare procedure guidate di configurazione, client
di trasporto, listener socket, launcher di sottoprocessi o moduli di avvio dei servizi.
Inserire tali componenti di runtime nei moduli caricati da `registerFull(...)`, nei setter
del runtime o negli adattatori lazy delle funzionalità.

### Altri sottopercorsi specifici dei canali

Per altri percorsi di canale ad alta frequenza, preferire gli helper specifici alle superfici
legacy più ampie:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione con più account e
  il ripiego sull'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` per il collegamento della route/busta in ingresso e
  della registrazione e distribuzione
- `openclaw/plugin-sdk/channel-targets` per gli helper di analisi delle destinazioni
- `openclaw/plugin-sdk/outbound-media` per il caricamento dei contenuti multimediali e
  `openclaw/plugin-sdk/channel-outbound` per i delegati di identità/invio in uscita
  e la pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve conservare
  un `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:`
  corrente dopo che la chiave della sessione di base continua a corrispondere. I Plugin dei provider possono
  sovrascrivere la precedenza, il comportamento dei suffissi e la normalizzazione dell'id del thread quando
  la relativa piattaforma dispone di semantiche native per la consegna nei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dell'associazione dei thread
  e la registrazione degli adattatori
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora necessario un layout legacy
  dei campi del payload di agente/contenuti multimediali
- `openclaw/plugin-sdk/telegram-command-config` (deprecato: nessun Plugin integrato
  lo usa in produzione) per la normalizzazione dei comandi personalizzati di Telegram,
  la convalida di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile in caso di ripiego; per il nuovo codice dei Plugin, preferire la gestione locale della configurazione dei comandi nel Plugin

I canali che gestiscono soltanto l'autenticazione possono solitamente limitarsi al percorso predefinito: il core gestisce
le approvazioni e il Plugin espone soltanto le funzionalità di uscita/autenticazione. I canali
di approvazione nativi come Matrix, Slack, Telegram e i trasporti di chat personalizzati
devono usare gli helper nativi condivisi anziché implementare autonomamente il ciclo di vita
delle approvazioni.

## Criteri per le menzioni in ingresso

Mantenere la gestione delle menzioni in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal Plugin
- valutazione condivisa dei criteri

Usare `openclaw/plugin-sdk/channel-mention-gating` per le decisioni relative ai criteri delle menzioni.
Usare `openclaw/plugin-sdk/channel-inbound` solo quando serve il barrel
più ampio degli helper in ingresso.

Adatto alla logica locale del Plugin:

- rilevamento delle risposte al bot
- rilevamento delle citazioni del bot
- verifiche della partecipazione al thread
- esclusioni dei messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato della menzione esplicita
- elenco consentito delle menzioni implicite
- esclusione per i comandi
- decisione finale di ignorare

Flusso consigliato:

1. Calcolare i fatti locali relativi alle menzioni.
2. Passare tali fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usare `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e
   `decision.shouldSkip` nel gate in ingresso.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` restituisce un valore booleano. `hasAnyMention`,
`isExplicitlyMentioned` e `canResolveExplicit` provengono dai metadati nativi
delle menzioni del canale (entità dei messaggi, indicatori di risposta al bot e simili);
fornire i valori `false`/`undefined` quando la piattaforma non è in grado di rilevarli.

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per
i Plugin dei canali integrati che dipendono già dall'iniezione del runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Se servono soltanto `implicitMentionKindWhen` e `resolveInboundMentionDecision`,
importarli da `openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare
helper del runtime in ingresso non correlati.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Creare i file standard del plugin. Il campo `channels` in
    `openclaw.plugin.json` (non un campo `kind`) è ciò che contrassegna un manifest come
    proprietario di un canale. Per l'intera superficie dei metadati del pacchetto, vedere
    [Configurazione e impostazione del plugin](/it/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Collega OpenClaw ad Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin del canale Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token del bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` convalida `plugins.entries.acme-chat.config`. Usarlo per
    le impostazioni di proprietà del plugin che non fanno parte della configurazione dell'account del canale.
    `channelConfigs.acme-chat.schema` convalida `channels.acme-chat` ed è la
    sorgente del percorso non frequente usata dallo schema di configurazione, dalla configurazione iniziale e dalle superfici dell'interfaccia utente prima del
    caricamento del runtime del plugin. Per il riferimento completo dei campi
    di primo livello, vedere [Manifest del plugin](/it/plugins/manifest).

  </Step>

  <Step title="Creare l'oggetto del plugin del canale">
    L'interfaccia `ChannelPlugin` dispone di molte superfici adattatore facoltative. Iniziare con
    il minimo indispensabile, ovvero `id`, `config` e `setup`, e aggiungere gli adattatori quando
    necessario.

    Creare `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // client API della piattaforma

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: il token è obbligatorio");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // La risoluzione/ispezione dell'account appartiene a `config`, non a `setup`.
        // `setup` riguarda le scritture di onboarding (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Sicurezza dei DM: chi può inviare messaggi al bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Associazione: flusso di approvazione per i nuovi contatti DM
      pairing: {
        text: {
          idLabel: "Nome utente Acme Chat",
          message: "Inviare questo codice per verificare la propria identità:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Codice di associazione: ${code}`);
          },
        },
      },

      // Thread: modalità di consegna delle risposte
      threading: { topLevelReplyToMode: "reply" },

      // In uscita: invio di messaggi alla piattaforma
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Per i canali che accettano sia le chiavi DM canoniche di primo livello sia quelle nidificate legacy, usare gli helper di `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali dell'account prioritari rispetto ai valori ereditati dalla radice. Abbinare lo stesso risolutore alla riparazione di doctor tramite `normalizeLegacyDmAliases`, affinché il runtime e la migrazione leggano lo stesso contratto.

    <Accordion title="Cosa fa createChatChannelPlugin">
      Invece di implementare manualmente le interfacce adattatore di basso livello, si passano
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Risolutore della sicurezza dei DM con ambito definito dai campi di configurazione |
      | `pairing.text` | Flusso di associazione DM basato su testo con scambio di codice |
      | `threading` | Risolutore della modalità di risposta (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID dei messaggi); richiede un ID `channel` adiacente affinché il core possa contrassegnare il risultato di consegna restituito |

      Se occorre un controllo completo, è anche possibile passare oggetti adattatore non elaborati
      invece delle opzioni dichiarative.

      Gli adattatori non elaborati in uscita possono definire una funzione `chunker(text, limit, ctx)`.
      L'elemento facoltativo `ctx.formatting` contiene decisioni di formattazione al momento della consegna,
      come `maxLinesPerMessage`; applicarlo prima dell'invio, affinché il threading delle risposte
      e i limiti dei segmenti siano risolti una sola volta dalla consegna in uscita condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando è stata risolta una destinazione di risposta nativa, affinché gli helper del payload possano preservare
      i tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
    </Accordion>

  </Step>

  <Step title="Collegare il punto di ingresso">
    Creare `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin del canale Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestione di Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestione di Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Inserire i descrittori CLI di proprietà del canale in `registerCliMetadata(...)`, affinché OpenClaw
    possa mostrarli nella guida principale senza attivare l'intero runtime del canale,
    mentre i normali caricamenti completi acquisiscono comunque gli stessi descrittori per la registrazione
    effettiva dei comandi. Riservare `registerFull(...)` alle sole operazioni di runtime.
    `defineChannelPluginEntry` gestisce automaticamente la separazione delle modalità di registrazione.
    Se `registerFull(...)` registra metodi RPC del Gateway, usare un
    prefisso specifico del plugin. Gli spazi dei nomi amministrativi del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) rimangono riservati e vengono sempre
    risolti in `operator.admin`. Per tutte le
    opzioni, vedere [Punti di ingresso](/it/plugins/sdk-entrypoints#definechannelpluginentry).

  </Step>

  <Step title="Aggiungere un punto di ingresso per la configurazione">
    Creare `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo elemento invece del punto di ingresso completo quando il canale è disabilitato
    o non configurato. In questo modo si evita di caricare codice di runtime pesante durante i flussi di configurazione.
    Per i dettagli, vedere [Configurazione e impostazione](/it/plugins/sdk-setup#setup-entry).

    I canali inclusi nell'area di lavoro che separano le esportazioni sicure per la configurazione in moduli
    ausiliari possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando necessitano anche di un
    setter di runtime esplicito per la fase di configurazione.

  </Step>

  <Step title="Gestire i messaggi in entrata">
    Il plugin deve ricevere i messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il modello tipico è un Webhook che verifica la richiesta e
    la distribuisce tramite il gestore in entrata del canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticazione gestita dal plugin (verificare autonomamente le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il gestore in entrata distribuisce il messaggio a OpenClaw.
          // Il collegamento esatto dipende dall'SDK della piattaforma:
          // vedere un esempio reale nel pacchetto del plugin incluso di Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in entrata è specifica del canale. Ogni plugin del canale gestisce
      la propria pipeline in entrata. Consultare i plugin dei canali inclusi
      (ad esempio il pacchetto del plugin Microsoft Teams o Google Chat) per esempi reali.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Scrivere test collocati insieme al codice in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Per gli helper di test condivisi, consultare [Test](/it/plugins/sdk-testing).

</Step>
</Steps>

## Struttura dei file

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadati openclaw.channel
├── openclaw.plugin.json      # Manifest con schema di configurazione
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Esportazioni pubbliche (facoltativo)
├── runtime-api.ts            # Esportazioni runtime interne (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Archivio runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fissa, con ambito account o personalizzata
  </Card>
  <Card title="Integrazione dello strumento per i messaggi" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e rilevamento delle azioni
  </Card>
  <Card title="Risoluzione della destinazione" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, contenuti multimediali, subagente tramite api.runtime
  </Card>
  <Card title="API in ingresso del canale" icon="bolt" href="/it/plugins/sdk-channel-inbound">
    Ciclo di vita condiviso degli eventi in ingresso: acquisizione, risoluzione, registrazione, invio, finalizzazione
  </Card>
</CardGroup>

<Note>
Esistono ancora alcuni punti di integrazione helper inclusi per la manutenzione e
la compatibilità dei Plugin inclusi. Non costituiscono il modello consigliato per i nuovi Plugin di canale;
è preferibile usare i sottopercorsi generici per canale, configurazione, risposta e runtime della superficie
SDK comune, salvo quando si gestisce direttamente quella famiglia di Plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) - se il Plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo delle importazioni dei sottopercorsi
- [Test dell'SDK](/it/plugins/sdk-testing) - utilità di test e test dei contratti
- [Manifest del Plugin](/it/plugins/manifest) - schema completo del manifest

## Contenuti correlati

- [Configurazione dell'SDK per Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin dell'infrastruttura dell'agente](/it/plugins/sdk-agent-harness)
