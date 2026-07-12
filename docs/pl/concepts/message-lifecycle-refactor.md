---
read_when:
    - Refaktoryzacja zachowania wysyłania lub odbierania w kanale
    - Zmiana obsługi wiadomości przychodzących kanału, wysyłania odpowiedzi, kolejki wychodzącej, strumieniowego przesyłania podglądu lub interfejsów API wiadomości SDK Pluginu
    - Projektowanie nowego pluginu kanału wymagającego trwałego wysyłania, potwierdzeń odbioru, podglądów, edycji lub ponownych prób
summary: 'Stan trwałego cyklu odbierania i wysyłania wiadomości: co zostało wydane, co zmieniło się względem pierwotnego projektu i co pozostaje do zrobienia'
title: Refaktoryzacja cyklu życia wiadomości
x-i18n:
    generated_at: "2026-07-12T15:05:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Ta strona powstała jako wybiegająca w przyszłość propozycja projektu. Główna część tego
projektu została od tego czasu wdrożona w `src/channels/message/*` oraz publicznych
podścieżkach `openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Informacje o
bieżącym API zawierają strony [API kanału wychodzącego](/pl/plugins/sdk-channel-outbound) i
[API kanału przychodzącego](/pl/plugins/sdk-channel-inbound). Ta strona opisuje wdrożone
elementy, różnice między implementacją a pierwotnym szkicem oraz nadal otwarte kwestie.
</Note>

## Dlaczego przeprowadzono tę refaktoryzację

Stos kanałów rozrósł się w wyniku kilku lokalnych poprawek: osobnych pomocniczych
funkcji obsługi ruchu przychodzącego dla poszczególnych poziomów dojrzałości
(`runtime.channel.inbound.run` dla prostych adapterów,
`runtime.channel.inbound.runPreparedReply` dla rozbudowanych), starszych funkcji
pomocniczych wysyłania odpowiedzi (`dispatchInboundReplyWithBase`,
`recordInboundSessionAndDispatchReply`), strumieniowania podglądu właściwego dla
poszczególnych kanałów oraz trwałości dostarczania końcowego dołączonej do istniejących
ścieżek ładunku odpowiedzi. Taka struktura wprowadzała zbyt wiele publicznych pojęć
i zbyt wiele miejsc, w których semantyka dostarczania mogła się rozbiegać.

Luka w niezawodności, która wymusiła przeprojektowanie:

```text
Potwierdzono aktualizację odpytywania Telegramu
  -> istnieje końcowy tekst asystenta
  -> proces uruchamia się ponownie, zanim wywołanie sendMessage zakończy się powodzeniem
  -> końcowa odpowiedź zostaje utracona
```

Docelowa niezmienniczość: gdy rdzeń zdecyduje, że widoczna wiadomość wychodząca powinna
istnieć, zamiar wysłania musi zostać trwale zapisany przed próbą wywołania platformy,
a potwierdzenie platformy musi zostać zatwierdzone po powodzeniu. Zapewnia to domyślnie
odzyskiwanie z gwarancją co najmniej jednokrotnego dostarczenia. Zachowanie dokładnie
jednokrotnego dostarczenia istnieje tylko wtedy, gdy adapter wykazuje natywną
idempotentność albo uzgadnia próbę o nieznanym wyniku po wysłaniu ze stanem platformy
przed ponowieniem.

## Co wdrożono

Domena wewnętrzna znajduje się w `src/channels/message/*`:

| Plik                        | Zakres odpowiedzialności                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | Kontrakty typów adaptera, kontekstu wysyłania, potwierdzenia i trwałego zamiaru                                      |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — trwały kontekst wysyłania                             |
| `receive.ts`                | `createMessageReceiveContext` — maszyna stanów zasad potwierdzania ruchu przychodzącego                             |
| `live.ts`                   | Stan podglądu na żywo i logika finalizacji w miejscu lub użycia rozwiązania zastępczego                             |
| `state.ts`                  | `classifyDurableSendRecoveryState` — klasyfikacja odzyskiwania po przerwaniu                                         |
| `receipt.ts`                | Normalizuje wyniki wysyłania platformy do postaci `MessageReceipt`                                                  |
| `capabilities.ts`           | Wyznacza wymagane możliwości trwałego dostarczania końcowego na podstawie ładunku                                   |
| `contracts.ts`              | Weryfikacja dowodów kontraktowych dla zadeklarowanych możliwości adaptera                                            |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                       |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — opakowuje starsze funkcje `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — trwała kolejka przychodzących zdarzeń                                                 |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — dziennik przyjęcia/oczekiwania/ukończenia/zwolnienia do deduplikacji ruchu przychodzącego |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` i opakowania zachowujące starsze nazwy                                                |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, funkcje pomocnicze prefiksu odpowiedzi i wywołań zwrotnych wskaźnika pisania          |

Powierzchnia publiczna: `openclaw/plugin-sdk/channel-outbound` (funkcje pomocnicze
wysyłania, potwierdzeń, trwałości, obsługi na żywo i potoku odpowiedzi) oraz
`openclaw/plugin-sdk/channel-inbound` (kontekst ruchu przychodzącego,
`runChannelInboundEvent`, `dispatchChannelInboundReply`). Przykłady adapterów, aktualne
nazwy typów i uwagi dotyczące migracji znajdują się na tych stronach — to one są
źródłem prawdy o kształcie API, a nie poniższe szkice.

### Kontekst wysyłania

`withDurableMessageSendContext` udostępnia kodowi kanału kroki `render`,
`previewUpdate`, `send`, `edit`, `delete`, `commit` i `fail` dotyczące jednej
wiadomości wychodzącej. `sendDurableMessageBatch` jest opakowaniem dla typowego
przypadku: renderowanie, wysłanie, a następnie zatwierdzenie przy `sent`/`suppressed`
lub oznaczenie niepowodzenia w razie błędu.

`sendDurableMessageBatch` zwraca jeden wynik unii dyskryminowanej:

| Stan             | Znaczenie                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `sent`           | Dostarczono co najmniej jedną widoczną wiadomość platformy                                     |
| `suppressed`     | Żadna wiadomość platformy nie powinna być traktowana jako brakująca (anulowanie przez hook, przebieg próbny itp.) |
| `partial_failed` | Dostarczono co najmniej jedną wiadomość, zanim późniejszy ładunek lub efekt uboczny zakończył się niepowodzeniem |
| `failed`         | Nie utworzono potwierdzenia platformy                                                          |

Trwałość przyjmuje jedną z wartości `required`, `best_effort` lub `disabled`
(`MessageDurabilityPolicy` w `src/channels/message/types.ts`). Wartość `required`
powoduje bezpieczne przerwanie, gdy nie można zapisać trwałego zamiaru; `best_effort`
przechodzi do bezpośredniego wysyłania, gdy mechanizm trwałego zapisu jest niedostępny;
`disabled` zachowuje sposób bezpośredniego wysyłania sprzed refaktoryzacji. Starsze
funkcje pomocnicze zgodności domyślnie używają `disabled` i nie wnioskują wartości
`required` wyłącznie na podstawie tego, że kanał ma ogólny adapter ruchu wychodzącego.

Niebezpieczna pozostaje granica między pomyślnym zakończeniem wywołania platformy
a zatwierdzeniem potwierdzenia. Jeśli proces zostanie wtedy przerwany, rdzeń nie może
ustalić, czy wiadomość platformy istnieje, chyba że adapter deklaruje
`reconcileUnknownSend`. Ten hook klasyfikuje przerwane wysłanie jako `sent`,
`not_sent` lub `unresolved`; tylko `not_sent` zezwala na ponowienie. Kanały bez
uzgadniania przechodzą do stanu `unknown_after_send`
(`src/channels/message/state.ts`, `src/infra/outbound/delivery-queue-recovery.ts`)
i mogą zdecydować się na ponowienie z gwarancją co najmniej jednokrotnego dostarczenia
tylko wtedy, gdy zduplikowane widoczne wiadomości są akceptowalnym i udokumentowanym
kompromisem dla danego kanału.

### Kontekst odbierania

`createMessageReceiveContext` śledzi stan potwierdzenia/odrzucenia osobno dla każdego
zdarzenia przychodzącego, udostępniając idempotentne `ack()` i jawne `nack(error)`.
Zasada potwierdzania (`ChannelMessageReceiveAckPolicy`) przyjmuje jedną z wartości:

| Zasada                 | Moment potwierdzenia                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | Rdzeń utrwalił wystarczającą ilość metadanych ruchu przychodzącego, aby deduplikować lub trasować ponowne dostarczenie |
| `after_agent_dispatch` | Uruchomienie agenta zostało przekazane do wykonania                                            |
| `after_durable_send`   | Zatwierdzono trwałe wysłanie wychodzące dla tej tury                                           |
| `manual`               | Wywołujący jawnie kontroluje czas potwierdzenia (wartość domyślna dla adapterów, które nie deklarują zasady) |

Odpytywanie Telegramu wykorzystuje ten mechanizm do utrwalania znacznika ukończonej
bezpiecznie aktualizacji (`safeCompletedUpdateId` w
`extensions/telegram/src/bot-update-tracker.ts`): grammY nadal obserwuje każdą
aktualizację, gdy trafia ona do łańcucha oprogramowania pośredniczącego, ale OpenClaw
przesuwa utrwalony znacznik ponownego uruchomienia wyłącznie poza aktualizacje, których
przekazanie zakończyło się powodzeniem, dlatego aktualizacje zakończone niepowodzeniem
lub nadal oczekujące są odtwarzane po ponownym uruchomieniu. Nadrzędne przesunięcie
`getUpdates` Telegramu nadal pozostaje pod kontrolą grammY; w pełni trwałe źródło
odpytywania, które kontroluje ponowne dostarczanie na poziomie platformy poza tym
znacznikiem, nie zostało zbudowane (zobacz Otwarte kwestie).

### Podgląd na żywo

`src/channels/message/live.ts` modeluje podgląd, edycję i finalizację jako jeden cykl
życia: `createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` oraz
`deliverFinalizableLivePreviewAdapter` (utworzenie końcowej edycji z wersji roboczej,
zastosowanie jej i przejście do zwykłego wysłania, gdy edycja jest niemożliwa lub
kończy się niepowodzeniem). `LiveMessageState.phase` przyjmuje wartości `idle |
previewing | finalizing | finalized | cancelled`; `canFinalizeInPlace` określa, czy
podgląd może stać się wiadomością końcową przez edycję zamiast nowego wysłania.

### Trwałe potwierdzenia

`MessageReceipt` (`src/channels/message/types.ts`) normalizuje co najmniej jeden
identyfikator wiadomości platformy pochodzący z jednego logicznego wysłania do postaci
`platformMessageIds` oraz elementów `parts` (rodzaj, indeks, identyfikator wątku,
identyfikator wiadomości, na którą udzielono odpowiedzi). Główny identyfikator jest
zachowywany na potrzeby wątków i późniejszych edycji. Dzięki temu wieloczęściowe
dostarczenia (tekst z multimediami, tekst podzielony na fragmenty, zastępcza karta)
można odtwarzać i deduplikować po ponownym uruchomieniu.

### Ograniczenie publicznego SDK

Refaktoryzacja wchłonęła lub oznaczyła jako przestarzałe: funkcje pomocnicze
`reply-runtime`, `reply-dispatch-runtime`, `reply-reference`, `reply-chunking`
i `reply-payload` udostępniane jako publiczne API, `inbound-reply-dispatch`,
`channel-reply-pipeline` oraz większość publicznych zastosowań `outbound-runtime`.
`src/plugin-sdk/channel-message.ts` jest teraz modułem zbiorczym oznaczonym
`@deprecated`, który ponownie eksportuje elementy z `channel-outbound` /
`channel-inbound`; aliasy środowiska uruchomieniowego `channel.turn` zostały usunięte,
a stara strona dokumentacji `/plugins/sdk-channel-turn` przekierowuje do
[API kanału przychodzącego](/pl/plugins/sdk-channel-inbound). Nowy kod Pluginu powinien
bezpośrednio korzystać z `channel-outbound` i `channel-inbound`.

## Różnice między implementacją a pierwotnym projektem

Poniższy szkic projektu nigdy nie został wdrożony dosłownie w opisanej postaci.
Zachowano go dla historycznej dokładności; tych nazw typów nie należy traktować jako
bieżącego API.

- **Brak `MessageOrigin` / `shouldDropOpenClawEcho`.** Pierwotny plan zakładał
  znacznik pochodzenia `source: "openclaw"` dla wiadomości o awariach Gateway oraz
  współdzielony predykat odrzucający oznaczone echa autorstwa bota we współdzielonych
  pokojach przed autoryzacją `allowBots`. Ten typ i predykat nie istnieją w bazie kodu.
  Samo `allowBots` jest rzeczywistym kluczem konfiguracji poszczególnych kanałów
  (Slack, Discord, Google Chat i innych), ale mechanizm oznaczania pochodzenia, który
  miał je chronić, nigdy nie został zbudowany. Tłumienie ech awarii Gateway
  w pokojach z włączonymi botami pozostaje otwartą luką, a nie wdrożoną gwarancją.
- **Brak ujednoliconej przestrzeni nazw `core.messages.receive/send/live/state`.**
  Wdrożone funkcje znajdują się bezpośrednio w `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`), zamiast za fasadą
  `core.messages.*`.
- **Brak ogólnego znormalizowanego typu wiadomości `ChannelMessage` /
  `MessageTarget` / `MessageRelation`.** Rdzeń nadal przekazuje konkretne ładunki
  odpowiedzi (`ReplyPayload`) i konteksty właściwe dla poszczególnych kanałów przez
  adaptery wysyłania, zamiast używać jednej niezależnej od platformy postaci
  wiadomości z relacją `kind: "reply" | "followup" | "broadcast" | "system"`.
- **Nazwy zasad potwierdzania różnią się od szkicu.** Wdrożono:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Pierwotny szkic używał `immediate | after-record | after-durable-send | manual`
  z polem przyczyny przekroczenia limitu czasu Webhooka; tej struktury nie zbudowano.
- **Klucze możliwości `DurableFinalDeliveryRequirementMap` zastąpiły naszkicowany
  obiekt `MessageCapabilities`.** Możliwości są płaskimi flagami logicznymi (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) weryfikowanymi przez `verifyDurableFinalCapabilityProofs`, zamiast
  zagnieżdżonej struktury w stylu `text.chunking` / `attachments.voice`.

## Konkretne zagrożenia związane z migracją (nadal istotne)

Te efekty uboczne specyficzne dla kanałów istniały przed refaktoryzacją i muszą nadal
działać w nowych ścieżkach wysyłania. Nie są hipotetyczne: każdy z nich jest
obecnie zaimplementowany i kluczowy dla działania systemu.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): monitor po pomyślnym wysłaniu zapisuje wysłane
  wiadomości w pamięci podręcznej echa. Trwałe wysyłanie wiadomości końcowych
  musi nadal uzupełniać tę pamięć podręczną, w przeciwnym razie OpenClaw może
  ponownie przetworzyć własne odpowiedzi jako przychodzące wiadomości użytkownika.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): dołącza opcjonalny podpis
  modelu i po odpowiedziach grupowych zapisuje wątki, w których uczestniczono.
  Trwałe dostarczanie nie może pomijać tych efektów.
- **Discord i inne przygotowane mechanizmy wysyłania** już obsługują bezpośrednie
  dostarczanie i podgląd. Kanał nie zapewnia pełnej trwałości, dopóki jego
  przygotowany mechanizm wysyłania nie kieruje jawnie wiadomości końcowych przez
  kontekst wysyłania; nie należy zakładać, że sam adapter ogólny zapewnia tę obsługę.
- **Ciche dostarczanie awaryjne Telegramu** musi po dzieleniu na fragmenty lub
  projekcji awaryjnej dostarczyć całą tablicę wynikowych ładunków, a nie tylko
  pierwszy ładunek.
- **LINE, Zalo, Nostr** i podobne ścieżki pomocnicze mogą obsługiwać tokeny
  odpowiedzi, pośredniczenie w przesyłaniu multimediów, pamięci podręczne
  wysłanych wiadomości lub cele dostępne wyłącznie przez wywołania zwrotne.
  Pozostają one w mechanizmie dostarczania zarządzanym przez kanał, dopóki ta
  semantyka nie zostanie odwzorowana przez adapter wysyłania i objęta testami.
- **Funkcje pomocnicze bezpośrednich wiadomości prywatnych** mogą korzystać
  z wywołania zwrotnego odpowiedzi, które jest jedynym poprawnym celem transportu.
  Ogólny mechanizm wysyłania nie może odgadywać celu na podstawie nieprzetworzonych
  pól platformy i pomijać tego wywołania zwrotnego.

## Klasyfikacja błędów

Adaptery klasyfikują błędy transportu w zamknięte kategorie w stylu
`DeliveryFailureKind` (przejściowy, limit szybkości, uwierzytelnianie,
uprawnienia, nie znaleziono, nieprawidłowy ładunek, konflikt, anulowanie,
nieznany). Zasady warstwy głównej:

- Ponawiaj próby po błędach przejściowych i błędach limitu szybkości.
- Nie ponawiaj prób po błędach nieprawidłowego ładunku, chyba że istnieje
  awaryjny sposób renderowania.
- Nie ponawiaj prób po błędach uwierzytelniania ani uprawnień, dopóki
  konfiguracja się nie zmieni.
- W przypadku błędu „nie znaleziono” pozwól, aby finalizacja na żywo przeszła
  z edycji na wysłanie nowej wiadomości, jeśli kanał deklaruje, że jest to bezpieczne.
- W przypadku konfliktu użyj stanu potwierdzenia/idempotencji, aby ustalić,
  czy wiadomość już istnieje.
- Każdy błąd występujący po wywołaniu platformy, które mogło zakończyć się
  powodzeniem, lecz przed zatwierdzeniem potwierdzenia, otrzymuje kategorię
  `unknown_after_send`, chyba że adapter udowodni, że operacja na platformie
  nie została wykonana.

## Otwarte pytania

- Czy Telegram powinien ostatecznie zastąpić mechanizm odpytywania grammY
  (`1.43.0`) w pełni trwałym źródłem odpytywania, które kontroluje ponowne
  dostarczanie na poziomie platformy, a nie tylko utrwalony znacznik wznowienia
  OpenClaw (`safeCompletedUpdateId`).
- Czy stan podglądu na żywo powinien znajdować się w tym samym rekordzie co
  zamiar wysłania wiadomości końcowej, czy w równoległym magazynie stanu na żywo.
- Czy tłumienie echa po awarii Gateway we współdzielonych pokojach z włączonymi
  botami wymaga pierwotnie planowanego mechanizmu oznaczania źródła, prostszego
  kontraktu dla poszczególnych kanałów, czy też wykracza poza zakres.
- Które kanały mają natywną obsługę źródła/metadanych do tłumienia echa między
  botami, a które wymagają trwałego rejestru wiadomości wychodzących.

## Powiązane

- [Wiadomości](/pl/concepts/messages)
- [Przesyłanie strumieniowe i dzielenie na fragmenty](/pl/concepts/streaming)
- [Wersje robocze postępu](/pl/concepts/progress-drafts)
- [Zasady ponawiania prób](/pl/concepts/retry)
- [API wiadomości wychodzących kanału](/pl/plugins/sdk-channel-outbound)
- [API wiadomości przychodzących kanału](/pl/plugins/sdk-channel-inbound)
