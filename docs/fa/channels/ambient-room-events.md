---
read_when:
    - پیکربندی اتاق‌های گروه یا کانال همیشه‌فعال
    - می‌خواهید عامل گفت‌وگوی اتاق را زیر نظر بگیرد، بدون اینکه متن نهایی را به‌صورت خودکار ارسال کند
    - اشکال‌زدایی تایپ کردن و مصرف توکن بدون پیام قابل مشاهده در اتاق
sidebarTitle: Ambient room events
summary: اجازه دهید اتاق‌های گروهی پشتیبانی‌شده زمینهٔ آرامی فراهم کنند، مگر اینکه عامل با ابزار پیام ارسال کند.
title: رویدادهای محیطی اتاق
x-i18n:
    generated_at: "2026-07-02T17:42:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

رویدادهای محیطی اتاق به OpenClaw اجازه می‌دهند گفت‌وگوهای گروه یا کانال را که در آن‌ها به عامل اشاره نشده است، به‌عنوان زمینه‌ی آرام پردازش کند. عامل می‌تواند حافظه و وضعیت نشست را به‌روزرسانی کند، اما اتاق ساکت می‌ماند مگر اینکه عامل صریحاً ابزار `message` را فراخوانی کند.

برای چت‌های گروهی همیشه‌فعال، این حالت پیشنهادی است: `messages.groupChat.unmentionedInbound: "room_event"` را با `messages.groupChat.visibleReplies: "message_tool"` ترکیب کنید. زمانی از آن استفاده کنید که عامل باید گوش بدهد، تصمیم بگیرد چه زمانی پاسخ مفید است، و از الگوی قدیمی پرامپت برای پاسخ دادن با `NO_REPLY` پرهیز کند.

پشتیبانی‌شده در حال حاضر: کانال‌های guild در Discord، کانال‌ها و کانال‌های خصوصی Slack، پیام‌های مستقیم چندنفره Slack، و گروه‌ها یا ابرگروه‌های Telegram. سایر کانال‌های گروهی رفتار گروهی موجود خود را حفظ می‌کنند، مگر اینکه صفحه‌ی کانال آن‌ها بگوید از رویدادهای محیطی اتاق پشتیبانی می‌کنند.

## راه‌اندازی پیشنهادی

رفتار سراسری چت گروهی را تنظیم کنید:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

سپس خود اتاق را با غیرفعال کردن دروازه‌گذاری اشاره برای آن اتاق، به‌صورت همیشه‌فعال پیکربندی کنید. کانال همچنان باید توسط `groupPolicy` معمول خود، فهرست مجاز اتاق، و فهرست مجاز فرستنده مجاز باشد.

پس از ذخیره‌ی پیکربندی، Gateway تنظیمات `messages` را به‌صورت hot-reload بارگذاری می‌کند. فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بارگذاری مجدد پیکربندی غیرفعال باشد.

## چه چیزی تغییر می‌کند

با `messages.groupChat.unmentionedInbound: "room_event"`:

- پیام‌های مجاز گروه یا کانال که در آن‌ها اشاره‌ای نشده است، به رویدادهای آرام اتاق تبدیل می‌شوند
- پیام‌هایی که در آن‌ها اشاره شده است، درخواست‌های کاربر باقی می‌مانند
- فرمان‌های متنی و فرمان‌های بومی، درخواست‌های کاربر باقی می‌مانند
- درخواست‌های لغو یا توقف، درخواست‌های کاربر باقی می‌مانند
- پیام‌های مستقیم، درخواست‌های کاربر باقی می‌مانند

رویدادهای اتاق از تحویل قابل‌مشاهده‌ی سخت‌گیرانه استفاده می‌کنند. متن نهایی دستیار خصوصی است. عامل باید `message(action=send)` را فراخوانی کند تا در اتاق ارسال شود.

## نمونه‌ی Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

وقتی فقط یک کانال باید محیطی باشد، از پیکربندی Discord برای هر کانال استفاده کنید:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## نمونه‌ی Slack

فهرست‌های مجاز کانال Slack ابتدا بر اساس شناسه هستند. از شناسه‌های کانال مانند `C12345678` استفاده کنید، نه `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## نمونه‌ی Telegram

برای گروه‌های Telegram، بات باید بتواند پیام‌های عادی گروه را ببیند. اگر `requireMention: false` است، حالت حریم خصوصی BotFather را غیرفعال کنید یا از راه‌اندازی دیگری برای Telegram استفاده کنید که کل ترافیک گروه را به بات تحویل می‌دهد.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

شناسه‌های گروه Telegram معمولاً عددهای منفی مانند `-1001234567890` هستند. `chat.id` را از `openclaw logs --follow` بخوانید، یک پیام گروه را به بات کمکی شناسه ارسال کنید، یا `getUpdates` در Bot API را بررسی کنید.

## سیاست ویژه‌ی عامل

وقتی چند عامل یک اتاق مشترک دارند اما فقط یکی باید گفت‌وگوی بدون اشاره را به‌عنوان زمینه‌ی محیطی در نظر بگیرد، از بازنویسی عامل استفاده کنید:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

مقدار ویژه‌ی عامل در `agents.list[].groupChat.unmentionedInbound`، مقدار `messages.groupChat.unmentionedInbound` را برای آن عامل بازنویسی می‌کند.

## حالت‌های پاسخ قابل‌مشاهده

`messages.groupChat.visibleReplies` برای درخواست‌های عادی کاربر در گروه/کانال، به‌طور پیش‌فرض `"automatic"` است. وقتی می‌خواهید متن نهایی دستیار بدون نیاز به فراخوانی صریح ابزار پیام، به‌صورت قابل‌مشاهده ارسال شود، همین پیش‌فرض را نگه دارید.

برای اتاق‌های محیطی همیشه‌فعال، همچنان `messages.groupChat.visibleReplies: "message_tool"` پیشنهاد می‌شود، به‌ویژه با مدل‌های نسل جدید و قابل‌اعتماد در ابزارها مانند GPT 5.5. این حالت به عامل اجازه می‌دهد با فراخوانی ابزار پیام تصمیم بگیرد چه زمانی صحبت کند. اگر مدل بدون فراخوانی ابزار متن نهایی برگرداند، OpenClaw آن متن نهایی را خصوصی نگه می‌دارد و فراداده‌ی تحویل سرکوب‌شده را ثبت می‌کند.

رویدادهای اتاق حتی وقتی سایر درخواست‌های گروه از پاسخ‌های خودکار استفاده می‌کنند، سخت‌گیرانه باقی می‌مانند. رویدادهای محیطی اتاق که در آن‌ها اشاره‌ای نشده است همچنان برای خروجی قابل‌مشاهده به `message(action=send)` نیاز دارند.

## تاریخچه

`messages.groupChat.historyLimit` پیش‌فرض سراسری تاریخچه‌ی گروه را کنترل می‌کند. کانال‌ها می‌توانند آن را با `channels.<channel>.historyLimit` بازنویسی کنند، و بعضی کانال‌ها از محدودیت‌های تاریخچه برای هر حساب نیز پشتیبانی می‌کنند.

برای غیرفعال کردن زمینه‌ی تاریخچه‌ی گروه، `historyLimit: 0` را تنظیم کنید.

کانال‌های رویداد اتاق پشتیبانی‌شده، پیام‌های محیطی اخیر اتاق را به‌عنوان زمینه نگه می‌دارند. Telegram یک پنجره‌ی چرخشی همیشه‌فعال برای هر گروه نگه می‌دارد که با `historyLimit` محدود می‌شود؛ نوبت‌های درخواست کاربر، ورودی‌ها را پس از آخرین پاسخ ثبت‌شده‌ی بات انتخاب می‌کنند، در حالی که نوبت‌های رویداد اتاق کل پنجره‌ی اخیر را دریافت می‌کنند تا مدل بتواند پست‌های اخیر خودش را ببیند. کلید حالت بازنشسته‌ی Telegram به نام `includeGroupHistoryContext` توسط `openclaw doctor --fix` حذف می‌شود.

## عیب‌یابی

اگر اتاق در حال تایپ یا مصرف توکن را نشان می‌دهد اما پیام قابل‌مشاهده‌ای نیست:

1. تأیید کنید اتاق توسط فهرست مجاز کانال و فهرست مجاز فرستنده مجاز است.
2. تأیید کنید `requireMention: false` در سطح اتاقی که انتظار دارید تنظیم شده است.
3. بررسی کنید آیا `messages.groupChat.unmentionedInbound` یا بازنویسی عامل برابر `"room_event"` است.
4. گزارش‌ها را برای فراداده‌ی payload نهایی سرکوب‌شده یا `didSendViaMessagingTool: false` بررسی کنید.
5. برای درخواست‌های عادی گروه، اگر می‌خواهید پاسخ‌های نهایی به‌صورت خودکار ارسال شوند، `messages.groupChat.visibleReplies: "automatic"` را نگه دارید یا بازیابی کنید. برای اتاق‌های محیطی که از `message_tool` استفاده می‌کنند، از مدل/زمان‌اجرایی استفاده کنید که ابزارها را با اطمینان فراخوانی می‌کند.

اگر اتاق‌های محیطی Telegram اصلاً فعال نمی‌شوند، حالت حریم خصوصی BotFather را بررسی کنید و تأیید کنید Gateway پیام‌های عادی گروه را دریافت می‌کند.

اگر اتاق‌های محیطی Slack فعال نمی‌شوند، بررسی کنید کلید کانال همان شناسه‌ی کانال Slack باشد و برنامه برای آن نوع اتاق، دامنه‌ی لازم `channels:history` یا `groups:history` را داشته باشد.

## مرتبط

- [گروه‌ها](/fa/channels/groups)
- [Discord](/fa/channels/discord)
- [Slack](/fa/channels/slack)
- [Telegram](/fa/channels/telegram)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [مرجع پیکربندی کانال](/fa/gateway/config-channels)
