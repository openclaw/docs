---
read_when:
    - Пошук, встановлення або оновлення Skills чи plugins
    - Публікація Skills або Plugin до реєстру
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для Skills і Plugin OpenClaw, нативні процеси встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T18:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d1d08edc482837e206f2c0a1b3f4db2658a6a052974aa3c59365455d1f5bddc
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **OpenClaw Skills і плагінів**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окрему CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

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
    Запустіть нову сесію OpenClaw — вона підхопить новий skill.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для робочих процесів з автентифікацією в реєстрі (публікація, синхронізація, керування) встановіть
    окрему CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Нативні процеси OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні команди `openclaw` встановлюють у ваш активний робочий простір і
    зберігають метадані джерела, щоб пізніші виклики `update` могли залишатися на ClawHub.

  </Tab>
  <Tab title="Плагіни">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` запитує каталог плагінів ClawHub і виводить готові до встановлення
    назви пакетів. Прості npm-сумісні специфікації плагінів використовують ClawHub лише після того,
    як готовність пакета вказує, що пакет готовий до встановлення для OpenClaw; інакше OpenClaw
    зберігає резервний шлях через npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, коли потрібне розв’язання лише через npm без
    пошуку в ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення плагінів перевіряє сумісність оголошених `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тому
    несумісні хости відмовляють закрито й завчасно, замість часткового встановлення
    пакета. Коли версія пакета публікує артефакт ClawPack,
    OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub
    і завантажені байти, а також записує тип артефакту, npm
    integrity, npm shasum, назву tarball і метадані дайджесту ClawPack для подальших
    оновлень. Старіші версії пакетів без метаданих ClawPack і далі використовують
    застарілий шлях перевірки архіву пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства плагінів.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється й
натомість спрямовує вас до `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також відмовляють закрито для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можуть встановлюватися, але OpenClaw
попереджає, щоб оператори могли перевірити джерело й верифікацію перед увімкненням
їх.
</Note>

## Що таке ClawHub

- Публічний реєстр для OpenClaw Skills і плагінів.
- Версійоване сховище пакетів skill і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий skill — це версійований пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує skill.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані, щоб забезпечувати виявлення й безпечно показувати
можливості skill. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли аудіювати
зміни.

## Робочий простір і завантаження skill

Окрема CLI `clawhub` також встановлює Skills у `./skills` у
вашому поточному робочому каталозі. Якщо робочий простір OpenClaw налаштований,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills, Skills робочого простору
мають пріоритет. Докладніше про те, як Skills завантажуються,
спільно використовуються й обмежуються, див. [Skills](/uk/tools/skills).

## Функції сервісу

| Функція                  | Нотатки                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Публічний перегляд          | Skills і їхній вміст `SKILL.md` доступні для публічного перегляду.          |
| Пошук                   | На основі embedding (векторний пошук), а не лише ключових слів.               |
| Версіювання               | Semver, журнали змін і теги (зокрема `latest`).                  |
| Завантаження                | Zip для кожної версії.                                                    |
| Зірки й коментарі       | Відгуки спільноти.                                                 |
| Підсумки сканування безпеки  | Сторінки деталей показують останній стан сканування перед встановленням або завантаженням. |
| Сторінки деталей сканера     | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання.  |
| Панель відновлення власника | Видавці можуть бачити належний їм вміст, утриманий скануванням, з `/dashboard`.       |
| Повторні сканування на запит власника  | Власники можуть запитувати обмежені повторні сканування для відновлення після хибних спрацювань.     |
| Модерація               | Схвалення й аудити.                                               |
| API, зручний для CLI         | Придатний для автоматизації та скриптів.                              |

## Безпека й модерація

ClawHub відкритий за замовчуванням — будь-хто може завантажувати Skills, але обліковий запис GitHub
має бути **щонайменше один тиждень старим**, щоб публікувати. Це сповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Сканування безпеки">
    ClawHub запускає автоматизовані перевірки безпеки для опублікованих Skills і випусків
    плагінів. Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на спеціальні сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Випуски, утримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі й
    поверхнях встановлення, але все ще видимі їхньому власнику в `/dashboard`.

  </Accordion>
  <Accordion title="Скарги">
    - Будь-який користувач, що ввійшов у систему, може повідомити про skill.
    - Причини скарг обов’язкові й записуються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Skills із більш ніж 3 унікальними скаргами автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, знімати приховування, видаляти їх або блокувати користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в OpenClaw Discord і зверніться до модератора або супровідника.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Вона потрібна лише для робочих процесів із автентифікацією в реєстрі, як-от
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. Типово: поточний каталог; повертається до робочого простору OpenClaw.
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
  Вимкнути підказки (неінтерактивний режим).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Вивести версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Автентифікація (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставте API token.
    - `--label <label>` — мітка, збережена для токенів входу через браузер (типово: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

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

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення плагінів/пакетів та інспектування метаданих. Нативні встановлення OpenClaw і далі використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати сімейство пакетів.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, що виконують код.
    - `--version <version>` / `--tag <tag>` — інспектувати певну версію пакета.
    - `--versions`, `--files`, `--file <path>` — інспектувати історію пакета й файли.
    - `--json` — машиночитаний вивід.

  </Accordion>
  <Accordion title="Встановлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` — встановити або оновити до певної версії (лише один slug для `update`).
    - `--force` — перезаписати, якщо папка вже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug skill.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — semver версія.
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
    - `--json` — вивести машиночитаний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автоматичного виявлення недостатньо.

  </Accordion>
  <Accordion title="Запит повторних сканувань">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токен власника, що ввійшов у систему, і націлюються на останню
    опубліковану версію skill або випуск плагіна. У неінтерактивних запусках передавайте
    `--yes`.

    JSON-відповіді містять цільовий тип, назву, версію, стан повторного сканування та
    залишкову/максимальну кількість запитів для цієї версії або випуску.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканувати локально + публікувати нове або оновлене)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без підказок.
    - `--dry-run` — показати, що буде завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (типово: `patch`).
    - `--changelog <text>` — журнал змін для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).
    - `--concurrency <n>` — перевірки реєстру (типово: `4`).

  </Accordion>
</AccordionGroup>

## Поширені робочі процеси

<Tabs>
  <Tab title="Search">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Find a plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Install">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Update all">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publish a single skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sync many skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publish a plugin from GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Метадані пакета Plugin

Плагіни коду мають містити обов’язкові метадані OpenClaw у
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
`runtimeExtensions` на цей вихідний результат. Встановлення з Git checkout усе ще можуть
повертатися до вихідного коду TypeScript, коли зібраних файлів немає, але зібрані записи runtime
уникають компіляції TypeScript під час запуску, doctor і
шляхів завантаження plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Versioning and tags">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (як-от `latest`) вказують на версію; переміщення тегів дає змогу виконати відкат.
    - Журнали змін прикріплюються до кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Local changes vs registry versions">
    Оновлення порівнюють локальний вміст skills із версіями в реєстрі за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою версією,
    CLI запитує перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Sync scanning and fallback roots">
    `clawhub sync` спочатку сканує ваш поточний workdir. Якщо skills не
    знайдено, він повертається до відомих застарілих розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено для
    знаходження старіших встановлень skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Storage and lockfile">
    - Установлені skills записуються в `.clawhub/lock.json` у вашому workdir.
    - Токени автентифікації зберігаються у файлі конфігурації ClawHub CLI (перевизначення через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (install counts)">
    Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний
    знімок для обчислення кількості встановлень. Ви можете повністю вимкнути це:

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
| `CLAWHUB_CONFIG_PATH`         | Перевизначає, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний workdir.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.              |

## Пов’язане

- [Плагіни спільноти](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
