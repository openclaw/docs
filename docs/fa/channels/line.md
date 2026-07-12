---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی Webhook و اطلاعات احراز هویت LINE نیاز دارید
    - شما گزینه‌های پیام مخصوص LINE را می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin رابط برنامه‌نویسی پیام‌رسانی LINE
title: LINE
x-i18n:
    generated_at: "2026-07-12T09:38:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. این Plugin به‌عنوان دریافت‌کنندهٔ Webhook
روی Gateway اجرا می‌شود و برای احراز هویت از توکن دسترسی کانال و راز کانال شما
استفاده می‌کند.

وضعیت: Plugin رسمی، با نصب جداگانه. پیام‌های مستقیم، گفت‌وگوهای گروهی، رسانه،
موقعیت‌های مکانی، پیام‌های Flex، پیام‌های قالبی و پاسخ‌های سریع پشتیبانی می‌شوند.
واکنش‌ها و رشته‌ها پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی کانال، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

نسخهٔ محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک حساب LINE Developers ایجاد کنید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider ایجاد یا انتخاب کنید و یک کانال **Messaging API** بیفزایید.
3. **Channel access token** و **Channel secret** را از تنظیمات کانال کپی کنید.
4. در تنظیمات Messaging API، گزینهٔ **Use webhook** را فعال کنید.
5. نشانی Webhook را روی نقطهٔ پایانی Gateway خود تنظیم کنید (HTTPS الزامی است):

```text
https://gateway-host/line/webhook
```

Gateway به راستی‌آزمایی Webhook متعلق به LINE با درخواست GET پاسخ می‌دهد و رویدادهای
ورودی امضاشده با درخواست POST را بلافاصله پس از اعتبارسنجی امضا و محموله تأیید می‌کند؛
پردازش عامل به‌صورت ناهمگام ادامه می‌یابد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم و نشانی را متناسب با آن به‌روزرسانی کنید.

نکات امنیتی:

- راستی‌آزمایی امضای LINE به بدنه وابسته است (HMAC روی بدنهٔ خام)، بنابراین OpenClaw پیش از احراز هویت، محدودیت سخت‌گیرانهٔ اندازهٔ بدنه (۶۴ کیلوبایت) و مهلت خواندن اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از بایت‌های خام و راستی‌آزمایی‌شدهٔ درخواست پردازش می‌کند. برای حفظ یکپارچگی امضا، مقادیر `req.body` که میان‌افزار بالادستی تغییر داده باشد نادیده گرفته می‌شوند.

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

پیکربندی پیام مستقیم عمومی:

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

`tokenFile` و `secretFile` باید به فایل‌های عادی اشاره کنند. پیوندهای نمادین رد می‌شوند.
مقادیر درون‌خطی پیکربندی بر فایل‌ها اولویت دارند؛ متغیرهای محیطی آخرین گزینهٔ جایگزین برای حساب پیش‌فرض هستند.

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

پیام‌های مستقیم به‌طور پیش‌فرض از جفت‌سازی استفاده می‌کنند. فرستندگان ناشناس یک کد
جفت‌سازی دریافت می‌کنند و پیام‌هایشان تا زمان تأیید نادیده گرفته می‌شود:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

فهرست‌های مجاز و سیاست‌ها:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض `pairing`)
- `channels.line.allowFrom`: شناسه‌های کاربری LINE مجاز برای پیام‌های مستقیم؛ `dmPolicy: "open"` به `["*"]` نیاز دارد
- `channels.line.groupPolicy`: `allowlist | open | disabled` (پیش‌فرض `allowlist`)
- `channels.line.groupAllowFrom`: شناسه‌های کاربری LINE مجاز برای گروه‌ها
- بازنویسی‌های مختص هر گروه: `channels.line.groups.<groupId>.allowFrom` (به‌همراه `enabled`، `requireMention`، `systemPrompt` و `skills`)
- گروه‌های دسترسی ایستای فرستندگان را می‌توان با `accessGroup:<name>` از `allowFrom`، `groupAllowFrom` و `allowFrom` مختص هر گروه ارجاع داد؛ [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.
- نکتهٔ زمان اجرا: اگر `channels.line` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی گروه‌ها به `groupPolicy="allowlist"` بازمی‌گردد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

شناسه‌های LINE به بزرگی و کوچکی حروف حساس‌اند. شناسه‌های معتبر چنین هستند:

- کاربر: `U` + ۳۲ نویسهٔ شانزده‌شانزدهی
- گروه: `C` + ۳۲ نویسهٔ شانزده‌شانزدهی
- اتاق: `R` + ۳۲ نویسهٔ شانزده‌شانزدهی

## رفتار پیام

- متن در قطعه‌های ۵۰۰۰ نویسه‌ای تقسیم می‌شود.
- قالب‌بندی Markdown حذف می‌شود؛ بلوک‌های کد و جدول‌ها در صورت امکان به کارت‌های Flex
  تبدیل می‌شوند.
- پاسخ‌های جریانی بافر می‌شوند؛ هنگام کار عامل، LINE قطعه‌های کامل را همراه با پویانمایی
  بارگذاری دریافت می‌کند.
- حجم بارگیری رسانه با `channels.line.mediaMaxMb` محدود می‌شود (پیش‌فرض ۱۰).
- رسانهٔ ورودی پیش از ارسال به عامل در `~/.openclaw/media/inbound/` ذخیره می‌شود؛
  این همان مخزن رسانهٔ مشترک مورد استفادهٔ سایر Pluginهای کانال است.

## داده‌های کانال (پیام‌های غنی)

برای ارسال پاسخ‌های سریع، موقعیت‌های مکانی، کارت‌های Flex یا پیام‌های قالبی از
`channelData.line` استفاده کنید.

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
        contents: {/* Flex payload */},
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

Plugin مربوط به LINE همچنین فرمان `/card` را برای پیش‌تنظیم‌های پیام Flex ارائه می‌کند:

```text
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی از ACP

LINE از اتصال مکالمه‌های ACP (پروتکل ارتباط عامل) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` گفت‌وگوی فعلی LINE را بدون ایجاد رشتهٔ فرزند به یک نشست ACP متصل می‌کند.
- اتصال‌های پیکربندی‌شدهٔ ACP و نشست‌های فعال ACP متصل به مکالمه، در LINE مانند سایر کانال‌های مکالمه کار می‌کنند.

برای جزئیات، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## رسانهٔ خروجی

Plugin مربوط به LINE تصاویر، ویدئوها و صدا را از طریق ابزار پیام عامل ارسال می‌کند:

- **تصاویر**: به‌صورت پیام تصویری LINE ارسال می‌شوند؛ تصویر پیش‌نمایش به‌طور پیش‌فرض همان نشانی رسانه است.
- **ویدئوها**: به تصویر پیش‌نمایش نیاز دارند؛ `channelData.line.previewImageUrl` را روی نشانی یک تصویر تنظیم کنید.
- **صدا**: به‌صورت پیام صوتی LINE ارسال می‌شود؛ مدت‌زمان به‌طور پیش‌فرض ۶۰ ثانیه است، مگر آنکه `channelData.line.durationMs` تنظیم شده باشد.

نوع رسانه در صورت تنظیم از `channelData.line.mediaKind` گرفته می‌شود؛ در غیر این صورت
از سایر گزینه‌های LINE یا پسوند فایل در نشانی استنباط می‌شود و تصویر گزینهٔ جایگزین است.

نشانی‌های رسانهٔ خروجی باید نشانی‌های عمومی HTTPS با حداکثر ۲۰۰۰ نویسه باشند. OpenClaw
پیش از تحویل نشانی به LINE، نام میزبان مقصد را اعتبارسنجی می‌کند و مقصدهای local loopback،
پیوند-محلی و شبکهٔ خصوصی را رد می‌کند.

ارسال‌های عمومی رسانه بدون گزینه‌های مختص LINE از مسیر تصویر استفاده می‌کنند.

## رفع اشکال

- **راستی‌آزمایی Webhook ناموفق است:** مطمئن شوید نشانی Webhook از HTTPS استفاده می‌کند و
  `channelSecret` با LINE Console مطابقت دارد.
- **هیچ رویداد ورودی دریافت نمی‌شود:** تأیید کنید مسیر Webhook با `channels.line.webhookPath`
  مطابقت دارد و LINE می‌تواند به Gateway دسترسی پیدا کند.
- **خطاهای بارگیری رسانه:** اگر حجم رسانه از حد پیش‌فرض بیشتر است، مقدار `channels.line.mediaMaxMb`
  را افزایش دهید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و فرایند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و الزام اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
