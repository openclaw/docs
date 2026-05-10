---
read_when:
    - در حال ساخت یک Plugin کانال هستید و چرخهٔ حیات مشترک نوبت ورودی را می‌خواهید
    - شما در حال انتقال یک پایشگر کانال از کد چسبیِ ثبت/ارسالِ دست‌ساز هستید
    - باید مراحل پذیرش، دریافت، طبقه‌بندی، پیش‌بررسی، حل‌وفصل، ثبت، ارسال و نهایی‌سازی را درک کنید.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- هستهٔ مشترک نوبت ورودی که Pluginهای کانالِ همراه و شخص ثالث برای ثبت، ارسال و نهایی‌سازی نوبت‌های عامل از آن استفاده می‌کنند
title: هستهٔ نوبت کانال
x-i18n:
    generated_at: "2026-05-10T19:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

هستهٔ نوبت کانال، ماشین حالت ورودی مشترکی است که یک رویداد عادی‌سازی‌شدهٔ پلتفرم را به یک نوبت عامل تبدیل می‌کند. Pluginهای کانال، واقعیت‌های پلتفرم و callback تحویل را فراهم می‌کنند. بخش مرکزی مالک ارکستراسیون است: دریافت، دسته‌بندی، پیش‌پرواز، حل، مجوزدهی، سرهم‌بندی، ثبت، dispatch، و نهایی‌سازی.

وقتی Plugin شما در مسیر داغ پیام ورودی قرار دارد از این استفاده کنید. برای رویدادهای غیرپیامی (دستورهای اسلش، modalها، تعامل‌های دکمه‌ای، رویدادهای چرخهٔ عمر، واکنش‌ها، وضعیت صوتی)، آن‌ها را محلیِ Plugin نگه دارید. هسته فقط مالک رویدادهایی است که ممکن است به یک نوبت متنی عامل تبدیل شوند.

<Info>
  هسته از طریق زمان اجرای Plugin تزریق‌شده به صورت `runtime.channel.turn.*` در دسترس است. نوع زمان اجرای Plugin از `openclaw/plugin-sdk/core` export می‌شود، بنابراین Pluginهای native شخص ثالث می‌توانند از این entry pointها همان‌طور استفاده کنند که Pluginهای کانال bundled استفاده می‌کنند.
</Info>

## چرا یک هستهٔ مشترک

Pluginهای کانال همان جریان ورودی را تکرار می‌کنند: عادی‌سازی، مسیریابی، اعمال gate، ساخت context، ثبت metadata جلسه، dispatch نوبت عامل، و نهایی‌سازی وضعیت تحویل. بدون یک هستهٔ مشترک، تغییر در gate کردن mention، پاسخ‌های قابل مشاهدهٔ فقط ابزار، metadata جلسه، تاریخچهٔ pending، یا نهایی‌سازی dispatch باید برای هر کانال جداگانه اعمال شود.

هسته چهار مفهوم را عمدا جدا نگه می‌دارد:

- `ConversationFacts`: پیام از کجا آمده است
- `RouteFacts`: کدام عامل و جلسه باید آن را پردازش کند
- `ReplyPlanFacts`: پاسخ‌های قابل مشاهده باید به کجا بروند
- `MessageFacts`: عامل باید چه بدنه و context تکمیلی را ببیند

DMهای Slack، موضوع‌های Telegram، threadهای Matrix، و جلسه‌های موضوعی Feishu همگی در عمل این‌ها را از هم متمایز می‌کنند. یکی گرفتن آن‌ها به عنوان یک شناسه باعث drift در طول زمان می‌شود.

## چرخهٔ عمر مرحله‌ها

هسته بدون توجه به کانال، همان pipeline ثابت را اجرا می‌کند:

1. `ingest` -- آداپتر یک رویداد خام پلتفرم را به `NormalizedTurnInput` تبدیل می‌کند
2. `classify` -- آداپتر اعلام می‌کند آیا این رویداد می‌تواند یک نوبت عامل را شروع کند یا نه
3. `preflight` -- آداپتر dedupe، self-echo، hydration، debounce، رمزگشایی، و پیش‌پر کردن جزئی واقعیت‌ها را انجام می‌دهد
4. `resolve` -- آداپتر یک نوبت کاملا سرهم‌بندی‌شده را برمی‌گرداند (route، طرح پاسخ، پیام، تحویل)
5. `authorize` -- سیاست DM، گروه، mention، و دستور روی واقعیت‌های سرهم‌بندی‌شده اعمال می‌شود
6. `assemble` -- `FinalizedMsgContext` از واقعیت‌ها از طریق `buildContext` ساخته می‌شود
7. `record` -- metadata جلسهٔ ورودی و آخرین route ماندگار می‌شوند
8. `dispatch` -- نوبت عامل از طریق dispatch کنندهٔ block بافرشده اجرا می‌شود
9. `finalize` -- `onFinalize` آداپتر حتی در صورت خطای dispatch هم اجرا می‌شود

وقتی callback مربوط به `log` فراهم شده باشد، هر مرحله یک رویداد log ساختاریافته emit می‌کند. [مشاهده‌پذیری](#observability) را ببینید.

## گونه‌های پذیرش

هسته وقتی یک نوبت gate می‌شود خطا نمی‌اندازد. یک `ChannelTurnAdmission` برمی‌گرداند:

| نوع           | زمان                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | نوبت پذیرفته می‌شود. نوبت عامل اجرا می‌شود و مسیر پاسخ قابل مشاهده به کار گرفته می‌شود.                                                     |
| `observeOnly` | نوبت end-to-end اجرا می‌شود اما آداپتر تحویل هیچ چیز قابل مشاهده‌ای ارسال نمی‌کند. برای عامل‌های ناظر broadcast و دیگر جریان‌های passive چندعاملی استفاده می‌شود. |
| `handled`     | یک رویداد پلتفرم به صورت محلی مصرف شده است (چرخهٔ عمر، واکنش، دکمه، modal). هسته dispatch را رد می‌کند.                                    |
| `drop`        | مسیر رد شدن. به صورت اختیاری `recordHistory: true` پیام را در تاریخچهٔ گروه pending نگه می‌دارد تا mention آینده context داشته باشد.         |

پذیرش می‌تواند از `classify` (کلاس رویداد گفته است که نمی‌تواند یک نوبت را شروع کند)، از `preflight` (dedupe، self-echo، نبود mention همراه با ثبت تاریخچه)، یا از خود `resolveTurn` بیاید.

## Entry pointها

زمان اجرا سه entry point ترجیحی را expose می‌کند تا آداپترها بتوانند در سطحی که با کانال سازگار است opt in کنند.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

دو helper قدیمی‌تر زمان اجرا برای سازگاری Plugin SDK همچنان در دسترس‌اند:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

وقتی کانال شما می‌تواند جریان ورودی خود را به صورت یک `ChannelTurnAdapter<TRaw>` بیان کند از این استفاده کنید. آداپتر callbackهایی برای `ingest`، `classify` اختیاری، `preflight` اختیاری، `resolveTurn` اجباری، و `onFinalize` اختیاری دارد.

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

`run` وقتی شکل درست است که کانال منطق آداپتر کوچکی دارد و از مالکیت چرخهٔ عمر از طریق hookها سود می‌برد.

### runAssembled

وقتی کانال از قبل routing را حل کرده، یک `FinalizedMsgContext` ساخته،
و فقط به ترتیب مشترک ثبت، reply-pipeline، dispatch، و finalize نیاز دارد
از این استفاده کنید. این شکل ترجیحی برای مسیرهای ورودی سادهٔ bundled است که
در غیر این صورت boilerplate مربوط به `createChannelMessageReplyPipeline(...)` و
`runPrepared(...)` را تکرار می‌کردند.

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

وقتی تنها رفتار dispatch تحت مالکیت کانال، تحویل payload نهایی به علاوهٔ typing اختیاری، گزینه‌های پاسخ، تحویل durable، یا logging خطاست، `runAssembled` را به `runPrepared` ترجیح دهید.

### runPrepared

وقتی کانال یک dispatch کنندهٔ محلی پیچیده با previewها، retryها، editها، یا bootstrap thread دارد که باید تحت مالکیت کانال بماند از این استفاده کنید. هسته همچنان جلسهٔ ورودی را پیش از dispatch ثبت می‌کند و یک `DispatchedChannelTurnResult` یکنواخت را سطح‌بندی می‌کند.

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

کانال‌های rich (Matrix، Mattermost، Microsoft Teams، Feishu، QQ Bot) از `runPrepared` استفاده می‌کنند چون dispatch کنندهٔ آن‌ها رفتاری مخصوص پلتفرم را ارکستره می‌کند که هسته نباید از آن باخبر شود.

### buildContext

تابعی pure که بسته‌های واقعیت را به `FinalizedMsgContext` map می‌کند. وقتی کانال شما بخشی از pipeline را دستی پیاده می‌کند اما شکل context سازگار می‌خواهد از آن استفاده کنید.

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

`buildContext` همچنین داخل callbackهای `resolveTurn` هنگام سرهم‌بندی یک نوبت برای `run` مفید است.

<Note>
  helperهای deprecated مربوط به SDK مانند `dispatchInboundReplyWithBase` همچنان از طریق یک helper نوبت سرهم‌بندی‌شده bridge می‌شوند. کد جدید Plugin باید از `run` یا `runPrepared` استفاده کند.
</Note>

## نوع‌های واقعیت

واقعیت‌هایی که هسته از آداپتر شما مصرف می‌کند مستقل از پلتفرم‌اند. پیش از سپردن objectهای پلتفرم به هسته، آن‌ها را به این شکل‌ها ترجمه کنید.

### NormalizedTurnInput

| فیلد             | هدف                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | شناسهٔ پایدار پیام که برای dedupe و logها استفاده می‌شود                    |
| `timestamp`       | epoch ms اختیاری                                                            |
| `rawText`         | بدنه همان‌طور که از پلتفرم دریافت شده است                                   |
| `textForAgent`    | بدنهٔ پاک‌سازی‌شدهٔ اختیاری برای عامل (حذف mention، کوتاه‌سازی typing)      |
| `textForCommands` | بدنهٔ اختیاری که برای parse کردن `/command` استفاده می‌شود                  |
| `raw`             | reference اختیاری pass-through برای callbackهای آداپتر که به اصل نیاز دارند |

### ChannelEventClass

| فیلد                   | هدف                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`، `command`، `interaction`، `reaction`، `lifecycle`، `unknown` |
| `canStartAgentTurn`    | اگر false باشد هسته `{ kind: "handled" }` را برمی‌گرداند               |
| `requiresImmediateAck` | راهنمایی برای آداپترهایی که باید پیش از dispatch، ACK کنند             |

### SenderFacts

| فیلد           | هدف                                                            |
| -------------- | -------------------------------------------------------------- |
| `id`           | شناسهٔ فرستندهٔ پایدار پلتفرم                                  |
| `name`         | نام نمایشی                                                     |
| `username`     | handle اگر از `name` متمایز باشد                               |
| `tag`          | discriminator سبک Discord یا tag پلتفرم                        |
| `roles`        | شناسه‌های نقش، استفاده‌شده برای تطبیق allowlist نقش عضو         |
| `isBot`        | وقتی فرستنده یک bot شناخته‌شده است true است (هسته برای drop استفاده می‌کند) |
| `isSelf`       | وقتی فرستنده همان عامل پیکربندی‌شده باشد true است              |
| `displayLabel` | برچسب از پیش render شده برای متن envelope                      |

### ConversationFacts

| فیلد              | هدف                                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`، `group`، یا `channel`                                      |
| `id`              | شناسهٔ گفتگو که برای routing استفاده می‌شود                          |
| `label`           | برچسب انسانی برای envelope                                           |
| `spaceId`         | شناسهٔ اختیاری فضای بیرونی (workspace در Slack، homeserver در Matrix) |
| `parentId`        | شناسهٔ گفتگوی بیرونی وقتی این یک thread است                           |
| `threadId`        | شناسهٔ thread وقتی این پیام داخل یک thread است                         |
| `nativeChannelId` | شناسهٔ native کانال در پلتفرم وقتی با شناسهٔ routing متفاوت است       |
| `routePeer`       | Peer استفاده‌شده برای lookup در `resolveAgentRoute`                   |

### RouteFacts

| فیلد                   | هدف                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | عاملی که باید این نوبت را پردازش کند                         |
| `accountId`             | بازنویسی اختیاری (کانال‌های چندحسابی)                 |
| `routeSessionKey`       | کلید جلسه‌ای که برای مسیریابی استفاده می‌شود                               |
| `dispatchSessionKey`    | کلید جلسه‌ای که هنگام ارسال استفاده می‌شود، وقتی با کلید مسیر متفاوت باشد |
| `persistedSessionKey`   | کلید جلسه‌ای که در فرادادهٔ جلسهٔ پایدارشده نوشته می‌شود          |
| `parentSessionKey`      | والد برای جلسه‌های منشعب/رشته‌ای                      |
| `modelParentSessionKey` | والد سمت مدل برای جلسه‌های منشعب                    |
| `mainSessionKey`        | پین مالک DM اصلی برای گفت‌وگوهای مستقیم                 |
| `createIfMissing`       | اجازه به مرحلهٔ ثبت برای ساختن ردیف جلسهٔ گمشده          |

### ReplyPlanFacts

| فیلد                     | هدف                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | مقصد منطقی پاسخ که در زمینهٔ `To` نوشته می‌شود          |
| `originatingTo`           | مقصد زمینهٔ مبدأ (`OriginatingTo`)            |
| `nativeChannelId`         | شناسهٔ کانال بومی پلتفرم برای تحویل                 |
| `replyTarget`             | مقصد نهایی پاسخِ قابل‌مشاهده اگر با `to` متفاوت باشد |
| `deliveryTarget`          | بازنویسی سطح پایین‌تر تحویل                           |
| `replyToId`               | شناسهٔ پیام نقل‌شده/لنگرشده                              |
| `replyToIdFull`           | شناسهٔ کامل نقل‌شده وقتی پلتفرم هر دو را دارد          |
| `messageThreadId`         | شناسهٔ رشته در زمان تحویل                              |
| `threadParentId`          | شناسهٔ پیام والد رشته                         |
| `sourceReplyDeliveryMode` | `thread`، `reply`، `channel`، `direct` یا `none`       |

### AccessFacts

`AccessFacts` بولی‌هایی را حمل می‌کند که مرحلهٔ مجوزدهی نیاز دارد. تطبیق هویت در کانال باقی می‌ماند: هسته فقط نتیجه را مصرف می‌کند.

| فیلد      | هدف                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | تصمیم اجازه/جفت‌سازی/رد DM و فهرست `allowFrom`                       |
| `group`    | سیاست گروه، اجازهٔ مسیر، اجازهٔ فرستنده، فهرست مجاز، الزام منشن   |
| `commands` | مجوزدهی فرمان در میان مجوزدهنده‌های پیکربندی‌شده                       |
| `mentions` | اینکه تشخیص منشن ممکن است یا نه و اینکه عامل منشن شده است یا نه |

### MessageFacts

| فیلد            | هدف                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | بدنهٔ نهایی پوشش (قالب‌بندی‌شده)                                |
| `rawBody`        | بدنهٔ خام ورودی                                               |
| `bodyForAgent`   | بدنه‌ای که عامل می‌بیند                                            |
| `commandBody`    | بدنه‌ای که برای تجزیهٔ فرمان استفاده می‌شود                                  |
| `envelopeFrom`   | برچسب فرستندهٔ ازپیش‌رندرشده برای پوشش                     |
| `senderLabel`    | بازنویسی اختیاری برای فرستندهٔ رندرشده                      |
| `preview`        | پیش‌نمایش کوتاه و ویرایش‌شده برای لاگ‌ها                                |
| `inboundHistory` | ورودی‌های تاریخچهٔ ورودی اخیر وقتی کانال یک بافر نگه می‌دارد |

### SupplementalContextFacts

زمینهٔ تکمیلی، زمینهٔ نقل‌قول، بازفرستاده‌شده و راه‌اندازی رشته را پوشش می‌دهد. هسته سیاست پیکربندی‌شدهٔ `contextVisibility` را اعمال می‌کند. آداپتور کانال فقط واقعیت‌ها و پرچم‌های `senderAllowed` را ارائه می‌دهد تا سیاست میان‌کانالی سازگار بماند.

### InboundMediaFacts

رسانه به‌شکل واقعیت مدل می‌شود. دانلود پلتفرم، احراز هویت، سیاست SSRF، قواعد CDN و رمزگشایی به‌صورت محلی در کانال باقی می‌مانند. هسته واقعیت‌ها را به `MediaPath`، `MediaUrl`، `MediaType`، `MediaPaths`، `MediaUrls`، `MediaTypes` و `MediaTranscribedIndexes` نگاشت می‌کند.

## قرارداد آداپتور

برای `run` کامل، شکل آداپتور این است:

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

`resolveTurn` یک `ChannelTurnResolved` برمی‌گرداند که یک `AssembledChannelTurn` با نوع پذیرش اختیاری است. برگرداندن `{ admission: { kind: "observeOnly" } }` نوبت را بدون تولید خروجی قابل‌مشاهده اجرا می‌کند. آداپتور همچنان مالک callback تحویل است؛ فقط برای آن نوبت به no-op تبدیل می‌شود.

`onFinalize` روی هر نتیجه‌ای اجرا می‌شود، از جمله خطاهای ارسال. از آن برای پاک‌کردن تاریخچهٔ گروه در انتظار، حذف واکنش‌های تأیید، توقف نشانگرهای وضعیت و flush کردن وضعیت محلی استفاده کنید.

## آداپتور تحویل

هسته پلتفرم را مستقیماً فراخوانی نمی‌کند. کانال یک `ChannelTurnDeliveryAdapter` به هسته می‌دهد:

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

`deliver` برای هر تکهٔ پاسخِ بافرشده یک‌بار فراخوانی می‌شود. در طول مهاجرت چرخهٔ عمر پیام، تحویل نوبتِ کانالِ مونتاژشده به‌صورت پیش‌فرض متعلق به کانال است: نبودن فیلد `durable` یعنی هسته باید `deliver` را مستقیماً فراخوانی کند و نباید از مسیر تحویل خروجی عمومی عبور کند. `durable` را فقط پس از آن تنظیم کنید که کانال ممیزی شده باشد تا ثابت شود مسیر ارسال عمومی رفتار تحویل قدیمی را حفظ می‌کند، از جمله مقصدهای پاسخ/رشته، مدیریت رسانه، کش‌های پیام ارسال‌شده/بازتاب خود، پاک‌سازی وضعیت و شناسه‌های پیام برگشتی. `durable: false` همچنان شکل سازگاری برای «استفاده از callback متعلق به کانال» است، اما کانال‌های مهاجرت‌نکرده نباید لازم داشته باشند آن را اضافه کنند. وقتی کانال شناسه‌های پیام پلتفرم را دارد، آن‌ها را برگردانید تا dispatcher بتواند لنگرهای رشته را حفظ کند و تکه‌های بعدی را بعداً ویرایش کند؛ مسیرهای تحویل جدیدتر همچنین باید `receipt` را برگردانند تا بازیابی، نهایی‌سازی پیش‌نمایش و حذف تکراری‌ها بتوانند از `messageIds` جدا شوند. برای نوبت‌های فقط مشاهده، `{ visibleReplySent: false }` را برگردانید یا از `createNoopChannelTurnDeliveryAdapter()` استفاده کنید.

کانال‌هایی که از `runPrepared` با یک dispatcher کاملاً متعلق به کانال استفاده می‌کنند، `ChannelTurnDeliveryAdapter` ندارند. آن dispatcherها به‌صورت پیش‌فرض پایدار نیستند. آن‌ها باید مسیر تحویل مستقیم خود را نگه دارند تا زمانی که صریحاً با مقصد کامل، آداپتور ایمن برای بازپخش، قرارداد رسید و hookهای اثر جانبی کانال، به زمینهٔ ارسال جدید opt in کنند.

کمک‌گرهای سازگاری عمومی مانند `recordInboundSessionAndDispatchReply`، `dispatchInboundReplyWithBase` و کمک‌گرهای DM مستقیم باید در طول مهاجرت رفتار را حفظ کنند. آن‌ها نباید پیش از callbackهای `deliver` یا `reply` متعلق به فراخواننده، تحویل پایدار عمومی را فراخوانی کنند.

## گزینه‌های ثبت

مرحلهٔ ثبت، `recordInboundSession` را دربر می‌گیرد. بیشتر کانال‌ها می‌توانند از پیش‌فرض‌ها استفاده کنند. از طریق `record` بازنویسی کنید:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher منتظر مرحلهٔ ثبت می‌ماند. اگر ثبت خطا بدهد، هسته `onPreDispatchFailure` را اجرا می‌کند (وقتی به `runPrepared` داده شده باشد) و دوباره خطا را پرتاب می‌کند.

## مشاهده‌پذیری

هر مرحله وقتی callback `log` تأمین شود، یک رویداد ساختاریافته منتشر می‌کند:

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

مرحله‌های لاگ‌شده: `ingest`، `classify`، `preflight`، `resolve`، `authorize`، `assemble`، `record`، `dispatch`، `finalize`. از لاگ‌کردن بدنه‌های خام پرهیز کنید؛ برای پیش‌نمایش‌های کوتاه و ویرایش‌شده از `MessageFacts.preview` استفاده کنید.

## آنچه در کانال محلی می‌ماند

هسته مالک هماهنگ‌سازی است. کانال همچنان مالک این موارد است:

- ترابری‌های پلتفرم (Gateway، REST، websocket، polling، webhooks)
- حل هویت و تطبیق نام نمایشی
- فرمان‌های بومی، slash commandها، تکمیل خودکار، modalها، دکمه‌ها، وضعیت صوتی
- رندر کارت، modal و adaptive-card
- احراز هویت رسانه، قواعد CDN، رسانهٔ رمزگذاری‌شده، رونویسی
- APIهای ویرایش، واکنش، ویرایش محتوای حساس و حضور
- پرکردن عقب‌مانده و واکشی تاریخچهٔ سمت پلتفرم
- جریان‌های جفت‌سازی که به راستی‌آزمایی ویژهٔ پلتفرم نیاز دارند

اگر دو کانال برای یکی از این موارد به کمک‌گر یکسانی نیاز پیدا کردند، به‌جای بردن آن به هسته، یک کمک‌گر SDK مشترک استخراج کنید.

## پایداری

`runtime.channel.turn.*` بخشی از سطح عمومی runtime Plugin است. نوع‌های واقعیت (`SenderFacts`، `ConversationFacts`، `RouteFacts`، `ReplyPlanFacts`، `AccessFacts`، `MessageFacts`، `SupplementalContextFacts`، `InboundMediaFacts`) و شکل‌های پذیرش (`ChannelTurnAdmission`، `ChannelEventClass`) از طریق `PluginRuntime` از `openclaw/plugin-sdk/core` قابل دسترسی هستند.

قواعد سازگاری عقب‌رو اعمال می‌شوند: فیلدهای واقعیت جدید افزایشی هستند، نوع‌های پذیرش تغییر نام داده نمی‌شوند و نام‌های نقطهٔ ورود پایدار می‌مانند. نیازهای کانال جدید که به تغییر غیر‌افزایشی نیاز دارند باید از فرایند مهاجرت SDK Plugin عبور کنند.

## مرتبط

- [بازآرایی چرخهٔ عمر پیام](/fa/concepts/message-lifecycle-refactor) برای چرخهٔ عمر برنامه‌ریزی‌شدهٔ ارسال/دریافت/زنده که این هسته را دربر خواهد گرفت
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins) برای قرارداد گسترده‌تر Plugin کانال
- [کمک‌گرهای runtime Plugin](/fa/plugins/sdk-runtime) برای دیگر سطح‌های `runtime.*`
- [درونیات Plugin](/fa/plugins/architecture-internals) برای pipeline بارگذاری و سازوکارهای registry
