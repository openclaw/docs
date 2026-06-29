---
read_when:
    - Работа над функциями канала Nextcloud Talk
summary: Статус поддержки, возможности и конфигурация Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-06-28T22:35:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Статус: встроенный Plugin (бот Webhook). Поддерживаются личные сообщения, комнаты, реакции и сообщения Markdown.

## Встроенный Plugin

Nextcloud Talk поставляется как встроенный Plugin в текущих релизах OpenClaw, поэтому
обычным пакетным сборкам не нужна отдельная установка.

Если вы используете более старую сборку или пользовательскую установку, из которой исключен Nextcloud Talk,
установите npm-пакет напрямую:

Установка через CLI (реестр npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Используйте пакет без версии, чтобы следовать текущему официальному тегу релиза. Закрепляйте точную
версию только когда нужна воспроизводимая установка.

Локальная рабочая копия (при запуске из git-репозитория):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Подробнее: [Plugins](/ru/tools/plugin)

## Быстрая настройка (для начинающих)

1. Убедитесь, что Plugin Nextcloud Talk доступен.
   - Текущие пакетные релизы OpenClaw уже включают его.
   - В более старые/пользовательские установки его можно добавить вручную командами выше.
2. На вашем сервере Nextcloud создайте бота:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Включите бота в настройках целевой комнаты.
4. Настройте OpenClaw:
   - Конфигурация: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Или переменная окружения: `NEXTCLOUD_TALK_BOT_SECRET` (только учетная запись по умолчанию)

   Настройка через CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Эквивалентные явные поля:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Секрет из файла:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Перезапустите gateway (или завершите настройку).

Минимальная конфигурация:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Примечания

- Боты не могут инициировать личные сообщения. Пользователь должен сначала написать боту.
- URL Webhook должен быть доступен для Gateway; если используется прокси, задайте `webhookPublicUrl`.
- Загрузка медиа не поддерживается API бота; медиа отправляются как URL.
- Полезная нагрузка Webhook не различает личные сообщения и комнаты; задайте `apiUser` + `apiPassword`, чтобы включить определение типа комнаты (иначе личные сообщения обрабатываются как комнаты).

## Управление доступом (личные сообщения)

- По умолчанию: `channels.nextcloud-talk.dmPolicy = "pairing"`. Неизвестные отправители получают код сопряжения.
- Подтверждение:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Публичные личные сообщения: `channels.nextcloud-talk.dmPolicy="open"` плюс `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` сопоставляет только идентификаторы пользователей Nextcloud; отображаемые имена игнорируются.

## Комнаты (группы)

- По умолчанию: `channels.nextcloud-talk.groupPolicy = "allowlist"` (доступ по упоминанию).
- Добавьте комнаты в список разрешенных через `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Чтобы не разрешать ни одну комнату, оставьте список разрешенных пустым или задайте `channels.nextcloud-talk.groupPolicy="disabled"`.

## Возможности

| Возможность         | Статус              |
| ------------------- | ------------------- |
| Личные сообщения    | Поддерживаются      |
| Комнаты             | Поддерживаются      |
| Ветки               | Не поддерживаются   |
| Медиа               | Только URL          |
| Реакции             | Поддерживаются      |
| Встроенные команды  | Не поддерживаются   |

## Справочник конфигурации (Nextcloud Talk)

Полная конфигурация: [Configuration](/ru/gateway/configuration)

Параметры провайдера:

- `channels.nextcloud-talk.enabled`: включить/отключить запуск канала.
- `channels.nextcloud-talk.baseUrl`: URL экземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: общий секрет бота.
- `channels.nextcloud-talk.botSecretFile`: путь к обычному файлу с секретом. Символические ссылки отклоняются.
- `channels.nextcloud-talk.apiUser`: пользователь API для поиска комнат (определение личных сообщений).
- `channels.nextcloud-talk.apiPassword`: пароль API/приложения для поиска комнат.
- `channels.nextcloud-talk.apiPasswordFile`: путь к файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт слушателя Webhook (по умолчанию: 8788).
- `channels.nextcloud-talk.webhookHost`: хост Webhook (по умолчанию: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: путь Webhook (по умолчанию: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: внешне доступный URL Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: список разрешенных для личных сообщений (идентификаторы пользователей). `open` требует `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: список разрешенных для групп (идентификаторы пользователей).
- `channels.nextcloud-talk.rooms`: настройки и список разрешенных для отдельных комнат.
- Статические группы доступа отправителей можно указывать в `allowFrom` и `groupAllowFrom` через `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: лимит истории группы (0 отключает).
- `channels.nextcloud-talk.dmHistoryLimit`: лимит истории личных сообщений (0 отключает).
- `channels.nextcloud-talk.dms`: переопределения для отдельных личных сообщений (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: размер исходящего фрагмента текста (символы).
- `channels.nextcloud-talk.chunkMode`: `length` (по умолчанию) или `newline` для разделения по пустым строкам (границам абзацев) перед разбиением по длине.
- `channels.nextcloud-talk.blockStreaming`: отключить потоковую передачу блоков для этого канала.
- `channels.nextcloud-talk.blockStreamingCoalesce`: настройка объединения потоковой передачи блоков.
- `channels.nextcloud-talk.mediaMaxMb`: лимит входящих медиа (МБ).

## См. также

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация личных сообщений и поток сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и доступ по упоминанию
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сессий для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
