---
read_when:
    - Stai creando un Plugin di canale e vuoi il ciclo di vita condiviso del turno in ingresso
    - Stai migrando un monitor di canale dal codice di collegamento record/dispatch scritto a mano
    - È necessario comprendere le fasi di ammissione, ingestione, classificazione, verifica preliminare, risoluzione, registrazione, smistamento e finalizzazione.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- il kernel condiviso dei turni in ingresso che i Plugin di canale inclusi e di terze parti usano per registrare, inviare e finalizzare i turni degli agenti
title: Kernel del turno del canale
x-i18n:
    generated_at: "2026-05-06T09:02:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Il kernel dei turni di canale è la macchina a stati in ingresso condivisa che trasforma un evento di piattaforma normalizzato in un turno dell'agente. I Plugin di canale forniscono i fatti della piattaforma e la callback di consegna. Il core possiede l'orchestrazione: acquisizione, classificazione, preflight, risoluzione, autorizzazione, assemblaggio, registrazione, dispatch e finalizzazione.

Usalo quando il tuo Plugin si trova sul percorso critico dei messaggi in ingresso. Per gli eventi che non sono messaggi (comandi slash, modali, interazioni con pulsanti, eventi di ciclo di vita, reazioni, stato vocale), mantienili locali al Plugin. Il kernel possiede solo gli eventi che possono diventare un turno di testo dell'agente.

<Info>
  Il kernel viene raggiunto tramite il runtime del Plugin iniettato come `runtime.channel.turn.*`. Il tipo runtime del Plugin è esportato da `openclaw/plugin-sdk/core`, quindi i Plugin nativi di terze parti possono usare questi punti di ingresso nello stesso modo dei Plugin di canale inclusi.
</Info>

## Perché un kernel condiviso

I Plugin di canale ripetono lo stesso flusso in ingresso: normalizzare, instradare, applicare i controlli, costruire un contesto, registrare i metadati di sessione, eseguire il dispatch del turno dell'agente, finalizzare lo stato di consegna. Senza un kernel condiviso, una modifica al controllo delle menzioni, alle risposte visibili solo per strumenti, ai metadati di sessione, alla cronologia in sospeso o alla finalizzazione del dispatch deve essere applicata per ogni canale.

Il kernel mantiene deliberatamente separati quattro concetti:

- `ConversationFacts`: da dove proviene il messaggio
- `RouteFacts`: quale agente e quale sessione devono elaborarlo
- `ReplyPlanFacts`: dove devono andare le risposte visibili
- `MessageFacts`: quale corpo e quale contesto supplementare deve vedere l'agente

I messaggi diretti di Slack, gli argomenti di Telegram, i thread di Matrix e le sessioni per argomento di Feishu distinguono tutti questi aspetti nella pratica. Trattarli come un unico identificatore causa divergenze nel tempo.

## Ciclo di vita delle fasi

Il kernel esegue la stessa pipeline fissa indipendentemente dal canale:

1. `ingest` -- l'adattatore converte un evento di piattaforma grezzo in `NormalizedTurnInput`
2. `classify` -- l'adattatore dichiara se questo evento può avviare un turno dell'agente
3. `preflight` -- l'adattatore esegue deduplicazione, auto-eco, idratazione, debounce, decrittografia, precompilazione parziale dei fatti
4. `resolve` -- l'adattatore restituisce un turno completamente assemblato (rotta, piano di risposta, messaggio, consegna)
5. `authorize` -- criterio per messaggi diretti, gruppi, menzioni e comandi applicato ai fatti assemblati
6. `assemble` -- `FinalizedMsgContext` costruito dai fatti tramite `buildContext`
7. `record` -- metadati di sessione in ingresso e ultima rotta persistiti
8. `dispatch` -- turno dell'agente eseguito tramite il dispatcher di blocchi con buffer
9. `finalize` -- `onFinalize` dell'adattatore viene eseguito anche in caso di errore di dispatch

Ogni fase emette un evento di log strutturato quando viene fornita una callback `log`. Vedi [Osservabilità](#observability).

## Tipi di ammissione

Il kernel non genera un'eccezione quando un turno viene bloccato. Restituisce un `ChannelTurnAdmission`:

| Tipo          | Quando                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Il turno è ammesso. Il turno dell'agente viene eseguito e il percorso di risposta visibile viene esercitato.                                        |
| `observeOnly` | Il turno viene eseguito end-to-end ma l'adattatore di consegna non invia nulla di visibile. Usato per agenti osservatori broadcast e altri flussi multi-agente passivi. |
| `handled`     | Un evento di piattaforma è stato consumato localmente (ciclo di vita, reazione, pulsante, modale). Il kernel salta il dispatch.                     |
| `drop`        | Percorso di salto. Facoltativamente `recordHistory: true` mantiene il messaggio nella cronologia di gruppo in sospeso, così una futura menzione avrà contesto. |

L'ammissione può provenire da `classify` (la classe dell'evento ha indicato che non può avviare un turno), da `preflight` (deduplicazione, auto-eco, menzione mancante con registrazione della cronologia) o da `resolveTurn` stesso.

## Punti di ingresso

Il runtime espone tre punti di ingresso preferiti, così gli adattatori possono aderire al livello che corrisponde al canale.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Due helper runtime precedenti restano disponibili per compatibilità con il Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Usalo quando il tuo canale può esprimere il proprio flusso in ingresso come un `ChannelTurnAdapter<TRaw>`. L'adattatore ha callback per `ingest`, `classify` facoltativo, `preflight` facoltativo, `resolveTurn` obbligatorio e `onFinalize` facoltativo.

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

`run` è la forma giusta quando il canale ha una logica di adattatore contenuta e beneficia del controllo del ciclo di vita tramite hook.

### runPrepared

Usalo quando il canale ha un dispatcher locale complesso con anteprime, tentativi, modifiche o bootstrap dei thread che deve restare di proprietà del canale. Il kernel registra comunque la sessione in ingresso prima del dispatch ed espone un `DispatchedChannelTurnResult` uniforme.

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
  Gli helper SDK deprecati come `dispatchInboundReplyWithBase` continuano a passare tramite un helper di turno assemblato. Il nuovo codice dei Plugin dovrebbe usare `run` o `runPrepared`.
</Note>

## Tipi di fatti

I fatti che il kernel consuma dal tuo adattatore sono agnostici rispetto alla piattaforma. Traduci gli oggetti della piattaforma in queste forme prima di passarli al kernel.

### NormalizedTurnInput

| Campo             | Scopo                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID messaggio stabile usato per deduplicazione e log                           |
| `timestamp`       | Epoch ms facoltativo                                                          |
| `rawText`         | Corpo ricevuto dalla piattaforma                                              |
| `textForAgent`    | Corpo ripulito facoltativo per l'agente (rimozione menzione, trim di digitazione) |
| `textForCommands` | Corpo facoltativo usato per il parsing di `/command`                          |
| `raw`             | Riferimento pass-through facoltativo per callback dell'adattatore che necessitano dell'originale |

### ChannelEventClass

| Campo                  | Scopo                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Se false, il kernel restituisce `{ kind: "handled" }`                  |
| `requiresImmediateAck` | Suggerimento per adattatori che devono inviare un ACK prima del dispatch |

### SenderFacts

| Campo          | Scopo                                                             |
| -------------- | ----------------------------------------------------------------- |
| `id`           | ID mittente stabile della piattaforma                             |
| `name`         | Nome visualizzato                                                 |
| `username`     | Handle se distinto da `name`                                      |
| `tag`          | Discriminatore in stile Discord o tag della piattaforma           |
| `roles`        | ID ruolo, usati per la corrispondenza della allowlist dei ruoli dei membri |
| `isBot`        | True quando il mittente è un bot noto (il kernel lo usa per lo scarto) |
| `isSelf`       | True quando il mittente è l'agente configurato stesso             |
| `displayLabel` | Etichetta pre-renderizzata per il testo dell'involucro            |

### ConversationFacts

| Campo             | Scopo                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `kind`            | `direct`, `group` o `channel`                                         |
| `id`              | ID conversazione usato per l'instradamento                            |
| `label`           | Etichetta leggibile per l'involucro                                   |
| `spaceId`         | Identificatore dello spazio esterno facoltativo (workspace Slack, homeserver Matrix) |
| `parentId`        | ID della conversazione esterna quando si tratta di un thread          |
| `threadId`        | ID thread quando questo messaggio è dentro un thread                  |
| `nativeChannelId` | ID canale nativo della piattaforma quando diverso dall'ID di instradamento |
| `routePeer`       | Peer usato per la ricerca `resolveAgentRoute`                         |

### RouteFacts

| Campo                   | Scopo                                                       |
| ----------------------- | ----------------------------------------------------------- |
| `agentId`               | Agente che deve gestire questo turno                        |
| `accountId`             | Override facoltativo (canali multi-account)                 |
| `routeSessionKey`       | Chiave di sessione usata per l'instradamento                |
| `dispatchSessionKey`    | Chiave di sessione usata al dispatch quando diversa dalla chiave di rotta |
| `persistedSessionKey`   | Chiave di sessione scritta nei metadati di sessione persistiti |
| `parentSessionKey`      | Genitore per sessioni ramificate/con thread                 |
| `modelParentSessionKey` | Genitore lato modello per sessioni ramificate               |
| `mainSessionKey`        | Pin del proprietario DM principale per conversazioni dirette |
| `createIfMissing`       | Consente alla fase di registrazione di creare una riga di sessione mancante |

### ReplyPlanFacts

| Campo                     | Scopo                                                   |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Destinazione logica della risposta scritta nel contesto `To` |
| `originatingTo`           | Destinazione del contesto di origine (`OriginatingTo`)  |
| `nativeChannelId`         | ID del canale nativo della piattaforma per la consegna  |
| `replyTarget`             | Destinazione finale della risposta visibile se differisce da `to` |
| `deliveryTarget`          | Override di consegna di livello inferiore               |
| `replyToId`               | ID del messaggio citato/ancorato                        |
| `replyToIdFull`           | ID citato in forma completa quando la piattaforma li ha entrambi |
| `messageThreadId`         | ID del thread al momento della consegna                 |
| `threadParentId`          | ID del messaggio padre del thread                       |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` o `none`         |

### AccessFacts

`AccessFacts` contiene i booleani necessari alla fase di autorizzazione. La corrispondenza dell'identità resta nel canale: il kernel consuma solo il risultato.

| Campo      | Scopo                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decisione di consenso/associazione/rifiuto per DM ed elenco `allowFrom`   |
| `group`    | Criterio di gruppo, consenso della route, consenso del mittente, allowlist, requisito di menzione |
| `commands` | Autorizzazione dei comandi tra gli autorizzatori configurati              |
| `mentions` | Se il rilevamento delle menzioni è possibile e se l'agente è stato menzionato |

### MessageFacts

| Campo            | Scopo                                                        |
| ---------------- | ------------------------------------------------------------ |
| `body`           | Corpo finale dell'envelope (formattato)                      |
| `rawBody`        | Corpo in ingresso grezzo                                     |
| `bodyForAgent`   | Corpo visto dall'agente                                      |
| `commandBody`    | Corpo usato per il parsing dei comandi                       |
| `envelopeFrom`   | Etichetta del mittente pre-renderizzata per l'envelope       |
| `senderLabel`    | Override opzionale per il mittente renderizzato              |
| `preview`        | Breve anteprima oscurata per i log                           |
| `inboundHistory` | Voci recenti della cronologia in ingresso quando il canale mantiene un buffer |

### SupplementalContextFacts

Il contesto supplementare copre il contesto di citazione, inoltro e bootstrap del thread. Il kernel applica il criterio `contextVisibility` configurato. L'adattatore del canale fornisce solo fatti e flag `senderAllowed`, così il criterio tra canali resta coerente.

### InboundMediaFacts

I media sono modellati come fatti. Download della piattaforma, autenticazione, criterio SSRF, regole CDN e decrittazione restano locali al canale. Il kernel mappa i fatti in `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` e `MediaTranscribedIndexes`.

## Contratto dell'adattatore

Per `run` completo, la forma dell'adattatore è:

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

`resolveTurn` restituisce un `ChannelTurnResolved`, cioè un `AssembledChannelTurn` con un tipo di ammissione opzionale. Restituire `{ admission: { kind: "observeOnly" } }` esegue il turno senza produrre output visibile. L'adattatore possiede ancora la callback di consegna; diventa semplicemente una no-op per quel turno.

`onFinalize` viene eseguito su ogni risultato, inclusi gli errori di dispatch. Usalo per cancellare la cronologia di gruppo in sospeso, rimuovere le reazioni di ack, fermare gli indicatori di stato e svuotare lo stato locale.

## Adattatore di consegna

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

`deliver` viene chiamato una volta per ogni chunk di risposta bufferizzato. Durante la migrazione del ciclo di vita dei messaggi, la consegna del turno di canale assemblato è di proprietà del canale per impostazione predefinita: un campo `durable` omesso significa che il kernel deve chiamare direttamente `deliver` e non deve passare attraverso la consegna in uscita generica. Imposta `durable` solo dopo che il canale è stato sottoposto ad audit per dimostrare che il percorso di invio generico preserva il comportamento di consegna precedente, inclusi destinazioni di risposta/thread, gestione dei media, cache dei messaggi inviati/self-echo, pulizia dello stato e ID dei messaggi restituiti. `durable: false` resta una grafia di compatibilità per "usa la callback di proprietà del canale", ma i canali non migrati non dovrebbero aver bisogno di aggiungerla. Restituisci gli ID dei messaggi della piattaforma quando il canale li ha, così il dispatcher può preservare gli ancoraggi del thread e modificare i chunk successivi; anche i percorsi di consegna più recenti dovrebbero restituire `receipt`, così recupero, finalizzazione dell'anteprima e soppressione dei duplicati possono migrare da `messageIds`. Per i turni solo osservazione, restituisci `{ visibleReplySent: false }` oppure usa `createNoopChannelTurnDeliveryAdapter()`.

I canali che usano `runPrepared` con un dispatcher interamente di proprietà del canale non hanno un `ChannelTurnDeliveryAdapter`. Quei dispatcher non sono durable per impostazione predefinita. Dovrebbero mantenere il proprio percorso di consegna diretto finché non aderiscono esplicitamente al nuovo contesto di invio con una destinazione completa, un adattatore sicuro per replay, un contratto di ricevuta e hook per gli effetti collaterali del canale.

Gli helper di compatibilità pubblici come `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` e gli helper direct-DM devono preservare il comportamento durante la migrazione. Non dovrebbero chiamare la consegna durable generica prima delle callback `deliver` o `reply` di proprietà del chiamante.

## Opzioni di registrazione

La fase di registrazione avvolge `recordInboundSession`. La maggior parte dei canali può usare i valori predefiniti. Esegui l'override tramite `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Il dispatcher attende la fase di registrazione. Se la registrazione genera un errore, il kernel esegue `onPreDispatchFailure` (quando fornito a `runPrepared`) e rilancia l'errore.

## Osservabilità

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

Fasi registrate nei log: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita di registrare i corpi grezzi; usa `MessageFacts.preview` per brevi anteprime oscurate.

## Cosa resta locale al canale

Il kernel possiede l'orchestrazione. Il canale possiede ancora:

- Trasporti della piattaforma (Gateway, REST, websocket, polling, Webhook)
- Risoluzione dell'identità e corrispondenza del nome visualizzato
- Comandi nativi, slash command, completamento automatico, modali, pulsanti, stato vocale
- Rendering di card, modali e adaptive card
- Autenticazione dei media, regole CDN, media crittografati, trascrizione
- API di modifica, reazione, redazione e presenza
- Backfill e recupero della cronologia lato piattaforma
- Flussi di associazione che richiedono verifica specifica della piattaforma

Se due canali iniziano ad avere bisogno dello stesso helper per uno di questi aspetti, estrai un helper SDK condiviso invece di spingerlo nel kernel.

## Stabilità

`runtime.channel.turn.*` fa parte della superficie pubblica del runtime dei plugin. I tipi di fatto (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) e le forme di ammissione (`ChannelTurnAdmission`, `ChannelEventClass`) sono raggiungibili tramite `PluginRuntime` da `openclaw/plugin-sdk/core`.

Si applicano le regole di compatibilità all'indietro: i nuovi campi dei fatti sono additivi, i tipi di ammissione non vengono rinominati e i nomi degli entry point restano stabili. Le nuove esigenze dei canali che richiedono una modifica non additiva devono passare attraverso il processo di migrazione dell'SDK dei plugin.

## Correlati

- [Refactor del ciclo di vita dei messaggi](/it/concepts/message-lifecycle-refactor) per il ciclo di vita pianificato di invio/ricezione/live che avvolgerà questo kernel
- [Creare plugin di canale](/it/plugins/sdk-channel-plugins) per il contratto più ampio dei plugin di canale
- [Helper del runtime dei plugin](/it/plugins/sdk-runtime) per altre superfici `runtime.*`
- [Elementi interni dei plugin](/it/plugins/architecture-internals) per la pipeline di caricamento e i meccanismi del registro
