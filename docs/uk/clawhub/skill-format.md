---
read_when:
    - Публікація Skills
    - Налагодження збоїв публікації/синхронізації
summary: Формат папки Skills, обов’язкові файли, дозволені типи файлів, обмеження.
x-i18n:
    generated_at: "2026-05-12T08:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Формат навички

## На диску

Навичка — це папка.

Обов’язково:

- `SKILL.md` (або `skill.md`)

Необов’язково:

- будь-які допоміжні _текстові_ файли (див. «Дозволені файли»)
- `.clawhubignore` (шаблони ігнорування для публікації/синхронізації, застарілий `.clawdhubignore`)
- `.gitignore` (також враховується)

Метадані локального встановлення (записуються CLI):

- `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

Стан встановлення робочого каталогу (записується CLI):

- `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)

## `SKILL.md`

- Markdown з необов’язковим YAML frontmatter.
- Сервер витягує метадані з frontmatter під час публікації.
- `description` використовується як короткий опис навички в UI/пошуку.

## Метадані frontmatter

Метадані навички оголошуються в YAML frontmatter на початку вашого `SKILL.md`. Це повідомляє реєстру (і аналізу безпеки), що потрібно вашій навичці для запуску.

### Базовий frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Метадані середовища виконання (`metadata.openclaw`)

Оголосіть вимоги до середовища виконання вашої навички в `metadata.openclaw` (псевдоніми: `metadata.clawdbot`, `metadata.clawdis`).

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

Використовуйте `requires.env` для змінних середовища, які мають бути наявні перед запуском навички. Використовуйте `envVars`, коли потрібні метадані для кожної змінної, зокрема необов’язкові змінні з `required: false`.

### Повна довідка полів

| Поле               | Тип        | Опис                                                                                                                                                    |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Обов’язкові змінні середовища, які очікує ваша навичка.                                                                                                  |
| `requires.bins`    | `string[]` | CLI-бінарні файли, які всі мають бути встановлені.                                                                                                      |
| `requires.anyBins` | `string[]` | CLI-бінарні файли, з яких має існувати принаймні один.                                                                                                  |
| `requires.config`  | `string[]` | Шляхи до конфігураційних файлів, які читає ваша навичка.                                                                                                |
| `primaryEnv`       | `string`   | Основна змінна середовища з обліковими даними для вашої навички.                                                                                        |
| `envVars`          | `array`    | Оголошення змінних середовища з `name`, необов’язковим `required` і необов’язковим `description`. Установіть `required: false` для необов’язкових змінних середовища. |
| `always`           | `boolean`  | Якщо `true`, навичка завжди активна (явне встановлення не потрібне).                                                                                    |
| `skillKey`         | `string`   | Перевизначає ключ виклику навички.                                                                                                                      |
| `emoji`            | `string`   | Емодзі для відображення навички.                                                                                                                        |
| `homepage`         | `string`   | URL домашньої сторінки або документації навички.                                                                                                        |
| `os`               | `string[]` | Обмеження ОС (наприклад, `["macos"]`, `["linux"]`).                                                                                                     |
| `install`          | `array`    | Специфікації встановлення для залежностей (див. нижче).                                                                                                 |
| `nix`              | `object`   | Специфікація Nix plugin (див. README).                                                                                                                  |
| `config`           | `object`   | Специфікація конфігурації Clawdbot (див. README).                                                                                                      |

### Специфікації встановлення

Якщо вашій навичці потрібно встановити залежності, оголосіть їх у масиві `install`:

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

Підтримувані типи встановлення: `brew`, `node`, `go`, `uv`.

### Необов’язкові змінні середовища

Оголошуйте необов’язкові змінні середовища в `metadata.openclaw.envVars` і встановлюйте `required: false`. Не додавайте необов’язкові записи до `requires.env`, бо `requires.env` означає, що навичка не може працювати без них.

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

### Чому це важливо

Аналіз безпеки ClawHub перевіряє, що оголошення вашої навички відповідають тому, що вона фактично робить. Якщо ваш код посилається на `TODOIST_API_KEY`, але ваш frontmatter не оголошує його в `requires.env`, `primaryEnv` або `envVars`, аналіз позначить невідповідність метаданих. Точні оголошення допомагають вашій навичці пройти перевірку й допомагають користувачам зрозуміти, що вони встановлюють.

### Приклад: повний frontmatter

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

## Дозволені файли

Публікація приймає лише «текстові» файли.

- Список дозволених розширень міститься в `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Файли сценаріїв усе ще скануються після завантаження; файли PowerShell `.ps1`, `.psm1` і `.psd1` приймаються як текст.
- Типи вмісту, що починаються з `text/`, обробляються як текст; також є невеликий список дозволених типів (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Обмеження (на боці сервера):

- Загальний розмір пакета: 50MB.
- Текст для embedding включає `SKILL.md` + до приблизно 40 файлів, що не є `.md` (ліміт застосовується за можливості).

## Slugs

- Типово виводяться з назви папки.
- Мають бути в нижньому регістрі та безпечними для URL: `^[a-z0-9][a-z0-9-]*$`.

## Версіонування + теги

- Кожна публікація створює нову версію (semver).
- Теги — це рядкові вказівники на версію; часто використовується `latest`.

## Ліцензія

- Усі навички, опубліковані на ClawHub, ліцензуються за `MIT-0`.
- Будь-хто може використовувати, змінювати й поширювати опубліковані навички, зокрема комерційно.
- Атрибуція не потрібна.
- Не додавайте суперечливі умови ліцензії в `SKILL.md`; ClawHub не підтримує перевизначення ліцензій для окремих навичок.

## Платні навички

- ClawHub не підтримує платні навички, ціноутворення для окремих навичок, paywall або розподіл доходу.
- Не додавайте метадані ціни до `SKILL.md`; це не є частиною формату навички й не зробить опубліковану навичку платною.
- Якщо ваша навичка інтегрується з платним стороннім сервісом, чітко задокументуйте зовнішню вартість і потрібний обліковий запис в інструкціях навички та оголошеннях env (`requires.env` для обов’язкових змінних або `envVars` з `required: false` для необов’язкових змінних).
