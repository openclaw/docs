---
read_when:
    - Перше використання ClawHub
    - Установлення Skills або Plugin з реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте Skills або Plugin.'
x-i18n:
    generated_at: "2026-06-27T17:17:19Z"
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
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
робочі процеси, специфічні для реєстру.

## Знайти та встановити навичку

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановити навичку:

```bash
openclaw skills install @openclaw/demo
```

Оновити встановлені навички:

```bash
openclaw skills update --all
```

OpenClaw записує, звідки походить навичка, щоб подальші оновлення могли й надалі
розв’язуватися через ClawHub.

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

Використовуйте префікс `clawhub:`, коли хочете, щоб OpenClaw розв’язував пакет через
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
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові навички починаються з `1.0.0`; подальші зміни
автоматично публікують наступну patch-версію. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб вибрати явну версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть потрібні
змінні середовища, інструменти та дозволи, щоб користувачі могли зрозуміти, що
потрібно навичці, перш ніж її встановити. Див. [Формат навички](/uk/clawhub/skill-format).

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

Опублікуйте плагін із локальної папки, репозиторію GitHub, GitHub ref або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використайте `--dry-run`, щоб переглянути розв’язані метадані пакета, поля
сумісності, атрибуцію джерела та план завантаження без публікації.

Кодові плагіни мають містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірити перед встановленням

Перед встановленням використайте вебсторінку ClawHub або команди CLI для детального перегляду, щоб перевірити
метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Публічні записи показують найновіший стан сканування. Релізи, які затримані або заблоковані
модерацією, можуть бути приховані з поверхонь пошуку та встановлення, доки проблему не буде вирішено.
