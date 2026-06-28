---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی LINE Webhook + اعتبارنامه‌ها نیاز دارید
    - شما گزینه‌های پیام ویژه LINE را می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از LINE Messaging API Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE از طریق LINE Messaging API به OpenClaw متصل می‌شود. Plugin به‌عنوان گیرنده Webhook
روی Gateway اجرا می‌شود و برای احراز هویت از channel access token + channel secret شما
استفاده می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، گفت‌وگوهای گروهی، رسانه، موقعیت‌ها، Flex
messages، template messages و quick replies پشتیبانی می‌شوند. واکنش‌ها و threadها
پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی channel، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

چک‌اوت محلی (وقتی از git repo اجرا می‌کنید):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## راه‌اندازی

1. یک LINE Developers account بسازید و Console را باز کنید:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. یک Provider بسازید (یا انتخاب کنید) و channel مربوط به **Messaging API** را اضافه کنید.
3. از channel settings، **Channel access token** و **Channel secret** را کپی کنید.
4. در Messaging API settings، گزینه **Use webhook** را فعال کنید.
5. Webhook URL را روی endpoint مربوط به Gateway خود تنظیم کنید (HTTPS ضروری است):

```
https://gateway-host/line/webhook
```

Gateway به Webhook verification (GET) در LINE پاسخ می‌دهد و بلافاصله پس از signature و payload validation،
رویدادهای inbound امضاشده (POST) را می‌پذیرد؛ پردازش agent
به‌صورت ناهمگام ادامه می‌یابد.
اگر به مسیر سفارشی نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- LINE signature verification به body وابسته است (HMAC روی raw body)، بنابراین OpenClaw پیش از verification، strict pre-auth body limits و timeout را اعمال می‌کند.
- OpenClaw رویدادهای Webhook را از raw request bytes تأییدشده پردازش می‌کند. برای ایمنی signature-integrity، مقدارهای `req.body` که توسط upstream middleware تغییر کرده‌اند نادیده گرفته می‌شوند.

## پیکربندی

حداقل config:

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

config برای DM عمومی:

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

Env vars (فقط default account):

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

`tokenFile` و `secretFile` باید به regular files اشاره کنند. Symlinks رد می‌شوند.

چند account:

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

پیام‌های مستقیم به‌صورت پیش‌فرض روی pairing هستند. فرستنده‌های ناشناس pairing code دریافت می‌کنند و
تا زمانی که approved شوند، پیام‌هایشان نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists و policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs مجاز برای DMها؛ برای `dmPolicy: "open"` مقدار `["*"]` لازم است
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs مجاز برای گروه‌ها
- overrides برای هر گروه: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups را می‌توان از `allowFrom`، `groupAllowFrom` و per-group `allowFrom` با `accessGroup:<name>` ارجاع داد.
- نکته Runtime: اگر `channels.line` کاملاً missing باشد، runtime برای group checks به `groupPolicy="allowlist"` fallback می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

LINE IDs به حروف بزرگ و کوچک حساس هستند. شناسه‌های معتبر این‌گونه هستند:

- کاربر: `U` + 32 hex chars
- گروه: `C` + 32 hex chars
- اتاق: `R` + 32 hex chars

## رفتار پیام

- Text در chunkهای 5000 کاراکتری تقسیم می‌شود.
- Markdown formatting حذف می‌شود؛ code blocks و tables در صورت امکان به Flex
  cards تبدیل می‌شوند.
- Streaming responses بافر می‌شوند؛ در حالی که agent کار می‌کند، LINE chunkهای کامل را همراه با loading
  animation دریافت می‌کند.
- Media downloads با `channels.line.mediaMaxMb` (پیش‌فرض 10) محدود می‌شوند.
- رسانه inbound پیش از ارسال به agent، در مسیر `~/.openclaw/media/inbound/` ذخیره می‌شود،
  که با shared media store مورد استفاده سایر Pluginهای channel
  همراه مطابقت دارد.

## داده channel (پیام‌های غنی)

برای ارسال quick replies، locations، Flex cards یا template
messages از `channelData.line` استفاده کنید.

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

LINE Plugin همچنین command `/card` را برای presets مربوط به Flex message ارائه می‌کند:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از conversation bindings مربوط به ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here` گفت‌وگوی فعلی LINE را بدون ساخت child thread به ACP session متصل می‌کند.
- ACP bindings پیکربندی‌شده و ACP sessions فعالِ متصل به conversation، روی LINE مانند سایر conversation channels کار می‌کنند.

برای جزئیات، [ACP agents](/fa/tools/acp-agents) را ببینید.

## رسانه outbound

LINE Plugin از ارسال images، videos و audio files از طریق ابزار پیام agent پشتیبانی می‌کند. رسانه با preview مناسب و مدیریت tracking از طریق مسیر تحویل مخصوص LINE ارسال می‌شود:

- **Images**: به‌صورت LINE image messages با automatic preview generation ارسال می‌شوند.
- **Videos**: با explicit preview و content-type handling ارسال می‌شوند.
- **Audio**: به‌صورت LINE audio messages ارسال می‌شود.

Outbound media URLs باید public HTTPS URLs باشند. OpenClaw پیش از واگذاری URL به LINE، target hostname را validate می‌کند و loopback، link-local و private-network targets را رد می‌کند.

Generic media sends، وقتی مسیر مخصوص LINE در دسترس نباشد، به existing image-only route fallback می‌کنند.

## عیب‌یابی

- **Webhook verification fails:** مطمئن شوید Webhook URL از HTTPS استفاده می‌کند و
  `channelSecret` با LINE console مطابقت دارد.
- **No inbound events:** تأیید کنید Webhook path با `channels.line.webhookPath` مطابقت دارد
  و Gateway از سمت LINE قابل دسترسی است.
- **Media download errors:** اگر رسانه از limit پیش‌فرض بزرگ‌تر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [مرور کلی channelها](/fa/channels) — همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و mention gating
- [مسیریابی channel](/fa/channels/channel-routing) — session routing برای پیام‌ها
- [امنیت](/fa/gateway/security) — access model و hardening
