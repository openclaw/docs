---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или plugins в реестре
    - Выбор между CLI-процессами openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для обнаружения, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T15:27:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — это публичный реестр Skills и plugins для OpenClaw.

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

Установите CLI ClawHub, когда нужны рабочие процессы с аутентификацией в реестре, например
публикация или удаление/отмена удаления:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность     | Что хранит                                                        | Типичная команда                             |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Skills          | Версионированные текстовые пакеты с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Code plugins    | Пакеты plugin OpenClaw с метаданными совместимости                | `openclaw plugins install clawhub:<package>` |
| Bundle plugins  | Упакованные пакеты plugin для дистрибутива OpenClaw               | `clawhub package publish <source>`           |

ClawHub отслеживает semver-версии, теги вроде `latest`, журналы изменений, файлы,
загрузки, избранное и сводки сканирования безопасности. Публичные страницы показывают текущее состояние реестра,
чтобы пользователи могли проверить skill или plugin перед установкой.

## Встроенные потоки OpenClaw

Встроенные команды OpenClaw устанавливают в активное рабочее пространство OpenClaw и сохраняют
метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка plugin должна разрешаться через ClawHub.
Краткие npm-безопасные спецификации plugin могут разрешаться через npm во время переходов запуска, а
`npm:<package>` остается только для npm, когда источник должен быть указан явно.

Установки plugin проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
до запуска установки архива. Когда версия пакета публикует артефакт
ClawPack, OpenClaw предпочитает точный загруженный npm-pack `.tgz`, проверяет
заголовок дайджеста ClawHub и загруженные байты, а также записывает метаданные артефакта для
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

В CLI также есть команды установки/обновления skills для прямых рабочих процессов с реестром:

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

- `--slug <slug>`: имя опубликованного URL skill.
- `--name <name>`: отображаемое имя.
- `--version <version>`: semver-версия.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте plugins из локальной папки, `owner/repo`, `owner/repo@ref` или GitHub
URL:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы построить точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Code plugins должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [Формат skill](/clawhub/skill-format) для метаданных skill.

## Безопасность и модерация

ClawHub открыт по умолчанию: загружать может кто угодно, но для публикации требуется учетная запись GitHub,
достаточно старая, чтобы пройти проверку загрузки. Публичные страницы подробностей суммируют
последнее состояние сканирования перед установкой или скачиванием.

ClawHub выполняет автоматические проверки опубликованных skills и выпусков plugin. Выпуски,
удержанные сканированием или заблокированные, могут исчезать из публичного каталога и поверхностей установки,
оставаясь видимыми для своего владельца в `/dashboard`.

Пользователи, вошедшие в систему, могут сообщать о skills и пакетах. Модераторы могут рассматривать жалобы,
скрывать или восстанавливать контент и блокировать нарушающие аккаунты. См.
[Безопасность](/ru/clawhub/security),
[Аудиты безопасности](/clawhub/security-audits),
[Модерация и безопасность аккаунта](/clawhub/moderation) и
[Допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о политиках и применении правил.

## Телеметрия и окружение

Когда вы запускаете `clawhub install`, находясь в системе, CLI может отправить best-effort
событие установки, чтобы ClawHub мог вычислять агрегированное количество установок. Отключите это с помощью:

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
[Устранение неполадок](/ru/clawhub/troubleshooting) для более подробных справочных материалов.
