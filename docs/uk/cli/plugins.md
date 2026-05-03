---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити помилки завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-03T17:12:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6ae613e39535ea20f9cf3dd451f110ae1b14de4586bdbe3d55d06d8e7cfd2cf
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами хуків і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Швидкі приклади встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Bundles Plugin" href="/uk/plugins/bundles">
    Модель сумісності bundle.
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

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і залишає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані мовленнєві провайдери та вбудований browser plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` з inline JSON Schema (`configSchema`, навіть якщо порожньою). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) плюс виявлені можливості bundle.
</Note>

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
Під час launch cutover голі назви пакетів за замовчуванням встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу pinned-версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugin і виводить
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості plugins. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Пакети plugins
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення та оновлення beta-каналу надають перевагу npm dist-tag `beta`, коли цей tag
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення некоректної конфігурації">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей included file і залишають `openclaw.json` без змін. Root includes, include arrays і includes із sibling overrides завершуються закрито, замість flattening. Див. [Config includes](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час встановлення конфігурація некоректна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і hot reload некоректна конфігурація plugin завершується закрито, як і будь-яка інша некоректна конфігурація; `openclaw doctor --fix` може ізолювати некоректний запис plugin. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення bundled-plugin для plugins, які явно opt into `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакта. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до npm-встановлень. Він не підтримується з `git:` installs; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли вам потрібне pinned-джерело. Він не підтримується з `--marketplace`, оскільки marketplace installs зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацьовувань у вбудованому сканері небезпечного коду. Вона дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить policy blocks хуків `before_install` plugin і **не** обходить збої сканування.

    Цей CLI-прапорець застосовується до потоків install/update plugin. Встановлення залежностей skill за підтримки Gateway використовують відповідний request override `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, заблоковано registry scan, скористайтеся кроками для видавців у [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які expose `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver ranges відхиляються. Встановлення залежностей виконуються project-local з `--ignore-scripts` для безпеки, навіть коли ваша shell має глобальні налаштування npm install.

    Використовуйте `npm:<package>`, коли хочете зробити npm resolution явним. Під час launch cutover голі package specs також встановлюються напряму з npm.

    Bare specs і `@latest` залишаються на stable track. Якщо npm resolve будь-який із них до prerelease, OpenClaw зупиняється й просить вас явно opt in з prerelease tag, наприклад `@beta`/`@rc`, або з точною prerelease-версією, наприклад `@1.2.3-beta.4`.

    Якщо bare install spec збігається з офіційним id plugin (наприклад, `diffs`), OpenClaw встановлює catalog entry напряму. Щоб встановити npm package з такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення напряму з git repository. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні clone URLs `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на branch, tag або commit.

    Git installs клонують у тимчасовий каталог, переходять на запитаний ref, якщо він присутній, а потім використовують звичайний installer каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення package-manager і install records поводяться як npm installs. Записані git installs містять source URL/ref плюс resolved commit, щоб `openclaw plugins update` міг пізніше повторно resolve джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime registrations, як-от gateway methods і CLI commands. Якщо plugin зареєстрував CLI root через `api.registerCli`, виконайте цю команду напряму через root CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у витягнутому root plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише install records.

    Встановлення Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Під час launch cutover голі npm-safe plugin specs за замовчуванням встановлюються з npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only resolution явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошений plugin API / мінімальну сумісність gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує versioned npm-pack `.tgz`, перевіряє ClawHub digest header і artifact digest, а потім встановлює його через звичайний archive path. Старіші версії ClawHub без метаданих ClawPack досі встановлюються через legacy package archive verification path. Записані встановлення зберігають метадані джерела ClawHub, artifact kind, npm integrity, npm shasum, tarball name і факти ClawPack digest для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований recorded spec, щоб `openclaw plugins update` міг слідувати за новішими релізами ClawHub; явні селектори версії або tag, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються pinned до цього селектора.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному registry cache Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати marketplace source:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела Marketplace">
    - назва відомого Marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь Marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого Marketplace">
    Для віддалених Marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію Marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Показати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру й стан встановлення залежностей пакунків.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із резервним варіантом, похідним лише від маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлено, увімкнено та видно для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або hook. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи наявні ці назви пакунків уздовж звичайного шляху пошуку Node `node_modules` для Plugin; він не імпортує runtime-код Plugin, не запускає менеджер пакунків і не виправляє відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакунки й не завантажує runtime-код Plugin. Результати пошуку включають назву пакунка ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin всередині пакетованого Docker-образу змонтуйте вихідний каталог Plugin
поверх відповідного пакетованого вихідного шляху, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване вихідне
накладання перед `/app/dist/extensions/synology-chat`; звичайний скопійований вихідний
каталог залишиться неактивним, тому стандартні пакетовані встановлення й надалі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hook і діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані plugins.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані hook розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язаний точний spec (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований машиною стан, а не користувацька конфігурація. Встановлення й оновлення записують його в `plugins/installs.json` у активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це похідний від маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списків дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли застосовно. Якщо не задано `--keep-files`, видалення також прибирає відстежуваний каталог керованого встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для plugins Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id Plugin порівняно з npm spec">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записаний spec встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні зафіксовані версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явний npm package spec із dist-tag або точною версією. OpenClaw зіставляє цю назву пакунка з відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує новий npm spec для майбутніх оновлень за id.

    Передання назви npm-пакунка без версії або тега також зіставляється з відстежуваним записом Plugin. Використовуйте це, коли Plugin було зафіксовано на точній версії й ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежуваний spec Plugin, якщо ви не передасте новий spec. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub Plugin типової лінії спершу пробують `@beta`, а потім повертаються до записаного default/latest spec, якщо beta-випуску Plugin не існує. Точні версії та явні теги залишаються зафіксованими на цьому селекторі.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакунка за метаданими npm-реєстру. Якщо встановлена версія та записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений integrity hash існує, а hash отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний hashes і просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час оновлень Plugin. Він однаково не обходить блокування політик Plugin `before_install` або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політик, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP, типово не імпортуючи runtime Plugin. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані hook, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності Plugin безпосередньо; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать Plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для provider)
- **hybrid-capability** — кілька типів можливостей (наприклад, text + speech + images)
- **hook-only** — лише hook, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Докладніше про модель можливостей див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього набору з shape, capability kinds, compatibility notices, bundle capabilities і колонками підсумку hook. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він виводить `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена OpenClaw модель холодного читання для ідентичності встановлених Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника provider, класифікація налаштування channel і інвентар Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакунка. Це шлях виправлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях до маркетплейсу, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела, а також розібраний маніфест маркетплейсу й записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
