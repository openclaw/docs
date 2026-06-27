---
read_when:
    - در حال ساخت یا بازآرایی مسیر ارسال یک Plugin کانال پیام‌رسانی هستید
    - به تحویل پایدار پاسخ نهایی، رسیدها، نهایی‌سازی پیش‌نمایش زنده، یا سیاست تأیید دریافت نیاز دارید
    - شما در حال مهاجرت از `channel-message`، `channel-message-runtime`، یا کمک‌کننده‌های قدیمی ارسال پاسخ هستید
summary: 'API چرخهٔ حیات پیام خروجی برای Pluginهای کانال: آداپتورها، رسیدها، ارسال‌های پایدار، پیش‌نمایش زنده، و راهنماهای خط لولهٔ پاسخ'
title: API خروجی کانال
x-i18n:
    generated_at: "2026-06-27T18:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Pluginهای کانال باید رفتار پیام خروجی را از
`openclaw/plugin-sdk/channel-outbound` ارائه کنند. برای هماهنگ‌سازی دریافت/زمینه/ارسال از
`openclaw/plugin-sdk/channel-inbound` استفاده کنید.

هسته مالک صف‌بندی، پایداری، سیاست تلاش مجدد عمومی، hookها، رسیدها و ابزار مشترک
`message` است. Plugin مالک فراخوانی‌های بومی ارسال/ویرایش/حذف، نرمال‌سازی مقصد، رشته‌بندی پلتفرم، نقل‌قول‌های انتخاب‌شده، پرچم‌های اعلان، وضعیت حساب و اثرات جانبی مخصوص پلتفرم است.

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

فقط قابلیت‌هایی را اعلام کنید که انتقال بومی واقعا حفظ می‌کند. هر قابلیت اعلام‌شده برای ارسال، رسید، پیش‌نمایش زنده و تأیید دریافت را با کمک‌تابع‌های قرارداد صادرشده از این زیربخش پوشش دهید.

## آداپتورهای خروجی موجود

اگر کانال از قبل یک آداپتور سازگار `outbound` دارد، به‌جای تکرار کد ارسال، آداپتور پیام را از آن مشتق کنید:

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

## ارسال‌های پایدار

کمک‌تابع‌های ارسال زمان اجرا نیز روی `channel-outbound` قرار دارند:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- کمک‌تابع‌های پیش‌نویس جریان‌دهی/پیشرفت مانند `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` یکی از نتایج صریح زیر را برمی‌گرداند:

- `sent`: حداقل یک پیام قابل مشاهده پلتفرم تحویل داده شد.
- `suppressed`: هیچ پیام پلتفرمی نباید مفقود تلقی شود.
- `partial_failed`: حداقل یک پیام پلتفرم پیش از شکست یک payload یا اثر جانبی بعدی تحویل داده شد.
- `failed`: هیچ رسید پلتفرمی تولید نشد.

وقتی یک دسته، payloadهای ارسال‌شده، سرکوب‌شده و ناموفق را ترکیب می‌کند، از `payloadOutcomes` استفاده کنید.
لغو hook را از نتیجه خالی تحویل مستقیم legacy استنباط نکنید.

## ارسال سازگاری

ارسال پاسخ ورودی باید از طریق
`dispatchChannelInboundReply(...)` از `channel-inbound` ساخته شود. تحویل پلتفرم را در آداپتور تحویل نگه دارید؛ برای آداپتورهای پیام، ارسال‌های پایدار، رسیدها، پیش‌نمایش زنده و گزینه‌های خط لوله پاسخ از `channel-outbound` استفاده کنید.
