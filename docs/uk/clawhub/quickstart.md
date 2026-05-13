---
read_when:
    - Вперше використовуєте ClawHub
    - Встановлення навички або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте та публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-05-13T04:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для Skills і Plugin OpenClaw.

Використовуйте OpenClaw, коли встановлюєте речі в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними списками або використовуєте
специфічні для реєстру робочі процеси.

## Знайти та встановити Skills

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановити Skills:

```bash
openclaw skills install <skill-slug>
```

Оновити встановлені Skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить Skills, щоб подальші оновлення могли й надалі
визначатися через ClawHub.

## Знайти та встановити Plugin

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Встановити Plugin, розміщений у ClawHub, із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені Plugin:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw визначав пакет через
ClawHub, а не через npm або інше джерело.

## Увійти для публікації

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

## Опублікувати Skills

Skills — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти та дозволи, щоб користувачі могли зрозуміти, що
потрібно Skills, перш ніж встановлювати його. Див. [Формат Skills](/uk/clawhub/skill-format).

## Опублікувати Plugin

Опублікуйте Plugin з локальної папки, репозиторію GitHub, посилання GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використайте `--dry-run`, щоб переглянути визначені метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові Plugin мають містити метадані сумісності OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Синхронізувати Skills, які ви підтримуєте

`sync` сканує папки Skills і публікує нові або змінені Skills, які ще не
синхронізовано.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в систему, `sync` також може надсилати мінімальний знімок встановлень для
сукупних лічильників встановлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що повідомляється
і як відмовитися.

## Перевірити перед встановленням

Перед встановленням скористайтеся вебсторінкою ClawHub або командами деталей CLI, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні списки показують останній стан сканування. Випуски, які утримуються або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку та встановлення, доки проблему не буде вирішено.
