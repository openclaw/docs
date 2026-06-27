---
read_when:
    - Рефакторинг поведінки надсилання або отримання в каналі
    - Зміна вхідної обробки каналу, диспетчеризації відповідей, вихідної черги, потокового передавання попереднього перегляду або API повідомлень Plugin SDK
    - Проєктування нового канального plugin, якому потрібні надійні надсилання, квитанції, попередні перегляди, редагування або повторні спроби
summary: План проєктування для уніфікованого життєвого циклу надійного отримання, надсилання, попереднього перегляду, редагування та потокового передавання повідомлень
title: Рефакторинг життєвого циклу повідомлень
x-i18n:
    generated_at: "2026-06-27T17:26:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Ця сторінка є цільовим дизайном для заміни розрізнених допоміжних засобів
вхідних повідомлень каналів, диспетчеризації відповідей, потокового попереднього
перегляду та вихідної доставки одним надійним життєвим циклом повідомлення.

Коротко:

- Основними примітивами мають бути **отримання** і **надсилання**, а не **відповідь**.
- Відповідь є лише відношенням у вихідному повідомленні.
- Хід є зручністю обробки вхідного повідомлення, а не власником доставки.
- Надсилання має бути контекстним: `begin`, рендеринг, попередній перегляд або потік, фінальне надсилання,
  коміт, збій.
- Отримання також має бути контекстним: нормалізація, дедуплікація, маршрутизація, запис,
  диспетчеризація, підтвердження платформи, збій.
- Публічний SDK Plugin має звестися до однієї невеликої поверхні вихідних повідомлень каналу.

## Проблеми

Поточний стек каналів виріс із кількох обґрунтованих локальних потреб:

- Прості вхідні адаптери використовують `runtime.channel.inbound.run`.
- Розширені адаптери використовують `runtime.channel.inbound.runPreparedReply`.
- Застарілі допоміжні засоби використовують `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, допоміжні засоби payload відповідей, розбиття відповідей на частини,
  посилання на відповіді та допоміжні засоби вихідного runtime.
- Потоковий попередній перегляд живе в диспетчерах, специфічних для каналу.
- Надійність фінальної доставки додається навколо наявних шляхів payload відповідей.

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
повідомлення має існувати, намір має стати персистентним до спроби надсилання
на платформу, а квитанцію платформи потрібно закомітити після успіху.
Це дає OpenClaw відновлення щонайменше один раз. Поведінка рівно один раз існує
лише для адаптерів, які можуть довести нативну ідемпотентність або узгодити
спробу з невідомим результатом після надсилання зі станом платформи перед повтором.

Це кінцевий стан для цього рефакторингу, а не опис кожного поточного шляху.
Під час міграції наявні допоміжні засоби вихідних повідомлень усе ще можуть
переходити до прямого надсилання, коли best-effort записи в чергу не вдаються.
Рефакторинг завершено лише тоді, коли надійні фінальні надсилання fail closed
або явно відмовляються від цього з документованою ненадійною політикою.

## Цілі

- Один життєвий цикл ядра для всіх шляхів отримання й надсилання повідомлень каналів.
- Надійні фінальні надсилання за замовчуванням у новому життєвому циклі повідомлень після того,
  як адаптер оголосить replay-safe поведінку.
- Спільна семантика попереднього перегляду, редагування, потоку, фіналізації, повторних спроб, відновлення та квитанцій.
- Невелика поверхня SDK Plugin, яку сторонні plugins можуть вивчити й підтримувати.
- Сумісність для наявних викликачів сумісності вхідних відповідей під час міграції.
- Чіткі точки розширення для нових можливостей каналів.
- Жодних специфічних для платформи гілок у ядрі.
- Жодних повідомлень каналів із токен-дельтами. Потокове передавання каналу залишається попереднім переглядом повідомлення,
  редагуванням, додаванням або доставкою завершеного блока.
- Структуровані метадані походження від OpenClaw для операційного/системного виводу, щоб видимі
  збої Gateway не входили повторно в спільні кімнати з увімкненими ботами як нові промпти.

## Не цілі

- Не змушувати кожен наявний канал переходити на надійну доставку повідомлень на першому етапі.
- Не змушувати кожен канал до однакової нативної транспортної поведінки.
- Не навчати ядро тем Telegram, нативних потоків Slack, редагувань Matrix,
  карток Feishu, голосу QQ або активностей Teams.
- Не публікувати всі внутрішні допоміжні засоби міграції як стабільний API SDK.
- Не робити так, щоб повторні спроби повторювали завершені неідемпотентні операції платформи.

## Еталонна модель

Vercel Chat має хорошу публічну ментальну модель:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- методи адаптера, як-от `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, і отримання історії
- адаптер стану для дедуплікації, блокувань, черг і персистентності

OpenClaw має запозичити словник, а не копіювати поверхню.

Що OpenClaw потрібно понад цю модель:

- Надійні наміри вихідного надсилання перед прямими транспортними викликами.
- Явні контексти надсилання з begin, commit і fail.
- Контексти отримання, які знають політику підтвердження платформи.
- Квитанції, які переживають перезапуск і можуть керувати редагуваннями, видаленнями, відновленням і
  пригніченням дублікатів.
- Менший публічний SDK. Вбудовані plugins можуть використовувати внутрішні допоміжні засоби runtime, але
  сторонні plugins мають бачити один узгоджений API повідомлень.
- Поведінка, специфічна для агента: сесії, транскрипти, потокове передавання блоків, прогрес інструментів,
  затвердження, медіадирективи, тихі відповіді та історія згадок у групах.

Обіцянок у стилі `thread.post()` недостатньо для OpenClaw. Вони приховують
транзакційну межу, яка вирішує, чи можна відновити надсилання.

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

`live` володіє станом попереднього перегляду, редагування, прогресу та потоку.

`state` володіє персистентним зберіганням намірів, квитанціями, ідемпотентністю, відновленням, блокуваннями та
дедуплікацією.

## Терміни повідомлень

### Повідомлення

Нормалізоване повідомлення є нейтральним щодо платформи:

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

Це дає змогу одному й тому самому шляху надсилання обробляти звичайні відповіді, сповіщення Cron, промпти
затвердження, завершення задач, надсилання інструментом повідомлень, надсилання з CLI або Control UI, результати
субагентів і автоматизовані надсилання.

### Походження

Походження описує, хто створив повідомлення і як OpenClaw має обробляти відлуння
цього повідомлення. Воно відокремлене від відношення: повідомлення може бути відповіддю користувачеві
й водночас бути операційним виводом, що походить від OpenClaw.

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

Ядро володіє значенням виводу, що походить від OpenClaw. Канали володіють тим,
як це походження кодується в їхньому транспорті.

Перший обов’язковий випадок використання — вивід збоїв Gateway. Люди все ще мають бачити
повідомлення на кшталт "Agent failed before reply" або "Missing API key", але позначений
операційний вивід OpenClaw не має прийматися як створений ботом ввід у спільних
кімнатах, коли ввімкнено `allowBots`.

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

Квитанції є мостом від надійного наміру до майбутнього редагування, видалення, фіналізації попереднього перегляду,
пригнічення дублікатів і відновлення.

Квитанція може описувати одне повідомлення платформи або доставку з кількох частин. Розбитий на частини
текст, медіа плюс текст, голос плюс текст і fallback карток мають зберігати всі
ідентифікатори платформи, водночас відкриваючи primary id для потоків і пізніших редагувань.

## Контекст отримання

Отримання не має бути простим викликом допоміжного засобу. Ядру потрібен контекст, який знає
дедуплікацію, маршрутизацію, запис сесії та політику підтвердження платформи.

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

Підтвердження не є чимось одним. Контракт отримання має тримати ці сигнали окремо:

- **Транспортне підтвердження:** повідомляє Webhook або сокету платформи, що OpenClaw прийняв
  конверт події. Деякі платформи вимагають цього перед диспетчеризацією.
- **Підтвердження offset polling:** просуває курсор, щоб та сама подія не отримувалася
  знову. Це не має просуватися далі за роботу, яку неможливо відновити.
- **Підтвердження запису вхідного повідомлення:** підтверджує, що OpenClaw зберіг достатньо вхідних метаданих, щоб
  дедуплікувати й маршрутизувати повторну доставку.
- **Видима для користувача квитанція:** необов’язкова поведінка прочитання/статусу/набору; ніколи не є
  межею надійності.

`ReceiveAckPolicy` керує лише транспортним підтвердженням або підтвердженням polling. Його не можна
повторно використовувати для квитанцій прочитання або реакцій статусу.

Перед авторизацією бота отримання має застосувати спільну політику відлуння OpenClaw,
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

Це відкидання базується на тегах, а не на тексті. Повідомлення кімнати, створене ботом, із
таким самим видимим текстом збою Gateway, але без метаданих походження OpenClaw, все одно
проходить звичайну авторизацію `allowBots`.

Політика підтвердження є явною:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling тепер використовує політику підтвердження контексту отримання для свого персистентного
водяного знака перезапуску. Трекер усе ще спостерігає оновлення grammY, коли вони входять у
ланцюг middleware, але OpenClaw зберігає лише безпечний завершений update id після
успішної диспетчеризації, залишаючи невдалі або нижчі pending оновлення придатними до повторення після
перезапуску. Upstream `getUpdates` fetch offset Telegram усе ще контролюється
бібліотекою polling, тому решта глибшого зрізу — повністю надійне джерело polling,
якщо нам потрібна редоставка на рівні платформи понад restart watermark OpenClaw.
Webhook-платформам може бути потрібне негайне HTTP-підтвердження, але їм усе одно потрібні
вхідна дедуплікація та надійні наміри вихідного надсилання, бо webhooks можуть повторно доставляти.

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
фіксації, можна відновити.

Небезпечна межа настає після успіху платформи та до фіксації квитанції. Якщо
процес завершується там, OpenClaw не може знати, чи існує повідомлення на
платформі, якщо адаптер не надає нативної ідемпотентності або шляху
узгодження квитанцій. Такі спроби мають відновлюватися в `unknown_after_send`,
а не сліпо повторюватися. Канали без узгодження можуть вибрати повтор із
гарантією принаймні одного разу лише тоді, коли дублікати видимих повідомлень
є прийнятним, задокументованим компромісом для цього каналу й відношення.
Поточний міст узгодження SDK вимагає, щоб адаптер оголосив
`reconcileUnknownSend`, а потім просить `durableFinal.reconcileUnknownSend`
класифікувати невідомий запис як `sent`, `not_sent` або `unresolved`; лише
`not_sent` дозволяє повтор, а нерозв’язані записи залишаються термінальними
або повторюють тільки перевірку узгодження.

Політика довговічності має бути явною:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` означає, що ядро має відмовляти закрито, коли не може записати
довговічний намір. `best_effort` може продовжити виконання, коли збереження
недоступне. `disabled` зберігає стару поведінку прямого надсилання. Під час
міграції застарілі обгортки та публічні допоміжні засоби сумісності типово
використовують `disabled`; вони не повинні виводити `required` з того факту, що
канал має загальний вихідний адаптер.

Контексти надсилання також володіють локальними для каналу ефектами після
надсилання. Міграція небезпечна, якщо довговічна доставка обходить локальну
поведінку, яка раніше була прив’язана до прямого шляху надсилання каналу.
Приклади включають кеші пригнічення власного відлуння, маркери участі в
тредах, нативні якорі редагування, рендеринг підпису моделі та специфічні для
платформи запобіжники дублювання. Ці ефекти мають або перейти в адаптер
надсилання, адаптер рендерингу, або в іменований хук контексту надсилання,
перш ніж цей канал зможе ввімкнути довговічну загальну фінальну доставку.

Допоміжні засоби надсилання мають повертати квитанції аж до свого викликача.
Довговічні обгортки не можуть проковтувати ідентифікатори повідомлень або
замінювати результат доставки каналу на `undefined`; буферизовані диспетчери
використовують ці ідентифікатори для якорів тредів, подальших редагувань,
фіналізації попереднього перегляду та пригнічення дублікатів.

Резервні надсилання працюють із пакетами, а не з окремими payload. Переписування
тихих відповідей, резервний медіавміст, резервні картки та проєкція фрагментів
можуть створювати більше ніж одне доставне повідомлення, тому контекст
надсилання має або доставити весь спроєктований пакет, або явно
задокументувати, чому чинний лише один payload.

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

Коли такий резервний варіант є довговічним, увесь спроєктований пакет має бути
представлений одним довговічним наміром надсилання або іншим атомарним планом
пакета. Записувати кожен payload по одному недостатньо: збій між payload може
залишити частково видимий резервний варіант без довговічного запису для
решти payload. Відновлення має знати, які одиниці вже мають квитанції, і або
повторити лише відсутні одиниці, або позначити пакет як `unknown_after_send`,
доки адаптер його не узгодить.

## Живий контекст

Поведінка попереднього перегляду, редагування, прогресу та стриму має бути
одним життєвим циклом з opt-in.

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

Живий стан достатньо довговічний, щоб відновлюватися або пригнічувати дублікати:

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

- Telegram надсилає та редагує попередній перегляд, зі свіжим фінальним варіантом після застарівання попереднього перегляду.
- Discord надсилає та редагує попередній перегляд, скасовує для медіа/помилки/явної відповіді.
- Slack використовує нативний стрим або чернетку попереднього перегляду залежно від форми треду.
- Фіналізація чернетки допису Mattermost.
- Фіналізація чернетки події Matrix або редагування у разі невідповідності.
- Нативний стрим прогресу Teams.
- Стрим QQ Bot або накопичений резервний варіант.

## Поверхня адаптера

Ціллю публічного SDK має бути один підшлях:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Перед авторизацією preflight ядро має запускати спільний предикат відлуння
OpenClaw щоразу, коли `origin.decode` повертає метадані походження OpenClaw.
Адаптер отримання надає факти платформи, як-от автор бота та форма кімнати;
ядро володіє рішенням про відкидання й порядком, щоб канали не реалізовували
текстові фільтри повторно.

Адаптер походження:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Ядро встановлює `MessageOrigin`. Канали лише перекладають його в нативні
метадані транспорту й назад. Slack відображає це на `chat.postMessage({ metadata })`
та вхідний `message.metadata`; Matrix може відобразити це на додатковий вміст
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

Нова публічна поверхня має поглинути або оголосити застарілими такі концептуальні
області:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- більшість публічних використань `outbound-runtime`
- спеціальні допоміжні засоби життєвого циклу стриму чернеток

Підшляхи сумісності можуть залишатися як обгортки, але нові сторонні plugins
не повинні їх потребувати.

Вбудовані plugins можуть зберігати внутрішні імпорти допоміжних засобів через
зарезервовані підшляхи runtime під час міграції. Публічна документація має
спрямовувати авторів plugin до `plugin-sdk/channel-outbound`, щойно він
з’явиться.

## Зв’язок із вхідним каналом

`runtime.channel.inbound.*` є мостом runtime під час міграції.

Він має стати адаптером сумісності:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` також має спочатку залишитися:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Стару поверхню runtime `channel.turn` було вилучено. Викликачі runtime
використовують `channel.inbound.*`; документація каналів і підшляхи SDK
використовують іменники inbound/message.

## Запобіжники сумісності

Під час міграції загальна довговічна доставка є opt-in для будь-якого каналу,
наявний callback доставки якого має побічні ефекти поза межами "надіслати цей
payload".

Застарілі точки входу типово є недовговічними:

- `channel.inbound.run` і `dispatchChannelInboundReply` використовують callback
  доставки каналу, якщо цей канал явно не надає перевірений об’єкт політики/опцій
  довговічності.
- `channel.inbound.runPreparedReply` залишається у власності каналу, доки підготовлений диспетчер
  явно не викличе контекст надсилання.
- Публічні допоміжні засоби сумісності, такі як `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, і допоміжні засоби direct-DM ніколи не
  впроваджують загальну довговічну доставку перед наданим викликачем callback
  `deliver` або `reply`.

Для типів мосту міграції `durable: undefined` означає "недовговічний".
Довговічний шлях вмикається лише явним значенням політики/опцій. `durable:
false` може залишатися як написання для сумісності, але реалізація не повинна
вимагати, щоб кожен немігрований канал додавав його.

Поточний код мосту має зберігати рішення щодо довговічності явним:

- Стійка фінальна доставка повертає дискримінований статус. `handled_visible` і
  `handled_no_send` є термінальними; `unsupported` і `not_applicable` можуть
  повертатися до доставки, якою володіє канал; `failed` передає помилку надсилання.
- Загальна стійка фінальна доставка обмежується можливостями адаптера, такими як
  тиха доставка, збереження цільової відповіді, збереження нативного цитування та
  хуки надсилання повідомлень. За відсутності паритету слід вибирати доставку,
  якою володіє канал, а не загальне надсилання, що змінює видиму для користувача поведінку.
- Стійкі надсилання з підтримкою черги надають посилання на намір доставки. Наявні
  поля сесії `pendingFinalDelivery*` можуть переносити ідентифікатор наміру під час
  переходу; кінцевий стан — це сховище `MessageSendIntent` замість замороженого
  тексту відповіді плюс спеціальні поля контексту.

Не вмикайте загальний стійкий шлях для каналу, доки все наведене нижче не буде
істинним:

- Загальний адаптер надсилання виконує ту саму поведінку рендерингу й транспорту, що й
  старий прямий шлях.
- Локальні побічні ефекти після надсилання зберігаються через контекст надсилання.
- Адаптер повертає квитанції або результати доставки з усіма ідентифікаторами повідомлень платформи.
- Підготовлені шляхи диспетчеризації або викликають новий контекст надсилання, або залишаються задокументованими
  як такі, що перебувають поза стійкою гарантією.
- Резервна доставка обробляє кожне спроєктоване корисне навантаження, а не лише перше.
- Стійка резервна доставка записує весь масив спроєктованих корисних навантажень як один
  намір або пакетний план, придатний для повторного відтворення.

Конкретні ризики міграції, які потрібно зберегти:

- Доставка монітора iMessage записує надіслані повідомлення в кеш відлуння після
  успішного надсилання. Стійкі фінальні надсилання все одно мають заповнювати цей кеш, інакше
  OpenClaw може повторно поглинути власні фінальні відповіді як вхідні повідомлення користувача.
- Tlon додає необов’язковий підпис моделі та записує потоки, у яких була участь,
  після групових відповідей. Загальна стійка доставка не повинна обходити ці ефекти;
  або перенесіть їх в адаптери рендерингу/надсилання/фіналізації Tlon, або залиште Tlon на
  шляху, яким володіє канал.
- Discord та інші підготовлені диспетчери вже володіють прямою доставкою й поведінкою попереднього перегляду.
  Вони не покриваються стійкою гарантією зібраного ходу, доки їхні підготовлені диспетчери
  явно не спрямують фінальні повідомлення через контекст надсилання.
- Тиха резервна доставка Telegram має доставляти повний масив спроєктованих корисних навантажень.
  Скорочення до одного корисного навантаження може відкинути додаткові резервні корисні навантаження після
  проєкції.
- LINE, Zalo, Nostr та інші наявні зібрані/допоміжні шляхи можуть
  мати обробку токенів відповіді, проксіювання медіа, кеші надісланих повідомлень, очищення завантаження/статусу
  або цілі лише для callback. Вони залишаються на доставці, якою володіє канал, доки
  ці семантики не будуть представлені адаптером надсилання та перевірені тестами.
- Допоміжні засоби прямих DM можуть мати callback відповіді, який є єдиною правильною ціллю
  транспорту. Загальне вихідне надсилання не повинно здогадуватися з `OriginatingTo` або `To` і пропускати
  цей callback.
- Вивід помилки OpenClaw Gateway має залишатися видимим для людей, але позначені
  відлуння кімнат, створені ботом, мають відкидатися до авторизації `allowBots`.
  Канали не повинні реалізовувати це через фільтри префіксів видимого тексту, окрім як
  короткочасний аварійний запобіжник; стійкий контракт — це структуровані метадані походження.

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

Черга має зберігати достатньо ідентичності, щоб після перезапуску повторно відтворити надсилання через той самий обліковий запис,
потік, ціль, політику форматування та правила медіа.

## Класи помилок

Адаптери каналів класифікують транспортні помилки на закриті категорії:

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
- Для `not_found` дозвольте живій фіналізації перейти з редагування на свіже надсилання, коли
  канал оголошує це безпечним.
- Для `conflict` використовуйте правила квитанції/ідемпотентності, щоб вирішити, чи повідомлення
  вже існує.
- Будь-яка помилка після того, як адаптер міг завершити платформне I/O, але до коміту квитанції,
  стає `unknown_after_send`, якщо адаптер не може довести, що платформна операція
  не відбулася.

## Мапування каналів

| Канал           | Цільова міграція                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Отримання політики підтверджень і надійні фінальні надсилання. Live-адаптер відповідає за надсилання та редагування попереднього перегляду, фінальне надсилання застарілого попереднього перегляду, теми, пропуск попереднього перегляду цитованої відповіді, fallback для медіа та обробку retry-after.                                                     |
| Discord         | Send-адаптер обгортає наявну надійну доставку payload. Live-адаптер відповідає за редагування чернетки, чернетку прогресу, скасування попереднього перегляду медіа/помилки, збереження цілі відповіді та квитанції з ідентифікаторами повідомлень. Перевірте відлуння gateway-збоїв, створені ботом, у спільних кімнатах; використовуйте вихідний реєстр або інший нативний еквівалент, якщо Discord не може переносити метадані походження у звичайних повідомленнях. |
| Slack           | Send-адаптер обробляє звичайні публікації в чаті. Live-адаптер вибирає нативний потік, коли форма треду це підтримує, інакше чернетку попереднього перегляду. Квитанції зберігають часові позначки треду. Origin-адаптер відображає збої OpenClaw gateway у Slack `chat.postMessage.metadata` і відкидає позначені відлуння бот-кімнат до авторизації `allowBots`.                                  |
| WhatsApp        | Send-адаптер відповідає за надсилання тексту/медіа з надійними фінальними намірами. Receive-адаптер обробляє згадку групи та ідентичність відправника. Live може залишатися відсутнім, доки WhatsApp не матиме редагованого транспорту.                                                                                                                        |
| Matrix          | Live-адаптер відповідає за редагування подій чернетки, фіналізацію, редагування/приховування, обмеження зашифрованих медіа та fallback у разі невідповідності цілі відповіді. Receive-адаптер відповідає за гідратацію та дедуплікацію зашифрованих подій. Origin-адаптер має кодувати походження gateway-збою OpenClaw у вміст події Matrix і відкидати відлуння кімнат налаштованого бота до обробки `allowBots`.              |
| Mattermost      | Live-адаптер відповідає за один допис-чернетку, згортання прогресу/інструментів, фіналізацію на місці та fallback із новим надсиланням.                                                                                                                                                                                                                       |
| Microsoft Teams | Live-адаптер відповідає за нативний прогрес і поведінку block stream. Send-адаптер відповідає за активності та квитанції вкладень/карток.                                                                                                                                                                                                                     |
| Feishu          | Render-адаптер відповідає за рендеринг тексту/карток/raw. Live-адаптер відповідає за потокові картки та пригнічення дубльованого фіналу. Send-адаптер відповідає за коментарі, сесії тем, медіа та пригнічення голосу.                                                                                                                                          |
| QQ Bot          | Live-адаптер відповідає за C2C-стримінг, тайм-аут акумулятора та fallback із фінальним надсиланням. Render-адаптер відповідає за медіатеги й текст як голос.                                                                                                                                                                                                  |
| Signal          | Простий receive- і send-адаптер. Без live-адаптера, якщо signal-cli не додасть надійну підтримку редагування.                                                                                                                                                                                                                                                  |
| iMessage        | Простий receive- і send-адаптер. Надсилання iMessage має зберігати заповнення echo-cache монітора, перш ніж надійні фінальні повідомлення зможуть обходити доставку монітора.                                                                                                                                                                                |
| Google Chat     | Простий receive- і send-адаптер із відношенням треду, зіставленим із просторами та ідентифікаторами тредів. Перевірте поведінку кімнати `allowBots=true` для позначених відлунь gateway-збоїв OpenClaw.                                                                                                                                                      |
| LINE            | Простий receive- і send-адаптер з обмеженнями reply-token, змодельованими як capability цілі/відношення.                                                                                                                                                                                                                                                       |
| Nextcloud Talk  | SDK receive bridge плюс send-адаптер.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Простий receive- і send-адаптер, без надійних квитанцій редагування.                                                                                                                                                                                                                                                                                           |
| Nostr           | Receive- і send-адаптер для зашифрованих DM; квитанції є ідентифікаторами подій.                                                                                                                                                                                                                                                                               |
| QA Channel      | Адаптер contract-test для поведінки receive, send, live, повторних спроб і відновлення.                                                                                                                                                                                                                                                                        |
| Synology Chat   | Простий receive- і send-адаптер.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | Send-адаптер має зберігати рендеринг model-signature і відстеження тредів з участю, перш ніж буде ввімкнено загальну надійну фінальну доставку.                                                                                                                                                                                                               |
| Twitch          | Простий receive- і send-адаптер із класифікацією rate-limit.                                                                                                                                                                                                                                                                                                   |
| Zalo            | Простий receive- і send-адаптер.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | Простий receive- і send-адаптер.                                                                                                                                                                                                                                                                                                                              |

## План міграції

### Фаза 1: Внутрішній домен повідомлень

- Додайте типи `src/channels/message/*` для повідомлень, цілей, відношень,
  походжень, квитанцій, capabilities, надійних намірів, контексту receive, контексту send,
  контексту live та класів збоїв.
- Додайте `origin?: MessageOrigin` до типу payload міграційного bridge, який
  використовується поточною доставкою відповідей, а потім перенесіть це поле до `ChannelMessage` і рендерених
  типів повідомлень, коли рефакторинг замінить payload відповідей.
- Тримайте це внутрішнім, доки адаптери й тести не підтвердять форму.
- Додайте чисті модульні тести для переходів стану та серіалізації.

### Фаза 2: Ядро надійного надсилання

- Перенесіть наявну вихідну чергу з надійності reply-payload до надійних
  намірів надсилання повідомлень.
- Дозвольте надійному наміру надсилання переносити масив спроєктованих payload або план batch,
  а не лише один reply payload.
- Збережіть поточну поведінку відновлення черги через сумісне перетворення.
- Зробіть так, щоб `deliverOutboundPayloads` викликав `messages.send`.
- Зробіть надійність фінального надсилання типовою і fail closed, коли надійний намір
  не можна записати в новому життєвому циклі повідомлення, після того як адаптер оголосить
  безпечність replay. Наявний inbound runner і шляхи сумісності SDK залишаються
  direct-send за замовчуванням протягом цієї фази.
- Узгоджено записуйте квитанції.
- Повертайте квитанції та результати доставки початковому викликачеві диспетчера
  замість трактування надійного надсилання як кінцевого побічного ефекту.
- Зберігайте походження повідомлення через надійні наміри надсилання, щоб відновлення, replay і
  chunked sends зберігали операційне походження OpenClaw.

### Фаза 3: Channel Inbound Bridge

- Повторно реалізуйте `channel.inbound.run` і `dispatchChannelInboundReply` поверх
  `messages.receive` і `messages.send`.
- Збережіть стабільність поточних типів фактів.
- Збережіть застарілу поведінку за замовчуванням. Канал assembled-turn стає надійним
  лише коли його адаптер явно вмикає це через replay-safe політику надійності.
- Збережіть `durable: false` як сумісний escape hatch для шляхів, які фіналізують
  нативні редагування й ще не можуть безпечно replay, але не покладайтеся на маркери `false`,
  щоб захищати немігрувані канали.
- Вмикайте типову надійність assembled-turn лише в новому життєвому циклі повідомлень, після того як
  мапінг каналу доведе, що загальний шлях send зберігає стару семантику доставки
  каналу.

### Фаза 4: Prepared Dispatcher Bridge

- Замініть `deliverDurableInboundReplyPayload` мостом контексту надсилання.
- Залиште старий helper як wrapper.
- Спершу перенесіть Telegram, WhatsApp, Slack, Signal, iMessage і Discord, бо
  вони вже мають роботу зі стійкими фінальними повідомленнями або простіші шляхи надсилання.
- Вважайте кожен підготовлений dispatcher непокритим, доки він явно не ввімкне
  контекст надсилання. Документація та записи changelog мають казати «зібрані
  ходи каналу» або називати перенесені шляхи каналів, а не заявляти про всі
  автоматичні фінальні відповіді.
- Збережіть поведінку `recordInboundSessionAndDispatchReply`, helper-ів direct-DM
  та подібних публічних compatibility helper-ів без змін. Пізніше вони можуть
  надати явне opt-in для контексту надсилання, але не повинні автоматично
  намагатися виконувати загальну стійку доставку до callback доставки, яким володіє caller.

### Фаза 5: Уніфікований життєвий цикл live

- Побудуйте `messages.live` з двома proof adapters:
  - Telegram для надсилання, редагування та надсилання застарілого фінального повідомлення.
  - Matrix для фіналізації чернетки та fallback редагування.
- Потім перенесіть Discord, Slack, Mattermost, Teams, QQ Bot і Feishu.
- Видаляйте дубльований код фіналізації preview лише після того, як кожен канал
  матиме parity tests.

### Фаза 6: Публічний SDK

- Додайте `openclaw/plugin-sdk/channel-outbound`.
- Задокументуйте його як рекомендований API для channel Plugin.
- Оновіть package exports, інвентар entrypoint-ів, згенеровані API baselines і
  документацію Plugin SDK.
- Додайте `MessageOrigin`, hooks encode/decode origin і спільний предикат
  `shouldDropOpenClawEcho` до поверхні channel-outbound SDK.
- Залиште compatibility wrappers для старих subpaths.
- Позначте reply-named SDK helpers як deprecated у документації після міграції
  bundled plugins.

### Фаза 7: Усі відправники

Перенесіть усіх non-reply outbound producers на `messages.send`:

- сповіщення cron і heartbeat
- завершення task
- результати hook
- approval prompts і approval results
- надсилання message tool
- оголошення про завершення subagent
- явні надсилання з CLI або Control UI
- шляхи automation/broadcast

Саме тут модель перестає бути «відповідями agent» і стає «OpenClaw надсилає
повідомлення».

### Фаза 8: Видалення сумісності з назвами turn

- Залиште inbound/message-named wrappers як вікно сумісності.
- Опублікуйте migration notes.
- Запустіть тести сумісності Plugin SDK зі старими imports.
- Видаляйте або приховуйте старі internal helpers лише після того, як жоден
  bundled Plugin більше їх не потребуватиме, а third-party contracts матимуть
  стабільну заміну.

## План тестування

Unit tests:

- Серіалізація та відновлення durable send intent.
- Повторне використання idempotency key і пригнічення дублікатів.
- Commit receipt і пропуск replay.
- Відновлення `unknown_after_send`, яке виконує reconciliation перед replay, коли adapter
  підтримує reconciliation.
- Політика класифікації збоїв.
- Послідовність політики receive ack.
- Мапінг relation для надсилань reply, followup, system і broadcast.
- Фабрика origin для gateway-failure і предикат `shouldDropOpenClawEcho`.
- Збереження origin через нормалізацію payload, chunking, серіалізацію durable queue
  і recovery.

Integration tests:

- Простий adapter `channel.inbound.run` досі записує і надсилає.
- Доставка legacy assembled-event не стає durable, якщо канал явно не ввімкнув її.
- Міст `channel.inbound.runPreparedReply` досі записує і фіналізує.
- Public compatibility helpers за замовчуванням викликають callback-и доставки, якими володіє caller,
  і не виконують generic-send перед цими callback-ами.
- Durable fallback delivery після restart повторно відтворює весь projected payload array
  і не може залишити пізніші payloads незаписаними після раннього crash.
- Durable assembled-event delivery повертає platform message ids до buffered
  dispatcher.
- Custom delivery hooks досі повертають platform message ids, коли durable delivery
  вимкнена або недоступна.
- Фінальна відповідь переживає restart між завершенням assistant і надсиланням на платформу.
- Preview draft фіналізується на місці, коли це дозволено.
- Preview draft скасовується або редагується, коли media/error/reply-target mismatch
  вимагає звичайної доставки.
- Block streaming і preview streaming не доставляють той самий текст одночасно.
- Media, передане streaming раніше, не дублюється у фінальній доставці.

Channel tests:

- Telegram topic reply з polling ack, відкладеним до safe completed watermark
  receive context.
- Telegram polling recovery для прийнятих, але не доставлених updates, покритих
  збереженою моделлю safe-completed offset.
- Telegram stale preview надсилає нове фінальне повідомлення і очищує preview.
- Telegram silent fallback надсилає кожен projected fallback payload.
- Telegram silent fallback durability атомарно записує повний projected fallback array,
  а не один single-payload durable intent на кожній ітерації loop.
- Discord preview cancel при media/error/explicit reply.
- Фінальні повідомлення Discord prepared dispatcher проходять через контекст надсилання до того,
  як docs або changelog заявлять про durability фінальних відповідей Discord.
- iMessage durable final sends заповнюють monitor sent-message echo cache.
- Legacy delivery paths LINE, Zalo і Nostr не обходяться через
  generic durable send, доки не існують їхні adapter parity tests.
- Direct-DM/Nostr callback delivery залишається авторитетною, якщо її явно
  не перенесено на повний message target і replay-safe send adapter.
- Tagged OpenClaw gateway failure messages у Slack залишаються видимими outbound, tagged
  bot-room echoes відкидаються до `allowBots`, а untagged bot messages з тим самим
  видимим текстом досі проходять звичайну bot authorization.
- Slack native stream fallback до draft preview у top-level DMs.
- Matrix preview finalization і redaction fallback.
- Matrix tagged OpenClaw gateway-failure room echoes від налаштованих bot
  accounts відкидаються до обробки `allowBots`.
- Аудити cascade gateway-failure для shared-room у Discord і Google Chat покривають
  режими `allowBots` перед заявами про generic protection там.
- Mattermost draft finalization і fresh-send fallback.
- Teams native progress finalization.
- Feishu duplicate final suppression.
- Tlon durable final sends зберігають rendering model-signature і відстеження
  participated thread.
- Прості durable final sends для WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo і Zalo Personal.

Validation:

- Targeted Vitest files під час розробки.
- `pnpm check:changed` у Testbox для всієї зміненої поверхні.
- Ширший `pnpm check` у Testbox перед landing повного refactor або після
  змін public SDK/export.
- Live або qa-channel smoke щонайменше для одного edit-capable channel і одного
  простого send-only channel перед видаленням compatibility wrappers.

## Відкриті питання

- Чи має Telegram зрештою замінити джерело grammY runner на повністю
  durable polling source, яке може керувати redelivery на рівні платформи, а не
  лише збереженим restart watermark OpenClaw.
- Чи слід зберігати durable live preview state у тому самому queue record,
  що й final send intent, чи в sibling live-state store.
- Як довго compatibility wrappers залишаються задокументованими після випуску
  `plugin-sdk/channel-outbound`.
- Чи мають third-party plugins реалізовувати receive adapters напряму, чи лише
  надавати normalize/send/live hooks через `defineChannelMessageAdapter`.
- Які receipt fields безпечно відкривати в public SDK, а які мають лишатися internal runtime
  state.
- Чи слід моделювати side effects, як-от self-echo caches і participated-thread markers,
  як send-context hooks, adapter-owned finalize steps або receipt subscribers.
- Які канали мають native origin metadata, яким потрібні persisted outbound
  registries, а які не можуть забезпечити надійне cross-bot echo suppression.

## Критерії прийняття

- Кожен bundled message channel надсилає фінальний видимий output через
  `messages.send`.
- Кожен inbound message channel входить через `messages.receive` або
  задокументований compatibility wrapper.
- Кожен preview/edit/stream channel використовує `messages.live` для draft state і
  finalization.
- `channel.inbound` є лише wrapper.
- Reply-named SDK helpers є compatibility exports, а не рекомендованим шляхом.
- Durable recovery може повторно відтворювати pending final sends після restart без втрати
  final response або дублювання вже committed sends; sends, platform outcome яких
  невідомий, проходять reconciliation перед replay або задокументовані як
  щонайменше один раз для цього adapter.
- Durable final sends fail closed, коли durable intent неможливо записати,
  якщо caller явно не вибрав задокументований non-durable mode.
- Legacy SDK compatibility helpers за замовчуванням використовують direct
  channel-owned delivery; generic durable send є лише explicit opt-in.
- Receipts зберігають усі platform message ids для multi-part deliveries і
  primary id для зручності threading/edit.
- Durable wrappers зберігають channel-local side effects перед заміною direct
  delivery callbacks.
- Prepared dispatchers не рахуються durable, доки їхній final delivery
  path явно не використовує send context.
- Fallback delivery обробляє кожен projected payload.
- Durable fallback delivery записує кожен projected payload в один replayable
  intent або batch plan.
- OpenClaw-originated gateway failure output видимий людям, але tagged
  bot-authored room echoes відкидаються до bot authorization на каналах, які
  декларують підтримку origin contract.
- Документація пояснює send, receive, live, state, receipts, relations, failure
  policy, migration і test coverage.

## Пов’язане

- [Повідомлення](/uk/concepts/messages)
- [Streaming і chunking](/uk/concepts/streaming)
- [Progress drafts](/uk/concepts/progress-drafts)
- [Retry policy](/uk/concepts/retry)
- [Channel inbound API](/uk/plugins/sdk-channel-inbound)
