---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или Plugins в реестре
    - Выбор между CLI-сценариями openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для поиска, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T18:11:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр Skills и плагинов OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления Skills, а также для установки плагинов из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и рабочих процессов удаления/отмены удаления.

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

Установите CLI ClawHub, если вам нужны рабочие процессы с аутентификацией в реестре, например
публикация или удаление/отмена удаления:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность     | Что хранит                                                   | Типичная команда                            |
| --------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Skills          | Версионированные текстовые наборы с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Кодовые плагины | Пакеты плагинов OpenClaw с метаданными совместимости         | `openclaw plugins install clawhub:<package>` |
| Пакеты плагинов | Упакованные наборы плагинов для дистрибутива OpenClaw        | `clawhub package publish <source>`           |

ClawHub отслеживает версии semver, теги вроде `latest`, журналы изменений, файлы,
скачивания, звезды и сводки проверок безопасности. Публичные страницы показывают текущее
состояние реестра, чтобы пользователи могли изучить Skill или плагин перед установкой.

## Встроенные потоки OpenClaw

Встроенные команды OpenClaw устанавливают в активное рабочее пространство OpenClaw и сохраняют
метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна разрешаться через ClawHub.
Простые npm-безопасные спецификации плагинов могут разрешаться через npm во время переходов при запуске,
а `npm:<package>` остается только npm, когда источник должен быть явным.

Установки плагинов проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
перед установкой архива. Когда версия пакета публикует артефакт
ClawPack, OpenClaw предпочитает точно загруженный npm-pack `.tgz`, проверяет
заголовок дайджеста ClawHub и скачанные байты, а также записывает метаданные артефакта для
последующих обновлений.

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

В CLI также есть команды установки/обновления Skills для прямых рабочих процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают Skills в `./skills` в текущем рабочем каталоге
и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте Skills из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя опубликованного URL Skill.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или GitHub
URL:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы построить точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Кодовые плагины должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [Формат Skill](/clawhub/skill-format) для метаданных Skill.

## Безопасность и модерация

ClawHub по умолчанию открыт: загружать может кто угодно, но для публикации требуется учетная запись GitHub,
достаточно старая, чтобы пройти шлюз загрузки. Публичные страницы подробностей обобщают
последнее состояние проверки перед установкой или скачиванием.

ClawHub выполняет автоматические проверки опубликованных Skills и выпусков плагинов. Удержанные проверкой
или заблокированные выпуски могут исчезать из публичного каталога и поверхностей установки, при этом
оставаясь видимыми для владельца в `/dashboard`.

Пользователи, вошедшие в систему, могут сообщать о Skills и пакетах. Модераторы могут рассматривать жалобы,
скрывать или восстанавливать контент и блокировать злоупотребляющие учетные записи. См.
[Безопасность](/ru/clawhub/security),
[Аудиты безопасности](/clawhub/security-audits),
[Модерация и безопасность учетных записей](/clawhub/moderation) и
[Допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о политиках и правоприменении.

## Телеметрия и окружение

Когда вы запускаете `clawhub install` после входа в систему, CLI может отправить по возможности
событие установки, чтобы ClawHub мог вычислять агрегированное количество установок. Отключите это так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Полезные переопределения окружения:

| Переменная                    | Эффект                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Переопределить URL сайта, используемый для входа через браузер. |
| `CLAWHUB_REGISTRY`            | Переопределить URL API реестра.                   |
| `CLAWHUB_CONFIG_PATH`         | Переопределить место, где CLI хранит состояние токена/конфигурации. |
| `CLAWHUB_WORKDIR`             | Переопределить рабочий каталог по умолчанию.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключить телеметрию установки.                   |

См. [Телеметрия](/clawhub/telemetry), [HTTP API](/clawhub/http-api) и
[Устранение неполадок](/ru/clawhub/troubleshooting) для более подробных справочных материалов.
