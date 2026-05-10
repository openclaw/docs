---
read_when:
    - Stai creando un Plugin di canale e vuoi il ciclo di vita condiviso del turno in ingresso
    - Stai migrando un monitor di canale dal codice di raccordo record/dispatch scritto a mano
    - Devi comprendere le fasi di ammissione, acquisizione, classificazione, controllo preliminare, risoluzione, registrazione, inoltro e finalizzazione.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- il kernel condiviso dei turni in ingresso che i Plugin di canale integrati e di terze parti usano per registrare, inoltrare e finalizzare i turni degli agenti
title: Kernel del turno del canale
x-i18n:
    generated_at: "2026-05-10T19:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Il kernel dei turni di canale è la macchina a stati in ingresso condivisa che trasforma un evento di piattaforma normalizzato in un turno dell'agente. I Plugin di canale forniscono i fatti della piattaforma e la callback di consegna. Il core possiede l'orchestrazione: acquisizione, classificazione, preflight, risoluzione, autorizzazione, assemblaggio, registrazione, dispatch e finalizzazione.

Usalo quando il tuo Plugin si trova nel percorso caldo dei messaggi in ingresso. Per eventi non messaggio (comandi slash, modali, interazioni con pulsanti, eventi del ciclo di vita, reazioni, stato vocale), mantienili locali al Plugin. Il kernel possiede solo gli eventi che possono diventare un turno testuale dell'agente.

<Info>
  Il kernel viene raggiunto tramite il runtime del Plugin iniettato come `runtime.channel.turn.*`. Il tipo del runtime del Plugin è esportato da `openclaw/plugin-sdk/core`, quindi i Plugin nativi di terze parti possono usare questi entry point nello stesso modo dei Plugin di canale inclusi.
</Info>

## Perché un kernel condiviso

I Plugin di canale ripetono lo stesso flusso in ingresso: normalizzare, instradare, applicare i gate, costruire un contesto, registrare i metadati della sessione, eseguire il dispatch del turno dell'agente, finalizzare lo stato di consegna. Senza un kernel condiviso, una modifica al gating delle menzioni, alle risposte visibili solo agli strumenti, ai metadati della sessione, alla cronologia in sospeso o alla finalizzazione del dispatch deve essere applicata per ogni canale.

Il kernel mantiene deliberatamente separati quattro concetti:

- `ConversationFacts`: da dove proviene il messaggio
- `RouteFacts`: quale agente e quale sessione devono elaborarlo
- `ReplyPlanFacts`: dove devono andare le risposte visibili
- `MessageFacts`: quale corpo e quale contesto supplementare l'agente deve vedere

I DM di Slack, gli argomenti di Telegram, i thread di Matrix e le sessioni per argomento di Feishu li distinguono tutti nella pratica. Trattarli come un unico identificatore causa deriva nel tempo.

## Ciclo di vita degli stadi

Il kernel esegue la stessa pipeline fissa indipendentemente dal canale:

1. `ingest` -- l'adapter converte un evento di piattaforma grezzo in `NormalizedTurnInput`
2. `classify` -- l'adapter dichiara se questo evento può avviare un turno dell'agente
3. `preflight` -- l'adapter esegue deduplicazione, self-echo, hydration, debounce, decrittazione, precompilazione parziale dei fatti
4. `resolve` -- l'adapter restituisce un turno completamente assemblato (route, piano di risposta, messaggio, consegna)
5. `authorize` -- policy di DM, gruppo, menzione e comando applicata ai fatti assemblati
6. `assemble` -- `FinalizedMsgContext` costruito dai fatti tramite `buildContext`
7. `record` -- metadati della sessione in ingresso e ultima route persistiti
8. `dispatch` -- turno dell'agente eseguito tramite il dispatcher a blocchi bufferizzato
9. `finalize` -- `onFinalize` dell'adapter viene eseguito anche in caso di errore di dispatch

Ogni stadio emette un evento di log strutturato quando viene fornita una callback `log`. Vedi [Osservabilità](#observability).

## Tipi di ammissione

Il kernel non genera eccezioni quando un turno è bloccato da un gate. Restituisce un `ChannelTurnAdmission`:

| Tipo          | Quando                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Il turno è ammesso. Il turno dell'agente viene eseguito e il percorso di risposta visibile viene esercitato.                                                                   |
| `observeOnly` | Il turno viene eseguito end-to-end ma l'adapter di consegna non invia nulla di visibile. Usato per agenti osservatori broadcast e altri flussi multi-agente passivi. |
| `handled`     | Un evento di piattaforma è stato consumato localmente (ciclo di vita, reazione, pulsante, modale). Il kernel salta il dispatch.                                           |
| `drop`        | Percorso di salto. Facoltativamente `recordHistory: true` mantiene il messaggio nella cronologia di gruppo in sospeso così una menzione futura avrà contesto.                      |

L'ammissione può provenire da `classify` (la classe dell'evento ha detto che non può avviare un turno), da `preflight` (deduplicazione, self-echo, menzione mancante con registrazione della cronologia) o da `resolveTurn` stesso.

## Entry point

Il runtime espone tre entry point preferiti, così gli adapter possono aderire al livello che corrisponde al canale.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Due helper runtime precedenti restano disponibili per la compatibilità con il Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Usa quando il tuo canale può esprimere il proprio flusso in ingresso come `ChannelTurnAdapter<TRaw>`. L'adapter ha callback per `ingest`, `classify` opzionale, `preflight` opzionale, `resolveTurn` obbligatorio e `onFinalize` opzionale.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` è la forma corretta quando il canale ha una logica adapter ridotta e trae beneficio dal possedere il ciclo di vita tramite hook.

### runAssembled

Usa quando il canale ha già risolto il routing, costruito un `FinalizedMsgContext`,
e necessita solo dell'ordinamento condiviso di registrazione, pipeline di risposta,
dispatch e finalizzazione. Questa è la forma preferita per semplici percorsi in ingresso
inclusi che altrimenti ripeterebbero boilerplate di `createChannelMessageReplyPipeline(...)`
e `runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Scegli `runAssembled` invece di `runPrepared` quando l'unico comportamento di dispatch
posseduto dal canale è la consegna finale del payload più typing opzionale, opzioni
di risposta, consegna durevole o logging degli errori.

### runPrepared

Usa quando il canale ha un dispatcher locale complesso con anteprime, ritentativi, modifiche o bootstrap del thread che deve restare posseduto dal canale. Il kernel registra comunque la sessione in ingresso prima del dispatch ed espone un `DispatchedChannelTurnResult` uniforme.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

I canali ricchi (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) usano `runPrepared` perché il loro dispatcher orchestra comportamenti specifici della piattaforma che il kernel non deve conoscere.

### buildContext

Una funzione pura che mappa pacchetti di fatti in `FinalizedMsgContext`. Usala quando il tuo canale implementa manualmente parte della pipeline ma vuole una forma del contesto coerente.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` è utile anche dentro le callback `resolveTurn` quando si assembla un turno per `run`.

<Note>
  Gli helper SDK deprecati come `dispatchInboundReplyWithBase` fanno ancora da ponte tramite un helper di turno assemblato. Il nuovo codice dei Plugin dovrebbe usare `run` o `runPrepared`.
</Note>

## Tipi di fatti

I fatti che il kernel consuma dal tuo adapter sono indipendenti dalla piattaforma. Traduci gli oggetti della piattaforma in queste forme prima di passarli al kernel.

### NormalizedTurnInput

| Campo             | Scopo                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID messaggio stabile usato per deduplicazione e log                                   |
| `timestamp`       | Epoch ms opzionale                                                            |
| `rawText`         | Corpo come ricevuto dalla piattaforma                                           |
| `textForAgent`    | Corpo ripulito opzionale per l'agente (rimozione menzione, rifinitura typing)             |
| `textForCommands` | Corpo opzionale usato per il parsing di `/command`                                    |
| `raw`             | Riferimento pass-through opzionale per callback dell'adapter che necessitano dell'originale |

### ChannelEventClass

| Campo                  | Scopo                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Se false il kernel restituisce `{ kind: "handled" }`                       |
| `requiresImmediateAck` | Suggerimento per adapter che devono inviare ACK prima del dispatch                      |

### SenderFacts

| Campo          | Scopo                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | ID mittente stabile della piattaforma                                      |
| `name`         | Nome visualizzato                                                   |
| `username`     | Handle se distinto da `name`                                 |
| `tag`          | Discriminatore in stile Discord o tag della piattaforma                    |
| `roles`        | ID dei ruoli, usati per il matching dell'allowlist dei ruoli membro              |
| `isBot`        | Vero quando il mittente è un bot noto (il kernel lo usa per scartare) |
| `isSelf`       | Vero quando il mittente è l'agente configurato stesso            |
| `displayLabel` | Etichetta pre-renderizzata per il testo dell'envelope                           |

### ConversationFacts

| Campo             | Scopo                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, o `channel`                                      |
| `id`              | ID conversazione usato per il routing                                     |
| `label`           | Etichetta umana per l'envelope                                         |
| `spaceId`         | Identificatore dello spazio esterno opzionale (workspace Slack, homeserver Matrix) |
| `parentId`        | ID conversazione esterna quando questo è un thread                          |
| `threadId`        | ID thread quando questo messaggio è dentro un thread                       |
| `nativeChannelId` | ID canale nativo della piattaforma quando diverso dall'ID di routing        |
| `routePeer`       | Peer usato per la lookup `resolveAgentRoute`                             |

### RouteFacts

| Campo                   | Scopo                                                      |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agente che deve gestire questo turno                       |
| `accountId`             | Override opzionale (canali multi-account)                  |
| `routeSessionKey`       | Chiave di sessione usata per il routing                    |
| `dispatchSessionKey`    | Chiave di sessione usata al dispatch quando diversa dalla chiave di route |
| `persistedSessionKey`   | Chiave di sessione scritta nei metadati della sessione persistita |
| `parentSessionKey`      | Genitore per sessioni ramificate/con thread                |
| `modelParentSessionKey` | Genitore lato modello per sessioni ramificate              |
| `mainSessionKey`        | Pin del proprietario della DM principale per conversazioni dirette |
| `createIfMissing`       | Consenti al passaggio di registrazione di creare una riga di sessione mancante |

### ReplyPlanFacts

| Campo                     | Scopo                                                   |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Destinazione logica della risposta scritta nel contesto `To` |
| `originatingTo`           | Destinazione del contesto di origine (`OriginatingTo`)  |
| `nativeChannelId`         | ID del canale nativo della piattaforma per la consegna  |
| `replyTarget`             | Destinazione finale della risposta visibile se diversa da `to` |
| `deliveryTarget`          | Override di consegna di livello inferiore               |
| `replyToId`               | ID del messaggio citato/ancorato                        |
| `replyToIdFull`           | ID citato in forma completa quando la piattaforma ha entrambi |
| `messageThreadId`         | ID del thread al momento della consegna                 |
| `threadParentId`          | ID del messaggio genitore del thread                    |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` oppure `none`    |

### AccessFacts

`AccessFacts` trasporta i booleani necessari alla fase di autorizzazione. La corrispondenza dell'identita rimane nel canale: il kernel consuma solo il risultato.

| Campo      | Scopo                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decisione di consenso/associazione/rifiuto DM ed elenco `allowFrom`       |
| `group`    | Policy di gruppo, consenso route, consenso mittente, allowlist, requisito di menzione |
| `commands` | Autorizzazione dei comandi tra gli autorizzatori configurati              |
| `mentions` | Se il rilevamento delle menzioni e possibile e se l'agente e stato menzionato |

### MessageFacts

| Campo            | Scopo                                                       |
| ---------------- | ----------------------------------------------------------- |
| `body`           | Corpo finale dell'envelope (formattato)                     |
| `rawBody`        | Corpo inbound grezzo                                        |
| `bodyForAgent`   | Corpo visto dall'agente                                     |
| `commandBody`    | Corpo usato per il parsing dei comandi                      |
| `envelopeFrom`   | Etichetta mittente pre-renderizzata per l'envelope          |
| `senderLabel`    | Override opzionale per il mittente renderizzato             |
| `preview`        | Anteprima breve redatta per i log                           |
| `inboundHistory` | Voci recenti della cronologia inbound quando il canale mantiene un buffer |

### SupplementalContextFacts

Il contesto supplementare copre contesto di citazione, inoltro e bootstrap del thread. Il kernel applica la policy `contextVisibility` configurata. L'adapter del canale fornisce solo fatti e flag `senderAllowed`, cosi la policy cross-channel resta coerente.

### InboundMediaFacts

I media sono modellati come fatti. Download della piattaforma, auth, policy SSRF, regole CDN e decrittazione restano locali al canale. Il kernel mappa i fatti in `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` e `MediaTranscribedIndexes`.

## Contratto dell'adapter

Per `run` completo, la forma dell'adapter e:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` restituisce un `ChannelTurnResolved`, che e un `AssembledChannelTurn` con un tipo di ammissione opzionale. Restituire `{ admission: { kind: "observeOnly" } }` esegue il turno senza produrre output visibile. L'adapter possiede ancora la callback di consegna; diventa solo una no-op per quel turno.

`onFinalize` viene eseguito su ogni risultato, inclusi gli errori di dispatch. Usalo per cancellare la cronologia di gruppo in sospeso, rimuovere le reazioni di ack, fermare gli indicatori di stato e svuotare lo stato locale.

## Adapter di consegna

Il kernel non chiama direttamente la piattaforma. Il canale passa al kernel un `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` viene chiamato una volta per ogni chunk di risposta bufferizzato. Durante la migrazione del ciclo di vita dei messaggi, la consegna dei channel-turn assemblati e di proprieta del canale per impostazione predefinita: un campo `durable` omesso significa che il kernel deve chiamare direttamente `deliver` e non deve instradare tramite la consegna outbound generica. Imposta `durable` solo dopo che il canale e stato auditato per dimostrare che il percorso di invio generico preserva il vecchio comportamento di consegna, inclusi destinazioni di risposta/thread, gestione dei media, cache dei messaggi inviati/self-echo, pulizia dello stato e ID dei messaggi restituiti. `durable: false` rimane una grafia di compatibilita per "usa la callback di proprieta del canale", ma i canali non migrati non dovrebbero avere bisogno di aggiungerla. Restituisci gli ID dei messaggi della piattaforma quando il canale li ha, cosi il dispatcher puo preservare gli ancoraggi dei thread e modificare chunk successivi; i percorsi di consegna piu recenti dovrebbero restituire anche `receipt` cosi recovery, finalizzazione dell'anteprima e soppressione dei duplicati possono spostarsi fuori da `messageIds`. Per turni solo di osservazione, restituisci `{ visibleReplySent: false }` o usa `createNoopChannelTurnDeliveryAdapter()`.

I canali che usano `runPrepared` con un dispatcher interamente di proprieta del canale non hanno un `ChannelTurnDeliveryAdapter`. Questi dispatcher non sono durable per impostazione predefinita. Dovrebbero mantenere il loro percorso di consegna diretto finche non effettuano esplicitamente l'opt-in al nuovo contesto di invio con una destinazione completa, un adapter replay-safe, un contratto di ricevuta e hook per effetti collaterali del canale.

Gli helper di compatibilita pubblici come `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e gli helper direct-DM devono restare behavior-preserving durante la migrazione. Non dovrebbero chiamare la consegna durable generica prima delle callback `deliver` o `reply` di proprieta del chiamante.

## Opzioni di registrazione

La fase di registrazione incapsula `recordInboundSession`. La maggior parte dei canali puo usare i valori predefiniti. Effettua override tramite `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Il dispatcher attende la fase di registrazione. Se la registrazione lancia un errore, il kernel esegue `onPreDispatchFailure` (quando fornito a `runPrepared`) e rilancia.

## Osservabilita

Ogni fase emette un evento strutturato quando viene fornita una callback `log`:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Fasi registrate: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita di registrare nei log i corpi grezzi; usa `MessageFacts.preview` per anteprime brevi redatte.

## Cosa resta locale al canale

Il kernel possiede l'orchestrazione. Il canale possiede ancora:

- Trasporti della piattaforma (Gateway, REST, websocket, polling, Webhook)
- Risoluzione dell'identita e corrispondenza dei nomi visualizzati
- Comandi nativi, comandi slash, completamento automatico, modali, pulsanti, stato vocale
- Rendering di schede, modali e adaptive card
- Auth dei media, regole CDN, media cifrati, trascrizione
- API di modifica, reazione, redazione e presenza
- Backfill e recupero della cronologia lato piattaforma
- Flussi di associazione che richiedono verifica specifica della piattaforma

Se due canali iniziano ad avere bisogno dello stesso helper per uno di questi aspetti, estrai un helper SDK condiviso invece di inserirlo nel kernel.

## Stabilita

`runtime.channel.turn.*` fa parte della superficie runtime pubblica dei Plugin. I tipi di fatto (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) e le forme di ammissione (`ChannelTurnAdmission`, `ChannelEventClass`) sono raggiungibili tramite `PluginRuntime` da `openclaw/plugin-sdk/core`.

Si applicano le regole di compatibilita all'indietro: i nuovi campi di fatto sono additivi, i tipi di ammissione non vengono rinominati e i nomi degli entry point restano stabili. Le nuove esigenze dei canali che richiedono una modifica non additiva devono passare attraverso il processo di migrazione del plugin SDK.

## Correlati

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) per il ciclo di vita pianificato di invio/ricezione/live che incapsulera questo kernel
- [Creare Plugin di canale](/it/plugins/sdk-channel-plugins) per il contratto piu ampio dei Plugin di canale
- [Helper runtime dei Plugin](/it/plugins/sdk-runtime) per altre superfici `runtime.*`
- [Internals dei Plugin](/it/plugins/architecture-internals) per pipeline di caricamento e meccaniche del registro
