---
read_when:
    - Stai creando o rifattorizzando un Plugin per canale di messaggistica
    - Ti serve la consegna persistente della risposta finale, ricevute, la finalizzazione dell’anteprima in tempo reale o un criterio di conferma di ricezione
    - Stai migrando dalla pipeline di risposta legacy o dalle funzioni ausiliarie di instradamento delle risposte in ingresso
summary: API del ciclo di vita dei messaggi per i Plugin di canale, inclusi invii durevoli, ricevute, anteprima in tempo reale, criterio di conferma di ricezione e migrazione legacy
title: API dei messaggi dei canali
x-i18n:
    generated_at: "2026-05-10T19:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

I Plugin di canale dovrebbero esporre un adattatore `message` da
`openclaw/plugin-sdk/channel-message`. L'adattatore descrive il ciclo di vita del messaggio nativo
supportato dalla piattaforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Il core gestisce code, durabilità, policy di retry generica, hook, ricevute e lo
strumento `message` condiviso. Il Plugin gestisce chiamate native di invio/modifica/eliminazione, normalizzazione dei destinatari,
threading della piattaforma, citazioni selezionate, flag di notifica, stato dell'account
ed effetti collaterali specifici della piattaforma.

Usa questa pagina insieme a [Creare Plugin di canale](/it/plugins/sdk-channel-plugins).

Il sotto-percorso `channel-message` è intenzionalmente abbastanza leggero per i file di bootstrap dei Plugin
su percorsi caldi come `channel.ts`: espone contratti dell'adattatore, prove di capability,
ricevute e facade di compatibilità senza caricare la consegna in uscita.
Gli helper di consegna runtime sono disponibili da
`openclaw/plugin-sdk/channel-message-runtime` per percorsi di monitor/invio che
stanno già eseguendo I/O di messaggi asincrono.

Il nuovo codice di invio per canali e Plugin dovrebbe usare gli helper del ciclo di vita dei messaggi da
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` o `deliverInboundReplyWithMessageSendContext`.
Il vecchio helper
`deliverOutboundPayloads(...)` in `openclaw/plugin-sdk/outbound-runtime`
è un substrato di compatibilità/runtime deprecato per internals outbound, ripristino
e adattatori legacy. Non usarlo per nuovi percorsi di invio di canali o Plugin.

`sendDurableMessageBatch(...)` restituisce un esito esplicito del ciclo di vita:

- `sent` - almeno un messaggio visibile della piattaforma è stato consegnato.
- `suppressed` - nessun messaggio della piattaforma dovrebbe essere considerato mancante. I motivi stabili
  includono `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` e il legacy `no_visible_result`.
- `partial_failed` - almeno un messaggio della piattaforma è stato consegnato prima che un payload
  successivo o un effetto collaterale fallisse. Il risultato include il prefisso della ricevuta consegnata
  più l'errore.
- `failed` - non è stata prodotta alcuna ricevuta della piattaforma.

Usa `payloadOutcomes` quando un batch combina payload inviati, soppressi e falliti.
Non dedurre la cancellazione da parte degli hook controllando se il vecchio array di consegna diretta
è vuoto.

I dispatcher di compatibilità che hanno ancora bisogno del dispatcher di risposta bufferizzato dovrebbero
creare opzioni di prefisso risposta con `createChannelMessageReplyPipeline(...)` da
`openclaw/plugin-sdk/channel-message`, quindi chiamare
`channel.turn.runPrepared(...)` del runtime. Questo mantiene la registrazione della sessione e l'ordine del dispatch
nel ciclo di vita del turno condiviso senza aggiungere un altro wrapper pubblico del turno.

## Adattatore minimo

La maggior parte dei nuovi Plugin di canale può iniziare con un piccolo adattatore:

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

Poi collegalo al Plugin di canale:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Dichiara solo le capability che l'adattatore conserva davvero. Ogni capability dichiarata
dovrebbe avere un test di contratto.

## Bridge outbound

Se il canale ha già un adattatore `outbound` compatibile, preferisci derivare
l'adattatore message invece di duplicare il codice di invio:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Il bridge converte i vecchi risultati di invio outbound in valori `MessageReceipt`. Il nuovo
codice dovrebbe propagare le ricevute end to end e derivare gli id legacy solo ai margini
di compatibilità con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)`.
Se non viene fornita alcuna policy di ricezione, `createChannelMessageAdapterFromOutbound(...)`
usa la policy di riconoscimento ricezione `manual`. Questo rende esplicito il riconoscimento della piattaforma
gestito dal Plugin senza cambiare i canali che riconoscono Webhook,
socket o offset di polling fuori dal contesto di ricezione generico.

## Invii dello strumento message

Il percorso condiviso `message(action="send")` dovrebbe usare lo stesso ciclo di vita di consegna del core
delle risposte finali. Se un canale ha bisogno di una modellazione specifica del provider per l'invio
dello strumento, implementa `actions.prepareSendPayload(...)` invece di inviare da
`actions.handleAction(...)`.

`prepareSendPayload(...)` riceve il `ReplyPayload` normalizzato del core più il
contesto completo dell'azione. Restituisci un payload con dati specifici del canale in
`payload.channelData.<channel>` e lascia che il core chiami `sendMessage(...)`,
il runtime del ciclo di vita dei messaggi, la coda write-ahead, gli hook di invio messaggi,
retry, ripristino e pulizia degli ack. Il runtime del ciclo di vita può chiamare
`deliverOutboundPayloads(...)` internamente come substrato di compatibilità, ma i Plugin di canale
non dovrebbero chiamarlo direttamente per nuovo comportamento di invio.

Restituisci `null` solo quando l'invio non può essere rappresentato come payload durevole, per
esempio perché contiene una factory di componenti non serializzabile. Il core manterrà
il fallback dell'azione Plugin legacy per compatibilità, ma le nuove funzionalità di invio del canale
dovrebbero essere esprimibili come dati payload durevoli.

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

L'adattatore outbound legge poi `payload.channelData.demo` dentro `sendPayload`.
Questo mantiene il rendering specifico della piattaforma nel Plugin mentre il core continua a gestire
persistenza, retry, ripristino, hook e ack.

I payload preparati di `message(action="send")` e la consegna generica della risposta finale usano
la consegna del core con code best-effort per impostazione predefinita. Le code durevoli obbligatorie sono
valide solo dopo che il core ha verificato che il canale possa riconciliare un invio il cui esito è
ignoto dopo un crash. Se l'adattatore non può implementare `reconcileUnknownSend`,
mantieni il percorso di invio preparato best-effort; il core proverà comunque la coda write-ahead,
ma la persistenza della coda o il ripristino incerto da crash non fanno parte del
contratto di consegna richiesto.

## Capability finali durevoli

La consegna finale durevole è opt-in per ogni effetto collaterale. Il core userà la consegna
durevole generica solo quando l'adattatore dichiara ogni capability necessaria al
payload e alle opzioni di consegna.

| Capability             | Dichiarare quando                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | L'adattatore può inviare testo e restituire una ricevuta.                            |
| `media`                | Gli invii di media restituiscono ricevute per ogni messaggio visibile della piattaforma. |
| `payload`              | L'adattatore conserva la semantica dei payload di risposta ricchi, non solo testo e un URL media. |
| `replyTo`              | I target di risposta nativi raggiungono la piattaforma.                              |
| `thread`               | I target di thread nativo, argomento o thread di canale raggiungono la piattaforma.  |
| `silent`               | La soppressione delle notifiche raggiunge la piattaforma.                            |
| `nativeQuote`          | I metadati della citazione selezionata raggiungono la piattaforma.                   |
| `messageSendingHooks`  | Gli hook di invio messaggi del core possono cancellare o riscrivere contenuti prima dell'I/O della piattaforma. |
| `batch`                | I batch renderizzati multi-parte sono riproducibili come un unico piano durevole.    |
| `reconcileUnknownSend` | L'adattatore può risolvere il ripristino `unknown_after_send` senza replay cieco.    |
| `afterSendSuccess`     | Gli effetti collaterali locali del canale post-invio riuscito vengono eseguiti una volta. |
| `afterCommit`          | Gli effetti collaterali locali del canale post-commit vengono eseguiti una volta.   |

La consegna finale best-effort non richiede `reconcileUnknownSend`; usa il
ciclo di vita condiviso quando l'adattatore conserva la semantica visibile del payload e
ripiega sull'I/O diretto della piattaforma se la persistenza della coda non è disponibile. La consegna
finale durevole obbligatoria deve richiedere esplicitamente `reconcileUnknownSend`. Se
l'adattatore non può determinare se un invio iniziato/ignoto abbia raggiunto la piattaforma,
non dichiarare quella capability; il core rifiuterà la consegna durevole obbligatoria
prima dell'accodamento.

Quando un chiamante ha bisogno di consegna durevole, deriva i requisiti invece di creare
mappe a mano:

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

`messageSendingHooks` è richiesto per impostazione predefinita. Imposta `messageSendingHooks: false`
solo per un percorso che intenzionalmente non può eseguire hook globali di invio messaggi.

## Contratto di invio durevole

Un invio finale durevole ha semantiche più rigorose rispetto alla consegna legacy gestita dal canale:

- Crea l'intento durevole prima dell'I/O della piattaforma.
- Se la consegna durevole restituisce un risultato gestito, non ricorrere all'invio legacy.
- Tratta la cancellazione da parte degli hook e i risultati senza invio come terminali.
- Tratta `unsupported` solo come risultato pre-intento.
- Per durabilità obbligatoria, fallisci prima dell'I/O della piattaforma se la coda non può registrare
  che l'invio della piattaforma è iniziato.
- Per la consegna finale obbligatoria e gli invii obbligatori preparati dello strumento message,
  esegui il preflight di `reconcileUnknownSend`; il ripristino deve poter fare ack di un
  messaggio già inviato o riprodurre solo dopo che l'adattatore ha provato che l'invio originale
  non è avvenuto.
- Per `best_effort`, gli errori di scrittura in coda possono ripiegare sull'I/O diretto della piattaforma.
- Propaga i segnali di abort al caricamento dei media e agli invii della piattaforma.
- Esegui gli hook post-commit dopo l'ack della coda; il fallback diretto best-effort li esegue
  dopo l'I/O della piattaforma riuscito perché non c'è un commit di coda durevole.
- Restituisci ricevute per ogni id di messaggio visibile della piattaforma.
- Usa `reconcileUnknownSend` quando una piattaforma può controllare se un invio incerto
  ha già raggiunto l'utente.

Questo contratto evita invii duplicati dopo crash ed evita di bypassare
gli hook di cancellazione dell'invio messaggi.

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

Usa `createMessageReceiptFromOutboundResults(...)` quando adatti un risultato
di invio esistente. Usa `createPreviewMessageReceipt(...)` quando un messaggio
di anteprima live diventa la ricevuta finale. Evita di aggiungere nuovi campi
`messageIds` locali al proprietario. Il vecchio `ChannelDeliveryResult.messageIds`
viene ancora prodotto ai margini di compatibilità.

## Anteprima live

I canali che trasmettono in streaming anteprime di bozze o aggiornamenti di
avanzamento dovrebbero dichiarare capacità live:

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
`deliverWithFinalizableLivePreviewAdapter(...)` per la finalizzazione a runtime. Il
finalizzatore decide se la risposta finale modifica l'anteprima sul posto, invia
un fallback normale, scarta lo stato di anteprima in sospeso, conserva una modifica
fallita ambigua senza duplicare il messaggio e restituisce la ricevuta finale.

## Criterio di ack in ricezione

I ricevitori in ingresso che controllano la tempistica di conferma della piattaforma
dovrebbero dichiarare il criterio di ricezione:

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

Usa l'impostazione predefinita quando la piattaforma non ha conferme da rimandare,
conferma già prima dell'elaborazione asincrona oppure richiede semantiche di
risposta specifiche del protocollo. Dichiara uno dei criteri a fasi solo quando
il ricevitore usa effettivamente il contesto di ricezione per spostare più avanti
la conferma della piattaforma.

Criteri:

| Criterio               | Da usare quando                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | La piattaforma può essere confermata dopo che l'evento in ingresso è stato analizzato e registrato. |
| `after_agent_dispatch` | La piattaforma dovrebbe attendere finché il dispatch dell'agent è stato accettato.        |
| `after_durable_send`   | La piattaforma dovrebbe attendere finché la consegna finale ha una decisione durevole.    |
| `manual`               | Il plugin possiede la conferma perché le semantiche della piattaforma non corrispondono a una fase generica. |

Usa `createMessageReceiveContext(...)` nei ricevitori che rimandano lo stato di
ack e `shouldAckMessageAfterStage(...)` quando il ricevitore deve verificare se
una fase ha soddisfatto il criterio configurato.

## Test di contratto

Le dichiarazioni di capacità fanno parte del contratto del plugin. Supportale
con test:

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

Aggiungi suite di prove live e di ricezione quando l'adapter dichiara queste
funzionalità. Una prova mancante dovrebbe far fallire il test invece di ampliare
silenziosamente la superficie durevole.

## API di compatibilità deprecate

Queste API restano importabili per la compatibilità con terze parti. Non usarle
per nuovo codice di canale.

| API deprecata                                | Sostituzione                                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` per dispatcher di compatibilità, oppure un adapter `message` per nuovo codice di canale |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` più `channel.turn.runPrepared(...)`, oppure un adapter `message` per nuovo codice di canale |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` più `channel.turn.runPrepared(...)`, oppure un adapter `message` per nuovo codice di canale |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` più `channel.turn.runPrepared(...)`, oppure un adapter `message` per nuovo codice di canale |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` oppure `deliverInboundReplyWithMessageSendContext(...)` da `channel-message-runtime`         |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` da `openclaw/plugin-sdk/channel-message-runtime`                          |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` più `channel.turn.runPrepared(...)`, oppure un adapter `message` per nuovo codice di canale |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` più `channel.turn.runPrepared(...)`, oppure un adapter `message` per nuovo codice di canale |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` più `deliverWithFinalizableLivePreviewAdapter(...)`                             |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

I dispatcher di compatibilità possono ancora usare `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` e `createTypingCallbacks(...)` tramite la facciata
dei messaggi. Il nuovo codice di ciclo di vita dovrebbe evitare il vecchio
sottopercorso `channel-reply-pipeline`.

## Checklist di migrazione

1. Aggiungi `message: defineChannelMessageAdapter(...)` oppure
   `message: createChannelMessageAdapterFromOutbound(...)` al plugin di canale.
2. Restituisci `MessageReceipt` dagli invii di testo, media e payload.
3. Dichiara solo capacità supportate da comportamento nativo e test.
4. Sostituisci le mappe di requisiti durevoli scritte a mano con
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Sposta la finalizzazione dell'anteprima tramite gli helper di anteprima live quando il canale
   modifica sul posto i messaggi bozza.
6. Dichiara il criterio di ack in ricezione solo quando il ricevitore può davvero rimandare
   la conferma della piattaforma.
7. Mantieni gli helper legacy di dispatch delle risposte solo ai margini di compatibilità.
