---
read_when:
    - Stai creando o rifattorizzando un Plugin di canale di messaggistica
    - Ti servono la consegna persistente della risposta finale, le conferme di ricezione, la finalizzazione dell'anteprima live o un criterio di conferma della ricezione
    - Stai migrando dalla pipeline di risposta legacy o dagli helper di smistamento delle risposte in ingresso
summary: API del ciclo di vita dei messaggi per i Plugin di canale, inclusi invii persistenti, ricevute, anteprima in tempo reale, criterio di conferma di ricezione e migrazione dai sistemi precedenti
title: API dei messaggi del canale
x-i18n:
    generated_at: "2026-05-06T09:02:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

I plugin di canale dovrebbero esporre un adapter `message` da
`openclaw/plugin-sdk/channel-message`. L'adapter descrive il ciclo di vita dei
messaggi nativo supportato dalla piattaforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Il core possiede accodamento, durabilità, criteri generici di retry, hook,
ricevute e lo strumento `message` condiviso. Il plugin possiede chiamate native
di invio/modifica/eliminazione, normalizzazione del target, threading della
piattaforma, citazioni selezionate, flag di notifica, stato dell'account ed
effetti collaterali specifici della piattaforma.

Usa questa pagina insieme a [Creare plugin di canale](/it/plugins/sdk-channel-plugins).

Il sottopercorso `channel-message` è intenzionalmente abbastanza leggero per i
file di bootstrap dei plugin a caldo, come `channel.ts`: espone contratti degli
adapter, prove di capability, ricevute e facciate di compatibilità senza caricare
la consegna in uscita. Gli helper di consegna runtime sono disponibili da
`openclaw/plugin-sdk/channel-message-runtime` per percorsi di monitoraggio/invio
che stanno già eseguendo I/O di messaggi asincrono.

## Adapter minimale

La maggior parte dei nuovi plugin di canale può iniziare con un piccolo adapter:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Poi collegalo al plugin di canale:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Dichiara solo le capability che l'adapter preserva davvero. Ogni capability
dichiarata dovrebbe avere un test di contratto.

## Bridge in uscita

Se il canale ha già un adapter `outbound` compatibile, preferisci derivare
l'adapter dei messaggi invece di duplicare il codice di invio:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Il bridge converte i vecchi risultati di invio outbound in valori
`MessageReceipt`. Il nuovo codice dovrebbe passare le ricevute end to end e
derivare gli ID legacy solo ai margini di compatibilità con
`listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)`.
Se non viene fornito alcun criterio di ricezione, `createChannelMessageAdapterFromOutbound(...)`
usa il criterio di conferma ricezione `manual`. Questo rende esplicita la
conferma della piattaforma posseduta dal plugin senza modificare i canali che
confermano webhook, socket o offset di polling fuori dal contesto di ricezione
generico.

## Invii dello strumento Message

Il percorso condiviso `message(action="send")` dovrebbe usare lo stesso ciclo di
vita di consegna del core delle risposte finali. Se un canale richiede una
modellazione specifica del provider per l'invio dello strumento, implementa
`actions.prepareSendPayload(...)` invece di inviare da `actions.handleAction(...)`.

`prepareSendPayload(...)` riceve il `ReplyPayload` normalizzato dal core più il
contesto completo dell'azione. Restituisci un payload con dati specifici del
canale in `payload.channelData.<channel>` e lascia che il core chiami
`sendMessage(...)`, `deliverOutboundPayloads(...)`, la coda write-ahead, gli hook
di invio messaggi, retry, recovery e pulizia dell'ack.

Restituisci `null` solo quando l'invio non può essere rappresentato come payload
durabile, per esempio perché contiene una factory di componenti non
serializzabile. Il core manterrà il fallback dell'azione plugin legacy per
compatibilità, ma le nuove funzionalità di invio del canale dovrebbero essere
esprimibili come dati di payload durabili.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

L'adapter outbound legge quindi `payload.channelData.demo` dentro `sendPayload`.
Questo mantiene il rendering specifico della piattaforma nel plugin mentre il
core continua a possedere persistenza, retry, recovery, hook e ack.

I payload preparati `message(action="send")` e la consegna generica della
risposta finale usano la consegna del core con accodamento best-effort per
impostazione predefinita. L'accodamento durabile richiesto è valido solo dopo
che il core verifica che il canale possa riconciliare un invio il cui esito è
ignoto dopo un crash. Se l'adapter non può implementare `reconcileUnknownSend`,
mantieni il percorso di invio preparato best-effort; il core tenterà comunque la
coda write-ahead, ma la persistenza della coda o il recovery incerto dopo crash
non fa parte del contratto di consegna richiesto.

## Capability finali durabili

La consegna finale durabile è opt-in per effetto collaterale. Il core userà la
consegna durabile generica solo quando l'adapter dichiara ogni capability
necessaria per il payload e per le opzioni di consegna.

| Capability             | Dichiara quando                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | L'adapter può inviare testo e restituire una ricevuta.                               |
| `media`                | Gli invii multimediali restituiscono ricevute per ogni messaggio visibile della piattaforma. |
| `payload`              | L'adapter preserva la semantica del payload di risposta ricco, non solo testo e un URL multimediale. |
| `replyTo`              | I target di risposta nativi raggiungono la piattaforma.                              |
| `thread`               | I target nativi di thread, argomento o thread di canale raggiungono la piattaforma.  |
| `silent`               | La soppressione delle notifiche raggiunge la piattaforma.                            |
| `nativeQuote`          | I metadati della citazione selezionata raggiungono la piattaforma.                   |
| `messageSendingHooks`  | Gli hook di invio messaggi del core possono annullare o riscrivere il contenuto prima dell'I/O della piattaforma. |
| `batch`                | I batch renderizzati in più parti sono riproducibili come un unico piano durabile.   |
| `reconcileUnknownSend` | L'adapter può risolvere il recovery `unknown_after_send` senza replay cieco.         |
| `afterSendSuccess`     | Gli effetti collaterali after-send locali del canale vengono eseguiti una volta.     |
| `afterCommit`          | Gli effetti collaterali after-commit locali del canale vengono eseguiti una volta.   |

La consegna finale best-effort non richiede `reconcileUnknownSend`; usa il ciclo
di vita condiviso quando l'adapter preserva la semantica visibile del payload e
ripiega su I/O diretto della piattaforma se la persistenza della coda non è
disponibile. La consegna finale durabile richiesta deve richiedere esplicitamente
`reconcileUnknownSend`. Se l'adapter non può determinare se un invio
avviato/ignoto abbia raggiunto la piattaforma, non dichiarare quella capability;
il core rifiuterà la consegna durabile richiesta prima dell'accodamento.

Quando un chiamante richiede consegna durabile, deriva i requisiti invece di
creare mappe manualmente:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` è richiesto per impostazione predefinita. Imposta
`messageSendingHooks: false` solo per un percorso che intenzionalmente non può
eseguire hook globali di invio messaggi.

## Contratto di invio durabile

Un invio finale durabile ha semantiche più rigorose rispetto alla consegna
legacy posseduta dal canale:

- Crea l'intento durabile prima dell'I/O della piattaforma.
- Se la consegna durabile restituisce un risultato gestito, non ripiegare
  sull'invio legacy.
- Tratta l'annullamento da hook e i risultati no-send come terminali.
- Tratta `unsupported` come risultato pre-intento soltanto.
- Per la durabilità richiesta, fallisci prima dell'I/O della piattaforma se la
  coda non può registrare che l'invio alla piattaforma è iniziato.
- Per la consegna finale richiesta e gli invii preparati richiesti dello
  strumento message, esegui il preflight di `reconcileUnknownSend`; il recovery
  deve poter confermare un messaggio già inviato o rieseguire solo dopo che
  l'adapter prova che l'invio originale non è avvenuto.
- Per `best_effort`, gli errori di scrittura in coda possono ripiegare su I/O
  diretto della piattaforma.
- Inoltra i segnali di abort al caricamento dei media e agli invii della
  piattaforma.
- Esegui gli hook after-commit dopo l'ack della coda; il fallback diretto
  best-effort li esegue dopo I/O della piattaforma riuscito perché non esiste
  alcun commit di coda durabile.
- Restituisci ricevute per ogni ID di messaggio visibile della piattaforma.
- Usa `reconcileUnknownSend` quando una piattaforma può controllare se un invio
  incerto abbia già raggiunto l'utente.

Questo contratto evita invii duplicati dopo crash ed evita di bypassare gli hook
di annullamento dell'invio messaggi.

## Ricevute

`MessageReceipt` è il nuovo record interno di ciò che la piattaforma ha accettato:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Usa `createMessageReceiptFromOutboundResults(...)` quando adatti un risultato di
invio esistente. Usa `createPreviewMessageReceipt(...)` quando un messaggio di
anteprima live diventa la ricevuta finale. Evita di aggiungere nuovi campi
`messageIds` locali al proprietario. Il legacy `ChannelDeliveryResult.messageIds`
viene ancora prodotto ai margini di compatibilità.

## Anteprima live

I canali che trasmettono anteprime bozza o aggiornamenti di avanzamento
dovrebbero dichiarare capability live:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Usa `defineFinalizableLivePreviewAdapter(...)` e
`deliverWithFinalizableLivePreviewAdapter(...)` per la finalizzazione runtime. Il
finalizzatore decide se la risposta finale modifica l'anteprima sul posto, invia
un fallback normale, elimina lo stato di anteprima in sospeso, mantiene una
modifica fallita ambigua senza duplicare il messaggio e restituisce la ricevuta
finale.

## Criterio di ack in ricezione

I receiver inbound che controllano la tempistica della conferma della
piattaforma dovrebbero dichiarare il criterio di ricezione:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Gli adapter che non dichiarano un criterio di ricezione usano per impostazione
predefinita:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Usa il valore predefinito quando la piattaforma non ha alcuna conferma da differire, conferma già prima dell'elaborazione asincrona o richiede semantiche di risposta specifiche del protocollo. Dichiara una delle policy a fasi solo quando il receiver usa effettivamente il contesto di ricezione per spostare più avanti la conferma della piattaforma.

Policy:

| Policy                 | Usare quando                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | La piattaforma può essere confermata dopo che l'evento in ingresso è stato analizzato e registrato. |
| `after_agent_dispatch` | La piattaforma deve attendere finché il dispatch dell'agent non è stato accettato.       |
| `after_durable_send`   | La piattaforma deve attendere finché la consegna finale non ha una decisione durevole.   |
| `manual`               | Il Plugin possiede la conferma perché le semantiche della piattaforma non corrispondono a una fase generica. |

Usa `createMessageReceiveContext(...)` nei receiver che differiscono lo stato dell'ack, e `shouldAckMessageAfterStage(...)` quando il receiver deve verificare se una fase ha soddisfatto la policy configurata.

## Test di contratto

Le dichiarazioni di capacità fanno parte del contratto del Plugin. Supportale con test:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Aggiungi suite di prova live e di ricezione quando l'adapter dichiara queste funzionalità. Una prova mancante dovrebbe far fallire il test invece di ampliare silenziosamente la superficie durevole.

## API di compatibilità deprecate

Queste API restano importabili per la compatibilità con terze parti. Non usarle per nuovo codice di canale.

| API deprecata                                | Sostituzione                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` per dispatcher di compatibilità, oppure un adapter `message` per nuovo codice di canale |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` da `openclaw/plugin-sdk/channel-message-runtime`                   |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` solo per dispatcher di compatibilità                                      |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` solo per dispatcher di compatibilità                                        |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` più `deliverWithFinalizableLivePreviewAdapter(...)`                      |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

I dispatcher di compatibilità possono ancora usare `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` e `createTypingCallbacks(...)` tramite la facade dei messaggi. Il nuovo codice di lifecycle dovrebbe evitare il vecchio sottopercorso `channel-reply-pipeline`.

## Checklist di migrazione

1. Aggiungi `message: defineChannelMessageAdapter(...)` o
   `message: createChannelMessageAdapterFromOutbound(...)` al Plugin di canale.
2. Restituisci `MessageReceipt` dagli invii di testo, media e payload.
3. Dichiara solo capacità supportate da comportamento nativo e test.
4. Sostituisci le mappe dei requisiti durevoli scritte a mano con
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Sposta la finalizzazione dell'anteprima tramite gli helper di anteprima live quando il canale
   modifica i messaggi bozza sul posto.
6. Dichiara la policy di ack di ricezione solo quando il receiver può davvero differire la conferma della piattaforma.
7. Mantieni gli helper di dispatch delle risposte legacy solo ai confini di compatibilità.
