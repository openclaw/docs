---
read_when:
    - شما در حال ساخت یا بازآرایی مسیر دریافت یک Plugin کانال پیام‌رسانی هستید
    - به ساخت زمینهٔ ورودی مشترک، ضبط نشست، یا ارسال پاسخ آماده نیاز دارید
    - شما در حال مهاجرت کمک‌کننده‌های قدیمی نوبت کانال به APIهای ورودی/پیام هستید
summary: 'دستیارهای رویداد ورودی برای Pluginهای کانال: ساخت زمینه، هماهنگ‌سازی runner مشترک، رکورد نشست، و ارسال پاسخ آماده‌شده'
title: API ورودی کانال
x-i18n:
    generated_at: "2026-06-27T18:30:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Channel Pluginها باید مسیرهای دریافت را با اسم‌های inbound و message مدل‌سازی کنند:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

از `openclaw/plugin-sdk/channel-inbound` برای نرمال‌سازی رویداد ورودی،
قالب‌بندی، ریشه‌ها، و ارکستراسیون استفاده کنید. از
`openclaw/plugin-sdk/channel-outbound` برای رفتار بومی
ارسال، رسید، تحویل پایدار، و پیش‌نمایش زنده استفاده کنید.

## راهنماهای هسته

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: فکت‌های نرمال‌شده‌ی کانال را به
  زمینه‌ی prompt/session نگاشت کنید. از `channelContext` برای عبور دادن
  فراداده‌ی sender/chat متعلق به کانال به hook پلاگین `ctx.channelContext` استفاده کنید؛
  `PluginHookChannelSenderContext` یا `PluginHookChannelChatContext` را از این
  زیرمسیر برای فیلدهای مخصوص کانال گسترش دهید.
- `runChannelInboundEvent(...)`: ingest، طبقه‌بندی، preflight، resolve،
  ثبت، dispatch، و finalize را برای یک رویداد ورودی پلتفرم اجرا کنید.
- `dispatchChannelInboundReply(...)`: یک پاسخ ورودی از پیش assembled شده را
  با یک آداپتر تحویل ثبت و dispatch کنید.

runtime پلاگین تزریق‌شده، همین راهنماهای سطح بالا را زیر
`runtime.channel.inbound.*` برای کانال‌های bundled/native که از قبل شیء
runtime را دریافت می‌کنند، ارائه می‌دهد.

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

dispatcherهای سازگاری باید ورودی‌های `dispatchChannelInboundReply(...)` را assemble کنند
و تحویل پلتفرم را در آداپتر تحویل نگه دارند. مسیرهای ارسال جدید باید
آداپترهای message و راهنماهای message پایدار را ترجیح دهند.

## مهاجرت

aliasهای runtime قدیمی `runtime.channel.turn.*` حذف شدند. استفاده کنید از:

- `runtime.channel.inbound.run(...)` برای رویدادهای ورودی خام.
- `runtime.channel.inbound.dispatchReply(...)` برای زمینه‌های پاسخ assembled شده.
- `runtime.channel.inbound.buildContext(...)` برای payloadهای زمینه‌ی inbound.
- `runtime.channel.inbound.runPreparedReply(...)` فقط برای مسیرهای dispatch آماده‌ی متعلق به کانال
  که از قبل closure مربوط به dispatch خودشان را assemble می‌کنند.

کد Plugin جدید نباید APIهای کانال با نام `turn` معرفی کند. واژگان turn مربوط به model یا
agent را داخل کد agent/provider نگه دارید؛ Pluginهای کانال از اصطلاحات inbound،
message، delivery، و reply استفاده می‌کنند.
