---
read_when:
    - Публікація Skills
    - Налагодження збоїв публікації/синхронізації
summary: Формат папки Skill, обов’язкові файли, дозволені типи файлів, обмеження.
x-i18n:
    generated_at: "2026-05-13T05:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Формат skill

## На диску

Skill — це папка.

Обов’язково:

- `SKILL.md` (або `skill.md`)

Необов’язково:

- будь-які допоміжні _текстові_ файли (див. «Дозволені файли»)
- `.clawhubignore` (патерни ігнорування для публікації/синхронізації, застаріле `.clawdhubignore`)
- `.gitignore` (також враховується)

Метадані локального встановлення (записуються CLI):

- `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

Стан встановлення в робочому каталозі (записується CLI):

- `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)

## `SKILL.md`

- Markdown з необов’язковим YAML frontmatter.
- Сервер витягує метадані з frontmatter під час публікації.
- `description` використовується як короткий опис skill в UI/пошуку.

## Метадані frontmatter

Метадані skill оголошуються в YAML frontmatter на початку вашого `SKILL.md`. Це повідомляє реєстру (і аналізу безпеки), що потрібно вашому skill для запуску.

### Базовий frontmatter

```yaml
---
name: my-skill
description: Короткий опис того, що робить цей skill.
version: 1.0.0
---
```

### Метадані середовища виконання (`metadata.openclaw`)

Оголосіть вимоги середовища виконання вашого skill у `metadata.openclaw` (псевдоніми: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Керуйте завданнями через Todoist API.
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

Використовуйте `requires.env` для змінних середовища, які мають бути наявні до запуску skill. Використовуйте `envVars`, коли потрібні метадані для окремих змінних, зокрема необов’язкові змінні з `required: false`.

### Повний довідник полів

| Поле               | Тип        | Опис                                                                                                                                             |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Обов’язкові змінні середовища, які очікує ваш skill.                                                                                             |
| `requires.bins`    | `string[]` | CLI-бінарні файли, які всі мають бути встановлені.                                                                                               |
| `requires.anyBins` | `string[]` | CLI-бінарні файли, з яких має існувати принаймні один.                                                                                           |
| `requires.config`  | `string[]` | Шляхи до конфігураційних файлів, які читає ваш skill.                                                                                            |
| `primaryEnv`       | `string`   | Основна змінна середовища з обліковими даними для вашого skill.                                                                                  |
| `envVars`          | `array`    | Оголошення змінних середовища з `name`, необов’язковим `required` і необов’язковим `description`. Установіть `required: false` для необов’язкових змінних середовища. |
| `always`           | `boolean`  | Якщо `true`, skill завжди активний (явне встановлення не потрібне).                                                                              |
| `skillKey`         | `string`   | Перевизначає ключ виклику skill.                                                                                                                  |
| `emoji`            | `string`   | Emoji для відображення skill.                                                                                                                     |
| `homepage`         | `string`   | URL домашньої сторінки або документації skill.                                                                                                   |
| `os`               | `string[]` | Обмеження ОС (наприклад, `["macos"]`, `["linux"]`).                                                                                              |
| `install`          | `array`    | Специфікації встановлення залежностей (див. нижче).                                                                                              |
| `nix`              | `object`   | Специфікація Plugin Nix (див. README).                                                                                                           |
| `config`           | `object`   | Специфікація конфігурації Clawdbot (див. README).                                                                                                |

### Специфікації встановлення

Якщо вашому skill потрібно встановити залежності, оголосіть їх у масиві `install`:

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

Оголошуйте необов’язкові змінні середовища в `metadata.openclaw.envVars` і встановлюйте `required: false`. Не додавайте необов’язкові записи до `requires.env`, бо `requires.env` означає, що skill не може працювати без них.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Токен Todoist API, що використовується для автентифікованих запитів.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Необов’язковий стандартний ID проєкту, коли користувач не вказує його.
```

### Чому це важливо

Аналіз безпеки ClawHub перевіряє, що оголошене вашим skill відповідає тому, що він фактично робить. Якщо ваш код посилається на `TODOIST_API_KEY`, але frontmatter не оголошує його в `requires.env`, `primaryEnv` або `envVars`, аналіз позначить невідповідність метаданих. Точні оголошення допомагають вашому skill пройти перевірку й допомагають користувачам зрозуміти, що вони встановлюють.

### Приклад: повний frontmatter

```yaml
---
name: todoist-cli
description: Керуйте завданнями, проєктами та мітками Todoist з командного рядка.
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
        description: Токен Todoist API.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Необов’язковий стандартний ID проєкту.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Дозволені файли

Публікація приймає лише «текстові» файли.

- Список дозволених розширень міститься в `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Файли скриптів усе одно скануються після завантаження; файли PowerShell `.ps1`, `.psm1` і `.psd1` приймаються як текст.
- Типи вмісту, що починаються з `text/`, обробляються як текст; також діє невеликий список дозволених типів (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Обмеження (на боці сервера):

- Загальний розмір пакета: 50MB.
- Текст для embedding включає `SKILL.md` + до приблизно 40 файлів не `.md` (обмеження за принципом найкращого зусилля).

## Slugs

- За замовчуванням утворюються з назви папки.
- Мають бути в нижньому регістрі й безпечними для URL: `^[a-z0-9][a-z0-9-]*$`.

## Версіонування + теги

- Кожна публікація створює нову версію (semver).
- Теги — це рядкові вказівники на версію; зазвичай використовується `latest`.

## Ліцензія

- Усі Skills, опубліковані на ClawHub, ліцензуються за `MIT-0`.
- Будь-хто може використовувати, змінювати й поширювати опубліковані Skills, зокрема комерційно.
- Зазначення авторства не потрібне.
- Не додавайте конфліктні умови ліцензії в `SKILL.md`; ClawHub не підтримує перевизначення ліцензії для окремого skill.

## Платні Skills

- ClawHub не підтримує платні Skills, ціноутворення для окремих Skills, платний доступ або розподіл доходу.
- Не додавайте метадані ціни до `SKILL.md`; це не є частиною формату skill і не зробить опублікований skill платним.
- Якщо ваш skill інтегрується з платним стороннім сервісом, чітко задокументуйте зовнішню вартість і потрібний обліковий запис в інструкціях skill та оголошеннях змінних середовища (`requires.env` для обов’язкових змінних або `envVars` з `required: false` для необов’язкових змінних).
