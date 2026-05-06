---
read_when:
    - شما در حال ساخت یک Plugin کانال هستید و چرخهٔ عمر مشترک نوبت ورودی را می‌خواهید
    - در حال مهاجرت دادن یک پایشگر کانال از کد چسبانندهٔ دست‌سازِ ثبت/ارسال هستید
    - باید مراحل پذیرش، دریافت، طبقه‌بندی، پیش‌بررسی، حل، ثبت، ارسال و نهایی‌سازی را درک کنید
sidebarTitle: Channel turn
summary: runtime.channel.turn -- هستهٔ مشترک نوبت ورودی که Plugin‌های کانال همراه و شخص ثالث برای ثبت، ارسال و نهایی‌سازی نوبت‌های عامل از آن استفاده می‌کنند
title: هستهٔ نوبت کانال
x-i18n:
    generated_at: "2026-05-06T09:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

هستهٔ نوبت کانال، ماشین حالت ورودی مشترکی است که یک رویداد عادی‌سازی‌شدهٔ پلتفرم را به نوبت عامل تبدیل می‌کند. Pluginهای کانال، واقعیت‌های پلتفرم و callback تحویل را فراهم می‌کنند. هسته مالک هماهنگ‌سازی است: دریافت، طبقه‌بندی، پیش‌پرواز، حل، مجوزدهی، مونتاژ، ثبت، dispatch و نهایی‌سازی.

وقتی Plugin شما در مسیر داغ پیام ورودی قرار دارد، از این استفاده کنید. برای رویدادهای غیرپیامی (دستورهای اسلش، modalها، تعامل‌های دکمه، رویدادهای چرخهٔ عمر، واکنش‌ها، وضعیت صوتی)، آن‌ها را محلیِ Plugin نگه دارید. هسته فقط مالک رویدادهایی است که ممکن است به نوبت متنی عامل تبدیل شوند.

<Info>
  هسته از طریق runtime تزریق‌شدهٔ Plugin به صورت `runtime.channel.turn.*` قابل دسترسی است. نوع runtime مربوط به Plugin از `openclaw/plugin-sdk/core` صادر می‌شود، بنابراین Pluginهای native شخص ثالث می‌توانند از این نقاط ورود همان‌طور استفاده کنند که Pluginهای کانال bundled استفاده می‌کنند.
</Info>

## چرا یک هستهٔ مشترک

Pluginهای کانال همان جریان ورودی را تکرار می‌کنند: عادی‌سازی، مسیریابی، gate، ساخت context، ثبت فرادادهٔ session، dispatch کردن نوبت عامل، نهایی‌سازی وضعیت تحویل. بدون یک هستهٔ مشترک، تغییر در gate کردن mention، پاسخ‌های قابل مشاهدهٔ فقط-ابزار، فرادادهٔ session، history معلق، یا نهایی‌سازی dispatch باید برای هر کانال جداگانه اعمال شود.

هسته عمداً چهار مفهوم را از هم جدا نگه می‌دارد:

- `ConversationFacts`: پیام از کجا آمده است
- `RouteFacts`: کدام عامل و session باید آن را پردازش کند
- `ReplyPlanFacts`: پاسخ‌های قابل مشاهده باید به کجا بروند
- `MessageFacts`: عامل باید چه بدنه و context تکمیلی‌ای را ببیند

DMهای Slack، topicهای Telegram، threadهای Matrix و sessionهای topic در Feishu همگی در عمل این‌ها را متمایز می‌کنند. یکی دانستن آن‌ها با یک شناسه، در طول زمان باعث drift می‌شود.

## چرخهٔ عمر مرحله‌ها

هسته صرف‌نظر از کانال، همان pipeline ثابت را اجرا می‌کند:

1. `ingest` -- adapter یک رویداد خام پلتفرم را به `NormalizedTurnInput` تبدیل می‌کند
2. `classify` -- adapter اعلام می‌کند آیا این رویداد می‌تواند یک نوبت عامل را شروع کند یا نه
3. `preflight` -- adapter dedupe، self-echo، hydration، debounce، decryption و پیش‌پر کردن بخشی از factها را انجام می‌دهد
4. `resolve` -- adapter یک نوبت کاملاً مونتاژشده برمی‌گرداند (route، reply plan، message، delivery)
5. `authorize` -- سیاست DM، گروه، mention و command روی factهای مونتاژشده اعمال می‌شود
6. `assemble` -- `FinalizedMsgContext` از factها از طریق `buildContext` ساخته می‌شود
7. `record` -- فرادادهٔ session ورودی و آخرین route پایدار می‌شود
8. `dispatch` -- نوبت عامل از طریق dispatcher بلوکی buffered اجرا می‌شود
9. `finalize` -- adapter `onFinalize` حتی در خطای dispatch هم اجرا می‌شود

هر مرحله وقتی callback مربوط به `log` فراهم شده باشد، یک رویداد log ساختاریافته emit می‌کند. [Observability](#observability) را ببینید.

## گونه‌های پذیرش

هسته وقتی یک نوبت gate می‌شود throw نمی‌کند. یک `ChannelTurnAdmission` برمی‌گرداند:

| گونه          | زمان                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | نوبت پذیرفته می‌شود. نوبت عامل اجرا می‌شود و مسیر پاسخ قابل مشاهده استفاده می‌شود.                                                                   |
| `observeOnly` | نوبت از ابتدا تا انتها اجرا می‌شود اما adapter تحویل هیچ چیز قابل مشاهده‌ای ارسال نمی‌کند. برای عامل‌های observer پخش همگانی و جریان‌های passive چندعاملی دیگر استفاده می‌شود. |
| `handled`     | یک رویداد پلتفرم به صورت محلی مصرف شده است (lifecycle، reaction، button، modal). هسته dispatch را رد می‌کند.                                           |
| `drop`        | مسیر رد شدن. در صورت نیاز، `recordHistory: true` پیام را در history معلق گروه نگه می‌دارد تا یک mention آینده context داشته باشد.                      |

پذیرش می‌تواند از `classify` بیاید (کلاس رویداد گفته نمی‌تواند نوبتی را شروع کند)، از `preflight` بیاید (dedupe، self-echo، mention جاافتاده همراه با ثبت history)، یا از خود `resolveTurn`.

## نقاط ورود

runtime سه نقطهٔ ورود ترجیحی expose می‌کند تا adapterها بتوانند در سطحی opt in کنند که با کانال همخوان است.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

دو helper قدیمی‌تر runtime همچنان برای سازگاری Plugin SDK در دسترس هستند:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

زمانی استفاده کنید که کانال شما بتواند جریان ورودی خود را به صورت یک `ChannelTurnAdapter<TRaw>` بیان کند. adapter برای `ingest`، `classify` اختیاری، `preflight` اختیاری، `resolveTurn` اجباری و `onFinalize` اختیاری callback دارد.

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

`run` شکل مناسب زمانی است که کانال منطق adapter کوچکی دارد و از مالکیت چرخهٔ عمر از طریق hookها سود می‌برد.

### runPrepared

زمانی استفاده کنید که کانال یک dispatcher محلی پیچیده با previewها، retryها، editها یا bootstrap کردن thread دارد که باید در مالکیت کانال بماند. هسته همچنان session ورودی را پیش از dispatch ثبت می‌کند و یک `DispatchedChannelTurnResult` یکدست ارائه می‌دهد.

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

کانال‌های غنی (Matrix، Mattermost، Microsoft Teams، Feishu، QQ Bot) از `runPrepared` استفاده می‌کنند، چون dispatcher آن‌ها رفتارهای ویژهٔ پلتفرم را هماهنگ می‌کند که هسته نباید دربارهٔ آن‌ها چیزی بداند.

### buildContext

یک تابع pure که بسته‌های fact را به `FinalizedMsgContext` map می‌کند. زمانی از آن استفاده کنید که کانال شما بخشی از pipeline را دستی پیاده می‌کند اما شکل context یکسان می‌خواهد.

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

`buildContext` همچنین داخل callbackهای `resolveTurn` هنگام مونتاژ یک نوبت برای `run` مفید است.

<Note>
  helperهای deprecated در SDK مانند `dispatchInboundReplyWithBase` همچنان از طریق یک helper نوبت مونتاژشده bridge می‌کنند. کد Plugin جدید باید از `run` یا `runPrepared` استفاده کند.
</Note>

## نوع‌های fact

factهایی که هسته از adapter شما مصرف می‌کند، مستقل از پلتفرم هستند. پیش از سپردن آن‌ها به هسته، objectهای پلتفرم را به این شکل‌ها ترجمه کنید.

### NormalizedTurnInput

| فیلد             | هدف                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | شناسهٔ پایدار پیام که برای dedupe و logها استفاده می‌شود                                   |
| `timestamp`       | epoch ms اختیاری                                                            |
| `rawText`         | بدنه همان‌طور که از پلتفرم دریافت شده است                                           |
| `textForAgent`    | بدنهٔ پاک‌سازی‌شدهٔ اختیاری برای عامل (حذف mention، trim تایپ)             |
| `textForCommands` | بدنهٔ اختیاری که برای parse کردن `/command` استفاده می‌شود                                    |
| `raw`             | ارجاع pass-through اختیاری برای callbackهای adapter که به اصل رویداد نیاز دارند |

### ChannelEventClass

| فیلد                  | هدف                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`، `command`، `interaction`، `reaction`، `lifecycle`، `unknown` |
| `canStartAgentTurn`    | اگر false باشد، هسته `{ kind: "handled" }` برمی‌گرداند                       |
| `requiresImmediateAck` | hint برای adapterهایی که باید پیش از dispatch، ACK کنند                      |

### SenderFacts

| فیلد          | هدف                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | شناسهٔ پایدار فرستنده در پلتفرم                                      |
| `name`         | نام نمایشی                                                   |
| `username`     | handle، اگر از `name` متمایز باشد                                 |
| `tag`          | discriminator به سبک Discord یا tag پلتفرم                    |
| `roles`        | شناسه‌های role، برای تطبیق allowlist نقش اعضا استفاده می‌شود              |
| `isBot`        | وقتی فرستنده یک bot شناخته‌شده است true است (هسته برای drop کردن استفاده می‌کند) |
| `isSelf`       | وقتی فرستنده خود عامل پیکربندی‌شده است true است            |
| `displayLabel` | label از پیش render شده برای متن envelope                           |

### ConversationFacts

| فیلد             | هدف                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`، `group` یا `channel`                                      |
| `id`              | شناسهٔ conversation که برای مسیریابی استفاده می‌شود                                     |
| `label`           | label انسانی برای envelope                                         |
| `spaceId`         | شناسهٔ space بیرونی اختیاری (workspace در Slack، homeserver در Matrix) |
| `parentId`        | شناسهٔ conversation بیرونی وقتی این یک thread است                          |
| `threadId`        | شناسهٔ thread وقتی این پیام داخل یک thread است                       |
| `nativeChannelId` | شناسهٔ native کانال در پلتفرم وقتی با شناسهٔ routing فرق دارد        |
| `routePeer`       | peer استفاده‌شده برای lookup در `resolveAgentRoute`                             |

### RouteFacts

| فیلد                   | هدف                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | عاملی که باید این نوبت را مدیریت کند                         |
| `accountId`             | override اختیاری (کانال‌های چندحسابی)                 |
| `routeSessionKey`       | کلید session که برای مسیریابی استفاده می‌شود                               |
| `dispatchSessionKey`    | کلید session که در dispatch استفاده می‌شود، وقتی با route key فرق دارد |
| `persistedSessionKey`   | کلید session نوشته‌شده در فرادادهٔ session پایدار          |
| `parentSessionKey`      | parent برای sessionهای منشعب/threaded                      |
| `modelParentSessionKey` | parent سمت مدل برای sessionهای منشعب                    |
| `mainSessionKey`        | pin مالک DM اصلی برای conversationهای مستقیم                 |
| `createIfMissing`       | اجازه می‌دهد مرحلهٔ record یک ردیف session جاافتاده بسازد          |

### ReplyPlanFacts

| فیلد                     | هدف                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | مقصد منطقی پاسخ که در زمینه‌ی `To` نوشته می‌شود          |
| `originatingTo`           | مقصد زمینه‌ی مبدأ (`OriginatingTo`)            |
| `nativeChannelId`         | شناسه‌ی کانال بومی پلتفرم برای تحویل                 |
| `replyTarget`             | مقصد نهایی پاسخ قابل مشاهده، اگر با `to` متفاوت باشد |
| `deliveryTarget`          | بازنویسی تحویل در سطح پایین‌تر                           |
| `replyToId`               | شناسه‌ی پیام نقل‌قول‌شده/لنگرشده                              |
| `replyToIdFull`           | شناسه‌ی کامل نقل‌قول‌شده وقتی پلتفرم هر دو را دارد          |
| `messageThreadId`         | شناسه‌ی رشته در زمان تحویل                              |
| `threadParentId`          | شناسه‌ی پیام والد رشته                         |
| `sourceReplyDeliveryMode` | `thread`، `reply`، `channel`، `direct` یا `none`       |

### AccessFacts

`AccessFacts` بولی‌هایی را حمل می‌کند که مرحله‌ی مجوزدهی به آن‌ها نیاز دارد. تطبیق هویت در کانال باقی می‌ماند: کرنل فقط نتیجه را مصرف می‌کند.

| فیلد      | هدف                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | تصمیم اجازه/جفت‌سازی/رد برای DM و فهرست `allowFrom`                       |
| `group`    | سیاست گروه، اجازه‌ی مسیر، اجازه‌ی فرستنده، فهرست مجازها، الزام منشن   |
| `commands` | مجوزدهی فرمان در میان مجوزدهنده‌های پیکربندی‌شده                       |
| `mentions` | اینکه تشخیص منشن ممکن است یا نه و اینکه عامل منشن شده است یا نه |

### MessageFacts

| فیلد            | هدف                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | بدنه‌ی نهایی envelope (قالب‌بندی‌شده)                                |
| `rawBody`        | بدنه‌ی خام ورودی                                               |
| `bodyForAgent`   | بدنه‌ای که عامل می‌بیند                                            |
| `commandBody`    | بدنه‌ای که برای تجزیه‌ی فرمان استفاده می‌شود                                  |
| `envelopeFrom`   | برچسب از پیش رندرشده‌ی فرستنده برای envelope                     |
| `senderLabel`    | بازنویسی اختیاری برای فرستنده‌ی رندرشده                      |
| `preview`        | پیش‌نمایش کوتاه و ردکت‌شده برای لاگ‌ها                                |
| `inboundHistory` | ورودی‌های اخیر تاریخچه‌ی ورودی وقتی کانال یک بافر نگه می‌دارد |

### SupplementalContextFacts

زمینه‌ی تکمیلی، زمینه‌ی نقل‌قول، فورواردشده و راه‌اندازی رشته را پوشش می‌دهد. کرنل سیاست پیکربندی‌شده‌ی `contextVisibility` را اعمال می‌کند. آداپتور کانال فقط factها و پرچم‌های `senderAllowed` را فراهم می‌کند تا سیاست میان‌کانالی سازگار بماند.

### InboundMediaFacts

رسانه به شکل fact است. دانلود پلتفرمی، احراز هویت، سیاست SSRF، قوانین CDN و رمزگشایی، محلیِ کانال باقی می‌مانند. کرنل factها را به `MediaPath`، `MediaUrl`، `MediaType`، `MediaPaths`، `MediaUrls`، `MediaTypes` و `MediaTranscribedIndexes` نگاشت می‌کند.

## قرارداد آداپتور

برای `run` کامل، شکل آداپتور چنین است:

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

`resolveTurn` یک `ChannelTurnResolved` برمی‌گرداند که یک `AssembledChannelTurn` با یک نوع پذیرش اختیاری است. برگرداندن `{ admission: { kind: "observeOnly" } }` نوبت را بدون تولید خروجی قابل مشاهده اجرا می‌کند. آداپتور همچنان مالک callback تحویل است؛ فقط برای آن نوبت به یک no-op تبدیل می‌شود.

`onFinalize` برای هر نتیجه اجرا می‌شود، از جمله خطاهای dispatch. از آن برای پاک‌کردن تاریخچه‌ی گروه معلق، حذف واکنش‌های ack، توقف نشانگرهای وضعیت و flush کردن وضعیت محلی استفاده کنید.

## آداپتور تحویل

کرنل مستقیماً پلتفرم را فراخوانی نمی‌کند. کانال یک `ChannelTurnDeliveryAdapter` به کرنل می‌دهد:

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

`deliver` برای هر قطعه‌ی پاسخ بافرشده یک بار فراخوانی می‌شود. در طول مهاجرت چرخه‌ی حیات پیام، تحویل channel-turn مونتاژشده به‌صورت پیش‌فرض در مالکیت کانال است: نبودن فیلد `durable` یعنی کرنل باید `deliver` را مستقیماً فراخوانی کند و نباید از مسیر تحویل خروجی عمومی عبور کند. `durable` را فقط پس از آن تنظیم کنید که کانال audit شده باشد تا ثابت شود مسیر ارسال عمومی رفتار تحویل قدیمی را حفظ می‌کند، از جمله مقصدهای پاسخ/رشته، مدیریت رسانه، کش‌های پیام ارسالی/self-echo، پاک‌سازی وضعیت و شناسه‌های پیام برگشتی. `durable: false` همچنان یک نگارش سازگاری برای «استفاده از callback متعلق به کانال» است، اما کانال‌های مهاجرت‌نکرده نباید نیازی به افزودن آن داشته باشند. وقتی کانال شناسه‌های پیام پلتفرم را دارد، آن‌ها را برگردانید تا dispatcher بتواند لنگرهای رشته را حفظ کند و قطعه‌های بعدی را بعداً ویرایش کند؛ مسیرهای تحویل جدیدتر باید `receipt` را هم برگردانند تا بازیابی، نهایی‌سازی پیش‌نمایش و سرکوب موارد تکراری بتوانند از `messageIds` جدا شوند. برای نوبت‌های فقط مشاهده، `{ visibleReplySent: false }` را برگردانید یا از `createNoopChannelTurnDeliveryAdapter()` استفاده کنید.

کانال‌هایی که از `runPrepared` با یک dispatcher کاملاً متعلق به کانال استفاده می‌کنند، `ChannelTurnDeliveryAdapter` ندارند. آن dispatcherها به‌صورت پیش‌فرض durable نیستند. آن‌ها باید مسیر تحویل مستقیم خود را نگه دارند تا زمانی که صراحتاً با یک مقصد کامل، آداپتور replay-safe، قرارداد receipt و hookهای side-effect کانال وارد زمینه‌ی ارسال جدید شوند.

کمک‌کننده‌های سازگاری عمومی مانند `recordInboundSessionAndDispatchReply`، `dispatchInboundReplyWithBase` و کمک‌کننده‌های direct-DM باید در طول مهاجرت، رفتار را حفظ کنند. آن‌ها نباید پیش از callbackهای `deliver` یا `reply` متعلق به فراخواننده، تحویل durable عمومی را فراخوانی کنند.

## گزینه‌های ثبت

مرحله‌ی ثبت، `recordInboundSession` را پوشش می‌دهد. بیشتر کانال‌ها می‌توانند از پیش‌فرض‌ها استفاده کنند. از طریق `record` بازنویسی کنید:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher منتظر مرحله‌ی ثبت می‌ماند. اگر ثبت throw کند، کرنل `onPreDispatchFailure` را اجرا می‌کند (وقتی به `runPrepared` داده شده باشد) و دوباره throw می‌کند.

## مشاهده‌پذیری

هر مرحله وقتی callback به نام `log` فراهم شود، یک رویداد ساختاریافته منتشر می‌کند:

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

مراحل لاگ‌شده: `ingest`، `classify`، `preflight`، `resolve`، `authorize`، `assemble`، `record`، `dispatch`، `finalize`. از لاگ‌کردن بدنه‌های خام خودداری کنید؛ برای پیش‌نمایش‌های کوتاه و ردکت‌شده از `MessageFacts.preview` استفاده کنید.

## چه چیزهایی محلیِ کانال باقی می‌مانند

کرنل مالک orchestration است. کانال همچنان مالک این موارد است:

- انتقال‌های پلتفرم (Gateway، REST، websocket، polling، Webhookها)
- تفکیک هویت و تطبیق نام نمایشی
- فرمان‌های بومی، slash commandها، autocomplete، modalها، دکمه‌ها، وضعیت صوتی
- رندر کردن card، modal و adaptive-card
- احراز هویت رسانه، قوانین CDN، رسانه‌ی رمزگذاری‌شده، transcription
- APIهای ویرایش، واکنش، redaction و presence
- backfill و واکشی تاریخچه از سمت پلتفرم
- جریان‌های جفت‌سازی که به راستی‌آزمایی مخصوص پلتفرم نیاز دارند

اگر دو کانال شروع به نیاز داشتن به کمک‌کننده‌ی یکسانی برای یکی از این موارد کردند، به‌جای وارد کردن آن به کرنل، یک کمک‌کننده‌ی SDK مشترک استخراج کنید.

## پایداری

`runtime.channel.turn.*` بخشی از سطح عمومی Plugin runtime است. نوع‌های fact (`SenderFacts`، `ConversationFacts`، `RouteFacts`، `ReplyPlanFacts`، `AccessFacts`، `MessageFacts`، `SupplementalContextFacts`، `InboundMediaFacts`) و شکل‌های پذیرش (`ChannelTurnAdmission`، `ChannelEventClass`) از طریق `PluginRuntime` از `openclaw/plugin-sdk/core` قابل دسترسی هستند.

قواعد سازگاری رو به عقب اعمال می‌شوند: فیلدهای fact جدید افزایشی هستند، نوع‌های پذیرش تغییر نام داده نمی‌شوند و نام‌های نقطه‌ی ورود پایدار می‌مانند. نیازهای جدید کانال که به تغییری غیر افزایشی نیاز دارند باید از فرایند مهاجرت Plugin SDK عبور کنند.

## مرتبط

- [بازآرایی چرخه‌ی حیات پیام](/fa/concepts/message-lifecycle-refactor) برای چرخه‌ی حیات برنامه‌ریزی‌شده‌ی ارسال/دریافت/live که این کرنل را پوشش خواهد داد
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins) برای قرارداد گسترده‌تر Plugin کانال
- [کمک‌کننده‌های Plugin runtime](/fa/plugins/sdk-runtime) برای سطح‌های دیگر `runtime.*`
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals) برای pipeline بارگذاری و سازوکارهای registry
