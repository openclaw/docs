---
read_when:
    - Stai creando un nuovo Plugin per un canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - È necessario comprendere l'interfaccia dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin di canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-05-10T19:45:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida illustra come creare un Plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza per i DM,
abbinamento, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato un Plugin OpenClaw prima, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno di propri strumenti per inviare/modificare/reagire. OpenClaw mantiene uno
strumento `message` condiviso nel core. Il tuo Plugin gestisce:

- **Configurazione** - risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** - criteri per i DM e allowlist
- **Abbinamento** - flusso di approvazione tramite DM
- **Grammatica della sessione** - come gli id conversazione specifici del provider vengono mappati su chat base, id thread e fallback padre
- **In uscita** - invio di testo, media e sondaggi alla piattaforma
- **Threading** - come vengono organizzate le risposte in thread
- **Digitazione Heartbeat** - segnali facoltativi di digitazione/occupato per le destinazioni di consegna Heartbeat

Il core gestisce lo strumento messaggi condiviso, il cablaggio del prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

I nuovi Plugin di canale dovrebbero anche esporre un adattatore `message` con
`defineChannelMessageAdapter` da `openclaw/plugin-sdk/channel-message`. L'adattatore
dichiara quali capacità durevoli di invio finale sono effettivamente supportate dal trasporto nativo
e indirizza gli invii di testo/media alle stesse funzioni di trasporto dell'adattatore `outbound`
legacy. Dichiara una capacità solo quando un test di contratto
dimostra l'effetto collaterale nativo e la ricevuta restituita.
Per il contratto API completo, esempi, matrice delle capacità, regole delle ricevute, finalizzazione
dell'anteprima live, criterio di ack in ricezione, test e tabella di migrazione, consulta
[API dei messaggi di canale](/it/plugins/sdk-channel-message).
Se l'adattatore `outbound` esistente ha già i metodi di invio e
i metadati delle capacità corretti, usa `createChannelMessageAdapterFromOutbound(...)` per
derivare l'adattatore `message` invece di scrivere a mano un altro bridge.
Gli invii dell'adattatore dovrebbero restituire valori `MessageReceipt`. Quando il codice di compatibilità
ha ancora bisogno di id legacy, derivali con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` invece di mantenere campi
`messageIds` paralleli nel nuovo codice del ciclo di vita.
I canali con supporto per le anteprime dovrebbero anche dichiarare `message.live.capabilities` con
l'esatto ciclo di vita live di cui sono proprietari, come `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. I canali che finalizzano in loco un'anteprima bozza dovrebbero
anche dichiarare `message.live.finalizer.capabilities`, come `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e instradare la logica di runtime attraverso
`defineFinalizableLivePreviewAdapter(...)` più
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantieni queste capacità supportate
da test `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` in modo che anteprima nativa,
avanzamento, modifica, fallback/conservazione, pulizia e comportamento delle ricevute non possano divergere
silenziosamente.
I ricevitori in ingresso che posticipano gli acknowledgements della piattaforma dovrebbero dichiarare
`message.receive.defaultAckPolicy` e `supportedAckPolicies` invece di nascondere
la tempistica degli ack nello stato locale del monitor. Copri ogni criterio dichiarato con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Gli helper legacy per risposte/turni, come `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`
restano disponibili per i dispatcher di compatibilità. Non usare questi nomi per il nuovo
codice di canale; i nuovi Plugin dovrebbero iniziare con l'adattatore `message`, le ricevute e
gli helper del ciclo di vita di ricezione/invio in `openclaw/plugin-sdk/channel-message`.

I canali che migrano l'autorizzazione in ingresso possono usare il subpath sperimentale
`openclaw/plugin-sdk/channel-ingress-runtime` dai percorsi di ricezione runtime.
Il subpath mantiene ricerca della piattaforma ed effetti collaterali nel Plugin, condividendo al contempo
risoluzione dello stato allowlist, decisioni di route/mittente/comando/evento/attivazione,
diagnostica oscurata e mapping di ammissione del turno. Mantieni la normalizzazione
dell'identità del Plugin nel descrittore che passi al resolver; non serializzare
valori di match grezzi dallo stato o dalla decisione risolti. Consulta
[API di ingresso canale](/it/plugins/sdk-channel-ingress) per il design dell'API,
il confine di proprietà e le aspettative sui test.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` nel Plugin di canale. Il core lo chiama con la
destinazione di consegna Heartbeat risolta prima che inizi l'esecuzione del modello Heartbeat e
usa il ciclo di vita condiviso di keepalive/pulizia della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale di stop esplicito.

Se il tuo canale aggiunge parametri dello strumento messaggi che trasportano sorgenti media, esponi questi
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
quell'elenco esplicito per la normalizzazione dei percorsi sandbox e il criterio di accesso ai media
in uscita, quindi i Plugin non hanno bisogno di casi speciali nel core condiviso per parametri
avatar, allegato o immagine di copertina specifici del provider.
Preferisci restituire una mappa indicizzata per azione, come
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, in modo che azioni non correlate non
ereditino gli argomenti media di un'altra azione. Un array piatto funziona comunque per i parametri che
sono intenzionalmente condivisi tra tutte le azioni esposte.

Se il tuo canale ha bisogno di una modellazione specifica del provider per `message(action="send")`,
preferisci `actions.prepareSendPayload(...)`. Inserisci card native, blocchi, embed o
altri dati durevoli sotto `payload.channelData.<channel>` e lascia che il core esegua
l'invio effettivo tramite l'adattatore outbound/message. Usa
`actions.handleAction(...)` per l'invio solo come fallback di compatibilità per
payload che non possono essere serializzati e ritentati.

Se la tua piattaforma archivia ambito aggiuntivo negli id conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'id conversazione base, all'id thread facoltativo,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal padre
più specifico alla conversazione più ampia/base.

Usa `openclaw/plugin-sdk/channel-route` quando il codice del Plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la sua route padre o creare una
chiave di deduplica stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli id thread numerici nello stesso modo del core, quindi i Plugin dovrebbero preferirlo
a confronti ad hoc `String(threadId)`.
I Plugin con grammatica del target specifica del provider possono iniettare il proprio parser in
`resolveChannelRouteTargetWithParser(...)` e ottenere comunque la stessa forma di target
route e la stessa semantica di fallback thread usate dal core.

I Plugin inclusi che hanno bisogno dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file di primo livello `session-key-api.ts` con un export
`resolveSessionConversation(...)` corrispondente. Il core usa quella superficie sicura per il bootstrap
solo quando il registro dei Plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come
fallback di compatibilità legacy quando un Plugin ha bisogno solo di fallback padre sopra
l'id generico/grezzo. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità del canale

La maggior parte dei Plugin di canale non richiede codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna di fallback generica.
- Preferisci un singolo oggetto `approvalCapability` sul Plugin del canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Metti i dati di consegna/native/render/auth dell'approvazione su `approvalCapability`.
- `plugin.auth` è solo login/logout; il core non legge più gli hook di autenticazione delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il seam canonico per l'autenticazione delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'autenticazione delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'autenticazione delle approvazioni nella stessa chat. Il core usa quell'hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta le approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita dei payload specifici del canale, come nascondere prompt locali duplicati di approvazione o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing delle approvazioni native o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i dati di approvazione nativa gestiti dal canale. Mantienilo lazy sugli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime on demand pur consentendo al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di livello superiore.
- Se un canale può inferire identità DM stabili assimilabili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale necessita della consegna di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione del target e sui dati di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i dati specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire filtro delle richieste, routing, deduplicazione, scadenza, sottoscrizione Gateway e notifiche di instradamento altrove. `nativeRuntime` è suddiviso in alcuni seam più piccoli:
- `createChannelNativeOriginTargetResolver` usa per default il matcher condiviso delle route di canale per i target `{ to, accountId, threadId }`. Passa `targetsMatch` solo quando un canale ha regole di equivalenza specifiche del provider, come il matching del prefisso timestamp di Slack.
- Passa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` quando il canale deve canonicalizzare gli id del provider prima che venga eseguito il matcher di route predefinito o una callback `targetsMatch` personalizzata, preservando al tempo stesso il target originale per la consegna. Usa `normalizeTarget` solo quando il target di consegna risolto stesso deve essere canonicalizzato.
- `availability` - se l'account è configurato e se una richiesta deve essere gestita
- `presentation` - mappa il modello di vista condiviso dell'approvazione in payload nativi pending/resolved/expired o azioni finali
- `transport` - prepara i target e invia/aggiorna/elimina i messaggi di approvazione nativi
- `interactions` - hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` - hook opzionali di diagnostica della consegna
- Se il canale necessita di oggetti gestiti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime consente al core di avviare handler guidati dalle capability dallo stato di startup del canale senza aggiungere colla wrapper specifica per le approvazioni.
- Ricorri ai livelli inferiori `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo quando il seam guidato dalle capability non è ancora abbastanza espressivo.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` tramite questi helper. `accountId` mantiene la policy di approvazione multi-account nell'ambito del giusto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs Plugin senza branch hardcoded nel core.
- Ora il core gestisce anche le notifiche di reinstradamento delle approvazioni. I Plugin di canale non dovrebbero inviare propri messaggi di follow-up "approvazione inviata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi routing accurato di origine + DM dell'approvatore tramite gli helper condivisi della capability di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare qualsiasi notifica nella chat di avvio.
- Preserva end-to-end il tipo di id dell'approvazione consegnata. I client nativi non dovrebbero
  indovinare o riscrivere il routing delle approvazioni exec vs Plugin dallo stato locale del canale.
- Tipi di approvazione diversi possono intenzionalmente esporre superfici native diverse.
  Esempi bundled attuali:
  - Slack mantiene disponibile il routing delle approvazioni native sia per gli id exec sia per quelli Plugin.
  - Matrix mantiene lo stesso routing nativo DM/canale e la stessa UX a reazioni per le approvazioni exec
    e Plugin, pur consentendo ancora all'autenticazione di differire per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` sul Plugin.

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

Per il setup in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  adattatori di patch del setup sicuri da importare (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder delegati
  setup-proxy
- `openclaw/plugin-sdk/setup-runtime` include il seam dell'adattatore consapevole dell'env per
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup con installazione opzionale
  più alcune primitive sicure per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati da env e i flussi generici di startup/config
dovrebbero conoscere quei nomi env prima che il runtime venga caricato, dichiarali nel
manifest del Plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o le costanti locali
solo per il testo rivolto agli operatori.

Se il tuo canale può apparire in `status`, `channels list`, `channels status` o nelle scansioni
SecretRef prima dell'avvio del runtime del Plugin, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint dovrebbe essere sicuro da importare nei percorsi di comando
read-only e dovrebbe restituire i metadati del canale, l'adattatore di configurazione sicuro per il setup, l'adattatore di stato
e i metadati dei target segreti del canale necessari per quei riepiloghi. Non
avviare client, listener o runtime di trasporto dall'entry di setup.

Mantieni stretto anche il percorso di import dell'entry principale del canale. La discovery può valutare
l'entry e il modulo Plugin del canale per registrare capability senza attivare
il canale. File come `channel-plugin-api.ts` dovrebbero esportare l'oggetto Plugin del canale
senza importare wizard di setup, client di trasporto, listener socket,
launcher di subprocessi o moduli di startup del servizio. Metti questi pezzi runtime
in moduli caricati da `registerFull(...)`, setter runtime o adattatori
di capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa il seam più ampio `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi più pesanti di setup/config, come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo Plugin" nelle superfici di setup,
preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/wizard generato
fallisce in modo chiuso su scritture di configurazione e finalizzazione, e riutilizza
lo stesso messaggio di installazione richiesta tra validazione, finalizzazione e testo del link
alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle superfici legacy
più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope inbound e
  cablaggio record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento media più delegati
  identità/send outbound e pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route outbound dovrebbe preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione corrente `:thread:`
  dopo che la chiave di sessione di base corrisponde ancora. I Plugin provider possono sovrascrivere
  precedenza, comportamento del suffisso e normalizzazione dell'id del thread quando la loro piattaforma
  ha semantiche native di consegna nei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei binding di thread
  e la registrazione degli adattatori
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi
  del payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati
  Telegram, la validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile in fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone solo capability outbound/auth. I canali di approvazione nativa come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare un proprio ciclo di vita delle approvazioni.

## Policy delle menzioni inbound

Mantieni la gestione delle menzioni inbound divisa in due livelli:

- raccolta delle evidenze gestita dal Plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni di policy sulle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel più ampio degli helper
inbound.

Adatto alla logica locale del Plugin:

- rilevamento di risposta al bot
- rilevamento di bot citato
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per provare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist delle menzioni implicite
- bypass dei comandi
- decisione finale di salto

Flusso preferito:

1. Calcola i fatti locali sulla menzione.
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
plugin di canale inclusi che dipendono gia dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime in ingresso
non correlati.

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilita. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` e
    cio che rende questo un plugin di canale. Per l'intera superficie dei metadati del pacchetto,
    vedi [Configurazione e setup dei Plugin](/it/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` convalida `plugins.entries.acme-chat.config`. Usalo per
    impostazioni di proprieta del plugin che non sono la configurazione dell'account del canale. `channelConfigs`
    convalida `channels.acme-chat` ed e la sorgente del percorso a freddo usata dallo schema di configurazione,
    dal setup e dalle superfici UI prima che il runtime del plugin venga caricato.

  </Step>

  <Step title="Crea l'oggetto plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Inizia con
    il minimo - `id` e `setup` - e aggiungi gli adapter man mano che ti servono.

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

    Per i canali che accettano sia chiavi DM canoniche di primo livello sia vecchie chiavi annidate, usa gli helper da `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali dell'account prima dei valori radice ereditati. Abbina lo stesso resolver alla riparazione doctor tramite `normalizeLegacyDmAliases` cosi runtime e migrazione leggono lo stesso contratto.

    <Accordion title="Cosa fa createChatChannelPlugin per te">
      Invece di implementare manualmente interfacce adapter di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver della sicurezza DM con ambito dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalita reply-to (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati di risultato (ID messaggio) |

      Puoi anche passare oggetti adapter grezzi invece delle opzioni dichiarative
      se ti serve il pieno controllo.

      Gli adapter in uscita grezzi possono definire una funzione `chunker(text, limit, ctx)`.
      Il `ctx.formatting` facoltativo contiene le decisioni di formattazione al momento della consegna,
      come `maxLinesPerMessage`; applicalo prima dell'invio cosi il threading delle risposte
      e i confini dei chunk vengono risolti una sola volta dalla consegna in uscita condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando e stato risolto un target di risposta nativo, cosi gli helper dei payload possono preservare
      i tag di risposta espliciti senza consumare uno slot di risposta implicita monouso.
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

    Inserisci i descrittori CLI di proprieta del canale in `registerCliMetadata(...)` cosi OpenClaw
    puo mostrarli nell'help radice senza attivare l'intero runtime del canale,
    mentre i normali caricamenti completi continuano a recuperare gli stessi descrittori per la registrazione reale
    dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un
    prefisso specifico del plugin. Gli spazi dei nomi amministrativi core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
    in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la divisione delle modalita di registrazione. Vedi
    [Entry point](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte
    le opzioni.

  </Step>

  <Step title="Aggiungi una entry di setup">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questa invece dell'entry completa quando il canale e disabilitato
    o non configurato. Evita di caricare codice runtime pesante durante i flussi di setup.
    Vedi [Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali inclusi nel workspace che separano gli export sicuri per il setup in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito al momento del setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico e un Webhook che verifica la richiesta e
    la distribuisce tramite l'handler in ingresso del tuo canale:

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
      la propria pipeline in ingresso. Consulta i plugin di canale inclusi
      (per esempio il pacchetto del plugin Microsoft Teams o Google Chat) per pattern reali.
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
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, contenuti multimediali, subagent tramite api.runtime
  </Card>
  <Card title="Kernel del turno di canale" icon="bolt" href="/it/plugins/sdk-channel-turn">
    Ciclo di vita condiviso del turno in ingresso: ingestione, risoluzione, registrazione, dispatch, finalizzazione
  </Card>
</CardGroup>

<Note>
Alcune interfacce helper incluse esistono ancora per la manutenzione e la
compatibilità dei plugin inclusi. Non sono il pattern consigliato per i nuovi plugin di canale;
preferisci i subpath generici di canale/setup/risposta/runtime dalla superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) - se il tuo plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei subpath
- [Test dell'SDK](/it/plugins/sdk-testing) - utilità di test e test di contratto
- [Manifest del Plugin](/it/plugins/manifest) - schema completo del manifest

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
