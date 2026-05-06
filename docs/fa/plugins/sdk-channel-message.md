---
read_when:
    - شما در حال ساخت یا بازآرایی یک Plugin کانال پیام‌رسانی هستید
    - به تحویل پایدار پاسخ نهایی، رسیدها، نهایی‌سازی پیش‌نمایش زنده، یا سیاست تأیید دریافت نیاز دارید
    - در حال مهاجرت از خط لولهٔ پاسخ قدیمی یا کمک‌کننده‌های ارسال پاسخ ورودی هستید
summary: رابط برنامه‌نویسی کاربردی چرخهٔ عمر پیام برای Pluginهای کانال، شامل ارسال‌های پایدار، رسیدها، پیش‌نمایش زنده، سیاست تأیید دریافت، و مهاجرت از نسخهٔ قدیمی
title: API پیام کانال
x-i18n:
    generated_at: "2026-05-06T09:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Plugin‌های کانال باید یک آداپتور `message` از
`openclaw/plugin-sdk/channel-message` ارائه کنند. آداپتور، چرخه‌ی عمر پیام بومی
را که پلتفرم پشتیبانی می‌کند توصیف می‌کند:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

هسته مالک صف‌بندی، دوام، سیاست تلاش دوباره‌ی عمومی، hookها، رسیدها و ابزار
مشترک `message` است. Plugin مالک فراخوانی‌های بومی ارسال/ویرایش/حذف، نرمال‌سازی
مقصد، رشته‌بندی پلتفرم، نقل‌قول‌های انتخاب‌شده، پرچم‌های اعلان، وضعیت حساب و
عوارض جانبی ویژه‌ی پلتفرم است.

این صفحه را همراه با [ساخت Plugin‌های کانال](/fa/plugins/sdk-channel-plugins) استفاده کنید.

زیرمسیر `channel-message` عمدا آن‌قدر سبک است که برای فایل‌های راه‌اندازی داغ
Plugin مانند `channel.ts` مناسب باشد: قراردادهای آداپتور، اثبات‌های قابلیت،
رسیدها و نماهای سازگاری را بدون بارگذاری تحویل خروجی ارائه می‌کند. ابزارهای
کمکی تحویل زمان اجرا از
`openclaw/plugin-sdk/channel-message-runtime` برای مسیرهای کد پایش/ارسال که
همین حالا I/O پیام ناهمگام انجام می‌دهند در دسترس هستند.

## آداپتور حداقلی

بیشتر Plugin‌های کانال جدید می‌توانند با یک آداپتور کوچک شروع کنند:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

سپس آن را به Plugin کانال متصل کنید:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

فقط قابلیت‌هایی را اعلام کنید که آداپتور واقعا حفظ می‌کند. هر قابلیت اعلام‌شده
باید یک آزمون قرارداد داشته باشد.

## پل خروجی

اگر کانال از قبل یک آداپتور سازگار `outbound` دارد، به‌جای تکرار کد ارسال،
آداپتور پیام را از آن مشتق کنید:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

پل، نتایج ارسال خروجی قدیمی را به مقدارهای `MessageReceipt` تبدیل می‌کند. کد
جدید باید رسیدها را از ابتدا تا انتها عبور دهد و شناسه‌های قدیمی را فقط در
لبه‌های سازگاری با `listMessageReceiptPlatformIds(...)` یا
`resolveMessageReceiptPrimaryId(...)` مشتق کند.
اگر سیاست دریافتی ارائه نشود، `createChannelMessageAdapterFromOutbound(...)`
از سیاست تایید دریافت `manual` استفاده می‌کند. این کار تایید دریافتِ پلتفرمِ
تحت مالکیت Plugin را بدون تغییر کانال‌هایی که Webhookها، سوکت‌ها یا offsetهای
polling را خارج از زمینه‌ی دریافت عمومی تایید می‌کنند، صریح می‌سازد.

## ارسال‌های ابزار پیام

مسیر مشترک `message(action="send")` باید از همان چرخه‌ی عمر تحویل هسته‌ای
استفاده کند که پاسخ‌های نهایی استفاده می‌کنند. اگر یک کانال برای ارسال ابزار
به شکل‌دهی ویژه‌ی ارائه‌دهنده نیاز دارد، به‌جای ارسال از
`actions.handleAction(...)`، `actions.prepareSendPayload(...)` را پیاده‌سازی کنید.

`prepareSendPayload(...)`، `ReplyPayload` نرمال‌شده‌ی هسته را همراه با زمینه‌ی
کامل کنش دریافت می‌کند. یک payload با داده‌های ویژه‌ی کانال در
`payload.channelData.<channel>` برگردانید و اجازه دهید هسته `sendMessage(...)`،
`deliverOutboundPayloads(...)`، صف write-ahead، hookهای ارسال پیام، تلاش دوباره،
بازیابی و پاک‌سازی ack را فراخوانی کند.

فقط وقتی `null` برگردانید که ارسال نتواند به‌صورت payload بادوام نمایش داده
شود، برای مثال چون شامل یک کارخانه‌ی مولفه‌ی غیرقابل‌سریال‌سازی است. هسته برای
سازگاری، fallback کنش Plugin قدیمی را نگه می‌دارد، اما ویژگی‌های جدید ارسال
کانال باید به‌صورت داده‌ی payload بادوام قابل بیان باشند.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

سپس آداپتور خروجی `payload.channelData.demo` را داخل `sendPayload` می‌خواند.
این کار رندرینگ ویژه‌ی پلتفرم را در Plugin نگه می‌دارد، در حالی که هسته همچنان
مالک ماندگاری، تلاش دوباره، بازیابی، hookها و ack است.

payloadهای آماده‌شده‌ی `message(action="send")` و تحویل عمومی پاسخ نهایی به‌طور
پیش‌فرض از تحویل هسته‌ای با صف‌بندی best-effort استفاده می‌کنند. صف‌بندی بادوام
الزامی فقط پس از آن معتبر است که هسته تایید کند کانال می‌تواند ارسالی را که پس
از crash نتیجه‌اش نامعلوم است بازآشتی دهد. اگر آداپتور نتواند
`reconcileUnknownSend` را پیاده‌سازی کند، مسیر ارسال آماده‌شده را best-effort
نگه دارید؛ هسته همچنان صف write-ahead را امتحان می‌کند، اما ماندگاری صف یا
بازیابی نامطمئن پس از crash بخشی از قرارداد تحویل الزامی نیست.

## قابلیت‌های نهایی بادوام

تحویل نهایی بادوام برای هر عارضه‌ی جانبی به‌صورت اختیاری فعال می‌شود. هسته
فقط وقتی از تحویل بادوام عمومی استفاده می‌کند که آداپتور همه‌ی قابلیت‌های
موردنیاز payload و گزینه‌های تحویل را اعلام کند.

| قابلیت                  | چه زمانی اعلام شود                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | آداپتور می‌تواند متن ارسال کند و رسید برگرداند.                                      |
| `media`                | ارسال‌های رسانه برای هر پیام قابل‌مشاهده‌ی پلتفرم رسید برمی‌گردانند.                |
| `payload`              | آداپتور معناشناسی payload پاسخ غنی را حفظ می‌کند، نه فقط متن و یک URL رسانه.        |
| `replyTo`              | مقصدهای پاسخ بومی به پلتفرم می‌رسند.                                                |
| `thread`               | مقصدهای رشته، موضوع یا رشته‌ی کانال بومی به پلتفرم می‌رسند.                         |
| `silent`               | سرکوب اعلان به پلتفرم می‌رسد.                                                       |
| `nativeQuote`          | فراداده‌ی نقل‌قول انتخاب‌شده به پلتفرم می‌رسد.                                      |
| `messageSendingHooks`  | hookهای ارسال پیام هسته می‌توانند پیش از I/O پلتفرم محتوا را لغو یا بازنویسی کنند. |
| `batch`                | batchهای رندرشده‌ی چندبخشی به‌عنوان یک طرح بادوام قابل بازپخش هستند.                |
| `reconcileUnknownSend` | آداپتور می‌تواند بازیابی `unknown_after_send` را بدون بازپخش کور حل کند.            |
| `afterSendSuccess`     | عوارض جانبی after-send محلی کانال یک‌بار اجرا می‌شوند.                              |
| `afterCommit`          | عوارض جانبی after-commit محلی کانال یک‌بار اجرا می‌شوند.                            |

تحویل نهایی best-effort به `reconcileUnknownSend` نیاز ندارد؛ وقتی آداپتور
معناشناسی قابل‌مشاهده‌ی payload را حفظ می‌کند، از چرخه‌ی عمر مشترک استفاده
می‌کند و اگر ماندگاری صف در دسترس نباشد به I/O مستقیم پلتفرم fallback می‌کند.
تحویل نهایی بادوام الزامی باید صراحتا `reconcileUnknownSend` را لازم بداند. اگر
آداپتور نتواند تعیین کند یک ارسال شروع‌شده/نامعلوم به پلتفرم رسیده است یا نه،
آن قابلیت را اعلام نکنید؛ هسته پیش از صف‌بندی، تحویل بادوام الزامی را رد می‌کند.

وقتی یک فراخواننده به تحویل بادوام نیاز دارد، به‌جای ساختن دستی mapها،
نیازمندی‌ها را مشتق کنید:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` به‌طور پیش‌فرض الزامی است. فقط برای مسیری که عمدا نمی‌تواند
hookهای ارسال پیام سراسری را اجرا کند، `messageSendingHooks: false` را تنظیم کنید.

## قرارداد ارسال بادوام

یک ارسال نهایی بادوام معناشناسی سخت‌گیرانه‌تری نسبت به تحویل قدیمیِ تحت مالکیت
کانال دارد:

- intent بادوام را پیش از I/O پلتفرم ایجاد کنید.
- اگر تحویل بادوام نتیجه‌ی handled برگرداند، به ارسال قدیمی fallback نکنید.
- لغو hook و نتایج no-send را نهایی در نظر بگیرید.
- `unsupported` را فقط به‌عنوان نتیجه‌ی پیش از intent در نظر بگیرید.
- برای دوام الزامی، اگر صف نتواند ثبت کند که ارسال پلتفرم شروع شده است، پیش از I/O پلتفرم شکست بخورید.
- برای تحویل نهایی الزامی و ارسال‌های آماده‌شده‌ی الزامی ابزار پیام، `reconcileUnknownSend` را preflight کنید؛ بازیابی باید بتواند پیام ازپیش‌ارسال‌شده را ack کند یا فقط پس از آن بازپخش کند که آداپتور ثابت کند ارسال اصلی رخ نداده است.
- برای `best_effort`، شکست‌های نوشتن صف می‌توانند به I/O مستقیم پلتفرم fallback کنند.
- سیگنال‌های abort را به بارگذاری رسانه و ارسال‌های پلتفرم منتقل کنید.
- hookهای after-commit را پس از ack صف اجرا کنید؛ fallback مستقیم best-effort آن‌ها را پس از I/O موفق پلتفرم اجرا می‌کند، چون commit صف بادوام وجود ندارد.
- برای هر شناسه‌ی پیام قابل‌مشاهده‌ی پلتفرم رسید برگردانید.
- وقتی پلتفرم می‌تواند بررسی کند که یک ارسال نامطمئن از قبل به کاربر رسیده است یا نه، از `reconcileUnknownSend` استفاده کنید.

این قرارداد از ارسال‌های تکراری پس از crash جلوگیری می‌کند و مانع دور زدن
hookهای لغو ارسال پیام می‌شود.

## رسیدها

`MessageReceipt` رکورد داخلی جدید از چیزی است که پلتفرم پذیرفته است:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

هنگام سازگار کردن یک نتیجه‌ی ارسال موجود، از
`createMessageReceiptFromOutboundResults(...)` استفاده کنید. وقتی یک پیام
پیش‌نمایش زنده به رسید نهایی تبدیل می‌شود، از `createPreviewMessageReceipt(...)`
استفاده کنید. از افزودن فیلدهای `messageIds` محلیِ مالک جدید خودداری کنید.
`ChannelDeliveryResult.messageIds` قدیمی همچنان در لبه‌های سازگاری تولید می‌شود.

## پیش‌نمایش زنده

کانال‌هایی که پیش‌نمایش‌های پیش‌نویس یا به‌روزرسانی‌های پیشرفت را stream
می‌کنند باید قابلیت‌های زنده را اعلام کنند:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

برای نهایی‌سازی زمان اجرا از `defineFinalizableLivePreviewAdapter(...)` و
`deliverWithFinalizableLivePreviewAdapter(...)` استفاده کنید. نهایی‌ساز تصمیم
می‌گیرد که پاسخ نهایی پیش‌نمایش را درجا ویرایش کند، یک fallback عادی بفرستد،
وضعیت پیش‌نمایش در انتظار را دور بیندازد، ویرایش شکست‌خورده‌ی مبهم را بدون
تکرار پیام نگه دارد، و رسید نهایی را برگرداند.

## سیاست ack دریافت

دریافت‌کننده‌های ورودی که زمان‌بندی تایید دریافت پلتفرم را کنترل می‌کنند باید
سیاست دریافت را اعلام کنند:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

آداپتورهایی که سیاست دریافت اعلام نمی‌کنند به‌طور پیش‌فرض این مقدار را دارند:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

هنگامی از پیش‌فرض استفاده کنید که پلتفرم هیچ تأییدی برای به‌تعویق‌انداختن ندارد، پیشاپیش قبل از پردازش ناهمگام تأیید می‌کند، یا به معناشناسی پاسخ مختص پروتکل نیاز دارد. یکی از سیاست‌های مرحله‌ای را فقط زمانی اعلام کنید که گیرنده واقعاً از زمینه دریافت برای به‌تعویق‌انداختن تأیید پلتفرم استفاده می‌کند.

سیاست‌ها:

| سیاست                 | زمان استفاده                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | پلتفرم می‌تواند پس از تجزیه و ثبت رویداد ورودی تأیید شود.                              |
| `after_agent_dispatch` | پلتفرم باید تا زمانی منتظر بماند که اعزام عامل پذیرفته شده باشد.                      |
| `after_durable_send`   | پلتفرم باید تا زمانی منتظر بماند که تحویل نهایی تصمیمی پایدار داشته باشد.             |
| `manual`               | Plugin مالک تأیید است، چون معناشناسی پلتفرم با یک مرحله عمومی سازگار نیست.            |

در گیرنده‌هایی که وضعیت ack را به تعویق می‌اندازند از `createMessageReceiveContext(...)` استفاده کنید، و زمانی که گیرنده باید بررسی کند آیا یک مرحله سیاست پیکربندی‌شده را برآورده کرده است، از `shouldAckMessageAfterStage(...)` استفاده کنید.

## آزمون‌های قرارداد

اعلامیه‌های قابلیت بخشی از قرارداد Plugin هستند. آن‌ها را با آزمون‌ها پشتیبانی کنید:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

وقتی آداپتر آن ویژگی‌ها را اعلام می‌کند، مجموعه‌های اثبات زنده و دریافت را اضافه کنید. نبود یک اثبات باید آزمون را ناموفق کند، نه اینکه سطح پایدار را بی‌سروصدا گسترده‌تر کند.

## APIهای سازگاری منسوخ‌شده

این APIها برای سازگاری با طرف‌های ثالث همچنان قابل import هستند. از آن‌ها برای کد کانال جدید استفاده نکنید.

| API منسوخ‌شده                               | جایگزین                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` برای توزیع‌کننده‌های سازگاری، یا یک آداپتر `message` برای کد کانال جدید |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` از `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` فقط برای توزیع‌کننده‌های سازگاری                                       |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` فقط برای توزیع‌کننده‌های سازگاری                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` به‌همراه `deliverWithFinalizableLivePreviewAdapter(...)`                |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

توزیع‌کننده‌های سازگاری همچنان می‌توانند از طریق نمای پیام از `createReplyPrefixContext(...)`، `createReplyPrefixOptions(...)`، و `createTypingCallbacks(...)` استفاده کنند. کد چرخه عمر جدید باید از زیرمسیر قدیمی `channel-reply-pipeline` پرهیز کند.

## چک‌لیست مهاجرت

1. `message: defineChannelMessageAdapter(...)` یا `message: createChannelMessageAdapterFromOutbound(...)` را به Plugin کانال اضافه کنید.
2. از ارسال‌های متن، رسانه، و payload مقدار `MessageReceipt` برگردانید.
3. فقط قابلیت‌هایی را اعلام کنید که با رفتار بومی و آزمون‌ها پشتیبانی می‌شوند.
4. نگاشت‌های دست‌نویس الزامات پایدار را با `deriveDurableFinalDeliveryRequirements(...)` جایگزین کنید.
5. هنگامی که کانال پیام‌های پیش‌نویس را درجا ویرایش می‌کند، نهایی‌سازی پیش‌نمایش را از طریق کمک‌کننده‌های پیش‌نمایش زنده منتقل کنید.
6. سیاست ack دریافت را فقط زمانی اعلام کنید که گیرنده واقعاً بتواند تأیید پلتفرم را به تعویق بیندازد.
7. کمک‌کننده‌های قدیمی اعزام پاسخ را فقط در مرزهای سازگاری نگه دارید.
