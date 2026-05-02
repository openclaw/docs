---
read_when:
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin до реєстру
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для OpenClaw Skills і Plugin, нативних процесів встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T17:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c0e78a10439b11540cce03a86278f475c6bac81f1b8fbd53a6d6ad87b721f5
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **OpenClaw Skills і плагінів**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення видаленого та робочих процесів синхронізації.

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
    Для робочих процесів з автентифікацією в реєстрі (публікація, синхронізація, керування) установіть
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

    Нативні команди `openclaw` установлюють у ваш активний робочий простір і
    зберігають метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

  </Tab>
  <Tab title="Плагіни">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` запитує каталог плагінів ClawHub і виводить готові до встановлення
    імена пакетів. Специфікації плагінів у npm-сумісному форматі без префікса також спочатку перевіряються в ClawHub
    перед npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, коли потрібне розв’язання лише через npm без
    пошуку в ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Установлення плагінів перевіряє сумісність заявлених `pluginApi` і
    `minGatewayVersion` перед запуском установлення архіву, тому
    несумісні хости рано завершуються закритою відмовою замість часткового встановлення
    пакета. Коли версія пакета публікує артефакт ClawPack,
    OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і
    завантажені байти, а також записує метадані дайджесту ClawPack для подальших
    оновлень. Старіші версії пакетів без метаданих ClawPack і далі використовують
    застарілий шлях перевірки архіву пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані родини плагінів.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється й
натомість спрямовує вас до `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також завершуються закритою відмовою для приватних пакетів.
Спільнотні або інші неофіційні канали все одно можна встановлювати, але OpenClaw
попереджає, щоб оператори могли переглянути джерело та перевірку перед їх
увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для OpenClaw Skills і плагінів.
- Версійоване сховище наборів skill і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий skill — це версійований набір файлів, який містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує skill.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані для забезпечення виявлення та безпечного представлення
можливостей skill. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли аудитувати
зміни.

## Робочий простір і завантаження skill

Окремий CLI `clawhub` також установлює Skills у `./skills` під
вашим поточним робочим каталогом. Якщо робочий простір OpenClaw налаштовано,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills, Skills
робочого простору мають пріоритет. Докладніше про те, як Skills завантажуються,
поширюються та обмежуються, див. [Skills](/uk/tools/skills).

## Можливості сервісу

| Можливість               | Примітки                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Публічний перегляд       | Skills та їхній вміст `SKILL.md` доступні для публічного перегляду. |
| Пошук                    | На основі ембедингів (векторний пошук), не лише ключові слова.      |
| Версіонування            | Semver, журнали змін і теги (зокрема `latest`).                     |
| Завантаження             | Zip для кожної версії.                                              |
| Зірки й коментарі        | Відгуки спільноти.                                                  |
| Підсумки сканування безпеки | Сторінки деталей показують останній стан сканування перед установленням або завантаженням. |
| Сторінки деталей сканера | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання. |
| Панель відновлення власника | Видавці можуть бачити власний вміст, утриманий скануванням, з `/dashboard`. |
| Повторні сканування на запит власника | Власники можуть запитувати обмежені повторні сканування для відновлення після хибнопозитивних спрацювань. |
| Модерація                | Схвалення й аудити.                                                 |
| API, зручний для CLI     | Придатний для автоматизації та скриптів.                            |

## Безпека й модерація

ClawHub за замовчуванням відкритий — будь-хто може завантажувати Skills, але обліковий запис GitHub
має бути **принаймні один тиждень старим**, щоб публікувати. Це уповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Сканування безпеки">
    ClawHub запускає автоматизовані перевірки безпеки для опублікованих Skills і випусків
    плагінів. Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на окремі сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Випуски, утримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі та
    на поверхнях установлення, залишаючись видимими для їхнього власника в `/dashboard`.

  </Accordion>
  <Accordion title="Повідомлення про порушення">
    - Будь-який користувач, що ввійшов у систему, може повідомити про skill.
    - Причини повідомлення обов’язкові та записуються.
    - Кожен користувач може мати до 20 активних повідомлень одночасно.
    - Skills із понад 3 унікальними повідомленнями за замовчуванням автоматично приховуються.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, знімати приховування, видаляти їх або блокувати користувачів.
    - Зловживання функцією повідомлень може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з модератором або мейнтейнером.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Це потрібно лише для робочих процесів з автентифікацією в реєстрі, як-от
публікація/синхронізація.

### Глобальні опції

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. Типово: поточний каталог; повертається до робочого простору OpenClaw.
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
  <Accordion title="Автентифікація (вхід / вихід / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Опції входу:

    - `--token <token>` — вставити API-токен.
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (типово: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає Skills. Для виявлення плагінів/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимум результатів.

  </Accordion>
  <Accordion title="Огляд / інспектування плагінів">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення плагінів/пакетів та інспектування метаданих. Нативні встановлення OpenClaw і далі використовують `openclaw plugins install clawhub:<package>`.

    Опції:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати родину пакетів.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, що виконують код.
    - `--version <version>` / `--tag <tag>` — інспектувати певну версію пакета.
    - `--versions`, `--files`, `--file <path>` — інспектувати історію пакета й файли.
    - `--json` — машинозчитуваний вивід.

  </Accordion>
  <Accordion title="Встановлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Опції:

    - `--version <version>` — установити або оновити до певної версії (лише один slug для `update`).
    - `--force` — перезаписати, якщо папка вже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Опції:

    - `--slug <slug>` — slug skill.
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
    URL GitHub.

    Опції:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — вивести машинозчитуваний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автоматичного визначення недостатньо.

  </Accordion>
  <Accordion title="Запит повторних сканувань">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токена власника, що ввійшов у систему, і націлені на останню
    опубліковану версію skill або випуск плагіна. У неінтерактивних запусках передавайте
    `--yes`.

    JSON-відповіді містять тип цілі, назву, версію, стан повторного сканування та
    залишкову/максимальну кількість запитів для цієї версії або випуску.

  </Accordion>
  <Accordion title="Видалення / відновлення видаленого (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканувати локально + опублікувати нове або оновлене)">
    ```bash
    clawhub sync
    ```

    Опції:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що буде завантажено.
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
  <Tab title="Знайти Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Установити">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Оновити всі">
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
  <Tab title="Опублікувати Plugin з GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Метадані пакета Plugin

Кодові Plugin мають містити обов’язкові метадані OpenClaw у
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
`runtimeExtensions` на цей результат. Установлення з Git checkout усе ще може
повертатися до вихідного коду TypeScript, коли зібраних файлів немає, але зібрані
записи середовища виконання уникають компіляції TypeScript під час запуску, doctor і
шляхів завантаження Plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (наприклад, `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
    - Журнали змін прикріплюються до кожної версії та можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни й версії реєстру">
    Оновлення порівнюють вміст локального Skill із версіями в реєстрі за допомогою
    хешу вмісту. Якщо локальні файли не відповідають жодній опублікованій версії,
    CLI запитує підтвердження перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спочатку сканує ваш поточний робочий каталог. Якщо Skills не
    знайдено, він повертається до відомих застарілих розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено для
    знаходження старіших установлених Skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище й lockfile">
    - Установлені Skills записуються в `.clawhub/lock.json` у вашому робочому каталозі.
    - Токени автентифікації зберігаються у файлі конфігурації ClawHub CLI (перевизначення через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (кількість установлень)">
    Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний
    знімок для обчислення кількості установлень. Це можна повністю вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Змінна                        | Ефект                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначити URL сайту.                        |
| `CLAWHUB_REGISTRY`            | Перевизначити URL API реєстру.                  |
| `CLAWHUB_CONFIG_PATH`         | Перевизначити, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`             | Перевизначити типовий робочий каталог.          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимкнути телеметрію під час `sync`.             |

## Пов’язане

- [Plugins спільноти](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
