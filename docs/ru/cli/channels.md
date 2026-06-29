---
read_when:
    - Вы хотите добавить/удалить аккаунты каналов (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Вы хотите проверить состояние канала или просмотреть последние записи журналов канала
summary: Справочник CLI для `openclaw channels` (учетные записи, состояние, вход/выход, журналы)
title: Каналы
x-i18n:
    generated_at: "2026-06-28T22:42:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Управляйте учетными записями чат-каналов и их состоянием выполнения в Gateway.

Связанные документы:

- Руководства по каналам: [Каналы](/ru/channels)
- Конфигурация Gateway: [Конфигурация](/ru/gateway/configuration)

## Распространенные команды

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` показывает только чат-каналы: по умолчанию настроенные учетные записи, с тегами состояния `installed`, `configured` и `enabled` для каждой учетной записи. Передайте `--all`, чтобы также показать встроенные каналы, для которых еще нет настроенной учетной записи, и устанавливаемые каналы каталога, которых еще нет на диске. Провайдеры аутентификации (OAuth + ключи API) и снимки использования/квот провайдеров моделей здесь больше не выводятся; используйте `openclaw models auth list` для профилей аутентификации провайдеров и `openclaw status` или `openclaw models list` для использования.

## Состояние / возможности / разрешение имен / журналы

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (только с `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` — это live-путь: на доступном gateway он выполняет для каждой учетной записи проверки
`probeAccount` и, при необходимости, `auditAccount`, поэтому вывод может включать состояние транспорта
и результаты проверки, такие как `works`, `probe failed`, `audit ok` или `audit failed`.
Если gateway недоступен, `channels status` откатывается к сводкам только из конфигурации
вместо вывода live-проверки.

Не используйте `openclaw sessions`, Gateway `sessions.list` или инструмент агента
`sessions_list` как сигнал состояния сокета канала. Эти поверхности сообщают
о сохраненных строках бесед, а не о состоянии выполнения провайдера. После перезапуска провайдера Discord
подключенная, но неактивная учетная запись может быть работоспособной, даже если строка сессии Discord
не появится до следующего входящего или исходящего события беседы.

## Добавление / удаление учетных записей

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` показывает флаги для каждого канала (токен, закрытый ключ, токен приложения, пути signal-cli и т. д.).
</Tip>

`channels remove` работает только с установленными/настроенными Plugin каналов. Для устанавливаемых каналов каталога сначала используйте `channels add`.
Для Plugin каналов, поддерживаемых средой выполнения, `channels remove` также просит запущенный Gateway остановить выбранную учетную запись перед обновлением конфигурации, поэтому отключение или удаление учетной записи не оставляет старый слушатель активным до перезапуска.

Распространенные неинтерактивные поверхности добавления включают:

- каналы с bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- поля транспорта Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- поля Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- поля Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- поля Nostr: `--private-key`, `--relay-urls`
- поля Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` для поддерживаемой аутентификации учетной записи по умолчанию через переменные окружения

Если Plugin канала нужно установить во время команды добавления, управляемой флагами, OpenClaw использует источник установки по умолчанию для канала, не открывая интерактивное приглашение установки Plugin.

Когда вы запускаете `openclaw channels add` без флагов, интерактивный мастер может запросить:

- идентификаторы учетных записей для выбранного канала
- необязательные отображаемые имена для этих учетных записей
- `Route these channel accounts to agents now?`

Если подтвердить привязку сейчас, мастер спросит, какой агент должен владеть каждой настроенной учетной записью канала, и запишет привязки маршрутизации на уровне учетных записей.

Позже теми же правилами маршрутизации можно управлять с помощью `openclaw agents bindings`, `openclaw agents bind` и `openclaw agents unbind` (см. [агенты](/ru/cli/agents)).

Когда вы добавляете неосновную учетную запись в канал, который все еще использует одноаккаунтные настройки верхнего уровня, OpenClaw повышает значения верхнего уровня, относящиеся к учетной записи, в карту учетных записей канала перед записью новой учетной записи. Большинство каналов помещают эти значения в `channels.<channel>.accounts.default`, но встроенные каналы вместо этого могут сохранить существующую совпадающую повышенную учетную запись. Текущий пример — Matrix: если одна именованная учетная запись уже существует или `defaultAccount` указывает на существующую именованную учетную запись, повышение сохраняет эту учетную запись вместо создания новой `accounts.default`.

Поведение маршрутизации остается согласованным:

- Существующие привязки только к каналу (без `accountId`) продолжают соответствовать учетной записи по умолчанию.
- `channels add` не создает и не переписывает привязки автоматически в неинтерактивном режиме.
- Интерактивная настройка может дополнительно добавить привязки на уровне учетных записей.

Если ваша конфигурация уже была в смешанном состоянии (именованные учетные записи присутствуют, а одноаккаунтные значения верхнего уровня все еще заданы), запустите `openclaw doctor --fix`, чтобы переместить значения на уровне учетной записи в повышенную учетную запись, выбранную для этого канала. Большинство каналов повышают в `accounts.default`; Matrix вместо этого может сохранить существующую именованную/стандартную цель.

## Вход и выход (интерактивно)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` поддерживает `--verbose`.
- `channels login` и `logout` могут вывести канал, если настроена только одна поддерживаемая цель входа.
- `channels logout` предпочитает live-путь Gateway, когда он доступен, поэтому выход останавливает любой активный слушатель перед очисткой состояния аутентификации канала. Если локальный Gateway недоступен, команда откатывается к локальной очистке аутентификации.
- Запускайте `channels login` из терминала на хосте gateway. Agent `exec` блокирует этот интерактивный поток входа; при наличии из чата следует использовать нативные для канала инструменты входа агента, такие как `whatsapp_login`.

## Устранение неполадок

- Запустите `openclaw status --deep` для широкой проверки.
- Используйте `openclaw doctor` для управляемых исправлений.
- `openclaw channels list` больше не выводит снимки использования/квот провайдеров моделей. Для них используйте `openclaw status` (обзор) или `openclaw models list` (по провайдерам).
- `openclaw channels status` откатывается к сводкам только из конфигурации, когда gateway недоступен. Если учетные данные поддерживаемого канала настроены через SecretRef, но недоступны в текущем пути команды, она сообщает, что учетная запись настроена, с примечаниями о деградации, вместо того чтобы показывать ее как ненастроенную.

## Проверка возможностей

Получите подсказки о возможностях провайдера (intents/scopes, где доступны) плюс статическую поддержку функций:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Примечания:

- `--channel` необязателен; опустите его, чтобы перечислить каждый канал (включая расширения).
- `--account` допустим только с `--channel`.
- `--target` принимает `channel:<id>` или необработанный числовой идентификатор канала и применяется только к Discord. Для голосовых каналов Discord проверка разрешений помечает отсутствующие `ViewChannel`, `Connect`, `Speak`, `SendMessages` и `ReadMessageHistory`.
- Проверки зависят от провайдера: Discord intents + необязательные разрешения канала; области bot + user Slack; флаги бота Telegram + Webhook; версия демона Signal; токен приложения Microsoft Teams + роли/области Graph (с аннотациями, где известно). Каналы без проверок сообщают `Probe: unavailable`.

## Разрешение имен в идентификаторы

Разрешайте имена каналов/пользователей в идентификаторы с помощью каталога провайдера:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Примечания:

- Используйте `--kind user|group|auto`, чтобы принудительно задать тип цели.
- Разрешение предпочитает активные совпадения, когда несколько записей имеют одно и то же имя.
- `channels resolve` доступен только для чтения. Если выбранная учетная запись настроена через SecretRef, но эти учетные данные недоступны в текущем пути команды, команда возвращает деградированные неразрешенные результаты с примечаниями вместо прерывания всего запуска.
- `channels resolve` не устанавливает Plugin каналов. Используйте `channels add --channel <name>` перед разрешением имен для устанавливаемого канала каталога.

## Связанное

- [Справочник CLI](/ru/cli)
- [Обзор каналов](/ru/channels)
