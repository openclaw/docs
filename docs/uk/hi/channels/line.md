---
read_when:
    - Ви хочете підключити OpenClaw до LINE
    - Вам потрібне налаштування LINE Webhook і облікових даних
    - Ви хочете параметри повідомлень, специфічні для LINE
summary: Налаштування, конфігурація та використання LINE Messaging API Plugin
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE підключається до OpenClaw через LINE Messaging API. Plugin працює як приймач Webhook
на Gateway і використовує ваш channel access token + channel secret для
автентифікації.

Стан: завантажуваний Plugin. Підтримуються прямі повідомлення, групові чати, медіа, локації, Flex
messages, template messages і quick replies. Reactions і threads
не підтримуються.

## Встановлення

Установіть LINE перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/line
```

Локальний checkout (коли запускаєте з git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Налаштування

1. Створіть LINE Developers account і відкрийте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Створіть (або виберіть) Provider і додайте channel **Messaging API**.
3. Скопіюйте **Channel access token** і **Channel secret** з налаштувань channel.
4. У налаштуваннях Messaging API увімкніть **Use webhook**.
5. Установіть Webhook URL на endpoint вашого Gateway (потрібен HTTPS):

```
https://gateway-host/line/webhook
```

Gateway відповідає на Webhook verification (GET) від LINE і приймає signed
inbound events (POST) одразу після перевірки signature та payload validation; агентна
обробка продовжується асинхронно.
Якщо вам потрібен custom path, установіть `channels.line.webhookPath` або
`channels.line.accounts.<id>.webhookPath` і відповідно оновіть URL.

Примітка щодо безпеки:

- LINE signature verification залежить від body (HMAC на raw body), тому OpenClaw застосовує строгі pre-auth body limits і timeout перед verification.
- OpenClaw обробляє Webhook events з verified raw request bytes. Для безпеки signature-integrity значення `req.body`, змінені upstream middleware, ігноруються.

## Конфігурація

Мінімальна config:

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

Env vars (лише default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файли token/secret:

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

`tokenFile` і `secretFile` мають вказувати на regular files. Symlinks відхиляються.

Кілька accounts:

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

## Керування доступом

Direct messages за замовчуванням використовують pairing. Невідомі senders отримують pairing code, а їхні
messages ігноруються, доки їх не буде approved.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists і policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE user IDs для DMs; для `dmPolicy: "open"` потрібно `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE user IDs для groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups можна reference з `allowFrom`, `groupAllowFrom` і per-group `allowFrom` за допомогою `accessGroup:<name>`.
- Примітка runtime: якщо `channels.line` повністю missing, runtime fallback до `groupPolicy="allowlist"` для group checks (навіть якщо встановлено `channels.defaults.groupPolicy`).

LINE IDs чутливі до регістру. Valid IDs виглядають так:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Поведінка повідомлень

- Text ділиться на chunks по 5000 characters.
- Markdown formatting видаляється; code blocks і tables за можливості перетворюються на Flex
  cards.
- Streaming responses buffered; поки agent працює, LINE отримує повні chunks з loading
  animation.
- Media downloads обмежені `channels.line.mediaMaxMb` (default 10).
- Inbound media зберігається під `~/.openclaw/media/inbound/` перед передаванням agent,
  що відповідає shared media store, який використовують інші bundled channel
  plugins.

## Дані каналу (rich messages)

Використовуйте `channelData.line`, щоб надсилати quick replies, locations, Flex cards або template
messages.

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

LINE Plugin також постачає command `/card` для Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## Підтримка ACP

LINE підтримує conversation bindings ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` прив’язує поточний LINE chat до ACP session без створення child thread.
- Налаштовані ACP bindings і active conversation-bound ACP sessions працюють у LINE так само, як інші conversation channels.

Докладніше див. [ACP agents](/uk/tools/acp-agents).

## Вихідні медіа

LINE Plugin підтримує надсилання images, videos і audio files через agent message tool. Media надсилається через LINE-specific delivery path з відповідними preview і tracking handling:

- **Images**: надсилаються як LINE image messages з automatic preview generation.
- **Videos**: надсилаються з explicit preview і content-type handling.
- **Audio**: надсилається як LINE audio messages.

Outbound media URLs мають бути public HTTPS URLs. OpenClaw перевіряє target hostname перед передаванням URL до LINE і відхиляє loopback, link-local та private-network targets.

Generic media sends fallback до existing image-only route, якщо LINE-specific path недоступний.

## Усунення несправностей

- **Webhook verification fails:** переконайтеся, що Webhook URL використовує HTTPS і
  `channelSecret` збігається з LINE console.
- **No inbound events:** підтвердьте, що Webhook path збігається з `channels.line.webhookPath`
  і Gateway reachable з боку LINE.
- **Media download errors:** якщо media перевищує default limit, збільште `channels.line.mediaMaxMb`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані channels
- [Pairing](/uk/channels/pairing) — DM authentication і pairing flow
- [Групи](/uk/channels/groups) — group chat behavior і mention gating
- [Маршрутизація каналів](/uk/channels/channel-routing) — session routing для messages
- [Безпека](/uk/gateway/security) — access model і hardening
