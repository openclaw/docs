---
read_when:
    - Публикация Skills
    - Отладка сбоев публикации
summary: Формат папки Skills, обязательные файлы, разрешенные типы файлов, ограничения.
x-i18n:
    generated_at: "2026-07-04T20:38:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Формат Skill

## На диске

Skill — это папка.

Обязательно:

- `SKILL.md` (или `skill.md`; устаревший `skills.md` также принимается)

Необязательно:

- любые вспомогательные _текстовые_ файлы (см. «Разрешенные файлы»)
- `.clawhubignore` (шаблоны игнорирования для публикации, устаревший `.clawdhubignore`)
- `.gitignore` (также учитывается)

## Импорт из GitHub

Веб-импортер GitHub строже, чем локальная публикация/синхронизация. Он обнаруживает только
файлы `SKILL.md` или устаревшие `skills.md` в публичных репозиториях, не являющихся форками, принадлежащих
вошедшей в систему учетной записи GitHub. Он не импортирует приватные репозитории, форки,
архивированные/отключенные репозитории или сторонние публичные репозитории.

Метаданные локальной установки (записываются CLI):

- `<skill>/.clawhub/origin.json` (устаревший `.clawdhub`)

Состояние установки в рабочем каталоге (записывается CLI):

- `<workdir>/.clawhub/lock.json` (устаревший `.clawdhub`)

## `SKILL.md`

- Markdown с необязательным YAML frontmatter.
- Сервер извлекает метаданные из frontmatter во время публикации.
- `description` используется как краткое описание Skill в UI/поиске.

## Метаданные frontmatter

Метаданные Skill объявляются в YAML frontmatter в начале вашего `SKILL.md`. Они сообщают реестру (и анализу безопасности), что нужно вашему Skill для запуска.

### Базовый frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Метаданные среды выполнения (`metadata.openclaw`)

Объявляйте требования среды выполнения вашего Skill в `metadata.openclaw` (псевдонимы: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Используйте `requires.env` для переменных окружения, которые должны присутствовать до запуска Skill. Используйте `envVars`, когда вам нужны метаданные для отдельных переменных, включая необязательные переменные с `required: false`.

### Полная справка по полям

| Поле               | Тип        | Описание                                                                                                                                                               |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Обязательные переменные окружения, которые ожидает ваш Skill.                                                                                                          |
| `requires.bins`    | `string[]` | CLI-бинарные файлы, которые все должны быть установлены.                                                                                                              |
| `requires.anyBins` | `string[]` | CLI-бинарные файлы, из которых должен существовать хотя бы один.                                                                                                      |
| `requires.config`  | `string[]` | Пути к файлам конфигурации, которые читает ваш Skill.                                                                                                                  |
| `primaryEnv`       | `string`   | Основная переменная окружения с учетными данными для вашего Skill.                                                                                                     |
| `envVars`          | `array`    | Объявления переменных окружения с `name`, необязательным `required` и необязательным `description`. Установите `required: false` для необязательных переменных окружения. |
| `always`           | `boolean`  | Если `true`, Skill всегда активен (явная установка не требуется).                                                                                                      |
| `skillKey`         | `string`   | Переопределяет ключ вызова Skill.                                                                                                                                      |
| `emoji`            | `string`   | Emoji для отображения Skill.                                                                                                                                           |
| `homepage`         | `string`   | URL домашней страницы или документации Skill.                                                                                                                          |
| `os`               | `string[]` | Ограничения ОС (например, `["macos"]`, `["linux"]`).                                                                                                                   |
| `install`          | `array`    | Спецификации установки зависимостей (см. ниже).                                                                                                                        |
| `nix`              | `object`   | Спецификация Plugin Nix (см. README).                                                                                                                                 |
| `config`           | `object`   | Спецификация конфигурации Clawdbot (см. README).                                                                                                                       |

### Спецификации установки

Если вашему Skill нужно установить зависимости, объявите их в массиве `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Поддерживаемые виды установки: `brew`, `node`, `go`, `uv`.

### Необязательные переменные окружения

Объявляйте необязательные переменные окружения в `metadata.openclaw.envVars` и устанавливайте `required: false`. Не добавляйте необязательные записи в `requires.env`, потому что `requires.env` означает, что Skill не может работать без них.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Почему это важно

Анализ безопасности ClawHub проверяет, что объявления вашего Skill соответствуют тому, что он фактически делает. Если ваш код ссылается на `TODOIST_API_KEY`, но ваш frontmatter не объявляет ее в `requires.env`, `primaryEnv` или `envVars`, анализ отметит несоответствие метаданных. Точные объявления помогают вашему Skill пройти проверку и помогают пользователям понять, что они устанавливают.

### Пример: полный frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Разрешенные файлы

Публикация принимает только «текстовые» файлы.

- Список разрешенных расширений находится в `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Файлы скриптов все равно сканируются после загрузки; файлы PowerShell `.ps1`, `.psm1` и `.psd1` принимаются как текст.
- Типы содержимого, начинающиеся с `text/`, считаются текстом; плюс небольшой список разрешенных типов (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Ограничения (на стороне сервера):

- Общий размер пакета: 50 МБ.
- Текст для embeddings включает `SKILL.md` + до ~40 файлов не `.md` (ограничение по возможности).

## Slugs

- По умолчанию выводятся из имени папки.
- Области пакетов должны точно совпадать с handle издателя ClawHub. Handle издателя могут использовать строчные буквы, цифры, дефисы, точки и подчеркивания; они должны начинаться и заканчиваться строчной буквой или цифрой.
- Slug пакетов должны быть в нижнем регистре и безопасны для npm, например `@example.tools/demo-plugin` или `demo-plugin`.

## Версионирование + теги

- Каждая публикация создает новую версию (semver).
- Теги — это строковые указатели на версию; обычно используется `latest`.

## Лицензия

- Все Skills, опубликованные на ClawHub, лицензируются по `MIT-0`.
- Любой может использовать, изменять и распространять опубликованные Skills, в том числе в коммерческих целях.
- Указание авторства не требуется.
- Не добавляйте конфликтующие условия лицензии в `SKILL.md`; ClawHub не поддерживает переопределение лицензии для отдельных Skill.

## Платные Skills

- ClawHub не поддерживает платные Skills, ценообразование для отдельных Skill, paywall или распределение дохода.
- Не добавляйте метаданные цены в `SKILL.md`; они не являются частью формата Skill и не сделают опубликованный Skill платным.
- Если ваш Skill интегрируется с платным сторонним сервисом, четко задокументируйте внешнюю стоимость и требуемую учетную запись в инструкциях Skill и объявлениях переменных окружения (`requires.env` для обязательных переменных или `envVars` с `required: false` для необязательных переменных).
