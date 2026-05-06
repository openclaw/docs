---
read_when:
    - Refaktoryzacja zachowania wysyłania lub odbierania przez kanał
    - Zmiana tury kanału, wysyłania odpowiedzi, kolejki wychodzącej, strumieniowania podglądu lub interfejsów API wiadomości Plugin SDK
    - Projektowanie nowego Pluginu kanału, który wymaga trwałych wysyłek, potwierdzeń, podglądów, edycji lub ponowień
summary: Plan projektowy ujednoliconego trwałego cyklu życia odbierania, wysyłania, podglądu, edycji i strumieniowania wiadomości
title: Refaktoryzacja cyklu życia wiadomości
x-i18n:
    generated_at: "2026-05-06T09:08:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ta strona jest docelowym projektem zastąpienia rozproszonych pomocników tury kanału, wysyłania odpowiedzi, strumieniowania podglądu i dostarczania wychodzącego jednym trwałym cyklem życia wiadomości.

W skrócie:

- Podstawowymi prymitywami rdzenia powinny być **odbieranie** i **wysyłanie**, a nie **odpowiadanie**.
- Odpowiedź jest tylko relacją w wiadomości wychodzącej.
- Tura to udogodnienie przetwarzania przychodzącego, a nie właściciel dostarczania.
- Wysyłanie musi być oparte na kontekście: `begin`, renderowanie, podgląd lub strumieniowanie, wysłanie końcowe,
  zatwierdzenie, niepowodzenie.
- Odbieranie także musi być oparte na kontekście: normalizacja, deduplikacja, routing, zapis,
  wysłanie do obsługi, potwierdzenie platformy, niepowodzenie.
- Publiczny SDK pluginów powinien zostać sprowadzony do jednej małej powierzchni wiadomości kanału.

## Problemy

Obecny stos kanałów wyrósł z kilku zasadnych lokalnych potrzeb:

- Proste adaptery przychodzące używają `runtime.channel.turn.run`.
- Rozbudowane adaptery używają `runtime.channel.turn.runPrepared`.
- Starsze pomocniki używają `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, pomocników ładunku odpowiedzi, dzielenia odpowiedzi na fragmenty,
  odwołań odpowiedzi oraz pomocników środowiska uruchomieniowego dla wiadomości wychodzących.
- Strumieniowanie podglądu znajduje się w dyspozytorach specyficznych dla kanałów.
- Trwałość końcowego dostarczania jest dodawana wokół istniejących ścieżek ładunku odpowiedzi.

Ten kształt naprawia lokalne błędy, ale zostawia OpenClaw z nadmiarem publicznych pojęć i zbyt wieloma miejscami, w których semantyka dostarczania może się rozjechać.

Problem niezawodności, który to ujawnił, to:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Docelowy niezmiennik jest szerszy niż Telegram: gdy rdzeń zdecyduje, że widoczna wiadomość wychodząca powinna istnieć, intencja musi być trwała przed próbą wysłania na platformę, a potwierdzenie platformy musi zostać zatwierdzone po sukcesie. Daje to OpenClaw odtwarzanie w trybie co najmniej raz. Zachowanie dokładnie raz istnieje tylko dla adapterów, które mogą udowodnić natywną idempotencję albo uzgodnić próbę o nieznanym wyniku po wysłaniu ze stanem platformy przed ponownym odtworzeniem.

To jest stan końcowy tej refaktoryzacji, a nie opis każdej obecnej ścieżki. Podczas migracji istniejące pomocniki wychodzące mogą nadal przechodzić do bezpośredniego wysłania, gdy zapisy do kolejki best-effort zawiodą. Refaktoryzacja jest kompletna dopiero wtedy, gdy trwałe końcowe wysyłki zawodzą w trybie zamkniętym albo jawnie rezygnują z trwałości za pomocą udokumentowanej polityki nietrwałej.

## Cele

- Jeden cykl życia rdzenia dla wszystkich ścieżek odbierania i wysyłania wiadomości kanału.
- Trwałe końcowe wysyłki domyślnie w nowym cyklu życia wiadomości po tym, jak adapter zadeklaruje zachowanie bezpieczne do ponownego odtwarzania.
- Wspólna semantyka podglądu, edycji, strumienia, finalizacji, ponowień, odzyskiwania i potwierdzeń.
- Mała powierzchnia SDK pluginów, którą pluginy firm trzecich mogą poznać i utrzymywać.
- Zgodność dla istniejących wywołań `channel.turn` podczas migracji.
- Jasne punkty rozszerzeń dla nowych możliwości kanałów.
- Brak gałęzi specyficznych dla platform w rdzeniu.
- Brak wiadomości kanału typu token-delta. Strumieniowanie kanału pozostaje podglądem wiadomości, edycją, dopisaniem albo dostarczeniem ukończonego bloku.
- Ustrukturyzowane metadane pochodzenia OpenClaw dla wyjścia operacyjnego/systemowego, aby widoczne awarie Gateway nie wracały do współdzielonych pokoi z włączonym botem jako nowe prompty.

## Poza zakresem

- Nie usuwać `runtime.channel.turn.*` w pierwszej fazie.
- Nie wymuszać na każdym kanale tego samego natywnego zachowania transportu.
- Nie uczyć rdzenia tematów Telegram, natywnych strumieni Slack, redakcji Matrix, kart Feishu, głosu QQ ani aktywności Teams.
- Nie publikować wszystkich wewnętrznych pomocników migracji jako stabilnego API SDK.
- Nie sprawiać, by ponowienia odtwarzały zakończone nieidempotentne operacje platformy.

## Model referencyjny

Vercel Chat ma dobry publiczny model mentalny:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metody adaptera, takie jak `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` i pobieranie historii
- adapter stanu dla deduplikacji, blokad, kolejek i utrwalania

OpenClaw powinien zapożyczyć słownictwo, a nie kopiować powierzchnię.

To, czego OpenClaw potrzebuje ponad ten model:

- Trwałe intencje wysyłania wychodzącego przed bezpośrednimi wywołaniami transportu.
- Jawne konteksty wysyłania z rozpoczęciem, zatwierdzeniem i niepowodzeniem.
- Konteksty odbierania, które znają politykę potwierdzania platformy.
- Potwierdzenia, które przetrwają restart i mogą sterować edycjami, usunięciami, odzyskiwaniem oraz tłumieniem duplikatów.
- Mniejszy publiczny SDK. Dołączone pluginy mogą używać wewnętrznych pomocników środowiska uruchomieniowego, ale pluginy firm trzecich powinny widzieć jedno spójne API wiadomości.
- Zachowanie specyficzne dla agentów: sesje, transkrypty, strumieniowanie bloków, postęp narzędzi, zatwierdzenia, dyrektywy mediów, ciche odpowiedzi i historia wzmianek grupowych.

Obietnice w stylu `thread.post()` nie wystarczają dla OpenClaw. Ukrywają granicę transakcji, która decyduje, czy wysyłanie jest możliwe do odzyskania.

## Model rdzenia

Nowa domena powinna żyć pod wewnętrzną przestrzenią nazw rdzenia, taką jak `src/channels/message/*`.

Ma cztery pojęcia:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` odpowiada za cykl życia przychodzący.

`send` odpowiada za cykl życia wychodzący.

`live` odpowiada za stan podglądu, edycji, postępu i strumienia.

`state` odpowiada za trwałe przechowywanie intencji, potwierdzenia, idempotencję, odzyskiwanie, blokady i deduplikację.

## Terminy wiadomości

### Wiadomość

Znormalizowana wiadomość jest neutralna względem platformy:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Cel

Cel opisuje, gdzie znajduje się wiadomość:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relacja

Odpowiedź jest relacją, a nie korzeniem API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Pozwala to tej samej ścieżce wysyłania obsługiwać zwykłe odpowiedzi, powiadomienia cron, prompty zatwierdzeń, ukończenia zadań, wysyłki narzędzia wiadomości, wysyłki CLI lub Control UI, wyniki subagentów i wysyłki automatyzacji.

### Pochodzenie

Pochodzenie opisuje, kto wytworzył wiadomość i jak OpenClaw powinien traktować echa tej wiadomości. Jest oddzielone od relacji: wiadomość może być odpowiedzią do użytkownika i nadal być pochodzącym z OpenClaw wyjściem operacyjnym.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

Rdzeń jest właścicielem znaczenia wyjścia pochodzącego z OpenClaw. Kanały są właścicielami sposobu kodowania tego pochodzenia w swoim transporcie.

Pierwszym wymaganym użyciem jest wyjście awarii Gateway. Ludzie nadal powinni widzieć wiadomości takie jak „Agent failed before reply” albo „Missing API key”, ale oznaczone operacyjne wyjście OpenClaw nie może być akceptowane jako wejście autorstwa bota we współdzielonych pokojach, gdy `allowBots` jest włączone.

### Potwierdzenie

Potwierdzenia są pierwszorzędne:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Potwierdzenia są pomostem od trwałej intencji do przyszłej edycji, usunięcia, finalizacji podglądu, tłumienia duplikatów i odzyskiwania.

Potwierdzenie może opisywać jedną wiadomość platformy albo dostarczenie wieloczęściowe. Fragmentowany tekst, media plus tekst, głos plus tekst i awaryjne warianty kart muszą zachowywać wszystkie identyfikatory platformy, jednocześnie nadal udostępniając identyfikator główny do wątkowania i późniejszych edycji.

## Kontekst odbierania

Odbieranie nie powinno być gołym wywołaniem pomocnika. Rdzeń potrzebuje kontekstu, który zna deduplikację, routing, zapis sesji i politykę potwierdzania platformy.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Przepływ odbierania:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Potwierdzenie nie jest jedną rzeczą. Kontrakt odbierania musi rozdzielać te sygnały:

- **Potwierdzenie transportu:** informuje Webhook lub gniazdo platformy, że OpenClaw zaakceptował kopertę zdarzenia. Niektóre platformy wymagają tego przed wysłaniem do obsługi.
- **Potwierdzenie offsetu odpytywania:** przesuwa kursor, aby to samo zdarzenie nie zostało pobrane ponownie. Nie może to przesunąć się za pracę, której nie da się odzyskać.
- **Potwierdzenie zapisu przychodzącego:** potwierdza, że OpenClaw utrwalił wystarczająco dużo metadanych przychodzących, aby deduplikować i trasować ponowne dostarczenie.
- **Potwierdzenie widoczne dla użytkownika:** opcjonalne zachowanie odczytu/statusu/pisania; nigdy nie jest granicą trwałości.

`ReceiveAckPolicy` kontroluje wyłącznie potwierdzenie transportu lub odpytywania. Nie wolno go ponownie używać do potwierdzeń odczytu ani reakcji statusu.

Przed autoryzacją bota odbieranie musi zastosować wspólną politykę echa OpenClaw, gdy kanał może zdekodować metadane pochodzenia wiadomości:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

To odrzucenie jest oparte na tagach, nie na tekście. Wiadomość w pokoju autorstwa bota z tym samym widocznym tekstem awarii Gateway, ale bez metadanych pochodzenia OpenClaw, nadal przechodzi przez normalną autoryzację `allowBots`.

Polityka potwierdzania jest jawna:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Odpytywanie Telegram używa teraz polityki potwierdzania kontekstu odbierania dla utrwalonego znaku wodnego restartu. Tracker nadal obserwuje aktualizacje grammY, gdy wchodzą do łańcucha middleware, ale OpenClaw utrwala tylko bezpieczny ukończony identyfikator aktualizacji po pomyślnym wysłaniu do obsługi, pozostawiając nieudane lub niższe oczekujące aktualizacje możliwe do ponownego odtworzenia po restarcie. Nadrzędny offset pobierania `getUpdates` Telegram nadal jest kontrolowany przez bibliotekę odpytywania, więc pozostałym głębszym cięciem jest w pełni trwałe źródło odpytywania, jeśli potrzebujemy ponownego dostarczania na poziomie platformy poza znakiem wodnym restartu OpenClaw. Platformy Webhook mogą wymagać natychmiastowego potwierdzenia HTTP, ale nadal potrzebują deduplikacji przychodzącej i trwałych intencji wysyłania wychodzącego, ponieważ Webhooki mogą dostarczać ponownie.

## Kontekst wysyłania

Wysyłanie także jest oparte na kontekście:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Preferowana orkiestracja:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Helper rozwija się do:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

Intencja musi istnieć przed operacjami wejścia/wyjścia transportu. Ponowne uruchomienie po rozpoczęciu, ale przed
zatwierdzeniem, jest możliwe do odzyskania.

Niebezpieczna granica znajduje się po sukcesie platformy i przed zatwierdzeniem potwierdzenia. Jeśli
proces w tym miejscu zakończy działanie, OpenClaw nie może wiedzieć, czy wiadomość na platformie istnieje,
chyba że adapter zapewnia natywną idempotentność albo ścieżkę uzgadniania potwierdzenia.
Takie próby muszą zostać wznowione w `unknown_after_send`, a nie ślepo odtworzone. Kanały
bez uzgadniania mogą wybrać ponowienie w trybie co najmniej raz tylko wtedy, gdy zduplikowane widoczne
wiadomości są akceptowalnym, udokumentowanym kompromisem dla tego kanału i relacji.
Obecny most uzgadniania SDK wymaga, aby adapter zadeklarował
`reconcileUnknownSend`, a następnie prosi `durableFinal.reconcileUnknownSend` o
sklasyfikowanie nieznanego wpisu jako `sent`, `not_sent` albo `unresolved`; tylko `not_sent`
pozwala na ponowienie, a nierozwiązane wpisy pozostają terminalne albo ponawiają wyłącznie
sprawdzenie uzgodnienia.

Polityka trwałości musi być jawna:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` oznacza, że rdzeń musi zakończyć się bezpieczną porażką, gdy nie może zapisać trwałej intencji.
`best_effort` może przejść dalej, gdy trwałe przechowywanie jest niedostępne. `disabled` zachowuje
stare zachowanie bezpośredniej wysyłki. Podczas migracji starsze wrappery i publiczne
helpery zgodności domyślnie używają `disabled`; nie mogą wnioskować `required` z
faktu, że kanał ma ogólny adapter wychodzący.

Konteksty wysyłki są też właścicielami lokalnych dla kanału efektów po wysłaniu. Migracja nie jest bezpieczna,
jeśli trwałe dostarczanie omija lokalne zachowanie, które wcześniej było podpięte do
bezpośredniej ścieżki wysyłki kanału. Przykłady obejmują pamięci podręczne tłumienia własnego echa,
znaczniki udziału w wątku, natywne kotwice edycji, renderowanie sygnatury modelu
i specyficzne dla platformy zabezpieczenia przed duplikatami. Te efekty muszą zostać przeniesione do
adaptera wysyłki, adaptera renderowania albo nazwanego haka kontekstu wysyłki, zanim
kanał będzie mógł włączyć trwałe ogólne dostarczanie końcowe.

Helpery wysyłki muszą zwracać potwierdzenia aż do swojego wywołującego. Trwałe
wrappery nie mogą ukrywać identyfikatorów wiadomości ani zastępować wyniku dostarczenia kanału
wartością `undefined`; buforowane dyspozytory używają tych identyfikatorów do kotwic wątków, późniejszych edycji,
finalizacji podglądu i tłumienia duplikatów.

Wysyłki awaryjne działają na partiach, nie na pojedynczych ładunkach. Przepisywanie cichych odpowiedzi,
awaryjna obsługa multimediów, awaryjna obsługa kart i projekcja fragmentów mogą wszystkie wygenerować więcej niż
jedną możliwą do dostarczenia wiadomość, więc kontekst wysyłki musi albo dostarczyć całą
rzutowaną partię, albo jawnie udokumentować, dlaczego poprawny jest tylko jeden ładunek.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Gdy taka ścieżka awaryjna jest trwała, cała rzutowana partia musi być reprezentowana przez
jedną trwałą intencję wysyłki albo inny atomowy plan partii. Rejestrowanie każdego ładunku
pojedynczo nie wystarcza: awaria między ładunkami może pozostawić częściowo widoczną
ścieżkę awaryjną bez trwałego rekordu dla pozostałych ładunków. Odzyskiwanie musi wiedzieć,
które jednostki mają już potwierdzenia, i albo odtworzyć tylko brakujące jednostki, albo oznaczyć
partię jako `unknown_after_send`, dopóki adapter jej nie uzgodni.

## Kontekst na żywo

Zachowanie podglądu, edycji, postępu i strumienia powinno być jednym opcjonalnym cyklem życia.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Stan na żywo jest wystarczająco trwały, aby odzyskać albo stłumić duplikaty:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Powinno to obejmować obecne zachowanie:

- Telegram wysyła i edytuje podgląd, ze świeżą wersją końcową po przekroczeniu wieku nieaktualności podglądu.
- Discord wysyła i edytuje podgląd, anuluje przy multimediach, błędzie albo jawnej odpowiedzi.
- Slack używa natywnego strumienia albo roboczego podglądu zależnie od kształtu wątku.
- Finalizacja roboczego wpisu Mattermost.
- Finalizacja roboczego zdarzenia Matrix albo redakcja przy niezgodności.
- Natywny strumień postępu Teams.
- Strumień QQ Bot albo zebrana ścieżka awaryjna.

## Powierzchnia adaptera

Publicznym celem SDK powinna być jedna podścieżka:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Docelowy kształt:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adapter wysyłki:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adapter odbioru:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Przed autoryzacją preflight rdzeń musi uruchomić współdzielony predykat echa OpenClaw
za każdym razem, gdy `origin.decode` zwraca metadane pochodzenia OpenClaw. Adapter odbioru
dostarcza fakty platformy, takie jak autor bot i kształt pokoju; rdzeń jest właścicielem decyzji
o odrzuceniu i kolejności, aby kanały nie implementowały ponownie filtrów tekstu.

Adapter pochodzenia:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Rdzeń ustawia `MessageOrigin`. Kanały tylko tłumaczą je na natywne metadane
transportu i z powrotem. Slack mapuje to na `chat.postMessage({ metadata })` i
przychodzące `message.metadata`; Matrix może mapować to na dodatkową treść zdarzenia; kanały
bez natywnych metadanych mogą używać rejestru potwierdzeń/wychodzącego, gdy jest to
najlepsze dostępne przybliżenie.

Możliwości:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Redukcja publicznego SDK

Nowa publiczna powierzchnia powinna wchłonąć albo wycofać te obszary koncepcyjne:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- większość publicznych użyć `outbound-runtime`
- doraźne helpery cyklu życia roboczego strumienia

Podścieżki zgodności mogą pozostać jako wrappery, ale nowe Pluginy zewnętrzne
nie powinny ich potrzebować.

Wbudowane Pluginy mogą podczas migracji zachować importy wewnętrznych helperów przez zastrzeżone
podścieżki runtime. Publiczna dokumentacja powinna kierować autorów Pluginów do
`plugin-sdk/channel-message`, gdy tylko ono powstanie.

## Relacja z turą kanału

`runtime.channel.turn.*` powinno pozostać podczas migracji.

Powinno stać się adapterem zgodności:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` również początkowo powinno pozostać:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Po zmostkowaniu wszystkich wbudowanych Pluginów i znanych ścieżek zgodności zewnętrznych,
`channel.turn` można wycofać. Nie powinno zostać usunięte, dopóki nie będzie
opublikowanej ścieżki migracji SDK i testów kontraktu dowodzących, że stare Pluginy nadal działają
albo kończą się jasnym błędem wersji.

## Bariery zgodności

Podczas migracji ogólne trwałe dostarczanie jest opcjonalne dla każdego kanału, którego
istniejące wywołanie zwrotne dostarczania ma efekty uboczne wykraczające poza „wyślij ten ładunek”.

Starsze punkty wejścia są domyślnie nietrwałe:

- `channel.turn.run` i `dispatchAssembledChannelTurn` używają wywołania zwrotnego
  dostarczania kanału, chyba że ten kanał jawnie dostarczy zweryfikowany trwały
  obiekt polityki/opcji.
- `channel.turn.runPrepared` pozostaje własnością kanału, dopóki przygotowany dyspozytor
  jawnie nie wywoła kontekstu wysyłki.
- Publiczne helpery zgodności, takie jak `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` i helpery bezpośrednich wiadomości prywatnych nigdy nie wstrzykują ogólnego
  trwałego dostarczania przed dostarczonym przez wywołującego wywołaniem zwrotnym `deliver` albo `reply`.

Dla typów mostu migracji `durable: undefined` oznacza „nietrwałe”. Ścieżka
trwała jest włączana tylko przez jawną wartość polityki/opcji. `durable:
false` może pozostać jako zapis zgodności, ale implementacja nie powinna
wymagać od każdego niezmmigrowanego kanału jego dodania.

Obecny kod mostu musi utrzymywać jawną decyzję o trwałości:

- Trwałe dostarczanie odpowiedzi końcowej zwraca dyskryminowany status. `handled_visible` i
  `handled_no_send` są terminalne; `unsupported` i `not_applicable` mogą przejść
  awaryjnie do dostarczania obsługiwanego przez kanał; `failed` propaguje błąd wysyłki.
- Ogólne trwałe dostarczanie odpowiedzi końcowej jest ograniczane przez możliwości adaptera, takie jak
  ciche dostarczanie, zachowanie celu odpowiedzi, zachowanie natywnego cytatu oraz
  haki wysyłania wiadomości. Brak parytetu powinien wybierać dostarczanie obsługiwane przez kanał,
  a nie ogólną wysyłkę zmieniającą zachowanie widoczne dla użytkownika.
- Trwałe wysyłki oparte na kolejce ujawniają referencję intencji dostarczenia. Istniejące
  pola sesji `pendingFinalDelivery*` mogą przenosić identyfikator intencji w trakcie
  przejścia; stanem docelowym jest magazyn `MessageSendIntent` zamiast zamrożonego
  tekstu odpowiedzi oraz doraźnych pól kontekstu.

Nie włączaj ogólnej trwałej ścieżki dla kanału, dopóki wszystkie poniższe warunki
nie będą prawdziwe:

- Ogólny adapter wysyłki wykonuje takie samo renderowanie i zachowanie transportowe jak
  stara ścieżka bezpośrednia.
- Lokalne skutki uboczne po wysyłce są zachowane przez kontekst wysyłki.
- Adapter zwraca potwierdzenia lub wyniki dostarczenia ze wszystkimi identyfikatorami wiadomości
  platformy.
- Przygotowane ścieżki dyspozytora albo wywołują nowy kontekst wysyłki, albo pozostają udokumentowane
  jako poza trwałą gwarancją.
- Dostarczanie awaryjne obsługuje każdy rzutowany ładunek, a nie tylko pierwszy.
- Trwałe dostarczanie awaryjne zapisuje całą tablicę rzutowanych ładunków jako jedną
  odtwarzalną intencję albo plan wsadowy.

Konkretne zagrożenia migracji do zachowania:

- Dostarczanie monitora iMessage zapisuje wysłane wiadomości w pamięci podręcznej echa po
  udanej wysyłce. Trwałe wysyłki końcowe nadal muszą wypełniać tę pamięć podręczną, w przeciwnym razie
  OpenClaw może ponownie pobrać własne odpowiedzi końcowe jako przychodzące wiadomości użytkownika.
- Tlon dołącza opcjonalny podpis modelu i zapisuje wątki z udziałem po odpowiedziach
  grupowych. Ogólne trwałe dostarczanie nie może pomijać tych efektów;
  albo przenieś je do adapterów renderowania/wysyłania/finalizacji Tlon, albo pozostaw Tlon na
  ścieżce obsługiwanej przez kanał.
- Discord i inne przygotowane dyspozytory już posiadają bezpośrednie dostarczanie i zachowanie
  podglądu. Nie są objęte trwałą gwarancją złożonej tury, dopóki
  ich przygotowane dyspozytory jawnie nie skierują odpowiedzi końcowych przez kontekst wysyłki.
- Ciche dostarczanie awaryjne Telegram musi dostarczyć pełną tablicę rzutowanych ładunków.
  Skrót dla pojedynczego ładunku może porzucić dodatkowe ładunki awaryjne po
  rzutowaniu.
- LINE, BlueBubbles, Zalo, Nostr i inne istniejące ścieżki złożone/pomocnicze mogą
  mieć obsługę tokenów odpowiedzi, pośredniczenie mediów, pamięci podręczne wysłanych wiadomości, czyszczenie ładowania/statusu
  albo cele wyłącznie callbackowe. Pozostają na dostarczaniu obsługiwanym przez kanał, dopóki
  te semantyki nie zostaną odzwierciedlone przez adapter wysyłki i zweryfikowane testami.
- Pomocniki bezpośrednich DM mogą mieć callback odpowiedzi, który jest jedynym poprawnym celem
  transportu. Ogólne wysyłanie wychodzące nie może zgadywać na podstawie `OriginatingTo` albo `To` i pomijać
  tego callbacku.
- Dane wyjściowe awarii OpenClaw Gateway muszą pozostać widoczne dla ludzi, ale oznaczone
  echa pokojów autorstwa bota muszą zostać odrzucone przed autoryzacją `allowBots`.
  Kanały nie mogą implementować tego przy użyciu filtrów prefiksów widocznego tekstu poza
  krótkim awaryjnym obejściem; trwały kontrakt to ustrukturyzowane metadane pochodzenia.

## Wewnętrzna pamięć

Trwała kolejka powinna przechowywać intencje wysyłania wiadomości, a nie ładunki odpowiedzi.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Pętla odzyskiwania:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

Kolejka powinna zachować wystarczającą tożsamość, aby po restarcie odtworzyć wysyłkę przez to samo konto,
wątek, cel, zasady formatowania i reguły mediów.

## Klasy awarii

Adaptery kanałów klasyfikują awarie transportu do zamkniętych kategorii:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Polityka rdzenia:

- Ponawiaj `transient` i `rate_limit`.
- Nie ponawiaj `invalid_payload`, chyba że istnieje awaryjna ścieżka renderowania.
- Nie ponawiaj `auth` ani `permission`, dopóki konfiguracja się nie zmieni.
- Dla `not_found` pozwól finalizacji na żywo przejść awaryjnie z edycji na świeżą wysyłkę, gdy
  kanał deklaruje, że jest to bezpieczne.
- Dla `conflict` użyj reguł potwierdzeń/idempotencji, aby zdecydować, czy wiadomość
  już istnieje.
- Każdy błąd po tym, jak adapter mógł ukończyć wejście/wyjście platformy, ale przed
  zatwierdzeniem potwierdzenia, staje się `unknown_after_send`, chyba że adapter potrafi udowodnić, że operacja
  platformy nie nastąpiła.

## Mapowanie kanałów

| Kanał                    | Docelowa migracja                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Odbieranie zasad potwierdzeń oraz trwałe wysyłanie komunikatów końcowych. Adapter live odpowiada za wysyłanie oraz edycję podglądu, końcowe wysyłanie nieaktualnego podglądu, tematy, pomijanie podglądu odpowiedzi z cytatem, awaryjną obsługę multimediów i obsługę `retry-after`.                                                                                |
| Discord                  | Adapter wysyłania opakowuje istniejące trwałe dostarczanie ładunków. Adapter live odpowiada za edycję wersji roboczej, wersję roboczą postępu, anulowanie podglądu multimediów/błędu, zachowanie celu odpowiedzi i potwierdzenia identyfikatorów wiadomości. Skontroluj echa awarii Gateway autorstwa bota we współdzielonych pokojach; użyj rejestru wychodzącego lub innego natywnego odpowiednika, jeśli Discord nie może przenosić metadanych pochodzenia w zwykłych wiadomościach. |
| Slack                    | Adapter wysyłania obsługuje zwykłe wpisy czatu. Adapter live wybiera natywny strumień, gdy kształt wątku go obsługuje, w przeciwnym razie używa podglądu wersji roboczej. Potwierdzenia zachowują znaczniki czasu wątków. Adapter pochodzenia mapuje awarie Gateway OpenClaw na `chat.postMessage.metadata` w Slack i odrzuca oznaczone echa w pokoju bota przed autoryzacją `allowBots`. |
| WhatsApp                 | Adapter wysyłania odpowiada za wysyłanie tekstu/multimediów z trwałymi intencjami końcowymi. Adapter odbierania obsługuje wzmiankę w grupie i tożsamość nadawcy. Adapter live może pozostać nieobecny, dopóki WhatsApp nie będzie mieć edytowalnego transportu.                                                                                                      |
| Matrix                   | Adapter live odpowiada za edycje zdarzeń wersji roboczych, finalizację, redakcję, ograniczenia szyfrowanych multimediów i awaryjną obsługę niezgodności celu odpowiedzi. Adapter odbierania odpowiada za hydratację i deduplikację szyfrowanych zdarzeń. Adapter pochodzenia powinien zakodować pochodzenie awarii Gateway OpenClaw w treści zdarzenia Matrix i odrzucać skonfigurowane echa w pokoju bota przed obsługą `allowBots`. |
| Mattermost               | Adapter live odpowiada za jeden wpis roboczy, zwijanie postępu/narzędzi, finalizację w miejscu i awaryjne świeże wysłanie.                                                                                                                                                                                                                                         |
| Microsoft Teams          | Adapter live odpowiada za natywny postęp i zachowanie strumienia bloków. Adapter wysyłania odpowiada za aktywności oraz potwierdzenia załączników/kart.                                                                                                                                                                                                             |
| Feishu                   | Adapter renderowania odpowiada za renderowanie tekstu/kart/surowej treści. Adapter live odpowiada za karty strumieniowe i tłumienie zduplikowanych komunikatów końcowych. Adapter wysyłania odpowiada za komentarze, sesje tematów, multimedia i tłumienie głosu.                                                                                                    |
| QQ Bot                   | Adapter live odpowiada za strumieniowanie C2C, limit czasu akumulatora i awaryjne wysłanie końcowe. Adapter renderowania odpowiada za tagi multimediów i tekst jako głos.                                                                                                                                                                                           |
| Signal                   | Prosty adapter odbierania i wysyłania. Brak adaptera live, chyba że `signal-cli` doda niezawodną obsługę edycji.                                                                                                                                                                                                                                                   |
| iMessage and BlueBubbles | Prosty adapter odbierania i wysyłania. Wysyłanie iMessage musi zachować wypełnianie pamięci podręcznej ech monitora, zanim trwałe komunikaty końcowe będą mogły ominąć dostarczanie przez monitor. Pisanie, reakcje i załączniki specyficzne dla BlueBubbles pozostają możliwościami adaptera.                                                                       |
| Google Chat              | Prosty adapter odbierania i wysyłania z relacją wątku mapowaną na przestrzenie i identyfikatory wątków. Skontroluj zachowanie pokoju `allowBots=true` dla oznaczonych ech awarii Gateway OpenClaw.                                                                                                                                                                  |
| LINE                     | Prosty adapter odbierania i wysyłania z ograniczeniami tokenu odpowiedzi modelowanymi jako możliwość celu/relacji.                                                                                                                                                                                                                                                  |
| Nextcloud Talk           | Most odbierania SDK oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                        |
| IRC                      | Prosty adapter odbierania i wysyłania, bez trwałych potwierdzeń edycji.                                                                                                                                                                                                                                                                                             |
| Nostr                    | Adapter odbierania i wysyłania dla szyfrowanych wiadomości prywatnych; potwierdzenia są identyfikatorami zdarzeń.                                                                                                                                                                                                                                                   |
| QA Channel               | Adapter testów kontraktowych dla zachowania odbierania, wysyłania, live, ponawiania i odzyskiwania.                                                                                                                                                                                                                                                                 |
| Synology Chat            | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                             |
| Tlon                     | Adapter wysyłania musi zachować renderowanie sygnatury modelu i śledzenie wątków z udziałem użytkownika, zanim zostanie włączone ogólne trwałe dostarczanie końcowe.                                                                                                                                                                                               |
| Twitch                   | Prosty adapter odbierania i wysyłania z klasyfikacją limitów szybkości.                                                                                                                                                                                                                                                                                             |
| Zalo                     | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                             |
| Zalo Personal            | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                             |

## Plan migracji

### Faza 1: Wewnętrzna domena wiadomości

- Dodaj typy `src/channels/message/*` dla wiadomości, celów, relacji,
  źródeł, potwierdzeń, możliwości, trwałych intencji, kontekstu odbierania, kontekstu wysyłania,
  kontekstu live i klas awarii.
- Dodaj `origin?: MessageOrigin` do typu ładunku mostu migracyjnego używanego przez
  bieżące dostarczanie odpowiedzi, a następnie przenieś to pole do `ChannelMessage` i renderowanych
  typów wiadomości, gdy refaktoryzacja zastąpi ładunki odpowiedzi.
- Utrzymaj to jako wewnętrzne, dopóki adaptery i testy nie potwierdzą kształtu.
- Dodaj czyste testy jednostkowe dla przejść stanów i serializacji.

### Faza 2: Rdzeń trwałego wysyłania

- Przenieś istniejącą kolejkę wychodzącą z trwałości ładunków odpowiedzi do trwałych
  intencji wysyłania wiadomości.
- Pozwól trwałej intencji wysyłania przenosić projektowaną tablicę ładunków lub plan partii, a nie
  tylko jeden ładunek odpowiedzi.
- Zachowaj obecne zachowanie odzyskiwania kolejki przez konwersję zgodności.
- Spraw, aby `deliverOutboundPayloads` wywoływało `messages.send`.
- Uczyń trwałość wysyłania końcowego domyślną i zamykaj z błędem, gdy trwałej intencji
  nie da się zapisać w nowym cyklu życia wiadomości, po tym jak adapter zadeklaruje
  bezpieczeństwo odtwarzania. Istniejące ścieżki zgodności channel-turn i SDK pozostają
  domyślnie bezpośrednim wysyłaniem w tej fazie.
- Rejestruj potwierdzenia spójnie.
- Zwracaj potwierdzenia i wyniki dostarczania do pierwotnego wywołującego dyspozytor
  zamiast traktować trwałe wysyłanie jako końcowy efekt uboczny.
- Utrwalaj pochodzenie wiadomości przez trwałe intencje wysyłania, aby odzyskiwanie, odtwarzanie i
  wysyłanie w częściach zachowywały operacyjne pochodzenie OpenClaw.

### Faza 3: Most obrotu kanału

- Zaimplementuj ponownie `channel.turn.run` i `dispatchAssembledChannelTurn` na bazie
  `messages.receive` i `messages.send`.
- Utrzymaj stabilność bieżących typów faktów.
- Domyślnie zachowaj dotychczasowe zachowanie. Kanał złożonego obrotu staje się trwały
  tylko wtedy, gdy jego adapter jawnie wybierze politykę trwałości bezpieczną dla odtwarzania.
- Zachowaj `durable: false` jako furtkę zgodności dla ścieżek, które finalizują
  natywne edycje i nie mogą jeszcze bezpiecznie odtwarzać, ale nie polegaj na znacznikach `false`,
  aby chronić niezmodernizowane kanały.
- Domyślnie włącz trwałość złożonego obrotu tylko w nowym cyklu życia wiadomości, po tym
  jak mapowanie kanału potwierdzi, że ogólna ścieżka wysyłania zachowuje stare
  semantyki dostarczania kanału.

### Faza 4: Most przygotowanego dyspozytora

- Zastąp `deliverDurableInboundReplyPayload` mostem kontekstu wysyłania.
- Zachowaj stary helper jako wrapper.
- Najpierw przenieś Telegram, WhatsApp, Slack, Signal, iMessage i Discord, ponieważ
  mają już pracę nad trwałym finalnym wysyłaniem albo prostsze ścieżki wysyłania.
- Traktuj każdy przygotowany dispatcher jako nieobjęty pokryciem, dopóki wyraźnie nie zdecyduje się na
  kontekst wysyłania. Dokumentacja i wpisy changeloga muszą mówić „złożone
  przebiegi kanału” albo nazywać zmigrowane ścieżki kanałów, zamiast twierdzić, że obejmują wszystkie
  automatyczne odpowiedzi finalne.
- Zachowaj `recordInboundSessionAndDispatchReply`, helpery bezpośrednich DM i podobne
  publiczne helpery zgodności w sposób zachowujący dotychczasowe zachowanie. Mogą później udostępnić jawne
  włączenie kontekstu wysyłania, ale nie mogą automatycznie próbować ogólnego trwałego
  dostarczania przed callbackiem dostarczania należącym do wywołującego.

### Faza 5: Ujednolicony Cykl Życia Na Żywo

- Zbuduj `messages.live` z dwoma adapterami dowodowymi:
  - Telegram dla wysyłania, edycji oraz wysyłania przedawnionego finalnego komunikatu.
  - Matrix dla finalizacji wersji roboczej oraz zapasowej redakcji.
- Następnie zmigruj Discord, Slack, Mattermost, Teams, QQ Bot i Feishu.
- Usuń zduplikowany kod finalizacji podglądu dopiero wtedy, gdy każdy kanał będzie mieć
  testy parytetu.

### Faza 6: Publiczny SDK

- Dodaj `openclaw/plugin-sdk/channel-message`.
- Udokumentuj go jako preferowane API Plugin kanału.
- Zaktualizuj eksporty pakietu, spis punktów wejścia, wygenerowane baseline API oraz
  dokumentację SDK pluginów.
- Uwzględnij `MessageOrigin`, haki kodowania/dekodowania origin oraz współdzielony
  predykat `shouldDropOpenClawEcho` w powierzchni SDK channel-message.
- Zachowaj wrappery zgodności dla starych podścieżek.
- Oznacz helpery SDK nazwane od odpowiedzi jako przestarzałe w dokumentacji po migracji bundled pluginów.

### Faza 7: Wszyscy Nadawcy

Przenieś wszystkich nadawców wychodzących niebędących odpowiedziami na `messages.send`:

- powiadomienia Cron i Heartbeat
- ukończenia zadań
- wyniki hooków
- prośby o zatwierdzenie i wyniki zatwierdzeń
- wysyłki narzędzia wiadomości
- ogłoszenia ukończenia subagenta
- jawne wysyłki CLI lub Control UI
- ścieżki automatyzacji/broadcastu

To jest moment, w którym model przestaje być „odpowiedziami agenta”, a staje się „OpenClaw wysyła
wiadomości”.

### Faza 8: Wycofanie Turn

- Zachowaj `channel.turn` jako wrapper przez co najmniej jedno okno zgodności.
- Opublikuj notatki migracyjne.
- Uruchom testy zgodności SDK pluginów względem starych importów.
- Usuń albo ukryj stare wewnętrzne helpery dopiero wtedy, gdy żaden bundled plugin ich nie potrzebuje,
  a kontrakty zewnętrznych pluginów mają stabilny zamiennik.

## Plan testów

Testy jednostkowe:

- Serializacja i odzyskiwanie trwałej intencji wysyłania.
- Ponowne użycie klucza idempotencji i tłumienie duplikatów.
- Commit potwierdzenia i pominięcie odtworzenia.
- Odzyskiwanie `unknown_after_send`, które uzgadnia stan przed odtworzeniem, gdy adapter
  obsługuje uzgadnianie.
- Polityka klasyfikacji awarii.
- Sekwencjonowanie polityki potwierdzania odbioru.
- Mapowanie relacji dla odpowiedzi, kontynuacji, wysyłek systemowych i broadcastowych.
- Fabryka origin dla awarii Gateway oraz predykat `shouldDropOpenClawEcho`.
- Zachowanie origin przez normalizację payloadu, dzielenie na części, serializację trwałej kolejki
  i odzyskiwanie.

Testy integracyjne:

- Prosty adapter `channel.turn.run` nadal rejestruje i wysyła.
- Starsze dostarczanie złożonego przebiegu nie staje się trwałe, chyba że kanał
  wyraźnie się na to zdecyduje.
- Most `channel.turn.runPrepared` nadal rejestruje i finalizuje.
- Publiczne helpery zgodności domyślnie wywołują callbacki dostarczania należące do wywołującego
  i nie wykonują ogólnego wysłania przed tymi callbackami.
- Trwałe dostarczanie zapasowe odtwarza całą przewidywaną tablicę payloadów po
  restarcie i nie może pozostawić późniejszych payloadów niezarejestrowanych po wczesnej awarii.
- Trwałe dostarczanie złożonego przebiegu zwraca identyfikatory wiadomości platformy do buforowanego
  dispatchera.
- Niestandardowe haki dostarczania nadal zwracają identyfikatory wiadomości platformy, gdy trwałe dostarczanie
  jest wyłączone lub niedostępne.
- Odpowiedź finalna przetrwa restart między ukończeniem asystenta a wysłaniem na platformę.
- Wersja robocza podglądu finalizuje się w miejscu, gdy jest to dozwolone.
- Wersja robocza podglądu jest anulowana albo zredagowana, gdy media/błąd/niezgodność celu odpowiedzi
  wymaga normalnego dostarczania.
- Strumieniowanie bloków i strumieniowanie podglądu nie dostarczają tego samego tekstu jednocześnie.
- Media przesłane strumieniowo wcześnie nie są duplikowane w finalnym dostarczaniu.

Testy kanałów:

- Odpowiedź tematu Telegram z opóźnionym potwierdzeniem pollingu do bezpiecznego
  ukończonego znacznika wodnego kontekstu odbioru.
- Odzyskiwanie pollingu Telegram dla zaakceptowanych, ale niedostarczonych aktualizacji objęte
  utrwalonym modelem bezpiecznego ukończonego offsetu.
- Przedawniony podgląd Telegram wysyła świeży finalny komunikat i czyści podgląd.
- Cicha ścieżka zapasowa Telegram wysyła każdy przewidywany payload zapasowy.
- Trwałość cichej ścieżki zapasowej Telegram rejestruje pełną przewidywaną tablicę zapasową
  atomowo, a nie jedną trwałą intencję z pojedynczym payloadem na iterację pętli.
- Discord anuluje podgląd przy mediach/błędzie/jawnej odpowiedzi.
- Finalne komunikaty przygotowanego dispatchera Discord przechodzą przez kontekst wysyłania, zanim dokumentacja
  lub changelog ogłosi trwałość finalnych odpowiedzi Discord.
- Trwałe finalne wysyłki iMessage zasilają cache echa wysłanych wiadomości monitora.
- Starsze ścieżki dostarczania LINE, BlueBubbles, Zalo i Nostr nie są omijane przez
  ogólne trwałe wysyłanie, dopóki nie istnieją testy parytetu ich adapterów.
- Dostarczanie callbackiem Direct-DM/Nostr pozostaje autorytatywne, chyba że zostanie wyraźnie
  zmigrowane do kompletnego celu wiadomości i odpornego na odtwarzanie adaptera wysyłania.
- Otagowane komunikaty awarii Slack OpenClaw Gateway pozostają widoczne wychodząco, otagowane
  echa pokoju bota są odrzucane przed `allowBots`, a nieotagowane wiadomości bota z
  tym samym widocznym tekstem nadal przechodzą normalną autoryzację botów.
- Natywna zapasowa ścieżka strumienia Slack do wersji roboczej podglądu w DM najwyższego poziomu.
- Finalizacja podglądu Matrix i zapasowa redakcja.
- Otagowane echa pokojowe awarii OpenClaw Gateway w Matrix z skonfigurowanych kont botów
  są odrzucane przed obsługą `allowBots`.
- Audyty kaskady awarii Gateway w pokojach współdzielonych Discord i Google Chat obejmują
  tryby `allowBots` przed deklarowaniem ogólnej ochrony w tych miejscach.
- Finalizacja wersji roboczej Mattermost i zapasowe świeże wysłanie.
- Finalizacja natywnego postępu Teams.
- Feishu tłumi zduplikowany finalny komunikat.
- Zapasowa ścieżka timeoutu akumulatora QQ Bot.
- Trwałe finalne wysyłki Tlon zachowują renderowanie sygnatury modelu i śledzenie uczestniczących
  wątków.
- Proste trwałe finalne wysyłki WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo i Zalo Personal.

Walidacja:

- Docelowe pliki Vitest podczas rozwoju.
- `pnpm check:changed` w Testbox dla pełnej zmienionej powierzchni.
- Szersze `pnpm check` w Testbox przed landowaniem kompletnego refaktoru albo po
  zmianach publicznego SDK/eksportów.
- Smoke live albo qa-channel dla co najmniej jednego kanału obsługującego edycję i jednego
  prostego kanału tylko do wysyłania przed usunięciem wrapperów zgodności.

## Otwarte pytania

- Czy Telegram powinien docelowo zastąpić źródło runnera grammY
  w pełni trwałym źródłem pollingu, które może kontrolować ponowne dostarczanie na poziomie platformy, a nie
  tylko utrwalony znacznik wodny restartu OpenClaw.
- Czy trwały stan podglądu live powinien być przechowywany w tym samym rekordzie kolejki
  co finalna intencja wysyłania, czy w sąsiednim magazynie stanu live.
- Jak długo wrappery zgodności pozostają udokumentowane po wydaniu
  `plugin-sdk/channel-message`.
- Czy zewnętrzne pluginy powinny implementować adaptery odbioru bezpośrednio, czy tylko
  dostarczać haki normalize/send/live przez `defineChannelMessageAdapter`.
- Które pola potwierdzeń można bezpiecznie udostępnić w publicznym SDK względem wewnętrznego
  stanu runtime.
- Czy efekty uboczne, takie jak cache self-echo i znaczniki uczestniczących wątków,
  powinny być modelowane jako haki kontekstu wysyłania, kroki finalizacji należące do adaptera albo
  subskrybenci potwierdzeń.
- Które kanały mają natywne metadane origin, które potrzebują utrwalonych rejestrów wychodzących,
  a które nie mogą zaoferować niezawodnego tłumienia echa między botami.

## Kryteria akceptacji

- Każdy bundled kanał wiadomości wysyła finalne widoczne wyjście przez
  `messages.send`.
- Każdy przychodzący kanał wiadomości wchodzi przez `messages.receive` albo
  udokumentowany wrapper zgodności.
- Każdy kanał podglądu/edycji/strumienia używa `messages.live` dla stanu wersji roboczej i
  finalizacji.
- `channel.turn` jest tylko wrapperem.
- Helpery SDK nazwane od odpowiedzi są eksportami zgodności, a nie zalecaną ścieżką.
- Trwałe odzyskiwanie może odtworzyć oczekujące finalne wysyłki po restarcie bez utraty
  finalnej odpowiedzi ani duplikowania już zatwierdzonych wysyłek; wysyłki, których
  wynik platformy jest nieznany, są uzgadniane przed odtworzeniem albo udokumentowane jako
  co najmniej jednokrotne dla danego adaptera.
- Trwałe finalne wysyłki zamykają się bezpiecznie przy awarii, gdy trwała intencja nie może zostać zapisana,
  chyba że wywołujący wyraźnie wybrał udokumentowany tryb nietrwały.
- Starsze helpery channel-turn i zgodności SDK domyślnie używają bezpośredniego
  dostarczania należącego do kanału; ogólne trwałe wysyłanie jest tylko jawnym włączeniem.
- Potwierdzenia zachowują wszystkie identyfikatory wiadomości platformy dla dostarczeń wieloczęściowych oraz
  identyfikator główny dla wygody wątkowania/edycji.
- Trwałe wrappery zachowują lokalne dla kanału efekty uboczne przed zastąpieniem bezpośrednich
  callbacków dostarczania.
- Przygotowane dispatchery nie są liczone jako trwałe, dopóki ich finalna ścieżka dostarczania
  wyraźnie nie używa kontekstu wysyłania.
- Dostarczanie zapasowe obsługuje każdy przewidywany payload.
- Trwałe dostarczanie zapasowe rejestruje każdy przewidywany payload w jednej odtwarzalnej
  intencji albo planie batcha.
- Wyjście awarii Gateway pochodzące z OpenClaw jest widoczne dla ludzi, ale otagowane
  echa pokojowe autorstwa bota są odrzucane przed autoryzacją bota na kanałach, które
  deklarują obsługę kontraktu origin.
- Dokumentacja wyjaśnia wysyłanie, odbiór, live, stan, potwierdzenia, relacje, politykę awarii,
  migrację i pokrycie testami.

## Powiązane

- [Wiadomości](/pl/concepts/messages)
- [Strumieniowanie i dzielenie na części](/pl/concepts/streaming)
- [Wersje robocze postępu](/pl/concepts/progress-drafts)
- [Polityka ponawiania](/pl/concepts/retry)
- [Jądro przebiegu kanału](/pl/plugins/sdk-channel-turn)
