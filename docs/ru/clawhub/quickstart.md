---
read_when:
    - Первое использование ClawHub
    - Установка skill или plugin из реестра
    - Публикация в ClawHub
summary: 'Начните использовать ClawHub: находите, устанавливайте, обновляйте и публикуйте Skills или plugins.'
x-i18n:
    generated_at: "2026-07-01T15:29:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Быстрый старт

ClawHub — это реестр для Skills и Plugin OpenClaw.

Используйте OpenClaw, когда устанавливаете что-либо в OpenClaw. Используйте CLI `clawhub`,
когда выполняете вход, публикуете, управляете собственными записями или используете
рабочие процессы, специфичные для реестра.

## Найти и установить skill

Поиск из OpenClaw:

```bash
openclaw skills search "calendar"
```

Установить skill:

```bash
openclaw skills install @openclaw/demo
```

Обновить установленные Skills:

```bash
openclaw skills update --all
```

OpenClaw записывает, откуда поступил skill, чтобы последующие обновления могли продолжать
разрешаться через ClawHub.

## Найти и установить Plugin

Поиск из OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установить Plugin, размещенный в ClawHub, с явным источником ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Обновить установленные Plugin:

```bash
openclaw plugins update --all
```

Используйте префикс `clawhub:`, когда хотите, чтобы OpenClaw разрешал пакет через
ClawHub, а не через npm или другой источник.

## Войти для публикации

Установите CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Войдите через GitHub:

```bash
clawhub login
clawhub whoami
```

Среды без графического интерфейса могут использовать API-токен из веб-интерфейса ClawHub:

```bash
clawhub login --token clh_...
```

## Опубликовать skill

Skill — это папка с обязательным файлом `SKILL.md` и необязательными вспомогательными
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускает неизмененное содержимое. Новые Skills начинаются с версии `1.0.0`; последующие изменения
автоматически публикуют следующую patch-версию. Используйте `--dry-run` для предварительного просмотра или
`--version`, чтобы выбрать явную версию.

Перед публикацией проверьте метаданные в `SKILL.md`. Объявите требуемые
переменные окружения, инструменты и разрешения, чтобы пользователи могли понять, что требуется
skill до его установки. См. [Формат skill](/ru/clawhub/skill-format).

Для репозиториев, содержащих несколько Skills, переиспользуемый рабочий процесс GitHub вызывает
`skill publish` для каждой непосредственной папки skill в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опубликовать Plugin

Опубликуйте Plugin из локальной папки, репозитория GitHub, GitHub ref или
существующего архива:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Сначала используйте `--dry-run`, чтобы предварительно просмотреть разрешенные метаданные пакета, поля совместимости,
атрибуцию источника и план загрузки без публикации.

Code plugins должны включать метаданные совместимости OpenClaw в `package.json`,
включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`.

## Проверить перед установкой

Перед установкой используйте веб-страницу ClawHub или команды детализации CLI, чтобы проверить
метаданные, ссылки на исходный код, версии, журналы изменений и статус сканирования:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публичные записи показывают последнее состояние сканирования. Релизы, удержанные или заблокированные
модерацией, могут быть скрыты из поиска и поверхностей установки до разрешения ситуации.
