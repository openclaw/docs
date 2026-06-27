---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اعتبارنامه‌های LINE نیاز دارید
    - شما گزینه‌های پیام مخصوص LINE می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin API پیام‌رسانی LINE
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:12:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. Plugin به‌عنوان گیرنده Webhook
روی Gateway اجرا می‌شود و برای احراز هویت از نشانه دسترسی کانال + راز کانال شما استفاده می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، چت‌های گروهی، رسانه، مکان‌ها، پیام‌های Flex،
پیام‌های قالبی، و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها
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
4. گزینه **Use webhook** را در تنظیمات Messaging API فعال کنید.
5. URL وبهوک را روی نقطه پایانی Gateway خود تنظیم کنید (HTTPS الزامی است):

```
https://gateway-host/line/webhook
```

Gateway به تأیید Webhook مربوط به LINE (GET) پاسخ می‌دهد و رویدادهای ورودی امضاشده (POST) را بلافاصله پس از اعتبارسنجی امضا و payload تأیید می‌کند؛ پردازش agent به‌صورت ناهمگام ادامه می‌یابد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- تأیید امضای LINE به بدنه وابسته است (HMAC روی بدنه خام)، بنابراین OpenClaw پیش از تأیید، محدودیت‌های سخت‌گیرانه اندازه بدنه و timeout اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های درخواست خام تأییدشده پردازش می‌کند. مقادیر `req.body` که توسط middleware بالادستی تغییر یافته‌اند، برای ایمنی یکپارچگی امضا نادیده گرفته می‌شوند.

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

فایل‌های نشانه/راز:

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

پیام‌های مستقیم به‌طور پیش‌فرض روی جفت‌سازی تنظیم شده‌اند. فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند و پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allowlistها و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: شناسه‌های کاربر LINE مجاز برای DMها؛ `dmPolicy: "open"` به `["*"]` نیاز دارد
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: شناسه‌های کاربر LINE مجاز برای گروه‌ها
- بازنویسی‌های هر گروه: `channels.line.groups.<groupId>.allowFrom`
- گروه‌های دسترسی فرستنده ایستا را می‌توان از `allowFrom`، `groupAllowFrom`، و `allowFrom` هر گروه با `accessGroup:<name>` ارجاع داد.
- نکته زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروه به `groupPolicy="allowlist"` بازمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس‌اند. شناسه‌های معتبر به این شکل‌اند:

- کاربر: `U` + 32 نویسه hex
- گروه: `C` + 32 نویسه hex
- اتاق: `R` + 32 نویسه hex

## رفتار پیام

- متن در 5000 نویسه قطعه‌بندی می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها در صورت امکان به کارت‌های Flex
  تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ LINE در حالی که agent کار می‌کند، قطعه‌های کامل را همراه با یک پویانمایی بارگذاری دریافت می‌کند.
- دانلودهای رسانه با `channels.line.mediaMaxMb` محدود می‌شوند (پیش‌فرض 10).
- رسانه ورودی پیش از ارسال به agent، زیر `~/.openclaw/media/inbound/` ذخیره می‌شود
  و با مخزن رسانه مشترک استفاده‌شده توسط دیگر Pluginهای کانال bundled مطابقت دارد.

## داده کانال (پیام‌های غنی)

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

LINE از اتصال‌های گفت‌وگوی ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` چت LINE فعلی را بدون ساخت رشته فرزند به یک نشست ACP متصل می‌کند.
- اتصال‌های ACP پیکربندی‌شده و نشست‌های ACP فعالِ متصل به گفت‌وگو روی LINE مانند دیگر کانال‌های گفت‌وگو کار می‌کنند.

برای جزئیات، [agentهای ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin مربوط به LINE از ارسال تصویرها، ویدیوها، و فایل‌های صوتی از طریق ابزار پیام agent پشتیبانی می‌کند. رسانه از طریق مسیر تحویل ویژه LINE با مدیریت مناسب پیش‌نمایش و رهگیری ارسال می‌شود:

- **تصویرها**: به‌عنوان پیام‌های تصویری LINE همراه با تولید خودکار پیش‌نمایش ارسال می‌شوند.
- **ویدیوها**: با مدیریت صریح پیش‌نمایش و content-type ارسال می‌شوند.
- **صدا**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای HTTPS عمومی باشند. OpenClaw پیش از تحویل URL به LINE، نام میزبان مقصد را اعتبارسنجی می‌کند و مقصدهای loopback، link-local، و شبکه خصوصی را رد می‌کند.

ارسال‌های رسانه عمومی وقتی مسیر ویژه LINE در دسترس نباشد، به مسیر موجودِ فقط تصویر بازمی‌گردند.

## عیب‌یابی

- **تأیید Webhook ناموفق است:** مطمئن شوید URL وبهوک HTTPS است و
  `channelSecret` با console LINE مطابقت دارد.
- **هیچ رویداد ورودی وجود ندارد:** تأیید کنید مسیر Webhook با `channels.line.webhookPath`
  مطابقت دارد و Gateway از LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از محدودیت پیش‌فرض فراتر می‌رود، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و gating اشاره
- [مسیر‌دهی کانال](/fa/channels/channel-routing) — مسیر‌دهی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
