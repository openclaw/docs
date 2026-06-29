---
read_when:
    - Настройка Synology Chat с OpenClaw
    - Отладка маршрутизации Webhook Synology Chat
summary: Настройка Webhook Synology Chat и конфигурация OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-06-28T22:37:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Статус: встроенный плагин канала личных сообщений, использующий webhooks Synology Chat.
Плагин принимает входящие сообщения из исходящих webhooks Synology Chat и отправляет ответы
через входящий webhook Synology Chat.

## Встроенный плагин

Synology Chat поставляется как встроенный плагин в текущих выпусках OpenClaw, поэтому обычным
пакетным сборкам не нужна отдельная установка.

Если вы используете более старую сборку или пользовательскую установку, исключающую Synology Chat,
установите его вручную:

Установка из локального checkout:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Подробности: [Плагины](/ru/tools/plugin)

## Быстрая настройка

1. Убедитесь, что плагин Synology Chat доступен.
   - Текущие пакетные выпуски OpenClaw уже включают его.
   - Более старые/пользовательские установки могут добавить его вручную из исходного checkout с помощью команды выше.
   - `openclaw onboard` теперь показывает Synology Chat в том же списке настройки каналов, что и `openclaw channels add`.
   - Неинтерактивная настройка: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. В интеграциях Synology Chat:
   - Создайте входящий webhook и скопируйте его URL.
   - Создайте исходящий webhook с вашим секретным токеном.
3. Укажите URL исходящего webhook на ваш OpenClaw Gateway:
   - `https://gateway-host/webhook/synology` по умолчанию.
   - Или ваш пользовательский `channels.synology-chat.webhookPath`.
4. Завершите настройку в OpenClaw.
   - Через мастер: `openclaw onboard`
   - Напрямую: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустите Gateway и отправьте личное сообщение боту Synology Chat.

Подробности аутентификации webhook:

- OpenClaw принимает токен исходящего webhook из `body.token`, затем
  `?token=...`, затем из заголовков.
- Поддерживаемые формы заголовков:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Пустые или отсутствующие токены завершаются отказом.

Минимальная конфигурация:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Переменные окружения

Для учетной записи по умолчанию можно использовать переменные окружения:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (через запятую)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значения конфигурации переопределяют переменные окружения.

`SYNOLOGY_CHAT_INCOMING_URL` нельзя задать из workspace `.env`; см. [файлы Workspace `.env`](/ru/gateway/security).

## Политика личных сообщений и контроль доступа

- `dmPolicy: "allowlist"` — рекомендуемое значение по умолчанию.
- `allowedUserIds` принимает список (или строку через запятую) идентификаторов пользователей Synology.
- В режиме `allowlist` пустой список `allowedUserIds` считается ошибкой конфигурации, и маршрут webhook не запустится (используйте `dmPolicy: "open"` с `allowedUserIds: ["*"]` для разрешения всем).
- `dmPolicy: "open"` разрешает публичные личные сообщения только когда `allowedUserIds` включает `"*"`; при ограничительных записях общаться могут только совпадающие пользователи.
- `dmPolicy: "disabled"` блокирует личные сообщения.
- Привязка получателя ответа по умолчанию остается на стабильном числовом `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — аварийный режим совместимости, который повторно включает поиск по изменяемому имени пользователя/нику для доставки ответов.
- Подтверждения привязки работают с:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Исходящая доставка

Используйте числовые идентификаторы пользователей Synology Chat как цели.

Примеры:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Отправка медиа поддерживается через доставку файлов по URL.
URL исходящих файлов должны использовать `http` или `https`, а частные или иным образом заблокированные сетевые цели отклоняются до того, как OpenClaw передаст URL в webhook NAS.

## Несколько учетных записей

Несколько учетных записей Synology Chat поддерживаются в `channels.synology-chat.accounts`.
Каждая учетная запись может переопределять токен, входящий URL, путь webhook, политику личных сообщений и лимиты.
Сеансы личных сообщений изолированы по учетной записи и пользователю, поэтому один и тот же числовой `user_id`
в двух разных учетных записях Synology не разделяет состояние истории.
Задайте каждой включенной учетной записи отдельный `webhookPath`. OpenClaw теперь отклоняет точные дубликаты путей
и отказывается запускать именованные учетные записи, которые только наследуют общий путь webhook в конфигурациях с несколькими учетными записями.
Если вам намеренно нужно устаревшее наследование для именованной учетной записи, задайте
`dangerouslyAllowInheritedWebhookPath: true` для этой учетной записи или в `channels.synology-chat`,
но точные дубликаты путей по-прежнему отклоняются с отказом. Предпочитайте явные пути для каждой учетной записи.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Примечания по безопасности

- Храните `token` в секрете и ротируйте его при утечке.
- Оставляйте `allowInsecureSsl: false`, если только вы явно не доверяете самоподписанному локальному сертификату NAS.
- Входящие запросы webhook проверяются по токену и ограничиваются по частоте для каждого отправителя.
- Проверки недействительных токенов используют сравнение секретов с постоянным временем выполнения и завершаются отказом.
- Для production предпочитайте `dmPolicy: "allowlist"`.
- Держите `dangerouslyAllowNameMatching` выключенным, если вам явно не нужна устаревшая доставка ответов на основе имени пользователя.
- Держите `dangerouslyAllowInheritedWebhookPath` выключенным, если вы явно не принимаете риск маршрутизации по общему пути в конфигурации с несколькими учетными записями.

## Устранение неполадок

- `Missing required fields (token, user_id, text)`:
  - в полезной нагрузке исходящего webhook отсутствует одно из обязательных полей
  - если Synology отправляет токен в заголовках, убедитесь, что gateway/прокси сохраняет эти заголовки
- `Invalid token`:
  - секрет исходящего webhook не совпадает с `channels.synology-chat.token`
  - запрос попадает не в ту учетную запись/путь webhook
  - обратный прокси удалил заголовок токена до того, как запрос дошел до OpenClaw
- `Rate limit exceeded`:
  - слишком много попыток с недействительным токеном из одного источника могут временно заблокировать этот источник
  - у аутентифицированных отправителей также есть отдельное ограничение частоты сообщений для каждого пользователя
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` включен, но пользователи не настроены
- `User not authorized`:
  - числовой `user_id` отправителя отсутствует в `allowedUserIds`

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Привязка](/ru/channels/pairing) — аутентификация личных сообщений и поток привязки
- [Группы](/ru/channels/groups) — поведение группового чата и блокировка по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
