---
read_when:
    - Перше використання ClawHub
    - Встановлення навички або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте Skills або Plugins.'
x-i18n:
    generated_at: "2026-05-13T05:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для Skills і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними списками або використовуєте
специфічні для реєстру робочі процеси.

## Знайти та встановити навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановити навичку:

```bash
openclaw skills install <skill-slug>
```

Оновити встановлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
резолвитися через ClawHub.

## Знайти та встановити плагін

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Встановити плагін, розміщений у ClawHub, із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені плагіни:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw резолвив пакет через
ClawHub, а не через npm чи інше джерело.

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

Середовища без графічного інтерфейсу можуть використовувати API-токен з вебінтерфейсу ClawHub:

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
потрібно навичці, перш ніж вони її встановлять. Див. [Формат навички](/uk/clawhub/skill-format).

## Опублікувати плагін

Опублікуйте плагін із локальної папки, репозиторію GitHub, GitHub ref або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спершу використовуйте `--dry-run`, щоб попередньо переглянути резолвлені метадані пакета, поля сумісності,
атрибуцію джерела та план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Синхронізувати навички, які ви підтримуєте

`sync` сканує папки навичок і публікує нові або змінені навички, які ще не
синхронізовано.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в систему, `sync` також може надіслати мінімальний знімок встановлення для
агрегованих лічильників встановлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що повідомляється
і як відмовитися.

## Перевірити перед встановленням

Перед встановленням використовуйте вебсторінку ClawHub або команди деталей CLI, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні списки показують найновіший стан сканування. Випуски, які утримуються або заблоковані
модерацією, можуть бути приховані з пошуку та поверхонь встановлення, доки проблему не буде вирішено.
