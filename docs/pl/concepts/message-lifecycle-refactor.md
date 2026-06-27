---
read_when:
    - Refaktoryzacja zachowania wysyłania lub odbierania w kanale
    - Zmiana ruchu przychodzącego kanału, wysyłania odpowiedzi, kolejki wychodzącej, strumieniowania podglądu lub interfejsów API wiadomości SDK Plugin
    - Projektowanie nowego Plugin dla kanału, który wymaga trwałych wysyłek, potwierdzeń odbioru, podglądów, edycji lub ponownych prób
summary: Plan projektu ujednoliconego trwałego cyklu życia odbierania, wysyłania, podglądu, edycji i strumieniowania wiadomości
title: Refaktoryzacja cyklu życia wiadomości
x-i18n:
    generated_at: "2026-06-27T17:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ta strona opisuje docelowy projekt zastąpienia rozproszonych helperów kanałów do przyjmowania wiadomości, wysyłania odpowiedzi, strumieniowania podglądu i dostarczania wychodzącego jedną trwałą ścieżką cyklu życia wiadomości.

Wersja skrócona:

- Podstawowymi prymitywami rdzenia powinny być **receive** i **send**, nie **reply**.
- Odpowiedź jest tylko relacją na wiadomości wychodzącej.
- Tura jest ułatwieniem przetwarzania przychodzącego, a nie właścicielem dostarczania.
- Wysyłanie musi być oparte na kontekście: `begin`, renderowanie, podgląd lub strumień, wysłanie końcowe,
  zatwierdzenie, niepowodzenie.
- Odbieranie także musi być oparte na kontekście: normalizacja, deduplikacja, trasowanie, zapis,
  dispatch, potwierdzenie platformy, niepowodzenie.
- Publiczny Plugin SDK powinien zostać sprowadzony do jednej małej powierzchni wychodzącej kanału.

## Problemy

Obecny stos kanałów wyrósł z kilku uzasadnionych lokalnych potrzeb:

- Proste adaptery przychodzące używają `runtime.channel.inbound.run`.
- Bogate adaptery używają `runtime.channel.inbound.runPreparedReply`.
- Starsze helpery używają `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, helperów payloadów odpowiedzi, dzielenia odpowiedzi na fragmenty,
  referencji odpowiedzi i helperów runtime dla wiadomości wychodzących.
- Strumieniowanie podglądu żyje w dispatcherach specyficznych dla kanałów.
- Trwałość końcowego dostarczania jest dodawana wokół istniejących ścieżek payloadów odpowiedzi.

Taki kształt naprawia lokalne błędy, ale zostawia OpenClaw ze zbyt wieloma publicznymi
pojęciami i zbyt wieloma miejscami, w których semantyka dostarczania może się rozjechać.

Problem niezawodności, który to ujawnił, wygląda tak:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Docelowy niezmiennik jest szerszy niż Telegram: gdy rdzeń zdecyduje, że widoczna
wiadomość wychodząca powinna istnieć, zamiar musi być trwały przed próbą wysłania
na platformę, a potwierdzenie platformy musi zostać zatwierdzone po sukcesie.
Daje to OpenClaw odzyskiwanie typu co najmniej raz. Zachowanie dokładnie raz istnieje tylko
dla adapterów, które mogą udowodnić natywną idempotencję albo uzgodnić próbę o nieznanym wyniku po wysłaniu
ze stanem platformy przed ponownym odtworzeniem.

To jest stan końcowy tej refaktoryzacji, a nie opis każdej obecnej
ścieżki. Podczas migracji istniejące helpery wychodzące nadal mogą przechodzić do
bezpośredniego wysłania, gdy zapisy do kolejki best-effort zawiodą. Refaktoryzacja jest kompletna tylko
wtedy, gdy trwałe wysyłki końcowe zamykają się błędem albo jawnie rezygnują z trwałości z udokumentowaną
polityką nietrwałą.

## Cele

- Jeden rdzeniowy cykl życia dla wszystkich ścieżek odbierania i wysyłania wiadomości kanałów.
- Domyślnie trwałe wysyłki końcowe w nowym cyklu życia wiadomości po tym, jak adapter
  zadeklaruje zachowanie bezpieczne do ponownego odtworzenia.
- Wspólna semantyka podglądu, edycji, strumienia, finalizacji, ponawiania, odzyskiwania i potwierdzeń.
- Mała powierzchnia Plugin SDK, której zewnętrzne Pluginy mogą się nauczyć i którą mogą utrzymywać.
- Zgodność dla istniejących wywołań zgodności odpowiedzi przychodzących podczas migracji.
- Jasne punkty rozszerzeń dla nowych możliwości kanałów.
- Brak gałęzi specyficznych dla platformy w rdzeniu.
- Brak komunikatów kanału z deltami tokenów. Strumieniowanie kanału pozostaje podglądem wiadomości,
  edycją, dopisywaniem albo dostarczaniem ukończonego bloku.
- Strukturalne metadane pochodzenia OpenClaw dla danych wyjściowych operacyjnych/systemowych, aby widoczne
  awarie Gateway nie wracały do współdzielonych pokojów z włączonym botem jako nowe prompty.

## Poza celami

- Nie wymuszać w pierwszej fazie trwałego dostarczania wiadomości na każdym istniejącym kanale.
- Nie wymuszać na każdym kanale tego samego natywnego zachowania transportu.
- Nie uczyć rdzenia tematów Telegram, natywnych strumieni Slack, redakcji Matrix,
  kart Feishu, głosu QQ ani aktywności Teams.
- Nie publikować wszystkich wewnętrznych helperów migracyjnych jako stabilnego API SDK.
- Nie sprawiać, aby ponowienia odtwarzały ukończone, nieidempotentne operacje platformy.

## Model referencyjny

Vercel Chat ma dobry publiczny model mentalny:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metody adaptera, takie jak `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` i pobieranie historii
- adapter stanu dla deduplikacji, blokad, kolejek i trwałości

OpenClaw powinien zapożyczyć słownictwo, a nie kopiować powierzchnię.

Czego OpenClaw potrzebuje ponad ten model:

- Trwałych zamiarów wysłania wychodzącego przed bezpośrednimi wywołaniami transportu.
- Jawnych kontekstów wysyłania z rozpoczęciem, zatwierdzeniem i niepowodzeniem.
- Kontekstów odbierania, które znają politykę potwierdzania platformy.
- Potwierdzeń, które przetrwają restart i mogą sterować edycjami, usuwaniem, odzyskiwaniem i
  tłumieniem duplikatów.
- Mniejszego publicznego SDK. Dołączone Pluginy mogą używać wewnętrznych helperów runtime, ale
  zewnętrzne Pluginy powinny widzieć jedno spójne API wiadomości.
- Zachowania specyficznego dla agentów: sesji, transkryptów, strumieniowania bloków, postępu narzędzi,
  zatwierdzeń, dyrektyw mediów, cichych odpowiedzi i historii wzmianek w grupach.

Obietnice w stylu `thread.post()` nie wystarczają OpenClaw. Ukrywają
granicę transakcji, która decyduje, czy wysyłkę można odzyskać.

## Model rdzenia

Nowa domena powinna żyć pod wewnętrzną przestrzenią nazw rdzenia, taką jak
`src/channels/message/*`.

Ma cztery pojęcia:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` jest właścicielem cyklu życia przychodzącego.

`send` jest właścicielem cyklu życia wychodzącego.

`live` jest właścicielem podglądu, edycji, postępu i stanu strumienia.

`state` jest właścicielem trwałego przechowywania zamiarów, potwierdzeń, idempotencji, odzyskiwania, blokad i
deduplikacji.

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

Dzięki temu ta sama ścieżka wysyłania obsługuje zwykłe odpowiedzi, powiadomienia Cron, prompty
zatwierdzeń, ukończenia zadań, wysyłki narzędzi wiadomości, wysyłki CLI lub Control UI, wyniki podagentów
i wysyłki automatyzacji.

### Pochodzenie

Pochodzenie opisuje, kto wytworzył wiadomość i jak OpenClaw powinien traktować echa tej
wiadomości. Jest oddzielne od relacji: wiadomość może być odpowiedzią do użytkownika
i nadal być operacyjnym wyjściem pochodzącym z OpenClaw.

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

Rdzeń jest właścicielem znaczenia danych wyjściowych pochodzących z OpenClaw. Kanały są właścicielami tego,
jak to pochodzenie jest kodowane w ich transporcie.

Pierwszym wymaganym zastosowaniem są dane wyjściowe awarii Gateway. Ludzie nadal powinni widzieć
wiadomości takie jak „Agent failed before reply” albo „Missing API key”, ale oznaczone
operacyjne dane wyjściowe OpenClaw nie mogą być akceptowane jako wejście autorstwa bota we współdzielonych
pokojach, gdy `allowBots` jest włączone.

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

Potwierdzenia są mostem od trwałego zamiaru do przyszłej edycji, usunięcia, finalizacji podglądu,
tłumienia duplikatów i odzyskiwania.

Potwierdzenie może opisywać jedną wiadomość platformy albo dostarczenie wieloczęściowe. Podzielony na fragmenty
tekst, media plus tekst, głos plus tekst i fallbacki kart muszą zachować wszystkie
identyfikatory platformy, nadal udostępniając identyfikator główny dla wątkowania i późniejszych edycji.

## Kontekst odbierania

Odbieranie nie powinno być gołym wywołaniem helpera. Rdzeń potrzebuje kontekstu, który zna
deduplikację, trasowanie, zapis sesji i politykę potwierdzania platformy.

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

Potwierdzenie nie jest jedną rzeczą. Kontrakt odbierania musi trzymać te sygnały oddzielnie:

- **Potwierdzenie transportu:** mówi Webhookowi lub socketowi platformy, że OpenClaw zaakceptował
  kopertę zdarzenia. Niektóre platformy wymagają tego przed dispatch.
- **Potwierdzenie offsetu odpytywania:** przesuwa kursor, aby to samo zdarzenie nie zostało pobrane
  ponownie. Nie może to przesuwać się poza pracę, której nie da się odzyskać.
- **Potwierdzenie rekordu przychodzącego:** potwierdza, że OpenClaw utrwalił wystarczająco dużo metadanych przychodzących, aby
  zdeduplikować i przekierować ponowne dostarczenie.
- **Potwierdzenie widoczne dla użytkownika:** opcjonalne zachowanie odczytu/statusu/pisania; nigdy
  granica trwałości.

`ReceiveAckPolicy` kontroluje tylko potwierdzenie transportu lub odpytywania. Nie wolno go
używać ponownie dla potwierdzeń odczytu ani reakcji statusu.

Przed autoryzacją bota odbieranie musi zastosować wspólną politykę echa OpenClaw,
gdy kanał potrafi zdekodować metadane pochodzenia wiadomości:

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

To odrzucenie jest oparte na tagu, nie na tekście. Wiadomość w pokoju autorstwa bota z tym samym
widocznym tekstem awarii Gateway, ale bez metadanych pochodzenia OpenClaw, nadal
przechodzi przez normalną autoryzację `allowBots`.

Polityka potwierdzania jest jawna:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling używa teraz polityki potwierdzania kontekstu odbierania dla utrwalonego
znacznika restartu. Tracker nadal obserwuje aktualizacje grammY, gdy wchodzą do
łańcucha middleware, ale OpenClaw utrwala tylko bezpieczny ukończony identyfikator aktualizacji po
udanym dispatch, pozostawiając nieudane lub niższe oczekujące aktualizacje możliwe do ponownego odtworzenia po
restarcie. Upstreamowy offset pobierania `getUpdates` Telegram nadal jest kontrolowany przez
bibliotekę odpytywania, więc pozostałym głębszym krokiem jest w pełni trwałe źródło odpytywania,
jeśli potrzebujemy redelivery na poziomie platformy poza znacznikiem restartu OpenClaw. Platformy Webhook
mogą wymagać natychmiastowego potwierdzenia HTTP, ale nadal potrzebują deduplikacji przychodzącej i trwałych zamiarów
wysyłki wychodzącej, ponieważ Webhooki mogą dostarczać ponownie.

## Kontekst wysyłania

Wysyłanie również opiera się na kontekście:

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

Pomocnik rozwija się do:

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

Intencja musi istnieć przed wejściem/wyjściem transportu. Ponowne uruchomienie po rozpoczęciu, ale przed
zatwierdzeniem, jest możliwe do odzyskania.

Niebezpieczna granica znajduje się po sukcesie platformy i przed zatwierdzeniem potwierdzenia. Jeśli
proces wtedy zakończy działanie, OpenClaw nie może wiedzieć, czy wiadomość platformy istnieje,
chyba że adapter udostępnia natywną idempotencję albo ścieżkę uzgadniania potwierdzeń.
Takie próby muszą zostać wznowione w `unknown_after_send`, a nie ślepo odtworzone. Kanały
bez uzgadniania mogą wybrać ponowienie co najmniej raz tylko wtedy, gdy zduplikowane widoczne
wiadomości są akceptowalnym, udokumentowanym kompromisem dla tego kanału i relacji.
Obecny most uzgadniania SDK wymaga, aby adapter zadeklarował
`reconcileUnknownSend`, a następnie prosi `durableFinal.reconcileUnknownSend` o
sklasyfikowanie nieznanego wpisu jako `sent`, `not_sent` albo `unresolved`; tylko `not_sent`
pozwala na ponowienie, a nierozwiązane wpisy pozostają terminalne albo ponawiają wyłącznie
sprawdzenie uzgadniania.

Polityka trwałości musi być jawna:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` oznacza, że core musi zakończyć się zamknięciem, gdy nie może zapisać trwałej intencji.
`best_effort` może przejść dalej, gdy trwałość jest niedostępna. `disabled` zachowuje
stare zachowanie bezpośredniego wysyłania. Podczas migracji starsze opakowania i publiczne
pomocniki zgodności domyślnie używają `disabled`; nie mogą wnioskować `required` z
faktu, że kanał ma ogólny adapter wychodzący.

Konteksty wysyłania są też właścicielem lokalnych dla kanału efektów po wysłaniu. Migracja nie jest bezpieczna,
jeśli trwałe dostarczanie omija lokalne zachowanie, które wcześniej było podłączone do
bezpośredniej ścieżki wysyłania kanału. Przykłady obejmują pamięci podręczne tłumienia własnego echa,
znaczniki uczestnictwa w wątku, natywne kotwice edycji, renderowanie sygnatury modelu
oraz specyficzne dla platformy zabezpieczenia przed duplikatami. Te efekty muszą zostać przeniesione do
adaptera wysyłania, adaptera renderowania albo nazwanego haka kontekstu wysyłania, zanim
ten kanał będzie mógł włączyć trwałe ogólne końcowe dostarczanie.

Pomocniki wysyłania muszą zwracać potwierdzenia aż do swojego wywołującego. Trwałe
opakowania nie mogą połykać identyfikatorów wiadomości ani zastępować wyniku dostarczenia kanału
wartością `undefined`; buforowane dyspozytory używają tych identyfikatorów do kotwic wątków, późniejszych edycji,
finalizacji podglądu i tłumienia duplikatów.

Wysyłki awaryjne działają na partiach, nie na pojedynczych ładunkach. Przepisania cichej odpowiedzi,
awaryjne użycie mediów, awaryjne użycie kart i projekcja fragmentów mogą wygenerować więcej niż
jedną dostarczalną wiadomość, więc kontekst wysyłania musi albo dostarczyć całą
zaprojektowaną partię, albo jawnie udokumentować, dlaczego tylko jeden ładunek jest prawidłowy.

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

Gdy takie awaryjne działanie jest trwałe, cała zaprojektowana partia musi być reprezentowana przez
jedną trwałą intencję wysłania albo inny atomowy plan partii. Rejestrowanie każdego ładunku
po kolei nie wystarcza: awaria między ładunkami może pozostawić częściowo widoczny
wariant awaryjny bez trwałego rekordu dla pozostałych ładunków. Odzyskiwanie musi wiedzieć,
które jednostki mają już potwierdzenia, i albo ponowić tylko brakujące jednostki, albo oznaczyć
partię jako `unknown_after_send`, dopóki adapter jej nie uzgodni.

## Kontekst na żywo

Zachowanie podglądu, edycji, postępu i strumienia powinno być jednym cyklem życia włączanym opcjonalnie.

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

Stan na żywo jest wystarczająco trwały, aby odzyskać działanie albo tłumić duplikaty:

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

- Wysyłanie Telegram plus podgląd przez edycję, ze świeżą wersją końcową po osiągnięciu wieku nieświeżego podglądu.
- Wysyłanie Discord plus podgląd przez edycję, anulowanie przy mediach/błędzie/jawnej odpowiedzi.
- Natywny strumień Slack albo roboczy podgląd zależnie od kształtu wątku.
- Finalizacja roboczego posta Mattermost.
- Finalizacja roboczego zdarzenia Matrix albo redakcja przy niezgodności.
- Natywny strumień postępu Teams.
- Strumień QQ Bot albo skumulowany wariant awaryjny.

## Powierzchnia adaptera

Publicznym celem SDK powinna być jedna podścieżka:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Adapter wysyłania:

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

Adapter odbierania:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Przed autoryzacją preflight core musi uruchomić współdzielony predykat echa OpenClaw
zawsze, gdy `origin.decode` zwraca metadane pochodzenia OpenClaw. Adapter odbierania
dostarcza fakty platformy, takie jak autor bota i kształt pokoju; core jest właścicielem decyzji
o odrzuceniu i kolejności, aby kanały nie implementowały ponownie filtrów tekstu.

Adapter pochodzenia:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core ustawia `MessageOrigin`. Kanały tylko tłumaczą go do i z natywnych
metadanych transportu. Slack mapuje to na `chat.postMessage({ metadata })` oraz
przychodzące `message.metadata`; Matrix może mapować to na dodatkową treść zdarzenia; kanały
bez natywnych metadanych mogą użyć rejestru potwierdzeń/wychodzącego, gdy jest to
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

## Ograniczenie publicznego SDK

Nowa publiczna powierzchnia powinna wchłonąć albo wycofać te obszary koncepcyjne:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- większość publicznych użyć `outbound-runtime`
- doraźne pomocniki cyklu życia roboczego strumienia

Podścieżki zgodności mogą pozostać jako opakowania, ale nowe Pluginy firm trzecich
nie powinny ich potrzebować.

Dołączone Pluginy mogą zachować wewnętrzne importy pomocników przez zarezerwowane podścieżki
runtime podczas migracji. Publiczne dokumenty powinny kierować autorów Pluginów do
`plugin-sdk/channel-outbound`, gdy już będzie istnieć.

## Relacja z częścią przychodzącą kanału

`runtime.channel.inbound.*` jest mostem runtime podczas migracji.

Powinien stać się adapterem zgodności:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` również powinien początkowo pozostać:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Stara powierzchnia runtime `channel.turn` została usunięta. Wywołujący runtime używają
`channel.inbound.*`; dokumenty kanałów i podścieżki SDK używają rzeczowników związanych z wejściem/wiadomościami.

## Ograniczenia zgodności

Podczas migracji ogólne trwałe dostarczanie jest opcjonalne dla każdego kanału, którego
istniejące wywołanie zwrotne dostarczania ma efekty uboczne wykraczające poza „wyślij ten ładunek”.

Starsze punkty wejścia domyślnie nie są trwałe:

- `channel.inbound.run` i `dispatchChannelInboundReply` używają wywołania zwrotnego
  dostarczania kanału, chyba że ten kanał jawnie dostarcza audytowany obiekt
  polityki/opcji trwałości.
- `channel.inbound.runPreparedReply` pozostaje własnością kanału, dopóki przygotowany dyspozytor
  jawnie nie wywoła kontekstu wysyłania.
- Publiczne pomocniki zgodności, takie jak `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` oraz pomocniki bezpośrednich DM, nigdy nie wstrzykują ogólnego
  trwałego dostarczania przed dostarczonym przez wywołującego wywołaniem zwrotnym `deliver` albo `reply`.

Dla typów mostu migracji `durable: undefined` oznacza „nietrwałe”. Ścieżka
trwała jest włączana tylko przez jawną wartość polityki/opcji. `durable:
false` może pozostać jako pisownia zgodności, ale implementacja nie powinna
wymagać, aby każdy niezmutowany kanał ją dodawał.

Obecny kod mostu musi zachować jawną decyzję o trwałości:

- Trwałe dostarczanie końcowe zwraca dyskryminowany status. `handled_visible` i
  `handled_no_send` są końcowe; `unsupported` i `not_applicable` mogą przejść
  do dostarczania należącego do kanału; `failed` propaguje niepowodzenie wysyłki.
- Ogólne trwałe dostarczanie końcowe jest bramkowane przez możliwości adaptera,
  takie jak ciche dostarczanie, zachowanie celu odpowiedzi, zachowanie natywnego
  cytatu oraz haki wysyłania wiadomości. Brak parytetu powinien wybierać
  dostarczanie należące do kanału, a nie ogólną wysyłkę zmieniającą zachowanie
  widoczne dla użytkownika.
- Trwałe wysyłki oparte na kolejce ujawniają odwołanie do intencji dostarczenia.
  Istniejące pola sesji `pendingFinalDelivery*` mogą przenosić identyfikator
  intencji w trakcie przejścia; stanem docelowym jest magazyn `MessageSendIntent`
  zamiast zamrożonego tekstu odpowiedzi oraz doraźnych pól kontekstu.

Nie włączaj ogólnej trwałej ścieżki dla kanału, dopóki wszystkie poniższe
warunki nie będą prawdziwe:

- Adapter ogólnej wysyłki wykonuje takie samo renderowanie i zachowanie transportu
  jak stara ścieżka bezpośrednia.
- Lokalne skutki uboczne po wysyłce są zachowane przez kontekst wysyłki.
- Adapter zwraca potwierdzenia lub wyniki dostarczenia ze wszystkimi
  identyfikatorami wiadomości platformy.
- Przygotowane ścieżki dyspozytorów albo wywołują nowy kontekst wysyłki, albo
  pozostają udokumentowane jako poza trwałą gwarancją.
- Dostarczanie zapasowe obsługuje każdy projektowany ładunek, nie tylko pierwszy.
- Trwałe dostarczanie zapasowe zapisuje całą projektowaną tablicę ładunków jako
  jedną odtwarzalną intencję lub plan partii.

Konkretne zagrożenia migracji, które trzeba zachować:

- Dostarczanie monitora iMessage zapisuje wysłane wiadomości w pamięci podręcznej
  echa po udanej wysyłce. Trwałe wysyłki końcowe nadal muszą wypełniać tę pamięć
  podręczną, inaczej OpenClaw może ponownie pobrać własne końcowe odpowiedzi jako
  przychodzące wiadomości użytkownika.
- Tlon dołącza opcjonalny podpis modelu i zapisuje wątki z udziałem po
  odpowiedziach grupowych. Ogólne trwałe dostarczanie nie może omijać tych efektów;
  przenieś je do adapterów renderowania/wysyłki/finalizacji Tlon albo pozostaw
  Tlon na ścieżce należącej do kanału.
- Discord i inne przygotowane dyspozytory już odpowiadają za bezpośrednie
  dostarczanie i zachowanie podglądu. Nie są objęte trwałą gwarancją złożonej
  tury, dopóki ich przygotowane dyspozytory nie skierują końcowych odpowiedzi
  jawnie przez kontekst wysyłki.
- Ciche dostarczanie zapasowe Telegram musi dostarczyć pełną projektowaną tablicę
  ładunków. Skrót obsługujący pojedynczy ładunek może porzucić dodatkowe ładunki
  zapasowe po projekcji.
- LINE, Zalo, Nostr i inne istniejące ścieżki złożone/pomocnicze mogą mieć
  obsługę tokenów odpowiedzi, pośredniczenie multimediów, pamięci podręczne
  wysłanych wiadomości, czyszczenie ładowania/statusu lub cele wyłącznie
  callbackowe. Pozostają przy dostarczaniu należącym do kanału, dopóki ta
  semantyka nie zostanie reprezentowana przez adapter wysyłki i zweryfikowana
  testami.
- Pomocniki bezpośrednich DM mogą mieć callback odpowiedzi, który jest jedynym
  poprawnym celem transportu. Ogólna wysyłka wychodząca nie może zgadywać na
  podstawie `OriginatingTo` lub `To` i pomijać tego callbacku.
- Dane wyjściowe niepowodzeń OpenClaw Gateway muszą pozostać widoczne dla ludzi,
  ale oznaczone echa pokojów autorstwa botów muszą zostać odrzucone przed
  autoryzacją `allowBots`. Kanały nie mogą implementować tego przez filtry
  prefiksów widocznego tekstu, poza krótkim awaryjnym obejściem; trwały kontrakt
  to ustrukturyzowane metadane pochodzenia.

## Wewnętrzna pamięć masowa

Trwała kolejka powinna przechowywać intencje wysyłki wiadomości, a nie ładunki
odpowiedzi.

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

Kolejka powinna zachowywać wystarczającą tożsamość, aby po ponownym uruchomieniu
odtworzyć wysyłkę przez to samo konto, wątek, cel, zasady formatowania i reguły
multimediów.

## Klasy niepowodzeń

Adaptery kanałów klasyfikują niepowodzenia transportu w zamknięte kategorie:

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
- Nie ponawiaj `invalid_payload`, chyba że istnieje zapasowe renderowanie.
- Nie ponawiaj `auth` ani `permission`, dopóki konfiguracja się nie zmieni.
- Dla `not_found` pozwól finalizacji na żywo przejść awaryjnie z edycji do
  świeżej wysyłki, gdy kanał deklaruje to jako bezpieczne.
- Dla `conflict` użyj reguł potwierdzeń/idempotencji, aby zdecydować, czy
  wiadomość już istnieje.
- Każdy błąd po tym, jak adapter mógł ukończyć I/O platformy, ale przed
  zatwierdzeniem potwierdzenia, staje się `unknown_after_send`, chyba że adapter
  może dowieść, że operacja platformy się nie wydarzyła.

## Mapowanie kanałów

| Kanał           | Docelowa migracja                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Odbieranie polityki potwierdzeń oraz trwałe wysyłki końcowe. Adapter na żywo odpowiada za wysyłanie oraz podgląd edycji, końcową wysyłkę nieaktualnego podglądu, tematy, pomijanie podglądu odpowiedzi z cytatem, awaryjną obsługę mediów i obsługę ponowienia po czasie.                                                                                              |
| Discord         | Adapter wysyłania opakowuje istniejące trwałe dostarczanie payloadu. Adapter na żywo odpowiada za edycję wersji roboczej, wersję roboczą postępu, anulowanie podglądu mediów/błędów, zachowanie celu odpowiedzi i potwierdzenia identyfikatorów wiadomości. Skontroluj echa awarii Gateway autorstwa botów we współdzielonych pokojach; użyj rejestru wychodzącego albo innego natywnego odpowiednika, jeśli Discord nie może przenosić metadanych pochodzenia w zwykłych wiadomościach. |
| Slack           | Adapter wysyłania obsługuje zwykłe posty czatu. Adapter na żywo wybiera natywny strumień, gdy kształt wątku go obsługuje, w przeciwnym razie podgląd wersji roboczej. Potwierdzenia zachowują znaczniki czasu wątku. Adapter pochodzenia mapuje awarie Gateway OpenClaw na Slack `chat.postMessage.metadata` i usuwa oznaczone echa z pokojów botów przed autoryzacją `allowBots`. |
| WhatsApp        | Adapter wysyłania odpowiada za wysyłanie tekstu/mediów z trwałymi intencjami końcowymi. Adapter odbierania obsługuje wzmianki w grupach i tożsamość nadawcy. Warstwa na żywo może pozostać nieobecna, dopóki WhatsApp nie ma edytowalnego transportu.                                                                                                                  |
| Matrix          | Adapter na żywo odpowiada za edycje zdarzeń roboczych, finalizację, redakcję, ograniczenia szyfrowanych mediów i awaryjną obsługę niezgodności celu odpowiedzi. Adapter odbierania odpowiada za hydratację zaszyfrowanych zdarzeń i deduplikację. Adapter pochodzenia powinien zakodować pochodzenie awarii Gateway OpenClaw w treści zdarzenia Matrix i usuwać echa skonfigurowanych botów w pokojach przed obsługą `allowBots`. |
| Mattermost      | Adapter na żywo odpowiada za jeden post roboczy, składanie postępu/narzędzi, finalizację w miejscu i awaryjną świeżą wysyłkę.                                                                                                                                                                                                                                           |
| Microsoft Teams | Adapter na żywo odpowiada za natywny postęp i zachowanie strumienia bloków. Adapter wysyłania odpowiada za działania oraz potwierdzenia załączników/kart.                                                                                                                                                                                                               |
| Feishu          | Adapter renderowania odpowiada za renderowanie tekstu/kart/surowych treści. Adapter na żywo odpowiada za karty strumieniowe i tłumienie zduplikowanej finalizacji. Adapter wysyłania odpowiada za komentarze, sesje tematów, media i tłumienie głosu.                                                                                                                 |
| QQ Bot          | Adapter na żywo odpowiada za strumieniowanie C2C, limit czasu akumulatora i awaryjną wysyłkę końcową. Adapter renderowania odpowiada za tagi mediów i tekst jako głos.                                                                                                                                                                                                 |
| Signal          | Prosty adapter odbierania i wysyłania. Brak adaptera na żywo, chyba że signal-cli doda niezawodną obsługę edycji.                                                                                                                                                                                                                                                      |
| iMessage        | Prosty adapter odbierania i wysyłania. Wysyłanie iMessage musi zachować zapełnianie pamięci podręcznej ech monitora, zanim trwałe finalizacje będą mogły ominąć dostarczanie przez monitor.                                                                                                                                                                           |
| Google Chat     | Prosty adapter odbierania i wysyłania z relacją wątku mapowaną na przestrzenie i identyfikatory wątków. Skontroluj zachowanie pokoju `allowBots=true` pod kątem oznaczonych ech awarii Gateway OpenClaw.                                                                                                                                                                |
| LINE            | Prosty adapter odbierania i wysyłania z ograniczeniami tokenów odpowiedzi modelowanymi jako funkcja celu/relacji.                                                                                                                                                                                                                                                       |
| Nextcloud Talk  | Most odbierania SDK oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                            |
| IRC             | Prosty adapter odbierania i wysyłania, bez trwałych potwierdzeń edycji.                                                                                                                                                                                                                                                                                                 |
| Nostr           | Adapter odbierania i wysyłania dla szyfrowanych wiadomości prywatnych; potwierdzeniami są identyfikatory zdarzeń.                                                                                                                                                                                                                                                       |
| Kanał QA        | Adapter testów kontraktowych dla zachowania odbierania, wysyłania, pracy na żywo, ponawiania i odzyskiwania.                                                                                                                                                                                                                                                           |
| Synology Chat   | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                                 |
| Tlon            | Adapter wysyłania musi zachować renderowanie sygnatury modelu i śledzenie wątków z udziałem użytkownika, zanim zostanie włączone ogólne trwałe dostarczanie końcowe.                                                                                                                                                                                                  |
| Twitch          | Prosty adapter odbierania i wysyłania z klasyfikacją limitów szybkości.                                                                                                                                                                                                                                                                                                 |
| Zalo            | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                                 |
| Zalo Personal   | Prosty adapter odbierania i wysyłania.                                                                                                                                                                                                                                                                                                                                 |

## Plan migracji

### Faza 1: Wewnętrzna domena wiadomości

- Dodaj typy `src/channels/message/*` dla wiadomości, celów, relacji,
  źródeł pochodzenia, potwierdzeń, funkcji, trwałych intencji, kontekstu
  odbierania, kontekstu wysyłania, kontekstu pracy na żywo i klas awarii.
- Dodaj `origin?: MessageOrigin` do typu payloadu mostu migracji używanego przez
  bieżące dostarczanie odpowiedzi, a następnie przenieś to pole do `ChannelMessage` i typów
  renderowanych wiadomości, gdy refaktoryzacja zastąpi payloady odpowiedzi.
- Utrzymaj to jako wewnętrzne, dopóki adaptery i testy nie potwierdzą kształtu.
- Dodaj czyste testy jednostkowe przejść stanów i serializacji.

### Faza 2: Rdzeń trwałego wysyłania

- Przenieś istniejącą kolejkę wychodzącą z trwałości payloadów odpowiedzi do trwałych
  intencji wysyłania wiadomości.
- Pozwól trwałej intencji wysyłania przenosić projektowaną tablicę payloadów lub plan wsadowy, a nie
  tylko jeden payload odpowiedzi.
- Zachowaj bieżące zachowanie odzyskiwania kolejki przez konwersję zgodności.
- Spraw, aby `deliverOutboundPayloads` wywoływało `messages.send`.
- Uczyń trwałość wysyłki końcowej domyślną i zamykaj z błędem, gdy trwała intencja
  nie może zostać zapisana w nowym cyklu życia wiadomości, po tym jak adapter zadeklaruje
  bezpieczeństwo odtwarzania. Istniejący runner przychodzący i ścieżki zgodności SDK pozostają
  domyślnie bezpośrednim wysyłaniem w tej fazie.
- Zapisuj potwierdzenia spójnie.
- Zwracaj potwierdzenia i wyniki dostarczenia do pierwotnego wywołującego dyspozytora zamiast
  traktować trwałe wysyłanie jako końcowy efekt uboczny.
- Utrwalaj pochodzenie wiadomości przez trwałe intencje wysyłania, aby odzyskiwanie, odtwarzanie i
  wysyłki dzielone na części zachowywały operacyjną proweniencję OpenClaw.

### Faza 3: Most przychodzący kanału

- Zaimplementuj ponownie `channel.inbound.run` i `dispatchChannelInboundReply` na bazie
  `messages.receive` i `messages.send`.
- Utrzymaj stabilność bieżących typów faktów.
- Domyślnie zachowaj dotychczasowe zachowanie. Kanał złożonego przebiegu staje się trwały
  tylko wtedy, gdy jego adapter jawnie włączy się z polityką trwałości bezpieczną dla odtwarzania.
- Zachowaj `durable: false` jako awaryjną ścieżkę zgodności dla ścieżek, które finalizują
  natywne edycje i nie mogą jeszcze bezpiecznie odtwarzać, ale nie polegaj na znacznikach `false`
  do ochrony niezmodernizowanych kanałów.
- Domyślnie włączaj trwałość złożonego przebiegu tylko w nowym cyklu życia wiadomości, po tym jak
  mapowanie kanału potwierdzi, że ogólna ścieżka wysyłania zachowuje stare semantyki
  dostarczania kanału.

### Faza 4: Most przygotowanego dyspozytora

- Zastąp `deliverDurableInboundReplyPayload` mostkiem kontekstu wysyłania.
- Zachowaj stary helper jako wrapper.
- Najpierw przenieś Telegram, WhatsApp, Slack, Signal, iMessage i Discord,
  ponieważ mają już prace nad trwałym finałem albo prostsze ścieżki wysyłania.
- Traktuj każdy przygotowany dispatcher jako niepokryty, dopóki jawnie nie
  włączy się w kontekst wysyłania. Dokumentacja i wpisy changeloga muszą mówić
  „złożone tury kanału” albo wskazywać nazwy zmigrowanych ścieżek kanałów,
  zamiast twierdzić, że obejmuje to wszystkie automatyczne odpowiedzi końcowe.
- Zachowaj zgodność zachowania `recordInboundSessionAndDispatchReply`, helperów
  bezpośrednich DM i podobnych publicznych helperów kompatybilności. Mogą
  później udostępnić jawne włączenie kontekstu wysyłania, ale nie mogą
  automatycznie próbować ogólnego trwałego dostarczania przed callbackiem
  dostarczania należącym do wywołującego.

### Faza 5: Ujednolicony cykl życia live

- Zbuduj `messages.live` z dwoma adapterami dowodowymi:
  - Telegram dla wysyłania, edycji i nieaktualnego wysłania końcowego.
  - Matrix dla finalizacji szkicu i awaryjnego redagowania.
- Następnie zmigruj Discord, Slack, Mattermost, Teams, QQ Bot i Feishu.
- Usuń zduplikowany kod finalizacji podglądu dopiero wtedy, gdy każdy kanał ma
  testy parytetu.

### Faza 6: Publiczny SDK

- Dodaj `openclaw/plugin-sdk/channel-outbound`.
- Udokumentuj go jako preferowane API Pluginu kanału.
- Zaktualizuj eksporty pakietu, inwentarz punktów wejścia, wygenerowane bazowe
  stany API oraz dokumentację SDK Pluginu.
- Uwzględnij `MessageOrigin`, hooki kodowania/dekodowania origin oraz
  współdzielony predykat `shouldDropOpenClawEcho` w powierzchni SDK
  channel-outbound.
- Zachowaj wrappery kompatybilności dla starych podścieżek.
- Oznacz helpery SDK nazwane odpowiedziami jako przestarzałe w dokumentacji po
  zmigrowaniu dołączonych Pluginów.

### Faza 7: Wszyscy nadawcy

Przenieś wszystkich producentów wychodzących niebędących odpowiedziami na
`messages.send`:

- powiadomienia cron i heartbeat
- ukończenia zadań
- wyniki hooków
- prompty zatwierdzeń i wyniki zatwierdzeń
- wysyłki narzędzia wiadomości
- ogłoszenia ukończenia subagentów
- jawne wysyłki CLI lub Control UI
- ścieżki automatyzacji/broadcastu

To jest miejsce, w którym model przestaje być „odpowiedziami agenta”, a staje
się „OpenClaw wysyła wiadomości”.

### Faza 8: Usunięcie kompatybilności nazwanej turami

- Zachowaj wrappery nazwane inbound/message jako okno kompatybilności.
- Opublikuj notatki migracyjne.
- Uruchom testy kompatybilności SDK Pluginu względem starych importów.
- Usuń albo ukryj stare wewnętrzne helpery dopiero wtedy, gdy żaden dołączony
  Plugin ich nie potrzebuje, a kontrakty zewnętrznych dostawców mają stabilny
  zamiennik.

## Plan testów

Testy jednostkowe:

- Serializacja i odzyskiwanie trwałej intencji wysyłania.
- Ponowne użycie klucza idempotencji i tłumienie duplikatów.
- Zapis potwierdzenia i pomijanie przy ponownym odtworzeniu.
- Odzyskiwanie `unknown_after_send`, które uzgadnia stan przed ponownym
  odtworzeniem, gdy adapter obsługuje uzgadnianie.
- Polityka klasyfikacji awarii.
- Sekwencjonowanie polityki potwierdzania odbioru.
- Mapowanie relacji dla wysyłek typu reply, followup, system i broadcast.
- Fabryka origin dla awarii Gateway i predykat `shouldDropOpenClawEcho`.
- Zachowanie origin przez normalizację payloadu, dzielenie na fragmenty,
  serializację trwałej kolejki i odzyskiwanie.

Testy integracyjne:

- Prosty adapter `channel.inbound.run` nadal rejestruje i wysyła.
- Dostarczanie starszego typu assembled-event nie staje się trwałe, chyba że
  kanał jawnie je włączy.
- Mostek `channel.inbound.runPreparedReply` nadal rejestruje i finalizuje.
- Publiczne helpery kompatybilności domyślnie wywołują callbacki dostarczania
  należące do wywołującego i nie wykonują ogólnego wysłania przed tymi
  callbackami.
- Trwałe dostarczanie awaryjne odtwarza całą projektowaną tablicę payloadów po
  restarcie i nie może pozostawić późniejszych payloadów niezarejestrowanych po
  wczesnej awarii.
- Trwałe dostarczanie assembled-event zwraca identyfikatory wiadomości platformy
  do buforowanego dispatchera.
- Niestandardowe hooki dostarczania nadal zwracają identyfikatory wiadomości
  platformy, gdy trwałe dostarczanie jest wyłączone albo niedostępne.
- Odpowiedź końcowa przetrwa restart między ukończeniem asystenta a wysłaniem
  na platformę.
- Szkic podglądu finalizuje się w miejscu, gdy jest to dozwolone.
- Szkic podglądu jest anulowany albo redagowany, gdy media, błąd lub
  niedopasowanie celu odpowiedzi wymaga zwykłego dostarczania.
- Strumieniowanie blokowe i strumieniowanie podglądu nie dostarczają oba tego
  samego tekstu.
- Media strumieniowane wcześnie nie są duplikowane w dostarczeniu końcowym.

Testy kanałów:

- Odpowiedź w temacie Telegram z potwierdzeniem pollingu opóźnionym do
  bezpiecznego ukończonego znaku wodnego kontekstu odbioru.
- Odzyskiwanie pollingu Telegram dla aktualizacji zaakceptowanych, ale
  niedostarczonych, pokryte przez utrwalony model bezpiecznego ukończonego
  offsetu.
- Nieaktualny podgląd Telegram wysyła świeży finał i czyści podgląd.
- Ciche dostarczanie awaryjne Telegram wysyła każdy projektowany payload
  awaryjny.
- Trwałość cichego dostarczania awaryjnego Telegram rejestruje pełną projektowaną
  tablicę awaryjną atomowo, a nie jedną trwałą intencję jednopayloadową na
  iterację pętli.
- Anulowanie podglądu Discord przy mediach, błędzie albo jawnej odpowiedzi.
- Finały przygotowanego dispatchera Discord przechodzą przez kontekst wysyłania,
  zanim dokumentacja albo changelog zaczną twierdzić, że Discord ma trwałość
  odpowiedzi końcowych.
- Trwałe wysyłki końcowe iMessage zasilają cache echa wysłanych wiadomości
  monitora.
- Starsze ścieżki dostarczania LINE, Zalo i Nostr nie są omijane przez ogólne
  trwałe wysyłanie, dopóki nie istnieją ich testy parytetu adaptera.
- Dostarczanie callbackowe Direct-DM/Nostr pozostaje autorytatywne, chyba że
  zostanie jawnie zmigrowane do kompletnego celu wiadomości i odpornego na
  odtwarzanie adaptera wysyłania.
- Oznaczone wiadomości Slack o awarii OpenClaw Gateway pozostają widoczne na
  wyjściu, oznaczone echa botów w pokoju są odrzucane przed `allowBots`, a
  nieoznaczone wiadomości botów z tym samym widocznym tekstem nadal podlegają
  normalnej autoryzacji botów.
- Natywna awaria strumienia Slack do podglądu szkicu w DM najwyższego poziomu.
- Finalizacja podglądu Matrix i awaryjne redagowanie.
- Oznaczone echa awarii OpenClaw Gateway w pokojach Matrix z kont botów
  skonfigurowanych są odrzucane przed obsługą `allowBots`.
- Audyty kaskady awarii Gateway we współdzielonych pokojach Discord i Google
  Chat obejmują tryby `allowBots` przed deklarowaniem ogólnej ochrony w tych
  miejscach.
- Finalizacja szkicu Mattermost i awaryjne świeże wysłanie.
- Finalizacja natywnego postępu Teams.
- Tłumienie duplikatu finału Feishu.
- Awaryjne zachowanie po czasie oczekiwania akumulatora QQ Bot.
- Trwałe wysyłki końcowe Tlon zachowują renderowanie podpisu modelu i śledzenie
  wątków z udziałem.
- Proste trwałe wysyłki końcowe WhatsApp, Signal, iMessage, Google Chat, LINE,
  IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal.

Walidacja:

- Docelowe pliki Vitest podczas developmentu.
- `pnpm check:changed` w Testbox dla pełnej zmienionej powierzchni.
- Szersze `pnpm check` w Testbox przed lądowaniem pełnego refaktoru albo po
  zmianach publicznego SDK/eksportu.
- Live albo qa-channel smoke dla co najmniej jednego kanału zdolnego do edycji i
  jednego prostego kanału wyłącznie wysyłającego przed usunięciem wrapperów
  kompatybilności.

## Otwarte pytania

- Czy Telegram powinien ostatecznie zastąpić źródło runnera grammY w pełni
  trwałym źródłem pollingu, które może kontrolować ponowne dostarczanie na
  poziomie platformy, a nie tylko utrwalony znak wodny restartu OpenClaw.
- Czy trwały stan podglądu live powinien być przechowywany w tym samym rekordzie
  kolejki co intencja wysłania końcowego, czy w siostrzanym magazynie stanu
  live.
- Jak długo wrappery kompatybilności pozostają udokumentowane po wydaniu
  `plugin-sdk/channel-outbound`.
- Czy zewnętrzne Pluginy powinny implementować adaptery odbioru bezpośrednio,
  czy tylko udostępniać hooki normalize/send/live przez
  `defineChannelMessageAdapter`.
- Które pola potwierdzeń można bezpiecznie wystawić w publicznym SDK, a które
  należą do wewnętrznego stanu runtime.
- Czy efekty uboczne, takie jak cache self-echo i znaczniki wątków z udziałem,
  powinny być modelowane jako hooki kontekstu wysyłania, kroki finalizacji
  należące do adaptera, czy subskrybenci potwierdzeń.
- Które kanały mają natywne metadane origin, które potrzebują utrwalonych
  rejestrów wychodzących, a które nie mogą zapewnić niezawodnego tłumienia echa
  między botami.

## Kryteria akceptacji

- Każdy dołączony kanał wiadomości wysyła końcowe widoczne wyjście przez
  `messages.send`.
- Każdy kanał wiadomości inbound wchodzi przez `messages.receive` albo
  udokumentowany wrapper kompatybilności.
- Każdy kanał podglądu/edycji/strumienia używa `messages.live` do stanu szkicu i
  finalizacji.
- `channel.inbound` jest tylko wrapperem.
- Helpery SDK nazwane odpowiedziami są eksportami kompatybilności, a nie
  zalecaną ścieżką.
- Trwałe odzyskiwanie może odtworzyć oczekujące wysyłki końcowe po restarcie bez
  utraty odpowiedzi końcowej ani duplikowania już zapisanych wysyłek; wysyłki,
  których wynik platformowy jest nieznany, są uzgadniane przed ponownym
  odtworzeniem albo udokumentowane jako co najmniej raz dla tego adaptera.
- Trwałe wysyłki końcowe zamykają się niepowodzeniem, gdy nie można zapisać
  trwałej intencji, chyba że wywołujący jawnie wybrał udokumentowany tryb
  nietrwały.
- Starsze helpery kompatybilności SDK domyślnie używają bezpośredniego
  dostarczania należącego do kanału; ogólne trwałe wysyłanie jest tylko jawnym
  włączeniem.
- Potwierdzenia zachowują wszystkie identyfikatory wiadomości platformy dla
  dostarczeń wieloczęściowych oraz identyfikator główny dla wygody
  wątkowania/edycji.
- Trwałe wrappery zachowują lokalne efekty uboczne kanału przed zastąpieniem
  bezpośrednich callbacków dostarczania.
- Przygotowane dispatchery nie są liczone jako trwałe, dopóki ich końcowa
  ścieżka dostarczania jawnie nie użyje kontekstu wysyłania.
- Dostarczanie awaryjne obsługuje każdy projektowany payload.
- Trwałe dostarczanie awaryjne rejestruje każdy projektowany payload w jednej
  odtwarzalnej intencji albo planie wsadowym.
- Wyjście awarii Gateway pochodzące z OpenClaw jest widoczne dla ludzi, ale
  oznaczone echa pokojów autorstwa botów są odrzucane przed autoryzacją botów na
  kanałach, które deklarują obsługę kontraktu origin.
- Dokumentacja wyjaśnia wysyłanie, odbieranie, live, stan, potwierdzenia,
  relacje, politykę awarii, migrację i pokrycie testami.

## Powiązane

- [Wiadomości](/pl/concepts/messages)
- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
- [Szkice postępu](/pl/concepts/progress-drafts)
- [Polityka ponawiania](/pl/concepts/retry)
- [API inbound kanału](/pl/plugins/sdk-channel-inbound)
