---
read_when:
    - Вы хотите подключить OpenClaw к LINE
    - Вам нужен Webhook LINE и настройка учетных данных
    - Вам нужны параметры сообщений, специфичные для LINE
summary: 'Plugin LINE Messaging API: настройка, конфигурация и использование'
title: LINE
x-i18n:
    generated_at: "2026-06-28T23:03:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE подключается к OpenClaw через LINE Messaging API. Plugin работает как Webhook-приемник на Gateway и использует для аутентификации ваш токен доступа канала + секрет канала.

Состояние: загружаемый Plugin. Поддерживаются личные сообщения, групповые чаты, медиафайлы, местоположения, Flex-сообщения, шаблонные сообщения и быстрые ответы. Реакции и ветки не поддерживаются.

## Установка

Установите LINE перед настройкой канала:

```bash
openclaw plugins install @openclaw/line
```

Локальный checkout (при запуске из git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Настройка

1. Создайте учетную запись LINE Developers и откройте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Создайте (или выберите) Provider и добавьте канал **Messaging API**.
3. Скопируйте **токен доступа канала** и **секрет канала** из настроек канала.
4. В настройках Messaging API включите **Использовать Webhook**.
5. Установите Webhook URL на endpoint вашего Gateway (требуется HTTPS):

```
https://gateway-host/line/webhook
```

Gateway отвечает на Webhook verification (GET) от LINE и принимает подписанные входящие события (POST) сразу после signature и payload validation; agent processing продолжается асинхронно.
Если вам нужен custom path, задайте `channels.line.webhookPath` или `channels.line.accounts.<id>.webhookPath` и обновите URL соответствующим образом.

Примечание по безопасности:

- LINE signature verification зависит от body (HMAC по raw body), поэтому OpenClaw применяет строгие pre-auth body limits и timeout перед verification.
- OpenClaw обрабатывает Webhook events из проверенных raw request bytes. Для signature-integrity safety значения `req.body`, преобразованные upstream middleware, игнорируются.

## Конфигурация

Минимальный config:

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

Env vars (только default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файлы token/secret:

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

`tokenFile` и `secretFile` должны указывать на regular files. Symlinks отклоняются.

Несколько accounts:

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

## Контроль доступа

Личные сообщения по умолчанию используют pairing. Неизвестные senders получают pairing code, а их messages игнорируются до approval.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists и policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE user IDs для DMs; для `dmPolicy: "open"` требуется `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE user IDs для groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups можно ссылаться из `allowFrom`, `groupAllowFrom` и per-group `allowFrom` через `accessGroup:<name>`.
- Runtime note: если `channels.line` полностью отсутствует, runtime для group checks fallback на `groupPolicy="allowlist"` (даже если задан `channels.defaults.groupPolicy`).

LINE IDs чувствительны к регистру. Valid IDs выглядят так:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Поведение сообщений

- Text разбивается на chunks по 5000 characters.
- Markdown formatting удаляется; code blocks и tables по возможности преобразуются в Flex cards.
- Streaming responses буферизуются; пока agent работает, LINE получает полные chunks с loading animation.
- Media downloads ограничены `channels.line.mediaMaxMb` (default 10).
- Inbound media сохраняются в `~/.openclaw/media/inbound/` перед передачей agent, что соответствует shared media store, используемому другими bundled channel plugins.

## Данные канала (rich messages)

Используйте `channelData.line`, чтобы отправлять quick replies, locations, Flex cards или template messages.

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

LINE Plugin также поставляет команду `/card` для Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## Поддержка ACP

LINE поддерживает ACP (Agent Communication Protocol) conversation bindings:

- `/acp spawn <agent> --bind here` привязывает текущий LINE chat к ACP session без создания child thread.
- Configured ACP bindings и active conversation-bound ACP sessions работают в LINE так же, как другие conversation channels.

Подробности см. в [ACP agents](/ru/tools/acp-agents).

## Исходящие медиафайлы

LINE Plugin поддерживает отправку images, videos и audio files через agent message tool. Media отправляются через LINE-specific delivery path с appropriate preview и tracking handling:

- **Images**: отправляются как LINE image messages с automatic preview generation.
- **Videos**: отправляются с explicit preview и content-type handling.
- **Audio**: отправляется как LINE audio messages.

Outbound media URLs должны быть public HTTPS URLs. OpenClaw проверяет target hostname перед передачей URL в LINE и отклоняет loopback, link-local и private-network targets.

Generic media sends fallback на existing image-only route, если LINE-specific path недоступен.

## Устранение неполадок

- **Webhook verification fails:** убедитесь, что Webhook URL использует HTTPS и `channelSecret` совпадает с LINE console.
- **No inbound events:** подтвердите, что Webhook path совпадает с `channels.line.webhookPath` и Gateway доступен из LINE.
- **Media download errors:** если media превышает default limit, увеличьте `channels.line.mediaMaxMb`.

## Связанные разделы

- [Обзор каналов](/ru/channels) — все поддерживаемые channels
- [Pairing](/ru/channels/pairing) — DM authentication и pairing flow
- [Groups](/ru/channels/groups) — group chat behavior и mention gating
- [Channel Routing](/ru/channels/channel-routing) — session routing для messages
- [Security](/ru/gateway/security) — access model и hardening
