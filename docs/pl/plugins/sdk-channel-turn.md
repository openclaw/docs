---
read_when:
    - Budujesz Plugin kanału i chcesz skorzystać ze współdzielonego cyklu życia tury przychodzącej
    - Migrujesz monitor kanału z ręcznie napisanego kodu klejącego do rejestrowania i rozsyłania
    - Musisz rozumieć etapy dopuszczania, pobierania, klasyfikowania, kontroli wstępnej, rozwiązywania, rejestrowania, wysyłania i finalizowania
sidebarTitle: Channel turn
summary: runtime.channel.turn -- współdzielone jądro przychodzącej tury, którego dołączone i zewnętrzne Pluginy kanałów używają do rejestrowania, wysyłania i finalizowania tur agenta
title: Jądro tury kanału
x-i18n:
    generated_at: "2026-05-06T09:24:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Jądro przebiegu tury kanału to wspólna maszyna stanów wejściowych, która przekształca znormalizowane zdarzenie platformy w turę agenta. Pluginy kanałów dostarczają fakty platformy i callback dostarczania. Core odpowiada za orkiestrację: pobieranie, klasyfikację, preflight, rozwiązywanie, autoryzację, składanie, rejestrowanie, wysyłanie i finalizację.

Użyj tego, gdy Twój plugin znajduje się na gorącej ścieżce wiadomości przychodzących. W przypadku zdarzeń niebędących wiadomościami (polecenia slash, modale, interakcje przycisków, zdarzenia cyklu życia, reakcje, stan głosu) pozostaw je lokalnie w pluginie. Jądro odpowiada tylko za zdarzenia, które mogą stać się tekstową turą agenta.

<Info>
  Jądro jest dostępne przez wstrzyknięte środowisko uruchomieniowe pluginu jako `runtime.channel.turn.*`. Typ środowiska uruchomieniowego pluginu jest eksportowany z `openclaw/plugin-sdk/core`, więc zewnętrzne natywne pluginy mogą używać tych punktów wejścia tak samo jak dołączone pluginy kanałów.
</Info>

## Dlaczego wspólne jądro

Pluginy kanałów powtarzają ten sam przepływ wejściowy: normalizacja, trasowanie, bramkowanie, budowanie kontekstu, rejestrowanie metadanych sesji, wysyłanie tury agenta, finalizacja stanu dostarczania. Bez wspólnego jądra zmiana bramkowania wzmianek, widocznych odpowiedzi tylko z narzędzi, metadanych sesji, oczekującej historii albo finalizacji wysyłki musiałaby zostać zastosowana osobno dla każdego kanału.

Jądro celowo utrzymuje cztery pojęcia oddzielnie:

- `ConversationFacts`: skąd pochodzi wiadomość
- `RouteFacts`: który agent i która sesja powinny ją przetworzyć
- `ReplyPlanFacts`: dokąd mają trafić widoczne odpowiedzi
- `MessageFacts`: jaką treść i dodatkowy kontekst powinien zobaczyć agent

W praktyce DM-y Slacka, tematy Telegrama, wątki Matrixa i sesje tematów Feishu odróżniają je wszystkie. Traktowanie ich jako jednego identyfikatora z czasem powoduje rozjazdy.

## Cykl życia etapów

Jądro uruchamia ten sam stały potok niezależnie od kanału:

1. `ingest` -- adapter przekształca surowe zdarzenie platformy w `NormalizedTurnInput`
2. `classify` -- adapter deklaruje, czy to zdarzenie może rozpocząć turę agenta
3. `preflight` -- adapter wykonuje deduplikację, własne echo, hydratację, debounce, deszyfrowanie, częściowe wstępne uzupełnianie faktów
4. `resolve` -- adapter zwraca w pełni złożoną turę (trasa, plan odpowiedzi, wiadomość, dostarczanie)
5. `authorize` -- zasady DM-ów, grup, wzmianek i poleceń stosowane do złożonych faktów
6. `assemble` -- `FinalizedMsgContext` zbudowany z faktów przez `buildContext`
7. `record` -- metadane sesji wejściowej i ostatnia trasa zapisane trwale
8. `dispatch` -- tura agenta wykonana przez buforowany dispatcher bloków
9. `finalize` -- adapter `onFinalize` uruchamia się nawet przy błędzie wysyłki

Każdy etap emituje ustrukturyzowane zdarzenie logu, gdy podany jest callback `log`. Zobacz [Obserwowalność](#observability).

## Rodzaje przyjęcia

Jądro nie zgłasza wyjątku, gdy tura zostaje zablokowana. Zwraca `ChannelTurnAdmission`:

| Rodzaj        | Kiedy                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dispatch`    | Tura zostaje przyjęta. Tura agenta jest uruchamiana, a ścieżka widocznej odpowiedzi jest używana.                                                |
| `observeOnly` | Tura działa od początku do końca, ale adapter dostarczania nie wysyła niczego widocznego. Używane dla agentów obserwujących transmisje i innych pasywnych przepływów wieloagentowych. |
| `handled`     | Zdarzenie platformy zostało obsłużone lokalnie (cykl życia, reakcja, przycisk, modal). Jądro pomija wysyłkę.                                     |
| `drop`        | Ścieżka pominięcia. Opcjonalnie `recordHistory: true` zachowuje wiadomość w oczekującej historii grupy, aby przyszła wzmianka miała kontekst.     |

Przyjęcie może pochodzić z `classify` (klasa zdarzenia wskazała, że nie może ono rozpocząć tury), z `preflight` (deduplikacja, własne echo, brak wzmianki z zapisem historii) albo z samego `resolveTurn`.

## Punkty wejścia

Środowisko uruchomieniowe udostępnia trzy preferowane punkty wejścia, aby adaptery mogły włączać się na poziomie pasującym do kanału.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dwa starsze helpery środowiska uruchomieniowego pozostają dostępne dla zgodności z Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Użyj, gdy Twój kanał może wyrazić swój przepływ wejściowy jako `ChannelTurnAdapter<TRaw>`. Adapter ma callbacki dla `ingest`, opcjonalnego `classify`, opcjonalnego `preflight`, obowiązkowego `resolveTurn` i opcjonalnego `onFinalize`.

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

`run` ma właściwy kształt, gdy kanał ma niewielką logikę adaptera i korzysta na zarządzaniu cyklem życia przez hooki.

### runPrepared

Użyj, gdy kanał ma złożony lokalny dispatcher z podglądami, ponowieniami, edycjami albo bootstrapem wątku, który musi pozostać własnością kanału. Jądro nadal rejestruje sesję wejściową przed wysyłką i udostępnia jednolity `DispatchedChannelTurnResult`.

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

Bogate kanały (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) używają `runPrepared`, ponieważ ich dispatcher orkiestruje zachowanie specyficzne dla platformy, którego jądro nie może poznawać.

### buildContext

Czysta funkcja, która mapuje pakiety faktów na `FinalizedMsgContext`. Użyj jej, gdy Twój kanał ręcznie implementuje część potoku, ale chce zachować spójny kształt kontekstu.

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

`buildContext` jest także przydatne wewnątrz callbacków `resolveTurn` podczas składania tury dla `run`.

<Note>
  Przestarzałe helpery SDK, takie jak `dispatchInboundReplyWithBase`, nadal przechodzą przez helper złożonej tury. Nowy kod pluginu powinien używać `run` albo `runPrepared`.
</Note>

## Typy faktów

Fakty konsumowane przez jądro z adaptera są niezależne od platformy. Przetłumacz obiekty platformy na te kształty przed przekazaniem ich do jądra.

### NormalizedTurnInput

| Pole              | Cel                                                                          |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabilny identyfikator wiadomości używany do deduplikacji i logów            |
| `timestamp`       | Opcjonalny czas epoki w ms                                                   |
| `rawText`         | Treść odebrana z platformy                                                   |
| `textForAgent`    | Opcjonalnie oczyszczona treść dla agenta (usunięcie wzmianki, przycięcie wpisywania) |
| `textForCommands` | Opcjonalna treść używana do parsowania `/command`                            |
| `raw`             | Opcjonalna referencja przekazywana dalej dla callbacków adaptera wymagających oryginału |

### ChannelEventClass

| Pole                   | Cel                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jeśli false, jądro zwraca `{ kind: "handled" }`                        |
| `requiresImmediateAck` | Wskazówka dla adapterów, które muszą ACK przed wysyłką                 |

### SenderFacts

| Pole           | Cel                                                                  |
| -------------- | -------------------------------------------------------------------- |
| `id`           | Stabilny identyfikator nadawcy na platformie                         |
| `name`         | Nazwa wyświetlana                                                    |
| `username`     | Uchwyt, jeśli różni się od `name`                                    |
| `tag`          | Dyskryminator w stylu Discorda albo tag platformy                    |
| `roles`        | Identyfikatory ról, używane do dopasowywania listy dozwolonych ról członków |
| `isBot`        | True, gdy nadawca jest znanym botem (jądro używa tego do odrzucania) |
| `isSelf`       | True, gdy nadawca jest samym skonfigurowanym agentem                 |
| `displayLabel` | Wstępnie wyrenderowana etykieta dla tekstu koperty                   |

### ConversationFacts

| Pole              | Cel                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` albo `channel`                                     |
| `id`              | Identyfikator konwersacji używany do trasowania                      |
| `label`           | Czytelna etykieta koperty                                            |
| `spaceId`         | Opcjonalny identyfikator przestrzeni zewnętrznej (workspace Slacka, homeserver Matrixa) |
| `parentId`        | Identyfikator zewnętrznej konwersacji, gdy jest to wątek             |
| `threadId`        | Identyfikator wątku, gdy ta wiadomość znajduje się w wątku           |
| `nativeChannelId` | Natywny dla platformy identyfikator kanału, gdy różni się od identyfikatora trasowania |
| `routePeer`       | Peer używany do wyszukiwania `resolveAgentRoute`                     |

### RouteFacts

| Pole                    | Cel                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| `agentId`               | Agent, który powinien obsłużyć tę turę                            |
| `accountId`             | Opcjonalne nadpisanie (kanały wielokontowe)                       |
| `routeSessionKey`       | Klucz sesji używany do trasowania                                 |
| `dispatchSessionKey`    | Klucz sesji używany przy wysyłce, gdy różni się od klucza trasy   |
| `persistedSessionKey`   | Klucz sesji zapisywany w utrwalonych metadanych sesji             |
| `parentSessionKey`      | Element nadrzędny dla sesji rozgałęzionych/wątkowanych            |
| `modelParentSessionKey` | Element nadrzędny po stronie modelu dla sesji rozgałęzionych      |
| `mainSessionKey`        | Przypięcie właściciela głównego DM dla rozmów bezpośrednich       |
| `createIfMissing`       | Zezwól etapowi rejestrowania utworzyć brakujący wiersz sesji      |

### ReplyPlanFacts

| Pole                      | Cel                                                   |
| ------------------------- | ----------------------------------------------------- |
| `to`                      | Logiczny cel odpowiedzi zapisany w kontekście `To`    |
| `originatingTo`           | Pierwotny cel kontekstu (`OriginatingTo`)             |
| `nativeChannelId`         | Natywny dla platformy identyfikator kanału dostawy    |
| `replyTarget`             | Końcowy widoczny cel odpowiedzi, jeśli różni się od `to` |
| `deliveryTarget`          | Niskopoziomowe nadpisanie dostawy                     |
| `replyToId`               | Identyfikator cytowanej/zakotwiczonej wiadomości      |
| `replyToIdFull`           | Pełna postać cytowanego identyfikatora, gdy platforma ma oba |
| `messageThreadId`         | Identyfikator wątku w czasie dostawy                  |
| `threadParentId`          | Identyfikator wiadomości nadrzędnej wątku             |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` albo `none`    |

### AccessFacts

`AccessFacts` przenosi wartości logiczne potrzebne etapowi autoryzacji. Dopasowywanie tożsamości pozostaje w kanale: jądro zużywa tylko wynik.

| Pole       | Cel                                                                       |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decyzja zezwolenia/parowania/odmowy dla DM oraz lista `allowFrom`         |
| `group`    | Polityka grupy, zezwolenie trasy, zezwolenie nadawcy, lista zezwoleń, wymaganie wzmianki |
| `commands` | Autoryzacja poleceń w skonfigurowanych autoryzatorach                     |
| `mentions` | Czy wykrywanie wzmianek jest możliwe i czy agent został wspomniany        |

### MessageFacts

| Pole             | Cel                                                         |
| ---------------- | ----------------------------------------------------------- |
| `body`           | Końcowa treść koperty (sformatowana)                        |
| `rawBody`        | Surowa treść przychodząca                                  |
| `bodyForAgent`   | Treść widoczna dla agenta                                  |
| `commandBody`    | Treść używana do parsowania poleceń                         |
| `envelopeFrom`   | Wstępnie wyrenderowana etykieta nadawcy dla koperty         |
| `senderLabel`    | Opcjonalne nadpisanie wyrenderowanego nadawcy               |
| `preview`        | Krótki zredagowany podgląd do logów                         |
| `inboundHistory` | Ostatnie wpisy historii przychodzącej, gdy kanał utrzymuje bufor |

### SupplementalContextFacts

Kontekst uzupełniający obejmuje kontekst cytatu, przekazania dalej i rozruchu wątku. Jądro stosuje skonfigurowaną politykę `contextVisibility`. Adapter kanału dostarcza tylko fakty i flagi `senderAllowed`, aby polityka między kanałami pozostawała spójna.

### InboundMediaFacts

Media mają postać faktów. Pobieranie platformowe, uwierzytelnianie, polityka SSRF, reguły CDN i odszyfrowywanie pozostają lokalne dla kanału. Jądro mapuje fakty na `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` i `MediaTranscribedIndexes`.

## Kontrakt adaptera

Dla pełnego `run` kształt adaptera to:

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

`resolveTurn` zwraca `ChannelTurnResolved`, czyli `AssembledChannelTurn` z opcjonalnym rodzajem dopuszczenia. Zwrócenie `{ admission: { kind: "observeOnly" } }` uruchamia turę bez generowania widocznego wyjścia. Adapter nadal odpowiada za callback dostawy; po prostu staje się on operacją bez efektu dla tej tury.

`onFinalize` uruchamia się dla każdego wyniku, w tym błędów wysyłki. Używaj go do czyszczenia oczekującej historii grupy, usuwania reakcji potwierdzenia, zatrzymywania wskaźników statusu i opróżniania stanu lokalnego.

## Adapter dostawy

Jądro nie wywołuje platformy bezpośrednio. Kanał przekazuje jądru `ChannelTurnDeliveryAdapter`:

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

`deliver` jest wywoływane raz dla każdego buforowanego fragmentu odpowiedzi. Podczas migracji cyklu życia wiadomości dostawa złożonej tury kanału jest domyślnie własnością kanału: pominięte pole `durable` oznacza, że jądro musi wywołać `deliver` bezpośrednio i nie może kierować przez generyczną dostawę wychodzącą. Ustaw `durable` dopiero wtedy, gdy kanał został zweryfikowany i wiadomo, że generyczna ścieżka wysyłki zachowuje stare zachowanie dostawy, w tym cele odpowiedzi/wątku, obsługę mediów, pamięci podręczne wysłanych wiadomości/własnego echa, czyszczenie statusu oraz zwracane identyfikatory wiadomości. `durable: false` pozostaje zgodnym zapisem dla „użyj callbacku należącego do kanału”, ale niezmodernizowane kanały nie powinny musieć go dodawać. Zwracaj identyfikatory wiadomości platformy, gdy kanał je ma, aby dyspozytor mógł zachować kotwice wątku i później edytować kolejne fragmenty; nowsze ścieżki dostawy powinny też zwracać `receipt`, aby odzyskiwanie, finalizacja podglądu i tłumienie duplikatów mogły odejść od `messageIds`. Dla tur tylko obserwacyjnych zwróć `{ visibleReplySent: false }` albo użyj `createNoopChannelTurnDeliveryAdapter()`.

Kanały używające `runPrepared` z dyspozytorem w pełni należącym do kanału nie mają `ChannelTurnDeliveryAdapter`. Te dyspozytory domyślnie nie są trwałe. Powinny utrzymać bezpośrednią ścieżkę dostawy, dopóki jawnie nie zdecydują się na nowy kontekst wysyłania z kompletnym celem, adapterem bezpiecznym przy ponownym odtwarzaniu, kontraktem potwierdzenia i hookami efektów ubocznych kanału.

Publiczne pomocniki zgodności, takie jak `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` i pomocniki bezpośrednich DM, muszą zachowywać dotychczasowe zachowanie podczas migracji. Nie powinny wywoływać generycznej trwałej dostawy przed należącymi do wywołującego callbackami `deliver` lub `reply`.

## Opcje zapisu

Etap zapisu opakowuje `recordInboundSession`. Większość kanałów może używać wartości domyślnych. Nadpisuj przez `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Dyspozytor czeka na etap zapisu. Jeśli zapis rzuci wyjątek, jądro uruchamia `onPreDispatchFailure` (gdy podano je do `runPrepared`) i ponownie rzuca wyjątek.

## Obserwowalność

Każdy etap emituje zdarzenie strukturalne, gdy dostarczono callback `log`:

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

Jądro odpowiada za orkiestrację. Kanał nadal odpowiada za:

- Transporty platformowe (Gateway, REST, websocket, polling, webhooki)
- Rozwiązywanie tożsamości i dopasowywanie nazw wyświetlanych
- Natywne polecenia, polecenia ukośnikowe, autouzupełnianie, modale, przyciski, stan głosu
- Renderowanie kart, modali i kart adaptacyjnych
- Uwierzytelnianie mediów, reguły CDN, media szyfrowane, transkrypcję
- Interfejsy API edycji, reakcji, redakcji i obecności
- Backfill i pobieranie historii po stronie platformy
- Przepływy parowania wymagające weryfikacji specyficznej dla platformy

Jeśli dwa kanały zaczną potrzebować tego samego pomocnika dla jednej z tych rzeczy, wyodrębnij współdzielony pomocnik SDK zamiast wpychać go do jądra.

## Stabilność

`runtime.channel.turn.*` jest częścią publicznej powierzchni środowiska uruchomieniowego Plugin. Typy faktów (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) i kształty dopuszczenia (`ChannelTurnAdmission`, `ChannelEventClass`) są osiągalne przez `PluginRuntime` z `openclaw/plugin-sdk/core`.

Obowiązują reguły zgodności wstecznej: nowe pola faktów są addytywne, rodzaje dopuszczenia nie są zmieniane, a nazwy punktów wejścia pozostają stabilne. Nowe potrzeby kanałów wymagające zmiany nieaddytywnej muszą przejść przez proces migracji SDK Plugin.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) dla planowanego cyklu życia wysyłania/odbioru/live, który opakuje to jądro
- [Budowanie pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla szerszego kontraktu pluginów kanałów
- [Pomocniki środowiska uruchomieniowego Plugin](/pl/plugins/sdk-runtime) dla innych powierzchni `runtime.*`
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture-internals) dla potoku ładowania i mechaniki rejestru
