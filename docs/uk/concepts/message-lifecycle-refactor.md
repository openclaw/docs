---
read_when:
    - Рефакторинг поведінки каналу під час надсилання або отримання
    - Зміна ходу каналу, диспетчеризації відповідей, вихідної черги, потокового передавання попереднього перегляду або API повідомлень Plugin SDK
    - Проєктування нового Plugin каналу, якому потрібні надійне надсилання, підтвердження отримання, попередні перегляди, редагування або повторні спроби
summary: План проєктування уніфікованого надійного життєвого циклу отримання, надсилання, попереднього перегляду, редагування та потокової передачі повідомлень
title: Рефакторинг життєвого циклу повідомлення
x-i18n:
    generated_at: "2026-05-06T04:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ця сторінка є цільовим дизайном для заміни розрізнених допоміжних засобів обороту каналу, диспетчеризації відповідей, потокового попереднього перегляду та вихідної доставки одним надійним життєвим циклом повідомлення.

Коротко:

- Основними примітивами мають бути **receive** і **send**, а не **reply**.
- Відповідь є лише зв’язком у вихідному повідомленні.
- Оборот є зручністю для обробки вхідних повідомлень, а не власником доставки.
- Надсилання має базуватися на контексті: `begin`, render, preview або stream, final send, commit, fail.
- Отримання також має базуватися на контексті: normalize, dedupe, route, record, dispatch, platform ack, fail.
- Публічна SDK Plugin має звестися до однієї невеликої поверхні повідомлень каналу.

## Проблеми

Поточний стек каналів виріс із кількох обґрунтованих локальних потреб:

- Прості вхідні адаптери використовують `runtime.channel.turn.run`.
- Розширені адаптери використовують `runtime.channel.turn.runPrepared`.
- Застарілі допоміжні засоби використовують `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, допоміжні засоби payload відповідей, розбиття відповідей на частини, посилання на відповіді та допоміжні засоби вихідного runtime.
- Потоковий попередній перегляд живе в диспетчерах, специфічних для каналів.
- Надійність фінальної доставки додається навколо наявних шляхів payload відповідей.

Така форма виправляє локальні помилки, але залишає OpenClaw із надто великою кількістю публічних понять і надто багатьма місцями, де семантика доставки може розходитися.

Проблема надійності, яка це виявила:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Цільовий інваріант ширший за Telegram: щойно ядро вирішує, що видиме вихідне повідомлення має існувати, намір має бути збережений надійно до спроби надсилання на платформу, а квитанцію платформи потрібно зафіксувати після успіху. Це дає OpenClaw відновлення щонайменше один раз. Поведінка рівно один раз існує лише для адаптерів, які можуть довести нативну ідемпотентність або узгодити спробу з невідомим результатом після надсилання зі станом платформи перед повторним відтворенням.

Це кінцевий стан цього рефакторингу, а не опис кожного поточного шляху. Під час міграції наявні вихідні допоміжні засоби все ще можуть відступати до прямого надсилання, коли best-effort записи в чергу не вдаються. Рефакторинг завершено лише тоді, коли надійні фінальні надсилання відмовляють закрито або явно відмовляються від цього з документованою політикою ненадійної доставки.

## Цілі

- Один базовий життєвий цикл для всіх шляхів отримання й надсилання повідомлень каналу.
- Надійні фінальні надсилання за замовчуванням у новому життєвому циклі повідомлення після того, як адаптер оголосить replay-safe поведінку.
- Спільні семантики попереднього перегляду, редагування, потоку, фіналізації, повторних спроб, відновлення та квитанцій.
- Невелика поверхня SDK Plugin, яку сторонні Plugin можуть вивчати й підтримувати.
- Сумісність для наявних викликачів `channel.turn` під час міграції.
- Чіткі точки розширення для нових можливостей каналів.
- Жодних платформо-специфічних гілок у ядрі.
- Жодних channel messages із token-delta. Потокова передача каналу залишається попереднім переглядом повідомлення, редагуванням, додаванням або доставкою завершеного блока.
- Структуровані метадані походження OpenClaw для операційного/системного виводу, щоб видимі збої Gateway не входили повторно до спільних кімнат із дозволеними ботами як нові prompts.

## Нецілі

- Не видаляти `runtime.channel.turn.*` на першому етапі.
- Не примушувати кожен канал до однакової нативної транспортної поведінки.
- Не навчати ядро тем Telegram, нативних потоків Slack, редагувань Matrix, карток Feishu, голосу QQ або активностей Teams.
- Не публікувати всі внутрішні допоміжні засоби міграції як стабільний API SDK.
- Не робити так, щоб повторні спроби відтворювали завершені неідемпотентні операції платформи.

## Еталонна модель

Vercel Chat має хорошу публічну ментальну модель:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- методи адаптера, як-от `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` і отримання історії
- адаптер стану для dedupe, блокувань, черг і persistence

OpenClaw має запозичити словник, а не копіювати поверхню.

Що потрібно OpenClaw понад цю модель:

- Надійні наміри вихідного надсилання перед прямими транспортними викликами.
- Явні контексти надсилання з begin, commit і fail.
- Контексти отримання, які знають політику ack платформи.
- Квитанції, що переживають перезапуск і можуть керувати редагуваннями, видаленнями, відновленням і придушенням дублікатів.
- Менша публічна SDK. Вбудовані Plugin можуть використовувати внутрішні допоміжні засоби runtime, але сторонні Plugin мають бачити один узгоджений API повідомлень.
- Поведінка, специфічна для агентів: sessions, transcripts, потокова передача блоків, прогрес інструментів, approvals, медійні директиви, silent replies та історія згадок у групах.

Promises у стилі `thread.post()` недостатні для OpenClaw. Вони приховують межу транзакції, яка вирішує, чи можна відновити надсилання.

## Базова модель

Новий домен має жити під внутрішнім простором імен ядра, наприклад `src/channels/message/*`.

Він має чотири поняття:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` відповідає за життєвий цикл вхідних повідомлень.

`send` відповідає за життєвий цикл вихідних повідомлень.

`live` відповідає за стан попереднього перегляду, редагування, прогресу та потоку.

`state` відповідає за надійне зберігання намірів, квитанції, ідемпотентність, відновлення, блокування та dedupe.

## Терміни повідомлень

### Повідомлення

Нормалізоване повідомлення є платформо-нейтральним:

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

### Зв’язок

Відповідь є зв’язком, а не коренем API:

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

Це дає тому самому шляху надсилання змогу обробляти звичайні відповіді, сповіщення Cron, prompts для approval, завершення завдань, надсилання через message-tool, надсилання з CLI або Control UI, результати subagent та автоматизовані надсилання.

### Походження

Походження описує, хто створив повідомлення і як OpenClaw має обробляти відлуння цього повідомлення. Воно відокремлене від зв’язку: повідомлення може бути відповіддю користувачу й водночас бути операційним виводом, походженим від OpenClaw.

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

Ядро володіє значенням виводу, походженого від OpenClaw. Канали володіють тим, як це походження кодується в їхньому транспорті.

Перший обов’язковий випадок використання — вивід збою Gateway. Люди все ще мають бачити повідомлення на кшталт "Agent failed before reply" або "Missing API key", але позначений операційний вивід OpenClaw не має прийматися як вхід, автором якого є бот, у спільних кімнатах, коли `allowBots` увімкнено.

### Квитанція

Квитанції є повноцінними об’єктами:

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

Квитанції є мостом від надійного наміру до майбутнього редагування, видалення, фіналізації попереднього перегляду, придушення дублікатів і відновлення.

Квитанція може описувати одне повідомлення платформи або доставку з кількох частин. Розбитий на частини текст, медіа плюс текст, голос плюс текст і fallback для карток мають зберігати всі ids платформи, водночас надаючи primary id для threading і подальших редагувань.

## Контекст отримання

Отримання не має бути простим викликом допоміжного засобу. Ядру потрібен контекст, який знає dedupe, маршрутизацію, запис session і політику ack платформи.

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

Ack не є однією річчю. Контракт отримання має тримати ці сигнали окремо:

- **Transport ack:** повідомляє webhook або socket платформи, що OpenClaw прийняв envelope події. Деякі платформи вимагають цього перед dispatch.
- **Polling offset ack:** просуває cursor, щоб та сама подія не була отримана знову. Це не має просуватися повз роботу, яку не можна відновити.
- **Inbound record ack:** підтверджує, що OpenClaw зберіг достатньо вхідних метаданих для dedupe і маршрутизації redelivery.
- **User-visible receipt:** необов’язкова поведінка read/status/typing; ніколи не є межею надійності.

`ReceiveAckPolicy` керує лише transport або polling acknowledgement. Його не можна повторно використовувати для read receipts або status reactions.

Перед авторизацією бота receive має застосувати спільну політику відлуння OpenClaw, коли канал може декодувати метадані походження повідомлення:

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

Це відкидання базується на тегах, а не на тексті. Повідомлення в кімнаті, автором якого є бот, з тим самим видимим текстом gateway-failure, але без метаданих походження OpenClaw, усе ще проходить звичайну авторизацію `allowBots`.

Політика ack є явною:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling тепер використовує політику ack контексту отримання для свого збереженого restart watermark. Tracker усе ще спостерігає оновлення grammY, коли вони входять у middleware chain, але OpenClaw зберігає лише безпечний completed update id після успішного dispatch, залишаючи failed або lower pending updates придатними для replay після перезапуску. Upstream `getUpdates` fetch offset у Telegram усе ще контролюється polling library, тому глибший залишковий крок — повністю надійне polling source, якщо нам потрібна redelivery на рівні платформи поза restart watermark OpenClaw. Webhook-платформам може знадобитися негайний HTTP ack, але їм все одно потрібні inbound dedupe і надійні наміри вихідного надсилання, бо webhooks можуть виконувати redeliver.

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
commit, є відновлюваним.

Небезпечна межа — після успіху платформи й до commit квитанції. Якщо процес
завершиться там, OpenClaw не зможе знати, чи існує повідомлення на платформі,
якщо адаптер не надає нативну ідемпотентність або шлях узгодження квитанції.
Такі спроби мають відновлюватися в `unknown_after_send`, а не сліпо
відтворюватися. Канали без узгодження можуть обрати повтор at-least-once лише
якщо дублікати видимих повідомлень є прийнятним, задокументованим компромісом
для цього каналу й зв’язку. Поточний міст узгодження SDK вимагає, щоб адаптер
оголосив `reconcileUnknownSend`, а потім просить `durableFinal.reconcileUnknownSend`
класифікувати невідомий запис як `sent`, `not_sent` або `unresolved`; лише
`not_sent` дозволяє повторне відтворення, а невирішені записи залишаються
термінальними або повторюють тільки перевірку узгодження.

Політика довговічності має бути явною:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` означає, що core має завершуватися закрито, коли не може записати
довговічний намір. `best_effort` може пропускати виконання далі, коли сховище
недоступне. `disabled` зберігає стару поведінку прямого надсилання. Під час
міграції застарілі обгортки й публічні допоміжні засоби сумісності типово
використовують `disabled`; вони не мають виводити `required` з факту, що канал
має загальний вихідний адаптер.

Контексти надсилання також володіють локальними для каналу ефектами після
надсилання. Міграція небезпечна, якщо довговічна доставка обходить локальну
поведінку, яка раніше була прив’язана до прямого шляху надсилання каналу.
Приклади включають кеші придушення self-echo, маркери участі в гілці, нативні
якорі редагування, рендеринг підпису моделі та специфічні для платформи
запобіжники дублювання. Ці ефекти мають або перейти в адаптер надсилання,
адаптер рендерингу, або іменований hook контексту надсилання, перш ніж цей
канал зможе ввімкнути довговічну загальну фінальну доставку.

Допоміжні засоби надсилання мають повертати квитанції аж до свого виклику.
Довговічні обгортки не можуть проковтувати ідентифікатори повідомлень або
замінювати результат доставки каналу на `undefined`; буферизовані диспетчери
використовують ці ідентифікатори для якорів гілок, пізніших редагувань,
фіналізації preview та придушення дублікатів.

Резервні надсилання працюють із пакетами, а не з одиничними payload. Переписування
silent-reply, резервна доставка медіа, резервна доставка карток і проєкція
фрагментів можуть створювати більше ніж одне доставне повідомлення, тому
контекст надсилання має або доставити весь спроєктований пакет, або явно
задокументувати, чому коректним є лише один payload.

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

Коли така резервна доставка є довговічною, увесь спроєктований пакет має бути
представлений одним довговічним наміром надсилання або іншим атомарним планом
пакета. Записувати кожен payload по одному недостатньо: збій між payload може
залишити часткову видиму резервну доставку без довговічного запису для решти
payload. Відновлення має знати, які units уже мають квитанції, і або повторити
лише відсутні units, або позначити пакет як `unknown_after_send`, доки адаптер
його не узгодить.

## Живий контекст

Поведінка preview, редагування, прогресу та stream має бути одним життєвим
циклом із явним увімкненням.

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

Живий стан достатньо довговічний, щоб відновлюватися або придушувати дублікати:

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

Це має покривати поточну поведінку:

- Telegram надсилання плюс preview з редагуванням, зі свіжим фіналом після застарівання preview.
- Discord надсилання плюс preview з редагуванням, скасування на медіа/помилці/явній відповіді.
- Slack нативний stream або чернетковий preview залежно від форми гілки.
- Фіналізація чернеткового допису Mattermost.
- Фіналізація чернеткової події Matrix або редагування з вилученням у разі невідповідності.
- Teams нативний stream прогресу.
- QQ Bot stream або накопичена резервна доставка.

## Поверхня адаптера

Ціль публічного SDK має бути одним subpath:

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

Адаптер приймання:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Перед авторизацією preflight core має виконувати спільний предикат echo OpenClaw
щоразу, коли `origin.decode` повертає метадані походження OpenClaw. Адаптер
приймання надає факти платформи, як-от автор bot і форма кімнати; core володіє
рішенням про відкидання та порядком, щоб канали не реалізовували текстові
фільтри повторно.

Адаптер походження:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core встановлює `MessageOrigin`. Канали лише перекладають його в нативні
транспортні метадані та назад. Slack відображає це на `chat.postMessage({ metadata })`
і вхідне `message.metadata`; Matrix може відобразити це на додатковий вміст
події; канали без нативних метаданих можуть використовувати реєстр
квитанцій/вихідних повідомлень, коли це найкраще доступне наближення.

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

Нова публічна поверхня має поглинути або застарити ці концептуальні області:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- більшість публічних використань `outbound-runtime`
- спеціалізовані допоміжні засоби життєвого циклу чернеткового stream

Subpath сумісності можуть лишатися як обгортки, але нові сторонні plugins не
мають їх потребувати.

Вбудовані plugins можуть зберігати імпорти внутрішніх допоміжних засобів через
зарезервовані runtime subpaths під час міграції. Публічна документація має
спрямовувати авторів Plugin до `plugin-sdk/channel-message`, щойно він з’явиться.

## Зв’язок із циклом каналу

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

Після того як усі вбудовані plugins і відомі сторонні шляхи сумісності будуть
з’єднані мостами, `channel.turn` можна застарити. Його не слід вилучати, доки
не буде опублікованого шляху міграції SDK і contract tests, які доводять, що
старі plugins усе ще працюють або завершуються з чіткою помилкою версії.

## Запобіжники сумісності

Під час міграції загальна довговічна доставка є opt-in для будь-якого каналу,
чий наявний callback доставки має побічні ефекти поза "send this payload".

Застарілі точки входу типово недовговічні:

- `channel.turn.run` і `dispatchAssembledChannelTurn` використовують callback
  доставки каналу, якщо цей канал явно не надає перевірений об’єкт політики/опцій
  довговічності.
- `channel.turn.runPrepared` лишається у володінні каналу, доки підготовлений
  диспетчер явно не викличе контекст надсилання.
- Публічні допоміжні засоби сумісності, як-от `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, і допоміжні засоби direct-DM, ніколи не
  інжектують загальну довговічну доставку перед наданим викликачем callback
  `deliver` або `reply`.

Для типів міграційного мосту `durable: undefined` означає "not durable".
Довговічний шлях вмикається лише явним значенням політики/опцій. `durable:
false` може залишатися як сумісне написання, але реалізація не має вимагати,
щоб кожен немігрований канал додавав його.

Поточний код мосту має зберігати рішення щодо довговічності явним:

- Стійка фінальна доставка повертає дискримінований статус. `handled_visible` і
  `handled_no_send` є термінальними; `unsupported` і `not_applicable` можуть
  повертатися до доставки, керованої каналом; `failed` передає помилку надсилання.
- Загальна стійка фінальна доставка обмежується можливостями адаптера, як-от
  тиха доставка, збереження цілі відповіді, збереження нативної цитати та
  хуки надсилання повідомлень. За відсутності паритету слід вибирати доставку,
  керовану каналом, а не загальне надсилання, що змінює видиму для користувача поведінку.
- Стійкі надсилання на основі черги надають посилання на намір доставки. Наявні
  поля сесії `pendingFinalDelivery*` можуть переносити id наміру під час
  переходу; кінцевий стан — це сховище `MessageSendIntent` замість замороженого
  тексту відповіді плюс спеціальні контекстні поля.

Не вмикайте загальний стійкий шлях для каналу, доки все наведене нижче не буде
істинним:

- Адаптер загального надсилання виконує ту саму поведінку рендерингу й транспорту, що й
  старий прямий шлях.
- Локальні побічні ефекти після надсилання збережено через контекст надсилання.
- Адаптер повертає квитанції або результати доставки з усіма id повідомлень
  платформи.
- Підготовлені шляхи диспетчерів або викликають новий контекст надсилання, або залишаються задокументованими
  як такі, що перебувають поза стійкою гарантією.
- Резервна доставка обробляє кожне спроєктоване корисне навантаження, а не лише перше.
- Стійка резервна доставка записує весь масив спроєктованих корисних навантажень як один
  відтворюваний намір або план пакета.

Конкретні небезпеки міграції, які потрібно зберегти:

- Доставка монітора iMessage записує надіслані повідомлення в кеш відлуння після
  успішного надсилання. Стійкі фінальні надсилання все одно мають заповнювати цей кеш, інакше
  OpenClaw може повторно поглинути власні фінальні відповіді як вхідні повідомлення користувача.
- Tlon додає необов’язковий підпис моделі та записує потоки з участю
  після групових відповідей. Загальна стійка доставка не повинна оминати ці ефекти;
  або перенесіть їх в адаптери рендерингу/надсилання/фіналізації Tlon, або залиште Tlon на
  шляху, керованому каналом.
- Discord та інші підготовлені диспетчери вже володіють прямою доставкою та поведінкою
  попереднього перегляду. Вони не покриваються стійкою гарантією зібраного ходу, доки
  їхні підготовлені диспетчери явно не маршрутизують фінальні відповіді через контекст надсилання.
- Тиха резервна доставка Telegram має доставляти повний масив спроєктованих корисних
  навантажень. Скорочений шлях для одного корисного навантаження може відкинути додаткові резервні корисні навантаження після
  проєкції.
- LINE, BlueBubbles, Zalo, Nostr та інші наявні зібрані/допоміжні шляхи можуть
  мати обробку токенів відповіді, проксіювання медіа, кеші надісланих повідомлень, очищення
  завантаження/статусу або цілі лише для callback. Вони залишаються на доставці, керованій каналом, доки
  ці семантики не будуть представлені адаптером надсилання й перевірені тестами.
- Помічники прямих DM можуть мати callback відповіді, який є єдиною правильною ціллю
  транспорту. Загальний вихідний шлях не повинен здогадуватися з `OriginatingTo` або `To` і пропускати
  цей callback.
- Вивід помилки OpenClaw Gateway має залишатися видимим для людей, але позначені
  створені ботом відлуння кімнати мають відкидатися перед авторизацією `allowBots`.
  Канали не повинні реалізовувати це через фільтри префіксів видимого тексту, окрім як
  короткочасний екстрений запобіжник; стійкий контракт — це структуровані метадані походження.

## Внутрішнє сховище

Стійка черга має зберігати наміри надсилання повідомлень, а не корисні навантаження відповідей.

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

Черга має зберігати достатньо ідентичності, щоб після перезапуску відтворити через той самий обліковий запис,
потік, ціль, політику форматування та правила медіа.

## Класи помилок

Адаптери каналів класифікують транспортні помилки в закриті категорії:

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
- Не повторювати `invalid_payload`, якщо не існує резервного рендерингу.
- Не повторювати `auth` або `permission`, доки не зміниться конфігурація.
- Для `not_found` дозвольте живій фіналізації повернутися від редагування до нового надсилання, коли
  канал оголошує це безпечним.
- Для `conflict` використовуйте правила квитанцій/idempotency, щоб вирішити, чи повідомлення
  вже існує.
- Будь-яка помилка після того, як адаптер міг завершити платформний I/O, але до коміту квитанції
  стає `unknown_after_send`, якщо адаптер не може довести, що платформна
  операція не відбулася.

## Зіставлення каналів

| Канал                    | Ціль міграції                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telegram                 | Отримувати політику ack плюс стійкі фінальні надсилання. Live-адаптер відповідає за надсилання й редагування попереднього перегляду, фінальне надсилання застарілого попереднього перегляду, теми, пропуск попереднього перегляду відповіді з цитатою, резервний варіант для медіа та обробку retry-after.                                                        |
| Discord                  | Send-адаптер обгортає наявну стійку доставку payload. Live-адаптер відповідає за редагування чернетки, чернетку прогресу, скасування попереднього перегляду медіа/помилки, збереження цілі відповіді та квитанції з message id. Перевірте створені ботом відлуння gateway-failure у спільних кімнатах; використовуйте вихідний реєстр або інший нативний еквівалент, якщо Discord не може переносити метадані походження у звичайних повідомленнях. |
| Slack                    | Send-адаптер обробляє звичайні дописи в чат. Live-адаптер вибирає нативний stream, коли форма треду це підтримує, інакше чернетку попереднього перегляду. Квитанції зберігають timestamps треду. Origin-адаптер зіставляє збої OpenClaw gateway зі Slack `chat.postMessage.metadata` і відкидає позначені відлуння bot-room перед авторизацією `allowBots`.        |
| WhatsApp                 | Send-адаптер відповідає за надсилання тексту/медіа зі стійкими фінальними intent. Receive-адаптер обробляє згадку в групі та ідентичність відправника. Live може залишатися відсутнім, доки WhatsApp не матиме транспорту з можливістю редагування.                                                                                                                |
| Matrix                   | Live-адаптер відповідає за редагування подій чернетки, фіналізацію, редагування з вилученням, обмеження зашифрованих медіа та резервний варіант за невідповідності цілі відповіді. Receive-адаптер відповідає за hydration і дедуплікацію зашифрованих подій. Origin-адаптер має кодувати походження OpenClaw gateway-failure у вміст події Matrix і відкидати відлуння configured-bot room перед обробкою `allowBots`. |
| Mattermost               | Live-адаптер відповідає за один допис-чернетку, згортання прогресу/інструментів, фіналізацію на місці та резервне свіже надсилання.                                                                                                                                                                                                                              |
| Microsoft Teams          | Live-адаптер відповідає за нативний прогрес і поведінку block stream. Send-адаптер відповідає за activities і квитанції attachment/card.                                                                                                                                                                                                                          |
| Feishu                   | Render-адаптер відповідає за рендеринг тексту/карток/raw. Live-адаптер відповідає за streaming cards і придушення дубльованого фіналу. Send-адаптер відповідає за коментарі, topic sessions, медіа та придушення голосу.                                                                                                                                         |
| QQ Bot                   | Live-адаптер відповідає за C2C streaming, тайм-аут accumulator і резервне фінальне надсилання. Render-адаптер відповідає за media tags і text-as-voice.                                                                                                                                                                                                            |
| Signal                   | Простий receive плюс send-адаптер. Без live-адаптера, якщо signal-cli не додасть надійну підтримку редагування.                                                                                                                                                                                                                                                   |
| iMessage and BlueBubbles | Простий receive плюс send-адаптер. Надсилання iMessage має зберігати заповнення monitor echo-cache, перш ніж стійкі фінали зможуть обходити monitor delivery. Специфічні для BlueBubbles введення, реакції та вкладення залишаються можливостями адаптера.                                                                                                        |
| Google Chat              | Простий receive плюс send-адаптер із thread relation, зіставленим зі spaces і thread ids. Перевірте поведінку кімнати `allowBots=true` для позначених відлунь OpenClaw gateway-failure.                                                                                                                                                                          |
| LINE                     | Простий receive плюс send-адаптер з обмеженнями reply-token, змодельованими як можливість target/relation.                                                                                                                                                                                                                                                        |
| Nextcloud Talk           | SDK receive bridge плюс send-адаптер.                                                                                                                                                                                                                                                                                                                            |
| IRC                      | Простий receive плюс send-адаптер, без стійких квитанцій редагування.                                                                                                                                                                                                                                                                                             |
| Nostr                    | Receive плюс send-адаптер для зашифрованих DM; квитанції є event ids.                                                                                                                                                                                                                                                                                             |
| QA Channel               | Адаптер contract-test для поведінки receive, send, live, повтору та відновлення.                                                                                                                                                                                                                                                                                   |
| Synology Chat            | Простий receive плюс send-адаптер.                                                                                                                                                                                                                                                                                                                                |
| Tlon                     | Send-адаптер має зберігати рендеринг model-signature і відстеження participated-thread, перш ніж буде ввімкнено загальну стійку фінальну доставку.                                                                                                                                                                                                                |
| Twitch                   | Простий receive плюс send-адаптер із класифікацією rate-limit.                                                                                                                                                                                                                                                                                                    |
| Zalo                     | Простий receive плюс send-адаптер.                                                                                                                                                                                                                                                                                                                                |
| Zalo Personal            | Простий receive плюс send-адаптер.                                                                                                                                                                                                                                                                                                                                |

## План міграції

### Фаза 1: Внутрішній домен повідомлень

- Додайте типи `src/channels/message/*` для повідомлень, цілей, зв’язків,
  походжень, квитанцій, можливостей, стійких intent, контексту receive, контексту send,
  контексту live та класів збоїв.
- Додайте `origin?: MessageOrigin` до типу payload міграційного bridge, який використовується
  поточною доставкою відповідей, а потім перенесіть це поле до `ChannelMessage` і типів
  рендерених повідомлень, коли рефакторинг замінить reply payload.
- Тримайте це внутрішнім, доки адаптери й тести не підтвердять форму.
- Додайте чисті модульні тести для переходів стану та серіалізації.

### Фаза 2: Стійке ядро Send

- Перенесіть наявну вихідну чергу зі стійкості reply-payload до стійких
  intent надсилання повідомлень.
- Дозвольте стійкому send intent переносити масив спроєктованих payload або batch plan, а не
  лише один reply payload.
- Збережіть поточну поведінку відновлення черги через сумісне перетворення.
- Зробіть так, щоб `deliverOutboundPayloads` викликав `messages.send`.
- Зробіть стійкість фінального надсилання типовою і закривайтеся з помилкою, коли стійкий intent
  не можна записати в новому життєвому циклі повідомлення, після того як адаптер оголосить
  безпеку replay. Наявні шляхи сумісності channel-turn і SDK під час цієї фази за замовчуванням залишаються direct-send.
- Послідовно записуйте квитанції.
- Повертайте квитанції та результати доставки початковому викликачеві dispatcher замість того,
  щоб розглядати стійке надсилання як кінцевий побічний ефект.
- Зберігайте походження повідомлення через стійкі send intent, щоб recovery, replay і
  chunked sends зберігали операційне походження OpenClaw.

### Фаза 3: Channel Turn Bridge

- Повторно реалізуйте `channel.turn.run` і `dispatchAssembledChannelTurn` поверх
  `messages.receive` і `messages.send`.
- Зберігайте поточні типи fact стабільними.
- Зберігайте застарілу поведінку за замовчуванням. Канал assembled-turn стає стійким
  лише тоді, коли його адаптер явно вмикає replay-safe політику стійкості.
- Зберігайте `durable: false` як escape hatch сумісності для шляхів, які фіналізують
  нативні редагування і ще не можуть безпечно виконувати replay, але не покладайтеся на маркери `false`,
  щоб захищати немігрувані канали.
- Умикайте стійкість assembled-turn за замовчуванням лише в новому життєвому циклі повідомлень, після
  того як зіставлення каналу доведе, що загальний шлях send зберігає стару семантику
  доставки каналу.

### Фаза 4: Prepared Dispatcher Bridge

- Замініть `deliverDurableInboundReplyPayload` мостом контексту надсилання.
- Збережіть старий допоміжний засіб як обгортку.
- Спочатку перенесіть Telegram, WhatsApp, Slack, Signal, iMessage і Discord, оскільки
  вони вже мають роботу durable-final або простіші шляхи надсилання.
- Вважайте кожен підготовлений диспетчер непокритим, доки він явно не підключиться до
  контексту надсилання. Документація та записи журналу змін мають казати "зібрані
  ходи каналів" або називати перенесені шляхи каналів, а не заявляти про всі
  автоматичні фінальні відповіді.
- Збережіть поведінку `recordInboundSessionAndDispatchReply`, допоміжних засобів direct-DM та подібних
  публічних допоміжних засобів сумісності. Вони можуть пізніше надати явне
  підключення до контексту надсилання, але не повинні автоматично намагатися виконати generic durable
  доставлення перед callback доставлення, яким володіє викликач.

### Фаза 5: Уніфікований Живий Життєвий Цикл

- Створіть `messages.live` із двома proof-адаптерами:
  - Telegram для надсилання, редагування та надсилання застарілого фіналу.
  - Matrix для фіналізації чернетки та резервного редагування з вилученням.
- Потім перенесіть Discord, Slack, Mattermost, Teams, QQ Bot і Feishu.
- Видаляйте дубльований код фіналізації попереднього перегляду лише після того, як кожен канал матиме
  parity-тести.

### Фаза 6: Публічний SDK

- Додайте `openclaw/plugin-sdk/channel-message`.
- Задокументуйте його як бажаний API Plugin каналу.
- Оновіть експорти пакета, інвентар entrypoint, згенеровані базові лінії API та
  документацію SDK Plugin.
- Додайте `MessageOrigin`, хуки кодування/декодування походження та спільний
  предикат `shouldDropOpenClawEcho` до поверхні SDK channel-message.
- Збережіть обгортки сумісності для старих підшляхів.
- Позначте reply-named допоміжні засоби SDK як застарілі в документації після перенесення bundled plugins.

### Фаза 7: Усі Відправники

Перенесіть усіх outbound-виробників, що не є відповідями, на `messages.send`:

- сповіщення cron і heartbeat
- завершення завдань
- результати hook
- запити на схвалення та результати схвалення
- надсилання message tool
- оголошення про завершення subagent
- явні надсилання CLI або Control UI
- шляхи автоматизації/трансляції

Тут модель перестає бути "відповідями агента" і стає "OpenClaw надсилає
повідомлення".

### Фаза 8: Виведення Turn з ужитку

- Збережіть `channel.turn` як обгортку щонайменше на одне вікно сумісності.
- Опублікуйте нотатки міграції.
- Запустіть тести сумісності SDK Plugin зі старими імпортами.
- Видаляйте або приховуйте старі внутрішні допоміжні засоби лише після того, як жоден bundled plugin більше їх не потребує,
  а сторонні контракти матимуть стабільну заміну.

## План Тестування

Модульні тести:

- Серіалізація та відновлення наміру durable send.
- Повторне використання ключа ідемпотентності та пригнічення дублікатів.
- Фіксація receipt і пропуск повторного відтворення.
- Відновлення `unknown_after_send`, яке виконує узгодження перед повторним відтворенням, коли адаптер
  підтримує узгодження.
- Політика класифікації збоїв.
- Послідовність політики receive ack.
- Відображення зв’язків для надсилань reply, followup, system і broadcast.
- Фабрика походження для Gateway-failure і предикат `shouldDropOpenClawEcho`.
- Збереження походження через нормалізацію payload, chunking, серіалізацію durable queue
  і відновлення.

Інтеграційні тести:

- Простий адаптер `channel.turn.run` і далі записує та надсилає.
- Доставлення застарілого assembled-turn не стає durable, доки канал
  явно не підключиться.
- Міст `channel.turn.runPrepared` і далі записує та фіналізує.
- Публічні допоміжні засоби сумісності типово викликають callback доставлення, яким володіє викликач,
  і не виконують generic-send перед цими callback.
- Durable fallback доставлення повторно відтворює весь спроєктований масив payload після
  перезапуску й не може залишити пізніші payload незаписаними після раннього аварійного завершення.
- Durable assembled-turn доставлення повертає ідентифікатори повідомлень платформи до buffered
  dispatcher.
- Користувацькі delivery hooks і далі повертають ідентифікатори повідомлень платформи, коли durable delivery
  вимкнено або недоступне.
- Фінальна відповідь переживає перезапуск між завершенням assistant і надсиланням на платформу.
- Чернетка попереднього перегляду фіналізується на місці, коли це дозволено.
- Чернетка попереднього перегляду скасовується або редагується з вилученням, коли медіа/помилка/невідповідність reply-target
  вимагає звичайного доставлення.
- Block streaming і preview streaming не доставляють один і той самий текст двічі.
- Медіа, передане рано, не дублюється у фінальному доставленні.

Тести каналів:

- Відповідь у темі Telegram із polling ack, відкладеним до safe
  completed watermark контексту отримання.
- Відновлення polling Telegram для accepted-but-not-delivered оновлень покрите
  збереженою моделлю safe-completed offset.
- Застарілий preview Telegram надсилає свіжий фінал і очищає preview.
- Silent fallback Telegram надсилає кожен спроєктований fallback payload.
- Довговічність silent fallback Telegram записує повний спроєктований fallback-масив
  атомарно, а не один single-payload durable intent на кожну ітерацію циклу.
- Скасування preview Discord для медіа/помилки/явної відповіді.
- Фінали prepared dispatcher Discord проходять через контекст надсилання до того, як документація
  або журнал змін заявлятимуть про durable final-reply для Discord.
- Durable final надсилання iMessage заповнюють кеш sent-message echo монітора.
- Застарілі шляхи доставлення LINE, BlueBubbles, Zalo і Nostr не обходяться
  generic durable send, доки не існують parity-тести їхніх адаптерів.
- Callback-доставлення Direct-DM/Nostr залишається авторитетним, якщо явно не перенесене
  на повну ціль повідомлення та replay-safe send adapter.
- Позначені повідомлення Slack про збій OpenClaw Gateway залишаються видимими outbound, позначені
  echoes bot-room відкидаються перед `allowBots`, а непозначені bot messages з
  тим самим видимим текстом і далі проходять звичайну авторизацію bot.
- Резервний Slack native stream до draft preview у top-level DM.
- Фіналізація preview Matrix і резервне редагування з вилученням.
- Позначені Matrix echoes кімнати з gateway-failure OpenClaw від налаштованих bot
  accounts відкидаються перед обробкою `allowBots`.
- Аудити cascade gateway-failure для спільних кімнат Discord і Google Chat покривають
  режими `allowBots` перед заявами про generic protection там.
- Фіналізація чернетки Mattermost і резервне fresh-send.
- Фіналізація native progress Teams.
- Пригнічення дубльованого фіналу Feishu.
- Резервний варіант QQ Bot accumulator timeout.
- Durable final надсилання Tlon зберігають rendering model-signature і відстеження participated
  thread.
- Прості durable final
  надсилання WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo і Zalo Personal.

Валідація:

- Цільові файли Vitest під час розробки.
- `pnpm check:changed` у Testbox для всієї зміненої поверхні.
- Ширший `pnpm check` у Testbox перед landing повного refactor або після
  змін public SDK/export.
- Live або qa-channel smoke щонайменше для одного edit-capable каналу та одного
  простого send-only каналу перед видаленням обгорток сумісності.

## Відкриті Питання

- Чи має Telegram зрештою замінити джерело grammY runner повністю
  durable polling source, яке може контролювати redelivery на рівні платформи, а не
  лише збережений restart watermark OpenClaw.
- Чи має durable live preview state зберігатися в тому самому записі queue,
  що й final send intent, або в спорідненому live-state store.
- Як довго обгортки сумісності залишаються задокументованими після
  випуску `plugin-sdk/channel-message`.
- Чи мають сторонні plugins реалізовувати receive adapters напряму, чи лише
  надавати normalize/send/live hooks через `defineChannelMessageAdapter`.
- Які поля receipt безпечно виставляти в public SDK проти internal runtime
  state.
- Чи мають side effects, як-от self-echo caches і participated-thread markers,
  моделюватися як send-context hooks, finalize steps, якими володіє адаптер, або
  receipt subscribers.
- Які канали мають native origin metadata, яким потрібні збережені outbound
  registries, а які не можуть забезпечити надійне cross-bot echo suppression.

## Критерії Приймання

- Кожен bundled message channel надсилає фінальний видимий вихід через
  `messages.send`.
- Кожен inbound message channel входить через `messages.receive` або
  задокументовану обгортку сумісності.
- Кожен preview/edit/stream channel використовує `messages.live` для стану чернетки та
  фіналізації.
- `channel.turn` є лише обгорткою.
- Reply-named допоміжні засоби SDK є compatibility exports, а не рекомендованим шляхом.
- Durable recovery може повторно відтворювати pending final sends після перезапуску без втрати
  фінальної відповіді або дублювання вже committed sends; надсилання, чий
  platform outcome невідомий, узгоджуються перед повторним відтворенням або документуються як
  at-least-once для цього адаптера.
- Durable final sends завершуються fail closed, коли durable intent не може бути записаний,
  якщо викликач явно не вибрав задокументований non-durable mode.
- Застарілі channel-turn і допоміжні засоби сумісності SDK типово використовують пряме
  channel-owned delivery; generic durable send є лише явним opt-in.
- Receipts зберігають усі ідентифікатори повідомлень платформи для multi-part deliveries і
  primary id для зручності threading/edit.
- Durable wrappers зберігають channel-local side effects перед заміною прямих
  delivery callbacks.
- Prepared dispatchers не зараховуються як durable, доки їхній final delivery
  path явно не використовує send context.
- Fallback delivery обробляє кожен спроєктований payload.
- Durable fallback delivery записує кожен спроєктований payload в один replayable
  intent або batch plan.
- Створений OpenClaw вихід gateway failure видимий людям, але позначені
  bot-authored room echoes відкидаються перед bot authorization на каналах, що
  оголошують підтримку origin contract.
- Документація пояснює send, receive, live, state, receipts, relations, failure
  policy, migration і test coverage.

## Пов’язане

- [Повідомлення](/uk/concepts/messages)
- [Streaming і chunking](/uk/concepts/streaming)
- [Чернетки прогресу](/uk/concepts/progress-drafts)
- [Політика повторних спроб](/uk/concepts/retry)
- [Ядро ходу каналу](/uk/plugins/sdk-channel-turn)
