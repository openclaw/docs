---
read_when:
    - Перше використання ClawHub
    - Встановлення навички або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, установлюйте, оновлюйте й публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-05-13T02:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр навичок і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
специфічні для реєстру робочі процеси.

## Знайти й установити навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити навичку:

```bash
openclaw skills install <skill-slug>
```

Оновити встановлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
виконуватися через ClawHub.

## Знайти й установити плагін

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити розміщений у ClawHub плагін із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені плагіни:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw знаходив пакет через
ClawHub, а не через npm чи інше джерело.

## Увійти для публікації

Установіть CLI ClawHub:

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

## Опублікувати навичку

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
потрібно навичці, перш ніж установлювати її. Див. [Формат навички](/uk/clawhub/skill-format).

## Опублікувати плагін

Опублікуйте плагін із локальної папки, репозиторію GitHub, посилання GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використайте `--dry-run`, щоб переглянути розпізнані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Синхронізувати навички, які ви підтримуєте

`sync` сканує папки навичок і публікує нові або змінені навички, які ще не
синхронізовано.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в систему, `sync` також може надсилати мінімальний знімок установлення для
зведеної кількості встановлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що повідомляється
і як відмовитися.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами CLI для перегляду деталей, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні записи показують останній стан сканування. Випуски, які утримуються або заблоковані
модерацією, можуть бути приховані з пошуку й поверхонь установлення, доки проблему не буде розв’язано.
