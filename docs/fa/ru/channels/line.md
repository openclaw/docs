---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - باید Webhook LINE و اعتبارنامه‌ها را پیکربندی کنید
    - به پارامترهای پیام مخصوص LINE نیاز دارید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:47:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. Plugin به‌عنوان دریافت‌کننده Webhook
روی Gateway کار می‌کند و از channel access token + channel secret شما برای
احراز هویت استفاده می‌کند.

وضعیت: Plugin قابل بارگذاری. پیام‌های خصوصی، چت‌های گروهی، رسانه، مکان‌ها، پیام‌های Flex،
پیام‌های قالبی و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها
پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی کانال، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

نسخه کاری محلی (هنگام اجرا از مخزن git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و یک کانال **Messaging API** اضافه کنید.
3. **Channel access token** و **Channel secret** را از تنظیمات کانال کپی کنید.
4. **Use webhook** را در تنظیمات Messaging API فعال کنید.
5. URL Webhook را برای نقطه پایانی Gateway خود تنظیم کنید (HTTPS لازم است):

```
https://gateway-host/line/webhook
```

Gateway به بررسی Webhook از LINE (GET) پاسخ می‌دهد و رویدادهای ورودی امضاشده (POST) را
بلافاصله پس از بررسی امضا و payload تأیید می‌کند؛ پردازش توسط عامل به‌صورت ناهمگام ادامه می‌یابد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- بررسی امضای LINE به بدنه درخواست وابسته است (HMAC روی بدنه خام)، بنابراین OpenClaw پیش از احراز هویت، محدودیت‌های سخت‌گیرانه اندازه بدنه و timeout را برای بررسی اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های خام تأییدشده درخواست پردازش می‌کند. مقادیر `req.body` که توسط middleware بالادستی تبدیل شده‌اند، برای حفظ یکپارچگی امضا نادیده گرفته می‌شوند.

## پیکربندی

حداقل پیکربندی:

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

پیکربندی پیام‌های خصوصی باز:

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

فایل‌های توکن/secret:

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

`tokenFile` و `secretFile` باید به فایل‌های معمولی اشاره کنند. پیوندهای نمادین رد می‌شوند.

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

پیام‌های خصوصی به‌طور پیش‌فرض به جفت‌سازی نیاز دارند. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند و
پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

فهرست‌های مجاز و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های مجاز کاربران LINE برای پیام‌های خصوصی؛ `dmPolicy: "open"` به `["*"]` نیاز دارد
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های مجاز کاربران LINE برای گروه‌ها
- بازنویسی‌های ویژه هر گروه: `channels.line.groups.<groupId>.allowFrom`
- گروه‌های دسترسی ایستای فرستندگان را می‌توان از `allowFrom`، `groupAllowFrom` و `allowFrom` گروهی با `accessGroup:<name>` ارجاع داد.
- نکته runtime: اگر `channels.line` کاملاً وجود نداشته باشد، runtime برای بررسی‌های گروهی به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس‌اند. شناسه‌های معتبر این‌گونه‌اند:

- کاربر: `U` + 32 نویسه هگزادسیمال
- گروه: `C` + 32 نویسه هگزادسیمال
- اتاق: `R` + 32 نویسه هگزادسیمال

## رفتار پیام‌ها

- متن به بخش‌های 5000 نویسه‌ای تقسیم می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها تا حد امکان به کارت‌های Flex
  تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ تا زمانی که عامل در حال کار است، LINE بخش‌های کامل را همراه با انیمیشن بارگذاری دریافت می‌کند.
- دانلود رسانه با `channels.line.mediaMaxMb` محدود می‌شود (پیش‌فرض 10).
- رسانه ورودی پیش از تحویل به عامل، در `~/.openclaw/media/inbound/` ذخیره می‌شود؛
  این با فضای ذخیره‌سازی مشترک رسانه که دیگر کانال‌های Plugin داخلی استفاده می‌کنند هم‌خوان است.

## داده‌های کانال (پیام‌های پیشرفته)

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

Plugin LINE همچنین با دستور `/card` برای presetهای پیام‌های Flex ارائه می‌شود:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از اتصال‌های گفت‌وگوی ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` چت LINE فعلی را بدون ایجاد رشته فرزند به جلسه ACP متصل می‌کند.
- اتصال‌های ACP پیکربندی‌شده و جلسه‌های ACP فعال متصل به گفت‌وگو، در LINE همان‌گونه کار می‌کنند که در دیگر کانال‌های گفت‌وگو کار می‌کنند.

برای جزئیات، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin LINE از ارسال تصاویر، ویدیوها و فایل‌های صوتی از طریق ابزار پیام‌رسانی عامل پشتیبانی می‌کند. رسانه از مسیر تحویل ویژه LINE با پردازش مناسب پیش‌نمایش و رهگیری ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE با تولید خودکار پیش‌نمایش ارسال می‌شوند.
- **ویدیوها**: با پردازش صریح پیش‌نمایش و نوع محتوا ارسال می‌شوند.
- **صدا**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای عمومی HTTPS باشند. OpenClaw پیش از تحویل URL به LINE، نام میزبان مقصد را بررسی می‌کند و اهداف local loopback، link-local و شبکه‌های خصوصی را رد می‌کند.

ارسال‌های عمومی رسانه فقط زمانی به مسیر موجود ویژه تصاویر برمی‌گردند که مسیر ویژه LINE در دسترس نباشد.

## عیب‌یابی

- **بررسی Webhook ناموفق است:** مطمئن شوید URL Webhook از HTTPS استفاده می‌کند و
  `channelSecret` با LINE console مطابقت دارد.
- **رویداد ورودی وجود ندارد:** تأیید کنید مسیر Webhook با `channels.line.webhookPath`
  مطابقت دارد و Gateway از LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از حد پیش‌فرض بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## همچنین ببینید

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام‌های خصوصی و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت‌های گروهی و محدودیت بر اساس اشاره
- [مسیریابی کانال‌ها](/fa/channels/channel-routing) — مسیریابی جلسه‌ها برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی حفاظتی
