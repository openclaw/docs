---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или plugins в реестре
    - Выбор между CLI-процессами openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для поиска, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T08:35:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр для Skills и плагинов OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления Skills, а также для установки плагинов из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и процессов удаления/восстановления.

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

Установите CLI ClawHub, когда нужны процессы с аутентификацией в реестре, такие как
публикация или удаление/восстановление:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность    | Что хранит                                                    | Типичная команда                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версионированные текстовые наборы с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Кодовые плагины | Пакеты плагинов OpenClaw с метаданными совместимости          | `openclaw plugins install clawhub:<package>` |
| Плагины-бандлы | Упакованные бандлы плагинов для дистрибутива OpenClaw         | `clawhub package publish <source>`           |

ClawHub отслеживает semver-версии, теги вроде `latest`, журналы изменений, файлы,
загрузки, звезды и сводки проверок безопасности. Публичные страницы показывают текущее
состояние реестра, чтобы пользователи могли изучить skill или плагин перед установкой.

## Встроенные процессы OpenClaw

Встроенные команды OpenClaw устанавливают в активное рабочее пространство OpenClaw и сохраняют
метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна разрешаться через ClawHub.
Простые npm-безопасные спецификации плагинов могут разрешаться через npm во время переходов запуска, а
`npm:<package>` остается только для npm, когда источник должен быть задан явно.

Установки плагинов проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
перед установкой архива. Когда версия пакета публикует артефакт
ClawPack, OpenClaw предпочитает точно загруженный npm-pack `.tgz`, проверяет
заголовок digest ClawHub и скачанные байты, а также записывает метаданные артефакта для
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

В CLI также есть команды установки/обновления Skills для прямых процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают Skills в `./skills` внутри текущего рабочего каталога
и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте Skills из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя опубликованного skill в URL.
- `--name <name>`: отображаемое имя.
- `--version <version>`: semver-версия.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или GitHub
URL:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы собрать точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Кодовые плагины должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [Формат skill](/clawhub/skill-format) для метаданных skill.

## Безопасность и модерация

ClawHub по умолчанию открыт: загружать может любой, но для публикации требуется аккаунт GitHub,
достаточно старый, чтобы пройти порог загрузки. Публичные страницы деталей показывают сводку
последнего состояния проверки перед установкой или скачиванием.

ClawHub запускает автоматические проверки опубликованных Skills и релизов плагинов. Релизы,
удержанные проверкой или заблокированные, могут исчезнуть из публичного каталога и поверхностей
установки, оставаясь видимыми для владельца в `/dashboard`.

Вошедшие в систему пользователи могут жаловаться на Skills и пакеты. Модераторы могут рассматривать жалобы,
скрывать или восстанавливать контент и блокировать аккаунты, нарушающие правила. См.
[Безопасность](/ru/clawhub/security),
[Аудиты безопасности](/clawhub/security-audits),
[Модерация и безопасность аккаунта](/clawhub/moderation) и
[Допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о политиках и применении правил.

## Телеметрия и окружение

Когда вы запускаете `clawhub install`, будучи вошедшим в систему, CLI может отправить best-effort
событие установки, чтобы ClawHub мог рассчитывать агрегированное число установок. Отключите это так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Полезные переопределения окружения:

| Переменная                    | Эффект                                             |
| ----------------------------- | -------------------------------------------------- |
| `CLAWHUB_SITE`                | Переопределяет URL сайта, используемый для входа через браузер. |
| `CLAWHUB_REGISTRY`            | Переопределяет URL API реестра.                    |
| `CLAWHUB_CONFIG_PATH`         | Переопределяет место, где CLI хранит состояние токена/конфигурации. |
| `CLAWHUB_WORKDIR`             | Переопределяет рабочий каталог по умолчанию.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключает телеметрию установок.                    |

См. [Телеметрия](/clawhub/telemetry), [HTTP API](/clawhub/http-api) и
[Устранение неполадок](/ru/clawhub/troubleshooting) для более подробных справочных материалов.
