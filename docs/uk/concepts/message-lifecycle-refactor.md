---
read_when:
    - Рефакторинг поведінки надсилання або отримання в каналі
    - Зміна ходу каналу, диспетчеризації відповідей, вихідної черги, потокового попереднього перегляду або API повідомлень SDK Plugin
    - Проєктування нового Plugin каналу, якому потрібні надійні надсилання, підтвердження отримання, попередні перегляди, редагування або повторні спроби
summary: План проєктування уніфікованого стійкого життєвого циклу отримання, надсилання, попереднього перегляду, редагування та потокового передавання повідомлень
title: Рефакторинг життєвого циклу повідомлень
x-i18n:
    generated_at: "2026-05-06T01:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2253d5b197bf6df15486d21492fab608b89a5f88bf213a03215d9f6638462017
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ця сторінка є цільовим дизайном для заміни розрізнених допоміжних засобів обробки turn у каналах, відправлення відповідей, потокового попереднього перегляду та вихідної доставки одним надійним життєвим циклом повідомлення.

Коротко:

- Основними примітивами мають бути **receive** і **send**, а не **reply**.
- Відповідь є лише відношенням у вихідному повідомленні.
- Turn є зручністю для обробки вхідного повідомлення, а не власником доставки.
- Надсилання має бути контекстним: `begin`, render, preview або stream, final send,
  commit, fail.
- Отримання також має бути контекстним: normalize, dedupe, route, record,
  dispatch, platform ack, fail.
- Публічний SDK Plugin має звестися до однієї невеликої поверхні повідомлень каналу.

## Проблеми

Поточний стек каналів виріс із кількох слушних локальних потреб:

- Прості вхідні адаптери використовують `runtime.channel.turn.run`.
- Розширені адаптери використовують `runtime.channel.turn.runPrepared`.
- Застарілі допоміжні засоби використовують `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, допоміжні засоби payload для відповідей, розбиття відповідей на частини,
  посилання на відповіді та допоміжні засоби вихідного runtime.
- Потоковий попередній перегляд живе у специфічних для каналів dispatcher-ах.
- Надійність фінальної доставки додається навколо наявних шляхів payload для відповідей.

Така форма виправляє локальні помилки, але залишає OpenClaw із надто великою кількістю публічних понять і надто багатьма місцями, де семантика доставки може розходитися.

Проблема надійності, яка це виявила:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Цільовий інваріант ширший за Telegram: щойно ядро вирішує, що має існувати видиме вихідне повідомлення, намір має бути збережений надійно до спроби platform send, а platform receipt має бути зафіксований після успіху.
Це дає OpenClaw відновлення принаймні один раз. Поведінка рівно один раз існує лише для адаптерів, які можуть довести нативну ідемпотентність або звірити спробу з невідомим результатом після надсилання зі станом платформи перед повторним відтворенням.

Це кінцевий стан цього рефакторингу, а не опис кожного поточного шляху. Під час міграції наявні вихідні допоміжні засоби все ще можуть переходити до прямого надсилання, коли best-effort записи в чергу не вдаються. Рефакторинг завершений лише тоді, коли надійні фінальні надсилання fail closed або явно відмовляються від цього з документованою ненадійною політикою.

## Цілі

- Один життєвий цикл ядра для всіх шляхів отримання та надсилання повідомлень каналів.
- Надійні фінальні надсилання за замовчуванням у новому життєвому циклі повідомлень після того, як адаптер оголошує поведінку, безпечну для повторного відтворення.
- Спільна семантика попереднього перегляду, редагування, stream, фіналізації, повторних спроб, відновлення та receipt.
- Невелика поверхня SDK Plugin, яку сторонні plugins можуть вивчити та підтримувати.
- Сумісність для наявних викликів `channel.turn` під час міграції.
- Чіткі точки розширення для нових можливостей каналів.
- Жодних специфічних для платформи гілок у ядрі.
- Жодних повідомлень каналу з token-delta. Потокова передача каналом залишається попереднім переглядом повідомлення, редагуванням, додаванням або доставкою завершеного блока.
- Структуровані метадані походження від OpenClaw для операційного/системного виводу, щоб видимі збої Gateway не входили повторно у спільні кімнати з увімкненими bot як нові prompts.

## Не цілі

- Не видаляти `runtime.channel.turn.*` на першому етапі.
- Не змушувати кожен канал використовувати однакову нативну поведінку транспорту.
- Не навчати ядро тем Telegram, нативних streams Slack, редагувань Matrix, карток Feishu, голосу QQ або activities Teams.
- Не публікувати всі внутрішні допоміжні засоби міграції як стабільний API SDK.
- Не робити повторні спроби такими, що повторно відтворюють завершені неідемпотентні операції платформи.

## Еталонна модель

Vercel Chat має добру публічну ментальну модель:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- методи адаптера, як-от `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` і отримання історії
- адаптер стану для dedupe, блокувань, черг і збереження

OpenClaw має запозичити словник, а не копіювати поверхню.

Що потрібно OpenClaw понад цю модель:

- Надійні наміри вихідного надсилання перед прямими викликами транспорту.
- Явні контексти надсилання з begin, commit і fail.
- Контексти отримання, які знають політику platform ack.
- Receipts, які переживають перезапуск і можуть керувати редагуваннями, видаленнями, відновленням і придушенням дублікатів.
- Менший публічний SDK. Вбудовані plugins можуть використовувати внутрішні допоміжні засоби runtime, але сторонні plugins мають бачити один узгоджений API повідомлень.
- Специфічна для агентів поведінка: сесії, transcripts, потокова передача блоків, перебіг роботи інструментів, approvals, медіадирективи, тихі відповіді та історія згадок у групах.

Обіцянок стилю `thread.post()` недостатньо для OpenClaw. Вони приховують межу транзакції, яка вирішує, чи можна відновити надсилання.

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

`receive` володіє життєвим циклом вхідних повідомлень.

`send` володіє життєвим циклом вихідних повідомлень.

`live` володіє станом попереднього перегляду, редагування, прогресу та stream.

`state` володіє надійним зберіганням намірів, receipts, ідемпотентністю, відновленням, блокуваннями та dedupe.

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

Це дає змогу одному й тому самому шляху надсилання обробляти звичайні відповіді, сповіщення cron, prompts approval, завершення завдань, надсилання message-tool, надсилання CLI або Control UI, результати subagent і автоматизовані надсилання.

### Походження

Походження описує, хто створив повідомлення і як OpenClaw має обробляти відлуння цього повідомлення. Воно відокремлене від відношення: повідомлення може бути відповіддю користувачу і водночас бути операційним виводом, що походить від OpenClaw.

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

Ядро володіє значенням виводу, що походить від OpenClaw. Канали володіють тим, як це походження кодується в їхній транспорт.

Перший обов’язковий випадок використання — вивід збоїв Gateway. Люди все одно мають бачити повідомлення на кшталт "Agent failed before reply" або "Missing API key", але позначений операційний вивід OpenClaw не має прийматися як вхід від bot у спільних кімнатах, коли `allowBots` увімкнено.

### Receipt

Receipts є сутностями першого класу:

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

Receipts є мостом від надійного наміру до майбутнього редагування, видалення, фіналізації попереднього перегляду, придушення дублікатів і відновлення.

Receipt може описувати одне повідомлення платформи або доставку з кількох частин. Розбитий на частини текст, медіа плюс текст, голос плюс текст і резервні варіанти карток мають зберігати всі ідентифікатори платформи, водночас відкриваючи primary id для thread-ів і подальших редагувань.

## Контекст отримання

Отримання не має бути голим викликом допоміжного засобу. Ядру потрібен контекст, який знає dedupe, маршрутизацію, запис сесії та політику platform ack.

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

- **Transport ack:** повідомляє webhook або socket платформи, що OpenClaw прийняв envelope події. Деякі платформи вимагають цього до dispatch.
- **Polling offset ack:** просуває курсор, щоб ту саму подію не отримували знову. Він не має просуватися далі за роботу, яку неможливо відновити.
- **Inbound record ack:** підтверджує, що OpenClaw зберіг достатньо вхідних метаданих для dedupe і маршрутизації повторної доставки.
- **Видимий користувачу receipt:** необов’язкова поведінка читання/status/typing; ніколи не є межею надійності.

`ReceiveAckPolicy` контролює лише підтвердження транспорту або polling. Його не можна повторно використовувати для read receipts або статусних reactions.

Перед авторизацією bot отримання має застосувати спільну політику відлуння OpenClaw, коли канал може декодувати метадані походження повідомлення:

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

Це відкидання базується на тегах, а не на тексті. Повідомлення кімнати, створене bot, з тим самим видимим текстом збою Gateway, але без метаданих походження OpenClaw, все одно проходить звичайну авторизацію `allowBots`.

Політика ack є явною:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling тепер використовує політику ack receive-context для свого збереженого watermark перезапуску. Tracker все ще спостерігає оновлення grammY, коли вони входять у ланцюжок middleware, але OpenClaw зберігає лише безпечний завершений update id після успішного dispatch, залишаючи невдалі або нижчі pending оновлення придатними для повторного відтворення після перезапуску. Upstream `getUpdates` fetch offset Telegram усе ще контролюється polling library, тож глибший наступний крок — повністю надійне джерело polling, якщо нам потрібна redelivery на рівні платформи понад restart watermark OpenClaw. Webhook платформи можуть потребувати негайного HTTP ack, але їм усе одно потрібні inbound dedupe і надійні наміри вихідного надсилання, бо webhooks можуть доставлятися повторно.

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
коміту, є відновлюваним.

Небезпечна межа настає після успіху платформи й до коміту квитанції. Якщо
процес завершується там, OpenClaw не може знати, чи існує повідомлення на
платформі, якщо адаптер не надає нативної ідемпотентності або шляху звіряння
квитанції. Такі спроби мають відновлюватися в `unknown_after_send`, а не сліпо
відтворюватися. Канали без звіряння можуть обрати повторну відправку щонайменше
один раз лише якщо видимі дублікати повідомлень є прийнятним, задокументованим
компромісом для цього каналу й відношення. Поточний міст звіряння SDK вимагає,
щоб адаптер оголосив `reconcileUnknownSend`, а потім просить
`durableFinal.reconcileUnknownSend` класифікувати невідомий запис як `sent`,
`not_sent` або `unresolved`; лише `not_sent` дозволяє повторне відтворення, а
невирішені записи залишаються кінцевими або повторюють тільки перевірку
звіряння.

Політика стійкості має бути явною:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` означає, що ядро має відмовляти закрито, коли не може записати
стійкий намір. `best_effort` може продовжити виконання, коли збереження
недоступне. `disabled` зберігає стару поведінку прямого надсилання. Під час
міграції застарілі обгортки й публічні допоміжні засоби сумісності за
замовчуванням використовують `disabled`; вони не мають виводити `required` з
того факту, що канал має універсальний вихідний адаптер.

Контексти надсилання також володіють локальними для каналу ефектами після
надсилання. Міграція не є безпечною, якщо стійка доставка обходить локальну
поведінку, яка раніше була прив'язана до шляху прямого надсилання каналу.
Приклади включають кеші пригнічення самовідлуння, маркери участі в тредах,
нативні якорі редагування, рендеринг підпису моделі та платформно-специфічні
запобіжники дублікатів. Ці ефекти мають або перейти в адаптер надсилання,
адаптер рендерингу, або іменований хук контексту надсилання, перш ніж цей канал
зможе ввімкнути стійку універсальну фінальну доставку.

Допоміжні засоби надсилання мають повертати квитанції аж до свого викликувача.
Стійкі обгортки не можуть ковтати ідентифікатори повідомлень або замінювати
результат доставки каналу на `undefined`; буферизовані диспетчери використовують
ці ідентифікатори для якорів тредів, подальших редагувань, фіналізації прев'ю
та пригнічення дублікатів.

Резервні надсилання працюють із пакетами, а не з одиночними payload. Перезаписи
тихої відповіді, резервний варіант для медіа, резервний варіант для картки та
проекція фрагментів можуть усі створювати більше ніж одне доставне
повідомлення, тож контекст надсилання має або доставити весь спроєктований
пакет, або явно задокументувати, чому чинний лише один payload.

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

Коли такий резервний варіант є стійким, увесь спроєктований пакет має бути
представлений одним стійким наміром надсилання або іншим атомарним планом
пакета. Записувати кожен payload по одному недостатньо: збій між payload може
залишити частково видимий резервний варіант без стійкого запису для решти
payload. Відновлення має знати, які units уже мають квитанції, і або
відтворювати лише відсутні units, або позначати пакет як `unknown_after_send`,
доки адаптер його не звірить.

## Живий контекст

Поведінка прев'ю, редагування, прогресу та stream має бути одним життєвим циклом
із явним увімкненням.

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

Живий стан є достатньо стійким для відновлення або пригнічення дублікатів:

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

- Telegram надсилає та редагує прев'ю, з новим фінальним повідомленням після застарівання прев'ю за віком.
- Discord надсилає та редагує прев'ю, скасовує для медіа/помилки/явної відповіді.
- Slack використовує нативний stream або чернеткове прев'ю залежно від форми треду.
- Mattermost фіналізує чернетковий допис.
- Matrix фіналізує чернеткову подію або редагує її за невідповідності.
- Teams використовує нативний stream прогресу.
- QQ Bot використовує stream або накопичений резервний варіант.

## Поверхня адаптера

Ціль публічного SDK має бути одним підшляхом:

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

До preflight-авторизації ядро має запускати спільний предикат відлуння OpenClaw
щоразу, коли `origin.decode` повертає метадані походження OpenClaw. Адаптер
отримання надає факти платформи, як-от автора-бота й форму кімнати; ядро володіє
рішенням про відкидання й порядком, щоб канали не реалізовували текстові фільтри
повторно.

Адаптер походження:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Ядро встановлює `MessageOrigin`. Канали лише перекладають його в нативні
метадані транспорту й назад. Slack відображає це на
`chat.postMessage({ metadata })` та вхідне `message.metadata`; Matrix може
відобразити це на додатковий вміст події; канали без нативних метаданих можуть
використовувати квитанцію/вихідний реєстр, коли це найкраще доступне
наближення.

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

Нова публічна поверхня має поглинути або оголосити застарілими ці концептуальні
області:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- більшість публічних використань `outbound-runtime`
- допоміжні засоби життєвого циклу чернеткового stream ad hoc

Підшляхи сумісності можуть залишатися як обгортки, але нові сторонні плагіни не
мають їх потребувати.

Вбудовані плагіни можуть зберігати внутрішні імпорти допоміжних засобів через
зарезервовані runtime-підшляхи під час міграції. Публічна документація має
спрямовувати авторів плагінів до `plugin-sdk/channel-message`, щойно він
з'явиться.

## Зв'язок із ходом каналу

`runtime.channel.turn.*` має залишатися під час міграції.

Він має стати адаптером сумісності:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` також має спочатку залишитися:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Після того як усі вбудовані плагіни й відомі сторонні шляхи сумісності будуть
з'єднані мостами, `channel.turn` можна оголосити застарілим. Його не слід
видаляти, доки не буде опублікованого шляху міграції SDK і контрактних тестів,
які доводять, що старі плагіни все ще працюють або завершуються з чіткою
помилкою версії.

## Запобіжники сумісності

Під час міграції універсальна стійка доставка вмикається явно для будь-якого
каналу, чий наявний callback доставки має побічні ефекти поза "надіслати цей
payload".

Застарілі точки входу за замовчуванням не є стійкими:

- `channel.turn.run` і `dispatchAssembledChannelTurn` використовують callback доставки каналу, якщо цей канал явно не надає перевірений об'єкт політики/параметрів стійкості.
- `channel.turn.runPrepared` залишається під керуванням каналу, доки підготовлений диспетчер явно не викличе контекст надсилання.
- Публічні допоміжні засоби сумісності, як-от `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, і допоміжні засоби direct-DM, ніколи не впроваджують універсальну стійку доставку перед наданим викликувачем callback `deliver` або `reply`.

Для типів мосту міграції `durable: undefined` означає "не стійкий". Стійкий
шлях вмикається лише явним значенням політики/параметрів. `durable: false` може
залишатися як написання для сумісності, але реалізація не має вимагати від
кожного немігруваного каналу додавати його.

Поточний код мосту має зберігати рішення про стійкість явним:

- Стійка фінальна доставка повертає дискримінований статус. `handled_visible` і
  `handled_no_send` є термінальними; `unsupported` і `not_applicable` можуть
  відкотитися до доставки, що належить каналу; `failed` поширює збій надсилання.
- Загальна стійка фінальна доставка обмежується можливостями адаптера, як-от
  тиха доставка, збереження цілі відповіді, збереження нативної цитати та
  хуки надсилання повідомлень. Якщо паритету бракує, слід обирати доставку,
  що належить каналу, а не загальне надсилання, яке змінює видиму для користувача поведінку.
- Стійкі надсилання на основі черги надають посилання на намір доставки. Наявні
  поля сесії `pendingFinalDelivery*` можуть переносити ідентифікатор наміру під час
  переходу; кінцевий стан — це сховище `MessageSendIntent` замість замороженого
  тексту відповіді плюс спеціальних контекстних полів.

Не вмикайте загальний стійкий шлях для каналу, доки всі ці умови не будуть
істинними:

- Адаптер загального надсилання виконує таку саму поведінку рендерингу й транспорту, як
  старий прямий шлях.
- Локальні побічні ефекти після надсилання збережено через контекст надсилання.
- Адаптер повертає квитанції або результати доставки з усіма ідентифікаторами повідомлень
  платформи.
- Підготовлені шляхи диспетчера або викликають новий контекст надсилання, або залишаються задокументованими
  як такі, що перебувають поза стійкою гарантією.
- Резервна доставка обробляє кожне спроєктоване навантаження, а не лише перше.
- Стійка резервна доставка записує весь масив спроєктованого навантаження як один
  намір або пакетний план, придатний для повторного відтворення.

Конкретні ризики міграції, які потрібно зберегти:

- Доставка монітора iMessage записує надіслані повідомлення в кеш відлуння після
  успішного надсилання. Стійкі фінальні надсилання все ще мають заповнювати цей кеш, інакше
  OpenClaw може повторно поглинути власні фінальні відповіді як вхідні повідомлення користувача.
- Tlon додає необов’язковий підпис моделі й записує гілки з участю після групових відповідей.
  Загальна стійка доставка не повинна обходити ці ефекти;
  або перенесіть їх в адаптери рендерингу/надсилання/фіналізації Tlon, або залиште Tlon на
  шляху, що належить каналу.
- Discord та інші підготовлені диспетчери вже володіють прямою доставкою й поведінкою
  попереднього перегляду. Вони не покриваються стійкою гарантією зібраного ходу, доки
  їхні підготовлені диспетчери явно не спрямують фінальні повідомлення через контекст надсилання.
- Тиха резервна доставка Telegram має доставляти повний масив спроєктованого навантаження.
  Скорочений шлях для одного навантаження може відкинути додаткові резервні навантаження після
  проєкції.
- LINE, BlueBubbles, Zalo, Nostr та інші наявні зібрані/допоміжні шляхи можуть
  мати обробку токенів відповіді, проксіювання медіа, кеші надісланих повідомлень, очищення
  завантаження/статусу або цілі лише для зворотного виклику. Вони залишаються на доставці,
  що належить каналу, доки ці семантики не будуть представлені адаптером надсилання й
  перевірені тестами.
- Допоміжні засоби прямих DM можуть мати зворотний виклик відповіді, який є єдиною правильною
  транспортною ціллю. Загальне вихідне надсилання не повинно вгадувати з `OriginatingTo` або `To` й пропускати
  цей зворотний виклик.
- Вивід збою OpenClaw gateway має залишатися видимим для людей, але позначені
  відлуння кімнати, створені ботом, мають відкидатися до авторизації `allowBots`.
  Канали не повинні реалізовувати це фільтрами префіксів видимого тексту, окрім як
  короткого аварійного тимчасового заходу; стійкий контракт — це структуровані метадані походження.

## Внутрішнє сховище

Стійка черга має зберігати наміри надсилання повідомлень, а не навантаження відповідей.

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

Черга має зберігати достатньо ідентичності, щоб після перезапуску повторно відтворити через той самий обліковий запис,
гілку, ціль, політику форматування та правила медіа.

## Класи збоїв

Адаптери каналів класифікують транспортні збої на закриті категорії:

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
- Не повторювати `auth` або `permission`, доки конфігурація не зміниться.
- Для `not_found` дозволити live-фіналізації відкотитися від редагування до нового надсилання, коли
  канал оголошує це безпечним.
- Для `conflict` використовуйте правила квитанції/ідемпотентності, щоб вирішити, чи повідомлення
  вже існує.
- Будь-яка помилка після того, як адаптер міг завершити платформне введення-виведення, але до коміту
  квитанції, стає `unknown_after_send`, якщо адаптер не може довести, що платформна
  операція не відбулася.

## Зіставлення каналів

| Канал                    | Ціль міграції                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Отримання політики підтвердження плюс надійні фінальні надсилання. Live-адаптер відповідає за надсилання плюс редагування попереднього перегляду, фінальне надсилання застарілого попереднього перегляду, теми, пропуск попереднього перегляду відповіді з цитатою, резервний варіант для медіа та обробку retry-after.                                      |
| Discord                  | Send-адаптер обгортає наявну надійну доставку корисного навантаження. Live-адаптер відповідає за редагування чернетки, чернетку прогресу, скасування попереднього перегляду медіа/помилки, збереження цілі відповіді та квитанції з ідентифікаторами повідомлень. Перевірте відлуння збоїв Gateway OpenClaw, створені ботом, у спільних кімнатах; використовуйте вихідний реєстр або інший нативний еквівалент, якщо Discord не може передавати метадані походження у звичайних повідомленнях. |
| Slack                    | Send-адаптер обробляє звичайні публікації в чаті. Live-адаптер вибирає нативний потік, коли форма треду це підтримує, інакше чернетку попереднього перегляду. Квитанції зберігають часові мітки тредів. Origin-адаптер відображає збої Gateway OpenClaw у Slack `chat.postMessage.metadata` і відкидає позначені відлуння бот-кімнат до авторизації `allowBots`. |
| WhatsApp                 | Send-адаптер відповідає за надсилання тексту/медіа з надійними фінальними намірами. Receive-адаптер обробляє групові згадки та ідентичність відправника. Live може залишатися відсутнім, доки WhatsApp не матиме редагованого транспорту.                                                                                                                       |
| Matrix                   | Live-адаптер відповідає за редагування подій-чернеток, фіналізацію, редагування, обмеження для зашифрованих медіа та резервний варіант у разі невідповідності цілі відповіді. Receive-адаптер відповідає за гідратацію та дедуплікацію зашифрованих подій. Origin-адаптер має кодувати походження збою Gateway OpenClaw у вміст події Matrix і відкидати відлуння кімнат налаштованого бота до обробки `allowBots`. |
| Mattermost               | Live-адаптер відповідає за одну публікацію-чернетку, згортання прогресу/інструментів, фіналізацію на місці та резервне свіже надсилання.                                                                                                                                                                                                                      |
| Microsoft Teams          | Live-адаптер відповідає за нативну поведінку прогресу та блокового потоку. Send-адаптер відповідає за активності та квитанції вкладень/карток.                                                                                                                                                                                                                 |
| Feishu                   | Render-адаптер відповідає за рендеринг тексту/карток/raw. Live-адаптер відповідає за потокові картки та придушення дубльованих фінальних повідомлень. Send-адаптер відповідає за коментарі, сесії тем, медіа та придушення голосу.                                                                                                                            |
| QQ Bot                   | Live-адаптер відповідає за C2C-потокове передавання, тайм-аут акумулятора та резервне фінальне надсилання. Render-адаптер відповідає за медіатеги та текст як голос.                                                                                                                                                                                          |
| Signal                   | Простий Receive-адаптер плюс Send-адаптер. Без Live-адаптера, якщо signal-cli не додасть надійну підтримку редагування.                                                                                                                                                                                                                                      |
| iMessage and BlueBubbles | Простий Receive-адаптер плюс Send-адаптер. Надсилання iMessage має зберігати заповнення echo-cache монітора, перш ніж надійні фінальні повідомлення зможуть обходити доставку через монітор. Специфічні для BlueBubbles введення, реакції та вкладення залишаються можливостями адаптера.                                                                     |
| Google Chat              | Простий Receive-адаптер плюс Send-адаптер із відношенням треду, зіставленим із spaces та ідентифікаторами тредів. Перевірте поведінку кімнат `allowBots=true` щодо позначених відлунь збоїв Gateway OpenClaw.                                                                                                                                                 |
| LINE                     | Простий Receive-адаптер плюс Send-адаптер з обмеженнями reply-token, змодельованими як можливість цілі/відношення.                                                                                                                                                                                                                                           |
| Nextcloud Talk           | Receive-міст SDK плюс Send-адаптер.                                                                                                                                                                                                                                                                                                                           |
| IRC                      | Простий Receive-адаптер плюс Send-адаптер, без надійних квитанцій редагування.                                                                                                                                                                                                                                                                                 |
| Nostr                    | Receive-адаптер плюс Send-адаптер для зашифрованих DM; квитанції є ідентифікаторами подій.                                                                                                                                                                                                                                                                    |
| QA Channel               | Адаптер контрактних тестів для поведінки отримання, надсилання, live, повторних спроб і відновлення.                                                                                                                                                                                                                                                          |
| Synology Chat            | Простий Receive-адаптер плюс Send-адаптер.                                                                                                                                                                                                                                                                                                                    |
| Tlon                     | Send-адаптер має зберігати рендеринг model-signature та відстеження тредів з участю, перш ніж буде ввімкнено загальну надійну фінальну доставку.                                                                                                                                                                                                              |
| Twitch                   | Простий Receive-адаптер плюс Send-адаптер із класифікацією обмежень швидкості.                                                                                                                                                                                                                                                                                |
| Zalo                     | Простий Receive-адаптер плюс Send-адаптер.                                                                                                                                                                                                                                                                                                                    |
| Zalo Personal            | Простий Receive-адаптер плюс Send-адаптер.                                                                                                                                                                                                                                                                                                                    |

## План міграції

### Фаза 1: Внутрішній домен повідомлень

- Додайте типи `src/channels/message/*` для повідомлень, цілей, відношень,
  походжень, квитанцій, можливостей, надійних намірів, контексту отримання, контексту надсилання,
  live-контексту та класів збоїв.
- Додайте `origin?: MessageOrigin` до типу корисного навантаження моста міграції, який використовується
  поточною доставкою відповідей, а потім перенесіть це поле до `ChannelMessage` і типів відрендерених
  повідомлень, коли рефакторинг замінить корисні навантаження відповідей.
- Тримайте це внутрішнім, доки адаптери й тести не підтвердять форму.
- Додайте чисті модульні тести для переходів станів і серіалізації.

### Фаза 2: Ядро надійного надсилання

- Перенесіть наявну вихідну чергу з надійності reply-payload до надійних
  намірів надсилання повідомлень.
- Дозвольте надійному наміру надсилання містити спроєктований масив корисних навантажень або план пакета, а не
  лише один reply payload.
- Збережіть поточну поведінку відновлення черги через сумісне перетворення.
- Змусьте `deliverOutboundPayloads` викликати `messages.send`.
- Зробіть надійність фінального надсилання типовою та закривайтеся зі збоєм, коли надійний намір
  не може бути записаний у новому життєвому циклі повідомлення, після того як адаптер оголосить
  безпечність повторного відтворення. Наявні шляхи сумісності channel-turn і SDK залишаються
  direct-send за замовчуванням протягом цієї фази.
- Послідовно записуйте квитанції.
- Повертайте квитанції та результати доставки початковому викликачу диспетчера замість
  трактування надійного надсилання як кінцевого побічного ефекту.
- Зберігайте походження повідомлення через надійні наміри надсилання, щоб відновлення, повторне відтворення та
  фрагментовані надсилання зберігали операційне походження OpenClaw.

### Фаза 3: Міст Channel Turn

- Повторно реалізуйте `channel.turn.run` і `dispatchAssembledChannelTurn` поверх
  `messages.receive` і `messages.send`.
- Зберігайте поточні типи фактів стабільними.
- Зберігайте застарілу поведінку за замовчуванням. Канал assembled-turn стає надійним
  лише тоді, коли його адаптер явно вмикає це з політикою надійності, безпечною для повторного відтворення.
- Залиште `durable: false` як сумісний аварійний вихід для шляхів, які фіналізують
  нативні редагування та ще не можуть безпечно повторно відтворюватися, але не покладайтеся на маркери `false`
  для захисту немігровних каналів.
- Вмикайте надійність assembled-turn за замовчуванням лише в новому життєвому циклі повідомлень, після
  того як зіставлення каналу доведе, що загальний шлях надсилання зберігає стару семантику
  доставки каналу.

### Фаза 4: Міст підготовленого диспетчера

- Замініть `deliverDurableInboundReplyPayload` мостом контексту надсилання.
- Збережіть старий допоміжний засіб як обгортку.
- Спочатку перенесіть Telegram, WhatsApp, Slack, Signal, iMessage і Discord, тому що
  вони вже мають стійку роботу з фінальними повідомленнями або простіші шляхи надсилання.
- Вважайте кожен підготовлений диспетчер непокритим, доки він явно не підключиться до
  контексту надсилання. Документація та записи журналу змін мають казати «зібрані
  channel turns» або називати перенесені шляхи каналів, а не заявляти про всі
  автоматичні фінальні відповіді.
- Збережіть поведінку `recordInboundSessionAndDispatchReply`, допоміжних засобів direct-DM та подібних
  публічних допоміжних засобів сумісності. Пізніше вони можуть надати явне
  підключення до контексту надсилання, але не повинні автоматично намагатися виконати загальне стійке
  доставлення перед callback доставки, яким володіє викликач.

### Етап 5: Уніфікований життєвий цикл у реальному часі

- Побудуйте `messages.live` з двома адаптерами доказу:
  - Telegram для надсилання, редагування та надсилання застарілого фінального повідомлення.
  - Matrix для фіналізації чернетки та резервного редагування з видаленням.
- Потім перенесіть Discord, Slack, Mattermost, Teams, QQ Bot і Feishu.
- Видаліть дубльований код фіналізації попереднього перегляду лише після того, як кожен канал матиме
  тести паритету.

### Етап 6: Публічний SDK

- Додайте `openclaw/plugin-sdk/channel-message`.
- Задокументуйте його як рекомендований API Plugin каналів.
- Оновіть експорти пакетів, інвентар entrypoint, згенеровані базові лінії API та
  документацію SDK Plugin.
- Додайте `MessageOrigin`, хуки кодування/декодування джерела та спільний
  предикат `shouldDropOpenClawEcho` до поверхні SDK channel-message.
- Збережіть обгортки сумісності для старих підшляхів.
- Позначте допоміжні засоби SDK з назвами reply як застарілі в документації після перенесення вбудованих plugins.

### Етап 7: Усі відправники

Перенесіть усіх вихідних виробників, що не є відповідями, на `messages.send`:

- сповіщення cron і heartbeat
- завершення завдань
- результати хуків
- запити на схвалення та результати схвалення
- надсилання інструмента повідомлень
- оголошення про завершення subagent
- явні надсилання CLI або Control UI
- шляхи автоматизації/трансляції

Саме тут модель перестає бути «відповідями агента» і стає «OpenClaw надсилає
повідомлення».

### Етап 8: Виведення Turn з ужитку

- Збережіть `channel.turn` як обгортку принаймні на одне вікно сумісності.
- Опублікуйте нотатки щодо міграції.
- Запустіть тести сумісності SDK Plugin зі старими імпортами.
- Видаліть або приховайте старі внутрішні допоміжні засоби лише після того, як вони більше не потрібні жодному вбудованому plugin,
  а сторонні контракти матимуть стабільну заміну.

## План тестування

Модульні тести:

- Серіалізація та відновлення стійкого наміру надсилання.
- Повторне використання ключа ідемпотентності та придушення дублікатів.
- Фіксація підтвердження та пропуск повторного відтворення.
- Відновлення `unknown_after_send`, яке виконує звіряння перед повторним відтворенням, коли адаптер
  підтримує звіряння.
- Політика класифікації збоїв.
- Послідовність політики ack для отримання.
- Зіставлення зв’язків для надсилань reply, followup, system і broadcast.
- Фабрика джерела збоїв Gateway і предикат `shouldDropOpenClawEcho`.
- Збереження джерела через нормалізацію payload, розбиття на chunks, серіалізацію стійкої черги
  та відновлення.

Інтеграційні тести:

- Простий адаптер `channel.turn.run` усе ще записує та надсилає.
- Застаріле доставлення assembled-turn не стає стійким, якщо канал
  явно не підключився.
- Міст `channel.turn.runPrepared` усе ще записує та фіналізує.
- Публічні допоміжні засоби сумісності за замовчуванням викликають callback доставки, яким володіє викликач,
  і не виконують загальне надсилання перед цими callback.
- Стійке резервне доставлення після перезапуску повторно відтворює весь спроєктований масив payload
  і не може залишити пізніші payload незаписаними після раннього збою.
- Стійке доставлення assembled-turn повертає ідентифікатори повідомлень платформи буферизованому
  диспетчеру.
- Користувацькі хуки доставки все ще повертають ідентифікатори повідомлень платформи, коли стійке доставлення
  вимкнене або недоступне.
- Фінальна відповідь переживає перезапуск між завершенням асистента та надсиланням на платформу.
- Чернетка попереднього перегляду фіналізується на місці, коли це дозволено.
- Чернетка попереднього перегляду скасовується або редагується з видаленням, коли невідповідність медіа/помилки/цілі відповіді
  вимагає звичайного доставлення.
- Потокове передавання блоків і потокове передавання попереднього перегляду не доставляють один і той самий текст одночасно.
- Медіа, передане потоково раніше, не дублюється у фінальному доставленні.

Тести каналів:

- Відповідь у темі Telegram із polling ack, відкладеним до безпечної
  завершеної водяної позначки контексту отримання.
- Відновлення polling Telegram для прийнятих, але не доставлених оновлень, покрите
  збереженою моделлю safe-completed offset.
- Застарілий попередній перегляд Telegram надсилає нове фінальне повідомлення та очищує попередній перегляд.
- Тихий fallback Telegram надсилає кожен спроєктований fallback payload.
- Стійкість тихого fallback Telegram атомарно записує повний спроєктований fallback-масив,
  а не один single-payload стійкий намір на кожну ітерацію циклу.
- Скасування попереднього перегляду Discord для медіа/помилки/явної відповіді.
- Фінальні повідомлення підготовленого диспетчера Discord проходять через контекст надсилання до того, як документація
  або журнал змін заявлятимуть про стійкість фінальних відповідей Discord.
- Стійкі фінальні надсилання iMessage заповнюють echo-кеш надісланих повідомлень монітора.
- Застарілі шляхи доставки LINE, BlueBubbles, Zalo і Nostr не обходяться
  загальним стійким надсиланням, доки не існують їхні тести паритету адаптерів.
- Доставка через callback Direct-DM/Nostr залишається авторитетною, якщо її явно
  не перенесено на повну ціль повідомлення та replay-safe адаптер надсилання.
- Позначені повідомлення про збій Gateway OpenClaw у Slack залишаються видимими вихідними повідомленнями, позначені
  ехо в кімнаті від bot відкидаються перед `allowBots`, а непозначені повідомлення bot з тим самим
  видимим текстом усе ще проходять звичайну авторизацію bot.
- Резервний native stream Slack до draft preview у DMs верхнього рівня.
- Фіналізація попереднього перегляду Matrix і резервне редагування з видаленням.
- Позначені ехо в кімнаті про збій Gateway OpenClaw у Matrix від налаштованих облікових записів bot
  відкидаються перед обробкою `allowBots`.
- Аудити каскаду збоїв Gateway у спільних кімнатах Discord і Google Chat покривають
  режими `allowBots` перед заявами про загальний захист там.
- Фіналізація чернетки Mattermost і fallback зі свіжим надсиланням.
- Фіналізація native progress Teams.
- Придушення дубльованих фінальних повідомлень Feishu.
- Резервний fallback за timeout акумулятора QQ Bot.
- Стійкі фінальні надсилання Tlon зберігають рендеринг підпису моделі та відстеження
  ланцюжка з участю.
- Прості стійкі фінальні надсилання WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo і Zalo Personal.

Валідація:

- Цільові файли Vitest під час розробки.
- `pnpm check:changed` у Testbox для всієї зміненої поверхні.
- Ширший `pnpm check` у Testbox перед landing повного рефакторингу або після
  змін публічного SDK/експортів.
- Live або qa-channel smoke принаймні для одного каналу з можливістю редагування та одного
  простого каналу лише з надсиланням перед видаленням обгорток сумісності.

## Відкриті питання

- Чи має Telegram зрештою замінити джерело runner grammY на
  повністю стійке джерело polling, яке може контролювати redelivery на рівні платформи, а не
  лише збережену водяну позначку перезапуску OpenClaw.
- Чи має стійкий live preview стан зберігатися в тому самому записі черги,
  що й фінальний намір надсилання, або в суміжному сховищі live-state.
- Як довго обгортки сумісності залишаються задокументованими після
  виходу `plugin-sdk/channel-message`.
- Чи мають сторонні plugins реалізовувати адаптери отримання напряму, чи лише
  надавати хуки normalize/send/live через `defineChannelMessageAdapter`.
- Які поля підтвердження безпечно відкривати в публічному SDK порівняно з внутрішнім runtime
  станом.
- Чи слід моделювати побічні ефекти, як-от self-echo кеші та participated-thread маркери,
  як хуки контексту надсилання, кроки фіналізації, якими володіє адаптер, або
  підписників підтверджень.
- Які канали мають нативні метадані джерела, яким потрібні збережені вихідні
  реєстри, а які не можуть забезпечити надійне придушення cross-bot echo.

## Критерії прийняття

- Кожен вбудований канал повідомлень надсилає фінальний видимий output через
  `messages.send`.
- Кожен inbound канал повідомлень входить через `messages.receive` або
  задокументовану обгортку сумісності.
- Кожен канал попереднього перегляду/редагування/потокового передавання використовує `messages.live` для стану чернетки та
  фіналізації.
- `channel.turn` є лише обгорткою.
- Допоміжні засоби SDK з назвами reply є експортами сумісності, а не рекомендованим шляхом.
- Стійке відновлення може повторно відтворити очікувані фінальні надсилання після перезапуску без втрати
  фінальної відповіді або дублювання вже зафіксованих надсилань; надсилання, чий
  результат на платформі невідомий, звіряються перед повторним відтворенням або документуються як
  at-least-once для цього адаптера.
- Стійкі фінальні надсилання fail closed, коли стійкий намір неможливо записати,
  якщо викликач явно не вибрав задокументований нестійкий режим.
- Застарілі channel-turn і допоміжні засоби сумісності SDK за замовчуванням використовують пряме
  доставлення, яким володіє канал; загальне стійке надсилання є лише явним opt-in.
- Підтвердження зберігають усі ідентифікатори повідомлень платформи для багаточастинних доставлень і
  основний ідентифікатор для зручності threading/edit.
- Стійкі обгортки зберігають локальні побічні ефекти каналу перед заміною прямих
  callback доставки.
- Підготовлені диспетчери не вважаються стійкими, доки їхній шлях фінального доставлення
  явно не використовує контекст надсилання.
- Резервне доставлення обробляє кожен спроєктований payload.
- Стійке резервне доставлення записує кожен спроєктований payload в один придатний до повторного відтворення
  намір або batch plan.
- Вивід збоїв Gateway, ініційований OpenClaw, видимий людям, але позначені
  ехо в кімнаті від bot-authored відкидаються перед авторизацією bot на каналах, які
  декларують підтримку контракту джерела.
- Документація пояснює send, receive, live, state, receipts, relations, failure
  policy, migration і test coverage.

## Пов’язане

- [Повідомлення](/uk/concepts/messages)
- [Потокове передавання та chunking](/uk/concepts/streaming)
- [Чернетки прогресу](/uk/concepts/progress-drafts)
- [Політика повторних спроб](/uk/concepts/retry)
- [Ядро channel turn](/uk/plugins/sdk-channel-turn)
