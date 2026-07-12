---
read_when:
    - شما در حال ساخت یا بازآرایی مسیر ارسال یک Plugin کانال پیام‌رسانی هستید
    - به تحویل پایدار پاسخ نهایی، رسیدها، نهایی‌سازی پیش‌نمایش زنده، یا سیاست تأیید دریافت نیاز دارید
    - شما در حال مهاجرت از کمک‌تابع‌های `channel-message`، `channel-message-runtime` یا کمک‌تابع‌های قدیمی ارسال پاسخ هستید
summary: 'API چرخهٔ حیات پیام خروجی برای Pluginهای کانال: آداپتورها، رسیدها، ارسال‌های پایدار، پیش‌نمایش زنده و ابزارهای کمکی خط لولهٔ پاسخ'
title: API خروجی کانال
x-i18n:
    generated_at: "2026-07-12T10:32:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Pluginهای کانال، رفتار پیام خروجی را از
`openclaw/plugin-sdk/channel-outbound` ارائه می‌کنند. برای هماهنگ‌سازی
دریافت/زمینه/ارسال از `openclaw/plugin-sdk/channel-inbound` استفاده کنید.

هسته مالک صف‌بندی، ماندگاری، سیاست عمومی تلاش مجدد، هوک‌ها، رسیدها و
ابزار مشترک `message` است. Plugin مالک فراخوانی‌های بومی ارسال/ویرایش/حذف،
نرمال‌سازی مقصد، رشته‌بندی پلتفرم، نقل‌قول‌های انتخاب‌شده، پرچم‌های اعلان،
وضعیت حساب و اثرات جانبی مختص پلتفرم است.

## آداپتور

بیشتر Pluginها یک آداپتور `message` تعریف می‌کنند:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

فقط قابلیت‌هایی را اعلام کنید که انتقال بومی واقعاً حفظ می‌کند. هر قابلیت
اعلام‌شده برای ارسال، رسید، پیش‌نمایش زنده و تأیید دریافت را با کمک‌کننده‌های
قراردادی صادرشده از این زیرمسیر پوشش دهید.

## پاک‌سازی متن ساده

وقتی یک آداپتور خروجی باید برچسب‌های قالب‌بندی HTML پشتیبانی‌شده را به
نشانه‌گذاری متنی سبک تبدیل کند، از `sanitizeForPlainText(...)` استفاده کنید.
حالت پیش‌فرض، نشانگرهای موجود چت‌مانند برای متن ضخیم و خط‌خورده را حفظ می‌کند.
تنها زمانی `{ style: "markdown" }` را ارسال کنید که کانال نتیجه را دوباره
به‌صورت Markdown تجزیه می‌کند:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

سبک Markdown از `**bold**` و `~~strikethrough~~` استفاده می‌کند؛ متن کج و
کد درون‌خطی در هر دو سبک به‌ترتیب نشانگرهای `_italic_` و بک‌تیک را حفظ
می‌کنند. سبک را در مرز کانال انتخاب کنید، نه با بازنویسی متن نشانگرها پس از
پاک‌سازی.

## شواهد تحویل

یک `MessageReceipt` نتیجه بازگردانده‌شده توسط آداپتور کانال را ثبت می‌کند.
شناسه‌های مشخص پیام در پلتفرم نشان می‌دهند که مسیر ارسال پلتفرم پیام را
پذیرفته است؛ آن‌ها ثابت نمی‌کنند که دستگاه گیرنده پیام را نمایش داده یا
خوانده است. رسیدهای بدون شناسه پیام پلتفرم فقط فراداده رسید محلی هستند.
کانال‌هایی که رسید خواندن یا وضعیت تحویل به دستگاه دارند، باید این واقعیت‌ها
را از طریق مسیری جداگانه و مختص کانال پیگیری کنند.

اگر آداپتور کانال بتواند ثابت کند که تلاش مجدد برای یک خطا نمی‌تواند باعث
ارسال تکراری قابل‌مشاهده برای گیرنده شود و هیچ فراخوانی قادر به نهایی‌سازی
آغاز نشده است، از `openclaw/plugin-sdk/error-runtime` خطای
`new PlatformMessageNotDispatchedError("...", { cause: error })` را پرتاب
کنید. سپس هسته می‌تواند شواهد منقضی‌شده تلاش برای ارسال را پاک کند و نیت
صف‌شده را با ایمنی دوباره امتحان کند. فقط آداپتوری که مالک مرز ارسال نهایی
است می‌تواند این ادعا را مطرح کند. پس از آغاز فراخوانی نهایی‌سازی/ارسال یا
بازگرداندن نتیجه‌ای مبهم، هرگز از این نشانگر استفاده نکنید؛ علامت‌گذاری
نادرست می‌تواند پیام‌ها را تکراری کند.

## آداپتورهای خروجی موجود

اگر کانال از قبل آداپتور `outbound` سازگاری دارد، به‌جای تکرار کد ارسال،
آداپتور پیام را از آن استخراج کنید:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## ارسال‌های ماندگار

کمک‌کننده‌های ارسال زمان اجرا نیز در `channel-outbound` قرار دارند:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- کمک‌کننده‌های پخش جریانی/پیشرفت پیش‌نویس، مانند `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` یکی از نتایج صریح زیر را بازمی‌گرداند:

| نتیجه           | معنا                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `sent`          | حداقل یک پیام قابل‌مشاهده پلتفرم توسط مسیر ارسال پلتفرم پذیرفته شده است                           |
| `suppressed`    | هیچ پیام پلتفرمی نباید مفقود تلقی شود                                                             |
| `partial_failed` | حداقل یک پیام پلتفرم پیش از شکست یک محموله یا اثر جانبی بعدی پذیرفته شده است                       |
| `failed`        | هیچ رسید پلتفرمی تولید نشده است                                                                   |

وقتی یک دسته شامل محموله‌های ارسال‌شده، سرکوب‌شده و ناموفق است، از
`payloadOutcomes` استفاده کنید. لغو هوک را از نتیجه خالی قدیمی تحویل مستقیم
استنباط نکنید.

## پذیرش تحویل معوق

وقتی یک حساب حل‌شده نمی‌تواند تحویل خروجی یا معوق مدیریت‌شده توسط هسته را
با ایمنی بپذیرد، از `message.durableFinal.admitDeferredDelivery(...)` استفاده
کنید. هسته این هوک را پیش از کار خروجی زنده، از جمله مسیرهایی که ماندگاری صف
را رد می‌کنند، و دوباره پیش از بازپخش یک نیت بازیابی‌شده، به‌صورت همگام
فراخوانی می‌کند. زمینه شامل `cfg`، `channel`، `to`، `accountId` و یک `phase`
با مقدار `live` یا `recovery` است.

برای ادامه، `{ status: "allowed" }` را بازگردانید. وقتی تحویل نباید ماندگار،
مستقیماً ارسال یا بازپخش شود، `{ status: "permanent_rejection", reason }` را
بازگردانید. رد شدن در حالت زنده پیش از ایجاد صف، هوک‌های پیام یا کار پلتفرم
شکست می‌خورد. رد شدن در حالت بازیابی، رکورد صف‌شده را ناموفق علامت می‌زند و
تطبیق و بازپخش را رد می‌کند. حذف هوک به‌معنای مجاز بودن است.

این هوک یک تصمیم پذیرش همگام است، نه مسیر ارسال. فقط پیکربندی یا وضعیت
زمان اجرای ازپیش‌بارگذاری‌شده را بخوانید؛ عملیات شبکه، فایل‌سیستم یا سایر
ورودی/خروجی‌های ناهمگام را انجام ندهید. آزمون‌های قرارداد باید هر دو مرحله و
هر دو گونه نتیجه را از طریق `ChannelMessageDurableFinalAdapter` در
`openclaw/plugin-sdk/channel-outbound` پوشش دهند.

## ارسال سازگاری

ارسال پاسخ ورودی را با `dispatchChannelInboundReply(...)` از
`channel-inbound` سرهم کنید. تحویل پلتفرم را در آداپتور تحویل نگه دارید؛ برای
آداپتورهای پیام، ارسال‌های ماندگار، رسیدها، پیش‌نمایش زنده و گزینه‌های خط
لوله پاسخ از `channel-outbound` استفاده کنید.
