---
read_when:
    - Tworzysz lub refaktoryzujesz ścieżkę wysyłania w pluginie kanału komunikacyjnego
    - Potrzebujesz niezawodnego dostarczania odpowiedzi końcowych, potwierdzeń odbioru, finalizacji podglądu na żywo lub zasad potwierdzania odebrania wiadomości
    - Przeprowadzasz migrację z pomocników `channel-message`, `channel-message-runtime` lub starszych pomocników wysyłania odpowiedzi
summary: 'API cyklu życia wiadomości wychodzących dla pluginów kanałów: adaptery, potwierdzenia, trwałe wysyłanie, podgląd na żywo i funkcje pomocnicze potoku odpowiedzi'
title: API wychodzące kanału
x-i18n:
    generated_at: "2026-07-12T15:28:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Pluginy kanałów udostępniają obsługę wiadomości wychodzących z
`openclaw/plugin-sdk/channel-outbound`. Do orkiestracji
odbierania/kontekstu/dystrybucji używaj
`openclaw/plugin-sdk/channel-inbound`.

Rdzeń odpowiada za kolejkowanie, trwałość, ogólne zasady ponawiania, haki, potwierdzenia oraz
współdzielone narzędzie `message`. Plugin odpowiada za natywne wywołania
wysyłania/edycji/usuwania, normalizację celu, wątki platformy, wybrane cytaty, flagi
powiadomień, stan konta i efekty uboczne specyficzne dla platformy.

## Adapter

Większość pluginów definiuje jeden adapter `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

Deklaruj tylko te możliwości, które natywny transport rzeczywiście zachowuje. Obejmij
każdą zadeklarowaną możliwość wysyłania, potwierdzania, podglądu na żywo i potwierdzania odbioru
testami przy użyciu pomocniczych funkcji kontraktowych eksportowanych z tej ścieżki podrzędnej.

## Oczyszczanie zwykłego tekstu

Używaj `sanitizeForPlainText(...)`, gdy adapter wychodzący musi przekształcić
obsługiwane znaczniki formatowania HTML w lekkie znaczniki tekstowe. Domyślny styl zachowuje
istniejące czatowe znaczniki pogrubienia i przekreślenia. Przekazuj
`{ style: "markdown" }` tylko wtedy, gdy kanał ponownie interpretuje wynik jako Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Styl Markdown używa `**bold**` i `~~strikethrough~~`; kursywa i kod w tekście
zachowują znaczniki `_italic_` i znaczniki z grawisami w obu stylach. Wybieraj styl na
granicy kanału zamiast przepisywać tekst znaczników po oczyszczeniu.

## Dowody dostarczenia

`MessageReceipt` rejestruje wynik zwrócony przez adapter kanału. Konkretne
identyfikatory wiadomości platformy wskazują, że ścieżka wysyłania platformy przyjęła
wiadomość; nie dowodzą, że urządzenie odbiorcy ją wyświetliło lub odczytało.
Potwierdzenia bez identyfikatorów wiadomości platformy są wyłącznie lokalnymi metadanymi potwierdzenia.
Kanały z potwierdzeniami odczytu lub stanem dostarczenia do urządzenia powinny śledzić te informacje
w oddzielnej ścieżce specyficznej dla kanału.

Jeśli adapter kanału może udowodnić, że ponowienie niepowodzenia nie może powielić
wysyłki widocznej dla odbiorcy i nie rozpoczęło się żadne wywołanie zdolne do finalizacji, zgłoś
`new PlatformMessageNotDispatchedError("...", { cause: error })` z
`openclaw/plugin-sdk/error-runtime`. Rdzeń może wtedy usunąć nieaktualne
dowody próby wysłania i bezpiecznie ponowić zakolejkowany zamiar. Tylko adapter będący właścicielem
ostatecznej granicy dystrybucji może złożyć takie zapewnienie. Nigdy nie używaj tego znacznika po
rozpoczęciu wywołania finalizacji/wysyłania ani po zwróceniu przez nie niejednoznacznego wyniku; błędne oznaczenie może
spowodować powielenie wiadomości.

## Istniejące adaptery wychodzące

Jeśli kanał ma już zgodny adapter `outbound`, utwórz na jego podstawie
adapter wiadomości zamiast powielać kod wysyłania:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Trwałe wysyłanie

Pomocnicze funkcje wysyłania środowiska uruchomieniowego również znajdują się w `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- funkcje pomocnicze przesyłania strumieniowego wersji roboczej/postępu, takie jak `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` zwraca jeden jawny wynik:

| Wynik            | Znaczenie                                                                               |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | ścieżka wysyłania platformy przyjęła co najmniej jedną widoczną wiadomość platformy     |
| `suppressed`     | żadna wiadomość platformy nie powinna być uznawana za brakującą                         |
| `partial_failed` | co najmniej jedna wiadomość platformy została przyjęta przed niepowodzeniem późniejszego ładunku lub efektu ubocznego |
| `failed`         | nie utworzono potwierdzenia platformy                                                   |

Używaj `payloadOutcomes`, gdy partia łączy wysłane, pominięte i zakończone niepowodzeniem
ładunki. Nie wywnioskuj anulowania przez hak z pustego wyniku starszego mechanizmu
bezpośredniego dostarczania.

## Dopuszczanie odroczonego dostarczania

Używaj `message.durableFinal.admitDeferredDelivery(...)`, gdy rozpoznane konto
nie może bezpiecznie przyjąć zarządzanej przez rdzeń wysyłki wychodzącej ani odroczonego dostarczania. Rdzeń wywołuje
ten hak synchronicznie przed bieżącą obsługą wiadomości wychodzących, w tym w ścieżkach pomijających
utrwalanie kolejki, a następnie ponownie przed odtworzeniem odzyskanego zamiaru. Kontekst
obejmuje `cfg`, `channel`, `to`, `accountId` oraz `phase` o wartości `live` lub
`recovery`.

Zwróć `{ status: "allowed" }`, aby kontynuować. Zwróć
`{ status: "permanent_rejection", reason }`, gdy dostarczenie nie może zostać
utrwalone, wysłane bezpośrednio ani odtworzone. Odrzucenie w fazie bieżącej powoduje niepowodzenie przed utworzeniem
kolejki, uruchomieniem haków wiadomości lub operacji platformy. Odrzucenie w fazie odzyskiwania oznacza
zakolejkowany rekord jako zakończony niepowodzeniem oraz pomija uzgadnianie i odtwarzanie. Pominięcie haka
oznacza zezwolenie.

Hak jest synchroniczną decyzją o dopuszczeniu, a nie ścieżką wysyłania. Odczytuj wyłącznie
już załadowaną konfigurację lub stan środowiska uruchomieniowego; nie wykonuj operacji sieciowych, systemu plików ani
innych asynchronicznych operacji wejścia/wyjścia. Testy kontraktowe powinny obejmować obie fazy i oba
warianty wyniku za pośrednictwem `ChannelMessageDurableFinalAdapter` z
`openclaw/plugin-sdk/channel-outbound`.

## Dystrybucja zgodności

Składaj dystrybucję odpowiedzi przychodzących za pomocą `dispatchChannelInboundReply(...)`
z `channel-inbound`. Dostarczanie na platformie pozostaw w adapterze dostarczania; używaj
`channel-outbound` dla adapterów wiadomości, trwałego wysyłania, potwierdzeń, podglądu na
żywo i opcji potoku odpowiedzi.
