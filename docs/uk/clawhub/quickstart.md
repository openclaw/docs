---
read_when:
    - Вперше користуєтеся ClawHub
    - Встановлення Skills або Plugin з реєстру
    - Публікація у ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте Skills або plugins.'
x-i18n:
    generated_at: "2026-05-12T12:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр Skills і plugins для OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в обліковий запис, публікуєте, керуєте власними записами або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти та встановити skill

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановити skill:

```bash
openclaw skills install <skill-slug>
```

Оновити встановлені Skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить skill, щоб подальші оновлення могли й надалі
розв’язуватися через ClawHub.

## Знайти та встановити plugin

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Встановити plugin, розміщений у ClawHub, з явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені plugins:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
ClawHub, а не npm чи інше джерело.

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

## Опублікувати skill

Skill — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що потрібно
skill до встановлення. Див. [Формат skill](/uk/clawhub/skill-format).

## Опублікувати plugin

Опублікуйте plugin з локальної папки, репозиторію GitHub, GitHub ref або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спершу використайте `--dry-run`, щоб переглянути розв’язані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Code plugins мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` та `openclaw.build.openclawVersion`.

## Синхронізувати Skills, які ви підтримуєте

`sync` сканує папки Skills і публікує нові або змінені Skills, які ще не
синхронізовано.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в обліковий запис, `sync` також може надіслати мінімальний знімок встановлення для
агрегованих лічильників встановлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що повідомляється
та як відмовитися.

## Перевірити перед встановленням

Перед встановленням використовуйте вебсторінку ClawHub або команди деталей CLI, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні записи показують найновіший стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку та встановлення, доки проблему не буде вирішено.
