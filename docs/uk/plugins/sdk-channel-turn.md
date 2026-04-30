---
read_when:
    - Ви створюєте Plugin каналу й хочете використовувати спільний життєвий цикл вхідного кроку взаємодії
    - Ви переносите монітор каналу з самописного коду-зв’язки для запису/диспетчеризації
    - Потрібно розуміти етапи допуску, приймання, класифікації, попередньої перевірки, розв’язання, запису, диспетчеризації та завершення
sidebarTitle: Channel turn
summary: runtime.channel.turn -- спільне ядро вхідних ходів, яке вбудовані та сторонні плагіни каналів використовують для запису, диспетчеризації та фіналізації ходів агента
title: Ядро ходу каналу
x-i18n:
    generated_at: "2026-04-30T00:42:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Ядро обробки ходу каналу — це спільна вхідна машина станів, яка перетворює нормалізовану подію платформи на хід агента. Плагіни каналів надають факти платформи й callback доставлення. Core володіє оркестрацією: приймання, класифікація, попередня перевірка, розв’язання, авторизація, складання, запис, dispatch і фіналізація.

Використовуйте це, коли ваш плагін перебуває на гарячому шляху вхідного повідомлення. Для подій, що не є повідомленнями (slash-команди, модальні вікна, взаємодії з кнопками, події життєвого циклу, реакції, стан голосу), залишайте їх локальними для плагіна. Ядро володіє лише подіями, які можуть стати текстовим ходом агента.

<Info>
  До ядра звертаються через інʼєктований runtime плагіна як `runtime.channel.turn.*`. Тип runtime плагіна експортується з `openclaw/plugin-sdk/core`, тож сторонні нативні плагіни можуть використовувати ці точки входу так само, як це роблять bundled-плагіни каналів.
</Info>

## Навіщо спільне ядро

Плагіни каналів повторюють той самий вхідний потік: нормалізувати, маршрутизувати, пропустити через gates, побудувати контекст, записати метадані сесії, dispatch ходу агента, фіналізувати стан доставлення. Без спільного ядра зміну в gating згадок, видимих відповідях лише для інструментів, метаданих сесії, pending-історії або фіналізації dispatch потрібно застосовувати окремо для кожного каналу.

Ядро навмисно тримає чотири поняття окремими:

- `ConversationFacts`: звідки надійшло повідомлення
- `RouteFacts`: який агент і яка сесія мають його обробити
- `ReplyPlanFacts`: куди мають іти видимі відповіді
- `MessageFacts`: яке тіло й додатковий контекст має бачити агент

Slack DM, теми Telegram, потоки Matrix і topic-сесії Feishu на практиці розрізняють усе це. Якщо трактувати їх як один ідентифікатор, з часом виникає drift.

## Життєвий цикл етапів

Ядро виконує той самий фіксований pipeline незалежно від каналу:

1. `ingest` -- адаптер перетворює raw-подію платформи на `NormalizedTurnInput`
2. `classify` -- адаптер оголошує, чи може ця подія почати хід агента
3. `preflight` -- адаптер виконує dedupe, self-echo, hydration, debounce, decryption, часткове попереднє заповнення фактів
4. `resolve` -- адаптер повертає повністю зібраний хід (route, reply plan, message, delivery)
5. `authorize` -- політика DM, group, mention і command застосовується до зібраних фактів
6. `assemble` -- `FinalizedMsgContext` будується з фактів через `buildContext`
7. `record` -- зберігаються метадані вхідної сесії та останній route
8. `dispatch` -- хід агента виконується через buffered block dispatcher
9. `finalize` -- adapter `onFinalize` виконується навіть у разі помилки dispatch

Кожен етап emits структуровану подію журналу, коли надано callback `log`. Див. [Спостережуваність](#observability).

## Види допуску

Ядро не кидає помилку, коли хід відхиляється gate. Воно повертає `ChannelTurnAdmission`:

| Вид           | Коли                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Хід допущено. Хід агента запускається, і шлях видимої відповіді виконується.                                                                 |
| `observeOnly` | Хід виконується end-to-end, але delivery-адаптер не надсилає нічого видимого. Використовується для broadcast observer-агентів та інших пасивних multi-agent потоків. |
| `handled`     | Подію платформи було оброблено локально (життєвий цикл, реакція, кнопка, модальне вікно). Ядро пропускає dispatch.                         |
| `drop`        | Шлях пропуску. Опційно `recordHistory: true` зберігає повідомлення в pending group history, щоб майбутня згадка мала контекст.              |

Допуск може надходити з `classify` (клас події сказав, що вона не може почати хід), з `preflight` (dedupe, self-echo, відсутня згадка із записом історії) або безпосередньо з `resolveTurn`.

## Точки входу

Runtime надає три бажані точки входу, щоб адаптери могли підключатися на рівні, який відповідає каналу.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Два старіші runtime helpers залишаються доступними для сумісності з Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Використовуйте, коли ваш канал може виразити свій вхідний потік як `ChannelTurnAdapter<TRaw>`. Адаптер має callbacks для `ingest`, необовʼязкового `classify`, необовʼязкового `preflight`, обовʼязкового `resolveTurn` і необовʼязкового `onFinalize`.

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

`run` — правильна форма, коли канал має невелику логіку адаптера й виграє від володіння життєвим циклом через hooks.

### runPrepared

Використовуйте, коли канал має складний локальний dispatcher із previews, retries, edits або thread bootstrap, які мають залишатися у власності каналу. Ядро все одно записує вхідну сесію перед dispatch і повертає уніфікований `DispatchedChannelTurnResult`.

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

Rich channels (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) використовують `runPrepared`, тому що їхній dispatcher оркеструє platform-specific поведінку, про яку ядро не повинно знати.

### buildContext

Чиста функція, яка відображає bundles фактів у `FinalizedMsgContext`. Використовуйте її, коли ваш канал hand-rolls частину pipeline, але хоче узгоджену форму контексту.

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

`buildContext` також корисний усередині callbacks `resolveTurn` під час складання ходу для `run`.

<Note>
  Застарілі SDK helpers, як-от `dispatchInboundReplyWithBase`, досі bridge through assembled-turn helper. Новий код плагіна має використовувати `run` або `runPrepared`.
</Note>

## Типи фактів

Факти, які ядро споживає з вашого адаптера, не залежать від платформи. Перекладайте обʼєкти платформи в ці форми, перш ніж передавати їх ядру.

### NormalizedTurnInput

| Поле             | Призначення                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `id`             | Стабільний message id, що використовується для dedupe і журналів             |
| `timestamp`      | Необовʼязкові epoch ms                                                       |
| `rawText`        | Тіло в тому вигляді, у якому його отримано від платформи                     |
| `textForAgent`   | Необовʼязкове очищене тіло для агента (mention strip, typing trim)           |
| `textForCommands` | Необовʼязкове тіло, що використовується для парсингу `/command`             |
| `raw`            | Необовʼязкове pass-through посилання для callbacks адаптера, яким потрібен оригінал |

### ChannelEventClass

| Поле                   | Призначення                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Якщо false, ядро повертає `{ kind: "handled" }`                        |
| `requiresImmediateAck` | Підказка для адаптерів, яким потрібно ACK перед dispatch               |

### SenderFacts

| Поле          | Призначення                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `id`          | Стабільний sender id платформи                                         |
| `name`        | Відображуване імʼя                                                     |
| `username`    | Handle, якщо відрізняється від `name`                                  |
| `tag`         | Дискримінатор у стилі Discord або тег платформи                        |
| `roles`       | Role ids, що використовуються для зіставлення member-role allowlist    |
| `isBot`       | True, коли відправник є відомим ботом (ядро використовує для dropping) |
| `isSelf`      | True, коли відправник є самим налаштованим агентом                     |
| `displayLabel` | Попередньо відрендерений label для envelope-тексту                   |

### ConversationFacts

| Поле              | Призначення                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `kind`            | `direct`, `group` або `channel`                                        |
| `id`              | Conversation id, що використовується для routing                       |
| `label`           | Людський label для envelope                                            |
| `spaceId`         | Необовʼязковий outer space identifier (Slack workspace, Matrix homeserver) |
| `parentId`        | Outer conversation id, коли це thread                                  |
| `threadId`        | Thread id, коли це повідомлення всередині thread                       |
| `nativeChannelId` | Platform-native channel id, коли відрізняється від routing id          |
| `routePeer`       | Peer, що використовується для lookup `resolveAgentRoute`               |

### RouteFacts

| Поле                    | Призначення                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `agentId`               | Агент, який має обробити цей хід                               |
| `accountId`             | Необовʼязковий override (multi-account channels)               |
| `routeSessionKey`       | Session key, що використовується для routing                   |
| `dispatchSessionKey`    | Session key, що використовується під час dispatch, коли відрізняється від route key |
| `persistedSessionKey`   | Session key, що записується в persisted session metadata       |
| `parentSessionKey`      | Parent для branched/threaded sessions                          |
| `modelParentSessionKey` | Model-side parent для branched sessions                        |
| `mainSessionKey`        | Main DM owner pin для direct conversations                      |
| `createIfMissing`       | Дозволити етапу record створити відсутній session row          |

### ReplyPlanFacts

| Поле                      | Призначення                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `to`                      | Логічна ціль відповіді, записана в контекст `To`               |
| `originatingTo`           | Початкова ціль контексту (`OriginatingTo`)                     |
| `nativeChannelId`         | Нативний для платформи ідентифікатор каналу для доставлення    |
| `replyTarget`             | Кінцеве місце призначення видимої відповіді, якщо воно відрізняється від `to` |
| `deliveryTarget`          | Нижчорівневе перевизначення доставлення                        |
| `replyToId`               | Ідентифікатор процитованого/прив’язаного повідомлення          |
| `replyToIdFull`           | Повна форма процитованого ідентифікатора, коли платформа має обидві |
| `messageThreadId`         | Ідентифікатор треду на момент доставлення                      |
| `threadParentId`          | Ідентифікатор батьківського повідомлення треду                 |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` або `none`              |

### AccessFacts

`AccessFacts` містить булеві значення, потрібні етапу авторизації. Зіставлення ідентичності залишається в каналі: ядро лише споживає результат.

| Поле       | Призначення                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Рішення дозволити/спарувати/заборонити DM і список `allowFrom`            |
| `group`    | Політика групи, дозвіл маршруту, дозвіл відправника, allowlist, вимога згадки |
| `commands` | Авторизація команд у налаштованих авторизаторах                          |
| `mentions` | Чи можливе виявлення згадки та чи було згадано агента                    |

### MessageFacts

| Поле             | Призначення                                                    |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Кінцеве тіло конверта (відформатоване)                         |
| `rawBody`        | Сире вхідне тіло                                               |
| `bodyForAgent`   | Тіло, яке бачить агент                                         |
| `commandBody`    | Тіло, використане для розбору команд                           |
| `envelopeFrom`   | Попередньо відрендерена мітка відправника для конверта         |
| `senderLabel`    | Необов’язкове перевизначення для відрендереного відправника    |
| `preview`        | Короткий редагований попередній перегляд для журналів          |
| `inboundHistory` | Останні записи вхідної історії, коли канал зберігає буфер      |

### SupplementalContextFacts

Додатковий контекст охоплює контекст цитати, пересланого повідомлення та початкового завантаження треду. Ядро застосовує налаштовану політику `contextVisibility`. Адаптер каналу надає лише факти та прапорці `senderAllowed`, щоб політика між каналами залишалася узгодженою.

### InboundMediaFacts

Медіа мають форму фактів. Завантаження з платформи, авторизація, політика SSRF, правила CDN і розшифрування залишаються локальними для каналу. Ядро перетворює факти на `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` і `MediaTranscribedIndexes`.

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

`resolveTurn` повертає `ChannelTurnResolved`, тобто `AssembledChannelTurn` з необов’язковим типом допуску. Повернення `{ admission: { kind: "observeOnly" } }` запускає хід без створення видимого виводу. Адаптер усе ще володіє callback доставлення; для цього ходу він просто стає no-op.

`onFinalize` виконується для кожного результату, включно з помилками диспетчеризації. Використовуйте його, щоб очищати очікувану групову історію, прибирати реакції підтвердження, зупиняти індикатори стану та скидати локальний стан.

## Адаптер доставлення

Ядро не викликає платформу напряму. Канал передає ядру `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` викликається один раз для кожного буферизованого фрагмента відповіді. Повертайте ідентифікатори повідомлень платформи, коли канал їх має, щоб диспетчер міг зберігати прив’язки тредів і редагувати пізніші фрагменти. Для ходів лише зі спостереженням повертайте `{ visibleReplySent: false }` або використовуйте `createNoopChannelTurnDeliveryAdapter()`.

## Параметри запису

Етап запису обгортає `recordInboundSession`. Більшість каналів можуть використовувати типові значення. Перевизначайте через `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Диспетчер очікує завершення етапу запису. Якщо запис викидає помилку, ядро запускає `onPreDispatchFailure` (коли його передано до `runPrepared`) і повторно викидає помилку.

## Спостережуваність

Кожен етап випромінює структуровану подію, коли надано callback `log`:

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

Етапи журналювання: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Уникайте журналювання сирих тіл; використовуйте `MessageFacts.preview` для коротких редагованих попередніх переглядів.

## Що залишається локальним для каналу

Ядро володіє оркестрацією. Канал усе ще володіє:

- Транспортами платформи (gateway, REST, websocket, polling, webhooks)
- Розв’язанням ідентичності та зіставленням відображуваних імен
- Нативними командами, slash-командами, автодоповненням, модальними вікнами, кнопками, голосовим станом
- Рендерингом карток, модальних вікон і adaptive-card
- Авторизацією медіа, правилами CDN, зашифрованими медіа, транскрипцією
- API редагування, реакцій, редагування/приховування та присутності
- Backfill і отриманням історії на боці платформи
- Потоками спарування, які потребують специфічної для платформи перевірки

Якщо двом каналам починає бути потрібен той самий helper для одного з цих пунктів, винесіть спільний SDK helper замість проштовхування його в ядро.

## Стабільність

`runtime.channel.turn.*` є частиною публічної поверхні runtime Plugin. Типи фактів (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) і форми допуску (`ChannelTurnAdmission`, `ChannelEventClass`) доступні через `PluginRuntime` з `openclaw/plugin-sdk/core`.

Застосовуються правила зворотної сумісності: нові поля фактів є додатковими, типи допуску не перейменовуються, а назви точок входу залишаються стабільними. Нові потреби каналу, які вимагають неадитивної зміни, мають проходити через процес міграції SDK Plugin.

## Пов’язане

- [Створення plugins каналів](/uk/plugins/sdk-channel-plugins) для ширшого контракту plugin каналу
- [Runtime helpers Plugin](/uk/plugins/sdk-runtime) для інших поверхонь `runtime.*`
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals) для конвеєра завантаження та механіки реєстру
