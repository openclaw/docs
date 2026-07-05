---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или Plugin
    - Публикация Skills или Plugin в реестре
    - Выбор между CLI-сценариями openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для поиска, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T07:47:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр Skills и plugins для OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления skills, а также для установки plugins из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и рабочих процессов удаления/отмены удаления.

Сайт: [clawhub.ai](https://clawhub.ai)

## Быстрый старт

Ищите и устанавливайте skills с помощью OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Ищите и устанавливайте plugins с помощью OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установите CLI ClawHub, когда нужны рабочие процессы с аутентификацией в реестре, такие как
публикация или удаление/отмена удаления:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность     | Что хранится                                                   | Типичная команда                            |
| --------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Skills          | Версионированные текстовые пакеты с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Code plugins    | Пакеты plugins OpenClaw с метаданными совместимости            | `openclaw plugins install clawhub:<package>` |
| Bundle plugins  | Упакованные наборы plugins для дистрибутива OpenClaw           | `clawhub package publish <source>`           |

ClawHub отслеживает версии semver, теги вроде `latest`, журналы изменений, файлы,
загрузки, звезды и сводки проверок безопасности. Публичные страницы показывают текущее состояние реестра,
чтобы пользователи могли изучить skill или plugin перед установкой.

## Встроенные потоки OpenClaw

Встроенные команды OpenClaw устанавливают в активную рабочую область OpenClaw и сохраняют
исходные метаданные, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка plugin должна разрешаться через ClawHub.
Обычные npm-безопасные спецификации plugins могут разрешаться через npm во время переходов при запуске, а
`npm:<package>` остается только npm, когда источник должен быть указан явно.

Установки plugins проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
до запуска установки архива. Когда версия пакета публикует артефакт
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

CLI также содержит команды установки/обновления skills для прямых рабочих процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают skills в `./skills` в текущем рабочем каталоге
и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте skills из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя URL опубликованного skill.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте plugins из локальной папки, `owner/repo`, `owner/repo@ref` или GitHub
URL:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы построить точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Code plugins должны включать необходимые метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полной справки по командам
и [Формат Skill](/clawhub/skill-format) для метаданных skills.

## Безопасность и модерация

ClawHub по умолчанию открыт: загружать может любой, но для публикации требуется аккаунт GitHub,
достаточно старый, чтобы пройти шлюз загрузки. Публичные страницы с подробностями резюмируют
последнее состояние проверки перед установкой или скачиванием.

ClawHub выполняет автоматические проверки опубликованных skills и выпусков plugins. Удержанные проверкой
или заблокированные выпуски могут исчезать из публичного каталога и поверхностей установки, при этом
оставаясь видимыми их владельцу в `/dashboard`.

Авторизованные пользователи могут жаловаться на skills и пакеты. Модераторы могут просматривать жалобы,
скрывать или восстанавливать контент и блокировать злоупотребляющие аккаунты. См.
[Безопасность](/clawhub/security),
[Аудиты безопасности](/ru/clawhub/security-audits),
[Модерация и безопасность аккаунта](/clawhub/moderation) и
[Допустимое использование](/clawhub/acceptable-usage) для подробностей о правилах и мерах принуждения.

## Телеметрия и окружение

Когда вы запускаете `clawhub install` после входа в систему, CLI может отправить событие установки по мере возможности,
чтобы ClawHub мог вычислять агрегированные счетчики установок. Отключите это так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Полезные переопределения окружения:

| Переменная                    | Эффект                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Переопределяет URL сайта, используемый для входа через браузер. |
| `CLAWHUB_REGISTRY`            | Переопределяет URL API реестра.                   |
| `CLAWHUB_CONFIG_PATH`         | Переопределяет место, где CLI хранит состояние токена/конфигурации. |
| `CLAWHUB_WORKDIR`             | Переопределяет рабочий каталог по умолчанию.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключает телеметрию установки.                   |

См. [Телеметрия](/ru/clawhub/telemetry), [HTTP API](/clawhub/http-api) и
[Устранение неполадок](/clawhub/troubleshooting) для более подробных справочных материалов.
