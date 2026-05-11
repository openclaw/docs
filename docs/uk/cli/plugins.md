---
read_when:
    - Ви хочете встановити плагіни Gateway або сумісні пакети чи керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення й усунення несправностей плагінів.
  </Card>
  <Card title="Керування плагінами" href="/uk/plugins/manage-plugins">
    Швидкі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
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

Для розслідування повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і залишає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторі життєвого циклу плагінів вимкнено. Для цього встановлення використовуйте джерело Nix замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) плюс виявлені можливості бандла.
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

Супровідники, які тестують встановлення під час налаштування, можуть перевизначити автоматичні джерела встановлення плагінів
за допомогою захищених змінних середовища. Див.
[Перевизначення встановлення Plugin](/uk/plugins/install-overrides).

<Warning>
Голі назви пакетів під час запускного переходу встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів плагінів і друкує
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості плагінів. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Пакети плагінів
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар плагінів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення з beta-каналу віддають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та виправлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й залишають `openclaw.json` недоторканим. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація плагінів завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може ізолювати недійсний запис плагіна. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого плагіна для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте його, коли ви свідомо повторно встановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й скеровує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне git-посилання, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне зафіксоване джерело. Він не підтримується з `--marketplace`, оскільки встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійний варіант для хибних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хука Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей skills за підтримки Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/clawhub/security).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо у вашій оболонці є глобальні налаштування npm install. Керовані npm-корені плагінів успадковують npm `overrides` рівня пакета OpenClaw, тому безпекові фіксації хоста також застосовуються до піднятих залежностей плагінів.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Голі специфікації пакетів також встановлюються безпосередньо з npm під час запускного переходу.

    Голі specs і `@latest` залишаються на стабільній гілці. Корекційні версії OpenClaw із датованою позначкою, як-от `2026.5.3-1`, є стабільними релізами для цієї перевірки. Якщо npm розв’язує будь-яку з них у передреліз, OpenClaw зупиняється й просить вас явно погодитися за допомогою передрелізного тегу, як-от `@beta`/`@rc`, або точної передрелізної версії, як-от `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним id плагіна (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>`, щоб установити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перемкнутися на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, перемикаються на запитане посилання, якщо воно є, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/посилання джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо плагін зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви Plugin OpenClaw мають містити чинний `openclaw.plugin.json` у корені витягнутого плагіна; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є npm-pack tarball і ви хочете
    протестувати той самий керований шлях встановлення npm-root, який використовують встановлення з реєстру,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами npm install. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем розширень плагінів.

    Встановлення з marketplace Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні specs плагінів під час запускного переходу встановлюються з npm за замовчуванням:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність API плагіна / мінімальну сумісність Gateway перед інсталяцією. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-пакет `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім інсталює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще інсталюються через застарілий шлях перевірки архіву пакета. Записані інсталяції зберігають свої вихідні метадані ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсійні інсталяції ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг стежити за новішими випусками ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються прив’язаними до цього селектора.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете передати джерело marketplace явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях до `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддалених marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети інсталюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Сьогодні підтримуються bundle skills, command-skills Claude, типові значення `settings.json` Claude, типові значення `.lsp.json` Claude / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не під’єднані до виконання під час runtime.
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
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар разом із діагностикою реєстру та станом інсталяції залежностей пакетів.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр плагінів, із запасним варіантом, похідним лише від маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін інстальований, увімкнений і видимий для планування холодного запуску, але це не live runtime-перевірка вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не інсталює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для інсталяції, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині запакованого Docker-образу змонтуйте bind mount каталогу
джерела плагіна поверх відповідного запакованого шляху джерела, як-от
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване
накладання джерела перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишається неактивним, тож звичайні запаковані інсталяції все ще використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не інсталює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки linked-інсталяції повторно використовують шлях джерела замість копіювання поверх керованої цілі інсталяції.

Використовуйте `--pin` для npm-інсталяцій, щоб зберегти розв’язану точну специфікацію (`name@version`) в індексі керованих плагінів, зберігаючи стандартну поведінку без прив’язки.
</Note>

### Індекс плагінів

Метадані інсталяції плагінів — це машинно керований стан, а не користувацька конфігурація. Інсталяції та оновлення записують їх у `plugins/installs.json` під активним каталогом стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих інсталяції, включно із записами для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` — це холодний кеш реєстру, похідний від маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, uninstall, діагностикою і холодним реєстром плагінів.

Коли OpenClaw бачить shipped застарілі записи `plugins.installs` у конфігурації, runtime-читання розглядають їх як сумісний вхід без переписування `openclaw.json`. Явні записи плагінів і `openclaw doctor --fix` переносять ці записи в індекс плагінів і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані інсталяції не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів allow/deny list плагінів і пов’язаних записів `plugins.load.paths`, коли застосовно. Якщо `--keep-files` не встановлено, uninstall також видаляє відстежуваний каталог керованої інсталяції, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних інсталяцій плагінів в індексі керованих плагінів і відстежуваних інсталяцій hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id плагіна і npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію інсталяції для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні прив’язані версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-інсталяцій ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей інстальований плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тегу також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін був прив’язаний до точної версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи плагінів npm і ClawHub зі стандартної лінії спершу пробують `@beta`, а потім повертаються до записаної стандартної/latest специфікації, якщо beta-випуску плагіна не існує. Це повернення повідомляється як попередження і не призводить до збою оновлення ядра. Точні версії та явні теги залишаються прив’язаними до цього селектора.

  </Accordion>
  <Accordion title="Перевірки версії та дрейф цілісності">
    Перед live npm-оновленням OpenClaw перевіряє інстальовану версію пакета за метаданими npm-реєстру. Якщо інстальована версія і записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, повторної інсталяції або переписування `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для false positives вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе ще не обходить блоки політики `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, статус завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані інсталяції, можливості пакета і будь-яку виявлену підтримку сервера MCP або LSP без імпортування runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна та включити зареєстровані хуки, інструменти, команди, служби, методи gateway і HTTP-маршрути. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; інсталяції та виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє плагін, зазвичай інсталюються як кореневі групи команд `openclaw`, але плагіни також можуть реєструвати вкладені команди під основним батьківським елементом, як-от `openclaw nodes`. Після того як `inspect --runtime` покаже команду під `cliCommands`, запустіть її за вказаним шляхом; наприклад, плагін, що реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у розділі [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинно-читний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами можливостей, повідомленнями про сумісність, можливостями пакета та стовпцями зі зведенням хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований Plugin присутній на диску, але заблокований перевірками безпеки шляху в завантажувачі, перевірка конфігурації зберігає запис Plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого Plugin, наприклад володіння шляхом або дозволи на запис для всіх, замість того щоб видаляти конфігурацію `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена модель холодного читання OpenClaw для ідентичності встановлених Plugin, їх увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту модулів середовища виконання Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`openclaw doctor --fix` також виправляє суміжне з реєстром відхилення керованого npm: якщо осиротілий або відновлений пакет `@openclaw/*` у корені npm керованих Plugin затіняє вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях marketplace, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела, а також розібраний маніфест marketplace і записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [ClawHub](/uk/clawhub)
