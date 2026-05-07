---
read_when:
    - Ви хочете встановити або керувати Plugin-ами Gateway чи сумісними бандлами
    - Ви хочете діагностувати помилки завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлень plugins.
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
```

Для дослідження повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторі життєвого циклу plugins вимкнено. Використовуйте джерело Nix для цього встановлення замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте орієнтований на агента [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі увімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо порожньою). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Під час стартового переходу прості імена пакетів за замовчуванням встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugin і виводить
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub Skills.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Належні OpenClaw
пакети plugins `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар plugins](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу віддають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та виправлення недійсної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями закриваються з помилкою замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай закривається з помилкою і повідомляє спершу запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація plugin закривається з помилкою, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може ізолювати недійсний запис plugin. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого plugin для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте це, коли ви навмисно повторно встановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється і спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацювань у вбудованому сканері небезпечного коду. Вона дозволяє встановленню продовжитися навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills з ClawHub.

    Якщо plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (ім'я пакета + необов'язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей запускаються локально в проєкті з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install. Керовані npm-корені plugin успадковують package-level npm `overrides` OpenClaw, тому безпекові закріплення хоста також застосовуються до піднятих залежностей plugin.

    Використовуйте `npm:<package>`, коли хочете зробити розв'язання npm явним. Під час стартового переходу прості специфікації пакетів також встановлюються безпосередньо з npm.

    Прості специфікації та `@latest` залишаються на стабільному треку. Застарілі корекційні версії OpenClaw, наприклад `2026.5.3-1`, усе ще вважаються стабільними випусками для цієї перевірки, щоб старіші пакети продовжували безпечно оновлюватися. Нова робота над щомісячними лініями підтримки планується з використанням звичайних номерів патчів SemVer замість суфіксів корекції через дефіс. Якщо npm розв'язує специфікацію типової лінії до передвипуску, OpenClaw зупиняється і просить явно погодитися через тег передвипуску, наприклад `@beta`/`@rc`, або точну передвипускну версію, наприклад `@1.2.3-beta.4`.

    Якщо проста специфікація встановлення збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перемкнутися на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, перемикаються на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення включають URL/ref джерела та розв'язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв'язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у витягнутому корені plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий керований шлях встановлення npm-root, який використовують реєстрові встановлення,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами npm install. Звичайні шляхи до архівів усе ще встановлюються як локальні архіви
    під коренем plugin extensions.

    Встановлення Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Під час стартового переходу прості npm-safe специфікації plugin за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв'язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлений API плагіна / мінімальну сумісність із Gateway перед установленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім установлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої вихідні метадані ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочений запис marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли потрібно явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого Claude marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочений запис репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакета показуються в діагностиці/info, але ще не підключені до виконання в runtime.
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
  Показати лише ввімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного плагіна з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру й стан установлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін установлено, увімкнено та чи він видимий для планування холодного запуску, але це не live runtime probe вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hook. Для віддалених/container розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного для плагіна шляху пошуку Node `node_modules`; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, родину, канал, версію, короткий опис і
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим плагіном усередині упакованого образу Docker змонтуйте bind-mount каталогу
джерел плагіна поверх відповідного упакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований overlay джерел
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел
залишається неактивним, тож стандартні упаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hook і діагностику з проходу інспекції завантаженого модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки service/process, шлях конфігурації та стан RPC.
- Невбудовані conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, зберігаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його в `plugins/installs.json` у активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є сталим джерелом метаданих установлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, runtime-читання трактують їх як вхідні дані сумісності без переписування `openclaw.json`. Явні записи плагінів і `openclaw doctor --fix` переносять ці записи в індекс плагінів і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів allow/deny list плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, uninstall також видаляє відстежуваний керований каталог установлення, коли він розташований усередині кореня plugin extensions OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна та npm spec">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, такі як `@beta`, і точні закріплені версії продовжують використовуватися під час подальших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює цей установлений плагін і записує нову npm spec для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений за точною версією, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передаєте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub плагінів типової лінії спочатку пробують `@beta`, а потім повертаються до записаної специфікації default/latest, якщо beta-випуск плагіна не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

    OpenClaw ще не надає канали плагінів LTS або monthly support. Запланована робота над лініями підтримки потребуватиме, щоб пакети плагінів і теги ClawHub відповідали тій самій лінії підтримки, що й основний пакет.

  </Accordion>
  <Accordion title="Перевірки версії та drift integrity">
    Перед live npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли збережений integrity hash існує, а hash отриманого артефакту змінюється, OpenClaw трактує це як drift npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікувані й фактичні hash і просить підтвердження перед продовженням. Неінтерактивні помічники оновлення fail closed, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого dangerous-code scan під час оновлень плагінів. Він і надалі не обходить блокування політики plugin `before_install` або блокування через scan-failure, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані hook, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, власником яких є плагін, установлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду під `cliCommands`, запустіть її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип capability (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів capability (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без capabilities або surfaces
- **non-capability** — tools/commands/services, але без capabilities

Докладніше про модель capability див. у [формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами capability, повідомленнями про сумісність, capabilities пакета та стовпцями з підсумком hooks. `info` є псевдонімом для `inspect`.
</Note>

### Діагностика

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику manifest/discovery та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований Plugin присутній на диску, але заблокований перевірками безпеки шляхів у завантажувачі, перевірка конфігурації зберігає запис Plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого Plugin, наприклад власника шляху або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу стислий підсумок форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена модель холодного читання OpenClaw для ідентичності встановлених Plugin, їх увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих manifest/package. Це шлях відновлення, а не шлях runtime-активації.

`openclaw doctor --fix` також виправляє пов’язане з реєстром відхилення керованого npm: якщо осиротілий або відновлений пакет `@openclaw/*` у корені керованого npm для Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; fallback через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json` друкує визначену мітку джерела, а також розібраний manifest marketplace і записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
