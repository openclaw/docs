---
read_when:
    - Первое использование ClawHub
    - Установка навыка или плагина из реестра
    - Публикация в ClawHub
summary: 'Начните использовать ClawHub: находите, устанавливайте, обновляйте и публикуйте навыки или плагины.'
x-i18n:
    generated_at: "2026-07-13T17:58:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Быстрый старт

ClawHub — это реестр навыков и плагинов для OpenClaw.

Используйте OpenClaw при установке компонентов в OpenClaw. Используйте CLI `clawhub`,
когда выполняете вход, публикуете материалы, управляете собственными записями или используете
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

OpenClaw записывает источник навыка, чтобы последующие обновления по-прежнему
могли получать его через ClawHub.

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

Используйте префикс `clawhub:`, если требуется, чтобы OpenClaw получал пакет через
ClawHub, а не из npm или другого источника.

## Вход для публикации

Установите CLI ClawHub:

```bash
npm i -g clawhub
# или
pnpm add -g clawhub
```

Выполните вход через GitHub:

```bash
clawhub login
clawhub whoami
```

В средах без графического интерфейса можно использовать API-токен из веб-интерфейса ClawHub:

```bash
clawhub login --token clh_...
```

## Публикация навыка

Навык — это папка с обязательным файлом `SKILL.md` и необязательными вспомогательными
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускает содержимое без изменений. Новые навыки начинают с версии `1.0.0`; последующие изменения
автоматически публикуются как следующая патч-версия. Используйте `--dry-run` для предварительного просмотра или
`--version`, чтобы явно выбрать версию.

Перед публикацией проверьте метаданные в `SKILL.md`. Укажите необходимые
переменные окружения, инструменты и разрешения, чтобы пользователи до установки понимали,
что требуется навыку. См. раздел [Формат навыка](/ru/clawhub/skill-format).

Для репозиториев, содержащих несколько навыков, переиспользуемый рабочий процесс GitHub вызывает
`skill publish` для каждой непосредственной папки навыка в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Публикация плагина

Публикация плагина из локальной папки, репозитория GitHub, ссылки GitHub или
существующего архива:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Сначала используйте `--dry-run`, чтобы без публикации просмотреть определённые метаданные пакета, поля
совместимости, сведения об источнике и план загрузки.

Плагины кода должны включать метаданные совместимости с OpenClaw в `package.json`,
в том числе `openclaw.compat.pluginApi` и `openclaw.build.openclawVersion`.

## Проверка перед установкой

Перед установкой используйте веб-страницу ClawHub или команды CLI для просмотра сведений, чтобы проверить
метаданные, ссылки на исходный код, версии, журналы изменений и состояние сканирования:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

В общедоступных записях отображается последнее состояние сканирования. Выпуски, приостановленные или заблокированные
модерацией, могут быть скрыты в результатах поиска и интерфейсах установки до разрешения ситуации.
