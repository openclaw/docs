---
read_when:
    - Ви створюєте Plugin каналу й хочете використовувати спільний життєвий цикл вхідного звернення
    - Ви мігруєте монітор каналу зі самописної зв’язувальної логіки запису/диспетчеризації
    - Потрібно розуміти етапи приймання, надходження, класифікації, попередньої перевірки, вирішення, запису, диспетчеризації та фіналізації.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- спільне ядро вхідних ходів, яке вбудовані й сторонні плагіни каналів використовують для запису, диспетчеризації та завершення ходів агента
title: Ядро ходу каналу
x-i18n:
    generated_at: "2026-05-11T20:50:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Ядро ходу каналу — це спільна вхідна машина станів, яка перетворює нормалізовану подію платформи на хід агента. Plugins каналів надають факти платформи й callback доставки. Core відповідає за оркестрацію: приймання, класифікацію, попередню перевірку, розв’язання, авторизацію, складання, запис, диспетчеризацію та фіналізацію.

Використовуйте це, коли ваш plugin перебуває на гарячому шляху вхідних повідомлень. Для подій, що не є повідомленнями (slash-команди, модальні вікна, взаємодії з кнопками, події життєвого циклу, реакції, стан голосу), залишайте їх локальними для plugin. Ядро відповідає лише за події, які можуть стати текстовим ходом агента.

<Info>
  Ядро доступне через ін’єктований runtime plugin як `runtime.channel.turn.*`. Тип runtime plugin експортується з `openclaw/plugin-sdk/core`, тому сторонні native plugins можуть використовувати ці точки входу так само, як і вбудовані plugins каналів.
</Info>

## Навіщо спільне ядро

Plugins каналів повторюють той самий вхідний потік: нормалізувати, маршрутизувати, пропустити через gates, побудувати контекст, записати metadata сесії, диспетчеризувати хід агента, фіналізувати стан доставки. Без спільного ядра зміни в gating згадок, відповідях, видимих лише для інструментів, metadata сесії, pending history або фіналізації диспетчеризації довелося б застосовувати окремо для кожного каналу.

Ядро навмисно тримає чотири поняття окремо:

- `ConversationFacts`: звідки надійшло повідомлення
- `RouteFacts`: який агент і сесія мають його обробити
- `ReplyPlanFacts`: куди мають надходити видимі відповіді
- `MessageFacts`: який текст і додатковий контекст має побачити агент

Slack DM, теми Telegram, threads Matrix і тематичні сесії Feishu на практиці розрізняють усе це. Якщо трактувати їх як один ідентифікатор, з часом виникає розбіжність.

## Життєвий цикл етапів

Ядро виконує той самий фіксований pipeline незалежно від каналу:

1. `ingest` -- adapter перетворює raw-подію платформи на `NormalizedTurnInput`
2. `classify` -- adapter оголошує, чи може ця подія почати хід агента
3. `preflight` -- adapter виконує дедуплікацію, self-echo, hydration, debounce, decryption, часткове попереднє заповнення фактів
4. `resolve` -- adapter повертає повністю зібраний хід (route, reply plan, message, delivery)
5. `authorize` -- до зібраних фактів застосовується політика DM, груп, згадок і команд
6. `assemble` -- `FinalizedMsgContext` будується з фактів через `buildContext`
7. `record` -- metadata вхідної сесії та last route зберігаються
8. `dispatch` -- хід агента виконується через buffered block dispatcher
9. `finalize` -- adapter `onFinalize` виконується навіть у разі помилки dispatch

Кожен етап emits структуровану подію log, якщо передано callback `log`. Див. [Спостережуваність](#observability).

## Види admission

Ядро не кидає помилку, коли хід gated. Воно повертає `ChannelTurnAdmission`:

| Вид           | Коли                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Хід допущено. Хід агента виконується, і шлях видимої відповіді задіяно.                                                                     |
| `observeOnly` | Хід виконується від початку до кінця, але adapter доставки не надсилає нічого видимого. Використовується для broadcast observer agents та інших пасивних multi-agent потоків. |
| `handled`     | Подію платформи оброблено локально (життєвий цикл, реакція, кнопка, модальне вікно). Ядро пропускає dispatch.                               |
| `drop`        | Шлях пропуску. За бажанням `recordHistory: true` зберігає повідомлення в pending group history, щоб майбутня згадка мала контекст.           |

Admission може надходити з `classify` (клас події сказав, що вона не може почати хід), з `preflight` (дедуплікація, self-echo, відсутня згадка із записом history) або безпосередньо з `resolveTurn`.

## Точки входу

Runtime exposes три бажані точки входу, щоб adapters могли підключатися на рівні, який відповідає каналу.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Два старіші helpers runtime залишаються доступними для сумісності з Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Використовуйте, коли ваш канал може виразити свій вхідний потік як `ChannelTurnAdapter<TRaw>`. Adapter має callbacks для `ingest`, optional `classify`, optional `preflight`, mandatory `resolveTurn` і optional `onFinalize`.

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

`run` — правильна форма, коли канал має невелику adapter logic і виграє від володіння життєвим циклом через hooks.

### runAssembled

Використовуйте, коли канал уже розв’язав routing, побудував `FinalizedMsgContext`
і потребує лише спільного порядку record, reply-pipeline, dispatch і finalize.
Це бажана форма для простих вбудованих вхідних шляхів, які інакше повторювали б
boilerplate `createChannelMessageReplyPipeline(...)` і
`runPrepared(...)`.

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

Обирайте `runAssembled` замість `runPrepared`, коли єдина channel-owned dispatch
поведінка — це фінальна доставка payload плюс optional typing, reply options, durable
delivery або error logging.

### runPrepared

Використовуйте, коли канал має складний локальний dispatcher із previews, retries, edits або thread bootstrap, який має залишатися у власності каналу. Ядро все одно записує вхідну сесію перед dispatch і повертає уніфікований `DispatchedChannelTurnResult`.

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

Багаті канали (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) використовують `runPrepared`, бо їхній dispatcher оркеструє специфічну для платформи поведінку, про яку ядро не має дізнаватися.

### buildContext

Чиста функція, що maps bundles фактів у `FinalizedMsgContext`. Використовуйте її, коли ваш канал вручну реалізує частину pipeline, але хоче послідовну форму context.

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

`buildContext` також корисний всередині callbacks `resolveTurn` під час складання ходу для `run`.

<Note>
  Deprecated SDK helpers, як-от `dispatchInboundReplyWithBase`, досі мостяться через assembled-turn helper. Новий код plugin має використовувати `run` або `runPrepared`.
</Note>

## Типи фактів

Факти, які ядро споживає з вашого adapter, platform-agnostic. Перетворюйте об’єкти платформи на ці форми перед передаванням їх ядру.

### NormalizedTurnInput

| Поле             | Призначення                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Стабільний id повідомлення, що використовується для дедуплікації та logs     |
| `timestamp`       | Optional epoch ms                                                            |
| `rawText`         | Тіло у вигляді, отриманому від платформи                                      |
| `textForAgent`    | Optional очищене тіло для агента (mention strip, typing trim)                |
| `textForCommands` | Optional тіло, що використовується для parsing `/command`                    |
| `raw`             | Optional pass-through reference для callbacks adapter, яким потрібен оригінал |

### ChannelEventClass

| Поле                  | Призначення                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Якщо false, ядро повертає `{ kind: "handled" }`                        |
| `requiresImmediateAck` | Hint для adapters, яким потрібно ACK перед dispatch                    |

### SenderFacts

| Поле          | Призначення                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | Стабільний platform sender id                                  |
| `name`         | Display name                                                   |
| `username`     | Handle, якщо відрізняється від `name`                          |
| `tag`          | Дискримінатор у стилі Discord або platform tag                 |
| `roles`        | Role ids, що використовуються для member-role allowlist matching |
| `isBot`        | True, коли sender є відомим bot (ядро використовує для dropping) |
| `isSelf`       | True, коли sender є самим налаштованим агентом                 |
| `displayLabel` | Попередньо відрендерений label для envelope text               |

### ConversationFacts

| Поле             | Призначення                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` або `channel`                                      |
| `id`              | Conversation id, що використовується для routing                     |
| `label`           | Людський label для envelope                                          |
| `spaceId`         | Optional зовнішній space identifier (Slack workspace, Matrix homeserver) |
| `parentId`        | Зовнішній conversation id, коли це thread                            |
| `threadId`        | Thread id, коли це повідомлення всередині thread                     |
| `nativeChannelId` | Platform-native channel id, коли відрізняється від routing id        |
| `routePeer`       | Peer, що використовується для lookup `resolveAgentRoute`             |

### RouteFacts

| Поле                    | Призначення                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `agentId`               | Агент, який має обробити цей хід                             |
| `accountId`             | Необов’язкове перевизначення (канали з кількома обліковими записами) |
| `routeSessionKey`       | Ключ сесії, який використовується для маршрутизації          |
| `dispatchSessionKey`    | Ключ сесії, який використовується під час dispatch, коли він відрізняється від ключа маршруту |
| `persistedSessionKey`   | Ключ сесії, записаний у збережені метадані сесії             |
| `parentSessionKey`      | Батьківська сесія для розгалужених/потокових сесій           |
| `modelParentSessionKey` | Батьківська сесія з боку моделі для розгалужених сесій       |
| `mainSessionKey`        | Основне прив’язування власника DM для прямих розмов          |
| `createIfMissing`       | Дозволяє етапу запису створити відсутній рядок сесії         |

### ReplyPlanFacts

| Поле                      | Призначення                                              |
| ------------------------- | -------------------------------------------------------- |
| `to`                      | Логічна ціль відповіді, записана в контекст `To`         |
| `originatingTo`           | Початкова ціль контексту (`OriginatingTo`)               |
| `nativeChannelId`         | Нативний для платформи ідентифікатор каналу для доставки |
| `replyTarget`             | Кінцеве видиме місце призначення відповіді, якщо воно відрізняється від `to` |
| `deliveryTarget`          | Нижчорівневе перевизначення доставки                     |
| `replyToId`               | Ідентифікатор процитованого/закріпленого повідомлення    |
| `replyToIdFull`           | Повна форма процитованого ідентифікатора, коли платформа має обидві |
| `messageThreadId`         | Ідентифікатор треду під час доставки                     |
| `threadParentId`          | Ідентифікатор батьківського повідомлення треду           |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` або `none`        |

### AccessFacts

`AccessFacts` переносить булеві значення, потрібні етапу авторизації. Зіставлення ідентичності залишається в каналі: ядро лише споживає результат.

| Поле       | Призначення                                                            |
| ---------- | ---------------------------------------------------------------------- |
| `dm`       | Рішення щодо дозволу/спарювання/заборони DM і список `allowFrom`       |
| `group`    | Політика групи, дозвіл маршруту, дозвіл відправника, allowlist, вимога згадки |
| `commands` | Авторизація команд серед налаштованих авторизаторів                    |
| `mentions` | Чи можливе виявлення згадок і чи було згадано агента                   |

### MessageFacts

| Поле             | Призначення                                                   |
| ---------------- | ------------------------------------------------------------- |
| `body`           | Кінцеве тіло envelope (відформатоване)                        |
| `rawBody`        | Сире вхідне тіло                                              |
| `bodyForAgent`   | Тіло, яке бачить агент                                        |
| `commandBody`    | Тіло, що використовується для розбору команд                  |
| `envelopeFrom`   | Попередньо відрендерена мітка відправника для envelope        |
| `senderLabel`    | Необов’язкове перевизначення для відрендереного відправника   |
| `preview`        | Короткий відредагований попередній перегляд для журналів      |
| `inboundHistory` | Останні записи вхідної історії, коли канал зберігає буфер     |

### SupplementalContextFacts

Додатковий контекст охоплює контекст цитування, пересилання та bootstrap треду. Ядро застосовує налаштовану політику `contextVisibility`. Адаптер каналу надає лише факти й прапорці `senderAllowed`, щоб політика між каналами залишалася узгодженою.

### InboundMediaFacts

Медіа мають форму фактів. Завантаження з платформи, автентифікація, політика SSRF, правила CDN і дешифрування залишаються локальними для каналу. Ядро зіставляє факти з `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` і `MediaTranscribedIndexes`.

## Контракт адаптера

Для повного `run` форма адаптера така:

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

`resolveTurn` повертає `ChannelTurnResolved`, тобто `AssembledChannelTurn` з необов’язковим типом admission. Повернення `{ admission: { kind: "observeOnly" } }` запускає хід без створення видимого виводу. Адаптер усе ще володіє callback доставки; він просто стає no-op для цього ходу.

`onFinalize` виконується для кожного результату, включно з помилками dispatch. Використовуйте його, щоб очищати очікувану історію групи, прибирати реакції ack, зупиняти індикатори статусу та скидати локальний стан.

## Адаптер доставки

Ядро не викликає платформу напряму. Канал передає ядру `ChannelTurnDeliveryAdapter`:

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

`deliver` викликається один раз для кожного буферизованого фрагмента відповіді. Під час міграції життєвого циклу повідомлень доставка зібраного ходу каналу за замовчуванням належить каналу: пропущене поле `durable` означає, що ядро має викликати `deliver` напряму й не має маршрутизувати через загальну вихідну доставку. Установлюйте `durable` лише після аудиту каналу, який доводить, що загальний шлях надсилання зберігає стару поведінку доставки, включно з цілями відповіді/треду, обробкою медіа, кешами надісланих повідомлень/self-echo, очищенням статусу та повернутими ідентифікаторами повідомлень. `durable: false` залишається сумісним написанням для "використовувати callback, що належить каналу", але немігрованим каналам не потрібно його додавати. Повертайте ідентифікатори повідомлень платформи, коли канал їх має, щоб диспетчер міг зберігати прив’язки тредів і редагувати пізніші фрагменти; новіші шляхи доставки також мають повертати `receipt`, щоб відновлення, фіналізація попереднього перегляду та пригнічення дублікатів могли відійти від `messageIds`. Для ходів лише зі спостереженням повертайте `{ visibleReplySent: false }` або використовуйте `createNoopChannelTurnDeliveryAdapter()`.

Канали, що використовують `runPrepared` з диспетчером, який повністю належить каналу, не мають `ChannelTurnDeliveryAdapter`. Такі диспетчери не є durable за замовчуванням. Вони мають зберігати свій прямий шлях доставки, доки явно не ввімкнуть новий контекст надсилання з повною ціллю, replay-safe адаптером, контрактом receipt і хуками побічних ефектів каналу.

Публічні помічники сумісності, як-от `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, і помічники direct-DM мають зберігати поведінку під час міграції. Вони не мають викликати загальну durable-доставку перед callback `deliver` або `reply`, що належать викликачеві.

## Параметри запису

Етап запису обгортає `recordInboundSession`. Більшість каналів можуть використовувати значення за замовчуванням. Перевизначайте через `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Диспетчер очікує на етап запису. Якщо запис викидає помилку, ядро запускає `onPreDispatchFailure` (коли його передано в `runPrepared`) і повторно викидає помилку.

## Спостережуваність

Кожен етап видає структуровану подію, коли надано callback `log`:

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

Зареєстровані етапи: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Уникайте журналювання сирих тіл; використовуйте `MessageFacts.preview` для коротких відредагованих попередніх переглядів.

## Що залишається локальним для каналу

Ядро володіє оркестрацією. Канал усе ще володіє:

- Транспорти платформи (Gateway, REST, websocket, polling, webhooks)
- Розв’язання ідентичності та зіставлення відображуваних імен
- Нативні команди, slash-команди, autocomplete, модальні вікна, кнопки, голосовий стан
- Рендеринг карток, модальних вікон і adaptive-card
- Автентифікація медіа, правила CDN, зашифровані медіа, транскрипція
- API редагування, реакцій, редагування з приховуванням і presence
- Backfill і отримання історії з боку платформи
- Потоки спарювання, що потребують специфічної для платформи перевірки

Якщо двом каналам починає бути потрібен той самий помічник для одного з цих пунктів, винесіть спільний помічник SDK замість того, щоб переносити його в ядро.

## Стабільність

`runtime.channel.turn.*` є частиною публічної runtime-поверхні plugin. Типи фактів (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) і форми admission (`ChannelTurnAdmission`, `ChannelEventClass`) доступні через `PluginRuntime` з `openclaw/plugin-sdk/core`.

Застосовуються правила зворотної сумісності: нові поля фактів є додатковими, типи admission не перейменовуються, а назви точок входу залишаються стабільними. Нові потреби каналу, що вимагають неадитивної зміни, мають пройти процес міграції plugin SDK.

## Пов’язане

- [Рефакторинг життєвого циклу повідомлень](/uk/concepts/message-lifecycle-refactor) для запланованого життєвого циклу надсилання/отримання/live, який обгорне це ядро
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins) для ширшого контракту channel plugin
- [Помічники runtime plugin](/uk/plugins/sdk-runtime) для інших поверхонь `runtime.*`
- [Внутрішня архітектура plugin](/uk/plugins/architecture-internals) для конвеєра завантаження та механіки registry
