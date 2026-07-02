---
read_when:
    - Stai creando un nuovo plugin per canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida dettagliata alla creazione di un Plugin di canale di messaggistica per OpenClaw
title: Creare Plugin di canale
x-i18n:
    generated_at: "2026-07-02T22:36:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida illustra come creare un Plugin di canale che connette OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza per DM,
associazione, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato un Plugin OpenClaw prima, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno di propri strumenti di invio/modifica/reazione. OpenClaw mantiene uno
strumento `message` condiviso nel core. Il tuo Plugin gestisce:

- **Configurazione** - risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** - policy DM e allowlist
- **Associazione** - flusso di approvazione DM
- **Grammatica della sessione** - come gli id di conversazione specifici del provider si mappano a chat di base, id di thread e fallback padre
- **In uscita** - invio di testo, contenuti multimediali e sondaggi alla piattaforma
- **Threading** - come vengono organizzate in thread le risposte
- **Digitazione Heartbeat** - segnali opzionali di digitazione/occupato per i target di consegna Heartbeat

Il core gestisce lo strumento di messaggistica condiviso, il collegamento al prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

I nuovi Plugin di canale dovrebbero anche esporre un adapter `message` con
`defineChannelMessageAdapter` da `openclaw/plugin-sdk/channel-outbound`. L'
adapter dichiara quali capacità durevoli di invio finale sono effettivamente supportate dal trasporto nativo
e indirizza gli invii di testo/media alle stesse funzioni di trasporto dell'
adapter `outbound` legacy. Dichiara una capacità solo quando un test di contratto
prova l'effetto collaterale nativo e la ricevuta restituita.
Per il contratto API completo, esempi, matrice delle capacità, regole sulle ricevute, finalizzazione dell'anteprima live,
policy di ack in ricezione, test e tabella di migrazione, vedi
[API di outbound dei canali](/it/plugins/sdk-channel-outbound).
Se l'adapter `outbound` esistente ha già i metodi di invio corretti e
metadati di capacità, usa `createChannelMessageAdapterFromOutbound(...)` per
derivare l'adapter `message` invece di scrivere manualmente un altro bridge.
Gli invii dell'adapter dovrebbero restituire valori `MessageReceipt`. Quando il codice di compatibilità
ha ancora bisogno di id legacy, derivali con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` invece di mantenere campi
`messageIds` paralleli nel nuovo codice del ciclo di vita.
I canali con supporto alle anteprime dovrebbero anche dichiarare `message.live.capabilities` con
l'esatto ciclo di vita live che possiedono, come `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. I canali che finalizzano un'anteprima bozza in loco dovrebbero
dichiarare anche `message.live.finalizer.capabilities`, come `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e instradare la logica runtime tramite
`defineFinalizableLivePreviewAdapter(...)` più
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantieni queste capacità supportate
da test `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` in modo che anteprima nativa,
avanzamento, modifica, fallback/conservazione, cleanup e comportamento delle ricevute non possano divergere
silenziosamente.
I receiver inbound che rinviano gli acknowledge della piattaforma dovrebbero dichiarare
`message.receive.defaultAckPolicy` e `supportedAckPolicies` invece di nascondere
il timing degli ack nello stato locale del monitor. Copri ogni policy dichiarata con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Gli helper legacy per le risposte come `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`
rimangono disponibili per i dispatcher di compatibilità. Non usare questi nomi per il nuovo
codice di canale; i nuovi Plugin dovrebbero iniziare con l'adapter `message`, le ricevute e
gli helper del ciclo di vita di ricezione/invio in `openclaw/plugin-sdk/channel-outbound`.

I canali che migrano l'autorizzazione inbound possono usare il sottopercorso sperimentale
`openclaw/plugin-sdk/channel-ingress-runtime` dai percorsi di ricezione runtime.
Il sottopercorso mantiene nel Plugin la ricerca della piattaforma e gli effetti collaterali, condividendo
al contempo la risoluzione dello stato delle allowlist, le decisioni di route/sender/command/event/activation,
la diagnostica redatta e la mappatura di ammissione dei turni. Mantieni la
normalizzazione dell'identità del Plugin nel descriptor che passi al resolver; non
serializzare i valori grezzi di match dallo stato o dalla decisione risolti. Vedi
[API di ingresso dei canali](/it/plugins/sdk-channel-ingress) per il design dell'API,
il confine di ownership e le aspettative sui test.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte inbound, esponi
`heartbeat.sendTyping(...)` sul Plugin di canale. Il core lo chiama con il
target di consegna Heartbeat risolto prima dell'avvio dell'esecuzione del modello Heartbeat e
usa il ciclo di vita condiviso di keepalive/cleanup della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale esplicito di stop.

Se il tuo canale aggiunge parametri dello strumento di messaggistica che trasportano sorgenti multimediali, esponi questi
nomi di parametri tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e la policy di accesso ai media in uscita,
quindi i Plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider
relativi ad avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così le azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto funziona comunque per i parametri che
sono intenzionalmente condivisi tra tutte le azioni esposte.
I canali che devono esporre un URL pubblico temporaneo per un recupero media lato piattaforma
possono usare `createHostedOutboundMediaStore(...)` da
`openclaw/plugin-sdk/outbound-media` con gli store di stato del Plugin. Mantieni
nel Plugin di canale il parsing delle route di piattaforma e l'applicazione dei token; l'helper condiviso
gestisce solo caricamento dei media, metadati di scadenza, righe dei chunk e cleanup.

Se il tuo canale ha bisogno di shaping specifico del provider per `message(action="send")`,
preferisci `actions.prepareSendPayload(...)`. Inserisci card native, blocchi, embed o
altri dati durevoli sotto `payload.channelData.<channel>` e lascia che il core esegua
l'invio effettivo tramite l'adapter outbound/message. Usa
`actions.handleAction(...)` per l'invio solo come fallback di compatibilità per
payload che non possono essere serializzati e ritentati.

Se la tua piattaforma archivia scope aggiuntivo dentro gli id di conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'id della conversazione di base, all'id di thread opzionale,
a `baseConversationId` esplicito e a qualsiasi `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
padre più ristretto alla conversazione più ampia/di base.

Usa `openclaw/plugin-sdk/channel-route` quando il codice del Plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la sua route padre o costruire una
chiave di deduplicazione stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli id di thread numerici nello stesso modo del core, quindi i Plugin dovrebbero preferirlo
a confronti ad hoc `String(threadId)`.
I Plugin con grammatica target specifica del provider dovrebbero esporre
`messaging.resolveOutboundSessionRoute(...)` così il core ottiene identità di sessione
e thread native del provider senza usare shim di parsing.

I Plugin in bundle che hanno bisogno dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file di primo livello `session-key-api.ts` con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro dei Plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` rimane disponibile come
fallback di compatibilità legacy quando un Plugin ha bisogno solo di fallback padre sopra
l'id generico/grezzo. Se entrambi gli hook esistono, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità dei canali

La maggior parte dei Plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Core possiede `/approve` nella stessa chat, i payload dei pulsanti di approvazione condivisi e il recapito di fallback generico.
- Preferisci un unico oggetto `approvalCapability` sul plugin del canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` viene rimosso. Inserisci i fatti di recapito/native/render/auth delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo login/logout; core non legge più gli hook di auth delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il seam canonico per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth delle approvazioni nella stessa chat. Mantieni disponibili gli approvatori configurati per `/approve` anche quando il recapito nativo è disabilitato; usa invece lo stato della superficie di avvio nativa per la guida a recapito/configurazione.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth delle approvazioni nella stessa chat. Core usa quell'hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta approvazioni exec native e includere il canale nella guida di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita dei payload specifici del canale, come nascondere prompt di approvazione locali duplicati o inviare indicatori di digitazione prima del recapito.
- Usa `approvalCapability.delivery` solo per l'instradamento delle approvazioni native o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti delle approvazioni native posseduti dal canale. Mantienilo lazy sugli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il modulo runtime su richiesta pur consentendo a core di assemblare il ciclo di vita delle approvazioni.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte opzioni di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero renderizzare percorsi con ambito sull'account come `channels.<channel>.accounts.<id>.execApprovals.*` invece di default di primo livello.
- Usa `approvalCapability.describePluginApprovalSetup` quando la guida per gli errori di approvazione Plugin è sicura da mostrare per gli errori di assenza di route e timeout delle approvazioni Plugin. `createApproverRestrictedNativeApprovalCapability(...)` non lo deduce da `describeExecApprovalSetup`; passa esplicitamente lo stesso helper solo quando le approvazioni Plugin ed exec usano davvero la stessa configurazione nativa.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se l'auth personalizzata delle approvazioni consente intenzionalmente solo il fallback nella stessa chat, restituisci `markImplicitSameChatApprovalAuthorization({ authorized: true })` da `openclaw/plugin-sdk/approval-auth-runtime`; altrimenti core tratta il risultato come autorizzazione esplicita dell'approvatore.
- Se una callback nativa posseduta dal canale risolve direttamente le approvazioni, usa `isImplicitSameChatApprovalAuthorization(...)` prima di risolvere, così il fallback implicito passa comunque attraverso la normale autorizzazione attore del canale.
- Se un canale richiede il recapito di approvazioni native, mantieni il codice del canale concentrato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così core può assemblare l'handler e possedere filtro delle richieste, instradamento, deduplicazione, scadenza, sottoscrizione Gateway e avvisi di recapito altrove. `nativeRuntime` è suddiviso in alcuni seam più piccoli:
- Usa `createNativeApprovalChannelRouteGates` da `openclaw/plugin-sdk/approval-native-runtime` quando un canale supporta sia il recapito nativo dall'origine di sessione sia target espliciti di inoltro delle approvazioni. L'helper centralizza selezione della configurazione delle approvazioni, gestione di `mode`, filtri agente/sessione, binding dell'account, corrispondenza del target di sessione e corrispondenza dell'elenco target, mentre i chiamanti possiedono ancora id del canale, modalità di inoltro predefinita, lookup dell'account, controllo di trasporto abilitato, normalizzazione del target e risoluzione del target della sorgente del turno. Non usarlo per creare default di policy del canale posseduti da core; passa esplicitamente la modalità predefinita documentata del canale.
- `createChannelNativeOriginTargetResolver` usa per impostazione predefinita il matcher condiviso delle route di canale per target `{ to, accountId, threadId }`. Passa `targetsMatch` solo quando un canale ha regole di equivalenza specifiche del provider, come la corrispondenza del prefisso timestamp di Slack.
- Passa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` quando il canale deve canonizzare gli id del provider prima che venga eseguito il matcher di route predefinito o una callback `targetsMatch` personalizzata, preservando però il target originale per il recapito. Usa `normalizeTarget` solo quando il target di recapito risolto deve essere esso stesso canonizzato.
- `availability` - se l'account è configurato e se una richiesta deve essere gestita
- `presentation` - mappa il view model di approvazione condiviso in payload nativi pending/resolved/expired o azioni finali
- `transport` - prepara i target e invia/aggiorna/elimina messaggi di approvazione nativi
- `interactions` - hook opzionali bind/unbind/clear-action per pulsanti o reazioni native, più un hook opzionale `cancelDelivered`. Implementa `cancelDelivered` quando `deliverPending` registra stato in-process o persistente (come uno store di target di reazione), così quello stato può essere rilasciato se l'arresto di un handler annulla il recapito prima che `bindPending` venga eseguito o quando `bindPending` non restituisce alcun handle
- `observe` - hook opzionali di diagnostica del recapito
- Se il canale richiede oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime consente a core di avviare handler guidati dalle capability dallo stato di avvio del canale senza aggiungere colla wrapper specifica per le approvazioni.
- Usa il livello più basso `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo quando il seam guidato dalle capability non è ancora sufficientemente espressivo.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` tramite quegli helper. `accountId` mantiene la policy di approvazione multi-account nell'ambito dell'account bot corretto, e `approvalKind` mantiene disponibile al canale il comportamento delle approvazioni exec rispetto a quelle Plugin senza branch hardcoded in core.
- Core ora possiede anche gli avvisi di reinstradamento delle approvazioni. I plugin di canale non dovrebbero inviare i propri messaggi di follow-up "approvazione inviata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un instradamento accurato origine + DM dell'approvatore tramite gli helper condivisi di capability di approvazione e lascia che core aggreghi i recapiti effettivi prima di pubblicare qualsiasi avviso nella chat di avvio.
- Preserva end-to-end il tipo di id dell'approvazione recapitata. I client nativi non dovrebbero
  indovinare o riscrivere l'instradamento delle approvazioni exec rispetto a quelle Plugin dallo stato locale del canale.
- Tipi di approvazione diversi possono esporre intenzionalmente superfici native diverse.
  Esempi bundled correnti:
  - Slack mantiene disponibile l'instradamento nativo delle approvazioni sia per id exec sia Plugin.
  - Matrix mantiene lo stesso instradamento nativo DM/canale e la stessa UX di reazione per approvazioni exec
    e Plugin, consentendo comunque all'auth di differire per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` sul plugin.

Per gli entrypoint caldi del canale, preferisci i sottopercorsi runtime più ristretti quando hai bisogno
solo di una parte di quella famiglia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Allo stesso modo, preferisci `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie ombrello
più ampia.

Per setup in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  `createSetupTranslator`, adattatori patch di setup import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder delegati
  setup-proxy
- `openclaw/plugin-sdk/setup-runtime` include il seam dell'adapter env-aware per
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup optional-install
  più alcune primitive sicure per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati da env e i flussi generici di avvio/configurazione
devono conoscere quei nomi env prima che il runtime venga caricato, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni gli `envVars` del runtime del canale o le costanti locali
solo per il testo rivolto agli operatori.

Se il tuo canale può apparire in `status`, `channels list`, `channels status` o
nelle scansioni SecretRef prima che il runtime del plugin venga avviato, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint dovrebbe essere sicuro da importare nei percorsi dei comandi
sola lettura e dovrebbe restituire i metadati del canale, l'adapter di configurazione sicuro per il setup, l'adapter di stato
e i metadati dei target secret del canale necessari per quei riepiloghi. Non
avviare client, listener o runtime di trasporto dall'entry di setup.

Mantieni stretto anche il percorso di import dell'entry principale del canale. Discovery può valutare
l'entry e il modulo del plugin di canale per registrare capability senza attivare
il canale. File come `channel-plugin-api.ts` dovrebbero esportare l'oggetto plugin del canale
senza importare wizard di setup, client di trasporto, listener socket,
launcher di subprocess o moduli di avvio del servizio. Metti quei pezzi runtime
in moduli caricati da `registerFull(...)`, setter runtime o adapter di capability
lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa il seam più ampio `openclaw/plugin-sdk/setup` solo quando hai bisogno anche degli
  helper condivisi di setup/config più pesanti come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle superfici
di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/wizard generato
fallisce chiuso sulle scritture di configurazione e sulla finalizzazione, e riusa
lo stesso messaggio install-required tra validazione, finalizzazione e testo del link
alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle superfici legacy
più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e il
  fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` per il route/envelope in ingresso e il
  cablaggio record-and-dispatch
- `openclaw/plugin-sdk/channel-targets` per gli helper di parsing dei target
- `openclaw/plugin-sdk/outbound-media` per il caricamento dei media e
  `openclaw/plugin-sdk/channel-outbound` per i delegati di identità/invio in uscita
  e la pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:` corrente
  dopo che la chiave di sessione di base corrisponde ancora. I Plugin provider possono sovrascrivere
  la precedenza, il comportamento dei suffissi e la normalizzazione dell'ID thread quando la loro piattaforma
  ha semantiche native di consegna dei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita del binding dei thread
  e la registrazione degli adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy
  dei campi payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati
  Telegram, la validazione di duplicati/conflitti e un contratto di configurazione comandi
  stabile rispetto ai fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone solo le capability in uscita/auth. I canali di approvazione nativi come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare un proprio ciclo di vita delle approvazioni.

## Policy sulle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta delle evidenze di proprietà del Plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sulla policy delle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando hai bisogno del barrel helper in ingresso
più ampio.

Adatto alla logica locale del Plugin:

- rilevamento delle risposte al bot
- rilevamento del bot citato
- controlli di partecipazione al thread
- esclusioni dei messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist delle menzioni implicite
- bypass dei comandi
- decisione finale di skip

Flusso consigliato:

1. Calcola i fatti locali sulle menzioni.
2. Passa quei fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate in ingresso.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per i
Plugin canale inclusi che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
in ingresso non correlati.

Usa `resolveInboundMentionDecision({ facts, policy })` per il gating delle menzioni.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è
    ciò che lo rende un Plugin canale. Per l'intera superficie dei metadati del package,
    consulta [Configurazione e setup dei Plugin](/it/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Usalo per
    impostazioni di proprietà del Plugin che non sono la configurazione dell'account del canale. `channelConfigs`
    valida `channels.acme-chat` ed è la sorgente del cold path usata dallo schema di configurazione,
    dal setup e dalle superfici UI prima che il runtime del Plugin venga caricato.

  </Step>

  <Step title="Costruisci l'oggetto Plugin canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter opzionali. Inizia con
    il minimo - `id` e `setup` - e aggiungi adapter quando ti servono.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Per i canali che accettano sia chiavi DM canoniche di primo livello sia chiavi annidate legacy, usa gli helper da `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali dell'account prima dei valori root ereditati. Abbina lo stesso resolver alla riparazione doctor tramite `normalizeLegacyDmAliases` così runtime e migrazione leggono lo stesso contratto.

    <Accordion title="Cosa fa createChatChannelPlugin per te">
      Invece di implementare manualmente interfacce adapter di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con scope dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fisso, con scope account o personalizzato) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adapter raw invece delle opzioni dichiarative
      se hai bisogno di pieno controllo.

      Gli adapter in uscita raw possono definire una funzione `chunker(text, limit, ctx)`.
      Il valore opzionale `ctx.formatting` porta decisioni di formattazione al momento della consegna
      come `maxLinesPerMessage`; applicalo prima dell'invio così il threading delle risposte
      e i confini dei chunk vengono risolti una sola volta dalla consegna in uscita condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando è stato risolto un target di risposta nativo, così gli helper payload possono preservare
      tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
    </Accordion>

  </Step>

  <Step title="Collega l'entry point">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Inserisci i descrittori CLI di proprietà del canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'aiuto root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi raccolgono comunque gli stessi descrittori per la registrazione
    effettiva dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un
    prefisso specifico del plugin. I namespace amministrativi core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
    in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione della modalità di registrazione. Consulta
    [Punti di ingresso](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte
    le opzioni.

  </Step>

  <Step title="Aggiungi una voce di configurazione">
    Crea `setup-entry.ts` per il caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece della voce completa quando il canale è disabilitato
    o non configurato. Evita di importare codice runtime pesante durante i flussi di configurazione.
    Consulta [Configurazione e config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace in bundle che separano le esportazioni sicure per la configurazione in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito al momento della configurazione.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la invia tramite il gestore in ingresso del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni plugin di canale possiede
      la propria pipeline in ingresso. Guarda i plugin di canale in bundle
      (per esempio il pacchetto plugin Microsoft Teams o Google Chat) per pattern reali.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Scrivi test colocati in `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Per gli helper di test condivisi, consulta [Test](/it/plugins/sdk-testing).

</Step>
</Steps>

## Struttura dei file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento messaggi" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e individuazione delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
  <Card title="API in ingresso del canale" icon="bolt" href="/it/plugins/sdk-channel-inbound">
    Ciclo di vita condiviso degli eventi in ingresso: acquisizione, risoluzione, registrazione, dispatch, finalizzazione
  </Card>
</CardGroup>

<Note>
Alcuni punti di estensione helper in bundle esistono ancora per la manutenzione e
la compatibilità dei plugin in bundle. Non sono il pattern consigliato per i nuovi plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di plugin in bundle.
</Note>

## Passaggi successivi

- [Plugin Provider](/it/plugins/sdk-provider-plugins) - se il tuo plugin fornisce anche modelli
- [Panoramica SDK](/it/plugins/sdk-overview) - riferimento completo alle importazioni dei sottopercorsi
- [Test SDK](/it/plugins/sdk-testing) - utilità di test e test di contratto
- [Manifest Plugin](/it/plugins/manifest) - schema completo del manifest

## Correlati

- [Configurazione SDK del Plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Plugin agent harness](/it/plugins/sdk-agent-harness)
