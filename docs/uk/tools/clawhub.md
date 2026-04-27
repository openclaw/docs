---
read_when:
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або плагінів у реєстрі
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для Skills і плагінів OpenClaw, нативних потоків встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-27T09:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71b0666f6013ef722bfa218c41f0b8f00ec056d5e39924193d8aaa8866203f46
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub — це публічний реєстр для **Skills і плагінів OpenClaw**.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення Skills, а також для встановлення плагінів із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та потоків синхронізації.

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
    Почніть нову сесію OpenClaw — вона підхопить новий skill.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для потоків, що потребують автентифікації в реєстрі (публікація, синхронізація, керування), встановіть
    окремий CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # або
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

    Нативні команди `openclaw` встановлюють у ваш активний робочий простір
    і зберігають метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

  </Tab>
  <Tab title="Плагіни">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Звичайні plugin-специфікації, безпечні для npm, також спочатку перевіряються в ClawHub, а вже потім у npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, якщо хочете примусово використовувати лише npm
    без звернення до ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення плагінів перевіряють заявлену сумісність `pluginApi` і
    `minGatewayVersion` перед запуском встановлення з архіву, щоб
    несумісні хости безпечно завершувалися помилкою на ранньому етапі, а не після часткового встановлення
    пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише придатні до встановлення сімейства плагінів. Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється і натомість пропонує `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також безпечно завершуються помилкою для приватних пакетів.
Спільнота або інші неофіційні канали все ще можуть виконувати встановлення, але OpenClaw
попереджає про це, щоб оператори могли перевірити джерело й верифікацію перед їх увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для Skills і плагінів OpenClaw.
- Версіоноване сховище пакетів Skills і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий skill — це версіонований пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і способом використання.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує skill.
- Метадані, такі як теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані для підтримки виявлення та безпечного розкриття
можливостей skill. Реєстр відстежує сигнали використання (уподобання, завантаження), щоб
покращувати ранжування та видимість. Кожна публікація створює нову semver-версію,
а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження Skills

Окремий CLI `clawhub` також встановлює Skills у `./skills` у межах
поточного робочого каталогу. Якщо налаштовано робочий простір OpenClaw,
`clawhub` переключається на цей робочий простір, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills,
Skills робочого простору мають вищий пріоритет. Докладніше про те, як Skills завантажуються,
спільно використовуються та контролюються, див. у [Skills](/uk/tools/skills).

## Можливості сервісу

| Feature            | Notes                                                      |
| ------------------ | ---------------------------------------------------------- |
| Публічний перегляд | Skills і їхній вміст `SKILL.md` доступні для публічного перегляду. |
| Пошук              | На основі embedding (векторний пошук), а не лише ключових слів. |
| Версіонування      | Semver, changelog-и та теги (зокрема `latest`).            |
| Завантаження       | Zip для кожної версії.                                     |
| Уподобання й коментарі | Відгуки спільноти.                                     |
| Модерація          | Затвердження та аудити.                                    |
| API, дружній до CLI | Підходить для автоматизації та скриптів.                  |

## Безпека та модерація

ClawHub за замовчуванням відкритий — будь-хто може завантажувати Skills, але для публікації
обліковий запис GitHub має бути **щонайменше тижневої давності**. Це сповільнює
зловживання, не блокуючи добросовісних учасників.

<AccordionGroup>
  <Accordion title="Повідомлення">
    - Будь-який авторизований користувач може поскаржитися на skill.
    - Причини скарг є обов’язковими та записуються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Skills із більш ніж 3 унікальними скаргами автоматично приховуються за замовчуванням.
  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, знову робити їх видимими, видаляти або банити користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з модератором або супроводжувачем.
  </Accordion>
</AccordionGroup>

## CLI ClawHub

Він потрібен лише для потоків, що потребують автентифікації в реєстрі, таких як
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. Типово: поточний каталог; із резервним переходом до робочого простору OpenClaw.
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
  Вимкнути запити вводу (неінтерактивний режим).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Вивести версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Автентифікація (login / logout / whoami)">
    ```bash
    clawhub login              # потік через браузер
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставити API-токен.
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (типово: `CLI token`).
    - `--no-browser` — не відкривати браузер (потребує `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — максимальна кількість результатів.

  </Accordion>
  <Accordion title="Встановлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` — установити або оновити до конкретної версії (лише один slug для `update`).
    - `--force` — перезаписати, якщо каталог уже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug skill.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — semver-версія.
    - `--changelog <text>` — текст changelog (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).

  </Accordion>
  <Accordion title="Публікація плагінів">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — вивести придатний для машинного читання результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, якщо автоматичного визначення недостатньо.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканувати локально + опублікувати нове або оновлене)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що було б завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (типово: `patch`).
    - `--changelog <text>` — changelog для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).
    - `--concurrency <n>` — перевірки реєстру (типово: `4`).

  </Accordion>
</AccordionGroup>

## Типові потоки

<Tabs>
  <Tab title="Пошук">
    ```bash
    clawhub search "postgres backups"
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
  <Tab title="Опублікувати один skill">
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

### Метадані пакета Plugin

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

Опубліковані пакети мають постачатися зі **зібраним JavaScript** і вказувати
`runtimeExtensions` на цей результат. Встановлення з git checkout усе ще можуть
переходити до вихідного TypeScript, якщо зібраних файлів немає, але зібрані runtime-записи
дозволяють уникати компіляції TypeScript під час запуску на етапах startup, doctor
і завантаження плагінів.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування та теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (наприклад, `latest`) вказують на версію; переміщення тегів дає змогу виконувати відкат.
    - Changelog-и додаються до кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.
  </Accordion>
  <Accordion title="Локальні зміни проти версій реєстру">
    Оновлення порівнюють локальний вміст skill із версіями реєстру за допомогою
    хеша вмісту. Якщо локальні файли не відповідають жодній опублікованій версії,
    CLI запитує підтвердження перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування під час синхронізації та резервні корені">
    `clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не
    знайдено, він переходить до відомих успадкованих розташувань (наприклад,
    `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено для того, щоб
    знаходити старі встановлення Skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище та lockfile">
    - Установлені Skills записуються в `.clawhub/lock.json` у межах вашого workdir.
    - Токени автентифікації зберігаються у файлі конфігурації CLI ClawHub (перевизначається через `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="Телеметрія (лічильники встановлень)">
    Коли ви запускаєте `clawhub sync` під час входу в систему, CLI надсилає мінімальний
    знімок для обчислення кількості встановлень. Ви можете повністю це вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Variable                      | Effect                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначити URL сайту.                        |
| `CLAWHUB_REGISTRY`            | Перевизначити URL API реєстру.                  |
| `CLAWHUB_CONFIG_PATH`         | Перевизначити місце, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`             | Перевизначити стандартний workdir.              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимкнути телеметрію для `sync`.                 |

## Пов’язане

- [Спільнотні плагіни](/uk/plugins/community)
- [Плагіни](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
