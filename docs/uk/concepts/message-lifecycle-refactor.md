---
read_when:
    - Рефакторинг поведінки надсилання або отримання в каналі
    - Зміна ходу каналу, диспетчеризації відповідей, вихідної черги, потокового попереднього перегляду або API повідомлень SDK Plugin
    - Проєктування нового Plugin для каналу, якому потрібні надійне надсилання, підтвердження, попередні перегляди, редагування або повторні спроби
summary: План проєктування для уніфікованого надійного життєвого циклу отримання, надсилання, попереднього перегляду, редагування та потокової передачі повідомлень
title: Рефакторинг життєвого циклу повідомлень
x-i18n:
    generated_at: "2026-05-11T20:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ця сторінка описує цільовий дизайн для заміни розрізнених допоміжних засобів
обробки channel turn, надсилання відповідей, preview streaming та вихідної
доставки єдиним надійним життєвим циклом повідомлення.

Коротка версія:

- Основні примітиви мають бути **receive** і **send**, а не **reply**.
- Відповідь є лише відношенням у вихідному повідомленні.
- Turn є зручністю для обробки вхідних даних, а не власником доставки.
- Надсилання має базуватися на контексті: `begin`, render, preview або stream, final send,
  commit, fail.
- Отримання також має базуватися на контексті: normalize, dedupe, route, record,
  dispatch, platform ack, fail.
- Публічний plugin SDK має звестися до однієї невеликої поверхні channel-message.

## Проблеми

Поточний стек каналів виріс із кількох обґрунтованих локальних потреб:

- Прості вхідні адаптери використовують `runtime.channel.turn.run`.
- Розширені адаптери використовують `runtime.channel.turn.runPrepared`.
- Застарілі допоміжні засоби використовують `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, допоміжні засоби reply payload, reply chunking,
  reply references і outbound runtime helpers.
- Preview streaming живе в диспетчерах, специфічних для каналів.
- Надійність фінальної доставки додається навколо наявних шляхів reply payload.

Така форма виправляє локальні помилки, але залишає OpenClaw із надто великою
кількістю публічних понять і надто великою кількістю місць, де семантика доставки
може розходитися.

Проблема надійності, яка це виявила:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Цільовий інваріант ширший за Telegram: щойно ядро вирішує, що видиме вихідне
повідомлення має існувати, намір має бути збережений надійно до спроби
надсилання на платформу, а квитанція платформи має бути закомічена після успіху.
Це дає OpenClaw відновлення з гарантією at-least-once. Поведінка exactly-once
існує лише для адаптерів, які можуть довести нативну ідемпотентність або
узгодити спробу з невідомим результатом після надсилання зі станом платформи
перед повторним відтворенням.

Це кінцевий стан цього рефакторингу, а не опис кожного поточного шляху. Під час
міграції наявні вихідні допоміжні засоби все ще можуть переходити до прямого
надсилання, коли best-effort записи в чергу не вдаються. Рефакторинг завершений
лише тоді, коли надійні фінальні надсилання fail closed або явно відмовляються
від цього з документованою політикою non-durable.

## Цілі

- Один життєвий цикл ядра для всіх шляхів отримання й надсилання channel message.
- Надійні фінальні надсилання за замовчуванням у новому життєвому циклі повідомлення після того, як адаптер
  оголосить replay-safe поведінку.
- Спільна семантика preview, edit, stream, finalization, retry, recovery і receipt.
- Невелика поверхня plugin SDK, яку сторонні plugins можуть вивчити й підтримувати.
- Сумісність для наявних викликів `channel.turn` під час міграції.
- Чіткі точки розширення для нових можливостей каналів.
- Без специфічних для платформи гілок у ядрі.
- Без token-delta повідомлень каналів. Channel streaming залишається доставкою message preview,
  edit, append або completed block.
- Структуровані метадані походження з OpenClaw для операційного/системного виводу, щоб видимі
  збої gateway не входили повторно в спільні кімнати з увімкненими ботами як нові prompts.

## Нецілі

- Не видаляти `runtime.channel.turn.*` на першому етапі.
- Не змушувати кожен канал до однакової нативної транспортної поведінки.
- Не навчати ядро Telegram topics, Slack native streams, Matrix redactions,
  Feishu cards, QQ voice або Teams activities.
- Не публікувати всі внутрішні допоміжні засоби міграції як стабільний SDK API.
- Не робити так, щоб повторні спроби повторно відтворювали завершені неідемпотентні операції платформи.

## Еталонна модель

Vercel Chat має хорошу публічну ментальну модель:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- методи адаптера, як-от `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` і отримання історії
- адаптер стану для dedupe, locks, queues і persistence

OpenClaw має запозичити словник, а не копіювати поверхню.

Що OpenClaw потрібно понад цю модель:

- Надійні наміри вихідного надсилання перед прямими транспортними викликами.
- Явні контексти надсилання з begin, commit і fail.
- Контексти отримання, які знають політику platform ack.
- Квитанції, які переживають перезапуск і можуть керувати edits, deletes, recovery та
  duplicate suppression.
- Менший публічний SDK. Вбудовані plugins можуть використовувати внутрішні runtime helpers, але
  сторонні plugins мають бачити один узгоджений message API.
- Поведінка, специфічна для агента: sessions, transcripts, block streaming, tool
  progress, approvals, media directives, silent replies і group mention
  history.

Обіцянок у стилі `thread.post()` для OpenClaw недостатньо. Вони приховують
межу транзакції, яка визначає, чи можна відновити надсилання.

## Модель ядра

Новий домен має жити у внутрішньому просторі імен ядра, наприклад
`src/channels/message/*`.

Він має чотири поняття:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` володіє вхідним життєвим циклом.

`send` володіє вихідним життєвим циклом.

`live` володіє preview, edit, progress і stream state.

`state` володіє durable intent storage, receipts, idempotency, recovery, locks і
dedupe.

## Терміни повідомлень

### Повідомлення

Нормалізоване повідомлення є платформонейтральним:

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

### Ціль

Ціль описує, де живе повідомлення:

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

### Відношення

Відповідь є відношенням, а не коренем API:

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

Це дає тому самому шляху надсилання змогу обробляти звичайні відповіді, cron notifications, approval
prompts, task completions, message-tool sends, CLI або Control UI sends, subagent
results і automation sends.

### Походження

Походження описує, хто створив повідомлення і як OpenClaw має обробляти echoes цього
повідомлення. Воно відокремлене від relation: повідомлення може бути відповіддю користувачу
і водночас бути операційним виводом походження OpenClaw.

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

Ядро володіє значенням виводу походження OpenClaw. Канали володіють тим, як це
походження кодується в їхньому транспорті.

Перший обов’язковий випадок використання — вивід gateway failure. Люди все ще мають бачити
повідомлення на кшталт "Agent failed before reply" або "Missing API key", але позначений
операційний вивід OpenClaw не має прийматися як bot-authored input у спільних
кімнатах, коли `allowBots` увімкнено.

### Квитанція

Квитанції є першокласними:

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

Квитанції є мостом від durable intent до майбутніх edit, delete, preview
finalization, duplicate suppression і recovery.

Квитанція може описувати одне повідомлення платформи або багаточастинну доставку. Chunked
text, media plus text, voice plus text і card fallbacks мають зберігати всі
platform ids, водночас усе ще надаючи primary id для threading і подальших edits.

## Контекст отримання

Отримання не має бути простим викликом допоміжної функції. Ядру потрібен контекст, який знає
dedupe, routing, session recording і platform ack policy.

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

Потік отримання:

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

Ack не є чимось одним. Контракт отримання має тримати ці сигнали окремо:

- **Transport ack:** повідомляє platform webhook або socket, що OpenClaw прийняв
  event envelope. Деякі платформи вимагають цього до dispatch.
- **Polling offset ack:** просуває cursor, щоб ту саму подію не отримували
  знову. Це не має просуватися далі за роботу, яку неможливо відновити.
- **Inbound record ack:** підтверджує, що OpenClaw зберіг достатньо inbound metadata, щоб
  виконати dedupe і route для повторної доставки.
- **User-visible receipt:** необов’язкова read/status/typing поведінка; ніколи не є
  межею надійності.

`ReceiveAckPolicy` керує лише transport або polling acknowledgement. Його не можна
повторно використовувати для read receipts або status reactions.

Перед авторизацією бота receive має застосувати спільну OpenClaw echo policy,
коли канал може декодувати метадані походження повідомлення:

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

Це відкидання базується на тегах, а не на тексті. Bot-authored room message з тим самим
видимим текстом gateway-failure, але без метаданих походження OpenClaw, усе ще
проходить звичайну авторизацію `allowBots`.

Ack policy є явною:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling тепер використовує ack policy receive-context для свого збереженого
restart watermark. Tracker усе ще спостерігає grammY updates, коли вони входять у
middleware chain, але OpenClaw зберігає лише safe completed update id після
успішного dispatch, залишаючи невдалі або нижчі pending updates придатними для повторного відтворення після
перезапуску. Upstream `getUpdates` fetch offset Telegram усе ще контролюється
polling library, тому наступний глибший крок — повністю durable polling
source, якщо нам потрібна platform-level redelivery понад restart
watermark OpenClaw. Webhook platforms можуть потребувати immediate HTTP ack, але їм все одно потрібні
inbound dedupe і durable outbound send intents, бо webhooks можуть redeliver.

## Контекст надсилання

Надсилання також базується на контексті:

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

Бажана оркестрація:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Допоміжний засіб розгортається в:

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

Намір має існувати до транспортного I/O. Перезапуск після початку, але до
коміту, можна відновити.

Небезпечна межа проходить після успіху платформи й перед комітом квитанції. Якщо
процес завершується там, OpenClaw не може знати, чи існує повідомлення на платформі,
якщо адаптер не надає нативної ідемпотентності або шляху звірення квитанцій.
Такі спроби мають відновлюватися в `unknown_after_send`, а не сліпо повторюватися. Канали
без звірення можуть вибрати повторне відтворення at-least-once лише якщо дублікати видимих
повідомлень є прийнятним, задокументованим компромісом для цього каналу й відношення.
Поточний міст звірення SDK вимагає, щоб адаптер оголосив
`reconcileUnknownSend`, а потім просить `durableFinal.reconcileUnknownSend`
класифікувати невідомий запис як `sent`, `not_sent` або `unresolved`; лише `not_sent`
дозволяє повторне відтворення, а невирішені записи залишаються термінальними або повторюють лише
перевірку звірення.

Політика довговічності має бути явною:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` означає, що ядро має завершуватися із забороною, коли не може записати довговічний намір.
`best_effort` може продовжити виконання, коли збереження недоступне. `disabled` зберігає
стару поведінку прямого надсилання. Під час міграції застарілі обгортки й публічні
допоміжні засоби сумісності за замовчуванням використовують `disabled`; вони не мають виводити `required` із
того факту, що канал має універсальний вихідний адаптер.

Контексти надсилання також володіють локальними для каналу ефектами після надсилання. Міграція небезпечна,
якщо довговічна доставка обходить локальну поведінку, яка раніше була прив’язана до
шляху прямого надсилання каналу. Приклади включають кеші пригнічення self-echo,
маркери участі в тредах, нативні якорі редагування, рендеринг model-signature
і специфічні для платформи захисти від дублікатів. Ці ефекти мають або перейти в
адаптер надсилання, адаптер рендерингу, або іменований hook контексту надсилання, перш ніж цей
канал зможе ввімкнути довговічну універсальну фінальну доставку.

Допоміжні засоби надсилання мають повертати квитанції аж до свого викликача. Довговічні
обгортки не можуть ковтати id повідомлень або замінювати результат доставки каналу на
`undefined`; буферизовані диспетчери використовують ці id для якорів тредів, подальших редагувань,
фіналізації попереднього перегляду й пригнічення дублікатів.

Резервні надсилання працюють із пакетами, а не з одиночними payload. Перезаписи silent-reply,
резервний варіант медіа, резервний варіант карток і проєкція чанків можуть створювати більше ніж
одне доставлюване повідомлення, тому контекст надсилання має або доставити весь
спроєктований пакет, або явно задокументувати, чому дійсним є лише один payload.

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

Коли такий резервний варіант є довговічним, увесь спроєктований пакет має бути представлений
одним довговічним наміром надсилання або іншим атомарним планом пакета. Записувати кожен payload
по одному недостатньо: збій між payload може залишити частково видимий
резервний варіант без довговічного запису для решти payload. Відновлення має знати,
які units уже мають квитанції, і або повторно відтворити лише відсутні units, або позначити
пакет як `unknown_after_send`, доки адаптер його не звірить.

## Живий контекст

Поведінка попереднього перегляду, редагування, прогресу й stream має бути одним opt-in життєвим циклом.

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

Живий стан достатньо довговічний, щоб відновитися або пригнітити дублікати:

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

Це має охопити поточну поведінку:

- Telegram надсилання плюс редагований попередній перегляд, зі свіжим фінальним повідомленням після застаріння попереднього перегляду.
- Discord надсилання плюс редагований попередній перегляд, скасування на медіа/помилці/явній відповіді.
- Slack нативний stream або чорновий попередній перегляд залежно від форми треду.
- Mattermost фіналізація чорнового допису.
- Matrix фіналізація чорнової події або редагування у разі невідповідності.
- Teams нативний stream прогресу.
- QQ Bot stream або накопичений резервний варіант.

## Поверхня адаптера

Публічною ціллю SDK має бути один subpath:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Цільова форма:

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

Адаптер надсилання:

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

Адаптер отримання:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Перед preflight-авторизацією ядро має запускати спільний предикат OpenClaw echo
кожного разу, коли `origin.decode` повертає метадані походження OpenClaw. Адаптер отримання
надає факти платформи, як-от автор bot і форма кімнати; ядро володіє рішенням
про відкидання й порядком, щоб канали не реалізовували текстові фільтри повторно.

Адаптер походження:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Ядро встановлює `MessageOrigin`. Канали лише транслюють його до й з нативних
метаданих транспорту. Slack зіставляє це з `chat.postMessage({ metadata })` і
вхідним `message.metadata`; Matrix може зіставляти це з додатковим вмістом події; канали
без нативних метаданих можуть використовувати реєстр квитанцій/вихідних повідомлень, коли це
найкраще доступне наближення.

Можливості:

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

## Скорочення публічного SDK

Нова публічна поверхня має поглинути або зробити застарілими ці концептуальні області:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- більшість публічних використань `outbound-runtime`
- ad hoc допоміжні засоби життєвого циклу draft stream

Subpath сумісності можуть залишатися як обгортки, але нові сторонні plugins
не повинні їх потребувати.

Bundled plugins можуть зберігати внутрішні імпорти допоміжних засобів через зарезервовані runtime
subpath під час міграції. Публічна документація має спрямовувати авторів plugins до
`plugin-sdk/channel-message`, щойно він з’явиться.

## Зв’язок із channel turn

`runtime.channel.turn.*` має залишатися під час міграції.

Він має стати адаптером сумісності:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` також має спочатку залишатися:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Після того як усі bundled plugins і відомі сторонні шляхи сумісності будуть під’єднані через міст,
`channel.turn` можна зробити застарілим. Його не слід видаляти, доки не буде
опублікованого шляху міграції SDK і контрактних тестів, які доводять, що старі plugins усе ще працюють
або завершуються з чіткою помилкою версії.

## Запобіжники сумісності

Під час міграції універсальна довговічна доставка є opt-in для будь-якого каналу, чий
наявний callback доставки має побічні ефекти поза "надіслати цей payload".

Застарілі точки входу за замовчуванням недовговічні:

- `channel.turn.run` і `dispatchAssembledChannelTurn` використовують callback доставки каналу,
  якщо цей канал явно не надає перевірений об’єкт довговічної
  політики/параметрів.
- `channel.turn.runPrepared` залишається у власності каналу, доки підготовлений диспетчер
  явно не викличе контекст надсилання.
- Публічні допоміжні засоби сумісності, як-от `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` і direct-DM helpers, ніколи не впроваджують універсальну
  довговічну доставку перед наданим викликачем callback `deliver` або `reply`.

Для типів моста міграції `durable: undefined` означає "не довговічний". Довговічний
шлях вмикається лише явним значенням політики/параметрів. `durable:
false` може залишатися як написання для сумісності, але реалізація не повинна
вимагати, щоб кожен немігрований канал його додавав.

Поточний код моста має зберігати рішення щодо довговічності явним:

- Стійка фінальна доставка повертає дискримінований статус. `handled_visible` і
  `handled_no_send` є термінальними; `unsupported` і `not_applicable` можуть
  повертатися до доставки, що належить каналу; `failed` поширює збій надсилання.
- Універсальна стійка фінальна доставка обмежується можливостями адаптера, як-от
  тиха доставка, збереження цілі відповіді, збереження нативної цитати та
  хуки надсилання повідомлень. За відсутності паритету слід обирати доставку,
  що належить каналу, а не універсальне надсилання, яке змінює поведінку,
  видиму користувачу.
- Стійкі надсилання на основі черги надають посилання на намір доставки. Наявні
  поля сеансу `pendingFinalDelivery*` можуть переносити ідентифікатор наміру під
  час переходу; кінцевий стан — сховище `MessageSendIntent` замість замороженого
  тексту відповіді плюс ad hoc поля контексту.

Не вмикайте універсальний стійкий шлях для каналу, доки всі ці умови не стануть
істинними:

- Адаптер універсального надсилання виконує ту саму поведінку рендерингу й
  транспорту, що й старий прямий шлях.
- Локальні побічні ефекти після надсилання зберігаються через контекст
  надсилання.
- Адаптер повертає квитанції або результати доставки з усіма ідентифікаторами
  повідомлень платформи.
- Підготовлені шляхи диспетчеризації або викликають новий контекст надсилання,
  або залишаються задокументованими як такі, що перебувають поза стійкою
  гарантією.
- Резервна доставка обробляє кожне спроєктоване корисне навантаження, а не лише
  перше.
- Стійка резервна доставка записує весь масив спроєктованих корисних навантажень
  як один намір або пакетний план, який можна відтворити повторно.

Конкретні ризики міграції, які треба зберегти:

- Доставка монітора iMessage записує надіслані повідомлення в кеш відлуння після
  успішного надсилання. Стійкі фінальні надсилання все одно мають заповнювати
  цей кеш, інакше OpenClaw може повторно приймати власні фінальні відповіді як
  вхідні повідомлення користувача.
- Tlon додає необов’язковий підпис моделі та записує потоки за участю після
  групових відповідей. Універсальна стійка доставка не повинна обходити ці
  ефекти; або перенесіть їх в адаптери рендерингу/надсилання/фіналізації Tlon,
  або залиште Tlon на шляху, що належить каналу.
- Discord та інші підготовлені диспетчери вже володіють прямою доставкою та
  поведінкою попереднього перегляду. На них не поширюється стійка гарантія
  зібраного ходу, доки їхні підготовлені диспетчери явно не маршрутизують
  фінальні повідомлення через контекст надсилання.
- Тиха резервна доставка Telegram має доставляти повний масив спроєктованих
  корисних навантажень. Скорочення до одного корисного навантаження може
  відкинути додаткові резервні корисні навантаження після проєкції.
- LINE, Zalo, Nostr та інші наявні зібрані/допоміжні шляхи можуть мати обробку
  токенів відповіді, проксіювання медіа, кеші надісланих повідомлень, очищення
  стану завантаження/статусу або цілі лише для callback. Вони залишаються на
  доставці, що належить каналу, доки ці семантики не будуть представлені
  адаптером надсилання й перевірені тестами.
- Допоміжні засоби прямих DM можуть мати callback відповіді, який є єдиною
  правильною ціллю транспорту. Універсальний вихідний потік не повинен
  вгадувати з `OriginatingTo` або `To` й пропускати цей callback.
- Вивід збоїв Gateway OpenClaw має залишатися видимим для людей, але позначені
  відлуння кімнати, створені ботом, потрібно відкидати до авторизації
  `allowBots`. Канали не повинні реалізовувати це за допомогою фільтрів префікса
  видимого тексту, окрім короткого аварійного запобіжника; стійкий контракт —
  це структуровані метадані походження.

## Внутрішнє сховище

Стійка черга повинна зберігати наміри надсилання повідомлень, а не корисні
навантаження відповідей.

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

Цикл відновлення:

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

Черга повинна зберігати достатньо ідентичності, щоб після перезапуску відтворити
надсилання через той самий обліковий запис, потік, ціль, політику форматування та
правила медіа.

## Класи збоїв

Адаптери каналів класифікують транспортні збої в закриті категорії:

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

Політика ядра:

- Повторювати `transient` і `rate_limit`.
- Не повторювати `invalid_payload`, якщо немає резервного рендерингу.
- Не повторювати `auth` або `permission`, доки не зміниться конфігурація.
- Для `not_found` дозволити live-фіналізації повернутися з редагування до нового
  надсилання, коли канал оголошує це безпечним.
- Для `conflict` використовуйте правила квитанцій/idempotency, щоб вирішити, чи
  повідомлення вже існує.
- Будь-яка помилка після того, як адаптер міг завершити платформне I/O, але до
  фіксації квитанції, стає `unknown_after_send`, якщо адаптер не може довести,
  що платформна операція не відбулася.

## Мапінг каналів

| Канал           | Цільова міграція                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Отримує політику підтверджень і стійкі фінальні надсилання. Live-адаптер відповідає за надсилання й редагований попередній перегляд, фінальне надсилання застарілого попереднього перегляду, теми, пропуск попереднього перегляду відповіді з цитатою, резервний варіант для медіа та обробку `retry-after`.                                                       |
| Discord         | Адаптер надсилання обгортає наявну доставку стійкого payload. Live-адаптер відповідає за редагування чернетки, чернетку прогресу, скасування попереднього перегляду медіа/помилки, збереження цілі відповіді та квитанції ідентифікаторів повідомлень. Перевірте створені ботом відлуння gateway-збоїв у спільних кімнатах; використовуйте вихідний реєстр або інший нативний еквівалент, якщо Discord не може переносити метадані походження у звичайних повідомленнях. |
| Slack           | Адаптер надсилання обробляє звичайні дописи в чаті. Live-адаптер обирає нативний потік, коли форма треду це підтримує, інакше використовує попередній перегляд чернетки. Квитанції зберігають часові мітки тредів. Адаптер походження зіставляє gateway-збої OpenClaw із Slack `chat.postMessage.metadata` і відкидає позначені відлуння бот-кімнат до авторизації `allowBots`. |
| WhatsApp        | Адаптер надсилання відповідає за надсилання тексту/медіа зі стійкими фінальними намірами. Адаптер отримання обробляє згадки в групах та ідентичність відправника. Live може лишатися відсутнім, доки WhatsApp не матиме редагованого транспорту.                                                                                                                     |
| Matrix          | Live-адаптер відповідає за редагування подій-чернеток, фіналізацію, редагування-вилучення, обмеження зашифрованих медіа та резервний варіант у разі невідповідності цілі відповіді. Адаптер отримання відповідає за гідратацію та дедуплікацію зашифрованих подій. Адаптер походження має кодувати походження gateway-збою OpenClaw у вміст події Matrix і відкидати відлуння кімнат налаштованого бота до обробки `allowBots`. |
| Mattermost      | Live-адаптер відповідає за один допис-чернетку, згортання прогресу/інструментів, фіналізацію на місці та резервне свіже надсилання.                                                                                                                                                                                                                                |
| Microsoft Teams | Live-адаптер відповідає за нативний прогрес і поведінку потокових блоків. Адаптер надсилання відповідає за активності та квитанції вкладень/карток.                                                                                                                                                                                                                  |
| Feishu          | Адаптер рендерингу відповідає за рендеринг тексту/карток/сирого вмісту. Live-адаптер відповідає за потокові картки та пригнічення дубльованого фінального повідомлення. Адаптер надсилання відповідає за коментарі, сесії тем, медіа та пригнічення голосу.                                                                                                          |
| QQ Bot          | Live-адаптер відповідає за потокове передавання C2C, тайм-аут акумулятора та резервне фінальне надсилання. Адаптер рендерингу відповідає за медіатеги та текст як голос.                                                                                                                                                                                            |
| Signal          | Просте отримання плюс адаптер надсилання. Без Live-адаптера, якщо signal-cli не додасть надійну підтримку редагування.                                                                                                                                                                                                                                             |
| iMessage        | Просте отримання плюс адаптер надсилання. Надсилання iMessage має зберігати заповнення echo-cache монітора, перш ніж стійкі фінальні повідомлення зможуть обходити доставку через монітор.                                                                                                                                                                         |
| Google Chat     | Просте отримання плюс адаптер надсилання з відношенням треду, зіставленим із просторами та ідентифікаторами тредів. Перевірте поведінку кімнат із `allowBots=true` для позначених відлунь gateway-збоїв OpenClaw.                                                                                                                                                    |
| LINE            | Просте отримання плюс адаптер надсилання з обмеженнями reply-token, змодельованими як можливість цілі/відношення.                                                                                                                                                                                                                                                   |
| Nextcloud Talk  | Міст отримання SDK плюс адаптер надсилання.                                                                                                                                                                                                                                                                                                                        |
| IRC             | Просте отримання плюс адаптер надсилання, без стійких квитанцій редагування.                                                                                                                                                                                                                                                                                       |
| Nostr           | Адаптер отримання плюс надсилання для зашифрованих DM; квитанції є ідентифікаторами подій.                                                                                                                                                                                                                                                                         |
| QA Channel      | Адаптер контрактних тестів для поведінки отримання, надсилання, Live, повтору та відновлення.                                                                                                                                                                                                                                                                       |
| Synology Chat   | Просте отримання плюс адаптер надсилання.                                                                                                                                                                                                                                                                                                                          |
| Tlon            | Адаптер надсилання має зберігати рендеринг підпису моделі та відстеження тредів за участю, перш ніж буде ввімкнено загальну стійку фінальну доставку.                                                                                                                                                                                                               |
| Twitch          | Просте отримання плюс адаптер надсилання з класифікацією обмежень швидкості.                                                                                                                                                                                                                                                                                       |
| Zalo            | Просте отримання плюс адаптер надсилання.                                                                                                                                                                                                                                                                                                                          |
| Zalo Personal   | Просте отримання плюс адаптер надсилання.                                                                                                                                                                                                                                                                                                                          |

## План міграції

### Фаза 1: Внутрішній домен повідомлень

- Додайте типи `src/channels/message/*` для повідомлень, цілей, відношень,
  походжень, квитанцій, можливостей, стійких намірів, контексту отримання, контексту надсилання,
  live-контексту та класів збоїв.
- Додайте `origin?: MessageOrigin` до типу payload міграційного мосту, який використовується
  поточною доставкою відповідей, а потім перенесіть це поле до `ChannelMessage` і типів
  відрендерених повідомлень, коли рефакторинг замінить payload відповідей.
- Тримайте це внутрішнім, доки адаптери й тести не доведуть форму.
- Додайте чисті модульні тести для переходів стану та серіалізації.

### Фаза 2: Ядро стійкого надсилання

- Перенесіть наявну вихідну чергу зі стійкості reply-payload до стійких
  намірів надсилання повідомлень.
- Дозвольте стійкому наміру надсилання переносити масив спроєктованих payload або план пакета, а не
  лише один reply payload.
- Збережіть поточну поведінку відновлення черги через конверсію сумісності.
- Зробіть так, щоб `deliverOutboundPayloads` викликав `messages.send`.
- Зробіть стійкість фінального надсилання типовою і відмовляйте закрито, коли стійкий намір
  не можна записати в новому життєвому циклі повідомлення, після того як адаптер оголосить
  безпечність повторного відтворення. Наявні шляхи сумісності channel-turn і SDK залишаються
  direct-send за замовчуванням протягом цієї фази.
- Послідовно записуйте квитанції.
- Повертайте квитанції та результати доставки початковому викликачеві диспетчера замість
  трактування стійкого надсилання як термінального побічного ефекту.
- Зберігайте походження повідомлення через стійкі наміри надсилання, щоб відновлення, повторне відтворення та
  фрагментовані надсилання зберігали операційне походження OpenClaw.

### Фаза 3: Міст обороту каналу

- Повторно реалізуйте `channel.turn.run` і `dispatchAssembledChannelTurn` поверх
  `messages.receive` і `messages.send`.
- Збережіть поточні типи фактів стабільними.
- Збережіть за замовчуванням застарілу поведінку. Канал assembled-turn стає стійким
  лише тоді, коли його адаптер явно погоджується з replay-safe політикою стійкості.
- Збережіть `durable: false` як запасний шлях сумісності для шляхів, які фіналізують
  нативні редагування і ще не можуть безпечно відтворюватися повторно, але не покладайтеся на маркери `false`,
  щоб захищати немігрові канали.
- Умикайте типову стійкість assembled-turn лише в новому життєвому циклі повідомлень, після
  того як зіставлення каналу доведе, що загальний шлях надсилання зберігає стару
  семантику доставки каналу.

### Фаза 4: Міст підготовленого диспетчера

- Замініть `deliverDurableInboundReplyPayload` мостом через контекст надсилання.
- Залиште старий допоміжний засіб як обгортку.
- Спершу перенесіть Telegram, WhatsApp, Slack, Signal, iMessage і Discord, тому що
  вони вже мають роботу зі стійким фіналом або простіші шляхи надсилання.
- Вважайте кожен підготовлений диспетчер непокритим, доки він явно не підключиться до
  контексту надсилання. Документація та записи журналу змін мають казати "зібрані
  оберти каналу" або називати перенесені шляхи каналів, а не заявляти про всі
  автоматичні фінальні відповіді.
- Збережіть поведінку `recordInboundSessionAndDispatchReply`, допоміжних засобів direct-DM та подібних
  публічних допоміжних засобів сумісності. Пізніше вони можуть надати явне
  підключення до контексту надсилання, але не повинні автоматично намагатися виконувати загальну стійку
  доставку перед callback доставки, яким володіє викликач.

### Фаза 5: Уніфікований Життєвий Цикл Live

- Побудуйте `messages.live` з двома адаптерами доказу:
  - Telegram для надсилання плюс редагування плюс надсилання застарілого фіналу.
  - Matrix для фіналізації чернетки плюс резервне редагування.
- Потім перенесіть Discord, Slack, Mattermost, Teams, QQ Bot і Feishu.
- Видаляйте дубльований код фіналізації попереднього перегляду лише після того, як кожен канал матиме
  тести паритету.

### Фаза 6: Публічний SDK

- Додайте `openclaw/plugin-sdk/channel-message`.
- Задокументуйте його як бажаний API Plugin каналу.
- Оновіть експорти пакета, інвентар entrypoint, згенеровані базові лінії API та
  документацію SDK Plugin.
- Включіть `MessageOrigin`, хуки кодування/декодування origin і спільний
  предикат `shouldDropOpenClawEcho` до поверхні SDK channel-message.
- Збережіть обгортки сумісності для старих підшляхів.
- Позначте допоміжні засоби SDK з назвами reply як застарілі в документації після перенесення
  вбудованих plugins.

### Фаза 7: Усі Відправники

Перенесіть усіх вихідних продуцентів, що не є відповідями, на `messages.send`:

- сповіщення cron і Heartbeat
- завершення завдань
- результати hook
- запити на схвалення та результати схвалення
- надсилання через інструмент повідомлень
- оголошення про завершення subagent
- явні надсилання CLI або Control UI
- шляхи автоматизації/трансляції

Тут модель перестає бути "відповідями агента" і стає "OpenClaw надсилає
повідомлення".

### Фаза 8: Виведення Turn з ужитку

- Залиште `channel.turn` як обгортку принаймні на одне вікно сумісності.
- Опублікуйте нотатки міграції.
- Запустіть тести сумісності SDK Plugin зі старими імпортами.
- Видаляйте або приховуйте старі внутрішні допоміжні засоби лише після того, як жоден вбудований plugin їх більше не потребуватиме,
  а сторонні контракти матимуть стабільну заміну.

## План тестування

Модульні тести:

- Серіалізація та відновлення стійкого наміру надсилання.
- Повторне використання ключа ідемпотентності та придушення дублікатів.
- Commit квитанції та пропуск replay.
- Відновлення `unknown_after_send`, яке узгоджує перед replay, коли адаптер
  підтримує узгодження.
- Політика класифікації відмов.
- Послідовність політики ack приймання.
- Мапінг зв'язків для надсилань reply, followup, system і broadcast.
- Фабрика origin для відмов Gateway та предикат `shouldDropOpenClawEcho`.
- Збереження origin через нормалізацію payload, chunking, серіалізацію стійкої черги
  та відновлення.

Інтеграційні тести:

- Простий адаптер `channel.turn.run` усе ще записує та надсилає.
- Доставка застарілого зібраного оберту не стає стійкою, якщо канал
  явно не підключився.
- Міст `channel.turn.runPrepared` усе ще записує та фіналізує.
- Публічні допоміжні засоби сумісності типово викликають callback доставки, яким володіє викликач,
  і не виконують загальне надсилання перед цими callback.
- Стійка резервна доставка відтворює весь спроєктований масив payload після
  перезапуску і не може залишити пізніші payload незаписаними після раннього збою.
- Стійка доставка зібраного оберту повертає ідентифікатори повідомлень платформи до буферизованого
  диспетчера.
- Користувацькі hook доставки все ще повертають ідентифікатори повідомлень платформи, коли стійку доставку
  вимкнено або вона недоступна.
- Фінальна відповідь переживає перезапуск між завершенням асистента та надсиланням на платформу.
- Чернетка попереднього перегляду фіналізується на місці, коли це дозволено.
- Чернетка попереднього перегляду скасовується або редагується, коли медіа/помилка/невідповідність цілі відповіді
  потребує звичайної доставки.
- Потокове передавання блоків і потокове передавання попереднього перегляду не доставляють той самий текст обидва.
- Медіа, передане потоково раніше, не дублюється у фінальній доставці.

Тести каналів:

- Відповідь у темі Telegram з ack polling, затриманим до безпечної
  завершеної watermark контексту приймання.
- Відновлення polling Telegram для прийнятих, але не доставлених оновлень, покрите
  збереженою моделлю safe-completed offset.
- Застарілий попередній перегляд Telegram надсилає свіжий фінал і прибирає попередній перегляд.
- Тихий резерв Telegram надсилає кожен спроєктований резервний payload.
- Стійкість тихого резерву Telegram атомарно записує повний спроєктований резервний масив,
  а не один стійкий намір з одиночним payload на кожну ітерацію циклу.
- Скасування попереднього перегляду Discord у разі медіа/помилки/явної відповіді.
- Фінали підготовленого диспетчера Discord маршрутизуються через контекст надсилання до того, як документація
  або журнал змін заявлять про стійкість фінальних відповідей Discord.
- Стійкі фінальні надсилання iMessage заповнюють кеш echo надісланих повідомлень монітора.
- Застарілі шляхи доставки LINE, Zalo і Nostr не обходяться
  загальним стійким надсиланням, доки не існують тести паритету їхнього адаптера.
- Доставка callback Direct-DM/Nostr лишається авторитетною, якщо її явно
  не перенесено на повну ціль повідомлення та replay-безпечний адаптер надсилання.
- Позначені Slack повідомлення про відмову Gateway OpenClaw лишаються видимими назовні, позначені
  echo bot-room відкидаються перед `allowBots`, а непозначені повідомлення bot з
  тим самим видимим текстом усе ще проходять звичайну авторизацію bot.
- Резервний варіант нативного потоку Slack до чернетки попереднього перегляду в DMs верхнього рівня.
- Фіналізація попереднього перегляду Matrix і резервне редагування.
- Позначені Matrix echo кімнати про gateway-failure OpenClaw від налаштованих облікових записів bot
  відкидаються перед обробкою `allowBots`.
- Аудити cascade gateway-failure у спільних кімнатах Discord і Google Chat покривають
  режими `allowBots` перед заявами про загальний захист там.
- Фіналізація чернетки Mattermost і резервне надсилання свіжого повідомлення.
- Фіналізація нативного прогресу Teams.
- Придушення дубльованого фіналу Feishu.
- Резерв accumulator timeout QQ Bot.
- Стійкі фінальні надсилання Tlon зберігають рендеринг model-signature і відстеження
  потоків, у яких була участь.
- Прості стійкі фінальні надсилання WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo і Zalo Personal.

Валідація:

- Цільові файли Vitest під час розробки.
- `pnpm check:changed` у Testbox для всієї зміненої поверхні.
- Ширший `pnpm check` у Testbox перед landing повного рефакторингу або після
  змін публічного SDK/export.
- Live або qa-channel smoke принаймні для одного каналу з можливістю редагування та одного
  простого каналу лише з надсиланням перед видаленням обгорток сумісності.

## Відкриті питання

- Чи має Telegram зрештою замінити джерело runner grammY на
  повністю стійке джерело polling, яке може контролювати повторну доставку на рівні платформи, а не
  лише збережену watermark перезапуску OpenClaw.
- Чи слід зберігати стан стійкого live preview у тому самому записі черги,
  що й фінальний намір надсилання, або в сусідньому сховищі live-state.
- Як довго обгортки сумісності лишаються задокументованими після випуску
  `plugin-sdk/channel-message`.
- Чи повинні сторонні plugins реалізовувати адаптери приймання напряму, чи лише
  надавати hooks normalize/send/live через `defineChannelMessageAdapter`.
- Які поля квитанцій безпечно відкривати в публічному SDK, а які належать до внутрішнього runtime
  state.
- Чи слід моделювати побічні ефекти, як-от кеші self-echo і маркери participated-thread,
  як hook контексту надсилання, кроки finalize, якими володіє адаптер, або
  підписників на квитанції.
- Які канали мають нативні metadata origin, які потребують збережених вихідних
  реєстрів, а які не можуть забезпечити надійне придушення echo між bot.

## Критерії прийняття

- Кожен вбудований канал повідомлень надсилає фінальний видимий вивід через
  `messages.send`.
- Кожен вхідний канал повідомлень входить через `messages.receive` або
  задокументовану обгортку сумісності.
- Кожен канал попереднього перегляду/редагування/потоку використовує `messages.live` для стану чернетки та
  фіналізації.
- `channel.turn` є лише обгорткою.
- Допоміжні засоби SDK з назвами reply є експортами сумісності, а не рекомендованим шляхом.
- Стійке відновлення може відтворювати очікувані фінальні надсилання після перезапуску без втрати
  фінальної відповіді або дублювання вже commit надсилань; надсилання, чий
  результат на платформі невідомий, узгоджуються перед replay або документуються як
  at-least-once для цього адаптера.
- Стійкі фінальні надсилання fail closed, коли стійкий намір неможливо записати,
  якщо тільки викликач явно не вибрав задокументований нестійкий режим.
- Застарілі channel-turn і допоміжні засоби сумісності SDK типово використовують пряму
  доставку, якою володіє канал; загальне стійке надсилання є лише явним opt-in.
- Квитанції зберігають усі ідентифікатори повідомлень платформи для багаточастинних доставок і
  первинний ідентифікатор для зручності threading/edit.
- Стійкі обгортки зберігають локальні для каналу побічні ефекти перед заміною прямих
  callback доставки.
- Підготовлені диспетчери не вважаються стійкими, доки їхній фінальний шлях доставки
  явно не використовує контекст надсилання.
- Резервна доставка обробляє кожен спроєктований payload.
- Стійка резервна доставка записує кожен спроєктований payload в один replay-able
  намір або пакетний план.
- Вивід про відмову Gateway, створений OpenClaw, видимий для людей, але позначені
  echo кімнати, автором яких є bot, відкидаються перед авторизацією bot на каналах, що
  оголошують підтримку контракту origin.
- Документація пояснює надсилання, приймання, live, state, квитанції, зв'язки, політику відмов,
  міграцію та тестове покриття.

## Пов'язане

- [Повідомлення](/uk/concepts/messages)
- [Streaming і chunking](/uk/concepts/streaming)
- [Чернетки прогресу](/uk/concepts/progress-drafts)
- [Політика повторних спроб](/uk/concepts/retry)
- [Ядро оберту каналу](/uk/plugins/sdk-channel-turn)
