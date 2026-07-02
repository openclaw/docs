---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или Plugin
    - Публикация Skills или plugins в реестре
    - Выбор между CLI-процессами openclaw и clawhub
sidebarTitle: ClawHub
summary: Общедоступный обзор ClawHub для обнаружения, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T17:43:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр навыков OpenClaw и plugins.

- Используйте встроенные команды `openclaw` для поиска, установки и обновления навыков, а также для установки plugins из ClawHub.
- Используйте отдельный CLI `clawhub` для аутентификации в реестре, публикации и рабочих процессов удаления/восстановления.

Сайт: [clawhub.ai](https://clawhub.ai)

## Быстрый старт

Ищите и устанавливайте навыки с помощью OpenClaw:

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

Установите CLI ClawHub, когда нужны рабочие процессы с аутентификацией в реестре, такие как публикация или удаление/восстановление:

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

ClawHub отслеживает версии semver, теги, такие как `latest`, журналы изменений, файлы, загрузки, звезды и сводки проверок безопасности. Публичные страницы показывают текущее состояние реестра, чтобы пользователи могли проверить навык или plugin перед установкой.

## Встроенные рабочие процессы OpenClaw

Встроенные команды OpenClaw устанавливают в активное рабочее пространство OpenClaw и сохраняют метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка plugin должна разрешаться через ClawHub.
Простые npm-безопасные спецификации plugin могут разрешаться через npm во время переходов запуска, а `npm:<package>` остается только npm, когда источник должен быть явным.

Установки plugin проверяют заявленную совместимость `pluginApi` и `minGatewayVersion` перед установкой архива. Когда версия пакета публикует артефакт ClawPack, OpenClaw предпочитает точный загруженный npm-pack `.tgz`, проверяет заголовок дайджеста ClawHub и загруженные байты, а также записывает метаданные артефакта для последующих обновлений.

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

CLI также содержит команды установки/обновления навыков для прямых рабочих процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают навыки в `./skills` в текущем рабочем каталоге и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте навыки из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя URL опубликованного навыка.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте plugins из локальной папки, `owner/repo`, `owner/repo@ref` или URL GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы собрать точный план публикации без загрузки, и `--json` для вывода, удобного для CI.

Code plugins должны включать обязательные метаданные совместимости OpenClaw в `package.json`, включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника команд и [Формат навыка](/clawhub/skill-format) для метаданных навыков.

## Безопасность и модерация

ClawHub по умолчанию открыт: загрузить может любой, но для публикации требуется учетная запись GitHub, достаточно старая для прохождения шлюза загрузки. Публичные страницы сведений показывают сводку последнего состояния проверки перед установкой или загрузкой.

ClawHub выполняет автоматические проверки опубликованных навыков и релизов plugin. Релизы, удержанные проверкой или заблокированные, могут исчезнуть из публичного каталога и поверхностей установки, оставаясь видимыми для их владельца в `/dashboard`.

Авторизованные пользователи могут сообщать о навыках и пакетах. Модераторы могут рассматривать жалобы, скрывать или восстанавливать контент и блокировать недобросовестные учетные записи. См. [Безопасность](/ru/clawhub/security), [Аудиты безопасности](/clawhub/security-audits), [Модерация и безопасность учетной записи](/clawhub/moderation) и [Допустимое использование](/clawhub/acceptable-usage) для подробностей о политиках и правоприменении.

## Телеметрия и окружение

Когда вы запускаете `clawhub install`, будучи авторизованным, CLI может отправить событие установки по принципу best-effort, чтобы ClawHub мог рассчитывать агрегированное количество установок. Отключите это так:

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

См. [Телеметрия](/clawhub/telemetry), [HTTP API](/clawhub/http-api) и [Устранение неполадок](/ru/clawhub/troubleshooting) для более подробных справочных материалов.
