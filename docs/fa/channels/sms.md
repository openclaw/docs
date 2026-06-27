---
read_when:
    - می‌خواهید OpenClaw را از طریق Twilio به SMS متصل کنید
    - به راه‌اندازی Webhook پیامک یا فهرست مجاز نیاز دارید
summary: راه‌اندازی کانال SMS Twilio، کنترل‌های دسترسی، و پیکربندی Webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:14:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw می‌تواند از طریق یک شماره تلفن Twilio یا Messaging Service، SMS دریافت و ارسال کند. Gateway یک مسیر Webhook ورودی ثبت می‌کند، به‌صورت پیش‌فرض امضاهای درخواست Twilio را اعتبارسنجی می‌کند، و پاسخ‌ها را از طریق Messages API مربوط به Twilio برمی‌گرداند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای SMS، pairing است.
  </Card>
  <Card title="Gateway security" icon="shield" href="/fa/gateway/security">
    در معرض بودن Webhook و کنترل‌های دسترسی فرستنده را بازبینی کنید.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## پیش از شروع

نیاز دارید به:

- Plugin رسمی SMS که با `openclaw plugins install @openclaw/sms` نصب شده باشد.
- یک حساب Twilio با شماره تلفنی که قابلیت SMS دارد، یا یک Twilio Messaging Service.
- Twilio Account SID و Auth Token.
- یک URL عمومی HTTPS که به OpenClaw Gateway شما برسد.
- انتخاب سیاست فرستنده: `pairing` برای استفاده خصوصی، `allowlist` برای شماره تلفن‌های از پیش تأییدشده، یا `open` فقط برای دسترسی SMS عمداً عمومی.

اگر شماره هر دو قابلیت SMS و تماس صوتی را دارد، از یک شماره Twilio برای هر دو استفاده کنید. Webhook مربوط به SMS و Webhook مربوط به تماس صوتی را جداگانه در Twilio پیکربندی کنید؛ این صفحه فقط Webhook مربوط به SMS را پوشش می‌دهد.

## راه‌اندازی سریع

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    در Twilio، **Phone Numbers > Manage > Active numbers** را باز کنید و شماره‌ای با قابلیت SMS انتخاب کنید. این موارد را ذخیره کنید:

    - Account SID، برای مثال `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - شماره تلفن فرستنده، برای مثال `+15551234567`

    اگر به‌جای شماره فرستنده ثابت از Messaging Service استفاده می‌کنید، Messaging Service SID را ذخیره کنید، برای مثال `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure the SMS channel">

این را با نام `sms.patch.json5` ذخیره کنید و جای‌نگهدارها را تغییر دهید:

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

  <Step title="Point Twilio at the Gateway webhook">
    در تنظیمات شماره تلفن Twilio، **Messaging** را باز کنید و **A message comes in** را روی این مقدار تنظیم کنید:

```text
https://gateway.example.com/webhooks/sms
```

    از HTTP `POST` استفاده کنید. مسیر محلی پیش‌فرض `/webhooks/sms` است؛ اگر به مسیر متفاوتی نیاز دارید، `channels.sms.webhookPath` را تغییر دهید.

  </Step>

  <Step title="Expose the exact SMS webhook path">
    URL عمومی شما باید مسیر SMS را به فرایند Gateway هدایت کند. اگر برای آزمایش محلی از Tailscale Funnel استفاده می‌کنید، `/webhooks/sms` را به‌صراحت در معرض دسترس قرار دهید:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    تماس صوتی و SMS از مسیرهای Webhook جداگانه استفاده می‌کنند. اگر همان شماره Twilio هر دو را مدیریت می‌کند، هر دو مسیر را هم در Twilio و هم در تونل خود پیکربندی‌شده نگه دارید.

  </Step>

  <Step title="Start the Gateway and approve first sender">

```bash
openclaw gateway
```

یک پیام متنی به شماره Twilio بفرستید. اولین پیام یک درخواست pairing ایجاد می‌کند. آن را تأیید کنید:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    کدهای pairing پس از ۱ ساعت منقضی می‌شوند.

  </Step>
</Steps>

## نمونه‌های پیکربندی

### فایل پیکربندی

وقتی می‌خواهید تعریف کانال همراه پیکربندی Gateway منتقل شود، از راه‌اندازی با فایل پیکربندی استفاده کنید:

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

برای استقرارهای تک‌حسابی که secretها از محیط میزبان می‌آیند، از راه‌اندازی با env استفاده کنید:

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

`TWILIO_SMS_FROM` به‌عنوان نام مستعار برای `TWILIO_PHONE_NUMBER` پذیرفته می‌شود. وقتی Twilio باید فرستنده را از یک Messaging Service انتخاب کند، به‌جای فرستنده شماره تلفنی از `TWILIO_MESSAGING_SERVICE_SID` استفاده کنید.

### توکن احراز هویت SecretRef

`authToken` می‌تواند یک SecretRef باشد. وقتی Gateway باید Twilio Auth Token را به‌جای ذخیره کردن پیکربندی متن ساده، از runtime مربوط به secretهای OpenClaw resolve کند، از این روش استفاده کنید:

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

متغیر محیطی ارجاع‌شده یا ارائه‌دهنده secret باید برای Gateway runtime قابل مشاهده باشد. پس از تغییر متغیرهای محیطی میزبان، فرایندهای Gateway مدیریت‌شده را راه‌اندازی مجدد کنید.

### شماره خصوصی فقط با allowlist

وقتی فقط شماره تلفن‌های شناخته‌شده باید بتوانند با agent صحبت کنند، از `allowlist` استفاده کنید:

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

### فرستنده Messaging Service

وقتی Twilio باید فرستنده را از طریق یک Messaging Service انتخاب کند، به‌جای `fromNumber` از `messagingServiceSid` استفاده کنید:

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

اگر پس از resolve شدن پیکربندی و env هر دو `fromNumber` و `messagingServiceSid` وجود داشته باشند، از `fromNumber` استفاده می‌شود.

### مقصد خروجی پیش‌فرض

وقتی automation یا ارسال آغازشده توسط agent باید در صورتی که جریان ارسال هدف صریحی را حذف کند، مقصد پیش‌فرض داشته باشد، `defaultTo` را تنظیم کنید:

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

`channels.sms.dmPolicy` دسترسی مستقیم SMS را کنترل می‌کند:

- `pairing` (پیش‌فرض)
- `allowlist` (به حداقل یک فرستنده در `allowFrom` نیاز دارد)
- `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
- `disabled`

ورودی‌های `allowFrom` باید شماره تلفن‌های E.164 مانند `+15551234567` باشند. پیشوندهای `sms:` پذیرفته و normalize می‌شوند. برای یک دستیار خصوصی، `dmPolicy: "allowlist"` را با شماره تلفن‌های صریح ترجیح دهید.

## ارسال SMS

هدف‌های SMS خروجی از پیشوند سرویس `sms:` همراه با انتخاب کانال SMS استفاده می‌کنند:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

وقتی انتخاب کانال ضمنی باشد، `twilio-sms:+15551234567` این کانال را بدون در اختیار گرفتن پیشوند سرویس `sms:` که مالک آن کانال موجود و مورد استفاده iMessage است، انتخاب می‌کند.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI به یک `--target` صریح نیاز دارد. `defaultTo` برای مسیرهای automation و ارسال آغازشده توسط agent است، جایی که هدف می‌تواند از پیکربندی کانال resolve شود.

پاسخ‌های agent از گفتگوهای SMS ورودی به‌صورت خودکار از طریق فرستنده Twilio پیکربندی‌شده به فرستنده برمی‌گردند.

خروجی SMS متن ساده است. OpenClaw markdown را حذف می‌کند، بلوک‌های کد fence‌شده را تخت می‌کند، لینک‌های خوانا را حفظ می‌کند، و پاسخ‌های طولانی را پیش از ارسال از طریق Twilio به قطعه‌های کوچک تقسیم می‌کند.

## تأیید راه‌اندازی

پس از شروع Gateway:

1. تأیید کنید log مربوط به Gateway مسیر Webhook پیامکی را نشان می‌دهد.
2. یک probe سمت Twilio اجرا کنید:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. از تلفن خود یک SMS به شماره Twilio بفرستید.
4. `openclaw pairing list sms` را اجرا کنید.
5. کد pairing را با `openclaw pairing approve sms <CODE>` تأیید کنید.
6. یک SMS دیگر بفرستید و تأیید کنید agent پاسخ می‌دهد.

برای آزمایش فقط خروجی، از این استفاده کنید:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### آزمایش انتهابه‌انتها از macOS iMessage/SMS

روی Mac که می‌تواند از طریق Messages، SMS اپراتوری ارسال کند، می‌توانید از `imsg` برای هدایت سمت فرستنده بدون دست زدن به تلفن خود استفاده کنید:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

پیام اول باید یک درخواست pairing ایجاد کند. پیام دوم باید پاسخ agent را از طریق Twilio دریافت کند.

## امنیت Webhook

به‌صورت پیش‌فرض، OpenClaw با استفاده از `publicWebhookUrl` و `authToken`، `X-Twilio-Signature` را اعتبارسنجی می‌کند. `publicWebhookUrl` را از نظر بایت‌به‌بایت با URL پیکربندی‌شده در Twilio، شامل scheme، host، path و query string، هم‌راستا نگه دارید.

فقط برای آزمایش تونل محلی، می‌توانید این را تنظیم کنید:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

از اعتبارسنجی امضای غیرفعال‌شده روی Gateway عمومی استفاده نکنید.

## پیکربندی چندحسابی

وقتی بیش از یک شماره Twilio را اداره می‌کنید، از `accounts` استفاده کنید:

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

هر حساب باید از یک `webhookPath` متمایز استفاده کند.

## عیب‌یابی

### Twilio مقدار 403 برمی‌گرداند یا OpenClaw، Webhook را رد می‌کند

بررسی کنید `publicWebhookUrl` دقیقاً با URL پیکربندی‌شده در Twilio، شامل scheme، host، path و query string، مطابقت داشته باشد. Twilio رشته URL عمومی را امضا می‌کند، بنابراین بازنویسی‌های proxy و hostnameهای جایگزین می‌توانند اعتبارسنجی امضا را خراب کنند.

### هیچ درخواست pairing ظاهر نمی‌شود

URL و روش Webhook مربوط به **Messaging** برای شماره Twilio را بررسی کنید. باید به URL Webhook پیامکی اشاره کند و از `POST` استفاده کند. همچنین تأیید کنید Gateway از اینترنت عمومی یا از طریق تونل شما قابل دسترسی است.

اگر log پیام Twilio خطای `11200` را نشان می‌دهد، Twilio پیام SMS ورودی را پذیرفته اما نتوانسته به Webhook شما برسد. بررسی کنید:

- **Messaging > A message comes in** در Twilio به `publicWebhookUrl` اشاره کند.
- روش `POST` باشد.
- تونل یا reverse proxy همان `webhookPath` دقیق را در معرض دسترس قرار دهد؛ برای Tailscale Funnel، `tailscale funnel status` را اجرا کنید و تأیید کنید `/webhooks/sms` فهرست شده است.
- `publicWebhookUrl` از همان scheme، host، path و query string استفاده کند که Twilio ارسال می‌کند، تا اعتبارسنجی امضا بتواند URL امضاشده را بازتولید کند.

### ارسال‌های خروجی ناموفق‌اند

تأیید کنید `accountSid`، `authToken`، و یکی از `fromNumber` یا `messagingServiceSid` resolve شده‌اند. اگر از حساب آزمایشی Twilio استفاده می‌کنید، ممکن است شماره مقصد پیش از ارسال SMS خروجی نیاز به تأیید در Twilio داشته باشد.

### پیام‌ها می‌رسند اما agent پاسخ نمی‌دهد

`dmPolicy` و `allowFrom` را بررسی کنید. با سیاست پیش‌فرض `pairing`، فرستنده باید پیش از پردازش نوبت‌های عادی عامل تأیید شده باشد.
