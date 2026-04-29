---
read_when:
    - می‌خواهید یک ربات Yuanbao را متصل کنید
    - در حال پیکربندی کانال Yuanbao هستید
summary: مرور کلی ربات Yuanbao، ویژگی‌ها و پیکربندی
title: یوان‌بائو
x-i18n:
    generated_at: "2026-04-29T22:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao پلتفرم دستیار هوش مصنوعی Tencent است. Plugin کانال OpenClaw
ربات‌های Yuanbao را از طریق WebSocket به OpenClaw وصل می‌کند تا بتوانند
از راه پیام‌های مستقیم و گفت‌وگوهای گروهی با کاربران تعامل داشته باشند.

**وضعیت:** آماده تولید برای پیام‌های مستقیم ربات + گفت‌وگوهای گروهی. WebSocket تنها حالت اتصال پشتیبانی‌شده است.

---

## شروع سریع

> **به OpenClaw نسخه 2026.4.10 یا بالاتر نیاز دارد.** برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.

<Steps>
  <Step title="کانال Yuanbao را با اعتبارنامه‌های خود اضافه کنید">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  مقدار `--token` از قالب `appKey:appSecret` جداشده با دونقطه استفاده می‌کند. می‌توانید این‌ها را با ساخت یک ربات در تنظیمات برنامه خود از برنامه Yuanbao دریافت کنید.
  </Step>

  <Step title="پس از تکمیل راه‌اندازی، Gateway را دوباره راه‌اندازی کنید تا تغییرات اعمال شوند">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### راه‌اندازی تعاملی (جایگزین)

همچنین می‌توانید از راه‌انداز تعاملی استفاده کنید:

```bash
openclaw channels login --channel yuanbao
```

اعلان‌ها را دنبال کنید تا شناسه برنامه و رمز برنامه خود را وارد کنید.

---

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسانی می‌توانند به ربات پیام مستقیم بدهند، `dmPolicy` را پیکربندی کنید:

- `"pairing"` — کاربران ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` — فقط کاربران فهرست‌شده در `allowFrom` می‌توانند گفت‌وگو کنند
- `"open"` — همه کاربران مجاز هستند (پیش‌فرض)
- `"disabled"` — همه پیام‌های مستقیم را غیرفعال می‌کند

**تأیید درخواست جفت‌سازی:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### گفت‌وگوهای گروهی

**الزام اشاره** (`channels.yuanbao.requireMention`):

- `true` — اشاره @ الزامی است (پیش‌فرض)
- `false` — بدون اشاره @ پاسخ بده

پاسخ دادن به پیام ربات در یک گفت‌وگوی گروهی، به‌عنوان اشاره ضمنی در نظر گرفته می‌شود.

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

### غیرفعال کردن الزام اشاره @ در گروه‌ها

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### بهینه‌سازی تحویل پیام خروجی

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

| فرمان      | توضیح                         |
| ---------- | ----------------------------- |
| `/help`    | نمایش فرمان‌های موجود         |
| `/status`  | نمایش وضعیت ربات              |
| `/new`     | شروع یک نشست جدید             |
| `/stop`    | توقف اجرای فعلی               |
| `/restart` | راه‌اندازی دوباره OpenClaw    |
| `/compact` | فشرده‌سازی زمینه نشست         |

> Yuanbao از منوهای بومی فرمان‌های اسلش پشتیبانی می‌کند. هنگام شروع Gateway، فرمان‌ها به‌طور خودکار با پلتفرم همگام‌سازی می‌شوند.

---

## عیب‌یابی

### ربات در گفت‌وگوهای گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه اضافه شده است
2. مطمئن شوید به ربات اشاره @ می‌کنید (به‌صورت پیش‌فرض الزامی است)
3. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در برنامه Yuanbao ساخته و تأیید شده است
2. مطمئن شوید `appKey` و `appSecret` به‌درستی پیکربندی شده‌اند
3. مطمئن شوید Gateway در حال اجرا است: `openclaw gateway status`
4. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پاسخ‌های خالی یا جایگزین می‌فرستد

1. بررسی کنید که مدل هوش مصنوعی محتوای معتبر برمی‌گرداند
2. پاسخ جایگزین پیش‌فرض این است: "暂时无法解答，你可以换个问题问问我哦"
3. آن را از طریق `channels.yuanbao.fallbackReply` سفارشی کنید

### رمز برنامه فاش شد

1. رمز برنامه را در برنامه YuanBao بازنشانی کنید
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

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی `accountId` مشخص نمی‌کنند، کدام حساب استفاده شود.

### محدودیت‌های پیام

- `maxChars` — بیشینه تعداد نویسه برای یک پیام (پیش‌فرض: `3000` نویسه)
- `mediaMaxMb` — محدودیت بارگذاری/بارگیری رسانه (پیش‌فرض: `20` مگابایت)
- `overflowPolicy` — رفتار زمانی که پیام از حد مجاز فراتر می‌رود: `"split"` (پیش‌فرض) یا `"stop"`

### پخش جریانی

Yuanbao از خروجی پخش جریانی در سطح بلوک پشتیبانی می‌کند. وقتی فعال باشد، ربات متن را هنگام تولید به‌صورت قطعه‌ای می‌فرستد.

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

### زمینه تاریخچه گفت‌وگوی گروهی

کنترل کنید چند پیام تاریخی در زمینه هوش مصنوعی برای گفت‌وگوهای گروهی گنجانده شود:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### حالت پاسخ به

کنترل کنید ربات هنگام پاسخ در گفت‌وگوهای گروهی چگونه پیام‌ها را نقل‌قول کند:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| مقدار     | رفتار                                                     |
| --------- | --------------------------------------------------------- |
| `"off"`   | بدون پاسخ نقل‌قولی                                       |
| `"first"` | فقط نخستین پاسخ برای هر پیام ورودی را نقل‌قول کن (پیش‌فرض) |
| `"all"`   | هر پاسخ را نقل‌قول کن                                    |

### تزریق راهنمای Markdown

به‌صورت پیش‌فرض، ربات دستورالعمل‌هایی را در اعلان سیستم تزریق می‌کند تا از قرار گرفتن کل پاسخ مدل هوش مصنوعی در بلوک‌های کد markdown جلوگیری کند.

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

خروجی گزارش پاک‌سازی‌نشده را برای شناسه‌های مشخص ربات فعال کنید:

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

از `bindings` برای مسیریابی پیام‌های مستقیم یا گروه‌های Yuanbao به عامل‌های مختلف استفاده کنید.

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
- `match.peer.id`: شناسه کاربر یا کد گروه

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                      | توضیح                                             | پیش‌فرض                                |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | فعال/غیرفعال کردن کانال                          | `true`                                 |
| `channels.yuanbao.defaultAccount`          | حساب پیش‌فرض برای مسیریابی خروجی                 | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | کلید برنامه (استفاده‌شده برای امضا و تولید بلیت) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | رمز برنامه (استفاده‌شده برای امضا)               | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | توکن از پیش امضاشده (امضای خودکار بلیت را رد می‌کند) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | نام نمایشی حساب                                  | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | فعال/غیرفعال کردن یک حساب مشخص                   | `true`                                 |
| `channels.yuanbao.dm.policy`               | سیاست پیام مستقیم                                | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | فهرست مجاز پیام مستقیم (فهرست شناسه‌های کاربر)   | —                                      |
| `channels.yuanbao.requireMention`          | الزام اشاره @ در گروه‌ها                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | مدیریت پیام بلند (`split` یا `stop`)             | `split`                                |
| `channels.yuanbao.replyToMode`             | راهبرد پاسخ به در گروه (`off`، `first`، `all`)   | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | راهبرد خروجی (`merge-text` یا `immediate`)       | `merge-text`                           |
| `channels.yuanbao.minChars`                | ادغام متن: کمینه نویسه‌ها برای آغاز ارسال        | `2800`                                 |
| `channels.yuanbao.maxChars`                | ادغام متن: بیشینه نویسه‌ها در هر پیام            | `3000`                                 |
| `channels.yuanbao.idleMs`                  | ادغام متن: مهلت بیکاری پیش از تخلیه خودکار (میلی‌ثانیه) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | محدودیت اندازه رسانه (مگابایت)                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | ورودی‌های زمینه تاریخچه گفت‌وگوی گروهی           | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | غیرفعال کردن خروجی پخش جریانی در سطح بلوک        | `false`                                |
| `channels.yuanbao.fallbackReply`           | پاسخ جایگزین زمانی که هوش مصنوعی محتوایی برنمی‌گرداند | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | تزریق دستورالعمل‌های ضد بسته‌بندی markdown        | `true`                                 |
| `channels.yuanbao.debugBotIds`             | شناسه‌های ربات در فهرست مجاز اشکال‌زدایی (گزارش‌های پاک‌سازی‌نشده) | `[]`                                   |

---

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت / صدا
- ✅ ویدئو
- ✅ برچسب‌ها / شکلک سفارشی
- ✅ عناصر سفارشی (کارت‌های پیوند و غیره)

### ارسال

- ✅ متن (با پشتیبانی markdown)
- ✅ تصویرها
- ✅ فایل‌ها
- ✅ صوت
- ✅ ویدئو
- ✅ برچسب‌ها

### رشته‌ها و پاسخ‌ها

- ✅ پاسخ‌های نقل‌قولی (قابل پیکربندی از طریق `replyToMode`)
- ❌ پاسخ‌های رشته‌ای (توسط پلتفرم پشتیبانی نمی‌شود)

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
