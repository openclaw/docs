---
read_when:
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або плагінів у реєстрі
    - Налаштування CLI clawhub або перевизначень його середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для Skills і плагінів OpenClaw, нативні сценарії встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-27T19:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c67e20db6d267c9c256c3f72badc76b5f92e79b84c8c0dc3b6f13769de50c3e4
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub — це публічний реєстр для **Skills і плагінів OpenClaw**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та сценаріїв синхронізації.

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
    Запустіть нову сесію OpenClaw — вона підхопить новий Skill.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для сценаріїв з автентифікацією в реєстрі (публікація, синхронізація, керування) встановіть
    окремий CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # або
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Нативні сценарії OpenClaw

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

    Базові специфікації плагінів, безпечні для npm, також перевіряються в ClawHub перед npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, якщо вам потрібне лише розв’язання через npm без
    звернення до ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Під час встановлення плагінів перевіряється сумісність заявлених `pluginApi` і
    `minGatewayVersion` перед запуском встановлення архіву, тому
    несумісні хости заздалегідь безпечно зупиняються замість часткового встановлення
    пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише сімейства плагінів,
які можна встановити. Якщо пакет ClawHub насправді є Skill, OpenClaw зупиниться й
натомість вкаже вам на `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також безпечно зупиняються для приватних пакетів.
Пакети зі спільноти або інших неофіційних каналів усе ще можна встановити, але OpenClaw
попереджає, щоб оператори могли перевірити джерело й верифікацію перед
увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для Skills і плагінів OpenClaw.
- Версійоване сховище пакетів Skills і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий Skill — це версійований пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і способом використання.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує Skill.
- Метадані, як-от теги, підсумок і вимоги до встановлення.

ClawHub використовує метадані, щоб забезпечувати виявлення й безпечно відкривати
можливості Skills. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову версію semver,
а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження Skills

Окремий CLI `clawhub` також встановлює Skills у `./skills` у
вашому поточному робочому каталозі. Якщо налаштовано робочий простір OpenClaw,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills,
Skills робочого простору мають пріоритет. Докладніше про те, як Skills завантажуються,
поширюються й проходять контроль, дивіться в [Skills](/uk/tools/skills).

## Можливості сервісу

| Можливість        | Примітки                                                   |
| ----------------- | ---------------------------------------------------------- |
| Публічний перегляд | Skills і вміст їхнього `SKILL.md` доступні для публічного перегляду. |
| Пошук             | На основі embedding (векторний пошук), а не лише ключових слів. |
| Версіонування     | Semver, changelog-и й теги (зокрема `latest`).             |
| Завантаження      | Zip для кожної версії.                                     |
| Зірки та коментарі | Відгуки спільноти.                                        |
| Модерація         | Схвалення й аудити.                                        |
| API, зручний для CLI | Підходить для автоматизації та скриптів.                |

## Безпека та модерація

ClawHub за замовчуванням відкритий — будь-хто може завантажувати Skills, але обліковий запис GitHub
має бути **щонайменше тижневої давності**, щоб публікувати. Це уповільнює
зловживання, не блокуючи добросовісних учасників.

<AccordionGroup>
  <Accordion title="Повідомлення">
    - Будь-який користувач, який увійшов у систему, може поскаржитися на Skill.
    - Причини скарги є обов’язковими та фіксуються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Skills із більш ніж 3 унікальними скаргами автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, робити їх видимими, видаляти або блокувати користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з модератором або супроводжувачем.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Вам потрібен він лише для сценаріїв з автентифікацією в реєстрі, таких як
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. За замовчуванням: поточний каталог; повертається до робочого простору OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Каталог Skills, відносно workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Базовий URL сайту (вхід через браузер).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Базовий URL API реєстру.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Вимкнути запити (неінтерактивний режим).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Вивести версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Автентифікація (login / logout / whoami)">
    ```bash
    clawhub login              # сценарій через браузер
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставити API-токен.
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (за замовчуванням: `CLI token`).
    - `--no-browser` — не відкривати браузер (потребує `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає Skills. Для виявлення плагінів/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимальна кількість результатів.

  </Accordion>
  <Accordion title="Перегляд / інспектування плагінів">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення плагінів/пакетів та інспектування метаданих. Нативне встановлення в OpenClaw, як і раніше, використовує `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтр за сімейством пакета.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, які виконують код.
    - `--version <version>` / `--tag <tag>` — інспектувати конкретну версію пакета.
    - `--versions`, `--files`, `--file <path>` — інспектувати історію версій пакета та файли.
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

    - `--version <version>` — встановити або оновити до конкретної версії (для `update` лише один slug).
    - `--force` — перезаписати, якщо папка вже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug Skill.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — версія semver.
    - `--changelog <text>` — текст changelog (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).

  </Accordion>
  <Accordion title="Публікація плагінів">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — вивести машинозчитуваний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, якщо автоматичного визначення недостатньо.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканування локально + публікація нових або оновлених)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові кореневі каталоги для сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що буде завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (за замовчуванням: `patch`).
    - `--changelog <text>` — changelog для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).
    - `--concurrency <n>` — перевірки реєстру (за замовчуванням: `4`).

  </Accordion>
</AccordionGroup>

## Поширені сценарії

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
  <Tab title="Опублікувати один Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Синхронізувати багато Skills">
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

### Метадані пакетів плагінів

Плагіни коду повинні містити обов’язкові метадані OpenClaw у
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

Опубліковані пакети повинні постачатися зі **зібраним JavaScript** і вказувати
`runtimeExtensions` на цей вивід. Установлення з Git checkout усе ще можуть
повертатися до вихідного коду TypeScript, якщо зібрані файли відсутні, але зібрані runtime-
точки входу дають змогу уникнути runtime-компіляції TypeScript під час запуску,
doctor і в шляхах завантаження плагінів.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює новий `SkillVersion` **semver**.
    - Теги (наприклад, `latest`) вказують на версію; переміщення тегів дає змогу виконати відкат.
    - Changelog-и прив’язуються до кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни проти версій у реєстрі">
    Оновлення порівнюють локальний вміст Skill із версіями в реєстрі за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою версією,
    CLI запитає підтвердження перед перезаписом (або вимагатиме `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування під час синхронізації та резервні кореневі каталоги">
    `clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не
    знайдено, він повертається до відомих застарілих розташувань (наприклад,
    `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено для того, щоб
    знаходити старі встановлення Skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище та lockfile">
    - Установлені Skills записуються в `.clawhub/lock.json` у вашому workdir.
    - Токени автентифікації зберігаються у файлі конфігурації CLI ClawHub (перевизначається через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (кількість встановлень)">
    Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний
    знімок для обчислення кількості встановлень. Ви можете повністю це вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Змінна                       | Ефект                                          |
| ---------------------------- | ---------------------------------------------- |
| `CLAWHUB_SITE`               | Перевизначає URL сайту.                        |
| `CLAWHUB_REGISTRY`           | Перевизначає URL API реєстру.                  |
| `CLAWHUB_CONFIG_PATH`        | Перевизначає місце, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`            | Перевизначає workdir за замовчуванням.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію для `sync`.                |

## Пов’язане

- [Плагіни спільноти](/uk/plugins/community)
- [Плагіни](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
