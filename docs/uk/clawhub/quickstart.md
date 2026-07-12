---
read_when:
    - Перше використання ClawHub
    - Встановлення Skills або Plugin із реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, установлюйте, оновлюйте й публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-07-12T13:03:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр Skills і плагінів для OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`, коли входите в систему, публікуєте, керуєте власними записами в каталозі або використовуєте специфічні для реєстру робочі процеси.

## Пошук і встановлення Skills

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Установлення Skills:

```bash
openclaw skills install @openclaw/demo
```

Оновлення встановлених Skills:

```bash
openclaw skills update --all
```

OpenClaw записує джерело Skills, щоб подальші оновлення й надалі могли виконуватися через ClawHub.

## Пошук і встановлення плагіна

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Установлення плагіна, розміщеного на ClawHub, із явним зазначенням ClawHub як джерела:

```bash
openclaw plugins install clawhub:<package>
```

Оновлення встановлених плагінів:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, якщо хочете, щоб OpenClaw отримував пакет через ClawHub, а не через npm чи інше джерело.

## Вхід для публікації

Установіть CLI ClawHub:

```bash
npm i -g clawhub
# або
pnpm add -g clawhub
```

Увійдіть за допомогою GitHub:

```bash
clawhub login
clawhub whoami
```

У середовищах без графічного інтерфейсу можна використовувати токен API з вебінтерфейсу ClawHub:

```bash
clawhub login --token clh_...
```

## Публікація Skills

Skills — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускає вміст без змін. Нові Skills починаються з версії `1.0.0`; подальші зміни автоматично публікують наступну патч-версію. Використовуйте `--dry-run` для попереднього перегляду або `--version`, щоб явно вибрати версію.

Перед публікацією перевірте метадані у файлі `SKILL.md`. Укажіть необхідні змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що потрібно Skills, перш ніж установлювати їх. Див. [Формат Skills](/uk/clawhub/skill-format).

Для репозиторіїв із кількома Skills багаторазово використовуваний робочий процес GitHub викликає `skill publish` для кожної безпосередньої папки Skills у каталозі `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Публікація плагіна

Опублікуйте плагін із локальної папки, репозиторію GitHub, посилання GitHub або наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використовуйте `--dry-run`, щоб без публікації попередньо переглянути визначені метадані пакета, поля сумісності, відомості про джерело та план завантаження.

Плагіни коду повинні містити в `package.json` метадані сумісності з OpenClaw, зокрема `openclaw.compat.pluginApi` та `openclaw.build.openclawVersion`.

## Перевірка перед установленням

Перед установленням скористайтеся вебсторінкою ClawHub або командами CLI для перегляду відомостей, щоб перевірити метадані, посилання на джерело, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

У загальнодоступних записах відображається останній стан сканування. Випуски, призупинені або заблоковані модерацією, можуть бути приховані в інтерфейсах пошуку та встановлення до розв’язання проблеми.
