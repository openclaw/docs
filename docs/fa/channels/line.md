---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اعتبارنامه‌های LINE نیاز دارید
    - می‌خواهید گزینه‌های پیام اختصاصی LINE را داشته باشید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin ‏LINE Messaging API
title: خط
x-i18n:
    generated_at: "2026-05-02T11:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. این Plugin به‌عنوان گیرنده Webhook روی Gateway اجرا می‌شود و برای احراز هویت از channel access token + channel secret شما استفاده می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، گفتگوهای گروهی، رسانه، مکان‌ها، پیام‌های Flex، پیام‌های قالبی و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی کانال، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

نسخه محلی checkout (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و یک کانال **Messaging API** اضافه کنید.
3. **Channel access token** و **Channel secret** را از تنظیمات کانال کپی کنید.
4. در تنظیمات Messaging API گزینه **Use webhook** را فعال کنید.
5. نشانی Webhook را روی endpoint مربوط به Gateway خود تنظیم کنید (HTTPS الزامی است):

```
https://gateway-host/line/webhook
```

Gateway به تأیید Webhook مربوط به LINE (GET) و رویدادهای ورودی (POST) پاسخ می‌دهد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- تأیید امضای LINE به body وابسته است (HMAC روی body خام)، بنابراین OpenClaw پیش از تأیید، محدودیت‌های سخت‌گیرانه body و timeout را اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های خام درخواست تأییدشده پردازش می‌کند. مقدارهای `req.body` که توسط middleware بالادستی تغییر شکل داده شده‌اند، برای ایمنی یکپارچگی امضا نادیده گرفته می‌شوند.

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

متغیرهای محیطی (فقط حساب پیش‌فرض):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

فایل‌های token/secret:

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

`tokenFile` و `secretFile` باید به فایل‌های معمولی اشاره کنند. Symlinkها رد می‌شوند.

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

پیام‌های مستقیم به‌صورت پیش‌فرض روی pairing هستند. فرستندگان ناشناس یک کد pairing دریافت می‌کنند و
پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlistها و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های کاربری LINE قرارگرفته در allowlist برای DMها
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های کاربری LINE قرارگرفته در allowlist برای گروه‌ها
- بازنویسی‌های هر گروه: `channels.line.groups.<groupId>.allowFrom`
- نکته زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروه به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس هستند. شناسه‌های معتبر به این شکل هستند:

- کاربر: `U` + 32 hex chars
- گروه: `C` + 32 hex chars
- اتاق: `R` + 32 hex chars

## رفتار پیام

- متن در 5000 نویسه بخش‌بندی می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ code blockها و جدول‌ها در صورت امکان به کارت‌های Flex
  تبدیل می‌شوند.
- پاسخ‌های streaming بافر می‌شوند؛ LINE در حین کار agent، بخش‌های کامل را همراه با انیمیشن بارگذاری دریافت می‌کند.
- دانلود رسانه با `channels.line.mediaMaxMb` محدود می‌شود (پیش‌فرض 10).
- رسانه ورودی پیش از ارسال به agent در `~/.openclaw/media/inbound/` ذخیره می‌شود،
  مطابق با media store مشترکی که توسط دیگر Pluginهای کانال bundled استفاده می‌شود.

## داده کانال (پیام‌های غنی)

از `channelData.line` برای ارسال پاسخ‌های سریع، مکان‌ها، کارت‌های Flex یا پیام‌های قالبی استفاده کنید.

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

LINE از bindingهای مکالمه ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` گفتگوی LINE فعلی را بدون ایجاد child thread به یک session ACP متصل می‌کند.
- bindingهای ACP پیکربندی‌شده و sessionهای ACP فعالِ وابسته به مکالمه روی LINE مانند دیگر کانال‌های مکالمه کار می‌کنند.

برای جزئیات، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin مربوط به LINE از ارسال تصویر، ویدیو و فایل‌های صوتی از طریق ابزار پیام agent پشتیبانی می‌کند. رسانه از مسیر تحویل اختصاصی LINE با مدیریت مناسب preview و tracking ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE با تولید خودکار preview ارسال می‌شوند.
- **ویدیوها**: با مدیریت صریح preview و content-type ارسال می‌شوند.
- **صدا**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای عمومی HTTPS باشند. OpenClaw پیش از سپردن URL به LINE، نام میزبان مقصد را اعتبارسنجی می‌کند و اهداف loopback، link-local و شبکه خصوصی را رد می‌کند.

ارسال‌های رسانه عمومی، وقتی مسیر اختصاصی LINE در دسترس نباشد، به مسیر موجودِ فقط تصویر برمی‌گردند.

## عیب‌یابی

- **تأیید Webhook ناموفق است:** مطمئن شوید URL مربوط به Webhook از HTTPS استفاده می‌کند و
  `channelSecret` با کنسول LINE مطابق است.
- **هیچ رویداد ورودی وجود ندارد:** تأیید کنید مسیر Webhook با `channels.line.webhookPath`
  مطابق است و Gateway از طرف LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از محدودیت پیش‌فرض بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و gating بر اساس mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و hardening
