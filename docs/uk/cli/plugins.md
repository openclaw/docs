---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете діагностувати помилки завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T12:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із встановлення, увімкнення та усунення проблем із плагінами.
  </Card>
  <Card title="Керування плагінами" href="/uk/plugins/manage-plugins">
    Швидкі приклади для встановлення, перегляду списку, оновлення, видалення й публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлень плагінів.
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
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторні операції життєвого циклу плагінів вимкнено. Використовуйте джерело Nix для цього встановлення замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі увімкнено за замовчуванням (наприклад вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) разом із виявленими можливостями бандла.
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
Голі імена пакетів під час запускового переходу за замовчуванням встановлюються з npm. Для ClawHub використовуйте `clawhub:<package>`. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів плагінів і друкує
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Для Skills ClawHub використовуйте `openclaw skills search`.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості плагінів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Належні OpenClaw
пакети Plugin `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентаризацію плагінів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення некоректної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість згортання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація некоректна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження некоректна конфігурація Plugin завершується закрито, як і будь-яка інша некоректна конфігурація; `openclaw doctor --fix` може помістити некоректний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для плагінів, які явно погодилися на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й на місці перезаписує вже встановлений Plugin або пакет хуків. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне посилання git, як-от `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний варіант для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували на ClawHub, блокується скануванням реєстру, скористайтеся кроками для публікатора в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver-діапазони відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install. Керовані npm-корені Plugin успадковують npm `overrides` рівня пакета OpenClaw, тому host security pins застосовуються також до hoisted-залежностей Plugin.

    Використовуйте `npm:<package>`, коли хочете зробити npm resolution явним. Голі package specs також установлюються безпосередньо з npm під час запускового переходу.

    Голі specs і `@latest` залишаються на стабільному треку. Позначені датою корекційні версії OpenClaw, як-от `2026.5.3-1`, є стабільними релізами для цієї перевірки. Якщо npm resolves будь-який із них до prerelease, OpenClaw зупиняється й просить вас явно погодитися через prerelease tag, як-от `@beta`/`@rc`, або точну prerelease version, як-от `@1.2.3-beta.4`.

    Якщо bare install spec збігається з офіційним id Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення включають URL/ref джерела разом із resolved commit, щоб `openclaw plugins update` міг повторно resolve джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви Plugin OpenClaw мають містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий шлях керованого npm-root встановлення, який використовується реєстровими встановленнями,
    включно з перевіркою `package-lock.json`, скануванням hoisted-залежностей і
    записами npm install. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем extensions Plugin.

    Також підтримуються встановлення Claude marketplace.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-safe specs Plugin під час запускового переходу за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only resolution явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошений API плагіна / мінімальну сумісність Gateway перед установленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім установлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються прив’язаними до цього селектора.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли потрібно явно передати джерело маркетплейсу:

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
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддалених маркетплейсів">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці списку/інформації/увімкнення/вимкнення. Сьогодні підтримуються bundle skills, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакета показуються в діагностиці/інформації, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на рядки з деталями для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитувана інвентаризація плюс діагностика реєстру та стан установлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін установлений, увімкнений і видимий для планування холодного запуску, але це не жива перевірка виконання вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не відновлює
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині запакованого образу Docker змонтуйте каталог
джерела плагіна поверх відповідного запакованого шляху джерела, як-от
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване перекриття джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишається неактивним, тому звичайні запаковані встановлення все ще використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу перевірки із завантаженим модулем. Runtime-перевірка ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та стан RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, зберігаючи типову поведінку неприв’язаною.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` у активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довготривалим джерелом метаданих установлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, runtime-читання трактують їх як сумісний вхід без переписування `openclaw.json`. Явні записи плагінів і `openclaw doctor --fix` переміщують ці записи в індекс плагінів і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів allow/deny-списків плагіна та пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також видаляє відстежуваний керований каталог установлення, коли він розташований у корені розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних установлень плагінів у керованому індексі плагінів і відстежуваних установлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання ідентифікатора плагіна проти npm-специфікації">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні прив’язані версії й надалі використовуються під час пізніших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису плагіна, оновлює цей установлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі ідентифікатора.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін був прив’язаний до точної версії, а ви хочете повернути його до типової лінії релізів реєстру.

  </Accordion>
  <Accordion title="Оновлення бета-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на бета-каналі записи плагінів npm і ClawHub типової лінії спочатку пробують `@beta`, а потім повертаються до записаної типової/останньої специфікації, якщо бета-релізу плагіна не існує. Точні версії та явні теги залишаються прив’язаними до цього селектора.

  </Accordion>
  <Accordion title="Перевірки версій і зміщення integrity">
    Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета щодо метаданих реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли збережений integrity-хеш існує, а хеш отриманого артефакту змінюється, OpenClaw трактує це як зміщення npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блоки політики `before_install` плагіна або блокування через помилку сканування, і застосовується лише до оновлень плагінів, а не оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Перевірка показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку сервера MCP або LSP без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, сервіси, методи Gateway і HTTP-маршрути. Runtime-перевірка повідомляє про відсутні залежності плагіна напряму; встановлення й ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

Команди CLI, що належать плагінам, установлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду під `cliCommands`, запустіть її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для постачальника)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами можливостей, повідомленнями про сумісність, можливостями пакета та стовпцями підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований Plugin присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис Plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого Plugin, наприклад право власності на шлях або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена в OpenClaw модель холодного читання для ідентичності встановлених Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника постачальника, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту модулів середовища виконання Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації середовища виконання.

`openclaw doctor --fix` також відновлює керований npm-зсув, суміжний із реєстром: якщо осиротілий або відновлений пакет `@openclaw/*` у корені керованого npm для Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує визначену мітку джерела, а також розібраний маніфест маркетплейсу та записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
