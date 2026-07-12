---
read_when:
    - Объяснение того, что такое ClawHub
    - Поиск, установка или обновление Skills или плагинов
    - Публикация Skills или плагинов в реестре
    - Выбор между сценариями CLI openclaw и clawhub
sidebarTitle: ClawHub
summary: 'Общедоступный обзор ClawHub: поиск, установка, публикация, безопасность и CLI clawhub.'
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T11:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр Skills и плагинов OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления Skills, а также для установки плагинов из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и операций удаления и восстановления.

Сайт: [clawhub.ai](https://clawhub.ai)

## Быстрый старт

Поиск и установка Skills с помощью OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Поиск и установка плагинов с помощью OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установите CLI ClawHub, если вам нужны рабочие процессы с аутентификацией в реестре, например публикация, удаление или восстановление:

```bash
npm i -g clawhub
# или
pnpm add -g clawhub
```

## Что размещается в ClawHub

| Тип              | Что хранится                                                    | Типичная команда                             |
| ---------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Skills           | Версионируемые текстовые пакеты с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Плагины с кодом  | Пакеты плагинов OpenClaw с метаданными совместимости            | `openclaw plugins install clawhub:<package>` |
| Пакетные плагины | Упакованные наборы плагинов для распространения через OpenClaw   | `clawhub package publish <source>`           |

ClawHub отслеживает версии semver, теги, например `latest`, журналы изменений, файлы, скачивания, отметки «звезда» и сводки результатов сканирования безопасности. На общедоступных страницах отображается текущее состояние реестра, чтобы пользователи могли проверить Skill или плагин перед установкой.

## Встроенные рабочие процессы OpenClaw

Встроенные команды OpenClaw устанавливают компоненты в активное рабочее пространство OpenClaw и сохраняют метаданные источника, чтобы последующие команды обновления продолжали использовать ClawHub.

Используйте `clawhub:<package>`, если установка плагина должна выполняться через ClawHub. Спецификации плагинов без префикса, допустимые для npm, могут разрешаться через npm в переходный период запуска, а `npm:<package>` явно ограничивает источник только npm.

Перед установкой архива проверяется совместимость плагина по заявленным значениям `pluginApi` и `minGatewayVersion`. Если версия пакета публикует артефакт ClawPack, OpenClaw предпочитает точный загруженный архив npm-pack `.tgz`, проверяет заголовок дайджеста ClawHub и загруженные байты, а затем записывает метаданные артефакта для последующих обновлений.

## CLI ClawHub

CLI ClawHub предназначен для работы с аутентификацией в реестре:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI также предоставляет команды установки и обновления Skills для непосредственной работы с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают Skills в каталог `./skills` относительно текущего рабочего каталога и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикация Skills из локального каталога, содержащего `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространённые параметры публикации:

- `--slug <slug>`: имя Skill в URL после публикации.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую; по умолчанию — `latest`.

Публикация плагинов из локального каталога, `owner/repo`, `owner/repo@ref` или URL GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы сформировать точный план публикации без загрузки, и `--json` для вывода, удобного для CI.

Плагины с кодом должны содержать обязательные метаданные совместимости с OpenClaw в `package.json`, включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`. Полный справочник команд см. в разделе [CLI](/ru/clawhub/cli), а сведения о метаданных Skills — в разделе [Формат Skill](/clawhub/skill-format).

## Безопасность и модерация

По умолчанию ClawHub открыт: загружать материалы может любой пользователь, однако для публикации требуется учётная запись GitHub, возраст которой достаточен для прохождения проверки загрузки. На общедоступных страницах с подробной информацией перед установкой или скачиванием отображается сводка последнего состояния сканирования.

ClawHub выполняет автоматические проверки опубликованных Skills и выпусков плагинов. Выпуски, задержанные проверкой или заблокированные, могут исчезнуть из общедоступного каталога и интерфейсов установки, но оставаться видимыми владельцу в `/dashboard`.

Авторизованные пользователи могут сообщать о Skills и пакетах. Модераторы могут рассматривать жалобы, скрывать или восстанавливать содержимое и блокировать учётные записи нарушителей. Подробности о правилах и мерах контроля см. в разделах [Безопасность](/clawhub/security), [Аудиты безопасности](/ru/clawhub/security-audits), [Модерация и безопасность учётных записей](/clawhub/moderation) и [Допустимое использование](/clawhub/acceptable-usage).

## Телеметрия и окружение

Когда вы выполняете `clawhub install` после входа в систему, CLI может по возможности отправить событие установки, чтобы ClawHub мог подсчитывать совокупное количество установок. Чтобы отключить это, выполните:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Полезные переопределения переменных окружения:

| Переменная                    | Действие                                                       |
| ----------------------------- | -------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Переопределяет URL сайта, используемый для входа через браузер. |
| `CLAWHUB_REGISTRY`            | Переопределяет URL API реестра.                                 |
| `CLAWHUB_CONFIG_PATH`         | Переопределяет расположение состояния токена и конфигурации CLI. |
| `CLAWHUB_WORKDIR`             | Переопределяет рабочий каталог по умолчанию.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключает телеметрию установок.                                 |

Дополнительные справочные сведения см. в разделах [Телеметрия](/ru/clawhub/telemetry), [HTTP API](/clawhub/http-api) и [Устранение неполадок](/clawhub/troubleshooting).
