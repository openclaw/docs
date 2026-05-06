---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اعتبارنامه‌های LINE نیاز دارید
    - می‌خواهید گزینه‌های پیام مخصوص LINE را داشته باشید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin LINE Messaging API
title: خط
x-i18n:
    generated_at: "2026-05-06T09:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق API پیام‌رسانی LINE به OpenClaw متصل می‌شود. این Plugin به‌عنوان گیرنده Webhook
روی Gateway اجرا می‌شود و برای احراز هویت از توکن دسترسی کانال + رمز کانال شما استفاده می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، گفت‌وگوهای گروهی، رسانه، مکان‌ها، پیام‌های Flex،
پیام‌های قالبی و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی کانال، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

نسخه محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و یک کانال **API پیام‌رسانی** اضافه کنید.
3. **توکن دسترسی کانال** و **رمز کانال** را از تنظیمات کانال کپی کنید.
4. در تنظیمات API پیام‌رسانی، **استفاده از webhook** را فعال کنید.
5. URL webhook را روی نقطه پایانی Gateway خود تنظیم کنید (HTTPS لازم است):

```
https://gateway-host/line/webhook
```

Gateway به تأیید webhook در LINE (GET) و رویدادهای ورودی (POST) پاسخ می‌دهد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را متناسب با آن به‌روزرسانی کنید.

نکته امنیتی:

- تأیید امضای LINE به بدنه وابسته است (HMAC روی بدنه خام)، بنابراین OpenClaw پیش از تأیید، محدودیت‌های سخت‌گیرانه بدنه و timeout اعمال می‌کند.
- OpenClaw رویدادهای webhook را از بایت‌های خام درخواستِ تأییدشده پردازش می‌کند. مقدارهای `req.body` که توسط middleware بالادستی تغییر یافته‌اند، برای ایمنی یکپارچگی امضا نادیده گرفته می‌شوند.

## پیکربندی

پیکربندی حداقلی:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

پیکربندی DM عمومی:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

متغیرهای محیطی (فقط حساب پیش‌فرض):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

فایل‌های توکن/رمز:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` و `secretFile` باید به فایل‌های عادی اشاره کنند. Symlinkها رد می‌شوند.

چند حساب:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## کنترل دسترسی

پیام‌های مستقیم به‌صورت پیش‌فرض روی جفت‌سازی هستند. فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند و
پیام‌های آن‌ها تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

فهرست‌های مجاز و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های کاربری مجاز LINE برای DMها؛ `dmPolicy: "open"` به `["*"]` نیاز دارد
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های کاربری مجاز LINE برای گروه‌ها
- بازنویسی‌های هر گروه: `channels.line.groups.<groupId>.allowFrom`
- نکته زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، runtime برای بررسی گروه‌ها به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس هستند. شناسه‌های معتبر شبیه این هستند:

- کاربر: `U` + 32 نویسه hex
- گروه: `C` + 32 نویسه hex
- اتاق: `R` + 32 نویسه hex

## رفتار پیام

- متن در قطعه‌های 5000 نویسه‌ای تقسیم می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها، در صورت امکان، به کارت‌های Flex تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ LINE تا زمانی که agent کار می‌کند، قطعه‌های کامل را همراه با انیمیشن بارگذاری دریافت می‌کند.
- دانلود رسانه با `channels.line.mediaMaxMb` محدود می‌شود (پیش‌فرض 10).
- رسانه ورودی پیش از تحویل به agent زیر `~/.openclaw/media/inbound/` ذخیره می‌شود، مطابق با محل ذخیره رسانه مشترکی که Pluginهای کانال بسته‌بندی‌شده دیگر استفاده می‌کنند.

## داده کانال (پیام‌های غنی)

برای ارسال پاسخ‌های سریع، مکان‌ها، کارت‌های Flex یا پیام‌های قالبی از `channelData.line` استفاده کنید.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin مربوط به LINE همچنین یک دستور `/card` برای presetهای پیام Flex ارائه می‌کند:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از اتصال‌های گفت‌وگوی ACP (پروتکل ارتباط agent) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` گفت‌وگوی فعلی LINE را بدون ایجاد رشته فرزند به یک نشست ACP متصل می‌کند.
- اتصال‌های ACP پیکربندی‌شده و نشست‌های ACP فعالِ متصل به گفت‌وگو، در LINE مانند کانال‌های گفت‌وگوی دیگر کار می‌کنند.

برای جزئیات، [agentهای ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin مربوط به LINE از ارسال تصویر، ویدیو و فایل صوتی از طریق ابزار پیام agent پشتیبانی می‌کند. رسانه از طریق مسیر تحویل اختصاصی LINE با مدیریت مناسب پیش‌نمایش و رهگیری ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE با تولید خودکار پیش‌نمایش ارسال می‌شوند.
- **ویدیوها**: با مدیریت صریح پیش‌نمایش و content-type ارسال می‌شوند.
- **صدا**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای HTTPS عمومی باشند. OpenClaw پیش از تحویل URL به LINE، hostname مقصد را اعتبارسنجی می‌کند و هدف‌های loopback، link-local و شبکه خصوصی را رد می‌کند.

ارسال‌های رسانه عمومی، وقتی مسیر اختصاصی LINE در دسترس نباشد، به مسیر موجودِ فقط تصویر برمی‌گردند.

## عیب‌یابی

- **تأیید webhook ناموفق است:** مطمئن شوید URL webhook از HTTPS استفاده می‌کند و
  `channelSecret` با LINE console مطابقت دارد.
- **رویداد ورودی وجود ندارد:** تأیید کنید مسیر webhook با `channels.line.webhookPath`
  مطابقت دارد و Gateway از LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از محدودیت پیش‌فرض بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و gate کردن mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
