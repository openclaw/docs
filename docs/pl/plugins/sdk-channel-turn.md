---
read_when:
    - Budujesz Plugin kanału i chcesz korzystać ze współdzielonego cyklu życia przychodzącego turnu
    - Migrujesz monitor kanału z ręcznie napisanej warstwy rejestrowania/rozdzielania
    - Musisz zrozumieć etapy przyjęcia, pobierania, klasyfikacji, kontroli wstępnej, rozwiązywania, rejestrowania, wysyłania i finalizacji.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- współdzielone jądro przychodzących tur, którego do rejestrowania, wysyłania i finalizowania tur agentów używają dołączone i zewnętrzne pluginy kanałów
title: Jądro tury kanału
x-i18n:
    generated_at: "2026-04-30T10:08:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Jądro tur kanału to wspólna maszyna stanów przychodzących, która przekształca znormalizowane zdarzenie platformy w turę agenta. Pluginy kanałów dostarczają fakty platformy i wywołanie zwrotne dostarczania. Rdzeń odpowiada za orkiestrację: przyjmowanie, klasyfikowanie, kontrole wstępne, rozwiązywanie, autoryzowanie, składanie, rejestrowanie, wysyłanie i finalizowanie.

Użyj tego, gdy Twój plugin znajduje się na gorącej ścieżce wiadomości przychodzących. Zdarzenia niebędące wiadomościami (polecenia ukośnikowe, modale, interakcje przycisków, zdarzenia cyklu życia, reakcje, stan głosu) pozostaw lokalnie w pluginie. Jądro odpowiada tylko za zdarzenia, które mogą stać się tekstową turą agenta.

<Info>
  Do jądra dociera się przez wstrzyknięte środowisko uruchomieniowe pluginu jako `runtime.channel.turn.*`. Typ środowiska uruchomieniowego pluginu jest eksportowany z `openclaw/plugin-sdk/core`, więc natywne pluginy firm trzecich mogą używać tych punktów wejścia tak samo jak dołączone pluginy kanałów.
</Info>

## Dlaczego wspólne jądro

Pluginy kanałów powtarzają ten sam przepływ przychodzący: normalizacja, trasowanie, bramkowanie, budowanie kontekstu, rejestrowanie metadanych sesji, wysyłanie tury agenta, finalizowanie stanu dostarczania. Bez wspólnego jądra zmianę bramkowania wzmianek, widocznych odpowiedzi tylko narzędziowych, metadanych sesji, oczekującej historii lub finalizacji wysyłania trzeba stosować osobno dla każdego kanału.

Jądro celowo rozdziela cztery pojęcia:

- `ConversationFacts`: skąd pochodzi wiadomość
- `RouteFacts`: który agent i która sesja powinny ją przetworzyć
- `ReplyPlanFacts`: dokąd powinny trafić widoczne odpowiedzi
- `MessageFacts`: jaką treść i dodatkowy kontekst powinien zobaczyć agent

W praktyce DM-y Slacka, tematy Telegram, wątki Matrix i sesje tematów Feishu rozróżniają je wszystkie. Traktowanie ich jako jednego identyfikatora z czasem powoduje rozjazdy.

## Cykl życia etapów

Jądro uruchamia ten sam stały potok niezależnie od kanału:

1. `ingest` -- adapter przekształca surowe zdarzenie platformy w `NormalizedTurnInput`
2. `classify` -- adapter deklaruje, czy to zdarzenie może rozpocząć turę agenta
3. `preflight` -- adapter wykonuje deduplikację, obsługę własnego echa, hydratację, debounce, odszyfrowanie, częściowe wstępne wypełnienie faktów
4. `resolve` -- adapter zwraca w pełni złożoną turę (trasę, plan odpowiedzi, wiadomość, dostarczanie)
5. `authorize` -- do złożonych faktów stosowane są zasady DM-ów, grup, wzmianek i poleceń
6. `assemble` -- `FinalizedMsgContext` budowany z faktów przez `buildContext`
7. `record` -- metadane sesji przychodzącej i ostatnia trasa utrwalane
8. `dispatch` -- tura agenta wykonywana przez buforowany dyspozytor bloków
9. `finalize` -- adapter `onFinalize` uruchamia się nawet przy błędzie wysyłania

Każdy etap emituje ustrukturyzowane zdarzenie dziennika, gdy podano wywołanie zwrotne `log`. Zobacz [Obserwowalność](#observability).

## Rodzaje dopuszczenia

Jądro nie zgłasza wyjątku, gdy tura zostaje zablokowana. Zwraca `ChannelTurnAdmission`:

| Rodzaj        | Kiedy                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Tura jest dopuszczona. Tura agenta działa, a ścieżka widocznej odpowiedzi jest używana.                                                      |
| `observeOnly` | Tura działa od początku do końca, ale adapter dostarczania nie wysyła niczego widocznego. Używane dla agentów-obserwatorów rozgłoszeniowych i innych pasywnych przepływów wieloagentowych. |
| `handled`     | Zdarzenie platformy zostało obsłużone lokalnie (cykl życia, reakcja, przycisk, modal). Jądro pomija wysyłanie.                               |
| `drop`        | Ścieżka pominięcia. Opcjonalnie `recordHistory: true` zachowuje wiadomość w oczekującej historii grupy, aby przyszła wzmianka miała kontekst. |

Dopuszczenie może pochodzić z `classify` (klasa zdarzenia stwierdziła, że nie może rozpocząć tury), z `preflight` (deduplikacja, własne echo, brak wzmianki z zapisem historii) albo z samego `resolveTurn`.

## Punkty wejścia

Środowisko uruchomieniowe udostępnia trzy preferowane punkty wejścia, aby adaptery mogły włączać się na poziomie pasującym do kanału.

```typescript
runtime.channel.turn.run(...)             // pełny potok sterowany przez adapter
runtime.channel.turn.runPrepared(...)     // kanał odpowiada za wysyłanie; jądro wykonuje record + finalize
runtime.channel.turn.buildContext(...)    // czyste fakty do mapowania FinalizedMsgContext
```

Dwa starsze pomocniki środowiska uruchomieniowego pozostają dostępne dla zgodności z Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // przestarzały alias zgodności; preferuj run
runtime.channel.turn.dispatchAssembled(...) // przestarzały alias zgodności; preferuj run lub runPrepared
```

### run

Użyj, gdy Twój kanał może wyrazić swój przepływ przychodzący jako `ChannelTurnAdapter<TRaw>`. Adapter ma wywołania zwrotne dla `ingest`, opcjonalne `classify`, opcjonalne `preflight`, obowiązkowe `resolveTurn` i opcjonalne `onFinalize`.

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

`run` ma właściwy kształt, gdy kanał ma niewielką logikę adaptera i korzysta na posiadaniu cyklu życia przez haki.

### runPrepared

Użyj, gdy kanał ma złożony lokalny dyspozytor z podglądami, ponowieniami, edycjami lub bootstrapem wątków, który musi pozostać własnością kanału. Jądro nadal rejestruje sesję przychodzącą przed wysłaniem i udostępnia jednolity `DispatchedChannelTurnResult`.

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

Bogate kanały (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) używają `runPrepared`, ponieważ ich dyspozytor orkiestruje zachowanie specyficzne dla platformy, którego jądro nie powinno poznawać.

### buildContext

Czysta funkcja, która mapuje pakiety faktów na `FinalizedMsgContext`. Użyj jej, gdy Twój kanał ręcznie implementuje część potoku, ale chce spójnego kształtu kontekstu.

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

`buildContext` przydaje się też wewnątrz wywołań zwrotnych `resolveTurn` podczas składania tury dla `run`.

<Note>
  Przestarzałe pomocniki SDK, takie jak `dispatchInboundReplyWithBase`, nadal przechodzą przez pomocnik złożonej tury. Nowy kod pluginu powinien używać `run` albo `runPrepared`.
</Note>

## Typy faktów

Fakty konsumowane przez jądro z Twojego adaptera są niezależne od platformy. Przetłumacz obiekty platformy na te kształty przed przekazaniem ich do jądra.

### NormalizedTurnInput

| Pole              | Cel                                                                          |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabilny identyfikator wiadomości używany do deduplikacji i dzienników       |
| `timestamp`       | Opcjonalny czas epoki w ms                                                   |
| `rawText`         | Treść odebrana z platformy                                                   |
| `textForAgent`    | Opcjonalnie oczyszczona treść dla agenta (usunięcie wzmianki, przycięcie pisania) |
| `textForCommands` | Opcjonalna treść używana do parsowania `/command`                            |
| `raw`             | Opcjonalne odwołanie przekazywane dalej dla wywołań zwrotnych adaptera, które potrzebują oryginału |

### ChannelEventClass

| Pole                   | Cel                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jeśli false, jądro zwraca `{ kind: "handled" }`                         |
| `requiresImmediateAck` | Wskazówka dla adapterów, które muszą wykonać ACK przed wysłaniem        |

### SenderFacts

| Pole           | Cel                                                             |
| -------------- | --------------------------------------------------------------- |
| `id`           | Stabilny identyfikator nadawcy na platformie                    |
| `name`         | Nazwa wyświetlana                                               |
| `username`     | Uchwyt, jeśli różni się od `name`                               |
| `tag`          | Dyskryminator w stylu Discorda albo tag platformy               |
| `roles`        | Identyfikatory ról, używane do dopasowywania listy dozwolonych ról członków |
| `isBot`        | True, gdy nadawca jest znanym botem (jądro używa do odrzucania) |
| `isSelf`       | True, gdy nadawca jest samym skonfigurowanym agentem            |
| `displayLabel` | Wstępnie wyrenderowana etykieta dla tekstu koperty              |

### ConversationFacts

| Pole              | Cel                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` albo `channel`                                     |
| `id`              | Identyfikator konwersacji używany do trasowania                      |
| `label`           | Czytelna etykieta koperty                                            |
| `spaceId`         | Opcjonalny identyfikator przestrzeni zewnętrznej (obszar roboczy Slacka, homeserver Matrix) |
| `parentId`        | Identyfikator konwersacji zewnętrznej, gdy to jest wątek             |
| `threadId`        | Identyfikator wątku, gdy ta wiadomość znajduje się w wątku           |
| `nativeChannelId` | Natywny identyfikator kanału platformy, gdy różni się od identyfikatora trasowania |
| `routePeer`       | Peer używany do wyszukiwania `resolveAgentRoute`                     |

### RouteFacts

| Pole                    | Cel                                                        |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agent, który powinien obsłużyć tę turę                     |
| `accountId`             | Opcjonalne nadpisanie (kanały z wieloma kontami)           |
| `routeSessionKey`       | Klucz sesji używany do trasowania                          |
| `dispatchSessionKey`    | Klucz sesji używany przy wysyłaniu, gdy różni się od klucza trasy |
| `persistedSessionKey`   | Klucz sesji zapisany w utrwalonych metadanych sesji        |
| `parentSessionKey`      | Rodzic dla sesji rozgałęzionych/wątkowanych                |
| `modelParentSessionKey` | Rodzic po stronie modelu dla sesji rozgałęzionych          |
| `mainSessionKey`        | Przypięcie właściciela głównego DM dla konwersacji bezpośrednich |
| `createIfMissing`       | Zezwól etapowi rejestrowania na utworzenie brakującego wiersza sesji |

### ReplyPlanFacts

| Pole                      | Cel                                                     |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Logiczny cel odpowiedzi zapisywany w kontekście `To`    |
| `originatingTo`           | Początkowy cel kontekstu (`OriginatingTo`)              |
| `nativeChannelId`         | Natywny dla platformy identyfikator kanału do dostarczenia |
| `replyTarget`             | Końcowy widoczny cel odpowiedzi, jeśli różni się od `to` |
| `deliveryTarget`          | Niższego poziomu nadpisanie miejsca dostarczenia        |
| `replyToId`               | Identyfikator cytowanej/zakotwiczonej wiadomości        |
| `replyToIdFull`           | Pełna postać cytowanego identyfikatora, gdy platforma ma obie |
| `messageThreadId`         | Identyfikator wątku w czasie dostarczenia               |
| `threadParentId`          | Identyfikator wiadomości nadrzędnej wątku               |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` lub `none`       |

### AccessFacts

`AccessFacts` przenosi wartości logiczne potrzebne etapowi autoryzacji. Dopasowywanie tożsamości pozostaje w kanale: kernel zużywa tylko wynik.

| Pole       | Cel                                                                       |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decyzja zezwolenia/parowania/odmowy dla DM oraz lista `allowFrom`          |
| `group`    | Zasady grupy, zezwolenie trasy, zezwolenie nadawcy, lista dozwolonych, wymóg wzmianki |
| `commands` | Autoryzacja poleceń w skonfigurowanych autoryzatorach                     |
| `mentions` | Czy wykrywanie wzmianek jest możliwe i czy agent został wspomniany        |

### MessageFacts

| Pole             | Cel                                                         |
| ---------------- | ----------------------------------------------------------- |
| `body`           | Końcowa treść koperty (sformatowana)                        |
| `rawBody`        | Surowa treść przychodząca                                   |
| `bodyForAgent`   | Treść widziana przez agenta                                 |
| `commandBody`    | Treść używana do parsowania poleceń                         |
| `envelopeFrom`   | Wstępnie wyrenderowana etykieta nadawcy dla koperty         |
| `senderLabel`    | Opcjonalne nadpisanie wyrenderowanego nadawcy               |
| `preview`        | Krótki zredagowany podgląd do logów                         |
| `inboundHistory` | Ostatnie wpisy historii przychodzącej, gdy kanał utrzymuje bufor |

### SupplementalContextFacts

Kontekst uzupełniający obejmuje kontekst cytatu, przekazania oraz inicjalizacji wątku. Kernel stosuje skonfigurowaną zasadę `contextVisibility`. Adapter kanału dostarcza tylko fakty i flagi `senderAllowed`, dzięki czemu zasady międzykanałowe pozostają spójne.

### InboundMediaFacts

Media mają postać faktów. Pobieranie platformowe, uwierzytelnianie, zasady SSRF, reguły CDN i deszyfrowanie pozostają lokalne dla kanału. Kernel mapuje fakty na `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` i `MediaTranscribedIndexes`.

## Kontrakt adaptera

Dla pełnego `run` kształt adaptera jest następujący:

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

`resolveTurn` zwraca `ChannelTurnResolved`, czyli `AssembledChannelTurn` z opcjonalnym rodzajem dopuszczenia. Zwrócenie `{ admission: { kind: "observeOnly" } }` uruchamia turę bez tworzenia widocznych danych wyjściowych. Adapter nadal jest właścicielem wywołania zwrotnego dostarczenia; dla tej tury staje się ono po prostu operacją bez efektu.

`onFinalize` uruchamia się dla każdego wyniku, w tym błędów wysyłki. Używaj go do czyszczenia oczekującej historii grupy, usuwania reakcji potwierdzenia, zatrzymywania wskaźników statusu i opróżniania stanu lokalnego.

## Adapter dostarczania

Kernel nie wywołuje platformy bezpośrednio. Kanał przekazuje kernelowi `ChannelTurnDeliveryAdapter`:

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

`deliver` jest wywoływane raz dla każdego buforowanego fragmentu odpowiedzi. Zwracaj identyfikatory wiadomości platformy, gdy kanał je ma, aby dyspozytor mógł zachować zakotwiczenia wątku i później edytować kolejne fragmenty. Dla tur tylko obserwacyjnych zwróć `{ visibleReplySent: false }` albo użyj `createNoopChannelTurnDeliveryAdapter()`.

## Opcje rekordu

Etap rekordu opakowuje `recordInboundSession`. Większość kanałów może używać wartości domyślnych. Nadpisz przez `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Dyspozytor czeka na etap rekordu. Jeśli rekord zgłosi wyjątek, kernel uruchamia `onPreDispatchFailure` (gdy podano je do `runPrepared`) i ponownie zgłasza wyjątek.

## Obserwowalność

Każdy etap emituje zdarzenie strukturalne, gdy podano wywołanie zwrotne `log`:

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

Logowane etapy: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Unikaj logowania surowych treści; używaj `MessageFacts.preview` do krótkich zredagowanych podglądów.

## Co pozostaje lokalne dla kanału

Kernel jest właścicielem orkiestracji. Kanał nadal jest właścicielem:

- Transportów platformy (Gateway, REST, websocket, polling, webhooki)
- Rozwiązywania tożsamości i dopasowywania nazw wyświetlanych
- Poleceń natywnych, poleceń slash, autouzupełniania, modali, przycisków, stanu głosu
- Renderowania kart, modali i kart adaptacyjnych
- Uwierzytelniania mediów, reguł CDN, mediów szyfrowanych, transkrypcji
- API edycji, reakcji, redakcji i obecności
- Backfillu i pobierania historii po stronie platformy
- Przepływów parowania wymagających weryfikacji specyficznej dla platformy

Jeśli dwa kanały zaczynają potrzebować tego samego pomocnika dla jednej z tych rzeczy, wyodrębnij współdzielony pomocnik SDK zamiast przenosić go do kernela.

## Stabilność

`runtime.channel.turn.*` jest częścią publicznej powierzchni środowiska uruchomieniowego pluginów. Typy faktów (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) i kształty dopuszczenia (`ChannelTurnAdmission`, `ChannelEventClass`) są dostępne przez `PluginRuntime` z `openclaw/plugin-sdk/core`.

Obowiązują zasady zgodności wstecznej: nowe pola faktów są addytywne, rodzaje dopuszczenia nie są przemianowywane, a nazwy punktów wejścia pozostają stabilne. Nowe potrzeby kanału wymagające zmiany nieaddytywnej muszą przejść przez proces migracji SDK pluginów.

## Powiązane

- [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla szerszego kontraktu pluginu kanału
- [Pomocnicy środowiska uruchomieniowego pluginu](/pl/plugins/sdk-runtime) dla innych powierzchni `runtime.*`
- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture-internals) dla potoku ładowania i mechaniki rejestru
