---
read_when:
    - Уперше використовуєте ClawHub
    - Встановлення skill або plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте та публікуйте Skills або plugins.'
x-i18n:
    generated_at: "2026-07-01T08:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для Skills і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в обліковий запис, публікуєте, керуєте власними записами або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти й установити Skill

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити Skill:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені Skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить Skill, щоб подальші оновлення могли й надалі
розв’язуватися через ClawHub.

## Знайти й установити плагін

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити плагін, розміщений у ClawHub, із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені плагіни:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
ClawHub, а не npm чи інше джерело.

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

## Опублікувати Skill

Skill — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові Skills починаються з `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що потрібно
Skill, перш ніж установлювати його. Див. [Формат Skill](/uk/clawhub/skill-format).

Для репозиторіїв, що містять кілька Skills, багаторазовий workflow GitHub викликає
`skill publish` для кожної безпосередньої папки Skill у `skills/`:

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

Спершу використовуйте `--dry-run`, щоб попередньо переглянути розв’язані метадані пакета, поля сумісності,
атрибуцію джерела й план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед установленням

Перед установленням використайте вебсторінку ClawHub або команди CLI для деталей, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні записи показують останній стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку й установлення, доки проблему не буде вирішено.
