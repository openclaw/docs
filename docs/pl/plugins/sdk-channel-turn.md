---
read_when:
    - Tworzysz Plugin kanału i chcesz korzystać ze współdzielonego cyklu życia przychodzącej tury
    - Migrujesz monitor kanału z ręcznie napisanego kodu łączącego rejestrowanie i wysyłanie
    - Musisz rozumieć etapy dopuszczania, ingest, klasyfikacji, kontroli wstępnej, rozwiązywania, rejestrowania, wysyłania i finalizacji
sidebarTitle: Channel turn
summary: runtime.channel.turn -- współdzielone jądro przychodzących tur, którego wbudowane i zewnętrzne pluginy kanałów używają do rejestrowania, wysyłania i finalizowania tur agenta
title: Jądro tury kanału
x-i18n:
    generated_at: "2026-05-10T19:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Jądro tury kanału to współdzielona maszyna stanów przychodzących, która przekształca znormalizowane zdarzenie platformy w turę agenta. Pluginy kanałów dostarczają fakty platformy i wywołanie zwrotne dostarczania. Core odpowiada za orkiestrację: przyjmowanie, klasyfikowanie, preflight, rozwiązywanie, autoryzowanie, składanie, rejestrowanie, wysyłanie i finalizowanie.

Użyj tego, gdy Twój Plugin znajduje się na gorącej ścieżce wiadomości przychodzących. Dla zdarzeń innych niż wiadomości (polecenia slash, modale, interakcje przycisków, zdarzenia cyklu życia, reakcje, stan głosowy) trzymaj je lokalnie w Pluginie. Jądro obejmuje tylko zdarzenia, które mogą stać się tekstową turą agenta.

<Info>
  Do jądra dociera się przez wstrzyknięte środowisko uruchomieniowe Pluginu jako `runtime.channel.turn.*`. Typ środowiska uruchomieniowego Pluginu jest eksportowany z `openclaw/plugin-sdk/core`, więc zewnętrzne natywne Pluginy mogą używać tych punktów wejścia tak samo jak dołączone Pluginy kanałów.
</Info>

## Dlaczego współdzielone jądro

Pluginy kanałów powtarzają ten sam przepływ przychodzący: normalizowanie, trasowanie, bramkowanie, budowanie kontekstu, rejestrowanie metadanych sesji, wysyłanie tury agenta, finalizowanie stanu dostarczania. Bez współdzielonego jądra zmiana dotycząca bramkowania wzmianek, widocznych odpowiedzi tylko dla narzędzi, metadanych sesji, oczekującej historii lub finalizacji wysyłki musiałaby być stosowana osobno dla każdego kanału.

Jądro celowo rozdziela cztery pojęcia:

- `ConversationFacts`: skąd pochodzi wiadomość
- `RouteFacts`: który agent i która sesja powinny ją przetworzyć
- `ReplyPlanFacts`: dokąd powinny trafić widoczne odpowiedzi
- `MessageFacts`: jaką treść i dodatkowy kontekst powinien zobaczyć agent

W praktyce DM-y Slack, tematy Telegram, wątki Matrix i sesje tematów Feishu rozróżniają je wszystkie. Traktowanie ich jako jednego identyfikatora z czasem powoduje rozbieżności.

## Cykl życia etapów

Jądro uruchamia ten sam stały potok niezależnie od kanału:

1. `ingest` -- adapter przekształca surowe zdarzenie platformy w `NormalizedTurnInput`
2. `classify` -- adapter deklaruje, czy to zdarzenie może rozpocząć turę agenta
3. `preflight` -- adapter wykonuje deduplikację, wykrywanie własnego echa, uzupełnianie, debounce, deszyfrowanie, częściowe wstępne wypełnienie faktów
4. `resolve` -- adapter zwraca w pełni złożoną turę (trasa, plan odpowiedzi, wiadomość, dostarczanie)
5. `authorize` -- zasady DM, grup, wzmianek i poleceń stosowane do złożonych faktów
6. `assemble` -- `FinalizedMsgContext` budowany z faktów przez `buildContext`
7. `record` -- metadane sesji przychodzącej i ostatnia trasa utrwalane
8. `dispatch` -- tura agenta wykonywana przez buforowany dyspozytor bloków
9. `finalize` -- adapter `onFinalize` uruchamia się nawet przy błędzie wysyłki

Każdy etap emituje ustrukturyzowane zdarzenie dziennika, gdy podano wywołanie zwrotne `log`. Zobacz [Obserwowalność](#observability).

## Rodzaje dopuszczenia

Jądro nie zgłasza wyjątku, gdy tura zostanie zablokowana. Zwraca `ChannelTurnAdmission`:

| Rodzaj        | Kiedy                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Tura zostaje dopuszczona. Tura agenta jest uruchamiana, a widoczna ścieżka odpowiedzi zostaje użyta.                                       |
| `observeOnly` | Tura przechodzi od początku do końca, ale adapter dostarczania nie wysyła nic widocznego. Używane dla agentów obserwatorów emisji i innych pasywnych przepływów wieloagentowych. |
| `handled`     | Zdarzenie platformy zostało obsłużone lokalnie (cykl życia, reakcja, przycisk, modal). Jądro pomija wysyłkę.                              |
| `drop`        | Ścieżka pominięcia. Opcjonalnie `recordHistory: true` zachowuje wiadomość w oczekującej historii grupy, aby przyszła wzmianka miała kontekst. |

Dopuszczenie może pochodzić z `classify` (klasa zdarzenia stwierdziła, że nie może rozpocząć tury), z `preflight` (deduplikacja, własne echo, brak wzmianki z zapisem historii) albo z samego `resolveTurn`.

## Punkty wejścia

Środowisko uruchomieniowe udostępnia trzy preferowane punkty wejścia, aby adaptery mogły włączyć się na poziomie pasującym do kanału.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dwa starsze helpery środowiska uruchomieniowego pozostają dostępne dla zgodności z Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Użyj, gdy Twój kanał może wyrazić swój przepływ przychodzący jako `ChannelTurnAdapter<TRaw>`. Adapter ma wywołania zwrotne dla `ingest`, opcjonalne `classify`, opcjonalne `preflight`, obowiązkowe `resolveTurn` oraz opcjonalne `onFinalize`.

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

`run` ma właściwy kształt, gdy kanał ma niewielką logikę adaptera i korzysta z przejęcia cyklu życia przez hooki.

### runAssembled

Użyj, gdy kanał rozwiązał już trasowanie, zbudował `FinalizedMsgContext`
i potrzebuje tylko współdzielonej kolejności rejestrowania, potoku odpowiedzi,
wysyłki oraz finalizacji. To preferowany kształt dla prostych dołączonych
ścieżek przychodzących, które w przeciwnym razie powtarzałyby boilerplate
`createChannelMessageReplyPipeline(...)` i `runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Wybierz `runAssembled` zamiast `runPrepared`, gdy jedynym zachowaniem wysyłki
należącym do kanału jest końcowe dostarczenie payloadu plus opcjonalne pisanie,
opcje odpowiedzi, trwałe dostarczanie lub rejestrowanie błędów.

### runPrepared

Użyj, gdy kanał ma złożony lokalny dyspozytor z podglądami, ponowieniami, edycjami lub bootstrapem wątku, który musi pozostać własnością kanału. Jądro nadal rejestruje sesję przychodzącą przed wysyłką i udostępnia jednolity `DispatchedChannelTurnResult`.

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

Bogate kanały (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) używają `runPrepared`, ponieważ ich dyspozytor orkiestruje zachowanie specyficzne dla platformy, którego jądro nie może poznawać.

### buildContext

Czysta funkcja, która mapuje pakiety faktów na `FinalizedMsgContext`. Użyj jej, gdy Twój kanał ręcznie obsługuje część potoku, ale chce zachować spójny kształt kontekstu.

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

`buildContext` jest też przydatne wewnątrz wywołań zwrotnych `resolveTurn` podczas składania tury dla `run`.

<Note>
  Przestarzałe helpery SDK, takie jak `dispatchInboundReplyWithBase`, nadal przechodzą przez helper złożonej tury. Nowy kod Pluginu powinien używać `run` albo `runPrepared`.
</Note>

## Typy faktów

Fakty konsumowane przez jądro z Twojego adaptera są niezależne od platformy. Przetłumacz obiekty platformy na te kształty przed przekazaniem ich do jądra.

### NormalizedTurnInput

| Pole              | Cel                                                                          |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Stabilny identyfikator wiadomości używany do deduplikacji i dzienników       |
| `timestamp`       | Opcjonalny czas epoki w ms                                                   |
| `rawText`         | Treść otrzymana z platformy                                                  |
| `textForAgent`    | Opcjonalnie oczyszczona treść dla agenta (usunięcie wzmianki, przycięcie pisania) |
| `textForCommands` | Opcjonalna treść używana do parsowania `/command`                            |
| `raw`             | Opcjonalna referencja przekazywana dalej dla wywołań zwrotnych adaptera, które potrzebują oryginału |

### ChannelEventClass

| Pole                   | Cel                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Jeśli false, jądro zwraca `{ kind: "handled" }`                        |
| `requiresImmediateAck` | Wskazówka dla adapterów, które muszą potwierdzić ACK przed wysyłką     |

### SenderFacts

| Pole           | Cel                                                             |
| -------------- | --------------------------------------------------------------- |
| `id`           | Stabilny identyfikator nadawcy na platformie                    |
| `name`         | Nazwa wyświetlana                                               |
| `username`     | Uchwyt, jeśli różni się od `name`                               |
| `tag`          | Dyskryminator w stylu Discord lub tag platformy                 |
| `roles`        | Identyfikatory ról, używane do dopasowywania listy dozwolonych ról członków |
| `isBot`        | Prawda, gdy nadawca jest znanym botem (jądro używa do odrzucania) |
| `isSelf`       | Prawda, gdy nadawca jest skonfigurowanym agentem                |
| `displayLabel` | Wstępnie wyrenderowana etykieta dla tekstu koperty              |

### ConversationFacts

| Pole              | Cel                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` albo `channel`                                     |
| `id`              | Identyfikator konwersacji używany do trasowania                      |
| `label`           | Ludzka etykieta dla koperty                                          |
| `spaceId`         | Opcjonalny identyfikator zewnętrznej przestrzeni (obszar roboczy Slack, homeserver Matrix) |
| `parentId`        | Identyfikator zewnętrznej konwersacji, gdy jest to wątek             |
| `threadId`        | Identyfikator wątku, gdy ta wiadomość znajduje się w wątku           |
| `nativeChannelId` | Natywny identyfikator kanału platformy, gdy różni się od identyfikatora trasowania |
| `routePeer`       | Peer używany do wyszukiwania `resolveAgentRoute`                     |

### RouteFacts

| Pole                    | Cel                                                       |
| ----------------------- | --------------------------------------------------------- |
| `agentId`               | Agent, który powinien obsłużyć tę turę                    |
| `accountId`             | Opcjonalne nadpisanie (kanały z wieloma kontami)          |
| `routeSessionKey`       | Klucz sesji używany do routingu                           |
| `dispatchSessionKey`    | Klucz sesji używany przy dispatchu, gdy różni się od klucza routingu |
| `persistedSessionKey`   | Klucz sesji zapisywany w utrwalonych metadanych sesji     |
| `parentSessionKey`      | Sesja nadrzędna dla sesji rozgałęzionych/wątkowanych      |
| `modelParentSessionKey` | Sesja nadrzędna po stronie modelu dla sesji rozgałęzionych |
| `mainSessionKey`        | Główne przypięcie właściciela DM dla bezpośrednich rozmów |
| `createIfMissing`       | Pozwala etapowi zapisu utworzyć brakujący wiersz sesji    |

### ReplyPlanFacts

| Pole                      | Cel                                                     |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Logiczny cel odpowiedzi zapisywany w kontekście `To`    |
| `originatingTo`           | Początkowy cel kontekstu (`OriginatingTo`)              |
| `nativeChannelId`         | Natywny dla platformy identyfikator kanału do dostarczenia |
| `replyTarget`             | Ostateczne miejsce docelowe widocznej odpowiedzi, jeśli różni się od `to` |
| `deliveryTarget`          | Niższego poziomu nadpisanie dostarczenia                |
| `replyToId`               | Identyfikator cytowanej/zakotwiczonej wiadomości        |
| `replyToIdFull`           | Pełna postać cytowanego identyfikatora, gdy platforma ma oba |
| `messageThreadId`         | Identyfikator wątku w czasie dostarczenia               |
| `threadParentId`          | Identyfikator wiadomości nadrzędnej wątku               |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` albo `none`      |

### AccessFacts

`AccessFacts` przenosi wartości logiczne potrzebne etapowi autoryzacji. Dopasowywanie tożsamości pozostaje w kanale: kernel zużywa tylko wynik.

| Pole       | Cel                                                                       |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Decyzja DM allow/pairing/deny oraz lista `allowFrom`                      |
| `group`    | Polityka grupy, zezwolenie trasy, zezwolenie nadawcy, lista dozwolonych, wymaganie wzmianki |
| `commands` | Autoryzacja poleceń w skonfigurowanych autoryzatorach                    |
| `mentions` | Czy wykrywanie wzmianek jest możliwe i czy agent został wspomniany        |

### MessageFacts

| Pole             | Cel                                                            |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Ostateczna treść koperty (sformatowana)                        |
| `rawBody`        | Surowa treść przychodząca                                      |
| `bodyForAgent`   | Treść widoczna dla agenta                                      |
| `commandBody`    | Treść używana do parsowania poleceń                            |
| `envelopeFrom`   | Wstępnie wyrenderowana etykieta nadawcy dla koperty            |
| `senderLabel`    | Opcjonalne nadpisanie wyrenderowanego nadawcy                  |
| `preview`        | Krótki zredagowany podgląd dla logów                           |
| `inboundHistory` | Ostatnie wpisy historii przychodzącej, gdy kanał utrzymuje bufor |

### SupplementalContextFacts

Kontekst uzupełniający obejmuje kontekst cytatu, przekazania i inicjalizacji wątku. Kernel stosuje skonfigurowaną politykę `contextVisibility`. Adapter kanału dostarcza tylko fakty i flagi `senderAllowed`, aby polityka międzykanałowa pozostała spójna.

### InboundMediaFacts

Media mają kształt faktów. Pobieranie z platformy, autoryzacja, polityka SSRF, reguły CDN i odszyfrowywanie pozostają lokalne dla kanału. Kernel mapuje fakty na `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` i `MediaTranscribedIndexes`.

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

`resolveTurn` zwraca `ChannelTurnResolved`, czyli `AssembledChannelTurn` z opcjonalnym rodzajem dopuszczenia. Zwrócenie `{ admission: { kind: "observeOnly" } }` uruchamia turę bez tworzenia widocznego wyniku. Adapter nadal jest właścicielem callbacku dostarczenia; dla tej tury staje się on po prostu operacją bez efektu.

`onFinalize` uruchamia się dla każdego wyniku, w tym błędów dispatchu. Użyj go do czyszczenia oczekującej historii grupy, usuwania reakcji potwierdzenia, zatrzymywania wskaźników statusu i opróżniania stanu lokalnego.

## Adapter dostarczenia

Kernel nie wywołuje platformy bezpośrednio. Kanał przekazuje kernelowi `ChannelTurnDeliveryAdapter`:

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

`deliver` jest wywoływane raz dla każdego buforowanego fragmentu odpowiedzi. Podczas migracji cyklu życia wiadomości dostarczenie złożonej tury kanału jest domyślnie własnością kanału: pominięte pole `durable` oznacza, że kernel musi wywołać `deliver` bezpośrednio i nie może kierować przez ogólne dostarczanie wychodzące. Ustaw `durable` dopiero po audycie kanału, który dowodzi, że ogólna ścieżka wysyłania zachowuje poprzednie zachowanie dostarczania, w tym cele odpowiedzi/wątków, obsługę mediów, pamięci podręczne wysłanych wiadomości/własnego echa, czyszczenie statusu i zwracane identyfikatory wiadomości. `durable: false` pozostaje zgodnym zapisem dla „użyj callbacku należącego do kanału”, ale niezmitigrowane kanały nie powinny musieć go dodawać. Zwracaj identyfikatory wiadomości platformy, gdy kanał je ma, aby dispatcher mógł zachować kotwice wątku i edytować późniejsze fragmenty; nowsze ścieżki dostarczania powinny także zwracać `receipt`, aby odzyskiwanie, finalizacja podglądu i tłumienie duplikatów mogły odejść od `messageIds`. Dla tur tylko obserwacyjnych zwróć `{ visibleReplySent: false }` albo użyj `createNoopChannelTurnDeliveryAdapter()`.

Kanały używające `runPrepared` z dispatcherem w pełni należącym do kanału nie mają `ChannelTurnDeliveryAdapter`. Te dispatchery domyślnie nie są trwałe. Powinny zachować swoją bezpośrednią ścieżkę dostarczania, dopóki jawnie nie wybiorą nowego kontekstu wysyłania z kompletnym celem, adapterem bezpiecznym dla ponownego odtwarzania, kontraktem potwierdzenia i hookami efektów ubocznych kanału.

Publiczne helpery zgodności, takie jak `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` i helpery bezpośrednich DM, muszą zachować zachowanie podczas migracji. Nie powinny wywoływać ogólnego trwałego dostarczania przed należącymi do wywołującego callbackami `deliver` lub `reply`.

## Opcje zapisu

Etap zapisu opakowuje `recordInboundSession`. Większość kanałów może używać wartości domyślnych. Nadpisz przez `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Dispatcher czeka na etap zapisu. Jeśli zapis zgłosi wyjątek, kernel uruchamia `onPreDispatchFailure` (gdy podano do `runPrepared`) i ponownie zgłasza wyjątek.

## Obserwowalność

Każdy etap emituje zdarzenie strukturalne, gdy podano callback `log`:

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

Logowane etapy: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Unikaj logowania surowych treści; używaj `MessageFacts.preview` dla krótkich zredagowanych podglądów.

## Co pozostaje lokalne dla kanału

Kernel odpowiada za orkiestrację. Kanał nadal odpowiada za:

- Transporty platformy (gateway, REST, websocket, polling, webhooki)
- Rozpoznawanie tożsamości i dopasowywanie nazw wyświetlanych
- Polecenia natywne, polecenia slash, autouzupełnianie, modale, przyciski, stan głosu
- Renderowanie kart, modali i kart adaptacyjnych
- Autoryzację mediów, reguły CDN, szyfrowane media, transkrypcję
- API edycji, reakcji, redakcji i obecności
- Backfill i pobieranie historii po stronie platformy
- Przepływy parowania wymagające weryfikacji specyficznej dla platformy

Jeśli dwa kanały zaczynają potrzebować tego samego helpera dla jednego z tych obszarów, wyodrębnij wspólny helper SDK zamiast przenosić go do kernela.

## Stabilność

`runtime.channel.turn.*` jest częścią publicznej powierzchni runtime pluginu. Typy faktów (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) i kształty dopuszczenia (`ChannelTurnAdmission`, `ChannelEventClass`) są osiągalne przez `PluginRuntime` z `openclaw/plugin-sdk/core`.

Obowiązują reguły zgodności wstecznej: nowe pola faktów są addytywne, rodzaje dopuszczenia nie są zmieniane nazwą, a nazwy punktów wejścia pozostają stabilne. Nowe potrzeby kanału wymagające zmiany nieaddytywnej muszą przejść przez proces migracji plugin SDK.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) dla planowanego cyklu życia wysyłania/odbierania/live, który opakuje ten kernel
- [Budowanie pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla szerszego kontraktu pluginu kanału
- [Helpery runtime pluginu](/pl/plugins/sdk-runtime) dla innych powierzchni `runtime.*`
- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture-internals) dla potoku ładowania i mechaniki rejestru
