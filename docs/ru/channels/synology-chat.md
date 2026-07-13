---
read_when:
    - Настройка Synology Chat с OpenClaw
    - Отладка маршрутизации Webhook для Synology Chat
summary: Настройка Webhook для Synology Chat и конфигурация OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-13T17:56:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat подключается к OpenClaw через пару вебхуков: исходящий вебхук Synology Chat отправляет входящие личные сообщения в Gateway, а ответы возвращаются через входящий вебхук Synology Chat.

Статус: официальный плагин, устанавливаемый отдельно. Поддерживаются только личные сообщения; поддерживается отправка текста и файлов по URL.

## Установка

```bash
openclaw plugins install @openclaw/synology-chat
```

Локальная рабочая копия (при запуске из git-репозитория):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Подробнее: [Плагины](/ru/tools/plugin)

## Быстрая настройка

1. Установите плагин (см. выше).
2. В интеграциях Synology Chat:
   - Создайте входящий вебхук и скопируйте его URL.
   - Создайте исходящий вебхук с вашим секретным токеном.
3. Укажите для исходящего вебхука URL вашего Gateway OpenClaw:
   - `https://gateway-host/webhook/synology` по умолчанию.
   - Либо ваш собственный `channels.synology-chat.webhookPath`.
4. Завершите настройку в OpenClaw. Synology Chat отображается в одном и том же списке настройки каналов в обоих сценариях:
   - Пошаговый: `openclaw onboard` или `openclaw channels add`
   - Прямой: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Перезапустите Gateway и отправьте личное сообщение боту Synology Chat.

Сведения об аутентификации вебхука:

- OpenClaw принимает токен исходящего вебхука сначала из `body.token`, затем из
  `?token=...`, а затем из заголовков.
- Допустимые варианты заголовков:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- При пустом или отсутствующем токене запрос отклоняется.
- Полезная нагрузка может иметь формат `application/x-www-form-urlencoded` или `application/json`; обязательны `token`, `user_id` и `text`.

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

## Переменные среды

Для учётной записи по умолчанию можно использовать переменные среды:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (через запятую)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Значения конфигурации переопределяют переменные среды.

`SYNOLOGY_CHAT_INCOMING_URL` и `SYNOLOGY_NAS_HOST` нельзя задать из файла `.env` рабочей области; см. [Файлы `.env` рабочей области](/ru/gateway/security#workspace-env-files).

## Политика личных сообщений и управление доступом

- Поддерживаемые значения `dmPolicy`: `allowlist` (по умолчанию), `open` и `disabled`. В Synology Chat нет процедуры сопряжения; разрешите отправителей, добавив их числовые идентификаторы пользователей Synology в `allowedUserIds`.
- `allowedUserIds` принимает список (или строку со значениями через запятую) идентификаторов пользователей Synology.
- В режиме `allowlist` пустой список `allowedUserIds` считается ошибкой конфигурации, и маршрут вебхука не запускается.
- `dmPolicy: "open"` разрешает общедоступные личные сообщения, только если `allowedUserIds` содержит `"*"`; при наличии ограничивающих записей общаться могут только соответствующие им пользователи. При `open` с пустым списком `allowedUserIds` маршрут также не запускается.
- `dmPolicy: "disabled"` блокирует личные сообщения.
- По умолчанию получатель ответа привязывается к стабильному числовому `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` — аварийный режим совместимости, который повторно включает поиск по изменяемому имени пользователя или псевдониму для доставки ответов.

## Исходящая доставка

Используйте в качестве адресатов числовые идентификаторы пользователей Synology Chat. Поддерживаются префиксы `synology-chat:`, `synology_chat:` и `synology:`.

Примеры:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Исходящий текст разбивается на фрагменты по 2000 символов. Отправка медиафайлов поддерживается посредством доставки файлов по URL: NAS загружает и прикрепляет файл (не более 32 МБ). URL исходящих файлов должны использовать `http` или `https`, а частные или иным образом заблокированные сетевые адресаты отклоняются до того, как OpenClaw передаст URL вебхуку NAS.

## Несколько учётных записей

В `channels.synology-chat.accounts` поддерживается несколько учётных записей Synology Chat.
Каждая учётная запись может переопределять токен, URL входящего вебхука, путь вебхука, политику личных сообщений и ограничения.
Сеансы личных сообщений изолированы по учётным записям и пользователям, поэтому один и тот же числовой `user_id`
в двух разных учётных записях Synology не использует общее состояние истории сообщений.
Назначьте каждой включённой учётной записи уникальный `webhookPath`. OpenClaw отклоняет полностью совпадающие пути
и не запускает именованные учётные записи, которые в конфигурациях с несколькими учётными записями лишь наследуют общий путь вебхука.
Если для именованной учётной записи намеренно требуется устаревшее наследование, задайте
`dangerouslyAllowInheritedWebhookPath: true` в этой учётной записи или в `channels.synology-chat`,
однако полностью совпадающие пути по-прежнему отклоняются. Предпочтительно явно задавать отдельные пути для каждой учётной записи.

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

- Храните `token` в секрете и смените его в случае утечки.
- Не изменяйте `allowInsecureSsl: false`, если только вы явно не доверяете самоподписанному сертификату локального NAS.
- Запросы входящего вебхука проверяются по токену, а их частота ограничивается отдельно для каждого отправителя (`rateLimitPerMinute`, по умолчанию 30).
- Проверки недействительных токенов используют сравнение секретов за постоянное время и отклоняют запросы; повторные попытки с недействительным токеном временно блокируют исходный IP-адрес.
- Текст входящих сообщений очищается от известных шаблонов инъекций в промпты и обрезается до 4000 символов.
- Для рабочей среды предпочтительно использовать `dmPolicy: "allowlist"`.
- Не включайте `dangerouslyAllowNameMatching`, если вам явно не требуется устаревшая доставка ответов по имени пользователя.
- Не включайте `dangerouslyAllowInheritedWebhookPath`, если вы явно не принимаете риск маршрутизации по общему пути в конфигурации с несколькими учётными записями.

## Устранение неполадок

- `Missing required fields (token, user_id, text)`:
  - в полезной нагрузке исходящего вебхука отсутствует одно из обязательных полей
  - если Synology отправляет токен в заголовках, убедитесь, что Gateway или прокси сохраняет эти заголовки
- `Invalid token`:
  - секрет исходящего вебхука не соответствует `channels.synology-chat.token`
  - запрос поступает на неверный путь учётной записи или вебхука
  - обратный прокси удалил заголовок токена до того, как запрос достиг OpenClaw
- `Rate limit exceeded`:
  - слишком много попыток с недействительным токеном из одного источника могут временно заблокировать этот источник
  - для аутентифицированных отправителей также действует отдельное ограничение частоты сообщений для каждого пользователя
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` включён, но пользователи не настроены
- `User not authorized`:
  - числовой `user_id` отправителя отсутствует в `allowedUserIds`

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Группы](/ru/channels/groups) — поведение групповых чатов и фильтрация по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
