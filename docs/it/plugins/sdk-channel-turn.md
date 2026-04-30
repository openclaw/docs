---
read_when:
    - Stai creando un plugin di canale e vuoi il ciclo di vita condiviso del turno in ingresso
    - Stai migrando un monitor di canale per abbandonare il codice di collegamento record/dispatch scritto a mano
    - Devi comprendere le fasi di ammissione, ingestione, classificazione, verifica preliminare, risoluzione, registrazione, smistamento e finalizzazione
sidebarTitle: Channel turn
summary: runtime.channel.turn -- il nucleo condiviso dei turni in ingresso che i plugin di canale inclusi e di terze parti usano per registrare, instradare e finalizzare i turni dell'agente
title: Nucleo del turno del canale
x-i18n:
    generated_at: "2026-04-30T09:05:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Il kernel dei turni di canale è la macchina a stati inbound condivisa che trasforma un evento di piattaforma normalizzato in un turno dell'agente. I plugin di canale forniscono i fatti della piattaforma e il callback di consegna. Il core possiede l'orchestrazione: ingestione, classificazione, preflight, risoluzione, autorizzazione, assemblaggio, registrazione, dispatch e finalizzazione.

Usalo quando il tuo plugin si trova nel percorso critico dei messaggi inbound. Per eventi non di messaggistica (comandi slash, modali, interazioni con pulsanti, eventi del ciclo di vita, reazioni, stato vocale), mantienili locali al plugin. Il kernel possiede solo gli eventi che possono diventare un turno testuale dell'agente.

<Info>
  Il kernel viene raggiunto tramite il runtime del plugin iniettato come `runtime.channel.turn.*`. Il tipo del runtime del plugin è esportato da `openclaw/plugin-sdk/core`, quindi i plugin nativi di terze parti possono usare questi punti di ingresso nello stesso modo dei plugin di canale in bundle.
</Info>

## Perché un kernel condiviso

I plugin di canale ripetono lo stesso flusso inbound: normalizzare, instradare, applicare i gate, creare un contesto, registrare i metadati della sessione, eseguire il dispatch del turno dell'agente, finalizzare lo stato di consegna. Senza un kernel condiviso, una modifica al gate delle menzioni, alle risposte visibili solo per strumenti, ai metadati di sessione, alla cronologia in sospeso o alla finalizzazione del dispatch deve essere applicata per ogni canale.

Il kernel mantiene deliberatamente separati quattro concetti:

- `ConversationFacts`: da dove proviene il messaggio
- `RouteFacts`: quale agente e quale sessione devono elaborarlo
- `ReplyPlanFacts`: dove devono andare le risposte visibili
- `MessageFacts`: quale corpo e quale contesto supplementare deve vedere l'agente

DM Slack, topic Telegram, thread Matrix e sessioni di topic Feishu li distinguono tutti nella pratica. Trattarli come un unico identificatore causa deriva nel tempo.

## Ciclo di vita degli stadi

Il kernel esegue la stessa pipeline fissa indipendentemente dal canale:

1. `ingest` -- l'adapter converte un evento di piattaforma grezzo in `NormalizedTurnInput`
2. `classify` -- l'adapter dichiara se questo evento può avviare un turno dell'agente
3. `preflight` -- l'adapter esegue deduplicazione, self-echo, idratazione, debounce, decrittazione, precompilazione parziale dei fatti
4. `resolve` -- l'adapter restituisce un turno completamente assemblato (route, piano di risposta, messaggio, consegna)
5. `authorize` -- policy di DM, gruppo, menzione e comando applicata ai fatti assemblati
6. `assemble` -- `FinalizedMsgContext` creato dai fatti tramite `buildContext`
7. `record` -- metadati della sessione inbound e ultima route persistiti
8. `dispatch` -- turno dell'agente eseguito tramite il dispatcher di blocchi bufferizzato
9. `finalize` -- `onFinalize` dell'adapter viene eseguito anche in caso di errore di dispatch

Ogni stadio emette un evento di log strutturato quando viene fornito un callback `log`. Vedi [Osservabilità](#observability).

## Tipi di ammissione

Il kernel non genera eccezioni quando un turno viene bloccato da un gate. Restituisce un `ChannelTurnAdmission`:

| Tipo          | Quando                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Il turno viene ammesso. Il turno dell'agente viene eseguito e il percorso di risposta visibile viene esercitato.                                    |
| `observeOnly` | Il turno viene eseguito end-to-end ma l'adapter di consegna non invia nulla di visibile. Usato per agenti osservatori broadcast e altri flussi multi-agente passivi. |
| `handled`     | Un evento di piattaforma è stato consumato localmente (ciclo di vita, reazione, pulsante, modale). Il kernel salta il dispatch.                     |
| `drop`        | Percorso di salto. Facoltativamente `recordHistory: true` mantiene il messaggio nella cronologia di gruppo in sospeso, così una menzione futura ha contesto. |

L'ammissione può provenire da `classify` (la classe dell'evento ha indicato che non può avviare un turno), da `preflight` (deduplicazione, self-echo, menzione mancante con registrazione della cronologia) o da `resolveTurn` stesso.

## Punti di ingresso

Il runtime espone tre punti di ingresso preferiti, così gli adapter possono optare per il livello che corrisponde al canale.

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

Usa quando il tuo canale può esprimere il proprio flusso inbound come `ChannelTurnAdapter<TRaw>`. L'adapter ha callback per `ingest`, `classify` facoltativo, `preflight` facoltativo, `resolveTurn` obbligatorio e `onFinalize` facoltativo.

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

`run` è la forma corretta quando il canale ha una logica di adapter ridotta e trae vantaggio dal possedere il ciclo di vita tramite hook.

### runPrepared

Usa quando il canale ha un dispatcher locale complesso con anteprime, retry, modifiche o bootstrap di thread che deve restare di proprietà del canale. Il kernel registra comunque la sessione inbound prima del dispatch ed espone un `DispatchedChannelTurnResult` uniforme.

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

Una funzione pura che mappa bundle di fatti in `FinalizedMsgContext`. Usala quando il tuo canale implementa manualmente parte della pipeline ma vuole una forma del contesto coerente.

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

`buildContext` è utile anche dentro i callback `resolveTurn` quando si assembla un turno per `run`.

<Note>
  Gli helper SDK deprecati come `dispatchInboundReplyWithBase` passano ancora tramite un helper di turno assemblato. Il nuovo codice dei plugin dovrebbe usare `run` o `runPrepared`.
</Note>

## Tipi di fatti

I fatti che il kernel consuma dal tuo adapter sono agnostici rispetto alla piattaforma. Traduci gli oggetti della piattaforma in queste forme prima di passarli al kernel.

### NormalizedTurnInput

| Campo             | Scopo                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| `id`              | ID messaggio stabile usato per deduplicazione e log                         |
| `timestamp`       | Epoch ms facoltativo                                                        |
| `rawText`         | Corpo come ricevuto dalla piattaforma                                       |
| `textForAgent`    | Corpo pulito facoltativo per l'agente (rimozione menzione, trim digitazione) |
| `textForCommands` | Corpo facoltativo usato per il parsing di `/command`                        |
| `raw`             | Riferimento pass-through facoltativo per callback adapter che richiedono l'originale |

### ChannelEventClass

| Campo                  | Scopo                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Se false il kernel restituisce `{ kind: "handled" }`                  |
| `requiresImmediateAck` | Suggerimento per adapter che devono inviare ACK prima del dispatch    |

### SenderFacts

| Campo          | Scopo                                                        |
| -------------- | ------------------------------------------------------------ |
| `id`           | ID mittente stabile della piattaforma                        |
| `name`         | Nome visualizzato                                            |
| `username`     | Handle se distinto da `name`                                 |
| `tag`          | Discriminatore in stile Discord o tag della piattaforma      |
| `roles`        | ID dei ruoli, usati per il matching dell'allowlist dei ruoli dei membri |
| `isBot`        | True quando il mittente è un bot noto (il kernel lo usa per il drop) |
| `isSelf`       | True quando il mittente è l'agente configurato stesso        |
| `displayLabel` | Etichetta pre-renderizzata per il testo dell'envelope        |

### ConversationFacts

| Campo             | Scopo                                                               |
| ----------------- | ------------------------------------------------------------------- |
| `kind`            | `direct`, `group` o `channel`                                       |
| `id`              | ID conversazione usato per il routing                               |
| `label`           | Etichetta leggibile per l'envelope                                  |
| `spaceId`         | Identificatore facoltativo dello spazio esterno (workspace Slack, homeserver Matrix) |
| `parentId`        | ID conversazione esterna quando questa è un thread                  |
| `threadId`        | ID thread quando questo messaggio è dentro un thread                |
| `nativeChannelId` | ID canale nativo della piattaforma quando diverso dall'ID di routing |
| `routePeer`       | Peer usato per il lookup `resolveAgentRoute`                        |

### RouteFacts

| Campo                   | Scopo                                                       |
| ----------------------- | ----------------------------------------------------------- |
| `agentId`               | Agente che deve gestire questo turno                        |
| `accountId`             | Override facoltativo (canali multi-account)                 |
| `routeSessionKey`       | Chiave di sessione usata per il routing                     |
| `dispatchSessionKey`    | Chiave di sessione usata al dispatch quando diversa dalla chiave di route |
| `persistedSessionKey`   | Chiave di sessione scritta nei metadati di sessione persistiti |
| `parentSessionKey`      | Parent per sessioni ramificate/in thread                    |
| `modelParentSessionKey` | Parent lato modello per sessioni ramificate                 |
| `mainSessionKey`        | Pin del proprietario DM principale per conversazioni dirette |
| `createIfMissing`       | Consenti allo step di registrazione di creare una riga di sessione mancante |

### ReplyPlanFacts

| Campo                     | Scopo                                                   |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Destinazione logica della risposta scritta nel contesto `To` |
| `originatingTo`           | Destinazione del contesto di origine (`OriginatingTo`)  |
| `nativeChannelId`         | ID del canale nativo della piattaforma per la consegna  |
| `replyTarget`             | Destinazione finale della risposta visibile se diversa da `to` |
| `deliveryTarget`          | Override di consegna di livello inferiore               |
| `replyToId`               | ID del messaggio citato/ancorato                        |
| `replyToIdFull`           | ID citato in forma completa quando la piattaforma li ha entrambi |
| `messageThreadId`         | ID del thread al momento della consegna                 |
| `threadParentId`          | ID del messaggio padre del thread                       |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` o `none`         |

### AccessFacts

`AccessFacts` contiene i booleani necessari allo stadio di autorizzazione. La corrispondenza dell'identità resta nel canale: il kernel consuma solo il risultato.

| Campo      | Scopo                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decisione di consenso/associazione/rifiuto DM ed elenco `allowFrom`       |
| `group`    | Criterio di gruppo, consenso della rotta, consenso del mittente, allowlist, requisito di menzione |
| `commands` | Autorizzazione dei comandi tra gli autorizzatori configurati              |
| `mentions` | Se il rilevamento delle menzioni è possibile e se l'agente è stato menzionato |

### MessageFacts

| Campo            | Scopo                                                        |
| ---------------- | ------------------------------------------------------------ |
| `body`           | Corpo finale dell'envelope (formattato)                      |
| `rawBody`        | Corpo inbound grezzo                                         |
| `bodyForAgent`   | Corpo visto dall'agente                                      |
| `commandBody`    | Corpo usato per il parsing dei comandi                       |
| `envelopeFrom`   | Etichetta del mittente pre-renderizzata per l'envelope       |
| `senderLabel`    | Override facoltativo per il mittente renderizzato            |
| `preview`        | Breve anteprima oscurata per i log                           |
| `inboundHistory` | Voci recenti della cronologia inbound quando il canale mantiene un buffer |

### SupplementalContextFacts

Il contesto supplementare copre il contesto di citazione, inoltro e bootstrap del thread. Il kernel applica il criterio `contextVisibility` configurato. L'adapter del canale fornisce solo i fatti e i flag `senderAllowed`, così il criterio cross-channel resta coerente.

### InboundMediaFacts

I media hanno la forma di fatti. Download dalla piattaforma, autenticazione, criterio SSRF, regole CDN e decrittazione restano locali al canale. Il kernel mappa i fatti in `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` e `MediaTranscribedIndexes`.

## Contratto dell'adapter

Per `run` completo, la forma dell'adapter è:

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

`resolveTurn` restituisce un `ChannelTurnResolved`, che è un `AssembledChannelTurn` con un tipo di ammissione facoltativo. Restituire `{ admission: { kind: "observeOnly" } }` esegue il turno senza produrre output visibile. L'adapter possiede ancora la callback di consegna; semplicemente diventa una no-op per quel turno.

`onFinalize` viene eseguito su ogni risultato, inclusi gli errori di dispatch. Usalo per svuotare la cronologia di gruppo in sospeso, rimuovere le reazioni di ack, fermare gli indicatori di stato e scaricare lo stato locale.

## Adapter di consegna

Il kernel non chiama direttamente la piattaforma. Il canale passa al kernel un `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` viene chiamato una volta per ogni chunk di risposta nel buffer. Restituisci gli ID dei messaggi della piattaforma quando il canale li possiede, così il dispatcher può preservare gli ancoraggi del thread e modificare i chunk successivi. Per i turni di sola osservazione, restituisci `{ visibleReplySent: false }` oppure usa `createNoopChannelTurnDeliveryAdapter()`.

## Opzioni di registrazione

Lo stadio di registrazione avvolge `recordInboundSession`. La maggior parte dei canali può usare i valori predefiniti. Esegui l'override tramite `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Il dispatcher attende lo stadio di registrazione. Se la registrazione genera un'eccezione, il kernel esegue `onPreDispatchFailure` (quando fornito a `runPrepared`) e rilancia l'eccezione.

## Osservabilità

Ogni stadio emette un evento strutturato quando viene fornita una callback `log`:

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

Stadi registrati nei log: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita di registrare nei log i corpi grezzi; usa `MessageFacts.preview` per brevi anteprime oscurate.

## Cosa resta locale al canale

Il kernel possiede l'orchestrazione. Il canale possiede ancora:

- Trasporti della piattaforma (gateway, REST, websocket, polling, webhook)
- Risoluzione dell'identità e corrispondenza dei nomi visualizzati
- Comandi nativi, comandi slash, completamento automatico, modali, pulsanti, stato vocale
- Rendering di card, modali e adaptive card
- Autenticazione dei media, regole CDN, media crittografati, trascrizione
- API di modifica, reazione, oscuramento e presenza
- Backfill e recupero della cronologia lato piattaforma
- Flussi di associazione che richiedono verifica specifica della piattaforma

Se due canali iniziano ad avere bisogno dello stesso helper per uno di questi aspetti, estrai un helper SDK condiviso invece di inserirlo nel kernel.

## Stabilità

`runtime.channel.turn.*` fa parte della superficie pubblica del runtime dei plugin. I tipi di fatto (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) e le forme di ammissione (`ChannelTurnAdmission`, `ChannelEventClass`) sono raggiungibili tramite `PluginRuntime` da `openclaw/plugin-sdk/core`.

Si applicano le regole di compatibilità all'indietro: i nuovi campi dei fatti sono additivi, i tipi di ammissione non vengono rinominati e i nomi degli entry point restano stabili. Le nuove esigenze dei canali che richiedono una modifica non additiva devono passare attraverso il processo di migrazione dell'SDK dei plugin.

## Correlati

- [Creazione di plugin di canale](/it/plugins/sdk-channel-plugins) per il contratto più ampio dei plugin di canale
- [Helper del runtime dei plugin](/it/plugins/sdk-runtime) per altre superfici `runtime.*`
- [Elementi interni dei plugin](/it/plugins/architecture-internals) per la pipeline di caricamento e la meccanica del registro
