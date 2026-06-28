---
read_when:
    - Вперше користуєтеся ClawHub
    - Встановлення Skills або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте та публікуйте навички або плагіни.'
x-i18n:
    generated_at: "2026-06-28T00:11:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр Skills і plugins для OpenClaw.

Використовуйте OpenClaw, коли встановлюєте компоненти в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в обліковий запис, публікуєте, керуєте власними списками або використовуєте
специфічні для реєстру робочі процеси.

## Знайти й установити skill

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установити skill:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені skills:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить skill, щоб подальші оновлення могли й надалі
вирішуватися через ClawHub.

## Знайти й установити plugin

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установити plugin, розміщений на ClawHub, з явним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновити встановлені plugins:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw вирішував пакет через
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

Середовища без графічного інтерфейсу можуть використовувати токен API з вебінтерфейсу ClawHub:

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
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові навички починаються з `1.0.0`; подальші зміни
автоматично публікують наступну патч-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти та дозволи, щоб користувачі могли зрозуміти, що
потрібно навичці, перш ніж встановлювати її. Див. [Формат навички](/uk/clawhub/skill-format).

Для репозиторіїв із кількома навичками багаторазовий workflow GitHub викликає
`skill publish` для кожної безпосередньої папки навички в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікуйте Plugin

Опублікуйте Plugin з локальної папки, репозиторію GitHub, ref GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використовуйте `--dry-run`, щоб переглянути визначені метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові Plugin мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірте перед встановленням

Перед встановленням скористайтеся вебсторінкою ClawHub або командами деталізації CLI, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні списки показують останній стан сканування. Релізи, затримані або заблоковані
модерацією, можуть бути приховані з пошуку та поверхонь встановлення, доки проблему не буде вирішено.
