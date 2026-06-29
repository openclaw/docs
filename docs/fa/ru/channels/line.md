---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - باید Webhook و اعتبارنامه‌های LINE را پیکربندی کنید
    - شما به پارامترهای پیام مختص LINE نیاز دارید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin API پیام‌رسانی LINE
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:34:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. Plugin به‌عنوان گیرنده Webhook
روی Gateway کار می‌کند و از channel access token + channel secret شما برای
احراز هویت استفاده می‌کند.

وضعیت: Plugin قابل بارگذاری. پیام‌های خصوصی، چت‌های گروهی، رسانه، موقعیت‌ها، Flex
messages، template messages و پاسخ‌های سریع پشتیبانی می‌شوند. واکنش‌ها و رشته‌ها
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
4. در تنظیمات Messaging API، گزینه **Use webhook** را فعال کنید.
5. URL Webhook را برای نقطه پایانی Gateway خود تنظیم کنید (HTTPS لازم است):

```
https://gateway-host/line/webhook
```

Gateway به بررسی Webhook از LINE (GET) پاسخ می‌دهد و رویدادهای ورودی امضاشده (POST) را بلافاصله پس از بررسی امضا و payload تأیید می‌کند؛ پردازش
توسط عامل به‌صورت ناهمگام ادامه می‌یابد.
اگر مسیر سفارشی لازم دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را متناسب با آن به‌روزرسانی کنید.

یادداشت امنیتی:

- بررسی امضای LINE به بدنه درخواست وابسته است (HMAC روی بدنه خام)، بنابراین OpenClaw پیش از بررسی، محدودیت‌های سخت‌گیرانه اندازه بدنه و مهلت زمانی پیش از احراز هویت اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های خام و بررسی‌شده درخواست پردازش می‌کند. مقدارهای `req.body` که توسط میان‌افزارهای بالادستی تبدیل شده‌اند، برای حفظ یکپارچگی امضا نادیده گرفته می‌شوند.

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

پیکربندی پیام خصوصی باز:

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
- بازنویسی‌های مخصوص گروه‌های جداگانه: `channels.line.groups.<groupId>.allowFrom`
- گروه‌های دسترسی ایستای فرستندگان را می‌توان از `allowFrom`، `groupAllowFrom` و `allowFrom` گروهی با `accessGroup:<name>` ارجاع داد.
- یادداشت زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروهی به `groupPolicy="allowlist"` برمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به حروف بزرگ و کوچک حساس‌اند. شناسه‌های معتبر این‌گونه‌اند:

- کاربر: `U` + 32 نویسه هگزادسیمال
- گروه: `C` + 32 نویسه هگزادسیمال
- اتاق: `R` + 32 نویسه هگزادسیمال

## رفتار پیام‌ها

- متن به قطعه‌های ۵۰۰۰ نویسه‌ای تقسیم می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها تا حد امکان به Flex
  cards تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ LINE تا زمانی که عامل کار می‌کند، قطعه‌های کامل را همراه با پویانمایی بارگذاری دریافت می‌کند.
- دانلود رسانه با `channels.line.mediaMaxMb` محدود می‌شود (پیش‌فرض ۱۰).
- رسانه ورودی پیش از تحویل به عامل، در `~/.openclaw/media/inbound/` ذخیره می‌شود، که با فضای ذخیره‌سازی مشترک رسانه مورد استفاده دیگر Plugin
  های کانال داخلی هماهنگ است.

## داده کانال (پیام‌های پیشرفته)

از `channelData.line` برای ارسال پاسخ‌های سریع، موقعیت‌ها، Flex cards یا template
messages استفاده کنید.

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

Plugin LINE همچنین همراه با فرمان `/card` برای پیش‌تنظیم‌های Flex messages ارائه می‌شود:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از اتصال‌های گفت‌وگوی ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` چت فعلی LINE را بدون ساخت رشته فرزند به نشست ACP متصل می‌کند.
- اتصال‌های ACP پیکربندی‌شده و نشست‌های ACP فعال متصل به گفت‌وگو، در LINE همان‌طور کار می‌کنند که در کانال‌های گفت‌وگوی دیگر.

برای جزئیات، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

Plugin LINE از ارسال تصویر، ویدئو و فایل‌های صوتی از طریق ابزار پیام‌های عامل پشتیبانی می‌کند. رسانه از مسیر تحویل مخصوص LINE با پردازش مناسب پیش‌نمایش و رهگیری ارسال می‌شود:

- **تصاویر**: به‌عنوان پیام‌های تصویری LINE با تولید خودکار پیش‌نمایش ارسال می‌شوند.
- **ویدئو**: با پردازش صریح پیش‌نمایش و نوع محتوا ارسال می‌شود.
- **صوت**: به‌عنوان پیام‌های صوتی LINE ارسال می‌شود.

URLهای رسانه خروجی باید URLهای عمومی HTTPS باشند. OpenClaw نام میزبان مقصد را پیش از تحویل URL به LINE بررسی می‌کند و اهداف local loopback، link-local و شبکه‌های خصوصی را رد می‌کند.

ارسال‌های عمومی رسانه، وقتی مسیر مخصوص LINE در دسترس نباشد، فقط برای تصاویر به مسیر موجود بازمی‌گردند.

## رفع اشکال

- **بررسی Webhook ناموفق است:** مطمئن شوید URL Webhook از HTTPS استفاده می‌کند و
  `channelSecret` با LINE console مطابقت دارد.
- **رویداد ورودی وجود ندارد:** تأیید کنید مسیر Webhook با `channels.line.webhookPath`
  مطابقت دارد و Gateway از سمت LINE قابل دسترسی است.
- **خطاهای دانلود رسانه:** اگر رسانه از حد پیش‌فرض فراتر می‌رود، `channels.line.mediaMaxMb` را افزایش دهید.

## همچنین ببینید

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام‌های خصوصی و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت‌های گروهی و محدودیت بر پایه اشاره
- [مسیریابی کانال‌ها](/fa/channels/channel-routing) — مسیریابی نشست‌ها برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی حفاظتی
