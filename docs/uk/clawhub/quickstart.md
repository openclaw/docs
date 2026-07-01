---
read_when:
    - Перше використання ClawHub
    - Встановлення skill або plugin з registry
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, установлюйте, оновлюйте та публікуйте навички або плагіни.'
x-i18n:
    generated_at: "2026-07-01T15:31:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр навичок і плагінів для OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
робочі процеси, специфічні для реєстру.

## Знайдіть і встановіть навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановіть навичку:

```bash
openclaw skills install @openclaw/demo
```

Оновіть установлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
резолвитися через ClawHub.

## Знайдіть і встановіть плагін

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Встановіть плагін, розміщений у ClawHub, з явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновіть установлені плагіни:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw резолвив пакет через
ClawHub, а не через npm чи інше джерело.

## Увійдіть для публікації

Встановіть CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Увійдіть через GitHub:

```bash
clawhub login
clawhub whoami
```

Середовища без графічного інтерфейсу можуть використовувати API-токен із вебінтерфейсу ClawHub:

```bash
clawhub login --token clh_...
```

## Опублікуйте навичку

Навичка — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові навички починаються з `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що
потрібно навичці перед встановленням. Див. [Формат навички](/uk/clawhub/skill-format).

Для репозиторіїв із кількома навичками багаторазовий робочий процес GitHub викликає
`skill publish` для кожної безпосередньої папки навички в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікуйте плагін

Опублікуйте плагін із локальної папки, репозиторію GitHub, ref GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використовуйте `--dry-run`, щоб переглянути резолвлені метадані пакета, поля
сумісності, атрибуцію джерела й план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірте перед встановленням

Перед встановленням використовуйте вебсторінку ClawHub або команди CLI для деталей, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні записи показують найновіший стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з пошуку й поверхонь встановлення, доки проблему не буде вирішено.
