---
read_when:
    - Публікація Skills
    - Налагодження збоїв публікації
summary: Формат папки Skills, обов’язкові файли, дозволені типи файлів, обмеження.
x-i18n:
    generated_at: "2026-07-01T08:29:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Формат Skill

## На диску

Skill — це папка.

Обов’язково:

- `SKILL.md` (або `skill.md`; застарілий `skills.md` також приймається)

Необов’язково:

- будь-які допоміжні _текстові_ файли (див. «Дозволені файли»)
- `.clawhubignore` (шаблони ігнорування для публікації, застарілий `.clawdhubignore`)
- `.gitignore` (також враховується)

## Імпорт із GitHub

Вебімпортер GitHub суворіший за локальну публікацію/синхронізацію. Він виявляє лише
файли `SKILL.md` або застарілі `skills.md` у публічних, не fork-репозиторіях, що належать
обліковому запису GitHub, у який виконано вхід. Він не імпортує приватні репозиторії, fork-и,
архівовані/вимкнені репозиторії або сторонні публічні репозиторії.

Локальні метадані встановлення (записуються CLI):

- `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

Стан встановлення в робочому каталозі (записується CLI):

- `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)

## `SKILL.md`

- Markdown з необов’язковим YAML frontmatter.
- Сервер витягує метадані з frontmatter під час публікації.
- `description` використовується як короткий опис Skill в UI/пошуку.

## Метадані frontmatter

Метадані Skill оголошуються в YAML frontmatter на початку вашого `SKILL.md`. Це повідомляє реєстру (і аналізу безпеки), що потрібно вашому Skill для запуску.

### Базовий frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Метадані середовища виконання (`metadata.openclaw`)

Оголосіть вимоги середовища виконання вашого Skill у `metadata.openclaw` (псевдоніми: `metadata.clawdbot`, `metadata.clawdis`).

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

Використовуйте `requires.env` для змінних середовища, які мають бути наявні до запуску Skill. Використовуйте `envVars`, коли потрібні метадані для кожної змінної, зокрема необов’язкові змінні з `required: false`.

### Повний довідник полів

| Поле               | Тип        | Опис                                                                                                                                                    |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Обов’язкові змінні середовища, які очікує ваш Skill.                                                                                                    |
| `requires.bins`    | `string[]` | CLI-бінарники, які всі мають бути встановлені.                                                                                                          |
| `requires.anyBins` | `string[]` | CLI-бінарники, з яких має існувати принаймні один.                                                                                                      |
| `requires.config`  | `string[]` | Шляхи до конфігураційних файлів, які читає ваш Skill.                                                                                                   |
| `primaryEnv`       | `string`   | Основна змінна середовища з обліковими даними для вашого Skill.                                                                                         |
| `envVars`          | `array`    | Оголошення змінних середовища з `name`, необов’язковим `required` і необов’язковим `description`. Установіть `required: false` для необов’язкових змінних середовища. |
| `always`           | `boolean`  | Якщо `true`, Skill завжди активний (явне встановлення не потрібне).                                                                                     |
| `skillKey`         | `string`   | Перевизначає ключ виклику Skill.                                                                                                                        |
| `emoji`            | `string`   | Emoji для відображення Skill.                                                                                                                           |
| `homepage`         | `string`   | URL домашньої сторінки або документації Skill.                                                                                                          |
| `os`               | `string[]` | Обмеження ОС (наприклад, `["macos"]`, `["linux"]`).                                                                                                     |
| `install`          | `array`    | Специфікації встановлення залежностей (див. нижче).                                                                                                     |
| `nix`              | `object`   | Специфікація Nix-плагіна (див. README).                                                                                                                 |
| `config`           | `object`   | Специфікація конфігурації Clawdbot (див. README).                                                                                                       |

### Специфікації встановлення

Якщо вашому Skill потрібні встановлені залежності, оголосіть їх у масиві `install`:

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

Оголошуйте необов’язкові змінні середовища в `metadata.openclaw.envVars` і встановлюйте `required: false`. Не додавайте необов’язкові записи до `requires.env`, тому що `requires.env` означає, що Skill не може запускатися без них.

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

Аналіз безпеки ClawHub перевіряє, що оголошене вашим Skill відповідає тому, що він фактично робить. Якщо ваш код посилається на `TODOIST_API_KEY`, але ваш frontmatter не оголошує її в `requires.env`, `primaryEnv` або `envVars`, аналіз позначить невідповідність метаданих. Точні оголошення допомагають вашому Skill пройти перевірку й допомагають користувачам зрозуміти, що вони встановлюють.

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
- Файли скриптів усе одно скануються після завантаження; файли PowerShell `.ps1`, `.psm1` і `.psd1` приймаються як текст.
- Типи вмісту, що починаються з `text/`, обробляються як текст; додатково діє невеликий список дозволених типів (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Обмеження (на боці сервера):

- Загальний розмір пакета: 50MB.
- Текст для embedding містить `SKILL.md` + до приблизно 40 файлів, що не є `.md` (обмеження за найкращим зусиллям).

## Slug-и

- Типово виводяться з назви папки.
- Області пакетів мають точно збігатися з handle видавця ClawHub. Handle видавця можуть використовувати малі літери, цифри, дефіси, крапки та підкреслення; вони мають починатися й закінчуватися малою літерою або цифрою.
- Slug-и пакетів мають бути в нижньому регістрі та безпечними для npm, наприклад `@example.tools/demo-plugin` або `demo-plugin`.

## Версіювання + теги

- Кожна публікація створює нову версію (semver).
- Теги — це рядкові вказівники на версію; часто використовується `latest`.

## Ліцензія

- Усі Skills, опубліковані на ClawHub, ліцензуються за `MIT-0`.
- Будь-хто може використовувати, змінювати й повторно поширювати опубліковані Skills, зокрема комерційно.
- Зазначення авторства не потрібне.
- Не додавайте суперечливі умови ліцензії в `SKILL.md`; ClawHub не підтримує перевизначення ліцензії для окремих Skills.

## Платні Skills

- ClawHub не підтримує платні Skills, ціноутворення для окремих Skills, paywall-и або розподіл доходу.
- Не додавайте метадані ціни до `SKILL.md`; це не є частиною формату Skill і не зробить опублікований Skill платним.
- Якщо ваш Skill інтегрується з платною сторонньою службою, чітко задокументуйте зовнішню вартість і потрібний обліковий запис в інструкціях Skill та оголошеннях змінних середовища (`requires.env` для обов’язкових змінних або `envVars` з `required: false` для необов’язкових змінних).
