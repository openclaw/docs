---
read_when:
    - Stai creando un nuovo Plugin per canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - È necessario comprendere la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin per canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-05-06T09:02:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida mostra come creare un plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza
dei DM, abbinamento, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato un plugin OpenClaw prima, leggi prima
  [Guida introduttiva](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifesto.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di strumenti propri per inviare/modificare/reagire. OpenClaw mantiene uno
strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Configurazione** - risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** - criterio DM e allowlist
- **Abbinamento** - flusso di approvazione tramite DM
- **Grammatica della sessione** - come gli id conversazione specifici del provider si mappano alle chat di base, agli id thread e ai fallback padre
- **In uscita** - invio di testo, media e sondaggi alla piattaforma
- **Threading** - come le risposte vengono organizzate in thread
- **Digitazione Heartbeat** - segnali opzionali di digitazione/occupato per le destinazioni di consegna Heartbeat

Il core gestisce lo strumento di messaggio condiviso, il wiring dei prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

I nuovi plugin di canale dovrebbero inoltre esporre un adapter `message` con
`defineChannelMessageAdapter` da `openclaw/plugin-sdk/channel-message`. L'adapter
dichiara quali capability durevoli di invio finale il trasporto nativo
supporta effettivamente e collega gli invii di testo/media alle stesse funzioni di trasporto
dell'adapter `outbound` precedente. Dichiara una capability solo quando un test di contratto
prova l'effetto collaterale nativo e la ricevuta restituita.
Per il contratto API completo, gli esempi, la matrice delle capability, le regole sulle ricevute, la finalizzazione dell'anteprima live,
il criterio di conferma in ricezione, i test e la tabella di migrazione, consulta
[API dei messaggi di canale](/it/plugins/sdk-channel-message).
Se l'adapter `outbound` esistente ha già i metodi di invio corretti e
i metadati di capability, usa `createChannelMessageAdapterFromOutbound(...)` per
derivare l'adapter `message` invece di scrivere a mano un altro bridge.
Gli invii dell'adapter dovrebbero restituire valori `MessageReceipt`. Quando il codice di compatibilità
ha ancora bisogno degli id legacy, derivali con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` invece di mantenere campi
`messageIds` paralleli nel nuovo codice del ciclo di vita.
I canali con supporto per l'anteprima dovrebbero anche dichiarare `message.live.capabilities` con
l'esatto ciclo di vita live che gestiscono, come `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. I canali che finalizzano un'anteprima bozza sul posto dovrebbero
anche dichiarare `message.live.finalizer.capabilities`, come `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` e
`retainOnAmbiguousFailure`, e instradare la logica runtime tramite
`defineFinalizableLivePreviewAdapter(...)` più
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantieni queste capability coperte
da test `verifyChannelMessageLiveCapabilityAdapterProofs(...)` e
`verifyChannelMessageLiveFinalizerProofs(...)` in modo che anteprima nativa,
avanzamento, modifica, fallback/conservazione, pulizia e comportamento delle ricevute non possano divergere
silenziosamente.
I ricevitori in ingresso che rinviano le conferme della piattaforma dovrebbero dichiarare
`message.receive.defaultAckPolicy` e `supportedAckPolicies` invece di nascondere
il timing delle conferme nello stato locale del monitor. Copri ogni criterio dichiarato con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Gli helper legacy per risposte/turni, come `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` e `recordInboundSessionAndDispatchReply`,
rimangono disponibili per i dispatcher di compatibilità. Non usare questi nomi per il nuovo
codice di canale; i nuovi plugin dovrebbero iniziare con l'adapter `message`, le ricevute e
gli helper del ciclo di vita di ricezione/invio in `openclaw/plugin-sdk/channel-message`.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` nel plugin di canale. Il core lo chiama con la
destinazione di consegna Heartbeat risolta prima dell'avvio dell'esecuzione del modello Heartbeat e
usa il ciclo di vita condiviso di keepalive/pulizia della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale esplicito di stop.

Se il tuo canale aggiunge parametri dello strumento di messaggio che trasportano sorgenti media, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
quell'elenco esplicito per la normalizzazione dei percorsi sandbox e il criterio di accesso ai media in uscita,
quindi i plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider
relativi ad avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per chiave azione, come
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, così le azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto funziona ancora per i parametri che
sono intenzionalmente condivisi tra tutte le azioni esposte.

Se il tuo canale richiede una modellazione specifica del provider per `message(action="send")`,
preferisci `actions.prepareSendPayload(...)`. Inserisci card native, blocchi, embed o
altri dati durevoli sotto `payload.channelData.<channel>` e lascia che il core esegua
l'invio effettivo tramite l'adapter outbound/message. Usa
`actions.handleAction(...)` per l'invio solo come fallback di compatibilità per
payload che non possono essere serializzati e ritentati.

Se la tua piattaforma memorizza scope aggiuntivo dentro gli id conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'id conversazione di base, all'id thread
opzionale, a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal padre
più specifico alla conversazione più ampia/di base.

Usa `openclaw/plugin-sdk/channel-route` quando il codice del plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la sua route padre o creare una
chiave di deduplicazione stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli id thread numerici nello stesso modo del core, quindi i plugin dovrebbero preferirlo
a confronti ad hoc con `String(threadId)`.
I plugin con grammatica del target specifica del provider possono iniettare il proprio parser in
`resolveChannelRouteTargetWithParser(...)` e ottenere comunque la stessa forma del target di route
e la stessa semantica di fallback del thread usate dal core.

I plugin integrati che hanno bisogno dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file `session-key-api.ts` di primo livello con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` rimane disponibile come
fallback di compatibilità legacy quando a un plugin servono solo fallback padre sopra
l'id generico/raw. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capability di canale

La maggior parte dei plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core possiede `/approve` nella stessa chat, i payload dei pulsanti di approvazione condivisi e la consegna di fallback generica.
- Preferisci un unico oggetto `approvalCapability` nel plugin di canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci i dati di consegna/nativi/rendering/auth delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo login/logout; il core non legge più gli hook di auth delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la giuntura canonica per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth delle approvazioni nella stessa chat. Il core usa quell'hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta le approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per il comportamento del ciclo di vita del payload specifico del canale, come nascondere prompt locali duplicati di approvazione o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing delle approvazioni native o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i dati delle approvazioni native posseduti dal canale. Mantienilo lazy sugli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il modulo runtime su richiesta lasciando comunque che il core assembli il ciclo di vita delle approvazioni.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte impostazioni di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di livello superiore.
- Se un canale può inferire identità DM stabili simili a proprietari dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale richiede la consegna di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione del target più sui dati di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i dati specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e possedere filtro delle richieste, routing, deduplica, scadenza, sottoscrizione Gateway e avvisi di instradamento altrove. `nativeRuntime` è suddiviso in alcune giunture più piccole:
- `createChannelNativeOriginTargetResolver` usa per default il matcher condiviso delle route di canale per i target `{ to, accountId, threadId }`. Passa `targetsMatch` solo quando un canale ha regole di equivalenza specifiche del provider, come il matching del prefisso timestamp di Slack.
- Passa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` quando il canale deve canonizzare gli id del provider prima che venga eseguito il matcher di route predefinito o una callback `targetsMatch` personalizzata, preservando al contempo il target originale per la consegna. Usa `normalizeTarget` solo quando il target di consegna risolto deve essere canonizzato.
- `availability` - se l'account è configurato e se una richiesta deve essere gestita
- `presentation` - mappa il modello di vista condiviso dell'approvazione in payload nativi in sospeso/risolti/scaduti o azioni finali
- `transport` - prepara i target e invia/aggiorna/elimina i messaggi di approvazione nativi
- `interactions` - hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` - hook opzionali di diagnostica della consegna
- Se il canale richiede oggetti posseduti dal runtime come client, token, app Bolt o ricevitore webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime consente al core di avviare handler guidati da capability dallo stato di avvio del canale senza aggiungere collante wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello inferiore solo quando la giuntura guidata da capability non è ancora abbastanza espressiva.
- I canali di approvazione nativi devono instradare sia `accountId` sia `approvalKind` tramite quegli helper. `accountId` mantiene la policy di approvazione multi-account nell'ambito dell'account bot corretto, e `approvalKind` mantiene il comportamento di approvazione exec rispetto a plugin disponibile per il canale senza branch hardcoded nel core.
- Ora il core possiede anche gli avvisi di reinstradamento delle approvazioni. I plugin di canale non dovrebbero inviare i propri messaggi di follow-up "approvazione inviata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato origin + DM dell'approvatore tramite gli helper condivisi della capability di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare qualsiasi avviso nella chat di avvio.
- Preserva il tipo dell'id di approvazione consegnato end-to-end. I client nativi non dovrebbero
  indovinare o riscrivere il routing delle approvazioni exec rispetto a plugin dallo stato locale del canale.
- Tipi di approvazione diversi possono esporre intenzionalmente superfici native diverse.
  Esempi integrati attuali:
  - Slack mantiene il routing delle approvazioni native disponibile sia per gli id exec sia per gli id plugin.
  - Matrix mantiene lo stesso routing DM/canale nativo e la stessa UX con reazioni per le approvazioni exec
    e plugin, lasciando comunque che l'auth differisca per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` nel plugin.

Per gli entrypoint caldi del canale, preferisci i sottopercorsi runtime più ristretti quando ti serve solo
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie ombrello
più ampia.

In particolare per la configurazione:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adapter di patch della configurazione sicuri da importare (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder delegati
  del proxy di configurazione
- `openclaw/plugin-sdk/setup-adapter-runtime` è la giuntura adapter ristretta e consapevole dell'env
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder della configurazione
  con installazione opzionale più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o auth guidati dall'env e i flussi generici
di avvio/configurazione devono conoscere quei nomi env prima che il runtime venga caricato, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni gli `envVars` del runtime del canale o le costanti locali
solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o
scansioni SecretRef prima dell'avvio del runtime del plugin, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint dovrebbe essere sicuro da importare nei percorsi di comando
in sola lettura e dovrebbe restituire i metadati del canale, l'adapter di configurazione sicuro,
l'adapter di stato e i metadati del target dei segreti del canale necessari per quei riepiloghi. Non
avviare client, listener o runtime di trasporto dall'entry di configurazione.

Mantieni ristretto anche il percorso di import dell'entry principale del canale. La discovery può valutare
l'entry e il modulo del plugin di canale per registrare le capability senza attivare
il canale. File come `channel-plugin-api.ts` dovrebbero esportare l'oggetto plugin di canale
senza importare wizard di configurazione, client di trasporto, listener socket,
launcher di sottoprocessi o moduli di avvio del servizio. Metti quei componenti runtime
in moduli caricati da `registerFull(...)`, setter runtime o adapter di capability
lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la giuntura più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi di configurazione/config più pesanti come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle superfici
di configurazione, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/wizard generato
fallisce in modo chiuso sulle scritture di configurazione e sulla finalizzazione, e riusa
lo stesso messaggio di installazione richiesta nella validazione, nella finalizzazione e nel testo
del link alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper ristretti rispetto alle superfici legacy
più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope in ingresso e
  cablaggio record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento dei media più delegati
  identity/send in uscita e pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:` corrente
  dopo che la chiave della sessione base corrisponde ancora. I plugin provider possono sovrascrivere
  precedenza, comportamento del suffisso e normalizzazione dell'id del thread quando la loro piattaforma
  ha semantiche native di consegna nei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei binding dei thread
  e la registrazione degli adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy
  dei campi payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati Telegram,
  validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile per il fallback

I canali solo-auth possono di solito fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone solo capability in uscita/auth. I canali di approvazione nativi come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da zero il proprio ciclo di vita delle approvazioni.

## Policy delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta di evidenze posseduta dal plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni di policy sulle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel più ampio degli helper in ingresso.

Adatto alla logica locale del plugin:

- rilevamento reply-to-bot
- rilevamento quoted-bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato della menzione esplicita
- elenco consentito delle menzioni implicite
- bypass del comando
- decisione finale di ignorare

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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per i Plugin di canale inclusi che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime in ingresso non correlati.

I vecchi helper `resolveMentionGating*` rimangono su
`openclaw/plugin-sdk/channel-inbound` solo come esportazioni di compatibilità. Il nuovo codice dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package e manifesto">
    Crea i file Plugin standard. Il campo `channel` in `package.json` è ciò che rende questo un Plugin di canale. Per l'intera superficie dei metadati del pacchetto, vedi [Configurazione e setup del Plugin](/it/plugins/sdk-setup#openclaw-channel):

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

    `configSchema` valida `plugins.entries.acme-chat.config`. Usalo per le impostazioni possedute dal Plugin che non sono la configurazione dell'account del canale. `channelConfigs`
    valida `channels.acme-chat` ed è la sorgente del percorso a freddo usata dallo schema di configurazione, dal setup e dalle superfici UI prima che il runtime del Plugin venga caricato.

  </Step>

  <Step title="Costruisci l'oggetto Plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Inizia con il minimo, `id` e `setup`, e aggiungi adapter man mano che ti servono.

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

    Per i canali che accettano sia chiavi DM canoniche di primo livello sia vecchie chiavi annidate, usa gli helper da `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali dell'account prima dei valori root ereditati. Abbina lo stesso resolver alla riparazione doctor tramite `normalizeLegacyDmAliases`, così runtime e migrazione leggono lo stesso contratto.

    <Accordion title="Cosa fa createChatChannelPlugin per te">
      Invece di implementare manualmente interfacce adapter di basso livello, passi opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con ambito dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adapter grezzi invece delle opzioni dichiarative se hai bisogno di controllo completo.

      Gli adapter in uscita grezzi possono definire una funzione `chunker(text, limit, ctx)`.
      Il campo facoltativo `ctx.formatting` porta decisioni di formattazione al momento della consegna, come `maxLinesPerMessage`; applicalo prima dell'invio, così il threading delle risposte e i confini dei chunk vengono risolti una sola volta dalla consegna in uscita condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`) quando è stato risolto un target di risposta nativo, così gli helper del payload possono preservare tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
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

    Inserisci i descrittori CLI posseduti dal canale in `registerCliMetadata(...)`, così OpenClaw può mostrarli nell'help root senza attivare il runtime completo del canale, mentre i normali caricamenti completi rilevano comunque gli stessi descrittori per la registrazione effettiva dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un prefisso specifico del Plugin. Gli spazi dei nomi di amministrazione core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione delle modalità di registrazione. Vedi
    [Entry point](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte
    le opzioni.

  </Step>

  <Step title="Aggiungi un'entry di setup">
    Crea `setup-entry.ts` per il caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato o non configurato. Evita di includere codice runtime pesante durante i flussi di setup.
    Vedi [Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali inclusi nel workspace che separano le esportazioni sicure per il setup in moduli sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno anche bisogno di un setter runtime esplicito al momento del setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo Plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e la invia tramite l'handler in ingresso del tuo canale:

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
      la propria pipeline in ingresso. Consulta i Plugin di canale inclusi
      (per esempio il pacchetto Plugin di Microsoft Teams o Google Chat) per modelli reali.
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
  <Card title="Integrazione dello strumento per i messaggi" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e scoperta delle azioni
  </Card>
  <Card title="Risoluzione della destinazione" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, sottoagente tramite api.runtime
  </Card>
  <Card title="Kernel dei turni del canale" icon="bolt" href="/it/plugins/sdk-channel-turn">
    Ciclo di vita condiviso dei turni in ingresso: acquisizione, risoluzione, registrazione, invio, finalizzazione
  </Card>
</CardGroup>

<Note>
Alcuni seam helper inclusi esistono ancora per la manutenzione dei Plugin inclusi e
la compatibilità. Non sono il modello consigliato per i nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie comune dell'SDK,
a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) - se il tuo Plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) - riferimento completo agli import dei sottopercorsi
- [Test dell'SDK](/it/plugins/sdk-testing) - utilità di test e test di contratto
- [Manifest del Plugin](/it/plugins/manifest) - schema completo del manifest

## Correlati

- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin di harness agente](/it/plugins/sdk-agent-harness)
