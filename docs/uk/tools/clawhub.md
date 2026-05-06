---
read_when:
    - Пошук, інсталяція або оновлення Skills чи плагінів
    - Публікація Skills або Plugin до реєстру
    - Налаштування CLI clawhub або його перевизначень середовища
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр Skills і плагінів OpenClaw, нативні процеси встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T02:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub — це публічний реєстр для **OpenClaw skills і plugins**.

- Використовуйте нативні команди `openclaw`, щоб шукати, установлювати й оновлювати skills, а також установлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

<Steps>
  <Step title="Пошук">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Установлення">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Використання">
    Запустіть нову сесію OpenClaw - вона підхопить новий skill.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для робочих процесів із автентифікацією в реєстрі (публікація, синхронізація, керування) установіть
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

    Нативні команди `openclaw` установлюють у ваш активний робочий простір і
    зберігають метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` опитує каталог plugin ClawHub і виводить готові до встановлення
    назви пакетів. Використовуйте `clawhub:<package>`, коли потрібне розв’язання через ClawHub.
    Специфікації plugin без префікса, безпечні для npm, установлюються з npm під час перехідного запуску:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` також працює лише через npm і корисний, коли специфікація інакше
    могла б бути неоднозначною:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Установлення Plugin перевіряє сумісність заявлених `pluginApi` і
    `minGatewayVersion` перед установленням архіву, тому
    несумісні хости рано завершуються закрито, замість часткового встановлення
    пакета. Коли версія пакета публікує артефакт ClawPack,
    OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub
    і завантажені байти, а також записує тип артефакту, цілісність npm,
    shasum npm, назву tarball і метадані дайджесту ClawPack для подальших
    оновлень. Старіші версії пакетів без метаданих ClawPack і далі використовують
    застарілий шлях перевірки архіву пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише встановлювані сімейства plugin.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється й
натомість вказує на `openclaw skills install <slug>`.

Анонімні встановлення plugin ClawHub також завершуються закрито для приватних пакетів.
Спільнотні або інші неофіційні канали все ще можуть установлюватися, але OpenClaw
попереджає, щоб оператори могли переглянути джерело та перевірку перед
їх увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для OpenClaw skills і plugins.
- Версійне сховище пакетів skill і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий skill — це версійний пакет файлів, який містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, scripts або допоміжні файли, які використовує skill.
- Метадані, як-от теги, підсумок і вимоги до встановлення.

ClawHub використовує метадані для підтримки виявлення та безпечного розкриття
можливостей skill. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
покращувати ранжування та видимість. Кожна публікація створює нову версію semver,
а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження skill

Окремий CLI `clawhub` також установлює skills у `./skills` у
вашому поточному робочому каталозі. Якщо робочий простір OpenClaw налаштовано,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані skills, skills
робочого простору мають пріоритет. Докладніше про те, як skills завантажуються,
спільно використовуються й обмежуються, див. [Skills](/uk/tools/skills).

## Функції сервісу

| Функція                  | Нотатки                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Публічний перегляд          | Skills і їхній вміст `SKILL.md` доступні для публічного перегляду.          |
| Пошук                   | На основі embedding (векторний пошук), а не лише ключових слів.               |
| Версіонування               | Semver, журнали змін і теги (зокрема `latest`).                  |
| Завантаження                | Zip для кожної версії.                                                    |
| Зірки та коментарі       | Відгуки спільноти.                                                 |
| Підсумки сканування безпеки  | Сторінки деталей показують найновіший стан сканування перед установленням або завантаженням. |
| Сторінки деталей сканера     | Результати VirusTotal, ClawScan і статичного аналізу мають глибокі посилання.  |
| Панель відновлення власника | Видавці можуть бачити власний вміст, затриманий скануванням, із `/dashboard`.       |
| Повторні сканування на запит власника  | Власники можуть запитувати обмежені повторні сканування для відновлення після хибних спрацьовувань.     |
| Модерація               | Схвалення та аудити.                                               |
| API, зручний для CLI         | Підходить для автоматизації та створення scripts.                              |

## Безпека та модерація

ClawHub відкритий за замовчуванням - будь-хто може завантажувати skills, але обліковий запис GitHub
має бути **щонайменше тиждень давності**, щоб публікувати. Це уповільнює
зловживання, не блокуючи легітимних учасників.

<AccordionGroup>
  <Accordion title="Сканування безпеки">
    ClawHub запускає автоматизовані перевірки безпеки опублікованих skills і випусків plugin.
    Публічні сторінки деталей підсумовують поточний результат, а рядки сканерів
    посилаються на окремі сторінки деталей для VirusTotal, ClawScan і статичного
    аналізу.

    Випуски, затримані скануванням або заблоковані, можуть бути недоступні в публічному каталозі та
    на поверхнях установлення, але залишатися видимими для їхнього власника в `/dashboard`.

  </Accordion>
  <Accordion title="Звітування">
    - Будь-який користувач, який увійшов у систему, може повідомити про skill.
    - Причини повідомлення є обов’язковими й записуються.
    - Кожен користувач може мати до 20 активних повідомлень одночасно.
    - Skills із понад 3 унікальними повідомленнями автоматично приховуються за замовчуванням.

  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані skills, повертати їх, видаляти їх або блокувати користувачів.
    - Зловживання функцією повідомлень може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в OpenClaw Discord і зв’яжіться з модератором або супровідником.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Він потрібен лише для робочих процесів із автентифікацією в реєстрі, як-от
публікація/синхронізація.

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
  Вимкнути підказки (неінтерактивно).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Надрукувати версію CLI.
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

    Параметри входу:

    - `--token <token>` - вставити API-токен.
    - `--label <label>` - мітка, збережена для токенів входу через браузер (за замовчуванням: `CLI token`).
    - `--no-browser` - не відкривати браузер (потребує `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    Шукає skills. Для виявлення plugin/пакетів використовуйте `clawhub package explore`.

    - `--limit <n>` - максимальна кількість результатів.

  </Accordion>
  <Accordion title="Перегляд / інспектування plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` і `package inspect` — це поверхні CLI ClawHub для виявлення plugin/пакетів та інспектування метаданих. Нативні встановлення OpenClaw і далі використовують `openclaw plugins install clawhub:<package>`.

    Параметри:

    - `--family skill|code-plugin|bundle-plugin` - фільтрувати сімейство пакета.
    - `--official` - показувати лише офіційні пакети.
    - `--executes-code` - показувати лише пакети, які виконують код.
    - `--version <version>` / `--tag <tag>` - інспектувати певну версію пакета.
    - `--versions`, `--files`, `--file <path>` - інспектувати історію та файли пакета.
    - `--json` - машинозчитуваний вивід.

  </Accordion>
  <Accordion title="Установлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` - установити або оновити до певної версії (лише один slug для `update`).
    - `--force` - перезаписати, якщо папка вже існує, або коли локальні файли не відповідають жодній опублікованій версії.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` - slug skill.
    - `--name <name>` - відображувана назва.
    - `--version <version>` - версія semver.
    - `--changelog <text>` - текст журналу змін (може бути порожнім).
    - `--tags <tags>` - теги, розділені комами (за замовчуванням: `latest`).

  </Accordion>
  <Accordion title="Публікація plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL-адресою GitHub.

    Параметри:

    - `--dry-run` - побудувати точний план публікації без завантаження будь-чого.
    - `--json` - вивести машинозчитуваний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - необов’язкові перевизначення, коли автоматичного визначення недостатньо.

  </Accordion>
  <Accordion title="Запит повторних сканувань">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Команди повторного сканування потребують токен власника, який увійшов у систему, і націлюються на найновішу
    опубліковану версію skill або випуск plugin. У неінтерактивних запусках передавайте
    `--yes`.

    JSON-відповіді містять тип цілі, назву, версію, статус повторного сканування та
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

    - `--root <dir...>` - додаткові корені сканування.
    - `--all` - завантажити все без підказок.
    - `--dry-run` - показати, що буде завантажено.
    - `--bump <type>` - `patch|minor|major` для оновлень (за замовчуванням: `patch`).
    - `--changelog <text>` - журнал змін для неінтерактивних оновлень.
    - `--tags <tags>` - теги, розділені комами (за замовчуванням: `latest`).
    - `--concurrency <n>` - перевірки реєстру (за замовчуванням: `4`).

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

Кодові plugins повинні містити обов’язкові метадані OpenClaw у
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
відступати до вихідного коду TypeScript, коли зібраних файлів немає, але зібрані runtime-записи
уникають runtime-компіляції TypeScript під час запуску, doctor і
шляхів завантаження plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (як-от `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
    - Журнали змін прикріплюються до кожної версії та можуть бути порожніми під час синхронізації або публікації оновлень.

  </Accordion>
  <Accordion title="Локальні зміни порівняно з версіями registry">
    Оновлення порівнюють вміст локального skill з версіями registry за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою версією,
    CLI запитує перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спочатку сканує ваш поточний workdir. Якщо skills не
    знайдено, він відступає до відомих legacy-розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це призначено для
    пошуку старіших установлень skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище й lockfile">
    - Установлені skills записуються в `.clawhub/lock.json` у вашому workdir.
    - Auth-токени зберігаються у файлі конфігурації ClawHub CLI (перевизначається через `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Телеметрія (лічильники встановлень)">
    Коли ви запускаєте `clawhub sync` після входу в систему, CLI надсилає мінімальний
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
| `CLAWHUB_REGISTRY`            | Перевизначає URL API registry.                  |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає, де CLI зберігає token/config.     |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий workdir.                   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію для `sync`.                  |

## Пов’язане

- [Community plugins](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
