---
read_when:
    - پیکربندی اتاق‌های گروهی یا کانالی همیشه‌روشن
    - می‌خواهید عامل گفت‌وگوهای اتاق را زیر نظر بگیرد، بدون اینکه متن نهایی را به‌طور خودکار ارسال کند
    - اشکال‌زدایی تایپ کردن و مصرف توکن بدون پیام قابل‌مشاهده در اتاق
sidebarTitle: Ambient room events
summary: به اتاق‌های گروهی پشتیبانی‌شده اجازه دهید زمینهٔ بی‌صدایی فراهم کنند، مگر اینکه عامل با ابزار پیام ارسال کند
title: رویدادهای محیطی اتاق
x-i18n:
    generated_at: "2026-06-27T17:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

رویدادهای محیطی اتاق به OpenClaw اجازه می‌دهند گفت‌وگوهای گروهی یا کانالیِ بدون اشاره مستقیم را به‌عنوان زمینه‌ای بی‌صدا پردازش کند. عامل می‌تواند حافظه و وضعیت نشست را به‌روزرسانی کند، اما اتاق ساکت می‌ماند مگر اینکه عامل صراحتا ابزار `message` را فراخوانی کند.

برای گفت‌وگوهای گروهی همیشه‌فعال، این حالت توصیه‌شده است: `messages.groupChat.unmentionedInbound: "room_event"` را با `messages.groupChat.visibleReplies: "message_tool"` ترکیب کنید. زمانی از آن استفاده کنید که عامل باید گوش بدهد، تصمیم بگیرد چه زمانی پاسخ مفید است، و از الگوی قدیمی پرامپت برای پاسخ دادن با `NO_REPLY` پرهیز کند.

در حال حاضر پشتیبانی می‌شود: کانال‌های سرور Discord، کانال‌ها و کانال‌های خصوصی Slack، پیام‌های مستقیم چندنفره Slack، و گروه‌ها یا ابرگروه‌های Telegram. سایر کانال‌های گروهی رفتار گروهی موجود خود را حفظ می‌کنند، مگر اینکه صفحه کانال آن‌ها بگوید از رویدادهای محیطی اتاق پشتیبانی می‌کنند.

## راه‌اندازی پیشنهادی

رفتار سراسری گفت‌وگوی گروهی را تنظیم کنید:

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

سپس خود اتاق را با غیرفعال کردن الزام اشاره برای آن اتاق، همیشه‌فعال پیکربندی کنید. کانال همچنان باید توسط `groupPolicy` معمول خود، فهرست مجاز اتاق، و فهرست مجاز فرستنده اجازه داشته باشد.

پس از ذخیره پیکربندی، Gateway تنظیمات `messages` را به‌صورت داغ بازبارگذاری می‌کند. فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بازبارگذاری پیکربندی غیرفعال باشد.

## چه چیزی تغییر می‌کند

با `messages.groupChat.unmentionedInbound: "room_event"`:

- پیام‌های گروهی یا کانالی مجاز بدون اشاره مستقیم به رویدادهای بی‌صدای اتاق تبدیل می‌شوند
- پیام‌های دارای اشاره مستقیم درخواست‌های کاربر باقی می‌مانند
- فرمان‌های متنی و فرمان‌های بومی درخواست‌های کاربر باقی می‌مانند
- درخواست‌های لغو یا توقف درخواست‌های کاربر باقی می‌مانند
- پیام‌های مستقیم درخواست‌های کاربر باقی می‌مانند

رویدادهای اتاق از تحویل نمایان سخت‌گیرانه استفاده می‌کنند. متن نهایی دستیار خصوصی است. عامل باید برای ارسال در اتاق `message(action=send)` را فراخوانی کند.

## مثال Discord

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

## مثال Slack

فهرست‌های مجاز کانال Slack ابتدا بر شناسه تکیه دارند. از شناسه‌های کانال مانند `C12345678` استفاده کنید، نه `#channel-name`.

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

## مثال Telegram

برای گروه‌های Telegram، ربات باید بتواند پیام‌های عادی گروه را ببیند. اگر `requireMention: false` است، حالت حریم خصوصی BotFather را غیرفعال کنید یا از راه‌اندازی دیگری برای Telegram استفاده کنید که کل ترافیک گروه را به ربات تحویل می‌دهد.

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

شناسه‌های گروه Telegram معمولا اعداد منفی مانند `-1001234567890` هستند. `chat.id` را از `openclaw logs --follow` بخوانید، یک پیام گروهی را به یک ربات کمک‌کننده شناسه فوروارد کنید، یا Bot API `getUpdates` را بررسی کنید.

## سیاست اختصاصی عامل

وقتی چند عامل یک اتاق را به اشتراک می‌گذارند اما فقط یکی باید گفت‌وگوی بدون اشاره مستقیم را به‌عنوان زمینه محیطی در نظر بگیرد، از یک بازنویسی عامل استفاده کنید:

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

مقدار اختصاصی عامل در `agents.list[].groupChat.unmentionedInbound` مقدار `messages.groupChat.unmentionedInbound` را برای آن عامل بازنویسی می‌کند.

## حالت‌های پاسخ نمایان

`messages.groupChat.visibleReplies` برای درخواست‌های عادی کاربر در گروه/کانال به‌طور پیش‌فرض `"automatic"` است. وقتی می‌خواهید متن نهایی دستیار بدون نیاز به فراخوانی صریح ابزار پیام به‌صورت نمایان ارسال شود، همین پیش‌فرض را نگه دارید.

برای اتاق‌های محیطی همیشه‌فعال، همچنان `messages.groupChat.visibleReplies: "message_tool"` توصیه می‌شود، به‌ویژه با مدل‌های نسل جدید و قابل‌اعتماد در ابزارها مانند GPT 5.5. این حالت به عامل اجازه می‌دهد با فراخوانی ابزار پیام تصمیم بگیرد چه زمانی صحبت کند. اگر مدل بدون فراخوانی ابزار، متن نهایی برگرداند، OpenClaw آن متن نهایی را خصوصی نگه می‌دارد و فراداده تحویل سرکوب‌شده را ثبت می‌کند.

رویدادهای اتاق حتی وقتی سایر درخواست‌های گروهی از پاسخ‌های خودکار استفاده می‌کنند سخت‌گیرانه باقی می‌مانند. رویدادهای محیطی اتاق بدون اشاره مستقیم همچنان برای خروجی نمایان به `message(action=send)` نیاز دارند.

## تاریخچه

`messages.groupChat.historyLimit` پیش‌فرض سراسری تاریخچه گروه را کنترل می‌کند. کانال‌ها می‌توانند آن را با `channels.<channel>.historyLimit` بازنویسی کنند، و برخی کانال‌ها از محدودیت‌های تاریخچه برای هر حساب نیز پشتیبانی می‌کنند.

برای غیرفعال کردن زمینه تاریخچه گروه، `historyLimit: 0` را تنظیم کنید.

کانال‌های دارای پشتیبانی از رویداد اتاق، پیام‌های محیطی اخیر اتاق را به‌عنوان زمینه نگه می‌دارند. Discord تاریخچه رویداد اتاق را تا زمانی نگه می‌دارد که یک ارسال نمایان Discord با موفقیت انجام شود، بنابراین زمینه بی‌صدا پیش از تحویل با ابزار پیام از دست نمی‌رود.

## عیب‌یابی

اگر اتاق وضعیت تایپ یا مصرف توکن را نشان می‌دهد اما پیام نمایانی وجود ندارد:

1. تأیید کنید اتاق توسط فهرست مجاز کانال و فهرست مجاز فرستنده اجازه دارد.
2. تأیید کنید `requireMention: false` در سطح اتاقی که انتظار دارید تنظیم شده است.
3. بررسی کنید آیا `messages.groupChat.unmentionedInbound` یا بازنویسی عامل `"room_event"` است.
4. لاگ‌ها را برای فراداده بار نهایی سرکوب‌شده یا `didSendViaMessagingTool: false` بررسی کنید.
5. برای درخواست‌های عادی گروه، اگر می‌خواهید پاسخ‌های نهایی به‌صورت خودکار ارسال شوند، `messages.groupChat.visibleReplies: "automatic"` را نگه دارید یا بازگردانید. برای اتاق‌های محیطی که از `message_tool` استفاده می‌کنند، از مدل/زمان‌اجرایی استفاده کنید که ابزارها را قابل‌اعتماد فراخوانی می‌کند.

اگر اتاق‌های محیطی Telegram اصلا فعال نمی‌شوند، حالت حریم خصوصی BotFather را بررسی کنید و تأیید کنید Gateway پیام‌های عادی گروه را دریافت می‌کند.

اگر اتاق‌های محیطی Slack فعال نمی‌شوند، تأیید کنید کلید کانال همان شناسه کانال Slack است و برنامه برای نوع آن اتاق دامنه موردنیاز `channels:history` یا `groups:history` را دارد.

## مرتبط

- [گروه‌ها](/fa/channels/groups)
- [Discord](/fa/channels/discord)
- [Slack](/fa/channels/slack)
- [Telegram](/fa/channels/telegram)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
- [مرجع پیکربندی کانال](/fa/gateway/config-channels)
