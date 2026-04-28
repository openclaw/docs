---
read_when:
    - Пошук, встановлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin у реєстрі
    - Налаштування CLI ClawHub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для OpenClaw Skills і плагінів, нативні процеси встановлення та clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-28T23:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **OpenClaw Skills і плагінів**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    Запустіть новий сеанс OpenClaw — він підхопить новий Skill.
  </Step>
  <Step title="Publish (optional)">
    Для робочих процесів з автентифікацією в реєстрі (публікація, синхронізація, керування) встановіть
    окремий CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Нативні потоки OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні команди `openclaw` встановлюють у ваш активний робочий простір і
    зберігають метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Специфікації плагінів, безпечні для npm, також спочатку перевіряються в ClawHub перед npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, коли потрібне розв’язання лише через npm без
    пошуку в ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тож
    несумісні хости завершуються із закритою відмовою рано, а не частково встановлюють
    пакет.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства плагінів. Якщо пакет ClawHub насправді є Skill, OpenClaw зупиняється й
натомість вказує на `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також завершуються із закритою відмовою для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можуть встановлюватися, але OpenClaw
попереджає, щоб оператори могли перевірити джерело та верифікацію перед увімкненням
їх.
</Note>

## Що таке ClawHub

- Публічний реєстр для OpenClaw Skills і плагінів.
- Версійне сховище пакетів Skills і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий Skill — це версійний пакет файлів, що містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує Skill.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані, щоб забезпечувати виявлення та безпечно показувати
можливості Skills. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування та видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли аудитувати
зміни.

## Робочий простір і завантаження Skills

Окремий CLI `clawhub` також встановлює Skills у `./skills` у
вашому поточному робочому каталозі. Якщо робочий простір OpenClaw налаштовано,
`clawhub` використовує цей робочий простір як резервний, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступному** сеансі.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills, Skills
робочого простору мають пріоритет. Докладніше про те, як Skills завантажуються,
поширюються та обмежуються, див. [Skills](/uk/tools/skills).

## Функції сервісу

| Функція                  | Примітки                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Публічний перегляд       | Skills і їхній вміст `SKILL.md` доступні для публічного перегляду.  |
| Пошук                    | На основі embeddings (векторний пошук), не лише ключові слова.      |
| Версіювання              | Semver, журнали змін і теги (зокрема `latest`).                     |
| Завантаження             | Zip для кожної версії.                                               |
| Зірки та коментарі       | Відгуки спільноти.                                                  |
| Підсумки сканування безпеки | Сторінки деталей показують останній стан сканування перед встановленням або завантаженням. |
| Сторінки деталей сканера | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання. |
| Панель відновлення власника | Видавці можуть бачити власний вміст, утриманий скануванням, з `/dashboard`. |
| Повторні сканування на запит власника | Власники можуть запитувати обмежені повторні сканування для відновлення після хибнопозитивних спрацювань. |
| Модерація                | Схвалення та аудити.                                                |
| API, зручний для CLI     | Підходить для автоматизації та скриптів.                            |

## Безпека та модерація

ClawHub відкритий за замовчуванням — будь-хто може завантажувати Skills, але обліковий запис GitHub
має бути **щонайменше один тиждень старим**, щоб публікувати. Це сповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub виконує автоматизовані перевірки безпеки опублікованих Skills і релізів плагінів.
    Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на окремі сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Релізи, утримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі та
    поверхнях встановлення, але все ще видимі їхньому власнику в `/dashboard`.

  </Accordion>
  <Accordion title="Reporting">
    - Будь-який користувач, що ввійшов у систему, може поскаржитися на Skill.
    - Причини скарги обов’язкові та записуються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Skills з понад 3 унікальними скаргами автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Moderation">
    - Модератори можуть переглядати приховані Skills, показувати їх знову, видаляти їх або блокувати користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в OpenClaw Discord і зв’яжіться з модератором або мейнтейнером.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Це потрібно лише для робочих процесів з автентифікацією в реєстрі, як-от
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. За замовчуванням: поточний каталог; резервно використовує робочий простір OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Каталог Skills, відносно workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Базова URL-адреса сайту (вхід через браузер).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Базова URL-адреса API реєстру.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Вимкнути запити (неінтерактивний режим).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Надрукувати версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставити API-токен.
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (за замовчуванням: `CLI token`).
    - `--no-browser` — не відкривати браузер (потребує `--token`).

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    Шукає Skills. Для виявлення плагінів/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимальна кількість результатів.

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення плагінів/пакетів і перевірки метаданих. Нативні встановлення OpenClaw усе ще використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати сімейство пакетів.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, що виконують код.
    - `--version <version>` / `--tag <tag>` — перевірити конкретну версію пакета.
    - `--versions`, `--files`, `--file <path>` — перевірити історію та файли пакета.
    - `--json` — машиночитний вивід.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` — встановити або оновити до конкретної версії (лише один slug для `update`).
    - `--force` — перезаписати, якщо папка вже існує або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug Skill.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — semver-версія.
    - `--changelog <text>` — текст журналу змін (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL-адресою GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — вивести машиночитний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автоматичного виявлення недостатньо.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токен власника, що ввійшов у систему, і націлюються на останню
    опубліковану версію Skill або реліз плагіна. У неінтерактивних запусках передавайте
    `--yes`.

    JSON-відповіді містять тип цілі, назву, версію, статус повторного сканування та
    решту/максимум кількості запитів для цієї версії або релізу.

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що було б завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (за замовчуванням: `patch`).
    - `--changelog <text>` — журнал змін для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).
    - `--concurrency <n>` — перевірки реєстру (за замовчуванням: `4`).

  </Accordion>
</AccordionGroup>

## Поширені робочі процеси

<Tabs>
  <Tab title="Пошук">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Знайти plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Установлення">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Оновити все">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Опублікувати один skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Синхронізувати багато skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Опублікувати plugin з GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Метадані пакета Plugin

Кодові plugins мають містити обов’язкові метадані OpenClaw у
`package.json`:

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

Опубліковані пакети мають постачати **зібраний JavaScript** і вказувати
`runtimeExtensions` на цей результат. Установлення з Git checkout усе ще можуть
повертатися до вихідного коду TypeScript, коли зібраних файлів немає, але зібрані записи runtime
уникають компіляції TypeScript під час виконання в шляхах запуску, doctor і
завантаження plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування і теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (як-от `latest`) указують на версію; переміщення тегів дає змогу виконати відкат.
    - Журнали змін прив’язуються до кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни проти версій у registry">
    Оновлення порівнюють вміст локального skill із версіями в registry за допомогою
    хешу вмісту. Якщо локальні файли не відповідають жодній опублікованій версії,
    CLI запитує перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спершу сканує ваш поточний робочий каталог. Якщо skills не
    знайдено, він повертається до відомих застарілих розташувань (наприклад,
    `~/openclaw/skills` і `~/.openclaw/skills`). Це спроєктовано для
    знаходження старіших установлених skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище і lockfile">
    - Установлені skills записуються в `.clawhub/lock.json` у вашому робочому каталозі.
    - Auth tokens зберігаються у файлі конфігурації ClawHub CLI (перевизначте через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (кількість установлень)">
    Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний
    знімок для обчислення кількості встановлень. Це можна повністю вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Змінна                        | Ефект                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту.                         |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API registry.                  |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає token/config. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.              |

## Пов’язане

- [Спільнотні plugins](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
