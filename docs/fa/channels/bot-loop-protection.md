---
read_when:
    - پیکربندی پیام‌های کانالِ نوشته‌شده توسط ربات
    - تنظیم محافظت در برابر حلقهٔ بات‌به‌بات
sidebarTitle: Bot loop protection
summary: پیش‌فرض‌های محافظت در برابر حلقهٔ بات‌به‌بات و بازنویسی‌های کانال
title: محافظت در برابر حلقهٔ ربات
x-i18n:
    generated_at: "2026-06-27T17:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# محافظت در برابر حلقه‌ی بات

OpenClaw می‌تواند پیام‌هایی را که بات‌های دیگر در کانال‌های پشتیبانی‌کننده از `allowBots` نوشته‌اند بپذیرد.
وقتی این مسیر فعال باشد، محافظت حلقه‌ایِ زوجی جلوگیری می‌کند که دو هویت بات
به‌طور نامحدود به یکدیگر پاسخ دهند.

این محافظ توسط اجراکننده‌ی اصلی پاسخ‌های ورودی اعمال می‌شود. هر کانال پشتیبان،
رویداد ورودی خودش را به واقعیت‌های عمومی نگاشت می‌کند: حساب یا دامنه، شناسه‌ی گفتگو،
شناسه‌ی بات فرستنده، و شناسه‌ی بات گیرنده. سپس هسته زوج مشارکت‌کننده را در هر دو
جهت ردیابی می‌کند، یک بودجه‌ی پنجره‌ی لغزان اعمال می‌کند، و پس از عبور از بودجه،
آن زوج را برای مدت زمان سردسازی سرکوب می‌کند.

## پیش‌فرض‌ها

محافظت در برابر حلقه‌ی زوجی زمانی فعال است که یک کانال اجازه دهد پیام‌های نوشته‌شده
توسط بات به dispatch برسند. پیش‌فرض‌های داخلی عبارت‌اند از:

- `maxEventsPerWindow: 20` - یک زوج بات می‌تواند درون پنجره ۲۰ رویداد مبادله کند
- `windowSeconds: 60` - طول پنجره‌ی لغزان
- `cooldownSeconds: 60` - زمان سرکوب پس از عبور زوج از بودجه

این محافظ بر پیام‌های عادی نوشته‌شده توسط انسان، استقرارهای تک‌باتی،
فیلتر کردن پیام‌های خودی، یا پاسخ‌های یک‌باره‌ی بات که زیر بودجه می‌مانند اثری ندارد.

## پیکربندی پیش‌فرض‌های مشترک

`channels.defaults.botLoopProtection` را یک‌بار تنظیم کنید تا به هر کانال پشتیبان
یک خط مبنای یکسان بدهید. بازنویسی‌های کانال و حساب همچنان می‌توانند سطح‌های منفرد
را تنظیم کنند.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

فقط زمانی `enabled: false` را تنظیم کنید که سیاست کانال شما عمداً گفتگوهای
بات‌به‌بات را بدون سرکوب خودکار مجاز می‌داند.

## بازنویسی برای هر کانال یا حساب

کانال‌های پشتیبان پیکربندی خودشان را روی پیش‌فرض مشترک لایه‌بندی می‌کنند. ترتیب اولویت این است:

- `channels.<channel>.<room-or-space>.botLoopProtection`، وقتی کانال از بازنویسی‌های هر گفتگو پشتیبانی می‌کند
- `channels.<channel>.accounts.<account>.botLoopProtection`، وقتی کانال از حساب‌ها پشتیبانی می‌کند
- `channels.<channel>.botLoopProtection`، وقتی کانال از پیش‌فرض‌های سطح بالا پشتیبانی می‌کند
- `channels.defaults.botLoopProtection`
- پیش‌فرض‌های داخلی

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## پشتیبانی کانال

- Discord: واقعیت‌های بومی `author.bot`، کلیدگذاری‌شده بر اساس حساب Discord، کانال، و زوج بات.
- Slack: واقعیت‌های بومی `bot_id` برای پیام‌های پذیرفته‌شده‌ی نوشته‌شده توسط بات، کلیدگذاری‌شده بر اساس حساب Slack، کانال، و زوج بات.
- Matrix: حساب‌های بات Matrix پیکربندی‌شده، کلیدگذاری‌شده بر اساس حساب Matrix، اتاق، و زوج بات پیکربندی‌شده.
- Google Chat: واقعیت‌های بومی `sender.type=BOT` برای پیام‌های پذیرفته‌شده‌ی نوشته‌شده توسط بات، کلیدگذاری‌شده بر اساس حساب، فضا، و زوج بات.

کانال‌هایی که هویت ورودی قابل اتکای بات را آشکار نمی‌کنند، همچنان از فیلترهای
عادی پیام خودی و سیاست دسترسی خود استفاده می‌کنند. آن‌ها نباید تا زمانی که بتوانند
هر دو مشارکت‌کننده در زوج بات را شناسایی کنند، به این محافظ وارد شوند.

برای جزئیات پیاده‌سازی Plugin به [زمان اجرای SDK](/fa/plugins/sdk-runtime#reusable-runtime-utilities) مراجعه کنید.
