---
read_when:
    - می‌خواهید یک ربات Yuanbao را متصل کنید
    - در حال پیکربندی کانال Yuanbao هستید
summary: نمای کلی ربات Yuanbao، ویژگی‌ها و پیکربندی
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T09:05:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Tencent Yuanbao پلتفرم دستیار هوش مصنوعی Tencent است. Plugin کانال OpenClaw
ربات‌های Yuanbao را از طریق وب‌سوکت به OpenClaw متصل می‌کند تا بتوانند از راه
پیام‌های مستقیم و گفت‌وگوهای گروهی با کاربران تعامل داشته باشند.

**وضعیت:** آمادهٔ تولید برای پیام‌های مستقیم ربات + گفت‌وگوهای گروهی. وب‌سوکت تنها حالت اتصال پشتیبانی‌شده است.

---

## شروع سریع

> **به OpenClaw 2026.4.10 یا بالاتر نیاز دارد.** برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.

<Steps>
  <Step title="Add the Yuanbao channel with your credentials">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  مقدار `--token` از قالب `appKey:appSecret` با جداکنندهٔ دونقطه استفاده می‌کند. می‌توانید این موارد را با ساختن یک ربات در تنظیمات برنامهٔ خود از برنامهٔ Yuanbao دریافت کنید.
  </Step>

  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### راه‌اندازی تعاملی (جایگزین)

همچنین می‌توانید از ویزارد تعاملی استفاده کنید:

```bash
openclaw channels login --channel yuanbao
```

برای وارد کردن App ID و App Secret خود، فرمان‌ها را دنبال کنید.

---

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسی می‌تواند به ربات پیام مستقیم بدهد، `dmPolicy` را پیکربندی کنید:

- `"pairing"` - کاربران ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` - فقط کاربرانی که در `allowFrom` فهرست شده‌اند می‌توانند گفت‌وگو کنند
- `"open"` - اجازه به همهٔ کاربران (پیش‌فرض)
- `"disabled"` - غیرفعال کردن همهٔ پیام‌های مستقیم

**تأیید درخواست جفت‌سازی:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### گفت‌وگوهای گروهی

**الزام منشن** (`channels.yuanbao.requireMention`):

- `true` - نیاز به @mention دارد (پیش‌فرض)
- `false` - بدون @mention پاسخ می‌دهد

پاسخ دادن به پیام ربات در یک گفت‌وگوی گروهی به‌عنوان منشن ضمنی در نظر گرفته می‌شود.

---

## نمونه‌های پیکربندی

### راه‌اندازی پایه با سیاست پیام مستقیم باز

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

### محدود کردن پیام‌های مستقیم به کاربران مشخص

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

### غیرفعال کردن الزام @mention در گروه‌ها

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### بهینه‌سازی تحویل پیام‌های خروجی

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### تنظیم راهبرد ادغام متن

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

---

## فرمان‌های رایج

| فرمان     | توضیح                         |
| ---------- | --------------------------- |
| `/help`    | نمایش فرمان‌های موجود         |
| `/status`  | نمایش وضعیت ربات              |
| `/new`     | شروع یک نشست جدید             |
| `/stop`    | توقف اجرای فعلی               |
| `/restart` | راه‌اندازی دوبارهٔ OpenClaw   |
| `/compact` | فشرده‌سازی زمینهٔ نشست        |

> Yuanbao از منوهای بومی فرمان اسلش پشتیبانی می‌کند. هنگام شروع Gateway، فرمان‌ها به‌صورت خودکار با پلتفرم همگام می‌شوند.

---

## عیب‌یابی

### ربات در گفت‌وگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه اضافه شده است
2. مطمئن شوید ربات را @mention می‌کنید (به‌طور پیش‌فرض الزامی است)
3. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در برنامهٔ Yuanbao ساخته و تأیید شده است
2. مطمئن شوید `appKey` و `appSecret` به‌درستی پیکربندی شده‌اند
3. مطمئن شوید Gateway در حال اجراست: `openclaw gateway status`
4. لاگ‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پاسخ‌های خالی یا جایگزین می‌فرستد

1. بررسی کنید آیا مدل هوش مصنوعی محتوای معتبر برمی‌گرداند یا نه
2. پاسخ جایگزین پیش‌فرض این است: "暂时无法解答，你可以换个问题问问我哦"
3. آن را از طریق `channels.yuanbao.fallbackReply` سفارشی کنید

### App Secret نشت کرده است

1. App Secret را در YuanBao APP بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را دوباره راه‌اندازی کنید: `openclaw gateway restart`

---

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

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی یک `accountId` مشخص نمی‌کنند، کدام حساب استفاده شود.

### محدودیت‌های پیام

- `maxChars` - بیشینهٔ تعداد نویسه در یک پیام تکی (پیش‌فرض: `3000` نویسه)
- `mediaMaxMb` - محدودیت بارگذاری/دریافت رسانه (پیش‌فرض: `20` مگابایت)
- `overflowPolicy` - رفتار هنگام عبور پیام از محدودیت: `"split"` (پیش‌فرض) یا `"stop"`

### پخش جریانی

Yuanbao از خروجی پخش جریانی در سطح بلوک پشتیبانی می‌کند. وقتی فعال باشد، ربات متن را هنگام تولید، به‌صورت قطعه‌قطعه ارسال می‌کند.

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

کنترل کنید چند پیام تاریخی در زمینهٔ هوش مصنوعی برای گفت‌وگوهای گروهی گنجانده شود:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### حالت پاسخ به پیام

کنترل کنید ربات هنگام پاسخ دادن در گفت‌وگوهای گروهی چگونه پیام‌ها را نقل‌قول کند:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| مقدار      | رفتار                                                |
| --------- | -------------------------------------------------------- |
| `"off"`   | بدون پاسخ نقل‌قولی                                      |
| `"first"` | فقط نخستین پاسخ را برای هر پیام ورودی نقل‌قول می‌کند (پیش‌فرض) |
| `"all"`   | هر پاسخ را نقل‌قول می‌کند                              |

### تزریق راهنمای Markdown

به‌طور پیش‌فرض، ربات دستورالعمل‌هایی را در پرامپت سیستم تزریق می‌کند تا از پیچیده شدن کل پاسخ مدل هوش مصنوعی در بلوک‌های کد markdown جلوگیری کند.

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

خروجی لاگ پالایش‌نشده را برای شناسه‌های مشخص ربات فعال کنید:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### مسیریابی چندعامله

برای مسیریابی پیام‌های مستقیم یا گروه‌های Yuanbao به عامل‌های مختلف از `bindings` استفاده کنید.

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

فیلدهای مسیریابی:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (پیام مستقیم) یا `"group"` (گفت‌وگوی گروهی)
- `match.peer.id`: شناسهٔ کاربر یا کد گروه

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیمات                                    | توضیح                                            | پیش‌فرض                                |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | فعال/غیرفعال کردن کانال                           | `true`                                 |
| `channels.yuanbao.defaultAccount`          | حساب پیش‌فرض برای مسیریابی خروجی                 | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (استفاده‌شده برای امضا و تولید تیکت)      | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (استفاده‌شده برای امضا)                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | توکن ازپیش‌امضاشده (امضای خودکار تیکت را رد می‌کند) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | نام نمایشی حساب                                  | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | فعال/غیرفعال کردن یک حساب مشخص                   | `true`                                 |
| `channels.yuanbao.dm.policy`               | سیاست پیام مستقیم                                | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | فهرست مجاز پیام مستقیم (فهرست شناسه‌های کاربر)    | -                                      |
| `channels.yuanbao.requireMention`          | الزام @mention در گروه‌ها                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | مدیریت پیام بلند (`split` یا `stop`)              | `split`                                |
| `channels.yuanbao.replyToMode`             | راهبرد پاسخ به پیام در گروه (`off`، `first`، `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | راهبرد خروجی (`merge-text` یا `immediate`)        | `merge-text`                           |
| `channels.yuanbao.minChars`                | ادغام متن: حداقل نویسه‌ها برای شروع ارسال         | `2800`                                 |
| `channels.yuanbao.maxChars`                | ادغام متن: حداکثر نویسه‌ها در هر پیام             | `3000`                                 |
| `channels.yuanbao.idleMs`                  | ادغام متن: مهلت بیکاری پیش از تخلیهٔ خودکار (ms)  | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | محدودیت اندازهٔ رسانه (MB)                       | `20`                                   |
| `channels.yuanbao.historyLimit`            | ورودی‌های زمینهٔ تاریخچهٔ گفت‌وگوی گروهی          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | غیرفعال کردن خروجی پخش جریانی در سطح بلوک         | `false`                                |
| `channels.yuanbao.fallbackReply`           | پاسخ جایگزین وقتی هوش مصنوعی محتوایی برنمی‌گرداند | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | تزریق دستورالعمل‌های ضد پیچیدن markdown           | `true`                                 |
| `channels.yuanbao.debugBotIds`             | شناسه‌های ربات در فهرست مجاز اشکال‌زدایی (لاگ‌های پالایش‌نشده) | `[]`                                   |

---

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا / صوت
- ✅ ویدئو
- ✅ استیکرها / ایموجی سفارشی
- ✅ عناصر سفارشی (کارت‌های لینک و غیره)

### ارسال

- ✅ متن (با پشتیبانی markdown)
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو
- ✅ استیکرها

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های نقل‌قولی (قابل پیکربندی از طریق `replyToMode`)
- ❌ پاسخ‌های رشته‌ای (توسط پلتفرم پشتیبانی نمی‌شود)

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل الزام منشن
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
