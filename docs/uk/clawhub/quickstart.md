---
read_when:
    - Перше використання ClawHub
    - Встановлення Skills або Plugin із реєстру
    - Публікація в ClawHub
summary: 'Почніть користуватися ClawHub: знаходьте, встановлюйте, оновлюйте й публікуйте Skills або плагіни.'
x-i18n:
    generated_at: "2026-07-16T17:43:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Швидкий старт

ClawHub — це реєстр навичок і плагінів OpenClaw.

Використовуйте OpenClaw, коли встановлюєте щось в OpenClaw. Використовуйте CLI `clawhub`,
коли входите в систему, публікуєте, керуєте власними записами або використовуєте
специфічні для реєстру робочі процеси.

## Пошук і встановлення навички

Пошук з OpenClaw:

```bash
openclaw skills search "calendar"
```

Встановлення навички:

```bash
openclaw skills install @openclaw/demo
```

Оновлення встановлених навичок:

```bash
openclaw skills update --all
```

OpenClaw записує джерело навички, щоб подальші оновлення й надалі можна було
отримувати через ClawHub.

## Пошук і встановлення плагіна

Пошук з OpenClaw:

```bash
openclaw plugins search "calendar"
```

Встановлення плагіна, розміщеного в ClawHub, із явно вказаним джерелом ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Оновлення встановлених плагінів:

```bash
openclaw plugins update --all
```

Використовуйте префікс `clawhub:`, якщо потрібно, щоб OpenClaw отримував пакет через
ClawHub, а не через npm чи інше джерело.

## Вхід для публікації

Встановіть CLI ClawHub:

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

## Публікація навички

Навичка — це папка з обов’язковим файлом `SKILL.md` і необов’язковими допоміжними
файлами.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Команда пропускає незмінений вміст. Нові навички починаються з версії `1.0.0`; подальші зміни
автоматично публікують наступну версію виправлення. Використовуйте `--dry-run` для попереднього перегляду або
`--version`, щоб явно вибрати версію.

Перед публікацією перевірте метадані в `SKILL.md`. Оголосіть необхідні
змінні середовища, інструменти й дозволи, щоб користувачі могли зрозуміти, що
потрібно навичці, перш ніж її встановлювати. Див. [Формат навички](/uk/clawhub/skill-format).

Для репозиторіїв із кількома навичками багаторазово використовуваний робочий процес GitHub викликає
`skill publish` для кожної безпосередньої папки навички в `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Публікація плагіна

Опублікуйте плагін із локальної папки, репозиторію GitHub, посилання GitHub або
наявного архіву:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Спочатку використовуйте `--dry-run`, щоб переглянути визначені метадані пакета, поля
сумісності, відомості про джерело та план завантаження без публікації.

Плагіни коду повинні містити метадані сумісності з OpenClaw у `package.json`,
зокрема `openclaw.compat.pluginApi` і `openclaw.build.openclawVersion`.

## Перевірка перед встановленням

Перед встановленням скористайтеся вебсторінкою ClawHub або командами CLI для перегляду подробиць, щоб перевірити
метадані, посилання на джерела, версії, журнали змін і стан сканування:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

У загальнодоступних записах відображається останній стан сканування. Випуски, затримані або заблоковані
модерацією, можуть бути приховані в інтерфейсах пошуку та встановлення до розв’язання проблеми.
