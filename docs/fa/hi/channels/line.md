---
read_when:
    - می‌خواهید OpenClaw را به LINE متصل کنید
    - به راه‌اندازی LINE Webhook + اعتبارنامه‌ها نیاز دارید
    - شما گزینه‌های پیام ویژه LINE را می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از Plugin API پیام‌رسانی LINE
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:34:02Z"
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

وضعیت: Plugin قابل دانلود. direct messages، group chats، media، locations، Flex
messages، template messages، و quick replies پشتیبانی می‌شوند. Reactions و threads
پشتیبانی نمی‌شوند.

## نصب

پیش از پیکربندی channel، LINE را نصب کنید:

```bash
openclaw plugins install @openclaw/line
```

چک‌اوت محلی (هنگام اجرا از git repo):

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

Gateway به Webhook verification (GET) مربوط به LINE پاسخ می‌دهد و پس از signature و payload validation، signed
inbound events (POST) را بلافاصله می‌پذیرد؛ agent
processing به‌صورت ناهمگام ادامه پیدا می‌کند.
اگر به custom path نیاز دارید، `channels.line.webhookPath` یا
`channels.line.accounts.<id>.webhookPath` را تنظیم کنید و URL را مطابق آن به‌روزرسانی کنید.

نکته امنیتی:

- LINE signature verification به body وابسته است (HMAC روی raw body)، بنابراین OpenClaw پیش از verification، strict pre-auth body limits و timeout را اعمال می‌کند.
- OpenClaw، Webhook events را از verified raw request bytes پردازش می‌کند. برای signature-integrity safety، مقادیر upstream middleware-transformed `req.body` نادیده گرفته می‌شوند.

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

Public DM config:

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

فایل‌های Token/secret:

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

`tokenFile` و `secretFile` باید به regular files اشاره کنند. Symlinks پذیرفته نمی‌شوند.

چندین account:

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

Direct messages به‌صورت پیش‌فرض روی pairing هستند. senders ناشناس یک pairing code دریافت می‌کنند و
messages آن‌ها تا زمان approved شدن نادیده گرفته می‌شود.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists و policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs موجود در allowlist برای DMs؛ برای `dmPolicy: "open"` مقدار `["*"]` ضروری است
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs موجود در allowlist برای groups
- بازنویسی‌های Per-group: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups را می‌توان با `accessGroup:<name>` از `allowFrom`، `groupAllowFrom`، و per-group `allowFrom` ارجاع داد.
- نکته Runtime: اگر `channels.line` کاملا missing باشد، runtime برای group checks به `groupPolicy="allowlist"` fallback می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

LINE IDs به بزرگی و کوچکی حروف حساس هستند. Valid IDs چنین شکلی دارند:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## رفتار پیام

- Text در chunks با اندازه 5000 characters تقسیم می‌شود.
- Markdown formatting حذف می‌شود؛ code blocks و tables در صورت امکان به Flex
  cards تبدیل می‌شوند.
- Streaming responses به‌صورت buffered هستند؛ هنگام کار agent، LINE کل chunks را همراه با loading
  animation دریافت می‌کند.
- Media downloads به `channels.line.mediaMaxMb` (default 10) محدود می‌شوند.
- Inbound media پیش از pass شدن به agent، زیر `~/.openclaw/media/inbound/` save می‌شود،
  که با shared media store مورد استفاده سایر bundled channel
  plugins همخوانی دارد.

## داده‌های Channel (rich messages)

برای ارسال quick replies، locations، Flex cards، یا template
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

LINE Plugin برای Flex message presets، command `/card` را نیز ship می‌کند:

```
/card info "Welcome" "Thanks for joining!"
```

## پشتیبانی ACP

LINE از bindings مربوط به conversation در ACP (Agent Communication Protocol) پشتیبانی می‌کند:

- `/acp spawn <agent> --bind here`، بدون ساخت child thread، chat فعلی LINE را به ACP session متصل می‌کند.
- Configured ACP bindings و active conversation-bound ACP sessions در LINE مانند سایر conversation channels کار می‌کنند.

برای جزئیات، [ACP agents](/fa/tools/acp-agents) را ببینید.

## رسانه خروجی

LINE Plugin از ارسال images، videos، و audio files از طریق agent message tool پشتیبانی می‌کند. Media با appropriate preview و tracking handling از طریق LINE-specific delivery path ارسال می‌شود:

- **Images**: به‌صورت LINE image messages همراه با automatic preview generation ارسال می‌شوند.
- **Videos**: همراه با explicit preview و content-type handling ارسال می‌شوند.
- **Audio**: به‌صورت LINE audio messages ارسال می‌شود.

Outbound media URLs باید public HTTPS URLs باشند. OpenClaw پیش از واگذاری URL به LINE، target hostname را validate می‌کند و loopback، link-local، و private-network targets را رد می‌کند.

Generic media sends، وقتی LINE-specific path در دسترس نباشد، به existing image-only route fallback می‌کند.

## عیب‌یابی

- **Webhook verification fails:** مطمئن شوید Webhook URL از HTTPS استفاده می‌کند و
  `channelSecret` با LINE console مطابقت دارد.
- **No inbound events:** تأیید کنید Webhook path با `channels.line.webhookPath` مطابقت دارد
  و Gateway از LINE قابل دسترسی است.
- **Media download errors:** اگر media از default limit بیشتر است، `channels.line.mediaMaxMb` را افزایش دهید.

## مرتبط

- [نمای کلی Channels](/fa/channels) — همه channels پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — DM authentication و pairing flow
- [Groups](/fa/channels/groups) — رفتار group chat و mention gating
- [Channel Routing](/fa/channels/channel-routing) — session routing برای messages
- [Security](/fa/gateway/security) — access model و hardening
