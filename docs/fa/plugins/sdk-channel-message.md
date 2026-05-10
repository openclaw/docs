---
read_when:
    - شما در حال ساخت یا بازآرایی یک Plugin کانال پیام‌رسانی هستید
    - به تحویل پایدار پاسخ نهایی، رسیدها، نهایی‌سازی پیش‌نمایش زنده، یا سیاست تأیید دریافت نیاز دارید
    - در حال مهاجرت از خط لولهٔ پاسخ قدیمی یا تابع‌های کمکی ارسال پاسخ ورودی هستید
summary: رابط برنامه‌نویسی کاربردی چرخهٔ حیات پیام برای Pluginهای کانال، شامل ارسال‌های پایدار، رسیدها، پیش‌نمایش زنده، سیاست تأیید دریافت، و مهاجرت میراثی
title: API پیام کانال
x-i18n:
    generated_at: "2026-05-10T19:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Pluginهای کانال باید یک آداپتور `message` از
`openclaw/plugin-sdk/channel-message` ارائه کنند. این آداپتور چرخه عمر پیام بومی
را که پلتفرم پشتیبانی می‌کند توصیف می‌کند:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

هسته مالک صف‌بندی، دوام، سیاست تلاش مجدد عمومی، hookها، رسیدها، و ابزار مشترک
`message` است. Plugin مالک فراخوانی‌های بومی ارسال/ویرایش/حذف، نرمال‌سازی مقصد،
threading پلتفرم، نقل‌قول‌های انتخاب‌شده، پرچم‌های اعلان، وضعیت حساب، و
عوارض جانبی مخصوص پلتفرم است.

این صفحه را همراه با [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins) استفاده کنید.

زیرمسیر `channel-message` عمداً به‌اندازه‌ای سبک است که برای فایل‌های bootstrap
داغ Plugin مانند `channel.ts` مناسب باشد: این مسیر قراردادهای آداپتور، اثبات‌های
قابلیت، رسیدها، و facadeهای سازگاری را بدون بارگذاری تحویل خروجی ارائه می‌کند.
کمک‌کننده‌های تحویل در زمان اجرا از
`openclaw/plugin-sdk/channel-message-runtime` برای مسیرهای کد پایش/ارسال که
هم‌اکنون I/O پیام ناهمگام انجام می‌دهند در دسترس هستند.

کدهای ارسال جدید کانال و Plugin باید از کمک‌کننده‌های چرخه عمر پیام در
`openclaw/plugin-sdk/channel-message-runtime` استفاده کنند: `sendDurableMessageBatch`،
`withDurableMessageSendContext`، یا `deliverInboundReplyWithMessageSendContext`.
کمک‌کننده قدیمی‌تر
`deliverOutboundPayloads(...)` در `openclaw/plugin-sdk/outbound-runtime`
زیرلایه سازگاری/زمان اجرا برای بخش‌های داخلی خروجی، بازیابی، و آداپتورهای قدیمی
است و منسوخ شده است. از آن برای مسیرهای ارسال جدید کانال یا Plugin استفاده نکنید.

`sendDurableMessageBatch(...)` یک نتیجه چرخه عمر صریح برمی‌گرداند:

- `sent` - دست‌کم یک پیام قابل مشاهده پلتفرم تحویل داده شد.
- `suppressed` - هیچ پیام پلتفرمی نباید گمشده تلقی شود. دلایل پایدار شامل
  `cancelled_by_message_sending_hook`، `empty_after_message_sending_hook`،
  `no_visible_payload`، `adapter_returned_no_identity`، و مقدار قدیمی
  `no_visible_result` هستند.
- `partial_failed` - دست‌کم یک پیام پلتفرم پیش از شکست یک payload یا عارضه جانبی
  بعدی تحویل داده شد. نتیجه شامل پیشوند رسید تحویل‌داده‌شده به‌همراه شکست است.
- `failed` - هیچ رسید پلتفرمی تولید نشد.

وقتی یک batch payloadهای ارسال‌شده، suppress‌شده، و ناموفق را ترکیب می‌کند از
`payloadOutcomes` استفاده کنید. لغو hook را از خالی بودن آرایه قدیمی تحویل مستقیم
استنتاج نکنید.

Dispatcherهای سازگاری که هنوز به dispatcher پاسخ bufferشده نیاز دارند باید
گزینه‌های پیشوند پاسخ را با `createChannelMessageReplyPipeline(...)` از
`openclaw/plugin-sdk/channel-message` بسازند، سپس `channel.turn.runPrepared(...)`
زمان اجرا را فراخوانی کنند. این کار ضبط session و ترتیب dispatch را روی چرخه عمر
مشترک turn نگه می‌دارد، بدون اینکه wrapper عمومی دیگری برای turn اضافه کند.

## آداپتور حداقلی

بیشتر Pluginهای کانال جدید می‌توانند با یک آداپتور کوچک شروع کنند:

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

فقط قابلیت‌هایی را اعلام کنید که آداپتور واقعاً حفظ می‌کند. هر قابلیت اعلام‌شده
باید یک آزمون قرارداد داشته باشد.

## پل خروجی

اگر کانال از قبل یک آداپتور `outbound` سازگار دارد، بهتر است به‌جای تکرار کد
ارسال، آداپتور پیام را از آن مشتق کنید:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

این پل نتایج ارسال خروجی قدیمی را به مقادیر `MessageReceipt` تبدیل می‌کند. کد
جدید باید رسیدها را سرتاسری عبور دهد و شناسه‌های قدیمی را فقط در مرزهای سازگاری
با `listMessageReceiptPlatformIds(...)` یا `resolveMessageReceiptPrimaryId(...)`
مشتق کند.
اگر هیچ سیاست دریافتی ارائه نشود، `createChannelMessageAdapterFromOutbound(...)`
از سیاست تأیید دریافت `manual` استفاده می‌کند. این کار تأیید دریافت پلتفرم با
مالکیت Plugin را صریح می‌کند، بدون اینکه کانال‌هایی را تغییر دهد که Webhookها،
socketها، یا offsetهای polling را بیرون از زمینه دریافت عمومی تأیید می‌کنند.

## ارسال‌های ابزار پیام

مسیر مشترک `message(action="send")` باید از همان چرخه عمر تحویل هسته‌ای استفاده
کند که پاسخ‌های نهایی استفاده می‌کنند. اگر یک کانال برای ارسال ابزار به شکل‌دهی
مخصوص provider نیاز دارد، به‌جای ارسال از `actions.handleAction(...)`،
`actions.prepareSendPayload(...)` را پیاده‌سازی کنید.

`prepareSendPayload(...)` مقدار `ReplyPayload` نرمال‌شده هسته را به‌همراه زمینه
کامل action دریافت می‌کند. payloadی با داده مخصوص کانال در
`payload.channelData.<channel>` برگردانید و بگذارید هسته `sendMessage(...)`،
زمان اجرای چرخه عمر پیام، صف write-ahead، hookهای ارسال پیام، تلاش مجدد، بازیابی،
و پاک‌سازی ack را فراخوانی کند. زمان اجرای چرخه عمر ممکن است
`deliverOutboundPayloads(...)` را به‌صورت داخلی به‌عنوان زیرلایه سازگاری فراخوانی
کند، اما Pluginهای کانال نباید برای رفتار ارسال جدید آن را مستقیم فراخوانی کنند.

فقط زمانی `null` برگردانید که ارسال را نتوان به‌صورت payload پایدار نمایش داد؛
برای مثال چون شامل یک factory مؤلفه غیرقابل‌سریال‌سازی است. هسته fallback قدیمی
action Plugin را برای سازگاری نگه می‌دارد، اما قابلیت‌های ارسال جدید کانال باید
به‌صورت داده payload پایدار قابل بیان باشند.

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

سپس آداپتور خروجی `payload.channelData.demo` را درون `sendPayload` می‌خواند.
این کار rendering مخصوص پلتفرم را در Plugin نگه می‌دارد، در حالی که هسته همچنان
مالک persist، تلاش مجدد، بازیابی، hookها، و ack است.

payloadهای آماده‌شده `message(action="send")` و تحویل عمومی پاسخ نهایی به‌طور
پیش‌فرض از تحویل هسته‌ای با صف‌بندی best-effort استفاده می‌کنند. صف‌بندی پایدار
الزامی فقط پس از آن معتبر است که هسته تأیید کند کانال می‌تواند ارسالی را reconcile
کند که نتیجه‌اش پس از crash نامعلوم است. اگر آداپتور نمی‌تواند
`reconcileUnknownSend` را پیاده‌سازی کند، مسیر ارسال آماده‌شده را best-effort
نگه دارید؛ هسته همچنان صف write-ahead را امتحان می‌کند، اما persistence صف یا
بازیابی crash نامطمئن بخشی از قرارداد تحویل الزامی نیست.

## قابلیت‌های نهایی پایدار

تحویل نهایی پایدار برای هر عارضه جانبی opt-in است. هسته فقط زمانی از تحویل
پایدار عمومی استفاده می‌کند که آداپتور هر قابلیتی را که payload و گزینه‌های
تحویل نیاز دارند اعلام کند.

| قابلیت                 | چه زمانی اعلام شود                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | آداپتور می‌تواند متن ارسال کند و رسید برگرداند.                                      |
| `media`                | ارسال‌های رسانه برای هر پیام قابل مشاهده پلتفرم رسید برمی‌گردانند.                  |
| `payload`              | آداپتور semantics payload پاسخ غنی را حفظ می‌کند، نه فقط متن و یک URL رسانه.        |
| `replyTo`              | مقصدهای پاسخ بومی به پلتفرم می‌رسند.                                                 |
| `thread`               | مقصدهای thread، topic، یا channel thread بومی به پلتفرم می‌رسند.                    |
| `silent`               | suppression اعلان به پلتفرم می‌رسد.                                                  |
| `nativeQuote`          | metadata نقل‌قول انتخاب‌شده به پلتفرم می‌رسد.                                       |
| `messageSendingHooks`  | hookهای ارسال پیام هسته می‌توانند پیش از I/O پلتفرم، محتوا را لغو یا بازنویسی کنند. |
| `batch`                | batchهای renderشده چندبخشی به‌عنوان یک طرح پایدار قابل replay هستند.                |
| `reconcileUnknownSend` | آداپتور می‌تواند بازیابی `unknown_after_send` را بدون replay کور حل کند.            |
| `afterSendSuccess`     | عوارض جانبی after-send محلی کانال یک‌بار اجرا می‌شوند.                               |
| `afterCommit`          | عوارض جانبی after-commit محلی کانال یک‌بار اجرا می‌شوند.                             |

تحویل نهایی best-effort به `reconcileUnknownSend` نیاز ندارد؛ وقتی آداپتور
semantics قابل مشاهده payload را حفظ می‌کند از چرخه عمر مشترک استفاده می‌کند و
اگر persistence صف در دسترس نباشد به I/O مستقیم پلتفرم fallback می‌کند. تحویل
نهایی پایدار الزامی باید به‌صراحت `reconcileUnknownSend` را الزام کند. اگر
آداپتور نمی‌تواند تعیین کند که آیا یک ارسال شروع‌شده/نامعلوم به پلتفرم رسیده است
یا نه، آن قابلیت را اعلام نکنید؛ هسته تحویل پایدار الزامی را پیش از صف‌بندی رد
خواهد کرد.

وقتی یک فراخواننده به تحویل پایدار نیاز دارد، به‌جای ساختن دستی mapها،
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

`messageSendingHooks` به‌طور پیش‌فرض الزامی است. `messageSendingHooks: false` را
فقط برای مسیری تنظیم کنید که عمداً نمی‌تواند hookهای سراسری ارسال پیام را اجرا
کند.

## قرارداد ارسال پایدار

یک ارسال نهایی پایدار semantics سخت‌گیرانه‌تری نسبت به تحویل قدیمی با مالکیت
کانال دارد:

- intent پایدار را پیش از I/O پلتفرم ایجاد کنید.
- اگر تحویل پایدار نتیجه handled برگرداند، به ارسال قدیمی fallback نکنید.
- لغو hook و نتایج بدون ارسال را terminal تلقی کنید.
- `unsupported` را فقط به‌عنوان نتیجه pre-intent تلقی کنید.
- برای دوام الزامی، اگر صف نمی‌تواند ثبت کند که ارسال پلتفرم شروع شده است، پیش
  از I/O پلتفرم شکست بخورید.
- برای تحویل نهایی الزامی و ارسال‌های آماده‌شده الزامی ابزار پیام، `reconcileUnknownSend`
  را preflight کنید؛ بازیابی باید بتواند یک پیام از پیش ارسال‌شده را ack کند یا
  فقط پس از اینکه آداپتور ثابت کرد ارسال اصلی رخ نداده است replay کند.
- برای `best_effort`، شکست‌های نوشتن صف ممکن است به I/O مستقیم پلتفرم fallback کنند.
- سیگنال‌های abort را به بارگذاری رسانه و ارسال‌های پلتفرم منتقل کنید.
- hookهای after-commit را پس از ack صف اجرا کنید؛ fallback مستقیم best-effort
  آن‌ها را پس از I/O موفق پلتفرم اجرا می‌کند چون commit صف پایدار وجود ندارد.
- برای هر شناسه پیام قابل مشاهده پلتفرم رسید برگردانید.
- وقتی پلتفرم می‌تواند بررسی کند که آیا یک ارسال نامطمئن از قبل به کاربر رسیده
  است، از `reconcileUnknownSend` استفاده کنید.

این قرارداد از ارسال‌های تکراری پس از crash جلوگیری می‌کند و مانع دور زدن
hookهای لغو ارسال پیام می‌شود.

## رسیدها

`MessageReceipt` رکورد داخلی جدیدِ چیزی است که پلتفرم پذیرفته است:

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

هنگام سازگار کردن یک نتیجهٔ ارسال موجود، از `createMessageReceiptFromOutboundResults(...)` استفاده کنید. وقتی یک پیام پیش‌نمایش زنده به رسید نهایی تبدیل می‌شود، از `createPreviewMessageReceipt(...)` استفاده کنید. از افزودن فیلدهای owner-local جدید با نام `messageIds` خودداری کنید. `ChannelDeliveryResult.messageIds` قدیمی همچنان در مرزهای سازگاری تولید می‌شود.

## پیش‌نمایش زنده

کانال‌هایی که پیش‌نمایش‌های پیش‌نویس یا به‌روزرسانی‌های پیشرفت را به‌صورت جریانی ارسال می‌کنند، باید قابلیت‌های زنده را اعلام کنند:

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
`deliverWithFinalizableLivePreviewAdapter(...)` استفاده کنید. نهایی‌کننده تصمیم می‌گیرد که آیا پاسخ نهایی پیش‌نمایش را درجا ویرایش کند، یک fallback عادی ارسال کند، وضعیت پیش‌نمایش معلق را دور بیندازد، یک ویرایش ناموفق مبهم را بدون تکرار پیام نگه دارد، و رسید نهایی را برگرداند.

## سیاست تأیید دریافت

گیرنده‌های ورودی که زمان‌بندی تأیید دریافت پلتفرم را کنترل می‌کنند، باید سیاست دریافت را اعلام کنند:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapterهایی که سیاست دریافت را اعلام نمی‌کنند، به‌طور پیش‌فرض چنین هستند:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

وقتی پلتفرم تأیید دریافتی برای به‌تعویق انداختن ندارد، پیش از پردازش ناهمگام از قبل تأیید می‌کند، یا به معناشناسی پاسخ مختص پروتکل نیاز دارد، از مقدار پیش‌فرض استفاده کنید. فقط زمانی یکی از سیاست‌های مرحله‌ای را اعلام کنید که گیرنده واقعاً از زمینهٔ دریافت برای عقب بردن تأیید دریافت پلتفرم استفاده می‌کند.

سیاست‌ها:

| سیاست                 | زمان استفاده                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | پلتفرم می‌تواند پس از تجزیه و ثبت رویداد ورودی تأیید شود.         |
| `after_agent_dispatch` | پلتفرم باید تا زمانی که dispatch عامل پذیرفته شود صبر کند.                     |
| `after_durable_send`   | پلتفرم باید تا زمانی که تحویل نهایی یک تصمیم پایدار داشته باشد صبر کند.                    |
| `manual`               | Plugin مالک تأیید دریافت است، چون معناشناسی پلتفرم با یک مرحلهٔ عمومی مطابقت ندارد. |

در گیرنده‌هایی که وضعیت تأیید دریافت را به تعویق می‌اندازند از `createMessageReceiveContext(...)` استفاده کنید، و وقتی گیرنده باید بررسی کند که آیا یک مرحله سیاست پیکربندی‌شده را برآورده کرده است یا نه، از `shouldAckMessageAfterStage(...)` استفاده کنید.

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

وقتی Adapter آن ویژگی‌ها را اعلام می‌کند، مجموعه آزمون‌های اثبات زنده و دریافت را اضافه کنید. اثبات مفقود باید آزمون را ناموفق کند، نه اینکه سطح پایدار را بی‌صدا گسترش دهد.

## APIهای سازگاری منسوخ‌شده

این APIها برای سازگاری با اشخاص ثالث همچنان قابل import هستند. از آن‌ها برای کد کانال جدید استفاده نکنید.

| API منسوخ‌شده                               | جایگزین                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` برای dispatcherهای سازگاری، یا یک Adapter با `message` برای کد کانال جدید        |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` به‌همراه `channel.turn.runPrepared(...)`، یا یک Adapter با `message` برای کد کانال جدید |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` به‌همراه `channel.turn.runPrepared(...)`، یا یک Adapter با `message` برای کد کانال جدید |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` به‌همراه `channel.turn.runPrepared(...)`، یا یک Adapter با `message` برای کد کانال جدید |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` یا `deliverInboundReplyWithMessageSendContext(...)` از `channel-message-runtime`          |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` از `openclaw/plugin-sdk/channel-message-runtime`                        |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` به‌همراه `channel.turn.runPrepared(...)`، یا یک Adapter با `message` برای کد کانال جدید |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` به‌همراه `channel.turn.runPrepared(...)`، یا یک Adapter با `message` برای کد کانال جدید |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` به‌همراه `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Dispatcherهای سازگاری همچنان می‌توانند از `createReplyPrefixContext(...)`،
`createReplyPrefixOptions(...)`، و `createTypingCallbacks(...)` از طریق نمای message استفاده کنند. کد چرخهٔ عمر جدید باید از زیربخش قدیمی `channel-reply-pipeline` اجتناب کند.

## فهرست بررسی مهاجرت

1. `message: defineChannelMessageAdapter(...)` یا
   `message: createChannelMessageAdapterFromOutbound(...)` را به Plugin کانال اضافه کنید.
2. از ارسال‌های متن، رسانه، و payload، `MessageReceipt` برگردانید.
3. فقط قابلیت‌هایی را اعلام کنید که با رفتار native و آزمون‌ها پشتیبانی می‌شوند.
4. نقشه‌های الزامات پایدار دست‌نویس را با
   `deriveDurableFinalDeliveryRequirements(...)` جایگزین کنید.
5. وقتی کانال پیام‌های پیش‌نویس را درجا ویرایش می‌کند، نهایی‌سازی پیش‌نمایش را از طریق helperهای پیش‌نمایش زنده منتقل کنید.
6. فقط زمانی سیاست تأیید دریافت را اعلام کنید که گیرنده واقعاً بتواند تأیید دریافت پلتفرم را به تعویق بیندازد.
7. helperهای dispatch پاسخ قدیمی را فقط در مرزهای سازگاری نگه دارید.
