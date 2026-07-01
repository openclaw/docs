---
read_when:
    - Перше використання ClawHub
    - Встановлення навички або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, установлюйте, оновлюйте та публікуйте Skills або Plugin.'
x-i18n:
    generated_at: "2026-07-01T13:21:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр навичок і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в обліковий запис, публікуєте, керуєте власними оголошеннями або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти й установити навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити навичку:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
розпізнаватися через ClawHub.

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

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розпізнавав пакет через
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

Безголові середовища можуть використовувати API-токен із вебінтерфейсу ClawHub:

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
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові навички починаються з версії `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що потрібно
навичці, перш ніж установити її. Див. [Формат навички](/uk/clawhub/skill-format).

Для репозиторіїв, що містять кілька навичок, багаторазовий робочий процес GitHub викликає
`skill publish` для кожної безпосередньої папки навички в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікувати плагін

Опублікуйте плагін із локальної папки, репозиторію GitHub, ref GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спершу використовуйте `--dry-run`, щоб переглянути розпізнані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами CLI для перегляду деталей, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і статус сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні оголошення показують останній стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку й установлення, доки проблему не буде вирішено.
