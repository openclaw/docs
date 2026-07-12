---
read_when:
    - می‌خواهید OpenClaw را از طریق Twilio به پیامک متصل کنید
    - به راه‌اندازی Webhook پیامک یا فهرست مجاز نیاز دارید
summary: راه‌اندازی کانال پیامک Twilio، کنترل‌های دسترسی و پیکربندی Webhook
title: پیامک
x-i18n:
    generated_at: "2026-07-12T09:39:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw از طریق یک شماره تلفن Twilio یا Messaging Service، پیامک دریافت و ارسال می‌کند. Gateway یک مسیر Webhook ورودی (به‌طور پیش‌فرض `/webhooks/sms`) ثبت می‌کند، به‌طور پیش‌فرض امضاهای درخواست Twilio را اعتبارسنجی می‌کند و پاسخ‌ها را از طریق API پیام‌های Twilio بازمی‌فرستد.

وضعیت: Plugin رسمی، با نصب جداگانه. فقط متن: بدون MMS/رسانه و فقط پیام‌های مستقیم.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای پیامک، جفت‌سازی است.
  </Card>
  <Card title="امنیت Gateway" icon="shield" href="/fa/gateway/security">
    نحوه در معرض قرار گرفتن Webhook و کنترل‌های دسترسی فرستنده را بررسی کنید.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    روش‌های تشخیص و راهنماهای رفع اشکال میان‌کانالی.
  </Card>
</CardGroup>

## پیش از شروع

به موارد زیر نیاز دارید:

- Plugin رسمی پیامک که با `openclaw plugins install @openclaw/sms` نصب شده باشد.
- یک حساب Twilio با شماره تلفنی دارای قابلیت پیامک، یا یک Twilio Messaging Service.
- شناسه حساب و توکن احراز هویت Twilio.
- یک نشانی عمومی HTTPS که به Gateway متعلق به OpenClaw شما دسترسی داشته باشد.
- انتخاب سیاست فرستنده: `pairing` (پیش‌فرض) برای استفاده خصوصی، `allowlist` برای شماره‌های تلفن ازپیش‌تأییدشده، یا `open` فقط برای دسترسی عمومی و آگاهانه به پیامک.

یک شماره Twilio، اگر هر دو قابلیت را داشته باشد، می‌تواند هم برای پیامک و هم برای [تماس صوتی](/fa/plugins/voice-call) استفاده شود. Webhook پیامک و Webhook صوتی در Twilio جداگانه پیکربندی می‌شوند و از مسیرهای جداگانه Gateway استفاده می‌کنند؛ این صفحه فقط Webhook پیامک را پوشش می‌دهد.

## راه‌اندازی سریع

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="ایجاد یا انتخاب فرستنده Twilio">
    در Twilio، **Phone Numbers > Manage > Active numbers** را باز کنید و یک شماره دارای قابلیت پیامک انتخاب کنید. موارد زیر را ذخیره کنید:

    - شناسه حساب، برای مثال `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - توکن احراز هویت
    - شماره تلفن فرستنده، برای مثال `+15551234567`

    اگر به‌جای شماره ثابت فرستنده از Messaging Service استفاده می‌کنید، شناسه Messaging Service را ذخیره کنید؛ برای مثال `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="پیکربندی کانال پیامک">

این محتوا را با نام `sms.patch.json5` ذخیره کنید و جای‌نگهدارها را تغییر دهید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

آن را اعمال کنید:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="هدایت Twilio به Webhook متعلق به Gateway">
    در تنظیمات شماره تلفن Twilio، **Messaging** را باز کنید و **A message comes in** را روی مقدار زیر تنظیم کنید:

```text
https://gateway.example.com/webhooks/sms
```

    از HTTP `POST` استفاده کنید. مسیر محلی پیش‌فرض `/webhooks/sms` است؛ اگر به مسیر دیگری نیاز دارید، `channels.sms.webhookPath` را تغییر دهید.

  </Step>

  <Step title="در معرض قرار دادن مسیر دقیق Webhook پیامک">
    نشانی عمومی شما باید مسیر پیامک را به فرایند Gateway هدایت کند (درگاه پیش‌فرض `18789`). اگر برای آزمایش محلی از Tailscale Funnel استفاده می‌کنید، `/webhooks/sms` را به‌طور صریح در معرض قرار دهید:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    تماس صوتی و پیامک از مسیرهای Webhook جداگانه استفاده می‌کنند. اگر یک شماره Twilio هر دو را مدیریت می‌کند، هر دو مسیر را در Twilio و تونل خود پیکربندی‌شده نگه دارید.

  </Step>

  <Step title="راه‌اندازی Gateway و تأیید نخستین فرستنده">

```bash
openclaw gateway
```

یک پیام متنی به شماره Twilio ارسال کنید. نخستین پیام یک درخواست جفت‌سازی ایجاد می‌کند. آن را تأیید کنید:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>
</Steps>

## نمونه‌های پیکربندی

همه کلیدها زیر `channels.sms` قرار دارند (و برای هر حساب زیر `channels.sms.accounts.<id>`):

| کلید                                    | پیش‌فرض         | هدف                                                                  |
| --------------------------------------- | --------------- | -------------------------------------------------------------------- |
| `enabled`                               | `true`          | فعال یا غیرفعال کردن کانال/حساب.                                    |
| `accountSid`                            | —               | شناسه حساب Twilio‏ (`AC...`).                                       |
| `authToken`                             | —               | توکن احراز هویت Twilio؛ رشته متن ساده یا SecretRef.                 |
| `fromNumber`                            | —               | شماره فرستنده با قالب E.164.                                        |
| `messagingServiceSid`                   | —               | شناسه Messaging Service‏ (`MG...`) که در صورت تعیین نشدن `fromNumber` استفاده می‌شود. |
| `defaultTo`                             | —               | مقصد پیش‌فرض هنگامی که جریان ارسال، هدف صریحی را مشخص نمی‌کند.      |
| `webhookPath`                           | `/webhooks/sms` | مسیر HTTP متعلق به Gateway برای Webhookهای ورودی Twilio.            |
| `publicWebhookUrl`                      | —               | نشانی عمومی پیکربندی‌شده در Twilio؛ برای اعتبارسنجی امضا الزامی است. |
| `dangerouslyDisableSignatureValidation` | `false`         | رد کردن بررسی‌های `X-Twilio-Signature`؛ فقط برای آزمایش تونل محلی.  |
| `dmPolicy`                              | `"pairing"`     | `pairing`، `allowlist`، `open` یا `disabled`.                        |
| `allowFrom`                             | `[]`            | شماره‌های مجاز فرستنده با قالب E.164، یا `"*"` همراه با `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | حداکثر تعداد نویسه در هر بخش پیامک خروجی.                            |
| `accounts`, `defaultAccount`            | —               | نگاشت چندحسابی و شناسه حساب پیش‌فرض.                                |

### فایل پیکربندی

وقتی می‌خواهید تعریف کانال همراه با پیکربندی Gateway منتقل شود، از راه‌اندازی مبتنی بر فایل پیکربندی استفاده کنید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### متغیرهای محیطی

متغیرهای محیطی فقط بر حساب پیش‌فرض اعمال می‌شوند؛ مقادیر پیکربندی بر مقادیر محیطی اولویت دارند.

| متغیر                                           | نگاشت به                                            |
| ------------------------------------------------ | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                             | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                              | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (نام مستعار `TWILIO_SMS_FROM`) | `fromNumber`                                    |
| `TWILIO_MESSAGING_SERVICE_SID`                   | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                         | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                               | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                              | `allowFrom` (جداشده با ویرگول)                     |
| `SMS_TEXT_CHUNK_LIMIT`                           | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`   | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

سپس کانال را در پیکربندی فعال کنید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### توکن احراز هویت SecretRef

`authToken` می‌تواند یک SecretRef باشد (`source: "env" | "file" | "exec"`). زمانی از این روش استفاده کنید که Gateway باید توکن احراز هویت Twilio را به‌جای ذخیره در پیکربندی متن ساده، از محیط اجرای اسرار OpenClaw دریافت کند:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

متغیر محیطی یا ارائه‌دهنده اسرار ارجاع‌شده باید برای محیط اجرای Gateway قابل مشاهده باشد. پس از تغییر متغیرهای محیطی میزبان، فرایندهای مدیریت‌شده Gateway را دوباره راه‌اندازی کنید.

### فرستنده Messaging Service

وقتی Twilio باید فرستنده را از طریق Messaging Service انتخاب کند، به‌جای `fromNumber` از `messagingServiceSid` استفاده کنید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

اگر پس از تفکیک مقادیر پیکربندی و محیطی، هر دو `fromNumber` و `messagingServiceSid` وجود داشته باشند، `fromNumber` استفاده می‌شود.

### هدف خروجی پیش‌فرض

وقتی در صورت مشخص نشدن هدف صریح در جریان ارسال، خودکارسازی یا تحویل آغازشده توسط عامل باید مقصدی پیش‌فرض داشته باشد، `defaultTo` را تنظیم کنید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## کنترل دسترسی

`channels.sms.dmPolicy` دسترسی مستقیم پیامکی را کنترل می‌کند:

- `pairing` (پیش‌فرض): فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ با `openclaw pairing approve sms <CODE>` تأیید کنید.
- `allowlist`: فقط فرستندگان موجود در `allowFrom` پردازش می‌شوند. `allowFrom` خالی همه فرستندگان را رد می‌کند (Gateway هنگام راه‌اندازی یک هشدار ثبت می‌کند).
- `open`: اعتبارسنجی پیکربندی ایجاب می‌کند که `allowFrom` شامل `"*"` باشد. بدون نویسه عام، فقط شماره‌های فهرست‌شده می‌توانند گفتگو کنند.
- `disabled`: همه پیام‌های مستقیم ورودی کنار گذاشته می‌شوند.

ورودی‌های `allowFrom` باید شماره تلفن‌هایی با قالب E.164 مانند `+15551234567` باشند. پیشوندهای `sms:` و `twilio-sms:` پذیرفته و نرمال‌سازی می‌شوند. برای یک دستیار خصوصی، `dmPolicy: "allowlist"` را همراه با شماره‌های تلفن صریح ترجیح دهید:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## ارسال پیامک

هنگامی که کانال پیامک انتخاب شده است، هدف‌ها شماره‌های E.164 بدون پیشوند یا دارای پیشوند `sms:` را می‌پذیرند:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

هنگامی که انتخاب کانال ضمنی است، پیشوند `twilio-sms:` این کانال را انتخاب می‌کند، بدون اینکه پیشوند سرویس `sms:` را تصاحب کند؛ iMessage از آن پیشوند برای انتخاب تحویل پیامک اپراتور برای هدف‌های خودش استفاده می‌کند:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI به یک `--target` صریح نیاز دارد. `defaultTo` برای مسیرهای خودکارسازی و تحویل آغازشده توسط عامل است که در آن‌ها هدف می‌تواند از پیکربندی کانال تعیین شود.

پاسخ‌های عامل به گفتگوهای پیامکی ورودی، به‌طور خودکار از طریق فرستنده پیکربندی‌شده Twilio به فرستنده بازگردانده می‌شوند.

خروجی پیامک متن ساده است. OpenClaw نشانه‌گذاری Markdown را حذف می‌کند، بلوک‌های کد حصاردار را به متن تخت تبدیل می‌کند، پیوندها را به‌شکل `label (url)` بازنویسی می‌کند و پاسخ‌های طولانی را پیش از ارسال از طریق Twilio به بخش‌هایی با حداکثر `textChunkLimit` نویسه (پیش‌فرض ۱۵۰۰) تقسیم می‌کند.

## تأیید راه‌اندازی

پس از راه‌اندازی Gateway:

1. تأیید کنید که گزارش Gateway مسیر Webhook پیامک را نشان می‌دهد.
2. یک وارسی از سمت Twilio اجرا کنید (نشانی اینترنتی/روش Webhook پیکربندی‌شدهٔ Twilio و خطاهای ورودی اخیر را بررسی می‌کند):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. از تلفن خود یک پیامک به شمارهٔ Twilio ارسال کنید.
4. دستور `openclaw pairing list sms` را اجرا کنید.
5. کد جفت‌سازی را با `openclaw pairing approve sms <CODE>` تأیید کنید.
6. پیامک دیگری ارسال کنید و تأیید کنید که عامل پاسخ می‌دهد.

برای آزمایش صرفاً خروجی، از این دستور استفاده کنید:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### آزمایش سرتاسری از iMessage/پیامک در macOS

در Macی که می‌تواند از طریق Messages پیامک اپراتوری ارسال کند، می‌توانید با استفاده از `imsg` سمت فرستنده را بدون دست‌زدن به تلفن خود راه‌اندازی کنید:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

پیام نخست باید یک درخواست جفت‌سازی ایجاد کند. پیام دوم باید پاسخ عامل را از طریق Twilio دریافت کند.

## امنیت Webhook

OpenClaw به‌طور پیش‌فرض `X-Twilio-Signature` را با استفاده از `publicWebhookUrl` و `authToken` اعتبارسنجی می‌کند. بخش نقطهٔ پایانی `publicWebhookUrl` را بایت‌به‌بایت با نشانی اینترنتی پیکربندی‌شده در Twilio، شامل طرح، میزبان، مسیر و رشتهٔ پرس‌وجو، یکسان نگه دارید. همان‌طور که Twilio الزام می‌کند، OpenClaw قطعه‌های [بازنویسی اتصال](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) مربوط به Twilio (`#...`) را از محاسبهٔ امضا کنار می‌گذارد.

مسیر Webhook، مستقل از اعتبارسنجی امضا، موارد زیر را نیز اعمال می‌کند:

- فقط `POST`.
- محدودیت نرخ ۳۰ درخواست در دقیقه برای هر نشانی IP مبدأ (بالاتر از آن HTTP 429).
- مقدار `AccountSid` در بار داده باید با `accountSid` پیکربندی‌شده مطابقت داشته باشد (در غیر این صورت HTTP 403).
- مقادیر تکراری `MessageSid` به‌مدت ۱۰ دقیقه رفع تکرار می‌شوند.
- حافظهٔ نهان بازپخش هر حساب پیامک حداکثر ۱۰٬۰۰۰ شناسهٔ زندهٔ پیام را نگه می‌دارد. وقتی همهٔ جایگاه‌ها زنده باشند، Webhookهای جدید آن حساب تا زمان انقضای قدیمی‌ترین جایگاه، به‌صورت بسته و با HTTP 429 و سرآیند `Retry-After` رد می‌شوند.
- بدنهٔ درخواست‌های بزرگ‌تر از ۳۲ کیلوبایت رد می‌شود.

Twilio به‌طور پیش‌فرض HTTP 429 را دوباره امتحان نمی‌کند و پشتیبانی از `Retry-After` را مستند نکرده است. بازنویسی‌های اتصال `#rp=4xx` و `#rp=all` تلاش مجدد برای پاسخ‌های 4xx را فعال می‌کنند، اما Twilio کل تراکنش تلاش مجدد را به ۱۵ ثانیه محدود می‌کند؛ بنابراین ممکن است تلاش‌های مجدد همچنان پیش از انقضای یک جایگاه حافظهٔ نهان بازپخش پایان یابند. هنگامی که کنترل‌کنندهٔ دیگری باید تحویل‌های ناموفق را دریافت کند، یک نشانی اینترنتی جایگزین پیکربندی کنید؛ پاسخ 429 را ردشدن به‌صورت بسته در نظر بگیرید، نه فشار معکوس قابل‌اعتماد.

فقط برای آزمایش تونل محلی می‌توانید این مقدار را تنظیم کنید:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

در یک Gateway عمومی از اعتبارسنجی امضای غیرفعال‌شده استفاده نکنید.

## پیکربندی چندحسابی

هنگامی که بیش از یک شمارهٔ Twilio را مدیریت می‌کنید، از `accounts` استفاده کنید:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

هر حساب باید از یک `webhookPath` متمایز استفاده کند؛ Gateway از ثبت مسیر Webhookی که مسیرش از قبل در مالکیت حساب دیگری است خودداری می‌کند. مقادیر جایگزین محیطی `TWILIO_*`/`SMS_*` فقط برای حساب پیش‌فرض اعمال می‌شوند؛ برای تغییر آن حساب، `defaultAccount` را تنظیم کنید.

## عیب‌یابی

### Twilio پاسخ 403 برمی‌گرداند یا OpenClaw، Webhook را رد می‌کند

بررسی کنید که `publicWebhookUrl` دقیقاً با نشانی اینترنتی پیکربندی‌شده در Twilio، شامل طرح، میزبان، مسیر و رشتهٔ پرس‌وجو، مطابقت داشته باشد. Twilio رشتهٔ نشانی اینترنتی عمومی را امضا می‌کند؛ بنابراین بازنویسی‌های پراکسی و نام‌های میزبان جایگزین می‌توانند اعتبارسنجی امضا را مختل کنند.

پاسخ 403 همراه با `Invalid account` به این معناست که `AccountSid` در بار دادهٔ ورودی با `accountSid` پیکربندی‌شده مطابقت ندارد؛ بررسی کنید که Webhook به حساب مالک شماره اشاره کند.

### هیچ درخواست جفت‌سازی‌ای ظاهر نمی‌شود

نشانی اینترنتی و روش Webhook بخش **Messaging** شمارهٔ Twilio را بررسی کنید. باید به نشانی اینترنتی Webhook پیامک اشاره کند و از `POST` استفاده کند. همچنین تأیید کنید که Gateway از اینترنت عمومی یا از طریق تونل شما قابل‌دسترسی است.

اگر گزارش پیام Twilio خطای `11200` را نشان می‌دهد، Twilio پیامک ورودی را پذیرفته اما نتوانسته است به Webhook شما دسترسی پیدا کند. این موارد را بررسی کنید:

- گزینهٔ Twilio **Messaging > A message comes in** به `publicWebhookUrl` اشاره کند.
- روش `POST` باشد.
- تونل یا پراکسی معکوس دقیقاً `webhookPath` را در دسترس قرار دهد؛ برای Tailscale Funnel، دستور `tailscale funnel status` را اجرا کنید و تأیید کنید که `/webhooks/sms` فهرست شده است.
- `publicWebhookUrl` از همان طرح، میزبان، مسیر و رشتهٔ پرس‌وجویی استفاده کند که Twilio ارسال می‌کند تا اعتبارسنجی امضا بتواند نشانی اینترنتی امضاشده را بازتولید کند.

دستور `openclaw channels status --channel sms --probe` هم تنظیمات ناهماهنگ Webhook در Twilio و هم خطاهای اخیر `11200` را نمایش می‌دهد.

### ارسال‌های خروجی ناموفق هستند

تأیید کنید که `accountSid`، `authToken` و یکی از `fromNumber` یا `messagingServiceSid` مقداردهی شده‌اند. اگر از حساب آزمایشی Twilio استفاده می‌کنید، ممکن است لازم باشد پیش از امکان ارسال پیامک خروجی، شمارهٔ مقصد در Twilio تأیید شود.

### پیام‌ها می‌رسند، اما عامل پاسخ نمی‌دهد

`dmPolicy` و `allowFrom` را بررسی کنید. با خط‌مشی پیش‌فرض `pairing`، پیش از پردازش نوبت‌های عادی عامل، فرستنده باید تأیید شده باشد.
