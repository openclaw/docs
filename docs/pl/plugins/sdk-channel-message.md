---
read_when:
    - Tworzysz lub refaktoryzujesz Plugin kanału komunikacyjnego
    - Potrzebujesz trwałego dostarczania ostatecznej odpowiedzi, potwierdzeń odbioru, finalizacji podglądu na żywo lub polityki potwierdzania odbioru
    - Przeprowadzasz migrację ze starszego potoku odpowiedzi lub pomocników rozsyłania odpowiedzi przychodzących
summary: API cyklu życia wiadomości dla pluginów kanałów, w tym trwałe wysyłanie, potwierdzenia, podgląd na żywo, zasady potwierdzania odbioru oraz migracja ze starszych wersji
title: API wiadomości kanału
x-i18n:
    generated_at: "2026-05-10T19:48:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Pluginy kanałów powinny udostępniać jeden adapter `message` z
`openclaw/plugin-sdk/channel-message`. Adapter opisuje natywny cykl życia
wiadomości obsługiwany przez platformę:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core odpowiada za kolejkowanie, trwałość, ogólną politykę ponawiania, hooki, potwierdzenia oraz
wspólne narzędzie `message`. Plugin odpowiada za natywne wywołania send/edit/delete, normalizację
celu, wątki platformy, wybrane cytaty, flagi powiadomień, stan konta oraz skutki uboczne
specyficzne dla platformy.

Używaj tej strony razem z [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins).

Podścieżka `channel-message` jest celowo wystarczająco lekka dla gorących plików
startowych pluginu, takich jak `channel.ts`: udostępnia kontrakty adapterów, dowody
możliwości, potwierdzenia oraz fasady zgodności bez ładowania dostarczania wychodzącego.
Pomocniki dostarczania w czasie wykonywania są dostępne z
`openclaw/plugin-sdk/channel-message-runtime` dla ścieżek kodu monitor/send, które
już wykonują asynchroniczne message I/O.

Nowy kod wysyłania kanału i pluginu powinien używać pomocników cyklu życia wiadomości z
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` albo `deliverInboundReplyWithMessageSendContext`.
Starszy pomocnik
`deliverOutboundPayloads(...)` w `openclaw/plugin-sdk/outbound-runtime`
jest przestarzałym podłożem zgodności/czasu wykonywania dla wewnętrznych mechanizmów wychodzących, odzyskiwania
i starszych adapterów. Nie używaj go dla nowych ścieżek wysyłania kanału lub pluginu.

`sendDurableMessageBatch(...)` zwraca jawny wynik cyklu życia:

- `sent` - dostarczono co najmniej jedną widoczną wiadomość platformy.
- `suppressed` - żadna wiadomość platformy nie powinna być traktowana jako brakująca. Stabilne
  powody obejmują `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` oraz starsze `no_visible_result`.
- `partial_failed` - co najmniej jedna wiadomość platformy została dostarczona, zanim późniejszy
  payload lub skutek uboczny zakończył się niepowodzeniem. Wynik obejmuje prefiks dostarczonych potwierdzeń
  oraz błąd.
- `failed` - nie utworzono żadnego potwierdzenia platformy.

Używaj `payloadOutcomes`, gdy batch miesza payloady wysłane, pominięte i nieudane.
Nie wnioskuj o anulowaniu przez hook, sprawdzając, czy stara tablica dostarczania bezpośredniego
jest pusta.

Dyspozytory zgodności, które nadal potrzebują buforowanego dyspozytora odpowiedzi, powinny
budować opcje prefiksu odpowiedzi za pomocą `createChannelMessageReplyPipeline(...)` z
`openclaw/plugin-sdk/channel-message`, a następnie wywoływać
`channel.turn.runPrepared(...)` z runtime. Dzięki temu rejestrowanie sesji i kolejność dispatch
pozostają na wspólnym cyklu życia turn, bez dodawania kolejnego publicznego wrappera turn.

## Minimalny adapter

Większość nowych pluginów kanałów może zacząć od małego adaptera:

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

Następnie dołącz go do pluginu kanału:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Deklaruj tylko te możliwości, które adapter rzeczywiście zachowuje. Każda zadeklarowana
możliwość powinna mieć test kontraktu.

## Most wychodzący

Jeśli kanał ma już zgodny adapter `outbound`, preferuj wyprowadzenie adaptera
wiadomości zamiast duplikowania kodu wysyłania:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Most konwertuje stare wyniki wysyłania wychodzącego na wartości `MessageReceipt`. Nowy
kod powinien przekazywać potwierdzenia od początku do końca i wyprowadzać starsze identyfikatory tylko na krawędziach
zgodności za pomocą `listMessageReceiptPlatformIds(...)` albo
`resolveMessageReceiptPrimaryId(...)`.
Jeśli nie podano polityki odbioru, `createChannelMessageAdapterFromOutbound(...)`
używa polityki potwierdzania odbioru `manual`. Dzięki temu potwierdzanie przez platformę należące do pluginu
jest jawne bez zmieniania kanałów, które potwierdzają webhooki,
sockety albo offsety pollingu poza ogólnym kontekstem odbioru.

## Wysyłki narzędzia wiadomości

Wspólna ścieżka `message(action="send")` powinna używać tego samego głównego cyklu życia
dostarczania co odpowiedzi końcowe. Jeśli kanał potrzebuje kształtowania specyficznego dla dostawcy dla
wysyłki narzędzia, zaimplementuj `actions.prepareSendPayload(...)` zamiast wysyłać z
`actions.handleAction(...)`.

`prepareSendPayload(...)` otrzymuje znormalizowany przez core `ReplyPayload` oraz pełny
kontekst akcji. Zwróć payload z danymi specyficznymi dla kanału w
`payload.channelData.<channel>` i pozwól core wywołać `sendMessage(...)`,
runtime cyklu życia wiadomości, kolejkę write-ahead, hooki wysyłania wiadomości,
ponawianie, odzyskiwanie i czyszczenie ack. Runtime cyklu życia może wywoływać
`deliverOutboundPayloads(...)` wewnętrznie jako podłoże zgodności, ale pluginy kanałów
nie powinny wywoływać go bezpośrednio dla nowego zachowania wysyłania.

Zwracaj `null` tylko wtedy, gdy wysyłki nie da się przedstawić jako trwałego payloadu, na
przykład dlatego, że zawiera nieserializowalną fabrykę komponentów. Core zachowa
starszy fallback akcji pluginu dla zgodności, ale nowe funkcje wysyłania kanału
powinny dać się wyrazić jako trwałe dane payloadu.

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

Adapter wychodzący odczytuje wtedy `payload.channelData.demo` wewnątrz `sendPayload`.
Dzięki temu renderowanie specyficzne dla platformy pozostaje w pluginie, podczas gdy core nadal odpowiada za
utrwalanie, ponawianie, odzyskiwanie, hooki i ack.

Przygotowane payloady `message(action="send")` oraz ogólne dostarczanie końcowych odpowiedzi używają
domyślnie dostarczania core z kolejkowaniem best-effort. Wymagane trwałe kolejkowanie jest
poprawne tylko po zweryfikowaniu przez core, że kanał potrafi uzgodnić wysyłkę, której wynik jest
nieznany po awarii. Jeśli adapter nie potrafi zaimplementować `reconcileUnknownSend`,
zachowaj przygotowaną ścieżkę wysyłania jako best-effort; core nadal spróbuje użyć kolejki write-ahead,
ale trwałość kolejki lub niepewne odzyskiwanie po awarii nie są częścią
wymaganego kontraktu dostarczania.

## Możliwości trwałej odpowiedzi końcowej

Trwałe dostarczanie końcowe jest włączane osobno dla każdego skutku ubocznego. Core użyje ogólnego
trwałego dostarczania tylko wtedy, gdy adapter deklaruje każdą możliwość wymaganą przez
payload i opcje dostarczania.

| Możliwość             | Deklaruj, gdy                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter może wysyłać tekst i zwracać potwierdzenie.                                      |
| `media`                | Wysyłki multimediów zwracają potwierdzenia dla każdej widocznej wiadomości platformy.                      |
| `payload`              | Adapter zachowuje semantykę bogatych payloadów odpowiedzi, nie tylko tekst i jeden URL multimediów. |
| `replyTo`              | Natywne cele odpowiedzi docierają do platformy.                                             |
| `thread`               | Natywne cele wątku, tematu albo wątku kanału docierają do platformy.                  |
| `silent`               | Wyciszenie powiadomień dociera do platformy.                                       |
| `nativeQuote`          | Metadane wybranego cytatu docierają do platformy.                                        |
| `messageSendingHooks`  | Główne hooki wysyłania wiadomości mogą anulować lub przepisać treść przed platform I/O.        |
| `batch`                | Wieloczęściowe wyrenderowane batche można odtworzyć jako jeden trwały plan.                      |
| `reconcileUnknownSend` | Adapter może rozwiązać odzyskiwanie `unknown_after_send` bez ślepego powtórzenia.          |
| `afterSendSuccess`     | Lokalne dla kanału skutki uboczne po wysłaniu uruchamiają się raz.                                      |
| `afterCommit`          | Lokalne dla kanału skutki uboczne po commicie uruchamiają się raz.                                    |

Dostarczanie końcowe best-effort nie wymaga `reconcileUnknownSend`; używa
wspólnego cyklu życia, gdy adapter zachowuje widoczną semantykę payloadu, i
wraca do bezpośredniego platform I/O, jeśli trwałość kolejki jest niedostępna. Wymagane
trwałe dostarczanie końcowe musi jawnie wymagać `reconcileUnknownSend`. Jeśli
adapter nie potrafi ustalić, czy rozpoczęta/nieznana wysyłka dotarła do platformy,
nie deklaruj tej możliwości; core odrzuci wymagane trwałe dostarczanie
przed kolejkowaniem.

Gdy wywołujący potrzebuje trwałego dostarczania, wyprowadzaj wymagania zamiast budować
mapy ręcznie:

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

`messageSendingHooks` jest wymagane domyślnie. Ustaw `messageSendingHooks: false`
tylko dla ścieżki, która celowo nie może uruchamiać globalnych hooków wysyłania wiadomości.

## Kontrakt trwałej wysyłki

Trwała wysyłka końcowa ma bardziej rygorystyczną semantykę niż starsze dostarczanie należące do kanału:

- Utwórz trwałą intencję przed platform I/O.
- Jeśli trwałe dostarczanie zwraca obsłużony wynik, nie wracaj do starszego wysyłania.
- Traktuj anulowanie przez hook i wyniki bez wysyłki jako terminalne.
- Traktuj `unsupported` tylko jako wynik sprzed intencji.
- Dla wymaganej trwałości zakończ niepowodzeniem przed platform I/O, jeśli kolejka nie może zapisać,
  że wysyłka platformowa się rozpoczęła.
- Dla wymaganego dostarczania końcowego i wymaganych przygotowanych wysyłek narzędzia wiadomości
  wykonaj preflight `reconcileUnknownSend`; odzyskiwanie musi móc potwierdzić
  już wysłaną wiadomość albo odtworzyć wysyłkę dopiero po tym, jak adapter udowodni, że pierwotna wysyłka
  nie nastąpiła.
- Dla `best_effort` niepowodzenia zapisu do kolejki mogą wrócić do bezpośredniego platform I/O.
- Przekazuj sygnały przerwania do ładowania multimediów i wysyłek platformy.
- Uruchamiaj hooki after-commit po ack kolejki; bezpośredni fallback best-effort uruchamia je
  po udanym platform I/O, ponieważ nie ma trwałego commitu kolejki.
- Zwracaj potwierdzenia dla każdego widocznego identyfikatora wiadomości platformy.
- Używaj `reconcileUnknownSend`, gdy platforma może sprawdzić, czy niepewna wysyłka
  już dotarła do użytkownika.

Ten kontrakt zapobiega zduplikowanym wysyłkom po awariach i zapobiega obchodzeniu
hooków anulowania wysyłania wiadomości.

## Potwierdzenia

`MessageReceipt` jest nowym wewnętrznym rekordem tego, co platforma zaakceptowała:

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

Użyj `createMessageReceiptFromOutboundResults(...)` podczas adaptowania istniejącego wyniku wysyłania. Użyj `createPreviewMessageReceipt(...)`, gdy komunikat podglądu na żywo staje się końcowym potwierdzeniem. Unikaj dodawania nowych lokalnych dla właściciela pól `messageIds`. Starsze `ChannelDeliveryResult.messageIds` jest nadal tworzone na granicach zgodności.

## Podgląd na żywo

Kanały, które strumieniują podglądy wersji roboczych lub aktualizacje postępu, powinny deklarować funkcje na żywo:

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

Użyj `defineFinalizableLivePreviewAdapter(...)` i `deliverWithFinalizableLivePreviewAdapter(...)` do finalizacji w czasie wykonywania. Finalizator decyduje, czy końcowa odpowiedź edytuje podgląd w miejscu, wysyła zwykły wariant zapasowy, odrzuca oczekujący stan podglądu, zachowuje niejednoznacznie nieudaną edycję bez duplikowania komunikatu i zwraca końcowe potwierdzenie.

## Zasada potwierdzania odbioru

Odbiorniki przychodzące, które kontrolują czas potwierdzania na platformie, powinny deklarować zasadę odbioru:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adaptery, które nie deklarują zasady odbioru, domyślnie używają:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Użyj wartości domyślnej, gdy platforma nie ma potwierdzenia do odroczenia, już potwierdza przed przetwarzaniem asynchronicznym albo wymaga semantyki odpowiedzi specyficznej dla protokołu. Deklaruj jedną z zasad etapowych tylko wtedy, gdy odbiornik rzeczywiście używa kontekstu odbioru do przesunięcia potwierdzenia platformy na później.

Zasady:

| Zasada                 | Użyj, gdy                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Platformę można potwierdzić po przeanalizowaniu i zapisaniu zdarzenia przychodzącego.    |
| `after_agent_dispatch` | Platforma powinna czekać, aż przekazanie do agenta zostanie zaakceptowane.               |
| `after_durable_send`   | Platforma powinna czekać, aż końcowe dostarczenie uzyska trwałą decyzję.                 |
| `manual`               | Plugin odpowiada za potwierdzenie, ponieważ semantyka platformy nie pasuje do ogólnego etapu. |

Użyj `createMessageReceiveContext(...)` w odbiornikach, które odraczają stan potwierdzenia, oraz `shouldAckMessageAfterStage(...)`, gdy odbiornik musi sprawdzić, czy etap spełnił skonfigurowaną zasadę.

## Testy kontraktu

Deklaracje funkcji są częścią kontraktu Plugin. Potwierdź je testami:

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

Dodaj zestawy dowodów dla funkcji na żywo i odbioru, gdy adapter deklaruje te funkcje. Brakujący dowód powinien powodować niepowodzenie testu, zamiast po cichu rozszerzać trwałą powierzchnię.

## Przestarzałe interfejsy API zgodności

Te interfejsy API pozostają importowalne dla zgodności z zewnętrznymi Plugin. Nie używaj ich w nowym kodzie kanałów.

| Przestarzały interfejs API                   | Zamiennik                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` dla dyspozytorów zgodności albo adapter `message` dla nowego kodu kanału          |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` albo adapter `message` dla nowego kodu kanału |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` albo adapter `message` dla nowego kodu kanału |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` albo adapter `message` dla nowego kodu kanału |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` albo `deliverInboundReplyWithMessageSendContext(...)` z `channel-message-runtime`           |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` z `openclaw/plugin-sdk/channel-message-runtime`                           |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` albo adapter `message` dla nowego kodu kanału |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` albo adapter `message` dla nowego kodu kanału |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Dyspozytory zgodności nadal mogą używać `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` i `createTypingCallbacks(...)` przez fasadę komunikatów. Nowy kod cyklu życia powinien unikać starej podścieżki `channel-reply-pipeline`.

## Lista kontrolna migracji

1. Dodaj `message: defineChannelMessageAdapter(...)` albo `message: createChannelMessageAdapterFromOutbound(...)` do Plugin kanału.
2. Zwracaj `MessageReceipt` z wysyłek tekstu, multimediów i ładunków.
3. Deklaruj tylko funkcje potwierdzone natywnym zachowaniem i testami.
4. Zastąp ręcznie napisane mapy wymagań trwałości przez `deriveDurableFinalDeliveryRequirements(...)`.
5. Przenieś finalizację podglądu przez pomocniki podglądu na żywo, gdy kanał edytuje wersje robocze komunikatów w miejscu.
6. Deklaruj zasadę potwierdzania odbioru tylko wtedy, gdy odbiornik naprawdę może odroczyć potwierdzenie platformy.
7. Zachowaj starsze pomocniki przekazywania odpowiedzi tylko na granicach zgodności.
