---
read_when:
    - Первое использование ClawHub
    - Установка Skills или плагина из реестра
    - Публикация в ClawHub
summary: 'Начните использовать ClawHub: находите, устанавливайте, обновляйте и публикуйте навыки или плагины.'
x-i18n:
    generated_at: "2026-07-16T16:41:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Быстрый старт

ClawHub — реестр навыков и плагинов OpenClaw.

Используйте OpenClaw при установке компонентов в OpenClaw. Используйте CLI `clawhub`,
когда входите в систему, публикуете материалы, управляете собственными публикациями или используете
специальные рабочие процессы реестра.

## Поиск и установка навыка

Поиск из OpenClaw:

```bash
openclaw skills search "calendar"
```

Установка навыка:

```bash
openclaw skills install @openclaw/demo
```

Обновление установленных навыков:

```bash
openclaw skills update --all
```

OpenClaw сохраняет сведения об источнике навыка, чтобы последующие обновления
можно было получать через ClawHub.

## Поиск и установка плагина

Поиск из OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установка размещённого в ClawHub плагина с явным указанием источника ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Обновление установленных плагинов:

```bash
openclaw plugins update --all
```

Используйте префикс `clawhub:`, если хотите, чтобы OpenClaw получал пакет через
ClawHub, а не из npm или другого источника.

## Вход в систему для публикации

Установите CLI ClawHub:

```bash
npm i -g clawhub
# или
pnpm add -g clawhub
```

Войдите с помощью GitHub:

```bash
clawhub login
clawhub whoami
```

В средах без графического интерфейса можно использовать API-токен из веб-интерфейса ClawHub:

```bash
clawhub login --token clh_...
```

## Публикация навыка

Навык — это папка с обязательным файлом `SKILL.md` и необязательными
вспомогательными файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускает неизменённое содержимое. Новые навыки получают версию `1.0.0`;
при последующих изменениях автоматически публикуется следующая патч-версия. Используйте
`--dry-run` для предварительного просмотра или `--version` для явного выбора версии.

Перед публикацией проверьте метаданные в `SKILL.md`. Укажите необходимые
переменные среды, инструменты и разрешения, чтобы до установки пользователи могли понять,
что требуется навыку. См. [Формат навыка](/ru/clawhub/skill-format).

Для репозиториев с несколькими навыками переиспользуемый рабочий процесс GitHub вызывает
`skill publish` для каждой папки навыка непосредственно внутри `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Публикация плагина

Опубликуйте плагин из локальной папки, репозитория GitHub, ссылки GitHub или
существующего архива:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Сначала используйте `--dry-run`, чтобы без публикации предварительно просмотреть
определённые метаданные пакета, поля совместимости, сведения об источнике и план загрузки.

Плагины с кодом должны содержать в `package.json` метаданные совместимости с OpenClaw,
включая `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`.

## Проверка перед установкой

Перед установкой используйте веб-страницу ClawHub или команды CLI для просмотра подробностей,
чтобы проверить метаданные, ссылки на исходный код, версии, журналы изменений и состояние сканирования:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

В общедоступных публикациях отображается последнее состояние сканирования. Выпуски, которые
приостановлены или заблокированы модерацией, могут быть скрыты из результатов поиска и интерфейсов
установки до разрешения проблемы.
