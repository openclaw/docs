---
read_when:
    - Перше використання ClawHub
    - Встановлення skill або plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, установлюйте, оновлюйте й публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-06-28T07:42:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для OpenClaw Skills і plugins.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними оголошеннями або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти й установити skill

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити skill:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені Skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки надійшов skill, щоб подальші оновлення могли й далі
розв’язуватися через ClawHub.

## Знайти й установити plugin

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити plugin, розміщений у ClawHub, із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені plugins:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
ClawHub, а не через npm чи інше джерело.

## Увійти для публікації

Установити CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Увійти через GitHub:

```bash
clawhub login
clawhub whoami
```

Середовища без графічного інтерфейсу можуть використовувати API-токен із вебінтерфейсу ClawHub:

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
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові Skills починаються з `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що потрібно
skill перед установленням. Див. [Формат skill](/uk/clawhub/skill-format).

Для репозиторіїв із кількома Skills багаторазовий робочий процес GitHub викликає
`skill publish` для кожної безпосередньої папки skill у `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікувати plugin

Опублікувати plugin із локальної папки, репозиторію GitHub, GitHub ref або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використайте `--dry-run`, щоб попередньо переглянути розв’язані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові plugins мають містити метадані сумісності OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами деталізації CLI, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і статус сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні оголошення показують найновіший стан сканування. Релізи, які утримуються або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку й установлення, доки проблему не буде розв’язано.
