---
read_when:
    - می‌خواهید یک ربات Yuanbao را متصل کنید
    - شما در حال پیکربندی کانال Yuanbao هستید
summary: نمای کلی، قابلیت‌ها و پیکربندی ربات Yuanbao
title: یوان‌بائو
x-i18n:
    generated_at: "2026-07-12T09:44:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao پلتفرم دستیار هوش مصنوعی Tencent است. Plugin تحت نگهداری جامعهٔ `openclaw-plugin-yuanbao`، ربات‌های Yuanbao را از طریق WebSocket برای پیام‌های مستقیم و گفت‌وگوهای گروهی به OpenClaw متصل می‌کند.

**وضعیت:** آمادهٔ استفاده در محیط عملیاتی برای پیام‌های مستقیم ربات و گفت‌وگوهای گروهی. WebSocket تنها حالت اتصال پشتیبانی‌شده است. این Plugin را تیم Tencent Yuanbao به‌عنوان یک ورودی کاتالوگ خارجی نگهداری می‌کند، نه هستهٔ OpenClaw؛ جزئیات پیکربندی و رفتار زیر (به‌جز نصب و رابط عمومی CLI) از مستندات خود Plugin گرفته شده‌اند و در برابر کد منبع هستهٔ OpenClaw تأیید نشده‌اند.

## شروع سریع

به OpenClaw نسخهٔ 2026.4.10 یا بالاتر نیاز دارد. نسخه را با `openclaw --version` بررسی کنید؛ با `openclaw update` ارتقا دهید.

<Steps>
  <Step title="افزودن کانال Yuanbao با اطلاعات ورود خود">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  گزینهٔ `--token` از قالب `appKey:appSecret` با جداکنندهٔ دونقطه استفاده می‌کند. این مقادیر را با ایجاد یک ربات در تنظیمات برنامهٔ خود در برنامهٔ Yuanbao دریافت کنید.
  </Step>

  <Step title="راه‌اندازی مجدد Gateway برای اعمال تغییر">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### راه‌اندازی تعاملی (روش جایگزین)

```bash
openclaw channels login --channel yuanbao
```

برای واردکردن App ID و App Secret، اعلان‌ها را دنبال کنید.

## کنترل دسترسی

### پیام‌های مستقیم

`channels.yuanbao.dm.policy`:

| مقدار            | رفتار                                                    |
| ---------------- | ------------------------------------------------------- |
| `open` (پیش‌فرض) | اجازه به همهٔ کاربران                                   |
| `pairing`        | کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ تأیید از طریق CLI |
| `allowlist`      | فقط کاربران موجود در `allowFrom` می‌توانند گفت‌وگو کنند |
| `disabled`       | غیرفعال‌کردن همهٔ پیام‌های مستقیم                       |

تأیید یک درخواست جفت‌سازی:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### گفت‌وگوهای گروهی

`channels.yuanbao.requireMention` (پیش‌فرض `true`): پیش از پاسخ‌دادن ربات در گروه، به @mention نیاز دارد. پاسخ‌دادن به پیام خود ربات به‌عنوان اشارهٔ ضمنی در نظر گرفته می‌شود.

## نمونه‌های پیکربندی

راه‌اندازی پایه با سیاست باز پیام مستقیم:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

محدودکردن پیام‌های مستقیم به کاربران مشخص:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

غیرفعال‌کردن الزام @mention در گروه‌ها:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

تنظیم تحویل خروجی:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

برای ارسال هر قطعه بدون بافرکردن، `outboundQueueStrategy: "immediate"` را تنظیم کنید.

## فرمان‌های رایج

| فرمان      | توضیح                              |
| ---------- | ---------------------------------- |
| `/help`    | نمایش فرمان‌های موجود              |
| `/status`  | نمایش وضعیت ربات                   |
| `/new`     | آغاز یک نشست جدید                  |
| `/stop`    | توقف اجرای جاری                    |
| `/restart` | راه‌اندازی مجدد OpenClaw           |
| `/compact` | فشرده‌سازی زمینهٔ نشست             |

Yuanbao از منوهای بومی فرمان‌های اسلش پشتیبانی می‌کند؛ هنگام شروع Gateway، فرمان‌ها به‌طور خودکار با پلتفرم همگام می‌شوند.

## عیب‌یابی

**ربات در گفت‌وگوهای گروهی پاسخ نمی‌دهد:**

1. تأیید کنید ربات به گروه افزوده شده است
2. تأیید کنید ربات را @mention می‌کنید (به‌طور پیش‌فرض الزامی است)
3. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

**ربات پیام‌ها را دریافت نمی‌کند:**

1. تأیید کنید ربات در برنامهٔ Yuanbao ایجاد و تأیید شده است
2. تأیید کنید `appKey` و `appSecret` به‌درستی پیکربندی شده‌اند
3. تأیید کنید Gateway در حال اجرا است: `openclaw gateway status`
4. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

**ربات پاسخ خالی یا جایگزین ارسال می‌کند:**

1. بررسی کنید آیا مدل هوش مصنوعی محتوای معتبری برمی‌گرداند
2. پاسخ جایگزین پیش‌فرض: "暂时无法解答，你可以换个问题问问我哦"
3. با `channels.yuanbao.fallbackReply` سفارشی‌سازی کنید

**App Secret افشا شده است:**

1. App Secret را در برنامهٔ Yuanbao بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را راه‌اندازی مجدد کنید: `openclaw gateway restart`

## پیکربندی پیشرفته

### چند حساب

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` تعیین می‌کند هنگامی که APIهای خروجی یک `accountId` مشخص نمی‌کنند، از کدام حساب استفاده شود.

### محدودیت‌های پیام

- `maxChars`: حداکثر تعداد نویسهٔ یک پیام (پیش‌فرض `3000`)
- `mediaMaxMb`: محدودیت بارگذاری/دریافت رسانه (پیش‌فرض `20` مگابایت)
- `overflowPolicy`: رفتار هنگام عبور پیام از محدودیت، `"split"` (پیش‌فرض) یا `"stop"`

### پخش جریانی

Yuanbao از خروجی جریانی در سطح بلوک پشتیبانی می‌کند؛ ربات متن را هم‌زمان با تولید، به‌صورت قطعه‌قطعه ارسال می‌کند.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

برای ارسال پاسخ کامل در یک پیام، `disableBlockStreaming: true` را تنظیم کنید.

### زمینهٔ تاریخچهٔ گفت‌وگوی گروهی

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

تعداد پیام‌های تاریخی گنجانده‌شده در زمینهٔ هوش مصنوعی برای گفت‌وگوهای گروهی را کنترل می‌کند.

### حالت پاسخ به

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| مقدار   | رفتار                                                     |
| ------- | --------------------------------------------------------- |
| `off`   | بدون پاسخ نقل‌قولی                                        |
| `first` | فقط نخستین پاسخ به هر پیام ورودی را نقل‌قول می‌کند (پیش‌فرض) |
| `all`   | همهٔ پاسخ‌ها را نقل‌قول می‌کند                            |

### تزریق راهنمای Markdown

به‌طور پیش‌فرض، ربات یک دستور در اعلان سیستم تزریق می‌کند تا مدل کل پاسخ را در یک بلوک کد Markdown قرار ندهد.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### حالت اشکال‌زدایی

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

خروجی گزارش پالایش‌نشده را برای شناسه‌های ربات فهرست‌شده فعال می‌کند.

### مسیریابی چندعاملی

برای هدایت پیام‌های مستقیم یا گروه‌های Yuanbao به عامل‌های مختلف، از `bindings` استفاده کنید:

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (پیام مستقیم) یا `"group"` (گفت‌وگوی گروهی)
- `match.peer.id`: شناسهٔ کاربر یا کد گروه

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                      | توضیح                                             | پیش‌فرض                               |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | فعال/غیرفعال‌کردن کانال                           | `true`                                 |
| `channels.yuanbao.defaultAccount`          | حساب پیش‌فرض برای مسیریابی خروجی                  | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (امضاکردن + تولید بلیت)                   | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (امضاکردن)                             | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | توکن ازپیش‌امضاشده (صرف‌نظر از امضای خودکار بلیت) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | نام نمایشی حساب                                   | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | فعال/غیرفعال‌کردن یک حساب مشخص                    | `true`                                 |
| `channels.yuanbao.dm.policy`               | سیاست پیام مستقیم                                | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | فهرست مجاز پیام مستقیم (فهرست شناسه‌های کاربر)    | -                                      |
| `channels.yuanbao.requireMention`          | الزام @mention در گروه‌ها                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | مدیریت پیام بلند (`split` یا `stop`)              | `split`                                |
| `channels.yuanbao.replyToMode`             | راهبرد پاسخ به در گروه (`off`، `first`، `all`)    | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | راهبرد خروجی (`merge-text` یا `immediate`)        | `merge-text`                           |
| `channels.yuanbao.minChars`                | ادغام متن: حداقل نویسه برای آغاز ارسال            | `2800`                                 |
| `channels.yuanbao.maxChars`                | ادغام متن: حداکثر نویسه در هر پیام                | `3000`                                 |
| `channels.yuanbao.idleMs`                  | ادغام متن: مهلت بی‌کاری پیش از تخلیهٔ خودکار (میلی‌ثانیه) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | محدودیت اندازهٔ رسانه (مگابایت)                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | تعداد ورودی‌های زمینهٔ تاریخچهٔ گفت‌وگوی گروهی    | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | غیرفعال‌کردن خروجی جریانی در سطح بلوک             | `false`                                |
| `channels.yuanbao.fallbackReply`           | پاسخ جایگزین هنگامی که مدل محتوایی برنمی‌گرداند   | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | تزریق دستورهای جلوگیری از بسته‌بندی Markdown      | `true`                                 |
| `channels.yuanbao.debugBotIds`             | شناسه‌های ربات در فهرست مجاز اشکال‌زدایی (گزارش‌های پالایش‌نشده) | `[]`                                   |

## انواع پیام پشتیبانی‌شده

**دریافت:** متن، تصویر، فایل، صدا/پیام صوتی، ویدئو، برچسب/ایموجی سفارشی، عناصر سفارشی (کارت‌های پیوند).

**ارسال:** متن (Markdown)، تصویر، فایل، صدا، ویدئو، برچسب.

**رشته‌ها و پاسخ‌ها:** پاسخ‌های نقل‌قولی (قابل پیکربندی از طریق `replyToMode`)؛ پلتفرم از پاسخ‌های رشته‌ای پشتیبانی نمی‌کند.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و فرایند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
