---
read_when:
    - Уперше користуєтеся ClawHub
    - Встановлення Skills або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте навички або плагіни.'
x-i18n:
    generated_at: "2026-07-03T23:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр для OpenClaw skills і plugins.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
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

Установити plugin, розміщений у ClawHub, з явним джерелом ClawHub:

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

Увійти через GitHub:

```bash
clawhub login
clawhub whoami
```

Безголові середовища можуть використовувати API-токен з вебінтерфейсу ClawHub:

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

Команда пропускає незмінений вміст. Нові skills починаються з `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти та дозволи, щоб користувачі могли зрозуміти, що потрібно
skill перед установленням. Див. [Формат skill](/uk/clawhub/skill-format).

Для репозиторіїв, що містять кілька skills, багаторазовий робочий процес GitHub викликає
`skill publish` для кожної безпосередньої папки skill у `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Опублікувати plugin

Опублікуйте plugin з локальної папки, репозиторію GitHub, ref GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спершу використовуйте `--dry-run`, щоб попередньо переглянути розпізнані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Code plugins мають містити метадані сумісності OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами деталізації CLI, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і статус сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні записи показують найновіший стан сканування. Релізи, утримані або заблоковані
модерацією, можуть бути приховані з пошуку й поверхонь установлення, доки це не буде вирішено.
