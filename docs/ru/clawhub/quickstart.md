---
read_when:
    - Первое использование ClawHub
    - Установка навыка или Plugin из реестра
    - Публикация в ClawHub
summary: 'Начните пользоваться ClawHub: находите, устанавливайте, обновляйте и публикуйте Skills или Plugin.'
x-i18n:
    generated_at: "2026-07-02T14:07:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Быстрый старт

ClawHub — это реестр для Skills и плагинов OpenClaw.

Используйте OpenClaw, когда устанавливаете что-либо в OpenClaw. Используйте CLI `clawhub`,
когда входите в систему, публикуете, управляете собственными листингами или используете
рабочие процессы, специфичные для реестра.

## Найти и установить Skills

Поиск из OpenClaw:

```bash
openclaw skills search "calendar"
```

Установите Skills:

```bash
openclaw skills install @openclaw/demo
```

Обновите установленные Skills:

```bash
openclaw skills update --all
```

OpenClaw записывает, откуда были получены Skills, чтобы последующие обновления могли
продолжать разрешаться через ClawHub.

## Найти и установить плагин

Поиск из OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установите плагин, размещенный в ClawHub, с явным источником ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Обновите установленные плагины:

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

## Опубликовать Skills

Skills — это папка с обязательным файлом `SKILL.md` и необязательными вспомогательными
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

Перед публикацией проверьте метаданные в `SKILL.md`. Объявите необходимые
переменные среды, инструменты и разрешения, чтобы пользователи могли понять, что нужно
Skills до установки. См. [формат Skills](/ru/clawhub/skill-format).

Для репозиториев, содержащих несколько Skills, переиспользуемый рабочий процесс GitHub вызывает
`skill publish` для каждой непосредственной папки Skills в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опубликовать плагин

Опубликуйте плагин из локальной папки, репозитория GitHub, ref GitHub или
существующего архива:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Сначала используйте `--dry-run`, чтобы предварительно просмотреть разрешенные метаданные пакета, поля
совместимости, атрибуцию источника и план загрузки без публикации.

Плагины кода должны включать метаданные совместимости OpenClaw в `package.json`,
включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`.

## Проверить перед установкой

Перед установкой используйте веб-страницу ClawHub или команды CLI для подробной информации, чтобы проверить
метаданные, ссылки на источники, версии, журналы изменений и статус сканирования:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публичные листинги показывают последнее состояние сканирования. Релизы, удержанные или заблокированные
модерацией, могут быть скрыты из поиска и поверхностей установки до разрешения ситуации.
