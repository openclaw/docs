---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اعتبارنامهٔ LINE نیاز دارید
    - گزینه‌های پیام مخصوص LINE را می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin LINE Messaging API
title: خط
x-i18n:
    generated_at: "2026-04-29T22:26:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. این Plugin به‌عنوان گیرنده Webhook روی Gateway اجرا می‌شود و برای احراز هویت از توکن دسترسی کانال + راز کانال شما استفاده می‌کند.

وضعیت: Plugin همراه. پیام‌های مستقیم، گفت‌وگوهای گروهی، رسانه، مکان‌ها، پیام‌های Flex، پیام‌های قالبی، و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها پشتیبانی نمی‌شوند.

## Plugin همراه

LINE در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین ساخت‌های بسته‌بندی‌شده معمول به نصب جداگانه نیاز ندارند.

اگر روی یک ساخت قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که LINE را مستثنی می‌کند، وقتی بسته npm فعلی منتشر شد آن را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

اگر npm بسته متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا زمانی که قطار بسته npm به‌روز شود از یک ساخت بسته‌بندی‌شده فعلی OpenClaw یا یک checkout محلی استفاده کنید.

checkout محلی (هنگام اجرا از یک repo گیت):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و یک کانال **Messaging API** اضافه کنید.
3. **Channel access token** و **Channel secret** را از تنظیمات کانال کپی کنید.
4. **Use webhook** را در تنظیمات Messaging API فعال کنید.
5. URL Webhook را روی endpoint Gateway خود تنظیم کنید (HTTPS لازم است):

```
https://gateway-host/line/webhook
```

Gateway به راستی‌آزمایی Webhook از LINE (GET) و رویدادهای ورودی (POST) پاسخ می‌دهد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- راستی‌آزمایی امضای LINE به بدنه وابسته است (HMAC روی بدنه خام)، بنابراین OpenClaw پیش از راستی‌آزمایی، محدودیت‌های سخت‌گیرانه بدنه و timeout اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های خام درخواست راستی‌آزمایی‌شده پردازش می‌کند. مقادیر `req.body` که توسط middleware بالادستی تغییر داده شده‌اند، برای ایمنی یکپارچگی امضا نادیده گرفته می‌شوند.

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

پیام‌های مستقیم به‌صورت پیش‌فرض روی pairing هستند. فرستندگان ناشناس یک کد pairing دریافت می‌کنند و پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlistها و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های کاربر LINE در allowlist برای DMها
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های کاربر LINE در allowlist برای گروه‌ها
- overrideهای هر گروه: `channels.line.groups.<groupId>.allowFrom`
- نکته زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروهی به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس هستند. شناسه‌های معتبر شبیه این‌ها هستند:

- کاربر: `U` + 32 کاراکتر hex
- گروه: `C` + 32 کاراکتر hex
- اتاق: `R` + 32 کاراکتر hex

## رفتار پیام

- متن در 5000 کاراکتر بخش‌بندی می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها در صورت امکان به کارت‌های Flex تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ LINE در حالی که عامل کار می‌کند، بخش‌های کامل را همراه با یک انیمیشن loading دریافت می‌کند.
- دانلودهای رسانه با `channels.line.mediaMaxMb` محدود می‌شوند (پیش‌فرض 10).
- رسانه ورودی پیش از آنکه به عامل داده شود، در `~/.openclaw/media/inbound/` ذخیره می‌شود و با مخزن رسانه مشترکی که سایر Pluginهای کانال همراه استفاده می‌کنند هماهنگ است.

## داده کانال (پیام‌های غنی)

برای ارسال پاسخ‌های سریع، مکان‌ها، کارت‌های Flex، یا پیام‌های قالبی از `channelData.line` استفاده کنید.

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

Plugin LINE همچنین فرمان `/card` را برای presetهای پیام Flex عرضه می‌کند:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از bindingهای مکالمه ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` گفت‌وگوی فعلی LINE را بدون ساختن رشته فرزند به یک نشست ACP bind می‌کند.
- bindingهای پیکربندی‌شده ACP و نشست‌های ACP فعالِ وابسته به مکالمه روی LINE مانند کانال‌های مکالمه دیگر کار می‌کنند.

برای جزئیات، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin LINE از ارسال تصویر، ویدیو، و فایل‌های صوتی از طریق ابزار پیام عامل پشتیبانی می‌کند. رسانه از طریق مسیر تحویل ویژه LINE با مدیریت مناسب preview و tracking ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE با تولید خودکار preview ارسال می‌شوند.
- **ویدیوها**: با مدیریت صریح preview و content-type ارسال می‌شوند.
- **صدا**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای عمومی HTTPS باشند. OpenClaw پیش از تحویل URL به LINE، hostname هدف را اعتبارسنجی می‌کند و هدف‌های loopback، link-local، و شبکه خصوصی را رد می‌کند.

ارسال‌های رسانه عمومی وقتی مسیر ویژه LINE در دسترس نباشد، به مسیر موجود فقط-تصویر برمی‌گردند.

## عیب‌یابی

- **راستی‌آزمایی Webhook شکست می‌خورد:** مطمئن شوید URL Webhook از HTTPS استفاده می‌کند و `channelSecret` با کنسول LINE مطابقت دارد.
- **هیچ رویداد ورودی‌ای نیست:** تأیید کنید مسیر Webhook با `channels.line.webhookPath` مطابقت دارد و Gateway از LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از حد پیش‌فرض بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
