---
read_when:
    - Підключення OpenClaw до робочого простору ClickClack
    - Тестування ідентичностей ботів ClickClack
summary: Налаштування каналу ClickClack із токеном бота та синтаксис цілі
title: Клац-клац
x-i18n:
    generated_at: "2026-05-10T19:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack підключає OpenClaw до самостійно розгорнутого робочого простору ClickClack через повноцінні токени ботів ClickClack.

Використовуйте це, коли потрібно, щоб агент OpenClaw відображався як користувач-бот ClickClack. ClickClack підтримує незалежних сервісних ботів і ботів, що належать користувачам; боти, що належать користувачам, зберігають `owner_user_id` і отримують лише ті області дії токена, які ви надаєте.

## Швидке налаштування

Створіть токен бота в ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Для бота, що належить користувачу, додайте `--owner <user_id>`.

Налаштуйте OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Потім запустіть:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Кілька ботів

Кожен обліковий запис відкриває власне з'єднання ClickClack у реальному часі та використовує власний токен бота.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` використовує `api.runtime.llm.complete` безпосередньо для коротких відповідей бота.
Коли обліковий запис задає `agentId`, OpenClaw вимагає явний біт довіри
`plugins.entries.clickclack.llm.allowAgentIdOverride`, щоб Plugin
міг виконувати доповнення для цього агента бота. Залишайте його вимкненим, якщо ви використовуєте лише стандартний
маршрут агента.

## Цілі

- `channel:<name-or-id>` надсилає до каналу робочого простору. Цілі без префікса за замовчуванням використовують `channel:`.
- `dm:<user_id>` створює або повторно використовує пряму розмову з цим користувачем.
- `thread:<message_id>` відповідає в наявному треді.

Приклади:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Дозволи

Області дії токенів ClickClack застосовуються API ClickClack.

- `bot:read`: читання даних робочого простору, каналу, повідомлення, треду, приватних повідомлень, реального часу та профілю.
- `bot:write`: `bot:read` плюс повідомлення в каналах, відповіді в тредах, приватні повідомлення та завантаження файлів.
- `bot:admin`: `bot:write` плюс створення каналів.

OpenClaw потребує лише `bot:write` для звичайного чату агента.

## Усунення несправностей

- `ClickClack is not configured`: задайте `channels.clickclack.token` або `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: задайте для `workspace` ідентифікатор або slug робочого простору, повернений ClickClack.
- Немає вхідних відповідей: переконайтеся, що токен має доступ до читання в реальному часі, а бот не відповідає на власні повідомлення.
- Не вдається надіслати в канал: перевірте, що бот є учасником робочого простору та має `bot:write`.
