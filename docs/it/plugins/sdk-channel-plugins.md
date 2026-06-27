---
read_when:
    - Stai creando un nuovo plugin per canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida dettagliata alla creazione di un plugin di canale di messaggistica per OpenClaw
title: Costruire Plugin di canale
x-i18n:
    generated_at: "2026-06-27T18:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida illustra come creare un Plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
associazione, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato un Plugin OpenClaw, leggi prima
  [Guida introduttiva](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno di strumenti propri per inviare/modificare/reagire. OpenClaw mantiene uno
strumento `message` condiviso nel core. Il tuo Plugin gestisce:

- **Configurazione** - risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** - policy DM e allowlist
- **Associazione** - flusso di approvazione DM
- **Grammatica di sessione** - come gli id conversazione specifici del provider vengono mappati a chat di base, id thread e fallback padre
- **In uscita** - invio di testo, media e sondaggi alla piattaforma
- **Threading** - come vengono organizzate le risposte in thread
- **Digitazione Heartbeat** - segnali opzionali di digitazione/occupato per i target di consegna Heartbeat

Il core gestisce lo strumento di messaggio condiviso, il cablaggio dei prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

I nuovi Plugin di canale dovrebbero anche esporre un adapter `message` con
`defineChannelMessageAdapter` da `openclaw/plugin-sdk/channel-outbound`. L'adapter
dichiara quali capacità durevoli di invio finale il trasporto nativo
supporta effettivamente e indirizza gli invii di testo/media alle stesse funzioni di trasporto
dell'adapter `outbound` legacy. Dichiara una capacità solo quando un test di contratto
dimostra l'effetto collaterale nativo e la ricevuta restituita.
Per il contratto API completo, esempi, matrice delle capacità, regole delle ricevute, finalizzazione dell'anteprima live,
policy di ack in ricezione, test e tabella di migrazione, vedi
[API in uscita del canale](/it/plugins/sdk-channel-outbound).
Se l'adapter `outbound` esistente ha già i metodi di invio e i metadati delle capacità corretti,
usa `createChannelMessageAdapterFromOutbound(...)` per
derivare l'adapter `message` invece di scrivere manualmente un altro bridge.
Gli invii dell'adapter dovrebbero restituire valori `MessageReceipt`. Quando il codice di compatibilità
ha ancora bisogno di id legacy, derivali con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` invece di mantenere campi
`messageIds` paralleli nel nuovo codice del ciclo di vita.
I canali con supporto alle anteprime dovrebbero anche dichiarare `message.live.capabilities` con
l'esatto ciclo di vita live che gestiscono, come `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. I canali che finalizzano un'anteprima bozza sul posto dovrebbero
anche dichiarare `message.live.finalizer.capabilities`, come `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e instradare la logica di runtime tramite
`defineFinalizableLivePreviewAdapter(...)` più
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantieni queste capacità supportate
da test `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` così il comportamento nativo di anteprima,
avanzamento, modifica, fallback/conservazione, pulizia e ricevuta non può divergere
silenziosamente.
I receiver in ingresso che rinviano gli acknowledgement della piattaforma dovrebbero dichiarare
`message.receive.defaultAckPolicy` e `supportedAckPolicies` invece di nascondere
la temporizzazione degli ack nello stato locale del monitor. Copri ogni policy dichiarata con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Gli helper legacy per le risposte, come `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
restano disponibili per i dispatcher di compatibilità. Non usare questi nomi per il nuovo
codice di canale; i nuovi Plugin dovrebbero partire dall'adapter `message`, dalle ricevute e
dagli helper del ciclo di vita di ricezione/invio in `openclaw/plugin-sdk/channel-outbound`.

I canali che migrano l'autorizzazione in ingresso possono usare il sottopercorso sperimentale
`openclaw/plugin-sdk/channel-ingress-runtime` dai percorsi di ricezione runtime.
Il sottopercorso mantiene la ricerca della piattaforma e gli effetti collaterali nel Plugin, mentre
condivide risoluzione dello stato allowlist, decisioni di route/mittente/comando/evento/attivazione,
diagnostica redatta e mappatura dell'ammissione del turno. Mantieni la normalizzazione
dell'identità del Plugin nel descrittore che passi al resolver; non
serializzare valori di corrispondenza grezzi dallo stato o dalla decisione risolti. Vedi
[API di ingresso del canale](/it/plugins/sdk-channel-ingress) per il design dell'API,
il confine di ownership e le aspettative sui test.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` sul Plugin di canale. Il core lo chiama con il
target di consegna Heartbeat risolto prima dell'avvio del run del modello Heartbeat e
usa il ciclo di vita condiviso di keepalive/pulizia della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale esplicito di arresto.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti media, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e la policy di accesso ai media in uscita,
quindi i Plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider
di avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione, come
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, così le azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto funziona ancora per parametri che
sono intenzionalmente condivisi tra ogni azione esposta.
I canali che devono esporre un URL pubblico temporaneo per un recupero media lato piattaforma
possono usare `createHostedOutboundMediaStore(...)` da
`openclaw/plugin-sdk/outbound-media` con gli store di stato del Plugin. Mantieni il parsing delle route
della piattaforma e l'applicazione dei token nel Plugin di canale; l'helper condiviso
gestisce solo caricamento dei media, metadati di scadenza, righe dei chunk e pulizia.

Se il tuo canale ha bisogno di modellazione specifica del provider per `message(action="send")`,
preferisci `actions.prepareSendPayload(...)`. Metti card native, blocchi, embed o
altri dati durevoli sotto `payload.channelData.<channel>` e lascia che il core esegua
l'invio effettivo tramite l'adapter outbound/message. Usa
`actions.handleAction(...)` per l'invio solo come fallback di compatibilità per
payload che non possono essere serializzati e riprovati.

Se la tua piattaforma memorizza ambito extra dentro gli id conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'id conversazione di base, all'id thread opzionale,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
padre più ristretto alla conversazione più ampia/di base.

Usa `openclaw/plugin-sdk/channel-route` quando il codice del Plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la sua route padre o costruire una
chiave di deduplicazione stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli id thread numerici nello stesso modo del core, quindi i Plugin dovrebbero preferirlo
a confronti ad hoc `String(threadId)`.
I Plugin con grammatica target specifica del provider dovrebbero esporre
`messaging.resolveOutboundSessionRoute(...)` così il core ottiene identità di sessione
e thread native del provider senza usare shim di parser.

I Plugin inclusi che hanno bisogno dello stesso parsing prima dell'avvio del registro canali
possono anche esporre un file di primo livello `session-key-api.ts` con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro Plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come
fallback di compatibilità legacy quando a un Plugin servono solo fallback padre sopra
l'id generico/grezzo. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e fa fallback a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico li omette.

## Approvazioni e capacità del canale

La maggior parte dei Plugin di canale non richiede codice specifico per le approvazioni.

- Core possiede `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e il recapito generico di ripiego.
- Preferisci un unico oggetto `approvalCapability` sul plugin di canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è rimosso. Inserisci i fatti di recapito/nativi/rendering/auth delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo login/logout; core non legge più hook di auth delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il punto di integrazione canonico per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth delle approvazioni nella stessa chat. Core usa quell'hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta le approvazioni exec native e includere il canale nella guida di ripiego del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per il comportamento del ciclo di vita del payload specifico del canale, come nascondere prompt locali duplicati di approvazione o inviare indicatori di digitazione prima del recapito.
- Usa `approvalCapability.delivery` solo per il routing delle approvazioni native o la soppressione del ripiego.
- Usa `approvalCapability.nativeRuntime` per i fatti di approvazione nativa posseduti dal canale. Mantienilo lazy sugli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime su richiesta pur consentendo ancora a core di assemblare il ciclo di vita delle approvazioni.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le opzioni di configurazione esatte necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account denominati dovrebbero renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei valori predefiniti di primo livello.
- Se un canale può inferire identità DM stabili simili a proprietari dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se l'auth di approvazione personalizzata consente intenzionalmente solo il ripiego nella stessa chat, restituisci `markImplicitSameChatApprovalAuthorization({ authorized: true })` da `openclaw/plugin-sdk/approval-auth-runtime`; altrimenti core tratta il risultato come autorizzazione esplicita dell'approvatore.
- Se una callback nativa posseduta dal canale risolve direttamente le approvazioni, usa `isImplicitSameChatApprovalAuthorization(...)` prima di risolvere, così il ripiego implicito passa comunque attraverso la normale autorizzazione dell'attore del canale.
- Se un canale richiede il recapito di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così core può assemblare l'handler e possedere filtro delle richieste, routing, deduplica, scadenza, sottoscrizione Gateway e avvisi di routing altrove. `nativeRuntime` è suddiviso in alcuni punti di integrazione più piccoli:
- Usa `createNativeApprovalChannelRouteGates` da `openclaw/plugin-sdk/approval-native-runtime` quando un canale supporta sia il recapito nativo dall'origine della sessione sia target espliciti di inoltro delle approvazioni. L'helper centralizza selezione della configurazione di approvazione, gestione di `mode`, filtri agente/sessione, binding dell'account, corrispondenza del target della sessione e corrispondenza della lista target, mentre i chiamanti possiedono ancora l'id canale, la modalità di inoltro predefinita, la ricerca account, il controllo di trasporto abilitato, la normalizzazione del target e la risoluzione del target della sorgente del turn. Non usarlo per creare default di policy del canale posseduti da core; passa esplicitamente la modalità predefinita documentata del canale.
- `createChannelNativeOriginTargetResolver` usa per impostazione predefinita il matcher condiviso delle route di canale per target `{ to, accountId, threadId }`. Passa `targetsMatch` solo quando un canale ha regole di equivalenza specifiche del provider, come la corrispondenza del prefisso timestamp di Slack.
- Passa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` quando il canale deve canonicalizzare gli id del provider prima che venga eseguito il matcher di route predefinito o una callback `targetsMatch` personalizzata, preservando al tempo stesso il target originale per il recapito. Usa `normalizeTarget` solo quando il target di recapito risolto stesso deve essere canonicalizzato.
- `availability` - se l'account è configurato e se una richiesta deve essere gestita
- `presentation` - mappa il modello di vista condiviso dell'approvazione in payload nativi pendenti/risolti/scaduti o azioni finali
- `transport` - prepara i target e invia/aggiorna/elimina messaggi nativi di approvazione
- `interactions` - hook opzionali bind/unbind/clear-action per pulsanti o reazioni native, più un hook opzionale `cancelDelivered`. Implementa `cancelDelivered` quando `deliverPending` registra stato in-process o persistente (come uno store di target di reazione), così quello stato può essere rilasciato se l'arresto di un handler annulla il recapito prima che `bindPending` venga eseguito o quando `bindPending` non restituisce alcun handle
- `observe` - hook opzionali di diagnostica del recapito
- Se il canale richiede oggetti posseduti dal runtime come un client, un token, un'app Bolt o un ricevitore webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime consente a core di avviare handler guidati dalle capability dallo stato di avvio del canale senza aggiungere colla wrapper specifica per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello inferiore solo quando il punto di integrazione guidato dalle capability non è ancora abbastanza espressivo.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` tramite quegli helper. `accountId` mantiene la policy di approvazione multi-account con ambito sull'account bot corretto, e `approvalKind` mantiene disponibile per il canale il comportamento di approvazione exec rispetto a plugin senza branch hardcoded in core.
- Ora core possiede anche gli avvisi di reinstradamento delle approvazioni. I plugin di canale non dovrebbero inviare i propri messaggi di follow-up "approvazione inviata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato origine + DM approvatore tramite gli helper condivisi della capability di approvazione e lascia che core aggreghi i recapiti effettivi prima di pubblicare qualsiasi avviso nella chat di avvio.
- Preserva end-to-end il tipo dell'id di approvazione recapitato. I client nativi non dovrebbero
  indovinare o riscrivere il routing di approvazione exec rispetto a plugin dallo stato locale del canale.
- Tipi di approvazione diversi possono esporre intenzionalmente superfici native diverse.
  Esempi attuali inclusi nel bundle:
  - Slack mantiene disponibile il routing di approvazione nativa sia per id exec sia plugin.
  - Matrix mantiene lo stesso routing nativo DM/canale e la UX a reazioni per approvazioni exec
    e plugin, continuando comunque a consentire che l'auth differisca per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` sul plugin.

Per gli entrypoint caldi del canale, preferisci i sottopercorsi runtime più stretti quando ti serve solo
una parte di quella famiglia:

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

Specificamente per il setup:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  `createSetupTranslator`, adapter patch di setup sicuri da importare (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder setup-proxy
  delegati
- `openclaw/plugin-sdk/setup-runtime` include il punto di integrazione adapter consapevole dell'env per
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup per installazione opzionale
  più alcune primitive sicure per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati da env e i flussi generici di avvio/config
devono conoscere quei nomi env prima del caricamento del runtime, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni gli `envVars` del runtime del canale o le costanti locali
solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o
nelle scansioni SecretRef prima dell'avvio del runtime del plugin, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint dovrebbe essere sicuro da importare nei percorsi di comando
read-only e dovrebbe restituire i metadati del canale, l'adapter di configurazione sicuro per il setup, l'adapter di stato
e i metadati dei target dei secret di canale necessari per quei riepiloghi. Non
avviare client, listener o runtime di trasporto dall'entry di setup.

Mantieni stretto anche il percorso di import dell'entry principale del canale. La discovery può valutare
l'entry e il modulo plugin del canale per registrare le capability senza attivare
il canale. File come `channel-plugin-api.ts` dovrebbero esportare l'oggetto plugin
del canale senza importare wizard di setup, client di trasporto, listener socket,
launcher di sottoprocessi o moduli di avvio servizio. Metti quei pezzi runtime
in moduli caricati da `registerFull(...)`, setter runtime o adapter di capability
lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa il punto di integrazione più ampio `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi di setup/config più pesanti, come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle superfici
di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/wizard generato
fallisce in modo chiuso sulle scritture di config e sulla finalizzazione, e riutilizza
lo stesso messaggio di installazione richiesta tra validazione, finalize e testo del link
alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle superfici legacy
più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e il
  fallback dell’account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/channel-inbound` per route/envelope in ingresso e
  cablaggio di registrazione e dispatch
- `openclaw/plugin-sdk/channel-targets` per gli helper di parsing dei target
- `openclaw/plugin-sdk/outbound-media` per il caricamento dei media e
  `openclaw/plugin-sdk/channel-outbound` per identità/delegati di invio in uscita
  e pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:` corrente
  dopo che la chiave di sessione di base corrisponde ancora. I plugin provider possono sovrascrivere
  precedenza, comportamento dei suffissi e normalizzazione degli id thread quando la loro piattaforma
  ha semantiche native di consegna nei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei binding dei thread
  e la registrazione degli adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout
  legacy dei campi payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati
  Telegram, validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile rispetto ai fallback

I canali solo auth possono di solito fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone semplicemente le capability outbound/auth. I canali di approvazione nativi come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare un proprio ciclo di vita delle approvazioni.

## Criterio per le menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta delle evidenze di proprietà del plugin
- valutazione del criterio condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sui criteri delle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel helper
più ampio per l’inbound.

Adatto per logica locale al plugin:

- rilevamento reply-to-bot
- rilevamento quoted-bot
- controlli di partecipazione al thread
- esclusioni dei messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto per l’helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist delle menzioni implicite
- bypass dei comandi
- decisione finale di skip

Flusso preferito:

1. Calcola i fatti locali sulle menzioni.
2. Passa quei fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate inbound.

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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per
i plugin canale in bundle che dipendono già dall’iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
inbound non correlati.

Usa `resolveInboundMentionDecision({ facts, policy })` per il gating delle menzioni.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che lo rende un plugin canale. Per l’intera superficie dei metadati del pacchetto,
    vedi [Configurazione Plugin e config](/it/plugins/sdk-setup#openclaw-channel):

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
    impostazioni di proprietà del plugin che non sono la configurazione dell’account del canale. `channelConfigs`
    valida `channels.acme-chat` ed è la sorgente cold-path usata da schema di configurazione,
    setup e superfici UI prima del caricamento del runtime del plugin.

  </Step>

  <Step title="Costruisci l’oggetto plugin canale">
    L’interfaccia `ChannelPlugin` ha molte superfici adapter opzionali. Inizia con
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

    Per i canali che accettano sia chiavi DM canoniche di primo livello sia chiavi annidate legacy, usa gli helper da `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali all’account prima dei valori root ereditati. Abbina lo stesso resolver alla riparazione doctor tramite `normalizeLegacyDmAliases` così runtime e migrazione leggono lo stesso contratto.

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
      se ti serve controllo completo.

      Gli adapter outbound raw possono definire una funzione `chunker(text, limit, ctx)`.
      Il `ctx.formatting` opzionale trasporta decisioni di formattazione in fase di consegna
      come `maxLinesPerMessage`; applicalo prima dell’invio così il threading delle risposte
      e i confini dei chunk vengono risolti una sola volta dalla consegna outbound condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando è stato risolto un target di risposta nativo, così gli helper dei payload possono preservare
      tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
    </Accordion>

  </Step>

  <Step title="Collega l’entry point">
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

    Inserisci i descrittori CLI di proprietà del canale in `registerCliMetadata(...)` in modo che OpenClaw
    possa mostrarli nella guida radice senza attivare l'intero runtime del canale,
    mentre i normali caricamenti completi continuano a recuperare gli stessi descrittori per la registrazione
    effettiva dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un prefisso
    specifico del Plugin. Gli spazi dei nomi amministrativi del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
    in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione tra le modalità di registrazione. Consulta
    [Punti di ingresso](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una voce di configurazione iniziale">
    Crea `setup-entry.ts` per il caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece della voce completa quando il canale è disabilitato
    o non configurato. Evita di importare codice runtime pesante durante i flussi di configurazione iniziale.
    Consulta [Configurazione iniziale e configurazione](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali del workspace inclusi che separano le esportazioni sicure per la configurazione iniziale in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito in fase di configurazione iniziale.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo Plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Lo schema tipico è un Webhook che verifica la richiesta e
    la instrada tramite il gestore in ingresso del tuo canale:

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
      La gestione dei messaggi in ingresso è specifica del canale. Ogni Plugin di canale possiede
      la propria pipeline in ingresso. Guarda i Plugin di canale inclusi
      (per esempio il pacchetto Plugin Microsoft Teams o Google Chat) per schemi reali.
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
    TTS, STT, contenuti multimediali, subagent tramite api.runtime
  </Card>
  <Card title="API in ingresso del canale" icon="bolt" href="/it/plugins/sdk-channel-inbound">
    Ciclo di vita condiviso degli eventi in ingresso: acquisizione, risoluzione, registrazione, dispatch, finalizzazione
  </Card>
</CardGroup>

<Note>
Alcuni punti di estensione helper inclusi esistono ancora per la manutenzione e
la compatibilità dei Plugin inclusi. Non sono lo schema consigliato per i nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie SDK comune,
a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) - se il tuo Plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei sottopercorsi
- [Test dell'SDK](/it/plugins/sdk-testing) - utilità di test e test di contratto
- [Manifest del Plugin](/it/plugins/manifest) - schema completo del manifest

## Correlati

- [Configurazione iniziale del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin harness degli agenti](/it/plugins/sdk-agent-harness)
