---
read_when:
    - Ви хочете встановити або керувати Gateway plugins чи сумісними пакетами
    - Ви хочете створити каркас або перевірити простий інструментальний plugin
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-06-28T20:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin.
  </Card>
  <Card title="Керування Plugin" href="/uk/plugins/manage-plugins">
    Короткі приклади встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення Plugin.
  </Card>
</CardGroup>

## Команди

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Для розслідування повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) змінювачі життєвого циклу Plugin вимкнені. Використовуйте джерело Nix для цього встановлення замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте орієнтований на агента [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані Plugin постачаються разом з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Автор

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` за замовчуванням створює мінімальний Plugin інструмента на TypeScript. Перший
аргумент — це id Plugin; передайте `--name` для відображуваної назви. OpenClaw використовує
id для типового каталогу виводу та іменування пакета. Каркаси інструментів використовують
`defineToolPlugin`.
`plugins build` імпортує зібрану точку входу, читає її статичні метадані інструмента, записує
`openclaw.plugin.json` і підтримує `package.json` `openclaw.extensions` узгодженим.
`plugins validate` перевіряє, що згенерований маніфест, метадані пакета та
поточний експорт точки входу все ще узгоджені. Див. [Plugin інструментів](/uk/plugins/tool-plugins) для
повного робочого процесу створення інструментів.

Каркас записує вихідний код TypeScript, але генерує метадані зі зібраної
точки входу `./dist/index.js`, тому робочий процес також працює з опублікованим CLI. Використовуйте
`--entry <path>`, коли точка входу не є типовою точкою входу пакета. Використовуйте
`plugins build --check` у CI, щоб завершуватися помилкою, коли згенеровані метадані застаріли, без
перезапису файлів.

### Каркас провайдера

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Каркаси провайдерів створюють загальний текстовий/модельний Plugin провайдера з OpenAI-сумісною
проводкою API-ключа, вбудованим скриптом `npm run validate` для `clawhub package
validate`, метаданими пакета ClawHub і вручну запущеним робочим процесом GitHub
для майбутньої довіреної публікації через GitHub Actions OIDC. Каркаси провайдерів не
генерують Skills і не використовують `openclaw plugins build` або
`openclaw plugins validate`; ці команди призначені для шляху згенерованих метаданих
каркаса інструмента.

Перед публікацією замініть заповнювач базової URL-адреси API, каталог моделей, маршрут
документації, текст облікових даних і текст README реальними деталями провайдера. Використовуйте
згенерований README для першої публікації в ClawHub і налаштування довіреного видавця.

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Супровідники, які тестують встановлення під час налаштування, можуть перевизначати автоматичні джерела встановлення Plugin
за допомогою захищених змінних середовища. Див.
[Перевизначення встановлення Plugin](/uk/plugins/install-overrides).

<Warning>
Голі імена пакетів за замовчуванням встановлюються з npm під час запускового переходу, якщо вони не збігаються з офіційним id Plugin. Необроблені специфікації пакетів `@openclaw/*`, які збігаються з вбудованими Plugin, використовують вбудовану копію, що постачалася з поточною збіркою OpenClaw. Використовуйте `npm:<package>`, коли ви навмисно хочете зовнішній пакет npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів Plugin і виводить
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості Plugin. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Належні OpenClaw
пакети Plugin `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення бета-каналу віддають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та ремонт недійсної конфігурації">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` недоторканим. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями закриваються з помилкою замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай закривається з помилкою і повідомляє спершу запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація Plugin закривається з помилкою, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для Plugin, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється і спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне посилання git, як-от `git:github.com/acme/plugin@v1.2.3`, коли вам потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` застарів і тепер не виконує жодної дії. OpenClaw більше не запускає вбудоване блокування небезпечного коду під час встановлення для встановлень Plugin.

    Використовуйте спільну поверхню `security.installPolicy`, власником якої є оператор, коли потрібна політика встановлення, специфічна для хоста. Хуки Plugin `before_install` є хуками життєвого циклу runtime Plugin і не є основною межею політики для встановлень CLI.

    Якщо Plugin, який ви опублікували в ClawHub, приховано або заблоковано скануванням реєстру, використовуйте кроки видавця в [Публікації ClawHub](/uk/clawhub/publishing). `--dangerously-force-unsafe-install` не просить ClawHub повторно просканувати Plugin або зробити заблокований реліз публічним.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Встановлення спільнотних пакетів ClawHub перевіряють запис довіри вибраного релізу перед завантаженням пакета. Якщо ClawHub вимикає завантаження для релізу, повідомляє про зловмисні результати сканування або переводить реліз у блокувальний стан модерації, наприклад карантин, OpenClaw відхиляє реліз. Для неблокувальних ризикових статусів сканування, ризикових станів модерації або причин реєстру OpenClaw показує деталі довіри та просить підтвердження перед продовженням.

    Використовуйте `--acknowledge-clawhub-risk` лише після перегляду попередження ClawHub і рішення продовжити без інтерактивного запиту. Очікувані або застарілі чисті записи довіри попереджають, але не потребують підтвердження. Офіційні пакети ClawHub і вбудовані джерела Plugin OpenClaw обходять цей запит довіри до релізу.

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакета.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується в одному керованому npm-проєкті на Plugin з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm. Керовані npm-проєкти Plugin успадковують npm `overrides` рівня пакета OpenClaw, тому захисні фіксації хоста також застосовуються до піднятих залежностей Plugin.

    Використовуйте `npm:<package>`, коли хочете явно вказати npm-розв’язання. Голі специфікації пакетів також установлюються безпосередньо з npm під час запускового переходу, якщо вони не збігаються з офіційним ідентифікатором Plugin.

    Необроблені специфікації пакетів `@openclaw/*`, що збігаються з вбудованими plugins, розв’язуються до вбудованої копії, якою володіє образ, перед резервним переходом до npm. Наприклад, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` використовує вбудований Discord Plugin з поточної збірки OpenClaw замість створення керованого npm-перевизначення. Щоб примусово використати зовнішній npm-пакет, скористайтеся `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Голі специфікації та `@latest` залишаються на стабільній гілці. Версії виправлень OpenClaw із датованими позначками, як-от `2026.5.3-1`, вважаються стабільними релізами для цієї перевірки. Якщо npm розв’язує будь-яку з них до попереднього релізу, OpenClaw зупиняється й просить вас явно погодитися за допомогою тега попереднього релізу, як-от `@beta`/`@rc`, або точної версії попереднього релізу, як-от `@1.2.3-beta.4`.

    Для npm-встановлень без точної версії (`npm:<package>` або `npm:<package>@latest`) OpenClaw перевіряє розв’язані метадані пакета перед встановленням. Якщо останній стабільний пакет потребує новішого API Plugin OpenClaw або мінімальної версії хоста, OpenClaw перевіряє старіші стабільні версії й натомість установлює найновіший сумісний реліз. Точні версії та явні dist-tags, як-от `@beta`, залишаються суворими: якщо вибраний пакет несумісний, команда завершується помилкою й просить вас оновити OpenClaw або вибрати сумісну версію.

    Якщо гола специфікація встановлення збігається з офіційним ідентифікатором Plugin (наприклад, `diffs`), OpenClaw установлює запис каталогу безпосередньо. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>`, щоб установити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він указаний, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що перевірка маніфесту, політика встановлення оператора, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення включають вихідний URL/ref і розв’язаний коміт, щоб `openclaw plugins update` міг повторно розв’язати джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви Plugin OpenClaw повинні містити дійсний `openclaw.plugin.json` у видобутому корені Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий шлях керованого npm-проєкту на Plugin, який використовується встановленнями
    з реєстру, включно з перевіркою `package-lock.json`, скануванням піднятих залежностей
    і записами npm-встановлення. Звичайні шляхи архівів усе ще встановлюються як локальні
    архіви під коренем розширень Plugin.

    Встановлення з маркетплейсу Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-сумісні специфікації Plugin за замовчуванням установлюються з npm під час запускового переходу, якщо вони не збігаються з офіційним ідентифікатором Plugin:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно вказати розв’язання лише через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API Plugin / мінімального Gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок digest ClawHub і digest артефакту, а потім установлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої вихідні метадані ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версій або тегів, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело маркетплейсу:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела маркетплейсу">
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях `marketplace.json`
    - скорочення GitHub-репозиторію, як-от `owner/repo`
    - URL GitHub-репозиторію, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела відносних шляхів із цього репозиторію й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex bundles (`.codex-plugin/plugin.json`)
- сумісні з Claude bundles (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor bundles (`.cursor-plugin/plugin.json`)

Керовані локальні встановлення мають бути каталогами або архівами Plugin. Окремі файли Plugin `.js`,
`.mjs`, `.cjs` і `.ts` не копіюються до керованого кореня Plugin
командою `plugins install`; натомість перелічіть їх явно в `plugins.load.paths`.

<Note>
Сумісні bundles установлюються до звичайного кореня Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені маніфестом `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не під’єднані до виконання runtime.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише увімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на деталізовані рядки для кожного Plugin із метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар плюс діагностика реєстру та стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр Plugin, із резервним виведенням лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin установлений, увімкнений і видимий для планування холодного запуску, але це не live-зонд runtime для вже запущеного процесу Gateway. Після зміни коду Plugin, стану ввімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hooks. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакетів і не виправляє відсутні
залежності.
</Note>

Якщо журнали запуску містять `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
запустіть `openclaw plugins list --enabled --verbose` або
`openclaw plugins inspect <id>` з указаним ідентифікатором Plugin, щоб підтвердити
ідентифікатори Plugin і скопіювати довірені ідентифікатори в `plugins.allow` у `openclaw.json`. Коли
попередження може перелічити кожен виявлений Plugin, воно друкує готовий до вставлення
фрагмент `plugins.allow`, який уже включає ці ідентифікатори. Якщо Plugin завантажується
без походження install/load-path, перевірте цей ідентифікатор Plugin, а потім або зафіксуйте
довірений ідентифікатор у `plugins.allow`, або перевстановіть Plugin із довіреного джерела,
щоб OpenClaw записав походження встановлення.

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код Plugin. Результати пошуку
містять назву пакета ClawHub, родину, канал, версію, короткий опис і
підказку встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin усередині запакованого Docker-образу bind-mount каталог
джерела Plugin поверх відповідного запакованого шляху джерела, як-от
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований оверлей джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишається неактивним, тому звичайні запаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані plugins, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний URL/profile Gateway, підказки service/process, шлях конфігурації та стан RPC.
- Невбудовані conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу Plugin (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Окремі файли Plugin мають бути перелічені в `plugins.load.paths`, а не
встановлені через `plugins install` або розміщені безпосередньо в `~/.openclaw/extensions`
чи `<workspace>/.openclaw/extensions`. Ці автоматично виявлені корені завантажують
пакети Plugin або каталоги bundle, тоді як скриптові файли верхнього рівня вважаються локальними
допоміжними файлами й пропускаються.

<Note>
Плагіни походженням із робочого простору, виявлені з кореня extensions робочого простору, не
імпортуються й не виконуються, доки їх явно не ввімкнено. Для локальної розробки
запустіть `openclaw plugins enable <plugin-id>` або задайте
`plugins.entries.<plugin-id>.enabled: true`; якщо ваша конфігурація використовує
`plugins.allow`, додайте туди той самий ідентифікатор плагіна. Це правило відмови за замовчуванням
також застосовується, коли налаштування каналу явно націлюється на плагін походженням із робочого простору для
завантаження лише під час налаштування, тому код налаштування локального плагіна каналу не виконуватиметься, доки цей
плагін робочого простору залишається вимкненим або виключеним зі списку дозволених. Пов’язані встановлення
та явні записи `plugins.load.paths` дотримуються звичайної політики для їхнього
визначеного походження плагіна. Див.
[Налаштування політики плагінів](/uk/tools/plugin#configure-plugin-policy)
і [Довідник конфігурації](/uk/gateway/configuration-reference#plugins).

`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти визначену точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до спільної бази даних стану SQLite в активному каталозі стану OpenClaw. Рядок `installed_plugin_index` зберігає довговічні метадані `installRecords`, зокрема записи для пошкоджених або відсутніх маніфестів плагінів, а також похідний від маніфесту холодний кеш реєстру, який використовують `openclaw plugins update`, видалення, діагностика та холодний реєстр плагінів.

Коли OpenClaw бачить у конфігурації поставлені застарілі записи `plugins.installs`, читання під час виконання трактує їх як сумісний вхід без перезапису `openclaw.json`. Явні записи плагінів і `openclaw doctor --fix` переміщують ці записи до індексу плагінів і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис завершується невдало, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований у корені розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення ідентифікатора плагіна проти npm-специфікації">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Під час `update <id> --dry-run` точні закріплені npm-встановлення залишаються закріпленими. Якщо OpenClaw також може визначити стандартну лінію реєстру пакета, і ця стандартна лінія новіша за встановлену закріплену версію, пробний запуск повідомляє про закріплення й друкує явну команду оновлення пакета `@latest`, щоб перейти на стандартну лінію реєстру.

    Це правило цільового оновлення відрізняється від масового шляху обслуговування `openclaw plugins update --all`. Масові оновлення й далі поважають звичайні відстежувані специфікації встановлення, але записи довірених офіційних плагінів OpenClaw можуть синхронізуватися з поточною ціллю офіційного каталогу замість того, щоб залишатися на застарілому точному офіційному пакеті. Використовуйте цільове `update <id>`, коли навмисно хочете залишити точну або теговану офіційну специфікацію без змін.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за ідентифікатором.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення бета-каналу">
    Цільовий `openclaw plugins update <id-or-npm-spec>` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. Масовий `openclaw plugins update --all` використовує налаштований `update.channel`, коли синхронізує записи довірених офіційних плагінів із ціллю офіційного каталогу, тому встановлення бета-каналу можуть залишатися на бета-лінії випусків замість непомітної нормалізації до stable/latest.

    `openclaw update` також знає активний канал оновлень OpenClaw: на бета-каналі записи npm стандартної лінії та плагінів ClawHub спочатку пробують `@beta`. Вони повертаються до записаної специфікації default/latest, якщо бета-випуску плагіна немає; npm-плагіни також повертаються назад, коли бета-пакет існує, але не проходить перевірку встановлення. Про таке повернення повідомляється як попередження, і воно не перериває оновлення ядра. Точні версії та явні теги залишаються закріпленими на цьому селекторі для цільових оновлень.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже збігаються з визначеною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення відмовляють за замовчуванням, якщо викликач не надасть явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також приймається в `plugins update` для сумісності, але він застарілий і більше не змінює поведінку оновлення плагінів. Операторський `security.installPolicy` усе ще може блокувати оновлення; хуки плагіна `before_install` застосовуються лише в процесах, де хуки плагінів завантажено.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk під час оновлення">
    Оновлення плагінів спільноти, що підтримуються ClawHub, виконують таку саму перевірку довіри до точного випуску, що й встановлення, перед завантаженням пакета заміни. Використовуйте `--acknowledge-clawhub-risk` для перевіреної автоматизації, яка має продовжувати роботу, коли вибраний випуск ClawHub має ризикове попередження довіри. Офіційні пакети ClawHub і вбудовані джерела плагінів OpenClaw обходять цей запит довіри до випуску.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпортування середовища виконання плагіна за замовчуванням. JSON-вивід включає контракти маніфесту плагіна, як-от `contracts.agentToolResultMiddleware` і `contracts.trustedToolPolicies`, щоб оператори могли перевірити декларації довіреної поверхні перед увімкненням або перезапуском плагіна. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, сервіси, методи Gateway і HTTP-маршрути. Перевірка середовища виконання повідомляє про відсутні залежності плагіна напряму; встановлення й ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагінам, зазвичай встановлюються як кореневі групи команд `openclaw`, але плагіни також можуть реєструвати вкладені команди під батьківською командою ядра, наприклад `openclaw nodes`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її за вказаним шляхом; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинно читаний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього набору з колонками форми, видів можливостей, повідомлень про сумісність, можливостей пакета та підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення, повідомлення про сумісність і застарілі посилання конфігурації плагінів, як-от відсутні слоти плагінів. Коли дерево встановлення й конфігурація плагінів чисті, він друкує `No plugin issues detected.` Якщо застаріла конфігурація лишається, але дерево встановлення в іншому справне, підсумок повідомляє саме це, а не натякає на повне здоров’я плагінів.

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис плагіна й повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власність шляху або права на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу й інвентаризація плагінів можуть читати його без імпортування модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях активації під час виконання.

`openclaw doctor --fix` також ремонтує прилеглий до реєстру керований npm-дрейф: якщо осиротілий або відновлений пакет `@openclaw/*` у керованому npm-проєкті плагінів або застарілому плоскому керованому npm-корені затіняє вбудований плагін, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом. Doctor також повторно пов’язує хост-пакет `openclaw` із керованими npm-плагінами, які оголошують `peerDependencies.openclaw`, щоб локальні для пакета імпорти середовища виконання, як-от `openclaw/plugin-sdk/*`, працювали після оновлень або npm-ремонтів.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-шлях призначений лише для аварійного відновлення запуску, поки міграція розгортається.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Список маркетплейса приймає локальний шлях маркетплейса, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела, а також розібраний маніфест маркетплейса й записи Plugin.

Оновлення маркетплейса завантажує розміщену стрічку маркетплейса OpenClaw і зберігає
перевірену відповідь як локальний знімок розміщеної стрічки. Без параметрів воно використовує
налаштований типовий профіль стрічки. Використовуйте `--feed-profile <name>`, щоб оновити
певний налаштований профіль, `--feed-url <url>`, щоб оновити явний URL розміщеної
стрічки, `--expected-sha256 <sha256>`, щоб вимагати відповідної контрольної суми
корисного навантаження (`sha256:<hex>` або простий 64-символьний шістнадцятковий digest), і `--json` для
машиночитного виводу. Явні URL розміщених стрічок не повинні містити
облікові дані, рядки запиту або фрагменти. Оновлення без фіксації може повідомити про
розміщений знімок або результат резервного вбудованого варіанта без невдалого завершення команди. Оновлення
з фіксацією завершується невдало, якщо не приймає свіже розміщене корисне навантаження, а успішні розміщені
оновлення завершуються невдало, якщо OpenClaw не може зберегти перевірений знімок.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [ClawHub](/uk/clawhub)
