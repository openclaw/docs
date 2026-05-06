---
read_when:
    - Ви хочете встановити Plugin для Gateway або сумісні пакети чи керувати ними
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T08:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами хуків і сумісними наборами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення проблем із plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Набори Plugin" href="/uk/plugins/bundles">
    Модель сумісності наборів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення plugins.
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
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні набори натомість використовують власні маніфести наборів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип набору (`codex`, `claude` або `cursor`) плюс виявлені можливості набору.
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
Голі назви пакетів під час перехідного запуску встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugins і виводить
назви пакетів, готові до встановлення. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для ClawHub Skills.

<Note>
ClawHub є основною поверхнею поширення та виявлення для більшості plugins. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети plugins
`@openclaw/*`, що належать OpenClaw, знову публікуються на npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу надають перевагу npm `beta` dist-tag, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та виправлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` незмінним. Кореневі включення, масиви включень і включення із сусідніми перевизначеннями завершуються закрито замість розгортання. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація plugin завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може ізолювати недійсний запис plugin. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого plugin для plugins, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id із нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для вже встановленого id plugin, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне git-посилання, як-от `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійний параметр для хибних спрацювань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політик хуків plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills на базі Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver-діапазони відхиляються. Встановлення залежностей виконуються локально для проєкту з `--ignore-scripts` заради безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Голі specs пакетів також встановлюються безпосередньо з npm під час перехідного запуску.

    Голі specs і `@latest` залишаються на стабільній гілці. Датовані корекційні версії OpenClaw, як-от `2026.5.3-1`, для цієї перевірки є стабільними випусками. Якщо npm розв’язує будь-який із цих варіантів у prerelease, OpenClaw зупиняється й просить явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо голий spec встановлення збігається з офіційним id plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>`, щоб установити напряму з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перемкнутися на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, перемикаються на запитаний ref, якщо він є, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота з встановлення менеджером пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення включають URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у корені розпакованого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий керований шлях встановлення npm-root, який використовують реєстрові встановлення,
    включно з перевіркою `package-lock.json`, скануванням піднятих залежностей і
    записами встановлення npm. Звичайні шляхи архівів усе ще встановлюються як локальні архіви
    під коренем extensions plugin.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні specs plugin під час перехідного запуску встановлюються з npm за замовчуванням:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / мінімальну сумісність gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіонований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела маркетплейсу">
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях до `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонента Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакета показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на детальні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар, а також діагностика реєстру і стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлений плагін, чи він увімкнений і чи видимий для планування холодного запуску, але це не живий зонд часу роботи вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або hooks. Для віддалених/контейнерних розгортань переконайтеся, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує код виконання плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети і не завантажує код виконання плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, зведення та
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим плагіном усередині запакованого образу Docker змонтуйте каталог
джерела плагіна поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване перекриття джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишиться неактивним, тож звичайні запаковані встановлення й надалі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та стан RPC.
- Невбудовані conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою і холодним реєстром плагінів.

Коли OpenClaw бачить відвантажені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також вилучає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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
  <Accordion title="Розв’язання id плагіна проти специфікації npm">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час пізніших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію пакета npm із dist-tag або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису плагіна, оновлює цей встановлений плагін і записує нову специфікацію npm для майбутніх оновлень за id.

    Передавання назви пакета npm без версії або тега також розв’язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін був закріплений на точній версії і ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub плагінів типової лінії спочатку пробують `@beta`, а потім повертаються до записаної специфікації default/latest, якщо beta-випуск плагіна не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета щодо метаданих реєстру npm. Якщо встановлена версія і записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли існує збережений integrity hash і hash отриманого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний hashes та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються із забороною, якщо виклик не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політик, діагностику, метадані встановлення, можливості пакета і будь-яку виявлену підтримку серверів MCP або LSP без типового імпорту коду виконання плагіна. Додайте `--runtime`, щоб завантажити модуль плагіна і включити зареєстровані hooks, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція напряму повідомляє про відсутні залежності плагіна; встановлення та виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать плагіну, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Дивіться [Форми плагінів](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і аудиту. `inspect --all` рендерить таблицю для всього парку з колонками форми, видів можливостей, повідомлень про сумісність, можливостей пакета і зведення hooks. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, валідація конфігурації зберігає запис плагіна і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власника шляху або дозволи world-writable, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена модель холодного читання OpenClaw для ідентичності встановлених плагінів, їх увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналів та інвентаризація плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`openclaw doctor --fix` також виправляє пов’язане з реєстром відхилення керованих npm: якщо осиротілий або відновлений пакет `@openclaw/*` під коренем npm керованих плагінів затіняє вбудований плагін, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейса приймає локальний шлях до маркетплейса, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json` виводить розпізнану мітку джерела, а також розібраний маніфест маркетплейса й записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
