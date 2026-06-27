---
read_when:
    - Підключення OpenClaw до робочого простору ClickClack
    - Тестування ідентичностей ботів ClickClack
summary: Налаштування каналу ClickClack із bot-token та синтаксис цілі
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack підключає OpenClaw до самостійно розміщеного робочого простору ClickClack через повноцінні токени ботів ClickClack.

Використовуйте це, коли потрібно, щоб агент OpenClaw відображався як користувач-бот ClickClack. ClickClack підтримує незалежних сервісних ботів і ботів, що належать користувачам; боти, що належать користувачам, зберігають `owner_user_id` і отримують лише ті області доступу токена, які ви надаєте.

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

Якщо `plugins.allow` є непорожнім обмежувальним списком, явний вибір
ClickClack під час налаштування каналу або запуск `openclaw plugins enable clickclack`
додає `clickclack` до цього списку. Встановлення під час онбордингу використовує таку саму
поведінку явного вибору. Ці шляхи не перевизначають `plugins.deny` або
глобальне налаштування `plugins.enabled: false`. Прямий
`openclaw plugins install @openclaw/clickclack` дотримується звичайної
політики встановлення Plugin і також записує ClickClack в наявний список дозволених.

## Кілька ботів

Кожен обліковий запис відкриває власне підключення ClickClack у реальному часі та використовує власний токен бота.

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
Коли обліковий запис задає `agentId`, OpenClaw вимагає явний довірчий біт
`plugins.entries.clickclack.llm.allowAgentIdOverride`, щоб Plugin
міг запускати завершення для цього агента бота. Залиште його вимкненим, якщо використовуєте лише стандартний
маршрут агента.

## Цілі

- `channel:<name-or-id>` надсилає до каналу робочого простору. Цілі без префікса типово використовують `channel:`.
- `dm:<user_id>` створює або повторно використовує пряму розмову з цим користувачем.
- `thread:<message_id>` відповідає в наявній гілці.

Приклади:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Дозволи

Області доступу токена ClickClack застосовуються API ClickClack.

- `bot:read`: читання даних робочого простору, каналу, повідомлення, гілки, DM, реального часу та профілю.
- `bot:write`: `bot:read` плюс повідомлення в каналах, відповіді в гілках, DM і завантаження.
- `bot:admin`: `bot:write` плюс створення каналів.

OpenClaw потребує лише `bot:write` для звичайного чату агента.

## Усунення несправностей

- `ClickClack is not configured`: задайте `channels.clickclack.token` або `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: задайте для `workspace` ідентифікатор або слаг робочого простору, повернений ClickClack.
- Немає вхідних відповідей: підтвердьте, що токен має доступ до читання в реальному часі та що бот не відповідає на власні повідомлення.
- Не вдається надсилати в канал: перевірте, що бот є учасником робочого простору та має `bot:write`.
