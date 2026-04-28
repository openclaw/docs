---
read_when:
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin до реєстру
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр Skills і плагінів OpenClaw, нативні потоки встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-28T11:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc87e184ad9d00185880d6a1fe9f78e04ad2a8223490f9edacf09288489ffe4c
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **навичок і плагінів OpenClaw**.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення навичок, а також для встановлення плагінів із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

<Steps>
  <Step title="Пошук">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Встановлення">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Використання">
    Запустіть новий сеанс OpenClaw — він підхопить нову навичку.
  </Step>
  <Step title="Публікація (необов’язково)">
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
  <Tab title="Плагіни">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Прості npm-сумісні специфікації плагінів також спочатку перевіряються в ClawHub перед npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, коли потрібне розв’язання лише через npm без
    пошуку в ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тому
    несумісні хости рано завершуються закритою помилкою замість часткового встановлення
    пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства плагінів.
Якщо пакет ClawHub насправді є навичкою, OpenClaw зупиняється й
натомість вказує на `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також завершуються закритою помилкою для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можна встановити, але OpenClaw
попереджає, щоб оператори могли переглянути джерело й перевірку перед їх увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для навичок і плагінів OpenClaw.
- Версійне сховище пакетів навичок і метаданих.
- Поверхня для виявлення через пошук, теги та сигнали використання.

Типова навичка — це версійний пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує навичка.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані для забезпечення виявлення й безпечного показу
можливостей навичок. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження навичок

Окремий CLI `clawhub` також встановлює навички в `./skills` у
вашому поточному робочому каталозі. Якщо робочий простір OpenClaw налаштовано,
`clawhub` відступає до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує навички робочого простору з
`<workspace>/skills` і підхоплює їх у **наступному** сеансі.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані навички, навички
робочого простору мають пріоритет. Докладніше про те, як навички завантажуються,
поширюються й обмежуються, див. [Skills](/uk/tools/skills).

## Можливості сервісу

| Функція            | Примітки                                                   |
| ------------------ | ---------------------------------------------------------- |
| Публічний перегляд | Навички та їхній вміст `SKILL.md` доступні для публічного перегляду. |
| Пошук              | На основі embedding (векторний пошук), не лише ключові слова. |
| Версіонування      | Semver, журнали змін і теги (зокрема `latest`).            |
| Завантаження       | Zip для кожної версії.                                     |
| Зірки й коментарі  | Відгуки спільноти.                                        |
| Модерація          | Схвалення й аудити.                                       |
| API, зручний для CLI | Придатний для автоматизації та скриптів.                 |

## Безпека й модерація

ClawHub відкритий за замовчуванням — будь-хто може завантажувати навички, але обліковому запису GitHub
має бути **щонайменше один тиждень**, щоб публікувати. Це сповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Звітування">
    - Будь-який користувач, що ввійшов у систему, може поскаржитися на навичку.
    - Причини скарги обов’язкові й записуються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Навички з понад 3 унікальними скаргами автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані навички, скасовувати приховування, видаляти їх або блокувати користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в OpenClaw Discord і зв’яжіться з модератором або мейнтейнером.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Це потрібно лише для робочих процесів з автентифікацією в реєстрі, як-от
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. Типово: поточний каталог; відступає до робочого простору OpenClaw.
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
  Вивести версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Автентифікація (вхід / вихід / хто я)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставте API-токен.
    - `--label <label>` — мітка, збережена для токенів входу через браузер (типово: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає навички. Для виявлення плагінів/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимальна кількість результатів.

  </Accordion>
  <Accordion title="Перегляд / інспектування плагінів">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення плагінів/пакетів та інспектування метаданих. Нативні встановлення OpenClaw і далі використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати сімейство пакетів.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, які виконують код.
    - `--version <version>` / `--tag <tag>` — інспектувати конкретну версію пакета.
    - `--versions`, `--files`, `--file <path>` — інспектувати історію та файли пакета.
    - `--json` — машинозчитуваний вивід.

  </Accordion>
  <Accordion title="Встановлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` — встановити або оновити до конкретної версії (лише один slug для `update`).
    - `--force` — перезаписати, якщо папка вже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація навичок">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug навички.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — semver-версія.
    - `--changelog <text>` — текст журналу змін (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).

  </Accordion>
  <Accordion title="Публікація плагінів">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL-адресою GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — вивести машинозчитуваний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автовиявлення недостатньо.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканувати локальне + публікувати нове або оновлене)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що було б завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (типово: `patch`).
    - `--changelog <text>` — журнал змін для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).
    - `--concurrency <n>` — перевірки реєстру (типово: `4`).

  </Accordion>
</AccordionGroup>

## Поширені робочі процеси

<Tabs>
  <Tab title="Пошук">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Знайти плагін">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Встановлення">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Оновити все">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Опублікувати одну навичку">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Синхронізувати багато навичок">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Опублікувати плагін із GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Метадані пакета плагіна

Кодові плагіни мають містити обов’язкові метадані OpenClaw у
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
`runtimeExtensions` на цей вивід. Встановлення з Git checkout усе ще можуть
відступати до TypeScript-джерел, коли зібраних файлів немає, але зібрані runtime-записи
уникають runtime-компіляції TypeScript у шляхах запуску, doctor і
завантаження плагінів.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює новий **semver** `SkillVersion`.
    - Теги (як-от `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
    - Журнали змін прив’язуються до кожної версії та можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни та версії реєстру">
    Оновлення порівнюють локальний вміст skill з версіями реєстру за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою
    версією, CLI запитує підтвердження перед перезаписом (або вимагає `--force`
    у неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування синхронізації та резервні корені">
    `clawhub sync` спершу сканує ваш поточний робочий каталог. Якщо skills
    не знайдено, команда повертається до відомих застарілих розташувань
    (наприклад, `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено
    для пошуку старіших встановлень skill без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище та lockfile">
    - Установлені skills записуються в `.clawhub/lock.json` у вашому робочому каталозі.
    - Токени автентифікації зберігаються у файлі конфігурації ClawHub CLI (можна перевизначити через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (кількість встановлень)">
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
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                   |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.              |

## Пов’язане

- [Спільнотні plugins](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
