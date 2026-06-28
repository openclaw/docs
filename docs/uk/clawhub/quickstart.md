---
read_when:
    - Вперше користуєтеся ClawHub
    - Встановлення Skill або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте та публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-06-28T10:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр Skills і Plugin для OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`, коли входите в обліковий запис, публікуєте, керуєте власними списками або використовуєте робочі процеси, специфічні для реєстру.

## Знайти й установити Skills

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити Skills:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені Skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить Skills, щоб подальші оновлення могли й надалі виконувати розв’язання через ClawHub.

## Знайти й установити Plugin

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити Plugin, розміщений у ClawHub, із явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені Plugin:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через ClawHub, а не через npm чи інше джерело.

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

## Опублікувати Skills

Skills — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові Skills починаються з `1.0.0`; подальші зміни автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або `--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні змінні середовища, інструменти та дозволи, щоб користувачі могли зрозуміти, що потрібно Skills, перш ніж установлювати його. Див. [Формат Skills](/uk/clawhub/skill-format).

Для репозиторіїв, що містять кілька Skills, багаторазовий робочий процес GitHub викликає `skill publish` для кожної безпосередньої папки Skills у `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікувати Plugin

Опублікуйте Plugin з локальної папки, репозиторію GitHub, ref GitHub або наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використовуйте `--dry-run`, щоб попередньо переглянути розв’язані метадані пакета, поля сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові Plugin повинні містити метадані сумісності OpenClaw у `package.json`, зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами деталізації CLI, щоб перевірити метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні списки показують найновіший стан сканування. Релізи, які утримуються або заблоковані модерацією, можуть бути приховані з поверхонь пошуку та встановлення, доки проблему не буде вирішено.
