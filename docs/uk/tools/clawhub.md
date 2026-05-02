---
read_when:
    - Пошук, встановлення або оновлення skills чи plugins
    - Публікація Skills або Plugin у реєстрі
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр для OpenClaw Skills і Plugin, вбудованих потоків інсталяції та clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T17:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 830878acb8c280bdf3bae2f624a6aa1adf20a60c6ee602bf9159395fc1c8acd6
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **навичок і plugins OpenClaw**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати навички, а також встановлювати plugins із ClawHub.
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
    Запустіть новий сеанс OpenClaw — він підхопить нову навичку.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для робочих процесів із автентифікацією в реєстрі (публікація, синхронізація, керування) встановіть
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
    зберігають метадані джерела, щоб подальші виклики `update` могли лишатися на ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` надсилає запити до каталогу plugins ClawHub і виводить готові до встановлення
    назви пакетів. Прості npm-сумісні специфікації plugins також спочатку перевіряються в ClawHub
    перед npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Використовуйте `npm:<package>`, коли потрібне розв’язання лише через npm без
    пошуку в ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення plugins перевіряє оголошену сумісність `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тому
    несумісні хости рано завершуються закритою помилкою замість часткового встановлення
    пакета. Коли версія пакета публікує артефакт ClawPack,
    OpenClaw віддає перевагу точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub
    і завантажені байти, а також записує тип артефакту, npm
    integrity, npm shasum, назву tarball і метадані дайджесту ClawPack для подальших
    оновлень. Старіші версії пакетів без метаданих ClawPack усе ще використовують
    застарілий шлях перевірки архіву пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства plugins.
Якщо пакет ClawHub насправді є навичкою, OpenClaw зупиняється й
натомість спрямовує вас до `openclaw skills install <slug>`.

Анонімні встановлення plugins ClawHub також завершуються закритою помилкою для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можна встановити, але OpenClaw
попереджає, щоб оператори могли переглянути джерело й перевірку перед увімкненням
їх.
</Note>

## Що таке ClawHub

- Публічний реєстр для навичок і plugins OpenClaw.
- Версійне сховище пакетів навичок і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типова навичка — це версійний пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і способом використання.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує навичка.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані для виявлення та безпечного показу
можливостей навичок. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження навичок

Окремий CLI `clawhub` також встановлює навички в `./skills` у межах
поточного робочого каталогу. Якщо налаштовано робочий простір OpenClaw,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує навички робочого простору з
`<workspace>/skills` і підхоплює їх у **наступному** сеансі.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані навички, навички
робочого простору мають пріоритет. Докладніше про те, як навички завантажуються,
поширюються й обмежуються, див. [Skills](/uk/tools/skills).

## Можливості сервісу

| Можливість              | Примітки                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| Публічний перегляд      | Навички та їхній вміст `SKILL.md` доступні для публічного перегляду. |
| Пошук                   | На основі embeddings (векторний пошук), не лише ключові слова.       |
| Версіонування           | Semver, журнали змін і теги (включно з `latest`).                   |
| Завантаження            | Zip для кожної версії.                                              |
| Зірки й коментарі       | Відгуки спільноти.                                                  |
| Підсумки сканування безпеки | Сторінки деталей показують найновіший стан сканування перед встановленням або завантаженням. |
| Сторінки деталей сканера | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання. |
| Панель відновлення власника | Видавці можуть бачити власний вміст, утриманий скануванням, із `/dashboard`. |
| Повторні сканування на запит власника | Власники можуть запитувати обмежені повторні сканування для відновлення після хибних спрацювань. |
| Модерація               | Схвалення та аудити.                                                |
| API, зручний для CLI    | Придатний для автоматизації та скриптів.                            |

## Безпека та модерація

ClawHub відкритий за замовчуванням — будь-хто може завантажувати навички, але обліковий запис GitHub
має бути **віком щонайменше один тиждень**, щоб публікувати. Це сповільнює
зловживання без блокування добросовісних учасників.

<AccordionGroup>
  <Accordion title="Сканування безпеки">
    ClawHub виконує автоматизовані перевірки безпеки опублікованих навичок і випусків plugins.
    Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на спеціальні сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Випуски, утримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі та
    поверхнях встановлення, але все ще видимі їхньому власнику в `/dashboard`.

  </Accordion>
  <Accordion title="Повідомлення">
    - Будь-який користувач, що ввійшов у систему, може повідомити про навичку.
    - Причини повідомлення обов’язкові й записуються.
    - Кожен користувач може мати до 20 активних повідомлень одночасно.
    - Навички з понад 3 унікальними повідомленнями автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані навички, скасовувати приховування, видаляти їх або блокувати користувачів.
    - Зловживання функцією повідомлень може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з модератором або супровідником.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Це потрібно лише для робочих процесів із автентифікацією в реєстрі, як-от
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. За замовчуванням: поточний каталог; повертається до робочого простору OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Каталог навичок, відносно workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Базова URL-адреса сайту (вхід через браузер).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Базова URL-адреса API реєстру.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Вимкнути запити (неінтерактивно).
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
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (за замовчуванням: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає навички. Для виявлення plugins/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимум результатів.

  </Accordion>
  <Accordion title="Перегляд / інспектування plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення plugins/пакетів та інспектування метаданих. Нативні встановлення OpenClaw усе ще використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати сімейство пакета.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, що виконують код.
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
    - `--version <version>` — semver версія.
    - `--changelog <text>` — текст журналу змін (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).

  </Accordion>
  <Accordion title="Публікація plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL-адресою GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — видавати машинозчитуваний вивід для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автоматичного виявлення недостатньо.

  </Accordion>
  <Accordion title="Запит повторних сканувань">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токена власника, що ввійшов у систему, і націлюються на найновішу
    опубліковану версію навички або випуск plugin. У неінтерактивних запусках передавайте
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
  <Accordion title="Синхронізація (сканувати локальне + опублікувати нове або оновлене)">
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

Кодові plugins мають містити потрібні метадані OpenClaw у
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
`runtimeExtensions` на цей вихідний результат. Установлення з checkout Git усе ще може
повертатися до TypeScript-коду, коли зібраних файлів немає, але зібрані runtime-записи
уникають runtime-компіляції TypeScript під час запуску, doctor і
шляхів завантаження plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (наприклад `latest`) указують на версію; переміщення тегів дає змогу відкотитися.
    - Журнали змін додаються для кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни й версії registry">
    Оновлення порівнюють вміст локального skill із версіями registry за допомогою
    хешу вмісту. Якщо локальні файли не відповідають жодній опублікованій версії,
    CLI запитує перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спершу сканує ваш поточний workdir. Якщо skills не
    знайдено, він повертається до відомих застарілих розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено для
    знаходження старіших установлених skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище й lockfile">
    - Установлені skills записуються в `.clawhub/lock.json` у вашому workdir.
    - Токени автентифікації зберігаються у файлі конфігурації CLI ClawHub (перевизначається через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (лічильники встановлень)">
    Коли ви запускаєте `clawhub sync` після входу, CLI надсилає мінімальний
    знімок для обчислення лічильників встановлень. Це можна повністю вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Змінна                       | Дія                                             |
| ---------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`               | Перевизначає URL сайту.                         |
| `CLAWHUB_REGISTRY`           | Перевизначає URL API registry.                  |
| `CLAWHUB_CONFIG_PATH`        | Перевизначає, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`            | Перевизначає стандартний workdir.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.              |

## Пов’язане

- [Спільнотні plugins](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
