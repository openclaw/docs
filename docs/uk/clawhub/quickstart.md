---
read_when:
    - Перше використання ClawHub
    - Встановлення навички або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте та публікуйте Skills або plugins.'
x-i18n:
    generated_at: "2026-05-12T04:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр навичок і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними оголошеннями або використовуєте
робочі процеси, специфічні для реєстру.

## Знайдіть і встановіть навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановіть навичку:

```bash
openclaw skills install <skill-slug>
```

Оновіть установлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
виконувати розв’язання через ClawHub.

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

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
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

Безголові середовища можуть використовувати API-токен із вебінтерфейсу ClawHub:

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
  --version 1.0.0 \
  --changelog "Initial release"
```

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що
потрібно навичці, перш ніж встановлювати її. Див. [Формат навички](/uk/clawhub/skill-format).

## Опублікуйте плагін

Опублікуйте плагін із локальної папки, репозиторію GitHub, посилання GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спершу використайте `--dry-run`, щоб попередньо переглянути розв’язані метадані пакета, поля сумісності,
атрибуцію джерела та план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Синхронізуйте навички, які ви підтримуєте

`sync` сканує папки навичок і публікує нові або змінені навички, які ще не
синхронізовано.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в систему, `sync` також може надсилати мінімальний знімок установлення для
агрегованої кількості встановлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що надсилається
і як відмовитися.

## Перевірте перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами деталей CLI, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні оголошення показують найновіший стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з пошуку та поверхонь установлення, доки проблему не буде вирішено.
