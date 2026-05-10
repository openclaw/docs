---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اعتبارنامهٔ LINE نیاز دارید
    - گزینه‌های پیام مخصوص LINE را می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin LINE Messaging API
title: خط
x-i18n:
    generated_at: "2026-05-10T19:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. Plugin به‌عنوان گیرنده‌ی Webhook
روی Gateway اجرا می‌شود و برای احراز هویت از channel access token + channel secret شما
استفاده می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، چت‌های گروهی، رسانه، مکان‌ها، پیام‌های Flex،
پیام‌های قالبی، و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌گفتگوها
پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی کانال، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و یک کانال **Messaging API** اضافه کنید.
3. **Channel access token** و **Channel secret** را از تنظیمات کانال کپی کنید.
4. در تنظیمات Messaging API، گزینه‌ی **Use webhook** را فعال کنید.
5. URL وبهوک را روی endpoint گیت‌وی خود تنظیم کنید (HTTPS الزامی است):

```
https://gateway-host/line/webhook
```

Gateway به راستی‌آزمایی وبهوک LINE (GET) و رویدادهای ورودی (POST) پاسخ می‌دهد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته‌ی امنیتی:

- راستی‌آزمایی امضای LINE به بدنه وابسته است (HMAC روی بدنه‌ی خام)، بنابراین OpenClaw پیش از راستی‌آزمایی محدودیت‌های سخت‌گیرانه‌ی بدنه و timeout اعمال می‌کند.
- OpenClaw رویدادهای وبهوک را از بایت‌های خام درخواستِ راستی‌آزمایی‌شده پردازش می‌کند. مقدارهای `req.body` که توسط میان‌افزار بالادستی تغییر شکل داده شده‌اند، برای ایمنی یکپارچگی امضا نادیده گرفته می‌شوند.

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

فایل‌های توکن/راز:

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

`tokenFile` و `secretFile` باید به فایل‌های معمولی اشاره کنند. symlinkها رد می‌شوند.

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

پیام‌های مستقیم به‌صورت پیش‌فرض روی جفت‌سازی هستند. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند و
پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlistها و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های کاربری LINE در allowlist برای DMها؛ `dmPolicy: "open"` به `["*"]` نیاز دارد
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های کاربری LINE در allowlist برای گروه‌ها
- بازنویسی‌های هر گروه: `channels.line.groups.<groupId>.allowFrom`
- گروه‌های دسترسی فرستنده‌ی ایستا را می‌توان از `allowFrom`، `groupAllowFrom`، و `allowFrom` هر گروه با `accessGroup:<name>` ارجاع داد.
- نکته‌ی runtime: اگر `channels.line` کاملاً وجود نداشته باشد، runtime برای بررسی گروه‌ها به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس هستند. شناسه‌های معتبر به این شکل‌اند:

- کاربر: `U` + 32 نویسه‌ی hex
- گروه: `C` + 32 نویسه‌ی hex
- اتاق: `R` + 32 نویسه‌ی hex

## رفتار پیام

- متن در قطعه‌های 5000 نویسه‌ای تقسیم می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها در صورت امکان به کارت‌های Flex
  تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ LINE قطعه‌های کامل را همراه با یک پویانمایی loading
  هنگام کار کردن agent دریافت می‌کند.
- دانلودهای رسانه با `channels.line.mediaMaxMb` محدود می‌شوند (پیش‌فرض 10).
- رسانه‌ی ورودی پیش از ارسال به agent، در `~/.openclaw/media/inbound/` ذخیره می‌شود،
  مطابق با ذخیره‌گاه رسانه‌ی مشترکی که سایر Pluginهای کانال bundled از آن استفاده می‌کنند.

## داده‌های کانال (پیام‌های غنی)

از `channelData.line` برای ارسال پاسخ‌های سریع، مکان‌ها، کارت‌های Flex، یا پیام‌های قالبی
استفاده کنید.

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

LINE از bindingهای مکالمه‌ی ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` چت فعلی LINE را بدون ایجاد یک child thread به یک session ACP bind می‌کند.
- bindingهای ACP پیکربندی‌شده و sessionهای ACP فعالِ متصل به مکالمه روی LINE مانند سایر کانال‌های مکالمه کار می‌کنند.

برای جزئیات، [agentهای ACP](/fa/tools/acp-agents) را ببینید.

## رسانه‌ی خروجی

Plugin مربوط به LINE از ارسال تصویر، ویدئو، و فایل‌های صوتی از طریق ابزار پیام agent پشتیبانی می‌کند. رسانه از طریق مسیر تحویل ویژه‌ی LINE با مدیریت مناسب preview و tracking ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE همراه با تولید خودکار preview ارسال می‌شوند.
- **ویدئوها**: با مدیریت صریح preview و content-type ارسال می‌شوند.
- **صوت**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه‌ی خروجی باید URLهای عمومی HTTPS باشند. OpenClaw پیش از تحویل URL به LINE، hostname هدف را اعتبارسنجی می‌کند و هدف‌های loopback، link-local، و شبکه‌ی خصوصی را رد می‌کند.

ارسال‌های رسانه‌ی عمومی، وقتی مسیر ویژه‌ی LINE در دسترس نباشد، به مسیر موجودِ فقط تصویر برمی‌گردند.

## عیب‌یابی

- **راستی‌آزمایی Webhook شکست می‌خورد:** مطمئن شوید URL وبهوک HTTPS است و
  `channelSecret` با Console مربوط به LINE مطابقت دارد.
- **هیچ رویداد ورودی وجود ندارد:** تأیید کنید مسیر وبهوک با `channels.line.webhookPath`
  مطابقت دارد و Gateway از سمت LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از محدودیت پیش‌فرض بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه‌ی کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و gating بر اساس mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
