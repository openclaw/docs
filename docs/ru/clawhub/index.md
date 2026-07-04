---
read_when:
    - Объяснение того, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или Plugin в реестре
    - Выбор между потоками CLI openclaw и clawhub
sidebarTitle: ClawHub
summary: Общий обзор ClawHub для обнаружения, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:38:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — публичный реестр Skills и плагинов OpenClaw.

- Используйте нативные команды `openclaw` для поиска, установки и обновления навыков, а также для установки плагинов из ClawHub.
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

Установите ClawHub CLI, если нужны рабочие процессы с аутентификацией в реестре,
например публикация или удаление/восстановление:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность    | Что хранит                                                    | Типичная команда                             |
| -------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills         | Версионированные текстовые наборы с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Кодовые плагины | Пакеты плагинов OpenClaw с метаданными совместимости          | `openclaw plugins install clawhub:<package>` |
| Пакетные плагины | Упакованные наборы плагинов для дистрибуции OpenClaw         | `clawhub package publish <source>`           |

ClawHub отслеживает версии semver, теги вроде `latest`, changelog, файлы,
загрузки, звезды и сводки сканирования безопасности. Публичные страницы показывают текущее
состояние реестра, чтобы пользователи могли изучить навык или плагин перед установкой.

## Нативные потоки OpenClaw

Нативные команды OpenClaw устанавливают в активное рабочее пространство OpenClaw и сохраняют
метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна разрешаться через ClawHub.
Плагин-спецификации, безопасные для npm и без префикса, могут разрешаться через npm во время переходов запуска, а
`npm:<package>` остается только npm, когда источник должен быть явным.

Установки плагинов проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
до запуска установки архива. Когда версия пакета публикует артефакт
ClawPack, OpenClaw предпочитает точный загруженный npm-pack `.tgz`, проверяет
заголовок дайджеста ClawHub и загруженные байты, а также записывает метаданные артефакта для
последующих обновлений.

## ClawHub CLI

ClawHub CLI предназначен для работы с аутентификацией в реестре:

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

CLI также имеет команды установки/обновления навыков для прямых рабочих процессов с реестром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Эти команды устанавливают навыки в `./skills` в текущем рабочем каталоге
и записывают установленные версии в `.clawhub/lock.json`.

## Публикация

Публикуйте навыки из локальной папки, содержащей `SKILL.md`:

```bash
clawhub skill publish <path>
```

Распространенные параметры публикации:

- `--slug <slug>`: имя URL опубликованного навыка.
- `--name <name>`: отображаемое имя.
- `--version <version>`: версия semver.
- `--changelog <text>`: текст changelog.
- `--tags <tags>`: теги через запятую, по умолчанию `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или URL
GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы собрать точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Кодовые плагины должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [Формат навыка](/clawhub/skill-format) для метаданных навыков.

## Безопасность и модерация

ClawHub по умолчанию открыт: любой может загружать, но для публикации требуется аккаунт GitHub
достаточно старый, чтобы пройти шлюз загрузки. Публичные страницы с деталями суммируют
последнее состояние сканирования перед установкой или скачиванием.

ClawHub выполняет автоматические проверки опубликованных навыков и релизов плагинов. Релизы,
удержанные сканированием или заблокированные, могут исчезнуть из публичного каталога и поверхностей
установки, оставаясь видимыми для своего владельца в `/dashboard`.

Пользователи, выполнившие вход, могут жаловаться на навыки и пакеты. Модераторы могут рассматривать жалобы,
скрывать или восстанавливать контент и блокировать недобросовестные аккаунты. См.
[Безопасность](/ru/clawhub/security),
[Аудиты безопасности](/clawhub/security-audits),
[Модерация и безопасность аккаунта](/clawhub/moderation) и
[Допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о политике и мерах применения.

## Телеметрия и окружение

Когда вы запускаете `clawhub install` после входа, CLI может отправить best-effort
событие установки, чтобы ClawHub мог вычислять агрегированные счетчики установок. Отключите это с помощью:

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | Отключить телеметрию установок.                   |

См. [Телеметрия](/clawhub/telemetry), [HTTP API](/clawhub/http-api) и
[Устранение неполадок](/ru/clawhub/troubleshooting) для более глубоких справочных материалов.
