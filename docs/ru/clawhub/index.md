---
read_when:
    - Объяснение, что такое ClawHub
    - Поиск, установка или обновление Skills или plugins
    - Публикация Skills или плагинов в реестре
    - Выбор между CLI-потоками openclaw и clawhub
sidebarTitle: ClawHub
summary: Публичный обзор ClawHub для обнаружения, установки, публикации, безопасности и CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T03:58:15Z"
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

Установите ClawHub CLI, когда нужны рабочие процессы с аутентификацией в реестре, например
публикация или удаление/отмена удаления:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Что размещает ClawHub

| Поверхность    | Что хранит                                                   | Типичная команда                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версионированные текстовые пакеты с `SKILL.md` и вспомогательными файлами | `openclaw skills install @openclaw/demo`     |
| Кодовые плагины | Пакеты плагинов OpenClaw с метаданными совместимости         | `openclaw plugins install clawhub:<package>` |
| Пакетные плагины | Упакованные наборы плагинов для дистрибутива OpenClaw       | `clawhub package publish <source>`           |

ClawHub отслеживает semver-версии, теги вроде `latest`, журналы изменений, файлы,
загрузки, звезды и сводки сканирования безопасности. Публичные страницы показывают текущее
состояние реестра, чтобы пользователи могли проверить Skill или плагин перед установкой.

## Встроенные потоки OpenClaw

Встроенные команды OpenClaw устанавливают в активную рабочую область OpenClaw и сохраняют
метаданные источника, чтобы последующие команды обновления могли оставаться на ClawHub.

Используйте `clawhub:<package>`, когда установка плагина должна разрешаться через ClawHub.
Простые npm-безопасные спецификации плагинов могут разрешаться через npm во время переходных
периодов запуска, а `npm:<package>` остается только npm-источником, когда источник должен быть явным.

Установки плагинов проверяют заявленную совместимость `pluginApi` и `minGatewayVersion`
до установки архива. Когда версия пакета публикует артефакт ClawPack, OpenClaw предпочитает
точно загруженный npm-pack `.tgz`, проверяет заголовок дайджеста ClawHub и загруженные байты,
а также записывает метаданные артефакта для последующих обновлений.

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

- `--slug <slug>`: имя опубликованного Skill в URL.
- `--name <name>`: отображаемое имя.
- `--version <version>`: semver-версия.
- `--changelog <text>`: текст журнала изменений.
- `--tags <tags>`: теги, разделенные запятыми; по умолчанию `latest`.

Публикуйте плагины из локальной папки, `owner/repo`, `owner/repo@ref` или URL GitHub:

```bash
clawhub package publish <source>
```

Используйте `--dry-run`, чтобы собрать точный план публикации без загрузки, и `--json`
для вывода, удобного для CI.

Кодовые плагины должны включать обязательные метаданные совместимости OpenClaw в
`package.json`, включая `openclaw.compat.pluginApi` и
`openclaw.build.openclawVersion`. См. [CLI](/ru/clawhub/cli) для полного справочника
команд и [формат Skill](/clawhub/skill-format) для метаданных Skill.

## Безопасность и модерация

ClawHub по умолчанию открыт: загружать может любой, но для публикации требуется учетная запись GitHub,
достаточно старая, чтобы пройти барьер загрузки. Публичные страницы сведений показывают сводку
последнего состояния сканирования перед установкой или скачиванием.

ClawHub запускает автоматические проверки опубликованных Skills и релизов плагинов. Релизы,
удержанные сканированием или заблокированные, могут исчезнуть из публичного каталога и поверхностей
установки, оставаясь видимыми их владельцу в `/dashboard`.

Пользователи, вошедшие в систему, могут сообщать о Skills и пакетах. Модераторы могут рассматривать
жалобы, скрывать или восстанавливать контент и блокировать нарушающие учетные записи. См.
[Безопасность](/ru/clawhub/security),
[аудиты безопасности](/clawhub/security-audits),
[модерация и безопасность учетной записи](/clawhub/moderation) и
[допустимое использование](/ru/clawhub/acceptable-usage) для подробностей о политиках и правоприменении.

## Телеметрия и окружение

Когда вы запускаете `clawhub install`, будучи вошедшим в систему, CLI может отправить событие
установки по принципу best-effort, чтобы ClawHub мог вычислять агрегированные счетчики установок.
Отключите это так:

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
