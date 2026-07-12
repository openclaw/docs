---
read_when:
    - شما در حال ساخت یا بازآرایی مسیر دریافت یک Plugin کانال پیام‌رسانی هستید
    - به ساخت مشترک زمینهٔ ورودی، ثبت نشست یا ارسال پاسخِ آماده نیاز دارید
    - شما در حال مهاجرت راهنماهای قدیمی نوبت کانال به APIهای ورودی/پیام هستید
summary: 'ابزارهای کمکی رویدادهای ورودی برای Pluginهای کانال: ساخت زمینه، هماهنگ‌سازی اجراکنندهٔ مشترک، رکورد نشست و ارسال پاسخ آماده‌شده'
title: API ورودی کانال
x-i18n:
    generated_at: "2026-07-12T10:32:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

مسیرهای دریافت کانال از یک جریان پیروی می‌کنند:

```text
رویداد پلتفرم -> داده‌ها/زمینه ورودی -> پاسخ عامل -> تحویل پیام
```

برای عادی‌سازی رویداد ورودی، قالب‌بندی، ریشه‌ها و هماهنگ‌سازی از `openclaw/plugin-sdk/channel-inbound` استفاده کنید.
برای ارسال بومی، رسید، تحویل پایدار و رفتار پیش‌نمایش زنده از
`openclaw/plugin-sdk/channel-outbound` استفاده کنید.

## توابع کمکی هسته

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: داده‌های عادی‌سازی‌شده کانال را
  به زمینه اعلان/نشست تبدیل می‌کند. فراداده فرستنده/گفت‌وگوی متعلق به کانال را
  از طریق `channelContext` منتقل کنید؛ قلاب‌های Plugin آن را به‌صورت `ctx.channelContext`
  مشاهده می‌کنند. برای فیلدهای مختص کانال، `PluginHookChannelSenderContext` یا
  `PluginHookChannelChatContext` را از این زیرمسیر گسترش دهید.
- `runChannelInboundEvent(...)`: مراحل دریافت، طبقه‌بندی، پیش‌بررسی، حل،
  ثبت، ارسال و نهایی‌سازی را برای یک رویداد ورودی پلتفرم اجرا می‌کند.
- `dispatchChannelInboundReply(...)`: یک پاسخ ورودی ازپیش‌ساخته‌شده را با
  یک آداپتور تحویل ثبت و ارسال می‌کند.

کانال‌های همراه/بومی که از قبل شیء زمان‌اجرای تزریق‌شده Plugin را دریافت می‌کنند،
می‌توانند به‌جای واردکردن مستقیم این زیرمسیر، همان توابع کمکی را از طریق
`runtime.channel.inbound.*` فراخوانی کنند:

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

برای ارسال‌گرهای سازگاری که تحویل پلتفرم را در آداپتور تحویل نگه می‌دارند،
ورودی‌های `dispatchChannelInboundReply(...)` را سرهم کنید. مسیرهای ارسال جدید
باید در عوض از آداپتورهای پیام و توابع کمکی پیام پایدار در
`channel-outbound` استفاده کنند.

## مهاجرت

نام‌های مستعار زمان‌اجرای `runtime.channel.turn.*` حذف شده‌اند. استفاده کنید از:

- `runtime.channel.inbound.run(...)` برای رویدادهای ورودی خام.
- `runtime.channel.inbound.dispatchReply(...)` برای زمینه‌های پاسخ سرهم‌شده.
- `runtime.channel.inbound.buildContext(...)` برای بارهای زمینه ورودی.
- `runtime.channel.inbound.runPreparedReply(...)`، منسوخ‌شده، فقط برای
  مسیرهای ارسال آماده متعلق به کانال که از قبل بستار ارسال خود را
  سرهم می‌کنند.

کد جدید Plugin نباید APIهای کانال با نام `turn` معرفی کند. واژگان نوبت مدل یا
عامل را در کد عامل/ارائه‌دهنده نگه دارید؛ Pluginهای کانال از اصطلاحات ورودی،
پیام، تحویل و پاسخ استفاده می‌کنند.
