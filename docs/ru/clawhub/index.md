---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или plugins в реестр
    - Выбор между сценариями CLI openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для обнаружения, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T01:01:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр навыков и плагинов OpenClaw.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления навыков, а также для установки плагинов из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и рабочих процессов удаления/восстановления.

Сайт: [clawhub.ai](https://clawhub.ai)

## Быстрый старт

Ищите и устанавливайте навыки с помощью OpenClaw:

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

Установите CLI ClawHub, когда нужны рабочие процессы с аутентификацией в реестре,
например публикация или удаление/восстановление:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность    | Что хранит                                                   | Типичная команда                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версионированные текстовые наборы с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Кодовые плагины | Пакеты плагинов OpenClaw с метаданными совместимости         | `openclaw plugins install clawhub:<package>` |
| Пакетные плагины | Упакованные наборы плагинов для дистрибутива OpenClaw       | `clawhub package publish <source>`           |

ClawHub отслеживает semver-версии, теги, например `latest`, журналы изменений,
файлы, загрузки, звезды и сводки проверок безопасности. Публичные страницы
показывают текущее состояние реестра, чтобы пользователи могли изучить навык или
плагин перед установкой.

## Встроенные потоки OpenClaw

Встроенные команды OpenClaw устанавливают в активное рабочее пространство
OpenClaw и сохраняют метаданные источника, чтобы последующие команды обновления
могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна разрешаться через
ClawHub. Простые npm-безопасные спецификации плагинов могут разрешаться через npm
во время переходов запуска, а `npm:<package>` остается только npm-источником,
когда источник должен быть указан явно.

Установки плагинов проверяют заявленную совместимость `pluginApi` и
`minGatewayVersion` до запуска установки архива. Когда версия пакета публикует
артефакт ClawPack, OpenClaw предпочитает точно загруженный npm-pack `.tgz`,
проверяет заголовок дайджеста ClawHub и загруженные байты, а также записывает
метаданные артефакта для последующих обновлений.

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

В CLI также есть команды установки и обновления навыков для прямых рабочих
процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают навыки в `./skills` в текущем рабочем каталоге и
записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте навыки из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя опубликованного навыка в URL.
- `--name <name>`: отображаемое имя.
- `--version <version>`: semver-версия.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или URL
GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы построить точный план публикации без загрузки, и
`--json` для вывода, удобного для CI.

Кодовые плагины должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [Формат навыка](/clawhub/skill-format) для метаданных навыков.

## Безопасность и модерация

ClawHub открыт по умолчанию: загружать может кто угодно, но для публикации
требуется учетная запись GitHub, достаточно старая для прохождения шлюза
загрузки. Публичные страницы сведений показывают сводку последнего состояния
проверки перед установкой или загрузкой.

ClawHub выполняет автоматические проверки опубликованных навыков и выпусков
плагинов. Выпуски, удержанные проверкой или заблокированные, могут исчезнуть из
публичного каталога и поверхностей установки, оставаясь видимыми для владельца в
`/dashboard`.

Пользователи, вошедшие в систему, могут сообщать о навыках и пакетах.
Модераторы могут просматривать жалобы, скрывать или восстанавливать содержимое и
блокировать нарушающие правила учетные записи. См.
[Безопасность](/ru/clawhub/security),
[Аудиты безопасности](/clawhub/security-audits),
[Модерация и безопасность учетной записи](/clawhub/moderation) и
[Допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о
политиках и применении правил.

## Телеметрия и окружение

Когда вы запускаете `clawhub install`, будучи вошедшим в систему, CLI может
отправить best-effort-событие установки, чтобы ClawHub мог вычислять совокупное
количество установок. Отключите это так:

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключает телеметрию установок.                   |

См. [Телеметрия](/clawhub/telemetry), [HTTP API](/clawhub/http-api) и
[Устранение неполадок](/ru/clawhub/troubleshooting) для более подробных справочных
материалов.
