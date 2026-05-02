---
read_when:
    - Пошук, встановлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin у реєстрі
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр Skills і Plugin для OpenClaw, нативні потоки встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T19:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **OpenClaw Skills і плагінів**.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
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
    Запустіть новий сеанс OpenClaw — він підхопить новий skill.
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

## Нативні робочі процеси OpenClaw

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
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` запитує каталог плагінів ClawHub і виводить готові до встановлення
    імена пакетів. Використовуйте `clawhub:<package>`, коли потрібне розв’язання через ClawHub.
    Сумісні з npm специфікації плагінів без префікса встановлюються з npm під час launch cutover:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` також означає лише npm і корисний, коли специфікація інакше
    може бути неоднозначною:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Встановлення плагінів перевіряє сумісність оголошених `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тож
    несумісні хости рано завершуються закритою помилкою замість часткового встановлення
    пакета. Коли версія пакета публікує артефакт ClawPack,
    OpenClaw надає перевагу точному завантаженому npm-pack `.tgz`, перевіряє
    заголовок дайджесту ClawHub і завантажені байти, а також записує тип артефакту, npm
    integrity, npm shasum, ім’я tarball і метадані дайджесту ClawPack для подальших
    оновлень. Старіші версії пакетів без метаданих ClawPack і далі використовують
    застарілий шлях перевірки архіву пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства плагінів.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється й
натомість спрямовує вас до `openclaw skills install <slug>`.

Анонімні встановлення плагінів ClawHub також завершуються закритою помилкою для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можна встановити, але OpenClaw
попереджає, щоб оператори могли перевірити джерело та верифікацію перед
їх увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для OpenClaw Skills і плагінів.
- Версійне сховище бандлів Skills і метаданих.
- Поверхня пошуку для пошуку, тегів і сигналів використання.

Типовий skill — це версійний бандл файлів, який містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфіги, скрипти або допоміжні файли, які використовує skill.
- Метадані, як-от теги, короткий опис і вимоги до встановлення.

ClawHub використовує метадані для забезпечення пошуку та безпечного представлення
можливостей Skills. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування й видимість. Кожна публікація створює нову semver
версію, а реєстр зберігає історію версій, щоб користувачі могли аудитувати
зміни.

## Робочий простір і завантаження Skills

Окремий CLI `clawhub` також встановлює Skills у `./skills` під
вашим поточним робочим каталогом. Якщо робочий простір OpenClaw налаштовано,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступному** сеансі.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills, Skills
робочого простору мають пріоритет. Докладніше про те, як Skills завантажуються,
поширюються та обмежуються, див. [Skills](/uk/tools/skills).

## Можливості сервісу

| Можливість              | Примітки                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| Публічний перегляд      | Skills і їхній вміст `SKILL.md` доступні для публічного перегляду.  |
| Пошук                   | На основі embeddings (векторний пошук), не лише ключові слова.      |
| Версіонування           | Semver, журнали змін і теги (зокрема `latest`).                     |
| Завантаження            | Zip для кожної версії.                                               |
| Зірки та коментарі      | Відгуки спільноти.                                                  |
| Підсумки сканування безпеки | Сторінки деталей показують найновіший стан сканування перед встановленням або завантаженням. |
| Сторінки деталей сканерів | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання. |
| Панель відновлення власника | Видавці можуть бачити власний вміст, затриманий скануванням, з `/dashboard`. |
| Повторні сканування на запит власника | Власники можуть запитувати обмежені повторні сканування для відновлення після хибнопозитивних результатів. |
| Модерація               | Схвалення й аудити.                                                 |
| API, зручний для CLI    | Придатний для автоматизації та скриптів.                            |

## Безпека та модерація

ClawHub за замовчуванням відкритий — будь-хто може завантажувати Skills, але обліковий запис GitHub
має бути **щонайменше один тиждень старим**, щоб публікувати. Це сповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Сканування безпеки">
    ClawHub запускає автоматизовані перевірки безпеки для опублікованих Skills і релізів плагінів.
    Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на спеціальні сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Релізи, затримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі та
    поверхнях встановлення, але все ще видимі їхньому власнику в `/dashboard`.

  </Accordion>
  <Accordion title="Повідомлення">
    - Будь-який користувач, що ввійшов у систему, може повідомити про skill.
    - Причини повідомлення обов’язкові та записуються.
    - Кожен користувач може мати до 20 активних повідомлень одночасно.
    - Skills із понад 3 унікальними повідомленнями за замовчуванням автоматично приховуються.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, скасовувати приховування, видаляти їх або блокувати користувачів.
    - Зловживання функцією повідомлень може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в OpenClaw Discord і зв’яжіться з модератором або мейнтейнером.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Це потрібно лише для робочих процесів з автентифікацією в реєстрі, таких як
publish/sync.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. За замовчуванням: поточний каталог; повертається до робочого простору OpenClaw.
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
  <Accordion title="Автентифікація (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставити API token.
    - `--label <label>` — мітка, збережена для токенів входу через браузер (за замовчуванням: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає Skills. Для пошуку плагінів/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` — максимум результатів.

  </Accordion>
  <Accordion title="Перегляд / інспекція плагінів">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні ClawHub CLI для пошуку плагінів/пакетів та інспекції метаданих. Нативні встановлення OpenClaw і далі використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` — фільтрувати сімейство пакетів.
    - `--official` — показувати лише офіційні пакети.
    - `--executes-code` — показувати лише пакети, що виконують код.
    - `--version <version>` / `--tag <tag>` — інспектувати конкретну версію пакета.
    - `--versions`, `--files`, `--file <path>` — інспектувати історію пакета та файли.
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
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug skill.
    - `--name <name>` — відображуване ім’я.
    - `--version <version>` — semver версія.
    - `--changelog <text>` — текст журналу змін (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (за замовчуванням: `latest`).

  </Accordion>
  <Accordion title="Публікація плагінів">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL-адресою GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації, нічого не завантажуючи.
    - `--json` — вивести машинозчитуваний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автовизначення недостатньо.

  </Accordion>
  <Accordion title="Запит повторних сканувань">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токен власника, що ввійшов у систему, і націлюються на найновішу
    опубліковану версію skill або реліз плагіна. У неінтерактивних запусках передавайте
    `--yes`.

    JSON-відповіді містять цільовий тип, ім’я, версію, статус повторного сканування та
    залишкову/максимальну кількість запитів для цієї версії або релізу.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканування локального + публікація нового або оновленого)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що буде завантажено.
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
`runtimeExtensions` на цей результат. Встановлення з Git checkout усе ще можуть
повертатися до вихідного коду TypeScript, коли зібраних файлів немає, але зібрані записи runtime
допомагають уникнути компіляції TypeScript під час запуску, doctor і
шляхів завантаження плагінів.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування і теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (наприклад, `latest`) вказують на версію; переміщення тегів дає змогу виконати відкат.
    - Журнали змін прив’язуються до кожної версії та можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни порівняно з версіями реєстру">
    Оновлення порівнюють вміст локальної навички з версіями реєстру за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою версією,
    CLI запитує перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спершу сканує ваш поточний робочий каталог. Якщо навичок
    не знайдено, він переходить до відомих застарілих розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено для
    знаходження старіших встановлень навичок без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище і lockfile">
    - Установлені навички записуються в `.clawhub/lock.json` у вашому робочому каталозі.
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

| Змінна                        | Дія                                             |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту.                         |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                   |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.              |

## Пов’язане

- [Плагіни спільноти](/uk/plugins/community)
- [Плагіни](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
