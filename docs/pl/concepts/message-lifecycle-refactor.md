---
read_when:
    - Refaktoryzacja zachowania kanału przy wysyłaniu lub odbieraniu
    - Zmiana tury kanału, wysyłania odpowiedzi, kolejki wychodzącej, strumieniowania podglądu lub interfejsów API wiadomości SDK Plugin
    - Projektowanie nowego Plugin dla kanału, który wymaga trwałego wysyłania, potwierdzeń odbioru, podglądów, edycji lub ponawiania prób
summary: Plan projektowy ujednoliconego, trwałego cyklu życia odbierania, wysyłania, podglądu, edycji i strumieniowania wiadomości
title: Refaktoryzacja cyklu życia wiadomości
x-i18n:
    generated_at: "2026-05-10T19:32:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ta strona opisuje docelowy projekt zastąpienia rozproszonych pomocników obsługujących tury kanałów, wysyłkę odpowiedzi, strumieniowanie podglądu i dostarczanie wychodzące jednym trwałym cyklem życia wiadomości.

Krótko:

- Podstawowymi prymitywami rdzenia powinny być **receive** i **send**, a nie **reply**.
- Odpowiedź jest tylko relacją na wiadomości wychodzącej.
- Tura jest udogodnieniem przetwarzania przychodzącego, a nie właścicielem dostarczania.
- Wysyłanie musi być oparte na kontekście: `begin`, renderowanie, podgląd lub strumień, końcowe wysłanie, zatwierdzenie, niepowodzenie.
- Odbieranie także musi być oparte na kontekście: normalizacja, deduplikacja, trasowanie, zapis, wysyłka, potwierdzenie platformy, niepowodzenie.
- Publiczny plugin SDK powinien zostać zredukowany do jednej małej powierzchni wiadomości kanału.

## Problemy

Obecny stos kanałów wyrósł z kilku uzasadnionych lokalnych potrzeb:

- Proste adaptery przychodzące używają `runtime.channel.turn.run`.
- Bogate adaptery używają `runtime.channel.turn.runPrepared`.
- Starsze pomocniki używają `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, pomocników ładunków odpowiedzi, dzielenia odpowiedzi na fragmenty, referencji odpowiedzi i pomocników środowiska uruchomieniowego dla wiadomości wychodzących.
- Strumieniowanie podglądu znajduje się w dispatcherach specyficznych dla kanału.
- Trwałość końcowego dostarczenia jest dodawana wokół istniejących ścieżek ładunków odpowiedzi.

Taki kształt naprawia lokalne błędy, ale zostawia OpenClaw ze zbyt wieloma publicznymi pojęciami i zbyt wieloma miejscami, w których semantyka dostarczania może się rozjechać.

Problem niezawodności, który to ujawnił, wygląda tak:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Docelowy niezmiennik jest szerszy niż Telegram: gdy rdzeń zdecyduje, że widoczna wiadomość wychodząca powinna istnieć, intencja musi być trwała, zanim zostanie podjęta próba wysłania przez platformę, a potwierdzenie platformy musi zostać zatwierdzone po sukcesie. Daje to OpenClaw odzyskiwanie typu co najmniej raz. Zachowanie dokładnie raz istnieje tylko dla adapterów, które potrafią wykazać natywną idempotentność albo uzgodnić próbę o nieznanym wyniku po wysłaniu ze stanem platformy przed ponownym odtworzeniem.

To jest stan końcowy tej refaktoryzacji, a nie opis każdej obecnej ścieżki. Podczas migracji istniejące pomocniki wiadomości wychodzących nadal mogą przechodzić do bezpośredniego wysłania, gdy zapisy do kolejki w trybie best effort zawiodą. Refaktoryzacja jest kompletna dopiero wtedy, gdy trwałe końcowe wysłania kończą się zamkniętym niepowodzeniem albo jawnie rezygnują z trwałości za pomocą udokumentowanej polityki nietrwałej.

## Cele

- Jeden cykl życia rdzenia dla wszystkich ścieżek odbioru i wysyłania wiadomości kanału.
- Domyślnie trwałe końcowe wysłania w nowym cyklu życia wiadomości po tym, jak adapter zadeklaruje zachowanie bezpieczne do odtwarzania.
- Wspólna semantyka podglądu, edycji, strumienia, finalizacji, ponawiania, odzyskiwania i potwierdzeń.
- Mała powierzchnia plugin SDK, której zewnętrzne pluginy mogą się nauczyć i którą mogą utrzymywać.
- Kompatybilność dla istniejących wywołań `channel.turn` podczas migracji.
- Jasne punkty rozszerzeń dla nowych możliwości kanałów.
- Brak gałęzi specyficznych dla platformy w rdzeniu.
- Brak komunikatów kanału typu delta tokenów. Strumieniowanie kanału pozostaje podglądem wiadomości, edycją, dopisywaniem lub dostarczeniem ukończonego bloku.
- Strukturalne metadane pochodzenia OpenClaw dla wyjścia operacyjnego/systemowego, tak aby widoczne awarie Gateway nie wracały do współdzielonych pokoi z włączonymi botami jako nowe prompty.

## Poza zakresem

- Nie usuwać `runtime.channel.turn.*` w pierwszej fazie.
- Nie wymuszać na każdym kanale takiego samego natywnego zachowania transportu.
- Nie uczyć rdzenia tematów Telegram, natywnych strumieni Slack, redakcji Matrix, kart Feishu, głosu QQ ani aktywności Teams.
- Nie publikować wszystkich wewnętrznych pomocników migracji jako stabilnego API SDK.
- Nie sprawiać, aby ponowienia odtwarzały ukończone, nieidempotentne operacje platformy.

## Model referencyjny

Vercel Chat ma dobry publiczny model mentalny:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- metody adaptera, takie jak `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` i pobieranie historii
- adapter stanu dla deduplikacji, blokad, kolejek i trwałości

OpenClaw powinien zapożyczyć słownictwo, a nie kopiować powierzchnię.

To, czego OpenClaw potrzebuje ponad ten model:

- Trwałe intencje wysyłania wychodzącego przed bezpośrednimi wywołaniami transportu.
- Jawne konteksty wysyłania z rozpoczęciem, zatwierdzeniem i niepowodzeniem.
- Konteksty odbioru, które znają politykę potwierdzeń platformy.
- Potwierdzenia, które przetrwają restart i mogą sterować edycjami, usunięciami, odzyskiwaniem i tłumieniem duplikatów.
- Mniejszy publiczny SDK. Wbudowane pluginy mogą używać wewnętrznych pomocników środowiska uruchomieniowego, ale zewnętrzne pluginy powinny widzieć jedno spójne API wiadomości.
- Zachowanie specyficzne dla agentów: sesje, transkrypty, strumieniowanie bloków, postęp narzędzi, zatwierdzenia, dyrektywy mediów, ciche odpowiedzi i historia wzmianek grupowych.

Obietnice w stylu `thread.post()` nie wystarczą dla OpenClaw. Ukrywają granicę transakcji, która decyduje, czy wysyłanie da się odzyskać.

## Model rdzenia

Nowa domena powinna znajdować się w wewnętrznej przestrzeni nazw rdzenia, takiej jak `src/channels/message/*`.

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

`state` jest właścicielem trwałego przechowywania intencji, potwierdzeń, idempotentności, odzyskiwania, blokad i deduplikacji.

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

Pozwala to tej samej ścieżce wysyłania obsługiwać zwykłe odpowiedzi, powiadomienia Cron, prompty zatwierdzeń, ukończenia zadań, wysyłki narzędzia wiadomości, wysyłki z CLI lub Control UI, wyniki subagentów i wysyłki automatyzacji.

### Pochodzenie

Pochodzenie opisuje, kto wytworzył wiadomość i jak OpenClaw powinien traktować echa tej wiadomości. Jest oddzielone od relacji: wiadomość może być odpowiedzią do użytkownika i nadal być wyjściem operacyjnym pochodzącym z OpenClaw.

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

Rdzeń posiada znaczenie wyjścia pochodzącego z OpenClaw. Kanały posiadają sposób kodowania tego pochodzenia w swoim transporcie.

Pierwszym wymaganym użyciem jest wyjście awarii Gateway. Ludzie nadal powinni widzieć wiadomości takie jak „Agent failed before reply” lub „Missing API key”, ale oznaczone wyjście operacyjne OpenClaw nie może być przyjmowane jako wejście autorstwa bota we współdzielonych pokojach, gdy `allowBots` jest włączone.

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

Potwierdzenie może opisywać jedną wiadomość platformy albo dostarczenie wieloczęściowe. Tekst podzielony na fragmenty, media plus tekst, głos plus tekst i awaryjne wersje kart muszą zachować wszystkie identyfikatory platformy, a jednocześnie ujawniać identyfikator główny do wątkowania i późniejszych edycji.

## Kontekst odbioru

Odbieranie nie powinno być gołym wywołaniem pomocnika. Rdzeń potrzebuje kontekstu, który zna deduplikację, trasowanie, zapis sesji i politykę potwierdzeń platformy.

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

Przepływ odbioru:

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

Potwierdzenie nie jest jedną rzeczą. Kontrakt odbioru musi rozdzielać te sygnały:

- **Potwierdzenie transportu:** informuje Webhook lub gniazdo platformy, że OpenClaw przyjął kopertę zdarzenia. Niektóre platformy wymagają tego przed wysyłką.
- **Potwierdzenie offsetu odpytywania:** przesuwa kursor, aby to samo zdarzenie nie zostało pobrane ponownie. Nie może ono przesunąć się poza pracę, której nie da się odzyskać.
- **Potwierdzenie zapisu przychodzącego:** potwierdza, że OpenClaw utrwalił wystarczająco dużo metadanych przychodzących, aby zdeduplikować i trasować ponowne dostarczenie.
- **Widoczne dla użytkownika potwierdzenie odbioru:** opcjonalne zachowanie odczytu/statusu/pisania; nigdy nie jest granicą trwałości.

`ReceiveAckPolicy` kontroluje tylko potwierdzenie transportu lub odpytywania. Nie wolno jej ponownie używać do potwierdzeń odczytu ani reakcji statusu.

Przed autoryzacją bota odbiór musi zastosować współdzieloną politykę echa OpenClaw, gdy kanał potrafi dekodować metadane pochodzenia wiadomości:

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

To odrzucenie jest oparte na znaczniku, a nie na tekście. Wiadomość w pokoju autorstwa bota z tym samym widocznym tekstem awarii Gateway, ale bez metadanych pochodzenia OpenClaw, nadal przechodzi przez normalną autoryzację `allowBots`.

Polityka potwierdzeń jest jawna:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Odpytywanie Telegram używa teraz polityki potwierdzeń kontekstu odbioru dla swojego utrwalonego znaku wodnego restartu. Tracker nadal obserwuje aktualizacje grammY, gdy wchodzą do łańcucha middleware, ale OpenClaw utrwala tylko bezpieczny ukończony identyfikator aktualizacji po udanej wysyłce, pozostawiając nieudane lub niższe oczekujące aktualizacje możliwe do odtworzenia po restarcie. Offset pobierania upstream `getUpdates` Telegram nadal jest kontrolowany przez bibliotekę odpytywania, więc pozostałym głębszym krokiem jest w pełni trwałe źródło odpytywania, jeśli potrzebujemy redelivery na poziomie platformy poza znakiem wodnym restartu OpenClaw. Platformy Webhook mogą wymagać natychmiastowego potwierdzenia HTTP, ale nadal potrzebują deduplikacji przychodzącej i trwałych intencji wysyłania wychodzącego, ponieważ Webhooki mogą dostarczać ponownie.

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

Zamiar musi istnieć przed operacjami wejścia/wyjścia transportu. Ponowne uruchomienie po rozpoczęciu, ale przed
zatwierdzeniem, jest możliwe do odzyskania.

Niebezpieczna granica znajduje się po sukcesie platformy i przed zatwierdzeniem potwierdzenia. Jeśli
proces zakończy się w tym miejscu, OpenClaw nie może wiedzieć, czy komunikat platformy istnieje,
chyba że adapter zapewnia natywną idempotencję albo ścieżkę uzgadniania potwierdzeń.
Takie próby muszą wznawiać się w `unknown_after_send`, a nie ślepo odtwarzać wysyłkę. Kanały
bez uzgadniania mogą wybrać ponowienie co najmniej raz tylko wtedy, gdy zduplikowane widoczne
komunikaty są akceptowalnym, udokumentowanym kompromisem dla tego kanału i relacji.
Obecny most uzgadniania SDK wymaga, aby adapter zadeklarował
`reconcileUnknownSend`, a następnie prosi `durableFinal.reconcileUnknownSend` o
sklasyfikowanie nieznanego wpisu jako `sent`, `not_sent` albo `unresolved`; tylko `not_sent`
pozwala na ponowienie, a nierozwiązane wpisy pozostają terminalne albo ponawiają wyłącznie
sprawdzenie uzgadniania.

Polityka trwałości musi być jawna:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` oznacza, że rdzeń musi zakończyć się błędem w trybie zamkniętym, gdy nie może zapisać trwałego zamiaru.
`best_effort` może przejść dalej, gdy trwałość jest niedostępna. `disabled` zachowuje
stare zachowanie bezpośredniej wysyłki. Podczas migracji starsze opakowania i publiczne
pomocniki zgodności domyślnie używają `disabled`; nie mogą wnioskować `required`
z faktu, że kanał ma generyczny adapter wychodzący.

Konteksty wysyłki są też właścicielami lokalnych dla kanału efektów po wysyłce. Migracja nie jest bezpieczna,
jeśli trwałe dostarczanie omija lokalne zachowanie, które wcześniej było przypięte do
bezpośredniej ścieżki wysyłki kanału. Przykłady obejmują pamięci podręczne tłumienia własnego echa,
znaczniki uczestnictwa w wątku, natywne kotwice edycji, renderowanie sygnatur modelu
oraz specyficzne dla platformy zabezpieczenia przed duplikatami. Te efekty muszą albo zostać przeniesione do
adaptera wysyłki, adaptera renderowania albo nazwanego haka kontekstu wysyłki, zanim ten
kanał będzie mógł włączyć trwałe generyczne dostarczanie końcowe.

Pomocniki wysyłki muszą zwracać potwierdzenia aż do swojego wywołującego. Trwałe
opakowania nie mogą połykać identyfikatorów komunikatów ani zastępować wyniku dostarczenia kanału
wartością `undefined`; buforowane dyspozytory używają tych identyfikatorów do kotwic wątków, późniejszych edycji,
finalizacji podglądu i tłumienia duplikatów.

Wysyłki awaryjne działają na partiach, nie na pojedynczych ładunkach. Przepisywanie cichych odpowiedzi,
awaryjna obsługa mediów, awaryjna obsługa kart i projekcja fragmentów mogą łącznie wytworzyć więcej niż
jeden komunikat do dostarczenia, więc kontekst wysyłki musi albo dostarczyć całą
rzutowaną partię, albo jawnie udokumentować, dlaczego prawidłowy jest tylko jeden ładunek.

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

Gdy taki mechanizm awaryjny jest trwały, cała rzutowana partia musi być reprezentowana przez
jeden trwały zamiar wysyłki albo inny atomowy plan partii. Rejestrowanie każdego ładunku
pojedynczo nie wystarcza: awaria między ładunkami może pozostawić częściowy widoczny
wariant awaryjny bez trwałego rekordu dla pozostałych ładunków. Odzyskiwanie musi wiedzieć,
które jednostki mają już potwierdzenia, i albo odtworzyć tylko brakujące jednostki, albo oznaczyć
partię jako `unknown_after_send`, dopóki adapter jej nie uzgodni.

## Kontekst na żywo

Zachowanie podglądu, edycji, postępu i strumienia powinno być jednym cyklem życia włączanym świadomie.

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

Stan na żywo jest wystarczająco trwały, aby odzyskać go albo tłumić duplikaty:

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

- Telegram wysyła i edytuje podgląd, ze świeżą finalną wersją po przekroczeniu wieku nieświeżego podglądu.
- Discord wysyła i edytuje podgląd, anuluje przy mediach, błędzie albo jawnej odpowiedzi.
- Slack używa natywnego strumienia albo roboczego podglądu zależnie od kształtu wątku.
- Mattermost finalizuje roboczy post.
- Matrix finalizuje robocze zdarzenie albo redaguje je przy niezgodności.
- Teams używa natywnego strumienia postępu.
- QQ Bot używa strumienia albo zgromadzonego wariantu awaryjnego.

## Powierzchnia adaptera

Publiczny cel SDK powinien być jedną podścieżką:

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

Przed autoryzacją wstępną rdzeń musi uruchomić wspólny predykat echa OpenClaw
zawsze, gdy `origin.decode` zwraca metadane pochodzące z OpenClaw. Adapter odbioru
dostarcza fakty platformy, takie jak autor bota i kształt pokoju; rdzeń jest właścicielem decyzji
o odrzuceniu i kolejności, aby kanały nie implementowały ponownie filtrów tekstowych.

Adapter pochodzenia:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Rdzeń ustawia `MessageOrigin`. Kanały tylko tłumaczą go do i z natywnych
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

## Redukcja publicznego SDK

Nowa publiczna powierzchnia powinna wchłonąć albo oznaczyć jako przestarzałe te obszary koncepcyjne:

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
runtime podczas migracji. Publiczna dokumentacja powinna kierować autorów Pluginów do
`plugin-sdk/channel-message`, gdy już istnieje.

## Relacja z turą kanału

`runtime.channel.turn.*` powinno pozostać podczas migracji.

Powinno stać się adapterem zgodności:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` również powinno początkowo pozostać:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Po zmostkowaniu wszystkich dołączonych Pluginów i znanych ścieżek zgodności firm trzecich
`channel.turn` może zostać oznaczone jako przestarzałe. Nie powinno zostać usunięte, dopóki nie istnieje
opublikowana ścieżka migracji SDK i testy kontraktowe dowodzące, że stare Pluginy nadal działają
albo kończą się jasnym błędem wersji.

## Zabezpieczenia zgodności

Podczas migracji generyczne trwałe dostarczanie jest włączane świadomie dla każdego kanału, którego
istniejące wywołanie zwrotne dostarczania ma efekty uboczne wykraczające poza „wyślij ten ładunek”.

Starsze punkty wejścia są domyślnie nietrwałe:

- `channel.turn.run` i `dispatchAssembledChannelTurn` używają wywołania zwrotnego
  dostarczania kanału, chyba że ten kanał jawnie dostarcza audytowany obiekt trwałej
  polityki/opcji.
- `channel.turn.runPrepared` pozostaje własnością kanału, dopóki przygotowany dyspozytor
  jawnie nie wywoła kontekstu wysyłki.
- Publiczne pomocniki zgodności, takie jak `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` oraz pomocniki bezpośrednich DM, nigdy nie wstrzykują generycznego
  trwałego dostarczania przed dostarczonym przez wywołującego wywołaniem zwrotnym `deliver` albo `reply`.

Dla typów mostów migracyjnych `durable: undefined` oznacza „nietrwałe”. Ścieżka
trwała jest włączana tylko przez jawną wartość polityki/opcji. `durable:
false` może pozostać jako zapis zgodności, ale implementacja nie powinna
wymagać, aby każdy niezmodernizowany kanał go dodawał.

Obecny kod mostu musi utrzymywać decyzję o trwałości jako jawną:

- Trwałe dostarczanie końcowe zwraca rozróżnialny status. `handled_visible` i
  `handled_no_send` są terminalne; `unsupported` i `not_applicable` mogą
  wrócić do dostarczania obsługiwanego przez kanał; `failed` propaguje błąd
  wysyłania.
- Ogólne trwałe dostarczanie końcowe jest ograniczane możliwościami adaptera,
  takimi jak ciche dostarczanie, zachowanie celu odpowiedzi, zachowanie
  natywnego cytatu oraz haki wysyłania wiadomości. Brak równoważności powinien
  wybierać dostarczanie obsługiwane przez kanał, a nie ogólne wysłanie, które
  zmienia zachowanie widoczne dla użytkownika.
- Trwałe wysyłki oparte na kolejce ujawniają referencję intencji dostarczenia.
  Istniejące pola sesji `pendingFinalDelivery*` mogą przenosić identyfikator
  intencji w trakcie przejścia; stanem docelowym jest magazyn `MessageSendIntent`
  zamiast zamrożonego tekstu odpowiedzi oraz doraźnych pól kontekstu.

Nie włączaj ogólnej trwałej ścieżki dla kanału, dopóki wszystkie poniższe
warunki nie będą spełnione:

- Ogólny adapter wysyłania wykonuje to samo renderowanie i zachowanie transportu
  co stara ścieżka bezpośrednia.
- Lokalne skutki uboczne po wysłaniu są zachowane przez kontekst wysyłania.
- Adapter zwraca potwierdzenia lub wyniki dostarczenia ze wszystkimi
  identyfikatorami wiadomości platformy.
- Przygotowane ścieżki dyspozytora albo wywołują nowy kontekst wysyłania, albo
  pozostają udokumentowane jako poza trwałą gwarancją.
- Dostarczanie awaryjne obsługuje każdy przewidywany ładunek, a nie tylko
  pierwszy.
- Trwałe dostarczanie awaryjne zapisuje całą tablicę przewidywanych ładunków
  jako jedną odtwarzalną intencję lub plan wsadowy.

Konkretne zagrożenia migracji, które trzeba zachować:

- Dostarczanie monitora iMessage zapisuje wysłane wiadomości w pamięci
  podręcznej echa po pomyślnym wysłaniu. Trwałe wysyłki końcowe nadal muszą
  wypełniać tę pamięć podręczną, w przeciwnym razie OpenClaw może ponownie
  wchłonąć własne końcowe odpowiedzi jako przychodzące wiadomości użytkownika.
- Tlon dodaje opcjonalny podpis modelu i zapisuje wątki, w których uczestniczył,
  po odpowiedziach grupowych. Ogólne trwałe dostarczanie nie może pomijać tych
  efektów; należy przenieść je do adapterów renderowania/wysyłania/finalizacji
  Tlon albo pozostawić Tlon na ścieżce obsługiwanej przez kanał.
- Discord i inne przygotowane dyspozytory już posiadają własne dostarczanie
  bezpośrednie i zachowanie podglądu. Nie obejmuje ich trwała gwarancja
  złożonej tury, dopóki ich przygotowane dyspozytory jawnie nie przekierują
  wiadomości końcowych przez kontekst wysyłania.
- Ciche dostarczanie awaryjne Telegram musi dostarczyć pełną tablicę
  przewidywanych ładunków. Skrót dla pojedynczego ładunku może porzucić
  dodatkowe ładunki awaryjne po projekcji.
- LINE, Zalo, Nostr i inne istniejące ścieżki złożone/pomocnicze mogą mieć
  obsługę tokenów odpowiedzi, pośredniczenie mediów, pamięci podręczne
  wysłanych wiadomości, czyszczenie ładowania/statusu albo cele wyłącznie
  zwrotne. Pozostają na dostarczaniu obsługiwanym przez kanał, dopóki te
  semantyki nie zostaną reprezentowane przez adapter wysyłania i zweryfikowane
  testami.
- Pomocniki Direct-DM mogą mieć callback odpowiedzi, który jest jedynym
  poprawnym celem transportu. Ogólne wychodzące wysyłanie nie może zgadywać na
  podstawie `OriginatingTo` lub `To` i pomijać tego callbacku.
- Dane wyjściowe awarii OpenClaw Gateway muszą pozostać widoczne dla ludzi, ale
  oznaczone echa pokojów utworzone przez boty muszą być odrzucane przed
  autoryzacją `allowBots`. Kanały nie mogą implementować tego za pomocą filtrów
  prefiksów widocznego tekstu, z wyjątkiem krótkotrwałego awaryjnego obejścia;
  trwały kontrakt to ustrukturyzowane metadane pochodzenia.

## Pamięć wewnętrzna

Trwała kolejka powinna przechowywać intencje wysłania wiadomości, a nie ładunki
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

Kolejka powinna przechowywać wystarczającą tożsamość, aby po restarcie odtworzyć
wysyłkę przez to samo konto, wątek, cel, politykę formatowania i reguły mediów.

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
- Nie ponawiaj `invalid_payload`, chyba że istnieje awaryjne renderowanie.
- Nie ponawiaj `auth` ani `permission`, dopóki konfiguracja się nie zmieni.
- Dla `not_found` pozwól finalizacji na żywo przejść awaryjnie z edycji do
  świeżego wysłania, gdy kanał deklaruje, że jest to bezpieczne.
- Dla `conflict` użyj reguł potwierdzeń/idempotencji, aby zdecydować, czy
  wiadomość już istnieje.
- Każdy błąd po tym, jak adapter mógł zakończyć operacje I/O platformy, ale
  przed zatwierdzeniem potwierdzenia, staje się `unknown_after_send`, chyba że
  adapter potrafi udowodnić, że operacja platformy nie nastąpiła.

## Mapowanie kanałów

| Kanał           | Docelowa migracja                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Zasada potwierdzania odbioru oraz trwałe wysyłki finalne. Adapter live odpowiada za wysyłanie oraz podgląd edycji, finalne wysłanie nieaktualnego podglądu, tematy, pomijanie podglądu odpowiedzi z cytatem, awaryjną obsługę mediów i obsługę retry-after.                                                                                                                                                                   |
| Discord         | Adapter wysyłania opakowuje istniejące trwałe dostarczanie ładunku. Adapter live odpowiada za edycję szkicu, szkic postępu, anulowanie podglądu mediów/błędów, zachowanie celu odpowiedzi i potwierdzenia identyfikatorów wiadomości. Przeprowadź audyt tworzonych przez bota ech awarii Gateway w pokojach współdzielonych; użyj rejestru wychodzącego lub innego natywnego odpowiednika, jeśli Discord nie może przenosić metadanych pochodzenia w zwykłych wiadomościach. |
| Slack           | Adapter wysyłania obsługuje zwykłe posty czatu. Adapter live wybiera natywny strumień, gdy kształt wątku go obsługuje, w przeciwnym razie podgląd szkicu. Potwierdzenia zachowują znaczniki czasu wątku. Adapter pochodzenia mapuje awarie OpenClaw Gateway na Slack `chat.postMessage.metadata` i odrzuca oznaczone echa pokoju bota przed autoryzacją `allowBots`.                                  |
| WhatsApp        | Adapter wysyłania odpowiada za wysyłanie tekstu/mediów z trwałymi intencjami finalnymi. Adapter odbioru obsługuje wzmianki w grupie i tożsamość nadawcy. Adapter live może pozostać nieobecny, dopóki WhatsApp nie będzie mieć edytowalnego transportu.                                                                                                                                                                        |
| Matrix          | Adapter live odpowiada za edycje zdarzeń szkicu, finalizację, redakcję, ograniczenia zaszyfrowanych mediów i awaryjną obsługę niezgodności celu odpowiedzi. Adapter odbioru odpowiada za uzupełnianie zaszyfrowanych zdarzeń i deduplikację. Adapter pochodzenia powinien kodować pochodzenie awarii OpenClaw Gateway w treści zdarzenia Matrix i odrzucać echa pokoju skonfigurowanego bota przed obsługą `allowBots`.              |
| Mattermost      | Adapter live odpowiada za jeden post szkicu, zwijanie postępu/narzędzi, finalizację w miejscu i awaryjne świeże wysłanie.                                                                                                                                                                                                                                                       |
| Microsoft Teams | Adapter live odpowiada za natywny postęp i zachowanie strumienia bloków. Adapter wysyłania odpowiada za aktywności i potwierdzenia załączników/kart.                                                                                                                                                                                                                                        |
| Feishu          | Adapter renderowania odpowiada za renderowanie tekstu/kart/surowej treści. Adapter live odpowiada za karty strumieniowe i tłumienie duplikatów finalnych. Adapter wysyłania odpowiada za komentarze, sesje tematów, media i tłumienie głosu.                                                                                                                                                                      |
| QQ Bot          | Adapter live odpowiada za strumieniowanie C2C, limit czasu akumulatora i awaryjne wysłanie finalne. Adapter renderowania odpowiada za tagi mediów i tekst jako głos.                                                                                                                                                                                                                               |
| Signal          | Prosty odbiór oraz adapter wysyłania. Brak adaptera live, chyba że signal-cli doda niezawodną obsługę edycji.                                                                                                                                                                                                                                                                |
| iMessage        | Prosty odbiór oraz adapter wysyłania. Wysyłanie iMessage musi zachować wypełnianie pamięci podręcznej ech monitora, zanim trwałe finalne wysyłki będą mogły ominąć dostarczanie przez monitor.                                                                                                                                                                                                                 |
| Google Chat     | Prosty odbiór oraz adapter wysyłania z relacją wątku mapowaną na przestrzenie i identyfikatory wątków. Przeprowadź audyt zachowania pokoju `allowBots=true` dla oznaczonych ech awarii OpenClaw Gateway.                                                                                                                                                                                        |
| LINE            | Prosty odbiór oraz adapter wysyłania z ograniczeniami tokena odpowiedzi modelowanymi jako możliwość celu/relacji.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | Most odbioru SDK oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Prosty odbiór oraz adapter wysyłania, bez trwałych potwierdzeń edycji.                                                                                                                                                                                                                                                                                                    |
| Nostr           | Adapter odbioru oraz wysyłania dla zaszyfrowanych DM; potwierdzenia są identyfikatorami zdarzeń.                                                                                                                                                                                                                                                                                           |
| QA Channel      | Adapter testu kontraktowego dla zachowania odbioru, wysyłania, live, ponawiania i odzyskiwania.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | Prosty odbiór oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | Adapter wysyłania musi zachować renderowanie podpisu modelu i śledzenie wątków z udziałem użytkownika, zanim zostanie włączone ogólne trwałe dostarczanie finalne.                                                                                                                                                                                                                        |
| Twitch          | Prosty odbiór oraz adapter wysyłania z klasyfikacją limitów szybkości.                                                                                                                                                                                                                                                                                               |
| Zalo            | Prosty odbiór oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Prosty odbiór oraz adapter wysyłania.                                                                                                                                                                                                                                                                                                                              |

## Plan migracji

### Faza 1: Wewnętrzna domena wiadomości

- Dodaj typy `src/channels/message/*` dla wiadomości, celów, relacji,
  pochodzeń, potwierdzeń, możliwości, trwałych intencji, kontekstu odbioru, kontekstu wysyłania, kontekstu live i klas awarii.
- Dodaj `origin?: MessageOrigin` do typu ładunku mostu migracji używanego przez
  bieżące dostarczanie odpowiedzi, a następnie przenieś to pole do `ChannelMessage` i typów renderowanych wiadomości, gdy refaktoryzacja zastąpi ładunki odpowiedzi.
- Utrzymaj to jako wewnętrzne, dopóki adaptery i testy nie potwierdzą kształtu.
- Dodaj czyste testy jednostkowe dla przejść stanu i serializacji.

### Faza 2: Rdzeń trwałego wysyłania

- Przenieś istniejącą kolejkę wychodzącą z trwałości ładunków odpowiedzi do trwałych
  intencji wysyłania wiadomości.
- Pozwól, aby trwała intencja wysyłania przenosiła przewidywaną tablicę ładunków lub plan wsadowy, a nie tylko jeden ładunek odpowiedzi.
- Zachowaj bieżące zachowanie odzyskiwania kolejki przez konwersję zgodności.
- Spraw, aby `deliverOutboundPayloads` wywoływało `messages.send`.
- Uczyń trwałość finalnego wysłania domyślną i kończ niepowodzeniem w sposób zamknięty, gdy trwała intencja nie może zostać zapisana w nowym cyklu życia wiadomości, po zadeklarowaniu przez adapter bezpieczeństwa odtwarzania. Istniejące ścieżki zgodności channel-turn i SDK pozostają w tej fazie domyślnie bezpośrednim wysyłaniem.
- Rejestruj potwierdzenia spójnie.
- Zwracaj potwierdzenia i wyniki dostarczania do pierwotnego wywołującego dyspozytora zamiast traktować trwałe wysyłanie jako końcowy efekt uboczny.
- Utrwal pochodzenie wiadomości przez trwałe intencje wysyłania, aby odzyskiwanie, odtwarzanie i wysyłki dzielone na fragmenty zachowywały operacyjne pochodzenie OpenClaw.

### Faza 3: Most tury kanału

- Ponownie zaimplementuj `channel.turn.run` i `dispatchAssembledChannelTurn` na podstawie
  `messages.receive` i `messages.send`.
- Utrzymaj bieżące typy faktów jako stabilne.
- Domyślnie zachowaj starsze zachowanie. Kanał assembled-turn staje się trwały
  tylko wtedy, gdy jego adapter jawnie zgłosi zgodę z zasadą trwałości bezpieczną do odtwarzania.
- Utrzymaj `durable: false` jako luk zgodności dla ścieżek, które finalizują
  natywne edycje i nie mogą jeszcze bezpiecznie odtwarzać, ale nie polegaj na znacznikach `false`, aby chronić niezmodernizowane kanały.
- Domyślnie włączaj trwałość assembled-turn tylko w nowym cyklu życia wiadomości, po
  tym jak mapowanie kanału udowodni, że ogólna ścieżka wysyłania zachowuje dawną semantykę dostarczania kanału.

### Faza 4: Most przygotowanego dyspozytora

- Zastąp `deliverDurableInboundReplyPayload` mostem kontekstu wysyłania.
- Zachowaj stary helper jako wrapper.
- Najpierw przenieś Telegram, WhatsApp, Slack, Signal, iMessage i Discord, ponieważ
  mają już prace nad trwałym finałem lub prostsze ścieżki wysyłania.
- Traktuj każdy przygotowany dyspozytor jako niepokryty, dopóki jawnie nie
  włączy się w kontekst wysyłania. Dokumentacja i wpisy w changelogu muszą mówić
  „złożone tury kanału” albo wskazywać zmigrowane ścieżki kanałów, zamiast
  twierdzić, że obejmują wszystkie automatyczne odpowiedzi końcowe.
- Zachowaj niezmienione zachowanie publicznych helperów zgodności, takich jak
  `recordInboundSessionAndDispatchReply`, helpery bezpośrednich DM i podobne.
  Mogą później ujawnić jawne włączenie kontekstu wysyłania, ale nie mogą
  automatycznie próbować generycznego trwałego dostarczania przed callbackiem
  dostarczania należącym do wywołującego.

### Faza 5: Ujednolicony cykl życia live

- Zbuduj `messages.live` z dwoma adapterami dowodowymi:
  - Telegram dla wysyłania, edycji oraz wysłania nieaktualnego finału.
  - Matrix dla finalizacji szkicu oraz awaryjnego redagowania.
- Następnie zmigruj Discord, Slack, Mattermost, Teams, QQ Bot i Feishu.
- Usuń zduplikowany kod finalizacji podglądu dopiero po tym, jak każdy kanał
  będzie miał testy parytetu.

### Faza 6: Publiczny SDK

- Dodaj `openclaw/plugin-sdk/channel-message`.
- Udokumentuj go jako preferowane API pluginu kanału.
- Zaktualizuj eksporty pakietu, inwentarz punktów wejścia, generowane bazowe
  stany API oraz dokumentację SDK pluginów.
- Uwzględnij `MessageOrigin`, hooki kodowania/dekodowania pochodzenia oraz
  współdzielony predykat `shouldDropOpenClawEcho` w powierzchni SDK
  channel-message.
- Zachowaj wrappery zgodności dla starych podścieżek.
- Oznacz helpery SDK z nazwami odpowiedzi jako przestarzałe w dokumentacji po
  zmigrowaniu dołączonych pluginów.

### Faza 7: Wszyscy nadawcy

Przenieś wszystkich producentów wychodzących innych niż odpowiedzi na `messages.send`:

- powiadomienia cron i Heartbeat
- ukończenia zadań
- wyniki hooków
- monity o zatwierdzenie i wyniki zatwierdzeń
- wysyłki narzędzia wiadomości
- ogłoszenia ukończenia subagenta
- jawne wysyłki CLI lub interfejsu Control UI
- ścieżki automatyzacji/broadcast

To jest moment, w którym model przestaje być „odpowiedziami agenta”, a staje się
„OpenClaw wysyła wiadomości”.

### Faza 8: Wycofanie tury

- Zachowaj `channel.turn` jako wrapper przez co najmniej jedno okno zgodności.
- Opublikuj notatki migracyjne.
- Uruchom testy zgodności SDK pluginów ze starymi importami.
- Usuń lub ukryj stare helpery wewnętrzne dopiero wtedy, gdy nie będzie ich
  potrzebował żaden dołączony plugin, a kontrakty zewnętrzne będą miały stabilny
  zamiennik.

## Plan testów

Testy jednostkowe:

- Serializacja i odzyskiwanie zamiaru trwałego wysyłania.
- Ponowne użycie klucza idempotencji i tłumienie duplikatów.
- Zapis potwierdzenia odbioru i pomijanie przy odtwarzaniu.
- Odzyskiwanie `unknown_after_send`, które uzgadnia stan przed odtworzeniem, gdy
  adapter obsługuje uzgadnianie.
- Polityka klasyfikacji awarii.
- Sekwencjonowanie polityki potwierdzeń odbioru.
- Mapowanie relacji dla wysyłek typu odpowiedź, kontynuacja, system i broadcast.
- Fabryka pochodzenia awarii Gateway oraz predykat `shouldDropOpenClawEcho`.
- Zachowanie pochodzenia przez normalizację ładunku, chunking, serializację
  trwałej kolejki i odzyskiwanie.

Testy integracyjne:

- Prosty adapter `channel.turn.run` nadal zapisuje i wysyła.
- Starsze dostarczanie złożonych tur nie staje się trwałe, chyba że kanał jawnie
  się na to zdecyduje.
- Most `channel.turn.runPrepared` nadal zapisuje i finalizuje.
- Publiczne helpery zgodności domyślnie wywołują callbacki dostarczania należące
  do wywołującego i nie wykonują generycznego wysyłania przed tymi callbackami.
- Awaryjne trwałe dostarczanie po restarcie odtwarza całą tablicę
  projektowanych ładunków i nie może pozostawić późniejszych ładunków
  niezapisanych po wczesnej awarii.
- Trwałe dostarczanie złożonej tury zwraca identyfikatory wiadomości platformy
  do buforowanego dyspozytora.
- Niestandardowe hooki dostarczania nadal zwracają identyfikatory wiadomości
  platformy, gdy trwałe dostarczanie jest wyłączone lub niedostępne.
- Odpowiedź końcowa przetrwa restart między ukończeniem pracy asystenta a
  wysłaniem na platformę.
- Szkic podglądu finalizuje się w miejscu, gdy jest to dozwolone.
- Szkic podglądu jest anulowany lub redagowany, gdy media/błąd/niezgodność celu
  odpowiedzi wymagają zwykłego dostarczenia.
- Strumieniowanie blokowe i strumieniowanie podglądu nie dostarczają tego samego
  tekstu jednocześnie.
- Media przesłane strumieniowo wcześnie nie są duplikowane w końcowym
  dostarczeniu.

Testy kanałów:

- Odpowiedź w temacie Telegram z potwierdzeniem odpytywania opóźnionym do
  bezpiecznego ukończonego znacznika kontekstu odbioru.
- Odzyskiwanie odpytywania Telegram dla aktualizacji zaakceptowanych, ale
  niedostarczonych, pokryte utrwalonym modelem bezpiecznie ukończonego offsetu.
- Nieaktualny podgląd Telegram wysyła świeży finał i czyści podgląd.
- Cichy fallback Telegram wysyła każdy projektowany ładunek fallbacku.
- Trwałość cichego fallbacku Telegram zapisuje pełną projektowaną tablicę
  fallbacku atomowo, a nie jeden trwały zamiar pojedynczego ładunku na iterację
  pętli.
- Anulowanie podglądu Discord przy mediach/błędzie/jawnej odpowiedzi.
- Finały przygotowanego dyspozytora Discord przechodzą przez kontekst wysyłania,
  zanim dokumentacja lub changelog stwierdzą trwałość końcowych odpowiedzi
  Discord.
- Trwałe wysyłki końcowe iMessage wypełniają cache echa wysłanych wiadomości
  monitora.
- Starsze ścieżki dostarczania LINE, Zalo i Nostr nie są omijane przez
  generyczne trwałe wysyłanie, dopóki nie istnieją testy parytetu ich adapterów.
- Dostarczanie callbackiem Direct-DM/Nostr pozostaje autorytatywne, chyba że
  zostanie jawnie zmigrowane do kompletnego celu wiadomości i adaptera wysyłania
  bezpiecznego do odtwarzania.
- Oznaczone wiadomości awarii Gateway OpenClaw w Slack pozostają widoczne
  wychodząco, oznaczone echa bot-room są odrzucane przed `allowBots`, a
  nieoznaczone wiadomości botów z tym samym widocznym tekstem nadal przechodzą
  normalną autoryzację botów.
- Natywny fallback strumienia Slack do podglądu szkicu w DM najwyższego poziomu.
- Finalizacja podglądu Matrix i awaryjne redagowanie.
- Oznaczone echa awarii Gateway OpenClaw w pokoju Matrix z skonfigurowanych
  kont botów są odrzucane przed obsługą `allowBots`.
- Audyty kaskady awarii Gateway we współdzielonym pokoju Discord i Google Chat
  obejmują tryby `allowBots` przed deklarowaniem tam generycznej ochrony.
- Finalizacja szkicu Mattermost i fallback świeżego wysłania.
- Finalizacja natywnego postępu Teams.
- Tłumienie zduplikowanego finału Feishu.
- Fallback limitu czasu akumulatora QQ Bot.
- Trwałe wysyłki końcowe Tlon zachowują renderowanie sygnatury modelu i
  śledzenie wątków z udziałem.
- Proste trwałe wysyłki końcowe WhatsApp, Signal, iMessage, Google Chat, LINE,
  IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo i Zalo Personal.

Walidacja:

- Ukierunkowane pliki Vitest podczas developmentu.
- `pnpm check:changed` w Testbox dla pełnej zmienionej powierzchni.
- Szersze `pnpm check` w Testbox przed wylądowaniem kompletnej refaktoryzacji
  lub po zmianach publicznego SDK/eksportów.
- Live lub qa-channel smoke dla co najmniej jednego kanału obsługującego edycję
  i jednego prostego kanału tylko do wysyłania przed usunięciem wrapperów
  zgodności.

## Otwarte pytania

- Czy Telegram powinien docelowo zastąpić źródło runnera grammY w pełni trwałym
  źródłem odpytywania, które może kontrolować ponowne dostarczanie na poziomie
  platformy, a nie tylko utrwalony znacznik restartu OpenClaw.
- Czy trwały stan podglądu live powinien być przechowywany w tym samym rekordzie
  kolejki co zamiar końcowej wysyłki, czy w siostrzanym magazynie stanu live.
- Jak długo wrappery zgodności pozostaną udokumentowane po wydaniu
  `plugin-sdk/channel-message`.
- Czy zewnętrzne pluginy powinny implementować adaptery odbioru bezpośrednio,
  czy tylko udostępniać hooki normalize/send/live przez
  `defineChannelMessageAdapter`.
- Które pola potwierdzeń odbioru można bezpiecznie ujawnić w publicznym SDK, a
  które są wewnętrznym stanem runtime.
- Czy efekty uboczne, takie jak cache self-echo i znaczniki wątków z udziałem,
  powinny być modelowane jako hooki kontekstu wysyłania, kroki finalizacji
  należące do adaptera czy subskrybenci potwierdzeń odbioru.
- Które kanały mają natywne metadane pochodzenia, które potrzebują utrwalonych
  rejestrów wychodzących, a które nie mogą zaoferować niezawodnego tłumienia
  echa między botami.

## Kryteria akceptacji

- Każdy dołączony kanał wiadomości wysyła końcowe widoczne wyjście przez
  `messages.send`.
- Każdy przychodzący kanał wiadomości wchodzi przez `messages.receive` albo
  udokumentowany wrapper zgodności.
- Każdy kanał podglądu/edycji/strumieniowania używa `messages.live` do stanu
  szkicu i finalizacji.
- `channel.turn` jest wyłącznie wrapperem.
- Helpery SDK z nazwami odpowiedzi są eksportami zgodności, a nie zalecaną
  ścieżką.
- Trwałe odzyskiwanie może odtworzyć oczekujące wysyłki końcowe po restarcie bez
  utraty odpowiedzi końcowej ani duplikowania już zapisanych wysyłek; wysyłki,
  których wynik platformowy jest nieznany, są uzgadniane przed odtworzeniem albo
  udokumentowane jako at-least-once dla tego adaptera.
- Trwałe wysyłki końcowe kończą się bezpieczną porażką, gdy nie można zapisać
  trwałego zamiaru, chyba że wywołujący jawnie wybrał udokumentowany tryb
  nietrwały.
- Starsze helpery zgodności channel-turn i SDK domyślnie korzystają z
  bezpośredniego dostarczania należącego do kanału; generyczne trwałe wysyłanie
  jest wyłącznie jawnym opt-in.
- Potwierdzenia odbioru zachowują wszystkie identyfikatory wiadomości platformy
  dla dostarczeń wieloczęściowych oraz identyfikator główny dla wygody
  wątkowania/edycji.
- Trwałe wrappery zachowują lokalne dla kanału efekty uboczne przed zastąpieniem
  bezpośrednich callbacków dostarczania.
- Przygotowane dyspozytory nie są liczone jako trwałe, dopóki ich końcowa
  ścieżka dostarczania jawnie nie użyje kontekstu wysyłania.
- Dostarczanie fallbacku obsługuje każdy projektowany ładunek.
- Trwałe dostarczanie fallbacku zapisuje każdy projektowany ładunek w jednym
  odtwarzalnym zamiarze albo planie batch.
- Wyjście awarii Gateway pochodzące z OpenClaw jest widoczne dla ludzi, ale
  oznaczone echa pokojowe napisane przez boty są odrzucane przed autoryzacją
  botów na kanałach, które deklarują obsługę kontraktu pochodzenia.
- Dokumentacja wyjaśnia wysyłanie, odbieranie, live, stan, potwierdzenia
  odbioru, relacje, politykę awarii, migrację i pokrycie testami.

## Powiązane

- [Wiadomości](/pl/concepts/messages)
- [Strumieniowanie i chunking](/pl/concepts/streaming)
- [Szkice postępu](/pl/concepts/progress-drafts)
- [Polityka ponawiania](/pl/concepts/retry)
- [Jądro tury kanału](/pl/plugins/sdk-channel-turn)
