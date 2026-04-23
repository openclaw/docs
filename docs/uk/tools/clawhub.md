---
read_when:
    - Знайомство нових користувачів із ClawHub
    - Установлення, пошук або публікація Skills чи plugins
    - Пояснення прапорців CLI ClawHub і поведінки синхронізації
summary: 'Посібник ClawHub: публічний registry, нативні потоки встановлення OpenClaw і робочі процеси CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-23T21:13:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47bcec99e4a807773dc84e1dfd974c87ccca99022a680c31086da26a9a69478b
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub — це публічний registry для **Skills і plugins OpenClaw**.

- Використовуйте нативні команди `openclaw`, щоб шукати/встановлювати/оновлювати Skills і встановлювати
  plugins з ClawHub.
- Використовуйте окремий CLI `clawhub`, коли вам потрібні auth реєстру, публікація, видалення,
  відновлення видалення або робочі процеси sync.

Сайт: [clawhub.ai](https://clawhub.ai)

## Нативні потоки OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Прості plugin-spec, безпечні для npm, також перевіряються в ClawHub до npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Нативні команди `openclaw` встановлюють у ваш активний workspace і зберігають
метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

Під час встановлення plugin перевіряється заявлена сумісність `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву, тому несумісні хости завершуються в fail-closed режимі
рано, а не частково встановлюють пакет.

`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства plugins.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється і вказує вам на
`openclaw skills install <slug>`.

## Що таке ClawHub

- Публічний registry для Skills і plugins OpenClaw.
- Версійоване сховище bundle Skills і метаданих.
- Поверхня виявлення для search, tags і сигналів використання.

## Як це працює

1. Користувач публікує bundle Skill (файли + метадані).
2. ClawHub зберігає bundle, розбирає метадані та призначає версію.
3. Registry індексує Skill для search і виявлення.
4. Користувачі переглядають, завантажують і встановлюють Skills в OpenClaw.

## Що ви можете робити

- Публікувати нові Skills і нові версії наявних Skills.
- Знаходити Skills за назвою, tags або search.
- Завантажувати bundles Skills і переглядати їхні файли.
- Повідомляти про Skills, які є зловмисними або небезпечними.
- Якщо ви модератор, приховувати, показувати, видаляти або банити.

## Для кого це (зручно для початківців)

Якщо ви хочете додати нові можливості до свого агента OpenClaw, ClawHub — це найпростіший спосіб знайти й установити Skills. Вам не потрібно знати, як працює backend. Ви можете:

- Шукати Skills звичайною мовою.
- Установлювати Skill у свій workspace.
- Оновлювати Skills пізніше однією командою.
- Резервно копіювати власні Skills, публікуючи їх.

## Швидкий старт (нетехнічний)

1. Знайдіть те, що вам потрібно:
   - `openclaw skills search "calendar"`
2. Установіть Skill:
   - `openclaw skills install <skill-slug>`
3. Почніть нову сесію OpenClaw, щоб він підхопив новий Skill.
4. Якщо ви хочете публікувати або керувати auth реєстру, також установіть окремий
   CLI `clawhub`.

## Установлення CLI ClawHub

Він потрібен лише для робочих процесів, що потребують auth реєстру, наприклад publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Як це вбудовується в OpenClaw

Нативна команда `openclaw skills install` встановлює у каталог `skills/`
активного workspace. `openclaw plugins install clawhub:...` записує звичайне кероване
встановлення plugin плюс метадані джерела ClawHub для оновлень.

Анонімні встановлення plugins із ClawHub також завершуються в fail-closed режимі для приватних пакетів.
Спільнота або інші неофіційні канали все ще можуть виконувати встановлення, але OpenClaw попереджає,
щоб оператори могли перевірити джерело та верифікацію перед увімкненням.

Окремий CLI `clawhub` також встановлює Skills у `./skills` у вашому
поточному робочому каталозі. Якщо налаштовано workspace OpenClaw, `clawhub`
повертається до цього workspace, якщо ви не перевизначите `--workdir` (або
`CLAWHUB_WORKDIR`). OpenClaw завантажує Skills workspace з `<workspace>/skills`
і підхопить їх у **наступній** сесії. Якщо ви вже використовуєте
`~/.openclaw/skills` або вбудовані Skills, Skills workspace мають пріоритет.

Докладніше про те, як Skills завантажуються, спільно використовуються та обмежуються, див. у
[Skills](/uk/tools/skills).

## Огляд системи Skills

Skill — це версійований bundle файлів, який навчає OpenClaw виконувати
конкретне завдання. Кожна публікація створює нову версію, і registry зберігає
історію версій, щоб користувачі могли перевіряти зміни.

Типовий Skill включає:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові config, scripts або допоміжні файли, які використовує Skill.
- Метадані, такі як tags, summary і вимоги до встановлення.

ClawHub використовує метадані для пошуку та безпечного відображення можливостей Skill.
Registry також відстежує сигнали використання (наприклад, stars і downloads), щоб покращувати
ранжування і видимість.

## Що надає сервіс (можливості)

- **Публічний перегляд** Skills і їхнього вмісту `SKILL.md`.
- **Search** на основі embeddings (vector search), а не лише ключових слів.
- **Версійність** із semver, changelogs і tags (включно з `latest`).
- **Downloads** як zip для кожної версії.
- **Stars і comments** для відгуків спільноти.
- **Hooks модерації** для схвалень і аудитів.
- **CLI-friendly API** для автоматизації та скриптів.

## Безпека і модерація

ClawHub за замовчуванням відкритий. Завантажувати Skills може будь-хто, але для публікації
обліковий запис GitHub має існувати щонайменше один тиждень. Це допомагає стримувати зловживання, не блокуючи
добросовісних учасників.

Повідомлення та модерація:

- Будь-який користувач, який увійшов, може поскаржитися на Skill.
- Причини скарги є обов’язковими й записуються.
- Кожен користувач може мати одночасно до 20 активних скарг.
- Skills із більш ніж 3 унікальними скаргами типово автоматично приховуються.
- Модератори можуть переглядати приховані Skills, повертати їх, видаляти або банити користувачів.
- Зловживання системою скарг може призвести до бану облікового запису.

Хочете стати модератором? Запитайте в OpenClaw Discord і зв’яжіться з
модератором або супровідником.

## Команди CLI і параметри

Глобальні параметри (застосовуються до всіх команд):

- `--workdir <dir>`: Робочий каталог (типово: поточний каталог; повертається до workspace OpenClaw).
- `--dir <dir>`: Каталог Skills, відносно workdir (типово: `skills`).
- `--site <url>`: Base URL сайту (вхід через браузер).
- `--registry <url>`: Base URL API реєстру.
- `--no-input`: Вимкнути запити (неінтерактивний режим).
- `-V, --cli-version`: Вивести версію CLI.

Auth:

- `clawhub login` (потік через браузер) або `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Параметри:

- `--token <token>`: Вставити API-токен.
- `--label <label>`: Мітка, що зберігається для токенів входу через браузер (типово: `CLI token`).
- `--no-browser`: Не відкривати браузер (потребує `--token`).

Search:

- `clawhub search "query"`
- `--limit <n>`: Максимум результатів.

Install:

- `clawhub install <slug>`
- `--version <version>`: Установити конкретну версію.
- `--force`: Перезаписати, якщо каталог уже існує.

Update:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Оновити до конкретної версії (лише для одного slug).
- `--force`: Перезаписати, коли локальні файли не відповідають жодній опублікованій версії.

List:

- `clawhub list` (читає `.clawhub/lock.json`)

Публікація Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug Skill.
- `--name <name>`: Відображувана назва.
- `--version <version>`: Версія semver.
- `--changelog <text>`: Текст changelog (може бути порожнім).
- `--tags <tags>`: Tags, розділені комами (типово: `latest`).

Публікація plugins:

- `clawhub package publish <source>`
- `<source>` може бути локальним каталогом, `owner/repo`, `owner/repo@ref` або URL GitHub.
- `--dry-run`: Побудувати точний план публікації без завантаження будь-чого.
- `--json`: Виводити результат у форматі для машинного читання для CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Необов’язкові перевизначення, коли автоматичного виявлення недостатньо.

Delete/undelete (лише власник/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (сканувати локальні Skills + публікувати нові/оновлені):

- `clawhub sync`
- `--root <dir...>`: Додаткові корені для сканування.
- `--all`: Завантажити все без запитів.
- `--dry-run`: Показати, що буде завантажено.
- `--bump <type>`: `patch|minor|major` для оновлень (типово: `patch`).
- `--changelog <text>`: Текст changelog для неінтерактивних оновлень.
- `--tags <tags>`: Tags, розділені комами (типово: `latest`).
- `--concurrency <n>`: Перевірки реєстру (типово: 4).

## Типові робочі процеси для агентів

### Пошук Skills

```bash
clawhub search "postgres backups"
```

### Завантаження нових Skills

```bash
clawhub install my-skill-pack
```

### Оновлення встановлених Skills

```bash
clawhub update --all
```

### Резервне копіювання ваших Skills (publish або sync)

Для одного каталогу Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Щоб просканувати і зберегти багато Skills одразу:

```bash
clawhub sync --all
```

### Публікація plugin з GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Code plugins повинні містити обов’язкові метадані OpenClaw у `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Опубліковані пакети мають постачатися зі зібраним JavaScript і вказувати `runtimeExtensions`
на цей вивід. Встановлення з git checkout усе ще можуть повертатися до вихідного TypeScript,
коли зібрані файли відсутні, але зібрані runtime entries дозволяють уникнути runtime-компіляції TypeScript
у шляхах startup, doctor і завантаження plugin.

## Додаткові подробиці (технічні)

### Версійність і tags

- Кожна публікація створює нову **semver** `SkillVersion`.
- Tags (наприклад, `latest`) вказують на версію; переміщення tags дає змогу робити rollback.
- Changelogs додаються до кожної версії і можуть бути порожніми під час sync або публікації оновлень.

### Локальні зміни vs версії в registry

Оновлення порівнюють локальний вміст Skill із версіями в registry за допомогою content hash. Якщо локальні файли не відповідають жодній опублікованій версії, CLI запитує перед перезаписом (або потребує `--force` у неінтерактивному режимі).

### Сканування sync і резервні корені

`clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не знайдено, він повертається до відомих legacy-розташувань (наприклад, `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено, щоб знаходити старі встановлення Skills без додаткових прапорців.

### Сховище і lockfile

- Установлені Skills записуються в `.clawhub/lock.json` у вашому workdir.
- Токени auth зберігаються у config-файлі CLI ClawHub (можна перевизначити через `CLAWHUB_CONFIG_PATH`).

### Telemetry (лічильники встановлень)

Коли ви запускаєте `clawhub sync`, будучи залогіненим, CLI надсилає мінімальний знімок для обчислення кількості встановлень. Це можна повністю вимкнути:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Змінні середовища

- `CLAWHUB_SITE`: Перевизначити URL сайту.
- `CLAWHUB_REGISTRY`: Перевизначити URL API реєстру.
- `CLAWHUB_CONFIG_PATH`: Перевизначити місце, де CLI зберігає токен/config.
- `CLAWHUB_WORKDIR`: Перевизначити типовий workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Вимкнути telemetry для `sync`.
