---
read_when:
    - Перше використання ClawHub
    - Встановлення skill або plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте Skills або plugins.'
x-i18n:
    generated_at: "2026-05-12T08:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для OpenClaw skills і плагінів.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти й установити skill

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити skill:

```bash
openclaw skills install <skill-slug>
```

Оновити встановлені skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить skill, щоб подальші оновлення могли й надалі
розв’язуватися через ClawHub.

## Знайти й установити плагін

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити плагін, розміщений у ClawHub, з явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені плагіни:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
ClawHub, а не через npm чи інше джерело.

## Увійти для публікації

Установіть CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Увійдіть за допомогою GitHub:

```bash
clawhub login
clawhub whoami
```

Безголові середовища можуть використовувати API-токен із вебінтерфейсу ClawHub:

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
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що
потрібно skill, перш ніж установити його. Див. [Формат skill](/uk/clawhub/skill-format).

## Опублікувати плагін

Опублікуйте плагін з локальної папки, репозиторію GitHub, ref GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використайте `--dry-run`, щоб переглянути розв’язані метадані пакета, поля
сумісності, атрибуцію джерела й план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Синхронізувати skills, які ви підтримуєте

`sync` сканує папки skills і публікує нові або змінені skills, які ще не
синхронізовані.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Коли ви ввійшли в систему, `sync` також може надсилати мінімальний знімок установлень для
агрегованих лічильників установлень. Див. [Телеметрія](/uk/clawhub/telemetry), щоб дізнатися, що передається
і як відмовитися.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами деталізації CLI, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Публічні записи показують останній стан сканування. Релізи, утримані або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку й установлення, доки проблему не буде вирішено.
