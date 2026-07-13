---
read_when:
    - Работа над функциями канала Nextcloud Talk
summary: Статус поддержки, возможности и настройка Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-13T17:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk — это загружаемый плагин канала (`@openclaw/nextcloud-talk`), который подключает OpenClaw к самостоятельно размещённому экземпляру Nextcloud через webhook-бота Talk. Поддерживаются личные сообщения, комнаты, реакции и сообщения с Markdown; медиафайлы отправляются в виде URL.

## Установка

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Используйте спецификацию пакета без версии, чтобы получать текущий официальный тег выпуска. Закрепляйте точную версию только в том случае, если вам нужна воспроизводимая установка.

Из локальной рабочей копии (для процессов разработки):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

После установки перезапустите Gateway. Подробнее: [Плагины](/ru/tools/plugin)

## Быстрая настройка (для начинающих)

1. Установите плагин (см. выше).
2. Создайте бота на сервере Nextcloud:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Сохраните `--feature response`: без него исходящие ответы завершаются ошибкой 401. Исправьте существующего бота с помощью `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Включите бота в настройках целевой комнаты.
4. Настройте OpenClaw:
   - Конфигурация: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Или переменные окружения: `NEXTCLOUD_TALK_BOT_SECRET` (только для учётной записи по умолчанию)

   Настройка через CLI (`--url`/`--token` являются псевдонимами явных полей; `nc-talk` и `nc` работают как псевдонимы канала):

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

5. Перезапустите Gateway (или завершите настройку).

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

- Боты не могут инициировать личные сообщения. Пользователь должен сначала отправить сообщение боту.
- URL webhook должен быть доступен с сервера Nextcloud; задайте `webhookPublicUrl`, если Gateway находится за прокси-сервером. Запросы webhook подписываются с помощью HMAC-SHA256 и секрета бота; запросы с недействительными подписями отклоняются и ограничиваются по частоте.
- API бота не поддерживает загрузку медиафайлов; исходящие медиафайлы добавляются как строка `Attachment: <url>`.
- Полезная нагрузка webhook не различает личные сообщения и комнаты; задайте `apiUser` + `apiPassword`, чтобы включить определение типа комнаты (результаты кэшируются примерно на 5 минут). Без них каждый разговор считается комнатой.
- Исходящие запросы проходят через защиту от SSRF. Для узла Nextcloud в доверенной частной или внутренней сети явно разрешите доступ с помощью `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Если заданы `apiUser`/`apiPassword` и `webhookPublicUrl`, команда `openclaw channels status` проверяет бота и предупреждает об отсутствии функции `response`.

## Управление доступом (личные сообщения)

- По умолчанию: `channels.nextcloud-talk.dmPolicy = "pairing"`. Неизвестные отправители получают код сопряжения.
- Подтвердите с помощью:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Общедоступные личные сообщения: `channels.nextcloud-talk.dmPolicy="open"` вместе с `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` сопоставляет только идентификаторы пользователей Nextcloud (в нижнем регистре); отображаемые имена игнорируются.

## Комнаты (группы)

- По умолчанию: `channels.nextcloud-talk.groupPolicy = "allowlist"` (требуется упоминание).
- Разрешите комнаты с помощью списка `channels.nextcloud-talk.rooms`, ключами которого служат токены комнат; `"*"` задаёт значение по умолчанию с подстановочным знаком:

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

- Ключи для каждой комнаты: `requireMention` (по умолчанию true), `enabled` (false отключает комнату), `allowFrom` (список разрешённых отправителей для комнаты), `tools` (переопределения разрешения и запрета инструментов), `skills` (ограничение загружаемых Skills), `systemPrompt`.
- Чтобы не разрешать ни одной комнаты, оставьте список разрешений пустым или задайте `channels.nextcloud-talk.groupPolicy="disabled"`.

## Возможности

| Функция          | Статус                |
| ---------------- | --------------------- |
| Личные сообщения | Поддерживается         |
| Комнаты          | Поддерживается         |
| Ветки обсуждений | Не поддерживается      |
| Медиафайлы       | Только в виде URL      |
| Реакции          | Поддерживается         |
| Нативные команды | Не поддерживаются      |

## Справочник по конфигурации (Nextcloud Talk)

Полная конфигурация: [Конфигурация](/ru/gateway/configuration)

Параметры провайдера:

- `channels.nextcloud-talk.enabled`: включение или отключение запуска канала.
- `channels.nextcloud-talk.baseUrl`: URL экземпляра Nextcloud.
- `channels.nextcloud-talk.botSecret`: общий секрет бота (строка или ссылка на секрет).
- `channels.nextcloud-talk.botSecretFile`: путь к секрету в обычном файле. Символические ссылки отклоняются.
- `channels.nextcloud-talk.apiUser`: пользователь API для поиска комнат (определения личных сообщений) и проверки состояния.
- `channels.nextcloud-talk.apiPassword`: пароль API или приложения для поиска комнат.
- `channels.nextcloud-talk.apiPasswordFile`: путь к файлу пароля API.
- `channels.nextcloud-talk.webhookPort`: порт прослушивателя webhook (по умолчанию: 8788).
- `channels.nextcloud-talk.webhookHost`: узел webhook (по умолчанию: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: путь webhook (по умолчанию: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook, доступный извне.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию: pairing). Для `open` требуется `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: список разрешённых пользователей для личных сообщений (идентификаторы пользователей).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (по умолчанию: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: список разрешённых отправителей в комнатах (идентификаторы пользователей); если значение не задано, используется `allowFrom`.
- `channels.nextcloud-talk.rooms`: настройки и список разрешений для отдельных комнат (см. выше).
- На статические группы доступа отправителей можно ссылаться из `allowFrom` и `groupAllowFrom` с помощью `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: ограничение истории группы (0 отключает).
- `channels.nextcloud-talk.dmHistoryLimit`: ограничение истории личных сообщений (0 отключает).
- `channels.nextcloud-talk.dms`: переопределения для отдельных личных сообщений с ключами по идентификатору пользователя (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: размер фрагмента исходящего текста в символах (по умолчанию: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (по умолчанию) или `newline` для разделения по пустым строкам (границам абзацев) перед разделением по длине.
- `channels.nextcloud-talk.streaming.block.enabled`: включение или отключение потоковой передачи блоков для этого канала.
- `channels.nextcloud-talk.streaming.block.coalesce`: настройка объединения при потоковой передаче блоков.
- `channels.nextcloud-talk.responsePrefix`: префикс исходящего ответа.
- `channels.nextcloud-talk.markdown.tables`: режим отображения таблиц Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: ограничение размера входящих медиафайлов (МБ).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: разрешение частным или внутренним узлам Nextcloud проходить защиту от SSRF.
- `channels.nextcloud-talk.accounts.<id>`: переопределения для отдельных учётных записей (те же ключи); `defaultAccount` выбирает учётную запись по умолчанию. Переменные окружения `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` применяются только к учётной записи по умолчанию.

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и процесс сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и требование упоминаний
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
