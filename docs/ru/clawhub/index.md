---
read_when:
    - Объяснение того, что такое ClawHub
    - Поиск, установка или обновление Skills либо плагинов
    - Публикация навыков или плагинов в реестре
    - Выбор между сценариями работы CLI OpenClaw и ClawHub
sidebarTitle: ClawHub
summary: 'Обзор публичного ClawHub: поиск, установка, публикация, безопасность и CLI clawhub.'
title: ClawHub
x-i18n:
    generated_at: "2026-07-13T19:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр Skills и плагинов для OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления Skills, а также для установки плагинов из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и процессов удаления/восстановления.

Сайт: [clawhub.ai](https://clawhub.ai)

## Быстрый старт

Ищите и устанавливайте Skills с помощью OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Ищите и устанавливайте плагины с помощью OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установите CLI ClawHub, если вам нужны процессы с аутентификацией в реестре, например публикация, удаление или восстановление:

```bash
npm i -g clawhub
# или
pnpm add -g clawhub
```

## Что размещается в ClawHub

| Тип            | Что хранится                                                  | Типичная команда                            |
| -------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Skills         | Версионируемые текстовые пакеты с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Плагины кода   | Пакеты плагинов OpenClaw с метаданными совместимости          | `openclaw plugins install clawhub:<package>` |
| Плагины-пакеты | Упакованные комплекты плагинов для распространения OpenClaw   | `clawhub package publish <source>`           |

ClawHub отслеживает версии semver, теги, такие как `latest`, журналы изменений, файлы, загрузки, звёзды и сводки проверок безопасности. На публичных страницах отображается текущее состояние реестра, чтобы пользователи могли изучить Skill или плагин перед установкой.

## Встроенные процессы OpenClaw

Встроенные команды OpenClaw выполняют установку в активное рабочее пространство OpenClaw и сохраняют метаданные источника, чтобы последующие команды обновления могли продолжать использовать ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна выполняться через ClawHub.
Простые спецификации плагинов, допустимые для npm, во время перехода при запуске могут разрешаться через npm, а `npm:<package>` используется только с npm, когда источник необходимо указать явно.

При установке плагинов заявленная совместимость `pluginApi` и `minGatewayVersion` проверяется до начала установки архива. Если для версии пакета опубликован артефакт ClawPack, OpenClaw предпочитает точно загруженный npm-pack `.tgz`, проверяет заголовок дайджеста ClawHub и загруженные байты, а затем сохраняет метаданные артефакта для последующих обновлений.

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

CLI также предоставляет команды установки и обновления Skills для прямой работы с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают Skills в `./skills` в текущем рабочем каталоге и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте Skills из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространённые параметры публикации:

- `--slug <slug>`: имя в URL опубликованного Skill.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги, разделённые запятыми; значение по умолчанию — `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или по URL GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы сформировать точный план публикации без загрузки, и `--json` для вывода, удобного для CI.

Плагины кода должны содержать обязательные метаданные совместимости с OpenClaw в `package.json`, включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`. Полный справочник команд приведён в разделе [CLI](/ru/clawhub/cli), а метаданные Skills — в разделе [Формат Skill](/clawhub/skill-format).

## Безопасность и модерация

По умолчанию ClawHub открыт: загрузить материалы может любой пользователь, но для публикации требуется учётная запись GitHub, возраст которой достаточен для прохождения ограничения на загрузку. Перед установкой или скачиванием на публичных страницах сведений отображается сводка последнего состояния проверки.

ClawHub выполняет автоматизированные проверки опубликованных Skills и выпусков плагинов. Выпуски, задержанные проверкой или заблокированные, могут исчезнуть из публичного каталога и интерфейсов установки, но оставаться видимыми владельцу в `/dashboard`.

Авторизованные пользователи могут сообщать о Skills и пакетах. Модераторы могут рассматривать жалобы, скрывать или восстанавливать содержимое и блокировать нарушающие правила учётные записи. Подробности о правилах и их применении см. в разделах [Безопасность](/clawhub/security), [Аудиты безопасности](/ru/clawhub/security-audits), [Модерация и безопасность учётной записи](/clawhub/moderation) и [Допустимое использование](/clawhub/acceptable-usage).

## Телеметрия и окружение

Если вы выполняете `clawhub install` после входа в систему, CLI может по возможности отправить событие установки, чтобы ClawHub мог вычислять совокупное количество установок. Чтобы отключить это, выполните:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Полезные переопределения переменных окружения:

| Переменная                    | Действие                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `CLAWHUB_SITE`                | Переопределяет URL сайта, используемый для входа через браузер. |
| `CLAWHUB_REGISTRY`            | Переопределяет URL API реестра.                             |
| `CLAWHUB_CONFIG_PATH`         | Переопределяет место хранения токена и конфигурации CLI.    |
| `CLAWHUB_WORKDIR`             | Переопределяет рабочий каталог по умолчанию.                |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключает телеметрию установки.                             |

Дополнительные справочные материалы см. в разделах [Телеметрия](/ru/clawhub/telemetry), [HTTP API](/clawhub/http-api) и [Устранение неполадок](/clawhub/troubleshooting).
