---
read_when:
    - Tworzysz lub refaktoryzujesz Plugin kanału komunikacyjnego
    - Potrzebujesz trwałego dostarczania końcowej odpowiedzi, potwierdzeń odbioru, finalizacji podglądu na żywo lub zasad potwierdzania odbioru
    - Migrujesz ze starszego potoku odpowiedzi lub pomocników wysyłania odpowiedzi przychodzących
summary: Interfejs API cyklu życia wiadomości dla pluginów kanałów, w tym trwałe wysyłanie, potwierdzenia odbioru, podgląd na żywo, zasady potwierdzania odbioru oraz migrację starszych rozwiązań
title: API wiadomości kanału
x-i18n:
    generated_at: "2026-05-06T09:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Pluginy kanałów powinny udostępniać jeden adapter `message` z
`openclaw/plugin-sdk/channel-message`. Adapter opisuje natywny cykl życia wiadomości
obsługiwany przez platformę:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Rdzeń odpowiada za kolejkowanie, trwałość, ogólną politykę ponawiania, hooki, potwierdzenia i
wspólne narzędzie `message`. Plugin odpowiada za natywne wywołania wysyłania/edycji/usuwania, normalizację celu, wątki platformy, wybrane cytaty, flagi powiadomień, stan konta oraz efekty uboczne specyficzne dla platformy.

Używaj tej strony razem z [Tworzeniem pluginów kanałów](/pl/plugins/sdk-channel-plugins).

Podścieżka `channel-message` jest celowo wystarczająco lekka dla gorących plików bootstrapu pluginów, takich jak `channel.ts`: udostępnia kontrakty adapterów, potwierdzenia możliwości, potwierdzenia odbioru i fasady zgodności bez ładowania dostarczania wychodzącego.
Pomocniki dostarczania w czasie wykonywania są dostępne z
`openclaw/plugin-sdk/channel-message-runtime` dla ścieżek kodu monitorowania/wysyłania, które już wykonują asynchroniczne operacje wejścia/wyjścia wiadomości.

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

Deklaruj tylko możliwości, które adapter rzeczywiście zachowuje. Każda zadeklarowana
możliwość powinna mieć test kontraktu.

## Most wychodzący

Jeśli kanał ma już zgodny adapter `outbound`, lepiej wyprowadzić z niego adapter wiadomości zamiast duplikować kod wysyłania:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Most konwertuje stare wyniki wysyłania wychodzącego na wartości `MessageReceipt`. Nowy
kod powinien przekazywać potwierdzenia odbioru od końca do końca i wyprowadzać starsze identyfikatory tylko na granicach zgodności za pomocą
`listMessageReceiptPlatformIds(...)` lub
`resolveMessageReceiptPrimaryId(...)`.
Jeśli nie podano polityki odbioru, `createChannelMessageAdapterFromOutbound(...)`
używa polityki potwierdzania odbioru `manual`. Dzięki temu potwierdzanie platformowe należące do pluginu jest jawne bez zmiany kanałów, które potwierdzają webhooki, gniazda lub offsety odpytywania poza ogólnym kontekstem odbioru.

## Wysyłki narzędzia wiadomości

Wspólna ścieżka `message(action="send")` powinna używać tego samego cyklu życia dostarczania rdzenia co końcowe odpowiedzi. Jeśli kanał potrzebuje kształtowania specyficznego dla dostawcy dla wysyłki narzędzia, zaimplementuj `actions.prepareSendPayload(...)` zamiast wysyłać z
`actions.handleAction(...)`.

`prepareSendPayload(...)` otrzymuje znormalizowany rdzeniowy `ReplyPayload` oraz pełny kontekst akcji. Zwróć payload z danymi specyficznymi dla kanału w
`payload.channelData.<channel>` i pozwól rdzeniowi wywołać `sendMessage(...)`,
`deliverOutboundPayloads(...)`, kolejkę write-ahead, hooki wysyłania wiadomości,
ponawianie, odzyskiwanie i czyszczenie potwierdzeń.

Zwróć `null` tylko wtedy, gdy wysyłki nie da się przedstawić jako trwałego payloadu, na przykład dlatego, że zawiera nieserializowalną fabrykę komponentów. Rdzeń zachowa starszy fallback akcji pluginu dla zgodności, ale nowe funkcje wysyłania kanału powinny dać się wyrazić jako trwałe dane payloadu.

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

Adapter wychodzący odczytuje następnie `payload.channelData.demo` wewnątrz `sendPayload`.
Dzięki temu renderowanie specyficzne dla platformy pozostaje w pluginie, a rdzeń nadal odpowiada za utrwalanie, ponawianie, odzyskiwanie, hooki i potwierdzenia.

Przygotowane payloady `message(action="send")` oraz ogólne dostarczanie końcowej odpowiedzi domyślnie używają dostarczania rdzeniowego z kolejkowaniem best-effort. Wymagane trwałe kolejkowanie jest poprawne dopiero po tym, jak rdzeń zweryfikuje, że kanał potrafi uzgodnić wysyłkę, której wynik po awarii jest nieznany. Jeśli adapter nie może zaimplementować `reconcileUnknownSend`,
pozostaw przygotowaną ścieżkę wysyłania jako best-effort; rdzeń nadal spróbuje użyć kolejki write-ahead, ale trwałość kolejki ani niepewne odzyskiwanie po awarii nie są częścią wymaganego kontraktu dostarczania.

## Możliwości trwałej odpowiedzi końcowej

Trwałe dostarczanie końcowe jest włączane osobno dla każdego efektu ubocznego. Rdzeń użyje ogólnego trwałego dostarczania tylko wtedy, gdy adapter zadeklaruje każdą możliwość wymaganą przez payload i opcje dostarczania.

| Możliwość              | Deklaruj, gdy                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Adapter może wysłać tekst i zwrócić potwierdzenie odbioru.                           |
| `media`                | Wysyłki multimediów zwracają potwierdzenia odbioru dla każdej widocznej wiadomości platformy. |
| `payload`              | Adapter zachowuje semantykę bogatego payloadu odpowiedzi, nie tylko tekst i jeden adres URL multimediów. |
| `replyTo`              | Natywne cele odpowiedzi docierają do platformy.                                      |
| `thread`               | Natywne wątki, tematy lub cele wątków kanału docierają do platformy.                 |
| `silent`               | Wyciszenie powiadomień dociera do platformy.                                         |
| `nativeQuote`          | Metadane wybranego cytatu docierają do platformy.                                    |
| `messageSendingHooks`  | Rdzeniowe hooki wysyłania wiadomości mogą anulować lub przepisać treść przed wejściem/wyjściem platformy. |
| `batch`                | Wieloczęściowe wyrenderowane partie można odtwarzać jako jeden trwały plan.          |
| `reconcileUnknownSend` | Adapter może rozwiązać odzyskiwanie `unknown_after_send` bez ślepego odtwarzania.    |
| `afterSendSuccess`     | Lokalne dla kanału efekty uboczne po wysłaniu uruchamiają się raz.                   |
| `afterCommit`          | Lokalne dla kanału efekty uboczne po commicie uruchamiają się raz.                   |

Dostarczanie końcowe best-effort nie wymaga `reconcileUnknownSend`; używa wspólnego
cyklu życia, gdy adapter zachowuje widoczną semantykę payloadu, i przechodzi do bezpośredniego wejścia/wyjścia platformy, jeśli trwałość kolejki jest niedostępna. Wymagane trwałe dostarczanie końcowe musi jawnie wymagać `reconcileUnknownSend`. Jeśli adapter nie potrafi ustalić, czy rozpoczęta/nieznana wysyłka dotarła do platformy,
nie deklaruj tej możliwości; rdzeń odrzuci wymagane trwałe dostarczanie przed zakolejkowaniem.

Gdy wywołujący potrzebuje trwałego dostarczania, wyprowadź wymagania zamiast budować mapy ręcznie:

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

Trwała wysyłka końcowa ma ściślejszą semantykę niż starsze dostarczanie należące do kanału:

- Utwórz trwałą intencję przed wejściem/wyjściem platformy.
- Jeśli trwałe dostarczanie zwróci obsłużony wynik, nie wracaj do starszej wysyłki.
- Traktuj anulowanie przez hook i wyniki bez wysyłki jako terminalne.
- Traktuj `unsupported` tylko jako wynik przed intencją.
- Dla wymaganej trwałości zakończ niepowodzeniem przed wejściem/wyjściem platformy, jeśli kolejka nie może zapisać,
  że wysyłka platformowa się rozpoczęła.
- Dla wymaganego dostarczania końcowego i wymaganych przygotowanych wysyłek narzędzia wiadomości
  wykonaj preflight `reconcileUnknownSend`; odzyskiwanie musi móc potwierdzić
  już wysłaną wiadomość albo odtworzyć wysyłkę dopiero po tym, jak adapter udowodni, że pierwotna wysyłka
  nie nastąpiła.
- Dla `best_effort` błędy zapisu do kolejki mogą przejść do bezpośredniego wejścia/wyjścia platformy.
- Przekazuj sygnały przerwania do ładowania multimediów i wysyłek platformowych.
- Uruchamiaj hooki po commicie po potwierdzeniu kolejki; bezpośredni fallback best-effort uruchamia je
  po udanym wejściu/wyjściu platformy, ponieważ nie ma trwałego commitu kolejki.
- Zwracaj potwierdzenia odbioru dla każdego widocznego identyfikatora wiadomości platformy.
- Używaj `reconcileUnknownSend`, gdy platforma może sprawdzić, czy niepewna wysyłka
  już dotarła do użytkownika.

Ten kontrakt zapobiega duplikowaniu wysyłek po awariach i unikaniu hooków anulowania wysyłania wiadomości.

## Potwierdzenia odbioru

`MessageReceipt` to nowy wewnętrzny zapis tego, co platforma zaakceptowała:

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

Użyj `createMessageReceiptFromOutboundResults(...)`, gdy adaptujesz istniejący
wynik wysyłki. Użyj `createPreviewMessageReceipt(...)`, gdy wiadomość podglądu na żywo staje się końcowym potwierdzeniem odbioru. Unikaj dodawania nowych lokalnych dla właściciela pól `messageIds`.
Starsze `ChannelDeliveryResult.messageIds` jest nadal tworzone na granicach zgodności.

## Podgląd na żywo

Kanały, które strumieniują wersje robocze podglądów lub aktualizacje postępu, powinny deklarować możliwości na żywo:

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

Użyj `defineFinalizableLivePreviewAdapter(...)` i
`deliverWithFinalizableLivePreviewAdapter(...)` do finalizacji w czasie wykonywania. Finalizer decyduje, czy końcowa odpowiedź edytuje podgląd w miejscu, wysyła normalny fallback, odrzuca oczekujący stan podglądu, zachowuje niejednoznacznie nieudaną edycję bez duplikowania wiadomości i zwraca końcowe potwierdzenie odbioru.

## Polityka potwierdzania odbioru

Odbiorniki przychodzące, które kontrolują czas potwierdzania platformowego, powinny deklarować politykę odbioru:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adaptery, które nie deklarują polityki odbioru, domyślnie używają:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Użyj ustawienia domyślnego, gdy platforma nie ma potwierdzenia do odroczenia, już
potwierdza przed przetwarzaniem asynchronicznym albo wymaga semantyki odpowiedzi
specyficznej dla protokołu. Zadeklaruj jedną z etapowych zasad tylko wtedy, gdy odbiornik faktycznie
używa kontekstu odbioru, aby przesunąć potwierdzenie platformy na później.

Zasady:

| Zasada                 | Stosuj, gdy                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Platformę można potwierdzić po sparsowaniu i zapisaniu zdarzenia przychodzącego.         |
| `after_agent_dispatch` | Platforma powinna poczekać, aż wysyłka agenta zostanie zaakceptowana.                     |
| `after_durable_send`   | Platforma powinna poczekać, aż ostateczne dostarczenie będzie miało trwałą decyzję.                    |
| `manual`               | Plugin jest właścicielem potwierdzania, ponieważ semantyka platformy nie pasuje do ogólnego etapu. |

Użyj `createMessageReceiveContext(...)` w odbiornikach, które odraczają stan potwierdzenia, oraz
`shouldAckMessageAfterStage(...)`, gdy odbiornik musi sprawdzić, czy
etap spełnił skonfigurowaną zasadę.

## Testy kontraktu

Deklaracje możliwości są częścią kontraktu pluginu. Podeprzyj je testami:

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

Dodaj zestawy dowodów live i odbioru, gdy adapter deklaruje te funkcje. Brakujący dowód
powinien spowodować niepowodzenie testu, zamiast po cichu rozszerzać trwałą
powierzchnię.

## Przestarzałe interfejsy API zgodności

Te interfejsy API pozostają możliwe do importu dla zgodności z podmiotami zewnętrznymi. Nie używaj ich w
nowym kodzie kanału.

| Przestarzały interfejs API                               | Zamiennik                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` dla dyspozytorów zgodności albo adapter `message` dla nowego kodu kanału |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` z `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` tylko dla dyspozytorów zgodności                                       |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` tylko dla dyspozytorów zgodności                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Dyspozytory zgodności nadal mogą używać `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` i `createTypingCallbacks(...)` przez
fasadę wiadomości. Nowy kod cyklu życia powinien unikać starej
ścieżki podrzędnej `channel-reply-pipeline`.

## Lista kontrolna migracji

1. Dodaj `message: defineChannelMessageAdapter(...)` albo
   `message: createChannelMessageAdapterFromOutbound(...)` do pluginu kanału.
2. Zwracaj `MessageReceipt` z wysyłek tekstu, multimediów i ładunków.
3. Deklaruj tylko możliwości poparte natywnym zachowaniem i testami.
4. Zastąp ręcznie pisane mapy trwałych wymagań funkcją
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Przenieś finalizację podglądu przez pomocniki podglądu live, gdy kanał
   edytuje wiadomości robocze w miejscu.
6. Deklaruj zasadę potwierdzania odbioru tylko wtedy, gdy odbiornik naprawdę może odroczyć
   potwierdzenie platformy.
7. Zachowaj starsze pomocniki wysyłki odpowiedzi tylko na granicach zgodności.
